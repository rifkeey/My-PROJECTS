/* e-Istrom — data store.
   Everything lives in memory for speed and is written through to the
   browser's IndexedDB on this computer. Photos live in a separate store. */
(function () {
  const DB_NAME = 'e-istrom';
  const COLLECTIONS = [
    'staff', 'projects', 'units', 'updates', 'leads', 'clients', 'sales', 'payments',
    'documents', 'expenses', 'payroll', 'vendors', 'purchases', 'approvals', 'leave',
    'memos', 'visitors', 'inspections', 'complaints', 'bills', 'vehicles', 'vehicleLogs',
    'items', 'movements', 'activity'
  ];

  let idb = null;
  const dirty = new Set();
  let flushTimer = null;

  function req(r) {
    return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }

  function open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('No IndexedDB'));
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  const DB = {
    COLLECTIONS,
    data: {},
    meta: {},
    persistent: true,

    async init() {
      COLLECTIONS.forEach(c => (DB.data[c] = []));
      try {
        idb = await open();
        const tx = idb.transaction('kv', 'readonly');
        const store = tx.objectStore('kv');
        const keys = await req(store.getAllKeys());
        for (const k of keys) {
          const v = await req(store.get(k));
          if (k === 'meta') DB.meta = v || {};
          else DB.data[k] = v || [];
        }
      } catch (e) {
        console.warn('Storage unavailable, running in memory only', e);
        DB.persistent = false;
      }
      return DB.isEmpty();
    },

    isEmpty() { return !DB.meta.initialised; },

    all(c) { return DB.data[c] || (DB.data[c] = []); },
    get(c, id) { return id ? DB.all(c).find(x => x.id === id) : null; },
    find(c, fn) { return DB.all(c).find(fn); },
    filter(c, fn) { return DB.all(c).filter(fn); },

    insert(c, obj, opts) {
      const rec = Object.assign({ id: U.uid(), createdAt: Date.now(), createdBy: (window.Auth && Auth.user && Auth.user.id) || null }, obj);
      DB.all(c).push(rec);
      if (!opts || !opts.silent) DB.save(c);
      return rec;
    },

    update(c, id, patch) {
      const rec = DB.get(c, id);
      if (!rec) return null;
      Object.assign(rec, patch, { updatedAt: Date.now() });
      DB.save(c);
      return rec;
    },

    remove(c, id) {
      const arr = DB.all(c);
      const i = arr.findIndex(x => x.id === id);
      if (i >= 0) arr.splice(i, 1);
      DB.save(c);
    },

    setting(key, fallback) {
      const s = DB.meta.settings || {};
      return s[key] === undefined ? fallback : s[key];
    },

    setSettings(patch) {
      DB.meta.settings = Object.assign({}, DB.meta.settings, patch);
      DB.save('meta');
    },

    // Running document numbers, e.g. IST/RCT/2026/0001
    nextNumber(series) {
      const year = new Date().getFullYear();
      const key = series + '-' + year;
      DB.meta.counters = DB.meta.counters || {};
      DB.meta.counters[key] = (DB.meta.counters[key] || 0) + 1;
      DB.save('meta');
      return 'IST/' + series + '/' + year + '/' + U.pad(DB.meta.counters[key]);
    },

    log(text, ref) {
      const u = window.Auth && Auth.user;
      DB.insert('activity', { text, ref: ref || null, who: u ? u.name : 'System' });
      const a = DB.all('activity');
      if (a.length > 3000) a.splice(0, a.length - 3000);
    },

    save(c) {
      dirty.add(c);
      if (!flushTimer) flushTimer = setTimeout(DB.flush, 30);
    },

    async flush() {
      flushTimer = null;
      if (!idb) return;
      const names = Array.from(dirty);
      dirty.clear();
      try {
        const tx = idb.transaction('kv', 'readwrite');
        const store = tx.objectStore('kv');
        names.forEach(n => store.put(n === 'meta' ? DB.meta : DB.data[n], n));
        await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      } catch (e) {
        console.error('Save failed', e);
        if (window.UI) UI.toast('Could not save changes on this computer. Please make a backup.', 'red');
      }
    },

    saveAll() {
      COLLECTIONS.forEach(c => dirty.add(c));
      dirty.add('meta');
      return DB.flush();
    },

    /* Photos */
    async putFile(dataUrl) {
      const id = 'f_' + U.uid();
      DB._fileCache[id] = dataUrl;
      if (idb) {
        const tx = idb.transaction('files', 'readwrite');
        tx.objectStore('files').put(dataUrl, id);
      }
      return id;
    },

    _fileCache: {},

    async getFile(id) {
      if (DB._fileCache[id]) return DB._fileCache[id];
      if (!idb) return null;
      const v = await req(idb.transaction('files', 'readonly').objectStore('files').get(id));
      if (v) DB._fileCache[id] = v;
      return v;
    },

    async allFiles() {
      if (!idb) return Object.assign({}, DB._fileCache);
      const store = idb.transaction('files', 'readonly').objectStore('files');
      const keys = await req(store.getAllKeys());
      const out = {};
      for (const k of keys) out[k] = await req(store.get(k));
      return out;
    },

    /* Backup & restore */
    async exportAll() {
      return {
        app: 'e-Istrom',
        version: 1,
        exportedAt: new Date().toISOString(),
        meta: DB.meta,
        data: DB.data,
        files: await DB.allFiles()
      };
    },

    async importAll(obj) {
      if (!obj || obj.app !== 'e-Istrom' || !obj.data) throw new Error('This file is not an e-Istrom backup.');
      await DB.wipe();
      DB.meta = obj.meta || {};
      COLLECTIONS.forEach(c => (DB.data[c] = obj.data[c] || []));
      if (idb && obj.files) {
        const tx = idb.transaction('files', 'readwrite');
        Object.entries(obj.files).forEach(([k, v]) => tx.objectStore('files').put(v, k));
        await new Promise(r => (tx.oncomplete = r));
      }
      Object.assign(DB._fileCache, obj.files || {});
      await DB.saveAll();
    },

    async wipe() {
      COLLECTIONS.forEach(c => (DB.data[c] = []));
      DB.meta = {};
      DB._fileCache = {};
      if (idb) {
        const tx = idb.transaction(['kv', 'files'], 'readwrite');
        tx.objectStore('kv').clear();
        tx.objectStore('files').clear();
        await new Promise(r => (tx.oncomplete = r));
      }
    }
  };

  window.addEventListener('beforeunload', () => { if (dirty.size) DB.flush(); });
  window.DB = DB;
})();
