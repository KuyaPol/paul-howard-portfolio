import { renderAdminPage } from './admin-page.js';

const RETENTION_SECONDS = 14 * 24 * 60 * 60;
const LOGGED_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const ADMIN_CSP = "default-src 'none'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });

const isAdminPath = (pathname) =>
  pathname === '/admin' || pathname.startsWith('/admin/') ||
  pathname === '/api/admin' || pathname.startsWith('/api/admin/');

const isTrackedPath = (pathname) =>
  pathname.startsWith('/api/') || pathname === '/admin' || pathname.startsWith('/admin/');

const safeRoute = (pathname) => {
  if (pathname === '/api/admin/events') return '/api/admin/events';
  if (pathname.startsWith('/api/')) return '/api/*';
  return '/admin*';
};

const safeMethod = (method) => LOGGED_METHODS.has(method) ? method : 'OTHER';

async function hasAccessIdentity(ctx) {
  try {
    if (!ctx.access || typeof ctx.access.getIdentity !== 'function') return false;
    const identity = await ctx.access.getIdentity();
    return Boolean(identity && typeof identity === 'object');
  } catch {
    return false;
  }
}

async function listEvents(env) {
  if (!env.DB) throw new Error('Event store is unavailable');
  const result = await env.DB.prepare(
    'SELECT event_id, occurred_at, event_type, method, route, status, request_id FROM security_events ORDER BY occurred_at DESC LIMIT ?'
  ).bind(100).all();
  return result.results ?? [];
}

function withAdminHeaders(response, nonce) {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store');
  headers.set('content-security-policy', `${ADMIN_CSP}; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'`);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('x-frame-options', 'DENY');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handleRequest(request, env, ctx, pathname) {
  if (isAdminPath(pathname) && !(await hasAccessIdentity(ctx))) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const html = new Response(renderAdminPage(nonce), {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    return withAdminHeaders(html, nonce);
  }

  if (pathname === '/api/admin/events') {
    if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
    try {
      return jsonResponse({ events: await listEvents(env) });
    } catch {
      return jsonResponse({ error: 'Event store unavailable' }, 503);
    }
  }

  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  if (pathname.startsWith('/api/')) {
    return jsonResponse({ error: 'API endpoint not implemented' }, 501);
  }

  return env.ASSETS.fetch(request);
}

async function writeSecurityEvent(env, event) {
  try {
    if (!env.DB) throw new Error('Event store unavailable');
    await env.DB.prepare(
      'INSERT INTO security_events (event_id, occurred_at, event_type, method, route, status, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      crypto.randomUUID(),
      Math.floor(Date.now() / 1000),
      event.eventType,
        safeMethod(event.method),
      event.route,
      event.status,
      event.requestId,
    ).run();
  } catch {
    // Request logging is best-effort and must not alter the visitor response.
    console.error(JSON.stringify({ event: 'security_event_write_failed' }));
  }
}

async function cleanupExpiredEvents(env) {
  if (!env.DB) throw new Error('Event store unavailable');
  await env.DB.prepare(
    'DELETE FROM security_events WHERE occurred_at < ?'
  ).bind(Math.floor(Date.now() / 1000) - RETENTION_SECONDS).run();
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const tracked = isTrackedPath(pathname);
    const requestId = tracked ? crypto.randomUUID() : null;
    let response;

    try {
      response = await handleRequest(request, env, ctx, pathname);
    } catch {
      response = jsonResponse({ error: 'Internal server error' }, 500);
    }

    if (tracked) {
      const headers = new Headers(response.headers);
      headers.set('x-request-id', requestId);
      response = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      ctx.waitUntil(writeSecurityEvent(env, {
        eventType: isAdminPath(pathname) ? 'admin_request' : 'api_request',
        method: request.method,
        route: safeRoute(pathname),
        status: response.status,
        requestId,
      }));
    }

    return response;
  },

  async scheduled(_controller, env) {
    try {
      await cleanupExpiredEvents(env);
    } catch {
      console.error(JSON.stringify({ event: 'security_event_cleanup_failed' }));
      throw new Error('Security event cleanup failed');
    }
  },
};
