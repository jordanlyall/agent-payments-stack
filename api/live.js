/**
 * /api/live — live volume stats for the Agent Payments Stack
 *
 * Returns:
 *   - x402 proxy volume (from data/x402-volume.json, refreshed by cron)
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

  // Cache age in minutes
  let cacheAgeMinutes = null;
  if (volumeData?.meta?.fetched_at) {
    cacheAgeMinutes = Math.floor((Date.now() - new Date(volumeData.meta.fetched_at).getTime()) / 60000);
  }

  // Total project count
  const projectCount = data.layers.reduce((n, l) => n + (l.projects?.length || 0), 0);

  // Live snapshot for recent x402 daily volume (last 7 days)
  const dailyVolume = volumeData?.daily_volume || {};
  const recentDays = Object.entries(dailyVolume)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([date, usd]) => ({ date, usd: Math.round(usd * 100) / 100 }));

  return res.status(200).json({
    updated_at: volumeData?.meta?.fetched_at || data.updated,
    cache_age_minutes: cacheAgeMinutes,
    x402: {
      volume_30d_usd: volumeData?.volume_30d?.total_usd ?? null,
      tx_count_30d: volumeData?.volume_30d?.tx_count ?? null,
      contract: '0x402085c248EeA27D92E8b30b2C58ed07f9E20001',
      chain: 'base',
      recent_days: recentDays,
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
