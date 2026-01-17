-- Настройки страницы контактов для продавцов

-- Вставка дефолтных данных страницы контактов
INSERT INTO b2b_bot_settings (key, value)
VALUES 
  ('contact_page_title', 'Sotuvchi sifatida ro''yxatdan o''tish'),
  ('contact_page_description', 'Sizning foydalanuvchi nomingiz yoki parolingiz tizimda topilmadi. Sotuvchi sifatida ro''yxatdan o''tish uchun quyidagi ma''lumotlar bilan bog''laning:'),
  ('contact_page_phone', '+998 (90) 123-45-67'),
  ('contact_page_email', 'info@b2bchust.uz'),
  ('contact_page_telegram', '@b2bchust_support'),
  ('contact_page_address', 'Chust shahri, O''zbekiston'),
  ('contact_page_how_it_works', 'Biz bilan bog''laning va sotuvchi sifatida ro''yxatdan o''tish so''rovingizni yuboring|Biz sizga foydalanuvchi nomi va parol yaratamiz|Yaratilgan ma''lumotlar bilan tizimga kirishingiz mumkin|O''z mahsulotlaringizni qo''shish va buyurtmalarni boshqarishni boshlashingiz mumkin')
ON CONFLICT (key) DO NOTHING;





