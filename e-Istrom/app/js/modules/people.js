/* e-Istrom — Staff, leave, memos, visitors and documents register */
(function () {
  const esc = U.esc, icon = UI.icon;

  /* ============ Staff ============ */
  function leaveTaken(staffId, year) {
    return U.sum(DB.filter('leave', l => l.staffId === staffId && l.status === 'Approved' && l.type === 'Annual' && (l.from || '').startsWith(year)), l => l.days);
  }

  async function editStaff(s) {
    const pay = Auth.can('payroll.view');
    const sal = (s && s.salary) || {};
    const v = await UI.form({
      title: s ? 'Edit staff record' : 'Add staff member', size: 'lg',
      values: Object.assign({ status: 'Active', startDate: U.today(), leaveDays: DB.setting('annualLeaveDays', 20) }, s || {}, { basic: sal.basic, housing: sal.housing, transport: sal.transport, other: sal.other }),
      fields: [
        { name: 'name', label: 'Full name', required: true, half: true },
        { name: 'title', label: 'Job title', required: true, half: true },
        { name: 'department', label: 'Department', type: 'select', options: Biz.DEPARTMENTS, required: true, half: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Active', 'On leave', 'Suspended', 'Left'], placeholder: false, half: true },
        { name: 'phone', label: 'Phone', type: 'tel', half: true },
        { name: 'email', label: 'Email', type: 'email', half: true },
        { name: 'startDate', label: 'Start date', type: 'date', third: true },
        { name: 'leaveDays', label: 'Annual leave days', type: 'number', min: 0, third: true },
        { name: 'dob', label: 'Date of birth', type: 'date', third: true },
        { name: 'address', label: 'Home address' },
        { name: 'nextOfKin', label: 'Next of kin', half: true },
        { name: 'nextOfKinPhone', label: 'Next of kin phone', type: 'tel', half: true },
        ...(pay ? [
          { type: 'section', label: 'Monthly pay (only HR, Accounts and management can see this)' },
          { name: 'basic', label: 'Basic', type: 'money', third: true }, { name: 'housing', label: 'Housing', type: 'money', third: true }, { name: 'transport', label: 'Transport', type: 'money', third: true },
          { name: 'other', label: 'Other allowances', type: 'money', third: true }, { name: 'tax', label: 'Monthly PAYE tax', type: 'money', third: true }, { name: 'otherDeductions', label: 'Other monthly deductions', type: 'money', third: true },
          { name: 'bank', label: 'Bank', half: true }, { name: 'accountNo', label: 'Account number', half: true }
        ] : [])
      ]
    });
    if (!v) return;
    const rec = Object.assign({}, v);
    if (pay) {
      rec.salary = (v.basic || v.housing || v.transport || v.other) ? { basic: v.basic || 0, housing: v.housing || 0, transport: v.transport || 0, other: v.other || 0 } : null;
      ['basic', 'housing', 'transport', 'other'].forEach(k => delete rec[k]);
    } else {
      ['basic', 'housing', 'transport', 'other'].forEach(k => delete rec[k]);
    }
    if (s) {
      DB.update('staff', s.id, rec);
      if (rec.status === 'Left' && s.canLogin) DB.update('staff', s.id, { canLogin: false });
      DB.log('Updated staff record: ' + rec.name);
      App.refresh();
    } else {
      const n = Math.max(0, ...DB.all('staff').map(x => Number(String(x.staffNo || '').replace(/\D/g, '')) || 0)) + 1;
      const ns = DB.insert('staff', Object.assign(rec, { staffNo: 'IST-' + U.pad(n, 3), role: 'none', canLogin: false }));
      DB.log('Added staff member ' + rec.name);
      App.go('/staff/' + ns.id);
    }
  }

  async function editAccess(s) {
    const v = await UI.form({
      title: 'Sign-in access — ' + s.name, size: 'md',
      values: { canLogin: s.canLogin !== false && !!s.loginEmail, loginEmail: s.loginEmail || s.email || '', role: s.role === 'none' ? '' : s.role },
      intro: 'Choose whether ' + esc(s.name.split(' ')[0]) + ' can sign in, and what their role allows.',
      fields: [
        { name: 'canLogin', label: 'Can sign in to e-Istrom', type: 'checkbox' },
        { name: 'loginEmail', label: 'Sign-in email', type: 'email', show: v => v.canLogin, required: true },
        { name: 'role', label: 'Role', type: 'select', options: Object.entries(Auth.ROLES).map(([k, r]) => [k, r.label]), show: v => v.canLogin, required: true },
        { type: 'note', name: 'roleInfo', html: v => { const r = Auth.ROLES[v.role]; return r && v.canLogin ? '<b>' + esc(r.label) + ':</b> ' + esc(r.summary) + '<br><span class="muted">' + esc(r.cannot) + '</span>' : ''; } },
        { name: 'password', label: s.passHash ? 'New password (leave blank to keep)' : 'Temporary password', type: 'text', show: v => v.canLogin, hint: 'Share it privately. They can change it after signing in.' }
      ],
      validate: v => {
        if (!v.canLogin) return;
        const e = v.loginEmail.toLowerCase();
        if (DB.find('staff', x => x.id !== s.id && (x.loginEmail || '').toLowerCase() === e && x.canLogin)) return 'Someone else already signs in with that email.';
        if (!s.passHash && !v.password) return 'Please set a temporary password.';
        if (v.password && v.password.length < 8) return 'Passwords need at least 8 characters.';
        if (s.id === Auth.user.id && v.role !== s.role && !Auth.rolePerms(v.role).includes('settings.manage')) return 'You can’t remove your own access to Settings.';
      }
    });
    if (!v) return;
    DB.update('staff', s.id, { canLogin: v.canLogin, loginEmail: v.canLogin ? v.loginEmail.toLowerCase() : s.loginEmail, role: v.canLogin ? v.role : s.role });
    if (v.canLogin && v.password) await Auth.setPassword(DB.get('staff', s.id), v.password);
    DB.log('Changed sign-in access for ' + s.name + (v.canLogin ? ' (' + Auth.roleLabel(v.role) + ')' : ' (switched off)'));
    UI.toast('Access updated');
    App.refresh();
  }
  window.PeopleUI = { editAccess };

  App.route('/staff', null, () => {
    const manage = Auth.can('staff.manage');
    const rows = U.sortBy(DB.filter('staff', s => manage || s.status !== 'Left'), s => s.name);
    const today = U.today();
    const onLeave = new Set(DB.filter('leave', l => l.status === 'Approved' && l.from <= today && l.to >= today).map(l => l.staffId));
    return {
      title: 'Staff',
      html: UI.header('Staff', U.plural(rows.filter(s => s.status !== 'Left').length, 'person', 'people') + ' across ' + U.plural(new Set(rows.map(r => r.department)).size, 'department'), manage ? UI.btn('Add staff', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        UI.table({
          id: 'st', rows, noun: 'person', rowAction: 'open', search: s => s.name + ' ' + s.title + ' ' + s.department + ' ' + (s.phone || ''),
          filters: [{ key: 'd', label: 'Any department', options: Biz.DEPARTMENTS, value: s => s.department }].concat(manage ? [{ key: 's', label: 'Any status', options: ['Active', 'On leave', 'Suspended', 'Left'], value: s => onLeave.has(s.id) ? 'On leave' : s.status }] : []),
          columns: [
            { label: 'Name', html: s => '<div class="who">' + UI.avatar(s.name) + '<span><span class="cell-main">' + esc(s.name) + '</span><span class="cell-sub">' + esc(s.title || '') + '</span></span></div>', sort: s => s.name },
            { label: 'Department', html: s => esc(s.department), sort: s => s.department },
            { label: 'Phone', html: s => s.phone ? '<a href="tel:' + esc(s.phone) + '">' + esc(s.phone) + '</a>' : '' },
            { label: 'Email', html: s => s.email ? '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a>' : '' },
            { label: '', html: s => onLeave.has(s.id) ? UI.badge('On leave') : s.status !== 'Active' ? UI.badge(s.status) : '' }
          ]
        }),
      actions: { add: () => editStaff(), open: id => App.go('/staff/' + id) }
    };
  });

  App.route('/staff/:id', null, params => {
    const s = DB.get('staff', params.id);
    if (!s) return { html: UI.empty('Not found', '') };
    const me = s.id === Auth.user.id;
    const pay = Auth.can('payroll.view') || me;
    const year = U.today().slice(0, 4);
    const taken = leaveTaken(s.id, year);
    const leaves = U.sortBy(DB.filter('leave', l => l.staffId === s.id), l => l.from, true);
    const sal = s.salary;
    const gross = sal ? sal.basic + sal.housing + sal.transport + sal.other : 0;
    const actions = [];
    if (Auth.can('staff.manage')) actions.push(UI.btn('Edit', 'edit', { icon: 'edit' }));
    if (Auth.can('settings.manage')) actions.push(UI.btn('Sign-in access', 'access', { icon: 'lock' }));
    if (me) actions.push(UI.btn('Request leave', 'leave', { icon: 'calendar', kind: 'primary' }));
    return {
      title: s.name,
      html: UI.header(s.name, esc(s.title || '') + ' · ' + esc(s.department || '') + (s.status !== 'Active' ? ' · ' + UI.badge(s.status) : ''), actions.join(''), ['/staff', 'Staff']) +
        '<div class="grid g-main"><div class="stack">' +
          UI.card('Details', UI.kv([
            ['Staff number', esc(s.staffNo)], ['Phone', esc(s.phone)], ['Email', esc(s.email)], ['Started', U.date(s.startDate) + (s.startDate ? ' · ' + Math.max(0, Math.floor(U.daysBetween(s.startDate, U.today()) / 365)) + ' years' : '')],
            (Auth.can('staff.manage') || me) ? ['Date of birth', U.date(s.dob)] : null, (Auth.can('staff.manage') || me) ? ['Address', esc(s.address)] : null,
            (Auth.can('staff.manage') || me) ? ['Next of kin', esc(s.nextOfKin) + (s.nextOfKinPhone ? ' · ' + esc(s.nextOfKinPhone) : '')] : null,
            ['e-Istrom access', s.canLogin ? esc(Auth.roleLabel(s.role)) + ' · ' + esc(s.loginEmail) : 'Cannot sign in'],
            s.lastSeen && Auth.can('settings.manage') ? ['Last signed in', U.ago(s.lastSeen)] : null
          ])) +
          UI.card('Leave history', leaves.length ? '<div class="list">' + leaves.map(l => '<div class="list-item"><div class="grow"><div class="t">' + esc(l.type) + ' leave · ' + U.plural(l.days, 'day') + '</div><div class="s">' + U.date(l.from) + ' – ' + U.date(l.to) + (l.reason ? ' · ' + esc(l.reason) : '') + '</div></div>' + UI.badge(l.status) + '</div>').join('') + '</div>' : UI.empty('No leave yet', '')) +
        '</div><div class="stack">' +
          UI.card('Annual leave ' + year, '<div class="big-num">' + Math.max(0, (s.leaveDays || 0) - taken) + '<span class="muted" style="font-size:16px;font-weight:500"> days left</span></div><div class="muted mt">' + taken + ' of ' + (s.leaveDays || 0) + ' days used</div><div class="mt">' + UI.progress(U.pct(taken, s.leaveDays || 1)) + '</div>') +
          (pay && sal ? UI.card('Monthly pay', UI.kv([['Basic', U.money(sal.basic)], ['Housing', U.money(sal.housing)], ['Transport', U.money(sal.transport)], ['Other', U.money(sal.other)], ['Gross', '<b>' + U.money(gross) + '</b>'], ['PAYE tax', U.money(s.tax)], ['Bank', esc(s.bank) + ' · ' + esc(s.accountNo)]])) : '') +
        '</div></div>',
      actions: { edit: () => editStaff(s), access: () => editAccess(s), leave: () => App.go('/leave?new=1') }
    };
  });

  /* ============ Leave ============ */
  async function requestLeave() {
    const me = Auth.user;
    const year = U.today().slice(0, 4);
    const left = Math.max(0, (me.leaveDays || 0) - leaveTaken(me.id, year));
    const v = await UI.form({
      title: 'Request leave', values: { type: 'Annual', from: U.addDays(U.today(), 7), to: U.addDays(U.today(), 11) },
      intro: 'You have <b>' + left + ' days</b> of annual leave left this year.',
      fields: [
        { name: 'type', label: 'Type of leave', type: 'select', options: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Compassionate', 'Study', 'Unpaid'], placeholder: false },
        { name: 'from', label: 'First day off', type: 'date', required: true, half: true },
        { name: 'to', label: 'Last day off', type: 'date', required: true, half: true },
        { type: 'note', name: 'days', html: v => v.from && v.to ? U.plural(U.workDays(v.from, v.to), 'working day') + ' (weekends not counted)' : '' },
        { name: 'cover', label: 'Who will cover your work?', type: 'select', options: () => Biz.staffOptions().filter(o => o[0] !== me.id), placeholder: 'Not decided' },
        { name: 'reason', label: 'Reason', type: 'textarea', rows: 2 }
      ],
      validate: v => {
        if (v.to < v.from) return 'The last day can’t be before the first day.';
        const d = U.workDays(v.from, v.to);
        if (!d) return 'Those dates have no working days.';
        if (v.type === 'Annual' && d > left) return 'That’s ' + d + ' days, but you only have ' + left + ' days of annual leave left.';
      }
    });
    if (!v) return;
    DB.insert('leave', Object.assign(v, { staffId: me.id, days: U.workDays(v.from, v.to), status: 'Pending' }));
    DB.log('Requested ' + v.type.toLowerCase() + ' leave (' + U.date(v.from) + ' – ' + U.date(v.to) + ')');
    UI.toast('Leave request sent to HR');
    App.refresh();
  }

  App.route('/leave', null, (p, q) => {
    const approver = Auth.can('leave.approve');
    const tab = q.tab || (approver ? 'approve' : 'mine');
    const me = Auth.user;
    const today = U.today();
    const toApprove = U.sortBy(DB.filter('leave', l => l.status === 'Pending' && l.staffId !== me.id), l => l.from);
    const mine = U.sortBy(DB.filter('leave', l => l.staffId === me.id), l => l.from, true);
    const all = U.sortBy(DB.all('leave'), l => l.from, true);
    const off = DB.filter('leave', l => l.status === 'Approved' && l.to >= today && l.from <= U.addDays(today, 30));
    const cols = (withName, withAct) => [
      withName ? { label: 'Staff', html: l => '<div class="who">' + UI.avatar(Biz.staffName(l.staffId)) + '<span><span class="cell-main">' + esc(Biz.staffName(l.staffId)) + '</span><span class="cell-sub">' + esc((DB.get('staff', l.staffId) || {}).department || '') + '</span></span></div>', sort: l => Biz.staffName(l.staffId) } : null,
      { label: 'Leave', html: l => esc(l.type) + '<div class="cell-sub">' + U.plural(l.days, 'working day') + '</div>' },
      { label: 'Dates', html: l => U.date(l.from) + ' – ' + U.date(l.to), sort: l => l.from },
      { label: 'Reason', html: l => esc(l.reason || '') + (l.cover ? '<div class="cell-sub">Cover: ' + esc(Biz.staffName(l.cover)) + '</div>' : '') },
      { label: 'Status', html: l => UI.badge(l.status) + (l.decidedBy ? '<div class="cell-sub">' + esc(Biz.staffName(l.decidedBy)) + '</div>' : '') },
      withAct ? { label: '', cls: 'r nowrap', html: l => UI.btn('Decline', 'decline', { small: true, data: { id: l.id } }) + ' ' + UI.btn('Approve', 'approve', { small: true, kind: 'good', data: { id: l.id } }) } : null
    ].filter(Boolean);

    let body = '';
    if (tab === 'approve') body = UI.table({ rows: toApprove, noun: 'request', columns: cols(true, true), empty: UI.empty('No leave requests waiting', '', '', 'checkCircle') });
    if (tab === 'mine') body = UI.table({ rows: mine, noun: 'request', columns: cols(false, false), empty: UI.empty('You haven’t requested leave yet', '', UI.btn('Request leave', 'add', { icon: 'plus', kind: 'primary' }), 'calendar') });
    if (tab === 'all') body = UI.card('Away in the next 30 days', off.length ? '<div class="list">' + U.sortBy(off, l => l.from).map(l => '<div class="list-item">' + UI.avatar(Biz.staffName(l.staffId)) + '<div class="grow"><div class="t">' + esc(Biz.staffName(l.staffId)) + '</div><div class="s">' + esc(l.type) + ' · ' + U.date(l.from) + ' – ' + U.date(l.to) + '</div></div>' + (l.from <= today ? UI.badge('On leave') : '') + '</div>').join('') + '</div>' : UI.empty('Nobody is off', '')) +
      '<div class="mt"></div>' + UI.table({ id: 'lv', rows: all, noun: 'request', columns: cols(true, false), search: l => Biz.staffName(l.staffId), filters: [{ key: 's', label: 'Any status', options: ['Pending', 'Approved', 'Rejected'], value: l => l.status }, { key: 't', label: 'Any type', options: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Compassionate', 'Study', 'Unpaid'], value: l => l.type }] });

    const tabs = [];
    if (approver) tabs.push(['approve', 'To approve (' + toApprove.length + ')', '#/leave?tab=approve']);
    tabs.push(['mine', 'My leave', '#/leave?tab=mine']);
    if (approver) tabs.push(['all', 'Everyone', '#/leave?tab=all']);
    const decide = async (id, status) => {
      const l = DB.get('leave', id);
      let note = '';
      if (status === 'Rejected') { const v = await UI.form({ title: 'Decline leave', size: 'sm', fields: [{ name: 'note', label: 'Reason', type: 'textarea', required: true }] }); if (!v) return; note = v.note; }
      DB.update('leave', id, { status, decidedBy: Auth.user.id, decidedAt: Date.now(), note });
      DB.log((status === 'Approved' ? 'Approved' : 'Declined') + ' leave for ' + Biz.staffName(l.staffId));
      App.refresh();
    };
    return {
      title: 'Leave',
      html: UI.header('Leave', approver ? 'Leave requests across the company' : 'Request time off and see your history', UI.btn('Request leave', 'add', { icon: 'plus', kind: 'primary' })) + UI.tabs(tabs, tab) + body,
      actions: { add: () => requestLeave(), approve: id => decide(id, 'Approved'), decline: id => decide(id, 'Rejected') },
      mount: () => { if (q.new) { history.replaceState(null, '', '#/leave?tab=mine'); requestLeave(); } }
    };
  });

  /* ============ Memos ============ */
  App.route('/memos', null, () => {
    const list = U.sortBy(DB.filter('memos', m => App.memoVisible(m)), m => (m.pinned ? 1e15 : 0) + m.createdAt, true);
    const me = Auth.user.id;
    const html = list.length ? UI.card(null, list.map(m => '<article class="memo ' + ((m.readBy || []).includes(me) ? '' : 'unread') + '">' +
      '<div class="split"><h3>' + esc(m.title) + (m.pinned ? ' ' + UI.badge('Pinned') : '') + '</h3>' +
      ((m.createdBy === me || Auth.can('approvals.md')) ? UI.btn('', 'del', { small: true, kind: 'ghost', icon: 'trash', data: { id: m.id }, title: 'Delete' }) : '') + '</div>' +
      '<div class="s">' + esc(Biz.staffName(m.createdBy)) + ' · ' + U.dateTime(m.createdAt) + ' · To: ' + esc(m.audience || 'All staff') + (Auth.can('memos.post') ? ' · read by ' + (m.readBy || []).length : '') + '</div>' +
      '<div class="body">' + esc(m.body) + '</div></article>').join(''), { flush: true }) : UI.empty('No memos yet', '', '', 'megaphone');
    return {
      title: 'Memos',
      html: UI.header('Memos & announcements', 'Notices for everyone, or for a department', Auth.can('memos.post') ? UI.btn('New memo', 'add', { icon: 'plus', kind: 'primary' }) : '') + html,
      actions: {
        add: async () => {
          const v = await UI.form({ title: 'New memo', values: { audience: 'All staff' }, fields: [
            { name: 'title', label: 'Title', required: true },
            { name: 'audience', label: 'Send to', type: 'select', options: ['All staff'].concat(Biz.DEPARTMENTS), placeholder: false, half: true },
            { name: 'pinned', label: 'Pin to the top', type: 'checkbox', half: true },
            { name: 'body', label: 'Message', type: 'textarea', rows: 8, required: true }
          ] });
          if (!v) return;
          DB.insert('memos', Object.assign(v, { readBy: [Auth.user.id] }));
          DB.log('Posted memo: ' + v.title);
          App.refresh();
        },
        del: async id => {
          if (!(await UI.confirm('Delete this memo for everyone?', { danger: true, ok: 'Delete' }))) return;
          DB.remove('memos', id); App.refresh();
        }
      },
      mount: () => {
        let changed = false;
        list.forEach(m => { if (!(m.readBy || []).includes(me)) { m.readBy = (m.readBy || []).concat([me]); changed = true; } });
        if (changed) { DB.save('memos'); setTimeout(() => { App.renderNav(); App.updateBell(); }, 1500); }
      }
    };
  });

  /* ============ Visitors ============ */
  async function signInVisitor() {
    const v = await UI.form({
      title: 'Sign in a visitor', values: { date: U.today() },
      fields: [
        { name: 'name', label: 'Visitor name', required: true, half: true },
        { name: 'phone', label: 'Phone', type: 'tel', half: true },
        { name: 'company', label: 'Company / organisation', half: true },
        { name: 'purpose', label: 'Purpose', type: 'select', options: ['Sales enquiry', 'Payment', 'Meeting', 'Delivery', 'Interview', 'Contractor meeting', 'Document collection', 'Complaint', 'Other'], required: true, half: true },
        { name: 'hostId', label: 'Here to see', type: 'select', options: Biz.staffOptions, required: true, half: true },
        { name: 'badge', label: 'Visitor tag number', half: true }
      ]
    });
    if (!v) return;
    DB.insert('visitors', Object.assign(v, { date: U.today(), timeIn: Date.now(), timeOut: null }));
    if (v.purpose === 'Sales enquiry' && Auth.can('leads.manage') && await UI.confirm('Also add ' + v.name + ' as a sales enquiry?', { ok: 'Add enquiry', title: 'Sales enquiry' })) {
      SalesUI.editLead(null, { name: v.name, phone: v.phone, source: 'Walk-in' });
    }
    App.refresh();
  }

  App.route('/visitors', 'visitors.manage', (p, q) => {
    const today = U.today();
    const todays = U.sortBy(DB.filter('visitors', v => v.date === today), v => v.timeIn, true);
    const earlier = U.sortBy(DB.filter('visitors', v => v.date !== today), v => v.timeIn, true);
    const cols = [
      { label: 'Visitor', html: v => '<span class="cell-main">' + esc(v.name) + '</span><div class="cell-sub">' + esc(v.company || '') + (v.phone ? ' · ' + esc(v.phone) : '') + '</div>', sort: v => v.name },
      { label: 'Purpose', html: v => esc(v.purpose) },
      { label: 'To see', html: v => esc(Biz.staffName(v.hostId)) },
      { label: 'In', html: v => (v.date === today ? '' : U.date(v.timeIn) + ', ') + U.time(v.timeIn), sort: v => v.timeIn },
      { label: 'Out', html: v => v.timeOut ? U.time(v.timeOut) : (v.date === today ? UI.btn('Sign out', 'out', { small: true, data: { id: v.id } }) : '<span class="muted">—</span>') }
    ];
    return {
      title: 'Visitors',
      html: UI.header('Visitor log', todays.filter(v => !v.timeOut).length + ' in the building now', UI.btn('Sign in visitor', 'add', { icon: 'plus', kind: 'primary' })) +
        UI.card('Today', UI.table({ rows: todays, noun: 'visitor', columns: cols, empty: UI.empty('No visitors yet today', '', '', 'door') }), { flush: true }) + '<div class="mt"></div>' +
        UI.card('Earlier', UI.table({ id: 'vh', rows: earlier, noun: 'visitor', columns: cols, search: v => v.name + ' ' + (v.company || '') + ' ' + v.purpose }), { flush: true }),
      actions: { add: () => signInVisitor(), out: id => { DB.update('visitors', id, { timeOut: Date.now() }); App.refresh(); } },
      mount: () => { if (q.new) { history.replaceState(null, '', '#/visitors'); signInVisitor(); } }
    };
  });

  /* ============ Documents register ============ */
  App.route('/documents', ['documents.issue', 'payments.record'], () => {
    const rows = U.sortBy(DB.all('documents'), d => d.createdAt, true);
    const reprint = d => {
      const r = d.ref || {};
      if (r.payments) return Docs.receipt(r.payments, true);
      if (r.sales && d.type === 'Offer letter') return Docs.offer(r.sales, true);
      if (r.sales && d.type === 'Allocation letter') return Docs.allocation(r.sales, true);
      if (r.purchases) return Docs.purchaseOrder(r.purchases);
      UI.toast('This document can’t be reprinted from here.', 'red');
    };
    return {
      title: 'Documents',
      html: UI.header('Documents issued', 'Every receipt, letter and order printed from e-Istrom. Letters are issued from a sale; receipts from a payment.') +
        '<div class="callout">' + icon('info', 17) + '<div>To issue an <b>offer</b> or <b>allocation letter</b>, open the sale and use the buttons at the top. Receipts print when a payment is recorded. Older documents from before e-Istrom don’t appear here.</div></div>' +
        UI.table({
          id: 'docs', rows, noun: 'document', search: d => d.number + ' ' + d.type + ' ' + (d.clientId ? Biz.clientName(d.clientId) : ''),
          filters: [{ key: 't', label: 'Any type', options: [...new Set(rows.map(r => r.type))], value: d => d.type }],
          columns: [
            { label: 'Date', html: d => U.date(d.date), sort: d => d.createdAt },
            { label: 'Document', html: d => '<span class="cell-main">' + esc(d.type) + '</span><div class="cell-sub">' + esc(d.number) + '</div>' },
            { label: 'Client', html: d => d.clientId ? '<a href="#/clients/' + d.clientId + '">' + esc(Biz.clientName(d.clientId)) + '</a>' : '<span class="muted">—</span>' },
            { label: 'Issued by', html: d => esc(Biz.staffName(d.issuedBy)) },
            { label: '', cls: 'r', html: d => UI.btn('Reprint', 'reprint', { small: true, icon: 'print', data: { id: d.id } }) }
          ],
          empty: UI.empty('No documents issued yet', 'Receipts and letters you print will be listed here.', '', 'doc')
        }),
      actions: { reprint: id => reprint(DB.get('documents', id)) }
    };
  });
})();
