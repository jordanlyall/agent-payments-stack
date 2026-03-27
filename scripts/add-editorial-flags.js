const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const flags = {
  'alchemy': 'alchemy-sdk deprecated Jan 2026 (archived). Users directed to @account-kit/core, Viem, or Solana Web3JS. Still 54K weekly npm downloads — significant legacy drag.',
  'walletconnect': 'Rebranded to Reown. @walletconnect packages now under reown-npm-org. web3wallet deprecated in favor of Reown WalletKit.',
  'biconomy': 'Mid-migration: biconomy-client-sdk (v4.5.7, deprecated) being replaced by @biconomy/abstractjs (v1.1.20, active). Newer package already has higher weekly downloads.'
};

let updated = 0;
for (const layer of data.layers) {
  for (const p of layer.projects) {
    if (flags[p.id] && !p.editorial) {
      p.editorial = flags[p.id];
      updated++;
    }
  }
}

data.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Added editorial flags to', updated, 'projects');
