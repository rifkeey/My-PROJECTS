/* e-Istrom — Projects, units and construction progress */
(function () {
  const esc = U.esc, icon = UI.icon;
  const STATUS_LABEL = { available: 'Available', reserved: 'Reserved', sold: 'Sold', handed_over: 'Handed over' };
  const seePrices = () => Auth.canAny('sales.view', 'projects.manage', 'payments.view');
  const seeOwners = () => Auth.canAny('clients.view', 'estates.view');

  // A quiet skyline drawn from the project's code, in Istrom's building colours
  function art(p) {
    const R = U.rng([...p.code].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
    let s = '<svg viewBox="0 0 300 108" preserveAspectRatio="xMidYMax slice">';
    let x = -6;
    const shades = ['#F4EEE3', '#E8DCC6', '#C9A877', '#B8925F', '#3B3936', '#57534D'];
    while (x < 300) {
      const w = 26 + R() * 40, h = 30 + R() * (p.kind === 'Residential' ? 52 : 66);
      const c = shades[Math.floor(R() * shades.length)];
      const trim = R() < 0.5 ? '#34322F' : '#FFFFFF';
      s += '<rect x="' + x + '" y="' + (108 - h) + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
      for (let wy = 108 - h + 8; wy < 100; wy += 13) {
        for (let wx = x + 6; wx < x + w - 8; wx += 11) s += '<rect x="' + wx + '" y="' + wy + '" width="5" height="7" rx="1" fill="' + trim + '" opacity="' + (c === '#3B3936' || c === '#57534D' ? 0.35 : 0.55) + '"/>';
      }
      x += w + 2;
    }
    return s + '</svg>';
  }

  function counts(projectId) {
    const units = DB.filter('units', u => u.projectId === projectId);
    const c = { total: units.length, available: 0, reserved: 0, sold: 0, handed_over: 0 };
    units.forEach(u => c[u.status]++);
    c.taken = c.total - c.available;
    return c;
  }

  /* ---------- List ---------- */
  App.route('/projects', 'projects.view', (p, q) => {
    const tab = q.tab || 'all';
    let list = DB.all('projects');
    if (tab === 'building') list = list.filter(x => x.status !== 'Completed');
    if (tab === 'completed') list = list.filter(x => x.status === 'Completed');
    list = U.sortBy(list, x => (x.status === 'Completed' ? 1 : 0) + x.name);

    const cards = list.map(pr => {
      const c = counts(pr.id);
      return '<article class="pcard" data-href="/projects/' + pr.id + '">' +
        '<div class="pcard-art">' + art(pr) + UI.badge(pr.status) + '</div>' +
        '<div class="pcard-body"><div><h3>' + esc(pr.name) + '</h3><div class="loc">' + icon('pin', 13) + esc(pr.location) + (pr.managed ? ' · Managed by Istrom' : '') + '</div></div>' +
        (pr.status !== 'Completed' ? '<div><div class="nums"><span>Construction</span><b>' + pr.progress + '%</b></div>' + UI.progress(pr.progress, 'charcoal') + '</div>' : '') +
        (c.total ? '<div><div class="nums"><span>' + U.num(c.taken) + ' of ' + U.num(c.total) + ' units taken</span><b>' + U.pct(c.taken, c.total) + '%</b></div>' + UI.progress(U.pct(c.taken, c.total)) + '</div>' : '<div class="nums"><span>No units added yet</span></div>') +
        '</div></article>';
    }).join('');

    const allUnits = DB.all('units');
    return {
      title: 'Projects',
      html: UI.header('Projects & units', U.plural(DB.all('projects').length, 'project') + ' · ' + U.num(allUnits.length) + ' units · ' + U.num(allUnits.filter(u => u.status === 'available').length) + ' available',
        Auth.can('projects.manage') ? UI.btn('New project', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        UI.tabs([['all', 'All', '#/projects'], ['building', 'Under construction', '#/projects?tab=building'], ['completed', 'Completed', '#/projects?tab=completed']], tab) +
        '<div class="projects">' + cards + '</div>',
      actions: { add: () => editProject() }
    };
  });

  async function editProject(pr) {
    const v = await UI.form({
      title: pr ? 'Edit project' : 'New project',
      values: pr || { status: 'Under Construction', kind: 'Residential', progress: 0 },
      fields: [
        { name: 'name', label: 'Project name', required: true, half: true },
        { name: 'code', label: 'Short code', required: true, half: true, hint: 'Used in unit numbers, e.g. AP2 → AP2-T01', placeholder: 'e.g. KAT' },
        { name: 'location', label: 'Location', required: true, half: true },
        { name: 'kind', label: 'Type', type: 'select', options: ['Residential', 'Plaza', 'Mall', 'Mixed use', 'Land'], half: true, placeholder: false },
        { name: 'status', label: 'Status', type: 'select', options: ['Planning', 'Under Construction', 'Ongoing', 'Completed'], third: true, placeholder: false },
        { name: 'startDate', label: 'Start date', type: 'date', third: true },
        { name: 'completionDate', label: 'Completion (expected)', type: 'date', third: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        { type: 'section', label: 'After handover' },
        { name: 'managed', label: 'Istrom manages this estate after handover (complaints, service charges)', type: 'checkbox' },
        { name: 'serviceCharge', label: 'Yearly service charge per unit', type: 'money', half: true, show: v => v.managed }
      ],
      validate: v => {
        const code = v.code.toUpperCase();
        if (DB.find('projects', x => x.code === code && (!pr || x.id !== pr.id))) return 'Another project already uses the code ' + code + '.';
      }
    });
    if (!v) return;
    v.code = v.code.toUpperCase();
    if (pr) { DB.update('projects', pr.id, v); DB.log('Edited project ' + v.name); UI.toast('Project saved'); }
    else { const n = DB.insert('projects', Object.assign({ progress: 0, types: [] }, v)); DB.log('Created project ' + v.name); App.go('/projects/' + n.id); return; }
    App.refresh();
  }

  async function addUnits(pr) {
    const existing = (pr.types || []).map(t => t.type);
    const v = await UI.form({
      title: 'Add units to ' + pr.name,
      intro: 'Add a batch of identical units. Each one gets its own number automatically.',
      fields: [
        { name: 'existing', label: 'Unit type', type: 'select', options: existing.concat(['+ New type']), half: true, placeholder: existing.length ? 'Choose…' : '+ New type' },
        { name: 'type', label: 'New type name', half: true, placeholder: 'e.g. 4 Bed Terrace + BQ', show: v => !existing.length || v.existing === '+ New type' || !v.existing },
        { name: 'count', label: 'How many?', type: 'number', min: 1, required: true, third: true },
        { name: 'price', label: 'Price per unit', type: 'money', required: true, third: true },
        { name: 'prefix', label: 'Number prefix', third: true, hint: 'e.g. T for terraces', placeholder: 'T' }
      ]
    });
    if (!v) return;
    const type = (v.existing && v.existing !== '+ New type') ? v.existing : v.type;
    if (!type) return UI.toast('Please name the unit type', 'red');
    const prefix = (v.prefix || type.replace(/[^A-Z]/g, '').slice(0, 2) || 'U').toUpperCase();
    const already = DB.filter('units', u => u.projectId === pr.id && u.code.startsWith(pr.code + '-' + prefix)).length;
    const n = Number(v.count) || 0;
    const w = already + n > 99 ? 3 : 2;
    for (let i = 1; i <= n; i++) DB.insert('units', { projectId: pr.id, code: pr.code + '-' + prefix + U.pad(already + i, w), type, price: v.price, status: 'available' }, { silent: true });
    DB.save('units');
    const types = (pr.types || []).slice();
    const t = types.find(x => x.type === type);
    if (t) { t.count += n; t.price = v.price; } else types.push({ type, count: n, price: v.price });
    DB.update('projects', pr.id, { types });
    DB.log('Added ' + n + ' units (' + type + ') to ' + pr.name);
    UI.toast(U.plural(n, 'unit') + ' added');
    App.refresh();
  }

  async function changeTypePrice(pr, type) {
    const units = DB.filter('units', u => u.projectId === pr.id && u.type === type);
    const current = units.length ? units[0].price : 0;
    const v = await UI.form({
      title: 'Change price — ' + type, size: 'sm',
      intro: 'This changes the price of every <b>available</b> ' + esc(type) + ' in ' + esc(pr.name) + '. Units already sold keep their agreed price.',
      values: { price: current },
      fields: [{ name: 'price', label: 'New price per unit', type: 'money', required: true }]
    });
    if (!v) return;
    let n = 0;
    units.forEach(u => { if (u.status === 'available') { u.price = v.price; n++; } });
    DB.save('units');
    const types = (pr.types || []).map(t => t.type === type ? Object.assign({}, t, { price: v.price }) : t);
    DB.update('projects', pr.id, { types });
    DB.log('Changed price of ' + type + ' at ' + pr.name + ' to ' + U.money(v.price) + ' (' + n + ' units)');
    UI.toast('Price updated on ' + U.plural(n, 'available unit'));
    App.refresh();
  }

  async function postUpdate(pr) {
    const v = await UI.form({
      title: 'Construction update — ' + pr.name,
      values: { date: U.today(), progress: pr.progress },
      fields: [
        { name: 'date', label: 'Date', type: 'date', required: true, third: true },
        { name: 'progress', label: 'Overall progress (%)', type: 'number', min: 0, max: 100, required: true, third: true },
        { name: 'milestone', label: 'Stage reached', type: 'select', third: true, options: ['Site clearing and setting out', 'Foundation and substructure', 'Block work to DPC', 'First floor slab cast', 'Block work to roof level', 'Roofing', 'Electrical and plumbing first fix', 'Plastering', 'Finishing and tiling', 'External works and landscaping', 'Completed and ready for handover'] },
        { name: 'note', label: 'What happened', type: 'textarea', required: true, placeholder: 'Work done, issues, next steps…' },
        { name: 'photos', label: 'Site photos', type: 'photos' }
      ]
    });
    if (!v) return;
    const ids = [];
    for (const url of v.photos || []) ids.push(await DB.putFile(url));
    const progress = Math.max(0, Math.min(100, Number(v.progress) || 0));
    DB.insert('updates', { projectId: pr.id, date: v.date, progress, milestone: v.milestone, note: v.note, photos: ids });
    const patch = { progress };
    if (progress >= 100 && pr.status !== 'Completed') patch.status = 'Completed';
    DB.update('projects', pr.id, patch);
    DB.log('Posted construction update for ' + pr.name + ' (' + progress + '%)');
    UI.toast('Update posted');
    App.refresh();
  }

  /* ---------- Unit sheet ---------- */
  function openUnit(unitId) {
    const u = DB.get('units', unitId);
    if (!u) return;
    const pr = DB.get('projects', u.projectId);
    const sale = u.saleId && DB.get('sales', u.saleId);
    const client = u.clientId && DB.get('clients', u.clientId);
    const st = sale && Auth.can('payments.view') ? Biz.saleStats(sale) : null;
    const rows = [
      ['Unit', '<b>' + esc(u.code) + '</b>'],
      ['Type', esc(u.type)],
      ['Estate', esc(pr.name)],
      ['Status', UI.badge(STATUS_LABEL[u.status])],
      seePrices() ? ['List price', U.money(u.price)] : null,
      client && seeOwners() ? ['Owner', Auth.can('clients.view') ? '<a href="#/clients/' + client.id + '">' + esc(client.name) + '</a>' : esc(client.name)] : null,
      client && seeOwners() ? ['Phone', esc(client.phone || '')] : null,
      sale && Auth.can('sales.view') ? ['Sale', '<a href="#/sales/' + sale.id + '">' + esc(sale.number) + '</a> · ' + U.money(sale.price)] : null,
      st ? ['Paid so far', U.money(st.paid) + ' (' + st.pct + '%)'] : null,
      u.handoverDate ? ['Handed over', U.date(u.handoverDate)] : null
    ];
    const foot = [];
    if (u.status === 'available' && Auth.can('sales.manage')) foot.push('<button class="btn btn-primary" data-maction="sell">' + icon('tag', 15) + 'Start a sale</button>');
    if (u.status === 'sold' && Auth.canAny('projects.manage', 'documents.issue')) foot.push('<button class="btn" data-maction="handover">' + icon('key', 15) + 'Mark handed over</button>');
    if (Auth.can('projects.manage') && u.status === 'available') foot.push('<button class="btn" data-maction="edit">' + icon('edit', 15) + 'Edit</button>');
    UI.modal({
      title: u.code + ' · ' + u.type, size: 'sm',
      body: UI.kv(rows),
      foot: foot.join(''),
      actions: {
        sell: (a, close) => { close(); App.go('/sales?new=1&unit=' + u.id); },
        handover: async (a, close) => {
          if (st && st.balance > 0.5 && !(await UI.confirm('This unit still has ' + U.money(st.balance) + ' unpaid. Hand it over anyway?', { ok: 'Hand over' }))) return;
          close();
          DB.update('units', u.id, { status: 'handed_over', handoverDate: U.today() });
          DB.log('Handed over ' + u.code + (client ? ' to ' + client.name : ''));
          UI.toast(u.code + ' marked as handed over');
          App.refresh();
        },
        edit: async (a, close) => {
          close();
          const v = await UI.form({
            title: 'Edit ' + u.code, size: 'sm', values: u,
            fields: [
              { name: 'code', label: 'Unit number', required: true, half: true },
              { name: 'price', label: 'Price', type: 'money', required: true, half: true },
              { name: 'type', label: 'Type', required: true },
              { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'e.g. corner piece, extra land' }
            ],
            danger: 'Delete unit',
            onDanger: async () => {
              if (!(await UI.confirm('Delete unit ' + u.code + '? This can’t be undone.', { danger: true, ok: 'Delete' }))) return false;
              DB.remove('units', u.id); DB.log('Deleted unit ' + u.code); App.refresh();
            }
          });
          if (v) { DB.update('units', u.id, { code: v.code, price: v.price, type: v.type, notes: v.notes }); App.refresh(); }
        }
      }
    });
  }
  window.openUnit = openUnit;

  /* ---------- Project page ---------- */
  App.route('/projects/:id', 'projects.view', (params, q) => {
    const pr = DB.get('projects', params.id);
    if (!pr) return { html: UI.empty('Project not found', '') };
    const tab = q.tab || 'units';
    const c = counts(pr.id);
    const units = DB.filter('units', u => u.projectId === pr.id);
    const base = '#/projects/' + pr.id;

    const stats = [
      UI.stat('Units', U.num(c.total), U.num(c.available) + ' available'),
      UI.stat('Sold', U.num(c.sold + c.handed_over), U.num(c.reserved) + ' reserved'),
      pr.status !== 'Completed' ? UI.stat('Construction', pr.progress + '%', UI.progress(pr.progress, 'charcoal')) : UI.stat('Handed over', U.num(c.handed_over), 'of ' + U.num(c.sold + c.handed_over) + ' sold'),
      Auth.can('sales.view') ? UI.stat('Value sold', U.moneyShort(U.sum(DB.filter('sales', s => s.projectId === pr.id && s.status !== 'cancelled'), s => s.price)), seePrices() ? 'Available stock ' + U.moneyShort(U.sum(units.filter(u => u.status === 'available'), u => u.price)) : '') : ''
    ];

    let body = '';
    if (tab === 'units') {
      if (!units.length) body = UI.empty('No units yet', 'Add the houses, flats or shops in this project.', Auth.can('projects.manage') ? UI.btn('Add units', 'addUnits', { icon: 'plus', kind: 'primary' }) : '', 'grid');
      else {
        const view = q.view || 'grid';
        const toggle = '<div class="split mb"><div class="unit-legend"><span><i class="available"></i>Available</span><span><i class="reserved"></i>Reserved</span><span><i class="sold"></i>Sold</span><span><i class="handed_over"></i>Handed over</span></div>' +
          '<div class="row">' + '<a class="btn btn-sm ' + (view === 'grid' ? '' : 'btn-ghost') + '" href="' + base + '?tab=units&view=grid">' + icon('grid', 14) + '</a><a class="btn btn-sm ' + (view === 'list' ? '' : 'btn-ghost') + '" href="' + base + '?tab=units&view=list">' + icon('list', 14) + '</a></div></div>';
        if (view === 'grid') {
          const byType = U.groupBy(units, u => u.type);
          body = toggle + UI.card(null, Object.keys(byType).map(type => {
            const list = byType[type];
            const free = list.filter(u => u.status === 'available').length;
            return '<div class="type-head"><span><b>' + esc(type) + '</b> <span class="muted">· ' + list.length + ' units · ' + free + ' available</span></span>' +
              '<span>' + (seePrices() ? '<span class="muted">' + U.moneyShort(list[0].price) + '</span> ' : '') + (Auth.can('projects.manage') ? UI.btn('Price', 'price', { small: true, kind: 'ghost', data: { type } }) : '') + '</span></div>' +
              '<div class="unit-grid">' + list.map(u => '<div class="unit-cell ' + u.status + '" data-action="unit" data-id="' + u.id + '" title="' + esc(STATUS_LABEL[u.status] + (u.clientId && seeOwners() ? ' — ' + Biz.clientName(u.clientId) : '')) + '">' + esc(u.code.split('-').pop()) + '<small>' + esc(STATUS_LABEL[u.status]) + '</small></div>').join('') + '</div>';
          }).join(''));
        } else {
          body = toggle + UI.table({
            id: 'units', rows: units, noun: 'unit', search: u => u.code + ' ' + u.type + ' ' + (u.clientId ? Biz.clientName(u.clientId) : ''), rowAction: 'unit',
            filters: [{ key: 'st', label: 'Any status', options: Object.entries(STATUS_LABEL), value: u => u.status }, { key: 'ty', label: 'Any type', options: [...new Set(units.map(u => u.type))], value: u => u.type }],
            columns: [
              { label: 'Unit', html: u => '<span class="cell-main">' + esc(u.code) + '</span>', sort: u => u.code },
              { label: 'Type', html: u => esc(u.type), sort: u => u.type },
              { label: 'Status', html: u => UI.badge(STATUS_LABEL[u.status]), sort: u => u.status },
              seeOwners() ? { label: 'Owner', html: u => u.clientId ? esc(Biz.clientName(u.clientId)) : '<span class="muted">—</span>', sort: u => u.clientId ? Biz.clientName(u.clientId) : '' } : null,
              seePrices() ? { label: 'Price', cls: 'num', html: u => U.money(u.price), sort: u => u.price } : null
            ].filter(Boolean)
          });
        }
      }
    }

    if (tab === 'progress') {
      const ups = U.sortBy(DB.filter('updates', x => x.projectId === pr.id), x => x.date, true);
      body = ups.length ? UI.card(null, '<div class="timeline">' + ups.map(x =>
        '<div class="tl-item"><h4>' + esc(x.milestone || 'Update') + ' · ' + x.progress + '%</h4><div class="s">' + U.date(x.date) + ' · ' + esc(Biz.staffName(x.createdBy)) + '</div><p>' + esc(x.note) + '</p>' +
        (x.photos && x.photos.length ? '<div class="photos">' + x.photos.map(f => '<img data-file="' + f + '" data-action="photo" alt="Site photo">').join('') + '</div>' : '') + '</div>').join('') + '</div>')
        : UI.empty('No updates yet', 'Post progress and site photos so everyone can follow construction.', Auth.can('construction.update') ? UI.btn('Post update', 'update', { icon: 'plus', kind: 'primary' }) : '', 'crane');
    }

    if (tab === 'details') {
      const typeRows = U.groupBy(units, u => u.type);
      body = '<div class="grid g2">' + UI.card('About', UI.kv([
        ['Location', esc(pr.location)], ['Type', esc(pr.kind)], ['Status', UI.badge(pr.status)], ['Code', esc(pr.code)],
        ['Started', U.date(pr.startDate)], [pr.status === 'Completed' ? 'Completed' : 'Expected completion', U.date(pr.completionDate)],
        ['After handover', pr.managed ? 'Managed by Istrom' + (pr.serviceCharge ? ' · ' + U.money(pr.serviceCharge) + ' a year per unit' : '') : 'Not managed by Istrom']
      ]) + (pr.description ? '<p class="muted mt" style="margin-bottom:0">' + esc(pr.description) + '</p>' : '')) +
        UI.card('Unit mix', '<table class="tbl-plain"><tr><th>Type</th><th class="num">Units</th><th class="num">Available</th>' + (seePrices() ? '<th class="num">Price</th>' : '') + '</tr>' +
          Object.keys(typeRows).map(t => '<tr><td>' + esc(t) + '</td><td class="num">' + typeRows[t].length + '</td><td class="num">' + typeRows[t].filter(u => u.status === 'available').length + '</td>' + (seePrices() ? '<td class="num">' + U.money(typeRows[t][0].price) + '</td>' : '') + '</tr>').join('') +
          '</table>') + '</div>';
    }

    const actions = [];
    if (Auth.can('construction.update') && pr.status !== 'Completed') actions.push(UI.btn('Post update', 'update', { icon: 'crane' }));
    if (Auth.can('projects.manage')) { actions.push(UI.btn('Edit', 'edit', { icon: 'edit' })); actions.push(UI.btn('Add units', 'addUnits', { icon: 'plus', kind: 'primary' })); }

    return {
      title: pr.name,
      html: UI.header(pr.name, icon('pin', 13) + ' ' + esc(pr.location) + ' · ' + UI.badge(pr.status) + (pr.managed ? ' ' + UI.badge('Managed') : ''), actions.join(''), ['/projects', 'Projects']) +
        '<div class="stats">' + stats.filter(Boolean).join('') + '</div>' +
        UI.tabs([['units', 'Units', base + '?tab=units'], ['progress', 'Construction', base + '?tab=progress'], ['details', 'Details', base + '?tab=details']], tab) + body,
      actions: {
        unit: id => openUnit(id),
        addUnits: () => addUnits(pr),
        edit: () => editProject(pr),
        update: () => postUpdate(pr),
        price: (id, el) => changeTypePrice(pr, el.dataset.type),
        photo: (id, el) => UI.modal({ title: pr.name, size: 'lg', body: '<div class="lightbox"><img src="' + el.src + '" alt=""></div>' })
      },
      mount: () => { if (q.unit) openUnit(q.unit); }
    };
  });
})();
