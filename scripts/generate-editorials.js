/**
 * generate-editorials.js — Research and write APS editorial notes
 *
 * For each project in data.json missing an `editorial` field:
 *   1. Fetches the project homepage (or docs) for real content
 *   2. Calls Claude to write a 2-3 sentence APS Take
 *   3. Saves progress to data/editorial-drafts.json as it runs
 *
 * Review data/editorial-drafts.json, then run with --apply to write to data.json
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-editorials.js
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-editorials.js --apply
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-editorials.js --id x402          # single project
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-editorials.js --overwrite        # redo existing editorials too
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY required');
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const DATA_PATH   = path.join(__dirname, '..', 'data.json');
const DRAFT_PATH  = path.join(__dirname, '..', 'data', 'editorial-drafts.json');
const ARGS        = process.argv.slice(2);
const APPLY       = ARGS.includes('--apply');
const OVERWRITE   = ARGS.includes('--overwrite');
const SINGLE_ID   = (() => { const i = ARGS.indexOf('--id'); return i !== -1 ? ARGS[i + 1] : null; })();

const LAYER_NAMES = {
  L0: 'Settlement Layer',
  L1: 'Wallet & Key Management',
  L2: 'Routing & Abstraction',
  L3: 'Payment Protocol',
  L4: 'Governance & Policy',
  L5: 'Application Layer',
};

// ── Fetch a URL, return text (max 8KB, timeout 10s) ──────────────────────────
function fetchText(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => { req.destroy(); resolve(null); }, 10000);
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'APS-Research/1.0 (agentpaymentsstack.com)',
        'Accept': 'text/html,text/plain,*/*',
      },
    }, (res) => {
      // Follow one redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        clearTimeout(timeout);
        resolve(fetchText(res.headers.location));
        res.resume();
        return;
      }
      let body = '';
      res.on('data', chunk => { body += chunk; if (body.length > 12000) req.destroy(); });
      res.on('end', () => { clearTimeout(timeout); resolve(body.slice(0, 12000)); });
      res.on('error', () => { clearTimeout(timeout); resolve(null); });
    });
    req.on('error', () => { clearTimeout(timeout); resolve(null); });
  });
}

// Strip HTML tags and collapse whitespace
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);
}

// ── Generate editorial via Claude ─────────────────────────────────────────────
async function generateEditorial(p, pageText) {
  const layerCtx = LAYER_NAMES[p.layer] || p.layer || 'unknown layer';
  const tagsCtx = p.tags ? p.tags.join(', ') : 'none';
  const chainCtx = p.chain ? (Array.isArray(p.chain) ? p.chain.join(', ') : p.chain) : null;
  const fundingCtx = p.funding ? `Funding: ${p.funding}.` : '';
  const launchedCtx = p.launched ? `Launched: ${p.launched}.` : '';
  const statusCtx = p.status || 'live';

  const pageSnippet = pageText
    ? `\nHomepage content (excerpt):\n${pageText.slice(0, 2500)}`
    : '\n(No homepage content available — use description and metadata only)';

  const prompt = `You are writing editorial notes for the Agent Payments Stack (agentpaymentsstack.com) — a research database tracking infrastructure for AI agent payments across settlement, wallets, routing, protocols, governance, and application layers.

Write a 2-4 sentence "APS Take" editorial for this project. Be specific, analytical, and opinionated. Avoid marketing language. Focus on:
- What this project actually does (concrete, not vague)
- Where it fits in the stack and why that position matters
- What makes it notable, early-stage, worth watching, or a risk/concern
- If acquired: what that means for the space

Project data:
- Name: ${p.name}
- Layer: ${p.layer} — ${layerCtx}
- Status: ${statusCtx}
- Description: ${p.description || 'none'}
- Tags: ${tagsCtx}
${chainCtx ? `- Chain: ${chainCtx}` : ''}
${fundingCtx}
${launchedCtx}
${p.acquirer ? `- Acquired by: ${p.acquirer}` : ''}
${pageSnippet}

Write only the editorial text (2-4 sentences). No preamble, no quotes, no label.`;

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return msg.content[0].text.trim();
}

// ── Apply drafts to data.json ─────────────────────────────────────────────────
function applyDrafts() {
  if (!fs.existsSync(DRAFT_PATH)) {
    console.error('No draft file found at', DRAFT_PATH);
    process.exit(1);
  }
  const drafts = JSON.parse(fs.readFileSync(DRAFT_PATH, 'utf-8'));
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  let applied = 0;
  data.layers.forEach(layer => {
    layer.projects.forEach(p => {
      if (drafts[p.id]) {
        p.editorial = drafts[p.id].editorial;
        applied++;
      }
    });
  });

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`Applied ${applied} editorials to data.json`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (APPLY) {
    applyDrafts();
    return;
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const all = data.layers.flatMap(l => l.projects.map(p => ({ ...p, layer: p.layer || l.id })));

  // Load existing drafts (resume support)
  let drafts = {};
  if (fs.existsSync(DRAFT_PATH)) {
    try { drafts = JSON.parse(fs.readFileSync(DRAFT_PATH, 'utf-8')); } catch (_) {}
  }

  // Filter to projects that need editorials
  let targets = all.filter(p => {
    if (SINGLE_ID) return p.id === SINGLE_ID;
    if (p._review) return false; // skip flagged projects
    if (!OVERWRITE && p.editorial) return false; // skip if already has editorial
    if (!OVERWRITE && drafts[p.id]) return false; // skip already drafted
    return true;
  });

  if (!targets.length) {
    console.log('Nothing to generate. Use --overwrite to redo existing editorials.');
    return;
  }

  console.log(`Generating editorials for ${targets.length} projects...`);
  console.log('Model: claude-haiku-4-5-20251001 | Output: data/editorial-drafts.json\n');

  let done = 0;
  for (const p of targets) {
    process.stdout.write(`[${done + 1}/${targets.length}] ${p.layer} ${p.name}...`);

    // Fetch homepage content
    const fetchUrl = p.url || p.docs || null;
    let pageText = null;
    if (fetchUrl) {
      const raw = await fetchText(fetchUrl);
      pageText = stripHtml(raw);
    }

    try {
      const editorial = await generateEditorial(p, pageText);
      drafts[p.id] = { name: p.name, layer: p.layer, status: p.status, editorial };
      fs.mkdirSync(path.dirname(DRAFT_PATH), { recursive: true });
      fs.writeFileSync(DRAFT_PATH, JSON.stringify(drafts, null, 2));
      console.log(' done');
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      drafts[p.id] = { name: p.name, layer: p.layer, status: p.status, editorial: null, error: err.message };
      fs.writeFileSync(DRAFT_PATH, JSON.stringify(drafts, null, 2));
    }

    done++;
    // Rate limit: ~3 req/s to avoid Anthropic throttling
    if (done < targets.length) await new Promise(r => setTimeout(r, 350));
  }

  const succeeded = Object.values(drafts).filter(d => d.editorial).length;
  const failed    = Object.values(drafts).filter(d => d.error).length;

  console.log(`\n=== Done ===`);
  console.log(`Generated: ${succeeded} | Failed: ${failed}`);
  console.log(`Drafts saved to: data/editorial-drafts.json`);
  console.log(`\nReview the file, then run with --apply to write to data.json`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
