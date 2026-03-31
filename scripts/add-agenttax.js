const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const agenttax = {
  "layer": "L4",
  "id": "agenttax",
  "name": "AgentTax",
  "status": "early",
  "description": "Sales tax and 1099 calculation API for autonomous agents. Covers 51 US jurisdictions with statute citations and confidence scores. x402-native: agents pay $0.001/calculation in USDC on Base — no account, no signup.",
  "launched": "2026",
  "tags": ["api-native", "b2b", "developer", "onchain"],
  "url": "https://www.agenttax.io",
  "chain": "Base",
  "added": "2026-03-30"
};

const l4 = data.layers.find(l => l.id === 'L4');

if (!l4.projects.find(p => p.id === 'agenttax')) {
  l4.projects.push(agenttax);
  console.log('Added AgentTax to L4');
} else {
  console.log('AgentTax already present');
}

const total = data.layers.reduce((s, l) => s + l.projects.length, 0);
data.version = "1.13";
data.updated = "2026-03-30";

data.rail.activity.unshift({
  "date": "2026-03-30",
  "type": "added",
  "text": "AgentTax added — x402-native tax compliance API for agent commerce"
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Done. Total: ${total}. Version: ${data.version}`);
