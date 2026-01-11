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

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

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
});

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
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
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

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

