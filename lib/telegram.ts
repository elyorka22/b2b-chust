const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface BotStats {
  totalUsers: number;
  totalMessages: number;
  activeUsers: number; // пользователи, которые писали за последние 7 дней
  totalChats: number;
}

// Отправка сообщения пользователю
export async function sendMessage(chatId: number, text: string, options?: {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: any;
}): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode,
        reply_markup: options?.reply_markup,
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Ошибка отправки сообщения в Telegram:', error);
    return false;
  }
}

// Отправка сообщения с кнопкой Web App
export async function sendMessageWithWebApp(
  chatId: number,
  text: string,
  webAppUrl: string
): Promise<boolean> {
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

// Получение информации о боте
export async function getBotInfo(): Promise<any> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();
    return data.ok ? data.result : null;
  } catch (error) {
    console.error('Ошибка получения информации о боте:', error);
    return null;
  }
}

// Получение статистики бота (требует хранения данных о пользователях)
// Для полной статистики нужно хранить данные о сообщениях в БД
export async function getBotStats(): Promise<BotStats> {
  // Базовая статистика - можно расширить, сохраняя данные в БД
  return {
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
    totalChats: 0,
  };
}

// Получение количества подписчиков (для каналов/групп)
export async function getChatMemberCount(chatId: number): Promise<number> {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getChatMemberCount?chat_id=${chatId}`);
    const data = await response.json();
    return data.ok ? data.result : 0;
  } catch (error) {
    console.error('Ошибка получения количества участников:', error);
    return 0;
  }
}

