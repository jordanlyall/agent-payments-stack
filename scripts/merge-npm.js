const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const npm = [
  {"id": "elizaos", "npm": {"package": "@elizaos/core", "weekly_downloads": 9036}},
  {"id": "thirdweb", "npm": {"package": "thirdweb", "weekly_downloads": 34986}},
  {"id": "zerodev", "npm": {"package": "@zerodev/sdk", "weekly_downloads": 25720}},
  {"id": "biconomy", "npm": {"package": "@biconomy/abstractjs", "weekly_downloads": 6870}},
  {"id": "privy", "npm": {"package": "@privy-io/react-auth", "weekly_downloads": 128267}},
  {"id": "dynamic", "npm": {"package": "@dynamic-labs/sdk-react-core", "weekly_downloads": 34951}},
  {"id": "safe", "npm": {"package": "@safe-global/protocol-kit", "weekly_downloads": 49434}},
  {"id": "lit-protocol", "npm": {"package": "@lit-protocol/lit-node-client", "weekly_downloads": 5478}},
  {"id": "openfort", "npm": {"package": "@openfort/openfort-js", "weekly_downloads": 700}},
  {"id": "turnkey", "npm": {"package": "@turnkey/sdk-server", "weekly_downloads": 137506}},
  {"id": "alchemy", "npm": {"package": "alchemy-sdk", "weekly_downloads": 53754}},
  {"id": "li-fi", "npm": {"package": "@lifi/sdk", "weekly_downloads": 23713}},
  {"id": "across", "npm": {"package": "@across-protocol/app-sdk", "weekly_downloads": 2936}},
  {"id": "superfluid", "npm": {"package": "@superfluid-finance/sdk-core", "weekly_downloads": 4338}},
  {"id": "coinbase-agentic-wallets", "npm": {"package": "@coinbase/agentkit", "weekly_downloads": 3000}},
  {"id": "skyfire", "npm": {"package": "@skyfire-xyz/skyfire-sdk", "weekly_downloads": 106}},
  {"id": "crossmint-l1", "npm": {"package": "@crossmint/client-sdk-react-ui", "weekly_downloads": 5799}},
  {"id": "walletconnect", "npm": {"package": "@walletconnect/sign-client", "weekly_downloads": 853574}},
  {"id": "dfns", "npm": {"package": "@dfns/sdk", "weekly_downloads": 19326}}
];

const map = {};
npm.forEach(n => { map[n.id] = n.npm; });

let updated = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    if (map[p.id] && !p.npm) {
      p.npm = map[p.id];
      updated++;
    }
  }
}

data.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Added npm data to ${updated} projects`);

let hasNpm = 0, total = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    total++;
    if (p.npm) hasNpm++;
  }
}
console.log(`npm coverage: ${hasNpm}/${total}`);
