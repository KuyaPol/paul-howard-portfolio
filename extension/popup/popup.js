import { formatClock, formatDuration } from '../shared/aggregate.js';

const elements = {
  status: document.getElementById('status'),
  total: document.getElementById('today-total'),
  day: document.getElementById('day'),
  openTabs: document.getElementById('open-tabs'),
  topDomain: document.getElementById('top-domain'),
  list: document.getElementById('top-sites'),
  empty: document.getElementById('empty-sites'),
  share: document.getElementById('share'),
  toggle: document.getElementById('toggle'),
  clear: document.getElementById('clear'),
  options: document.getElementById('options'),
};

const STATUS_LABELS = {
  live: 'Live',
  paused: 'Paused',
  idle: 'Idle',
  inactive: 'Inactive',
  unsupported: 'Unsupported page',
  loading: 'Checking…',
};

async function send(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

function setStatus(status) {
  elements.status.textContent = STATUS_LABELS[status] || status;
  elements.status.dataset.status = status;
}

function renderTopSites(domains) {
  elements.list.replaceChildren();
  elements.empty.hidden = domains.length > 0;

  if (!domains.length) return;

  const max = Math.max(...domains.map(item => item.activeMs || 0), 1);

  for (const item of domains) {
    const row = document.createElement('li');
    row.className = 'site';

    const name = document.createElement('span');
    name.className = 'site-name';
    name.textContent = item.domain;
    name.title = item.domain;

    const time = document.createElement('span');
    time.className = 'site-time';
    time.textContent = formatDuration(item.activeMs);

    const bar = document.createElement('span');
    bar.className = 'site-bar';
    const fill = document.createElement('i');
    fill.style.width = `${Math.max(4, Math.round(((item.activeMs || 0) / max) * 100))}%`;
    bar.append(fill);

    row.append(name, time, bar);
    elements.list.append(row);
  }
}

async function render() {
  const snapshot = await send({ type: 'GET_POPUP_DATA' });

  if (!snapshot || snapshot.ok === false) {
    setStatus('loading');
    elements.total.textContent = '00:00:00';
    elements.day.textContent = snapshot?.error || 'Tracker unavailable';
    elements.openTabs.textContent = '—';
    elements.topDomain.textContent = '—';
    renderTopSites([]);
    elements.toggle.disabled = true;
    elements.clear.disabled = true;
    elements.share.disabled = true;
    return;
  }

  setStatus(snapshot.status);
  elements.total.textContent = formatClock(snapshot.activeMs);
  elements.day.textContent = snapshot.day;
  elements.openTabs.textContent = String(snapshot.openTabs ?? 0);
  elements.topDomain.textContent = snapshot.topDomains?.[0]?.domain || '—';
  renderTopSites(snapshot.topDomains || []);

  elements.toggle.disabled = false;
  elements.clear.disabled = false;
  elements.share.disabled = false;
  elements.toggle.textContent = snapshot.trackingPaused ? 'Resume tracking' : 'Pause tracking';

  const sharing = Boolean(snapshot.shareWithPortfolio);
  elements.share.setAttribute('aria-pressed', String(sharing));
  elements.share.textContent = sharing ? 'On' : 'Off';
}

elements.share.addEventListener('click', async () => {
  const sharing = elements.share.getAttribute('aria-pressed') === 'true';
  await send({ type: 'SET_SHARING', enabled: !sharing });
  await render();
});

elements.toggle.addEventListener('click', async () => {
  const snapshot = await send({ type: 'GET_POPUP_DATA' });
  const paused = Boolean(snapshot?.trackingPaused);
  await send({ type: 'SET_PAUSED', paused: !paused });
  await render();
});

elements.clear.addEventListener('click', async () => {
  const confirmed = window.confirm('Clear all locally stored usage totals? This cannot be undone.');
  if (!confirmed) return;
  await send({ type: 'CLEAR_DATA' });
  await render();
});

elements.options.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

render();
