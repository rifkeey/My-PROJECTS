/* e-Istrom — Expenses, payroll and cash book */
(function () {
  const esc = U.esc, icon = UI.icon;

  /* ============ Expenses ============ */
  Biz.registerApproval('expense', {
    link: a => '/expenses?open=' + a.refId,
    onApproved: a => { const e = DB.get('expenses', a.refId); if (e && e.status === 'pending') DB.update('expenses', e.id, { status: 'approved' }); },
    onRejected: a => { const e = DB.get('expenses', a.refId); if (e) DB.update('expenses', e.id, { status: 'rejected' }); }
  });

  async function editExpense(e) {
    const lim = Biz.limits();
    const v = await UI.form({
      title: e ? 'Edit expense' : 'Record an expense',
      intro: e ? '' : 'Spending of ' + U.money(lim.expenseFrom) + ' or more goes to the MD for approval' + ' (and to the Chairman from ' + U.moneyShort(lim.chairmanFrom) + ').',
      values: e || { date: U.today() },
      fields: [
        { name: 'description', label: 'What was it for?', required: true },
        { name: 'category', label: 'Category', type: 'select', options: Biz.EXPENSE_CATEGORIES, required: true, half: true },
        { name: 'amount', label: 'Amount', type: 'money', required: true, half: true },
        { name: 'vendorId', label: 'Paid to (vendor)', type: 'select', options: Biz.vendorOptions, half: true, placeholder: 'Not a listed vendor' },
        { name: 'projectId', label: 'Project (if any)', type: 'select', options: () => Biz.projectOptions(), half: true, placeholder: 'Head office / general' },
        { name: 'date', label: 'Date', type: 'date', required: true, half: true },
        { name: 'invoiceRef', label: 'Invoice / reference', half: true },
        { name: 'paidNow', label: 'This has already been paid', type: 'checkbox', show: v => !e && v.amount < lim.expenseFrom },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
      ],
      validate: v => !(v.amount > 0) ? 'Please enter the amount.' : null
    });
    if (!v) return;
    if (e) {
      if (e.status !== 'pending' && v.amount !== e.amount && Biz.needsApproval('expense', v.amount)) return UI.toast('This expense is already approved. Record a new one for the difference.', 'red');
      DB.update('expenses', e.id, v); DB.log('Edited expense ' + e.number); App.refresh(); return;
    }
    const paidNow = v.paidNow; delete v.paidNow;
    const rec = Biz.createExpense(v);
    if (paidNow && rec.status === 'approved') DB.update('expenses', rec.id, { status: 'paid', paidDate: v.date, method: 'Bank transfer' });
    UI.toast(rec.status === 'pending' ? 'Sent to the MD for approval' : 'Expense recorded');
    App.refresh();
  }

  async function markPaid(e) {
    const v = await UI.form({
      title: 'Mark as paid', size: 'sm', values: { paidDate: U.today(), method: 'Bank transfer' },
      intro: esc(e.description) + ' — <b>' + U.money(e.amount) + '</b>',
      fields: [
        { name: 'paidDate', label: 'Date paid', type: 'date', required: true, half: true },
        { name: 'method', label: 'Method', type: 'select', options: Biz.PAY_METHODS, placeholder: false, half: true },
        { name: 'payRef', label: 'Bank reference' }
      ]
    });
    if (!v) return;
    DB.update('expenses', e.id, Object.assign(v, { status: 'paid', paidBy: Auth.user.id }));
    DB.log('Paid expense ' + e.number + ' — ' + U.money(e.amount));
    UI.toast('Marked as paid');
    App.refresh();
  }

  function openExpense(id) {
    const e = DB.get('expenses', id);
    if (!e) return;
    const a = e.approvalId && DB.get('approvals', e.approvalId);
    const canManage = Auth.can('finance.manage');
    UI.modal({
      title: e.description, size: 'md',
      body: UI.kv([
        ['Number', esc(e.number)], ['Status', UI.badge(Biz.expenseLabel(e))], ['Amount', '<b>' + U.money(e.amount) + '</b>'], ['Category', esc(e.category)],
        ['Vendor', e.vendorId ? esc(Biz.vendorName(e.vendorId)) : ''], ['Project', e.projectId ? esc(Biz.projectName(e.projectId)) : 'Head office'],
        ['Date', U.date(e.date)], ['Invoice ref', esc(e.invoiceRef)], ['Recorded by', esc(Biz.staffName(e.createdBy))],
        e.status === 'paid' ? ['Paid', U.date(e.paidDate) + ' · ' + esc(e.method || '') + (e.payRef ? ' · ' + esc(e.payRef) : '')] : null,
        a ? ['Approval', Approvals.stepsHtml(a)] : null,
        ['Notes', esc(e.notes)]
      ]),
      foot: canManage ? ((e.status !== 'paid' ? '<button class="btn btn-ghost-danger" data-maction="del">Delete</button>' : '') + '<span class="spacer"></span>' +
        (e.status !== 'paid' && e.status !== 'rejected' ? '<button class="btn" data-maction="edit">Edit</button>' : '') +
        (e.status === 'approved' ? '<button class="btn btn-primary" data-maction="paid">' + icon('check', 15) + 'Mark paid</button>' : '')) : '',
      actions: {
        edit: (x, close) => { close(); editExpense(e); },
        paid: (x, close) => { close(); markPaid(e); },
        del: async (x, close) => {
          if (!(await UI.confirm('Delete expense ' + e.number + '?', { danger: true, ok: 'Delete' }))) return;
          close(); DB.remove('expenses', e.id);
          if (a && a.status === 'pending') DB.update('approvals', a.id, { status: 'rejected', steps: a.steps.map(s => s.status === 'pending' ? Object.assign(s, { status: 'rejected', note: 'Expense deleted' }) : s) });
          DB.log('Deleted expense ' + e.number); App.refresh();
        }
      }
    });
  }
  window.openExpense = openExpense;

  App.route('/expenses', 'finance.view', (p, q) => {
    const all = DB.all('expenses');
    const today = U.today(), month = today.slice(0, 7), year = today.slice(0, 4);
    const paid = all.filter(e => e.status === 'paid');
    const pm = paid.filter(e => (e.paidDate || e.date).startsWith(month));
    const py = paid.filter(e => (e.paidDate || e.date).startsWith(year));
    const pending = all.filter(e => e.status === 'pending');
    const toPay = all.filter(e => e.status === 'approved');
    const byCat = U.groupBy(py, e => e.category);
    const cats = Object.keys(byCat).map(k => ({ label: k, value: U.sum(byCat[k], e => e.amount) })).sort((a, b) => b.value - a.value).slice(0, 7);

    return {
      title: 'Expenses',
      html: UI.header('Expenses', 'All company spending, with approvals', Auth.can('finance.manage') ? UI.btn('Record expense', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        '<div class="stats">' +
          UI.stat('Spent this month', U.moneyShort(U.sum(pm, e => e.amount)), U.plural(pm.length, 'payment')) +
          UI.stat('Spent this year', U.moneyShort(U.sum(py, e => e.amount)), U.plural(py.length, 'payment')) +
          UI.stat('Awaiting approval', U.moneyShort(U.sum(pending, e => e.amount)), U.plural(pending.length, 'expense'), { tone: pending.length ? 'amber' : '' }) +
          UI.stat('Approved, not yet paid', U.moneyShort(U.sum(toPay, e => e.amount)), U.plural(toPay.length, 'expense')) +
        '</div>' +
        '<div class="grid g-main"><div>' + UI.table({
          id: 'exp', rows: U.sortBy(all, e => e.date + e.number, true), noun: 'expense', rowAction: 'open', search: e => e.number + ' ' + e.description + ' ' + (e.vendorId ? Biz.vendorName(e.vendorId) : ''),
          filters: [
            { key: 'st', label: 'Any status', options: ['Pending approval', 'Approved', 'Paid', 'Rejected'], value: e => Biz.expenseLabel(e) },
            { key: 'c', label: 'Any category', options: Biz.EXPENSE_CATEGORIES, value: e => e.category },
            { key: 'pr', label: 'Any project', options: Biz.projectOptions(p => p.status !== 'Completed'), value: e => e.projectId || '' },
            { key: 'm', label: 'Any month', options: U.lastMonths(12).reverse().map(m => [m, U.monthLabel(m, true)]), value: e => e.date.slice(0, 7) }
          ],
          toolbar: UI.btn('Export', 'export', { icon: 'download', small: true, kind: 'ghost' }),
          columns: [
            { label: 'Date', html: e => U.date(e.date), sort: e => e.date },
            { label: 'Description', html: e => '<div class="cell-main">' + esc(e.description) + '</div><div class="cell-sub">' + esc(e.category) + (e.vendorId ? ' · ' + esc(Biz.vendorName(e.vendorId)) : '') + '</div>', sort: e => e.description },
            { label: 'Amount', cls: 'num', html: e => U.money(e.amount), sort: e => e.amount },
            { label: 'Status', html: e => { const a = e.approvalId && DB.get('approvals', e.approvalId); return UI.badge(e.status === 'pending' && a ? Biz.approvalLabel(a) : Biz.expenseLabel(e)); }, sort: e => e.status }
          ],
          empty: UI.empty('No expenses yet', '', '', 'wallet')
        }) + '</div>' +
        '<div class="stack">' + UI.card('This year by category', cats.length ? UI.hbars(cats) : UI.empty('Nothing yet', '')) +
          (pending.length ? UI.card('Waiting for approval', '<div class="list">' + pending.map(e => { const a = DB.get('approvals', e.approvalId); return '<div class="list-item" data-action="open" data-id="' + e.id + '" style="cursor:pointer"><div class="grow"><div class="t">' + esc(e.description) + '</div><div class="s">' + U.money(e.amount) + ' · ' + (a ? Biz.approvalLabel(a) : '') + '</div></div></div>'; }).join('') + '</div>') : '') +
        '</div></div>',
      actions: {
        add: () => editExpense(),
        open: id => openExpense(id),
        export: () => U.download('expenses-' + today + '.csv', U.csv(U.sortBy(all, e => e.date, true), [
          { label: 'Number', value: e => e.number }, { label: 'Date', value: e => e.date }, { label: 'Description', value: e => e.description }, { label: 'Category', value: e => e.category },
          { label: 'Vendor', value: e => e.vendorId ? Biz.vendorName(e.vendorId) : '' }, { label: 'Project', value: e => e.projectId ? Biz.projectName(e.projectId) : '' },
          { label: 'Amount', value: e => e.amount }, { label: 'Status', value: e => Biz.expenseLabel(e) }, { label: 'Paid on', value: e => e.paidDate || '' }]), 'text/csv')
      },
      mount: () => { if (q.open) openExpense(q.open); if (q.new && Auth.can('finance.manage')) { history.replaceState(null, '', '#/expenses'); editExpense(); } }
    };
  });

  /* ============ Payroll ============ */
  Biz.registerApproval('payroll', {
    link: a => '/payroll/' + a.refId,
    onApproved: a => { const r = DB.get('payroll', a.refId); if (r) DB.update('payroll', r.id, { status: 'approved' }); },
    onRejected: a => { const r = DB.get('payroll', a.refId); if (r) DB.update('payroll', r.id, { status: 'draft', rejectedNote: (a.steps.find(s => s.status === 'rejected') || {}).note }); }
  });
  const runLabel = r => ({ draft: 'Draft', pending: 'Pending approval', approved: 'Approved', paid: 'Paid' }[r.status]);
  const runTotals = r => ({
    gross: U.sum(r.lines, l => l.basic + l.housing + l.transport + l.other),
    pension: U.sum(r.lines, l => l.pension), tax: U.sum(r.lines, l => l.tax), net: U.sum(r.lines, l => l.net)
  });

  App.route('/payroll', 'payroll.view', () => {
    const runs = U.sortBy(DB.all('payroll'), r => r.month, true);
    const thisMonth = U.today().slice(0, 7);
    const has = runs.find(r => r.month === thisMonth);
    const staff = DB.filter('staff', s => s.status !== 'Left' && s.salary);
    const monthly = U.sum(staff, s => { const x = s.salary; return x.basic + x.housing + x.transport + x.other; });
    return {
      title: 'Payroll',
      html: UI.header('Payroll', 'Monthly salaries: HR prepares, the MD approves, Accounts pays',
        Auth.can('payroll.manage') && !has ? UI.btn('Prepare ' + U.monthLabel(thisMonth, true), 'prepare', { icon: 'plus', kind: 'primary' }) : '') +
        '<div class="stats">' + UI.stat('Staff on payroll', U.num(staff.length), 'active staff with a salary') + UI.stat('Monthly gross', U.moneyShort(monthly), 'before deductions') +
        UI.stat('Paid this year', U.moneyShort(U.sum(runs.filter(r => r.status === 'paid' && r.month.startsWith(thisMonth.slice(0, 4))), r => runTotals(r).net)), 'net salaries') + '</div>' +
        UI.table({
          rows: runs, noun: 'payroll', rowAction: 'open',
          columns: [
            { label: 'Month', html: r => '<span class="cell-main">' + U.monthLabel(r.month, true) + '</span><div class="cell-sub">' + esc(r.number || '') + '</div>' },
            { label: 'Staff', cls: 'c', html: r => r.lines.length },
            { label: 'Gross', cls: 'num', html: r => U.money(runTotals(r).gross) },
            { label: 'Net pay', cls: 'num', html: r => '<b>' + U.money(runTotals(r).net) + '</b>' },
            { label: 'Status', html: r => UI.badge(runLabel(r)) },
            { label: 'Paid on', html: r => r.paidDate ? U.date(r.paidDate) : '<span class="muted">—</span>' }
          ],
          empty: UI.empty('No payroll yet', 'Prepare this month’s payroll to get started.', '', 'cash')
        }),
      actions: {
        open: id => App.go('/payroll/' + id),
        prepare: () => {
          const lines = DB.filter('staff', s => s.status !== 'Left' && s.salary).map(Seed.payLine);
          const r = DB.insert('payroll', { number: DB.nextNumber('PAY'), month: thisMonth, lines, status: 'draft', preparedBy: Auth.user.id });
          DB.log('Prepared payroll for ' + U.monthLabel(thisMonth, true));
          App.go('/payroll/' + r.id);
        }
      }
    };
  });

  App.route('/payroll/:id', 'payroll.view', params => {
    const r = DB.get('payroll', params.id);
    if (!r) return { html: UI.empty('Not found', '') };
    const t = runTotals(r);
    const a = r.approvalId && DB.get('approvals', r.approvalId);
    const editable = r.status === 'draft' && Auth.can('payroll.manage');
    const actions = [];
    actions.push(UI.btn('Bank schedule', 'bank', { icon: 'download' }));
    if (editable) actions.push(UI.btn('Send to MD for approval', 'submit', { icon: 'stamp', kind: 'primary' }));
    if (r.status === 'approved' && Auth.canAny('finance.manage') && Auth.can('payroll.manage')) actions.push(UI.btn('Mark as paid', 'pay', { icon: 'check', kind: 'primary' }));
    return {
      title: 'Payroll ' + U.monthLabel(r.month, true),
      html: UI.header('Payroll — ' + U.monthLabel(r.month, true), esc(r.number || '') + ' · ' + UI.badge(runLabel(r)) + ' · prepared by ' + esc(Biz.staffName(r.preparedBy)), actions.join(''), ['/payroll', 'Payroll']) +
        (r.rejectedNote ? '<div class="callout red">' + icon('alert', 17) + '<div><b>Sent back by the MD:</b> ' + esc(r.rejectedNote) + '</div></div>' : '') +
        (a && r.status === 'pending' ? '<div class="callout">' + icon('stamp', 17) + '<div>' + Approvals.stepsHtml(a) + '</div></div>' : '') +
        '<div class="stats">' + UI.stat('Gross pay', U.money(t.gross)) + UI.stat('Pension (8%)', U.money(t.pension)) + UI.stat('PAYE tax', U.money(t.tax)) + UI.stat('Net pay', U.money(t.net), U.plural(r.lines.length, 'staff member')) + '</div>' +
        UI.table({
          id: 'pl', rows: r.lines.map(l => Object.assign({ id: l.staffId }, l)), noun: 'staff member', rowAction: editable ? 'line' : null, search: l => Biz.staffName(l.staffId),
          columns: [
            { label: 'Staff', html: l => { const s = DB.get('staff', l.staffId) || {}; return '<span class="cell-main">' + esc(s.name) + '</span><div class="cell-sub">' + esc(s.title || '') + '</div>'; }, sort: l => Biz.staffName(l.staffId) },
            { label: 'Basic', cls: 'num', html: l => U.money(l.basic) },
            { label: 'Allowances', cls: 'num', html: l => U.money(l.housing + l.transport + l.other) },
            { label: 'Pension', cls: 'num', html: l => U.money(l.pension) },
            { label: 'Tax', cls: 'num', html: l => U.money(l.tax) },
            { label: 'Other ded.', cls: 'num', html: l => U.money(l.deductions) },
            { label: 'Net pay', cls: 'num', html: l => '<b>' + U.money(l.net) + '</b>', sort: l => l.net },
            { label: '', cls: 'r', html: l => UI.btn('', 'slip', { small: true, kind: 'ghost', icon: 'print', data: { id: l.staffId }, title: 'Payslip' }) }
          ]
        }),
      actions: {
        slip: (id, el) => Docs.payslip(r.id, el.dataset.id),
        line: async id => {
          const l = r.lines.find(x => x.staffId === id);
          const v = await UI.form({
            title: Biz.staffName(id) + ' — ' + U.monthLabel(r.month), size: 'sm', values: l,
            fields: [
              { name: 'basic', label: 'Basic', type: 'money', half: true }, { name: 'housing', label: 'Housing', type: 'money', half: true },
              { name: 'transport', label: 'Transport', type: 'money', half: true }, { name: 'other', label: 'Other allowances / overtime', type: 'money', half: true },
              { name: 'tax', label: 'PAYE tax', type: 'money', half: true }, { name: 'deductions', label: 'Other deductions (loans, lateness)', type: 'money', half: true }
            ]
          });
          if (!v) return;
          v.pension = Math.round((v.basic + v.housing + v.transport) * 0.08);
          v.net = v.basic + v.housing + v.transport + v.other - v.pension - v.tax - v.deductions;
          Object.assign(l, v);
          DB.update('payroll', r.id, { lines: r.lines });
          App.refresh();
        },
        submit: () => {
          const ap = Biz.request({ type: 'payroll', refId: r.id, title: 'Payroll for ' + U.monthLabel(r.month, true) + ' (' + r.lines.length + ' staff)', amount: t.net, details: 'Gross ' + U.money(t.gross) + ', net ' + U.money(t.net) + '.' });
          DB.update('payroll', r.id, { status: ap.status === 'approved' ? 'approved' : 'pending', approvalId: ap.id, rejectedNote: '' });
          UI.toast('Sent for approval'); App.refresh();
        },
        pay: async () => {
          const v = await UI.form({ title: 'Mark payroll as paid', size: 'sm', values: { paidDate: U.today() }, fields: [{ name: 'paidDate', label: 'Date paid', type: 'date', required: true }] });
          if (!v) return;
          DB.update('payroll', r.id, { status: 'paid', paidDate: v.paidDate, paidBy: Auth.user.id });
          DB.log('Paid salaries for ' + U.monthLabel(r.month, true) + ' — ' + U.money(t.net));
          App.refresh();
        },
        bank: () => U.download('salary-schedule-' + r.month + '.csv', U.csv(r.lines, [
          { label: 'Staff no', value: l => (DB.get('staff', l.staffId) || {}).staffNo }, { label: 'Name', value: l => Biz.staffName(l.staffId) },
          { label: 'Bank', value: l => (DB.get('staff', l.staffId) || {}).bank }, { label: 'Account number', value: l => (DB.get('staff', l.staffId) || {}).accountNo },
          { label: 'Net pay', value: l => l.net }]), 'text/csv')
      }
    };
  });

  /* ============ Cash book ============ */
  App.route('/cashbook', 'finance.view', (p, q) => {
    const entries = Biz.cashEntries();
    const months = U.lastMonths(12);
    const sel = q.m || U.today().slice(0, 7);
    const by = U.groupBy(entries, e => String(e.date).slice(0, 7));
    const data = months.map(m => ({ label: U.monthLabel(m).slice(0, 3), value: U.sum((by[m] || []).filter(e => e.kind === 'in'), e => e.amount), value2: U.sum((by[m] || []).filter(e => e.kind === 'out'), e => e.amount) }));
    const cur = by[sel] || [];
    const inn = U.sum(cur.filter(e => e.kind === 'in'), e => e.amount), out = U.sum(cur.filter(e => e.kind === 'out'), e => e.amount);
    const outCats = U.groupBy(cur.filter(e => e.kind === 'out'), e => e.cat);
    const inCats = U.groupBy(cur.filter(e => e.kind === 'in'), e => e.cat);
    const year = U.today().slice(0, 4);
    const ytd = entries.filter(e => String(e.date).startsWith(year));
    const yIn = U.sum(ytd.filter(e => e.kind === 'in'), e => e.amount), yOut = U.sum(ytd.filter(e => e.kind === 'out'), e => e.amount);

    return {
      title: 'Cash book',
      html: UI.header('Cash book', 'Money in and out of the company, month by month',
        '<select class="filter" data-change="month">' + months.slice().reverse().map(m => '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + U.monthLabel(m, true) + '</option>').join('') + '</select>' +
        UI.btn('Export', 'export', { icon: 'download' })) +
        '<div class="stats">' + UI.stat('Money in · ' + U.monthLabel(sel), U.moneyShort(inn), U.plural(cur.filter(e => e.kind === 'in').length, 'entry', 'entries')) +
          UI.stat('Money out · ' + U.monthLabel(sel), U.moneyShort(out), U.plural(cur.filter(e => e.kind === 'out').length, 'entry', 'entries')) +
          UI.stat('Net for the month', U.moneyShort(inn - out), inn - out >= 0 ? 'more came in than went out' : 'more went out than came in', { tone: inn - out >= 0 ? 'green' : 'red' }) +
          UI.stat('Net this year', U.moneyShort(yIn - yOut), U.moneyShort(yIn) + ' in · ' + U.moneyShort(yOut) + ' out') + '</div>' +
        UI.card('Last 12 months', UI.bars(data, { legend: ['Money in', 'Money out'] })) +
        '<div class="grid g2 mt">' + UI.card('Where money came from', Object.keys(inCats).length ? UI.hbars(Object.keys(inCats).map(k => ({ label: k, value: U.sum(inCats[k], e => e.amount) })).sort((a, b) => b.value - a.value)) : UI.empty('Nothing this month', '')) +
          UI.card('Where money went', Object.keys(outCats).length ? UI.hbars(Object.keys(outCats).map(k => ({ label: k, value: U.sum(outCats[k], e => e.amount) })).sort((a, b) => b.value - a.value)) : UI.empty('Nothing this month', '')) + '</div>' +
        '<div class="mt">' + UI.card('Entries — ' + U.monthLabel(sel, true), UI.table({
          id: 'cb', rows: cur, noun: 'entry', search: e => e.what + ' ' + (e.ref || '') + ' ' + e.cat,
          filters: [{ key: 'k', label: 'In and out', options: [['in', 'Money in'], ['out', 'Money out']], value: e => e.kind }],
          columns: [
            { label: 'Date', html: e => U.date(e.date), sort: e => e.date },
            { label: 'Details', html: e => '<span class="cell-main">' + esc(e.what) + '</span><div class="cell-sub">' + esc(e.cat) + (e.ref ? ' · ' + esc(e.ref) : '') + '</div>' },
            { label: 'In', cls: 'num', html: e => e.kind === 'in' ? '<span class="tone-green">' + U.money(e.amount) + '</span>' : '', sort: e => e.kind === 'in' ? e.amount : 0 },
            { label: 'Out', cls: 'num', html: e => e.kind === 'out' ? U.money(e.amount) : '', sort: e => e.kind === 'out' ? e.amount : 0 }
          ],
          empty: UI.empty('No entries this month', '')
        }), { flush: true }) + '</div>',
      actions: {
        month: v => App.go('/cashbook?m=' + v),
        export: () => U.download('cashbook-' + sel + '.csv', U.csv(cur, [{ label: 'Date', value: e => e.date }, { label: 'Details', value: e => e.what }, { label: 'Category', value: e => e.cat }, { label: 'Reference', value: e => e.ref }, { label: 'In', value: e => e.kind === 'in' ? e.amount : '' }, { label: 'Out', value: e => e.kind === 'out' ? e.amount : '' }]), 'text/csv')
      }
    };
  });

  window.FinanceUI = { editExpense, markPaid };
})();
