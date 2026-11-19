const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Security events · Portfolio admin</title>
    <style nonce="__NONCE__">
      @font-face { font-family: "Manrope"; src: url("/fonts/Manrope-variable.ttf") format("truetype"); font-style: normal; font-weight: 400 800; font-display: swap; }
      :root { color-scheme: light; font-family: "Manrope", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #17221d; background: #f3f5f1; font-synthesis: none; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; }
      main { width: min(1080px, calc(100% - 40px)); margin: 0 auto; padding: 54px 0 72px; }
      header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 30px; }
      .eyebrow { margin: 0 0 10px; color: #4d6a59; font-size: 12px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(30px, 5vw, 46px); line-height: 1.05; letter-spacing: -.045em; }
      .intro { margin: 12px 0 0; color: #657169; font-size: 15px; }
      button { border: 1px solid #cbd5ce; border-radius: 8px; padding: 10px 15px; color: #183b29; background: #fff; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
      button:hover { background: #edf3ee; }
      button:focus-visible { outline: 3px solid #85b99a; outline-offset: 2px; }
      .panel { overflow: hidden; border: 1px solid #dce3dc; border-radius: 12px; background: #fff; box-shadow: 0 12px 36px rgb(31 52 39 / 5%); }
      .panel-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 18px 20px; border-bottom: 1px solid #e7ece7; }
      h2 { margin: 0; font-size: 15px; letter-spacing: -.01em; }
      #status { color: #657169; font-size: 13px; }
      .table-wrap { overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap; }
      th { padding: 12px 20px; color: #647168; background: #f8faf7; font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
      td { padding: 14px 20px; border-top: 1px solid #edf0ed; font-size: 13px; }
      td code { color: #345744; font: 12px ui-monospace, SFMono-Regular, Consolas, monospace; }
      .empty { padding: 38px 20px; color: #657169; text-align: center; }
      @media (max-width: 640px) { main { width: min(100% - 24px, 1080px); padding-top: 32px; } header { align-items: flex-start; flex-direction: column; } .panel-head { align-items: flex-start; flex-direction: column; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <p class="eyebrow">Private workspace</p>
          <h1>Security events</h1>
          <p class="intro">Recent requests handled by the portfolio Worker.</p>
        </div>
        <button id="refresh" type="button">Refresh events</button>
      </header>
      <section class="panel" aria-labelledby="events-heading">
        <div class="panel-head">
          <h2 id="events-heading">Latest 100 events</h2>
          <span id="status" role="status" aria-live="polite">Loading…</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Time (UTC)</th><th>Type</th><th>Method</th><th>Route</th><th>Status</th><th>Request ID</th></tr></thead>
            <tbody id="events"><tr><td class="empty" colspan="6">Loading events…</td></tr></tbody>
          </table>
        </div>
      </section>
    </main>
    <script nonce="__NONCE__">
      const status = document.querySelector('#status');
      const rows = document.querySelector('#events');
      const cell = (value, code = false) => {
        const element = document.createElement('td');
        if (code) {
          const codeElement = document.createElement('code');
          codeElement.textContent = value;
          element.append(codeElement);
        } else {
          element.textContent = value;
        }
        return element;
      };
      async function loadEvents() {
        status.textContent = 'Loading…';
        try {
          const response = await fetch('/api/admin/events', { headers: { accept: 'application/json' }, cache: 'no-store' });
          if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Access check failed.' : 'Could not load events.');
          const data = await response.json();
          rows.replaceChildren();
          if (!Array.isArray(data.events) || data.events.length === 0) {
            const row = document.createElement('tr');
            const empty = cell('No security events have been recorded yet.');
            empty.colSpan = 6;
            empty.className = 'empty';
            row.append(empty);
            rows.append(row);
          } else {
            for (const event of data.events) {
              const row = document.createElement('tr');
              row.append(
                cell(new Date(event.occurred_at * 1000).toISOString().replace('T', ' ').replace('.000Z', ' UTC')),
                cell(event.event_type),
                cell(event.method),
                cell(event.route, true),
                cell(String(event.status)),
                cell(event.request_id, true),
              );
              rows.append(row);
            }
          }
          status.textContent = 'Updated just now';
        } catch (error) {
          rows.replaceChildren();
          const row = document.createElement('tr');
          const message = cell(error instanceof Error ? error.message : 'Could not load events.');
          message.colSpan = 6;
          message.className = 'empty';
          row.append(message);
          rows.append(row);
          status.textContent = 'Unavailable';
        }
      }
      document.querySelector('#refresh').addEventListener('click', loadEvents);
      loadEvents();
    </script>
  </body>
</html>`;

export function renderAdminPage(nonce) {
  return page.replaceAll('__NONCE__', nonce);
}
