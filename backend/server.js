import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, из Postman или мобильных приложений)
    if (!origin) return callback(null, true);
    
    // Проверяем, есть ли origin в списке разрешенных
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      // Для отладки: логируем все origins
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
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

    const { data, error } = await supabaseAdmin
      .from('b2b_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
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

    if (!name || !description || price === undefined || stock === undefined || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const store_id = req.user.role === 'magazin' ? req.user.id : storeId || null;

    const { data, error } = await supabaseAdmin
      .from('b2b_products')
      .insert({
        name,
        description,
        price,
        unit: unit || 'dona',
        image: image || null,
        category: category || null,
        stock,
        store_id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
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

// ========== ORDERS API ==========
app.get('/api/orders', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    let query = supabaseAdmin.from('b2b_orders').select('*').order('created_at', { ascending: false });

    if (req.user.role === 'magazin') {
      // Магазин видит только заказы со своими товарами
      const products = await supabaseAdmin
        .from('b2b_products')
        .select('id')
        .eq('store_id', req.user.id);

      // Упрощенная логика - в реальности нужна более сложная фильтрация
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { phone, address, items } = req.body;

    if (!phone || !address || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const { data: order, error } = await supabaseAdmin
      .from('b2b_orders')
      .insert({
        phone,
        address,
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

app.patch('/api/orders/:id', requireAuth, async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('b2b_orders')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Order not found' });
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

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        storeName: user.store_name,
      },
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

    const { username, password, role, storeName } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from('b2b_users')
      .insert({
        username,
        password_hash: hashedPassword,
        role,
        store_name: role === 'magazin' ? storeName : null,
      })
      .select()
      .single();

    if (error) throw error;
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
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { key } = req.params;
    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ key: data.key, value: data.value });
  } catch (error) {
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

    const { data, error } = await supabaseAdmin
      .from('b2b_bot_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ key: data.key, value: data.value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== USER PASSWORD API ==========
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
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { getBotInfo, getBotStats } = await import('./api/telegram.js');
    const botInfo = await getBotInfo();
    const stats = await getBotStats();

    res.json({ botInfo, stats });
  } catch (error) {
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

