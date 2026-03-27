const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const dataPath = path.join(__dirname, '..', 'data.json');

let html = fs.readFileSync(indexPath, 'utf8');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Build id -> url map
const urlMap = {};
for (const layer of data.layers) {
  for (const p of layer.projects) {
    if (p.url) urlMap[p.id] = p.url;
  }
}

let updated = 0;
// Add or update data-url on chips that have a url, skip if already present
html = html.replace(/<a class="([^"]+)"([^>]*?)data-id="([^"]+)"([^>]*?)>/g, (match, classes, mid, id, post) => {
  const url = urlMap[id];
  if (!url) return match;
  // Remove existing data-url if present
  const cleaned = (mid + post).replace(/\s*data-url="[^"]*"/g, '');
  updated++;
  return `<a class="${classes}"${mid}data-id="${id}" data-url="${url}">`;
});

fs.writeFileSync(indexPath, html);
console.log(`Added data-url to ${updated} chips`);
