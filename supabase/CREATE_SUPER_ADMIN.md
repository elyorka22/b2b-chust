# Создание супер-админа

## Способ 1: Использование скрипта (Рекомендуется)

### Шаг 1: Генерация хеша пароля

```bash
cd backend
node ../scripts/generate-password-hash.js ваш_пароль
```

**Пример:**
```bash
node ../scripts/generate-password-hash.js Admin123!
```

Скрипт выведет хеш пароля, который нужно использовать в SQL запросе.

### Шаг 2: Выполнение SQL в Supabase

1. Откройте **Supabase Dashboard** → **SQL Editor**
2. Выполните следующий SQL запрос, заменив `YOUR_PASSWORD_HASH` на хеш из шага 1:

```sql
INSERT INTO b2b_users (username, password_hash, role, store_name)
VALUES (
  'admin',  -- Замените на желаемое имя пользователя
  'YOUR_PASSWORD_HASH',  -- Вставьте хеш из скрипта
  'super-admin',
  NULL
)
ON CONFLICT (username) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  store_name = EXCLUDED.store_name;
```

### Шаг 3: Проверка

```sql
SELECT id, username, role, store_name, created_at 
FROM b2b_users 
WHERE username = 'admin' AND role = 'super-admin';
```

---

## Способ 2: Использование Node.js напрямую

Если у вас установлен Node.js и bcryptjs:

```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('ваш_пароль', 10, (err, hash) => { if (err) console.error(err); else console.log(hash); });"
```

---

## Способ 3: Онлайн генератор bcrypt

1. Откройте https://bcrypt-generator.com/
2. Введите пароль
3. Установите rounds = 10
4. Скопируйте сгенерированный хеш
5. Используйте в SQL запросе

---

## Важные замечания

- ⚠️ **Пароль должен содержать минимум 6 символов**
- 🔒 **Храните пароль в безопасном месте**
- 👤 **Имя пользователя должно быть уникальным**
- 🔄 **Если пользователь уже существует, запрос обновит его пароль и роль**

---

## Пример полного SQL запроса

```sql
-- Создание супер-админа с именем 'admin' и паролем 'Admin123!'
-- (хеш был сгенерирован заранее)

INSERT INTO b2b_users (username, password_hash, role, store_name)
VALUES (
  'admin',
  '$2a$10$XxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx',  -- Замените на реальный хеш
  'super-admin',
  NULL
)
ON CONFLICT (username) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  store_name = EXCLUDED.store_name;

-- Проверка
SELECT id, username, role, created_at 
FROM b2b_users 
WHERE username = 'admin';
```

---

## Вход в систему

После создания супер-админа:

1. Откройте сайт: `/login`
2. Выберите "Sotuvchi"
3. Введите:
   - **Username:** `admin` (или то имя, которое вы указали)
   - **Password:** ваш пароль
4. Нажмите "Kirish"

Вы будете перенаправлены в админ-панель с полным доступом ко всем функциям.

