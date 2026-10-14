/* e-Istrom — first-run data.
   Projects and unit counts come from istromgroup.com.ng.
   People, clients, prices and money are SAMPLE data for trying the system,
   and can be cleared from Settings → Data. */
(function () {

  // [code, name, location, kind, status, progress, managed, serviceCharge, types[[type, count, samplePrice]]]
  const PROJECTS = [
    ['TYB', 'Tayyib Homes', 'Kafe, Life Camp, Abuja', 'Residential', 'Under Construction', 32, false, 0,
      [['5 Bed Detached Duplex + 2BR BQ', 52, 310e6], ['4 Bed Semi-Detached + 2BR BQ', 58, 240e6], ['4 Bed Terrace Duplex', 142, 155e6], ['3 Bed Flat + BQ', 78, 88e6]],
      'Premium residential estate of 330 units with 24/7 gated security, paved roads, dedicated transformers, shopping centre and recreational areas.'],
    ['AP2', 'ISTROM Apo 2', 'Plot 216, Apo, Abuja', 'Residential', 'Under Construction', 61, false, 0,
      [['5 Bed Detached Duplex + BQ', 16, 285e6], ['5 Bed Semi-Detached + BQ', 4, 235e6], ['4 Bed Terrace', 54, 165e6], ['3 Bed Flat + BQ', 32, 92e6]],
      'Luxury detached and semi-detached duplexes, terraces and flats with landscaping, ample parking and CCTV.'],
    ['MAB', 'ISTROM Mabushi', 'Mabushi, Abuja', 'Residential', 'Under Construction', 44, false, 0,
      [['6 Bed Detached Duplex + 2BQ', 15, 460e6], ['4 Bed Terrace + BQ', 20, 225e6], ['3 Bed Flat + BQ', 20, 135e6], ['4 Bed Pent Floor + BQ', 2, 260e6]],
      'Exquisite 6-bedroom detached duplexes, terraces, flats and pent floors in the posh district of Mabushi.'],
    ['JB3', 'ISTROM Jabi 3', 'Jabi, Abuja', 'Residential', 'Under Construction', 78, false, 0,
      [['5 Bed Detached Duplex', 5, 390e6], ['4 Bed Terrace + BQ', 7, 235e6], ['3 Bed Flat + BQ', 10, 135e6]],
      'Detached duplexes, terraces and flats in the posh district of Jabi.'],
    ['W2M', 'Wuse II Mall', 'Wuse II, Abuja', 'Mall', 'Ongoing', 18, false, 0, [],
      'A comprehensive commercial development in the heart of the FCT.'],
    ['AXS', 'Axis Plaza Gaduwa', 'Gaduwa, Abuja', 'Plaza', 'Completed', 100, false, 0,
      [['Shop', 66, 38e6], ['Rooftop Restaurant', 2, 140e6]],
      'Upscale shopping and office complex: 66 shops and 2 rooftop restaurants.'],
    ['INN', 'Inna Plaza Gaduwa', 'Gaduwa, Abuja', 'Plaza', 'Completed', 100, true, 450000,
      [['Shop', 54, 36e6], ['Rooftop Restaurant', 2, 135e6]],
      'Upscale shopping and office complex: 54 shops and 2 rooftop restaurants. Home of Istrom’s head office.'],
    ['JHI', 'Blue Moon Jahi', 'Jahi, Abuja', 'Residential', 'Completed', 100, false, 0,
      [['6 Bed Detached Triplex + BQ', 5, 340e6], ['4 Bed Terrace + BQ', 12, 175e6]],
      'Detached triplexes and terraces with a gym and shopping mall.'],
    ['GRV', '101 Grove Apo', 'Apo, Abuja', 'Residential', 'Completed', 100, true, 650000,
      [['4 Bed Terrace + BQ', 5, 140e6], ['3 Bed Flat', 3, 78e6]],
      'Terraces and flats in the posh district of Apo.'],
    ['JB1', 'Zini Court Jabi', 'Jabi, Abuja', 'Residential', 'Completed', 100, true, 750000,
      [['4 Bed Terrace + BQ', 10, 180e6], ['3 Bed Flat', 3, 95e6]],
      'Luxury terraces and flats with outdoor play areas (Jabi 1).'],
    ['JB2', 'Omni Court Jabi', 'Jabi, Abuja', 'Residential', 'Completed', 100, true, 750000,
      [['4 Bed Terrace + BQ', 6, 185e6], ['3 Bed Flat + BQ', 3, 100e6]],
      'Luxury terraces and flats (Jabi 2).'],
    ['WY1', 'Eland Court Wuye', 'Wuye, Abuja', 'Residential', 'Completed', 100, true, 700000,
      [['4 Bed Terrace', 6, 160e6], ['3 Bed Flat', 6, 85e6]],
      'Luxury terraces and flats (Wuye 1).'],
    ['WY2', 'RockView Residence Wuye', 'Wuye, Abuja', 'Residential', 'Completed', 100, true, 700000,
      [['3 Bed Terrace + BQ', 10, 120e6]],
      'Three-bedroom terraces with a maid’s room (Wuye 2).'],
    ['WZ5', 'Senanga Residence Wuse Zone 5', 'Wuse Zone 5, Abuja', 'Residential', 'Completed', 100, true, 900000,
      [['5 Bed Semi-Detached Duplex', 10, 260e6], ['6 Bed Detached Duplex', 1, 420e6]],
      'Semi-detached and fully detached duplexes in Wuse.'],
    ['LFC', 'Ravine Court Life Camp', 'Life Camp, Abuja', 'Residential', 'Completed', 100, true, 700000,
      [['4 Bed Terrace + BQ', 14, 165e6], ['3 Bed Flat', 12, 90e6]],
      'Ravine Court 1, 2 & 3: terraces and flats with outdoor play areas.']
  ];

  // [name, title, department, role, monthly gross, canLogin, demo]
  const STAFF = [
    ['Musa Abdullahi Garba', 'Chairman', 'Management', 'chairman', 0, true, true],
    ['Aisha Bello', 'Managing Director', 'Management', 'md', 4200000, true, true],
    ['Chinedu Okafor', 'Admin & IT Officer', 'Admin & IT', 'admin', 650000, true, true],
    ['Funmilayo Adeyemi', 'HR Manager', 'Human Resources', 'hr', 1100000, true, true],
    ['Emeka Nwosu', 'Chief Accountant', 'Finance & Accounts', 'finance', 1500000, true, true],
    ['Hauwa Sani', 'Accounts Officer', 'Finance & Accounts', 'finance', 520000, true, false],
    ['Tunde Bakare', 'Head of Sales', 'Sales & Marketing', 'sales_head', 1350000, true, true],
    ['Zainab Yusuf', 'Sales Executive', 'Sales & Marketing', 'sales', 480000, true, true],
    ['Kelechi Eze', 'Sales Executive', 'Sales & Marketing', 'sales', 480000, true, false],
    ['Grace Akpan', 'Sales Executive', 'Sales & Marketing', 'sales', 450000, true, false],
    ['Ngozi Okonkwo', 'Legal Officer', 'Legal', 'legal', 950000, true, true],
    ['Yakubu Danjuma', 'Projects Manager', 'Projects & Construction', 'projects', 1450000, true, true],
    ['Olusola Ogunleye', 'Site Engineer', 'Projects & Construction', 'projects', 780000, true, false],
    ['Ifeanyi Obi', 'Facility Manager', 'Facility Management', 'facility', 850000, true, true],
    ['Maryam Lawal', 'Facility Officer', 'Facility Management', 'facility', 420000, true, false],
    ['Samuel Adebayo', 'Storekeeper', 'Stores', 'store', 350000, true, true],
    ['Blessing Udoh', 'Front Desk Officer', 'Front Office', 'frontdesk', 300000, true, true],
    ['Abubakar Shehu', 'Driver', 'Transport', '', 180000, false, false],
    ['Peter Ojo', 'Driver', 'Transport', '', 180000, false, false],
    ['Idris Musa', 'Site Driver', 'Transport', '', 170000, false, false]
  ];

  const FIRST = ['Adebayo', 'Chioma', 'Ibrahim', 'Fatima', 'Oluwaseun', 'Ngozika', 'Usman', 'Amaka', 'Babatunde', 'Halima', 'Obinna', 'Yetunde', 'Abdullahi', 'Nkechi', 'Segun', 'Hadiza', 'Chukwuemeka', 'Folake', 'Suleiman', 'Ifeoma', 'Femi', 'Rukayya', 'Uchenna', 'Bisola', 'Kabiru', 'Ebere', 'Dele', 'Amina', 'Nnamdi', 'Titilayo', 'Garba', 'Adaeze', 'Kunle', 'Zainab', 'Ikenna', 'Shade', 'Aliyu', 'Chiamaka', 'Rotimi', 'Habiba', 'Tobi', 'Ese', 'Mustapha', 'Onyinye', 'Gbenga', 'Salamatu', 'Emeka', 'Kemi', 'Yusuf', 'Ada'];
  const LAST = ['Okoro', 'Adeleke', 'Mohammed', 'Eze', 'Balogun', 'Abubakar', 'Nwachukwu', 'Ogunbiyi', 'Danladi', 'Okeke', 'Bello', 'Afolabi', 'Umar', 'Chukwu', 'Adewale', 'Lawal', 'Obi', 'Oyelaran', 'Ibrahim', 'Nnadi', 'Ayodele', 'Salisu', 'Onyekachi', 'Akinola', 'Haruna', 'Iwu', 'Olaniyan', 'Bature', 'Ezeani', 'Adamu', 'Ogundipe', 'Ugwu', 'Sanusi', 'Okafor', 'Bamidele', 'Aliyu', 'Nwosu', 'Oladipo', 'Shuaibu', 'Anyanwu'];
  const COMPANIES = ['Northgate Holdings Ltd', 'Crestline Ventures Ltd', 'Sahel Bridge Investments', 'Kogi Pearl Ltd', 'Bluewater Capital Partners', 'Savannah Gold Resources', 'Meridian Oil Services Ltd', 'Pinecrest Logistics Ltd'];
  const AREAS = ['Maitama', 'Asokoro', 'Wuse 2', 'Garki', 'Gwarinpa', 'Jabi', 'Utako', 'Katampe', 'Lokogoma', 'Kubwa', 'Lagos (Lekki)', 'Lagos (Ikoyi)', 'Port Harcourt', 'Kaduna', 'Kano', 'London, UK', 'Houston, USA'];

  function typeCode(t) {
    t = t.toLowerCase();
    if (t.includes('shop')) return 'S';
    if (t.includes('restaurant')) return 'R';
    if (t.includes('pent')) return 'P';
    if (t.includes('triplex')) return 'X';
    if (t.includes('semi')) return 'SD';
    if (t.includes('detached')) return 'D';
    if (t.includes('terrace')) return 'T';
    if (t.includes('flat')) return 'F';
    return 'U';
  }

  const Seed = {
    async run() {
      const R = U.rng(20261013);
      const pick = a => a[Math.floor(R() * a.length)];
      const between = (a, b) => a + Math.floor(R() * (b - a + 1));
      const today = U.today();
      const ago = n => U.addDays(today, -n);
      const counters = {};
      const num = (series, date) => {
        const y = String(date).slice(0, 4), k = series + '-' + y;
        counters[k] = (counters[k] || 0) + 1;
        return 'IST/' + series + '/' + y + '/' + U.pad(counters[k]);
      };
      const ts = d => U.parse(d).getTime() + between(8, 17) * 3600000 + between(0, 59) * 60000;
      const ins = (c, o) => DB.insert(c, o, { silent: true });
      const phone = () => '0' + pick(['803', '805', '806', '807', '808', '809', '810', '813', '814', '816', '703', '706', '708', '802', '812', '901', '902', '903', '906', '907']) + between(1000000, 9999999);

      DB.meta = {
        initialised: true,
        sampleData: true,
        createdAt: Date.now(),
        settings: {
          companyName: 'Istrom Dynamic Projects',
          companyAddress: 'Suite 207/208, Inna Plaza, Gaduwa, Abuja',
          companyPhone: '+234 (0) 909 888 8800',
          companyEmail: 'info@istrom.ng',
          companyWeb: 'istromgroup.com.ng',
          signatoryName: 'Aisha Bello',
          signatoryTitle: 'Managing Director',
          bankDetails: '',
          expenseApprovalFrom: 250000,
          chairmanApprovalFrom: 50000000,
          showDemoAccounts: true,
          annualLeaveDays: 20
        },
        counters: {}
      };

      /* ----- Staff ----- */
      const staff = [];
      for (let i = 0; i < STAFF.length; i++) {
        const [name, title, department, role, gross, canLogin, demo] = STAFF[i];
        const parts = name.toLowerCase().split(' ');
        const s = ins('staff', {
          staffNo: 'IST-' + U.pad(i + 1, 3), name, title, department, role: role || 'none', status: 'Active',
          phone: phone(), email: parts[0] + '.' + parts[parts.length - 1] + '@istrom.ng',
          startDate: ago(between(200, 2600)),
          salary: gross ? { basic: Math.round(gross * 0.5), housing: Math.round(gross * 0.25), transport: Math.round(gross * 0.15), other: Math.round(gross * 0.1) } : null,
          tax: Math.round(gross * 0.09), bank: pick(['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA', 'Stanbic IBTC']), accountNo: String(between(1000000000, 2999999999)),
          leaveDays: 20, canLogin, demo,
          loginEmail: canLogin ? parts[0] + '.' + parts[parts.length - 1] + '@istrom.ng' : ''
        });
        if (canLogin) { s.salt = U.uid(); s.passHash = await Auth.passwordHash('istrom2026', s.salt); }
        staff.push(s);
      }
      const byRole = r => staff.filter(s => s.role === r);
      const md = byRole('md')[0], chairman = byRole('chairman')[0];
      const salesPeople = byRole('sales').concat(byRole('sales_head'));
      const accountants = byRole('finance');
      const facility = byRole('facility');
      const drivers = staff.filter(s => s.department === 'Transport');

      /* ----- Projects & units ----- */
      const projects = [];
      PROJECTS.forEach(([code, name, location, kind, status, progress, managed, sc, types, description]) => {
        const p = ins('projects', {
          code, name, location, kind, status, progress, managed, serviceCharge: sc, description,
          startDate: status === 'Completed' ? ago(between(1600, 2600)) : ago(between(300, 900)),
          completionDate: status === 'Completed' ? ago(between(200, 1200)) : U.addDays(today, between(150, 700)),
          types: types.map(([type, count, price]) => ({ type, count, price }))
        });
        p._units = [];
        types.forEach(([type, count, price]) => {
          const tc = typeCode(type), w = count > 99 ? 3 : 2;
          for (let i = 1; i <= count; i++) {
            p._units.push(ins('units', { projectId: p.id, code: code + '-' + tc + U.pad(i, w), type, price, status: 'available' }));
          }
        });
        projects.push(p);
      });

      /* ----- Clients ----- */
      const used = new Set();
      let clientCount = 0;
      const newClient = (date) => {
        let name, company = false;
        if (R() < 0.06) { name = COMPANIES.find(c => !used.has(c)); company = !!name; }
        if (!name) {
          do { name = pick(FIRST) + ' ' + pick(LAST); } while (used.has(name));
        }
        used.add(name);
        clientCount++;
        const n = name.toLowerCase().replace(/[^a-z ]/g, '').split(' ');
        return ins('clients', {
          clientNo: 'CL-' + U.pad(clientCount), name, type: company ? 'Company' : 'Individual',
          phone: phone(), email: n[0] + '.' + n[n.length - 1] + '@' + pick(['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com']),
          address: pick(AREAS), occupation: company ? '' : pick(['Business owner', 'Civil servant', 'Banker', 'Engineer', 'Doctor', 'Lawyer', 'Oil & gas', 'Diplomat', 'Consultant', 'Entrepreneur', 'Lecturer']),
          nextOfKin: company ? '' : pick(FIRST) + ' ' + n[n.length - 1].replace(/^./, c => c.toUpperCase()),
          createdAt: ts(date)
        });
      };

      const methods = () => { const r = R(); return r < 0.74 ? 'Bank transfer' : r < 0.86 ? 'POS' : r < 0.95 ? 'Cheque' : 'Online payment'; };
      const pay = (sale, amount, date, note) => {
        const by = pick(accountants);
        return ins('payments', {
          receiptNo: num('RCT', date), saleId: sale.id, clientId: sale.clientId, amount: Math.round(amount), date,
          method: methods(), bankRef: 'TRF' + between(10000000, 99999999), note: note || '', createdAt: ts(date), createdBy: by.id
        });
      };

      /* ----- Sales: completed estates ----- */
      projects.filter(p => p.status === 'Completed').forEach(p => {
        p._units.forEach(u => {
          if (R() > 0.86) return;
          const date = ago(between(900, 2500));
          const c = newClient(date);
          const price = Math.round(u.price * 0.62 / 1e5) * 1e5;
          const plan = R() < 0.5 ? 'outright' : 'instalment';
          const months = plan === 'instalment' ? 12 : 0;
          const s = ins('sales', {
            number: num('SL', date), clientId: c.id, unitId: u.id, projectId: p.id, listPrice: price, discount: 0, price,
            plan, depositPct: plan === 'instalment' ? 30 : 0, months, startDate: date, date,
            schedule: Biz.buildSchedule({ price, plan, depositPct: 30, months, startDate: date }),
            status: 'active', salesPersonId: pick(salesPeople).id, createdAt: ts(date)
          });
          if (plan === 'outright') pay(s, price, U.addDays(date, between(0, 7)));
          else { pay(s, price * 0.3, date); pay(s, price * 0.35, U.addDays(date, 180)); pay(s, price - Math.round(price * 0.3) - Math.round(price * 0.35), U.addDays(date, 360)); }
          const alloc = U.addDays(date, plan === 'outright' ? 20 : 380);
          Object.assign(s, { allocationNo: num('ALC', alloc), allocationDate: alloc, offerNo: num('OFR', date), offerDate: date });
          Object.assign(u, { status: R() < 0.93 ? 'handed_over' : 'sold', clientId: c.id, saleId: s.id, handoverDate: U.addDays(alloc, 30) });
        });
      });

      /* ----- Sales: projects under construction ----- */
      const rate = { TYB: 0.17, AP2: 0.4, MAB: 0.3, JB3: 0.6 };
      const pendingSales = [];
      projects.filter(p => rate[p.code]).forEach(p => {
        const pool = p._units.slice().sort(() => R() - 0.5);
        const n = Math.round(pool.length * rate[p.code]);
        pool.slice(0, n).forEach(u => {
          const date = ago(between(10, 620));
          const c = newClient(date);
          const plan = R() < 0.28 ? 'outright' : 'instalment';
          const months = plan === 'instalment' ? pick([12, 12, 18, 24]) : 0;
          const depositPct = plan === 'instalment' ? pick([30, 30, 40, 50]) : 0;
          const discount = R() < 0.15 ? Math.round(u.price * pick([0.02, 0.03, 0.05]) / 1e5) * 1e5 : 0;
          const price = u.price - discount;
          const schedule = Biz.buildSchedule({ price, plan, depositPct, months, startDate: date });
          const s = ins('sales', {
            number: num('SL', date), clientId: c.id, unitId: u.id, projectId: p.id, listPrice: u.price, discount, price,
            plan, depositPct, months, startDate: date, date, schedule, status: 'active',
            salesPersonId: pick(salesPeople).id, offerNo: num('OFR', date), offerDate: date, createdAt: ts(date)
          });
          const kind = R();
          const stopAfter = kind < 0.78 ? 999 : between(1, 4);
          schedule.forEach((it, i) => {
            if (it.due > today || i >= stopAfter + (plan === 'outright' ? 1 : 0)) return;
            const d = U.addDays(it.due, between(0, 9));
            if (d > today) return;
            pay(s, it.amount, d);
          });
          if (kind >= 0.78 && plan === 'outright') { /* outright buyers who haven't paid yet stay overdue */ }
          Object.assign(u, { status: 'sold', clientId: c.id, saleId: s.id });
        });
      });

      // Two sales waiting for discount approval
      ['AP2', 'MAB'].forEach((code, i) => {
        const p = projects.find(x => x.code === code);
        const u = p._units.find(x => x.status === 'available');
        const date = ago(i + 1);
        const c = newClient(date);
        const discount = Math.round(u.price * (i ? 0.08 : 0.05) / 1e5) * 1e5;
        const price = u.price - discount;
        const s = ins('sales', {
          number: num('SL', date), clientId: c.id, unitId: u.id, projectId: p.id, listPrice: u.price, discount, price,
          plan: 'instalment', depositPct: 40, months: 18, startDate: date, date,
          schedule: Biz.buildSchedule({ price, plan: 'instalment', depositPct: 40, months: 18, startDate: U.addDays(date, 7) }),
          status: 'pending', salesPersonId: salesPeople[i].id, createdAt: ts(date), createdBy: salesPeople[i].id,
          notes: i ? 'Client is buying two units in total; asked for a bulk discount.' : 'Long-standing client referral.'
        });
        Object.assign(u, { status: 'reserved', clientId: c.id, saleId: s.id });
        pendingSales.push([s, discount]);
      });

      /* ----- Leads ----- */
      const ucProjects = projects.filter(p => rate[p.code]);
      const stages = ['New', 'New', 'New', 'Contacted', 'Contacted', 'Contacted', 'Inspection booked', 'Inspection booked', 'Negotiating', 'Negotiating', 'Won', 'Lost', 'Lost'];
      const leads = [];
      for (let i = 0; i < 46; i++) {
        const d = ago(between(0, 95));
        let name; do { name = pick(FIRST) + ' ' + pick(LAST); } while (used.has(name)); used.add(name);
        const p = R() < 0.85 ? pick(ucProjects) : pick(projects);
        const stage = pick(stages);
        const t = p.types[Math.floor(R() * p.types.length)] || { type: 'Shop', price: 40e6 };
        leads.push(ins('leads', {
          name, phone: phone(), email: R() < 0.6 ? name.toLowerCase().replace(/[^a-z ]/g, '').replace(' ', '.') + '@gmail.com' : '',
          source: pick(['Walk-in', 'Website', 'Instagram', 'Instagram', 'Referral', 'Phone call', 'WhatsApp', 'Agent', 'Facebook', 'Billboard']),
          projectId: p.id, interest: t.type, budget: Math.round(t.price / 1e6) * 1e6, stage,
          assignedTo: pick(salesPeople).id, createdAt: ts(d),
          nextFollowUp: ['Won', 'Lost'].includes(stage) ? '' : U.addDays(today, between(-4, 10)),
          notes: pick(['Wants to see the show house first.', 'Interested in instalment plan over 18 months.', 'Diaspora client, prefers video calls.', 'Comparing with another estate in Lokogoma.', 'Asked about title documents.', 'Wants a corner piece.', 'Ready to pay deposit after inspection.', '']),
          lostReason: stage === 'Lost' ? pick(['Price too high', 'Bought elsewhere', 'Not responding', 'Location not suitable']) : ''
        }));
      }

      /* ----- Site inspections ----- */
      const insp = [[0, 'Scheduled', '10:00'], [0, 'Scheduled', '14:30'], [1, 'Scheduled', '11:00'], [3, 'Scheduled', '10:30'], [5, 'Scheduled', '12:00'],
        [-2, 'Done', '10:00'], [-4, 'Done', '13:00'], [-6, 'No-show', '11:00'], [-9, 'Done', '10:00'], [-12, 'Done', '15:00'], [-15, 'Cancelled', '10:00'], [-18, 'Done', '12:30']];
      insp.forEach(([off, status, time]) => {
        const l = pick(leads.filter(x => !['Won', 'Lost'].includes(x.stage)));
        ins('inspections', {
          leadId: l.id, name: l.name, phone: l.phone, projectId: l.projectId, date: U.addDays(today, off), time, status,
          staffId: l.assignedTo, vehicleId: null, people: between(1, 4),
          outcome: status === 'Done' ? pick(['Very interested, will pay deposit next week.', 'Liked the finishing; wants a discount.', 'Will discuss with spouse.', 'Prefers the 4-bed terrace.']) : ''
        });
      });

      /* ----- Vendors ----- */
      const V = [
        ['Gaduwa Building Materials Ltd', 'Building materials'], ['Zuba Blocks & Aggregates', 'Building materials'], ['Apex Steel Rods Nig. Ltd', 'Building materials'],
        ['BrightSpark Electricals', 'Electrical'], ['FlowRight Plumbing Supplies', 'Plumbing'], ['Capital Paints & Finishes', 'Finishes'],
        ['Sahel Roofing Systems', 'Roofing'], ['GreenEdge Landscaping', 'Landscaping'], ['SecureGuard Security Services', 'Security'],
        ['CityFuel Station, Wuse', 'Fuel'], ['ProServe Facility Cleaning', 'Cleaning'], ['Kubwa Office Mart', 'Office supplies'],
        ['Danbaba & Sons Construction', 'Contractor'], ['Precision Structural Consultants', 'Consultant']
      ];
      const vendors = V.map(([name, category]) => ins('vendors', {
        name, category, contact: pick(FIRST) + ' ' + pick(LAST), phone: phone(), email: '', address: pick(['Gaduwa', 'Zuba', 'Kubwa', 'Wuse', 'Garki', 'Idu Industrial Area', 'Jabi']) + ', Abuja',
        bank: pick(['GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA']), accountNo: String(between(1000000000, 2999999999)), rating: between(3, 5)
      }));
      const vend = cat => vendors.filter(v => v.category === cat);

      /* ----- Expenses (last 12 months) ----- */
      for (let m = 11; m >= 0; m--) {
        const base = U.addMonths(today, -m).slice(0, 8);
        const day = d => { const x = base + U.pad(Math.min(d, 28), 2); return x > today ? today : x; };
        const add = (category, description, amount, vendorId, projectId, d) => {
          const date = day(d);
          ins('expenses', { number: num('EXP', date), date, category, description, amount: Math.round(amount / 1000) * 1000, vendorId: vendorId || null, projectId: projectId || null, status: 'paid', paidDate: date, method: 'Bank transfer', createdAt: ts(date), createdBy: pick(accountants).id });
        };
        add('Utilities & power', 'Diesel for head office generator', between(900, 1600) * 1000, vend('Fuel')[0].id, null, 5);
        add('Utilities & power', 'AEDC electricity — head office', between(180, 260) * 1000, null, null, 9);
        add('Office supplies', 'Stationery and printer toner', between(90, 220) * 1000, vend('Office supplies')[0].id, null, 12);
        add('Marketing & adverts', pick(['Instagram & Facebook ads', 'Billboard — Airport Road', 'Radio jingle — Cool FM', 'Brochure printing']), between(400, 2500) * 1000, null, null, 15);
        add('Fuel & vehicles', 'Fuel for pool vehicles', between(350, 650) * 1000, vend('Fuel')[0].id, null, 18);
        add('Staff welfare', 'Staff lunch and refreshments', between(150, 300) * 1000, null, null, 20);
        ucProjects.forEach(p => {
          if (R() < 0.75) add('Building materials', pick(['Cement (Dangote 42.5R)', 'Iron rods 12mm & 16mm', 'Sharp sand & granite', 'Blocks 9-inch', 'Roofing sheets', 'Tiles & sanitary wares']) + ' — ' + p.name, between(4, 48) * 1e6, pick(vend('Building materials').concat(vend('Roofing'))).id, p.id, between(2, 26));
          if (R() < 0.6) add('Contractor payment', pick(['Block work', 'Roofing works', 'Electrical first fix', 'Plumbing first fix', 'Plastering', 'Foundation works']) + ' — ' + p.name, between(8, 45) * 1e6, vend('Contractor')[0].id, p.id, between(5, 27));
        });
        if (R() < 0.5) add('Facility maintenance', 'Estate maintenance — ' + pick(projects.filter(p => p.managed)).name, between(250, 1800) * 1000, vend('Cleaning')[0].id, null, 22);
        if (R() < 0.35) add('Professional fees', 'Structural review — ' + pick(ucProjects).name, between(2, 8) * 1e6, vend('Consultant')[0].id, null, 24);
        if (R() < 0.3) add('Government fees & levies', pick(['Development control fees', 'FCDA building approval', 'Land use charge']), between(1, 6) * 1e6, null, null, 25);
      }

      /* ----- Approvals ----- */
      const approval = (type, refId, title, amount, details, requestedBy, steps, status, date) => ins('approvals', {
        number: num('APR', date), type, refId, title, amount, details, requestedBy, steps, status, createdAt: ts(date), closedAt: status !== 'pending' ? ts(date) + 7200000 : null, seenByRequester: true
      });
      pendingSales.forEach(([s, discount], i) => {
        const a = approval('discount', s.id, 'Discount on ' + DB.get('units', s.unitId).code + ' for ' + DB.get('clients', s.clientId).name, discount,
          'List price ' + U.money(s.listPrice) + ', asking ' + U.money(s.price) + '. ' + (s.notes || ''), s.salesPersonId, [{ level: 'md', status: 'pending' }], 'pending', s.date);
        s.approvalId = a.id;
      });
      // Pending expenses
      const pe = [
        ['Building materials', 'Roofing sheets (long-span, 0.55mm) — Apo 2 Block C', 38500000, 'Roofing', 'AP2', [{ level: 'md', status: 'pending' }]],
        ['Contractor payment', 'Piling and foundation works, 2nd tranche — Mabushi', 124000000, 'Contractor', 'MAB', [{ level: 'md', status: 'approved', by: md.id, at: Date.now() - 86400000, note: 'Work verified on site.' }, { level: 'chairman', status: 'pending' }]],
        ['Facility maintenance', 'Generator overhaul — Inna Plaza 500KVA', 1850000, 'Cleaning', null, [{ level: 'md', status: 'pending' }]]
      ];
      pe.forEach(([category, description, amount, vcat, pcode, steps], i) => {
        const p = pcode ? projects.find(x => x.code === pcode) : null;
        const date = ago(i + 1);
        const e = ins('expenses', { number: num('EXP', date), date, category, description, amount, vendorId: vend(vcat)[0].id, projectId: p ? p.id : null, status: 'pending', createdAt: ts(date), createdBy: accountants[0].id });
        e.approvalId = approval('expense', e.id, description + ' (' + category + ')', amount, 'Vendor: ' + vend(vcat)[0].name, accountants[0].id, steps, 'pending', date).id;
      });

      /* ----- Purchase requests ----- */
      const pm = byRole('projects')[0], se = byRole('projects')[1];
      const PR = [
        ['Safety boots and helmets for site workers', [['Safety boots', 40, 18000], ['Hard hats', 40, 6500]], 'Building materials', 'TYB', pm, 'pending', 2],
        ['Laptop for new accounts officer', [['HP ProBook 450 G10', 1, 1150000]], 'Office supplies', null, byRole('admin')[0], 'pending', 1],
        ['Water pumping machine — Jabi 3 site', [['2HP surface pump', 2, 285000]], 'Plumbing', 'JB3', se, 'approved', 6],
        ['Electrical cables for Apo 2 Block B', [['2.5mm cable (rolls)', 60, 42000], ['4mm cable (rolls)', 30, 68000]], 'Electrical', 'AP2', pm, 'ordered', 12],
        ['Office printer toner', [['HP 26A toner', 6, 58000]], 'Office supplies', null, byRole('admin')[0], 'received', 20],
        ['Cleaning supplies for managed estates', [['Detergent (25L)', 10, 22000], ['Mops & buckets', 12, 9500]], 'Cleaning', null, facility[0], 'paid', 30],
        ['Branded umbrellas for sales team', [['Branded umbrellas', 50, 12500]], 'Office supplies', null, byRole('sales_head')[0], 'rejected', 25]
      ];
      PR.forEach(([title, items, vcat, pcode, by, status, days]) => {
        const date = ago(days);
        const amount = U.sum(items, i => i[1] * i[2]);
        const p = pcode ? projects.find(x => x.code === pcode) : null;
        const pr = ins('purchases', {
          number: num('PR', date), title, items: items.map(([desc, qty, unitCost]) => ({ desc, qty, unitCost })), amount,
          vendorId: (vend(vcat)[0] || vendors[0]).id, projectId: p ? p.id : null, requestedBy: by.id, status, reason: '', createdAt: ts(date), createdBy: by.id
        });
        const needs = amount >= 250000;
        if (needs) {
          const st = status === 'pending' ? [{ level: 'md', status: 'pending' }] : [{ level: 'md', status: status === 'rejected' ? 'rejected' : 'approved', by: md.id, at: ts(date) + 3600000, note: status === 'rejected' ? 'Not a priority this quarter.' : '' }];
          pr.approvalId = approval('purchase', pr.id, title, amount, '', by.id, st, status === 'pending' ? 'pending' : status === 'rejected' ? 'rejected' : 'approved', date).id;
        }
        if (['ordered', 'received', 'paid'].includes(status)) pr.poNo = num('LPO', date);
      });

      // A refund request awaiting MD
      const refundSale = DB.filter('sales', s => s.status === 'active' && rate[DB.get('projects', s.projectId).code] && Biz.salePayments(s.id).length >= 2)[3];
      if (refundSale) {
        const paid = U.sum(Biz.salePayments(refundSale.id), p => p.amount);
        const amt = Math.round(paid * 0.9 / 1000) * 1000;
        const a = approval('refund', refundSale.id, 'Refund to ' + DB.get('clients', refundSale.clientId).name + ' (sale cancelled)', amt,
          'Client relocating abroad and has asked to cancel. Paid ' + U.money(paid) + '; refund less 10% administrative charge.', byRole('sales_head')[0].id, [{ level: 'md', status: 'pending' }], 'pending', ago(1));
        refundSale.refundRequest = { approvalId: a.id, amount: amt, reason: 'Client relocating abroad.' };
      }

      // Decided approvals (history)
      for (let i = 0; i < 6; i++) {
        const d = ago(between(10, 120));
        const amt = between(2, 30) * 1e6;
        approval(pick(['expense', 'discount', 'purchase']), null, pick(['Discount for repeat buyer', 'Tiling works — Jabi 3', 'Site generator purchase', 'Marketing campaign Q' + between(1, 3)]), amt, '', pick([accountants[0], byRole('sales_head')[0], pm]).id,
          [{ level: 'md', status: 'approved', by: md.id, at: ts(d) + 3600000, note: '' }], 'approved', d);
      }

      /* ----- Payroll: last 6 months, paid ----- */
      for (let m = 6; m >= 1; m--) {
        const month = U.addMonths(today, -m).slice(0, 7);
        const paidDate = month + '-25';
        const lines = staff.filter(s => s.salary).map(s => Seed.payLine(s));
        ins('payroll', { number: num('PAY', paidDate), month, lines, status: 'paid', preparedBy: byRole('hr')[0].id, paidDate, createdAt: ts(month + '-20') });
      }

      /* ----- Leave ----- */
      const L = [
        [byRole('sales')[1], 'Annual', 3, 10, 'Pending', 'Family wedding in Enugu.'],
        [byRole('projects')[1], 'Annual', 14, 18, 'Pending', 'Short break.'],
        [byRole('finance')[1], 'Sick', -6, -4, 'Approved', 'Malaria — doctor’s note submitted.'],
        [byRole('frontdesk')[0], 'Annual', -40, -30, 'Approved', 'Annual leave.'],
        [byRole('facility')[1], 'Compassionate', -20, -17, 'Approved', 'Bereavement.'],
        [byRole('legal')[0], 'Study', 25, 29, 'Pending', 'Continuing legal education course in Lagos.'],
        [byRole('sales')[2], 'Annual', -12, -8, 'Rejected', 'Clashes with the Tayyib Homes launch week.']
      ];
      L.forEach(([s, type, a, b, status, reason]) => {
        const from = U.addDays(today, a), to = U.addDays(today, b);
        ins('leave', { staffId: s.id, type, from, to, days: U.workDays(from, to), reason, status, decidedBy: status === 'Pending' ? null : byRole('hr')[0].id, createdAt: ts(U.addDays(from, -10)), createdBy: s.id });
      });

      /* ----- Memos ----- */
      const M = [
        ['Welcome to e-Istrom', 'Dear colleagues,\n\nFrom today, enquiries, sales, payments, approvals, leave and requests will all run through e-Istrom. Please sign in with your work email and change your password the first time you log in.\n\nIf you need help, speak to the Admin & IT office.\n\nThank you.', md, 'All staff', true, 1],
        ['Reminder: no cash payments', 'Please remind every client that Istrom does not accept cash. All payments must go to the company account, and every payment must have an official receipt from Accounts.\n\nAny staff member found collecting cash will face disciplinary action.', md, 'All staff', true, 6],
        ['Tayyib Homes open house — this Saturday', 'The Tayyib Homes show house will be open from 10am to 4pm on Saturday. All sales staff should be on site by 9am. Transport leaves the office at 8:15am.', byRole('sales_head')[0], 'Sales & Marketing', false, 3],
        ['Fire drill at Inna Plaza', 'There will be a fire drill on Thursday at 11am. When the alarm sounds, please leave by the nearest staircase and gather at the car park.', byRole('admin')[0], 'All staff', false, 9]
      ];
      M.forEach(([title, body, by, audience, pinned, days]) => ins('memos', { title, body, audience, pinned, createdBy: by.id, createdAt: ts(ago(days)), readBy: [by.id] }));

      /* ----- Visitors ----- */
      for (let i = 0; i < 14; i++) {
        const d = ago(Math.floor(i / 3));
        const tIn = ts(d);
        ins('visitors', {
          name: pick(FIRST) + ' ' + pick(LAST), phone: phone(), company: pick(['', '', 'Danbaba & Sons Construction', 'GTBank', 'FCDA', 'Self', 'Precision Structural Consultants']),
          purpose: pick(['Sales enquiry', 'Meeting with MD', 'Payment', 'Delivery', 'Interview', 'Contractor meeting', 'Document collection']),
          hostId: pick(staff.filter(s => s.canLogin)).id, date: d, timeIn: tIn, timeOut: (i < 2) ? null : tIn + between(20, 120) * 60000, badge: 'V' + U.pad(between(1, 30), 2)
        });
      }

      /* ----- Complaints ----- */
      const managed = projects.filter(p => p.managed);
      const CAT = [['Plumbing', 'Leaking pipe in the kitchen'], ['Electrical', 'Sockets in the master bedroom not working'], ['Power supply', 'Estate transformer tripping at night'],
        ['Water supply', 'No water from the borehole since morning'], ['Security', 'Gate left open overnight'], ['Cleaning', 'Refuse not collected this week'],
        ['Roads & drainage', 'Blocked drainage after the rain'], ['Generator', 'Estate generator not coming on'], ['Plumbing', 'Water heater not working'], ['Other', 'Neighbour’s construction noise at night']];
      for (let i = 0; i < 17; i++) {
        const p = pick(managed);
        const u = pick(p._units.filter(x => x.clientId) || p._units);
        const [category, text] = pick(CAT);
        const d = ago(between(0, 45));
        const status = i < 7 ? pick(['Open', 'In progress']) : 'Resolved';
        ins('complaints', {
          ticketNo: num('CMP', d), projectId: p.id, unitId: u ? u.id : null, reporter: u && u.clientId ? DB.get('clients', u.clientId).name : pick(FIRST) + ' ' + pick(LAST),
          phone: u && u.clientId ? DB.get('clients', u.clientId).phone : phone(), category, description: text,
          priority: category === 'Security' || category === 'Power supply' ? 'Urgent' : pick(['Normal', 'Normal', 'High']),
          status, assignedTo: pick(facility).id, channel: pick(['Phone call', 'WhatsApp', 'Walk-in', 'Website form']),
          createdAt: ts(d), resolvedAt: status === 'Resolved' ? ts(d) + between(4, 72) * 3600000 : null,
          notes: status === 'Resolved' ? [{ at: ts(d) + 3600000 * 5, by: pick(facility).id, text: pick(['Plumber fixed the leak.', 'Breaker replaced.', 'Cleaned and cleared.', 'Spoke with the guards; fixed.']) }] : []
        });
      }

      /* ----- Service charges for managed estates ----- */
      const year = String(new Date().getFullYear());
      managed.forEach(p => {
        p._units.filter(u => u.clientId).forEach(u => {
          const date = year + '-01-15';
          const r = R();
          const paid = r < 0.68 ? p.serviceCharge : r < 0.8 ? Math.round(p.serviceCharge / 2) : 0;
          const pd = U.addDays(date, between(5, 120));
          ins('bills', {
            number: num('SC', date), projectId: p.id, unitId: u.id, clientId: u.clientId, period: year, amount: p.serviceCharge, date, dueDate: year + '-03-31',
            payments: paid ? [{ amount: paid, date: pd > today ? today : pd, method: 'Bank transfer', by: accountants[0].id }] : []
          });
        });
      });

      /* ----- Vehicles ----- */
      const VEH = [
        ['ABJ 412 KT', 'Toyota', 'Hilux', 2021, 'White', drivers[2], 'In use'],
        ['KUJ 218 BQ', 'Toyota', 'Hiace bus (14 seats)', 2019, 'Silver', drivers[0], 'Available'],
        ['ABC 905 HF', 'Toyota', 'Land Cruiser Prado', 2022, 'Black', drivers[1], 'Available'],
        ['GWA 377 AA', 'Toyota', 'Corolla', 2018, 'Grey', null, 'Under repair'],
        ['BWR 164 DE', 'Honda', 'Pilot', 2020, 'Champagne', null, 'Available']
      ];
      const vehicles = VEH.map(([plate, make, model, yr, color, driver, status], i) => ins('vehicles', {
        plate, make, model, year: yr, color, driverId: driver ? driver.id : null, status, mileage: between(30000, 140000),
        papers: { insurance: U.addDays(today, [12, 140, 200, -3, 60][i]), roadworthiness: U.addDays(today, [90, 21, 160, 40, 8][i]), licence: U.addDays(today, [150, 75, 230, 110, 95][i]) }
      }));
      for (let i = 0; i < 40; i++) {
        const v = pick(vehicles);
        const d = ago(between(0, 60));
        const kind = pick(['trip', 'trip', 'trip', 'fuel', 'fuel', 'maintenance']);
        ins('vehicleLogs', {
          vehicleId: v.id, kind, date: d, staffId: v.driverId || pick(drivers).id,
          purpose: kind === 'trip' ? pick(['Site inspection with clients — Tayyib Homes', 'Bank run', 'Materials pickup — Zuba', 'MD to FCDA', 'Site visit — Apo 2', 'Airport pickup']) : kind === 'fuel' ? 'Fuel' : pick(['Oil change & service', 'Brake pads', 'New tyres (x2)', 'AC repair']),
          litres: kind === 'fuel' ? between(30, 70) : null, cost: kind === 'fuel' ? between(30, 70) * 1150 : kind === 'maintenance' ? between(45, 380) * 1000 : 0, odometer: v.mileage - between(0, 3000)
        });
      }

      /* ----- Stores ----- */
      const ITEMS = [
        ['Cement (50kg bags)', 'Building materials', 'bags', 200, 9800, 'Site store — Tayyib Homes'],
        ['Iron rods 12mm', 'Building materials', 'lengths', 300, 11500, 'Site store — Apo 2'],
        ['Iron rods 16mm', 'Building materials', 'lengths', 200, 19500, 'Site store — Apo 2'],
        ['Blocks 9-inch', 'Building materials', 'pcs', 2000, 650, 'Site store — Tayyib Homes'],
        ['Binding wire', 'Building materials', 'rolls', 20, 38000, 'Site store — Mabushi'],
        ['PVC pipes 4-inch', 'Plumbing', 'lengths', 60, 8500, 'Site store — Jabi 3'],
        ['Electrical cable 2.5mm', 'Electrical', 'rolls', 30, 42000, 'Site store — Apo 2'],
        ['Switches & sockets', 'Electrical', 'pcs', 150, 2800, 'Site store — Jabi 3'],
        ['Emulsion paint (20L)', 'Finishes', 'buckets', 40, 45000, 'Site store — Jabi 3'],
        ['Floor tiles 60x60', 'Finishes', 'cartons', 120, 14500, 'Site store — Jabi 3'],
        ['Safety helmets', 'Safety', 'pcs', 30, 6500, 'Head office store'],
        ['A4 paper', 'Office supplies', 'reams', 25, 6800, 'Head office store'],
        ['Printer toner HP 26A', 'Office supplies', 'pcs', 4, 58000, 'Head office store'],
        ['Detergent (25L)', 'Cleaning', 'kegs', 6, 22000, 'Facility store'],
        ['LED bulbs', 'Electrical', 'pcs', 50, 2500, 'Facility store'],
        ['Diesel (litres)', 'Fuel', 'litres', 500, 1250, 'Head office store']
      ];
      const sk = byRole('store')[0];
      ITEMS.forEach(([name, category, unit, reorder, cost, location], i) => {
        const it = ins('items', { sku: 'ST-' + U.pad(i + 1, 3), name, category, unit, reorderLevel: reorder, unitCost: cost, location });
        let stock = 0;
        const n = between(3, 7);
        for (let k = 0; k < n; k++) {
          const d = ago(between(1, 80));
          if (k === 0 || R() < 0.45) {
            const q = Math.round(reorder * (1 + R() * 2));
            stock += q;
            ins('movements', { itemId: it.id, kind: 'in', qty: q, date: d, staffId: sk.id, vendorId: pick(vendors).id, note: 'Delivery', createdAt: ts(d) });
          } else {
            const q = Math.min(stock, Math.round(reorder * (0.3 + R() * 0.9)));
            if (q <= 0) continue;
            stock -= q;
            ins('movements', { itemId: it.id, kind: 'out', qty: q, date: d, staffId: sk.id, projectId: pick(ucProjects).id, issuedTo: pick(['Site engineer', 'Danbaba & Sons crew', 'Facility team', 'Plumbing crew']), note: '', createdAt: ts(d) });
          }
        }
        // Make a few items run low for realism
        if (i === 12 || i === 4 || i === 13) {
          const q = Math.max(0, stock - Math.floor(reorder * 0.5));
          if (q > 0) ins('movements', { itemId: it.id, kind: 'out', qty: q, date: ago(1), staffId: sk.id, projectId: null, issuedTo: 'Various', note: '', createdAt: ts(ago(1)) });
        }
      });

      /* ----- Construction updates ----- */
      const MS = ['Site clearing and setting out', 'Foundation and substructure', 'Block work to DPC', 'First floor slab cast', 'Block work to roof level', 'Roofing', 'Electrical and plumbing first fix', 'Plastering', 'Finishing and tiling', 'External works and landscaping'];
      projects.filter(p => p.status !== 'Completed').forEach(p => {
        const reached = Math.max(1, Math.round(p.progress / 10));
        const steps = Math.min(4, reached);
        for (let i = steps; i >= 1; i--) {
          const idx = reached - i;
          const d = ago(i * between(20, 35));
          ins('updates', {
            projectId: p.id, date: d, progress: Math.max(5, p.progress - (i - 1) * between(4, 8)), milestone: MS[Math.min(MS.length - 1, idx)],
            note: pick(['Work progressing on schedule.', 'Slight delay due to heavy rains; crew increased to catch up.', 'Materials delivered; quality checked by site engineer.', 'Inspection by structural consultant passed.', 'Contractor mobilised additional labour.']),
            photos: [], createdBy: pick(byRole('projects')).id, createdAt: ts(d)
          });
        }
      });

      // Clean up helper fields and record counters
      projects.forEach(p => delete p._units);
      DB.meta.counters = counters;
      DB.insert('activity', { text: 'e-Istrom set up with sample data', who: 'System' }, { silent: true });
    },

    payLine(s) {
      const sal = s.salary || { basic: 0, housing: 0, transport: 0, other: 0 };
      const pension = Math.round((sal.basic + sal.housing + sal.transport) * 0.08);
      const tax = s.tax || 0;
      const deductions = s.otherDeductions || 0;
      const gross = sal.basic + sal.housing + sal.transport + sal.other;
      return { staffId: s.id, basic: sal.basic, housing: sal.housing, transport: sal.transport, other: sal.other, pension, tax, deductions, net: gross - pension - tax - deductions };
    },

    // Clear everything except the real projects and units; create a first administrator
    async startFresh(admin) {
      const keepProjects = DB.all('projects').map(p => Object.assign({}, p));
      const keepUnits = DB.all('units').map(u => ({ id: u.id, projectId: u.projectId, code: u.code, type: u.type, price: u.price, status: 'available', createdAt: u.createdAt }));
      const settings = Object.assign({}, DB.meta.settings, { showDemoAccounts: false });
      await DB.wipe();
      DB.meta = { initialised: true, sampleData: false, createdAt: Date.now(), settings, counters: {} };
      DB.data.projects = keepProjects.map(p => Object.assign(p, { status: p.status }));
      DB.data.units = keepUnits;
      const s = DB.insert('staff', {
        staffNo: 'IST-001', name: admin.name, title: admin.title || 'Administrator', department: admin.department || 'Admin & IT', role: admin.role || 'admin',
        status: 'Active', phone: admin.phone || '', email: admin.email, loginEmail: admin.email.toLowerCase(), canLogin: true, startDate: U.today(), leaveDays: 20
      });
      s.salt = U.uid();
      s.passHash = await Auth.passwordHash(admin.password, s.salt);
      DB.insert('activity', { text: 'Sample data cleared. e-Istrom ready for real records.', who: admin.name });
      await DB.saveAll();
      return s;
    }
  };

  window.Seed = Seed;
})();
