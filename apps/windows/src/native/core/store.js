// Account state store for the native app — the same document and the same
// sync protocol as the website (amookht-sync.js), so the site, the app and every
// other device stay in step:
//
//   read   GET   /v1/account/state         → { state_data, version, server_time }
//   write  PATCH /v1/account/state         { base_version, set, unset, client_id }
//   live   WS    /v1/sync/ws               auth → hello / patch / resync / pong
//
// "Paths" are the top-level keys plus the children of `appSettings` and
// `appSettings.freeStudy`. Only changed paths are sent. A path the server says
// changed after our base version is rejected and the server value wins. Remote
// patches never overwrite a local edit that has not been sent yet.

const DEEP = { appSettings: 1, 'appSettings.freeStudy': 1 };
const FS = 'appSettings.freeStudy';
const TIME_KEYS = { endAt: 1, startedAt: 1, pauseStartedAt: 1 };
const MISSING = Symbol('missing');
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const J = (value) => (value === undefined || value === MISSING ? undefined : JSON.stringify(value));
const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

export function flatten(obj, prefix = '', out = {}) {
  if (!obj || typeof obj !== 'object') return out;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined) continue;
    const path = prefix + key;
    if (DEEP[path] && value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path + '.', out);
    else out[path] = value;
  }
  return out;
}

export function getPath(doc, path) {
  let node = doc;
  for (const part of path.split('.')) {
    if (!node || typeof node !== 'object' || !has(node, part)) return MISSING;
    node = node[part];
  }
  return node;
}

function setPath(doc, path, value) {
  const parts = path.split('.');
  let node = doc;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!node[parts[i]] || typeof node[parts[i]] !== 'object' || Array.isArray(node[parts[i]])) node[parts[i]] = {};
    node = node[parts[i]];
  }
  const last = parts[parts.length - 1];
  if (value === MISSING || value === undefined) delete node[last];
  else node[last] = value;
}

export function createStore(bridge, { onStatus } = {}) {
  const CID = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const X = {
    data: {}, base: null, version: 0, wsVersion: 0, pathVer: {}, ready: false,
    ws: null, wsOpen: false, retry: 0, reconnectTimer: null, pingTimer: null, lastMsgAt: 0,
    offset: 0, samples: [], pushing: null, again: false, pushTimer: null, retryTimer: null,
    resyncing: null, resyncVersion: 0, queue: [], status: 'idle', active: false,
    stats: { sent: 0, recv: 0, resync: 0, rejected: 0 },
  };
  const listeners = new Set();

  const setStatus = (status) => {
    if (X.status === status) return;
    X.status = status;
    if (onStatus) onStatus(snapshotStatus());
  };
  const snapshotStatus = () => ({ status: X.status, ws: X.wsOpen, version: X.version, ready: X.ready });
  const notify = (paths, source) => {
    if (!paths.length) return;
    listeners.forEach((fn) => {
      try {
        fn(paths, source);
      } catch (error) {
        console.warn('store listener', error);
      }
    });
  };

  /* clock offset: serverTime ≈ localTime + offset (for timer timestamps) */
  function sampleOffset(sentAt, serverTime) {
    const now = Date.now();
    if (!sentAt || !serverTime) return;
    const rtt = now - sentAt;
    if (rtt < 0 || rtt > 20000) return;
    X.samples.push({ rtt, off: serverTime - (sentAt + now) / 2, at: now });
    X.samples = X.samples.filter((s) => now - s.at < 600000).slice(-12);
    const best = X.samples.reduce((a, b) => (b.rtt < a.rtt ? b : a));
    X.offset = Math.round(best.off);
  }
  const convTimes = (fs, dir) => {
    if (!fs || typeof fs !== 'object' || Array.isArray(fs)) return fs;
    const out = {};
    for (const key of Object.keys(fs)) {
      const value = fs[key];
      out[key] = TIME_KEYS[key] && typeof value === 'number' && value > 0 ? Math.round(value + dir * X.offset) : value;
    }
    return out;
  };
  function conv(path, value, dir) {
    if (value === MISSING || value === undefined) return value;
    if (path.startsWith(FS + '.')) {
      const key = path.slice(FS.length + 1);
      return TIME_KEYS[key] && typeof value === 'number' && value > 0 ? Math.round(value + dir * X.offset) : value;
    }
    if (path === FS) return convTimes(value, dir);
    if (path === 'appSettings' && value && typeof value === 'object' && value.freeStudy) {
      return { ...value, freeStudy: convTimes(value.freeStudy, dir) };
    }
    return value;
  }

  const localFlat = () => flatten(X.data);
  const applyPath = (path, value) => setPath(X.data, path, value === MISSING ? MISSING : clone(value));
  const setBase = (path, value) => {
    const j = J(value);
    if (j === undefined) X.base.delete(path);
    else X.base.set(path, j);
  };

  async function api(path, options) {
    const result = await bridge.api(path, options);
    if (!result || !result.ok) {
      const error = new Error((result && result.error && result.error.message) || 'request failed');
      error.code = result && result.error && result.error.code;
      error.status = result && result.error && result.error.status;
      throw error;
    }
    return result.data;
  }

  /* ---------- remote patches ---------- */
  function onRemotePatch(message) {
    if (X.pushing || X.resyncing || !X.ready) {
      X.queue.push(message);
      return;
    }
    X.stats.recv += 1;
    if (message.version > X.version) X.version = message.version;
    if (message.client_id === CID) return;
    const cur = localFlat();
    const touched = [];
    const one = (path, raw) => {
      if ((X.pathVer[path] || 0) > message.version) return;
      const lj = J(cur[path]);
      if (lj !== X.base.get(path)) return; // unsent local edit: it is pushed next and wins
      const lv = raw === MISSING ? MISSING : conv(path, raw, -1);
      applyPath(path, lv);
      setBase(path, lv);
      X.pathVer[path] = message.version;
      if (J(lv) !== lj) touched.push(path);
    };
    const set = message.set || {};
    Object.keys(set).forEach((path) => one(path, set[path]));
    (message.unset || []).forEach((path) => one(path, MISSING));
    notify(touched, 'remote');
  }

  function drainQueue() {
    if (X.pushing || X.resyncing || !X.ready) return;
    const queued = X.queue;
    X.queue = [];
    queued.forEach((m) => {
      if (m.version > X.resyncVersion || m.client_id === CID) onRemotePatch(m);
    });
  }

  /* ---------- full resync (first load, reconnect after a gap) ---------- */
  function resync() {
    if (X.resyncing) return X.resyncing;
    const first = !X.base;
    X.resyncing = (async () => {
      try {
        if (X.pushing) {
          try {
            await X.pushing;
          } catch {
            /* push errors are retried separately */
          }
        }
        const t0 = Date.now();
        const r = await api('/v1/account/state', { method: 'GET' });
        sampleOffset(t0, r.server_time);
        X.stats.resync += 1;
        const remote = flatten(r.state_data || {});
        const cur = localFlat();
        const base = X.base || new Map();
        const touched = [];
        const newBase = new Map();
        const keys = new Set([...Object.keys(remote), ...Object.keys(cur), ...base.keys()]);
        keys.forEach((path) => {
          const hasRemote = has(remote, path);
          const rv = hasRemote ? conv(path, remote[path], -1) : MISSING;
          const rj = hasRemote ? J(rv) : undefined;
          const lj = J(cur[path]);
          const bj = base.get(path);
          let take;
          if (first) take = true; // the server is the source of truth on start
          else {
            const localDirty = lj !== bj;
            const remoteChanged = rj !== bj;
            take = remoteChanged && (!localDirty || lj !== rj); // both changed: server wins
          }
          if (take && lj !== rj) {
            applyPath(path, rv);
            touched.push(path);
          }
          if (rj !== undefined) newBase.set(path, rj);
        });
        X.base = newBase;
        X.pathVer = {};
        X.version = Math.max(Number(r.version) || 0, 0);
        X.resyncVersion = X.version;
        X.ready = true;
        setStatus('synced');
        notify(first ? ['*'] : touched, first ? 'load' : 'resync');
      } finally {
        X.resyncing = null;
      }
    })();
    X.resyncing.then(
      () => {
        drainQueue();
        schedulePush(0);
      },
      (error) => {
        console.warn('state resync failed', error);
        setStatus('offline');
        setTimeout(() => {
          if (X.active && !X.ready) resync().catch(() => {});
        }, 5000);
      },
    );
    return X.resyncing;
  }

  /* ---------- pushing local changes ---------- */
  function schedulePush(ms) {
    clearTimeout(X.pushTimer);
    X.pushTimer = setTimeout(() => push(), ms || 0);
  }

  function push() {
    if (!X.ready || !X.active) return Promise.resolve(false);
    if (X.pushing || X.resyncing) {
      X.again = true;
      return X.pushing || X.resyncing;
    }
    X.pushing = (async () => {
      let ok = true;
      await null;
      try {
        do {
          X.again = false;
          const cur = localFlat();
          const set = {};
          const snap = {};
          const unset = [];
          let n = 0;
          for (const path of Object.keys(cur)) {
            const j = J(cur[path]);
            if (j === undefined) continue;
            snap[path] = j;
            if (X.base.get(path) !== j) {
              set[path] = conv(path, cur[path], 1);
              n += 1;
            }
          }
          X.base.forEach((_, key) => {
            if (!has(snap, key)) unset.push(key);
          });
          if (!n && !unset.length) break;
          setStatus('saving');
          const r = await api('/v1/account/state', {
            method: 'PATCH',
            body: { schema_version: 1, base_version: X.version, set, unset, client_id: CID },
          });
          X.stats.sent += 1;
          if (r.saved && r.version > X.version) X.version = r.version;
          (r.applied || []).forEach((path) => {
            if (has(snap, path)) X.base.set(path, snap[path]);
            else X.base.delete(path);
            X.pathVer[path] = r.version;
          });
          const touched = [];
          Object.keys(r.normalized || {}).forEach((path) => {
            const lv = conv(path, r.normalized[path], -1);
            applyPath(path, lv);
            setBase(path, lv);
            touched.push(path);
          });
          (r.rejected || []).forEach((x) => {
            X.stats.rejected += 1;
            const lv = x.exists ? conv(x.path, x.value, -1) : MISSING;
            applyPath(x.path, lv);
            setBase(x.path, lv);
            X.pathVer[x.path] = r.version;
            touched.push(x.path);
          });
          if ((r.rejected || []).length && r.version > X.version) X.version = r.version;
          notify(touched, 'server');
          setStatus('synced');
        } while (X.again);
      } catch (error) {
        ok = false;
        console.warn('state push failed', error);
        setStatus(error && error.status === 403 ? 'rejected' : 'local');
        if (error && error.status === 403) {
          // Premium-only data: the server refuses it — take the server copy back.
          resync().catch(() => {});
        } else {
          clearTimeout(X.retryTimer);
          X.retryTimer = setTimeout(() => push(), 5000);
        }
      } finally {
        X.pushing = null;
        drainQueue();
      }
      return ok;
    })();
    return X.pushing;
  }

  /* ---------- WebSocket ---------- */
  const stopPing = () => {
    clearInterval(X.pingTimer);
    X.pingTimer = null;
  };
  const ping = () => {
    const ws = X.ws;
    if (!ws || ws.readyState !== 1) return;
    try {
      ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
    } catch {
      /* closing */
    }
  };
  const startPing = () => {
    stopPing();
    X.pingTimer = setInterval(() => {
      if (Date.now() - X.lastMsgAt > 65000) {
        try {
          if (X.ws) X.ws.close();
        } catch {
          /* already closed */
        }
        return;
      }
      ping();
    }, 25000);
  };
  const scheduleReconnect = () => {
    clearTimeout(X.reconnectTimer);
    if (!X.active) return;
    const delay = Math.min(30000, 1000 * 2 ** X.retry) + Math.random() * 500;
    X.retry += 1;
    X.reconnectTimer = setTimeout(connect, delay);
  };

  async function connect() {
    clearTimeout(X.reconnectTimer);
    if (!X.active || X.ws) return;
    const info = await bridge.syncToken().catch(() => null);
    if (!info || !info.token) {
      scheduleReconnect();
      return;
    }
    let ws;
    try {
      ws = new WebSocket(info.wsUrl);
    } catch {
      scheduleReconnect();
      return;
    }
    X.ws = ws;
    let authAt = 0;
    ws.onopen = () => {
      authAt = Date.now();
      ws.send(JSON.stringify({ type: 'auth', token: info.token, client_id: CID }));
    };
    ws.onmessage = (event) => {
      if (X.ws !== ws) return;
      X.lastMsgAt = Date.now();
      let m;
      try {
        m = JSON.parse(event.data);
      } catch {
        return;
      }
      if (m.type === 'hello') {
        X.retry = 0;
        X.wsOpen = true;
        sampleOffset(authAt, m.server_time);
        X.wsVersion = m.version;
        startPing();
        setTimeout(ping, 1500);
        if (onStatus) onStatus(snapshotStatus());
        if (!X.ready || m.version !== X.version) resync().catch(() => {});
        else schedulePush(0);
        return;
      }
      if (m.type === 'pong') {
        sampleOffset(m.t, m.server_time);
        return;
      }
      if (m.type === 'patch') {
        const gap = X.wsVersion && m.version > X.wsVersion + 1;
        X.wsVersion = Math.max(X.wsVersion, m.version);
        if (gap) {
          resync().catch(() => {});
          return;
        }
        onRemotePatch(m);
        return;
      }
      if (m.type === 'resync' || m.type === 'resync_required') {
        if (m.version) X.wsVersion = Math.max(X.wsVersion, m.version);
        if (m.client_id !== CID || m.type === 'resync_required') resync().catch(() => {});
      }
    };
    ws.onclose = () => {
      if (X.ws !== ws) return;
      X.ws = null;
      X.wsOpen = false;
      stopPing();
      if (onStatus) onStatus(snapshotStatus());
      scheduleReconnect();
    };
    ws.onerror = () => {};
  }

  function teardown() {
    X.active = false;
    clearTimeout(X.reconnectTimer);
    clearTimeout(X.pushTimer);
    clearTimeout(X.retryTimer);
    stopPing();
    const ws = X.ws;
    X.ws = null;
    X.wsOpen = false;
    try {
      if (ws) ws.close();
    } catch {
      /* already closed */
    }
    X.ready = false;
    X.base = null;
    X.data = {};
    X.version = 0;
    X.wsVersion = 0;
    X.pathVer = {};
    X.queue = [];
    X.retry = 0;
    X.samples = [];
    X.offset = 0;
    setStatus('idle');
  }

  window.addEventListener('online', () => {
    if (!X.active) return;
    if (!X.ws) {
      X.retry = 0;
      connect();
    }
    schedulePush(0);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !X.active) return;
    if (!X.ws) {
      X.retry = 0;
      connect();
    }
  });
  window.addEventListener('beforeunload', () => {
    if (X.ready) push();
  });

  return {
    /** Start for the signed-in account: load the state, then go live. */
    async start() {
      teardown();
      X.active = true;
      await resync();
      connect();
    },
    stop: teardown,
    get ready() {
      return X.ready;
    },
    get data() {
      return X.data;
    },
    get status() {
      return snapshotStatus();
    },
    get stats() {
      return { ...X.stats, offset: X.offset, clientId: CID };
    },
    /** Value at a path ("user", "appSettings.accent", …); undefined when missing. */
    get(path) {
      const value = getPath(X.data, path);
      return value === MISSING ? undefined : value;
    },
    /** Change one path locally and save it (debounced like the site's saveData). */
    set(path, value, { delay = 250 } = {}) {
      const before = J(getPath(X.data, path));
      applyPath(path, value === undefined ? MISSING : value);
      if (J(getPath(X.data, path)) === before) return;
      notify([path], 'local');
      setStatus('saving');
      schedulePush(delay);
    },
    /** Update a top-level object (e.g. "user") with a function of a copy. */
    update(path, fn, options) {
      const copy = clone(this.get(path)) || {};
      const next = fn(copy) || copy;
      this.set(path, next, options);
    },
    flush: () => push(),
    resync: () => resync(),
    serverNow: () => Date.now() + X.offset,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
