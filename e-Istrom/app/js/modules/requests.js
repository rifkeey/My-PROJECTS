/* e-Istrom — Approvals, purchase requests and vendors */
(function () {
  const esc = U.esc, icon = UI.icon;

  /* ============ Approvals ============ */
  const Approvals = {
    stepsHtml(a) {
      return '<div class="steps">' + a.steps.map((s, i) => {
        const who = s.level === 'chairman' ? 'Chairman' : 'MD';
        const ic = s.status === 'approved' ? 'checkCircle' : s.status === 'rejected' ? 'x' : 'clock';
        const txt = s.status === 'approved' ? who + ' approved' : s.status === 'rejected' ? who + ' rejected' : 'Waiting for ' + who;
        return (i ? '<span class="muted">›</span>' : '') + '<span class="step ' + s.status + '" title="' + esc(s.by ? Biz.staffName(s.by) + ' · ' + U.dateTime(s.at) + (s.note ? ' · ' + s.note : '') : '') + '">' + icon(ic, 14) + txt + '</span>';
      }).join('') + '</div>';
    }
  };
  window.Approvals = Approvals;

  function card(a, canAct) {
    const link = Biz.approvalLink(a);
    const note = a.steps.filter(s => s.note).map(s => '<div class="cell-sub">' + (s.level === 'chairman' ? 'Chairman' : 'MD') + ': “' + esc(s.note) + '”</div>').join('');
    return '<div class="card mb"><div class="card-body" style="padding:18px 20px">' +
      '<div class="split" style="align-items:flex-start"><div style="min-width:0"><div class="row" style="margin-bottom:6px">' + UI.badge(Biz.TYPE_LABELS[a.type] || a.type, 'accent') + UI.badge(Biz.approvalLabel(a)) +
      (a.amount >= Biz.limits().chairmanFrom ? UI.badge('Chairman', 'accent') : '') + '</div>' +
      '<h3 style="margin:0 0 4px;font-size:16px">' + esc(a.title) + '</h3>' +
      '<div class="cell-sub">' + esc(a.number) + ' · requested by ' + esc(Biz.staffName(a.requestedBy)) + ' · ' + U.ago(a.createdAt) + '</div>' +
      (a.details ? '<p style="margin:10px 0 0;color:var(--ink-2)">' + esc(a.details) + '</p>' : '') + '</div>' +
      '<div class="r"><div class="big-num" style="font-size:24px">' + U.money(a.amount) + '</div></div></div>' +
      '<div class="split mt"><div>' + Approvals.stepsHtml(a) + note + '</div><div class="row">' +
      (link ? '<a class="btn btn-sm btn-ghost" href="#' + link + '">View details</a>' : '') +
      (canAct ? UI.btn('Reject', 'reject', { small: true, data: { id: a.id } }) + UI.btn('Approve', 'approve', { small: true, kind: 'good', icon: 'check', data: { id: a.id } }) : '') +
      '</div></div></div></div>';
  }

  App.route('/approvals', null, (p, q) => {
    const approver = Auth.canAny('approvals.md', 'approvals.chairman');
    const tab = q.tab || (approver ? 'waiting' : 'mine');
    const waiting = U.sortBy(Biz.pendingForMe(), a => a.createdAt);
    const mine = U.sortBy(DB.filter('approvals', a => a.requestedBy === Auth.user.id), a => a.createdAt, true);
    const decided = U.sortBy(DB.filter('approvals', a => a.status !== 'pending'), a => a.closedAt || a.updatedAt || a.createdAt, true).slice(0, 60);
    const allPending = U.sortBy(DB.filter('approvals', a => a.status === 'pending'), a => a.createdAt);

    let body = '';
    if (tab === 'waiting') body = waiting.length ? waiting.map(a => card(a, true)).join('') : UI.empty('Nothing waiting for you', 'When someone asks for approval, it will appear here.', '', 'checkCircle');
    if (tab === 'pending') body = allPending.length ? allPending.map(a => card(a, Biz.canActOn(a))).join('') : UI.empty('Nothing pending', '', '', 'checkCircle');
    if (tab === 'mine') body = mine.length ? mine.map(a => card(a, false)).join('') : UI.empty('You haven’t asked for any approvals', 'Discounts, refunds, expenses, purchase requests and payroll go through here.', '', 'stamp');
    if (tab === 'history') body = UI.table({
      rows: decided, noun: 'decision', search: a => a.title + ' ' + a.number,
      filters: [{ key: 't', label: 'Any type', options: Object.entries(Biz.TYPE_LABELS), value: a => a.type }, { key: 's', label: 'Any result', options: ['Approved', 'Rejected'], value: a => Biz.approvalLabel(a) }],
      columns: [
        { label: 'Request', html: a => '<span class="cell-main">' + esc(a.title) + '</span><div class="cell-sub">' + esc(a.number) + ' · ' + esc(Biz.TYPE_LABELS[a.type] || a.type) + ' · ' + esc(Biz.staffName(a.requestedBy)) + '</div>' },
        { label: 'Amount', cls: 'num', html: a => U.money(a.amount), sort: a => a.amount },
        { label: 'Result', html: a => UI.badge(Biz.approvalLabel(a)) + Approvals.stepsHtml(a).replace('class="steps"', 'class="steps cell-sub"') },
        { label: 'Decided', html: a => U.date(a.closedAt || a.updatedAt), sort: a => a.closedAt || a.updatedAt }
      ],
      empty: UI.empty('No decisions yet', '')
    });

    const tabs = [];
    if (approver) tabs.push(['waiting', 'Waiting for me (' + waiting.length + ')', '#/approvals?tab=waiting']);
    if (approver) tabs.push(['pending', 'All pending (' + allPending.length + ')', '#/approvals?tab=pending']);
    tabs.push(['mine', 'My requests', '#/approvals?tab=mine']);
    if (approver || Auth.can('finance.view')) tabs.push(['history', 'History', '#/approvals?tab=history']);

    const lim = Biz.limits();
    return {
      title: 'Approvals',
      html: UI.header('Approvals', 'Expenses and purchases from ' + U.moneyShort(lim.expenseFrom) + ', and every discount, refund and payroll, need the MD. From ' + U.moneyShort(lim.chairmanFrom) + ' the Chairman signs off too.') +
        UI.tabs(tabs, tab) + body,
      actions: {
        approve: async (id) => {
          const a = DB.get('approvals', id);
          const v = await UI.form({ title: 'Approve', size: 'sm', intro: esc(a.title) + ' — <b>' + U.money(a.amount) + '</b>' + (a.steps.filter(s => s.status === 'pending').length > 1 ? '<br><span class="muted">After you approve, it goes to the Chairman.</span>' : ''), fields: [{ name: 'note', label: 'Comment (optional)', type: 'textarea', rows: 2 }], submit: 'Approve' });
          if (!v) return;
          Biz.act(id, 'approved', v.note);
          UI.toast('Approved'); App.refresh();
        },
        reject: async (id) => {
          const a = DB.get('approvals', id);
          const v = await UI.form({ title: 'Reject', size: 'sm', intro: esc(a.title), fields: [{ name: 'note', label: 'Reason', type: 'textarea', rows: 2, required: true, hint: 'The person who asked will see this.' }], submit: 'Reject' });
          if (!v) return;
          Biz.act(id, 'rejected', v.note);
          UI.toast('Rejected'); App.refresh();
        }
      },
      mount: () => {
        if (tab === 'mine') mine.filter(a => a.status !== 'pending' && !a.seenByRequester).forEach(a => DB.update('approvals', a.id, { seenByRequester: true }));
      }
    };
  });

  /* ============ Purchase requests ============ */
  const PR_LABEL = { pending: 'Pending approval', approved: 'Approved', ordered: 'Ordered', received: 'Received', paid: 'Paid', rejected: 'Rejected' };

  Biz.registerApproval('purchase', {
    link: a => '/purchases?open=' + a.refId,
    onApproved: a => { const p = DB.get('purchases', a.refId); if (p && p.status === 'pending') DB.update('purchases', p.id, { status: 'approved' }); },
    onRejected: a => { const p = DB.get('purchases', a.refId); if (p) DB.update('purchases', p.id, { status: 'rejected' }); }
  });

  async function newPurchase() {
    const fields = [
      { name: 'title', label: 'What do you need?', required: true, placeholder: 'e.g. Water pump for Jabi 3 site' },
      { name: 'projectId', label: 'For project', type: 'select', options: () => Biz.projectOptions(), half: true, placeholder: 'Head office / general' },
      { name: 'vendorId', label: 'Suggested vendor', type: 'select', options: Biz.vendorOptions, half: true, placeholder: 'Not sure' },
      { type: 'section', label: 'Items' }
    ];
    for (let i = 1; i <= 5; i++) {
      fields.push({ name: 'd' + i, label: i === 1 ? 'Item' : '', span: 4, required: i === 1, placeholder: i === 1 ? 'Description' : 'Another item (optional)' });
      fields.push({ name: 'q' + i, label: i === 1 ? 'Qty' : '', type: 'number', span1: true, span: 1, min: 0 });
      fields.push({ name: 'c' + i, label: i === 1 ? 'Unit cost' : '', type: 'money', span: 1 });
    }
    fields.push({ type: 'note', name: 'total', html: v => {
      let t = 0; for (let i = 1; i <= 5; i++) t += (Number(v['q' + i]) || 0) * (Number(v['c' + i]) || 0);
      return t ? 'Total: <b>' + U.money(t) + '</b>' + (Biz.needsApproval('purchase', t) ? ' · needs MD approval' + (t >= Biz.limits().chairmanFrom ? ' and Chairman approval' : '') : ' · below the approval limit') : '';
    } });
    fields.push({ name: 'reason', label: 'Why is it needed?', type: 'textarea', rows: 2 });
    const v = await UI.form({ title: 'New purchase request', size: 'lg', values: { q1: 1 }, fields });
    if (!v) return;
    const items = [];
    for (let i = 1; i <= 5; i++) if (v['d' + i]) items.push({ desc: v['d' + i], qty: Number(v['q' + i]) || 1, unitCost: Number(v['c' + i]) || 0 });
    const amount = U.sum(items, i => i.qty * i.unitCost);
    const pr = DB.insert('purchases', { number: DB.nextNumber('PR'), title: v.title, items, amount, projectId: v.projectId || null, vendorId: v.vendorId || null, reason: v.reason, requestedBy: Auth.user.id, status: 'approved' });
    if (Biz.needsApproval('purchase', amount)) {
      const a = Biz.request({ type: 'purchase', refId: pr.id, title: v.title, amount, details: v.reason });
      DB.update('purchases', pr.id, { status: a.status === 'approved' ? 'approved' : 'pending', approvalId: a.id });
    }
    DB.log('Raised purchase request ' + pr.number + ' — ' + U.money(amount));
    UI.toast(pr.status === 'pending' ? 'Sent for approval' : 'Request approved (below the approval limit)');
    App.refresh();
  }

  function openPurchase(id) {
    const p = DB.get('purchases', id);
    if (!p) return;
    const a = p.approvalId && DB.get('approvals', p.approvalId);
    const canProcure = Auth.canAny('finance.manage', 'settings.manage', 'approvals.md');
    const canReceive = p.requestedBy === Auth.user.id || Auth.canAny('inventory.manage', 'projects.manage', 'finance.manage');
    const foot = [];
    if (['approved', 'ordered', 'received', 'paid'].includes(p.status) && canProcure) foot.push('<button class="btn" data-maction="lpo">' + icon('print', 15) + (p.poNo ? 'Reprint LPO' : 'Issue LPO') + '</button>');
    if (['approved', 'ordered'].includes(p.status) && canReceive) foot.push('<button class="btn" data-maction="received">' + icon('box', 15) + 'Mark received</button>');
    if (['approved', 'ordered', 'received'].includes(p.status) && Auth.can('finance.manage')) foot.push('<button class="btn btn-primary" data-maction="pay">' + icon('cash', 15) + 'Record payment</button>');
    UI.modal({
      title: p.title, size: 'md',
      body: '<div class="row mb">' + UI.badge(PR_LABEL[p.status]) + '<span class="muted">' + esc(p.number) + (p.poNo ? ' · LPO ' + esc(p.poNo) : '') + '</span></div>' +
        '<table class="tbl-plain"><tr><th>Item</th><th class="num">Qty</th><th class="num">Unit cost</th><th class="num">Amount</th></tr>' +
        (p.items || []).map(i => '<tr><td>' + esc(i.desc) + '</td><td class="num">' + U.num(i.qty) + '</td><td class="num">' + U.money(i.unitCost) + '</td><td class="num">' + U.money(i.qty * i.unitCost) + '</td></tr>').join('') +
        '<tr><td colspan="3"><b>Total</b></td><td class="num"><b>' + U.money(p.amount) + '</b></td></tr></table><div class="hr"></div>' +
        UI.kv([['Requested by', esc(Biz.staffName(p.requestedBy)) + ' · ' + U.date(p.createdAt)], ['Project', p.projectId ? esc(Biz.projectName(p.projectId)) : 'Head office'], ['Vendor', p.vendorId ? esc(Biz.vendorName(p.vendorId)) : ''], ['Why', esc(p.reason)],
          a ? ['Approval', Approvals.stepsHtml(a)] : ['Approval', 'Below the approval limit'], p.receivedAt ? ['Received', U.date(p.receivedAt) + ' by ' + esc(Biz.staffName(p.receivedBy))] : null]),
      foot: foot.join(''),
      actions: {
        lpo: (x, close) => {
          if (!p.vendorId) { close(); return UI.toast('Choose a vendor first (edit the request).', 'red'); }
          Docs.purchaseOrder(p.id); close(); setTimeout(App.refresh, 400);
        },
        received: async (x, close) => {
          close();
          const v = await UI.form({ title: 'Mark as received', size: 'sm', values: { addToStore: Auth.can('inventory.manage') }, fields: [
            { name: 'note', label: 'Notes (condition, shortfalls)', type: 'textarea', rows: 2 },
            { name: 'addToStore', label: 'Add these items to the stores', type: 'checkbox', show: () => Auth.can('inventory.manage') },
            { name: 'itemId', label: 'Which store item?', type: 'select', options: () => DB.all('items').map(i => [i.id, i.name + ' · ' + i.location]), show: v => v.addToStore, placeholder: 'Choose…' }
          ] });
          if (!v) return;
          DB.update('purchases', p.id, { status: 'received', receivedAt: Date.now(), receivedBy: Auth.user.id, receiveNote: v.note });
          if (v.addToStore && v.itemId) DB.insert('movements', { itemId: v.itemId, kind: 'in', qty: U.sum(p.items, i => i.qty), date: U.today(), staffId: Auth.user.id, vendorId: p.vendorId, note: 'From ' + p.number });
          DB.log('Received goods for ' + p.number); App.refresh();
        },
        pay: async (x, close) => {
          close();
          const v = await UI.form({ title: 'Record payment', size: 'sm', values: { date: U.today(), method: 'Bank transfer' }, intro: 'Pay <b>' + U.money(p.amount) + '</b> to ' + esc(p.vendorId ? Biz.vendorName(p.vendorId) : 'the vendor') + '. This is added to Expenses as paid.', fields: [
            { name: 'date', label: 'Date paid', type: 'date', required: true, half: true }, { name: 'method', label: 'Method', type: 'select', options: Biz.PAY_METHODS, placeholder: false, half: true },
            { name: 'category', label: 'Expense category', type: 'select', options: Biz.EXPENSE_CATEGORIES, required: true }
          ] });
          if (!v) return;
          const e = Biz.createExpense({ description: p.title + ' (' + p.number + ')', category: v.category, amount: p.amount, vendorId: p.vendorId, projectId: p.projectId, date: v.date, preApproved: true, purchaseId: p.id });
          DB.update('expenses', e.id, { status: 'paid', paidDate: v.date, method: v.method, approvalId: p.approvalId || null });
          DB.update('purchases', p.id, { status: 'paid', expenseId: e.id });
          App.refresh();
        }
      }
    });
  }

  App.route('/purchases', null, (p, q) => {
    const all = Auth.canAny('purchases.view', 'finance.view', 'approvals.md', 'approvals.chairman');
    const rows = U.sortBy(DB.filter('purchases', x => all || x.requestedBy === Auth.user.id), x => x.createdAt, true);
    return {
      title: 'Purchase requests',
      html: UI.header('Purchase requests', all ? 'Requests for materials, equipment and supplies' : 'Things you’ve asked the company to buy', UI.btn('New request', 'add', { icon: 'plus', kind: 'primary' })) +
        UI.table({
          id: 'pr', rows, noun: 'request', rowAction: 'open', search: x => x.number + ' ' + x.title + ' ' + Biz.staffName(x.requestedBy),
          filters: [{ key: 's', label: 'Any status', options: Object.entries(PR_LABEL), value: x => x.status }, { key: 'pr', label: 'Any project', options: Biz.projectOptions(), value: x => x.projectId || '' }],
          columns: [
            { label: 'Request', html: x => '<span class="cell-main">' + esc(x.title) + '</span><div class="cell-sub">' + esc(x.number) + ' · ' + U.date(x.createdAt) + '</div>', sort: x => x.createdAt },
            { label: 'For', html: x => x.projectId ? esc(Biz.projectName(x.projectId)) : '<span class="muted">Head office</span>' },
            all ? { label: 'By', html: x => esc(Biz.staffName(x.requestedBy)) } : null,
            { label: 'Amount', cls: 'num', html: x => U.money(x.amount), sort: x => x.amount },
            { label: 'Status', html: x => { const a = x.approvalId && DB.get('approvals', x.approvalId); return UI.badge(x.status === 'pending' && a ? Biz.approvalLabel(a) : PR_LABEL[x.status]); } }
          ].filter(Boolean),
          empty: UI.empty('No purchase requests', 'Need something bought? Raise a request and it goes for approval.', '', 'clipboard')
        }),
      actions: { add: () => newPurchase(), open: id => openPurchase(id) },
      mount: () => { if (q.open) openPurchase(q.open); }
    };
  });

  /* ============ Vendors ============ */
  async function editVendor(v0) {
    const v = await UI.form({
      title: v0 ? 'Edit vendor' : 'New vendor', values: v0 || { rating: 4 },
      fields: [
        { name: 'name', label: 'Business name', required: true, half: true },
        { name: 'category', label: 'What they supply', type: 'select', options: ['Building materials', 'Roofing', 'Electrical', 'Plumbing', 'Finishes', 'Contractor', 'Consultant', 'Landscaping', 'Security', 'Cleaning', 'Fuel', 'Office supplies', 'Vehicle repairs', 'Other'], half: true, required: true },
        { name: 'contact', label: 'Contact person', half: true },
        { name: 'phone', label: 'Phone', type: 'tel', half: true },
        { name: 'email', label: 'Email', type: 'email', half: true },
        { name: 'address', label: 'Address', half: true },
        { name: 'bank', label: 'Bank', third: true },
        { name: 'accountNo', label: 'Account number', third: true },
        { name: 'rating', label: 'Rating', type: 'select', options: [[5, '★★★★★ Excellent'], [4, '★★★★ Good'], [3, '★★★ OK'], [2, '★★ Poor'], [1, '★ Avoid']], third: true, placeholder: false },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
      ]
    });
    if (!v) return;
    v.rating = Number(v.rating);
    if (v0) DB.update('vendors', v0.id, v); else DB.insert('vendors', v);
    DB.log((v0 ? 'Edited' : 'Added') + ' vendor ' + v.name);
    App.refresh();
  }

  App.route('/vendors', ['vendors.manage', 'finance.view', 'purchases.view'], () => {
    const money = Auth.can('finance.view');
    const paidBy = U.groupBy(DB.filter('expenses', e => e.status === 'paid' && e.vendorId), e => e.vendorId);
    const rows = DB.all('vendors').map(v => Object.assign({ _paid: U.sum(paidBy[v.id] || [], e => e.amount) }, v));
    return {
      title: 'Vendors',
      html: UI.header('Vendors & contractors', U.plural(rows.length, 'vendor'), Auth.can('vendors.manage') ? UI.btn('New vendor', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        UI.table({
          id: 'vn', rows: U.sortBy(rows, v => v.name), noun: 'vendor', rowAction: Auth.can('vendors.manage') ? 'open' : null, search: v => v.name + ' ' + v.category + ' ' + (v.contact || ''),
          filters: [{ key: 'c', label: 'Any category', options: [...new Set(rows.map(r => r.category))].sort(), value: v => v.category }],
          columns: [
            { label: 'Vendor', html: v => '<span class="cell-main">' + esc(v.name) + '</span><div class="cell-sub">' + esc(v.address || '') + '</div>', sort: v => v.name },
            { label: 'Supplies', html: v => esc(v.category), sort: v => v.category },
            { label: 'Contact', html: v => esc(v.contact || '') + '<div class="cell-sub">' + esc(v.phone || '') + '</div>' },
            { label: 'Rating', html: v => '<span style="color:var(--sand);letter-spacing:1px">' + '★'.repeat(v.rating || 0) + '</span><span style="color:var(--line)">' + '★'.repeat(5 - (v.rating || 0)) + '</span>', sort: v => v.rating },
            money ? { label: 'Paid to date', cls: 'num', html: v => v._paid ? U.money(v._paid) : '<span class="muted">—</span>', sort: v => v._paid } : null
          ].filter(Boolean),
          empty: UI.empty('No vendors yet', '', '', 'hammer')
        }),
      actions: { add: () => editVendor(), open: id => editVendor(DB.get('vendors', id)) }
    };
  });
})();
