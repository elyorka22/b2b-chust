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
export async function getBotStats(supabaseAdmin?: any): Promise<BotStats> {
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
    // Получаем пользователей бота из таблицы b2b_bot_users
    let botUsers: any[] = [];
    let botUsersError: any = null;
    
    try {
      const { data, error } = await supabaseAdmin
        .from('b2b_bot_users')
        .select('chat_id, last_activity');
      
      if (error) {
        botUsersError = error;
        console.warn('Таблица b2b_bot_users не найдена, используем b2b_users:', error.message);
      } else {
        botUsers = data || [];
      }
    } catch (error: any) {
      console.warn('Ошибка получения пользователей бота:', error.message);
    }

    // Если таблица b2b_bot_users не существует, используем b2b_users
    if (botUsers.length === 0 && botUsersError) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('b2b_users')
        .select('telegram_chat_id, updated_at')
        .not('telegram_chat_id', 'is', null);

      if (usersError) {
        console.error('Ошибка получения пользователей для статистики:', usersError);
        return {
          totalUsers: 0,
          totalMessages: 0,
          activeUsers: 0,
          totalChats: 0,
        };
      }

      const totalUsers = users?.length || 0;
      const uniqueChats = new Set(users?.map((u: any) => u.telegram_chat_id).filter(Boolean)).size;
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = users?.filter((u: any) => {
        if (!u.updated_at) return false;
        const updatedAt = new Date(u.updated_at);
        return updatedAt >= sevenDaysAgo;
      }).length || 0;

      return {
        totalUsers,
        totalMessages: 0,
        activeUsers,
        totalChats: uniqueChats,
      };
    }

    // Используем данные из b2b_bot_users
    const totalUsers = botUsers.length;
    const uniqueChats = new Set(botUsers.map((u: any) => u.chat_id).filter(Boolean)).size;
    
    // Активные пользователи - те, кто был активен за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = botUsers.filter((u: any) => {
      if (!u.last_activity) return false;
      const lastActivity = new Date(u.last_activity);
      return lastActivity >= sevenDaysAgo;
    }).length;

    return {
      totalUsers,
      totalMessages: 0, // Сообщения не сохраняются в БД
      activeUsers,
      totalChats: uniqueChats,
    };
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


