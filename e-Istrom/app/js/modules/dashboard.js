/* e-Istrom — Home dashboard (adapts to each person's role) */
(function () {
  const esc = U.esc, icon = UI.icon;

  App.route('/', null, () => {
    const u = Auth.user;
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const today = U.today();
    const month = today.slice(0, 7);
    const stats = [];

    if (Auth.can('projects.view') && Auth.can('sales.view')) {
      const units = DB.all('units');
      const sold = units.filter(x => x.status !== 'available').length;
      stats.push(UI.stat('Units sold', U.num(sold) + '<span class="muted" style="font-size:15px;font-weight:500"> / ' + U.num(units.length) + '</span>', U.num(units.filter(x => x.status === 'available').length) + ' still available', { href: '/projects', icon: 'building' }));
    } else if (Auth.can('projects.view')) {
      stats.push(UI.stat('Projects', U.num(DB.all('projects').length), U.num(DB.filter('projects', p => p.status !== 'Completed').length) + ' under construction', { href: '/projects', icon: 'building' }));
    }
    if (Auth.can('sales.view')) {
      const ms = Biz.visibleSales().filter(s => s.status !== 'cancelled' && (s.date || '').startsWith(month));
      stats.push(UI.stat('Sales this month', U.moneyShort(U.sum(ms, s => s.price)), U.plural(ms.length, 'unit') + ' sold', { href: '/sales', icon: 'tag' }));
    }
    if (Auth.can('payments.view')) {
      const pm = DB.filter('payments', p => (p.date || '').startsWith(month) && p.amount > 0);
      stats.push(UI.stat('Collected this month', U.moneyShort(U.sum(pm, p => p.amount)), U.plural(pm.length, 'payment'), { href: '/payments', icon: 'receipt' }));
      const st = Biz.visibleSales().filter(s => s.status === 'active').map(Biz.saleStats);
      const od = st.filter(x => x.overdue > 0);
      stats.push(UI.stat('Overdue from clients', U.moneyShort(U.sum(od, x => x.overdue)), U.plural(od.length, 'client') + ' behind · ' + U.moneyShort(U.sum(st, x => x.balance)) + ' still to collect', { href: '/payments?tab=overdue', icon: 'alert', tone: od.length ? 'red' : '' }));
    }
    if (Auth.can('finance.view')) {
      const ex = DB.filter('expenses', e => e.status === 'paid' && (e.paidDate || e.date || '').startsWith(month));
      stats.push(UI.stat('Spent this month', U.moneyShort(U.sum(ex, e => e.amount)), U.plural(ex.length, 'expense'), { href: '/expenses', icon: 'wallet' }));
    }
    if (Auth.can('estates.view')) {
      const open = DB.filter('complaints', c => c.status !== 'Resolved');
      stats.push(UI.stat('Open complaints', U.num(open.length), U.num(open.filter(c => c.priority === 'Urgent').length) + ' urgent', { href: '/estates?tab=complaints', icon: 'tool', tone: open.some(c => c.priority === 'Urgent') ? 'amber' : '' }));
    }
    if (Auth.can('leads.view')) {
      const mine = DB.filter('leads', l => !['Won', 'Lost'].includes(l.stage) && (u.role !== 'sales' || l.assignedTo === u.id));
      stats.push(UI.stat(u.role === 'sales' ? 'My open enquiries' : 'Open enquiries', U.num(mine.length), U.num(mine.filter(l => l.stage === 'New').length) + ' new', { href: '/leads', icon: 'target' }));
    }
    if (Auth.can('inventory.view') && !Auth.can('sales.view')) {
      const low = DB.filter('items', i => Biz.stockLabel(i) !== 'In stock');
      stats.push(UI.stat('Store items low', U.num(low.length), 'of ' + U.num(DB.all('items').length) + ' items', { href: '/stores', icon: 'box', tone: low.length ? 'amber' : '' }));
    }
    if (Auth.can('staff.manage') || Auth.can('leave.approve')) {
      const onLeave = DB.filter('leave', l => l.status === 'Approved' && l.from <= today && l.to >= today);
      stats.push(UI.stat('Staff', U.num(DB.filter('staff', s => s.status !== 'Left').length), U.num(onLeave.length) + ' on leave today', { href: '/staff', icon: 'users' }));
    }
    if (Auth.can('visitors.manage')) {
      const inside = DB.filter('visitors', v => v.date === today && !v.timeOut);
      stats.push(UI.stat('Visitors today', U.num(DB.filter('visitors', v => v.date === today).length), U.num(inside.length) + ' still in the building', { href: '/visitors', icon: 'door' }));
    }

    // Attention
    const attn = App.attention();
    const attnHtml = attn.length
      ? '<div class="attn">' + attn.map(i => '<a href="#' + i.href + '" class="attn-item tone-' + i.tone + '">' + icon(i.icon, 17) + '<span>' + esc(i.text) + '</span>' + icon('chevron', 14) + '</a>').join('') + '</div>'
      : '<div class="empty" style="padding:22px">' + icon('checkCircle', 28) + '<h4>You’re all caught up</h4><p>Nothing needs your attention right now.</p></div>';

    // Money chart
    let chart = '';
    if (Auth.can('payments.view')) {
      const months = U.lastMonths(12);
      const inBy = U.groupBy(DB.filter('payments', p => p.amount > 0), p => p.date.slice(0, 7));
      let data, legend;
      if (Auth.can('finance.view')) {
        const out = U.groupBy(Biz.cashEntries().filter(e => e.kind === 'out'), e => String(e.date).slice(0, 7));
        data = months.map(m => ({ label: U.monthLabel(m).slice(0, 3), value: U.sum(inBy[m] || [], p => p.amount), value2: U.sum(out[m] || [], e => e.amount) }));
        legend = ['Collected from clients', 'Spent'];
      } else {
        data = months.map(m => ({ label: U.monthLabel(m).slice(0, 3), value: U.sum(inBy[m] || [], p => p.amount) }));
        legend = ['Collected from clients'];
      }
      chart = UI.card('Money over the last 12 months', UI.bars(data, { legend }), { actions: Auth.can('finance.view') ? '<a href="#/cashbook" class="btn btn-sm btn-ghost">Cash book</a>' : '' });
    }

    // Projects progress
    let proj = '';
    if (Auth.can('projects.view')) {
      const list = DB.filter('projects', p => p.status !== 'Completed');
      proj = UI.card('Projects under construction', '<div class="list">' + list.map(p => {
        const units = DB.filter('units', x => x.projectId === p.id);
        const sold = units.filter(x => x.status !== 'available').length;
        return '<a class="list-item" href="#/projects/' + p.id + '"><div class="grow"><div class="split"><span class="t">' + esc(p.name) + '</span><span class="s">' + p.progress + '% built</span></div>' +
          UI.progress(p.progress) + (units.length && Auth.can('sales.view') ? '<div class="s" style="margin-top:4px">' + sold + ' of ' + units.length + ' units sold</div>' : '') + '</div></a>';
      }).join('') + '</div>', { actions: '<a href="#/projects" class="btn btn-sm btn-ghost">All projects</a>' });
    }

    // Today
    const todayItems = [];
    if (Auth.can('inspections.manage')) {
      DB.filter('inspections', i => i.date === today && i.status === 'Scheduled').forEach(i =>
        todayItems.push('<a class="list-item" href="#/inspections"><span class="dot-ic">' + icon('pin', 16) + '</span><div class="grow"><div class="t">' + esc(i.time) + ' · Inspection with ' + esc(i.name) + '</div><div class="s">' + esc(Biz.projectName(i.projectId)) + ' · ' + esc(Biz.staffName(i.staffId)) + '</div></div></a>'));
    }
    DB.filter('leave', l => l.status === 'Approved' && l.from <= today && l.to >= today).slice(0, 4).forEach(l =>
      todayItems.push('<div class="list-item"><span class="dot-ic">' + icon('calendar', 16) + '</span><div class="grow"><div class="t">' + esc(Biz.staffName(l.staffId)) + ' is on leave</div><div class="s">Back ' + U.date(U.addDays(l.to, 1)) + '</div></div></div>'));

    // Memos
    const memos = U.sortBy(DB.filter('memos', m => App.memoVisible(m)), m => (m.pinned ? 1e15 : 0) + m.createdAt, true).slice(0, 3);
    const memoHtml = memos.length ? '<div class="list">' + memos.map(m => '<a class="list-item" href="#/memos"><span class="dot-ic">' + icon('megaphone', 16) + '</span><div class="grow"><div class="t">' + esc(m.title) + '</div><div class="s">' + esc(Biz.staffName(m.createdBy)) + ' · ' + U.ago(m.createdAt) + '</div></div>' + (!(m.readBy || []).includes(u.id) ? UI.badge('New', 'accent') : '') + '</a>').join('') + '</div>' : UI.empty('No memos yet', '');

    // Activity
    let act = '';
    if (Auth.can('audit.view')) {
      const items = DB.all('activity').slice(-7).reverse();
      act = UI.card('Recent activity', '<div class="list">' + items.map(a => '<div class="list-item"><div class="grow"><div class="t" style="font-weight:500">' + esc(a.text) + '</div><div class="s">' + esc(a.who) + ' · ' + U.ago(a.createdAt) + '</div></div></div>').join('') + '</div>');
    }

    const quick = [];
    if (Auth.can('leads.manage')) quick.push(UI.btn('New enquiry', 'go', { icon: 'plus', data: { to: '/leads?new=1' } }));
    if (Auth.can('sales.manage')) quick.push(UI.btn('New sale', 'go', { icon: 'tag', data: { to: '/sales?new=1' } }));
    if (Auth.can('payments.record')) quick.push(UI.btn('Record payment', 'go', { icon: 'receipt', kind: 'primary', data: { to: '/payments?new=1' } }));
    if (Auth.can('complaints.log') && !Auth.can('payments.record')) quick.push(UI.btn('Log complaint', 'go', { icon: 'tool', data: { to: '/estates?tab=complaints&new=1' } }));
    if (Auth.can('visitors.manage')) quick.push(UI.btn('Sign in visitor', 'go', { icon: 'door', data: { to: '/visitors?new=1' } }));

    const html =
      '<div class="page-head"><div><h1 class="welcome">' + greet + ', ' + esc(u.name.split(' ')[0]) + '</h1><p class="date-line">' + new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + esc(Auth.roleLabel(u.role)) + '</p></div><div class="head-actions">' + quick.join('') + '</div></div>' +
      (stats.length ? '<div class="stats">' + stats.slice(0, 8).join('') + '</div>' : '') +
      '<div class="grid g-main">' +
        '<div class="stack">' + (chart || '') + (proj || '') + (!chart && !proj ? UI.card('Memos & announcements', memoHtml) : '') + '</div>' +
        '<div class="stack">' + UI.card('Needs your attention', attnHtml) +
          (todayItems.length ? UI.card('Today', '<div class="list">' + todayItems.join('') + '</div>') : '') +
          ((chart || proj) ? UI.card('Memos & announcements', memoHtml, { actions: '<a href="#/memos" class="btn btn-sm btn-ghost">All</a>' }) : '') +
          act +
        '</div>' +
      '</div>';

    return {
      title: 'Home', html,
      actions: { go: (id, el) => App.go(el.dataset.to) }
    };
  });
})();
