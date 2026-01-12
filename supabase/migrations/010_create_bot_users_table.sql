-- Создание таблицы для пользователей Telegram бота

CREATE TABLE IF NOT EXISTS b2b_bot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по chat_id
CREATE INDEX IF NOT EXISTS idx_b2b_bot_users_chat_id ON b2b_bot_users(chat_id);

-- Индекс для поиска активных пользователей
CREATE INDEX IF NOT EXISTS idx_b2b_bot_users_last_activity ON b2b_bot_users(last_activity);

-- RLS политики (если нужно)
ALTER TABLE b2b_bot_users ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения и записи (через Service Role)
DROP POLICY IF EXISTS "Bot users are accessible by service role" ON b2b_bot_users;
CREATE POLICY "Bot users are accessible by service role"
  ON b2b_bot_users FOR ALL
  USING (true)
  WITH CHECK (true);

