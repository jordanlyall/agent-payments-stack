// Sync data.json into the inline aps-data block in projects.html, index.html, data.html, rankings.html, and trace.html
// Uses function replacement to avoid $ backreference corruption
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const json = JSON.stringify(data);
const total = data.layers.reduce((s,l)=>s+l.projects.length,0);

function syncFile(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(
    /(<script type="application\/json" id="aps-data">)[\s\S]*?(<\/script>)/,
    function(match, open, close) { return open + json + close; }
  );
  const blocks = [...html.matchAll(/<script type="application\/json" id="aps-data">/g)];
  if (blocks.length !== 1) throw new Error('Expected 1 aps-data block in ' + htmlPath + ', found ' + blocks.length + ' — aborting');
  const check = html.match(/<script type="application\/json" id="aps-data">([\s\S]*?)<\/script>/);
  JSON.parse(check[1]); // throws if invalid
  fs.writeFileSync(htmlPath, html);
  console.log('Synced data.json -> ' + path.basename(htmlPath) + ' (' + total + ' projects)');
}

syncFile(path.join(__dirname, '..', 'projects.html'));
syncFile(path.join(__dirname, '..', 'index.html'));
syncFile(path.join(__dirname, '..', 'data.html'));
syncFile(path.join(__dirname, '..', 'rankings.html'));
syncFile(path.join(__dirname, '..', 'trace.html'));
