/**
 * fetch-apv.js — Fetch Agent Payment Volume (APV)
 *
 * APV = x402 30d volume (Dune, EVM) + Virtuals ACP 30d volume (Blockscout, Base)
 *
 * Sources:
 *   x402: Dune query 5236154 — weekly transfer volume, last 4 weeks
 *   ACP:  Blockscout token transfer API — USDC inflows to v1 + v2 contracts
 *
 * Usage:
 *   DUNE_API_KEY=your_key node scripts/fetch-apv.js
 *
 * Writes: data/apv.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const DUNE_API_KEY = process.env.DUNE_API_KEY;
const X402_QUERY_ID = process.env.DUNE_X402_QUERY_ID || '5236154';

// ACP contract addresses on Base (from @virtuals-protocol/acp-node SDK)
const ACP_CONTRACTS = [
  { label: 'v1', address: '0x6a1FE26D54ab0d3E1e3168f2e0c0cDa5cC0A0A4A' },
  { label: 'v2', address: '0xa6C9BA866992cfD7fd6460ba912bfa405adA9df0' },
];
const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BLOCKSCOUT_BASE = 'https://base.blockscout.com/api';

if (!DUNE_API_KEY) {
  console.error('Error: DUNE_API_KEY environment variable required.');
  console.error('Get a free key at https://dune.com/settings/api');
  process.exit(1);
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'aps/1.0', ...headers } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/** x402: Dune query 5236154 (weekly aggregation, last 4 weeks = ~30d) */
async function fetchX402Volume() {
  const url = `https://api.dune.com/api/v1/query/${X402_QUERY_ID}/results?limit=10`;
  const data = await fetchJson(url, { 'X-Dune-API-Key': DUNE_API_KEY });

  if (data.error) throw new Error(JSON.stringify(data.error));

  const rows = (data?.result?.rows || []).sort((a, b) => b.week_start.localeCompare(a.week_start));
  const window = rows.slice(0, 4);

  let volume_usd = 0, tx_count = 0;
  const weekly = [];

  for (const row of window) {
    const vol = parseFloat(row.total_value_moved) || 0;
    const tx = parseInt(row.transfer_count) || 0;
    volume_usd += vol;
    tx_count += tx;
    weekly.push({ week: row.week_start, volume_usd: Math.round(vol * 100) / 100, tx_count: tx });
  }

  return { volume_usd: Math.round(volume_usd * 100) / 100, tx_count, weekly };
}

/** ACP: USDC inflows to v1 + v2 contracts via Blockscout pagination */
async function fetchACPContractVolume(address) {
  const cutoff = Math.floor(Date.now() / 1000) - 30 * 86400;
  let volume_usd = 0, tx_count = 0, page = 1;

  while (page <= 200) {
    const url = `${BLOCKSCOUT_BASE}?module=account&action=tokentx&address=${address}&contractaddress=${USDC_BASE}&page=${page}&offset=1000&sort=desc`;
    let data;
    let retries = 3;
    while (retries > 0) {
      try {
        data = await fetchJson(url);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) { console.warn(`  ACP page ${page} failed: ${err.message}`); break; }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    if (!data) break;

    const txs = data?.result || [];
    if (!txs.length) break;

    let hitCutoff = false;
    for (const tx of txs) {
      if (parseInt(tx.timeStamp) < cutoff) { hitCutoff = true; break; }
      if (tx.to?.toLowerCase() === address.toLowerCase()) {
        volume_usd += parseInt(tx.value) / 1e6;
        tx_count++;
      }
    }

    if (hitCutoff || txs.length < 1000) break;
    page++;
    await new Promise(r => setTimeout(r, 150));
  }

  return { volume_usd: Math.round(volume_usd * 100) / 100, tx_count };
}

async function fetchACPVolume() {
  let total_vol = 0, total_tx = 0;
  const by_contract = [];

  for (const { label, address } of ACP_CONTRACTS) {
    console.log(`  ACP ${label} (${address.slice(0, 10)}...)...`);
    const { volume_usd, tx_count } = await fetchACPContractVolume(address);
    console.log(`  ACP ${label}: $${volume_usd.toLocaleString()} (${tx_count.toLocaleString()} inflows)`);
    total_vol += volume_usd;
    total_tx += tx_count;
    by_contract.push({ label, address, volume_usd, tx_count });
  }

  return {
    volume_usd: Math.round(total_vol * 100) / 100,
    tx_count: total_tx,
    by_contract,
  };
}

async function main() {
  console.log('Fetching APV...');

  let x402 = { volume_usd: 0, tx_count: 0, weekly: [] };
  try {
    console.log('\nFetching x402 (Dune)...');
    x402 = await fetchX402Volume();
    console.log(`x402: $${x402.volume_usd.toLocaleString()} (${x402.tx_count.toLocaleString()} txns)`);
  } catch (err) {
    console.error('x402 error:', err.message);
  }

  let acp = { volume_usd: 0, tx_count: 0, by_contract: [] };
  try {
    console.log('\nFetching ACP (Blockscout)...');
    acp = await fetchACPVolume();
    console.log(`ACP total: $${acp.volume_usd.toLocaleString()} (${acp.tx_count.toLocaleString()} inflows)`);
  } catch (err) {
    console.error('ACP error:', err.message);
  }

  const apv_usd = x402.volume_usd + acp.volume_usd;
  const apv_tx = x402.tx_count + acp.tx_count;
  const sources = ['x402', ...(acp.volume_usd > 0 ? ['acp-virtuals'] : [])];

  const output = {
    meta: {
      fetched_at: new Date().toISOString(),
      window: '30d',
      sources,
      note: 'APV = agent payment volume. x402: Dune query 5236154 (weekly, last 4 weeks). ACP: Blockscout USDC inflows to Virtuals ACP v1+v2 contracts on Base.',
    },
    apv: {
      volume_30d_usd: apv_usd,
      tx_count_30d: apv_tx,
    },
    x402,
    acp,
  };

  const outPath = path.join(__dirname, '..', 'data', 'apv.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log('\n=== APV Results ===');
  console.log(`APV 30d:  $${apv_usd.toLocaleString()}`);
  console.log(`APV txns: ${apv_tx.toLocaleString()}`);
  console.log(`x402:     $${x402.volume_usd.toLocaleString()} (${x402.tx_count.toLocaleString()} txns)`);
  console.log(`ACP:      $${acp.volume_usd.toLocaleString()} (${acp.tx_count.toLocaleString()} inflows)`);
  console.log(`Sources:  ${sources.join(' + ')}`);
  console.log(`\nSaved to: ${outPath}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
