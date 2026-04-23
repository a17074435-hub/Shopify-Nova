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

  /* ── Force glass style on all dropdown panels ── */
  var PANEL_SEL = '.sorting-filter__options, .facets__panel-content';

  function applyPanelGlass(/** @type {Element} */ el) {
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
