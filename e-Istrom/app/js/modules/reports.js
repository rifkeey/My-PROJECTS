/* e-Istrom — Reports (print or export any of them) */
(function () {
  const esc = U.esc;

  // Simple table builder that works both on screen and in print
  function tbl(cols, rows, foot) {
    return '<table class="tbl"><thead><tr>' + cols.map(c => '<th class="' + (c.num ? 'num r' : '') + '">' + esc(c.label) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + cols.map(c => '<td class="' + (c.num ? 'num r' : '') + '">' + c.html(r) + '</td>').join('') + '</tr>').join('') + '</tbody>' +
      (foot ? '<tfoot><tr>' + foot.map((f, i) => '<td class="' + (cols[i] && cols[i].num ? 'num r' : '') + '"><b>' + f + '</b></td>').join('') + '</tr></tfoot>' : '') + '</table>';
  }

  App.route('/reports', 'reports.view', (p, q) => {
    const fin = Auth.can('reports.finance');
    const tabs = [];
    if (Auth.can('sales.view')) tabs.push(['sales', 'Sales', '#/reports?tab=sales']);
    if (fin) { tabs.push(['money', 'Income & spending', '#/reports?tab=money']); tabs.push(['debtors', 'Debtors', '#/reports?tab=debtors']); tabs.push(['expenses', 'Expenses', '#/reports?tab=expenses']); }
    if (Auth.canAny('estates.view', 'inventory.view', 'vehicles.view', 'projects.view')) tabs.push(['ops', 'Operations', '#/reports?tab=ops']);
    if (Auth.canAny('staff.manage', 'payroll.view')) tabs.push(['people', 'People', '#/reports?tab=people']);
    const tab = q.tab && tabs.find(t => t[0] === q.tab) ? q.tab : (tabs[0] || [''])[0];
    const years = [...new Set(DB.all('sales').map(s => (s.date || '').slice(0, 4)).concat([U.today().slice(0, 4)]))].filter(Boolean).sort().reverse();
    const year = q.year || U.today().slice(0, 4);
    const inYear = d => String(d || '').startsWith(year);

    let title = '', body = '', exportRows = null;

    if (tab === 'sales') {
      title = 'Sales report ' + year;
      const sales = DB.filter('sales', s => s.status !== 'cancelled');
      const ys = sales.filter(s => inYear(s.date));
      const rows = U.sortBy(DB.all('projects'), x => x.name).map(pr => {
        const units = DB.filter('units', u => u.projectId === pr.id);
        const ps = sales.filter(s => s.projectId === pr.id);
        const st = ps.map(Biz.saleStats);
        return { name: pr.name, total: units.length, sold: units.filter(u => u.status !== 'available').length, avail: units.filter(u => u.status === 'available').length, yr: ys.filter(s => s.projectId === pr.id).length, yrValue: U.sum(ys.filter(s => s.projectId === pr.id), s => s.price), value: U.sum(ps, s => s.price), paid: U.sum(st, x => x.paid), bal: U.sum(st, x => x.balance) };
      }).filter(r => r.total);
      const cols = [
        { label: 'Project', html: r => esc(r.name) }, { label: 'Units', num: 1, html: r => U.num(r.total) }, { label: 'Sold', num: 1, html: r => U.num(r.sold) }, { label: 'Available', num: 1, html: r => U.num(r.avail) },
        { label: '% sold', num: 1, html: r => U.pct(r.sold, r.total) + '%' }, { label: 'Sold in ' + year, num: 1, html: r => U.num(r.yr) }, { label: 'Value in ' + year, num: 1, html: r => U.money(r.yrValue) }
      ].concat(fin ? [{ label: 'Collected (all time)', num: 1, html: r => U.money(r.paid) }, { label: 'Outstanding', num: 1, html: r => U.money(r.bal) }] : []);
      const foot = ['Total', U.num(U.sum(rows, r => r.total)), U.num(U.sum(rows, r => r.sold)), U.num(U.sum(rows, r => r.avail)), U.pct(U.sum(rows, r => r.sold), U.sum(rows, r => r.total)) + '%', U.num(U.sum(rows, r => r.yr)), U.money(U.sum(rows, r => r.yrValue))].concat(fin ? [U.money(U.sum(rows, r => r.paid)), U.money(U.sum(rows, r => r.bal))] : []);
      const byMonth = U.groupBy(ys, s => s.date.slice(0, 7));
      const months = Array.from({ length: 12 }, (_, i) => year + '-' + String(i + 1).padStart(2, '0'));
      const byPerson = U.groupBy(ys, s => s.salesPersonId);
      const people = Object.keys(byPerson).map(k => ({ label: Biz.staffName(k), value: U.sum(byPerson[k], s => s.price), n: byPerson[k].length })).sort((a, b) => b.value - a.value);
      const leads = DB.filter('leads', l => inYear(U.iso(l.createdAt)));
      const bySrc = U.groupBy(leads, l => l.source);
      const src = Object.keys(bySrc).map(k => ({ s: k, n: bySrc[k].length, won: bySrc[k].filter(l => l.stage === 'Won').length })).sort((a, b) => b.n - a.n);
      body = '<div class="stats">' + UI.stat('Units sold in ' + year, U.num(ys.length)) + UI.stat('Sales value', U.moneyShort(U.sum(ys, s => s.price))) + UI.stat('Average price', U.moneyShort(ys.length ? U.sum(ys, s => s.price) / ys.length : 0)) + UI.stat('Discounts given', U.moneyShort(U.sum(ys, s => s.discount || 0))) + '</div>' +
        UI.card('Sales by month (value)', UI.bars(months.map(m => ({ label: U.monthLabel(m).slice(0, 3), value: U.sum(byMonth[m] || [], s => s.price) })))) +
        '<div class="mt">' + UI.card('By project', '<div class="table-wrap" style="box-shadow:none;border:0">' + tbl(cols, rows, foot) + '</div>', { flush: true }) + '</div>' +
        '<div class="grid g2 mt">' + UI.card('By sales person (' + year + ')', people.length ? UI.hbars(people) : UI.empty('No sales', '')) +
        UI.card('Enquiries by source (' + year + ')', src.length ? '<table class="tbl-plain"><tr><th>Source</th><th class="num">Enquiries</th><th class="num">Became sales</th><th class="num">Rate</th></tr>' + src.map(r => '<tr><td>' + esc(r.s) + '</td><td class="num">' + r.n + '</td><td class="num">' + r.won + '</td><td class="num">' + U.pct(r.won, r.n) + '%</td></tr>').join('') + '</table>' : UI.empty('No enquiries', '')) + '</div>';
      exportRows = { rows, cols: [{ label: 'Project', value: r => r.name }, { label: 'Units', value: r => r.total }, { label: 'Sold', value: r => r.sold }, { label: 'Available', value: r => r.avail }, { label: 'Sold in year', value: r => r.yr }, { label: 'Value in year', value: r => r.yrValue }].concat(fin ? [{ label: 'Collected', value: r => r.paid }, { label: 'Outstanding', value: r => r.bal }] : []) };
      var printable = tbl(cols, rows, foot);
    }

    if (tab === 'money') {
      title = 'Income & spending ' + year;
      const entries = Biz.cashEntries().filter(e => inYear(e.date));
      const ins = U.groupBy(entries.filter(e => e.kind === 'in'), e => e.cat);
      const outs = U.groupBy(entries.filter(e => e.kind === 'out'), e => e.cat);
      const inRows = Object.keys(ins).map(k => ({ cat: k, amt: U.sum(ins[k], e => e.amount) })).sort((a, b) => b.amt - a.amt);
      const outRows = Object.keys(outs).map(k => ({ cat: k, amt: U.sum(outs[k], e => e.amount) })).sort((a, b) => b.amt - a.amt);
      const tin = U.sum(inRows, r => r.amt), tout = U.sum(outRows, r => r.amt);
      const months = Array.from({ length: 12 }, (_, i) => year + '-' + String(i + 1).padStart(2, '0'));
      const bm = U.groupBy(entries, e => String(e.date).slice(0, 7));
      const mrows = months.map(m => ({ m, in: U.sum((bm[m] || []).filter(e => e.kind === 'in'), e => e.amount), out: U.sum((bm[m] || []).filter(e => e.kind === 'out'), e => e.amount) }));
      const cols = [{ label: 'Month', html: r => U.monthLabel(r.m, true) }, { label: 'Money in', num: 1, html: r => U.money(r.in) }, { label: 'Money out', num: 1, html: r => U.money(r.out) }, { label: 'Net', num: 1, html: r => U.money(r.in - r.out) }];
      var printable = '<h2>Money in</h2>' + tbl([{ label: 'Source', html: r => esc(r.cat) }, { label: 'Amount', num: 1, html: r => U.money(r.amt) }], inRows, ['Total', U.money(tin)]) +
        '<h2>Money out</h2>' + tbl([{ label: 'Category', html: r => esc(r.cat) }, { label: 'Amount', num: 1, html: r => U.money(r.amt) }], outRows, ['Total', U.money(tout)]) +
        '<h2>By month</h2>' + tbl(cols, mrows, ['Total', U.money(tin), U.money(tout), U.money(tin - tout)]);
      body = '<div class="stats">' + UI.stat('Money in', U.moneyShort(tin)) + UI.stat('Money out', U.moneyShort(tout)) + UI.stat('Net', U.moneyShort(tin - tout), '', { tone: tin - tout >= 0 ? 'green' : 'red' }) + '</div>' +
        UI.card('Month by month', UI.bars(mrows.map(r => ({ label: U.monthLabel(r.m).slice(0, 3), value: r.in, value2: r.out })), { legend: ['Money in', 'Money out'] })) +
        '<div class="grid g2 mt">' + UI.card('Money in', UI.hbars(inRows.map(r => ({ label: r.cat, value: r.amt })))) + UI.card('Money out', UI.hbars(outRows.map(r => ({ label: r.cat, value: r.amt })))) + '</div>' +
        '<div class="mt">' + UI.card('By month', '<div class="table-wrap" style="box-shadow:none;border:0">' + tbl(cols, mrows, ['Total', U.money(tin), U.money(tout), U.money(tin - tout)]) + '</div>', { flush: true }) + '</div>' +
        '<p class="muted mt" style="font-size:12.5px">This is a cash view of money received and paid out, not formal accounts. Client payments are counted when received; expenses when paid.</p>';
      exportRows = { rows: mrows, cols: [{ label: 'Month', value: r => r.m }, { label: 'In', value: r => r.in }, { label: 'Out', value: r => r.out }, { label: 'Net', value: r => r.in - r.out }] };
    }

    if (tab === 'debtors') {
      title = 'Debtors — money owed by clients';
      const rows = U.sortBy(DB.filter('sales', s => s.status === 'active').map(s => Object.assign({ _s: Biz.saleStats(s) }, s)).filter(s => s._s.balance > 0.5), s => s._s.overdue, true);
      const bucket = s => s._s.overdue <= 0.5 ? 'Not yet due' : s._s.daysLate <= 30 ? '1–30 days' : s._s.daysLate <= 90 ? '31–90 days' : 'Over 90 days';
      const buckets = ['Not yet due', '1–30 days', '31–90 days', 'Over 90 days'].map(b => ({ b, list: rows.filter(r => bucket(r) === b) }));
      const cols = [{ label: 'Client', html: s => esc(Biz.clientName(s.clientId)) }, { label: 'Phone', html: s => esc((DB.get('clients', s.clientId) || {}).phone || '') }, { label: 'Unit', html: s => esc(Biz.unitLabel(s.unitId)) },
        { label: 'Price', num: 1, html: s => U.money(s.price) }, { label: 'Paid', num: 1, html: s => U.money(s._s.paid) }, { label: 'Balance', num: 1, html: s => U.money(s._s.balance) }, { label: 'Overdue', num: 1, html: s => s._s.overdue > 0.5 ? U.money(s._s.overdue) : '—' }, { label: 'Age', html: s => bucket(s) }];
      const foot = ['Total', '', '', U.money(U.sum(rows, s => s.price)), U.money(U.sum(rows, s => s._s.paid)), U.money(U.sum(rows, s => s._s.balance)), U.money(U.sum(rows, s => s._s.overdue)), ''];
      var printable = tbl(cols, rows, foot);
      body = '<div class="stats">' + buckets.map(b => UI.stat(b.b === 'Not yet due' ? 'Balance not yet due' : 'Overdue ' + b.b, U.moneyShort(b.b === 'Not yet due' ? U.sum(b.list, s => s._s.balance) : U.sum(b.list, s => s._s.overdue)), U.plural(b.list.length, 'sale'), { tone: b.b === 'Over 90 days' && b.list.length ? 'red' : '' })).join('') + '</div>' +
        UI.card(null, '<div class="table-wrap" style="box-shadow:none;border:0">' + printable + '</div>', { flush: true });
      exportRows = { rows, cols: [{ label: 'Client', value: s => Biz.clientName(s.clientId) }, { label: 'Phone', value: s => (DB.get('clients', s.clientId) || {}).phone }, { label: 'Unit', value: s => Biz.unitLabel(s.unitId) }, { label: 'Project', value: s => Biz.projectName(s.projectId) }, { label: 'Price', value: s => s.price }, { label: 'Paid', value: s => s._s.paid }, { label: 'Balance', value: s => s._s.balance }, { label: 'Overdue', value: s => s._s.overdue }, { label: 'Days late', value: s => s._s.daysLate }] };
    }

    if (tab === 'expenses') {
      title = 'Expenses ' + year;
      const ex = DB.filter('expenses', e => e.status === 'paid' && inYear(e.paidDate || e.date));
      const byCat = U.groupBy(ex, e => e.category), byProj = U.groupBy(ex, e => e.projectId || '_');
      const catRows = Object.keys(byCat).map(k => ({ k, amt: U.sum(byCat[k], e => e.amount), n: byCat[k].length })).sort((a, b) => b.amt - a.amt);
      const projRows = Object.keys(byProj).map(k => ({ k: k === '_' ? 'Head office / general' : Biz.projectName(k), amt: U.sum(byProj[k], e => e.amount), n: byProj[k].length })).sort((a, b) => b.amt - a.amt);
      const c2 = [{ label: 'Category', html: r => esc(r.k) }, { label: 'Payments', num: 1, html: r => r.n }, { label: 'Amount', num: 1, html: r => U.money(r.amt) }];
      var printable = '<h2>By category</h2>' + tbl(c2, catRows, ['Total', U.sum(catRows, r => r.n), U.money(U.sum(catRows, r => r.amt))]) + '<h2>By project</h2>' + tbl([{ label: 'Project', html: r => esc(r.k) }, c2[1], c2[2]], projRows, ['Total', U.sum(projRows, r => r.n), U.money(U.sum(projRows, r => r.amt))]);
      body = '<div class="stats">' + UI.stat('Spent in ' + year, U.moneyShort(U.sum(ex, e => e.amount)), U.plural(ex.length, 'payment')) + UI.stat('Biggest category', esc((catRows[0] || {}).k || '—'), catRows[0] ? U.moneyShort(catRows[0].amt) : '') + UI.stat('Biggest project', esc((projRows.find(r => r.k !== 'Head office / general') || {}).k || '—')) + '</div>' +
        '<div class="grid g2">' + UI.card('By category', UI.hbars(catRows.map(r => ({ label: r.k, value: r.amt })))) + UI.card('By project', UI.hbars(projRows.map(r => ({ label: r.k, value: r.amt })))) + '</div>';
      exportRows = { rows: ex, cols: [{ label: 'Number', value: e => e.number }, { label: 'Date', value: e => e.paidDate || e.date }, { label: 'Description', value: e => e.description }, { label: 'Category', value: e => e.category }, { label: 'Project', value: e => e.projectId ? Biz.projectName(e.projectId) : '' }, { label: 'Vendor', value: e => e.vendorId ? Biz.vendorName(e.vendorId) : '' }, { label: 'Amount', value: e => e.amount }] };
    }

    if (tab === 'ops') {
      title = 'Operations report ' + year;
      let parts = '', pr = '';
      if (Auth.can('projects.view')) {
        const ps = DB.filter('projects', x => x.status !== 'Completed');
        parts += UI.card('Construction progress', UI.hbars(ps.map(x => ({ label: x.name, value: x.progress })), v => v + '%'));
        pr += '<h2>Construction progress</h2>' + tbl([{ label: 'Project', html: x => esc(x.name) }, { label: 'Progress', num: 1, html: x => x.progress + '%' }, { label: 'Expected completion', html: x => U.date(x.completionDate) }], ps);
      }
      if (Auth.can('estates.view')) {
        const cs = DB.filter('complaints', c => inYear(U.iso(c.createdAt)));
        const byE = U.groupBy(cs, c => c.projectId), byC = U.groupBy(cs, c => c.category);
        const er = Object.keys(byE).map(k => { const l = byE[k], r = l.filter(c => c.resolvedAt); return { k: Biz.projectName(k), n: l.length, open: l.filter(c => c.status !== 'Resolved').length, hrs: r.length ? Math.round(U.sum(r, c => (c.resolvedAt - c.createdAt) / 3600000) / r.length) : 0 }; }).sort((a, b) => b.n - a.n);
        const cols = [{ label: 'Estate', html: r => esc(r.k) }, { label: 'Complaints', num: 1, html: r => r.n }, { label: 'Still open', num: 1, html: r => r.open }, { label: 'Avg. fix time', num: 1, html: r => r.hrs > 48 ? Math.round(r.hrs / 24) + ' days' : r.hrs + ' hrs' }];
        parts += '<div class="grid g2 mt">' + UI.card('Complaints by estate', tbl(cols, er)) + UI.card('Complaints by type', UI.hbars(Object.keys(byC).map(k => ({ label: k, value: byC[k].length })).sort((a, b) => b.value - a.value), v => v)) + '</div>';
        pr += '<h2>Complaints by estate</h2>' + tbl(cols, er);
      }
      if (Auth.can('inventory.view')) {
        const items = DB.all('items');
        const byLoc = U.groupBy(items, i => i.location);
        const lr = Object.keys(byLoc).map(k => ({ k, n: byLoc[k].length, v: U.sum(byLoc[k], i => Biz.stock(i.id) * (i.unitCost || 0)), low: byLoc[k].filter(i => Biz.stockLabel(i) !== 'In stock').length }));
        const cols = [{ label: 'Store', html: r => esc(r.k) }, { label: 'Items', num: 1, html: r => r.n }, { label: 'Low / out', num: 1, html: r => r.low }, { label: 'Value', num: 1, html: r => U.money(r.v) }];
        parts += '<div class="mt">' + UI.card('Stores', tbl(cols, lr, ['Total', U.sum(lr, r => r.n), U.sum(lr, r => r.low), U.money(U.sum(lr, r => r.v))])) + '</div>';
        pr += '<h2>Stores</h2>' + tbl(cols, lr);
      }
      if (Auth.can('vehicles.view')) {
        const logs = DB.filter('vehicleLogs', l => inYear(l.date));
        const vr = DB.all('vehicles').map(v => { const l = logs.filter(x => x.vehicleId === v.id); return { k: v.make + ' ' + v.model + ' (' + v.plate + ')', trips: l.filter(x => x.kind === 'trip').length, fuel: U.sum(l.filter(x => x.kind === 'fuel'), x => x.cost), rep: U.sum(l.filter(x => x.kind === 'maintenance'), x => x.cost) }; });
        const cols = [{ label: 'Vehicle', html: r => esc(r.k) }, { label: 'Trips', num: 1, html: r => r.trips }, { label: 'Fuel', num: 1, html: r => U.money(r.fuel) }, { label: 'Repairs', num: 1, html: r => U.money(r.rep) }];
        parts += '<div class="mt">' + UI.card('Vehicles', tbl(cols, vr, ['Total', U.sum(vr, r => r.trips), U.money(U.sum(vr, r => r.fuel)), U.money(U.sum(vr, r => r.rep))])) + '</div>';
        pr += '<h2>Vehicles</h2>' + tbl(cols, vr);
      }
      body = parts; var printable = pr;
    }

    if (tab === 'people') {
      title = 'People report';
      const staff = DB.filter('staff', s => s.status !== 'Left');
      const byD = U.groupBy(staff, s => s.department);
      const pay = Auth.can('payroll.view');
      const leave = DB.filter('leave', l => l.status === 'Approved' && inYear(l.from));
      const rows = Object.keys(byD).sort().map(d => ({ d, n: byD[d].length, cost: U.sum(byD[d], s => s.salary ? s.salary.basic + s.salary.housing + s.salary.transport + s.salary.other : 0), leave: U.sum(leave.filter(l => (DB.get('staff', l.staffId) || {}).department === d), l => l.days) }));
      const cols = [{ label: 'Department', html: r => esc(r.d) }, { label: 'Staff', num: 1, html: r => r.n }, { label: 'Leave days taken (' + year + ')', num: 1, html: r => r.leave }].concat(pay ? [{ label: 'Monthly gross pay', num: 1, html: r => U.money(r.cost) }] : []);
      const foot = ['Total', U.sum(rows, r => r.n), U.sum(rows, r => r.leave)].concat(pay ? [U.money(U.sum(rows, r => r.cost))] : []);
      var printable = tbl(cols, rows, foot);
      body = '<div class="stats">' + UI.stat('Staff', U.num(staff.length)) + UI.stat('Departments', U.num(rows.length)) + (pay ? UI.stat('Monthly salary bill', U.moneyShort(U.sum(rows, r => r.cost))) + UI.stat('Yearly salary bill', U.moneyShort(U.sum(rows, r => r.cost) * 12)) : '') + '</div>' +
        UI.card('By department', tbl(cols, rows, foot));
    }

    if (!tabs.length) body = UI.empty('No reports for your role', '');

    return {
      title: 'Reports',
      html: UI.header('Reports', 'Print any report or export it to Excel',
        (['sales', 'money', 'expenses', 'ops'].includes(tab) ? '<select class="filter" data-change="year">' + years.map(y => '<option' + (y === year ? ' selected' : '') + '>' + y + '</option>').join('') + '</select>' : '') +
        UI.btn('Print', 'print', { icon: 'print' }) + (exportRows ? UI.btn('Export', 'export', { icon: 'download' }) : '')) +
        UI.tabs(tabs, tab) + body,
      actions: {
        year: v => App.go('/reports?tab=' + tab + '&year=' + v),
        print: () => Docs.report(title, Docs.company().name, typeof printable !== 'undefined' ? printable.replace(/class="tbl"/g, '') : ''),
        export: () => U.download(title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.csv', U.csv(exportRows.rows, exportRows.cols), 'text/csv')
      }
    };
  });
})();
