const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const dataPath = path.join(__dirname, '..', 'data.json');

let html = fs.readFileSync(indexPath, 'utf8');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Build id -> status map
const statusMap = {};
for (const layer of data.layers) {
  for (const p of layer.projects) {
    statusMap[p.id] = p.status;
  }
}

// Count per layer from data.json
const layerCounts = {};
for (const layer of data.layers) {
  layerCounts[layer.id] = layer.projects.length;
}
console.log('Layer counts from data.json:', layerCounts);

// Add status classes to chips
// Chips look like: <a class="t" href="..." data-tip="..." data-id="slug">Name</a>
// class comes BEFORE data-id
let chipsFixed = 0;
html = html.replace(/<a class="([^"]+)"([^>]*?)data-id="([^"]+)"([^>]*?)>/g, (match, classes, mid, id, post) => {
  const status = statusMap[id];
  const classArr = classes.split(/\s+/).filter(Boolean);

  // Remove any existing status classes
  const cleaned = classArr.filter(c => !['early', 'acq', 'ann'].includes(c));

  if (status === 'early') cleaned.push('early');
  else if (status === 'acquired') cleaned.push('acq');
  else if (status === 'announced') cleaned.push('ann');

  if (cleaned.join(' ') !== classes) chipsFixed++;

  return `<a class="${cleaned.join(' ')}"${mid}data-id="${id}"${post}>`;
});

// Update row counts
// data.json layer IDs: L5=application, L4=governance, L3=protocol, L2=routing, L1=wallets, L0=settlement
const rowMap = {
  'application': 'L5',
  'governance': 'L4',
  'protocol': 'L3',
  'routing': 'L2',
  'wallets': 'L1',
  'settlement': 'L0'
};

let countsFixed = 0;
for (const [anchor, layerId] of Object.entries(rowMap)) {
  const actual = layerCounts[layerId];
  if (!actual) { console.log(`No count for ${layerId}`); continue; }

  const pattern = new RegExp(
    `(<div><div class="row-title"><a href="#${anchor}">[^<]+</a> <span class="row-count">)(\\d+)(</span>)`
  );
  html = html.replace(pattern, (m, pre, old, suf) => {
    if (old !== String(actual)) {
      console.log(`${anchor}: ${old} -> ${actual}`);
      countsFixed++;
    }
    return `${pre}${actual}${suf}`;
  });
}

fs.writeFileSync(indexPath, html);
console.log(`\nChips with status classes added/updated: ${chipsFixed}`);
console.log(`Row counts updated: ${countsFixed}`);
