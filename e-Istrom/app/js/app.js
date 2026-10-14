/* e-Istrom — app shell: sign-in, sidebar, routing, search, notifications */
(function () {
  const esc = U.esc, icon = UI.icon;

  const NAV = [
    { items: [['/', 'Home', 'home', null]] },
    { title: 'Sales', items: [
      ['/leads', 'Enquiries', 'target', 'leads.view'],
      ['/inspections', 'Site inspections', 'pin', ['inspections.manage', 'leads.view']],
      ['/clients', 'Clients', 'users', 'clients.view'],
      ['/sales', 'Sales', 'tag', 'sales.view']
    ]},
    { title: 'Properties', items: [
      ['/projects', 'Projects & units', 'building', 'projects.view'],
      ['/estates', 'Estate management', 'key', 'estates.view']
    ]},
    { title: 'Money', items: [
      ['/payments', 'Client payments', 'receipt', 'payments.view'],
      ['/expenses', 'Expenses', 'wallet', 'finance.view'],
      ['/payroll', 'Payroll', 'cash', 'payroll.view'],
      ['/cashbook', 'Cash book', 'chart', 'finance.view'],
      ['/vendors', 'Vendors', 'hammer', ['vendors.manage', 'finance.view', 'purchases.view']]
    ]},
    { title: 'Requests', items: [
      ['/approvals', 'Approvals', 'stamp', null],
      ['/purchases', 'Purchase requests', 'clipboard', null],
      ['/leave', 'Leave', 'calendar', null]
    ]},
    { title: 'Operations', items: [
      ['/vehicles', 'Vehicles', 'car', 'vehicles.view'],
      ['/stores', 'Stores & inventory', 'box', 'inventory.view']
    ]},
    { title: 'Office', items: [
      ['/staff', 'Staff', 'user', null],
      ['/memos', 'Memos', 'megaphone', null],
      ['/visitors', 'Visitors', 'door', 'visitors.manage'],
      ['/documents', 'Documents', 'doc', ['documents.issue', 'payments.record']]
    ]},
    { title: 'Insight', items: [
      ['/reports', 'Reports', 'chart', 'reports.view'],
      ['/settings', 'Settings', 'gear', 'settings.manage']
    ]}
  ];

  function allowed(perm) {
    if (!perm) return true;
    return Array.isArray(perm) ? perm.some(p => Auth.can(p)) : Auth.can(perm);
  }

  const routes = [];
  let current = null;

  const App = {
    NAV, allowed,

    route(path, perm, fn) {
      const keys = [];
      const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
      routes.push({ re, keys, perm, fn });
    },

    go(path) { if (location.hash === '#' + path) App.render(); else location.hash = path; },

    path() { return (location.hash.slice(1) || '/').split('?')[0]; },

    query() {
      const q = (location.hash.split('?')[1] || '');
      return Object.fromEntries(new URLSearchParams(q));
    },

    async boot() {
      document.body.innerHTML = '<div class="boot">' + wordmark() + '</div>';
      await DB.init();
      if (DB.isEmpty()) { await Seed.run(); await DB.saveAll(); }
      if (!DB.persistent) UI.toast('This browser is blocking storage. Changes won’t be kept after closing.', 'red');
      window.addEventListener('hashchange', () => App.render());
      bindGlobal();
      if (Auth.restore()) App.shell(); else App.signInScreen();
    },

    /* ---------- Sign in ---------- */
    signInScreen() {
      document.body.className = 'auth';
      const demo = DB.setting('showDemoAccounts', true) && DB.meta.sampleData;
      const demoUsers = demo ? U.sortBy(DB.filter('staff', s => s.canLogin && s.demo), s => Object.keys(Auth.ROLES).indexOf(s.role)) : [];
      document.body.innerHTML =
        '<main class="signin">' +
          '<section class="signin-card">' +
            wordmark() +
            '<h1>Sign in to e-Istrom</h1><p class="sub">The Istrom office, in one place.</p>' +
            '<form id="signin" class="form-grid" autocomplete="on">' +
              '<label class="field full"><span class="lbl">Work email</span><input name="email" type="email" required autocomplete="username"></label>' +
              '<label class="field full"><span class="lbl">Password</span><input name="password" type="password" required autocomplete="current-password"></label>' +
              '<div class="form-error" hidden></div>' +
              '<button class="btn btn-primary btn-block" type="submit">Sign in</button>' +
            '</form>' +
            '<p class="fine">Forgot your password? Ask the Admin & IT office to reset it.</p>' +
          '</section>' +
          (demoUsers.length ? '<aside class="demo-card"><h3>Try it as…</h3><p class="sub">Sample accounts, one for each job role. Each sees only what that role is allowed to.</p><div class="demo-list">' +
            demoUsers.map(s => '<button type="button" class="demo-user" data-email="' + esc(s.loginEmail) + '">' + UI.avatar(s.name, 32) + '<span><b>' + esc(Auth.roleLabel(s.role)) + '</b><small>' + esc(s.name) + '</small></span>' + icon('chevron', 14) + '</button>').join('') +
            '</div><p class="fine">Sample password: <code>istrom2026</code></p></aside>' : '') +
        '</main>';
      const form = document.getElementById('signin');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const r = await Auth.signIn(form.email.value, form.password.value);
        if (r.error) { const er = form.querySelector('.form-error'); er.textContent = r.error; er.hidden = false; return; }
        App.shell();
      });
      document.querySelectorAll('.demo-user').forEach(b => b.addEventListener('click', async () => {
        const r = await Auth.signIn(b.dataset.email, 'istrom2026');
        if (r.ok) App.shell();
        else { form.email.value = b.dataset.email; form.password.focus(); }
      }));
      setTimeout(() => form.email.focus(), 50);
    },

    /* ---------- Main shell ---------- */
    shell() {
      document.body.className = 'app';
      const u = Auth.user;
      document.body.innerHTML =
        '<aside class="sidebar" id="sidebar">' +
          '<div class="brand">' + wordmark(true) + '</div>' +
          '<nav class="nav" id="nav"></nav>' +
          '<div class="me" data-action-global="me">' + UI.avatar(u.name, 30) + '<span><b>' + esc(u.name) + '</b><small>' + esc(Auth.roleLabel(u.role)) + '</small></span>' + icon('more', 16) + '</div>' +
        '</aside>' +
        '<div class="main">' +
          '<header class="topbar">' +
            '<button class="icon-btn menu-btn" data-action-global="menu" aria-label="Menu">' + icon('menu', 20) + '</button>' +
            '<button class="searchbox" data-action-global="search">' + icon('search', 15) + '<span>Search clients, units, staff…</span><kbd>Ctrl K</kbd></button>' +
            '<div class="top-right"><button class="icon-btn bell" data-action-global="bell" aria-label="Notifications">' + icon('bell', 19) + '<i class="dot" id="bell-dot" hidden></i></button></div>' +
          '</header>' +
          (DB.meta.sampleData ? '<div class="sample-banner">' + icon('info', 14) + ' You’re looking at sample data so you can try things out. ' + (Auth.can('settings.manage') ? '<a href="#/settings?tab=data">Start fresh with real data</a>' : 'An administrator can clear it when you’re ready.') + '</div>' : '') +
          '<main id="page" class="page"></main>' +
        '</div>';
      App.render();
    },

    renderNav() {
      const nav = document.getElementById('nav');
      if (!nav) return;
      const path = App.path();
      const counts = App.navCounts();
      nav.innerHTML = NAV.map(g => {
        const items = g.items.filter(i => allowed(i[3]));
        if (!items.length) return '';
        return '<div class="nav-group">' + (g.title ? '<div class="nav-title">' + esc(g.title) + '</div>' : '') +
          items.map(([href, label, ic]) => {
            const on = href === '/' ? path === '/' : (path === href || path.startsWith(href + '/'));
            const n = counts[href];
            return '<a href="#' + href + '" class="' + (on ? 'on' : '') + '">' + icon(ic, 17) + '<span>' + esc(label) + '</span>' + (n ? '<em>' + n + '</em>' : '') + '</a>';
          }).join('') + '</div>';
      }).join('');
    },

    navCounts() {
      const c = {};
      c['/approvals'] = Biz.pendingForMe().length;
      if (Auth.can('leave.approve')) c['/leave'] = DB.filter('leave', l => l.status === 'Pending' && l.staffId !== Auth.user.id).length;
      if (Auth.can('estates.manage')) c['/estates'] = DB.filter('complaints', x => x.status !== 'Resolved').length;
      const unread = DB.filter('memos', m => !(m.readBy || []).includes(Auth.user.id) && App.memoVisible(m)).length;
      c['/memos'] = unread;
      return c;
    },

    memoVisible(m) { return !m.audience || m.audience === 'All staff' || m.audience === Auth.user.department || m.createdBy === Auth.user.id; },

    render() {
      if (!Auth.user) return App.signInScreen();
      const page = document.getElementById('page');
      if (!page) return App.shell();
      const path = App.path();
      let match = null, params = {};
      for (const r of routes) {
        const m = path.match(r.re);
        if (m) { match = r; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); break; }
      }
      const same = current && current.path === location.hash;
      const scroll = same ? document.querySelector('.main').scrollTop : 0;
      let view;
      if (!match) view = { title: 'Not found', html: UI.empty('Page not found', 'That page doesn’t exist.', '<a class="btn" href="#/">Go home</a>') };
      else if (!allowed(match.perm)) view = { title: 'No access', html: UI.empty('You don’t have access to this', 'Your role doesn’t include this area. Ask the MD or Admin if you need it.', '<a class="btn" href="#/">Go home</a>', 'lock') };
      else {
        try { view = match.fn(params, App.query()) || {}; }
        catch (e) { console.error(e); view = { title: 'Error', html: UI.empty('Something went wrong', String(e.message || e), '<a class="btn" href="#/">Go home</a>', 'alert') }; }
      }
      current = { path: location.hash, view };
      page.innerHTML = view.html || '';
      document.title = (view.title ? view.title + ' – ' : '') + 'e-Istrom';
      App.renderNav();
      App.updateBell();
      document.getElementById('sidebar').classList.remove('open');
      if (view.mount) view.mount(page);
      UI.hydrateImages(page);
      document.querySelector('.main').scrollTop = scroll;
    },

    refresh() { App.render(); },

    /* ---------- Notifications ---------- */
    attention() {
      const out = [];
      const ap = Biz.pendingForMe();
      if (ap.length) out.push({ icon: 'stamp', text: U.plural(ap.length, 'item') + ' waiting for your approval', href: '/approvals', tone: 'amber' });
      if (Auth.can('leave.approve')) {
        const n = DB.filter('leave', l => l.status === 'Pending' && l.staffId !== Auth.user.id).length;
        if (n) out.push({ icon: 'calendar', text: U.plural(n, 'leave request') + ' to review', href: '/leave', tone: 'amber' });
      }
      if (Auth.can('payments.view')) {
        const od = Biz.visibleSales().filter(s => s.status === 'active' && Biz.saleStats(s).overdue > 0);
        if (od.length) out.push({ icon: 'alert', text: U.plural(od.length, 'client') + ' behind on payments', href: '/payments?tab=overdue', tone: 'red' });
      }
      const mine = DB.filter('complaints', c => c.assignedTo === Auth.user.id && c.status !== 'Resolved');
      if (mine.length) out.push({ icon: 'tool', text: U.plural(mine.length, 'complaint') + ' assigned to you', href: '/estates?tab=complaints', tone: 'amber' });
      if (Auth.can('estates.manage')) {
        const urgent = DB.filter('complaints', c => c.priority === 'Urgent' && c.status !== 'Resolved');
        if (urgent.length) out.push({ icon: 'alert', text: U.plural(urgent.length, 'urgent complaint') + ' open', href: '/estates?tab=complaints', tone: 'red' });
      }
      if (Auth.can('inventory.manage')) {
        const low = DB.filter('items', i => Biz.stockLabel(i) !== 'In stock');
        if (low.length) out.push({ icon: 'box', text: U.plural(low.length, 'store item') + ' low or out of stock', href: '/stores', tone: 'amber' });
      }
      if (Auth.can('vehicles.manage')) {
        const due = DB.all('vehicles').filter(v => Biz.papersDue(v, 30).length);
        if (due.length) out.push({ icon: 'car', text: U.plural(due.length, 'vehicle') + ' with papers expiring soon', href: '/vehicles', tone: 'amber' });
      }
      if (Auth.can('inspections.manage')) {
        const today = DB.filter('inspections', i => i.date === U.today() && i.status === 'Scheduled');
        if (today.length) out.push({ icon: 'pin', text: U.plural(today.length, 'site inspection') + ' today', href: '/inspections', tone: 'blue' });
      }
      if (Auth.can('leads.manage')) {
        const fu = DB.filter('leads', l => l.nextFollowUp && l.nextFollowUp <= U.today() && !['Won', 'Lost'].includes(l.stage) && (l.assignedTo === Auth.user.id || Auth.user.role === 'sales_head'));
        if (fu.length) out.push({ icon: 'phone', text: U.plural(fu.length, 'enquiry', 'enquiries') + ' due for follow-up', href: '/leads?tab=followup', tone: 'blue' });
      }
      const myReq = DB.filter('approvals', a => a.requestedBy === Auth.user.id && a.status !== 'pending' && a.closedAt && !a.seenByRequester);
      if (myReq.length) out.push({ icon: 'checkCircle', text: U.plural(myReq.length, 'of your requests', 'of your requests') + ' decided', href: '/approvals?tab=mine', tone: 'green' });
      const memos = DB.filter('memos', m => !(m.readBy || []).includes(Auth.user.id) && App.memoVisible(m));
      if (memos.length) out.push({ icon: 'megaphone', text: U.plural(memos.length, 'unread memo') , href: '/memos', tone: 'blue' });
      return out;
    },

    updateBell() {
      const dot = document.getElementById('bell-dot');
      if (dot) dot.hidden = !App.attention().length;
    },

    showBell() {
      const items = App.attention();
      UI.modal({
        title: 'Needs your attention', size: 'sm',
        body: items.length ? '<div class="attn">' + items.map(i => '<a href="#' + i.href + '" class="attn-item tone-' + i.tone + '" data-close-on>' + icon(i.icon, 17) + '<span>' + esc(i.text) + '</span>' + icon('chevron', 14) + '</a>').join('') + '</div>'
          : UI.empty('You’re all caught up', 'Nothing needs your attention right now.', '', 'checkCircle'),
        onMount: m => m.el.querySelectorAll('[data-close-on]').forEach(a => a.addEventListener('click', () => m.close()))
      });
    },

    /* ---------- Search ---------- */
    search() {
      const m = UI.modal({
        title: 'Search', size: 'md',
        body: '<label class="search search-lg">' + icon('search', 17) + '<input id="gsearch" type="search" placeholder="Name, phone, unit code, receipt number…" autocomplete="off"></label><div id="gresults" class="gresults"></div>'
      });
      const input = m.el.querySelector('#gsearch');
      const box = m.el.querySelector('#gresults');
      const run = () => {
        const q = input.value.trim().toLowerCase();
        if (q.length < 2) { box.innerHTML = '<p class="muted pad">Type at least two letters.</p>'; return; }
        const hit = s => String(s || '').toLowerCase().includes(q);
        const groups = [];
        if (Auth.can('clients.view')) groups.push(['Clients', DB.filter('clients', c => hit(c.name) || hit(c.phone) || hit(c.email) || hit(c.clientNo)).slice(0, 6).map(c => [c.name, c.phone || c.clientNo, '/clients/' + c.id, 'users'])]);
        if (Auth.can('leads.view')) groups.push(['Enquiries', DB.filter('leads', l => hit(l.name) || hit(l.phone)).slice(0, 5).map(l => [l.name, l.stage + ' · ' + (l.phone || ''), '/leads?open=' + l.id, 'target'])]);
        if (Auth.can('projects.view')) {
          groups.push(['Projects', DB.filter('projects', p => hit(p.name) || hit(p.location)).slice(0, 4).map(p => [p.name, p.location, '/projects/' + p.id, 'building'])]);
          groups.push(['Units', DB.filter('units', u => hit(u.code)).slice(0, 6).map(u => [u.code, u.type + ' · ' + Biz.projectName(u.projectId), '/projects/' + u.projectId + '?unit=' + u.id, 'layers'])]);
        }
        if (Auth.can('payments.view')) groups.push(['Receipts', DB.filter('payments', p => hit(p.receiptNo)).slice(0, 4).map(p => [p.receiptNo, U.money(p.amount) + ' · ' + Biz.clientName(p.clientId), '/clients/' + p.clientId, 'receipt'])]);
        if (Auth.can('sales.view')) groups.push(['Sales', Biz.visibleSales().filter(s => hit(s.number)).slice(0, 4).map(s => [s.number, Biz.clientName(s.clientId), '/sales/' + s.id, 'tag'])]);
        groups.push(['Staff', DB.filter('staff', s => s.status !== 'Left' && (hit(s.name) || hit(s.title) || hit(s.phone))).slice(0, 5).map(s => [s.name, s.title, '/staff/' + s.id, 'user'])]);
        if (allowed(['vendors.manage', 'finance.view', 'purchases.view'])) groups.push(['Vendors', DB.filter('vendors', v => hit(v.name)).slice(0, 4).map(v => [v.name, v.category, '/vendors', 'hammer'])]);
        const html = groups.filter(g => g[1].length).map(g => '<div class="gr-group"><div class="gr-title">' + g[0] + '</div>' +
          g[1].map(([t, s, href, ic]) => '<a href="#' + href + '" class="gr-item">' + icon(ic, 16) + '<span><b>' + esc(t) + '</b><small>' + esc(s || '') + '</small></span></a>').join('') + '</div>').join('');
        box.innerHTML = html || '<p class="muted pad">No matches for “' + esc(input.value) + '”.</p>';
      };
      input.addEventListener('input', U.debounce(run, 120));
      box.addEventListener('click', e => { if (e.target.closest('a')) m.close(); });
      setTimeout(() => input.focus(), 50);
      run();
    },

    meMenu() {
      const u = Auth.user;
      UI.modal({
        title: u.name, size: 'sm',
        body: '<div class="me-card">' + UI.avatar(u.name, 52) + '<div><b>' + esc(u.title || '') + '</b><br><span class="muted">' + esc(Auth.roleLabel(u.role)) + ' · ' + esc(u.department || '') + '</span><br><span class="muted">' + esc(u.loginEmail || '') + '</span></div></div>' +
          '<div class="menu-list">' +
          '<button class="menu-item" data-maction="profile">' + icon('user', 16) + 'My staff record</button>' +
          '<button class="menu-item" data-maction="leave">' + icon('calendar', 16) + 'Request leave</button>' +
          '<button class="menu-item" data-maction="pw">' + icon('lock', 16) + 'Change my password</button>' +
          '<button class="menu-item" data-maction="role">' + icon('shield', 16) + 'What my role can do</button>' +
          '<button class="menu-item danger" data-maction="out">' + icon('logout', 16) + 'Sign out</button></div>',
        actions: {
          profile: (a, close) => { close(); App.go('/staff/' + u.id); },
          leave: (a, close) => { close(); App.go('/leave?new=1'); },
          role: (a, close) => { close(); App.showRole(u.role); },
          pw: async (a, close) => {
            close();
            const v = await UI.form({
              title: 'Change password', size: 'sm',
              fields: [
                { name: 'old', label: 'Current password', type: 'password', required: true },
                { name: 'pw', label: 'New password', type: 'password', required: true, hint: 'At least 8 characters.' },
                { name: 'pw2', label: 'Type it again', type: 'password', required: true }
              ],
              onSubmit: async v => {
                if ((await Auth.passwordHash(v.old, u.salt || '')) !== u.passHash) return 'Your current password isn’t right.';
                if (v.pw.length < 8) return 'Please use at least 8 characters.';
                if (v.pw !== v.pw2) return 'The two new passwords don’t match.';
                await Auth.setPassword(u, v.pw);
              }
            });
            if (v) UI.toast('Password changed');
          },
          out: (a, close) => { close(); Auth.signOut(); location.hash = '/'; App.signInScreen(); }
        }
      });
    },

    showRole(role) {
      const r = Auth.ROLES[role];
      const perms = Auth.rolePerms(role);
      UI.modal({
        title: Auth.roleLabel(role), size: 'md',
        body: '<p>' + esc(r ? r.summary : '') + '</p>' + (r && r.cannot ? '<p class="muted">' + esc(r.cannot) + '</p>' : '') +
          '<div class="perm-list">' + Auth.PERMISSIONS.map(g => {
            const items = g.items.filter(i => perms.includes(i[0]));
            return items.length ? '<h4>' + esc(g.group) + '</h4><ul>' + items.map(i => '<li>' + icon('check', 14) + esc(i[1]) + '</li>').join('') + '</ul>' : '';
          }).join('') + '<h4>Everyone</h4><ul><li>' + icon('check', 14) + 'See the dashboard, staff directory and memos</li><li>' + icon('check', 14) + 'Request leave and raise purchase requests</li></ul></div>'
      });
    }
  };

  function wordmark(small) {
    return '<div class="wordmark' + (small ? ' sm' : '') + '"><span class="wm">istrom</span><span class="wm-sub">e-Istrom</span></div>';
  }

  function bindGlobal() {
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-action-global]');
      if (g) {
        const a = g.dataset.actionGlobal;
        if (a === 'search') App.search();
        if (a === 'bell') App.showBell();
        if (a === 'me') App.meMenu();
        if (a === 'menu') document.getElementById('sidebar').classList.toggle('open');
        return;
      }
      const th = e.target.closest('th[data-sort]');
      if (th) { UI.sortTable(th); return; }
      const page = document.getElementById('page');
      if (!page || !page.contains(e.target)) return;
      if (e.target.closest('a[href]') && !e.target.closest('[data-action]')) return;
      const act = e.target.closest('[data-action]');
      if (act && current && current.view.actions && current.view.actions[act.dataset.action]) {
        e.preventDefault();
        current.view.actions[act.dataset.action](act.dataset.id, act, e);
        return;
      }
      const link = e.target.closest('[data-href]');
      if (link) App.go(link.dataset.href);
    });
    document.addEventListener('input', e => {
      if (e.target.dataset.search) UI.applyFilters(e.target.dataset.search);
    });
    document.addEventListener('change', e => {
      if (e.target.dataset.filter) UI.applyFilters(e.target.dataset.filter);
      const page = document.getElementById('page');
      const act = e.target.dataset.change;
      if (act && page && page.contains(e.target) && current.view.actions && current.view.actions[act]) current.view.actions[act](e.target.value, e.target);
    });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && Auth.user) { e.preventDefault(); App.search(); }
    });
  }

  window.App = App;
})();
