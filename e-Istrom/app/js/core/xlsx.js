/* e-Istrom — read Excel (.xlsx) and CSV files without any outside library.
   Returns { headers: [...], rows: [{header: value}] } for the first sheet. */
(function () {

  async function inflate(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(buf) {
    const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
      if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('This doesn’t look like an Excel file.');
    const count = v.getUint16(eocd + 10, true);
    let p = v.getUint32(eocd + 16, true);
    const files = {};
    const dec = new TextDecoder();
    for (let i = 0; i < count; i++) {
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const method = v.getUint16(p + 10, true);
      const csize = v.getUint32(p + 20, true);
      const nlen = v.getUint16(p + 28, true), elen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
      const local = v.getUint32(p + 42, true);
      const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
      files[name] = { method, csize, local };
      p += 46 + nlen + elen + clen;
    }
    return {
      names: Object.keys(files),
      async read(name) {
        const f = files[name];
        if (!f) return null;
        const ln = v.getUint16(f.local + 26, true), le = v.getUint16(f.local + 28, true);
        const start = f.local + 30 + ln + le;
        const data = buf.subarray(start, start + f.csize);
        const out = f.method === 0 ? data : await inflate(data);
        return dec.decode(out);
      }
    };
  }

  function xml(text) { return new DOMParser().parseFromString(text, 'application/xml'); }
  function tags(node, name) { return Array.from(node.getElementsByTagNameNS('*', name)); }

  function colIndex(ref) {
    const letters = String(ref).replace(/[^A-Z]/gi, '').toUpperCase();
    let n = 0;
    for (const c of letters) n = n * 26 + (c.charCodeAt(0) - 64);
    return n - 1;
  }

  async function readXlsx(file) {
    const zip = await unzip(new Uint8Array(await file.arrayBuffer()));
    // Shared strings
    let shared = [];
    const ss = await zip.read('xl/sharedStrings.xml');
    if (ss) shared = tags(xml(ss), 'si').map(si => tags(si, 't').map(t => t.textContent).join(''));
    // Which file is the first sheet?
    let sheetPath = 'xl/worksheets/sheet1.xml';
    try {
      const wb = xml(await zip.read('xl/workbook.xml'));
      const first = tags(wb, 'sheet')[0];
      const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
      const rels = xml(await zip.read('xl/_rels/workbook.xml.rels'));
      const rel = tags(rels, 'Relationship').find(r => r.getAttribute('Id') === rid);
      if (rel) {
        let t = rel.getAttribute('Target').replace(/^\//, '');
        sheetPath = t.startsWith('xl/') ? t : 'xl/' + t;
      }
    } catch (e) { /* use default */ }
    const sheetText = await zip.read(sheetPath) || await zip.read(zip.names.find(n => /^xl\/worksheets\/.*\.xml$/.test(n)));
    if (!sheetText) throw new Error('No worksheet found in this file.');
    const grid = [];
    tags(xml(sheetText), 'row').forEach(row => {
      const r = [];
      tags(row, 'c').forEach((c, i) => {
        const ref = c.getAttribute('r');
        const idx = ref ? colIndex(ref) : i;
        const t = c.getAttribute('t');
        const vEl = tags(c, 'v')[0];
        let val = vEl ? vEl.textContent : '';
        if (t === 's') val = shared[Number(val)] ?? '';
        else if (t === 'inlineStr') val = tags(c, 't').map(x => x.textContent).join('');
        else if (t === 'b') val = val === '1' ? 'TRUE' : 'FALSE';
        else if (t !== 'str' && val !== '' && !isNaN(val)) val = Number(val);
        r[idx] = val;
      });
      grid.push(r);
    });
    return toRows(grid);
  }

  function readCsv(text) {
    const grid = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); grid.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell || row.length) { row.push(cell); grid.push(row); }
    return toRows(grid.map(r => r.map(c => (c !== '' && !isNaN(c.replace(/,/g, '')) && /^[\d,.\-]+$/.test(c)) ? Number(c.replace(/,/g, '')) : c)));
  }

  function toRows(grid) {
    grid = grid.filter(r => r && r.some(c => c !== '' && c !== undefined && c !== null));
    if (!grid.length) return { headers: [], rows: [] };
    // Header row = first row with at least two text cells
    let h = grid.findIndex(r => r.filter(c => typeof c === 'string' && c.trim()).length >= 2);
    if (h < 0) h = 0;
    const headers = Array.from(grid[h], c => String(c ?? '').trim());
    const rows = grid.slice(h + 1).map(r => {
      const o = {};
      headers.forEach((k, i) => { if (k) o[k] = r[i] === undefined ? '' : r[i]; });
      return o;
    });
    return { headers: headers.filter(Boolean), rows };
  }

  const Sheet = {
    async read(file) {
      const name = file.name.toLowerCase();
      if (name.endsWith('.csv') || name.endsWith('.txt')) return readCsv(await file.text());
      if (name.endsWith('.xls')) throw new Error('This is an older Excel file (.xls). In Excel, choose File → Save As → Excel Workbook (.xlsx), then try again.');
      return readXlsx(file);
    },

    // Excel stores dates as day numbers; turn anything date-like into YYYY-MM-DD
    toDate(v) {
      if (v === '' || v == null) return '';
      if (typeof v === 'number') {
        const d = new Date(Math.round((v - 25569) * 86400000));
        return U.iso(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      }
      const s = String(v).trim();
      let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); // dd/mm/yyyy (Nigeria)
      if (m) { let y = Number(m[3]); if (y < 100) y += 2000; return U.iso(new Date(y, Number(m[2]) - 1, Number(m[1]))); }
      const d = new Date(s);
      return isNaN(d) ? '' : U.iso(d);
    },

    toNumber(v) {
      if (typeof v === 'number') return v;
      const n = Number(String(v || '').replace(/[^\d.\-]/g, ''));
      return isNaN(n) ? 0 : n;
    }
  };

  window.Sheet = Sheet;
})();
