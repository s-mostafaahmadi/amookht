'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

const subscribe = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

// The widget never sees a token: every call goes through the main process,
// signed in with the same account as the Windows app.
contextBridge.exposeInMainWorld('amookht', {
  getSettings: () => invoke('settings:get'),
  load: () => invoke('widget:data'),
  addTodo: (title) => invoke('todo:add', title),
  toggleTodo: (id, done) => invoke('todo:toggle', { id, done }),
  deleteTodo: (id) => invoke('todo:delete', id),
  addNote: (title, content) => invoke('widget-note:add', { title, content }),
  setPinned: (pinned) => invoke('widget:pin', pinned),
  logout: () => invoke('auth:logout'),
  showApp: () => invoke('app:show'),
  openSection: (section) => invoke('app:open-section', section),
  hide: () => invoke('widget:hide'),
  onRefresh: (callback) => subscribe('amookht:refresh', () => callback()),
  onTick: (callback) => subscribe('amookht:tick', () => callback()),
  onSettingsChanged: (callback) => subscribe('settings:changed', callback),
  onSessionChanged: (callback) => subscribe('session:changed', callback),
});
