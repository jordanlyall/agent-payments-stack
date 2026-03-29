/**
 * fetch-apv.js — Fetch Agent Payment Volume (APV) from Dune Analytics
 *
 * APV = x402 30d volume (EVM) + Virtuals ACP 30d volume (Base)
 *
 * Dune query IDs:
 *   x402: 6240463  — "x402 Volume by Facilitator & Chain" (standalone query)
 *   ACP:  set DUNE_ACP_QUERY_ID env var (get from dune.com/hashed_official/acp-virtuals)
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
// Query 5236154: weekly x402 transfer volume (confirmed working)
// Returns rows: week_start, total_value_moved, transfer_count, unique_buyers, unique_sellers
const X402_QUERY_ID = process.env.DUNE_X402_QUERY_ID || '5236154';
const ACP_QUERY_ID = process.env.DUNE_ACP_QUERY_ID || null;

if (!DUNE_API_KEY) {
  console.error('Error: DUNE_API_KEY environment variable required.');
  console.error('Get a free key at https://dune.com/settings/api');
  process.exit(1);
}

function fetchDuneQuery(queryId, limit = 10) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.dune.com',
      path: `/api/v1/query/${queryId}/results?limit=${limit}`,
      method: 'GET',
      headers: {
        'X-Dune-API-Key': DUNE_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error('Dune API error: ' + parsed.error));
          else resolve(parsed);
        } catch (e) {
          reject(new Error('JSON parse failed: ' + data.slice(0, 200)));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse x402 query result (query 5236154 — weekly aggregation).
 * Columns: week_start, total_value_moved, transfer_count, unique_buyers, unique_sellers
 * Sums the 4 most recent complete weeks to approximate a rolling 30d window.
 */
function parseX402Volume(result) {
  const rows = result?.result?.rows || [];
  if (rows.length === 0) return { volume_usd: 0, tx_count: 0, weekly: [] };

  // Sort descending by week_start
  const sorted = [...rows].sort((a, b) => b.week_start.localeCompare(a.week_start));

  // Sum last 4 weeks (rolling ~30 days)
  const window = sorted.slice(0, 4);
  let totalVol = 0;
  let totalTx = 0;
  const weekly = [];

  for (const row of window) {
    const vol = parseFloat(row.total_value_moved) || 0;
    const tx = parseInt(row.transfer_count) || 0;
    totalVol += vol;
    totalTx += tx;
    weekly.push({ week: row.week_start, volume_usd: Math.round(vol * 100) / 100, tx_count: tx });
  }

  return {
    volume_usd: Math.round(totalVol * 100) / 100,
    tx_count: totalTx,
    weekly,
  };
}

/**
 * Parse ACP query result.
 * Column structure depends on the specific query — we look for a total USD volume field.
 */
function parseACPVolume(result) {
  const rows = result?.result?.rows || [];
  if (rows.length === 0) return { volume_usd: 0, tx_count: 0 };

  const sample = rows[0];
  const volCol = Object.keys(sample).find(k => k.toLowerCase().includes('volume') || k.toLowerCase().includes('usd') || k.toLowerCase().includes('value'));
  const txCol = Object.keys(sample).find(k => k.toLowerCase().includes('tx') || k.toLowerCase().includes('count') || k.toLowerCase().includes('job'));

  console.log(`ACP columns detected: vol=${volCol}, tx=${txCol}`);
  console.log('Sample row:', JSON.stringify(sample));

  let totalVol = 0;
  let totalTx = 0;

  for (const row of rows) {
    totalVol += parseFloat(row[volCol]) || 0;
    totalTx += parseInt(row[txCol]) || 0;
  }

  return {
    volume_usd: Math.round(totalVol * 100) / 100,
    tx_count: totalTx,
  };
}

async function main() {
  console.log('Fetching APV from Dune Analytics...');
  console.log(`x402 query ID: ${X402_QUERY_ID}`);
  if (ACP_QUERY_ID) console.log(`ACP query ID: ${ACP_QUERY_ID}`);
  else console.log('ACP: skipped (set DUNE_ACP_QUERY_ID to include)');

  // Fetch x402 volume
  let x402 = { volume_usd: 0, tx_count: 0, by_facilitator: [], by_chain: {} };
  try {
    console.log('\nFetching x402 volume...');
    const x402Result = await fetchDuneQuery(X402_QUERY_ID);
    x402 = parseX402Volume(x402Result);
    console.log(`x402: $${x402.volume_usd.toLocaleString()} USD, ${x402.tx_count.toLocaleString()} txns`);
  } catch (err) {
    console.error('x402 fetch error:', err.message);
  }

  // Fetch ACP volume (optional)
  let acp = { volume_usd: 0, tx_count: 0 };
  if (ACP_QUERY_ID) {
    try {
      console.log('\nFetching ACP volume...');
      const acpResult = await fetchDuneQuery(ACP_QUERY_ID);
      acp = parseACPVolume(acpResult);
      console.log(`ACP: $${acp.volume_usd.toLocaleString()} USD, ${acp.tx_count.toLocaleString()} txns`);
    } catch (err) {
      console.error('ACP fetch error:', err.message);
    }
  }

  // APV = x402 + ACP
  const apv_usd = x402.volume_usd + acp.volume_usd;
  const apv_tx = x402.tx_count + acp.tx_count;

  const output = {
    meta: {
      fetched_at: new Date().toISOString(),
      window: '30d',
      sources: ['x402', ...(ACP_QUERY_ID ? ['acp-virtuals'] : [])],
      dune_query_x402: X402_QUERY_ID,
      dune_query_acp: ACP_QUERY_ID || null,
      note: 'APV = agent payment volume. x402 tracks EVM facilitator volume. ACP tracks Virtuals Protocol job escrow volume on Base.',
    },
    apv: {
      volume_30d_usd: apv_usd,
      tx_count_30d: apv_tx,
    },
    x402: x402,
    acp: acp,
  };

  const outPath = path.join(__dirname, '..', 'data', 'apv.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log('\n=== APV Results ===');
  console.log(`APV 30d: $${apv_usd.toLocaleString()} USD`);
  console.log(`APV txns: ${apv_tx.toLocaleString()}`);
  console.log(`x402: $${x402.volume_usd.toLocaleString()} (${x402.tx_count.toLocaleString()} txns)`);
  console.log(`ACP:  $${acp.volume_usd.toLocaleString()} (${acp.tx_count.toLocaleString()} txns)`);
  console.log(`\nSaved to: ${outPath}`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
