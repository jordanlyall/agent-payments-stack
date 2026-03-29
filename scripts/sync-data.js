// Sync data.json into the inline aps-data block in projects.html, index.html, data.html, rankings.html, and trace.html
// Also auto-updates TOTAL variable, layer counts, hero count, meta descriptions, and search placeholder in index.html
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

function syncIndexCounts(htmlPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');

  // TOTAL JS variable
  html = html.replace(/const TOTAL = \d+;/, 'const TOTAL = ' + total + ';');

  // Hero count strong tag
  html = html.replace(/<strong id="hero-count">\d+<\/strong>/, '<strong id="hero-count">' + total + '</strong>');

  // Meta descriptions (replace standalone numbers before " projects")
  html = html.replace(/(\d+) projects across 6 layers/g, total + ' projects across 6 layers');
  html = html.replace(/(\d+) projects mapped/g, total + ' projects mapped');

  // Layer count spans
  data.layers.forEach(function(layer) {
    var count = layer.projects.length;
    var re = new RegExp('(data-layer="' + layer.id + '"[\\s\\S]{1,600}?<span class="layer-count">)\\d+ projects(</span>)');
    html = html.replace(re, function(m, pre, post) { return pre + count + ' projects' + post; });
  });

  fs.writeFileSync(htmlPath, html);
  console.log('Updated counts in ' + path.basename(htmlPath) + ': total=' + total);
}

// Sync chips and embedded JSON in all files
syncFile(path.join(__dirname, '..', 'projects.html'));
syncFile(path.join(__dirname, '..', 'index.html'));
syncFile(path.join(__dirname, '..', 'data.html'));
syncFile(path.join(__dirname, '..', 'rankings.html'));
syncFile(path.join(__dirname, '..', 'trace.html'));
syncFile(path.join(__dirname, '..', 'graph.html'));

// Also sync the stack-data block in index.html (used by the filter + recently-added strip)
(function() {
  var indexPath = path.join(__dirname, '..', 'index.html');
  var html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(
    /(<script type="application\/json" id="stack-data">)[\s\S]*?(<\/script>)/,
    function(match, open, close) { return open + json + close; }
  );
  fs.writeFileSync(indexPath, html);
  console.log('Synced stack-data in index.html');
}());

// Sync rail-data block in index.html
(function() {
  var indexPath = path.join(__dirname, '..', 'index.html');
  var html = fs.readFileSync(indexPath, 'utf8');
  var railJson = JSON.stringify(data.rail || {});
  html = html.replace(
    /(<script type="application\/json" id="rail-data">)[\s\S]*?(<\/script>)/,
    function(match, open, close) { return open + railJson + close; }
  );
  fs.writeFileSync(indexPath, html);
  console.log('Synced rail-data in index.html');
}());

// Auto-update counts in index.html
syncIndexCounts(path.join(__dirname, '..', 'index.html'));
