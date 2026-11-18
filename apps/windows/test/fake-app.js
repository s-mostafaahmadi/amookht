'use strict';

/* Stub bridge for the shell renderer test (src/app.html): starts signed out,
   signs in with any password, and never attaches a real site. */

const { contextBridge } = require('electron');

const settings = {
  baseUrl: 'https://learn.tah3in.com',
  lang: 'fa',
  theme: 'dark',
  accent: 'indigo',
  reduceMotion: false,
  uiScale: 1,
  widgetEnabled: false,
  widgetAlwaysOnTop: true,
  startWithWindows: false,
  closeToTray: true,
  autoRefreshSeconds: 60,
};

let signedIn = false;
const listeners = {};
const on = (name) => (callback) => {
  (listeners[name] = listeners[name] || []).push(callback);
  return () => {};
};

contextBridge.exposeInMainWorld('amookht', {
  session: async () => ({
    hasSession: signedIn,
    email: signedIn ? 'smoke@test.local' : '',
    version: '3.0.0-smoke',
    lastSection: 'dashboard',
    settings,
    siteUrl: 'about:blank',
    sidebarCompact: false,
    siteZoom: 1,
  }),
  // No site in the smoke test: report "no session" so the shell does not try to attach a webview.
  prepareSite: async () => ({ ok: false, hasSession: false }),
  sitePrefs: async () => ({ ok: true }),
  layout: async (patch) => patch,
  login: async ({ email, password }) => {
    if (!email || !password) return { ok: false, error: { code: 'missing_credentials' } };
    signedIn = true;
    return { ok: true, email };
  },
  logout: async () => {
    signedIn = false;
    return { ok: true };
  },
  saveSettings: async () => ({ settings }),
  openSettings: async () => ({ ok: true }),
  openTool: async () => ({ ok: true }),
  openExternal: async () => ({ ok: true }),
  openDataFolder: async () => ({ ok: true }),
  setWidgetEnabled: async (enabled) => ({ ...settings, widgetEnabled: !!enabled }),
  showWidget: async () => ({ ok: true }),
  setLastSection: async () => ({ ok: true }),
  windowAction: async () => ({ ok: true }),
  onSettingsChanged: on('settings'),
  onSessionChanged: on('session'),
  onNavigate: on('navigate'),
  onCommand: on('command'),
  onSiteApply: on('apply'),
  onGate: on('gate'),
  onSystemTheme: on('theme'),
});
