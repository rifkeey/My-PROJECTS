/* e-Istrom — printable documents on Istrom letterhead.
   Uses the browser's print window, so staff can print or "Save as PDF". */
(function () {
  const esc = U.esc;

  function company() {
    return {
      name: DB.setting('companyName', 'Istrom Dynamic Projects Ltd'),
      address: DB.setting('companyAddress', 'Suite 207/208, Inna Plaza, Gaduwa, Abuja'),
      phone: DB.setting('companyPhone', '+234 (0) 909 888 8800'),
      email: DB.setting('companyEmail', 'info@istrom.ng'),
      web: DB.setting('companyWeb', 'istromgroup.com.ng'),
      rc: DB.setting('companyRC', ''),
      bank: DB.setting('bankDetails', ''),
      signatory: DB.setting('signatoryName', ''),
      signatoryTitle: DB.setting('signatoryTitle', 'Managing Director')
    };
  }

  const CSS = `
    /* Zero page margins stop the browser printing its own header and footer
       (file location, page title, date). The spacer rows below repeat on
       every printed page to give the document its margins instead. */
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { font: 10.5pt/1.55 -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #2B2A28; margin: 0; padding: 0 18mm; }
    table.pg { margin: 0; }
    .pg > thead > tr > td, .pg > tbody > tr > td, .pg > tfoot > tr > td { padding: 0; border: 0; }
    .pg-top { height: 16mm; } .pg-bot { height: 22mm; }
    .lh { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 14px; border-bottom: 1.5px solid #B8925F; margin-bottom: 26px; }
    .wm { font-weight: 700; font-size: 26pt; letter-spacing: -0.04em; line-height: 1; }
    .wm small { display: block; font-size: 7.5pt; letter-spacing: .28em; font-weight: 500; color: #8A8378; margin-top: 6px; text-transform: uppercase; }
    .lh-r { text-align: right; font-size: 8.5pt; color: #6E6A64; line-height: 1.5; }
    h1 { font-size: 15pt; letter-spacing: -0.01em; margin: 0 0 4px; }
    h2 { font-size: 11pt; margin: 22px 0 8px; }
    .muted { color: #6E6A64; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 22px; gap: 24px; }
    .meta div { font-size: 9.5pt; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 9.5pt; }
    th { text-align: left; font-weight: 600; color: #6E6A64; border-bottom: 1px solid #D9D3C9; padding: 7px 6px; font-size: 8.5pt; }
    td { border-bottom: 1px solid #EEEAE3; padding: 7px 6px; vertical-align: top; }
    .r { text-align: right; } .c { text-align: center; }
    tfoot td { font-weight: 600; border-bottom: none; border-top: 1px solid #D9D3C9; }
    .big { font-size: 20pt; font-weight: 600; letter-spacing: -0.02em; }
    .box { border: 1px solid #E3DED5; border-radius: 8px; padding: 14px 16px; margin: 14px 0; background: #FBFAF7; }
    .words { font-style: italic; color: #4D4A45; }
    p { margin: 0 0 10px; }
    ol, ul { margin: 0 0 10px; padding-left: 18px; } li { margin-bottom: 5px; }
    .sign { display: flex; justify-content: space-between; margin-top: 48px; gap: 40px; }
    .sign div { flex: 1; border-top: 1px solid #2B2A28; padding-top: 6px; font-size: 9pt; }
    .note { margin-top: 28px; font-size: 8.5pt; color: #6E6A64; border-top: 1px solid #EEEAE3; padding-top: 10px; }
    .foot { position: fixed; bottom: 9mm; left: 0; right: 0; text-align: center; font-size: 7.5pt; color: #A39C91; letter-spacing: .12em; text-transform: uppercase; }
    .stamp { display: inline-block; border: 1.5px solid #5E7D63; color: #5E7D63; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 9pt; letter-spacing: .1em; transform: rotate(-4deg); }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 9.5pt; }
    .two b { font-weight: 600; }
  `;

  function letterhead() {
    const c = company();
    return '<div class="lh"><div class="wm">istrom<small>' + esc(c.name) + '</small></div>' +
      '<div class="lh-r">' + esc(c.address) + '<br>' + esc(c.phone) + ' · ' + esc(c.email) + '<br>' + esc(c.web) + (c.rc ? '<br>RC ' + esc(c.rc) : '') + '</div></div>';
  }

  function noCash() {
    const c = company();
    return '<div class="note">Istrom does not accept cash payments. Please pay only into the company’s official bank account. If anyone asks you for cash, call ' + esc(c.phone) + ' or write to ' + esc(c.email) + '.</div>';
  }

  function signature(left, right) {
    const c = company();
    return '<div class="sign"><div>' + (left || ('For: ' + esc(c.name) + '<br><span class="muted">' + esc(c.signatory || 'Authorised signatory') + ', ' + esc(c.signatoryTitle) + '</span>')) + '</div><div>' + (right || 'Accepted by client<br><span class="muted">Name, signature & date</span>') + '</div></div>';
  }

  const Docs = {
    company,

    print(title, body) {
      const frame = document.createElement('iframe');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      doc.open();
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + CSS + '</style></head><body>' +
        '<table class="pg"><thead><tr><td><div class="pg-top"></div></td></tr></thead>' +
        '<tbody><tr><td>' + letterhead() + body + '</td></tr></tbody>' +
        '<tfoot><tr><td><div class="pg-bot"></div></td></tr></tfoot></table>' +
        '<div class="foot">Integrity · Professionalism · Commitment</div></body></html>');
      doc.close();
      setTimeout(() => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => frame.remove(), 1500);
      }, 250);
    },

    // Keep a register of every document issued
    register(type, ref, number, clientId) {
      DB.insert('documents', { type, ref, number, clientId: clientId || null, date: U.today(), issuedBy: Auth.user.id });
      DB.log('Issued ' + type + ' ' + number);
    },

    receipt(paymentId, reprint) {
      const p = DB.get('payments', paymentId);
      if (!p) return;
      const sale = DB.get('sales', p.saleId);
      const client = DB.get('clients', p.clientId);
      const unit = sale && DB.get('units', sale.unitId);
      const st = sale ? Biz.saleStats(sale) : null;
      const isRefund = p.amount < 0;
      const body =
        '<div class="meta"><div><h1>' + (isRefund ? 'Refund Voucher' : 'Official Receipt') + '</h1><div class="muted">No. ' + esc(p.receiptNo) + '</div></div>' +
        '<div class="r">Date: <b>' + U.dateLong(p.date) + '</b></div></div>' +
        '<div class="two"><div><b>Received from</b><br>' + esc(client ? client.name : '') + '<br><span class="muted">' + esc(client ? client.phone || '' : '') + '</span></div>' +
        '<div><b>Property</b><br>' + esc(unit ? unit.type + ', ' + unit.code : '') + '<br><span class="muted">' + esc(unit ? Biz.projectName(unit.projectId) : '') + '</span></div></div>' +
        '<div class="box"><div class="muted">' + (isRefund ? 'Amount refunded' : 'Amount received') + '</div><div class="big">' + U.money(Math.abs(p.amount)) + '</div><div class="words">' + U.words(Math.abs(p.amount)) + '</div></div>' +
        '<table><tr><th>Payment method</th><th>Bank reference</th><th>Being</th></tr><tr><td>' + esc(p.method || '') + '</td><td>' + esc(p.bankRef || '—') + '</td><td>' + esc(p.note || (isRefund ? 'Refund' : 'Payment towards property')) + '</td></tr></table>' +
        (st ? '<table><tr><th>Price of property</th><th class="r">Total paid to date</th><th class="r">Balance outstanding</th></tr><tr><td>' + U.money(sale.price) + '</td><td class="r">' + U.money(st.paid) + '</td><td class="r"><b>' + U.money(st.balance) + '</b></td></tr></table>' : '') +
        (st && st.balance <= 0.5 ? '<p><span class="stamp">FULLY PAID</span></p>' : '') +
        signature('Received by: ' + esc(Biz.staffName(p.createdBy)) + '<br><span class="muted">' + esc((DB.get('staff', p.createdBy) || {}).title || 'Finance & Accounts') + '</span>', 'Authorised signatory<br><span class="muted">' + esc(company().name) + '</span>') +
        noCash();
      if (!reprint) Docs.register(isRefund ? 'Refund voucher' : 'Receipt', { payments: p.id }, p.receiptNo, p.clientId);
      Docs.print('Receipt ' + p.receiptNo, body);
    },

    schedule(saleId) {
      const s = DB.get('sales', saleId);
      const client = DB.get('clients', s.clientId);
      const unit = DB.get('units', s.unitId);
      const st = Biz.saleStats(s);
      let cum = 0;
      const rows = (s.schedule || []).map(x => {
        cum += x.amount;
        const state = st.paid + 0.5 >= cum ? 'Paid' : (x.due < U.today() ? 'Overdue' : 'Due');
        return '<tr><td>' + esc(x.label) + '</td><td>' + U.date(x.due) + '</td><td class="r">' + U.money(x.amount) + '</td><td>' + state + '</td></tr>';
      }).join('');
      const body = '<h1>Payment Schedule</h1><p class="muted">Sale ' + esc(s.number) + ' · printed ' + U.dateLong(U.today()) + '</p>' +
        '<div class="two"><div><b>Client</b><br>' + esc(client.name) + '</div><div><b>Property</b><br>' + esc(Biz.unitFull(unit)) + '</div></div>' +
        '<table><thead><tr><th>Item</th><th>Due date</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody>' +
        '<tfoot><tr><td colspan="2">Total price</td><td class="r">' + U.money(s.price) + '</td><td></td></tr></tfoot></table>' +
        '<p>Paid to date: <b>' + U.money(st.paid) + '</b> · Balance: <b>' + U.money(st.balance) + '</b>' + (st.overdue ? ' · Overdue: <b>' + U.money(st.overdue) + '</b>' : '') + '</p>' +
        (company().bank ? '<div class="box"><b>Pay into:</b> ' + esc(company().bank) + '</div>' : '') + noCash();
      Docs.print('Payment schedule ' + s.number, body);
    },

    offer(saleId, reprint) {
      const s = DB.get('sales', saleId);
      const client = DB.get('clients', s.clientId);
      const unit = DB.get('units', s.unitId);
      const project = DB.get('projects', unit.projectId);
      const c = company();
      const isNew = !s.offerNo;
      const number = s.offerNo || DB.nextNumber('OFR');
      if (isNew) {
        DB.update('sales', s.id, { offerNo: number, offerDate: U.today() });
        Docs.register('Offer letter', { sales: s.id }, number, client.id);
      }
      const sched = s.schedule || [];
      const plan = s.plan === 'instalment'
        ? 'an initial deposit of ' + U.money(sched[0] ? sched[0].amount : 0) + ', with the balance paid in ' + (s.months) + ' monthly instalments as set out in the attached payment schedule'
        : 'a single payment of the full price';
      const body =
        '<div class="meta"><div>' + U.dateLong(s.offerDate || U.today()) + '<br><br><b>' + esc(client.name) + '</b><br>' + esc(client.address || '') + '<br>' + esc(client.phone || '') + '</div><div class="r muted">Ref: ' + esc(number) + '</div></div>' +
        '<p>Dear ' + esc(client.name) + ',</p>' +
        '<h1>Offer of ' + esc(unit.type) + ' at ' + esc(project.name) + '</h1>' +
        '<p>Thank you for your interest in ' + esc(project.name) + ', ' + esc(project.location) + '. We are pleased to offer you the property described below, subject to the terms in this letter.</p>' +
        '<table><tr><th>Property</th><td>' + esc(unit.type) + ' (' + esc(unit.code) + ')</td></tr>' +
        '<tr><th>Estate</th><td>' + esc(project.name) + ', ' + esc(project.location) + '</td></tr>' +
        (s.discount ? '<tr><th>List price</th><td>' + U.money(s.listPrice) + '</td></tr><tr><th>Discount</th><td>' + U.money(s.discount) + '</td></tr>' : '') +
        '<tr><th>Price</th><td><b>' + U.money(s.price) + '</b> <span class="muted">(' + U.words(s.price) + ')</span></td></tr>' +
        '<tr><th>Payment plan</th><td>' + (s.plan === 'instalment' ? 'Instalments over ' + s.months + ' months' : 'Outright payment') + '</td></tr></table>' +
        '<h2>Terms of this offer</h2><ol>' +
        '<li>The price will be paid by ' + plan + '.</li>' +
        '<li>All payments must be made by bank transfer, POS or cheque to the company’s official account' + (c.bank ? ' (' + esc(c.bank) + ')' : '') + '. Istrom will issue an official receipt for every payment. Istrom does not accept cash.</li>' +
        '<li>If an instalment is more than 60 days late, Istrom may, after written notice, withdraw this offer and refund payments received, less an administrative charge of 10%.</li>' +
        '<li>An allocation letter will be issued when the property is fully paid for. Physical handover takes place on completion of construction and full payment of all charges.</li>' +
        '<li>Legal documentation, survey and infrastructure/development charges, where applicable, are payable separately and will be communicated in writing.</li>' +
        '<li>After handover, the owner agrees to abide by the estate rules and to pay the annual service charge set by the estate’s facility manager.</li>' +
        '<li>This offer is valid for 14 days from the date above. Please sign and return a copy to accept it.</li></ol>' +
        '<p>We look forward to welcoming you to the Istrom community.</p><p>Yours faithfully,</p>' +
        signature() + noCash();
      Docs.print('Offer letter ' + number, body);
    },

    allocation(saleId, reprint) {
      const s = DB.get('sales', saleId);
      const client = DB.get('clients', s.clientId);
      const unit = DB.get('units', s.unitId);
      const project = DB.get('projects', unit.projectId);
      const st = Biz.saleStats(s);
      const number = s.allocationNo || DB.nextNumber('ALC');
      if (!s.allocationNo) {
        DB.update('sales', s.id, { allocationNo: number, allocationDate: U.today() });
        Docs.register('Allocation letter', { sales: s.id }, number, client.id);
      }
      const body =
        '<div class="meta"><div>' + U.dateLong(s.allocationDate || U.today()) + '<br><br><b>' + esc(client.name) + '</b><br>' + esc(client.address || '') + '</div><div class="r muted">Ref: ' + esc(number) + '</div></div>' +
        '<p>Dear ' + esc(client.name) + ',</p>' +
        '<h1>Letter of Allocation</h1>' +
        '<p>We are pleased to confirm that, having received payment in full for the property below, it has been allocated to you.</p>' +
        '<table><tr><th>Estate</th><td>' + esc(project.name) + ', ' + esc(project.location) + '</td></tr>' +
        '<tr><th>Property</th><td>' + esc(unit.type) + '</td></tr>' +
        '<tr><th>Unit / house number</th><td><b>' + esc(unit.code) + '</b></td></tr>' +
        '<tr><th>Price paid</th><td>' + U.money(st.paid) + '</td></tr></table>' +
        '<p>This letter confirms your right to the unit named above. It should be kept safely and presented, with your receipts, for handover and for the processing of your title documents.</p>' +
        '<p>Please note that the annual estate service charge, utility connections and any outstanding legal or documentation fees are payable separately.</p>' +
        '<p>Congratulations, and welcome home.</p><p>Yours faithfully,</p>' + signature() + noCash();
      Docs.print('Allocation letter ' + number, body);
    },

    statement(clientId) {
      const client = DB.get('clients', clientId);
      const cs = Biz.clientStats(clientId);
      let html = '<h1>Statement of Account</h1><p class="muted">' + esc(client.name) + ' · ' + esc(client.clientNo || '') + ' · as at ' + U.dateLong(U.today()) + '</p>';
      cs.sales.forEach(s => {
        const st = Biz.saleStats(s);
        const unit = DB.get('units', s.unitId);
        html += '<h2>' + esc(Biz.unitFull(unit)) + '</h2><table><thead><tr><th>Date</th><th>Receipt</th><th>Details</th><th class="r">Amount</th></tr></thead><tbody>' +
          st.payments.map(p => '<tr><td>' + U.date(p.date) + '</td><td>' + esc(p.receiptNo) + '</td><td>' + esc(p.method || '') + (p.amount < 0 ? ' (refund)' : '') + '</td><td class="r">' + U.money(p.amount) + '</td></tr>').join('') +
          '</tbody><tfoot><tr><td colspan="3">Price ' + U.money(s.price) + ' · Paid ' + U.money(st.paid) + '</td><td class="r">Balance ' + U.money(st.balance) + '</td></tr></tfoot></table>';
      });
      html += '<div class="box"><div class="two"><div>Total value: <b>' + U.money(cs.value) + '</b></div><div>Total paid: <b>' + U.money(cs.paid) + '</b></div><div>Balance: <b>' + U.money(cs.balance) + '</b></div><div>Overdue now: <b>' + U.money(cs.overdue) + '</b></div></div></div>' + noCash();
      Docs.print('Statement ' + client.name, html);
    },

    payslip(runId, staffId) {
      const run = DB.get('payroll', runId);
      const l = run.lines.find(x => x.staffId === staffId);
      const s = DB.get('staff', staffId);
      const gross = l.basic + l.housing + l.transport + l.other;
      const body = '<h1>Payslip — ' + U.monthLabel(run.month, true) + '</h1><p class="muted">Private and confidential</p>' +
        '<div class="two"><div><b>' + esc(s.name) + '</b><br>' + esc(s.title || '') + '<br>' + esc(s.department || '') + '</div><div>Staff no: ' + esc(s.staffNo || '') + '<br>Bank: ' + esc(s.bank || '—') + '<br>Account: ' + esc(s.accountNo || '—') + '</div></div>' +
        '<table><tr><th>Earnings</th><th class="r">Amount</th><th>Deductions</th><th class="r">Amount</th></tr>' +
        '<tr><td>Basic</td><td class="r">' + U.money(l.basic) + '</td><td>Pension (8%)</td><td class="r">' + U.money(l.pension) + '</td></tr>' +
        '<tr><td>Housing</td><td class="r">' + U.money(l.housing) + '</td><td>PAYE tax</td><td class="r">' + U.money(l.tax) + '</td></tr>' +
        '<tr><td>Transport</td><td class="r">' + U.money(l.transport) + '</td><td>Other deductions</td><td class="r">' + U.money(l.deductions) + '</td></tr>' +
        '<tr><td>Other allowances</td><td class="r">' + U.money(l.other) + '</td><td></td><td></td></tr>' +
        '<tfoot><tr><td>Gross pay</td><td class="r">' + U.money(gross) + '</td><td>Total deductions</td><td class="r">' + U.money(l.pension + l.tax + l.deductions) + '</td></tr></tfoot></table>' +
        '<div class="box"><div class="muted">Net pay</div><div class="big">' + U.money(l.net) + '</div><div class="words">' + U.words(l.net) + '</div></div>';
      Docs.print('Payslip ' + s.name, body);
    },

    purchaseOrder(id) {
      const p = DB.get('purchases', id);
      const v = DB.get('vendors', p.vendorId);
      const number = p.poNo || DB.nextNumber('LPO');
      if (!p.poNo) { DB.update('purchases', p.id, { poNo: number, status: p.status === 'approved' ? 'ordered' : p.status }); Docs.register('Purchase order', { purchases: p.id }, number); }
      const items = p.items && p.items.length ? p.items : [{ desc: p.title, qty: 1, unitCost: p.amount }];
      const body = '<div class="meta"><div><h1>Local Purchase Order</h1><div class="muted">No. ' + esc(number) + ' · ' + U.dateLong(U.today()) + '</div></div></div>' +
        '<div class="two"><div><b>Supplier</b><br>' + esc(v ? v.name : '—') + '<br>' + esc(v ? v.address || '' : '') + '<br>' + esc(v ? v.phone || '' : '') + '</div><div><b>Deliver to</b><br>' + esc(p.projectId ? Biz.projectName(p.projectId) : company().address) + '</div></div>' +
        '<table><thead><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit cost</th><th class="r">Amount</th></tr></thead><tbody>' +
        items.map(i => '<tr><td>' + esc(i.desc) + '</td><td class="r">' + U.num(i.qty) + '</td><td class="r">' + U.money(i.unitCost) + '</td><td class="r">' + U.money(i.qty * i.unitCost) + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td colspan="3">Total</td><td class="r">' + U.money(p.amount) + '</td></tr></tfoot></table>' +
        '<p class="words">' + U.words(p.amount) + '</p><p>Approved under reference ' + esc(p.number) + '. Please quote the LPO number on your invoice and delivery note.</p>' +
        signature('Authorised by<br><span class="muted">' + esc(company().name) + '</span>', 'Received by supplier<br><span class="muted">Name, signature & date</span>');
      Docs.print('LPO ' + number, body);
    },

    serviceInvoice(billId) {
      const b = DB.get('bills', billId);
      const unit = DB.get('units', b.unitId);
      const paid = U.sum(b.payments || [], p => p.amount);
      const body = '<div class="meta"><div><h1>Service Charge Invoice</h1><div class="muted">No. ' + esc(b.number) + ' · ' + U.dateLong(b.date) + '</div></div></div>' +
        '<div class="two"><div><b>Resident / owner</b><br>' + esc(b.clientId ? Biz.clientName(b.clientId) : (unit.ownerName || '')) + '</div><div><b>Property</b><br>' + esc(Biz.unitFull(unit)) + '</div></div>' +
        '<table><thead><tr><th>Description</th><th class="r">Amount</th></tr></thead><tbody><tr><td>Estate service charge — ' + esc(b.period) + '<br><span class="muted">Security, cleaning, landscaping, common area power and maintenance</span></td><td class="r">' + U.money(b.amount) + '</td></tr></tbody>' +
        '<tfoot><tr><td>Paid</td><td class="r">' + U.money(paid) + '</td></tr><tr><td>Balance due</td><td class="r">' + U.money(b.amount - paid) + '</td></tr></tfoot></table>' +
        (company().bank ? '<div class="box"><b>Pay into:</b> ' + esc(company().bank) + '</div>' : '') + noCash();
      Docs.print('Service charge ' + b.number, body);
    },

    // Generic printable list for reports
    report(title, subtitle, tableHtml) {
      Docs.print(title, '<h1>' + esc(title) + '</h1><p class="muted">' + esc(subtitle || '') + ' · printed ' + U.dateLong(U.today()) + ' by ' + esc(Auth.user.name) + '</p>' + tableHtml);
    }
  };

  window.Docs = Docs;
})();
