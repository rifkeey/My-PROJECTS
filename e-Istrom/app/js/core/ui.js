/* e-Istrom — interface building blocks: icons, cards, tables, forms, modals */
(function () {
  const esc = U.esc;

  // Thin outline icons (24px grid, 1.6 stroke)
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>',
    building: '<rect x="4" y="3" width="11" height="18" rx="1"/><path d="M15 9h4a1 1 0 0 1 1 1v11h-5"/><path d="M8 7h3M8 11h3M8 15h3"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17.5 14.6c2.3.3 3.7 1.9 4 4.4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.3 4-6.5 8-6.5s7.2 2.2 8 6.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1.5"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
    doc: '<path d="M6 2.5h8l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1-1.5z"/><path d="M14 2.5V8h5"/><path d="M8.5 13h7M8.5 17h5"/>',
    wallet: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19v3"/><rect x="3" y="7.5" width="18" height="12" rx="2"/><circle cx="16.5" cy="13.5" r="1.2"/>',
    receipt: '<path d="M6 2.5h12v19l-2.5-1.6L13 21.5l-2.5-1.6L8 21.5l-2-1.3z"/><path d="M9 7.5h6M9 11h6M9 14.5h4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1.1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    car: '<path d="M5 16.5V12l2-5h10l2 5v4.5"/><rect x="3.5" y="12" width="17" height="5" rx="1.5"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3-7-7 3-3 2.7 1.3a4 4 0 0 0 5-5z" transform="rotate(0)"/>',
    tool: '<path d="M14.5 5.5a4.5 4.5 0 0 0-5.9 5.9L3 17l4 4 5.6-5.6a4.5 4.5 0 0 0 5.9-5.9l-2.8 2.8-2.8-.7-.7-2.8z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.5"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 16l4-4-4-4M14 12H4"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    megaphone: '<path d="M3 10v4h3l7 4V6l-7 4z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    hammer: '<path d="M13 7 6 14l-3 3 4 4 3-3 7-7"/><path d="M13 7l2-2 6 6-2 2z"/>',
    crane: '<path d="M6 21V5l12 0M6 5l4-3M18 5v5"/><path d="M15 10h6v3h-6zM3 21h8"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.3 1.4a11 11 0 0 0 5 5L14 12l4.5 1.5V17a2 2 0 0 1-2 2A14.5 14.5 0 0 1 3 5.5a2 2 0 0 1 2-2"/>',
    message: '<path d="M4 5h16v11H9l-5 4z"/>',
    whatsapp: '<path d="M4 20l1.2-4A8 8 0 1 1 8 18.8z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4.5 4.5 0 0 1-2.8-2.8l.8-1-1-2z"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M4 20h16"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z"/><path d="M9 12l2 2 4-4"/>',
    stamp: '<path d="M9 12V8a3 3 0 1 1 6 0v4"/><path d="M5 16a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H5zM5 21h14"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14.5 8.5l2 2"/>',
    door: '<path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12" r=".9"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.2v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
    layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 12.5l9 5 9-5M3 17l9 5 9-5"/>',
    pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10"/><path d="M14 8l3 2v7a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 1 1 8 0v3"/>'
  };

  function icon(name, size) {
    const s = size || 18;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>';
  }

  // Status -> tone mapping used across the app
  const TONES = {
    green: ['Available', 'Active', 'Approved', 'Paid', 'Completed', 'Resolved', 'Won', 'Done', 'Received', 'Fully paid', 'In stock', 'Present', 'Closed', 'Handed over', 'Allocated', 'On track'],
    amber: ['Pending', 'Pending approval', 'Reserved', 'In progress', 'Under Construction', 'Negotiating', 'Scheduled', 'Partly paid', 'Low stock', 'Ordered', 'Due soon', 'Draft', 'Contacted', 'Inspection booked', 'Under repair', 'Awaiting MD', 'Awaiting Chairman', 'Ongoing', 'On leave'],
    red: ['Overdue', 'Rejected', 'Cancelled', 'Lost', 'Urgent', 'High', 'Out of stock', 'Expired', 'No-show', 'Open', 'Refund', 'Left'],
    blue: ['New', 'Sold', 'In use', 'Medium', 'Ordered'],
    accent: ['Managed', 'Chairman', 'Pinned']
  };
  function toneOf(text) {
    for (const t in TONES) if (TONES[t].includes(text)) return t;
    return 'neutral';
  }

  const UI = {
    icon, ICONS,

    badge(text, tone) {
      if (!text) return '';
      return '<span class="badge badge-' + (tone || toneOf(text)) + '">' + esc(text) + '</span>';
    },

    avatar(name, size) {
      const palette = ['#B8925F', '#8A8378', '#6F7D6A', '#7C6F86', '#8C6A55', '#5F7480'];
      let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      return '<span class="avatar" style="--av:' + palette[h % palette.length] + ';' + (size ? 'width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.38) + 'px' : '') + '">' + esc(U.initials(name)) + '</span>';
    },

    header(title, subtitle, actions, back) {
      return '<header class="page-head">' +
        '<div>' + (back ? '<a class="back" href="#' + back[0] + '">' + icon('arrowLeft', 14) + ' ' + esc(back[1]) + '</a>' : '') +
        '<h1>' + esc(title) + '</h1>' + (subtitle ? '<p class="sub">' + subtitle + '</p>' : '') + '</div>' +
        '<div class="head-actions">' + (actions || '') + '</div></header>';
    },

    btn(label, action, opts) {
      opts = opts || {};
      const cls = 'btn ' + (opts.kind ? 'btn-' + opts.kind : '') + (opts.small ? ' btn-sm' : '');
      const data = Object.entries(opts.data || {}).map(([k, v]) => ' data-' + k + '="' + esc(v) + '"').join('');
      const ic = opts.icon ? icon(opts.icon, opts.small ? 14 : 16) : '';
      if (opts.href) return '<a class="' + cls + '" href="' + esc(opts.href) + '"' + (opts.target ? ' target="_blank" rel="noopener"' : '') + '>' + ic + '<span>' + esc(label) + '</span></a>';
      return '<button type="button" class="' + cls + '" data-action="' + esc(action) + '"' + data + (opts.disabled ? ' disabled' : '') + (opts.title ? ' title="' + esc(opts.title) + '"' : '') + '>' + ic + (label ? '<span>' + esc(label) + '</span>' : '') + '</button>';
    },

    stat(label, value, hint, opts) {
      opts = opts || {};
      return '<div class="stat' + (opts.href ? ' stat-link' : '') + '"' + (opts.href ? ' data-href="' + esc(opts.href) + '"' : '') + '>' +
        '<div class="stat-label">' + (opts.icon ? icon(opts.icon, 15) : '') + esc(label) + '</div>' +
        '<div class="stat-value' + (opts.tone ? ' tone-' + opts.tone : '') + '">' + value + '</div>' +
        (hint ? '<div class="stat-hint">' + hint + '</div>' : '') + '</div>';
    },

    card(title, body, opts) {
      opts = opts || {};
      return '<section class="card' + (opts.cls ? ' ' + opts.cls : '') + '">' +
        (title ? '<div class="card-head"><h3>' + esc(title) + '</h3>' + (opts.actions || '') + '</div>' : '') +
        '<div class="card-body' + (opts.flush ? ' flush' : '') + '">' + body + '</div></section>';
    },

    empty(title, text, action, ic) {
      return '<div class="empty">' + icon(ic || 'layers', 34) + '<h4>' + esc(title) + '</h4>' + (text ? '<p>' + esc(text) + '</p>' : '') + (action || '') + '</div>';
    },

    progress(p, tone) {
      p = Math.max(0, Math.min(100, Math.round(p || 0)));
      return '<div class="bar' + (tone ? ' bar-' + tone : '') + '"><span style="width:' + p + '%"></span></div>';
    },

    kv(rows) {
      return '<dl class="kv">' + rows.filter(Boolean).map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + (v === undefined || v === null || v === '' ? '—' : v) + '</dd>').join('') + '</dl>';
    },

    tabs(items, active) {
      return '<nav class="segmented">' + items.map(([key, label, href]) =>
        '<a href="' + esc(href) + '" class="' + (key === active ? 'on' : '') + '">' + esc(label) + '</a>').join('') + '</nav>';
    },

    /* Table with built-in search & filter (rows are filtered in place).
       columns: [{label, html(row), cls, sort(row)}]
       opts: {id, rows, rowAction, search(row)->text, filters:[{key,label,options,value(row)}], empty, toolbar} */
    table(opts) {
      const id = opts.id || 't' + U.uid();
      const rows = opts.rows || [];
      const filters = opts.filters || [];
      const hasTools = opts.search || filters.length || opts.toolbar;
      let html = '';
      if (hasTools) {
        html += '<div class="toolbar">';
        if (opts.search) html += '<label class="search">' + icon('search', 15) + '<input type="search" placeholder="' + esc(opts.searchPlaceholder || 'Search') + '" data-search="' + id + '"></label>';
        filters.forEach(f => {
          html += '<select class="filter" data-filter="' + id + '" data-key="' + esc(f.key) + '"><option value="">' + esc(f.label) + '</option>' +
            f.options.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (f.selected === v ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>';
        });
        html += '<div class="toolbar-right">' + (opts.toolbar || '') + '<span class="count" data-count="' + id + '">' + U.plural(rows.length, opts.noun || 'item') + '</span></div></div>';
      }
      if (!rows.length) return html + (opts.empty || UI.empty('Nothing here yet', ''));
      html += '<div class="table-wrap"><table class="tbl" id="' + id + '" data-noun="' + esc(opts.noun || 'item') + '"><thead><tr>' +
        opts.columns.map((c, i) => '<th class="' + (c.cls || '') + '"' + (c.sort ? ' data-sort="' + i + '"' : '') + '>' + esc(c.label) + '</th>').join('') + '</tr></thead><tbody>';
      rows.forEach(r => {
        const f = filters.map(fl => ' data-f-' + fl.key + '="' + esc(fl.value(r)) + '"').join('');
        const s = opts.search ? ' data-s="' + esc(String(opts.search(r)).toLowerCase()) + '"' : '';
        const ra = opts.rowAction ? ' data-action="' + opts.rowAction + '" data-id="' + esc(r.id) + '" class="clickable"' : '';
        html += '<tr' + ra + s + f + '>' + opts.columns.map(c => '<td class="' + (c.cls || '') + '"' + (c.sort ? ' data-v="' + esc(c.sort(r)) + '"' : '') + '>' + c.html(r) + '</td>').join('') + '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    },

    applyFilters(tableId) {
      const t = document.getElementById(tableId);
      if (!t) return;
      const q = (document.querySelector('[data-search="' + tableId + '"]') || {}).value || '';
      const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const fs = Array.from(document.querySelectorAll('[data-filter="' + tableId + '"]')).filter(s => s.value);
      let n = 0;
      t.querySelectorAll('tbody tr').forEach(tr => {
        const s = tr.dataset.s || '';
        let ok = terms.every(w => s.includes(w));
        if (ok) ok = fs.every(sel => (tr.getAttribute('data-f-' + sel.dataset.key) || '') === sel.value);
        tr.style.display = ok ? '' : 'none';
        if (ok) n++;
      });
      const c = document.querySelector('[data-count="' + tableId + '"]');
      if (c) c.textContent = U.plural(n, t.dataset.noun || 'item');
    },

    sortTable(th) {
      const table = th.closest('table');
      const idx = Array.from(th.parentNode.children).indexOf(th);
      const asc = th.dataset.dir !== 'asc';
      table.querySelectorAll('th').forEach(x => delete x.dataset.dir);
      th.dataset.dir = asc ? 'asc' : 'desc';
      const tbody = table.tBodies[0];
      const rows = Array.from(tbody.rows);
      rows.sort((a, b) => {
        const x = a.cells[idx].dataset.v, y = b.cells[idx].dataset.v;
        const nx = parseFloat(x), ny = parseFloat(y);
        const r = (!isNaN(nx) && !isNaN(ny) && /^-?[\d.]+$/.test(x) && /^-?[\d.]+$/.test(y)) ? nx - ny : String(x).localeCompare(String(y));
        return asc ? r : -r;
      });
      rows.forEach(r => tbody.appendChild(r));
    },

    /* Simple bar chart (SVG). data: [{label, value, value2?}] */
    bars(data, opts) {
      opts = opts || {};
      const h = opts.height || 180, w = 600, pad = 24, bottom = 26;
      const max = Math.max(1, ...data.map(d => Math.max(d.value || 0, d.value2 || 0)));
      const bw = (w - pad * 2) / data.length;
      const two = data.some(d => d.value2 !== undefined);
      let s = '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img">';
      [0.25, 0.5, 0.75, 1].forEach(g => {
        const y = h - bottom - (h - bottom - 10) * g;
        s += '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + y + '" y2="' + y + '" class="grid"/>';
      });
      data.forEach((d, i) => {
        const x = pad + i * bw;
        const inner = two ? (bw * 0.62) / 2 : bw * 0.5;
        const bh1 = (h - bottom - 10) * (d.value || 0) / max;
        const x1 = x + (bw - (two ? inner * 2 + 3 : inner)) / 2;
        s += '<rect class="b1" x="' + x1 + '" y="' + (h - bottom - bh1) + '" width="' + inner + '" height="' + Math.max(bh1, 0.5) + '" rx="3"><title>' + esc(d.label + ': ' + U.money(d.value)) + '</title></rect>';
        if (two) {
          const bh2 = (h - bottom - 10) * (d.value2 || 0) / max;
          s += '<rect class="b2" x="' + (x1 + inner + 3) + '" y="' + (h - bottom - bh2) + '" width="' + inner + '" height="' + Math.max(bh2, 0.5) + '" rx="3"><title>' + esc(d.label + ': ' + U.money(d.value2)) + '</title></rect>';
        }
        s += '<text x="' + (x + bw / 2) + '" y="' + (h - 8) + '" text-anchor="middle">' + esc(d.label) + '</text>';
      });
      s += '</svg>';
      let legend = '';
      if (opts.legend) legend = '<div class="legend">' + opts.legend.map((l, i) => '<span><i class="lg' + (i + 1) + '"></i>' + esc(l) + '</span>').join('') + '</div>';
      return '<div class="chart-wrap">' + s + legend + '</div>';
    },

    /* Horizontal bars for breakdowns. data: [{label, value}] */
    hbars(data, fmt) {
      const max = Math.max(1, ...data.map(d => d.value));
      fmt = fmt || U.moneyShort;
      return '<div class="hbars">' + data.map(d =>
        '<div class="hbar"><div class="hbar-label">' + esc(d.label) + '</div><div class="hbar-track"><span style="width:' + (d.value / max * 100) + '%"></span></div><div class="hbar-val">' + fmt(d.value) + '</div></div>').join('') + '</div>';
    },

    /* ---------- Toasts ---------- */
    toast(msg, tone) {
      let box = document.getElementById('toasts');
      if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
      const t = document.createElement('div');
      t.className = 'toast' + (tone ? ' toast-' + tone : '');
      t.innerHTML = icon(tone === 'red' ? 'alert' : 'checkCircle', 16) + '<span>' + esc(msg) + '</span>';
      box.appendChild(t);
      requestAnimationFrame(() => t.classList.add('in'));
      setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 3200);
    },

    /* ---------- Modals ---------- */
    modal(opts) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      wrap.innerHTML = '<div class="modal ' + (opts.size ? 'modal-' + opts.size : '') + '" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><h2>' + esc(opts.title || '') + '</h2><button type="button" class="icon-btn" data-close aria-label="Close">' + icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') + '</div>';
      document.body.appendChild(wrap);
      requestAnimationFrame(() => wrap.classList.add('in'));
      const close = () => {
        wrap.classList.remove('in');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => wrap.remove(), 200);
        if (opts.onClose) opts.onClose();
      };
      const onKey = e => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
      wrap.querySelector('[data-close]').onclick = close;
      wrap.addEventListener('click', e => {
        const a = e.target.closest('[data-maction]');
        if (a && opts.actions && opts.actions[a.dataset.maction]) opts.actions[a.dataset.maction](a, close);
      });
      const api = { el: wrap, body: wrap.querySelector('.modal-body'), close };
      if (opts.onMount) opts.onMount(api);
      return api;
    },

    confirm(text, opts) {
      opts = opts || {};
      return new Promise(resolve => {
        let done = false;
        const m = UI.modal({
          title: opts.title || 'Are you sure?',
          size: 'sm',
          body: '<p class="confirm-text">' + esc(text) + '</p>',
          foot: '<button class="btn" data-maction="no">Cancel</button><button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-maction="yes">' + esc(opts.ok || 'Confirm') + '</button>',
          actions: {
            yes: (a, close) => { done = true; close(); resolve(true); },
            no: (a, close) => close()
          },
          onClose: () => { if (!done) resolve(false); }
        });
        setTimeout(() => { const b = m.el.querySelector('[data-maction="yes"]'); if (b) b.focus(); }, 50);
      });
    },

    /* ---------- Forms ----------
       fields: [{name, label, type, options, required, half, third, hint, placeholder, show(v), min, max, step, rows}]
       type: text|email|tel|number|money|date|time|select|textarea|checkbox|photos|section|note
       options: array of strings | [value,label] | function(values) */
    form(opts) {
      const values = Object.assign({}, opts.values || {});
      const fields = opts.fields;
      const photos = {};

      const optionList = (f, v) => {
        let o = typeof f.options === 'function' ? f.options(v) : (f.options || []);
        return (f.placeholder !== false ? '<option value="">' + esc(f.placeholder || 'Choose…') + '</option>' : '') +
          o.map(x => {
            const val = Array.isArray(x) ? x[0] : x, lab = Array.isArray(x) ? x[1] : x;
            return '<option value="' + esc(val) + '"' + (String(v[f.name] ?? '') === String(val) ? ' selected' : '') + '>' + esc(lab) + '</option>';
          }).join('');
      };

      const fieldHtml = f => {
        const v = values[f.name];
        const cls = 'field' + (f.half ? ' half' : '') + (f.third ? ' third' : '') + (f.span ? ' span' + f.span : '') + (f.type === 'checkbox' ? ' check' : '');
        const req = f.required ? ' required' : '';
        const ph = f.placeholder && f.type !== 'select' ? ' placeholder="' + esc(f.placeholder) + '"' : '';
        if (f.type === 'section') return '<div class="field full section-title" data-field="' + esc(f.name || '') + '">' + esc(f.label) + '</div>';
        if (f.type === 'note') return '<div class="field full form-note" data-field="' + esc(f.name || '') + '">' + (typeof f.html === 'function' ? f.html(values) : f.html) + '</div>';
        let input;
        switch (f.type) {
          case 'select':
            input = '<select name="' + f.name + '"' + req + '>' + optionList(f, values) + '</select>'; break;
          case 'textarea':
            input = '<textarea name="' + f.name + '" rows="' + (f.rows || 3) + '"' + req + ph + '>' + esc(v ?? '') + '</textarea>'; break;
          case 'checkbox':
            return '<label class="' + cls + '" data-field="' + f.name + '"><input type="checkbox" name="' + f.name + '"' + (v ? ' checked' : '') + '><span>' + esc(f.label) + '</span></label>';
          case 'money':
            input = '<div class="money-input"><span>₦</span><input type="text" inputmode="numeric" name="' + f.name + '" value="' + (v || v === 0 ? U.num(v) : '') + '"' + req + ph + ' data-money></div>'; break;
          case 'photos':
            input = '<label class="photo-drop"><input type="file" accept="image/*" multiple data-photos="' + f.name + '">' + icon('photo', 18) + '<span>Add photos</span></label><div class="photo-row" data-photo-row="' + f.name + '"></div>'; break;
          default:
            input = '<input type="' + (f.type === 'number' ? 'number' : f.type || 'text') + '" name="' + f.name + '" value="' + esc(v ?? '') + '"' + req + ph +
              (f.min !== undefined ? ' min="' + f.min + '"' : '') + (f.max !== undefined ? ' max="' + f.max + '"' : '') + (f.step !== undefined ? ' step="' + f.step + '"' : (f.type === 'number' ? ' step="any"' : '')) + '>';
        }
        return '<label class="' + cls + '" data-field="' + f.name + '"><span class="lbl">' + esc(f.label) + (f.required ? '' : '') + '</span>' + input + (f.hint ? '<span class="hint">' + f.hint + '</span>' : '') + '</label>';
      };

      const body = (opts.intro ? '<p class="form-intro">' + opts.intro + '</p>' : '') +
        '<form class="form-grid" novalidate>' + fields.map(fieldHtml).join('') + '<div class="form-error" hidden></div><button type="submit" hidden></button></form>';

      return new Promise(resolve => {
        let settled = false;
        const m = UI.modal({
          title: opts.title, size: opts.size, body,
          foot: (opts.danger ? '<button class="btn btn-ghost-danger" data-maction="danger">' + esc(opts.danger) + '</button><span class="spacer"></span>' : '') +
            '<button class="btn" data-maction="cancel">Cancel</button><button class="btn btn-primary" data-maction="save">' + esc(opts.submit || 'Save') + '</button>',
          actions: {
            cancel: (a, close) => close(),
            save: () => submit(),
            danger: async (a, close) => { if (opts.onDanger && (await opts.onDanger()) !== false) { settled = true; close(); resolve(null); } }
          },
          onClose: () => { if (!settled) resolve(null); }
        });
        const form = m.el.querySelector('form');

        const read = () => {
          const out = Object.assign({}, values);
          fields.forEach(f => {
            if (!f.name || f.type === 'section' || f.type === 'note') return;
            const el = form.elements[f.name];
            if (f.type === 'photos') { out[f.name] = photos[f.name] || []; return; }
            if (!el) return;
            if (f.type === 'checkbox') out[f.name] = el.checked;
            else if (f.type === 'money') out[f.name] = Number(String(el.value).replace(/[^\d.]/g, '')) || 0;
            else if (f.type === 'number') out[f.name] = el.value === '' ? '' : Number(el.value);
            else out[f.name] = el.value.trim();
          });
          return out;
        };

        const refresh = (changed) => {
          const v = read();
          Object.assign(values, v);
          fields.forEach(f => {
            const el = form.querySelector('[data-field="' + (f.name || '') + '"]');
            if (!el) return;
            if (f.show) el.style.display = f.show(v) ? '' : 'none';
            if (f.type === 'select' && typeof f.options === 'function' && f.dependsOn && f.dependsOn.includes(changed)) {
              const sel = form.elements[f.name];
              sel.innerHTML = optionList(f, v);
            }
            if (f.type === 'note' && typeof f.html === 'function') el.innerHTML = f.html(v);
          });
          if (opts.onChange) opts.onChange(v, form, changed);
        };

        form.addEventListener('input', e => {
          if (e.target.dataset.money !== undefined) {
            const raw = e.target.value.replace(/[^\d]/g, '');
            e.target.value = raw ? Number(raw).toLocaleString('en-US') : '';
          }
          refresh(e.target.name);
        });
        form.addEventListener('change', e => {
          const p = e.target.dataset.photos;
          if (p) {
            Array.from(e.target.files).forEach(async file => {
              const url = await U.compressImage(file);
              (photos[p] = photos[p] || []).push(url);
              form.querySelector('[data-photo-row="' + p + '"]').insertAdjacentHTML('beforeend', '<img src="' + url + '" alt="">');
            });
            return;
          }
          refresh(e.target.name);
        });
        form.addEventListener('submit', e => { e.preventDefault(); submit(); });

        const submit = async () => {
          const v = read();
          const err = form.querySelector('.form-error');
          const visible = f => !f.show || f.show(v);
          const missing = fields.filter(f => f.required && visible(f) && (v[f.name] === '' || v[f.name] === null || v[f.name] === undefined || (f.type === 'money' && !v[f.name] && v[f.name] !== 0)));
          form.querySelectorAll('.invalid').forEach(x => x.classList.remove('invalid'));
          if (missing.length) {
            missing.forEach(f => { const el = form.querySelector('[data-field="' + f.name + '"]'); if (el) el.classList.add('invalid'); });
            err.textContent = 'Please fill in: ' + missing.map(f => f.label).join(', ') + '.';
            err.hidden = false;
            return;
          }
          if (opts.validate) {
            const msg = opts.validate(v);
            if (msg) { err.textContent = msg; err.hidden = false; return; }
          }
          let res = true;
          if (opts.onSubmit) res = await opts.onSubmit(v);
          if (typeof res === 'string') { err.textContent = res; err.hidden = false; return; }
          if (res === false) return;
          settled = true;
          m.close();
          resolve(v);
        };

        refresh();
        setTimeout(() => { const first = form.querySelector('input:not([type=hidden]):not([type=file]),select,textarea'); if (first && !opts.noFocus) first.focus(); }, 60);
      });
    },

    // Hydrate <img data-file="id"> after render
    async hydrateImages(root) {
      const imgs = (root || document).querySelectorAll('img[data-file]');
      for (const img of imgs) {
        const src = await DB.getFile(img.dataset.file);
        if (src) img.src = src;
      }
    }
  };

  window.UI = UI;
})();
