export const AGGREGATES_KEY = 'aggregates';
export const SETTINGS_KEY = 'settings';

export const DEFAULT_SETTINGS = {
  trackingPaused: false,
  idleThresholdSeconds: 60,
  retentionDays: 90,
  excludedDomains: [],
  incognitoEnabled: false,
  shareWithPortfolio: false,
  trackingStartedAt: null,
};

const DAY_MS = 24 * 60 * 60 * 1000;

// A small, dependency-free subset of common multi-part public suffixes.
// This keeps "www.bbc.co.uk" as "bbc.co.uk" without a large PSL bundle.
const MULTI_PART_SUFFIXES = new Set([
  'ac.uk', 'co.uk', 'gov.uk', 'ltd.uk', 'me.uk', 'net.uk', 'nhs.uk', 'org.uk', 'plc.uk', 'police.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au', 'id.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz',
  'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
  'co.kr', 'ne.kr', 'or.kr', 'go.kr',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn',
  'com.mx', 'org.mx', 'gob.mx',
  'co.in', 'net.in', 'org.in', 'gov.in',
  'com.sg', 'net.sg', 'org.sg', 'gov.sg',
  'co.za', 'org.za', 'gov.za',
]);

function hasMultiPartSuffix(labels) {
  if (labels.length < 3) return false;
  return MULTI_PART_SUFFIXES.has(labels.slice(-2).join('.'));
}

/**
 * Returns only a normalized registrable domain, or null for schemes that
 * should not be counted. Never returns a path, query string, or fragment.
 */
export function normalizeDomain(input) {
  if (typeof input !== 'string' || !input.trim()) return null;

  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost')) return null;

  // Keep literal IP addresses as-is; there is no public suffix to resolve.
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return hostname;

  const labels = hostname.split('.').filter(Boolean);
  if (labels.length < 2) return null;

  return hasMultiPartSuffix(labels) ? labels.slice(-3).join('.') : labels.slice(-2).join('.');
}

/** Accepts either a bare domain or a URL and returns a normalized domain. */
export function normalizeDomainEntry(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  return normalizeDomain(candidate);
}

export function dayKey(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Splits an interval at local-midnight boundaries so daily totals stay correct. */
export function splitIntervalByDay(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  const parts = [];
  let cursor = start;

  while (cursor < end) {
    const date = new Date(cursor);
    const nextMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const segmentEnd = Math.min(end, nextMidnight);
    parts.push({
      key: dayKey(cursor),
      start: cursor,
      end: segmentEnd,
      ms: segmentEnd - cursor,
    });
    cursor = segmentEnd;
  }

  return parts;
}

export function pruneOldDays(aggregates, retentionDays, now) {
  const days = Math.max(1, Number(retentionDays) || 90);
  const cutoff = dayKey(now - (days - 1) * DAY_MS);

  for (const key of Object.keys(aggregates)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && key < cutoff) delete aggregates[key];
  }
}

export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = value => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  if (minutes) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}
