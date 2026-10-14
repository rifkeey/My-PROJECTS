/* e-Istrom — Enquiries, site inspections, clients and sales */
(function () {
  const esc = U.esc, icon = UI.icon;

  const salesStaff = () => Biz.activeStaff().filter(s => ['sales', 'sales_head'].includes(s.role)).map(s => [s.id, s.name]);
  const isSalesExec = () => Auth.user.role === 'sales';
  const myLeads = () => DB.filter('leads', l => !isSalesExec() || l.assignedTo === Auth.user.id || !l.assignedTo);

  /* ============ Reminders (WhatsApp / SMS) ============ */
  const Remind = {
    text(sale) {
      const c = DB.get('clients', sale.clientId);
      const u = DB.get('units', sale.unitId);
      const st = Biz.saleStats(sale);
      const amt = st.overdue > 0 ? st.overdue : (st.next ? st.next.amount : st.balance);
      const when = st.overdue > 0 ? 'which is now overdue' : (st.next ? 'due on ' + U.date(st.next.due) : '');
      return 'Dear ' + c.name + ', this is a friendly reminder from Istrom that ' + U.money(amt) + ' for your ' + u.type + ' (' + u.code + ') at ' + Biz.projectName(u.projectId) + ' is ' + when +
        '. Please pay into our official company account and send us your proof of payment so we can issue your receipt. Istrom does not accept cash. Thank you. — ' + Docs.company().name + ', ' + Docs.company().phone;
    },
    open(sale) {
      const c = DB.get('clients', sale.clientId);
      const msg = Remind.text(sale);
      UI.modal({
        title: 'Send a reminder to ' + c.name, size: 'md',
        body: '<p class="muted" style="margin-top:0">Check the message, then send it from your phone or WhatsApp. Nothing is sent automatically.</p>' +
          '<label class="field"><span class="lbl">Message</span><textarea id="rmsg" rows="7">' + esc(msg) + '</textarea></label>',
        foot: '<button class="btn" data-maction="copy">' + icon('clipboard', 15) + 'Copy</button><button class="btn" data-maction="sms">' + icon('message', 15) + 'SMS</button><button class="btn btn-primary" data-maction="wa">' + icon('whatsapp', 15) + 'Open WhatsApp</button>',
        actions: {
          copy: (a, close) => { const t = document.getElementById('rmsg'); t.select(); navigator.clipboard ? navigator.clipboard.writeText(t.value) : document.execCommand('copy'); UI.toast('Message copied'); },
          wa: (a, close) => { const t = document.getElementById('rmsg').value; window.open('https://wa.me/' + U.phoneIntl(c.phone) + '?text=' + encodeURIComponent(t), '_blank'); log(sale, 'WhatsApp'); close(); },
          sms: (a, close) => { const t = document.getElementById('rmsg').value; location.href = 'sms:' + c.phone + '?body=' + encodeURIComponent(t); log(sale, 'SMS'); close(); }
        }
      });
      function log(s, via) {
        const r = (s.reminders || []).concat([{ at: Date.now(), by: Auth.user.id, via }]);
        DB.update('sales', s.id, { reminders: r });
        DB.log('Sent payment reminder by ' + via + ' to ' + c.name);
      }
    }
  };
  window.Remind = Remind;

  /* ============ Enquiries (leads) ============ */
  async function editLead(lead, preset) {
    const v = await UI.form({
      title: lead ? 'Edit enquiry' : 'New enquiry',
      values: lead || Object.assign({ stage: 'New', source: 'Walk-in', assignedTo: Auth.user.role.startsWith('sales') ? Auth.user.id : '', nextFollowUp: U.addDays(U.today(), 1) }, preset || {}),
      fields: [
        { name: 'name', label: 'Name', required: true, half: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, half: true },
        { name: 'email', label: 'Email', type: 'email', half: true },
        { name: 'source', label: 'How did they hear about us?', type: 'select', options: Biz.LEAD_SOURCES, half: true },
        { name: 'projectId', label: 'Interested in', type: 'select', options: () => Biz.projectOptions(p => DB.filter('units', u => u.projectId === p.id && u.status === 'available').length > 0), half: true },
        { name: 'interest', label: 'Unit type', type: 'select', half: true, dependsOn: ['projectId'], options: v => { const p = DB.get('projects', v.projectId); return p ? (p.types || []).map(t => t.type) : []; } },
        { name: 'budget', label: 'Budget', type: 'money', half: true },
        { name: 'stage', label: 'Stage', type: 'select', options: Biz.LEAD_STAGES, half: true, placeholder: false },
        { name: 'assignedTo', label: 'Assigned to', type: 'select', options: salesStaff, half: true },
        { name: 'nextFollowUp', label: 'Next follow-up', type: 'date', half: true },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    });
    if (!v) return null;
    if (lead) { DB.update('leads', lead.id, v); UI.toast('Enquiry saved'); App.refresh(); return lead; }
    const dupe = DB.find('leads', l => U.phoneIntl(l.phone) === U.phoneIntl(v.phone) && !['Won', 'Lost'].includes(l.stage));
    const n = DB.insert('leads', Object.assign(v, { history: [{ at: Date.now(), by: Auth.user.id, text: 'Enquiry created' }] }));
    DB.log('New enquiry: ' + v.name);
    UI.toast(dupe ? 'Saved. Note: ' + dupe.name + ' has an open enquiry with the same phone.' : 'Enquiry added', dupe ? 'red' : '');
    App.refresh();
    return n;
  }

  function openLead(id) {
    const l = DB.get('leads', id);
    if (!l) return;
    const canEdit = Auth.can('leads.manage');
    const hist = (l.history || []).slice().reverse();
    const m = UI.modal({
      title: l.name, size: 'md',
      body:
        '<div class="split mb"><div class="row">' + UI.badge(l.stage) + '<span class="muted">' + esc(l.source || '') + ' · ' + U.ago(l.createdAt) + '</span></div>' +
        '<div class="row"><a class="btn btn-sm" href="tel:' + esc(l.phone) + '">' + icon('phone', 14) + 'Call</a><a class="btn btn-sm" target="_blank" rel="noopener" href="https://wa.me/' + U.phoneIntl(l.phone) + '">' + icon('whatsapp', 14) + 'WhatsApp</a></div></div>' +
        UI.kv([
          ['Phone', esc(l.phone)], ['Email', esc(l.email)], ['Interested in', esc(Biz.projectName(l.projectId)) + (l.interest ? ' · ' + esc(l.interest) : '')],
          ['Budget', l.budget ? U.money(l.budget) : ''], ['Assigned to', esc(Biz.staffName(l.assignedTo))],
          ['Next follow-up', l.nextFollowUp ? U.date(l.nextFollowUp) + (l.nextFollowUp < U.today() ? ' ' + UI.badge('Overdue') : '') : ''],
          ['Notes', esc(l.notes)], l.lostReason ? ['Lost because', esc(l.lostReason)] : null,
          l.clientId ? ['Client record', '<a href="#/clients/' + l.clientId + '">Open client</a>'] : null
        ]) +
        (canEdit ? '<div class="hr"></div><div class="lbl" style="font-size:12.5px;color:var(--ink-3);margin-bottom:8px">Move to stage</div><div class="pill-row">' +
          Biz.LEAD_STAGES.map(s => '<button class="btn btn-sm ' + (s === l.stage ? 'btn-primary' : '') + '" data-maction="stage" data-stage="' + s + '">' + s + '</button>').join('') + '</div>' : '') +
        (hist.length ? '<div class="hr"></div><div class="list">' + hist.slice(0, 8).map(h => '<div class="list-item"><div class="grow"><div style="font-size:13.5px">' + esc(h.text) + '</div><div class="s">' + esc(Biz.staffName(h.by)) + ' · ' + U.dateTime(h.at) + '</div></div></div>').join('') + '</div>' : ''),
      foot: canEdit ? '<button class="btn btn-ghost" data-maction="edit">' + icon('edit', 15) + 'Edit</button><span class="spacer"></span>' +
        '<button class="btn" data-maction="note">' + icon('message', 15) + 'Log follow-up</button>' +
        (Auth.can('inspections.manage') ? '<button class="btn" data-maction="inspect">' + icon('pin', 15) + 'Book inspection</button>' : '') +
        (Auth.can('sales.manage') && l.stage !== 'Won' ? '<button class="btn btn-primary" data-maction="convert">' + icon('tag', 15) + 'Make a sale</button>' : '') : '',
      actions: {
        edit: (a, close) => { close(); editLead(l); },
        stage: async (a, close) => {
          const stage = a.dataset.stage;
          let lostReason = l.lostReason;
          if (stage === 'Lost') {
            const v = await UI.form({ title: 'Why was this enquiry lost?', size: 'sm', fields: [{ name: 'r', label: 'Reason', type: 'select', required: true, options: ['Price too high', 'Bought elsewhere', 'Not responding', 'Location not suitable', 'Financing fell through', 'Just browsing', 'Other'] }] });
            if (!v) return;
            lostReason = v.r;
          }
          close();
          DB.update('leads', l.id, { stage, lostReason, history: (l.history || []).concat([{ at: Date.now(), by: Auth.user.id, text: 'Moved to ' + stage + (stage === 'Lost' ? ' — ' + lostReason : '') }]) });
          App.refresh();
        },
        note: async (a, close) => {
          close();
          const v = await UI.form({ title: 'Log follow-up — ' + l.name, size: 'sm', values: { next: U.addDays(U.today(), 3) }, fields: [
            { name: 'how', label: 'How', type: 'select', options: ['Phone call', 'WhatsApp', 'Meeting', 'Email', 'SMS'], placeholder: false, half: true },
            { name: 'next', label: 'Next follow-up', type: 'date', half: true },
            { name: 'text', label: 'What happened', type: 'textarea', required: true }
          ] });
          if (!v) return;
          DB.update('leads', l.id, { nextFollowUp: v.next, stage: l.stage === 'New' ? 'Contacted' : l.stage, history: (l.history || []).concat([{ at: Date.now(), by: Auth.user.id, text: v.how + ': ' + v.text }]) });
          UI.toast('Follow-up logged'); App.refresh();
        },
        inspect: (a, close) => { close(); bookInspection({ leadId: l.id, name: l.name, phone: l.phone, projectId: l.projectId, staffId: l.assignedTo }); },
        convert: (a, close) => { close(); App.go('/sales?new=1&lead=' + l.id); }
      }
    });
    return m;
  }
  window.openLead = openLead;

  App.route('/leads', 'leads.view', (p, q) => {
    const tab = q.tab || 'board';
    const leads = myLeads();
    const open = leads.filter(l => !['Won', 'Lost'].includes(l.stage));
    const due = open.filter(l => l.nextFollowUp && l.nextFollowUp <= U.today());
    const month = U.today().slice(0, 7);
    const won = leads.filter(l => l.stage === 'Won' && U.monthKey(l.updatedAt || l.createdAt) === month).length;
    const closed = leads.filter(l => ['Won', 'Lost'].includes(l.stage));

    let body;
    if (tab === 'board') {
      body = '<div class="kanban">' + Biz.LEAD_STAGES.map(st => {
        const items = U.sortBy(leads.filter(l => l.stage === st), l => l.createdAt, true);
        const shown = ['Won', 'Lost'].includes(st) ? items.slice(0, 8) : items;
        return '<div class="kcol"><h4>' + st + '<span>' + items.length + '</span></h4>' +
          shown.map(l => '<div class="kcard" data-action="open" data-id="' + l.id + '"><b>' + esc(l.name) + '</b><small>' + esc(Biz.projectName(l.projectId)) + '</small><small>' + esc(Biz.staffName(l.assignedTo)) +
            (l.nextFollowUp && !['Won', 'Lost'].includes(st) ? ' · ' + (l.nextFollowUp <= U.today() ? '<span class="tone-red">follow up ' + (l.nextFollowUp === U.today() ? 'today' : 'overdue') + '</span>' : U.date(l.nextFollowUp)) : '') + '</small></div>').join('') +
          (items.length > shown.length ? '<small class="muted" style="padding:4px">+ ' + (items.length - shown.length) + ' more in List</small>' : '') + '</div>';
      }).join('') + '</div>';
    } else {
      const rows = tab === 'followup' ? due : leads;
      body = UI.table({
        id: 'leads', rows: U.sortBy(rows, l => l.createdAt, true), noun: 'enquiry', search: l => l.name + ' ' + l.phone + ' ' + (l.email || ''), rowAction: 'open', searchPlaceholder: 'Search name or phone',
        filters: [
          { key: 'st', label: 'Any stage', options: Biz.LEAD_STAGES, value: l => l.stage },
          { key: 'pr', label: 'Any project', options: Biz.projectOptions(), value: l => l.projectId },
          { key: 'src', label: 'Any source', options: Biz.LEAD_SOURCES, value: l => l.source },
          !isSalesExec() ? { key: 'as', label: 'Anyone', options: salesStaff(), value: l => l.assignedTo } : null
        ].filter(Boolean),
        columns: [
          { label: 'Name', html: l => '<div class="cell-main">' + esc(l.name) + '</div><div class="cell-sub">' + esc(l.phone) + '</div>', sort: l => l.name },
          { label: 'Interested in', html: l => esc(Biz.projectName(l.projectId)) + '<div class="cell-sub">' + esc(l.interest || '') + '</div>', sort: l => Biz.projectName(l.projectId) },
          { label: 'Source', html: l => esc(l.source), sort: l => l.source },
          { label: 'Stage', html: l => UI.badge(l.stage), sort: l => Biz.LEAD_STAGES.indexOf(l.stage) },
          { label: 'Assigned to', html: l => esc(Biz.staffName(l.assignedTo)), sort: l => Biz.staffName(l.assignedTo) },
          { label: 'Follow up', html: l => l.nextFollowUp && !['Won', 'Lost'].includes(l.stage) ? (l.nextFollowUp < U.today() ? '<span class="tone-red">' + U.date(l.nextFollowUp) + '</span>' : U.date(l.nextFollowUp)) : '<span class="muted">—</span>', sort: l => l.nextFollowUp || '9' },
          { label: 'Received', html: l => U.date(l.createdAt), sort: l => l.createdAt }
        ],
        empty: UI.empty(tab === 'followup' ? 'No follow-ups due' : 'No enquiries yet', tab === 'followup' ? 'You’re up to date with your follow-ups.' : 'Add walk-ins, calls and social media enquiries here.', '', 'target')
      });
    }

    const bySource = U.groupBy(leads, l => l.source);
    return {
      title: 'Enquiries',
      html: UI.header('Enquiries', isSalesExec() ? 'Your enquiries and follow-ups' : 'Every potential buyer, from first contact to sale',
        Auth.can('leads.manage') ? UI.btn('New enquiry', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        '<div class="stats">' +
          UI.stat('Open enquiries', U.num(open.length), U.num(open.filter(l => l.stage === 'New').length) + ' not yet contacted') +
          UI.stat('Follow-ups due', U.num(due.length), 'today or earlier', { tone: due.length ? 'amber' : '', href: '/leads?tab=followup' }) +
          UI.stat('Won this month', U.num(won), 'turned into sales') +
          UI.stat('Conversion', U.pct(closed.filter(l => l.stage === 'Won').length, closed.length) + '%', 'of closed enquiries became sales') +
          UI.stat('Top source', esc(Object.keys(bySource).sort((a, b) => bySource[b].length - bySource[a].length)[0] || '—'), 'where most enquiries come from') +
        '</div>' +
        UI.tabs([['board', 'Board', '#/leads'], ['list', 'List', '#/leads?tab=list'], ['followup', 'Follow-ups due (' + due.length + ')', '#/leads?tab=followup']], tab) + body,
      actions: { add: () => editLead(), open: id => openLead(id) },
      mount: () => { if (q.new) { history.replaceState(null, '', '#/leads'); editLead(); } if (q.open) openLead(q.open); }
    };
  });

  /* ============ Site inspections ============ */
  async function bookInspection(preset, existing) {
    const v = await UI.form({
      title: existing ? 'Edit inspection' : 'Book a site inspection',
      values: existing || Object.assign({ date: U.addDays(U.today(), 1), time: '10:00', people: 1, staffId: Auth.user.id }, preset || {}),
      fields: [
        { name: 'leadId', label: 'From enquiry (optional)', type: 'select', options: () => U.sortBy(DB.filter('leads', l => !['Won', 'Lost'].includes(l.stage)), l => l.name).map(l => [l.id, l.name + ' · ' + l.phone]), placeholder: 'Not from an enquiry' },
        { name: 'name', label: 'Visitor name', required: true, half: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: true, half: true },
        { name: 'projectId', label: 'Project to visit', type: 'select', options: () => Biz.projectOptions(), required: true, half: true },
        { name: 'people', label: 'Number of people', type: 'number', min: 1, half: true },
        { name: 'date', label: 'Date', type: 'date', required: true, third: true },
        { name: 'time', label: 'Time', type: 'time', required: true, third: true },
        { name: 'staffId', label: 'Staff going', type: 'select', options: Biz.staffOptions, required: true, third: true },
        { name: 'vehicleId', label: 'Company vehicle', type: 'select', options: () => DB.filter('vehicles', x => x.status !== 'Under repair').map(x => [x.id, x.make + ' ' + x.model + ' · ' + x.plate]), placeholder: 'No vehicle needed' },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
      ],
      onChange: (v, form, changed) => {
        if (changed === 'leadId' && v.leadId) {
          const l = DB.get('leads', v.leadId);
          form.elements.name.value = l.name; form.elements.phone.value = l.phone;
          if (l.projectId) form.elements.projectId.value = l.projectId;
        }
      }
    });
    if (!v) return;
    if (existing) { DB.update('inspections', existing.id, v); App.refresh(); return; }
    DB.insert('inspections', Object.assign(v, { status: 'Scheduled' }));
    if (v.leadId) {
      const l = DB.get('leads', v.leadId);
      DB.update('leads', l.id, { stage: ['New', 'Contacted'].includes(l.stage) ? 'Inspection booked' : l.stage, nextFollowUp: v.date, history: (l.history || []).concat([{ at: Date.now(), by: Auth.user.id, text: 'Inspection booked for ' + U.date(v.date) + ' at ' + v.time }]) });
    }
    if (v.vehicleId) DB.insert('vehicleLogs', { vehicleId: v.vehicleId, kind: 'trip', date: v.date, staffId: v.staffId, purpose: 'Site inspection with ' + v.name + ' — ' + Biz.projectName(v.projectId), cost: 0 });
    DB.log('Booked site inspection for ' + v.name);
    UI.toast('Inspection booked for ' + U.date(v.date));
    App.refresh();
  }
  window.bookInspection = bookInspection;

  App.route('/inspections', ['inspections.manage', 'leads.view'], (p, q) => {
    const all = DB.all('inspections');
    const upcoming = U.sortBy(all.filter(i => i.status === 'Scheduled'), i => i.date + i.time);
    const past = U.sortBy(all.filter(i => i.status !== 'Scheduled'), i => i.date + i.time, true);
    const canManage = Auth.can('inspections.manage');
    const row = list => UI.table({
      rows: list, noun: 'inspection', rowAction: canManage ? 'open' : null,
      columns: [
        { label: 'When', html: i => '<div class="cell-main">' + (i.date === U.today() ? 'Today' : U.date(i.date)) + '</div><div class="cell-sub">' + esc(i.time) + '</div>', sort: i => i.date + i.time },
        { label: 'Visitor', html: i => esc(i.name) + '<div class="cell-sub">' + esc(i.phone) + ' · ' + U.plural(i.people || 1, 'person', 'people') + '</div>', sort: i => i.name },
        { label: 'Project', html: i => esc(Biz.projectName(i.projectId)) },
        { label: 'With', html: i => esc(Biz.staffName(i.staffId)) },
        { label: 'Vehicle', html: i => { const v = DB.get('vehicles', i.vehicleId); return v ? esc(v.plate) : '<span class="muted">—</span>'; } },
        { label: 'Status', html: i => UI.badge(i.status) + (i.outcome ? '<div class="cell-sub">' + esc(i.outcome) + '</div>' : '') }
      ],
      empty: UI.empty('Nothing here', '', '', 'pin')
    });
    return {
      title: 'Site inspections',
      html: UI.header('Site inspections', 'Book visits for prospective buyers and record how they went', canManage ? UI.btn('Book inspection', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        UI.card('Coming up', row(upcoming), { flush: true }) + '<div class="mt"></div>' + UI.card('Past inspections', row(past.slice(0, 40)), { flush: true }),
      actions: {
        add: () => bookInspection(),
        open: id => {
          const i = DB.get('inspections', id);
          UI.modal({
            title: 'Inspection — ' + i.name, size: 'sm',
            body: UI.kv([['When', U.date(i.date) + ', ' + esc(i.time)], ['Project', esc(Biz.projectName(i.projectId))], ['Phone', esc(i.phone)], ['With', esc(Biz.staffName(i.staffId))], ['Status', UI.badge(i.status)], ['Outcome', esc(i.outcome)], ['Notes', esc(i.notes)]]),
            foot: i.status === 'Scheduled' ? '<button class="btn btn-ghost" data-maction="edit">Edit</button><span class="spacer"></span><button class="btn" data-maction="cancel">Cancelled</button><button class="btn" data-maction="noshow">No-show</button><button class="btn btn-primary" data-maction="done">Mark done</button>' : '',
            actions: {
              edit: (a, close) => { close(); bookInspection(null, i); },
              cancel: (a, close) => { close(); DB.update('inspections', i.id, { status: 'Cancelled' }); App.refresh(); },
              noshow: (a, close) => { close(); DB.update('inspections', i.id, { status: 'No-show' }); App.refresh(); },
              done: async (a, close) => {
                close();
                const v = await UI.form({ title: 'How did it go?', size: 'sm', fields: [{ name: 'outcome', label: 'Outcome', type: 'textarea', required: true, placeholder: 'e.g. Very interested, will pay deposit next week' }, { name: 'stage', label: 'Move enquiry to', type: 'select', options: ['Negotiating', 'Won', 'Lost'], placeholder: 'Leave as is', show: () => !!i.leadId }] });
                if (!v) return;
                DB.update('inspections', i.id, { status: 'Done', outcome: v.outcome });
                if (i.leadId) { const l = DB.get('leads', i.leadId); if (l) DB.update('leads', l.id, { stage: v.stage || l.stage, history: (l.history || []).concat([{ at: Date.now(), by: Auth.user.id, text: 'Inspection done: ' + v.outcome }]) }); }
                App.refresh();
              }
            }
          });
        }
      },
      mount: () => { if (q.new) { history.replaceState(null, '', '#/inspections'); bookInspection(); } }
    };
  });

  /* ============ Clients ============ */
  const clientFields = [
    { name: 'name', label: 'Full name / company name', required: true, half: true },
    { name: 'type', label: 'Client type', type: 'select', options: ['Individual', 'Company'], placeholder: false, half: true },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, half: true },
    { name: 'email', label: 'Email', type: 'email', half: true },
    { name: 'address', label: 'Address', },
    { name: 'occupation', label: 'Occupation', half: true },
    { name: 'idNumber', label: 'ID type & number', half: true, placeholder: 'e.g. NIN 12345678901' },
    { name: 'nextOfKin', label: 'Next of kin', half: true },
    { name: 'nextOfKinPhone', label: 'Next of kin phone', type: 'tel', half: true },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
  ];

  function nextClientNo() {
    const n = Math.max(0, ...DB.all('clients').map(c => Number(String(c.clientNo || '').replace(/\D/g, '')) || 0)) + 1;
    return 'CL-' + U.pad(n);
  }

  async function editClient(c) {
    const v = await UI.form({ title: c ? 'Edit client' : 'New client', values: c || { type: 'Individual' }, fields: clientFields });
    if (!v) return null;
    if (c) { DB.update('clients', c.id, v); DB.log('Edited client ' + v.name); App.refresh(); return c; }
    const n = DB.insert('clients', Object.assign(v, { clientNo: nextClientNo() }));
    DB.log('Added client ' + v.name);
    App.go('/clients/' + n.id);
    return n;
  }

  App.route('/clients', 'clients.view', () => {
    const money = Auth.can('payments.view');
    const rows = DB.all('clients').map(c => Object.assign({ _s: Biz.clientStats(c.id) }, c));
    return {
      title: 'Clients',
      html: UI.header('Clients', U.plural(rows.length, 'client') + (money ? ' · ' + U.moneyShort(U.sum(rows, r => r._s.balance)) + ' still to collect' : ''),
        (Auth.can('settings.manage') ? UI.btn('Import from Excel', 'import', { icon: 'upload' }) : '') + (Auth.can('clients.manage') ? UI.btn('New client', 'add', { icon: 'plus', kind: 'primary' }) : '')) +
        UI.table({
          id: 'clients', rows: U.sortBy(rows, r => r.name), noun: 'client', rowAction: 'open', search: c => c.name + ' ' + c.phone + ' ' + (c.email || '') + ' ' + c.clientNo, searchPlaceholder: 'Search name, phone or client number',
          filters: money ? [{ key: 'st', label: 'Any status', options: [['owing', 'Owes money'], ['overdue', 'Overdue'], ['clear', 'Fully paid'], ['none', 'No purchase yet']], value: c => !c._s.sales.length ? 'none' : c._s.overdue > 0 ? 'overdue' : c._s.balance > 0 ? 'owing' : 'clear' }] : [],
          columns: [
            { label: 'Client', html: c => '<div class="who">' + UI.avatar(c.name) + '<span><span class="cell-main">' + esc(c.name) + '</span><span class="cell-sub">' + esc(c.clientNo || '') + ' · ' + esc(c.phone || '') + '</span></span></div>', sort: c => c.name },
            { label: 'Properties', cls: 'c', html: c => c._s.sales.length || '<span class="muted">0</span>', sort: c => c._s.sales.length },
            money ? { label: 'Value', cls: 'num', html: c => c._s.value ? U.money(c._s.value) : '—', sort: c => c._s.value } : null,
            money ? { label: 'Paid', cls: 'num', html: c => c._s.paid ? U.money(c._s.paid) : '—', sort: c => c._s.paid } : null,
            money ? { label: 'Balance', cls: 'num', html: c => c._s.balance > 0 ? U.money(c._s.balance) : '<span class="muted">—</span>', sort: c => c._s.balance } : null,
            money ? { label: '', html: c => c._s.overdue > 0 ? UI.badge('Overdue') : (c._s.sales.length && c._s.balance <= 0 ? UI.badge('Fully paid') : ''), sort: c => c._s.overdue } : null
          ].filter(Boolean),
          empty: UI.empty('No clients yet', 'Add a client, or bring in your existing list from Excel.', '', 'users')
        }),
      actions: { add: () => editClient(), open: id => App.go('/clients/' + id), import: () => App.go('/settings?tab=import') }
    };
  });

  App.route('/clients/:id', 'clients.view', params => {
    const c = DB.get('clients', params.id);
    if (!c) return { html: UI.empty('Client not found', '') };
    const money = Auth.can('payments.view');
    const cs = Biz.clientStats(c.id);
    const sales = DB.filter('sales', s => s.clientId === c.id);
    const pays = U.sortBy(DB.filter('payments', p => p.clientId === c.id), p => p.date, true);
    const docs = U.sortBy(DB.filter('documents', d => d.clientId === c.id), d => d.createdAt, true);
    const lead = DB.find('leads', l => l.clientId === c.id);

    const props = sales.length ? '<div class="list">' + sales.map(s => {
      const u = DB.get('units', s.unitId);
      const st = Biz.saleStats(s);
      return '<a class="list-item" href="#/sales/' + s.id + '"><span class="dot-ic">' + icon('building', 16) + '</span><div class="grow"><div class="split"><span class="t">' + esc(u ? u.type + ' · ' + u.code : '') + '</span>' + UI.badge(st.status) + '</div>' +
        '<div class="s">' + esc(Biz.projectName(s.projectId)) + ' · ' + esc(s.number) + (money ? ' · ' + U.money(st.paid) + ' of ' + U.money(s.price) : '') + '</div>' + (money ? '<div style="margin-top:6px">' + UI.progress(st.pct, st.status === 'Overdue' ? 'red' : st.pct >= 100 ? 'green' : '') + '</div>' : '') + '</div></a>';
    }).join('') + '</div>' : UI.empty('No properties yet', '', Auth.can('sales.manage') ? UI.btn('Start a sale', 'sell', { icon: 'tag', kind: 'primary' }) : '', 'building');

    const payHtml = pays.length ? UI.table({
      rows: pays, noun: 'payment',
      columns: [
        { label: 'Date', html: p => U.date(p.date), sort: p => p.date },
        { label: 'Receipt', html: p => '<span class="cell-main">' + esc(p.receiptNo) + '</span>' },
        { label: 'For', html: p => { const s = DB.get('sales', p.saleId); return esc(s ? Biz.unitLabel(s.unitId) : ''); } },
        { label: 'Method', html: p => esc(p.method) },
        { label: 'Amount', cls: 'num', html: p => U.money(p.amount), sort: p => p.amount },
        { label: '', cls: 'r', html: p => UI.btn('', 'receipt', { small: true, kind: 'ghost', icon: 'print', data: { id: p.id }, title: 'Print receipt' }) }
      ]
    }) : UI.empty('No payments yet', '', '', 'receipt');

    const actions = [];
    actions.push('<a class="btn" href="tel:' + esc(c.phone) + '">' + icon('phone', 15) + '<span>Call</span></a>');
    if (money) actions.push(UI.btn('Statement', 'statement', { icon: 'print' }));
    if (Auth.can('clients.manage')) actions.push(UI.btn('Edit', 'edit', { icon: 'edit' }));
    if (Auth.can('sales.manage')) actions.push(UI.btn('New sale', 'sell', { icon: 'tag' }));
    if (Auth.can('payments.record') && cs.sales.length) actions.push(UI.btn('Record payment', 'pay', { icon: 'receipt', kind: 'primary' }));

    return {
      title: c.name,
      html: UI.header(c.name, esc(c.clientNo || '') + ' · ' + esc(c.type || 'Individual') + ' · client since ' + U.date(c.createdAt), actions.join(''), ['/clients', 'Clients']) +
        (money && cs.sales.length ? '<div class="stats">' + UI.stat('Total value', U.money(cs.value), U.plural(cs.sales.length, 'property', 'properties')) + UI.stat('Paid', U.money(cs.paid), U.pct(cs.paid, cs.value) + '% of total') +
          UI.stat('Balance', U.money(cs.balance), cs.balance > 0 ? 'still to pay' : 'nothing owed') + UI.stat('Overdue', U.money(cs.overdue), cs.overdue > 0 ? 'needs follow-up' : 'up to date', { tone: cs.overdue > 0 ? 'red' : 'green' }) + '</div>' : '') +
        '<div class="grid g-main"><div class="stack">' + UI.card('Properties', props) + (money ? UI.card('Payments', payHtml, { flush: true }) : '') + '</div>' +
        '<div class="stack">' + UI.card('Contact details', UI.kv([
          ['Phone', esc(c.phone)], ['Email', c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : ''], ['Address', esc(c.address)], ['Occupation', esc(c.occupation)],
          ['ID', esc(c.idNumber)], ['Next of kin', esc(c.nextOfKin) + (c.nextOfKinPhone ? ' · ' + esc(c.nextOfKinPhone) : '')], ['Came from', lead ? esc(lead.source) + ' enquiry' : ''], ['Notes', esc(c.notes)]
        ])) +
        (docs.length ? UI.card('Documents issued', '<div class="list">' + docs.map(d => '<div class="list-item"><span class="dot-ic">' + icon('doc', 15) + '</span><div class="grow"><div class="t">' + esc(d.type) + '</div><div class="s">' + esc(d.number) + ' · ' + U.date(d.date) + '</div></div></div>').join('') + '</div>') : '') +
        '</div></div>',
      actions: {
        edit: () => editClient(c),
        sell: () => App.go('/sales?new=1&client=' + c.id),
        pay: () => Pay.record({ clientId: c.id }),
        statement: () => Docs.statement(c.id),
        receipt: (id, el) => Docs.receipt(el.dataset.id, true)
      }
    };
  });

  /* ============ Sales ============ */
  async function newSale(preset) {
    preset = preset || {};
    const lead = preset.lead && DB.get('leads', preset.lead);
    const unit0 = preset.unit && DB.get('units', preset.unit);
    const values = {
      clientMode: preset.client ? 'existing' : (lead ? 'new' : 'existing'),
      clientId: preset.client || '',
      name: lead ? lead.name : '', phone: lead ? lead.phone : '', email: lead ? lead.email : '',
      projectId: unit0 ? unit0.projectId : (lead ? lead.projectId : ''),
      unitId: unit0 ? unit0.id : '',
      plan: 'instalment', depositPct: 30, months: 12, startDate: U.today(), discount: 0,
      salesPersonId: Auth.user.role.startsWith('sales') ? Auth.user.id : (lead ? lead.assignedTo : '')
    };
    const unitPrice = v => { const u = DB.get('units', v.unitId); return u ? u.price : 0; };
    const v = await UI.form({
      title: 'New sale', size: 'lg', values,
      fields: [
        { type: 'section', label: 'Buyer' },
        { name: 'clientMode', label: 'Buyer is', type: 'select', options: [['existing', 'An existing client'], ['new', 'A new client']], placeholder: false, half: true },
        { name: 'clientId', label: 'Client', type: 'select', options: Biz.clientOptions, half: true, show: v => v.clientMode === 'existing', required: true },
        { name: 'name', label: 'Full name', half: true, show: v => v.clientMode === 'new', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', third: true, show: v => v.clientMode === 'new', required: true },
        { name: 'email', label: 'Email', type: 'email', third: true, show: v => v.clientMode === 'new' },
        { name: 'address', label: 'Address', third: true, show: v => v.clientMode === 'new' },
        { type: 'section', label: 'Property' },
        { name: 'projectId', label: 'Project', type: 'select', required: true, half: true, options: () => Biz.projectOptions(p => DB.filter('units', u => u.projectId === p.id && u.status === 'available').length > 0) },
        { name: 'unitId', label: 'Unit', type: 'select', required: true, half: true, dependsOn: ['projectId'],
          options: v => U.sortBy(DB.filter('units', u => u.projectId === v.projectId && (u.status === 'available' || u.id === values.unitId)), u => u.type + u.code).map(u => [u.id, u.code + ' · ' + u.type + ' · ' + U.moneyShort(u.price)]) },
        { name: 'discount', label: 'Discount (needs MD approval)', type: 'money', half: true },
        { name: 'salesPersonId', label: 'Sales person', type: 'select', options: salesStaff, half: true, required: true },
        { type: 'section', label: 'Payment plan' },
        { name: 'plan', label: 'Plan', type: 'select', options: [['outright', 'Outright (one payment)'], ['instalment', 'Instalments']], placeholder: false, third: true },
        { name: 'depositPct', label: 'Initial deposit (%)', type: 'number', min: 0, max: 100, third: true, show: v => v.plan === 'instalment' },
        { name: 'months', label: 'Spread over (months)', type: 'select', options: [3, 6, 9, 12, 18, 24, 36].map(n => [n, n + ' months']), placeholder: false, third: true, show: v => v.plan === 'instalment' },
        { name: 'startDate', label: 'First payment due', type: 'date', third: true, required: true },
        { type: 'note', name: 'summary', html: v => {
          const lp = unitPrice(v);
          if (!lp) return '';
          const price = lp - (Number(v.discount) || 0);
          const sch = Biz.buildSchedule({ price, plan: v.plan, depositPct: v.depositPct, months: Number(v.months), startDate: v.startDate });
          return '<b>' + U.money(price) + '</b>' + (v.discount ? ' <span class="muted">(list ' + U.money(lp) + ' less ' + U.money(v.discount) + ' discount)</span>' : '') + '<br>' +
            (v.plan === 'instalment' && sch.length > 1 ? 'Deposit of ' + U.money(sch[0].amount) + ' on ' + U.date(sch[0].due) + ', then ' + (sch.length - 1) + ' monthly payments of about ' + U.money(sch[1].amount) + '.' : 'One payment of ' + U.money(price) + ' due ' + U.date(v.startDate) + '.') +
            (v.discount ? '<br><span class="tone-amber">The unit will be reserved until the MD approves the discount.</span>' : '');
        } },
        { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 }
      ],
      validate: v => {
        const lp = unitPrice(v);
        if (v.discount >= lp) return 'The discount can’t be more than the price.';
        if (v.plan === 'instalment' && (v.depositPct === '' || v.depositPct < 0 || v.depositPct > 100)) return 'Deposit must be between 0 and 100%.';
        if (v.clientMode === 'new' && DB.find('clients', c => U.phoneIntl(c.phone) === U.phoneIntl(v.phone))) return 'A client with this phone number already exists. Choose “An existing client” instead.';
      }
    });
    if (!v) return;
    let clientId = v.clientId;
    if (v.clientMode === 'new') {
      const c = DB.insert('clients', { clientNo: nextClientNo(), name: v.name, phone: v.phone, email: v.email, address: v.address, type: 'Individual' });
      clientId = c.id;
      DB.log('Added client ' + c.name);
    }
    const unit = DB.get('units', v.unitId);
    const listPrice = unit.price;
    const discount = Number(v.discount) || 0;
    const price = listPrice - discount;
    const months = v.plan === 'instalment' ? Number(v.months) : 0;
    const sale = DB.insert('sales', {
      number: DB.nextNumber('SL'), clientId, unitId: unit.id, projectId: unit.projectId, listPrice, discount, price,
      plan: v.plan, depositPct: v.plan === 'instalment' ? Number(v.depositPct) : 0, months, startDate: v.startDate, date: U.today(),
      schedule: Biz.buildSchedule({ price, plan: v.plan, depositPct: v.depositPct, months, startDate: v.startDate }),
      status: discount ? 'pending' : 'active', salesPersonId: v.salesPersonId, notes: v.notes
    });
    DB.update('units', unit.id, { status: discount ? 'reserved' : 'sold', clientId, saleId: sale.id });
    if (discount) {
      const a = Biz.request({ type: 'discount', refId: sale.id, title: 'Discount on ' + unit.code + ' for ' + Biz.clientName(clientId), amount: discount, details: 'List price ' + U.money(listPrice) + ', asking ' + U.money(price) + '. ' + (v.notes || '') });
      DB.update('sales', sale.id, { approvalId: a.id });
    }
    if (lead) DB.update('leads', lead.id, { stage: 'Won', clientId, history: (lead.history || []).concat([{ at: Date.now(), by: Auth.user.id, text: 'Converted to sale ' + sale.number }]) });
    DB.log('New sale ' + sale.number + ': ' + unit.code + ' to ' + Biz.clientName(clientId) + ' for ' + U.money(price));
    UI.toast(discount ? 'Sale saved and sent to the MD for discount approval' : 'Sale recorded');
    App.go('/sales/' + sale.id);
  }

  Biz.registerApproval('discount', {
    link: a => '/sales/' + a.refId,
    onApproved: a => {
      const s = DB.get('sales', a.refId);
      if (!s) return;
      DB.update('sales', s.id, { status: 'active' });
      DB.update('units', s.unitId, { status: 'sold' });
    },
    onRejected: a => {
      const s = DB.get('sales', a.refId);
      if (!s) return;
      DB.update('sales', s.id, { status: 'cancelled', cancelReason: 'Discount not approved' });
      DB.update('units', s.unitId, { status: 'available', clientId: null, saleId: null });
    }
  });

  Biz.registerApproval('refund', {
    link: a => '/sales/' + a.refId,
    onApproved: a => {
      const s = DB.get('sales', a.refId);
      if (!s) return;
      DB.update('sales', s.id, { status: 'cancelled', cancelReason: (s.refundRequest && s.refundRequest.reason) || 'Refunded', cancelledAt: Date.now(), refundRequest: Object.assign({}, s.refundRequest, { approved: true, paid: false }) });
      DB.update('units', s.unitId, { status: 'available', clientId: null, saleId: null });
    },
    onRejected: a => {
      const s = DB.get('sales', a.refId);
      if (s) DB.update('sales', s.id, { refundRequest: Object.assign({}, s.refundRequest, { rejected: true }) });
    }
  });

  App.route('/sales', 'sales.view', (p, q) => {
    const money = Auth.can('payments.view');
    const rows = U.sortBy(Biz.visibleSales(), s => s.date + s.number, true).map(s => Object.assign({ _s: Biz.saleStats(s) }, s));
    const live = rows.filter(r => r.status !== 'cancelled');
    const year = String(new Date().getFullYear());
    const ytd = live.filter(r => (r.date || '').startsWith(year));
    return {
      title: 'Sales',
      html: UI.header('Sales', isSalesExec() ? 'Sales you have made' : 'Every property sold, with payment progress', Auth.can('sales.manage') ? UI.btn('New sale', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        '<div class="stats">' + UI.stat('Sold this year', U.moneyShort(U.sum(ytd, r => r.price)), U.plural(ytd.length, 'unit')) +
        (money ? UI.stat('Collected on these', U.moneyShort(U.sum(live, r => r._s.paid)), U.pct(U.sum(live, r => r._s.paid), U.sum(live, r => r.price)) + '% of all sales value') +
          UI.stat('Outstanding', U.moneyShort(U.sum(live, r => r._s.balance)), U.plural(live.filter(r => r._s.balance > 0).length, 'sale') + ' with a balance') : '') +
        UI.stat('Awaiting approval', U.num(rows.filter(r => r.status === 'pending').length), 'discounts with the MD', { href: '/approvals' }) + '</div>' +
        UI.table({
          id: 'sales', rows, noun: 'sale', rowAction: 'open', search: s => s.number + ' ' + Biz.clientName(s.clientId) + ' ' + Biz.unitLabel(s.unitId), searchPlaceholder: 'Search client, unit or sale number',
          filters: [
            { key: 'pr', label: 'Any project', options: Biz.projectOptions(), value: s => s.projectId },
            { key: 'st', label: 'Any status', options: ['On track', 'Overdue', 'Fully paid', 'Pending approval', 'Cancelled'], value: s => s._s.status, selected: q.status },
            !isSalesExec() ? { key: 'sp', label: 'Any sales person', options: salesStaff(), value: s => s.salesPersonId } : null,
            { key: 'yr', label: 'Any year', options: [...new Set(rows.map(r => (r.date || '').slice(0, 4)))].sort().reverse(), value: s => (s.date || '').slice(0, 4) }
          ].filter(Boolean),
          columns: [
            { label: 'Sale', html: s => '<span class="cell-main">' + esc(s.number) + '</span><div class="cell-sub">' + U.date(s.date) + '</div>', sort: s => s.date },
            { label: 'Client', html: s => esc(Biz.clientName(s.clientId)), sort: s => Biz.clientName(s.clientId) },
            { label: 'Property', html: s => { const u = DB.get('units', s.unitId); return esc(u ? u.code : '') + '<div class="cell-sub">' + esc(Biz.projectName(s.projectId)) + '</div>'; }, sort: s => Biz.unitLabel(s.unitId) },
            { label: 'Price', cls: 'num', html: s => U.money(s.price), sort: s => s.price },
            money ? { label: 'Paid', html: s => '<div style="min-width:90px">' + UI.progress(s._s.pct, s._s.status === 'Overdue' ? 'red' : s._s.pct >= 100 ? 'green' : '') + '<div class="cell-sub">' + s._s.pct + '%</div></div>', sort: s => s._s.pct } : null,
            { label: 'Status', html: s => UI.badge(s._s.status), sort: s => s._s.status },
            !isSalesExec() ? { label: 'By', html: s => '<span class="cell-sub">' + esc(Biz.staffName(s.salesPersonId)) + '</span>', sort: s => Biz.staffName(s.salesPersonId) } : null
          ].filter(Boolean),
          empty: UI.empty('No sales yet', '', '', 'tag')
        }),
      actions: { add: () => newSale(), open: id => App.go('/sales/' + id) },
      mount: () => {
        if (q.new && Auth.can('sales.manage')) { history.replaceState(null, '', '#/sales'); newSale({ unit: q.unit, client: q.client, lead: q.lead }); }
        if (q.status) UI.applyFilters('sales');
      }
    };
  });

  App.route('/sales/:id', 'sales.view', params => {
    const s = DB.get('sales', params.id);
    if (!s || (isSalesExec() && s.salesPersonId !== Auth.user.id)) return { html: UI.empty('Sale not found', '') };
    const money = Auth.can('payments.view');
    const st = Biz.saleStats(s);
    const unit = DB.get('units', s.unitId);
    const client = DB.get('clients', s.clientId);
    const appr = s.approvalId && DB.get('approvals', s.approvalId);
    const refundAppr = s.refundRequest && s.refundRequest.approvalId && DB.get('approvals', s.refundRequest.approvalId);

    let cum = 0;
    const sched = '<table class="tbl-plain sched"><tr><th>Item</th><th>Due</th><th class="num">Amount</th><th></th></tr>' + (s.schedule || []).map(x => {
      cum += x.amount;
      const paid = st.paid + 0.5 >= cum;
      const state = paid ? UI.badge('Paid') : x.due < U.today() ? UI.badge('Overdue') : (st.next && st.next.due === x.due ? UI.badge('Next', 'accent') : '');
      return '<tr><td class="' + (paid ? 'paid' : '') + '">' + esc(x.label) + '</td><td class="' + (paid ? 'paid' : '') + '">' + U.date(x.due) + '</td><td class="num ' + (paid ? 'paid' : '') + '">' + U.money(x.amount) + '</td><td class="r">' + state + '</td></tr>';
    }).join('') + '</table>';

    const payHtml = st.payments.length ? '<div class="list">' + st.payments.slice().reverse().map(p => '<div class="list-item"><span class="dot-ic">' + icon('receipt', 15) + '</span><div class="grow"><div class="t">' + U.money(p.amount) + '</div><div class="s">' + U.date(p.date) + ' · ' + esc(p.receiptNo) + ' · ' + esc(p.method || '') + '</div></div>' + UI.btn('', 'receipt', { small: true, kind: 'ghost', icon: 'print', data: { id: p.id }, title: 'Print receipt' }) + '</div>').join('') + '</div>' : UI.empty('No payments yet', '', '', 'receipt');

    const callouts = [];
    if (s.status === 'pending') callouts.push('<div class="callout">' + icon('stamp', 17) + '<div><b>Waiting for discount approval.</b> ' + (appr ? Biz.approvalLabel(appr) + '. ' : '') + 'The unit is reserved until a decision is made.' + (appr && Biz.canActOn(appr) ? ' <a href="#/approvals">Review it now</a>.' : '') + '</div></div>');
    if (s.status === 'cancelled') callouts.push('<div class="callout red">' + icon('x', 17) + '<div><b>This sale was cancelled.</b> ' + esc(s.cancelReason || '') + '</div></div>');
    if (refundAppr && refundAppr.status === 'pending') callouts.push('<div class="callout">' + icon('stamp', 17) + '<div><b>Refund of ' + U.money(refundAppr.amount) + ' requested.</b> ' + Biz.approvalLabel(refundAppr) + '.</div></div>');
    if (s.refundRequest && s.refundRequest.approved && !s.refundRequest.paid && Auth.can('payments.record')) callouts.push('<div class="callout">' + icon('cash', 17) + '<div><b>Refund approved.</b> Pay ' + U.money(s.refundRequest.amount) + ' to the client, then record it. <button class="btn btn-sm" data-action="payRefund">Record refund paid</button></div></div>');

    const actions = [];
    if (s.status === 'active') {
      if (money && st.balance > 0) actions.push(UI.btn('Remind', 'remind', { icon: 'whatsapp' }));
      if (money) actions.push(UI.btn('Schedule', 'schedule', { icon: 'print' }));
      if (Auth.can('documents.issue')) {
        actions.push(UI.btn(s.offerNo ? 'Offer letter' : 'Issue offer letter', 'offer', { icon: 'doc' }));
        actions.push(UI.btn(s.allocationNo ? 'Allocation letter' : 'Issue allocation', 'alloc', { icon: 'key' }));
      }
      if (Auth.can('refunds.request') && st.paid > 0 && !(refundAppr && refundAppr.status === 'pending')) actions.push(UI.btn('Cancel & refund', 'refund', { icon: 'x', kind: 'ghost-danger' }));
      if (Auth.can('payments.record') && st.balance > 0) actions.push(UI.btn('Record payment', 'pay', { icon: 'receipt', kind: 'primary' }));
    }
    if (s.status === 'pending' && Auth.can('sales.manage')) actions.push(UI.btn('Withdraw sale', 'withdraw', { kind: 'ghost-danger', icon: 'x' }));

    return {
      title: 'Sale ' + s.number,
      html: UI.header(unit.type + ' · ' + unit.code, esc(s.number) + ' · ' + esc(Biz.projectName(s.projectId)) + ' · ' + UI.badge(st.status), actions.join(''), ['/sales', 'Sales']) +
        callouts.join('') +
        (money ? '<div class="stats">' + UI.stat('Price', U.money(s.price), s.discount ? 'after ' + U.money(s.discount) + ' discount' : (s.plan === 'instalment' ? s.months + '-month plan' : 'Outright')) +
          UI.stat('Paid', U.money(st.paid), UI.progress(st.pct, st.pct >= 100 ? 'green' : '')) +
          UI.stat('Balance', U.money(st.balance), st.next ? (st.overdue > 0 ? 'Oldest unpaid: ' : 'Next: ') + U.money(st.next.amount) + ' due ' + U.date(st.next.due) : 'Nothing more to pay') +
          UI.stat('Overdue', U.money(st.overdue), st.overdue > 0 ? 'Behind schedule' : 'Up to date', { tone: st.overdue > 0 ? 'red' : 'green' }) + '</div>' : '') +
        '<div class="grid g-main"><div class="stack">' + (money ? UI.card('Payment schedule', sched) : '') + (money ? UI.card('Payments received', payHtml) : '') + (!money ? UI.card('Sale details', UI.kv([['Price', U.money(s.price)], ['Plan', s.plan === 'instalment' ? s.months + ' monthly instalments' : 'Outright']])) : '') + '</div>' +
        '<div class="stack">' + UI.card('Buyer', '<div class="who mb">' + UI.avatar(client.name, 40) + '<span><a class="cell-main" href="#/clients/' + client.id + '">' + esc(client.name) + '</a><span class="cell-sub">' + esc(client.phone || '') + '</span></span></div>' +
          UI.kv([['Sale date', U.date(s.date)], ['Sales person', esc(Biz.staffName(s.salesPersonId))], ['List price', U.money(s.listPrice)], ['Discount', s.discount ? U.money(s.discount) : 'None'],
            ['Offer letter', s.offerNo ? esc(s.offerNo) + ' · ' + U.date(s.offerDate) : 'Not issued'], ['Allocation', s.allocationNo ? esc(s.allocationNo) + ' · ' + U.date(s.allocationDate) : 'Not issued'],
            ['Unit status', UI.badge({ available: 'Available', reserved: 'Reserved', sold: 'Sold', handed_over: 'Handed over' }[unit.status])],
            (s.reminders || []).length ? ['Last reminder', U.ago(s.reminders[s.reminders.length - 1].at) + ' by ' + s.reminders[s.reminders.length - 1].via] : null,
            ['Notes', esc(s.notes)]])) + '</div></div>',
      actions: {
        pay: () => Pay.record({ saleId: s.id }),
        receipt: (id, el) => Docs.receipt(el.dataset.id, true),
        schedule: () => Docs.schedule(s.id),
        offer: () => { Docs.offer(s.id); setTimeout(App.refresh, 400); },
        alloc: async () => {
          if (!s.allocationNo && st.balance > 0.5 && !(await UI.confirm('This property still has ' + U.money(st.balance) + ' unpaid. Allocation letters are normally issued after full payment. Issue it anyway?', { ok: 'Issue anyway' }))) return;
          Docs.allocation(s.id); setTimeout(App.refresh, 400);
        },
        remind: () => Remind.open(s),
        withdraw: async () => {
          if (!(await UI.confirm('Withdraw this sale? The unit becomes available again.', { danger: true, ok: 'Withdraw' }))) return;
          DB.update('sales', s.id, { status: 'cancelled', cancelReason: 'Withdrawn before approval' });
          DB.update('units', s.unitId, { status: 'available', clientId: null, saleId: null });
          if (appr && appr.status === 'pending') DB.update('approvals', appr.id, { status: 'rejected', steps: appr.steps.map(x => x.status === 'pending' ? Object.assign(x, { status: 'rejected', by: Auth.user.id, at: Date.now(), note: 'Withdrawn' }) : x) });
          DB.log('Withdrew sale ' + s.number); App.refresh();
        },
        refund: async () => {
          const v = await UI.form({
            title: 'Cancel sale and refund', size: 'sm', values: { amount: Math.round(st.paid * 0.9) },
            intro: 'The client has paid ' + U.money(st.paid) + '. The refund goes to the MD' + (st.paid * 0.9 >= Biz.limits().chairmanFrom ? ' and Chairman' : '') + ' for approval. The unit is released once it’s approved.',
            fields: [{ name: 'amount', label: 'Amount to refund', type: 'money', required: true, hint: 'Pre-filled with 90% (10% administrative charge).' }, { name: 'reason', label: 'Reason', type: 'textarea', required: true }],
            validate: v => v.amount > st.paid ? 'You can’t refund more than the client has paid.' : null
          });
          if (!v) return;
          const a = Biz.request({ type: 'refund', refId: s.id, title: 'Refund to ' + client.name + ' (sale cancelled)', amount: v.amount, details: v.reason + ' Paid ' + U.money(st.paid) + '.' });
          DB.update('sales', s.id, { refundRequest: { approvalId: a.id, amount: v.amount, reason: v.reason } });
          UI.toast('Refund sent for approval'); App.refresh();
        },
        payRefund: () => Pay.recordRefund(s)
      }
    };
  });

  window.SalesUI = { newSale, editClient, editLead, nextClientNo };
})();
