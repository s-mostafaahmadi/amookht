'use strict';

/* Stub for the settings window tests. */

const { contextBridge } = require('electron');

const settings = {
  baseUrl: 'https://learn.tah3in.com',
  lang: 'fa',
  theme: 'dark',
  accent: 'violet',
  reduceMotion: false,
  uiScale: 1.1,
  widgetEnabled: true,
  widgetAlwaysOnTop: true,
  widgetCompact: false,
  startWithWindows: true,
  closeToTray: true,
  autoRefreshSeconds: 120,
};

contextBridge.exposeInMainWorld('amookht', {
  getSettings: async () => ({
    settings,
    hasSession: true,
    email: 'smoke@test.local',
    widgetVisible: true,
    version: '2.2.0-smoke',
    siteUrl: 'https://learn.tah3in.com/',
    dataFolder: 'C:\\Users\\smoke\\AppData\\Roaming\\Amookht',
  }),
  saveSettings: async (patch) => ({
    settings: { ...settings, ...patch },
    hasSession: true,
    email: 'smoke@test.local',
    version: '2.2.0-smoke',
    dataFolder: 'C:\\Users\\smoke\\AppData\\Roaming\\Amookht',
  }),
  logout: async () => ({ ok: true }),
  setWidgetEnabled: async () => settings,
  showWidget: async () => settings,
  hideWidget: async () => ({ ok: true }),
  showApp: async () => ({ ok: true }),
  openTool: async () => ({ ok: true }),
  openDataFolder: async () => ({ ok: true }),
  resetLayout: async () => ({ ok: true }),
  openPath: async () => ({ ok: true }),
  openSite: async () => ({ ok: true }),
  windowAction: async () => ({ ok: true }),
  onSettingsChanged: () => () => {},
  onSessionChanged: () => () => {},
});
