// Store sync test (no network): `node test/store-test.mjs`
// Runs src/native/core/store.js against an in-memory server that follows the
// backend's rules (sync_core.apply_patch: a path is rejected when it, an ancestor
// or a descendant changed after the client's base_version) and a fake WebSocket.

let exitCode = 0;
const report = (ok, label, extra) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + label + (extra === undefined ? '' : ' :: ' + JSON.stringify(extra)));
  if (!ok) exitCode = 1;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---- browser globals the store touches ---- */
globalThis.window = new EventTarget();
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });

/* ---- in-memory server ---- */
const server = {
  version: 5,
  pathVersions: {},
  offset: 0, // server clock = local clock + offset
  state: {
    user: { name: 'Test', reducedMotion: false },
    darkMode: true,
    uiLanguage: 'fa',
    favorites: [{ id: 'f1' }],
    appSettings: { accent: 'violet', fontScale: 100, freeStudy: { endAt: 0, mode: 'focus' } },
  },
  requests: [],
  sockets: new Set(),
};
const DEEP = new Set(['appSettings', 'appSettings.freeStudy']);
const related = (a, b) => a === b || a.startsWith(b + '.') || b.startsWith(a + '.');
const pathVersion = (path) => Object.entries(server.pathVersions).reduce((best, [p, v]) => (related(path, p) ? Math.max(best, v) : best), 0);
const validPath = (path) => {
  const parts = path.split('.');
  for (let i = 1; i < parts.length; i += 1) if (!DEEP.has(parts.slice(0, i).join('.'))) return false;
  return true;
};
const getPath = (doc, path) => path.split('.').reduce((node, key) => (node && typeof node === 'object' && key in node ? node[key] : undefined), doc);
const setPath = (doc, path, value) => {
  const parts = path.split('.');
  let node = doc;
  parts.slice(0, -1).forEach((key) => {
    if (!node[key] || typeof node[key] !== 'object') node[key] = {};
    node = node[key];
  });
  if (value === undefined) delete node[parts[parts.length - 1]];
  else node[parts[parts.length - 1]] = value;
};
const now = () => Date.now() + server.offset;

function serverPatch(body, clientId) {
  const stale = body.base_version < server.version;
  const applied = [];
  const rejected = [];
  const ops = [...Object.entries(body.set || {}), ...(body.unset || []).map((p) => [p, undefined])];
  for (const [path, value] of ops) {
    if (!validPath(path)) continue;
    if (stale && pathVersion(path) > body.base_version) {
      rejected.push(path);
      continue;
    }
    setPath(server.state, path, value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
    applied.push(path);
  }
  if (applied.length) {
    server.version += 1;
    applied.forEach((p) => {
      server.pathVersions[p] = server.version;
    });
    broadcast({ type: 'patch', version: server.version, set: Object.fromEntries(applied.filter((p) => getPath(server.state, p) !== undefined).map((p) => [p, getPath(server.state, p)])), unset: applied.filter((p) => getPath(server.state, p) === undefined), client_id: clientId, server_time: now() });
  }
  return {
    saved: applied.length > 0, version: server.version, applied,
    rejected: rejected.map((p) => ({ path: p, exists: getPath(server.state, p) !== undefined, value: getPath(server.state, p) ?? null })),
    invalid: [], normalized: {}, server_time: now(),
  };
}

/** Another device changes paths directly on the server. */
function remoteChange(set, { skipBroadcast = false } = {}) {
  server.version += 1;
  Object.entries(set).forEach(([p, v]) => {
    setPath(server.state, p, v);
    server.pathVersions[p] = server.version;
  });
  if (!skipBroadcast) broadcast({ type: 'patch', version: server.version, set, unset: [], client_id: 'other', server_time: now() });
}

function broadcast(message) {
  server.sockets.forEach((ws) => ws.deliver(message));
}

/* ---- fake WebSocket ---- */
class FakeWS {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    server.sockets.add(this);
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 5);
  }
  send(raw) {
    const m = JSON.parse(raw);
    if (m.type === 'auth') setTimeout(() => this.deliver({ type: 'hello', version: server.version, server_time: now() }), 5);
    if (m.type === 'ping') setTimeout(() => this.deliver({ type: 'pong', t: m.t, server_time: now() }), 2);
  }
  deliver(message) {
    if (this.readyState === 1 && this.onmessage) setTimeout(() => this.onmessage({ data: JSON.stringify(message) }), 3);
  }
  close() {
    this.readyState = 3;
    server.sockets.delete(this);
    if (this.onclose) this.onclose({ code: 1000 });
  }
}
globalThis.WebSocket = FakeWS;

/* ---- fake bridge ---- */
let offline = false;
const bridge = {
  async api(path, { method = 'GET', body } = {}) {
    await wait(4);
    server.requests.push({ path, method, body });
    if (offline) return { ok: false, error: { code: 'network_error', status: 0, message: 'offline' } };
    if (path === '/v1/account/state' && method === 'GET') {
      return { ok: true, data: { state_data: JSON.parse(JSON.stringify(server.state)), version: server.version, server_time: now() } };
    }
    if (path === '/v1/account/state' && method === 'PATCH') return { ok: true, data: serverPatch(body, body.client_id) };
    return { ok: false, error: { code: 'not_found', status: 404 } };
  },
  async syncToken() {
    return { token: 'tok', wsUrl: 'wss://test/v1/sync/ws' };
  },
};

const { createStore } = await import('../src/native/core/store.js');
const changes = [];
const store = createStore(bridge);
store.subscribe((paths, source) => changes.push({ paths, source }));

/* 1. load */
await store.start();
await wait(60);
report(store.ready && store.get('appSettings.accent') === 'violet', 'loads the account state', store.status);
report(store.status.ws === true, 'live socket says hello');

/* 2. a local change sends only that path */
server.requests.length = 0;
store.set('appSettings.accent', 'blue');
await wait(400);
const patch = server.requests.find((r) => r.method === 'PATCH');
report(!!patch && JSON.stringify(Object.keys(patch.body.set)) === '["appSettings.accent"]' && patch.body.unset.length === 0, 'PATCH carries only the changed path', patch && patch.body.set);
report(server.state.appSettings.accent === 'blue' && server.state.appSettings.fontScale === 100, 'server stored it, siblings untouched', server.state.appSettings);
report(store.status.status === 'synced', 'status back to synced', store.status.status);

/* 3. remote change on a clean path is applied live */
remoteChange({ darkMode: false });
await wait(80);
report(store.get('darkMode') === false, 'remote patch applied live');
report(changes.some((c) => c.source === 'remote' && c.paths.includes('darkMode')), 'listeners hear the remote change');

/* 4. conflict: another device changed the same path first → server wins */
remoteChange({ 'appSettings.fontScale': 110 }, { skipBroadcast: true }); // our socket missed it
store.set('appSettings.fontScale', 90);
await wait(400);
report(store.get('appSettings.fontScale') === 110 && server.state.appSettings.fontScale === 110, 'rejected path takes the server value', { local: store.get('appSettings.fontScale'), server: server.state.appSettings.fontScale });

/* 5. an unsent local edit is not overwritten by a remote patch, then wins */
// Step 4 hid one server change from the socket (a version gap); let the next
// patch close that gap first so this step tests a clean socket.
remoteChange({ points: 1 });
await wait(150);
store.set('uiLanguage', 'en', { delay: 300 });
remoteChange({ uiLanguage: 'de' });
await wait(60);
report(store.get('uiLanguage') === 'en', 'unsent local edit survives a remote patch', store.get('uiLanguage'));
await wait(600);
// Site rule (amookht-sync.js): an unsent local edit is pushed next and wins.
report(server.state.uiLanguage === 'en', 'the unsent local edit is pushed and wins, like on the site', server.state.uiLanguage);
report(store.get('uiLanguage') === 'en', 'app and server agree', store.get('uiLanguage'));

/* 6. gap in socket versions → full resync */
const resyncsBefore = store.stats.resync;
remoteChange({ favorites: [{ id: 'f1' }, { id: 'f2' }] }, { skipBroadcast: true });
remoteChange({ points: 7 });
await wait(150);
report(store.stats.resync === resyncsBefore + 1, 'version gap triggers a resync', store.stats.resync - resyncsBefore);
report(store.get('favorites').length === 2 && store.get('points') === 7, 'resync brings the missed change', { favorites: store.get('favorites').length, points: store.get('points') });

/* 7. top-level object update keeps the other fields */
store.update('user', (u) => ({ ...u, reducedMotion: true }));
await wait(400);
report(server.state.user.reducedMotion === true && server.state.user.name === 'Test', 'user object updated without losing fields', server.state.user);

/* 8. timer timestamps travel in server time */
server.offset = 60000; // server clock one minute ahead
store.stop();
await store.start();
await wait(80);
const localEnd = Date.now() + 25 * 60000;
store.set('appSettings.freeStudy.endAt', localEnd);
await wait(400);
const sent = server.state.appSettings.freeStudy.endAt;
report(Math.abs(sent - (localEnd + 60000)) < 1500, 'focus-timer end is sent in server time', { diffMs: sent - localEnd });
report(server.state.appSettings.freeStudy.mode === 'focus', 'other timer fields untouched');

/* 9. offline: the change waits and is sent when the server is back */
offline = true;
store.set('appSettings.density', 'compact');
await wait(400);
report(store.status.status === 'local', 'offline change is kept locally', store.status.status);
offline = false;
await wait(5600);
report(server.state.appSettings.density === 'compact', 'sent after the connection comes back', server.state.appSettings.density);

store.stop();
process.exit(exitCode);
