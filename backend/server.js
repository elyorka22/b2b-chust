import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS настройка для работы с Frontend
const getFrontendUrl = () => {
  const url = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Если URL не начинается с http:// или https://, добавляем https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

const allowedOrigins = [
  getFrontendUrl(),
  'http://localhost:3000',
  'http://localhost:3001',
  // Добавляем также вариант без протокола на случай, если он указан в переменной
  process.env.FRONTEND_URL ? `https://${process.env.FRONTEND_URL.replace(/^https?:\/\//, '')}` : null,
  // Telegram Web App origins
  'https://web.telegram.org',
  'https://webk.telegram.org',
  'https://webz.telegram.org',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, из Postman или мобильных приложений)
    if (!origin) {
      console.log('[CORS] Запрос без origin - разрешаем');
      return callback(null, true);
    }
    
    console.log('[CORS] Запрос от origin:', origin);
    
    // Проверяем, есть ли origin в списке разрешенных
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      console.log('[CORS] Origin разрешен (в списке)');
      callback(null, true);
    } else if (origin.includes('telegram.org')) {
      // Разрешаем все Telegram Web App origins
      console.log('[CORS] Origin разрешен (Telegram Web App)');
      callback(null, true);
    } else {
      // Для отладки: логируем все origins
      console.log('[CORS] Неизвестный origin, но разрешаем для отладки:', origin);
      console.log('[CORS] Разрешенные origins:', allowedOrigins);
      // Временно разрешаем все для отладки
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

// Supabase клиент
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Вспомогательные функции
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function createToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware для проверки авторизации
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.['auth-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// ========== PRODUCTS API ==========
app.get('/api/products', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Пытаемся получить пользователя из токена (необязательно)
    let user = null;
    let hasToken = false;
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.['auth-token'];
      if (token) {
        hasToken = true;
        const decoded = jwt.verify(token, JWT_SECRET);
        user = decoded;
        console.log('[PRODUCTS API] Пользователь найден:', { id: user.id, role: user.role });
      } else {
        console.log('[PRODUCTS API] Токен не найден, показываем все товары (публичный каталог)');
      }
    } catch (error) {
      // Если токен невалиден или отсутствует, user остается null
      console.log('[PRODUCTS API] Токен невалиден или отсутствует, показываем все товары (публичный каталог)');
    }

    let query = supabaseAdmin
      .from('b2b_products')
      .select('*')
      .order('created_at', { ascending: false });

    // Фильтруем по магазину ТОЛЬКО если:
    // 1. Пользователь авторизован (есть валидный токен)
    // 2. Роль пользователя - магазин
    // 3. Запрос идет из админ-панели (не публичный каталог)
    // Для публичного каталога (без токена) всегда показываем все товары
    if (hasToken && user && user.role === 'magazin') {
      // Проверяем, не является ли это запросом из публичного каталога
      // Если токен есть, но это может быть публичный каталог с сохраненным токеном,
      // то все равно фильтруем по магазину для безопасности админ-панели
      // Но для публичного просмотра каталога токен не должен отправляться
      console.log('[PRODUCTS API] Фильтруем товары для магазина:', user.id);
      query = query.eq('store_id', user.id);
    } else {
      console.log('[PRODUCTS API] Показываем все товары (публичный каталог или не магазин)');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PRODUCTS API] Ошибка получения товаров:', error);
      throw error;
    }
    
    console.log('[PRODUCTS API] Возвращено товаров:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { name, description, price, unit, image, category, stock, storeId } = req.body;

    console.log('Backend: Создание товара:', { name, image, hasImage: !!image, imageLength: image?.length });

    if (!name || !description || price === undefined || stock === undefined || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const store_id = req.user.role === 'magazin' ? req.user.id : storeId || null;

    // Если это магазин и это его первый товар, устанавливаем дату начала подписки
    if (store_id && req.user.role === 'magazin') {
      const { data: userProducts } = await supabaseAdmin
        .from('b2b_products')
        .select('id')
        .eq('store_id', store_id)
        .limit(1);

      if (!userProducts || userProducts.length === 0) {
        // Это первый товар магазина - устанавливаем дату начала подписки
        const { data: user } = await supabaseAdmin
          .from('b2b_users')
          .select('subscription_start_date, subscription_price, subscription_balance')
          .eq('id', store_id)
          .single();

        if (user && !user.subscription_start_date) {
          const subscriptionPrice = user.subscription_price || 0;
          await supabaseAdmin
            .from('b2b_users')
            .update({
              subscription_start_date: new Date().toISOString(),
              subscription_balance: subscriptionPrice, // Начальный баланс = цена подписки
            })
            .eq('id', store_id);
          
          console.log(`[SUBSCRIPTION] Установлена дата начала подписки для магазина ${store_id}, баланс: ${subscriptionPrice}`);
        }
      }
    }

    const insertData = {
      name,
      description,
      price,
      unit: unit || 'dona',
      image: image || null,
      category: category || null,
      stock,
      store_id,
    };

    console.log('Backend: Данные для вставки в Supabase:', insertData);

    const { data, error } = await supabaseAdmin
      .from('b2b_products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Backend: Ошибка при создании товара в Supabase:', error);
      throw error;
    }

    console.log('Backend: Товар создан в Supabase:', { id: data.id, image: data.image });
    res.status(201).json(data);
  } catch (error) {
    console.error('Backend: Ошибка при создании товара:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const product = await supabaseAdmin.from('b2b_products').select('*').eq('id', id).single();

    if (product.error || !product.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'magazin' && product.data.store_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_products')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const product = await supabaseAdmin.from('b2b_products').select('*').eq('id', id).single();

    if (product.error || !product.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'magazin' && product.data.store_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabaseAdmin
      .from('b2b_products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CATEGORIES API ==========
app.get('/api/categories', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('[CATEGORIES] Ошибка получения категорий:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_categories')
      .insert({
        name: name.trim(),
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('[CATEGORIES] Ошибка создания категории:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_categories')
      .update({
        name: name.trim(),
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[CATEGORIES] Ошибка обновления категории:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('b2b_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('[CATEGORIES] Ошибка удаления категории:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SUBSCRIPTIONS API ==========
app.get('/api/subscriptions', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Получаем все магазины с информацией о подписке
    const { data: stores, error } = await supabaseAdmin
      .from('b2b_users')
      .select('id, username, store_name, subscription_price, subscription_start_date, subscription_balance, created_at')
      .eq('role', 'magazin')
      .order('store_name', { ascending: true });

    if (error) throw error;

    // Вычисляем информацию о подписке для каждого магазина
    const subscriptions = (stores || []).map(store => {
      let daysRemaining = null;
      let nextPaymentDate = null;
      let monthsSinceStart = null;

      if (store.subscription_start_date) {
        const startDate = new Date(store.subscription_start_date);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        
        // Следующая дата оплаты - начало следующего месяца от даты начала
        const nextPayment = new Date(startDate);
        nextPayment.setMonth(startDate.getMonth() + monthsDiff + 1);
        nextPayment.setDate(startDate.getDate());
        
        const daysUntilNext = Math.ceil((nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        daysRemaining = daysUntilNext;
        nextPaymentDate = nextPayment.toISOString();
        monthsSinceStart = monthsDiff;
      }

      return {
        ...store,
        daysRemaining,
        nextPaymentDate,
        monthsSinceStart,
      };
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('[SUBSCRIPTIONS] Ошибка получения подписок:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/subscriptions/my', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'magazin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: store, error } = await supabaseAdmin
      .from('b2b_users')
      .select('id, username, store_name, subscription_price, subscription_start_date, subscription_balance, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    let daysRemaining = null;
    let nextPaymentDate = null;
    let monthsSinceStart = null;
    let isActive = true; // Подписка всегда активна, даже при отрицательном балансе

    if (store.subscription_start_date) {
      const startDate = new Date(store.subscription_start_date);
      const now = new Date();
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      
      // Следующая дата оплаты - начало следующего месяца от даты начала
      const nextPayment = new Date(startDate);
      nextPayment.setMonth(startDate.getMonth() + monthsDiff + 1);
      nextPayment.setDate(startDate.getDate());
      
      const daysUntilNext = Math.ceil((nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      daysRemaining = daysUntilNext;
      nextPaymentDate = nextPayment.toISOString();
      monthsSinceStart = monthsDiff;
    }

    res.json({
      ...store,
      daysRemaining,
      nextPaymentDate,
      monthsSinceStart,
      isActive,
    });
  } catch (error) {
    console.error('[SUBSCRIPTIONS] Ошибка получения подписки магазина:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscriptions/update-monthly', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Получаем все магазины с активными подписками
    const { data: stores, error } = await supabaseAdmin
      .from('b2b_users')
      .select('id, username, store_name, subscription_price, subscription_start_date, subscription_balance')
      .eq('role', 'magazin')
      .not('subscription_start_date', 'is', null);

    if (error) throw error;

    const now = new Date();
    let updatedCount = 0;

    for (const store of stores || []) {
      if (!store.subscription_start_date) continue;

      const startDate = new Date(store.subscription_start_date);
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
      
      // Проверяем, нужно ли списать за текущий месяц
      // Списываем каждый месяц начиная с месяца после начала подписки
      if (monthsDiff >= 0) {
        const subscriptionPrice = store.subscription_price || 0;
        const newBalance = (store.subscription_balance || 0) - subscriptionPrice;
        
        await supabaseAdmin
          .from('b2b_users')
          .update({
            subscription_balance: newBalance,
          })
          .eq('id', store.id);
        
        updatedCount++;
        console.log(`[SUBSCRIPTION] Обновлен баланс для магазина ${store.store_name}: ${store.subscription_balance} -> ${newBalance}`);
      }
    }

    res.json({ success: true, updatedCount, message: `Обновлено подписок: ${updatedCount}` });
  } catch (error) {
    console.error('[SUBSCRIPTIONS] Ошибка обновления подписок:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/subscriptions/:storeId/balance', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { storeId } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Получаем текущий баланс магазина
    const { data: store, error: fetchError } = await supabaseAdmin
      .from('b2b_users')
      .select('id, store_name, subscription_balance')
      .eq('id', storeId)
      .eq('role', 'magazin')
      .single();

    if (fetchError || !store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const newBalance = (store.subscription_balance || 0) + parseFloat(amount);

    // Обновляем баланс
    const { data: updatedStore, error: updateError } = await supabaseAdmin
      .from('b2b_users')
      .update({ subscription_balance: newBalance })
      .eq('id', storeId)
      .select('id, store_name, subscription_balance, subscription_price, subscription_start_date')
      .single();

    if (updateError) throw updateError;

    console.log(`[SUBSCRIPTION] Баланс магазина ${store.store_name} обновлен: ${store.subscription_balance} -> ${newBalance} (добавлено: ${amount})`);

    res.json({
      success: true,
      store: updatedStore,
      message: `Баланс успешно обновлен: ${store.subscription_balance || 0} -> ${newBalance}`,
    });
  } catch (error) {
    console.error('[SUBSCRIPTIONS] Ошибка обновления баланса подписки:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== ORDERS API ==========
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Получаем все заказы
    const { data: allOrders, error: ordersError } = await supabaseAdmin
      .from('b2b_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    let orders = allOrders || [];

    // Если это магазин, фильтруем заказы по его товарам
    if (req.user.role === 'magazin') {
      // Получаем ID товаров этого магазина
      const { data: products, error: productsError } = await supabaseAdmin
        .from('b2b_products')
        .select('id')
        .eq('store_id', req.user.id);

      if (productsError) throw productsError;

      const storeProductIds = new Set((products || []).map(p => p.id));

      // Фильтруем заказы, оставляя только те, где есть товары этого магазина
      orders = orders
        .map(order => {
          const items = order.items || [];
          const storeItems = items.filter(item => {
            const productId = item.product_id || item.productId;
            return productId && storeProductIds.has(productId);
          });

          if (storeItems.length === 0) return null;

          // Пересчитываем total только для товаров магазина
          const storeTotal = storeItems.reduce((sum, item) => {
            return sum + (item.price || 0) * (item.quantity || 0);
          }, 0);

          return {
            ...order,
            items: storeItems,
            total: storeTotal,
          };
        })
        .filter(Boolean);
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { phone, address, telegramChatId, items } = req.body;

    if (!phone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('[ORDER] Создание заказа:', { phone, address, telegramChatId, itemsCount: items.length });
    console.log('[ORDER] Товары в заказе:', items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      store_id: item.store_id,
      quantity: item.quantity
    })));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const { data: order, error } = await supabaseAdmin
      .from('b2b_orders')
      .insert({
        phone,
        address,
        telegram_chat_id: telegramChatId ? parseInt(telegramChatId) : null,
        items,
        total,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Отправляем уведомления продавцам о новом заказе
    try {
      const { sendOrderNotification } = await import('./api/telegram.js');
      await sendOrderNotification(order, supabaseAdmin);
    } catch (notifError) {
      console.error('Ошибка отправки уведомлений:', notifError);
      // Не прерываем создание заказа, если уведомление не отправилось
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/accept-item', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { productId, storeId } = req.body;

    if (!productId || !storeId) {
      return res.status(400).json({ error: 'Missing productId or storeId' });
    }

    console.log(`[ACCEPT ITEM] Заказ ${id}, товар ${productId}, магазин ${storeId}`);

    // Получаем заказ
    const { data: order, error: orderError } = await supabaseAdmin
      .from('b2b_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Обновляем статус товара в заказе
    const items = order.items || [];
    let productName = '';
    let updated = false;

    const updatedItems = items.map(item => {
      const itemProductId = item.product_id || item.productId;
      const itemStoreId = item.store_id || item.storeId;
      
      if (itemProductId === productId && itemStoreId === storeId) {
        if (item.item_status !== 'accepted') {
          productName = item.product_name || item.productName;
          updated = true;
          return { ...item, item_status: 'accepted' };
        }
      }
      return item;
    });

    if (!updated) {
      return res.status(400).json({ error: 'Item already accepted or not found' });
    }

    // Сохраняем обновленный заказ
    const { error: updateError } = await supabaseAdmin
      .from('b2b_orders')
      .update({ items: updatedItems })
      .eq('id', id);

    if (updateError) {
      console.error('[ACCEPT ITEM] Ошибка обновления заказа:', updateError);
      throw updateError;
    }

    console.log(`[ACCEPT ITEM] Товар ${productName} принят магазином ${storeId}`);

    // Формируем уведомление для клиента
    let customerNotification = null;
    if (order.telegram_chat_id) {
      // Получаем все товары заказа и группируем по статусу
      const pendingItems = updatedItems.filter(item => !item.item_status || item.item_status === 'pending');
      const acceptedItems = updatedItems.filter(item => item.item_status === 'accepted');

      const pendingList = pendingItems.length > 0 
        ? `⏳ Obraбатывается:\n${pendingItems.map((item, idx) => 
            `${idx + 1}. ${item.product_name || item.productName} - ${item.quantity} ${item.unit || 'dona'}`
          ).join('\n')}\n\n`
        : '';

      const acceptedList = acceptedItems.length > 0
        ? `✅ Началась сборка:\n${acceptedItems.map((item, idx) => 
            `${idx + 1}. ${item.product_name || item.productName} - ${item.quantity} ${item.unit || 'dona'}`
          ).join('\n')}\n\n`
        : '';

      const message = `📦 Buyurtma holati yangilandi!\n\n` +
        `📦 Buyurtma #${order.id.slice(0, 8)}\n\n` +
        pendingList +
        acceptedList +
        `💰 Jami: ${order.total.toLocaleString()} so'm`;

      customerNotification = {
        chatId: order.telegram_chat_id,
        message
      };
    }

    res.json({
      success: true,
      productName,
      customerNotification
    });
  } catch (error) {
    console.error('[ACCEPT ITEM] Ошибка:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    // Получаем текущий заказ для сравнения статуса
    const { data: currentOrder } = await supabaseAdmin
      .from('b2b_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_orders')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });
    
    // Уведомления для клиентов временно отключены
    // if (status && status !== currentOrder.status && (status === 'processing' || status === 'completed')) {
    //   try {
    //     const { sendCustomerOrderStatusNotification } = await import('./api/telegram.js');
    //     await sendCustomerOrderStatusNotification(data, status, supabaseAdmin);
    //   } catch (notifError) {
    //     console.error('Ошибка отправки уведомления клиенту:', notifError);
    //   }
    // }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== AUTH API ==========
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('b2b_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      storeName: user.store_name,
    });

    // Настройки для cookies
    const cookieOptions = {
      httpOnly: false, // Разрешаем доступ через JavaScript для проверки токена на клиенте
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/', // Доступно для всех путей
    };

    res.cookie('auth-token', token, cookieOptions);
    
    // Также отправляем токен в теле ответа для резервного сохранения на клиенте
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        storeName: user.store_name,
      },
      token: token, // Отправляем токен в ответе для резервного сохранения
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USERS API ==========
app.get('/api/users', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((data || []).map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      storeName: u.store_name,
      createdAt: u.created_at,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('b2b_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: data.id,
      username: data.username,
      role: data.role,
      storeName: data.store_name,
      createdAt: data.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { username, password, role, storeName, subscriptionPrice } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Валидация для роли magazin
    if (role === 'magazin' && (!storeName || storeName.trim() === '')) {
      return res.status(400).json({ error: 'Magazin nomi majburiy (storeName is required for magazin role)' });
    }

    const hashedPassword = await hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from('b2b_users')
      .insert({
        username,
        password_hash: hashedPassword,
        role,
        store_name: role === 'magazin' ? (storeName || null) : null,
        subscription_price: role === 'magazin' ? (subscriptionPrice ? parseFloat(subscriptionPrice) : 0) : null,
        subscription_balance: role === 'magazin' ? (subscriptionPrice ? parseFloat(subscriptionPrice) : 0) : null,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Ошибка создания пользователя:', error);
      // Проверяем на дубликат username
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        return res.status(400).json({ error: 'Foydalanuvchi nomi allaqachon mavjud (Username already exists)' });
      }
      throw error;
    }
    res.status(201).json({
      id: data.id,
      username: data.username,
      role: data.role,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== STATS API ==========
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Получаем заказы и товары
    const { data: orders } = await supabaseAdmin.from('b2b_orders').select('*');
    const { data: products } = await supabaseAdmin.from('b2b_products').select('*');

    // Фильтруем по магазину если нужно
    let filteredOrders = orders || [];
    let filteredProducts = products || [];

    if (req.user.role === 'magazin') {
      filteredProducts = products.filter(p => p.store_id === req.user.id);
      // Упрощенная логика для заказов
    }

    const totalRevenue = filteredOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    const stats = {
      orders: {
        total: filteredOrders.length,
        pending: filteredOrders.filter(o => o.status === 'pending').length,
        processing: filteredOrders.filter(o => o.status === 'processing').length,
        completed: filteredOrders.filter(o => o.status === 'completed').length,
      },
      revenue: {
        total: totalRevenue,
      },
      products: {
        total: filteredProducts.length,
        lowStock: filteredProducts.filter(p => p.stock < 10).length,
      },
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SALES STATS API ==========
app.get('/api/stats/sales', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Получаем все завершенные заказы
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('b2b_orders')
      .select('*')
      .eq('status', 'completed');

    if (ordersError) throw ordersError;

    // Если это магазин, фильтруем по его товарам
    let filteredOrders = orders || [];
    if (req.user.role === 'magazin') {
      const { data: products } = await supabaseAdmin
        .from('b2b_products')
        .select('id')
        .eq('store_id', req.user.id);
      
      const storeProductIds = new Set((products || []).map(p => p.id));
      
      filteredOrders = orders.filter(order => {
        const items = order.items || [];
        return items.some((item) => storeProductIds.has(item.productId));
      }).map(order => {
        const items = (order.items || []).filter((item) => storeProductIds.has(item.productId));
        return { ...order, items };
      });
    }

    // Функция для получения начала недели (понедельник)
    const getWeekStart = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    };

    // Функция для получения начала месяца
    const getMonthStart = (date) => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      return monthStart;
    };

    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    // Группируем товары по productId
    const productStats = {};

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const isThisWeek = orderDate >= weekStart;
      const isThisMonth = orderDate >= monthStart;

      const items = order.items || [];
      items.forEach(item => {
        const productId = item.productId || item.product_id;
        const productName = item.productName || item.product_name || 'Noma\'lum mahsulot';
        const quantity = item.quantity || 0;
        const price = parseFloat(item.price) || 0;
        const revenue = price * quantity;

        if (!productStats[productId]) {
          productStats[productId] = {
            productId,
            productName,
            totalQuantity: 0,
            totalRevenue: 0,
            weekQuantity: 0,
            weekRevenue: 0,
            monthQuantity: 0,
            monthRevenue: 0,
          };
        }

        productStats[productId].totalQuantity += quantity;
        productStats[productId].totalRevenue += revenue;

        if (isThisWeek) {
          productStats[productId].weekQuantity += quantity;
          productStats[productId].weekRevenue += revenue;
        }

        if (isThisMonth) {
          productStats[productId].monthQuantity += quantity;
          productStats[productId].monthRevenue += revenue;
        }
      });
    });

    // Преобразуем в массив и сортируем
    const allProducts = Object.values(productStats);

    const topByWeek = allProducts
      .filter(p => p.weekQuantity > 0)
      .sort((a, b) => b.weekQuantity - a.weekQuantity)
      .slice(0, 10);

    const topByMonth = allProducts
      .filter(p => p.monthQuantity > 0)
      .sort((a, b) => b.monthQuantity - a.monthQuantity)
      .slice(0, 10);

    const topByRevenueWeek = allProducts
      .filter(p => p.weekRevenue > 0)
      .sort((a, b) => b.weekRevenue - a.weekRevenue)
      .slice(0, 10);

    const topByRevenueMonth = allProducts
      .filter(p => p.monthRevenue > 0)
      .sort((a, b) => b.monthRevenue - a.monthRevenue)
      .slice(0, 10);

    res.json({
      week: {
        byQuantity: topByWeek,
        byRevenue: topByRevenueWeek,
      },
      month: {
        byQuantity: topByMonth,
        byRevenue: topByRevenueMonth,
      },
    });
  } catch (error) {
    console.error('[API] Ошибка получения статистики продаж:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== REPORTS API ==========
app.get('/api/reports/:period', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { period } = req.params; // 'week' or 'month'
    
    if (period !== 'week' && period !== 'month') {
      return res.status(400).json({ error: 'Invalid period. Use "week" or "month"' });
    }

    // Получаем статистику за период
    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Получаем заказы и товары
    const { data: allOrders } = await supabaseAdmin
      .from('b2b_orders')
      .select('*')
      .gte('created_at', startDate.toISOString());
    
    const { data: allProducts } = await supabaseAdmin
      .from('b2b_products')
      .select('*');

    // Фильтруем по магазину если нужно
    let orders = allOrders || [];
    let products = allProducts || [];

    if (req.user.role === 'magazin') {
      products = allProducts.filter(p => p.store_id === req.user.id);
      const storeProductIds = new Set(products.map(p => p.id));
      
      orders = allOrders.filter(order => {
        const items = order.items || [];
        return items.some((item) => {
          const productId = item.product_id || item.productId;
          return productId && storeProductIds.has(productId);
        });
      });
    }

    // Вычисляем статистику
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrdersCount = completedOrders.length;

    // Топ товары по количеству
    const productStats = {};
    completedOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const productId = item.product_id || item.productId;
        const productName = item.product_name || item.productName || 'Noma\'lum';
        if (!productStats[productId]) {
          productStats[productId] = {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[productId].quantity += item.quantity || 0;
        productStats[productId].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Создаем PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Устанавливаем заголовки для ответа
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=hisobot_${period === 'week' ? 'haftalik' : 'oylik'}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Отправляем PDF в ответ
    doc.pipe(res);

    // Заголовок
    doc.fontSize(20).text('Magazin Hisoboti', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Davr: ${period === 'week' ? 'Haftalik' : 'Oylik'}`, { align: 'center' });
    doc.fontSize(12).text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, { align: 'center' });
    doc.moveDown(2);

    if (req.user.store_name) {
      doc.fontSize(16).text(`Magazin: ${req.user.store_name}`);
      doc.moveDown();
    }

    // Общая статистика
    doc.fontSize(14).text('Umumiy statistika:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Jami buyurtmalar: ${totalOrders}`);
    doc.text(`Kutayapti: ${pendingOrders}`);
    doc.text(`Qayta ishlanmoqda: ${processingOrders}`);
    doc.text(`Yakunlangan: ${completedOrdersCount}`);
    doc.text(`Jami daromad: ${totalRevenue.toLocaleString()} so'm`);
    doc.moveDown();

    // Топ товары
    if (topProducts.length > 0) {
      doc.fontSize(14).text('Eng ko\'p sotilgan mahsulotlar:', { underline: true });
      doc.moveDown(0.5);
      topProducts.forEach((product, index) => {
        doc.fontSize(11).text(
          `${index + 1}. ${product.name} - ${product.quantity} dona - ${product.revenue.toLocaleString()} so'm`
        );
      });
    }

    // Завершаем PDF
    doc.end();
  } catch (error) {
    console.error('Ошибка генерации PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== BOT SETTINGS API ==========
app.get('/api/bot/settings', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .select('*');

    if (error) throw error;

    // Преобразуем массив в объект
    const settings = {};
    (data || []).forEach(setting => {
      settings[setting.key] = setting.value;
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CONTACT PAGE SETTINGS API ==========
app.get('/api/contact-page', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const keys = [
      'contact_page_title',
      'contact_page_description',
      'contact_page_phone',
      'contact_page_email',
      'contact_page_telegram',
      'contact_page_address',
      'contact_page_how_it_works',
    ];

    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .select('*')
      .in('key', keys);

    if (error) throw error;

    // Преобразуем массив в объект
    const settings = {};
    (data || []).forEach(setting => {
      settings[setting.key] = setting.value;
    });

    // Парсим how_it_works как массив
    if (settings.contact_page_how_it_works) {
      settings.contact_page_how_it_works = settings.contact_page_how_it_works.split('|');
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/contact-page', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const {
      title,
      description,
      phone,
      email,
      telegram,
      address,
      howItWorks,
    } = req.body;

    const updates = [];

    if (title !== undefined) {
      updates.push({ key: 'contact_page_title', value: title });
    }
    if (description !== undefined) {
      updates.push({ key: 'contact_page_description', value: description });
    }
    if (phone !== undefined) {
      updates.push({ key: 'contact_page_phone', value: phone });
    }
    if (email !== undefined) {
      updates.push({ key: 'contact_page_email', value: email });
    }
    if (telegram !== undefined) {
      updates.push({ key: 'contact_page_telegram', value: telegram });
    }
    if (address !== undefined) {
      updates.push({ key: 'contact_page_address', value: address });
    }
    if (howItWorks !== undefined) {
      // Преобразуем массив в строку с разделителем |
      const howItWorksStr = Array.isArray(howItWorks) 
        ? howItWorks.join('|') 
        : howItWorks;
      updates.push({ key: 'contact_page_how_it_works', value: howItWorksStr });
    }

    // Обновляем все настройки
    const results = await Promise.all(
      updates.map(update =>
        supabaseAdmin
          .from('b2b_bot_settings')
          .upsert({
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
      )
    );

    // Получаем обновленные данные
    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .select('*')
      .in('key', [
        'contact_page_title',
        'contact_page_description',
        'contact_page_phone',
        'contact_page_email',
        'contact_page_telegram',
        'contact_page_address',
        'contact_page_how_it_works',
      ]);

    if (error) throw error;

    const settings = {};
    (data || []).forEach(setting => {
      settings[setting.key] = setting.value;
    });

    if (settings.contact_page_how_it_works) {
      settings.contact_page_how_it_works = settings.contact_page_how_it_works.split('|');
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/settings/:key', async (req, res) => {
  try {
    console.log(`[API] GET /api/bot/settings/${req.params.key}`);
    
    if (!supabaseAdmin) {
      console.error('[API] Supabase не настроен');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { key } = req.params;
    console.log(`[API] Поиск настройки с ключом: ${key}`);
    
    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .select('*')
      .eq('key', key)
      .single();

    console.log(`[API] Результат запроса:`, { hasData: !!data, error: error?.message, errorCode: error?.code });

    if (error && error.code !== 'PGRST116') {
      // Если это не ошибка "не найдено", выбрасываем ошибку
      console.error('[API] Ошибка при получении настройки:', error);
      throw error;
    }
    
    // Если настройка не найдена, возвращаем null вместо 404
    if (!data) {
      console.log(`[API] Настройка ${key} не найдена, возвращаем null`);
      return res.json({ key, value: null });
    }

    console.log(`[API] Настройка найдена:`, { key: data.key, valueLength: data.value?.length });
    res.json({ key: data.key, value: data.value });
  } catch (error) {
    console.error('[API] Ошибка получения настройки бота:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bot/settings/:key', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Используем upsert с указанием конфликтного ключа
    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Ошибка сохранения настройки бота:', error);
      throw error;
    }
    
    res.json({ key: data.key, value: data.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BOT USERS API ==========
app.post('/api/bot/users', async (req, res) => {
  try {
    console.log('[API] POST /api/bot/users - сохранение пользователя бота');
    
    if (!supabaseAdmin) {
      console.error('[API] Supabase не настроен');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { chatId, firstName, lastName, username } = req.body;
    console.log('[API] Данные пользователя:', { chatId, firstName, lastName, username });

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    // Проверяем, существует ли пользователь с таким chatId
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('b2b_bot_users')
      .select('*')
      .eq('chat_id', chatId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[API] Ошибка проверки существующего пользователя:', checkError);
      // Если это не ошибка "не найдено", пробуем создать
    }

    if (existing) {
      console.log('[API] Пользователь существует, обновляем');
      // Обновляем существующего пользователя
      const { data, error } = await supabaseAdmin
        .from('b2b_bot_users')
        .update({
          first_name: firstName,
          last_name: lastName || null,
          username: username || null,
          last_activity: new Date().toISOString(),
        })
        .eq('chat_id', chatId)
        .select()
        .single();

      if (error) {
        console.error('[API] Ошибка обновления пользователя:', error);
        throw error;
      }
      console.log('[API] Пользователь обновлен:', data);
      return res.json(data);
    } else {
      console.log('[API] Пользователь не существует, создаем нового');
      // Создаем нового пользователя
      const { data, error } = await supabaseAdmin
        .from('b2b_bot_users')
        .insert({
          chat_id: chatId,
          first_name: firstName,
          last_name: lastName || null,
          username: username || null,
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[API] Ошибка создания пользователя:', error);
        console.error('[API] Код ошибки:', error.code);
        console.error('[API] Сообщение ошибки:', error.message);
        throw error;
      }
      console.log('[API] Пользователь создан:', data);
      return res.json(data);
    }
  } catch (error) {
    console.error('[API] Ошибка сохранения пользователя бота:', error);
    console.error('[API] Детали ошибки:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    // Не возвращаем ошибку, чтобы не блокировать работу бота
    return res.status(200).json({ success: true, error: error.message });
  }
});

// ========== TELEGRAM MASS SEND API ==========
app.post('/api/telegram/send-mass', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { message, webAppUrl } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Получаем всех пользователей бота
    const { data: botUsers, error: usersError } = await supabaseAdmin
      .from('b2b_bot_users')
      .select('chat_id, first_name');

    if (usersError) {
      console.error('[API] Ошибка получения пользователей бота:', usersError);
      return res.status(500).json({ error: 'Failed to get bot users' });
    }

    if (!botUsers || botUsers.length === 0) {
      return res.status(400).json({ error: 'No bot users found' });
    }

    const { sendMessage } = await import('./api/telegram.js');
    
    console.log(`[API] Массовая отправка сообщения ${botUsers.length} пользователям`);
    
    // Отправляем сообщение всем пользователям
    const results = await Promise.allSettled(
      botUsers.map((user, index) => {
        // Персонализируем сообщение, заменяя {name} на имя пользователя
        let personalizedMessage = message;
        if (user.first_name) {
          personalizedMessage = message.replace(/{name}/g, user.first_name);
        }

        const options = webAppUrl ? {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🛒 Do\'konni ochish',
                web_app: { url: webAppUrl }
              }
            ]]
          }
        } : {};

        console.log(`[API] Отправка сообщения пользователю ${index + 1}/${botUsers.length} (chat_id: ${user.chat_id})`);
        
        return sendMessage(user.chat_id, personalizedMessage, options);
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      total: botUsers.length,
      successful,
      failed,
      message: `Xabar ${successful} ta foydalanuvchiga yuborildi. ${failed > 0 ? `${failed} ta xatolik yuz berdi.` : ''}`
    });
  } catch (error) {
    console.error('[API] Ошибка массовой отправки:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== USER PASSWORD API ==========
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;

    // Проверяем, что пользователь существует и не является super-admin
    const { data: user, error: userError } = await supabaseAdmin
      .from('b2b_users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    // Нельзя удалить super-admin
    if (user.role === 'super-admin') {
      return res.status(403).json({ error: 'Super-admin foydalanuvchisini o\'chirib bo\'lmaydi' });
    }

    // Удаляем связанные данные: товары магазина
    const { error: productsError } = await supabaseAdmin
      .from('b2b_products')
      .delete()
      .eq('store_id', id);

    if (productsError) {
      console.error('[DELETE USER] Ошибка удаления товаров:', productsError);
      // Продолжаем удаление пользователя даже если товары не удалились
    }

    // Удаляем пользователя
    const { error: deleteError } = await supabaseAdmin
      .from('b2b_users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[DELETE USER] Ошибка удаления пользователя:', deleteError);
      throw deleteError;
    }

    console.log(`[DELETE USER] Пользователь ${id} успешно удален`);
    res.json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('[DELETE USER] Ошибка:', error);
    res.status(500).json({ error: error.message || 'Foydalanuvchini o\'chirishda xatolik' });
  }
});

app.put('/api/users/:id/password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Пользователь может изменить только свой пароль, супер-админ может изменить любой
    if (req.user.id !== id && req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Получаем пользователя
    const { data: user, error: userError } = await supabaseAdmin
      .from('b2b_users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Если это не супер-админ, проверяем текущий пароль
    if (req.user.id === id && req.user.role !== 'super-admin') {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isValid = await verifyPassword(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Хешируем новый пароль
    const hashedPassword = await hashPassword(newPassword);

    // Обновляем пароль
    const { data, error } = await supabaseAdmin
      .from('b2b_users')
      .update({ password_hash: hashedPassword })
      .eq('id', id)
      .select('id, username, role')
      .single();

    if (error) throw error;
    res.json({
      id: data.id,
      username: data.username,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USER TELEGRAM CHAT ID API ==========
app.put('/api/users/:id/telegram-chat-id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramChatId } = req.body;

    // Пользователь может обновить только свой chat_id
    if (req.user.id !== id && req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('b2b_users')
      .update({ telegram_chat_id: telegramChatId ? parseInt(telegramChatId) : null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({
      id: data.id,
      username: data.username,
      telegramChatId: data.telegram_chat_id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TELEGRAM API ==========
app.post('/api/telegram/send', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { sendMessage, sendMessageWithWebApp } = await import('./api/telegram.js');
    const { chatId, message, webAppUrl } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let success;
    if (webAppUrl) {
      success = await sendMessageWithWebApp(chatId, message, webAppUrl);
    } else {
      success = await sendMessage(chatId, message);
    }

    if (!success) {
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/telegram/stats', requireAuth, async (req, res) => {
  try {
    console.log('[API] GET /api/telegram/stats - запрос статистики');
    
    if (req.user.role !== 'super-admin') {
      console.log('[API] Доступ запрещен - не super-admin');
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { getBotInfo, getBotStats } = await import('./api/telegram.js');
    const botInfo = await getBotInfo();
    console.log('[API] Bot info:', botInfo);
    
    const stats = await getBotStats(supabaseAdmin);
    console.log('[API] Bot stats:', stats);
    console.log('[API] Отправка ответа:', { botInfo, stats });

    res.json({ botInfo, stats });
  } catch (error) {
    console.error('[API] Ошибка получения статистики Telegram:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

