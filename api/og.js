/**
 * /api/og — Dynamic OG image generator for project pages
 * Edge runtime. Accepts query params: name, layer, status, desc, slug
 * Returns a 1200x630 PNG styled to match the APS aesthetic.
 */

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const STATUS_COLOR = {
  live:      '#4ade80',
  early:     '#c99e32',
  announced: '#685e58',
  acquired:  '#d9613f',
};

const LAYER_LABELS = {
  L0: 'Settlement & Rails',
  L1: 'Wallets & Identity',
  L2: 'Routing & Abstraction',
  L3: 'Payment Protocol',
  L4: 'Governance & Policy',
  L5: 'Application',
};

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const name   = searchParams.get('name')   || 'Unknown Project';
  const layer  = searchParams.get('layer')  || '';
  const status = searchParams.get('status') || 'announced';
  const desc   = searchParams.get('desc')   || '';

  const statusColor = STATUS_COLOR[status] || STATUS_COLOR.announced;
  const layerLabel  = layer ? `${layer} · ${LAYER_LABELS[layer] || ''}` : '';
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          background: '#0d0c0b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          fontFamily: 'monospace',
          position: 'relative',
        },
        children: [
          // Top: eyebrow + status
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: '#685e58',
                    },
                    children: 'AGENT PAYMENTS STACK',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '1px',
                      height: '14px',
                      background: '#201e1b',
                    },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: statusColor,
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '13px',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: statusColor,
                          },
                          children: statusLabel,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // Middle: project name + description
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '18px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: name.length > 20 ? '64px' : '80px',
                      fontWeight: 700,
                      letterSpacing: '-1px',
                      color: '#edebe7',
                      lineHeight: 1.0,
                    },
                    children: name,
                  },
                },
                desc
                  ? {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '22px',
                          color: '#98948f',
                          lineHeight: 1.45,
                          maxWidth: '860px',
                        },
                        children: desc.length > 120 ? desc.slice(0, 117) + '...' : desc,
                      },
                    }
                  : null,
              ].filter(Boolean),
            },
          },

          // Bottom: layer badge + URL
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              },
              children: [
                layerLabel
                  ? {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '13px',
                          fontWeight: 600,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#685e58',
                          background: '#201e1b',
                          padding: '6px 14px',
                          borderRadius: '4px',
                        },
                        children: layerLabel,
                      },
                    }
                  : { type: 'div', props: {} },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '14px',
                      color: '#524e49',
                      letterSpacing: '0.04em',
                    },
                    children: 'agentpaymentsstack.com',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: 1200, height: 630 }
  );
}
