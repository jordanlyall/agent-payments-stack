const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Bankr x Synthesis Hackathon winners (Mar 26, 2026)
// Source: https://x.com/bankrbot/status/2037300722371531173

// delu: Autonomous quant agent that earns + pays for its own compute (L5 — Application)
const delu = {
  "layer": "L5",
  "id": "delu",
  "name": "delu",
  "status": "early",
  "description": "Self-evolving onchain quant agent. Runs its own research, executes trades, and pays for its own compute — all autonomously. Bankr LLM Gateway for inference. First agent in the stack that is both buyer and earner.",
  "launched": "2026",
  "tags": ["agent-income", "onchain", "developer"],
  "chain": "Base",
  "x": "deluquant",
  "added": "2026-03-30",
  "internal_note": "Flag for NULL positioning research — autonomous income primitive. Bankr x Synthesis Hackathon winner."
};

// Quotient: Superforecasting AI for prediction markets (L5 — Application)
const quotient = {
  "layer": "L5",
  "id": "quotient",
  "name": "Quotient",
  "status": "early",
  "description": "Superforecasting AI that identifies and bets on mispriced prediction markets at scale. Uses Bankr LLM Gateway for inference cost management. Executes prediction market positions autonomously.",
  "launched": "2026",
  "tags": ["onchain", "developer", "b2b"],
  "x": "QuotientHQ",
  "added": "2026-03-30",
  "internal_note": "Bankr x Synthesis Hackathon winner."
};

// Gitlawb: Decentralized git with AI agents as native collaborators (L5 — Application)
const gitlawb = {
  "layer": "L5",
  "id": "gitlawb",
  "name": "Gitlawb",
  "status": "early",
  "description": "Decentralized git protocol where AI agents are native collaborators — not tools, but first-class contributors with wallets, permissions, and payment flows built in. Multi-modal LLM stack.",
  "launched": "2026",
  "tags": ["developer", "onchain", "open-source"],
  "x": "gitlawb",
  "added": "2026-03-30",
  "internal_note": "Bankr x Synthesis Hackathon winner."
};

// Helixa: Onchain identity + credibility scoring for agents (L4 — Governance & Policy)
const helixa = {
  "layer": "L4",
  "id": "helixa",
  "name": "Helixa",
  "status": "early",
  "description": "Onchain identity and credibility scoring for AI agents. 'Soul handshake' evaluation via Bankr Skills — agents prove trustworthiness before transacting. Addresses the identity gap in autonomous agent commerce.",
  "launched": "2026",
  "tags": ["onchain", "developer", "b2b"],
  "x": "helixaxyz",
  "added": "2026-03-30",
  "internal_note": "Bankr x Synthesis Hackathon winner."
};

// LITCOIN: Proof-of-research protocol for AI agents (L4 — Governance & Policy)
const litcoin = {
  "layer": "L4",
  "id": "litcoin",
  "name": "LITCOIN",
  "status": "early",
  "description": "Proof-of-research protocol for AI agents. Agents earn LITCOIN by completing verifiable research tasks, establishing credibility through work rather than identity. Bankr wallets for treasury, Bankr execution for task dispatch.",
  "launched": "2026",
  "tags": ["onchain", "developer", "agent-income"],
  "chain": "Base",
  "added": "2026-03-30",
  "internal_note": "Bankr x Synthesis Hackathon winner. Category: agent credibility / proof-of-work."
};

const l4 = data.layers.find(l => l.id === 'L4');
const l5 = data.layers.find(l => l.id === 'L5');

const toAdd = [
  { project: delu, layer: l5 },
  { project: quotient, layer: l5 },
  { project: gitlawb, layer: l5 },
  { project: helixa, layer: l4 },
  { project: litcoin, layer: l4 },
];

let added = 0;
toAdd.forEach(({ project, layer }) => {
  if (!layer.projects.find(p => p.id === project.id)) {
    layer.projects.push(project);
    console.log(`Added ${project.name} to ${layer.id}`);
    added++;
  } else {
    console.log(`${project.name} already present — skipping`);
  }
});

const total = data.layers.reduce((s, l) => s + l.projects.length, 0);

// Bump version and update metadata
data.version = "1.12";
data.updated = "2026-03-30";

// Prepend activity log entry
data.rail.activity.unshift({
  "date": "2026-03-30",
  "type": "added",
  "text": `5 Bankr x Synthesis Hackathon projects added — delu, Quotient, Gitlawb, Helixa, LITCOIN`
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`Done. Added: ${added}. Total projects: ${total}. Version: ${data.version}`);
