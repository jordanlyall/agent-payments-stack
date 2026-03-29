/**
 * /api/live — live volume stats for the Agent Payments Stack
 *
 * Returns:
 *   - APV (Agent Payment Volume): x402 + ACP 30d volume (from data/apv.json)
 *   - x402 proxy volume fallback (from data/x402-volume.json)
 *   - aggregate stack stats from data.json
 *   - cache age so the UI can show "updated X hours ago"
 *
 * CDN-cached for 5 minutes; stale-while-revalidate for 60s.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

  // APV data (preferred — Dune-based, multi-protocol)
  let apvData = null;
  const apvPath = join(process.cwd(), 'data', 'apv.json');
  if (existsSync(apvPath)) {
    try { apvData = JSON.parse(readFileSync(apvPath, 'utf-8')); } catch (_) {}
  }

  // x402 Blockscout data (fallback if APV not yet populated)
  let volumeData = null;
  const volumePath = join(process.cwd(), 'data', 'x402-volume.json');
  if (existsSync(volumePath)) {
    try { volumeData = JSON.parse(readFileSync(volumePath, 'utf-8')); } catch (_) {}
  }

  let data = null;
  try {
    data = JSON.parse(readFileSync(join(process.cwd(), 'data.json'), 'utf-8'));
  } catch (_) {
    return res.status(500).json({ error: 'data.json unavailable' });
  }

  // Cache age in minutes (prefer APV timestamp, fall back to x402)
  const dataTimestamp = apvData?.meta?.fetched_at || volumeData?.meta?.fetched_at;
  let cacheAgeMinutes = null;
  if (dataTimestamp) {
    cacheAgeMinutes = Math.floor((Date.now() - new Date(dataTimestamp).getTime()) / 60000);
  }

  // Total project count
  const projectCount = data.layers.reduce((n, l) => n + (l.projects?.length || 0), 0);

  // APV: use Dune data if available, fall back to Blockscout x402-only
  const apvVolume = apvData?.apv?.volume_30d_usd ?? volumeData?.volume_30d?.total_usd ?? null;
  const apvTxCount = apvData?.apv?.tx_count_30d ?? volumeData?.volume_30d?.tx_count ?? null;
  const apvSources = apvData?.meta?.sources ?? ['x402-blockscout'];

  // x402 weekly breakdown (from Dune APV data)
  const x402Weekly = apvData?.x402?.weekly ?? [];

  // Recent daily volume from Blockscout (legacy, kept for sparkline use)
  const dailyVolume = volumeData?.daily_volume || {};
  const recentDays = Object.entries(dailyVolume)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, usd]) => ({ date, usd: Math.round(usd * 100) / 100 }));

  return res.status(200).json({
    updated_at: dataTimestamp || data.updated,
    cache_age_minutes: cacheAgeMinutes,
    apv: {
      volume_30d_usd: apvVolume,
      tx_count_30d: apvTxCount,
      sources: apvSources,
      window: '30d',
    },
    x402: {
      volume_30d_usd: apvData?.x402?.volume_usd ?? volumeData?.volume_30d?.total_usd ?? null,
      tx_count_30d: apvData?.x402?.tx_count ?? volumeData?.volume_30d?.tx_count ?? null,
      contract: '0x402085c248EeA27D92E8b30b2C58ed07f9E20001',
      chain: 'base',
      weekly: x402Weekly,
      recent_days: recentDays,
    },
    acp: {
      volume_30d_usd: apvData?.acp?.volume_usd ?? null,
      tx_count_30d: apvData?.acp?.tx_count ?? null,
      chain: 'base',
    },
    stack: {
      projects: projectCount,
      layers: data.layers.length,
      volume_tracked: data.stats?.volume_9mo ?? '$43M',
      transactions: data.stats?.transactions ?? '140M',
      usdc_share: data.stats?.usdc_share ?? '98.6%',
      ma_value: '$8.05B',
      ma_deals: 7,
      last_updated: data.updated,
    },
  });
}
