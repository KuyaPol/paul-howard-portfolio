let cleanupHandle;

export function initializeAnimations() {
  if (cleanupHandle) return cleanupHandle;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealAnimations = new Map();
  const observed = new Set();
  let observer;
  let active = true;

  const finish = element => {
    element.dataset.revealPlayed = 'true';
    element.dataset.revealPending = 'false';
    revealAnimations.get(element)?.cancel();
    revealAnimations.delete(element);
    observer?.unobserve(element);
    observed.delete(element);
  };

  const finishEverything = () => {
    observer?.disconnect();
    [...observed].forEach(finish);
    observed.clear();
  };

  const onReducedChange = () => {
    if (reduced.matches) finishEverything();
  };
  reduced.addEventListener('change', onReducedChange);

  // Hero entrance and scroll-linked motion are owned by js/motion.js (GSAP).
  // This module only coordinates the [data-reveal] IntersectionObserver system.

  const reveals = [...document.querySelectorAll('[data-reveal]')];
  const candidates = reveals.filter(element => {
    if (reduced.matches || !element.animate || document.visibilityState === 'hidden' || element.getBoundingClientRect().top < innerHeight) {
      element.dataset.revealPlayed = 'true';
      return false;
    }
    element.dataset.revealPending = 'true';
    return true;
  });
  document.documentElement.classList.add('motion-ready');

  if (typeof IntersectionObserver === 'function') {
    observer = new IntersectionObserver(entries => {
      if (!active) return;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target;
        observer.unobserve(element);
        observed.delete(element);
        element.dataset.revealPending = 'false';
        element.dataset.revealPlayed = 'true';
        if (reduced.matches || document.visibilityState === 'hidden' || entry.boundingClientRect.bottom <= 0) {
          finish(element);
          continue;
        }
        const initialTransform = element.dataset.reveal === 'media' ? 'scale(1.025)' : 'translateX(-12px)';
        const animation = element.animate(
          [{ opacity: 0, transform: initialTransform }, { opacity: 1, transform: 'none' }],
          { duration: 620, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' },
        );
        animation.onfinish = () => finish(element);
        revealAnimations.set(element, animation);
      }
    }, { threshold: 0, rootMargin: '0px 0px 96px 0px' });
    candidates.forEach(element => {
      observed.add(element);
      observer.observe(element);
    });
  } else {
    candidates.forEach(finish);
  }

  cleanupHandle = () => {
    active = false;
    observer?.disconnect();
    revealAnimations.forEach(animation => {
      animation.onfinish = null;
      animation.cancel();
    });
    revealAnimations.clear();
    observed.forEach(element => {
      element.dataset.revealPending = 'false';
      element.dataset.revealPlayed = 'true';
    });
    observed.clear();
    reduced.removeEventListener('change', onReducedChange);
    document.documentElement.classList.remove('motion-ready');
    cleanupHandle = undefined;
  };
  return cleanupHandle;
}
