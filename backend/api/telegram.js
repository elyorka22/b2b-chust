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

export async function getBotStats() {
  // Базовая статистика - можно расширить, сохраняя данные в БД
  return {
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
    totalChats: 0,
  };
}

// Отправка уведомления продавцам о новом заказе
export async function sendOrderNotification(order, supabaseAdmin) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_API_URL) {
    console.log('TELEGRAM_BOT_TOKEN не настроен, пропускаем уведомления');
    return;
  }

  try {
    // Получаем уникальные store_id из товаров заказа
    const storeIds = new Set();
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        if (item.store_id) {
          storeIds.add(item.store_id);
        }
      });
    }

    if (storeIds.size === 0) {
      console.log('В заказе нет товаров с store_id, пропускаем уведомления');
      return;
    }

    // Получаем пользователей (продавцов) с этими store_id и telegram_chat_id
    const { data: users, error } = await supabaseAdmin
      .from('b2b_users')
      .select('id, username, store_name, telegram_chat_id')
      .in('id', Array.from(storeIds))
      .not('telegram_chat_id', 'is', null);

    if (error) {
      console.error('Ошибка получения пользователей:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('Не найдены продавцы с telegram_chat_id для уведомлений');
      return;
    }

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

