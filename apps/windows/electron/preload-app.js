'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

const subscribe = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('amookht', {
  updateState: () => invoke('update:state'),
  updateCheck: () => invoke('update:check'),
  updateInstall: () => invoke('update:install'),
  onUpdate: (callback) => subscribe('update:state', callback),
  session: () => invoke('app:session'),
  prepareSite: () => invoke('shell:prepare'),
  sitePrefs: (prefs) => invoke('shell:site-prefs', prefs),
  layout: (patch) => invoke('shell:layout', patch),
  // v4 native engine
  api: (path, options) => invoke('api:request', { path, ...(options || {}) }),
  syncToken: () => invoke('sync:token'),
  ensureContent: (name) => invoke('content:ensure', name),
  setEngine: (engine) => invoke('app:engine', engine),
  libraryFile: (id) => invoke('library:file', id),
  speakingUpload: (payload) => invoke('speaking:upload', payload),
  libraryUpload: (payload) => invoke('library:upload', payload),
  libraryEvents: (on) => invoke('library:events', !!on),
  onLibraryEvent: (callback) => subscribe('library:event', callback),
  login: (payload) => invoke('auth:signin', payload),
  logout: () => invoke('auth:logout'),
  saveSettings: (patch) => invoke('settings:save', patch),
  openSettings: () => invoke('settings:open'),
  openTool: (path, title) => invoke('app:open-tool', { path, title }),
  openExternal: (url) => invoke('app:open-external', url),
  openDataFolder: () => invoke('app:data-folder'),
  setWidgetEnabled: (enabled) => invoke('widget:set-enabled', enabled),
  showWidget: () => invoke('widget:show'),
  packOpenFile: () => invoke('pack:open-file'),
  packSaveFile: (payload) => invoke('pack:save-file', payload),
  setLastSection: (section) => invoke('app:set-last-section', section),
  windowAction: (action) => invoke('window:action', action),
  onSettingsChanged: (callback) => subscribe('settings:changed', callback),
  onSessionChanged: (callback) => subscribe('session:changed', callback),
  onNavigate: (callback) => subscribe('app:navigate', callback),
  onCommand: (callback) => subscribe('shell:command', callback),
  onSiteApply: (callback) => subscribe('site:apply', callback),
  onGate: (callback) => subscribe('site:gate', callback),
  onSystemTheme: (callback) => subscribe('theme:system', callback),
});
