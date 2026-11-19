// Count feature markers inside the built app.asar (run after `npm run dist`).
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'dist', 'win-unpacked', 'resources', 'app.asar');
const text = fs.readFileSync(file).toString('utf8');
const needles = ['pack:open-file', 'pack:save-file', 'packOpenFile', 'importFromFile', 'amookht-pack', 'owner-packs', 'renderOwnerPacks'];
for (const needle of needles) {
  let count = 0;
  let at = text.indexOf(needle);
  while (at !== -1) { count += 1; at = text.indexOf(needle, at + needle.length); }
  console.log(needle, '=', count);
}
console.log('asar bytes =', fs.statSync(file).size);
