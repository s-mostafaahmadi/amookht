'use strict';

/* Stub bridge for the widget test: a signed-in account with three to-dos and one note. */

const { contextBridge } = require('electron');

const settings = { lang: 'fa', theme: 'dark', widgetAlwaysOnTop: false, autoRefreshSeconds: 60 };
const data = {
  date: '2026-11-18',
  todos: [
    { id: 'td1', title: 'تماس با استاد', done: false },
    { id: 'td2', title: 'تمرین گرامر ۲۰ دقیقه', done: false },
    { id: 'td3', title: 'خرید کتاب آلمانی', done: false },
  ],
  notes: [{ id: 'n1', title: 'Redemittel', preview: 'Meiner Meinung nach…' }],
  premium: true,
};
const ok = () => ({ ok: true, data: JSON.parse(JSON.stringify(data)), hasSession: true, email: 'smoke@test.local' });

contextBridge.exposeInMainWorld('amookht', {
  getSettings: async () => ({ settings, hasSession: true, email: 'smoke@test.local' }),
  load: async () => ok(),
  addTodo: async (title) => {
    data.todos.push({ id: 'td' + (data.todos.length + 1), title, done: false });
    return ok();
  },
  toggleTodo: async (id, done) => {
    const item = data.todos.find((todo) => todo.id === id);
    if (item) item.done = typeof done === 'boolean' ? done : !item.done;
    return ok();
  },
  deleteTodo: async (id) => {
    data.todos = data.todos.filter((todo) => todo.id !== id);
    return ok();
  },
  addNote: async (title) => {
    data.notes.push({ id: 'n' + (data.notes.length + 1), title, preview: '' });
    return ok();
  },
  setPinned: async (pinned) => ({ ...settings, widgetAlwaysOnTop: !!pinned }),
  logout: async () => ({ ok: true }),
  showApp: async () => ({ ok: true }),
  openSection: async () => ({ ok: true }),
  hide: async () => ({ ok: true }),
  onRefresh: () => () => {},
  onTick: () => () => {},
  onSettingsChanged: () => () => {},
  onSessionChanged: () => () => {},
});
