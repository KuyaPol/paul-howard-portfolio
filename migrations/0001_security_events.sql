CREATE TABLE security_events (
  event_id TEXT PRIMARY KEY,
  occurred_at INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('api_request', 'admin_request')),
  method TEXT NOT NULL,
  route TEXT NOT NULL,
  status INTEGER NOT NULL CHECK (status BETWEEN 100 AND 599),
  request_id TEXT NOT NULL UNIQUE
);

CREATE INDEX security_events_occurred_at
  ON security_events (occurred_at);
