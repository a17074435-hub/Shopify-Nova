// NovaLight — scroll reveal animations
// Safe: only adds/removes CSS classes, no Shopify functionality touched.

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

  function init() {
    document.querySelectorAll('.shopify-section').forEach((section) => {
      // Skip the first section (hero) — it should be visible immediately
      if (section === document.querySelector('.shopify-section:first-child')) return;
      section.classList.add('nova-reveal');
      observer.observe(section);
    });

    // Stagger product card grids
    document.querySelectorAll('.product-list .resource-list, .product-list .resource-grid').forEach((grid) => {
      grid.classList.add('nova-reveal-children');
      observer.observe(grid);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
