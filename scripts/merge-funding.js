const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const funding = [
  {"id": "fireblocks", "funding": "$1B+ total"},
  {"id": "safe", "funding": "$100M strategic"},
  {"id": "alchemy", "funding": "$564M total"},
  {"id": "thirdweb", "funding": "$29M total"},
  {"id": "dfns", "funding": "$29.5M total"},
  {"id": "turnkey", "funding": "$50M+ total"},
  {"id": "lit-protocol", "funding": "$17.5M total"},
  {"id": "zerodev", "funding": "$1M pre-seed"},
  {"id": "biconomy", "funding": "$10.5M equity"},
  {"id": "openfort", "funding": "$3M seed"},
  {"id": "privy", "funding": "$41M total"},
  {"id": "dynamic", "funding": "$21M total"},
  {"id": "world-agentkit", "funding": "$250M total"},
  {"id": "phantom", "funding": "$277M total"},
  {"id": "crossmint-l1", "funding": "$23.6M total"},
  {"id": "crossmint-l2", "funding": "$23.6M total"},
  {"id": "crossmint-l4", "funding": "$23.6M total"},
  {"id": "moonpay", "funding": "$555M Series A"},
  {"id": "bvnk", "funding": "$93M total"},
  {"id": "brex", "funding": "$1.2B total"},
  {"id": "bridge", "funding": "$58M pre-acquisition"},
  {"id": "skyfire", "funding": "$9.5M seed"},
  {"id": "skyfire-kya", "funding": "$9.5M seed"},
  {"id": "wormhole", "funding": "$225M"},
  {"id": "layerzero", "funding": "$263M total"},
  {"id": "uniswap", "funding": "$176M total"},
  {"id": "across", "funding": "$51M total"},
  {"id": "li-fi", "funding": "$51.7M total"},
  {"id": "socket", "funding": "$10M total"},
  {"id": "debridge", "funding": "$5.5M seed"},
  {"id": "cow-protocol", "funding": "$23M token round"},
  {"id": "circle-nanopayments", "funding": "$1.1B pre-IPO"},
  {"id": "circle-cctp", "funding": "$1.1B pre-IPO"},
  {"id": "superfluid", "funding": "$14.1M total"},
  {"id": "virtuals-protocol", "funding": "$16M seed/ICO"},
  {"id": "olas", "funding": "$14.35M total"},
  {"id": "botto", "funding": "$1.67M seed"},
  {"id": "akash", "funding": "$2.8M total"},
  {"id": "ocean-protocol", "funding": "$39M total"},
  {"id": "tempo-mpp", "funding": "$500M Series A"},
  {"id": "atxp", "funding": "$19.2M seed"},
  {"id": "mesh", "funding": "$200M+ total"},
  {"id": "unifold", "funding": "$500K seed"},
  {"id": "ramp-agent-cards", "funding": "$2.3B total"}
];

const map = {};
funding.forEach(f => { map[f.id] = f.funding; });

let updated = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    if (map[p.id] && !p.funding) {
      p.funding = map[p.id];
      updated++;
    }
  }
}

data.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Added funding to ${updated} projects`);

// Coverage
let hasFunding = 0, total = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    total++;
    if (p.funding) hasFunding++;
  }
}
console.log(`Funding coverage: ${hasFunding}/${total}`);
