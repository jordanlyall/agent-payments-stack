/**
 * process-tally.js — Tally submission processor for APS
 *
 * Fetches new project submissions from Tally, cross-references against
 * data.json, and uses Claude to draft data.json entries for any that
 * aren't already in the stack.
 *
 * Workflow:
 *   1. Run with no flags — fetch and draft new submissions
 *   2. Review data/pending-submissions.json
 *   3. Run --approve <id> to add a draft to data.json + sync
 *   4. Run --approve-all to add all drafted entries at once
 *   5. Run --list to see pending submission status
 *   6. Run --reject <tallyId> to mark a submission as rejected
 *
 * Usage:
 *   TALLY_API_KEY=xxx ANTHROPIC_API_KEY=sk-... node scripts/process-tally.js
 *   TALLY_API_KEY=xxx node scripts/process-tally.js --list
 *   TALLY_API_KEY=xxx ANTHROPIC_API_KEY=sk-... node scripts/process-tally.js --approve agentcard
 *   TALLY_API_KEY=xxx ANTHROPIC_API_KEY=sk-... node scripts/process-tally.js --approve-all
 *   node scripts/process-tally.js --reject <submission-id>
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');

// ── Config ────────────────────────────────────────────────────────────────────

const TALLY_API_KEY    = process.env.TALLY_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FORM_ID          = 'rjVvd5';

const DATA_PATH        = path.join(__dirname, '..', 'data.json');
const PENDING_PATH     = path.join(__dirname, '..', 'data', 'pending-submissions.json');
const SYNC_SCRIPT      = path.join(__dirname, 'sync-data.js');

const ARGS             = process.argv.slice(2);
const MODE_LIST        = ARGS.includes('--list');
const MODE_APPROVE_ALL = ARGS.includes('--approve-all');
const MODE_APPROVE     = (() => { const i = ARGS.indexOf('--approve'); return i !== -1 ? ARGS[i + 1] : null; })();
const MODE_REJECT      = (() => { const i = ARGS.indexOf('--reject'); return i !== -1 ? ARGS[i + 1] : null; })();

// ── Layer reference ───────────────────────────────────────────────────────────

const LAYER_NAMES = {
  L0: 'Settlement Layer — base chains, bridge protocols, stablecoin issuers',
  L1: 'Wallet & Key Management — agent wallets, embedded wallets, MPC, account abstraction',
  L2: 'Routing & Abstraction — payment routing, cross-chain abstraction, clearinghouses',
  L3: 'Payment Protocol — x402, L402, ACP, Tempo MPP, Google AP2, agent payment standards',
  L4: 'Governance & Policy — spend controls, budget enforcement, compliance, audit',
  L5: 'Application Layer — agent marketplaces, agent-native services, commerce endpoints',
};

const VALID_TAGS = [
  'http','streaming','batch','micropayment','cross-border','onchain','offchain',
  'open-source','mpc','zk','account-abstraction','lightning','smart-contract',
  'api-native','sdk','self-hosted','permissioned',
  'coinbase','stripe','circle','google','mastercard','visa','moonpay',
  'b2b','consumer','developer','enterprise','marketplace','x402','agent-income',
];

// ── Utilities ─────────────────────────────────────────────────────────────────

function loadData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function loadPending() {
  if (!fs.existsSync(PENDING_PATH)) return { submissions: [] };
  return JSON.parse(fs.readFileSync(PENDING_PATH, 'utf8'));
}

function savePending(pending) {
  fs.writeFileSync(PENDING_PATH, JSON.stringify(pending, null, 2));
}

function getAllProjects(data) {
  return data.layers.flatMap(l => l.projects);
}

function fetchUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : require('http');
    const timeout = setTimeout(() => { req.destroy(); resolve(null); }, 8000);
    const req = mod.get(url, {
      headers: { 'User-Agent': 'APS-Bot/1.0 (agentpaymentsstack.com)' },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        clearTimeout(timeout);
        resolve(fetchUrl(res.headers.location));
        return;
      }
      let body = '';
      res.on('data', chunk => { if (body.length < 12000) body += chunk; });
      res.on('end', () => { clearTimeout(timeout); resolve(body || null); });
    });
    req.on('error', () => { clearTimeout(timeout); resolve(null); });
  });
}

// ── Tally API ─────────────────────────────────────────────────────────────────

function tallyRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.tally.so',
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TALLY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchSubmissions() {
  const res = await tallyRequest(`/forms/${FORM_ID}/submissions?limit=100`);
  if (res.status !== 200) {
    throw new Error(`Tally API error ${res.status}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

// Extract field values from a Tally submission (handles varied field naming)
function parseSubmission(sub) {
  const fields = {};
  const rawFields = sub.fields || sub.data || [];
  for (const field of rawFields) {
    const label = (field.label || field.title || field.key || '').toLowerCase().trim();
    const value = Array.isArray(field.value) ? field.value.join(', ') : String(field.value || '');
    if (label) fields[label] = value;
  }
  return {
    id: sub.id,
    submittedAt: sub.createdAt || sub.submittedAt,
    projectName: fields['project name'] || fields['name'] || fields['project'] || '',
    url: fields['url'] || fields['website'] || fields['project url'] || fields['link'] || '',
    description: fields['description'] || fields['what does it do'] || fields['about'] || fields['tell us about your project'] || '',
    layer: fields['layer'] || fields['stack layer'] || fields['which layer'] || '',
    contact: fields['email'] || fields['contact'] || fields['twitter'] || fields['x handle'] || fields['x'] || '',
    rawFields: fields,
  };
}

// ── Claude drafting ───────────────────────────────────────────────────────────

async function draftEntry(submission, pageContent) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `You are curating the Agent Payments Stack — a layer-by-layer map of AI agent payment infrastructure.

A project was submitted via the APS submit form. Your job is to draft a structured data.json entry.

## Stack layers
${Object.entries(LAYER_NAMES).map(([k, v]) => `${k}: ${v}`).join('\n')}

## Valid tags (use only from this list, pick 2-5 most relevant)
${VALID_TAGS.join(', ')}

## Status options
- live: deployed and in production use
- early: in beta, testnet, or very limited availability
- announced: publicly announced but not yet deployed

## Submission data
Project name: ${submission.projectName}
URL: ${submission.url}
Description from submitter: ${submission.description}
Layer (self-reported): ${submission.layer}
Contact: ${submission.contact}
Submitted: ${submission.submittedAt}

## Homepage content (fetched)
${pageContent ? pageContent.slice(0, 3000) : 'Could not fetch — use submission description only.'}

## Instructions
1. Assign the correct layer based on what the project actually does, not the submitter's self-report.
2. Write a description that is factual, 1-2 sentences, agent-payments angle, no marketing language.
3. Return ONLY valid JSON. No markdown, no explanation, no code fences.

Required fields: layer, id (slug), name, status, description, url, tags (array), added ("${today}")
Optional fields (include only if clearly established): chain, funding, launched (year), x (handle), github (url string), npm ({package: "..."}), internal_note`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(jsonStr);
}

// ── Mode: list ────────────────────────────────────────────────────────────────

function cmdList() {
  const pending = loadPending();
  if (!pending.submissions.length) {
    console.log('No pending submissions.');
    return;
  }
  const counts = {};
  for (const s of pending.submissions) {
    counts[s.status] = (counts[s.status] || 0) + 1;
  }
  console.log(`\nPending submissions (${pending.submissions.length} total):`);
  console.log('  ' + Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', '));
  console.log('');

  const show = pending.submissions.filter(s => !['already-in-stack', 'approved', 'rejected'].includes(s.status));
  if (!show.length) { console.log('  Nothing awaiting review.\n'); return; }

  for (const s of show) {
    const draft = s.draft ? `→ ${s.draft.layer}/${s.draft.id} (${s.draft.status})` : '(no draft)';
    console.log(`  [${s.status.padEnd(12)}] ${s.projectName.padEnd(28)} ${s.url}`);
    if (s.draft) console.log(`                               ${draft}`);
  }
  console.log('\nTo approve: node scripts/process-tally.js --approve <draft-id>');
  console.log('To approve all: node scripts/process-tally.js --approve-all\n');
}

// ── Mode: reject ──────────────────────────────────────────────────────────────

function cmdReject(tallyId) {
  const pending = loadPending();
  const sub = pending.submissions.find(s => s.tallyId === tallyId || s.tallyId.startsWith(tallyId));
  if (!sub) { console.error(`Submission ${tallyId} not found.`); process.exit(1); }
  sub.status = 'rejected';
  savePending(pending);
  console.log(`Rejected: ${sub.projectName}`);
}

// ── Mode: approve ─────────────────────────────────────────────────────────────

function applyDraft(draft) {
  const data = loadData();
  const layer = data.layers.find(l => l.id === draft.layer);
  if (!layer) throw new Error(`Unknown layer: ${draft.layer}`);

  const exists = getAllProjects(data).find(p => p.id === draft.id);
  if (exists) {
    console.log(`  Already in stack: ${draft.id}`);
    return false;
  }

  layer.projects.push(draft);
  const total = data.layers.reduce((s, l) => s + l.projects.length, 0);
  data.stats.total_projects = total;
  data.updated = new Date().toISOString().slice(0, 10);

  // Bump minor version
  const vMatch = (data.version || 'v1.18').match(/v(\d+)\.(\d+)/);
  const [major, minor] = vMatch ? [parseInt(vMatch[1]), parseInt(vMatch[2])] : [1, 18];
  data.version = `v${major}.${minor + 1}`;

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log(`  Added: ${draft.name} → ${draft.layer} (${total} total, ${data.version})`);

  // Sync HTML
  const syncResult = spawnSync('node', [SYNC_SCRIPT], { stdio: 'inherit', encoding: 'utf8' });
  if (syncResult.status !== 0) console.error('  Warning: sync-data.js failed');

  // Update llms.txt count
  const llmsPath = path.join(__dirname, '..', 'llms.txt');
  if (fs.existsSync(llmsPath)) {
    const prev = total - 1;
    const llms = fs.readFileSync(llmsPath, 'utf8').replace(
      new RegExp(`${prev} projects`, 'g'),
      `${total} projects`
    );
    fs.writeFileSync(llmsPath, llms);
  }

  return true;
}

function cmdApprove(draftId) {
  const pending = loadPending();
  const sub = pending.submissions.find(s =>
    s.draft && (s.draft.id === draftId || s.draft.id.includes(draftId))
  );
  if (!sub || !sub.draft) {
    console.error(`No draft found for id: ${draftId}`);
    console.log('Run --list to see available draft IDs.');
    process.exit(1);
  }
  const added = applyDraft(sub.draft);
  if (added) { sub.status = 'approved'; savePending(pending); }
}

function cmdApproveAll() {
  const pending = loadPending();
  const toApprove = pending.submissions.filter(s => s.draft && s.status === 'drafted');
  if (!toApprove.length) { console.log('No drafted submissions ready to approve.'); return; }
  console.log(`Approving ${toApprove.length} submissions...`);
  for (const sub of toApprove) {
    console.log(`\nApproving: ${sub.draft.name}`);
    const added = applyDraft(sub.draft);
    if (added) sub.status = 'approved';
  }
  savePending(pending);
  console.log('\nDone. Stage, commit, and push when ready.');
}

// ── Mode: fetch + draft ───────────────────────────────────────────────────────

async function cmdFetch() {
  if (!TALLY_API_KEY) {
    console.error('TALLY_API_KEY required. Get it from tally.so → Settings → API.');
    process.exit(1);
  }
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY required for Claude drafting.');
    process.exit(1);
  }

  console.log('Fetching Tally submissions...');
  const response = await fetchSubmissions();
  const rawSubs = response.submissions || response.data || response || [];
  const subList = Array.isArray(rawSubs) ? rawSubs : [];
  console.log(`  ${subList.length} total submissions from Tally`);

  const data = loadData();
  const allProjects = getAllProjects(data);
  const allNames = new Set(allProjects.map(p => p.name.toLowerCase()));
  const allUrls  = new Set(allProjects.map(p => (p.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')));

  const pending = loadPending();
  const knownIds = new Set(pending.submissions.map(s => s.tallyId));

  let newCount = 0;
  let skippedCount = 0;

  for (const raw of subList) {
    const sub = parseSubmission(raw);
    if (!sub.projectName) continue;

    if (knownIds.has(sub.id)) { skippedCount++; continue; }

    const nameLower = sub.projectName.toLowerCase();
    const urlClean  = (sub.url || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const inStack = allNames.has(nameLower) || (urlClean && allUrls.has(urlClean));

    if (inStack) {
      pending.submissions.push({
        tallyId: sub.id,
        projectName: sub.projectName,
        url: sub.url,
        submittedAt: sub.submittedAt,
        contact: sub.contact,
        status: 'already-in-stack',
        draft: null,
      });
      knownIds.add(sub.id);
      skippedCount++;
      console.log(`  Skip (already in stack): ${sub.projectName}`);
      continue;
    }

    console.log(`\nNew submission: ${sub.projectName} (${sub.url})`);

    let pageContent = null;
    if (sub.url) {
      process.stdout.write('  Fetching homepage...');
      pageContent = await fetchUrl(sub.url);
      console.log(pageContent ? ` ${pageContent.length} chars` : ' failed');
    }

    let draft = null;
    try {
      process.stdout.write('  Drafting with Claude...');
      draft = await draftEntry(sub, pageContent);
      console.log(` ${draft.name} → ${draft.layer} (${draft.status})`);
    } catch (e) {
      console.error(` failed: ${e.message}`);
    }

    pending.submissions.push({
      tallyId: sub.id,
      projectName: sub.projectName,
      url: sub.url,
      submittedAt: sub.submittedAt,
      contact: sub.contact,
      status: draft ? 'drafted' : 'draft-failed',
      draft,
    });
    knownIds.add(sub.id);
    newCount++;

    await new Promise(r => setTimeout(r, 400));
  }

  savePending(pending);
  console.log(`\nDone. ${newCount} new drafted, ${skippedCount} skipped.`);
  if (newCount > 0) {
    console.log(`Review:  data/pending-submissions.json`);
    console.log(`List:    node scripts/process-tally.js --list`);
    console.log(`Approve: node scripts/process-tally.js --approve <draft-id>`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

(async () => {
  if (MODE_LIST)        { cmdList(); return; }
  if (MODE_REJECT)      { cmdReject(MODE_REJECT); return; }
  if (MODE_APPROVE)     { cmdApprove(MODE_APPROVE); return; }
  if (MODE_APPROVE_ALL) { cmdApproveAll(); return; }
  await cmdFetch();
})().catch(err => { console.error(err.message); process.exit(1); });
