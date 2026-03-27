// Sync data.json into the inline aps-data block in projects.html
// Uses function replacement to avoid $ backreference corruption
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const htmlPath = path.join(__dirname, '..', 'projects.html');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const json = JSON.stringify(data);
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
  /(<script type="application\/json" id="aps-data">)[\s\S]*?(<\/script>)/,
  function(match, open, close) { return open + json + close; }
);

// Verify exactly one block and valid JSON
const blocks = [...html.matchAll(/<script type="application\/json" id="aps-data">/g)];
if (blocks.length !== 1) throw new Error('Expected 1 aps-data block, found ' + blocks.length + ' — aborting');
const check = html.match(/<script type="application\/json" id="aps-data">([\s\S]*?)<\/script>/);
JSON.parse(check[1]); // throws if invalid

fs.writeFileSync(htmlPath, html);
console.log('Synced data.json -> projects.html (' + data.layers.reduce((s,l)=>s+l.projects.length,0) + ' projects)');
