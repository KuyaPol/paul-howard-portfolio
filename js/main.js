const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());

const menuButton = document.querySelector('.menu-toggle');
const menuLinks = document.querySelector('.nav-links');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuLinks?.setAttribute('data-open', String(open));
});
menuLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuLinks.setAttribute('data-open', 'false');
}));

// The selector is a vertical list above 900px and a horizontal row below it.
const conceptList = document.querySelector('.concept-selector');
if (conceptList) {
  const compactConcepts = window.matchMedia('(max-width: 900px)');
  const syncConceptOrientation = () => {
    conceptList.setAttribute('aria-orientation', compactConcepts.matches ? 'horizontal' : 'vertical');
  };
  syncConceptOrientation();
  compactConcepts.addEventListener('change', syncConceptOrientation);
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (!reduceMotion.matches) {
  document.querySelectorAll('[data-hero-motion]').forEach((element, index) => {
    const animation = element.animate(
      [{ opacity: .86, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }],
      { duration: 620, delay: index * 80, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
    animation.onfinish = () => animation.cancel();
  });
}
