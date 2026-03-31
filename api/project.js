/**
 * /api/project — Dynamic project page handler
 * Serves projects.html with OG tags injected per project slug.
 * Crawlers get proper OG title, description, and dynamic image.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const slug = req.url.replace(/^\//, '').split('?')[0];

  // Load data
  let data;
  try {
    data = JSON.parse(readFileSync(join(process.cwd(), 'data.json'), 'utf-8'));
  } catch (_) {
    return serveShell(res, null);
  }

  // Find project
  let project = null;
  let layerId = '';
  for (const layer of data.layers) {
    for (const p of layer.projects || []) {
      const pid = p.id || p.slug || p.name?.toLowerCase().replace(/\s+/g, '-');
      if (pid === slug) {
        project = p;
        layerId = layer.id;
        break;
      }
    }
    if (project) break;
  }

  if (!project) {
    return res.status(404).send('Project not found');
  }

  return serveShell(res, project, layerId, slug);
}

function stackScore(p) {
  const base = { live: 80, early: 50, acquired: 40, announced: 15 };
  let liveness = base[p.status] ?? 15;
  if (p.volume && p.volume.value) liveness = Math.min(100, liveness + 20);

  const stars   = p.github?.stars             ? Math.min(50, p.github.stars / 400)        : 0;
  const npm     = p.npm?.weekly_downloads      ? Math.min(35, p.npm.weekly_downloads / 286) : 0;
  const contrib = p.github?.contributors       ? Math.min(15, p.github.contributors / 13.3) : 0;
  const signal  = stars + npm + contrib;

  let openness = 0;
  if (p.github?.url)                   openness += 40;
  if (p.tags?.includes('open-source')) openness += 35;
  if (p.docs)                          openness += 25;

  let info = 0;
  if (p.launched)                   info += 35;
  if (p.funding)                    info += 35;
  if (p.description?.length > 30)   info += 30;

  return Math.round(0.30 * liveness + 0.25 * signal + 0.25 * openness + 0.20 * info);
}

function serveShell(res, project, layerId = '', slug = '') {
  let html;
  try {
    html = readFileSync(join(process.cwd(), 'projects.html'), 'utf-8');
  } catch (_) {
    res.status(500).send('projects.html not found');
    return;
  }

  const name   = project.name || slug;
  const desc   = project.description || '';
  const status = project.status || 'announced';
  const url    = `https://agentpaymentsstack.com/${slug}`;

  const score = stackScore(project);
  const ogImageUrl = `https://agentpaymentsstack.com/api/og?` +
    `name=${encodeURIComponent(name)}` +
    `&layer=${encodeURIComponent(layerId)}` +
    `&status=${encodeURIComponent(status)}` +
    `&desc=${encodeURIComponent(desc)}` +
    `&score=${score}`;

  // Replace static OG tags
  html = html
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${esc(name)} — Agent Payments Stack</title>`
    )
    .replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${esc(desc || `${name} on the Agent Payments Stack`)}">`
    )
    .replace(
      /<link rel="canonical" href="[^"]*">/,
      `<link rel="canonical" href="${url}">`
    )
    .replace(
      /<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${esc(name)} — Agent Payments Stack">`
    )
    .replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${esc(desc || `${name} on the Agent Payments Stack`)}">`
    )
    .replace(
      /<meta property="og:image" content="[^"]*">/,
      `<meta property="og:image" content="${ogImageUrl}">`
    )
    .replace(
      /<meta property="og:url" content="[^"]*">/g,
      `<meta property="og:url" content="${url}">`
    );

  // Add twitter card tags if not present
  if (!html.includes('twitter:title')) {
    html = html.replace(
      '</head>',
      `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(name)} — Agent Payments Stack">
<meta name="twitter:description" content="${esc(desc || `${name} on the Agent Payments Stack`)}">
<meta name="twitter:image" content="${ogImageUrl}">
</head>`
    );
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=300');
  return res.status(200).send(html);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
