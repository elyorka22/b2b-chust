# Настройка Railway + Supabase + Telegram Bot

## 🎯 Архитектура решения

```
Telegram Bot → Railway (Next.js сайт) → Supabase (PostgreSQL)
```

### Преимущества этой схемы:
- ✅ **Railway**: Простой деплой, автоматический HTTPS, свой домен
- ✅ **Supabase**: Готовая PostgreSQL БД с API, аутентификацией, realtime
- ✅ **Telegram Bot**: Встроенный веб-интерфейс через Web App
- ✅ **Масштабируемость**: Легко масштабировать при росте бизнеса
- ✅ **Безопасность**: Row Level Security (RLS) в Supabase

## 📋 План миграции

### 1. Настройка Supabase

1. Создать проект на [supabase.com](https://supabase.com)
2. Получить:
   - Project URL
   - Anon Key
   - Service Role Key (для миграций)

### 2. Создание таблиц в Supabase

Нужно создать таблицы:
- `products` - товары
- `orders` - заказы
- `users` - пользователи (магазины и супер-админы)
- `customers` - покупатели

### 3. Миграция кода

- Заменить `lib/db.ts` на Supabase клиент
- Обновить все API маршруты
- Настроить RLS политики

### 4. Деплой на Railway

- Подключить GitHub репозиторий
- Настроить переменные окружения
- Railway автоматически создаст домен

### 5. Интеграция с Telegram Bot

- Использовать Telegram Web App API
- Railway домен будет использоваться как Web App URL

## 🚀 Быстрый старт

### Шаг 1: Установка Supabase клиента

```bash
npm install @supabase/supabase-js
```

### Шаг 2: Создание таблиц

Используйте SQL миграции в Supabase Dashboard или через MCP инструменты.

### Шаг 3: Настройка переменных окружения

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

### Шаг 4: Деплой на Railway

1. Подключите GitHub репозиторий к Railway
2. Railway автоматически определит Next.js проект
3. Добавьте переменные окружения
4. Railway создаст домен вида: `your-app.railway.app`

## 💡 Использование в Telegram Bot

### Telegram Web App

```javascript
// В Telegram Bot коде
const webAppUrl = 'https://your-app.railway.app';

// Отправка кнопки с Web App
bot.api.sendMessage(chatId, 'Открыть магазин', {
  reply_markup: {
    inline_keyboard: [[
      {
        text: '🛒 Открыть магазин',
        web_app: { url: webAppUrl }
      }
    ]]
  }
});
```

### Преимущества Web App:
- ✅ Полнофункциональный веб-интерфейс
- ✅ Работает внутри Telegram
- ✅ Доступ к Telegram API (пользователь, фото профиля)
- ✅ Платежи через Telegram Payments

## 📊 Схема базы данных

### Таблица: products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT CHECK (unit IN ('dona', 'upakovka', 'karobka')),
  image TEXT,
  category TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  store_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK (role IN ('super-admin', 'magazin')) NOT NULL,
  store_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Таблица: customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  address TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Row Level Security (RLS)

Настроить политики безопасности в Supabase:

```sql
-- Магазины видят только свои товары
CREATE POLICY "Магазины видят только свои товары"
ON products FOR SELECT
USING (
  store_id = auth.uid() OR 
  store_id IS NULL -- Супер-админ видит все
);

-- Магазины видят только заказы со своими товарами
-- (требует более сложной логики через функции)
```

## 💰 Стоимость

### Railway
- **Hobby**: $5/месяц (512MB RAM, 1GB storage)
- **Pro**: $20/месяц (2GB RAM, 10GB storage)

### Supabase
- **Free**: 500MB БД, 2GB bandwidth
- **Pro**: $25/месяц (8GB БД, 50GB bandwidth)

**Итого для старта**: ~$0-5/месяц (можно начать с бесплатных планов)

## ✅ Преимущества для бизнеса

1. **Быстрый запуск**: Railway + Supabase = готово за час
2. **Масштабируемость**: Легко увеличить ресурсы
3. **Надежность**: Автоматические бэкапы в Supabase
4. **Безопасность**: RLS, HTTPS из коробки
5. **Telegram интеграция**: Нативная поддержка Web Apps
6. **Мобильность**: Работает на всех устройствах через Telegram

## 🎯 Рекомендации

1. **Начните с бесплатных планов** - достаточно для MVP
2. **Используйте Supabase RLS** - безопасность из коробки
3. **Настройте мониторинг** - Railway показывает метрики
4. **Используйте Telegram Payments** - для приема платежей
5. **Настройте резервное копирование** - Supabase делает автоматически

## 📝 Следующие шаги

1. ✅ Создать проект Supabase
2. ✅ Создать таблицы через SQL
3. ✅ Мигрировать код на Supabase клиент
4. ✅ Настроить RLS политики
5. ✅ Деплой на Railway
6. ✅ Интеграция с Telegram Bot

