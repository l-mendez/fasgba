-- Legacy archive only. Do not run directly.
-- Create a new Supabase CLI migration under supabase/migrations instead.

-- Notification broadcast attempt log (one row per sendBroadcast() invocation).
-- Service-role only; no RLS needed.
CREATE TABLE notification_log (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('news_created', 'tournament_created', 'ranking_updated')),
    target_id TEXT,
    club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
    recipients_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('sent', 'no_recipients', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notification_log_created_at_idx ON notification_log (created_at DESC);
CREATE INDEX notification_log_type_status_idx ON notification_log (type, status);
