-- Добавление настроек бота и поддержки уведомлений

-- ============================================
-- 1. Таблица настроек бота
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_b2b_bot_settings_key ON b2b_bot_settings(key);

-- Вставка дефолтного welcome message
INSERT INTO b2b_bot_settings (key, value)
VALUES ('welcome_message', 'Salom! 👋' || E'\n\n' || 'B2B Chust do''koniga xush kelibsiz!')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. Добавление поля telegram_chat_id в b2b_users
-- ============================================
ALTER TABLE b2b_users 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Индекс для поиска по telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_b2b_users_telegram_chat_id ON b2b_users(telegram_chat_id);

-- ============================================
-- 3. RLS для b2b_bot_settings
-- ============================================
ALTER TABLE b2b_bot_settings ENABLE ROW LEVEL SECURITY;

-- Публичный доступ для чтения (для бота)
DROP POLICY IF EXISTS "Bot settings are viewable by everyone" ON b2b_bot_settings;
CREATE POLICY "Bot settings are viewable by everyone"
  ON b2b_bot_settings FOR SELECT
  USING (true);

-- Публичный доступ для записи (через Service Role)
DROP POLICY IF EXISTS "Bot settings can be updated" ON b2b_bot_settings;
CREATE POLICY "Bot settings can be updated"
  ON b2b_bot_settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. Триггер для обновления updated_at
-- ============================================
CREATE TRIGGER update_b2b_bot_settings_updated_at
  BEFORE UPDATE ON b2b_bot_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Комментарии
-- ============================================
COMMENT ON TABLE b2b_bot_settings IS 'Настройки Telegram бота (welcome message и другие)';
COMMENT ON COLUMN b2b_users.telegram_chat_id IS 'Telegram Chat ID продавца для отправки уведомлений о заказах';

