const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// OpenMatter: ZK execution layer for commerce agents (L4 — Governance & Policy)
// Source: @theNFThinker Twitter Article (Mar 25, 2026)
const openMatter = {
  "layer": "L4",
  "id": "openmatter",
  "name": "OpenMatter",
  "status": "early",
  "description": "ZK execution layer for commerce agents. Wraps the Stripe MCP server with a RISC Zero zkVM firewall: blocks malformed tool calls, threshold decryption for API key management, PII redaction before logs. Stripe handles payments, OpenMatter handles trust.",
  "launched": "2026",
  "tags": ["zk", "open-source", "developer", "b2b"],
  "url": "https://openmatter.xyz",
  "x": "openmatterxyz"
};

// Kibble: Cross-chain agent wallet funding (L2 — Routing & Abstraction)
// Source: @0xJim (Mar 26, 2026, 28K views)
const kibble = {
  "layer": "L2",
  "id": "kibble",
  "name": "Kibble",
  "status": "early",
  "description": "Cross-chain agent wallet funding skill. Solves the cold-start problem: x402 needs Base, Tempo needs USDC, Lobster Cash needs Solana — Kibble bridges to any chain in one command via LI.FI. npm install kibble-pay.",
  "launched": "2026",
  "tags": ["open-source", "api-native", "developer", "onchain"],
  "url": "https://github.com/0xJim/kibble",
  "x": "0xJim",
  "github": { "url": "https://github.com/0xJim/kibble" },
  "npm": { "package": "kibble-pay" },
  "related": ["li-fi"]
};

const l4 = data.layers.find(l => l.id === 'L4');
const l2 = data.layers.find(l => l.id === 'L2');

// Only add if not already present
if (!l4.projects.find(p => p.id === 'openmatter')) {
  l4.projects.push(openMatter);
  console.log('Added OpenMatter to L4');
} else {
  console.log('OpenMatter already present');
}

if (!l2.projects.find(p => p.id === 'kibble')) {
  l2.projects.push(kibble);
  console.log('Added Kibble to L2');
} else {
  console.log('Kibble already present');
}

const total = data.layers.reduce((s, l) => s + l.projects.length, 0);
data.updated = new Date().toISOString().slice(0, 10);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log('Total projects:', total);
