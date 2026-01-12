import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN не настроен!');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log('Telegram Bot запущен...');

// Функция для обновления активности пользователя
async function updateUserActivity(chatId, firstName, lastName, username) {
  try {
    await axios.post(`${BACKEND_URL}/api/bot/users`, {
      chatId,
      firstName,
      lastName,
      username,
    });
  } catch (error) {
    // Игнорируем ошибки, чтобы не блокировать работу бота
    console.error('Ошибка обновления активности пользователя:', error.message);
  }
}

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  try {
    // Сохраняем пользователя бота в базу данных
    try {
      await axios.post(`${BACKEND_URL}/api/bot/users`, {
        chatId,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        username: msg.from.username,
      });
    } catch (error) {
      console.error('Ошибка сохранения пользователя бота:', error.message);
    }

    // Получаем welcome message из настроек
    const response = await axios.get(`${BACKEND_URL}/api/bot/settings/welcome_message`);
    let welcomeMessage = response.data?.value;
    
    // Если welcome message не найден или null, используем дефолтное
    if (!welcomeMessage || welcomeMessage === null) {
      welcomeMessage = `Salom, ${firstName}! 👋\n\nB2B Chust do'koniga xush kelibsiz!`;
    }
    
    // Заменяем {name} на имя пользователя, если есть
    const personalizedMessage = welcomeMessage.replace(/{name}/g, firstName);

    bot.sendMessage(chatId, personalizedMessage, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🛒 Do\'konni ochish',
            web_app: { url: FRONTEND_URL }
          }
        ]]
      }
    });
  } catch (error) {
    console.error('Ошибка получения welcome message:', error);
    // Fallback на дефолтное сообщение
    bot.sendMessage(chatId, `Salom, ${firstName}! 👋\n\nB2B Chust do'koniga xush kelibsiz!`, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🛒 Do\'konni ochish',
            web_app: { url: FRONTEND_URL }
          }
        ]]
      }
    });
  }
});

// Команда /help
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Обновляем активность пользователя
  await updateUserActivity(
    chatId,
    msg.from.first_name,
    msg.from.last_name,
    msg.from.username
  );
  
  bot.sendMessage(chatId, 
    `📋 Mavjud buyruqlar:\n\n` +
    `/start - Botni boshlash\n` +
    `/help - Yordam\n` +
    `/catalog - Mahsulotlar katalogi\n` +
    `/stores - Do'konlar ro'yxati`
  );
});

// Команда /catalog
bot.onText(/\/catalog/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Обновляем активность пользователя
  await updateUserActivity(
    chatId,
    msg.from.first_name,
    msg.from.last_name,
    msg.from.username
  );
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/products`);
    const products = response.data;

    if (products.length === 0) {
      bot.sendMessage(chatId, 'Mahsulotlar hali qo\'shilmagan.');
      return;
    }

    let message = '📦 Mahsulotlar katalogi:\n\n';
    products.slice(0, 10).forEach((product, index) => {
      message += `${index + 1}. ${product.name}\n`;
      message += `   Narx: ${product.price.toLocaleString()} so'm/${product.unit || 'dona'}\n`;
      message += `   Mavjud: ${product.stock}\n\n`;
    });

    if (products.length > 10) {
      message += `\n... va yana ${products.length - 10} mahsulot\n\n`;
    }

    message += 'Barcha mahsulotlarni ko\'rish uchun do\'konni oching 👇';

    bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🛒 Do\'konni ochish',
            web_app: { url: FRONTEND_URL }
          }
        ]]
      }
    });
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    bot.sendMessage(chatId, 'Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
  }
});

// Команда /stores
bot.onText(/\/stores/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Обновляем активность пользователя
  await updateUserActivity(
    chatId,
    msg.from.first_name,
    msg.from.last_name,
    msg.from.username
  );
  
  try {
    // Получаем магазины через API (нужно добавить endpoint)
    bot.sendMessage(chatId, 
      'Do\'konlar ro\'yxatini ko\'rish uchun do\'konni oching 👇',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🏪 Do\'konlar',
              web_app: { url: `${FRONTEND_URL}/stores` }
            }
          ]]
        }
      }
    );
  } catch (error) {
    console.error('Ошибка:', error);
    bot.sendMessage(chatId, 'Xatolik yuz berdi.');
  }
});

// Обработка текстовых сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Обновляем активность пользователя
  await updateUserActivity(
    chatId,
    msg.from.first_name,
    msg.from.last_name,
    msg.from.username
  );

  // Игнорируем команды
  if (text?.startsWith('/')) {
    return;
  }

  // Простое эхо для тестирования
  if (text) {
    bot.sendMessage(chatId, 
      'Sizga yordam bera olishim uchun quyidagi buyruqlardan foydalaning:\n\n' +
      '/start - Botni boshlash\n' +
      '/help - Yordam\n' +
      '/catalog - Mahsulotlar\n' +
      '/stores - Do\'konlar',
      {
        reply_markup: {
          inline_keyboard: [[
            {
              text: '🛒 Do\'konni ochish',
              web_app: { url: FRONTEND_URL }
            }
          ]]
        }
      }
    );
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ Telegram Bot готов к работе!');

