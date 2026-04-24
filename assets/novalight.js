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

  /* ── Buy it now — subtle sparkles ── */
  (function () {
    var COLORS = [
      'rgba(255,255,255,0.95)',
      'rgba(200,150,255,0.90)',
      'rgba(168,85,247,0.85)',
    ];

    function spawnSpark(/** @type {HTMLElement} */ btn) {
      if (!btn.isConnected) return; // guard: button may have been removed from DOM
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
      setTimeout(function () { if (el.parentNode) el.remove(); }, parseFloat(dur) * 1000 + 120);
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

      // Clean up interval when button is removed from DOM (e.g. variant change, page transition)
      new MutationObserver(function(_m, self) {
        if (!btn.isConnected) { clearInterval(timer); self.disconnect(); }
      }).observe(btn.ownerDocument, { childList: true, subtree: false });
    }

    function initBuySparkles() {
      var BTN_SEL = '.shopify-payment-button__button--unbranded, button.shopify-payment-button__button';
      var raw = document.querySelector(BTN_SEL);
      if (raw) { attachSparkles(/** @type {HTMLElement} */ (raw)); return; }

      // Button loads async — scope observer to product form, not entire body
      var formRoot = document.querySelector('product-form, .product-details, [data-product-form]') || document.body;
      var obs = new MutationObserver(function() {
        var found = document.querySelector(BTN_SEL);
        if (found) {
          obs.disconnect();
          attachSparkles(/** @type {HTMLElement} */ (found));
        }
      });
      obs.observe(formRoot, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBuySparkles);
    } else {
      initBuySparkles();
    }
  })();

  /* ── Mobile pill wrapper ──
     buildPill() moves header-menu / search-action / header-actions into a floating
     pill div at the bottom of the screen.  A separate 'cart:update' listener
     (below init) manually replaces the header-actions in the pill with fresh HTML
     from the cart response — necessary because Radiant's morphSection(hydrationMode)
     skips elements that are no longer inside #shopify-section-header.

     Desktop restore: on resize to ≥750px, origins[] is used to put elements back
     in their original header positions before removing the pill.  If a full section
     re-render already placed fresh copies in the header, the pill elements are
     treated as stale orphans and simply discarded.
  ── */
  (function () {
    var pill = /** @type {HTMLElement|null} */ (null);
    /** @type {{el:Element, parent:Element, next:Element|null}[]} */
    var origins = [];

    function buildPill() {
      // ── Desktop: restore elements, destroy pill ──────────────────────────
      if (window.innerWidth > 749) {
        if (!pill) return;

        // If header already has fresh elements (from an AJAX re-render), those are
        // the current source of truth — the ones in the pill are stale orphans.
        var hasFreshInHeader = !!(
          document.querySelector('#header-component header-actions') ||
          document.querySelector('#header-component .header-menu')
        );

        if (!hasFreshInHeader) {
          // Header is empty because elements were moved to the pill and no re-render
          // occurred. Restore them to their original positions before removing the pill.
          origins.forEach(function (o) {
            if (!o.parent.isConnected) return;
            if (o.next && o.next.isConnected && o.next.parentNode === o.parent) {
              o.parent.insertBefore(o.el, o.next);
            } else {
              o.parent.appendChild(o.el);
            }
          });
        }

        origins.length = 0;
        pill.remove();
        pill = null;
        return;
      }

      // ── Mobile: create/refresh pill ──────────────────────────────────────
      if (!pill) {
        pill = document.createElement('div');
        pill.id = 'nova-pill';
        document.body.appendChild(pill);
      }

      // Only rebuild when the header has fresh elements from a section re-render.
      // If the pill already holds elements and the header is empty, those elements
      // are the only live copies — clearing the pill would orphan them.
      var hasFreshInHeader = !!(
        document.querySelector('#header-component header-actions') ||
        document.querySelector('#header-component .header-menu')
      );
      if (pill.firstChild && !hasFreshInHeader) return;

      // Wipe stale elements (orphaned from previous section render).
      while (pill.firstChild) pill.removeChild(pill.firstChild);
      origins.length = 0;

      var menu    = document.querySelector('#header-component .header-menu');
      var search  = document.querySelector('.search-action');
      var actions = document.querySelector('header-actions');
      if (!menu && !actions) return;

      // Capture original DOM positions before moving.
      [menu, search, actions].forEach(function (el) {
        if (el) origins.push({ el: el, parent: /** @type {Element} */ (el.parentNode), next: el.nextElementSibling });
      });

      if (menu)    pill.appendChild(menu);
      if (search)  pill.appendChild(search);
      if (actions) pill.appendChild(actions);
    }

    function init() {
      buildPill();

      // Re-run when header section re-renders (AJAX cart add/remove updates it).
      var headerSection =
        document.getElementById('shopify-section-header') ||
        document.querySelector('[id^="shopify-section"][id*="header"]');
      if (headerSection) {
        new MutationObserver(function (mutations) {
          if (window.innerWidth > 749) return;
          var hasNewNodes = mutations.some(function (m) { return m.addedNodes.length > 0; });
          if (hasNewNodes) buildPill();
        }).observe(headerSection, { childList: true });
      }

      // Rebuild on viewport resize (desktop ↔ mobile).
      var resizeTimer = /** @type {ReturnType<typeof setTimeout>} */ (0);
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(buildPill, 150);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    /* ── Cart sync: replace stale header-actions in pill after cart updates ──
       When header-actions is in #nova-pill, Radiant's morphSection(hydrationMode)
       can't find data-hydration-key="cart-drawer-inner" (it's in the pill, not the
       header section). We intercept 'cart:update' — the same event that morphSection
       reads — and manually swap the stale header-actions for the fresh one from the
       sections response. Both product-form adds AND cart-items quantity changes fire
       this event with sections data, so all cart mutations are covered.
    ── */
    document.addEventListener('cart:update', function (event) {
      if (window.innerWidth > 749 || !pill) return;
      var data = event.detail && event.detail.data;
      var sections = data && data.sections;
      if (!sections || typeof sections !== 'object') return;

      // Derive section ID from the section wrapper's DOM id ("shopify-section-header" → "header")
      var headerSectionEl = document.getElementById('shopify-section-header') ||
        document.querySelector('[id^="shopify-section"][id*="header"]');
      if (!headerSectionEl) return;
      var sectionId = headerSectionEl.id.replace('shopify-section-', '');
      var sectionHtml = sections[sectionId];
      if (!sectionHtml) return;

      // Parse fresh HTML and extract header-actions
      var doc = new DOMParser().parseFromString(sectionHtml, 'text/html');
      var freshActions = doc.querySelector('header-actions');
      if (!freshActions) return;

      // Swap — disconnectedCallback cleans up the old, connectedCallback wires up the new
      var staleActions = pill.querySelector('header-actions');
      if (staleActions) {
        pill.replaceChild(freshActions, staleActions);
        // Update origins so the desktop-restore path re-inserts the fresh element, not the stale one
        for (var i = 0; i < origins.length; i++) {
          if (origins[i].el === staleActions) { origins[i].el = freshActions; break; }
        }
      }
    });
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

    // Batch all mutations through rAF to prevent cascading layout thrash
    // during rapid DOM changes (cart re-renders, AJAX section updates).
    var rafId = /** @type {number|null} */ (null);
    var pendingNodes = /** @type {Element[]} */ ([]);

    function processPending() {
      rafId = null;
      var nodes = pendingNodes.splice(0);
      nodes.forEach(function (node) {
        if (!(node instanceof Element)) return;
        if (node.matches(PANEL_SEL)) applyPanelGlass(node);
        node.querySelectorAll(PANEL_SEL).forEach(applyPanelGlass);
      });
    }

    new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        // Skip mutations inside the cart dialog or pill — no PANEL_SEL elements live there
        // and cart morphSection causes hundreds of mutations that would otherwise thrash mobile.
        var t = m.target;
        if (t instanceof Element && (t.closest('.cart-drawer__dialog') || t.closest('#nova-pill'))) return;
        m.addedNodes.forEach(function(node) {
          if (node instanceof Element) pendingNodes.push(node);
        });
      });
      if (rafId === null) rafId = requestAnimationFrame(processPending);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanelGlass);
  } else {
    initPanelGlass();
  }
})();
