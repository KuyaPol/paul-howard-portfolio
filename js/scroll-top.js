import { gsap } from 'gsap';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const userScrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

/**
 * Smoothly animates the existing #top links back to the document start.
 * The tween owns scroll position only while active, and yields immediately to
 * real user input or a repeat activation.
 */
export function initializeBackToTop() {
  const links = [...document.querySelectorAll('a[href="#top"]')];
  if (!links.length) return () => {};

  let tween = null;
  let detachInput = () => {};

  const finish = () => {
    detachInput();
    detachInput = () => {};
    document.documentElement.style.scrollBehavior = '';
    tween = null;
  };

  const cancel = () => {
    const active = tween;
    tween = null;
    active?.kill();
    finish();
  };

  const onClick = event => {
    if (
      event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
    ) return;

    event.preventDefault();
    cancel();

    const distance = window.scrollY;
    if (reducedMotion.matches || distance < 2) {
      window.scrollTo(0, 0);
      return;
    }

    // CSS smooth scrolling otherwise fights the per-frame scroll updates.
    document.documentElement.style.scrollBehavior = 'auto';
    const proxy = { y: distance };
    const onUserInput = inputEvent => {
      if (inputEvent.type === 'keydown' && !userScrollKeys.has(inputEvent.key)) return;
      cancel();
    };

    window.addEventListener('wheel', onUserInput, { passive: true });
    window.addEventListener('touchstart', onUserInput, { passive: true });
    window.addEventListener('keydown', onUserInput);
    detachInput = () => {
      window.removeEventListener('wheel', onUserInput, { passive: true });
      window.removeEventListener('touchstart', onUserInput, { passive: true });
      window.removeEventListener('keydown', onUserInput);
    };

    tween = gsap.to(proxy, {
      y: 0,
      duration: Math.min(1.05, Math.max(.5, distance / 4200)),
      ease: 'power2.inOut',
      onUpdate: () => window.scrollTo(0, proxy.y),
      onComplete: finish,
      onInterrupt: finish,
    });
  };

  links.forEach(link => link.addEventListener('click', onClick));

  return () => {
    cancel();
    links.forEach(link => link.removeEventListener('click', onClick));
  };
}
