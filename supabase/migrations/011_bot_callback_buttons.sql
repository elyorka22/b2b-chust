-- Добавление настроек для callback кнопок бота

-- Создание таблицы, если её нет (на случай, если миграция 004 не была выполнена)
CREATE TABLE IF NOT EXISTS b2b_bot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса, если его нет
CREATE INDEX IF NOT EXISTS idx_b2b_bot_settings_key ON b2b_bot_settings(key);

-- Добавление настроек для кнопок "Bot haqida" и "Hamkorlik"
INSERT INTO b2b_bot_settings (key, value)
VALUES 
  ('bot_about_button_text', 'ℹ️ Bot haqida'),
  ('bot_about_message', 'Bu bot B2B Chust do''koni uchun yaratilgan. Bu yerda siz mahsulotlarni ko''rishingiz va buyurtma berishingiz mumkin.'),
  ('bot_partnership_button_text', '🤝 Hamkorlik'),
  ('bot_partnership_message', 'Hamkorlik uchun biz bilan bog''laning:\n\n📞 Telefon: +998 XX XXX XX XX\n📧 Email: info@example.com\n\nBiz sizning taklifingizni kutamiz!')
ON CONFLICT (key) DO NOTHING;

