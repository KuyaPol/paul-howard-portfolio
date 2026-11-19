import {
  AGGREGATES_KEY,
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  normalizeDomain,
  normalizeDomainEntry,
  dayKey,
  splitIntervalByDay,
  pruneOldDays,
} from '../shared/aggregate.js';

const STATE_KEY = 'trackingState';
const TICK_ALARM = 'browser-tracker-tick';
const MAX_INTERVAL_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_PATH = '/paul-howard-portfolio';

// Web origins allowed to use the externally_connectable bridge. The manifest
// allowlist is the first gate; this list and the path check below are the
// second gate inside the service worker.
const DASHBOARD_ORIGINS = new Set([
  'https://kuyapol.github.io',
  'http://localhost',
  'http://127.0.0.1',
]);

let settingsCache = null;
let readyPromise = null;
let state = createDefaultState();
let opQueue = Promise.resolve();
let aggregateQueue = Promise.resolve();

function createDefaultState() {
  return {
    version: 1,
    idleState: 'active',
    focusedWindowId: null,
    activeTabId: null,
    activeDomain: null,
    intervalStart: null,
    lastHeartbeat: null,
    activationDomain: null,
    activationTabId: null,
  };
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

/**
 * All tracker operations are serialized so overlapping Chrome events cannot
 * close or start the same active interval twice.
 */
function enqueue(operation) {
  const run = opQueue.then(async () => {
    await ensureReady();
    return operation();
  });
  opQueue = run.catch(() => {});
  return run;
}

function ensureReady() {
  if (!readyPromise) readyPromise = initialize();
  return readyPromise;
}

async function initialize() {
  const storedSettings = await chrome.storage.local.get(SETTINGS_KEY);
  settingsCache = { ...DEFAULT_SETTINGS, ...(storedSettings[SETTINGS_KEY] || {}) };

  if (!settingsCache.trackingStartedAt) {
    settingsCache.trackingStartedAt = Date.now();
    await chrome.storage.local.set({ [SETTINGS_KEY]: settingsCache });
  }

  const storedState = await chrome.storage.session.get(STATE_KEY);
  const candidate = storedState[STATE_KEY];
  state = candidate && candidate.version === 1
    ? { ...createDefaultState(), ...candidate }
    : createDefaultState();

  chrome.idle.setDetectionInterval(clamp(settingsCache.idleThresholdSeconds, 15, 300));
  await ensureTickAlarm();

  state.idleState = await chrome.idle.queryState(settingsCache.idleThresholdSeconds);
  await syncTrackingInternal(Date.now());
}

async function getSettings() {
  if (!settingsCache) {
    const data = await chrome.storage.local.get(SETTINGS_KEY);
    settingsCache = { ...DEFAULT_SETTINGS, ...(data[SETTINGS_KEY] || {}) };
  }
  return settingsCache;
}

async function saveState() {
  await chrome.storage.session.set({ [STATE_KEY]: state });
}

async function ensureTickAlarm() {
  const existing = await chrome.alarms.get(TICK_ALARM);
  if (!existing) {
    await chrome.alarms.create(TICK_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: 1,
      persistAcrossSessions: false,
    });
  }
}

/** Serialized read-modify-write for the local aggregate object. */
function updateAggregates(mutator) {
  const run = aggregateQueue.then(async () => {
    const data = await chrome.storage.local.get(AGGREGATES_KEY);
    const aggregates = data[AGGREGATES_KEY] || {};
    mutator(aggregates);
    await chrome.storage.local.set({ [AGGREGATES_KEY]: aggregates });
  });
  aggregateQueue = run.catch(() => {});
  return run;
}

function emptyDay() {
  return { activeMs: 0, domains: {}, tabCount: { latest: 0, max: 0 } };
}

function ensureDay(aggregates, key) {
  if (!aggregates[key]) aggregates[key] = emptyDay();
  const day = aggregates[key];
  if (!day.domains || typeof day.domains !== 'object') day.domains = {};
  if (!day.tabCount || typeof day.tabCount !== 'object') day.tabCount = { latest: 0, max: 0 };
  return day;
}

async function addActiveTime(domain, start, end) {
  const boundedEnd = Math.min(end, start + MAX_INTERVAL_MS);

  for (const part of splitIntervalByDay(start, boundedEnd)) {
    await updateAggregates(aggregates => {
      const day = ensureDay(aggregates, part.key);
      day.activeMs = (day.activeMs || 0) + part.ms;

      const entry = day.domains[domain] || { activeMs: 0, activations: 0 };
      entry.activeMs = (entry.activeMs || 0) + part.ms;
      day.domains[domain] = entry;
    });
  }
}

async function recordActivation(domain, now) {
  const key = dayKey(now);
  await updateAggregates(aggregates => {
    const day = ensureDay(aggregates, key);
    const entry = day.domains[domain] || { activeMs: 0, activations: 0 };
    entry.activations = (entry.activations || 0) + 1;
    day.domains[domain] = entry;
  });
}

async function updateTabCount(now) {
  const settings = await getSettings();
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const counted = settings.incognitoEnabled ? tabs : tabs.filter(tab => !tab.incognito);
  const count = counted.length;
  const key = dayKey(now);

  await updateAggregates(aggregates => {
    const day = ensureDay(aggregates, key);
    day.tabCount.latest = count;
    day.tabCount.max = Math.max(Number(day.tabCount.max) || 0, count);
  });
}

async function pruneAggregates(now) {
  const settings = await getSettings();
  await updateAggregates(aggregates => pruneOldDays(aggregates, settings.retentionDays, now));
}

async function getDesiredActivity() {
  const settings = await getSettings();
  const inactive = { windowId: null, tabId: null, domain: null, trackable: false };

  if (settings.trackingPaused || state.idleState !== 'active') return inactive;

  const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
  const focusedWindow = windows.find(window => window.focused && window.id != null);
  if (!focusedWindow) return inactive;

  const [tab] = await chrome.tabs.query({ active: true, windowId: focusedWindow.id });
  if (!tab || tab.id == null) return inactive;
  if (tab.incognito && !settings.incognitoEnabled) return inactive;

  const domain = normalizeDomain(tab.url);
  if (!domain || settings.excludedDomains.includes(domain)) return inactive;

  return {
    windowId: focusedWindow.id,
    tabId: tab.id,
    domain,
    trackable: true,
  };
}

async function closeInterval(now, clearActivation = false) {
  if (state.intervalStart != null && state.activeDomain) {
    await addActiveTime(state.activeDomain, state.intervalStart, Math.max(now, state.intervalStart));
  }

  state.intervalStart = null;
  state.lastHeartbeat = now;

  if (clearActivation) {
    state.activationDomain = null;
    state.activationTabId = null;
  }
}

async function startInterval(desired, now) {
  state.intervalStart = now;

  if (state.activationDomain !== desired.domain || state.activationTabId !== desired.tabId) {
    await recordActivation(desired.domain, now);
    state.activationDomain = desired.domain;
    state.activationTabId = desired.tabId;
  }
}

/**
 * Reconciles the persisted interval with the current focused window, active
 * tab, and idle state. Called after every relevant browser event.
 */
async function syncTrackingInternal(now) {
  const desired = await getDesiredActivity();
  const changed =
    desired.windowId !== state.focusedWindowId ||
    desired.tabId !== state.activeTabId ||
    desired.domain !== state.activeDomain;

  if (changed || (!desired.trackable && state.intervalStart != null)) {
    await closeInterval(now, changed || !desired.trackable);
  }

  state.focusedWindowId = desired.windowId;
  state.activeTabId = desired.tabId;
  state.activeDomain = desired.domain;

  if (desired.trackable && state.intervalStart == null) {
    await startInterval(desired, now);
  }

  state.lastHeartbeat = now;
  await saveState();
  await updateTabCount(now);
}

/** Commits the current interval without changing its activation identity. */
async function flushInterval(now) {
  if (state.intervalStart != null && state.activeDomain) {
    await closeInterval(now, false);

    const desired = await getDesiredActivity();
    state.focusedWindowId = desired.windowId;
    state.activeTabId = desired.tabId;
    state.activeDomain = desired.domain;

    if (desired.trackable) state.intervalStart = now;
    await saveState();
  }

  await updateTabCount(now);
  await pruneAggregates(now);
}

async function buildSnapshot(now, domainLimit = 5) {
  const settings = await getSettings();
  const data = await chrome.storage.local.get(AGGREGATES_KEY);
  const aggregates = data[AGGREGATES_KEY] || {};
  const key = dayKey(now);
  const today = aggregates[key] || emptyDay();

  let activeMs = Number(today.activeMs) || 0;
  const domains = {};

  for (const [domain, entry] of Object.entries(today.domains || {})) {
    domains[domain] = {
      activeMs: Number(entry?.activeMs) || 0,
      activations: Number(entry?.activations) || 0,
    };
  }

  if (state.intervalStart != null && state.activeDomain) {
    const pending = clamp(now - state.intervalStart, 0, MAX_INTERVAL_MS);
    activeMs += pending;
    const entry = domains[state.activeDomain] || { activeMs: 0, activations: 0 };
    entry.activeMs += pending;
    domains[state.activeDomain] = entry;
  }

  const topDomains = Object.entries(domains)
    .map(([domain, entry]) => ({ domain, ...entry }))
    .filter(item => item.activeMs > 0 || item.activations > 0)
    .sort((a, b) => b.activeMs - a.activeMs || a.domain.localeCompare(b.domain))
    .slice(0, domainLimit);

  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const countedTabs = settings.incognitoEnabled ? tabs : tabs.filter(tab => !tab.incognito);

  let status = 'live';
  if (settings.trackingPaused) status = 'paused';
  else if (state.idleState !== 'active') status = 'idle';
  else if (state.focusedWindowId == null) status = 'inactive';
  else if (!state.activeDomain) status = 'unsupported';

  return {
    status,
    activeMs,
    openTabs: countedTabs.length,
    topDomains,
    day: key,
    generatedAt: now,
    trackingPaused: settings.trackingPaused,
    trackingStartedAt: settings.trackingStartedAt,
    idleState: state.idleState,
    shareWithPortfolio: Boolean(settings.shareWithPortfolio),
  };
}

/**
 * Read-only payload for the portfolio dashboard. It contains only the same
 * domain-level aggregates shown in the popup plus a seven-day daily total.
 * No URL, title, or raw history ever enters this object.
 */
async function buildDashboardSnapshot(now) {
  const snapshot = await buildSnapshot(now, 8);
  const settings = await getSettings();
  const data = await chrome.storage.local.get(AGGREGATES_KEY);
  const aggregates = data[AGGREGATES_KEY] || {};
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const history = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now - offset * DAY_MS);
    const key = dayKey(date.getTime());
    history.push({
      day: key,
      label: formatter.format(date),
      activeMs: Number(aggregates[key]?.activeMs) || 0,
      isToday: offset === 0,
    });
  }

  return {
    ok: true,
    type: 'DASHBOARD_SNAPSHOT',
    generatedAt: now,
    status: snapshot.status,
    activeMs: snapshot.activeMs,
    openTabs: snapshot.openTabs,
    topDomains: snapshot.topDomains,
    trackingPaused: snapshot.trackingPaused,
    idleState: snapshot.idleState,
    day: snapshot.day,
    history,
  };
}

async function setPaused(paused, now) {
  const settings = await getSettings();
  settings.trackingPaused = Boolean(paused);
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  settingsCache = settings;
  await syncTrackingInternal(now);
  return { ok: true, trackingPaused: settings.trackingPaused };
}

async function setSharing(enabled) {
  const settings = await getSettings();
  settings.shareWithPortfolio = Boolean(enabled);
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  settingsCache = settings;
  return { ok: true, shareWithPortfolio: settings.shareWithPortfolio };
}

async function updateSettings(patch, now) {
  const settings = await getSettings();
  const source = patch && typeof patch === 'object' ? patch : {};

  if ('idleThresholdSeconds' in source) {
    settings.idleThresholdSeconds = clamp(source.idleThresholdSeconds, 15, 300);
  }
  if ('retentionDays' in source) {
    settings.retentionDays = clamp(source.retentionDays, 7, 365);
  }
  if ('incognitoEnabled' in source) {
    settings.incognitoEnabled = Boolean(source.incognitoEnabled);
  }
  if ('excludedDomains' in source) {
    const list = Array.isArray(source.excludedDomains)
      ? source.excludedDomains
      : String(source.excludedDomains || '').split(/[\n,]+/);
    settings.excludedDomains = [...new Set(list.map(normalizeDomainEntry).filter(Boolean))];
  }
  if ('trackingPaused' in source) {
    settings.trackingPaused = Boolean(source.trackingPaused);
  }
  if ('shareWithPortfolio' in source) {
    settings.shareWithPortfolio = Boolean(source.shareWithPortfolio);
  }

  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  settingsCache = settings;
  chrome.idle.setDetectionInterval(settings.idleThresholdSeconds);
  await ensureTickAlarm();
  await syncTrackingInternal(now);
  await pruneAggregates(now);

  return { ok: true, settings };
}

async function clearData(now) {
  await closeInterval(now, true);
  await chrome.storage.local.remove(AGGREGATES_KEY);

  // Restart the live interval without immediately writing a new aggregate.
  // Stored data stays empty until the next flush records elapsed time.
  const desired = await getDesiredActivity();
  state.focusedWindowId = desired.windowId;
  state.activeTabId = desired.tabId;
  state.activeDomain = desired.domain;
  state.intervalStart = desired.trackable ? now : null;
  state.activationDomain = desired.trackable ? desired.domain : null;
  state.activationTabId = desired.trackable ? desired.tabId : null;
  state.lastHeartbeat = now;
  await saveState();

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Chrome event wiring. Listeners are registered synchronously; initialization
// runs in the background and is awaited by every operation.
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener(() => {
  enqueue(async () => {
    const settings = await getSettings();
    if (!settings.trackingStartedAt) {
      settings.trackingStartedAt = Date.now();
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
      settingsCache = settings;
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  enqueue(async () => syncTrackingInternal(Date.now()));
});

chrome.idle.onStateChanged.addListener(newState => {
  enqueue(async () => {
    state.idleState = newState;
    await saveState();
    await syncTrackingInternal(Date.now());
  });
});

chrome.alarms.onAlarm.addListener(alarm => {
  enqueue(async () => {
    if (alarm.name !== TICK_ALARM) return;
    await flushInterval(Date.now());
  });
});

chrome.windows.onFocusChanged.addListener(windowId => {
  enqueue(async () => {
    const now = Date.now();

    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      await closeInterval(now, true);
      state.focusedWindowId = null;
      state.activeTabId = null;
      state.activeDomain = null;
      await saveState();
      await updateTabCount(now);
      return;
    }

    await syncTrackingInternal(now);
  });
});

chrome.windows.onRemoved.addListener(windowId => {
  enqueue(async () => {
    const now = Date.now();
    if (windowId === state.focusedWindowId) {
      await closeInterval(now, true);
      state.focusedWindowId = null;
      state.activeTabId = null;
      state.activeDomain = null;
      await saveState();
    }
    await updateTabCount(now);
  });
});

chrome.tabs.onActivated.addListener(activeInfo => {
  enqueue(async () => {
    if (activeInfo.windowId !== state.focusedWindowId) return;
    await syncTrackingInternal(Date.now());
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  enqueue(async () => {
    if (tabId !== state.activeTabId || tab?.windowId !== state.focusedWindowId) return;
    if (changeInfo.url === undefined && changeInfo.status !== 'complete') return;
    await syncTrackingInternal(Date.now());
  });
});

const handleTabChange = () => enqueue(async () => syncTrackingInternal(Date.now()));

chrome.tabs.onCreated.addListener(handleTabChange);
chrome.tabs.onRemoved.addListener(handleTabChange);
chrome.tabs.onAttached.addListener(handleTabChange);
chrome.tabs.onDetached.addListener(handleTabChange);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[SETTINGS_KEY]) return;

  settingsCache = { ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue || {}) };

  enqueue(async () => {
    chrome.idle.setDetectionInterval(settingsCache.idleThresholdSeconds);
    await ensureTickAlarm();
    await syncTrackingInternal(Date.now());
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') return false;

  enqueue(async () => {
    const now = Date.now();

    switch (message.type) {
      case 'GET_POPUP_DATA':
        return buildSnapshot(now);
      case 'GET_SETTINGS':
        return getSettings();
      case 'SET_PAUSED':
        return setPaused(message.paused, now);
      case 'SET_SHARING':
        return setSharing(message.enabled);
      case 'UPDATE_SETTINGS':
        return updateSettings(message.patch, now);
      case 'CLEAR_DATA':
        return clearData(now);
      default:
        return { ok: false, error: `Unknown message type: ${message.type}` };
    }
  })
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: String(error?.message || error) }));

  return true;
});

/** Validates both the manifest allowlist host and the exact portfolio path. */
function isAllowedDashboardSender(sender) {
  if (!sender || !sender.url || sender.id) return false;

  let url;
  try {
    url = new URL(sender.url);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  const origin = `${url.protocol}//${url.hostname}`;

  if (origin === 'https://kuyapol.github.io') {
    return url.pathname === DASHBOARD_PATH || url.pathname.startsWith(`${DASHBOARD_PATH}/`);
  }

  // Local development only; the manifest allowlist covers localhost ports.
  return origin === 'http://localhost' || origin === 'http://127.0.0.1';
}

function replyExternal(operation, sendResponse) {
  operation
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: String(error?.message || error) }));
  return true;
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== 'string') {
    sendResponse({ ok: false, error: 'Invalid request' });
    return true;
  }

  if (!isAllowedDashboardSender(sender)) {
    sendResponse({ ok: false, error: 'Origin not allowed' });
    return true;
  }

  const now = Date.now();

  if (message.type === 'TRACKER_PING') {
    // Connection discovery only: no statistics are exposed before consent.
    return replyExternal(enqueue(async () => {
      const settings = await getSettings();
      return {
        ok: true,
        connected: true,
        sharingEnabled: Boolean(settings.shareWithPortfolio),
      };
    }), sendResponse);
  }

  if (
    message.type === 'TRACKER_SNAPSHOT' ||
    message.type === 'SET_PAUSED' ||
    message.type === 'CLEAR_DATA'
  ) {
    return replyExternal(enqueue(async () => {
      const settings = await getSettings();
      if (!settings.shareWithPortfolio) return { ok: false, error: 'SHARING_DISABLED' };

      if (message.type === 'TRACKER_SNAPSHOT') return buildDashboardSnapshot(now);
      if (message.type === 'SET_PAUSED') return setPaused(message.paused, now);
      return clearData(now);
    }), sendResponse);
  }

  sendResponse({ ok: false, error: 'Unknown request' });
  return true;
});

readyPromise = initialize().catch(error => {
  console.error('Browser Usage Tracker initialization failed:', error);
});
