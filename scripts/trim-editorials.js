/**
 * trim-editorials.js — Trim verbose editorials to 2-3 tight sentences
 * Writes trimmed versions directly to data.json
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/trim-editorials.js
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error('Error: ANTHROPIC_API_KEY required'); process.exit(1); }

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const DATA_PATH = path.join(__dirname, '..', 'data.json');
const TRIM_DRAFT_PATH = path.join(__dirname, '..', 'data', 'editorial-trimmed.json');

const WORD_LIMIT = 60;

async function trim(editorial) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Rewrite this editorial as exactly 2-3 tight sentences (max 55 words). Keep the sharpest insight and most specific facts. Cut hedging, redundancy, and anything a reader can infer. No preamble.\n\n${editorial}`,
    }],
  });
  return msg.content[0].text.trim();
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const all = data.layers.flatMap(l => l.projects.map(p => ({ ...p, _layer: l.id })));

  // Load existing trimmed drafts (resume support)
  let trimmed = {};
  if (fs.existsSync(TRIM_DRAFT_PATH)) {
    try { trimmed = JSON.parse(fs.readFileSync(TRIM_DRAFT_PATH, 'utf-8')); } catch (_) {}
  }

  const targets = all.filter(p =>
    p.editorial &&
    p.editorial.split(' ').length > WORD_LIMIT &&
    !trimmed[p.id]
  );

  console.log(`Trimming ${targets.length} verbose editorials...`);

  let done = 0;
  for (const p of targets) {
    process.stdout.write(`[${done + 1}/${targets.length}] ${p._layer} ${p.name}...`);
    try {
      const short = await trim(p.editorial);
      trimmed[p.id] = short;
      fs.mkdirSync(path.dirname(TRIM_DRAFT_PATH), { recursive: true });
      fs.writeFileSync(TRIM_DRAFT_PATH, JSON.stringify(trimmed, null, 2));
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
    }
    done++;
    if (done < targets.length) await new Promise(r => setTimeout(r, 350));
  }

  // Apply to data.json
  console.log('\nApplying trimmed editorials to data.json...');
  let applied = 0;
  data.layers.forEach(layer => {
    layer.projects.forEach(p => {
      if (trimmed[p.id]) { p.editorial = trimmed[p.id]; applied++; }
    });
  });
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`Applied ${applied} trimmed editorials.`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
