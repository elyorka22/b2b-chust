# Railway Deployment Guide

## 🏗️ Архитектура приложения

### Next.js Full-Stack приложение

Ваше приложение построено на **Next.js 15**, который является **full-stack фреймворком**:
- ✅ **Фронтенд**: React компоненты, страницы (SSR/SSG)
- ✅ **Бэкенд**: API Routes (Serverless Functions)
- ✅ **Telegram Bot**: Работает через API маршруты, не отдельный сервис

### Railway определит это как:
- **Один сервис** - Next.js приложение
- **Автоматически определит** Next.js из `package.json`
- **Запустит** `npm run build` и `npm start`
- **Создаст** один домен для всего приложения

## 📋 Все маршруты приложения

### Frontend страницы (SSR):
- `/` - Главная страница (каталог товаров)
- `/login` - Страница входа (покупатель/продавец)
- `/cart` - Корзина
- `/stores` - Каталог магазинов
- `/stores/[id]` - Страница магазина
- `/contact` - Страница контактов
- `/admin/login` - Вход в админ-панель
- `/admin` - Админ-панель (super-admin/magazin)

### Backend API маршруты:
- `GET /api/products` - Получить все товары
- `POST /api/products` - Создать товар
- `GET /api/products/[id]` - Получить товар
- `PUT /api/products/[id]` - Обновить товар
- `DELETE /api/products/[id]` - Удалить товар
- `GET /api/orders` - Получить все заказы
- `POST /api/orders` - Создать заказ
- `PATCH /api/orders/[id]` - Обновить заказ
- `GET /api/stats` - Статистика
- `POST /api/auth/login` - Вход (магазины/админы)
- `POST /api/users` - Создать пользователя
- `POST /api/customers/login` - Вход покупателя
- `POST /api/customers/register` - Регистрация покупателя
- `POST /api/telegram/send` - Отправить сообщение через бота
- `GET /api/telegram/stats` - Статистика бота

## 🚂 Как Railway работает с Next.js

### 1. Автоматическое определение
Railway автоматически определит Next.js по:
- `package.json` с зависимостями `next`, `react`, `react-dom`
- Наличию `next.config.js`
- Структуре папок `app/` или `pages/`

### 2. Build процесс
```bash
# Railway автоматически выполнит:
npm install
npm run build  # Соберет Next.js приложение
npm start      # Запустит production сервер
```

### 3. Один сервис = один домен
- Все работает на одном домене: `https://your-app.railway.app`
- Фронтенд: `https://your-app.railway.app/`
- API: `https://your-app.railway.app/api/*`
- Telegram Bot использует API: `https://your-app.railway.app/api/telegram/*`

## 🤖 Telegram Bot - не отдельный сервис

### Как работает:
1. **Telegram Bot** - это просто API клиент
2. **Бот работает через ваши API маршруты**:
   - `/api/telegram/send` - отправка сообщений
   - `/api/telegram/stats` - статистика
3. **Нет отдельного процесса** для бота
4. **Бот управляется из админ-панели** через веб-интерфейс

### Если нужен отдельный Telegram Bot сервис:
Можно создать отдельный сервис на Railway:
- Node.js скрипт с `node-telegram-bot-api`
- Webhook для получения сообщений
- Но для вашего случая это не нужно!

## 📝 Railway Configuration

### Создайте `railway.json` (опционально):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Или используйте `Procfile`:

```
web: npm start
```

## 🔧 Переменные окружения для Railway

Добавьте в Railway Settings > Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=8245918342:AAFda9PUa0zstDVben0EVaQm9oC5yeG4qCA

# JWT
JWT_SECRET=your-jwt-secret

# Environment
NODE_ENV=production
PORT=3000
```

## ✅ Проверка готовности

### Все маршруты созданы:
- ✅ Frontend страницы (7 страниц)
- ✅ Backend API (13 маршрутов)
- ✅ Telegram Bot API (2 маршрута)

### Railway определит:
- ✅ Next.js приложение автоматически
- ✅ Запустит build и start команды
- ✅ Создаст один домен для всего

## 🎯 Итоговая архитектура

```
┌─────────────────────────────────────┐
│     Railway (один сервис)           │
│  ┌───────────────────────────────┐  │
│  │   Next.js Full-Stack App       │  │
│  │                                │  │
│  │  Frontend (React/SSR):         │  │
│  │  - /, /login, /cart, /stores  │  │
│  │  - /admin, /admin/login        │  │
│  │                                │  │
│  │  Backend (API Routes):         │  │
│  │  - /api/products/*             │  │
│  │  - /api/orders/*               │  │
│  │  - /api/telegram/*             │  │
│  │  - /api/auth/*                 │  │
│  └───────────────────────────────┘  │
│           ↓                         │
│  ┌───────────────────────────────┐  │
│  │      Supabase (PostgreSQL)     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           ↓
┌───────────────────────────────┐
│   Telegram Bot (через API)   │
│   - Отправка сообщений        │
│   - Статистика                │
└───────────────────────────────┘
```

## 🚀 Деплой на Railway

1. **Подключите GitHub репозиторий**
2. **Railway автоматически определит Next.js**
3. **Добавьте переменные окружения**
4. **Railway задеплоит всё как один сервис**
5. **Получите домен**: `https://your-app.railway.app`

**Всё готово! Railway определит и задеплоит всё автоматически.** ✅

