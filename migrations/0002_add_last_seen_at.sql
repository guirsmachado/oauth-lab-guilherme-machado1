-- Adiciona um campo de atividade sem alterar os dados existentes.
ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;
