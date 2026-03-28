# APS Front Page Hero Redesign

**Date:** 2026-03-28
**Status:** Approved
**Scope:** `index.html` hero section only — filter bar, stack layers, and all other pages unchanged.

---

## Problem

The current front page hero is a directory header: title, one-line deck, data strip, newsletter form. It reads as a list, not a hub. Two signals are buried that should be leading: (1) tracked volume ($43M), which makes the space feel real, and (2) the M&A wave ($8.05B), which makes it feel urgent. Neither audience — developers or analysts — gets immediate orientation about why this is the resource to bookmark.

---

## Design

### Layout

Two-column grid. Left column: editorial identity. Right column: two stat cards.

```
┌─────────────────────────────────┬──────────────────┐
│ EYEBROW                         │ ┌──────────────┐ │
│ Headline                        │ │ Volume card  │ │
│ Headline                        │ └──────────────┘ │
│                                 │ ┌──────────────┐ │
│ Deck copy                       │ │  M&A card    │ │
│                                 │ └──────────────┘ │
│ pills                           │                  │
└─────────────────────────────────┴──────────────────┘
[ filter bar ]
[ newsletter one-liner ]
[ recently added strip ]
[ stack layers... ]
```

On mobile (< 900px): right column stacks below left column.

---

### Copy

**Eyebrow** (JetBrains Mono, 8.5px, muted, uppercase):
`Agent Payments Infrastructure`

**Headline** (Space Grotesk, 26px, 700, –0.8px tracking):
*The canonical map of AI agent payment rails*

**Deck** (Space Grotesk, 12.5px, secondary, 1.65 line-height):
*162 projects across 6 layers — from Stripe and Mastercard buying in, to new protocols being built from scratch. Every piece of the stack for agentic commerce, tracked and curated as the space moves.*

**Pills** (JetBrains Mono, 9px, muted, faint border):
`162 projects` · `6 layers` · `98.6% USDC` · `Updated Mar 2026`

The project count pill (`162 projects`) should be driven by the existing `hero-count` id so it stays in sync with the JS that updates it dynamically.

---

### Stat Cards (right column)

**Card 1 — Volume:**
- Label: `Tracked volume · 9mo`
- Value: `$43M` (JetBrains Mono, 26px, 600)
- Sub: `~$600M annualized · 140M txns`
- Style: standard card (faint border, rgba bg)

**Card 2 — M&A:**
- Label: `M&A activity · 18mo`
- Value: `$8.05B` (acq color: `#d9613f`)
- Sub: `7 deals · Stripe, Capital One, Mastercard`
- Link: `View all acquisitions →` (links to `/acquisitions`, acq color, 9px mono)
- Style: acq-tinted card (rgba(217,97,63,0.04) bg, rgba(217,97,63,0.2) border)

Both cards use the existing card pattern from `rankings.html` / `acquisitions.html` for visual consistency.

---

### Newsletter (below filter bar)

Replace the current `hdr-right` newsletter block. Move to a slim row between the filter bar and the recently-added strip.

**Layout:** Single flex row, left-aligned.
**Label:** `Weekly updates` (mono, 9px, muted)
**Input:** email input, placeholder `your@email.com`
**Button:** `Subscribe`
**Success state:** inline text replacing button (existing behavior)

Keep existing form id `nsf`, input id `nse`, button id `nsb`, message span `sub-msg` — the existing JS submit handler works as-is.

---

## What Changes in index.html

1. **Remove** `.hdr-right` block (newsletter form in hero)
2. **Replace** `.hdr` inner HTML with new two-column layout
3. **Add** `.hdr-cards` CSS for the right-column stat cards
4. **Add** `.hero-newsletter` CSS + HTML row below `.filter-bar`
5. **Update** responsive breakpoint for the new grid

## What Does NOT Change

- Filter bar markup and behavior
- Recently-added strip
- Stack layer sections
- All other pages
- Nav, footer, data sync scripts

---

## CSS Classes to Add

```
.hdr                   → change from flex row to grid (1fr 260px), gap 40px
.hdr-left              → no change needed (existing)
.hdr-cards             → new: flex-direction column, gap 10px
.hdr-card              → new: stat card shell
.hdr-card.acq          → new: acq-tinted variant
.hdr-card-label        → new: mono, 8.5px, uppercase, muted
.hdr-card-val          → new: mono, 26px, 600, –1px tracking
.hdr-card-sub          → new: 11px, secondary
.hdr-card-link         → new: mono, 9px, acq color, block
.hero-eyebrow          → new: mono, 8.5px, muted, uppercase, mb 10px
.hero-newsletter       → new: flex row, gap 8px, padding 12px 0, border-top faint
.hero-nl-label         → new: mono, 9px, muted
```

Existing `.hdr h1`, `.deck`, `.data-strip` classes get replaced by new markup. The `.data-strip` pattern becomes pills using existing `.pill` / `.tag` class patterns.

---

## Responsive

At `max-width: 900px`:
- `.hdr` → `grid-template-columns: 1fr` (cards stack below)
- `.hdr-cards` → `flex-direction: row; flex-wrap: wrap` (cards side-by-side on tablet)
- At `max-width: 560px`: `.hdr-cards` → `flex-direction: column`
