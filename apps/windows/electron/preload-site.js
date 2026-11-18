'use strict';

/* Preload for the embedded Amookht site (<webview> in the shell).

   1. Before any site script runs, put the app's signed-in tokens into the
      site's own localStorage key, so the site opens already signed in.
   2. Relay messages that the injected shell helper posts from the page
      (state snapshots, logout) to the shell with sendToHost.
   3. Report when the site rotates its tokens, so the app keeps the newest pair.

   Only the Amookht origin gets tokens: the main process checks the frame origin. */

const { ipcRenderer } = require('electron');

const TOKEN_KEY = 'amookht_tokens';

let boot = null;
try {
  boot = ipcRenderer.sendSync('site:boot');
} catch {
  boot = null;
}

if (boot && boot.tokens && location.origin === boot.origin) {
  // The site resumes a signed-in session on load only when it finds its session
  // email (tdf_session) and the "same tab" flag next to the tokens
  // (bootstrapAmookht → loginAs(session, true)).
  try {
    if (boot.email) localStorage.setItem('tdf_session', boot.email);
    sessionStorage.setItem('amookht_active_tab', '1');
  } catch {
    /* storage blocked */
  }
  try {
    const current = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (!current || current.access_token !== boot.tokens.access_token) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(boot.tokens));
    }
  } catch {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(boot.tokens));
    } catch {
      /* storage blocked — the site will show its sign-in, the shell handles it */
    }
  }
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.__amkShell !== 1 || typeof data.kind !== 'string') return;
  if (!/^[a-z-]{1,24}$/.test(data.kind)) return;
  ipcRenderer.sendToHost('site:' + data.kind, data.payload === undefined ? null : data.payload);
});

if (boot && location.origin === boot.origin) {
  let last = null;
  try {
    last = localStorage.getItem(TOKEN_KEY);
  } catch {
    last = null;
  }
  setInterval(() => {
    let now = null;
    try {
      now = localStorage.getItem(TOKEN_KEY);
    } catch {
      return;
    }
    if (now === last) return;
    last = now;
    ipcRenderer.send('site:tokens', now);
  }, 1500);
}
