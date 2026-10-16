-- Migração temporariamente inválida para demonstrar a falha do CI.
CREATE INDEZ IF NOT EXISTS idx_sessions_last_seen_at ON sessions(last_seen_at);
