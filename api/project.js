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

  return serveShell(res, project, layerId, slug);
}

function serveShell(res, project, layerId = '', slug = '') {
  let html;
  try {
    html = readFileSync(join(process.cwd(), 'projects.html'), 'utf-8');
  } catch (_) {
    res.status(500).send('projects.html not found');
    return;
  }

  if (!project) {
    // No project found — serve shell as-is
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  const name   = project.name || slug;
  const desc   = project.description || '';
  const status = project.status || 'announced';
  const url    = `https://agentpaymentsstack.com/${slug}`;

  const ogImageUrl = `https://agentpaymentsstack.com/api/og?` +
    `name=${encodeURIComponent(name)}` +
    `&layer=${encodeURIComponent(layerId)}` +
    `&status=${encodeURIComponent(status)}` +
    `&desc=${encodeURIComponent(desc)}`;

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
