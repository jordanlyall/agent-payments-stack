const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const extra = [
  {"id": "elizaos", "github_extra": {"forks": 5500, "contributors": 530}},
  {"id": "olas", "github_extra": {"forks": 85, "contributors": 16}},
  {"id": "x402", "github_extra": {"forks": 1100, "contributors": 193}},
  {"id": "superfluid", "github_extra": {"forks": 263, "contributors": 50}},
  {"id": "interledger", "github_extra": {"forks": 106, "contributors": 44}},
  {"id": "circle-cctp", "github_extra": {"forks": 124, "contributors": 15}},
  {"id": "across", "github_extra": {"forks": 79, "contributors": 23}},
  {"id": "li-fi", "github_extra": {"forks": 99, "contributors": 6}},
  {"id": "debridge", "github_extra": {"forks": 39, "contributors": 10}},
  {"id": "wormhole", "github_extra": {"forks": 839, "contributors": 77}},
  {"id": "layerzero", "github_extra": {"forks": 475, "contributors": 20}},
  {"id": "uniswap", "github_extra": {"forks": 1300, "contributors": 77}},
  {"id": "cow-protocol", "github_extra": {"forks": 53, "contributors": 20}},
  {"id": "lit-protocol", "github_extra": {"forks": 89, "contributors": 40}},
  {"id": "safe", "github_extra": {"forks": 1100, "contributors": 30}},
  {"id": "zerodev", "github_extra": {"forks": 44, "contributors": 15}},
  {"id": "biconomy", "github_extra": {"forks": 84, "contributors": 20}},
  {"id": "faremeter", "github_extra": {"forks": 18, "contributors": 5}}
];

const map = {};
extra.forEach(e => { map[e.id] = e.github_extra; });

let updated = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    if (map[p.id]) {
      if (!p.github) p.github = {};
      if (!p.github.forks) { p.github.forks = map[p.id].forks; updated++; }
      if (!p.github.contributors) p.github.contributors = map[p.id].contributors;
    }
  }
}

data.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Updated github forks/contributors on ${updated} projects`);

// Coverage
let hasForks = 0, total = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    total++;
    if (p.github && p.github.forks) hasForks++;
  }
}
console.log(`Fork coverage: ${hasForks}/${total}`);
