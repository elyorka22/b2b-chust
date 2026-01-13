import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : null;

export async function sendMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  }

  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode,
      reply_markup: options.reply_markup,
    });

    return response.data.ok === true;
  } catch (error) {
    console.error('Ошибка отправки сообщения в Telegram:', error);
    return false;
  }
}

export async function sendMessageWithWebApp(chatId, text, webAppUrl) {
  return sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🛒 Открыть магазин',
          web_app: { url: webAppUrl }
        }
      ]]
    }
  });
}

export async function getBotInfo() {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_API_URL) {
    return null;
  }

  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    return response.data.ok ? response.data.result : null;
  } catch (error) {
    console.error('Ошибка получения информации о боте:', error);
    return null;
  }
}

export async function getBotStats(supabaseAdmin) {
  // Базовая статистика - собираем данные из БД
  if (!supabaseAdmin) {
    return {
      totalUsers: 0,
      totalMessages: 0,
      activeUsers: 0,
      totalChats: 0,
    };
  }

  try {
    console.log('[STATS] Начало сбора статистики бота');
    
    // Получаем пользователей бота из таблицы b2b_bot_users
    let botUsers = [];
    let botUsersError = null;
    
    try {
      console.log('[STATS] Попытка получить данные из b2b_bot_users');
      const { data, error } = await supabaseAdmin
        .from('b2b_bot_users')
        .select('chat_id, last_activity');
      
      if (error) {
        botUsersError = error;
        console.warn('[STATS] Таблица b2b_bot_users не найдена:', error.message, error.code);
        console.warn('[STATS] Пробуем использовать b2b_users');
      } else {
        botUsers = data || [];
        console.log(`[STATS] Получено ${botUsers.length} пользователей из b2b_bot_users`);
      }
    } catch (error) {
      console.warn('[STATS] Ошибка получения пользователей бота:', error.message);
      botUsersError = error;
    }

    // Если таблица b2b_bot_users не существует, используем b2b_users
    if (botUsers.length === 0 && botUsersError) {
      console.log('[STATS] Таблица b2b_bot_users недоступна, пробуем b2b_users');
      const { data: users, error: usersError } = await supabaseAdmin
        .from('b2b_users')
        .select('telegram_chat_id, updated_at')
        .not('telegram_chat_id', 'is', null);

      if (usersError) {
        console.error('[STATS] Ошибка получения пользователей для статистики:', usersError);
        return {
          totalUsers: 0,
          totalMessages: 0,
          activeUsers: 0,
          totalChats: 0,
        };
      }

      const totalUsers = users?.length || 0;
      const uniqueChats = new Set(users?.map(u => u.telegram_chat_id).filter(Boolean)).size;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = users?.filter(u => {
        if (!u.updated_at) return false;
        const updatedAt = new Date(u.updated_at);
        return updatedAt >= sevenDaysAgo;
      }).length || 0;

      const fallbackStats = {
        totalUsers,
        totalMessages: 0,
        activeUsers,
        totalChats: uniqueChats,
      };
      console.log('[STATS] Статистика из b2b_users (fallback):', fallbackStats);
      return fallbackStats;
    }

    // Используем данные из b2b_bot_users
    const totalUsers = botUsers.length;
    const uniqueChats = new Set(botUsers.map(u => u.chat_id).filter(Boolean)).size;
    
    console.log(`[STATS] Всего пользователей: ${totalUsers}, уникальных чатов: ${uniqueChats}`);
    
    // Активные пользователи - те, кто был активен за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = botUsers.filter(u => {
      if (!u.last_activity) return false;
      const lastActivity = new Date(u.last_activity);
      return lastActivity >= sevenDaysAgo;
    }).length;

    const stats = {
      totalUsers,
      totalMessages: 0, // Сообщения не сохраняются в БД
      activeUsers,
      totalChats: uniqueChats,
    };
    
    console.log('[STATS] Итоговая статистика:', JSON.stringify(stats, null, 2));
    return stats;
  } catch (error) {
    console.error('Ошибка получения статистики бота:', error);
    return {
      totalUsers: 0,
      totalMessages: 0,
      activeUsers: 0,
      totalChats: 0,
    };
  }
}

// Отправка уведомления продавцам о новом заказе
export async function sendOrderNotification(order, supabaseAdmin) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_API_URL) {
    console.log('[NOTIFICATION] TELEGRAM_BOT_TOKEN не настроен, пропускаем уведомления');
    return;
  }

  try {
    console.log('[NOTIFICATION] Начало отправки уведомлений для заказа:', order.id);
    
    // Получаем уникальные store_id из товаров заказа
    const storeIds = new Set();
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (item.store_id) {
          storeIds.add(item.store_id);
          console.log('[NOTIFICATION] Найден store_id в заказе:', item.store_id);
        } else if (item.product_id) {
          // Если store_id нет в заказе, получаем его из товара в базе
          console.log('[NOTIFICATION] store_id нет в заказе, получаем из товара:', item.product_id);
        }
      });
    }

    // Если store_id нет в заказе, получаем их из товаров в базе
    if (storeIds.size === 0 && order.items && Array.isArray(order.items)) {
      console.log('[NOTIFICATION] Получаем store_id из товаров в базе данных');
      const productIds = order.items
        .map(item => item.product_id || item.productId)
        .filter(Boolean);
      
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabaseAdmin
          .from('b2b_products')
          .select('id, store_id')
          .in('id', productIds);
        
        if (productsError) {
          console.error('[NOTIFICATION] Ошибка получения товаров:', productsError);
        } else if (products) {
          products.forEach(product => {
            if (product.store_id) {
              storeIds.add(product.store_id);
              console.log('[NOTIFICATION] Найден store_id из товара:', product.store_id);
            }
          });
        }
      }
    }

    if (storeIds.size === 0) {
      console.log('[NOTIFICATION] В заказе нет товаров с store_id, пропускаем уведомления');
      return;
    }

    console.log('[NOTIFICATION] Найдено уникальных store_id:', Array.from(storeIds));

    // Получаем пользователей (продавцов) с этими store_id и telegram_chat_id
    const { data: users, error } = await supabaseAdmin
      .from('b2b_users')
      .select('id, username, store_name, telegram_chat_id')
      .in('id', Array.from(storeIds))
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('[NOTIFICATION] Ошибка получения пользователей:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('[NOTIFICATION] Не найдены продавцы с telegram_chat_id для уведомлений');
      console.log('[NOTIFICATION] Проверьте, что у пользователей указан telegram_chat_id');
      return;
    }

    console.log('[NOTIFICATION] Найдено продавцов для уведомлений:', users.length);
    users.forEach(user => {
      console.log(`[NOTIFICATION] Продавец: ${user.username} (${user.store_name}), chat_id: ${user.telegram_chat_id}`);
    });

    // Формируем сообщение о заказе
    const orderItems = order.items.map((item, idx) => 
      `${idx + 1}. ${item.product_name} - ${item.quantity} ${item.unit || 'dona'} × ${item.price.toLocaleString()} so'm`
    ).join('\n');

    const message = `🆕 Yangi buyurtma!\n\n` +
      `📦 Buyurtma #${order.id.slice(0, 8)}\n` +
      `📞 Telefon: ${order.phone}\n` +
      `📍 Manzil: ${order.address}\n\n` +
      `🛍️ Mahsulotlar:\n${orderItems}\n\n` +
      `💰 Jami: ${order.total.toLocaleString()} so'm\n` +
      `📅 Vaqt: ${new Date(order.created_at).toLocaleString('uz-UZ')}\n\n` +
      `Holatni o'zgartirish uchun admin panelga kiring 👇`;

    // Отправляем уведомление каждому продавцу
    const results = await Promise.allSettled(
      users.map(user => 
        sendMessage(user.telegram_chat_id, message, {
          reply_markup: {
            inline_keyboard: [[
              {
                text: '📊 Admin panel',
                url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`
              }
            ]]
          }
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`Уведомления отправлены: ${successCount}/${users.length}`);
  } catch (error) {
    console.error('Ошибка отправки уведомлений о заказе:', error);
  }
}

