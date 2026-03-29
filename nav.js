/**
 * nav.js — Shared navigation for Agent Payments Stack
 * Each page uses: <nav class="topbar" id="topbar"></nav>
 *                 <div class="mob-menu" id="mob-menu"></div>
 *                 <script src="/nav.js"></script>
 */
(function () {
  var path = window.location.pathname;
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);

  // ── Inject nav CSS (styles shared across all pages) ─────────────────────

  if (!document.getElementById('nav-styles')) {
    var style = document.createElement('style');
    style.id = 'nav-styles';
    // Using textContent avoids any HTML injection risk
    style.textContent = [
      '.nav-more{position:relative}',
      '.nav-more-btn{background:none;border:none;cursor:pointer;padding:0;font-family:inherit;font-size:11.5px;color:var(--muted,#685e58);letter-spacing:0;transition:color 0.12s}',
      '.nav-more-btn:hover{color:var(--secondary,#98948f)}',
      '.nav-more-btn::after{content:"\\25BE";font-size:9px;opacity:0.6;margin-left:3px}',
      '.nav-more-drop{display:none;position:absolute;top:calc(100% + 8px);right:0;background:var(--bg,#0d0c0b);border:1px solid var(--faint,#201e1b);border-radius:4px;padding:6px 0;min-width:130px;z-index:200}',
      '.nav-more-drop a{display:block;padding:7px 14px;font-size:11.5px;color:var(--muted,#685e58);text-decoration:none;white-space:nowrap;transition:color 0.12s}',
      '.nav-more-drop a:hover{color:var(--text,#edebe7)}',
      '.nav-more.open .nav-more-drop{display:block}',
      '.mob-menu-btn{display:none;background:none;border:none;cursor:pointer;padding:6px;color:var(--text,#edebe7);line-height:0}',
      '.mob-menu-btn .icon-ham{display:block}',
      '.mob-menu-btn .icon-x{display:none}',
      '.mob-menu-btn.open .icon-ham{display:none}',
      '.mob-menu-btn.open .icon-x{display:block}',
      '.mob-menu{display:none;flex-direction:column;background:var(--bg,#0d0c0b);border-bottom:1px solid var(--faint,#201e1b);padding:8px 0;position:sticky;top:50px;z-index:99}',
      '.mob-menu.open{display:flex}',
      '.mob-menu a{padding:11px 24px;font-size:13px;color:var(--muted,#685e58);text-decoration:none;border-bottom:1px solid var(--faint,#201e1b)}',
      '.mob-menu a:first-child{border-top:1px solid var(--faint,#201e1b)}',
      '.mob-menu a:hover{color:var(--text,#edebe7)}',
      '.mob-menu a.tl-active{color:var(--text,#edebe7)}',
      '@media(max-width:768px){.topbar-links{display:none!important}.mob-menu-btn{display:flex!important;align-items:center}}'
    ].join('');
    document.head.appendChild(style);
  }

  // ── DOM helpers ──────────────────────────────────────────────────────────

  function el(tag, attrs) {
    var node = document.createElement(tag);
    for (var k in attrs) {
      if (k === 'text') { node.textContent = attrs[k]; }
      else              { node.setAttribute(k, attrs[k]); }
    }
    return node;
  }

  function svgIcon(className, paths) {
    var NS  = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('width',   '20');
    svg.setAttribute('height',  '20');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill',    'none');
    paths.forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d',                d);
      p.setAttribute('stroke',           'currentColor');
      p.setAttribute('stroke-width',     '1.5');
      p.setAttribute('stroke-linecap',   'round');
      svg.appendChild(p);
    });
    return svg;
  }

  function navLink(href, label, opts) {
    opts = opts || {};
    var a = el('a', { href: href, text: label });
    if (opts.external) a.setAttribute('target', '_blank');
    if (href === '/' ? path === '/' : path === href) a.className = 'tl-active';
    return a;
  }

  function append(parent) {
    var nodes = Array.prototype.slice.call(arguments, 1);
    nodes.forEach(function (n) { parent.appendChild(n); });
    return parent;
  }

  // ── Build desktop topbar ─────────────────────────────────────────────────

  var topbar = document.getElementById('topbar');
  if (topbar) {
    var links = el('div', { class: 'topbar-links' });

    append(links,
      navLink('/', 'Stack'),
      navLink('/data', 'Data'),
      navLink('/rankings', 'Rankings'),
      navLink('/acquisitions', 'Acquisitions'),
      navLink('/apv', 'APV'),
      navLink('/compare', 'Compare'),
      navLink('/api', 'API'),
      navLink('/about', 'About')
    );

    // More dropdown
    var moreDrop = el('div', { class: 'nav-more-drop' });
    append(moreDrop,
      navLink('/graph',      'Graph'),
      navLink('/history',    'History'),
      navLink('/trace',      'Trace'),
      navLink('/hackathons', 'Hackathons')
    );

    var moreBtn = el('button', {
      class: 'nav-more-btn',
      id:    'nav-more-btn',
      text:  'More'
    });
    var moreWrap = el('div', { class: 'nav-more', id: 'nav-more' });
    append(moreWrap, moreBtn, moreDrop);
    links.appendChild(moreWrap);

    links.appendChild(navLink('https://tally.so/r/rjVvd5', 'Submit \u2197', { external: true }));

    var mobBtn = el('button', {
      class:           'mob-menu-btn',
      id:              'mob-menu-btn',
      'aria-label':    'Menu',
      'aria-expanded': 'false'
    });
    append(mobBtn,
      svgIcon('icon-ham', ['M3 5h14M3 10h14M3 15h14']),
      svgIcon('icon-x',   ['M5 5l10 10M15 5L5 15'])
    );

    var right = el('div', { class: 'topbar-right' });
    append(right, links, mobBtn);

    var logo = el('a', { href: '/', class: 'topbar-logo', text: 'AGENT PAYMENTS STACK' });
    append(topbar, logo, right);
  }

  // ── Build mobile menu ────────────────────────────────────────────────────

  var mobMenu = document.getElementById('mob-menu');
  if (mobMenu) {
    append(mobMenu,
      navLink('/', 'Stack'),
      navLink('/data', 'Data'),
      navLink('/rankings', 'Rankings'),
      navLink('/acquisitions', 'Acquisitions'),
      navLink('/apv', 'APV'),
      navLink('/compare', 'Compare'),
      navLink('/api', 'API'),
      navLink('/about', 'About'),
      navLink('/graph', 'Graph'),
      navLink('/history', 'History'),
      navLink('/trace', 'Trace'),
      navLink('/hackathons', 'Hackathons'),
      navLink('https://tally.so/r/rjVvd5', 'Submit \u2197', { external: true })
    );
  }

  // ── Dropdown toggle ──────────────────────────────────────────────────────

  (function () {
    var more = document.getElementById('nav-more');
    var btn  = document.getElementById('nav-more-btn');
    if (!more || !btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      more.classList.toggle('open');
    });
    document.addEventListener('click', function () {
      more.classList.remove('open');
    });
  }());

  // ── Mobile menu toggle ───────────────────────────────────────────────────

  (function () {
    var btn  = document.getElementById('mob-menu-btn');
    var menu = document.getElementById('mob-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }());
}());
