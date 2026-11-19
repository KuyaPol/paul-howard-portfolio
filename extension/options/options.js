import { normalizeDomainEntry } from '../shared/aggregate.js';

const form = document.getElementById('settings-form');
const fields = {
  paused: document.getElementById('paused'),
  share: document.getElementById('share'),
  incognito: document.getElementById('incognito'),
  idleThreshold: document.getElementById('idle-threshold'),
  retention: document.getElementById('retention'),
  excluded: document.getElementById('excluded'),
  status: document.getElementById('status'),
};

async function send(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

async function load() {
  const settings = await send({ type: 'GET_SETTINGS' });
  if (!settings || settings.ok === false) {
    fields.status.textContent = settings?.error || 'Could not load settings.';
    return;
  }

  fields.paused.checked = Boolean(settings.trackingPaused);
  fields.share.checked = Boolean(settings.shareWithPortfolio);
  fields.incognito.checked = Boolean(settings.incognitoEnabled);
  fields.idleThreshold.value = String(settings.idleThresholdSeconds ?? 60);
  fields.retention.value = String(settings.retentionDays ?? 90);
  fields.excluded.value = (settings.excludedDomains || []).join('\n');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  fields.status.textContent = 'Saving…';

  const rawDomains = fields.excluded.value.split(/[\n,]+/);
  const result = await send({
    type: 'UPDATE_SETTINGS',
    patch: {
      trackingPaused: fields.paused.checked,
      shareWithPortfolio: fields.share.checked,
      incognitoEnabled: fields.incognito.checked,
      idleThresholdSeconds: fields.idleThreshold.value,
      retentionDays: fields.retention.value,
      excludedDomains: rawDomains,
    },
  });

  if (!result || result.ok === false) {
    fields.status.textContent = result?.error || 'Could not save settings.';
    return;
  }

  const saved = result.settings || {};
  fields.excluded.value = (saved.excludedDomains || []).join('\n');
  fields.status.textContent = 'Saved.';
});

load();
