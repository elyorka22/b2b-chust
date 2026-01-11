import axios from 'axios';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

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

