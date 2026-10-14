/* e-Istrom — Client payments, receipts, overdue balances */
(function () {
  const esc = U.esc, icon = UI.icon;

  const Pay = {
    async record(ctx) {
      ctx = ctx || {};
      const openSales = cid => DB.filter('sales', s => s.clientId === cid && s.status === 'active' && Biz.saleStats(s).balance > 0.5);
      let preSale = ctx.saleId ? DB.get('sales', ctx.saleId) : null;
      const values = {
        clientId: preSale ? preSale.clientId : (ctx.clientId || ''),
        saleId: preSale ? preSale.id : '',
        date: U.today(), method: 'Bank transfer'
      };
      if (!values.saleId && values.clientId) { const o = openSales(values.clientId); if (o.length === 1) values.saleId = o[0].id; }
      const suggest = sid => { const s = DB.get('sales', sid); if (!s) return 0; const st = Biz.saleStats(s); return Math.round(st.overdue > 0 ? st.overdue : st.next ? st.next.amount : st.balance); };
      if (values.saleId) values.amount = suggest(values.saleId);

      const v = await UI.form({
        title: 'Record a client payment', values,
        intro: 'Record money that has reached the company account. A receipt number is given automatically.',
        fields: [
          { name: 'clientId', label: 'Client', type: 'select', required: true, options: () => U.sortBy(DB.all('clients').filter(c => openSales(c.id).length), c => c.name).map(c => [c.id, c.name + ' · ' + (c.phone || '')]) },
          { name: 'saleId', label: 'For which property', type: 'select', required: true, dependsOn: ['clientId'], options: v => openSales(v.clientId).map(s => [s.id, Biz.unitFull(s.unitId)]) },
          { type: 'note', name: 'info', html: v => {
            const s = DB.get('sales', v.saleId);
            if (!s) return '';
            const st = Biz.saleStats(s);
            return 'Price ' + U.money(s.price) + ' · paid ' + U.money(st.paid) + ' · <b>balance ' + U.money(st.balance) + '</b>' +
              (st.overdue > 0 ? '<br><span class="tone-red">' + U.money(st.overdue) + ' is overdue.</span>' : st.next ? '<br>Next due: ' + U.money(st.next.amount) + ' on ' + U.date(st.next.due) : '');
          } },
          { name: 'amount', label: 'Amount received', type: 'money', required: true, half: true },
          { name: 'date', label: 'Date received', type: 'date', required: true, half: true },
          { name: 'method', label: 'Method', type: 'select', options: Biz.PAY_METHODS, placeholder: false, half: true },
          { name: 'bankRef', label: 'Bank / teller reference', half: true },
          { name: 'note', label: 'Being payment for', placeholder: 'e.g. 3rd instalment' }
        ],
        onChange: (v, form, changed) => {
          if (changed === 'clientId') {
            const o = openSales(v.clientId);
            if (o.length === 1) { form.elements.saleId.value = o[0].id; changed = 'saleId'; v.saleId = o[0].id; }
          }
          if (changed === 'saleId' && v.saleId) {
            form.elements.amount.value = U.num(suggest(v.saleId));
            form.elements.amount.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        validate: v => {
          const s = DB.get('sales', v.saleId);
          if (!(v.amount > 0)) return 'Please enter the amount received.';
          if (s && v.amount > Biz.saleStats(s).balance + 0.5) return 'That’s more than the balance of ' + U.money(Biz.saleStats(s).balance) + '.';
          if (v.date > U.today()) return 'The date can’t be in the future.';
          if (v.bankRef && DB.find('payments', p => p.bankRef && p.bankRef.toLowerCase() === v.bankRef.toLowerCase())) return 'A payment with this bank reference was already recorded. Please check it isn’t a duplicate.';
        }
      });
      if (!v) return;
      const sale = DB.get('sales', v.saleId);
      const p = DB.insert('payments', { receiptNo: DB.nextNumber('RCT'), saleId: sale.id, clientId: sale.clientId, amount: v.amount, date: v.date, method: v.method, bankRef: v.bankRef, note: v.note });
      DB.log('Recorded payment ' + p.receiptNo + ': ' + U.money(p.amount) + ' from ' + Biz.clientName(sale.clientId));
      const st = Biz.saleStats(sale);
      App.refresh();
      UI.modal({
        title: 'Payment recorded', size: 'sm',
        body: '<div style="text-align:center;padding:6px 0 4px">' + icon('checkCircle', 40) + '<div class="big-num mt">' + U.money(p.amount) + '</div><p class="muted">Receipt ' + esc(p.receiptNo) + ' · ' + esc(Biz.clientName(sale.clientId)) + '</p>' +
          (st.balance <= 0.5 ? '<div class="callout" style="text-align:left">' + icon('key', 16) + '<div><b>Fully paid.</b> This property can now get its allocation letter.</div></div>' : '<p>Balance now ' + U.money(st.balance) + '</p>') + '</div>',
        foot: '<button class="btn" data-maction="close">Done</button><button class="btn btn-primary" data-maction="print">' + icon('print', 15) + 'Print receipt</button>',
        actions: { close: (a, close) => close(), print: (a, close) => { Docs.receipt(p.id); close(); } }
      });
    },

    async recordRefund(sale) {
      const r = sale.refundRequest;
      const v = await UI.form({
        title: 'Record refund paid', size: 'sm', values: { date: U.today(), method: 'Bank transfer' },
        intro: 'Refund of <b>' + U.money(r.amount) + '</b> to ' + esc(Biz.clientName(sale.clientId)) + ', approved by management.',
        fields: [
          { name: 'date', label: 'Date paid', type: 'date', required: true, half: true },
          { name: 'method', label: 'Method', type: 'select', options: Biz.PAY_METHODS, placeholder: false, half: true },
          { name: 'bankRef', label: 'Bank reference' }
        ]
      });
      if (!v) return;
      const p = DB.insert('payments', { receiptNo: DB.nextNumber('RFD'), saleId: sale.id, clientId: sale.clientId, amount: -r.amount, date: v.date, method: v.method, bankRef: v.bankRef, note: 'Refund — ' + (r.reason || 'sale cancelled') });
      DB.update('sales', sale.id, { refundRequest: Object.assign({}, r, { paid: true, paymentId: p.id }) });
      DB.log('Paid refund ' + p.receiptNo + ' of ' + U.money(r.amount) + ' to ' + Biz.clientName(sale.clientId));
      Docs.receipt(p.id);
      App.refresh();
    }
  };
  window.Pay = Pay;

  App.route('/payments', 'payments.view', (params, q) => {
    const tab = q.tab || 'recent';
    const today = U.today(), month = today.slice(0, 7), year = today.slice(0, 4);
    const sales = Biz.visibleSales().filter(s => s.status === 'active');
    const visibleIds = new Set(Biz.visibleSales().map(s => s.id));
    const stats = sales.map(s => Object.assign({ _s: Biz.saleStats(s) }, s));
    const pays = DB.filter('payments', p => visibleIds.has(p.saleId));
    const inMonth = pays.filter(p => p.date.startsWith(month) && p.amount > 0);
    const inYear = pays.filter(p => p.date.startsWith(year) && p.amount > 0);
    const overdue = U.sortBy(stats.filter(s => s._s.overdue > 0.5), s => s._s.overdue, true);
    const upcoming = U.sortBy(stats.filter(s => s._s.next && s._s.next.due >= today && s._s.next.due <= U.addDays(today, 30) && s._s.overdue <= 0.5), s => s._s.next.due);

    let body = '';
    if (tab === 'recent') {
      body = UI.table({
        id: 'pays', rows: U.sortBy(pays, p => p.date + p.receiptNo, true), noun: 'payment', search: p => p.receiptNo + ' ' + Biz.clientName(p.clientId) + ' ' + (p.bankRef || ''), searchPlaceholder: 'Search receipt, client or bank reference',
        filters: [
          { key: 'm', label: 'Any month', options: U.lastMonths(18).reverse().map(m => [m, U.monthLabel(m, true)]), value: p => p.date.slice(0, 7) },
          { key: 'me', label: 'Any method', options: Biz.PAY_METHODS, value: p => p.method },
          { key: 'pr', label: 'Any project', options: Biz.projectOptions(), value: p => { const s = DB.get('sales', p.saleId); return s ? s.projectId : ''; } }
        ],
        toolbar: UI.btn('Export', 'export', { icon: 'download', small: true, kind: 'ghost' }),
        columns: [
          { label: 'Date', html: p => U.date(p.date), sort: p => p.date },
          { label: 'Receipt', html: p => '<span class="cell-main">' + esc(p.receiptNo) + '</span>' + (p.amount < 0 ? ' ' + UI.badge('Refund') : ''), sort: p => p.receiptNo },
          { label: 'Client', html: p => '<a href="#/clients/' + p.clientId + '">' + esc(Biz.clientName(p.clientId)) + '</a>', sort: p => Biz.clientName(p.clientId) },
          { label: 'Property', html: p => { const s = DB.get('sales', p.saleId); return s ? esc(Biz.unitLabel(s.unitId)) + '<div class="cell-sub">' + esc(Biz.projectName(s.projectId)) + '</div>' : ''; } },
          { label: 'Method', html: p => esc(p.method) + (p.bankRef ? '<div class="cell-sub">' + esc(p.bankRef) + '</div>' : '') },
          { label: 'Amount', cls: 'num', html: p => '<b>' + U.money(p.amount) + '</b>', sort: p => p.amount },
          { label: '', cls: 'r', html: p => UI.btn('', 'receipt', { small: true, kind: 'ghost', icon: 'print', data: { id: p.id }, title: 'Print receipt' }) }
        ],
        empty: UI.empty('No payments yet', '', '', 'receipt')
      });
    }
    if (tab === 'overdue') {
      body = '<div class="callout">' + icon('whatsapp', 17) + '<div>Tap <b>Remind</b> to open a ready-made WhatsApp or SMS message for the client. Nothing is sent until you press send on your phone.</div></div>' + UI.table({
        id: 'od', rows: overdue, noun: 'client', search: s => Biz.clientName(s.clientId) + ' ' + Biz.unitLabel(s.unitId),
        filters: [{ key: 'pr', label: 'Any project', options: Biz.projectOptions(), value: s => s.projectId }, { key: 'age', label: 'Any age', options: [['30', 'Up to 30 days'], ['90', '31–90 days'], ['90+', 'Over 90 days']], value: s => s._s.daysLate <= 30 ? '30' : s._s.daysLate <= 90 ? '90' : '90+' }],
        toolbar: UI.btn('Export', 'exportOd', { icon: 'download', small: true, kind: 'ghost' }),
        columns: [
          { label: 'Client', html: s => { const c = DB.get('clients', s.clientId); return '<a class="cell-main" href="#/clients/' + c.id + '">' + esc(c.name) + '</a><div class="cell-sub">' + esc(c.phone || '') + '</div>'; }, sort: s => Biz.clientName(s.clientId) },
          { label: 'Property', html: s => esc(Biz.unitLabel(s.unitId)) + '<div class="cell-sub">' + esc(Biz.projectName(s.projectId)) + '</div>' },
          { label: 'Overdue', cls: 'num', html: s => '<b class="tone-red">' + U.money(s._s.overdue) + '</b>', sort: s => s._s.overdue },
          { label: 'Late by', cls: 'num', html: s => U.plural(s._s.daysLate, 'day'), sort: s => s._s.daysLate },
          { label: 'Balance', cls: 'num', html: s => U.money(s._s.balance), sort: s => s._s.balance },
          { label: 'Last paid', html: s => { const p = s._s.payments[s._s.payments.length - 1]; return p ? U.date(p.date) : '<span class="muted">Never</span>'; }, sort: s => { const p = s._s.payments[s._s.payments.length - 1]; return p ? p.date : ''; } },
          { label: 'Reminded', html: s => (s.reminders || []).length ? '<span class="cell-sub">' + U.ago(s.reminders[s.reminders.length - 1].at) + '</span>' : '<span class="muted">—</span>' },
          { label: '', cls: 'r nowrap', html: s => UI.btn('Remind', 'remind', { small: true, icon: 'whatsapp', data: { id: s.id } }) + ' ' + UI.btn('', 'openSale', { small: true, kind: 'ghost', icon: 'chevron', data: { id: s.id } }) }
        ],
        empty: UI.empty('No overdue payments', 'Every client is up to date. Lovely.', '', 'checkCircle')
      });
    }
    if (tab === 'upcoming') {
      body = UI.table({
        id: 'up', rows: upcoming, noun: 'payment', rowAction: 'openSale',
        columns: [
          { label: 'Due', html: s => U.date(s._s.next.due) + '<div class="cell-sub">in ' + U.plural(U.daysBetween(today, s._s.next.due), 'day') + '</div>', sort: s => s._s.next.due },
          { label: 'Client', html: s => esc(Biz.clientName(s.clientId)) },
          { label: 'Property', html: s => esc(Biz.unitLabel(s.unitId)) + '<div class="cell-sub">' + esc(Biz.projectName(s.projectId)) + '</div>' },
          { label: 'For', html: s => esc(s._s.next.label) },
          { label: 'Amount', cls: 'num', html: s => U.money(s._s.next.amount), sort: s => s._s.next.amount },
          { label: '', cls: 'r', html: s => UI.btn('Remind', 'remind', { small: true, icon: 'whatsapp', data: { id: s.id } }) }
        ],
        empty: UI.empty('Nothing due in the next 30 days', '', '', 'calendar')
      });
    }

    const exportRows = (rows, cols, name) => U.download(name + '.csv', U.csv(rows, cols), 'text/csv');

    return {
      title: 'Client payments',
      html: UI.header('Client payments', 'Money received from buyers, and who still owes', Auth.can('payments.record') ? UI.btn('Record payment', 'add', { icon: 'plus', kind: 'primary' }) : '') +
        '<div class="stats">' +
          UI.stat('This month', U.moneyShort(U.sum(inMonth, p => p.amount)), U.plural(inMonth.length, 'payment')) +
          UI.stat('This year', U.moneyShort(U.sum(inYear, p => p.amount)), U.plural(inYear.length, 'payment')) +
          UI.stat('Still to collect', U.moneyShort(U.sum(stats, s => s._s.balance)), 'across ' + U.plural(stats.filter(s => s._s.balance > 0.5).length, 'sale')) +
          UI.stat('Overdue', U.moneyShort(U.sum(overdue, s => s._s.overdue)), U.plural(overdue.length, 'client') + ' behind', { tone: overdue.length ? 'red' : 'green', href: '/payments?tab=overdue' }) +
          UI.stat('Due in 30 days', U.moneyShort(U.sum(upcoming, s => s._s.next.amount)), U.plural(upcoming.length, 'payment'), { href: '/payments?tab=upcoming' }) +
        '</div>' +
        UI.tabs([['recent', 'Payments received', '#/payments'], ['overdue', 'Overdue (' + overdue.length + ')', '#/payments?tab=overdue'], ['upcoming', 'Due soon (' + upcoming.length + ')', '#/payments?tab=upcoming']], tab) + body,
      actions: {
        add: () => Pay.record(),
        receipt: (id, el) => Docs.receipt(el.dataset.id, true),
        remind: (id, el) => Remind.open(DB.get('sales', el.dataset.id || id)),
        openSale: (id, el) => App.go('/sales/' + (el.dataset.id || id)),
        export: () => exportRows(U.sortBy(pays, p => p.date, true), [
          { label: 'Date', value: p => p.date }, { label: 'Receipt', value: p => p.receiptNo }, { label: 'Client', value: p => Biz.clientName(p.clientId) },
          { label: 'Unit', value: p => { const s = DB.get('sales', p.saleId); return s ? Biz.unitLabel(s.unitId) : ''; } }, { label: 'Project', value: p => { const s = DB.get('sales', p.saleId); return s ? Biz.projectName(s.projectId) : ''; } },
          { label: 'Method', value: p => p.method }, { label: 'Bank ref', value: p => p.bankRef }, { label: 'Amount', value: p => p.amount }], 'payments-' + today),
        exportOd: () => exportRows(overdue, [
          { label: 'Client', value: s => Biz.clientName(s.clientId) }, { label: 'Phone', value: s => (DB.get('clients', s.clientId) || {}).phone }, { label: 'Unit', value: s => Biz.unitLabel(s.unitId) },
          { label: 'Project', value: s => Biz.projectName(s.projectId) }, { label: 'Overdue', value: s => s._s.overdue }, { label: 'Days late', value: s => s._s.daysLate }, { label: 'Balance', value: s => s._s.balance }], 'overdue-' + today)
      },
      mount: () => { if (q.new && Auth.can('payments.record')) { history.replaceState(null, '', '#/payments'); Pay.record(); } }
    };
  });
})();
