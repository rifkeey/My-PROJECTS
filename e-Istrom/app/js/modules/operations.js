/* e-Istrom — Estate management, vehicles, stores & inventory */
(function () {
  const esc = U.esc, icon = UI.icon;

  /* ============ Estate management ============ */
  const CATEGORIES = ['Plumbing', 'Electrical', 'Power supply', 'Water supply', 'Generator', 'Security', 'Cleaning', 'Roads & drainage', 'Landscaping', 'Pest control', 'Noise / neighbours', 'Other'];
  const managedEstates = () => U.sortBy(DB.filter('projects', p => p.managed), p => p.name);
  const facilityStaff = () => Biz.activeStaff().filter(s => s.role === 'facility' || s.department === 'Facility Management').map(s => [s.id, s.name]);
  const billPaid = b => U.sum(b.payments || [], p => p.amount);
  const billStatus = b => { const p = billPaid(b); return p >= b.amount ? 'Paid' : p > 0 ? 'Partly paid' : (b.dueDate && b.dueDate < U.today() ? 'Overdue' : 'Pending'); };

  async function logComplaint() {
    const v = await UI.form({
      title: 'Log a complaint', values: { priority: 'Normal', channel: 'Phone call' },
      fields: [
        { name: 'projectId', label: 'Estate', type: 'select', options: () => managedEstates().map(p => [p.id, p.name]), required: true, half: true },
        { name: 'unitId', label: 'House / unit', type: 'select', half: true, dependsOn: ['projectId'], placeholder: 'Common area / not specific', options: v => U.sortBy(DB.filter('units', u => u.projectId === v.projectId && u.status !== 'available'), u => u.code).map(u => [u.id, u.code + (u.clientId ? ' · ' + Biz.clientName(u.clientId) : '')]) },
        { name: 'reporter', label: 'Reported by', required: true, half: true },
        { name: 'phone', label: 'Their phone', type: 'tel', half: true },
        { name: 'category', label: 'Category', type: 'select', options: CATEGORIES, required: true, third: true },
        { name: 'priority', label: 'Priority', type: 'select', options: ['Normal', 'High', 'Urgent'], placeholder: false, third: true },
        { name: 'channel', label: 'Received by', type: 'select', options: ['Phone call', 'WhatsApp', 'Walk-in', 'Website form', 'Email'], placeholder: false, third: true },
        { name: 'description', label: 'What’s the problem?', type: 'textarea', required: true },
        { name: 'assignedTo', label: 'Assign to', type: 'select', options: facilityStaff, show: () => Auth.can('estates.manage'), placeholder: 'Assign later' }
      ],
      onChange: (v, form, changed) => {
        if (changed === 'unitId' && v.unitId) {
          const u = DB.get('units', v.unitId);
          const c = u && DB.get('clients', u.clientId);
          if (c) { form.elements.reporter.value = c.name; form.elements.phone.value = c.phone || ''; }
        }
      }
    });
    if (!v) return;
    const c = DB.insert('complaints', Object.assign(v, { ticketNo: DB.nextNumber('CMP'), status: v.assignedTo ? 'In progress' : 'Open', notes: [] }));
    DB.log('Logged complaint ' + c.ticketNo + ' (' + v.category + ') at ' + Biz.projectName(v.projectId));
    UI.toast('Complaint ' + c.ticketNo + ' logged');
    App.refresh();
  }

  function openComplaint(id) {
    const c = DB.get('complaints', id);
    if (!c) return;
    const manage = Auth.can('estates.manage');
    const msg = 'Hello ' + c.reporter + ', this is Istrom Facility Management about your complaint ' + c.ticketNo + ' (' + c.category + '). ';
    UI.modal({
      title: c.category + ' · ' + Biz.projectName(c.projectId), size: 'md',
      body: '<div class="row mb">' + UI.badge(c.status) + UI.badge(c.priority === 'Normal' ? '' : c.priority) + '<span class="muted">' + esc(c.ticketNo) + ' · ' + U.ago(c.createdAt) + '</span></div>' +
        '<p style="margin-top:0">' + esc(c.description) + '</p>' +
        UI.kv([['Unit', c.unitId ? esc(Biz.unitLabel(c.unitId)) : 'Common area'], ['Reported by', esc(c.reporter) + (c.phone ? ' · <a href="tel:' + esc(c.phone) + '">' + esc(c.phone) + '</a>' : '')], ['Received by', esc(c.channel)], ['Assigned to', c.assignedTo ? esc(Biz.staffName(c.assignedTo)) : 'Not yet'], c.resolvedAt ? ['Resolved', U.dateTime(c.resolvedAt) + ' (' + Math.max(1, Math.round((c.resolvedAt - c.createdAt) / 3600000)) + ' hours)'] : null]) +
        ((c.notes || []).length ? '<div class="hr"></div><div class="list">' + c.notes.map(n => '<div class="list-item"><div class="grow"><div style="font-size:13.5px">' + esc(n.text) + '</div><div class="s">' + esc(Biz.staffName(n.by)) + ' · ' + U.dateTime(n.at) + '</div></div></div>').join('') + '</div>' : ''),
      foot: (c.phone ? '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + U.phoneIntl(c.phone) + '?text=' + encodeURIComponent(msg) + '">' + icon('whatsapp', 15) + 'Update resident</a>' : '') + '<span class="spacer"></span>' +
        (manage || c.assignedTo === Auth.user.id ? '<button class="btn" data-maction="note">Add note</button>' : '') +
        (manage ? '<button class="btn" data-maction="assign">Assign</button>' : '') +
        ((manage || c.assignedTo === Auth.user.id) && c.status !== 'Resolved' ? '<button class="btn btn-primary" data-maction="resolve">' + icon('check', 15) + 'Resolved</button>' : '') +
        (manage && c.status === 'Resolved' ? '<button class="btn" data-maction="reopen">Reopen</button>' : ''),
      actions: {
        note: async (a, close) => {
          close();
          const v = await UI.form({ title: 'Add note', size: 'sm', fields: [{ name: 'text', label: 'Note', type: 'textarea', required: true, placeholder: 'e.g. Plumber visited, waiting for parts' }] });
          if (!v) return;
          DB.update('complaints', c.id, { notes: (c.notes || []).concat([{ at: Date.now(), by: Auth.user.id, text: v.text }]), status: c.status === 'Open' ? 'In progress' : c.status });
          App.refresh(); openComplaint(c.id);
        },
        assign: async (a, close) => {
          close();
          const v = await UI.form({ title: 'Assign complaint', size: 'sm', values: { to: c.assignedTo }, fields: [{ name: 'to', label: 'Assign to', type: 'select', options: facilityStaff, required: true }] });
          if (!v) return;
          DB.update('complaints', c.id, { assignedTo: v.to, status: c.status === 'Open' ? 'In progress' : c.status, notes: (c.notes || []).concat([{ at: Date.now(), by: Auth.user.id, text: 'Assigned to ' + Biz.staffName(v.to) }]) });
          App.refresh();
        },
        resolve: async (a, close) => {
          close();
          const v = await UI.form({ title: 'Mark as resolved', size: 'sm', fields: [{ name: 'text', label: 'What was done?', type: 'textarea', required: true }] });
          if (!v) return;
          DB.update('complaints', c.id, { status: 'Resolved', resolvedAt: Date.now(), notes: (c.notes || []).concat([{ at: Date.now(), by: Auth.user.id, text: 'Resolved: ' + v.text }]) });
          DB.log('Resolved complaint ' + c.ticketNo);
          App.refresh();
        },
        reopen: (a, close) => { close(); DB.update('complaints', c.id, { status: 'In progress', resolvedAt: null }); App.refresh(); }
      }
    });
  }

  async function generateBills() {
    const year = String(new Date().getFullYear());
    const v = await UI.form({
      title: 'Generate service charge bills', size: 'sm', values: { period: year, dueDate: year + '-03-31' },
      intro: 'Creates a bill for every occupied unit in the estates Istrom manages, using each estate’s yearly charge. Units already billed for the period are skipped.',
      fields: [
        { name: 'projectId', label: 'Estate', type: 'select', options: () => managedEstates().map(p => [p.id, p.name + ' · ' + U.money(p.serviceCharge || 0)]), placeholder: 'All managed estates' },
        { name: 'period', label: 'Period', required: true, half: true, placeholder: 'e.g. 2027' },
        { name: 'dueDate', label: 'Due by', type: 'date', required: true, half: true }
      ]
    });
    if (!v) return;
    let n = 0, skipped = [];
    managedEstates().filter(p => !v.projectId || p.id === v.projectId).forEach(p => {
      if (!p.serviceCharge) { skipped.push(p.name); return; }
      DB.filter('units', u => u.projectId === p.id && u.status !== 'available').forEach(u => {
        if (DB.find('bills', b => b.unitId === u.id && b.period === v.period)) return;
        DB.insert('bills', { number: DB.nextNumber('SC'), projectId: p.id, unitId: u.id, clientId: u.clientId || null, period: v.period, amount: p.serviceCharge, date: U.today(), dueDate: v.dueDate, payments: [] }, { silent: true });
        n++;
      });
    });
    DB.save('bills');
    DB.log('Generated ' + n + ' service charge bills for ' + v.period);
    UI.toast(U.plural(n, 'bill') + ' created' + (skipped.length ? '. No charge set for: ' + skipped.join(', ') : ''));
    App.go('/estates?tab=charges');
  }

  async function payBill(b) {
    const bal = b.amount - billPaid(b);
    const v = await UI.form({
      title: 'Record service charge payment', size: 'sm', values: { amount: bal, date: U.today(), method: 'Bank transfer' },
      intro: esc(Biz.unitFull(b.unitId)) + '<br>Balance: <b>' + U.money(bal) + '</b>',
      fields: [
        { name: 'amount', label: 'Amount', type: 'money', required: true, half: true },
        { name: 'date', label: 'Date', type: 'date', required: true, half: true },
        { name: 'method', label: 'Method', type: 'select', options: Biz.PAY_METHODS, placeholder: false, half: true },
        { name: 'ref', label: 'Bank reference', half: true }
      ],
      validate: v => v.amount > bal + 0.5 ? 'That’s more than the balance.' : null
    });
    if (!v) return;
    DB.update('bills', b.id, { payments: (b.payments || []).concat([Object.assign(v, { by: Auth.user.id })]) });
    DB.log('Service charge payment ' + U.money(v.amount) + ' for ' + Biz.unitLabel(b.unitId));
    App.refresh();
  }

  App.route('/estates', 'estates.view', (p, q) => {
    const tab = q.tab || 'overview';
    const estates = managedEstates();
    const complaints = DB.all('complaints');
    const open = complaints.filter(c => c.status !== 'Resolved');
    const bills = DB.all('bills');
    const year = q.period || String(new Date().getFullYear());
    const yb = bills.filter(b => b.period === year);
    const resolved = complaints.filter(c => c.resolvedAt);
    const avgHrs = resolved.length ? Math.round(U.sum(resolved, c => (c.resolvedAt - c.createdAt) / 3600000) / resolved.length) : 0;
    const scView = Auth.canAny('servicecharge.manage', 'estates.manage');

    let body = '';
    if (tab === 'overview') {
      body = estates.length ? '<div class="projects">' + estates.map(e => {
        const eo = open.filter(c => c.projectId === e.id);
        const eb = yb.filter(b => b.projectId === e.id);
        const due = U.sum(eb, b => b.amount), got = U.sum(eb, billPaid);
        const occ = DB.filter('units', u => u.projectId === e.id && u.status !== 'available').length;
        return '<article class="pcard" data-href="/estates?tab=complaints&estate=' + e.id + '"><div class="pcard-body">' +
          '<div class="split"><h3>' + esc(e.name) + '</h3>' + (eo.some(c => c.priority === 'Urgent') ? UI.badge('Urgent') : '') + '</div><div class="loc">' + icon('pin', 13) + esc(e.location) + ' · ' + U.plural(occ, 'home') + '</div>' +
          '<div class="nums"><span>Open complaints</span><b>' + eo.length + '</b></div>' +
          (scView ? '<div><div class="nums"><span>Service charge ' + year + '</span><b>' + U.pct(got, due) + '%</b></div>' + UI.progress(U.pct(got, due), 'green') + '<div class="nums" style="margin-top:4px"><span>' + U.moneyShort(got) + ' of ' + U.moneyShort(due) + '</span><span>' + U.money(e.serviceCharge || 0) + '/yr</span></div></div>' : '') +
          '</div></article>';
      }).join('') + '</div>' : UI.empty('No managed estates', 'Mark a completed project as “managed by Istrom” in Projects to look after it here.', '', 'key');
    }
    if (tab === 'complaints') {
      body = UI.table({
        id: 'cmp', rows: U.sortBy(complaints, c => (c.status === 'Resolved' ? 0 : 1e15) + c.createdAt, true), noun: 'complaint', rowAction: 'open', search: c => c.ticketNo + ' ' + c.reporter + ' ' + c.description + ' ' + (c.unitId ? Biz.unitLabel(c.unitId) : ''),
        filters: [
          { key: 'e', label: 'Any estate', options: estates.map(e => [e.id, e.name]), value: c => c.projectId, selected: q.estate },
          { key: 's', label: 'Any status', options: ['Open', 'In progress', 'Resolved'], value: c => c.status, selected: q.estate ? '' : undefined },
          { key: 'c', label: 'Any category', options: CATEGORIES, value: c => c.category },
          { key: 'a', label: 'Anyone', options: facilityStaff(), value: c => c.assignedTo || '' }
        ],
        columns: [
          { label: 'Complaint', html: c => '<span class="cell-main">' + esc(c.category) + '</span><div class="cell-sub">' + esc(c.ticketNo) + ' · ' + esc(c.description.slice(0, 60)) + (c.description.length > 60 ? '…' : '') + '</div>', sort: c => c.category },
          { label: 'Where', html: c => esc(Biz.projectName(c.projectId)) + '<div class="cell-sub">' + (c.unitId ? esc(Biz.unitLabel(c.unitId)) : 'Common area') + '</div>', sort: c => Biz.projectName(c.projectId) },
          { label: 'Reported by', html: c => esc(c.reporter) },
          { label: 'Priority', html: c => c.priority === 'Normal' ? '<span class="muted">Normal</span>' : UI.badge(c.priority), sort: c => ({ Urgent: 3, High: 2, Normal: 1 }[c.priority]) },
          { label: 'Status', html: c => UI.badge(c.status), sort: c => c.status },
          { label: 'Assigned', html: c => c.assignedTo ? esc(Biz.staffName(c.assignedTo)) : '<span class="muted">—</span>' },
          { label: 'Age', html: c => U.ago(c.createdAt), sort: c => c.createdAt }
        ],
        empty: UI.empty('No complaints', 'Residents’ complaints you log will appear here.', '', 'tool')
      });
    }
    if (tab === 'charges') {
      const periods = [...new Set(bills.map(b => b.period))].sort().reverse();
      body = (periods.length > 1 ? '<div class="row mb">' + periods.map(pp => '<a class="btn btn-sm ' + (pp === year ? 'btn-primary' : '') + '" href="#/estates?tab=charges&period=' + pp + '">' + pp + '</a>').join('') + '</div>' : '') +
        UI.table({
          id: 'sc', rows: U.sortBy(yb, b => Biz.projectName(b.projectId) + Biz.unitLabel(b.unitId)), noun: 'bill', search: b => b.number + ' ' + Biz.unitLabel(b.unitId) + ' ' + (b.clientId ? Biz.clientName(b.clientId) : ''),
          filters: [{ key: 'e', label: 'Any estate', options: estates.map(e => [e.id, e.name]), value: b => b.projectId }, { key: 's', label: 'Any status', options: ['Paid', 'Partly paid', 'Pending', 'Overdue'], value: b => billStatus(b) }],
          toolbar: UI.btn('Export', 'exportSc', { icon: 'download', small: true, kind: 'ghost' }),
          columns: [
            { label: 'Unit', html: b => '<span class="cell-main">' + esc(Biz.unitLabel(b.unitId)) + '</span><div class="cell-sub">' + esc(Biz.projectName(b.projectId)) + '</div>', sort: b => Biz.unitLabel(b.unitId) },
            { label: 'Owner', html: b => b.clientId ? esc(Biz.clientName(b.clientId)) : '<span class="muted">—</span>' },
            { label: 'Bill', cls: 'num', html: b => U.money(b.amount) },
            { label: 'Paid', cls: 'num', html: b => U.money(billPaid(b)), sort: b => billPaid(b) },
            { label: 'Status', html: b => UI.badge(billStatus(b)), sort: b => billStatus(b) },
            { label: '', cls: 'r nowrap', html: b => UI.btn('', 'invoice', { small: true, kind: 'ghost', icon: 'print', data: { id: b.id }, title: 'Invoice' }) +
              (b.clientId && billStatus(b) !== 'Paid' ? ' ' + UI.btn('', 'remindSc', { small: true, kind: 'ghost', icon: 'whatsapp', data: { id: b.id }, title: 'Reminder' }) : '') +
              (Auth.can('servicecharge.manage') && billStatus(b) !== 'Paid' ? ' ' + UI.btn('Record payment', 'payBill', { small: true, data: { id: b.id } }) : '') }
          ],
          empty: UI.empty('No bills for ' + year, Auth.can('servicecharge.manage') ? 'Generate this year’s service charge bills for the estates you manage.' : '', '', 'receipt')
        });
    }

    const actions = [];
    if (Auth.can('complaints.log')) actions.push(UI.btn('Log complaint', 'add', { icon: 'plus', kind: tab === 'charges' ? '' : 'primary' }));
    if (Auth.can('servicecharge.manage')) actions.push(UI.btn('Generate bills', 'gen', { icon: 'receipt', kind: tab === 'charges' ? 'primary' : '' }));
    const tabs = [['overview', 'Estates', '#/estates'], ['complaints', 'Complaints (' + open.length + ' open)', '#/estates?tab=complaints']];
    if (scView) tabs.push(['charges', 'Service charges', '#/estates?tab=charges']);
    return {
      title: 'Estate management',
      html: UI.header('Estate management', U.plural(estates.length, 'estate') + ' managed by Istrom after handover', actions.join('')) +
        '<div class="stats">' + UI.stat('Open complaints', U.num(open.length), U.num(open.filter(c => c.priority === 'Urgent').length) + ' urgent', { tone: open.some(c => c.priority === 'Urgent') ? 'red' : '' }) +
        UI.stat('Resolved this month', U.num(resolved.filter(c => U.monthKey(c.resolvedAt) === U.today().slice(0, 7)).length), 'average fix time ' + (avgHrs > 48 ? Math.round(avgHrs / 24) + ' days' : avgHrs + ' hours')) +
        (scView ? UI.stat('Service charge ' + year, U.moneyShort(U.sum(yb, billPaid)), 'collected of ' + U.moneyShort(U.sum(yb, b => b.amount))) +
          UI.stat('Unpaid bills', U.num(yb.filter(b => billStatus(b) !== 'Paid').length), U.moneyShort(U.sum(yb, b => b.amount - billPaid(b))) + ' outstanding') : '') + '</div>' +
        UI.tabs(tabs, tab) + body,
      actions: {
        add: () => logComplaint(), open: id => openComplaint(id), gen: () => generateBills(),
        payBill: id => payBill(DB.get('bills', id)),
        invoice: id => Docs.serviceInvoice(id),
        remindSc: id => {
          const b = DB.get('bills', id), c = DB.get('clients', b.clientId);
          const t = 'Dear ' + c.name + ', this is a reminder that your ' + b.period + ' estate service charge of ' + U.money(b.amount - billPaid(b)) + ' for ' + Biz.unitLabel(b.unitId) + ', ' + Biz.projectName(b.projectId) + ' is outstanding. Please pay into the Istrom company account and send your proof of payment. Thank you.';
          window.open('https://wa.me/' + U.phoneIntl(c.phone) + '?text=' + encodeURIComponent(t), '_blank');
        },
        exportSc: () => U.download('service-charges-' + year + '.csv', U.csv(yb, [{ label: 'Bill', value: b => b.number }, { label: 'Estate', value: b => Biz.projectName(b.projectId) }, { label: 'Unit', value: b => Biz.unitLabel(b.unitId) }, { label: 'Owner', value: b => b.clientId ? Biz.clientName(b.clientId) : '' }, { label: 'Amount', value: b => b.amount }, { label: 'Paid', value: b => billPaid(b) }, { label: 'Status', value: b => billStatus(b) }]), 'text/csv')
      },
      mount: () => {
        if (q.new && Auth.can('complaints.log')) { history.replaceState(null, '', '#/estates?tab=complaints'); logComplaint(); }
        if (q.estate) UI.applyFilters('cmp');
      }
    };
  });

  /* ============ Vehicles ============ */
  async function editVehicle(v0) {
    const v = await UI.form({
      title: v0 ? 'Edit vehicle' : 'Add vehicle', values: Object.assign({ status: 'Available' }, v0 || {}, v0 ? { insurance: v0.papers.insurance, roadworthiness: v0.papers.roadworthiness, licence: v0.papers.licence, hackney: v0.papers.hackney } : {}),
      fields: [
        { name: 'plate', label: 'Plate number', required: true, third: true },
        { name: 'make', label: 'Make', required: true, third: true, placeholder: 'Toyota' },
        { name: 'model', label: 'Model', required: true, third: true, placeholder: 'Hilux' },
        { name: 'year', label: 'Year', type: 'number', third: true },
        { name: 'color', label: 'Colour', third: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Available', 'In use', 'Under repair', 'Sold / retired'], placeholder: false, third: true },
        { name: 'driverId', label: 'Usual driver / assigned to', type: 'select', options: Biz.staffOptions, half: true, placeholder: 'Pool vehicle' },
        { name: 'mileage', label: 'Odometer (km)', type: 'number', half: true },
        { type: 'section', label: 'Papers — expiry dates' },
        { name: 'insurance', label: 'Insurance', type: 'date', half: true }, { name: 'roadworthiness', label: 'Roadworthiness', type: 'date', half: true },
        { name: 'licence', label: 'Vehicle licence', type: 'date', half: true }, { name: 'hackney', label: 'Hackney permit (if any)', type: 'date', half: true }
      ]
    });
    if (!v) return;
    const rec = { plate: v.plate.toUpperCase(), make: v.make, model: v.model, year: v.year, color: v.color, status: v.status, driverId: v.driverId || null, mileage: v.mileage, papers: { insurance: v.insurance, roadworthiness: v.roadworthiness, licence: v.licence, hackney: v.hackney } };
    if (v0) DB.update('vehicles', v0.id, rec); else DB.insert('vehicles', rec);
    DB.log((v0 ? 'Updated' : 'Added') + ' vehicle ' + rec.plate);
    App.refresh();
  }

  async function logVehicle(veh, kind) {
    const titles = { trip: 'Log a trip', fuel: 'Log fuel', maintenance: 'Log a repair or service' };
    const v = await UI.form({
      title: titles[kind] + ' — ' + veh.plate, size: 'md', values: { date: U.today(), staffId: veh.driverId || Auth.user.id },
      fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, half: true },
        { name: 'staffId', label: kind === 'trip' ? 'Driver' : 'Done by', type: 'select', options: Biz.staffOptions, half: true },
        { name: 'purpose', label: kind === 'trip' ? 'Where to / why' : kind === 'fuel' ? 'Station' : 'What was done', required: kind !== 'fuel', placeholder: kind === 'maintenance' ? 'e.g. Oil change and brake pads' : '' },
        { name: 'litres', label: 'Litres', type: 'number', half: true, show: () => kind === 'fuel' },
        { name: 'cost', label: 'Cost', type: 'money', half: true, show: () => kind !== 'trip', required: kind !== 'trip' },
        { name: 'odometer', label: 'Odometer (km)', type: 'number', half: true },
        { name: 'vendorId', label: 'Vendor / mechanic', type: 'select', options: Biz.vendorOptions, half: true, show: () => kind !== 'trip', placeholder: 'Not listed' }
      ]
    });
    if (!v) return;
    const log = DB.insert('vehicleLogs', Object.assign(v, { vehicleId: veh.id, kind, purpose: v.purpose || (kind === 'fuel' ? 'Fuel' : '') }));
    if (v.odometer && v.odometer > (veh.mileage || 0)) DB.update('vehicles', veh.id, { mileage: v.odometer });
    if (kind !== 'trip' && v.cost > 0) {
      const e = Biz.createExpense({ description: (kind === 'fuel' ? 'Fuel' : v.purpose) + ' — ' + veh.plate, category: 'Fuel & vehicles', amount: v.cost, vendorId: v.vendorId || null, date: v.date });
      DB.update('vehicleLogs', log.id, { expenseId: e.id });
      UI.toast(e.status === 'pending' ? 'Logged and sent to the MD for approval' : 'Logged and added to Expenses');
    }
    App.refresh();
  }

  App.route('/vehicles', 'vehicles.view', (p, q) => {
    const vs = U.sortBy(DB.all('vehicles'), v => v.plate);
    const manage = Auth.can('vehicles.manage');
    const logs = DB.all('vehicleLogs');
    const month = U.today().slice(0, 7);
    const mlogs = logs.filter(l => l.date.startsWith(month));
    const sel = q.v && DB.get('vehicles', q.v);
    const paperBadges = v => Biz.PAPERS.map(([k, label]) => {
      const d = v.papers && v.papers[k];
      if (!d) return '';
      const days = U.daysBetween(U.today(), d);
      return days < 0 ? UI.badge(label + ' expired', 'red') : days <= 30 ? UI.badge(label + ' in ' + days + 'd', 'amber') : '';
    }).join(' ');

    let body = UI.table({
      rows: vs, noun: 'vehicle', rowAction: 'open',
      columns: [
        { label: 'Vehicle', html: v => '<span class="cell-main">' + esc(v.make + ' ' + v.model) + '</span><div class="cell-sub">' + esc(v.plate) + ' · ' + esc(v.color || '') + ' · ' + esc(v.year || '') + '</div>' },
        { label: 'Status', html: v => UI.badge(v.status) },
        { label: 'Driver', html: v => v.driverId ? esc(Biz.staffName(v.driverId)) : '<span class="muted">Pool</span>' },
        { label: 'Odometer', cls: 'num', html: v => v.mileage ? U.num(v.mileage) + ' km' : '—' },
        { label: 'Papers', html: v => paperBadges(v) || '<span class="muted">Up to date</span>' },
        { label: 'Spent this month', cls: 'num', html: v => U.money(U.sum(mlogs.filter(l => l.vehicleId === v.id), l => l.cost || 0)) }
      ],
      empty: UI.empty('No vehicles yet', '', '', 'car')
    });

    if (sel) {
      const vl = U.sortBy(logs.filter(l => l.vehicleId === sel.id), l => l.date, true);
      body = '<div class="split mb"><a class="back" href="#/vehicles">' + icon('arrowLeft', 14) + ' All vehicles</a><div class="row">' + (manage ? UI.btn('Trip', 'trip', { icon: 'pin', small: true }) + UI.btn('Fuel', 'fuel', { icon: 'fuel', small: true }) + UI.btn('Repair', 'repair', { icon: 'tool', small: true }) + UI.btn('Edit', 'edit', { icon: 'edit', small: true }) : '') + '</div></div>' +
        '<div class="grid g-main"><div>' + UI.card('Log', UI.table({
          id: 'vl', rows: vl, noun: 'entry', filters: [{ key: 'k', label: 'All entries', options: [['trip', 'Trips'], ['fuel', 'Fuel'], ['maintenance', 'Repairs']], value: l => l.kind }],
          columns: [
            { label: 'Date', html: l => U.date(l.date), sort: l => l.date },
            { label: 'Entry', html: l => UI.badge({ trip: 'Trip', fuel: 'Fuel', maintenance: 'Repair' }[l.kind], 'neutral') + ' ' + esc(l.purpose || '') + (l.litres ? ' · ' + l.litres + 'L' : '') },
            { label: 'By', html: l => esc(Biz.staffName(l.staffId)) },
            { label: 'Cost', cls: 'num', html: l => l.cost ? U.money(l.cost) : '' }
          ], empty: UI.empty('No entries yet', '')
        }), { flush: true }) + '</div><div class="stack">' + UI.card(sel.make + ' ' + sel.model, UI.kv([['Plate', '<b>' + esc(sel.plate) + '</b>'], ['Status', UI.badge(sel.status)], ['Driver', sel.driverId ? esc(Biz.staffName(sel.driverId)) : 'Pool vehicle'], ['Odometer', sel.mileage ? U.num(sel.mileage) + ' km' : ''],
          ...Biz.PAPERS.map(([k, label]) => [label, sel.papers && sel.papers[k] ? U.date(sel.papers[k]) + (U.daysBetween(U.today(), sel.papers[k]) < 0 ? ' ' + UI.badge('Expired') : U.daysBetween(U.today(), sel.papers[k]) <= 30 ? ' ' + UI.badge('Due soon') : '') : '']),
          ['Fuel this month', U.money(U.sum(vl.filter(l => l.kind === 'fuel' && l.date.startsWith(month)), l => l.cost))], ['Repairs this year', U.money(U.sum(vl.filter(l => l.kind === 'maintenance' && l.date.startsWith(month.slice(0, 4))), l => l.cost))]])) + '</div></div>';
    }

    return {
      title: 'Vehicles',
      html: UI.header(sel ? sel.make + ' ' + sel.model + ' · ' + sel.plate : 'Company vehicles', sel ? '' : U.plural(vs.length, 'vehicle') + ' · ' + U.money(U.sum(mlogs, l => l.cost || 0)) + ' spent on fuel and repairs this month', !sel && manage ? UI.btn('Add vehicle', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        (!sel ? '<div class="stats">' + UI.stat('Available now', U.num(vs.filter(v => v.status === 'Available').length), 'of ' + vs.length) + UI.stat('Trips this month', U.num(mlogs.filter(l => l.kind === 'trip').length)) +
          UI.stat('Fuel this month', U.moneyShort(U.sum(mlogs.filter(l => l.kind === 'fuel'), l => l.cost)), U.num(U.sum(mlogs.filter(l => l.kind === 'fuel'), l => l.litres || 0)) + ' litres') +
          UI.stat('Papers due in 30 days', U.num(vs.filter(v => Biz.papersDue(v, 30).length).length), 'vehicles to renew', { tone: vs.some(v => Biz.papersDue(v, 30).length) ? 'amber' : '' }) + '</div>' : '') + body,
      actions: {
        add: () => editVehicle(), open: id => App.go('/vehicles?v=' + id),
        edit: () => editVehicle(sel), trip: () => logVehicle(sel, 'trip'), fuel: () => logVehicle(sel, 'fuel'), repair: () => logVehicle(sel, 'maintenance')
      }
    };
  });

  /* ============ Stores & inventory ============ */
  async function editItem(it) {
    const locations = [...new Set(['Head office store', 'Facility store'].concat(DB.filter('projects', p => p.status !== 'Completed').map(p => 'Site store — ' + p.name.replace(/^ISTROM /, '')), DB.all('items').map(i => i.location)))];
    const v = await UI.form({
      title: it ? 'Edit item' : 'New store item', values: it || {},
      fields: [
        { name: 'name', label: 'Item name', required: true, half: true },
        { name: 'category', label: 'Category', type: 'select', options: ['Building materials', 'Electrical', 'Plumbing', 'Finishes', 'Safety', 'Tools', 'Office supplies', 'Cleaning', 'Fuel', 'Other'], required: true, half: true },
        { name: 'unit', label: 'Counted in', required: true, third: true, placeholder: 'bags, pcs, rolls…' },
        { name: 'reorderLevel', label: 'Reorder when below', type: 'number', min: 0, third: true },
        { name: 'unitCost', label: 'Unit cost', type: 'money', third: true },
        { name: 'location', label: 'Store', type: 'select', options: locations, required: true }
      ]
    });
    if (!v) return;
    if (it) DB.update('items', it.id, v);
    else DB.insert('items', Object.assign(v, { sku: 'ST-' + U.pad(DB.all('items').length + 1, 3) }));
    App.refresh();
  }

  async function moveStock(it, kind) {
    const stock = Biz.stock(it.id);
    const titles = { in: 'Receive stock', out: 'Issue stock', adjust: 'Stock count' };
    const v = await UI.form({
      title: titles[kind] + ' — ' + it.name, size: 'md', values: { date: U.today(), qty: kind === 'adjust' ? stock : '' },
      intro: 'In store now: <b>' + U.num(stock) + ' ' + esc(it.unit) + '</b>',
      fields: [
        { name: 'qty', label: kind === 'adjust' ? 'Actual count' : 'Quantity (' + it.unit + ')', type: 'number', min: 0, required: true, half: true },
        { name: 'date', label: 'Date', type: 'date', required: true, half: true },
        { name: 'vendorId', label: 'From vendor', type: 'select', options: Biz.vendorOptions, show: () => kind === 'in', placeholder: 'Not listed', half: true },
        { name: 'projectId', label: 'For project', type: 'select', options: () => Biz.projectOptions(), show: () => kind === 'out', placeholder: 'Head office / general', half: true },
        { name: 'issuedTo', label: 'Collected by', show: () => kind === 'out', half: true },
        { name: 'note', label: kind === 'adjust' ? 'Reason for difference' : 'Note', required: kind === 'adjust' }
      ],
      validate: v => kind === 'out' && v.qty > stock ? 'You only have ' + stock + ' ' + it.unit + ' in store.' : null
    });
    if (!v) return;
    let qty = Number(v.qty), mkind = kind;
    if (kind === 'adjust') { qty = Number(v.qty) - stock; mkind = qty < 0 ? 'out' : 'in'; qty = Math.abs(qty); if (!qty) return UI.toast('Count matches — nothing to change'); }
    DB.insert('movements', { itemId: it.id, kind: mkind, qty, date: v.date, staffId: Auth.user.id, vendorId: v.vendorId || null, projectId: v.projectId || null, issuedTo: v.issuedTo || '', note: (kind === 'adjust' ? 'Stock count: ' : '') + (v.note || ''), adjust: kind === 'adjust' });
    DB.log(titles[kind] + ': ' + qty + ' ' + it.unit + ' of ' + it.name);
    App.refresh();
  }

  function openItem(id) {
    const it = DB.get('items', id);
    const mv = U.sortBy(DB.filter('movements', m => m.itemId === id), m => m.date + m.createdAt, true);
    const manage = Auth.can('inventory.manage');
    UI.modal({
      title: it.name, size: 'lg',
      body: '<div class="stats">' + UI.stat('In store', U.num(Biz.stock(id)) + ' <span class="muted" style="font-size:14px">' + esc(it.unit) + '</span>', UI.badge(Biz.stockLabel(it))) + UI.stat('Reorder below', U.num(it.reorderLevel)) + UI.stat('Value', U.moneyShort(Biz.stock(id) * (it.unitCost || 0)), U.money(it.unitCost || 0) + ' each') + '</div>' +
        UI.table({ rows: mv.slice(0, 40), noun: 'movement', columns: [
          { label: 'Date', html: m => U.date(m.date) },
          { label: '', html: m => m.adjust ? UI.badge('Count', 'neutral') : m.kind === 'in' ? UI.badge('In', 'green') : UI.badge('Out', 'blue') },
          { label: 'Qty', cls: 'num', html: m => (m.kind === 'out' ? '−' : '+') + U.num(m.qty) },
          { label: 'Details', html: m => esc(m.kind === 'in' ? (m.vendorId ? Biz.vendorName(m.vendorId) : '') : (m.projectId ? Biz.projectName(m.projectId) : '') + (m.issuedTo ? ' · ' + m.issuedTo : '')) + (m.note ? '<div class="cell-sub">' + esc(m.note) + '</div>' : '') },
          { label: 'By', html: m => esc(Biz.staffName(m.staffId)) }
        ], empty: UI.empty('No movements yet', '') }),
      foot: manage ? '<button class="btn btn-ghost" data-maction="edit">Edit item</button><span class="spacer"></span><button class="btn" data-maction="adjust">Stock count</button><button class="btn" data-maction="out">Issue</button><button class="btn btn-primary" data-maction="in">Receive</button>' : '',
      actions: {
        edit: (a, close) => { close(); editItem(it); },
        in: (a, close) => { close(); moveStock(it, 'in'); },
        out: (a, close) => { close(); moveStock(it, 'out'); },
        adjust: (a, close) => { close(); moveStock(it, 'adjust'); }
      }
    });
  }

  App.route('/stores', 'inventory.view', () => {
    const items = U.sortBy(DB.all('items'), i => i.name).map(i => Object.assign({ _stock: Biz.stock(i.id), _label: Biz.stockLabel(i) }, i));
    const low = items.filter(i => i._label !== 'In stock');
    const manage = Auth.can('inventory.manage');
    const month = U.today().slice(0, 7);
    const issued = DB.filter('movements', m => m.kind === 'out' && !m.adjust && m.date.startsWith(month));
    return {
      title: 'Stores',
      html: UI.header('Stores & inventory', 'Materials and supplies at head office and on site', manage ? UI.btn('New item', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        '<div class="stats">' + UI.stat('Items tracked', U.num(items.length), U.plural(new Set(items.map(i => i.location)).size, 'store')) +
          UI.stat('Stock value', U.moneyShort(U.sum(items, i => i._stock * (i.unitCost || 0))), 'at cost') +
          UI.stat('Low or out', U.num(low.length), 'need reordering', { tone: low.length ? 'amber' : '' }) +
          UI.stat('Issued this month', U.moneyShort(U.sum(issued, m => m.qty * ((DB.get('items', m.itemId) || {}).unitCost || 0))), U.plural(issued.length, 'issue')) + '</div>' +
        (low.length ? '<div class="callout">' + icon('box', 17) + '<div><b>Running low:</b> ' + low.map(i => esc(i.name) + ' (' + U.num(i._stock) + ' ' + esc(i.unit) + ')').join(', ') + '. <a href="#/purchases">Raise a purchase request</a>.</div></div>' : '') +
        UI.table({
          id: 'inv', rows: items, noun: 'item', rowAction: 'open', search: i => i.name + ' ' + i.sku + ' ' + i.category,
          filters: [{ key: 'l', label: 'All stores', options: [...new Set(items.map(i => i.location))].sort(), value: i => i.location }, { key: 'c', label: 'Any category', options: [...new Set(items.map(i => i.category))].sort(), value: i => i.category }, { key: 's', label: 'Any level', options: ['In stock', 'Low stock', 'Out of stock'], value: i => i._label }],
          columns: [
            { label: 'Item', html: i => '<span class="cell-main">' + esc(i.name) + '</span><div class="cell-sub">' + esc(i.sku) + ' · ' + esc(i.category) + '</div>', sort: i => i.name },
            { label: 'Store', html: i => esc(i.location), sort: i => i.location },
            { label: 'In store', cls: 'num', html: i => '<b>' + U.num(i._stock) + '</b> ' + esc(i.unit), sort: i => i._stock },
            { label: 'Reorder at', cls: 'num', html: i => U.num(i.reorderLevel) },
            { label: 'Value', cls: 'num', html: i => U.money(i._stock * (i.unitCost || 0)), sort: i => i._stock * (i.unitCost || 0) },
            { label: 'Level', html: i => UI.badge(i._label), sort: i => i._label }
          ],
          empty: UI.empty('No store items yet', '', '', 'box')
        }),
      actions: { add: () => editItem(), open: id => openItem(id) }
    };
  });
})();
