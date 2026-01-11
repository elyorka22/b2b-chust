-- ============================================
-- Создание супер-админа
-- ============================================
-- 
-- ИНСТРУКЦИЯ:
-- 1. Сначала сгенерируйте хеш пароля:
--    cd backend && node ../scripts/generate-password-hash.js ваш_пароль
--
-- 2. Замените 'YOUR_PASSWORD_HASH_HERE' на полученный хеш
-- 3. При необходимости измените 'admin' на другое имя пользователя
-- 4. Выполните этот SQL запрос в Supabase SQL Editor
--
-- ============================================

INSERT INTO b2b_users (username, password_hash, role, store_name)
VALUES (
  'admin',  -- Имя пользователя (можно изменить)
  'YOUR_PASSWORD_HASH_HERE',  -- ⚠️ ЗАМЕНИТЕ на хеш из скрипта generate-password-hash.js
  'super-admin',
  NULL  -- У супер-админа нет магазина
)
ON CONFLICT (username) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  store_name = EXCLUDED.store_name;

-- Проверка создания супер-админа
SELECT 
  id, 
  username, 
  role, 
  store_name, 
  created_at,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✅ Пароль установлен'
    ELSE '❌ Пароль не установлен'
  END as password_status
FROM b2b_users 
WHERE username = 'admin' AND role = 'super-admin';
