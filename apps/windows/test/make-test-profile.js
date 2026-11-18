'use strict';

/* Builds a signed-in app profile for the TEST account (never the owner):
     node test/make-test-profile.js <profile-dir>
   then run the app on it:  npx electron . --native --user-data-dir=<profile-dir>
   Tokens come from test/test-account.json (made on the server by test/server/mk_test_account.py;
   the account has a random password nobody knows, so it can only be used through these tokens). */

const fs = require('node:fs');
const path = require('node:path');

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node test/make-test-profile.js <profile-dir>');
  process.exit(2);
}
const account = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-account.json'), 'utf8'));
if (!/^windows-app-test@/.test(account.email)) throw new Error('test-account.json is not the test account');

const raw = (value) => 'raw:' + Buffer.from(value, 'utf8').toString('base64');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'state.json'), JSON.stringify({
  settings: { engine: 'native', widgetEnabled: false },
  session: {
    access: raw(account.access_token),
    refresh: raw(account.refresh_token),
    email: account.email,
    expiresAt: 0, // forces a refresh on start, so an old access token never matters
  },
  layoutVersion: 3,
}, null, 2));
console.log('test profile ready:', dir);
