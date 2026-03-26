/**
 * MCP server for The Agent Payments Stack.
 *
 * Implements MCP JSON-RPC 2.0 (stateless HTTP transport) over the
 * /api/mcp Vercel serverless function. No auth required — public dataset.
 *
 * Tools:
 *   stack_search_projects   — fuzzy search by name/description
 *   stack_filter_by_layer   — all projects at a given layer (L0-L5)
 *   stack_filter_by_status  — filter by live / early / announced / acquired
 *   stack_get_acquisitions  — 2025-2026 M&A deals with values
 *   stack_get_stats         — headline stats + vertical integration map
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data.json'), 'utf-8'));

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'stack_search_projects',
    description: `Search for projects in the Agent Payments Stack by name, description, or keyword.

Returns projects matching the query across all six layers (L0-L5).

Args:
  - query (string, required): Search term matched against project names and descriptions
  - limit (number, optional): Max results to return, 1-50 (default: 20)

Returns: JSON with count and array of matching projects including name, layer, status, url, description.

Examples:
  - "which projects support x402?" → query="x402"
  - "find wallet providers" → query="wallet"
  - "show me Coinbase products" → query="coinbase"`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to match against project names and descriptions'
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 20, max: 50)'
        }
      },
      required: ['query']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'stack_filter_by_layer',
    description: `Get all projects in a specific layer of the Agent Payments Stack.

Layer reference:
  L0 — Settlement: where transactions land (Base 119M txns, Solana 38.6M txns, Ethereum, Arbitrum, etc.)
  L1 — Wallet & Key Management: where agent keys live (Coinbase, Thirdweb, Safe, Fireblocks, etc.)
  L2 — Routing & Abstraction: cross-chain routing, bridging, swapping (Skyfire, Circle CCTP, Li.Fi, Uniswap, etc.)
  L3 — Payment Protocol: standards agents use to pay (x402, Tempo MPP, ACP, L402/Lightning, Interledger)
  L4 — Governance & Policy: spend controls and authorization (Ramp, Visa, Stripe SPTs, ERC-8004)
  L5 — Application: what agents buy (Virtuals Protocol, ElizaOS, Art Blocks, mint.day, Akash, Ocean Protocol)

Args:
  - layer (string, required): One of: L0, L1, L2, L3, L4, L5

Returns: JSON with layer metadata, project count, and full project list.`,
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          enum: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'],
          description: 'Layer ID — L0=Settlement, L1=Wallet, L2=Routing, L3=Protocol, L4=Governance, L5=Application'
        }
      },
      required: ['layer']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'stack_filter_by_status',
    description: `Get all projects with a specific maturity status across the Agent Payments Stack.

Status values:
  live      — Shipped and in production with demonstrated volume
  early     — Live but early-stage or limited access (e.g. testnets, invite-only)
  announced — Publicly announced, not yet shipped
  acquired  — Acquired and operating under parent company

Args:
  - status (string, required): One of: live, early, announced, acquired

Returns: JSON with count and array of matching projects from all layers.`,
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['live', 'early', 'announced', 'acquired'],
          description: 'Maturity status to filter by'
        }
      },
      required: ['status']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'stack_get_acquisitions',
    description: `Get the full list of acquisitions in the agent payments space (2025-2026).

Includes all M&A deals with acquirer, target, and deal value where public.
Use this to understand consolidation patterns and who owns what.

Notable deals: Brex ($5.15B by Capital One), BVNK ($1.8B by Mastercard),
Bridge ($1.1B by Stripe), Stargate ($120M by LayerZero),
Privy (by Stripe), Dynamic (by Fireblocks), ZeroDev (by Arbitrum).

Returns: JSON with count, period, and array of acquisition records.`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'stack_get_stats',
    description: `Get headline statistics, layer summary, and vertical integration data for the Agent Payments Stack.

Returns:
  - Volume stats: $43M in 9 months, ~$600M annualized, 140M transactions, 98.6% USDC
  - Total project count and per-layer breakdown
  - Vertical integration map: which companies span multiple layers
    (Coinbase and Stripe each cover L0-L4; Circle covers L0-L3)
  - Last updated date`,
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }
];

// ── Tool implementations ──────────────────────────────────────────────────────

function searchProjects(query, limit = 20) {
  const q = query.toLowerCase();
  const cap = Math.min(Math.max(1, limit), 50);
  const results = [];

  for (const layer of data.layers) {
    for (const project of layer.projects) {
      const hit =
        project.name.toLowerCase().includes(q) ||
        (project.description && project.description.toLowerCase().includes(q)) ||
        (project.metadata && project.metadata.toLowerCase().includes(q)) ||
        layer.id.toLowerCase() === q ||
        layer.name.toLowerCase().includes(q);

      if (hit) {
        results.push({
          name: project.name,
          layer: layer.id,
          layer_name: layer.name,
          status: project.status,
          ...(project.url ? { url: project.url } : {}),
          ...(project.description ? { description: project.description } : {}),
          ...(project.metadata ? { metadata: project.metadata } : {}),
          ...(project.acquirer ? { acquirer: project.acquirer } : {}),
          ...(project.acquisition_value ? { acquisition_value: project.acquisition_value } : {})
        });
      }
    }
  }

  return results.slice(0, cap);
}

function filterByLayer(layerId) {
  const layer = data.layers.find(l => l.id === layerId);
  if (!layer) return null;

  return {
    id: layer.id,
    name: layer.name,
    question: layer.question,
    count: layer.projects.length,
    projects: layer.projects.map(p => ({
      name: p.name,
      status: p.status,
      ...(p.url ? { url: p.url } : {}),
      ...(p.description ? { description: p.description } : {}),
      ...(p.metadata ? { metadata: p.metadata } : {}),
      ...(p.acquirer ? { acquirer: p.acquirer } : {}),
      ...(p.acquisition_value ? { acquisition_value: p.acquisition_value } : {})
    }))
  };
}

function filterByStatus(status) {
  const results = [];

  for (const layer of data.layers) {
    for (const project of layer.projects) {
      if (project.status === status) {
        results.push({
          name: project.name,
          layer: layer.id,
          layer_name: layer.name,
          ...(project.url ? { url: project.url } : {}),
          ...(project.description ? { description: project.description } : {}),
          ...(project.metadata ? { metadata: project.metadata } : {}),
          ...(project.acquirer ? { acquirer: project.acquirer } : {}),
          ...(project.acquisition_value ? { acquisition_value: project.acquisition_value } : {})
        });
      }
    }
  }

  return results;
}

function executeTool(name, args) {
  switch (name) {
    case 'stack_search_projects': {
      const query = (args.query ?? '').trim();
      if (!query) {
        throw new Error('query is required and must be a non-empty string. Example: { "query": "wallet" }');
      }
      const limit = args.limit ?? 20;
      const results = searchProjects(query, limit);
      if (results.length === 0) {
        return `No projects found matching "${query}". Try broader terms like "wallet", "protocol", "settlement", "x402", or a company name like "coinbase" or "stripe".`;
      }
      return JSON.stringify({ query, count: results.length, projects: results }, null, 2);
    }

    case 'stack_filter_by_layer': {
      const valid = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];
      const layer = args.layer;
      if (!valid.includes(layer)) {
        throw new Error(`Invalid layer "${layer}". Must be one of: ${valid.join(', ')}. Use stack_get_stats to see all layers.`);
      }
      return JSON.stringify(filterByLayer(layer), null, 2);
    }

    case 'stack_filter_by_status': {
      const valid = ['live', 'early', 'announced', 'acquired'];
      const status = args.status;
      if (!valid.includes(status)) {
        throw new Error(`Invalid status "${status}". Must be one of: ${valid.join(', ')}.`);
      }
      const results = filterByStatus(status);
      return JSON.stringify({ status, count: results.length, projects: results }, null, 2);
    }

    case 'stack_get_acquisitions': {
      return JSON.stringify({
        count: data.consolidation.length,
        period: '2025-2026',
        acquisitions: data.consolidation
      }, null, 2);
    }

    case 'stack_get_stats': {
      const totalProjects = data.layers.reduce((sum, l) => sum + l.projects.length, 0);
      return JSON.stringify({
        stats: data.stats,
        total_projects: totalProjects,
        layers: data.layers.map(l => ({ id: l.id, name: l.name, question: l.question, count: l.projects.length })),
        vertical_integration: data.vertical_integration,
        updated: data.updated,
        source: data.source
      }, null, 2);
    }

    default:
      throw new Error(`Unknown tool "${name}". Available tools: ${TOOLS.map(t => t.name).join(', ')}.`);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Send POST requests with JSON-RPC 2.0 body.' });
  }

  const { jsonrpc, id, method, params } = req.body ?? {};

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc field must be "2.0"' }
    });
  }

  // Notifications — no response body required
  if (typeof method === 'string' && method.startsWith('notifications/')) {
    return res.status(200).end();
  }

  switch (method) {
    case 'initialize':
      return res.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'agent-payments-stack-mcp-server',
            version: '1.0.0'
          }
        }
      });

    case 'tools/list':
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      });

    case 'tools/call': {
      const { name, arguments: args = {} } = params ?? {};

      if (!name) {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: 'Error: tool name is required in params.name' }]
          }
        });
      }

      try {
        const text = executeTool(name, args);
        return res.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text }] }
        });
      } catch (err) {
        return res.json({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error: ${err.message}` }]
          }
        });
      }
    }

    default:
      return res.status(200).json({
        jsonrpc: '2.0',
        id: id ?? null,
        error: {
          code: -32601,
          message: `Method not found: "${method}". Supported: initialize, tools/list, tools/call`
        }
      });
  }
}
