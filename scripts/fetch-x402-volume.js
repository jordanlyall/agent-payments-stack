// Fetch real x402 proxy volume from Blockscout API
// Contract: 0x402085c248EeA27D92E8b30b2C58ed07f9E20001 (Base mainnet)
// Writes: data/x402-volume.json
//
// Usage: node scripts/fetch-x402-volume.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONTRACT = '0x402085c248EeA27D92E8b30b2C58ed07f9E20001';
const BLOCKSCOUT_API = 'https://base.blockscout.com/api';

// Known stablecoins on Base
const KNOWN_TOKENS = {
  '833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 },
  'fde4c96c8593536e31f229ea8f37b2ada2699bb2': { symbol: 'USDT', decimals: 6 },
};

// Approximate block 30 days ago (Base: ~2 sec/block, 30d = 1,296,000 blocks)
function get30dStartBlock(currentBlock) {
  return currentBlock - 1_296_000;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'agent-payments-stack/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse failed: ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

// Decode x402 payment function input data
// ABI: payWithPermit2(address token, uint256 amount, bytes32 nonce, uint256 deadline,
//                     address recipient, address payer, uint256 permitDeadline, bytes sig)
function decodePayment(inputHex) {
  if (!inputHex || inputHex.length < 10) return null;

  const raw = inputHex.slice(10); // skip 0x + 4-byte selector
  const chunks = [];
  for (let i = 0; i < raw.length; i += 64) {
    chunks.push(raw.slice(i, i + 64));
  }

  if (chunks.length < 2) return null;

  const tokenAddr = chunks[0].slice(24).toLowerCase(); // last 20 bytes
  const tokenInfo = KNOWN_TOKENS[tokenAddr];
  if (!tokenInfo) return null; // skip non-stablecoin

  const amountRaw = BigInt('0x' + chunks[1]);
  const amount = Number(amountRaw) / Math.pow(10, tokenInfo.decimals);

  if (amount > 1_000_000) return null; // sanity cap

  return { amount, symbol: tokenInfo.symbol, tokenAddr };
}

async function fetchAllTxs() {
  const url = `${BLOCKSCOUT_API}?module=account&action=txlist&address=${CONTRACT}&page=1&offset=10000&sort=desc`;
  const data = await fetchJson(url);

  if (data.status !== '1') {
    throw new Error('Blockscout API error: ' + data.message);
  }

  return data.result || [];
}

async function getCurrentBlock() {
  const url = 'https://mainnet.base.org';
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 });
    const req = https.request('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parseInt(parsed.result, 16));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Fetching current block...');
  const currentBlock = await getCurrentBlock();
  const startBlock = get30dStartBlock(currentBlock);

  console.log(`Current block: ${currentBlock}`);
  console.log(`30d start block: ${startBlock}`);
  console.log(`Fetching transactions for ${CONTRACT}...`);

  const txs = await fetchAllTxs();
  console.log(`Total transactions: ${txs.length}`);

  let totalVolume = 0;
  let txCount30d = 0;
  let txCountAll = 0;
  let bySymbol = {};
  let dailyVolume = {};

  for (const tx of txs) {
    if (tx.isError === '1' || tx.txreceipt_status === '0') continue;

    const payment = decodePayment(tx.input);
    if (!payment) continue;

    txCountAll++;

    // Daily bucket
    const dayTs = Math.floor(parseInt(tx.timeStamp) / 86400) * 86400;
    const dayKey = new Date(dayTs * 1000).toISOString().slice(0, 10);
    if (!dailyVolume[dayKey]) dailyVolume[dayKey] = 0;
    dailyVolume[dayKey] += payment.amount;

    // 30d filter
    if (parseInt(tx.blockNumber) < startBlock) continue;

    txCount30d++;
    totalVolume += payment.amount;

    if (!bySymbol[payment.symbol]) bySymbol[payment.symbol] = 0;
    bySymbol[payment.symbol] += payment.amount;
  }

  const output = {
    meta: {
      contract: CONTRACT,
      chain: 'base',
      fetched_at: new Date().toISOString(),
      current_block: currentBlock,
      start_block_30d: startBlock,
      note: 'Volume decoded from x402ExactPermit2Proxy function call input data via Blockscout API',
      source: 'blockscout',
    },
    volume_30d: {
      total_usd: Math.round(totalVolume * 100) / 100,
      tx_count: txCount30d,
      by_token: bySymbol,
    },
    volume_all_time: {
      tx_count: txCountAll,
    },
    daily_volume: dailyVolume,
  };

  const outPath = path.join(__dirname, '..', 'data', 'x402-volume.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log('\n=== x402 Volume Results ===');
  console.log(`30d transactions: ${txCount30d}`);
  console.log(`30d volume: $${totalVolume.toFixed(2)}`);
  console.log(`By token:`, bySymbol);
  console.log(`\nSaved to: ${outPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
