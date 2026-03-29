/**
 * /api/og — Dynamic OG image generator
 * Matches the APS project page aesthetic exactly.
 * Edge runtime. Params: name, layer, status, desc
 */

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const STATUS_COLOR = {
  live:      '#3d9e5f',
  early:     '#c99e32',
  announced: '#524e49',
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

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const name   = searchParams.get('name')   || 'Unknown Project';
  const layer  = searchParams.get('layer')  || '';
  const status = searchParams.get('status') || 'announced';
  const desc   = searchParams.get('desc')   || '';

  const statusColor = STATUS_COLOR[status] || STATUS_COLOR.announced;
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const layerName   = LAYER_LABELS[layer] || '';

  // Load fonts
  const [serifFont, monoFont] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/dmseriftext/v12/FeVQS0BTqb0h60ACL5la2bxii28wYQ.woff').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/jetbrainsmono/v20/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjOVmNeaAL.woff').then(r => r.arrayBuffer()),
  ]);

  const truncDesc = desc.length > 110 ? desc.slice(0, 107) + '...' : desc;
  const fontSize  = name.length > 22 ? 72 : name.length > 14 ? 86 : 100;

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
          padding: '64px 80px 56px',
          position: 'relative',
        },
        children: [

          // Top row: APS wordmark + status badge
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: '"JetBrains Mono"',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: '#685e58',
                    },
                    children: 'Agent Payments Stack',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      background: '#201e1b',
                      border: `1px solid ${statusColor}33`,
                      borderRadius: '4px',
                      padding: '5px 12px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: statusColor,
                            flexShrink: 0,
                          },
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontFamily: '"JetBrains Mono"',
                            fontSize: '11px',
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
              style: { display: 'flex', flexDirection: 'column', gap: '16px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: '"DM Serif Display"',
                      fontSize: `${fontSize}px`,
                      fontWeight: 400,
                      letterSpacing: '-1.5px',
                      color: '#edebe7',
                      lineHeight: 1.0,
                    },
                    children: name,
                  },
                },
                truncDesc
                  ? {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '20px',
                          color: '#98948f',
                          lineHeight: 1.5,
                          maxWidth: '820px',
                          fontFamily: 'sans-serif',
                        },
                        children: truncDesc,
                      },
                    }
                  : null,
              ].filter(Boolean),
            },
          },

          // Bottom: layer strip + URL
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
              children: [
                layer
                  ? {
                      type: 'div',
                      props: {
                        style: { display: 'flex', alignItems: 'stretch' },
                        children: ['L0','L1','L2','L3','L4','L5'].map((l) => ({
                          type: 'div',
                          props: {
                            style: {
                              fontFamily: '"JetBrains Mono"',
                              fontSize: '9px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: l === layer ? '#edebe7' : '#685e58',
                              background: l === layer ? 'rgba(255,255,255,0.06)' : 'transparent',
                              border: `1px solid ${l === layer ? 'rgba(255,255,255,0.14)' : '#201e1b'}`,
                              borderRight: l === 'L5' ? `1px solid ${l === layer ? 'rgba(255,255,255,0.14)' : '#201e1b'}` : 'none',
                              padding: '5px 10px',
                              whiteSpace: 'nowrap',
                            },
                            children: l === layer ? `${l} · ${layerName}` : l,
                          },
                        })),
                      },
                    }
                  : { type: 'div', props: {} },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: '"JetBrains Mono"',
                      fontSize: '12px',
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
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'DM Serif Display', data: serifFont, weight: 400, style: 'normal' },
        { name: 'JetBrains Mono',   data: monoFont,  weight: 600, style: 'normal' },
      ],
    }
  );
}
