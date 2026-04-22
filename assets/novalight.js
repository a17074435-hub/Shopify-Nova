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
    // Radiant product description selectors (covers common Radiant markup patterns)
    const descSelectors = [
      '.product__description',
      '.product-description',
      '[data-product-description]',
      '.product__info-container .rte',
    ];

    descSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((desc) => {
        if (desc.closest('.nova-desc-wrap')) return; // already wrapped
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDescToggle);
  } else {
    initDescToggle();
  }
})();
