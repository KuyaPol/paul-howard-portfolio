// Onboarding modal for Browser Tracker. Kept separate from the live dashboard
// bridge so tutorial interactions never touch extension polling or statistics.
const modal = document.getElementById('tracker-tutorial');

if (modal) {
  const panel = modal.querySelector('.tracker-modal-panel');
  const overlay = modal.querySelector('.tracker-modal-overlay');
  const steps = [...modal.querySelectorAll('.tutorial-step')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const backgroundRegions = [...document.querySelectorAll('.site-header, main, .site-footer, .beyond-footer')];

  const setBackgroundInert = value => {
    backgroundRegions.forEach(region => {
      region.inert = value;
      if (value) region.setAttribute('aria-hidden', 'true');
      else region.removeAttribute('aria-hidden');
    });
  };

  let isOpen = false;
  let restoreFocusTo = null;
  let closeTimer = null;

  function focusableItems() {
    return [...panel.querySelectorAll('a[href], button:not([disabled])')]
      .filter(item => !item.hidden && item.getAttribute('aria-hidden') !== 'true');
  }

  function highlight(step) {
    for (const item of steps) {
      item.dataset.highlight = String(Number(item.dataset.step) === Number(step));
    }
  }

  function goToStep(step) {
    const target = steps.find(item => Number(item.dataset.step) === Number(step));
    highlight(step);
    if (!target) return;
    target.scrollIntoView({
      block: 'center',
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }

  function openModal(step) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }

    if (!isOpen) restoreFocusTo = document.activeElement;
    modal.removeAttribute('data-closing');
    modal.hidden = false;
    document.body.classList.add('tracker-modal-open');
    setBackgroundInert(true);
    isOpen = true;

    if (step) goToStep(step);
    panel.focus({ preventScroll: true });
  }

  function closeModal() {
    if (!isOpen) return;
    isOpen = false;

    const finish = () => {
      modal.hidden = true;
      modal.removeAttribute('data-closing');
      document.body.classList.remove('tracker-modal-open');
      setBackgroundInert(false);
      if (restoreFocusTo && typeof restoreFocusTo.focus === 'function') {
        restoreFocusTo.focus();
      }
      restoreFocusTo = null;
      closeTimer = null;
    };

    if (reducedMotion.matches) {
      finish();
      return;
    }

    modal.dataset.closing = 'true';
    closeTimer = setTimeout(finish, 170);
  }

  for (const trigger of document.querySelectorAll('[data-tutorial-open]')) {
    trigger.addEventListener('click', () => openModal(1));
  }

  // The Add Browser Tracker link opens the local installation guide. Removing
  // data-tutorial-step and setting a store href later needs no JS change.
  for (const trigger of document.querySelectorAll('[data-tutorial-step]')) {
    trigger.addEventListener('click', event => {
      if (!trigger.hasAttribute('data-tutorial-step')) return;
      event.preventDefault();
      openModal(trigger.dataset.tutorialStep);
    });
  }

  for (const trigger of modal.querySelectorAll('[data-tutorial-goto]')) {
    trigger.addEventListener('click', () => goToStep(trigger.dataset.tutorialGoto));
  }

  for (const closer of modal.querySelectorAll('[data-tutorial-close]')) {
    closer.addEventListener('click', event => {
      if (closer === overlay && event.target !== overlay) return;
      closeModal();
    });
  }

  document.addEventListener('keydown', event => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;
    const items = focusableItems();
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('pagehide', () => {
    if (!isOpen) return;
    if (closeTimer) clearTimeout(closeTimer);
    isOpen = false;
    modal.hidden = true;
    modal.removeAttribute('data-closing');
    document.body.classList.remove('tracker-modal-open');
    setBackgroundInert(false);
  });
}
