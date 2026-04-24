// NovaLight — scroll reveal + product description toggle

(function () {
  /* ── Scroll reveal ── */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('nova-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    function initReveal() {
      document.querySelectorAll('.shopify-section').forEach((section) => {
        if (section === document.querySelector('.shopify-section:first-child')) return;
        section.classList.add('nova-reveal');
        observer.observe(section);
      });
      document.querySelectorAll('.product-list .resource-list, .product-list .resource-grid').forEach((grid) => {
        grid.classList.add('nova-reveal-children');
        observer.observe(grid);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initReveal);
    } else {
      initReveal();
    }
  }

  /* ── Sticky header compositing fix ──
     Radiant's opacity:0→1 on .header[data-sticky-state] creates a GPU
     transparency group that traps children's backdrop-filter.
     Override: force opacity:1 + no transition via inline style (beats all CSS).
  ── */
  (function() {
    var raw = document.querySelector('.header[data-sticky-state]');
    if (!raw) {
      var comp = document.getElementById('header-component') || document.querySelector('header-component');
      if (comp) raw = comp.querySelector('.header[data-sticky-state]');
    }
    if (!raw) return;
    var hdr = /** @type {HTMLElement} */ (raw);

    function lockOpacity(/** @type {HTMLElement} */ el) {
      el.style.setProperty('opacity',     '1',    'important');
      el.style.setProperty('transition',  'none', 'important');
      el.style.setProperty('will-change', 'auto', 'important');
    }
    lockOpacity(hdr);

    new MutationObserver(function() { lockOpacity(hdr); })
      .observe(hdr, { attributes: true });
  })();

  /* ── Product description collapsible ── */
  function initDescToggle() {
    // Radiant v3.5.1: product description renders as rte-formatter.rte inside .product-details
    // Also catch .text-block.rte as fallback
    const container = document.querySelector('.product-details');
    if (!container) return;

    const targets = [
      ...container.querySelectorAll('rte-formatter.rte'),
      ...container.querySelectorAll('.text-block.rte'),
    ];

    // deduplicate (rte-formatter also has .rte class so could match both)
    const seen = new Set();
    const unique = targets.filter((el) => {
      if (seen.has(el)) return false;
      seen.add(el);
      return true;
    });

    unique.forEach((desc) => {
      if (desc.closest('.nova-desc-wrap')) return;
      if (!desc.textContent.trim()) return;
      // No envolver bloques que contengan precio — deben estar siempre visibles
      if (desc.querySelector('.price, .price-item, price-money, .price__current')) return;

      const wrap = document.createElement('div');
      wrap.className = 'nova-desc-wrap';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nova-desc-btn';
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span>Product details</span><i class="nova-chev" aria-hidden="true">&#8964;</i>';

      const body = document.createElement('div');
      body.className = 'nova-desc-body';
      const inner = document.createElement('div');

      if (!desc.parentNode) return;
      desc.parentNode.insertBefore(wrap, desc);
      inner.appendChild(desc);
      body.appendChild(inner);
      wrap.appendChild(btn);
      wrap.appendChild(body);

      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        body.classList.toggle('nova-open', !expanded);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDescToggle);
  } else {
    initDescToggle();
  }

  /* ── Buy it now — estrellitas sutiles ── */
  (function () {
    var COLORS = [
      'rgba(255,255,255,0.95)',
      'rgba(200,150,255,0.90)',
      'rgba(168,85,247,0.85)',
    ];

    function spawnSpark(/** @type {HTMLElement} */ btn) {
      var el = document.createElement('span');
      var size = 2 + Math.random() * 3.5;
      var color = COLORS[Math.floor(Math.random() * COLORS.length)];
      var dur   = (0.65 + Math.random() * 0.55).toFixed(2);
      var dx    = (Math.random() * 10 - 5).toFixed(1);
      el.className = 'nova-buy-spark';
      el.style.cssText =
        'width:'  + size.toFixed(1) + 'px;' +
        'height:' + size.toFixed(1) + 'px;' +
        'left:'   + (8 + Math.random() * 84).toFixed(1) + '%;' +
        'top:'    + (20 + Math.random() * 60).toFixed(1) + '%;' +
        'background:' + color + ';' +
        'box-shadow:0 0 ' + (size * 1.8).toFixed(1) + 'px ' + color + ';' +
        '--dur:' + dur + 's;' +
        '--sx:'  + dx + 'px;';
      btn.appendChild(el);
      setTimeout(function () { el.remove(); }, parseFloat(dur) * 1000 + 120);
    }

    function attachSparkles(/** @type {HTMLElement} */ btn) {
      btn.style.setProperty('overflow', 'visible', 'important');
      btn.style.setProperty('position', 'relative', 'important');

      /** @type {ReturnType<typeof setInterval>} */ var timer;
      function startSlow() { clearInterval(timer); timer = setInterval(function(){ spawnSpark(btn); }, 850); }
      function startFast() { clearInterval(timer); timer = setInterval(function(){ spawnSpark(btn); spawnSpark(btn); }, 180); }

      startSlow();
      btn.addEventListener('mouseenter', startFast);
      btn.addEventListener('mouseleave', startSlow);
    }

    function initBuySparkles() {
      var BTN_SEL = '.shopify-payment-button__button--unbranded, button.shopify-payment-button__button';
      var raw = document.querySelector(BTN_SEL);
      if (raw) { attachSparkles(/** @type {HTMLElement} */ (raw)); return; }

      /* El botón carga de forma asíncrona — esperarlo con MutationObserver */
      var obs = new MutationObserver(function() {
        var found = document.querySelector(BTN_SEL);
        if (found) {
          obs.disconnect();
          attachSparkles(/** @type {HTMLElement} */ (found));
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBuySparkles);
    } else {
      initBuySparkles();
    }
  })();

  /* ── Mobile pill wrapper ── */
  (function () {
    function buildPill() {
      if (window.innerWidth > 749) return;
      if (document.getElementById('nova-pill')) return;

      var menu    = document.querySelector('#header-component .header-menu');
      var search  = document.querySelector('.search-action');
      var actions = document.querySelector('header-actions');
      if (!menu && !actions) return;

      var pill = document.createElement('div');
      pill.id = 'nova-pill';
      document.body.appendChild(pill);
      if (menu)    pill.appendChild(menu);
      if (search)  pill.appendChild(search);
      if (actions) pill.appendChild(actions);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildPill);
    } else {
      buildPill();
    }
  })();

  /* ── Force glass style on all dropdown panels ── */
  var PANEL_SEL = '.sorting-filter__options, .facets__panel-content';

  function applyPanelGlass(/** @type {Element} */ el) {
    // Inside the filter drawer, .facets__panel-content is accordion body content, NOT a floating popup.
    // Applying popup glass there makes the price/availability sections look broken.
    if (el.classList.contains('facets__panel-content') && el.closest('.facets-drawer__filters')) {
      return;
    }
    var s = /** @type {HTMLElement} */ (el).style;
    s.setProperty('background',              'rgba(20,6,55,0.92)', 'important');
    s.setProperty('background-color',        'rgba(20,6,55,0.92)', 'important');
    s.setProperty('backdrop-filter',         'blur(32px) saturate(1.5)', 'important');
    s.setProperty('-webkit-backdrop-filter', 'blur(32px) saturate(1.5)', 'important');
    s.setProperty('border',                  '1px solid rgba(168,85,247,0.30)', 'important');
    s.setProperty('border-radius',           '16px', 'important');
    s.setProperty('box-shadow',              '0 16px 48px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)', 'important');
    s.setProperty('color',                   'rgba(255,255,255,0.85)', 'important');
  }

  function initPanelGlass() {
    document.querySelectorAll(PANEL_SEL).forEach(applyPanelGlass);

    new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (!(node instanceof Element)) return;
          if (node.matches(PANEL_SEL)) applyPanelGlass(node);
          node.querySelectorAll(PANEL_SEL).forEach(applyPanelGlass);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanelGlass);
  } else {
    initPanelGlass();
  }
})();
