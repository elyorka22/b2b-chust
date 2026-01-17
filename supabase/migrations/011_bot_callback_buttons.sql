-- Добавление настроек для callback кнопок бота

-- Добавление настроек для кнопок "Bot haqida" и "Hamkorlik"
INSERT INTO b2b_bot_settings (key, value)
VALUES 
  ('bot_about_button_text', 'ℹ️ Bot haqida'),
  ('bot_about_message', 'Bu bot B2B Chust do''koni uchun yaratilgan. Bu yerda siz mahsulotlarni ko''rishingiz va buyurtma berishingiz mumkin.'),
  ('bot_partnership_button_text', '🤝 Hamkorlik'),
  ('bot_partnership_message', 'Hamkorlik uchun biz bilan bog''laning:\n\n📞 Telefon: +998 XX XXX XX XX\n📧 Email: info@example.com\n\nBiz sizning taklifingizni kutamiz!')
ON CONFLICT (key) DO NOTHING;

