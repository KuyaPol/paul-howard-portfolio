const ENTER_FLAG = 'ph-page-transition';

let cleanupHandle;

const readFlag = () => {
  try {
    return window.sessionStorage.getItem(ENTER_FLAG) === '1';
  } catch {
    return false;
  }
};

const clearFlag = () => {
  try {
    window.sessionStorage.removeItem(ENTER_FLAG);
  } catch {
    // Storage can be unavailable in private modes; the transition is optional.
  }
};

const setFlag = () => {
  try {
    window.sessionStorage.setItem(ENTER_FLAG, '1');
  } catch {
    // Navigation still works without the fade.
  }
};

/**
 * Short cross-page fade for the existing relative links between the portfolio
 * and Beyond the Portfolio. Without JS the links keep their native behavior.
 */
export function initializePageTransitions() {
  if (cleanupHandle) return cleanupHandle;

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = [];
  let enterEnd = () => {};
  let enterTimer = 0;
  let exitTimer = 0;

  if (readFlag()) {
    clearFlag();
    if (!reduced.matches) {
      root.classList.add('is-page-entering');
      enterEnd = () => {
        root.classList.remove('is-page-entering');
        root.removeEventListener('animationend', enterEnd);
      };
      root.addEventListener('animationend', enterEnd);
      enterTimer = window.setTimeout(enterEnd, 600);
      timers.push(enterTimer);
    }
  }

  const onClick = event => {
    const link = event.currentTarget;
    if (
      event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    ) return;

    if (reduced.matches || root.classList.contains('is-page-exiting')) return;

    event.preventDefault();
    setFlag();
    root.classList.add('is-page-exiting');
    exitTimer = window.setTimeout(() => {
      window.location.assign(link.href);
    }, 260);
    timers.push(exitTimer);
  };

  const links = [...document.querySelectorAll('[data-page-exit]')];
  links.forEach(link => link.addEventListener('click', onClick));

  cleanupHandle = () => {
    links.forEach(link => link.removeEventListener('click', onClick));
    timers.forEach(timer => window.clearTimeout(timer));
    root.removeEventListener('animationend', enterEnd);
    root.classList.remove('is-page-entering', 'is-page-exiting');
    clearFlag();
    cleanupHandle = undefined;
  };

  return cleanupHandle;
}
