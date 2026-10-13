-- Dispositivos e histórico de notificações do Poliweb.
-- Idempotente: pode rodar de novo no mesmo banco da API (PostgreSQL).

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_devices (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('expo', 'apns', 'webpush')),
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  user_id TEXT,
  city_id TEXT,
  city_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'owner')),
  categories TEXT[] NOT NULL DEFAULT '{}',
  subscription JSONB,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_devices_token_type_unique UNIQUE (token_type, token)
);

CREATE INDEX IF NOT EXISTS push_devices_segment_idx
  ON push_devices (city_id, role, user_id)
  WHERE invalidated_at IS NULL;

CREATE INDEX IF NOT EXISTS push_devices_categories_idx
  ON push_devices USING GIN (categories);

CREATE TABLE IF NOT EXISTS push_campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  path TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_count INTEGER NOT NULL DEFAULT 0,
  targeted_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  invalidated_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed')),
  error TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS push_campaigns_created_idx
  ON push_campaigns (created_at DESC);
