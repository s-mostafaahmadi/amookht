'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

const subscribe = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('amookht', {
  getSettings: () => invoke('settings:get'),
  saveSettings: (patch) => invoke('settings:save', patch),
  logout: () => invoke('auth:logout'),
  setWidgetEnabled: (enabled) => invoke('widget:set-enabled', enabled),
  showWidget: () => invoke('widget:show'),
  hideWidget: () => invoke('widget:hide'),
  showApp: () => invoke('app:show'),
  openTool: (payload) => invoke('app:open-tool', payload),
  openDataFolder: () => invoke('app:data-folder'),
  resetLayout: () => invoke('app:reset-layout'),
  openPath: (pathname) => invoke('app:open-path', pathname),
  openSite: (url) => invoke('app:open-site', url),
  windowAction: (action) => invoke('window:action', action),
  onSettingsChanged: (callback) => subscribe('settings:changed', callback),
  onSessionChanged: (callback) => subscribe('session:changed', callback),
});
