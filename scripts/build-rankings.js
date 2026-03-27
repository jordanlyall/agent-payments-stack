const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const indexPath = path.join(__dirname, '..', 'index.html');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Scoring: normalize different signals to a comparable scale
// npm downloads: × 1 (baseline)
// github stars:  × 10  (1 star ≈ 10 downloads in reach)
// github forks:  × 20
// volume.value:  raw (transactions — only used for L0)
function score(p) {
  if (p.npm && p.npm.weekly_downloads) return { score: p.npm.weekly_downloads, signal: 'npm', raw: p.npm.weekly_downloads };
  if (p.github && p.github.stars)      return { score: p.github.stars * 10, signal: 'stars', raw: p.github.stars };
  if (p.github && p.github.forks)      return { score: p.github.forks * 20, signal: 'forks', raw: p.github.forks };
  if (p.volume && p.volume.value)       return { score: p.volume.value, signal: 'volume', raw: p.volume.value };
  return null;
}

function fmt(signal, raw) {
  if (signal === 'npm') {
    if (raw >= 1000000) return (raw / 1000000).toFixed(1) + 'M /wk';
    if (raw >= 1000)    return (raw / 1000).toFixed(raw >= 100000 ? 0 : 1) + 'K /wk';
    return raw + ' /wk';
  }
  if (signal === 'stars') {
    if (raw >= 1000) return (raw / 1000).toFixed(1) + 'K \u2605';
    return raw + ' \u2605';
  }
  if (signal === 'forks') {
    return raw.toLocaleString() + ' forks';
  }
  if (signal === 'volume') {
    if (raw >= 1000000000) return (raw / 1000000000).toFixed(1) + 'B txns/30d';
    if (raw >= 1000000)    return (raw / 1000000).toFixed(0) + 'M txns/30d';
    return raw.toLocaleString() + ' txns/30d';
  }
  return String(raw);
}

function signalLabel(projects) {
  // Find dominant signal in top 4
  const counts = {};
  for (const p of projects) {
    const s = score(p);
    if (s) counts[s.signal] = (counts[s.signal] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  const labels = { npm: 'npm downloads', stars: 'GitHub stars', forks: 'GitHub forks', volume: 'on-chain volume' };
  return labels[top[0]] || top[0];
}

const LAYER_ORDER = ['L1', 'L2', 'L3', 'L4', 'L5', 'L0'];
const LAYER_SHORT = {
  'L0': 'Settlement',
  'L1': 'Wallet & Keys',
  'L2': 'Routing',
  'L3': 'Protocol',
  'L4': 'Governance',
  'L5': 'Application',
};

let html = '<!-- RANKINGS-START -->\n';
html += '<div class="rankings">\n';
html += '  <div class="rankings-header"><span class="rankings-title">Stack Rankings</span><span class="rankings-sub">by developer adoption signal</span></div>\n';
html += '  <div class="rankings-grid">\n';

for (const layerId of LAYER_ORDER) {
  const layer = data.layers.find(l => l.id === layerId);
  if (!layer) continue;

  const ranked = layer.projects
    .map(p => ({ p, s: score(p) }))
    .filter(x => x.s)
    .sort((a, b) => b.s.score - a.s.score)
    .slice(0, 4);

  const label = signalLabel(layer.projects);
  const remaining = layer.projects.length - ranked.length;

  html += `  <div class="rank-table">\n`;
  html += `    <div class="rank-layer-head">\n`;
  html += `      <span class="rank-layer-id">${layerId}</span>`;
  html += `<span class="rank-layer-name">${LAYER_SHORT[layerId]}</span>`;
  if (label) html += `<span class="rank-signal-label">${label}</span>`;
  html += `\n    </div>\n`;

  if (ranked.length === 0) {
    html += `    <div class="rank-no-data">No public metrics yet</div>\n`;
  } else {
    html += `    <div class="rank-rows">\n`;
    ranked.forEach(({ p, s }, i) => {
      const acqClass = p.status === 'acquired' ? ' rank-acq' : '';
      const earlyClass = p.status === 'early' ? ' rank-early' : '';
      html += `      <a class="rank-row${acqClass}${earlyClass}" href="/${p.id}">\n`;
      html += `        <span class="rank-num">${i + 1}</span>\n`;
      html += `        <span class="rank-name">${p.name}</span>\n`;
      html += `        <span class="rank-val">${fmt(s.signal, s.raw)}</span>\n`;
      html += `      </a>\n`;
    });
    html += `    </div>\n`;
    if (remaining > 0) {
      html += `    <div class="rank-more">${remaining} more in this layer</div>\n`;
    }
  }

  html += `  </div>\n`;
}

html += '  </div>\n'; // rankings-grid
html += '</div>\n'; // rankings
html += '<!-- RANKINGS-END -->';

// CSS to inject
const css = `
  /* Stack Rankings */
  .rankings { margin: 36px 0 0; padding: 28px 0 0; border-top: 1px solid var(--faint); }
  .rankings-header { display: flex; align-items: baseline; gap: 14px; margin-bottom: 20px; }
  .rankings-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .rankings-sub { font-size: 11px; color: var(--faint); font-family: 'JetBrains Mono', monospace; }
  .rankings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--faint); border: 1px solid var(--faint); border-radius: 6px; overflow: hidden; }
  .rank-table { background: var(--bg); padding: 16px; }
  .rank-layer-head { display: flex; align-items: baseline; gap: 7px; margin-bottom: 12px; }
  .rank-layer-id { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 600; color: var(--muted); }
  .rank-layer-name { font-size: 12px; font-weight: 600; color: var(--text); }
  .rank-signal-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--faint); margin-left: auto; }
  .rank-rows { display: flex; flex-direction: column; gap: 1px; }
  .rank-row { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 4px; text-decoration: none; transition: background 0.1s; }
  .rank-row:hover { background: rgba(255,255,255,0.04); }
  .rank-num { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--faint); width: 12px; flex-shrink: 0; text-align: right; }
  .rank-name { font-size: 12.5px; font-weight: 450; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .rank-val { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--secondary); flex-shrink: 0; }
  .rank-row.rank-acq .rank-name { color: var(--acq); }
  .rank-row.rank-early .rank-name { color: var(--early); }
  .rank-no-data { font-size: 11.5px; color: var(--faint); padding: 8px 0; font-style: italic; }
  .rank-more { font-size: 10.5px; color: var(--faint); margin-top: 8px; font-family: 'JetBrains Mono', monospace; }
  @media (max-width: 720px) { .rankings-grid { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 480px) { .rankings-grid { grid-template-columns: 1fr; } }
`;

let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Remove existing rankings block if present
indexHtml = indexHtml.replace(/<!-- RANKINGS-START -->[\s\S]*?<!-- RANKINGS-END -->\n?/g, '');

// Remove existing rankings CSS if present
indexHtml = indexHtml.replace(/\n  \/\* Stack Rankings \*\/[\s\S]*?@media \(max-width: 480px\) \{ \.rankings-grid \{ grid-template-columns: 1fr; \} \}\n/g, '');

// Inject CSS before closing </style>
indexHtml = indexHtml.replace('</style>', css + '\n</style>');

// Inject HTML just before .bottom
indexHtml = indexHtml.replace('  <div class="bottom">', html + '\n  <div class="bottom">');

fs.writeFileSync(indexPath, indexHtml);
console.log('Rankings section injected.');
console.log('Layers with data:', LAYER_ORDER.filter(id => {
  const l = data.layers.find(l => l.id === id);
  return l && l.projects.some(p => score(p));
}).join(', '));
