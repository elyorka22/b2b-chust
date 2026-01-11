import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

    const { data, error } = await supabaseAdmin
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
    res.status(201).json(data);
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

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      storeName: user.store_name,
    });

    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

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
        password: hashedPassword,
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

