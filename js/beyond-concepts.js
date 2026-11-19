const financeRanges = {
  month: {
    label: 'MONTHLY OVERVIEW · SAMPLE',
    note: 'Illustrative income',
    total: '$4,820',
    breakdown: { housing: '$1,650', daily: '$780', savings: '$690' },
  },
  year: {
    label: 'YEARLY OVERVIEW · SAMPLE',
    note: 'Illustrative annual income',
    total: '$57,840',
    breakdown: { housing: '$19,800', daily: '$9,360', savings: '$8,280' },
  },
};

const pcMetrics = {
  cpu: { label: 'CPU LOAD', value: '42%', history: [38, 46, 42, 55, 48, 62, 42, 36] },
  gpu: { label: 'GPU LOAD', value: '28%', history: [24, 31, 28, 36, 33, 29, 41, 28] },
  memory: { label: 'MEMORY USE', value: '11.2 / 32 GB', history: [34, 38, 42, 41, 45, 43, 46, 46] },
  storage: { label: 'STORAGE USED', value: '68%', history: [61, 62, 63, 65, 66, 66, 67, 68] },
};

function setPressed(buttons, active) {
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button === active)));
}

function initializeFinance() {
  const rangeButtons = [...document.querySelectorAll('[data-finance-range]')];
  const period = document.querySelector('[data-finance-period]');
  const total = document.querySelector('[data-finance-total]');
  const totalNote = document.querySelector('[data-finance-total-note]');
  const budget = document.getElementById('finance-budget');
  const budgetOutput = document.getElementById('finance-budget-output');
  const budgetView = document.querySelector('[data-finance-budget-view]');
  const budgetFill = document.querySelector('[data-finance-budget-fill]');
  const bars = [...document.querySelectorAll('[data-finance-bars] i')];

  rangeButtons.forEach(button => button.addEventListener('click', () => {
    const range = button.dataset.financeRange;
    const data = financeRanges[range];
    if (!data) return;
    setPressed(rangeButtons, button);
    period.textContent = data.label;
    total.textContent = data.total;
    totalNote.textContent = data.note;
    bars.forEach(bar => {
      bar.style.setProperty('--bar', `${bar.dataset[range]}%`);
      bar.title = `${bar.dataset[range]}% of illustrative ${range === 'year' ? 'annual' : 'monthly'} scale`;
    });
    Object.entries(data.breakdown).forEach(([key, value]) => {
      const target = document.querySelector(`[data-finance-spend="${key}"]`);
      if (target) target.textContent = value;
    });
  }));

  budget?.addEventListener('input', () => {
    const value = Number(budget.value);
    const text = `${value}% used`;
    budgetOutput.textContent = text;
    budgetView.textContent = text;
    budgetFill.style.width = `${value}%`;
  });
}

function initializeBusiness() {
  const buttons = [...document.querySelectorAll('[data-inventory-filter]')];
  const rows = [...document.querySelectorAll('#concept-panel-business [data-stock]')];
  const count = document.querySelector('[data-inventory-count]');

  buttons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.inventoryFilter;
    setPressed(buttons, button);
    let shown = 0;
    rows.forEach(row => {
      const visible = filter === 'all' || row.dataset.stock === filter;
      row.hidden = !visible;
      if (visible) shown += 1;
    });
    if (count) count.textContent = `${shown} sample ${shown === 1 ? 'record' : 'records'}`;
  }));
}

function initializePc() {
  const buttons = [...document.querySelectorAll('[data-pc-metric]')];
  const label = document.querySelector('[data-pc-metric-label]');
  const value = document.querySelector('[data-pc-metric-value]');
  const history = document.querySelector('[data-pc-history]');

  buttons.forEach(button => button.addEventListener('click', () => {
    const metric = pcMetrics[button.dataset.pcMetric];
    if (!metric) return;
    setPressed(buttons, button);
    label.textContent = metric.label;
    value.textContent = metric.value;
    history.setAttribute('aria-label', `Illustrative ${metric.label.toLowerCase()} history`);
    [...history.children].forEach((bar, index) => {
      const amount = metric.history[index];
      bar.style.setProperty('--h', `${amount}%`);
      bar.title = `Sample point ${index + 1}: ${amount}% illustrative`;
    });
  }));
}

function animateConceptChange(screen, direction) {
  if (!screen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof screen.animate !== 'function') return;
  screen.getAnimations().forEach(animation => animation.cancel());
  screen.animate(
    [
      { opacity: 0, transform: `translateX(${direction > 0 ? 18 : -18}px)` },
      { opacity: 1, transform: 'translateX(0)' },
    ],
    { duration: 520, easing: 'cubic-bezier(.22,.8,.22,1)' }
  );
}

export function initializeBeyondConcepts() {
  const tabs = [...document.querySelectorAll('.concept-tab')];
  const container = document.querySelector('.concept-stage');
  if (!tabs.length || !container) return;

  const screens = [...document.querySelectorAll('.concept-screen')];
  const panelOrder = tabs.map(tab => tab.dataset.concept);
  const previewLabel = document.querySelector('[data-preview-label]');
  const previewTitle = document.querySelector('[data-preview-title]');
  const previewShell = document.querySelector('.concept-preview-shell');
  const detailLink = document.querySelector('[data-concept-detail-link]');
  const detailIds = {
    finance: 'finance-concept',
    business: 'business-concept',
    pc: 'pc-health-concept',
  };
  const titles = {
    finance: 'Money, with a clearer view.',
    business: 'The day-to-day, in view.',
    pc: 'A clearer view of your system.',
  };
  const labels = {
    finance: 'CONCEPT 01 / PERSONAL FINANCE',
    business: 'CONCEPT 02 / SMALL BUSINESS',
    pc: 'CONCEPT 03 / PC SYSTEM HEALTH',
  };
  let active = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  let direction = 0;

  function select(tab, { focus = false, animate = true } = {}) {
    if (!tab || !panelOrder.includes(tab.dataset.concept)) return;
    const nextIndex = panelOrder.indexOf(tab.dataset.concept);
    const currentIndex = panelOrder.indexOf(active.dataset.concept);
    direction = nextIndex >= currentIndex ? 1 : -1;
    active = tab;

    tabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
    });
    screens.forEach(screen => {
      screen.hidden = screen.dataset.screen !== tab.dataset.concept;
    });
    if (previewLabel) previewLabel.textContent = labels[tab.dataset.concept];
    if (previewTitle) previewTitle.textContent = titles[tab.dataset.concept];
    if (previewShell) previewShell.dataset.concept = tab.dataset.concept;
    if (detailLink) detailLink.href = `#${detailIds[tab.dataset.concept]}`;
    if (focus) tab.focus();
    if (animate) {
      const visibleScreen = screens.find(screen => screen.dataset.screen === tab.dataset.concept);
      animateConceptChange(visibleScreen, direction);
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const current = tabs.indexOf(tab);
      let next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(tabs[next], { focus: true });
    });
  });

  document.querySelectorAll('[data-return-to-concepts]').forEach(link => {
    link.addEventListener('click', () => {
      const selected = active;
      window.setTimeout(() => {
        if (selected) select(selected, { focus: true, animate: false });
      }, 0);
    });
  });

  initializeFinance();
  initializeBusiness();
  initializePc();
}
