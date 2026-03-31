const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// u402: Private agent payments — x402 extension with ZK + post-quantum (L3 — Payment Protocol)
// Source: Tally form submission, Thomas Wiesner <thomas@upd.io> (2026-03-30)
const u402 = {
  "layer": "L3",
  "id": "u402",
  "name": "u402",
  "status": "announced",
  "description": "Compliance-ready, post-quantum-ready private payment protocol for AI agents. Extends x402 with zero-knowledge proofs — the only privacy layer on the x402 stack.",
  "launched": "2026",
  "tags": ["zk", "http", "onchain", "developer"],
  "url": "https://permissionless-technologies.com/docs/u402",
  "added": "2026-03-30"
};

// Revettr: x402-native counterparty risk scoring (L4 — Governance & Policy)
// Source: Tally form submission, Alexander Lawson <fintechpractitioner@gmail.com> (2026-03-30)
const revettr = {
  "layer": "L4",
  "id": "revettr",
  "name": "Revettr",
  "status": "live",
  "description": "x402-native counterparty risk scoring for AI agents. Evaluates wallet history, domain intel, IP reputation, sanctions, and cross-chain trust signals before payment authorization. REST API + MCP server + Python SDK. Multi-chain: Base, Solana, XRPL, Bitcoin.",
  "launched": "2026",
  "tags": ["api-native", "onchain", "developer", "b2b"],
  "url": "https://revettr.com",
  "chain": "Base",
  "added": "2026-03-30"
};

const l3 = data.layers.find(l => l.id === 'L3');
const l4 = data.layers.find(l => l.id === 'L4');

if (!l3.projects.find(p => p.id === 'u402')) {
  l3.projects.push(u402);
  console.log('Added u402 to L3');
} else {
  console.log('u402 already present');
}

if (!l4.projects.find(p => p.id === 'revettr')) {
  l4.projects.push(revettr);
  console.log('Added Revettr to L4');
} else {
  console.log('Revettr already present');
}

const total = data.layers.reduce((s, l) => s + l.projects.length, 0);
data.version = "1.14";
data.updated = "2026-03-30";

data.rail.activity.unshift({
  "date": "2026-03-30",
  "type": "added",
  "text": "u402 and Revettr added via submit form — ZK privacy on x402, counterparty risk scoring"
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Done. Total: ${total}. Version: ${data.version}`);
