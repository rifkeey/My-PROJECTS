/* e-Istrom — Settings: company, access, roles, approval limits, import, backup */
(function () {
  const esc = U.esc, icon = UI.icon;

  /* ---------- Excel import definitions ---------- */
  // [key, label, required, header words to auto-match, kind]
  const IMPORTS = {
    clients: {
      label: 'Clients', hint: 'One row per client.',
      fields: [['name', 'Name', true, ['name', 'client', 'customer', 'buyer', 'full name']], ['phone', 'Phone', false, ['phone', 'mobile', 'tel', 'gsm', 'contact']], ['email', 'Email', false, ['email', 'e-mail', 'mail']],
        ['address', 'Address', false, ['address', 'location']], ['occupation', 'Occupation', false, ['occupation', 'job', 'profession']], ['nextOfKin', 'Next of kin', false, ['kin']]],
      run(rows) {
        let n = 0; const skipped = [];
        rows.forEach((r, i) => {
          if (!r.name) return skipped.push('Row ' + (i + 2) + ': no name');
          if (r.phone && DB.find('clients', c => U.phoneIntl(c.phone) === U.phoneIntl(r.phone))) return skipped.push('Row ' + (i + 2) + ': ' + r.name + ' already exists (same phone)');
          DB.insert('clients', Object.assign({ clientNo: SalesUI.nextClientNo(), type: /ltd|limited|plc|ventures|enterprise|company|nig/i.test(r.name) ? 'Company' : 'Individual' }, r), { silent: true });
          n++;
        });
        DB.save('clients');
        return { n, skipped };
      }
    },
    sales: {
      label: 'Existing buyers & balances', hint: 'For properties sold before e-Istrom. One row per property: who bought it, which unit, the price and how much they have paid so far.',
      fields: [['client', 'Client name', true, ['client', 'name', 'buyer', 'customer', 'subscriber']], ['phone', 'Phone', false, ['phone', 'mobile', 'gsm']], ['project', 'Project / estate', true, ['project', 'estate', 'site', 'development']],
        ['unit', 'Unit / house number', true, ['unit', 'house', 'plot', 'block', 'flat', 'shop', 'code']], ['price', 'Price', true, ['price', 'cost', 'value', 'amount payable', 'total']],
        ['paid', 'Amount paid so far', false, ['paid', 'deposit', 'received', 'payment']], ['date', 'Date of sale', false, ['date']], ['months', 'Instalment months (if any)', false, ['month', 'tenor', 'duration', 'plan']]],
      run(rows) {
        let n = 0; const skipped = [];
        rows.forEach((r, i) => {
          const row = 'Row ' + (i + 2) + ': ';
          const pname = String(r.project || '').toLowerCase().trim();
          const pr = DB.find('projects', p => p.code.toLowerCase() === pname || p.name.toLowerCase() === pname) || DB.find('projects', p => pname && (p.name.toLowerCase().includes(pname) || pname.includes(p.name.toLowerCase().replace(/^istrom /, ''))));
          if (!pr) return skipped.push(row + 'project “' + r.project + '” not found');
          const code = String(r.unit || '').trim().toLowerCase();
          const unit = DB.find('units', u => u.projectId === pr.id && (u.code.toLowerCase() === code || u.code.toLowerCase().endsWith('-' + code)));
          if (!unit) return skipped.push(row + 'unit “' + r.unit + '” not found in ' + pr.name);
          if (unit.status !== 'available') return skipped.push(row + unit.code + ' is already sold');
          const price = Sheet.toNumber(r.price);
          if (!price) return skipped.push(row + 'no price');
          let client = r.phone && DB.find('clients', c => U.phoneIntl(c.phone) === U.phoneIntl(r.phone));
          if (!client) client = DB.find('clients', c => c.name.toLowerCase() === String(r.client).toLowerCase().trim());
          if (!client) client = DB.insert('clients', { clientNo: SalesUI.nextClientNo(), name: String(r.client).trim(), phone: r.phone ? String(r.phone) : '', type: 'Individual' });
          const date = Sheet.toDate(r.date) || U.today();
          const months = Number(Sheet.toNumber(r.months)) || 0;
          const plan = months > 0 ? 'instalment' : 'outright';
          const paid = Math.min(price, Sheet.toNumber(r.paid));
          const s = DB.insert('sales', {
            number: DB.nextNumber('SL'), clientId: client.id, unitId: unit.id, projectId: pr.id, listPrice: price, discount: 0, price, plan, depositPct: plan === 'instalment' ? Math.round(paid / price * 100) : 0, months,
            startDate: date, date, schedule: Biz.buildSchedule({ price, plan, depositPct: plan === 'instalment' ? Math.round(paid / price * 100) : 0, months, startDate: date }), status: 'active', notes: 'Imported from Excel', imported: true
          });
          if (paid > 0) DB.insert('payments', { receiptNo: DB.nextNumber('OB'), saleId: s.id, clientId: client.id, amount: paid, date, method: 'Bank transfer', note: 'Opening balance (paid before e-Istrom)' });
          DB.update('units', unit.id, { status: 'sold', clientId: client.id, saleId: s.id });
          n++;
        });
        return { n, skipped };
      }
    },
    staff: {
      label: 'Staff', hint: 'One row per staff member. Salaries are optional.',
      fields: [['name', 'Name', true, ['name', 'staff', 'employee']], ['title', 'Job title', false, ['title', 'position', 'designation', 'role', 'job']], ['department', 'Department', false, ['department', 'dept', 'unit']],
        ['phone', 'Phone', false, ['phone', 'mobile', 'gsm']], ['email', 'Email', false, ['email', 'mail']], ['startDate', 'Start date', false, ['start', 'joined', 'employment', 'resumption']],
        ['gross', 'Monthly gross salary', false, ['salary', 'gross', 'pay']], ['bank', 'Bank', false, ['bank']], ['accountNo', 'Account number', false, ['account', 'acct', 'nuban']]],
      run(rows) {
        let n = 0; const skipped = [];
        let next = Math.max(0, ...DB.all('staff').map(x => Number(String(x.staffNo || '').replace(/\D/g, '')) || 0));
        rows.forEach((r, i) => {
          if (!r.name) return skipped.push('Row ' + (i + 2) + ': no name');
          if (DB.find('staff', s => s.name.toLowerCase() === String(r.name).toLowerCase())) return skipped.push('Row ' + (i + 2) + ': ' + r.name + ' already exists');
          const g = Sheet.toNumber(r.gross);
          const dept = Biz.DEPARTMENTS.find(d => d.toLowerCase().includes(String(r.department || '').toLowerCase().split(' ')[0])) || r.department || 'Admin & IT';
          DB.insert('staff', { staffNo: 'IST-' + U.pad(++next, 3), name: r.name, title: r.title || '', department: dept, phone: r.phone ? String(r.phone) : '', email: r.email || '', startDate: Sheet.toDate(r.startDate), status: 'Active', role: 'none', canLogin: false, leaveDays: DB.setting('annualLeaveDays', 20),
            salary: g ? { basic: Math.round(g * 0.5), housing: Math.round(g * 0.25), transport: Math.round(g * 0.15), other: Math.round(g * 0.1) } : null, bank: r.bank || '', accountNo: r.accountNo ? String(r.accountNo) : '' }, { silent: true });
          n++;
        });
        DB.save('staff');
        return { n, skipped };
      }
    },
    vendors: {
      label: 'Vendors', hint: 'Suppliers, contractors and consultants.',
      fields: [['name', 'Name', true, ['name', 'vendor', 'supplier', 'contractor', 'company']], ['category', 'What they supply', false, ['category', 'type', 'supplies', 'service']], ['contact', 'Contact person', false, ['contact', 'person', 'rep']],
        ['phone', 'Phone', false, ['phone', 'mobile', 'gsm']], ['address', 'Address', false, ['address']], ['bank', 'Bank', false, ['bank']], ['accountNo', 'Account number', false, ['account', 'acct']]],
      run(rows) {
        let n = 0; const skipped = [];
        rows.forEach((r, i) => {
          if (!r.name) return skipped.push('Row ' + (i + 2) + ': no name');
          if (DB.find('vendors', v => v.name.toLowerCase() === String(r.name).toLowerCase())) return skipped.push('Row ' + (i + 2) + ': ' + r.name + ' already exists');
          DB.insert('vendors', Object.assign({ rating: 4, category: 'Other' }, r, { phone: r.phone ? String(r.phone) : '', accountNo: r.accountNo ? String(r.accountNo) : '' }), { silent: true });
          n++;
        });
        DB.save('vendors');
        return { n, skipped };
      }
    },
    items: {
      label: 'Store items', hint: 'Materials and supplies, with how many you have now.',
      fields: [['name', 'Item', true, ['item', 'name', 'material', 'description']], ['category', 'Category', false, ['category', 'type', 'group']], ['unit', 'Counted in', false, ['unit', 'uom', 'measure']],
        ['stock', 'Quantity in store now', false, ['qty', 'quantity', 'stock', 'balance', 'count']], ['unitCost', 'Unit cost', false, ['cost', 'price', 'rate']], ['reorderLevel', 'Reorder level', false, ['reorder', 'minimum', 'min']], ['location', 'Store', false, ['store', 'location', 'site', 'warehouse']]],
      run(rows) {
        let n = 0; const skipped = [];
        rows.forEach((r, i) => {
          if (!r.name) return skipped.push('Row ' + (i + 2) + ': no item name');
          const it = DB.insert('items', { sku: 'ST-' + U.pad(DB.all('items').length + 1, 3), name: r.name, category: r.category || 'Other', unit: r.unit || 'pcs', unitCost: Sheet.toNumber(r.unitCost), reorderLevel: Sheet.toNumber(r.reorderLevel), location: r.location || 'Head office store' });
          const q = Sheet.toNumber(r.stock);
          if (q > 0) DB.insert('movements', { itemId: it.id, kind: 'in', qty: q, date: U.today(), staffId: Auth.user.id, note: 'Opening stock (imported)', adjust: true });
          n++;
        });
        return { n, skipped };
      }
    }
  };

  async function runImport(type, file) {
    const def = IMPORTS[type];
    let sheet;
    try { sheet = await Sheet.read(file); }
    catch (e) { return UI.toast(e.message || 'Could not read that file', 'red'); }
    if (!sheet.rows.length) return UI.toast('That sheet looks empty.', 'red');
    const norm = s => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const used = new Set();
    const guess = {};
    def.fields.forEach(([key, label, req, words]) => {
      const h = sheet.headers.find(h => !used.has(h) && words.some(w => norm(h).includes(w)));
      if (h) { guess[key] = h; used.add(h); }
    });
    const opts = sheet.headers.map(h => [h, h]);
    const v = await UI.form({
      title: 'Import ' + def.label.toLowerCase(), size: 'lg', values: guess, submit: 'Import ' + U.plural(sheet.rows.length, 'row'),
      intro: 'Found <b>' + U.plural(sheet.rows.length, 'row') + '</b> in <b>' + esc(file.name) + '</b>. Check which column holds each piece of information. We’ve guessed where we could.',
      fields: def.fields.map(([key, label, req]) => ({ name: key, label: label + (req ? '' : ' (optional)'), type: 'select', options: opts, required: req, half: true, placeholder: req ? 'Choose column…' : 'Not in this file' })).concat([
        { type: 'note', name: 'preview', html: m => {
          const cols = def.fields.filter(f => m[f[0]]);
          if (!cols.length) return '';
          return '<b>Preview</b><div class="table-wrap" style="margin-top:8px;box-shadow:none"><table class="tbl"><tr>' + cols.map(f => '<th>' + esc(f[1]) + '</th>').join('') + '</tr>' +
            sheet.rows.slice(0, 4).map(r => '<tr>' + cols.map(f => '<td>' + esc(r[m[f[0]]]) + '</td>').join('') + '</tr>').join('') + '</table></div>';
        } }
      ])
    });
    if (!v) return;
    const mapped = sheet.rows.map(r => {
      const o = {};
      def.fields.forEach(([key]) => { if (v[key]) { const x = r[v[key]]; o[key] = typeof x === 'string' ? x.trim() : x; } });
      // Excel drops the leading zero from Nigerian phone numbers
      if (o.phone !== undefined && o.phone !== '') { const d = String(o.phone).replace(/[^\d+]/g, ''); o.phone = /^\d{10}$/.test(d) ? '0' + d : d; }
      return o;
    }).filter(o => Object.values(o).some(x => x !== '' && x !== undefined));
    const res = def.run(mapped);
    DB.log('Imported ' + res.n + ' ' + def.label.toLowerCase() + ' from ' + file.name);
    UI.modal({
      title: 'Import finished', size: 'md',
      body: '<div style="text-align:center">' + icon('checkCircle', 40) + '<div class="big-num mt">' + U.num(res.n) + '</div><p class="muted">' + esc(def.label.toLowerCase()) + ' imported</p></div>' +
        (res.skipped.length ? '<div class="callout red">' + icon('alert', 17) + '<div><b>' + U.plural(res.skipped.length, 'row') + ' skipped:</b><br>' + res.skipped.slice(0, 25).map(esc).join('<br>') + (res.skipped.length > 25 ? '<br>…and ' + (res.skipped.length - 25) + ' more' : '') + '</div></div>' : ''),
      foot: '<button class="btn btn-primary" data-maction="ok">Done</button>',
      actions: { ok: (a, close) => close() }
    });
    App.refresh();
  }

  /* ---------- Page ---------- */
  App.route('/settings', 'settings.manage', (p, q) => {
    const tab = q.tab || 'company';
    let body = '';

    if (tab === 'company') {
      const c = Docs.company();
      body = '<div class="grid g2">' + UI.card('Company details', UI.kv([['Name', esc(c.name)], ['Address', esc(c.address)], ['Phone', esc(c.phone)], ['Email', esc(c.email)], ['Website', esc(c.web)], ['RC number', esc(c.rc)]]), { actions: UI.btn('Edit', 'company', { small: true, icon: 'edit' }) }) +
        UI.card('On letters & receipts', UI.kv([['Signed by', esc(c.signatory) + (c.signatoryTitle ? ', ' + esc(c.signatoryTitle) : '')], ['Bank details printed', c.bank ? esc(c.bank) : '<span class="tone-amber">Not set: add the company account so clients know where to pay</span>'], ['Annual leave', DB.setting('annualLeaveDays', 20) + ' days for new staff']]), { actions: UI.btn('Edit', 'company', { small: true, icon: 'edit' }) }) + '</div>' +
        '<div class="mt">' + UI.card('See a sample', '<p class="muted" style="margin-top:0">Print a sample receipt to check how your letterhead looks.</p>' + UI.btn('Print sample receipt', 'sample', { icon: 'print' })) + '</div>';
    }

    if (tab === 'users') {
      const users = U.sortBy(DB.filter('staff', s => s.canLogin), s => s.name);
      const noAccess = DB.filter('staff', s => !s.canLogin && s.status !== 'Left');
      body = '<div class="split mb"><p class="muted" style="margin:0">' + U.plural(users.length, 'person', 'people') + ' can sign in. Give access from a staff record.</p>' + UI.btn('Give someone access', 'grant', { icon: 'plus', kind: 'primary' }) + '</div>' +
        UI.table({
          id: 'us', rows: users, noun: 'user', rowAction: 'access', search: s => s.name + ' ' + s.loginEmail,
          filters: [{ key: 'r', label: 'Any role', options: Object.entries(Auth.ROLES).map(([k, r]) => [k, r.label]), value: s => s.role }],
          columns: [
            { label: 'Name', html: s => '<div class="who">' + UI.avatar(s.name) + '<span><span class="cell-main">' + esc(s.name) + '</span><span class="cell-sub">' + esc(s.loginEmail) + '</span></span></div>', sort: s => s.name },
            { label: 'Role', html: s => esc(Auth.roleLabel(s.role)), sort: s => Auth.roleLabel(s.role) },
            { label: 'Last signed in', html: s => s.lastSeen ? U.ago(s.lastSeen) : '<span class="muted">Never</span>', sort: s => s.lastSeen || 0 },
            { label: '', html: s => s.status === 'Left' ? UI.badge('Left') : '' }
          ]
        }) +
        (DB.meta.sampleData ? '<div class="mt">' + UI.card('Sample accounts', '<label class="field check"><input type="checkbox" data-change="demo"' + (DB.setting('showDemoAccounts', true) ? ' checked' : '') + '><span>Show the “Try it as…” sample accounts on the sign-in screen</span></label>') + '</div>' : '');
      body = body.replace('data-change="demo"', 'data-change="demo" value="1"');
      void noAccess;
    }

    if (tab === 'roles') {
      const custom = DB.meta.rolePerms || {};
      body = '<p class="muted" style="margin-top:0">Each person sees and does only what their role allows. Tick or untick to change a role. Everyone can always see the dashboard, staff directory and memos, request leave and raise purchase requests.</p>' +
        '<div class="grid g3 mb">' + Object.entries(Auth.ROLES).map(([k, r]) => '<div class="role-card" data-action="role" data-id="' + k + '"><b>' + esc(r.label) + (custom[k] ? ' ' + UI.badge('Changed', 'accent') : '') + '</b><p>' + esc(r.summary) + '</p><p style="margin-top:6px">' + esc(r.cannot) + '</p></div>').join('') + '</div>' +
        UI.card('Permissions', '<div class="table-wrap" style="box-shadow:none;border:0;max-height:70vh"><table class="tbl matrix"><thead><tr><th style="writing-mode:horizontal-tb;transform:none;height:auto;vertical-align:bottom">What they can do</th>' + Object.values(Auth.ROLES).map(r => '<th>' + esc(r.label) + '</th>').join('') + '</tr></thead><tbody>' +
          Auth.PERMISSIONS.map(g => '<tr class="grp"><td colspan="' + (Object.keys(Auth.ROLES).length + 1) + '">' + esc(g.group) + '</td></tr>' + g.items.map(([perm, label]) => '<tr><td>' + esc(label) + '</td>' + Object.keys(Auth.ROLES).map(role => '<td class="c"><input type="checkbox" data-change="perm" data-role="' + role + '" data-perm="' + perm + '"' + (Auth.rolePerms(role).includes(perm) ? ' checked' : '') + (role === 'md' && perm === 'settings.manage' ? ' disabled' : '') + '></td>').join('') + '</tr>').join('')).join('') +
          '</tbody></table></div>', { flush: true, actions: Object.keys(custom).length ? UI.btn('Reset to defaults', 'resetRoles', { small: true, kind: 'ghost' }) : '' });
    }

    if (tab === 'approvals') {
      const lim = Biz.limits();
      body = '<div class="grid g2">' + UI.card('Approval limits', UI.kv([['MD approves expenses & purchases from', '<b>' + U.money(lim.expenseFrom) + '</b>'], ['Chairman also approves from', '<b>' + U.money(lim.chairmanFrom) + '</b>'], ['Always need the MD', 'Discounts, refunds, payroll']]) +
        '<p class="muted mt" style="margin-bottom:0">Anything below the first limit is approved automatically and goes straight to Accounts to pay.</p>', { actions: UI.btn('Change', 'limits', { small: true, icon: 'edit' }) }) +
        UI.card('How it works', '<div class="list"><div class="list-item"><span class="dot-ic">1</span><div class="grow">Someone asks: a discount, a refund, an expense, a purchase or payroll.</div></div><div class="list-item"><span class="dot-ic">2</span><div class="grow">The MD sees it in Approvals and approves or rejects with a comment.</div></div><div class="list-item"><span class="dot-ic">3</span><div class="grow">Large amounts go on to the Chairman after the MD.</div></div><div class="list-item"><span class="dot-ic">4</span><div class="grow">The person who asked is notified, and the request moves on automatically.</div></div></div>') + '</div>';
    }

    if (tab === 'import') {
      body = '<p class="muted" style="margin-top:0">Bring in records you already keep in Excel. Save the sheet as <b>.xlsx</b> or <b>.csv</b>. The first row should have column names. You’ll check the columns before anything is saved.</p>' +
        '<div class="grid g3">' + Object.entries(IMPORTS).map(([k, d]) => UI.card(d.label, '<p class="muted" style="margin-top:0;min-height:40px">' + esc(d.hint) + '</p><label class="file-drop">' + icon('upload', 22) + '<span>Choose Excel file</span><input type="file" accept=".xlsx,.csv" data-change="importFile" data-type="' + k + '"></label>' +
          '<div class="cell-sub mt">Columns: ' + d.fields.map(f => esc(f[1]) + (f[2] ? '*' : '')).join(', ') + '</div>')).join('') + '</div>';
    }

    if (tab === 'data') {
      const counts = DB.COLLECTIONS.filter(c => c !== 'activity').map(c => [c, DB.all(c).length]).filter(x => x[1]);
      const last = DB.meta.lastBackup;
      body = (!DB.persistent ? '<div class="callout red">' + icon('alert', 17) + '<div><b>This browser isn’t keeping your data.</b> Use Chrome or Edge normally (not a private window).</div></div>' : '') +
        '<div class="grid g2">' + UI.card('Back up', '<p style="margin-top:0">Everything in e-Istrom is saved inside this web browser on this computer. <b>Make a backup at least once a week</b> and keep it somewhere safe, like a flash drive or Google Drive.</p>' +
          '<p class="muted">' + (last ? 'Last backup: ' + U.dateTime(last) : '<span class="tone-amber">No backup made yet.</span>') + '</p>' + UI.btn('Download backup', 'backup', { icon: 'download', kind: 'primary' })) +
        UI.card('Restore', '<p style="margin-top:0">Load a backup file, for example to move e-Istrom to another computer. <b>This replaces everything currently in e-Istrom.</b></p><label class="file-drop" style="padding:18px">' + icon('upload', 20) + '<span>Choose backup file (.json)</span><input type="file" accept=".json" data-change="restore"></label>') + '</div>' +
        (DB.meta.sampleData ? '<div class="mt">' + UI.card('Start fresh with real data', '<p style="margin-top:0">e-Istrom currently holds <b>sample data</b> for trying things out. When you’re ready to go live, clear it. Your <b>15 projects and their units stay</b>. Sample people, clients, sales, payments and everything else are removed, and you create the first administrator account.</p>' + UI.btn('Clear sample data', 'fresh', { icon: 'refresh', kind: 'danger' })) + '</div>' : '') +
        '<div class="mt">' + UI.card('What’s stored', '<div class="pill-row">' + counts.map(([c, n]) => '<span class="badge">' + esc(c) + ' · ' + U.num(n) + '</span>').join('') + '</div>') + '</div>';
    }

    if (tab === 'log') {
      body = UI.table({
        id: 'log', rows: DB.all('activity').slice().reverse(), noun: 'entry', search: a => a.text + ' ' + a.who,
        columns: [{ label: 'When', html: a => U.dateTime(a.createdAt), sort: a => a.createdAt }, { label: 'Who', html: a => esc(a.who), sort: a => a.who }, { label: 'What', html: a => esc(a.text) }]
      });
    }

    return {
      title: 'Settings',
      html: UI.header('Settings', 'Company details, who can do what, and your data') +
        UI.tabs([['company', 'Company', '#/settings'], ['users', 'Users & access', '#/settings?tab=users'], ['roles', 'Roles', '#/settings?tab=roles'], ['approvals', 'Approvals', '#/settings?tab=approvals'], ['import', 'Import from Excel', '#/settings?tab=import'], ['data', 'Backup & data', '#/settings?tab=data'], ['log', 'Activity log', '#/settings?tab=log']], tab) + body,
      actions: {
        company: async () => {
          const c = Docs.company();
          const v = await UI.form({
            title: 'Company details', size: 'lg',
            values: { companyName: c.name, companyAddress: c.address, companyPhone: c.phone, companyEmail: c.email, companyWeb: c.web, companyRC: c.rc, bankDetails: c.bank, signatoryName: c.signatory, signatoryTitle: c.signatoryTitle, annualLeaveDays: DB.setting('annualLeaveDays', 20) },
            fields: [
              { name: 'companyName', label: 'Company name', required: true, half: true }, { name: 'companyRC', label: 'RC number', half: true },
              { name: 'companyAddress', label: 'Address', required: true },
              { name: 'companyPhone', label: 'Phone', third: true }, { name: 'companyEmail', label: 'Email', third: true }, { name: 'companyWeb', label: 'Website', third: true },
              { name: 'bankDetails', label: 'Bank details for clients', placeholder: 'e.g. Zenith Bank · Istrom Dynamic Projects Ltd · 1234567890', hint: 'Printed on offer letters, schedules and invoices.' },
              { name: 'signatoryName', label: 'Letters signed by', half: true }, { name: 'signatoryTitle', label: 'Their title', half: true },
              { name: 'annualLeaveDays', label: 'Default annual leave (days)', type: 'number', min: 0, third: true }
            ]
          });
          if (!v) return;
          DB.setSettings(v); DB.log('Updated company settings'); App.refresh();
        },
        sample: () => { const p = DB.all('payments').find(x => x.amount > 0); if (p) Docs.receipt(p.id, true); else UI.toast('Record a payment first to see a receipt.'); },
        grant: async () => {
          const v = await UI.form({ title: 'Give someone access', size: 'sm', fields: [{ name: 's', label: 'Staff member', type: 'select', required: true, options: () => Biz.activeStaff().filter(s => !s.canLogin).map(s => [s.id, s.name + ' · ' + (s.title || '')]) }], intro: 'Not listed? Add them in Staff first.' });
          if (v) PeopleUI.editAccess(DB.get('staff', v.s));
        },
        access: id => PeopleUI.editAccess(DB.get('staff', id)),
        demo: (val, el) => { DB.setSettings({ showDemoAccounts: el.checked }); UI.toast('Saved'); },
        role: id => App.showRole(id),
        perm: (val, el) => {
          const role = el.dataset.role, perm = el.dataset.perm;
          const perms = new Set(Auth.rolePerms(role));
          if (el.checked) perms.add(perm); else perms.delete(perm);
          DB.meta.rolePerms = Object.assign({}, DB.meta.rolePerms, { [role]: Array.from(perms) });
          DB.save('meta');
          DB.log((el.checked ? 'Allowed ' : 'Removed ') + Auth.roleLabel(role) + ': ' + perm);
          UI.toast(Auth.roleLabel(role) + ' updated');
        },
        resetRoles: async () => {
          if (!(await UI.confirm('Put every role back to the standard permissions?', { ok: 'Reset' }))) return;
          DB.meta.rolePerms = {}; DB.save('meta'); App.refresh();
        },
        limits: async () => {
          const lim = Biz.limits();
          const v = await UI.form({ title: 'Approval limits', size: 'sm', values: { expenseApprovalFrom: lim.expenseFrom, chairmanApprovalFrom: lim.chairmanFrom }, fields: [
            { name: 'expenseApprovalFrom', label: 'Expenses & purchases need the MD from', type: 'money', required: true },
            { name: 'chairmanApprovalFrom', label: 'Anything also needs the Chairman from', type: 'money', required: true }
          ], validate: v => v.chairmanApprovalFrom <= v.expenseApprovalFrom ? 'The Chairman’s limit should be higher than the MD’s.' : null });
          if (!v) return;
          DB.setSettings(v); DB.log('Changed approval limits'); App.refresh();
        },
        importFile: (val, el) => { const f = el.files[0]; el.value = ''; if (f) runImport(el.dataset.type, f); },
        backup: async () => {
          const data = await DB.exportAll();
          U.download('e-Istrom-backup-' + U.today() + '.json', JSON.stringify(data), 'application/json');
          DB.meta.lastBackup = Date.now(); DB.save('meta'); DB.log('Downloaded a backup');
          setTimeout(App.refresh, 300);
        },
        restore: async (val, el) => {
          const f = el.files[0]; el.value = '';
          if (!f) return;
          let obj;
          try { obj = JSON.parse(await f.text()); } catch (e) { return UI.toast('That file isn’t a valid backup.', 'red'); }
          if (!obj || obj.app !== 'e-Istrom') return UI.toast('That file isn’t an e-Istrom backup.', 'red');
          if (!(await UI.confirm('Replace everything in e-Istrom with the backup from ' + U.dateTime(new Date(obj.exportedAt).getTime()) + '? You’ll need to sign in again.', { danger: true, ok: 'Restore' }))) return;
          await DB.importAll(obj);
          Auth.signOut();
          location.hash = '/';
          App.signInScreen();
          UI.toast('Backup restored');
        },
        fresh: async () => {
          const me = Auth.user;
          const v = await UI.form({
            title: 'Clear sample data', size: 'md',
            intro: '<span class="tone-red"><b>This can’t be undone.</b></span> All sample people, clients, sales and money records will be deleted. Projects and units stay. Set up the first administrator account below. That person can then add staff and give them access.',
            values: { role: 'md' },
            fields: [
              { name: 'name', label: 'Your full name', required: true, half: true },
              { name: 'title', label: 'Job title', required: true, half: true },
              { name: 'email', label: 'Work email (for signing in)', type: 'email', required: true, half: true },
              { name: 'role', label: 'Your role', type: 'select', options: [['md', 'Managing Director'], ['admin', 'Admin & IT']], placeholder: false, half: true },
              { name: 'password', label: 'Choose a password', type: 'password', required: true, half: true, hint: 'At least 8 characters' },
              { name: 'password2', label: 'Type it again', type: 'password', required: true, half: true },
              { name: 'confirm', label: 'Type DELETE to confirm', required: true }
            ],
            submit: 'Clear and start fresh',
            validate: v => v.confirm !== 'DELETE' ? 'Please type DELETE in capitals to confirm.' : v.password.length < 8 ? 'Password needs at least 8 characters.' : v.password !== v.password2 ? 'The passwords don’t match.' : null
          });
          if (!v) return;
          void me;
          const s = await Seed.startFresh({ name: v.name, title: v.title, email: v.email, role: v.role, password: v.password, department: v.role === 'md' ? 'Management' : 'Admin & IT' });
          Auth.start(s);
          App.shell();
          App.go('/settings?tab=company');
          UI.toast('Sample data cleared. Welcome to e-Istrom.');
        }
      }
    };
  });
})();
