/* e-Istrom — sign-in, roles and what each role may do */
(function () {

  // Every permission, in plain language (shown on the Roles screen)
  const PERMISSIONS = [
    { group: 'Projects', items: [
      ['projects.view', 'See projects and units'],
      ['projects.manage', 'Add or edit projects, units and prices'],
      ['construction.update', 'Post construction progress updates']
    ]},
    { group: 'Sales', items: [
      ['leads.view', 'See enquiries (leads)'],
      ['leads.manage', 'Add and follow up enquiries'],
      ['clients.view', 'See clients'],
      ['clients.manage', 'Add or edit clients'],
      ['sales.view', 'See sales'],
      ['sales.manage', 'Create sales and request discounts'],
      ['documents.issue', 'Issue offer and allocation letters'],
      ['inspections.manage', 'Book site inspections']
    ]},
    { group: 'Money', items: [
      ['payments.view', 'See client payments and balances'],
      ['payments.record', 'Record client payments and issue receipts'],
      ['refunds.request', 'Request refunds'],
      ['finance.view', 'See company expenses and cash book'],
      ['finance.manage', 'Record expenses and mark them paid'],
      ['payroll.view', 'See salaries'],
      ['payroll.manage', 'Prepare and pay monthly payroll'],
      ['vendors.manage', 'Add or edit vendors and contractors']
    ]},
    { group: 'Approvals', items: [
      ['approvals.md', 'Approve as Managing Director'],
      ['approvals.chairman', 'Approve as Chairman (large amounts)'],
      ['purchases.view', 'See all purchase requests']
    ]},
    { group: 'People & office', items: [
      ['staff.manage', 'Add or edit staff records'],
      ['leave.approve', 'Approve leave requests'],
      ['memos.post', 'Post memos and announcements'],
      ['visitors.manage', 'Keep the visitor log']
    ]},
    { group: 'Estates & operations', items: [
      ['estates.view', 'See estates, complaints and service charges'],
      ['complaints.log', 'Log residents’ complaints'],
      ['estates.manage', 'Assign and resolve complaints'],
      ['servicecharge.manage', 'Bill and record service charges'],
      ['vehicles.view', 'See company vehicles'],
      ['vehicles.manage', 'Manage vehicles, trips, fuel and repairs'],
      ['inventory.view', 'See stores and stock levels'],
      ['inventory.manage', 'Receive and issue stock']
    ]},
    { group: 'Reports & system', items: [
      ['reports.view', 'See sales and operations reports'],
      ['reports.finance', 'See financial reports'],
      ['settings.manage', 'Manage users, company settings and backups'],
      ['audit.view', 'See the activity log']
    ]}
  ];

  const ALL = PERMISSIONS.flatMap(g => g.items.map(i => i[0]));
  const VIEW_ALL = ALL.filter(p => /\.view$/.test(p)).concat(['reports.finance', 'audit.view']);

  // Things every signed-in person can do: dashboard, staff directory, memos,
  // request leave, raise purchase requests.
  const ROLES = {
    chairman: {
      label: 'Chairman',
      summary: 'Sees everything. Gives final approval on large amounts.',
      cannot: 'Does not do day-to-day data entry.',
      perms: VIEW_ALL.concat(['approvals.chairman', 'memos.post'])
    },
    md: {
      label: 'Managing Director',
      summary: 'Sees and can do everything. Approves discounts, refunds, expenses, purchases and payroll.',
      cannot: 'Cannot give the Chairman’s approval on very large amounts.',
      perms: ALL.filter(p => p !== 'approvals.chairman')
    },
    admin: {
      label: 'Admin & IT',
      summary: 'Manages user accounts, company settings, backups, the visitor log, vehicles and office memos.',
      cannot: 'Cannot see salaries, company expenses or client payments.',
      perms: ['settings.manage', 'audit.view', 'memos.post', 'visitors.manage', 'vehicles.view', 'vehicles.manage', 'inventory.view', 'projects.view', 'inspections.manage']
    },
    hr: {
      label: 'HR Manager',
      summary: 'Keeps staff records, approves leave and prepares payroll.',
      cannot: 'Cannot see client payments, sales or company expenses.',
      perms: ['staff.manage', 'leave.approve', 'payroll.view', 'payroll.manage', 'memos.post', 'reports.view']
    },
    finance: {
      label: 'Accountant',
      summary: 'Records client payments and receipts, company expenses, vendor payments, service charges and payroll payments.',
      cannot: 'Cannot change unit prices, create sales or approve their own expenses.',
      perms: ['projects.view', 'clients.view', 'sales.view', 'payments.view', 'payments.record', 'refunds.request', 'finance.view', 'finance.manage', 'payroll.view', 'payroll.manage', 'vendors.manage', 'purchases.view', 'estates.view', 'servicecharge.manage', 'reports.view', 'reports.finance', 'inventory.view', 'vehicles.view']
    },
    sales_head: {
      label: 'Head of Sales',
      summary: 'Runs the sales team: enquiries, clients, sales, inspections, offer letters. Sees client balances.',
      cannot: 'Cannot record payments, see salaries or company expenses.',
      perms: ['projects.view', 'leads.view', 'leads.manage', 'clients.view', 'clients.manage', 'sales.view', 'sales.manage', 'documents.issue', 'inspections.manage', 'payments.view', 'refunds.request', 'reports.view']
    },
    sales: {
      label: 'Sales Executive',
      summary: 'Handles enquiries, books inspections, registers clients and creates sales.',
      cannot: 'Cannot record payments, issue letters, see reports, salaries or expenses.',
      perms: ['projects.view', 'leads.view', 'leads.manage', 'clients.view', 'clients.manage', 'sales.view', 'sales.manage', 'inspections.manage', 'payments.view']
    },
    legal: {
      label: 'Legal Officer',
      summary: 'Reviews sales, issues offer and allocation letters and keeps client documents.',
      cannot: 'Cannot record payments, create sales, see salaries or expenses.',
      perms: ['projects.view', 'clients.view', 'clients.manage', 'sales.view', 'payments.view', 'documents.issue']
    },
    projects: {
      label: 'Projects Manager',
      summary: 'Runs construction: projects, units, progress updates, purchase requests, site stores and vehicles.',
      cannot: 'Cannot see client payments, salaries or approve spending.',
      perms: ['projects.view', 'projects.manage', 'construction.update', 'purchases.view', 'inventory.view', 'inventory.manage', 'vehicles.view', 'reports.view']
    },
    facility: {
      label: 'Facility Manager',
      summary: 'Looks after estates Istrom manages: residents’ complaints, repairs and service charge bills.',
      cannot: 'Cannot see sales prices, client payments, salaries or company expenses.',
      perms: ['projects.view', 'estates.view', 'complaints.log', 'estates.manage', 'inventory.view', 'vehicles.view']
    },
    store: {
      label: 'Storekeeper',
      summary: 'Receives and issues materials and keeps stock levels right.',
      cannot: 'Cannot see money, sales or staff records.',
      perms: ['projects.view', 'inventory.view', 'inventory.manage']
    },
    frontdesk: {
      label: 'Front Desk',
      summary: 'Welcomes visitors, logs walk-in enquiries, books inspections and logs residents’ complaints.',
      cannot: 'Cannot see money, salaries, or edit clients and sales.',
      perms: ['projects.view', 'visitors.manage', 'leads.view', 'leads.manage', 'inspections.manage', 'estates.view', 'complaints.log']
    }
  };

  async function hash(text) {
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { /* fall through */ }
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return 'f' + (h >>> 0).toString(16);
  }

  const Auth = {
    PERMISSIONS, ROLES, ALL,
    user: null,

    roleLabel(r) { return (ROLES[r] && ROLES[r].label) || r || '—'; },

    rolePerms(role) {
      const custom = DB.meta.rolePerms && DB.meta.rolePerms[role];
      return custom || (ROLES[role] ? ROLES[role].perms : []);
    },

    can(perm) {
      if (!Auth.user) return false;
      if (!perm) return true;
      return Auth.rolePerms(Auth.user.role).includes(perm);
    },

    canAny(...perms) { return perms.some(p => Auth.can(p)); },

    async passwordHash(password, salt) { return hash(salt + '::' + password); },

    async setPassword(staff, password) {
      const salt = U.uid();
      DB.update('staff', staff.id, { salt, passHash: await Auth.passwordHash(password, salt) });
    },

    async signIn(email, password) {
      email = String(email || '').trim().toLowerCase();
      const s = DB.find('staff', x => (x.loginEmail || '').toLowerCase() === email);
      if (!s || !s.canLogin) return { error: 'We couldn’t find an account with that email.' };
      if (s.status === 'Left') return { error: 'This account has been switched off.' };
      const h = await Auth.passwordHash(password, s.salt || '');
      if (h !== s.passHash) return { error: 'That password isn’t right. Please try again.' };
      Auth.start(s);
      return { ok: true };
    },

    start(s) {
      Auth.user = s;
      try { sessionStorage.setItem('ei-user', s.id); } catch (e) { /* ignore */ }
      DB.update('staff', s.id, { lastSeen: Date.now() });
      DB.log('Signed in');
    },

    restore() {
      let id = null;
      try { id = sessionStorage.getItem('ei-user'); } catch (e) { /* ignore */ }
      const s = id && DB.get('staff', id);
      if (s && s.canLogin && s.status !== 'Left') Auth.user = s;
      return !!Auth.user;
    },

    signOut() {
      DB.log('Signed out');
      Auth.user = null;
      try { sessionStorage.removeItem('ei-user'); } catch (e) { /* ignore */ }
    }
  };

  window.Auth = Auth;
})();
