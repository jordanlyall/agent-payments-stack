#!/usr/bin/env python3
"""
Migrate all HTML pages to use shared nav.js.
Replaces hardcoded <nav class="topbar">...</nav> + mob-menu div
with empty placeholder elements + <script src="/nav.js"></script>.
Also removes inline nav toggle JS (More dropdown + mobile menu IIFEs).
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

PAGES = [
    'index.html', 'about.html', 'acquisitions.html', 'api.html',
    'apv.html', 'compare.html', 'data.html', 'graph.html',
    'hackathons.html', 'history.html', 'projects.html',
    'rankings.html', 'trace.html',
]

# Replacement block inserted after stripping both nav elements
NAV_PLACEHOLDER = '<nav class="topbar" id="topbar"></nav>\n<div class="mob-menu" id="mob-menu"></div>\n<script src="/nav.js"></script>'


def strip_nav_html(text):
    """Remove <nav class="topbar">...</nav> and mob-menu div."""
    # Strip <nav class="topbar"> ... </nav>
    text = re.sub(
        r'<nav class="topbar"[^>]*>.*?</nav>',
        '__NAV_PLACEHOLDER__',
        text,
        flags=re.DOTALL
    )
    # Strip <div class="mob-menu" ...> ... </div>  (no nested divs inside)
    text = re.sub(
        r'<div class="mob-menu"[^>]*>.*?</div>',
        '',
        text,
        flags=re.DOTALL
    )
    # Replace placeholder marker with final block
    text = text.replace('__NAV_PLACEHOLDER__', NAV_PLACEHOLDER)
    return text


def strip_nav_js(text):
    """Remove inline nav toggle JS blocks (More dropdown + mobile menu IIFEs)."""
    # Remove '// More dropdown' IIFE block
    text = re.sub(
        r'\s*//\s*More dropdown\s*\(function\(\)\{.*?\}\(\)\);',
        '',
        text,
        flags=re.DOTALL
    )
    # Remove '// Mobile menu toggle' IIFE block (various comment styles)
    text = re.sub(
        r'\s*//\s*Mobile menu(?: toggle)?\s*\(function\(\)\{.*?\}\(\)\);',
        '',
        text,
        flags=re.DOTALL
    )
    # Remove standalone nav-more/mob-menu-btn wiring that doesn't use comment headers
    # Pattern: (function(){ var more = ... }()); or (function(){ var btn = document.getElementById('mob-menu-btn') ... }());
    text = re.sub(
        r'\(function\(\)\{\s*var more\s*=\s*document\.getElementById\(\'nav-more\'\).*?\}\(\)\);',
        '',
        text,
        flags=re.DOTALL
    )
    text = re.sub(
        r'\(function\(\)\{\s*var btn\s*=\s*document\.getElementById\(\'mob-menu-btn\'\).*?\}\(\)\);',
        '',
        text,
        flags=re.DOTALL
    )
    return text


def migrate(path):
    original = path.read_text(encoding='utf-8')
    result = original

    result = strip_nav_html(result)
    result = strip_nav_js(result)

    if result == original:
        print(f'  SKIP (no changes): {path.name}')
        return

    path.write_text(result, encoding='utf-8')
    print(f'  OK: {path.name}')


def main():
    print('Migrating nav to shared nav.js...\n')
    for name in PAGES:
        p = ROOT / name
        if not p.exists():
            print(f'  MISSING: {name}')
            continue
        migrate(p)
    print('\nDone. Review changes with: git diff')


if __name__ == '__main__':
    main()
