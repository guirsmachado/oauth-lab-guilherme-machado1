-- Índice para consultas de sessões ordenadas pelo último acesso.
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen_at ON sessions(last_seen_at);
