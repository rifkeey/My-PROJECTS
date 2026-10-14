/* e-Istrom — business rules shared by every module */
(function () {

  const Biz = {
    /* ---------- Look-ups ---------- */
    staffName(id) { const s = DB.get('staff', id); return s ? s.name : '—'; },
    clientName(id) { const c = DB.get('clients', id); return c ? c.name : '—'; },
    projectName(id) { const p = DB.get('projects', id); return p ? p.name : '—'; },
    vendorName(id) { const v = DB.get('vendors', id); return v ? v.name : '—'; },
    unitLabel(u) { if (typeof u === 'string') u = DB.get('units', u); return u ? u.code : '—'; },
    unitFull(u) {
      if (typeof u === 'string') u = DB.get('units', u);
      if (!u) return '—';
      return u.type + ', ' + u.code + ' — ' + Biz.projectName(u.projectId);
    },

    activeStaff() { return U.sortBy(DB.filter('staff', s => s.status !== 'Left'), s => s.name); },
    staffOptions() { return Biz.activeStaff().map(s => [s.id, s.name + ' · ' + (s.title || '')]); },
    projectOptions(filter) { return U.sortBy(DB.filter('projects', filter || (() => true)), p => p.name).map(p => [p.id, p.name]); },
    clientOptions() { return U.sortBy(DB.all('clients'), c => c.name).map(c => [c.id, c.name + (c.phone ? ' · ' + c.phone : '')]); },
    vendorOptions() { return U.sortBy(DB.all('vendors'), v => v.name).map(v => [v.id, v.name]); },

    DEPARTMENTS: ['Management', 'Sales & Marketing', 'Finance & Accounts', 'Legal', 'Human Resources', 'Projects & Construction', 'Facility Management', 'Admin & IT', 'Stores', 'Front Office', 'Transport'],
    PAY_METHODS: ['Bank transfer', 'POS', 'Cheque', 'Online payment'],
    LEAD_SOURCES: ['Walk-in', 'Phone call', 'Website', 'Instagram', 'Facebook', 'X (Twitter)', 'WhatsApp', 'Referral', 'Agent', 'Billboard', 'Event'],
    LEAD_STAGES: ['New', 'Contacted', 'Inspection booked', 'Negotiating', 'Won', 'Lost'],
    EXPENSE_CATEGORIES: ['Building materials', 'Contractor payment', 'Professional fees', 'Fuel & vehicles', 'Office supplies', 'Utilities & power', 'Marketing & adverts', 'Facility maintenance', 'Government fees & levies', 'Staff welfare', 'Travel', 'Equipment', 'Other'],

    /* ---------- Sales & payment plans ---------- */
    buildSchedule({ price, plan, depositPct, months, startDate }) {
      price = Math.round(Number(price) || 0);
      startDate = startDate || U.today();
      if (plan !== 'instalment' || !months) return [{ due: startDate, amount: price, label: 'Full payment' }];
      const deposit = Math.round(price * (Number(depositPct) || 0) / 100);
      const rest = price - deposit;
      const each = Math.floor(rest / months);
      const out = [];
      if (deposit) out.push({ due: startDate, amount: deposit, label: 'Initial deposit (' + depositPct + '%)' });
      for (let i = 1; i <= months; i++) {
        out.push({ due: U.addMonths(startDate, i), amount: i === months ? rest - each * (months - 1) : each, label: 'Instalment ' + i + ' of ' + months });
      }
      return out;
    },

    salePayments(saleId) { return U.sortBy(DB.filter('payments', p => p.saleId === saleId), p => p.date); },

    saleStats(sale) {
      const pays = Biz.salePayments(sale.id);
      const paid = U.sum(pays, p => p.amount);
      const today = U.today();
      const price = sale.price || 0;
      const sched = sale.schedule || [];
      const dueToDate = U.sum(sched.filter(s => s.due < today), s => s.amount);
      const overdue = sale.status === 'active' ? Math.max(0, Math.min(dueToDate, price) - paid) : 0;
      let cum = 0, next = null;
      for (const s of sched) {
        cum += s.amount;
        if (cum > paid + 0.5) { next = { due: s.due, amount: Math.min(s.amount, cum - paid), label: s.label }; break; }
      }
      const balance = Math.max(0, price - paid);
      let status = 'On track';
      if (sale.status === 'cancelled') status = 'Cancelled';
      else if (sale.status === 'pending') status = 'Pending approval';
      else if (balance <= 0.5) status = 'Fully paid';
      else if (overdue > 0.5) status = 'Overdue';
      const daysLate = overdue > 0 && next ? Math.max(0, U.daysBetween(next.due, today)) : 0;
      return { paid, balance, dueToDate, overdue, next, status, pct: U.pct(paid, price), daysLate, payments: pays };
    },

    liveSales() { return DB.filter('sales', s => s.status !== 'cancelled'); },

    // Sales the signed-in person may see (sales executives see their own)
    visibleSales() {
      let s = DB.all('sales');
      if (Auth.user.role === 'sales') s = s.filter(x => x.salesPersonId === Auth.user.id);
      return s;
    },

    clientStats(clientId) {
      const sales = DB.filter('sales', s => s.clientId === clientId && s.status !== 'cancelled');
      const st = sales.map(Biz.saleStats);
      return {
        sales,
        value: U.sum(sales, s => s.price),
        paid: U.sum(st, x => x.paid),
        balance: U.sum(st, x => x.balance),
        overdue: U.sum(st, x => x.overdue)
      };
    },

    /* ---------- Approvals ---------- */
    handlers: {},
    registerApproval(type, h) { Biz.handlers[type] = h; },

    TYPE_LABELS: { discount: 'Discount', refund: 'Refund', expense: 'Expense', purchase: 'Purchase request', payroll: 'Payroll', price: 'Price change' },

    limits() {
      return {
        expenseFrom: DB.setting('expenseApprovalFrom', 250000),
        chairmanFrom: DB.setting('chairmanApprovalFrom', 50000000)
      };
    },

    needsApproval(type, amount) {
      if (type === 'expense' || type === 'purchase') return amount >= Biz.limits().expenseFrom;
      return true;
    },

    request({ type, refId, title, amount, details }) {
      const lim = Biz.limits();
      const levels = ['md'];
      if (amount >= lim.chairmanFrom) levels.push('chairman');
      const me = Auth.user;
      const steps = levels.map(level => ({ level, status: 'pending' }));
      // A Managing Director's own request does not need their own sign-off
      if (me && Auth.can('approvals.md') && steps[0].level === 'md') {
        Object.assign(steps[0], { status: 'approved', by: me.id, at: Date.now(), note: 'Requested by approver' });
      }
      const a = DB.insert('approvals', {
        number: DB.nextNumber('APR'), type, refId, title, amount: amount || 0, details: details || '',
        requestedBy: me ? me.id : null, steps, status: 'pending'
      });
      Biz._advance(a);
      DB.log('Requested approval: ' + title, { approvals: a.id });
      return a;
    },

    currentStep(a) { return (a.steps || []).find(s => s.status === 'pending'); },

    approvalLabel(a) {
      if (a.status === 'approved') return 'Approved';
      if (a.status === 'rejected') return 'Rejected';
      const s = Biz.currentStep(a);
      return s ? (s.level === 'chairman' ? 'Awaiting Chairman' : 'Awaiting MD') : 'Pending';
    },

    canActOn(a) {
      if (a.status !== 'pending') return false;
      const s = Biz.currentStep(a);
      if (!s) return false;
      if (a.requestedBy === Auth.user.id && s.level === 'md' && !Auth.can('approvals.md')) return false;
      return Auth.can(s.level === 'chairman' ? 'approvals.chairman' : 'approvals.md');
    },

    pendingForMe() { return DB.filter('approvals', a => Biz.canActOn(a)); },

    act(id, decision, note) {
      const a = DB.get('approvals', id);
      const s = Biz.currentStep(a);
      if (!a || !s) return;
      Object.assign(s, { status: decision, by: Auth.user.id, at: Date.now(), note: note || '' });
      if (decision === 'rejected') a.status = 'rejected';
      DB.update('approvals', a.id, { steps: a.steps, status: a.status });
      DB.log((decision === 'approved' ? 'Approved: ' : 'Rejected: ') + a.title, { approvals: a.id });
      Biz._advance(a);
    },

    _advance(a) {
      const h = Biz.handlers[a.type] || {};
      if (a.status === 'rejected') { if (h.onRejected) h.onRejected(a); return; }
      if (a.steps.every(s => s.status === 'approved')) {
        DB.update('approvals', a.id, { status: 'approved', closedAt: Date.now() });
        if (h.onApproved) h.onApproved(a);
      }
    },

    approvalLink(a) { const h = Biz.handlers[a.type]; return h && h.link ? h.link(a) : null; },

    /* ---------- Expenses (all company spending goes through here) ---------- */
    createExpense(data) {
      const e = DB.insert('expenses', Object.assign({
        number: DB.nextNumber('EXP'), date: U.today(), status: 'approved'
      }, data));
      if (Biz.needsApproval('expense', e.amount) && !data.preApproved) {
        e.status = 'pending';
        const a = Biz.request({ type: 'expense', refId: e.id, title: e.description + ' (' + e.category + ')', amount: e.amount, details: e.vendorId ? 'Vendor: ' + Biz.vendorName(e.vendorId) : '' });
        DB.update('expenses', e.id, { status: a.status === 'approved' ? 'approved' : 'pending', approvalId: a.id });
      }
      DB.log('Recorded expense ' + e.number + ' — ' + U.money(e.amount), { expenses: e.id });
      return e;
    },

    expenseLabel(e) {
      return { pending: 'Pending approval', approved: 'Approved', paid: 'Paid', rejected: 'Rejected' }[e.status] || e.status;
    },

    /* ---------- Stores ---------- */
    stock(itemId) {
      return U.sum(DB.filter('movements', m => m.itemId === itemId), m => m.kind === 'out' ? -m.qty : m.qty);
    },

    stockLabel(item) {
      const s = Biz.stock(item.id);
      if (s <= 0) return 'Out of stock';
      if (s <= (item.reorderLevel || 0)) return 'Low stock';
      return 'In stock';
    },

    /* ---------- Money in / out for the cash book ---------- */
    cashEntries() {
      const out = [];
      DB.all('payments').forEach(p => out.push({ date: p.date, kind: p.amount < 0 ? 'out' : 'in', amount: Math.abs(p.amount), what: (p.amount < 0 ? 'Refund to ' : 'Payment from ') + Biz.clientName(p.clientId), cat: p.amount < 0 ? 'Client refunds' : 'Client payments', ref: p.receiptNo }));
      DB.all('bills').forEach(b => (b.payments || []).forEach(p => out.push({ date: p.date, kind: 'in', amount: p.amount, what: 'Service charge — ' + Biz.unitLabel(b.unitId), cat: 'Service charges', ref: b.number })));
      DB.filter('expenses', e => e.status === 'paid').forEach(e => out.push({ date: e.paidDate || e.date, kind: 'out', amount: e.amount, what: e.description, cat: e.category, ref: e.number }));
      DB.filter('payroll', r => r.status === 'paid').forEach(r => out.push({ date: r.paidDate, kind: 'out', amount: U.sum(r.lines, l => l.net), what: 'Salaries — ' + U.monthLabel(r.month, true), cat: 'Salaries', ref: r.number }));
      return U.sortBy(out, x => x.date, true);
    },

    /* ---------- Vehicles ---------- */
    PAPERS: [['insurance', 'Insurance'], ['roadworthiness', 'Roadworthiness'], ['licence', 'Vehicle licence'], ['hackney', 'Hackney permit']],
    papersDue(v, withinDays) {
      const today = U.today(), out = [];
      Biz.PAPERS.forEach(([k, label]) => {
        const d = v.papers && v.papers[k];
        if (!d) return;
        const days = U.daysBetween(today, d);
        if (days <= (withinDays || 30)) out.push({ label, date: d, days });
      });
      return out;
    }
  };

  window.Biz = Biz;
})();
