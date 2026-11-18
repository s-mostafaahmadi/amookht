// Lesson packs: the main process keeps a local copy of the site's content scripts
// (revalidated with ETag) and serves them as amookht://content/<file>. They are
// loaded as classic scripts, exactly like on the site, and read from their globals.

const PACKS = {
  testdaf: { file: 'testdaf-method-content.js', read: () => window.TDM_CONTENT },
  oesd: { file: 'oesd-method-content.js', read: () => window.OSD_CONTENT },
  grammar: { file: 'grammar-drill-bank.js', read: () => window.GD_BANK },
  games: { file: 'free-games-bank.js', read: () => window.FG_BANK },
  // A script-level const on the site, not a window property: read it by name.
  // eslint-disable-next-line no-undef
  simulation: { file: 'testdaf-simulation-data.js', read: () => (typeof AMOOKHT_TESTDAF_SIM_DATA !== 'undefined' ? AMOOKHT_TESTDAF_SIM_DATA : undefined) },
};

const loaded = new Map();

function addScript(url) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = url;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error('content script failed: ' + url));
    document.head.appendChild(tag);
  });
}

/** Load one pack ('testdaf' | 'oesd' | 'grammar' | 'games' | 'simulation'). */
export function loadPack(bridge, name) {
  const pack = PACKS[name];
  if (!pack) return Promise.reject(new Error('unknown pack ' + name));
  if (loaded.has(name)) return loaded.get(name);
  const job = (async () => {
    const existing = pack.read();
    if (existing) return existing;
    const result = await bridge.ensureContent(pack.file);
    if (!result || !result.ok) throw new Error((result && result.error) || 'content unavailable');
    await addScript(result.url);
    const value = pack.read();
    if (!value) throw new Error('content pack is empty: ' + name);
    return value;
  })();
  loaded.set(name, job);
  job.catch(() => loaded.delete(name));
  return job;
}

export const PACK_NAMES = Object.keys(PACKS);
