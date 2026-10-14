/* e-Istrom — small shared helpers */
(function () {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const U = {
    MONTHS, MONTHS_LONG,

    esc(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    uid() {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },

    // ₦12,500,000
    money(n) {
      const v = Math.round(Number(n) || 0);
      return (v < 0 ? '−₦' : '₦') + Math.abs(v).toLocaleString('en-US');
    },

    // ₦1.25bn, ₦350m, ₦25k
    moneyShort(n) {
      const v = Number(n) || 0, a = Math.abs(v), s = v < 0 ? '−₦' : '₦';
      if (a >= 1e9) return s + trim(a / 1e9, 2) + 'bn';
      if (a >= 1e6) return s + trim(a / 1e6, 1) + 'm';
      if (a >= 1e3) return s + trim(a / 1e3, 0) + 'k';
      return s + Math.round(a);
      function trim(x, d) { return Number(x.toFixed(d)).toString(); }
    },

    num(n) { return (Number(n) || 0).toLocaleString('en-US'); },

    pct(part, whole) { return whole ? Math.round((part / whole) * 100) : 0; },

    pad(n, w = 4) { return String(n).padStart(w, '0'); },

    // Local date as YYYY-MM-DD
    iso(d) {
      d = d instanceof Date ? d : new Date(d);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },

    today() { return U.iso(new Date()); },

    parse(s) {
      if (!s) return null;
      if (s instanceof Date) return s;
      if (typeof s === 'number') return new Date(s);
      const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    },

    // 13 Oct 2026
    date(s) {
      const d = U.parse(s);
      if (!d || isNaN(d)) return '—';
      return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    },

    // 13 October 2026
    dateLong(s) {
      const d = U.parse(s);
      if (!d || isNaN(d)) return '—';
      return d.getDate() + ' ' + MONTHS_LONG[d.getMonth()] + ' ' + d.getFullYear();
    },

    time(ts) {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    },

    dateTime(ts) { return U.date(ts) + ', ' + U.time(ts); },

    ago(ts) {
      const s = (Date.now() - ts) / 1000;
      if (s < 60) return 'just now';
      if (s < 3600) return Math.floor(s / 60) + ' min ago';
      if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
      const d = Math.floor(s / 86400);
      if (d === 1) return 'yesterday';
      if (d < 30) return d + ' days ago';
      return U.date(ts);
    },

    addMonths(s, n) {
      const d = U.parse(s);
      const day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + n);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, last));
      return U.iso(d);
    },

    addDays(s, n) {
      const d = U.parse(s);
      d.setDate(d.getDate() + n);
      return U.iso(d);
    },

    daysBetween(a, b) {
      return Math.round((U.parse(b) - U.parse(a)) / 86400000);
    },

    // Working days between two dates inclusive (Mon–Fri)
    workDays(a, b) {
      let d = U.parse(a), end = U.parse(b), n = 0;
      if (!d || !end || end < d) return 0;
      while (d <= end) { const w = d.getDay(); if (w !== 0 && w !== 6) n++; d.setDate(d.getDate() + 1); }
      return n;
    },

    monthKey(s) { return String(U.iso(U.parse(s) || new Date())).slice(0, 7); },

    monthLabel(key, long) {
      const [y, m] = key.split('-').map(Number);
      return (long ? MONTHS_LONG : MONTHS)[m - 1] + ' ' + y;
    },

    lastMonths(n) {
      const out = [], d = new Date();
      d.setDate(1);
      for (let i = n - 1; i >= 0; i--) {
        const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
        out.push(U.iso(x).slice(0, 7));
      }
      return out;
    },

    sum(arr, fn) { return arr.reduce((t, x) => t + (Number(fn ? fn(x) : x) || 0), 0); },

    groupBy(arr, fn) {
      const m = {};
      arr.forEach(x => { const k = fn(x); (m[k] = m[k] || []).push(x); });
      return m;
    },

    sortBy(arr, fn, desc) {
      return arr.slice().sort((a, b) => {
        const x = fn(a), y = fn(b);
        const r = x < y ? -1 : x > y ? 1 : 0;
        return desc ? -r : r;
      });
    },

    initials(name) {
      return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    },

    // Nigerian numbers -> international (2348031234567) for WhatsApp links
    phoneIntl(p) {
      let d = String(p || '').replace(/\D/g, '');
      if (d.startsWith('0')) d = '234' + d.slice(1);
      if (d.length === 10) d = '234' + d;
      return d;
    },

    cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); },

    plural(n, word, many) { return U.num(n) + ' ' + (n === 1 ? word : (many || word + 's')); },

    debounce(fn, ms) {
      let t;
      return function () { clearTimeout(t); const a = arguments; t = setTimeout(() => fn.apply(this, a), ms); };
    },

    // Number to words (Naira), for letters and receipts
    words(n) {
      n = Math.round(Number(n) || 0);
      if (n === 0) return 'Zero Naira Only';
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const chunk = x => {
        let s = '';
        if (x >= 100) { s += ones[Math.floor(x / 100)] + ' Hundred'; x %= 100; if (x) s += ' and '; }
        if (x >= 20) { s += tens[Math.floor(x / 10)]; if (x % 10) s += '-' + ones[x % 10]; }
        else if (x > 0) s += ones[x];
        return s;
      };
      const scales = [[1e12, 'Trillion'], [1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']];
      let out = [];
      for (const [v, name] of scales) {
        if (n >= v) { out.push(chunk(Math.floor(n / v)) + ' ' + name); n %= v; }
      }
      if (n) out.push((out.length && n < 100 ? 'and ' : '') + chunk(n));
      return out.join(', ').replace(', and', ' and') + ' Naira Only';
    },

    // Deterministic random (for sample data)
    rng(seed) {
      let s = seed >>> 0;
      return function () {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    download(filename, content, type) {
      const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    },

    // Rows -> CSV that opens cleanly in Excel
    csv(rows, columns) {
      const cell = v => {
        v = v == null ? '' : String(v);
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      };
      const head = columns.map(c => cell(c.label)).join(',');
      const body = rows.map(r => columns.map(c => cell(c.value(r))).join(',')).join('\r\n');
      return '﻿' + head + '\r\n' + body;
    },

    // Resize an image file to a compact JPEG data URL
    compressImage(file, max = 1400, quality = 0.8) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = url;
      });
    }
  };

  window.U = U;
})();
