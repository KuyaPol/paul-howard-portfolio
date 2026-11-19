// Live dashboard bridge for the local Browser Tracker extension.
// The page always initiates contact: an extension cannot message a web page
// until the page has called runtime.sendMessage with a known extension ID.
const EXTENSION_ID = 'gkbmdglfleclnpbkhdmbibcaabgheefi';
const POLL_INTERVAL_MS = 3000;
const REQUEST_TIMEOUT_MS = 2500;
const CLOCK_INTERVAL_MS = 1000;
// A local delta larger than this means the page/extension was suspended or a
// snapshot was missed. No time is added in that case.
const MAX_LOCAL_DELTA_MS = 5000;
const MAX_SNAPSHOT_AGE_MS = 5000;
// A drop of this size in the authoritative total means the data was cleared,
// reset, or replaced. Normal snapshots are monotonic within a day.
const RESET_DROP_MS = 2000;

const root = document.getElementById('browser-tracker');

if (root) {
  const el = {
    badge: document.getElementById('tracker-connection'),
    dashboard: document.getElementById('tracker-dashboard'),
    disconnected: document.getElementById('tracker-disconnected'),
    live: document.getElementById('tracker-live'),
    status: document.getElementById('tracker-status-label'),
    notice: document.getElementById('tracker-notice'),
    noticeText: document.getElementById('tracker-notice-text'),
    active: document.getElementById('tracker-active-time'),
    activeNote: document.getElementById('tracker-active-note'),
    tabs: document.getElementById('tracker-open-tabs'),
    tracking: document.getElementById('tracker-tracking-status'),
    updated: document.getElementById('tracker-last-updated'),
    list: document.getElementById('tracker-site-list'),
    empty: document.getElementById('tracker-empty'),
    bars: document.getElementById('tracker-bars'),
    labels: document.getElementById('tracker-bar-labels'),
    controls: document.getElementById('tracker-controls'),
    pause: document.getElementById('tracker-pause'),
    clear: document.getElementById('tracker-clear'),
  };

  const STATUS_LABELS = {
    live: 'Active',
    paused: 'Paused',
    idle: 'Idle',
    inactive: 'Inactive',
    unsupported: 'Unsupported page',
  };

  let busy = false;
  let paused = false;
  let hasLiveSnapshot = false;
  let interpolating = false;
  let baselineMs = 0;
  let baselineAt = 0;
  let authoritativeMs = 0;
  let snapshotDay = '';
  let clockTimer = null;
  let pollTimer = null;

  function clamp(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(max, Math.max(min, number));
  }

  function formatClock(ms) {
    const seconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const part = value => String(value).padStart(2, '0');
    return `${part(Math.floor(seconds / 3600))}:${part(Math.floor((seconds % 3600) / 60))}:${part(seconds % 60)}`;
  }

  function formatDuration(ms) {
    const seconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
    if (minutes) return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
    return `${remainder}s`;
  }

  /** Local estimate between authoritative snapshots. Never invent large gaps. */
  function interpolate(nowPerf) {
    if (!interpolating || document.visibilityState === 'hidden') return baselineMs;
    const delta = Math.max(0, nowPerf - baselineAt);
    if (delta > MAX_LOCAL_DELTA_MS) return baselineMs;
    return baselineMs + delta;
  }

  function renderTimer(nowPerf = performance.now()) {
    el.active.textContent = hasLiveSnapshot ? formatClock(interpolate(nowPerf)) : '—';
  }

  function startLoops() {
    if (clockTimer == null) clockTimer = setInterval(() => renderTimer(), CLOCK_INTERVAL_MS);
    if (pollTimer == null) pollTimer = setInterval(tick, POLL_INTERVAL_MS);
  }

  function stopLoops() {
    clearInterval(clockTimer);
    clearInterval(pollTimer);
    clockTimer = null;
    pollTimer = null;
  }

  /** One controlled request through externally_connectable. */
  function send(type, payload = {}) {
    return new Promise(resolve => {
      const runtime = window.chrome?.runtime;
      if (!runtime?.sendMessage) {
        resolve({ ok: false, error: 'NO_RUNTIME' });
        return;
      }

      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      };
      const timeoutId = setTimeout(() => finish({ ok: false, error: 'TIMEOUT' }), REQUEST_TIMEOUT_MS);

      try {
        const pending = runtime.sendMessage(
          EXTENSION_ID,
          { type, ...payload },
          response => {
            const lastError = runtime.lastError;
            if (lastError) finish({ ok: false, error: lastError.message || 'MESSAGE_FAILED' });
            else finish(response && typeof response === 'object' ? response : { ok: false, error: 'EMPTY_RESPONSE' });
          },
        );

        // Chromium returns a promise in some versions; whichever settles first wins.
        if (pending && typeof pending.then === 'function') {
          pending
            .then(response => finish(response))
            .catch(error => finish({ ok: false, error: String(error?.message || error) }));
        }
      } catch (error) {
        finish({ ok: false, error: String(error?.message || error) });
      }
    });
  }

  function setState(state, detail = {}) {
    const live = state === 'live';

    el.dashboard.hidden = state === 'disconnected';
    el.disconnected.hidden = state !== 'disconnected';
    el.controls.hidden = state !== 'live';
    el.notice.hidden = state !== 'consent';

    const status = String(detail.status ?? '');
    const isPaused = Boolean(detail.paused) || status === 'paused';
    const liveState = status === 'live'
      ? 'live'
      : status === 'paused' || status === 'idle'
        ? 'paused'
        : 'checking';
    const badge = live
      ? [liveState, STATUS_LABELS[status] || (isPaused ? 'Paused' : 'Live')]
      : state === 'consent'
        ? ['checking', 'Sharing off']
        : state === 'disconnected'
          ? ['disconnected', 'Not connected']
          : ['checking', 'Checking…'];

    el.badge.dataset.state = badge[0];
    el.badge.textContent = badge[1];
    el.live.dataset.active = String(live && status === 'live');
    el.status.textContent = badge[1];
    el.noticeText.textContent = 'Portfolio sharing is off. Enable it in the extension popup to see your own statistics.';

    hasLiveSnapshot = live;

    if (!live) {
      interpolating = false;
      baselineMs = 0;
      baselineAt = performance.now();
      authoritativeMs = 0;
      snapshotDay = '';
      el.tabs.textContent = '—';
      el.tracking.textContent = '—';
      el.activeNote.textContent = 'Awaiting extension';
      el.updated.textContent = 'Not updated';
      el.list.replaceChildren();
      el.empty.hidden = true;
      el.bars.replaceChildren();
      el.labels.replaceChildren();
      renderTimer();
    }
  }

  /**
   * Only explicit stop states freeze the clock. `status` also describes the
   * focused tab (live/inactive/unsupported), which is not the same thing as
   * "tracking stopped": the extension can keep accumulating active time while
   * the dashboard itself is on a non-trackable origin such as localhost.
   */
  function clockStopped(status, snapshot) {
    if (status === 'paused' || status === 'idle') return true;
    if (Boolean(snapshot.trackingPaused)) return true;
    const idle = String(snapshot.idleState ?? 'active');
    return idle !== 'active';
  }

  /**
   * Reconciles the current displayed value with a fresh extension snapshot.
   * The snapshot is authoritative; local interpolation only fills the gap.
   */
  function applySnapshot(snapshot) {
    const nowPerf = performance.now();
    const day = String(snapshot.day ?? '');
    const status = String(snapshot.status ?? '');
    const fresh = Math.max(0, Number(snapshot.activeMs) || 0);
    const displayedBefore = interpolate(nowPerf);
    const stopped = clockStopped(status, snapshot);
    const growing = fresh > authoritativeMs;
    // Active totals are monotonic within a day. A meaningful drop means the
    // extension data was cleared or replaced, so the display must follow it.
    const isReset = day !== snapshotDay || fresh < authoritativeMs - RESET_DROP_MS;
    let value;

    if (isReset || stopped) {
      // Clears, day rollovers, pause, idle, and other explicit stops use the
      // extension's exact accumulated value.
      value = fresh;
    } else if (!growing && status !== 'live') {
      // A descriptive non-live status with no new authoritative time means the
      // extension is not accruing. Hold the current estimate instead of
      // inventing another interval; no backward jump is introduced.
      value = Math.max(fresh, displayedBefore);
    } else {
      // Project the snapshot forward by its transport age, then keep the
      // larger of that and what is already displayed. This prevents a normal
      // refresh from jumping backward or counting an interval twice.
      const age = clamp(Date.now() - Number(snapshot.generatedAt || Date.now()), 0, MAX_SNAPSHOT_AGE_MS);
      value = Math.max(displayedBefore, fresh + age);
    }

    baselineMs = value;
    baselineAt = nowPerf;
    authoritativeMs = fresh;
    snapshotDay = day;
    // Interpolate from a non-live snapshot only when its authoritative total
    // actually grew; otherwise the extension is not counting time and the
    // local estimate must hold until a fresh, growing snapshot arrives.
    interpolating = !stopped && (status === 'live' || growing);
    paused = Boolean(snapshot.trackingPaused);

    el.tabs.textContent = String(snapshot.openTabs ?? 0);
    el.tracking.textContent = STATUS_LABELS[status] || status || 'Unknown';
    el.activeNote.textContent = `Today · ${day}`;
    el.updated.textContent = `Updated ${new Date(snapshot.generatedAt).toLocaleTimeString()}`;
    el.pause.textContent = paused ? 'Resume tracking' : 'Pause tracking';

    renderSites(Array.isArray(snapshot.topDomains) ? snapshot.topDomains : []);
    renderHistory(Array.isArray(snapshot.history) ? snapshot.history : []);
    renderTimer(nowPerf);
  }

  function renderSites(domains) {
    el.list.replaceChildren();
    el.empty.hidden = domains.length > 0;
    const max = Math.max(...domains.map(item => Number(item.activeMs) || 0), 1);

    for (const item of domains.slice(0, 6)) {
      const row = document.createElement('li');
      row.className = 'tracker-site';

      const name = document.createElement('span');
      name.className = 'tracker-site-name';
      name.textContent = String(item.domain ?? '');
      name.title = name.textContent;

      const time = document.createElement('span');
      time.className = 'tracker-site-time';
      time.textContent = formatDuration(item.activeMs);

      const bar = document.createElement('span');
      bar.className = 'tracker-site-bar';
      const fill = document.createElement('i');
      fill.style.width = `${Math.max(3, Math.round(((Number(item.activeMs) || 0) / max) * 100))}%`;
      bar.append(fill);

      row.append(name, time, bar);
      el.list.append(row);
    }
  }

  function renderHistory(history) {
    el.bars.replaceChildren();
    el.labels.replaceChildren();
    const max = Math.max(...history.map(item => Number(item.activeMs) || 0), 1);

    for (const day of history) {
      const bar = document.createElement('span');
      bar.className = 'tracker-bar';
      bar.dataset.today = String(Boolean(day.isToday));
      bar.title = `${String(day.day ?? '')}: ${formatDuration(day.activeMs)}`;
      const fill = document.createElement('i');
      fill.style.height = `${Math.max(2, Math.round(((Number(day.activeMs) || 0) / max) * 100))}%`;
      bar.append(fill);
      el.bars.append(bar);

      const label = document.createElement('span');
      label.textContent = String(day.label ?? '').slice(0, 3);
      el.labels.append(label);
    }

    el.bars.setAttribute(
      'aria-label',
      `Daily active browsing time: ${history.map(day => `${day.label} ${formatDuration(day.activeMs)}`).join(', ')}`,
    );
  }

  function renderSnapshot(snapshot) {
    setState('live', { paused: Boolean(snapshot.trackingPaused), status: snapshot.status });
    applySnapshot(snapshot);
  }

  async function tick() {
    if (busy) return;
    busy = true;

    try {
      const ping = await send('TRACKER_PING');
      if (!ping.ok) {
        setState('disconnected');
        return;
      }
      if (!ping.sharingEnabled) {
        setState('consent');
        return;
      }

      const snapshot = await send('TRACKER_SNAPSHOT');
      if (!snapshot.ok) {
        setState(snapshot.error === 'SHARING_DISABLED' ? 'consent' : 'disconnected');
        return;
      }

      renderSnapshot(snapshot);
    } catch {
      setState('disconnected');
    } finally {
      busy = false;
    }
  }

  el.pause.addEventListener('click', async () => {
    // Stop the local estimate immediately; the next snapshot confirms it.
    interpolating = false;
    renderTimer();
    const result = await send('SET_PAUSED', { paused: !paused });
    if (result.ok) setTimeout(tick, 60);
    else tick();
  });

  el.clear.addEventListener('click', async () => {
    const confirmed = window.confirm('Clear all locally stored Browser Tracker data? This cannot be undone.');
    if (!confirmed) return;
    interpolating = false;
    renderTimer();
    const result = await send('CLEAR_DATA');
    if (result.ok) setTimeout(tick, 60);
    else tick();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Freeze the visible estimate at its current value without adding the
      // hidden interval. Fresh snapshots may still update authoritative data.
      if (interpolating) {
        const frozenAt = performance.now();
        baselineMs = interpolate(frozenAt);
        baselineAt = frozenAt;
      }
    } else {
      // Do not count time spent hidden/suspended; wait for a fresh snapshot.
      baselineAt = performance.now();
      tick();
    }
  });

  window.addEventListener('focus', tick);
  window.addEventListener('pagehide', stopLoops);
  window.addEventListener('pageshow', () => {
    baselineAt = performance.now();
    startLoops();
    tick();
  });

  setState('checking');
  startLoops();
  tick();
}
