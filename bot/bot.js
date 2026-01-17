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
    console.log(`[BOT] Получение welcome message из ${BACKEND_URL}/api/bot/settings/welcome_message`);
    const response = await axios.get(`${BACKEND_URL}/api/bot/settings/welcome_message`);
    console.log(`[BOT] Ответ от API:`, { status: response.status, data: response.data });
    
    let welcomeMessage = response.data?.value;
    console.log(`[BOT] Welcome message из API:`, welcomeMessage);
    
    // Если welcome message не найден или null, используем дефолтное
    if (!welcomeMessage || welcomeMessage === null || welcomeMessage === '') {
      console.log(`[BOT] Welcome message пустой, используем дефолтное сообщение`);
      welcomeMessage = `Salom, ${firstName}! 👋\n\nB2B Chust do'koniga xush kelibsiz!`;
    }
    
    // Получаем тексты кнопок из настроек
    let botAboutButtonText = 'ℹ️ Bot haqida';
    let botPartnershipButtonText = '🤝 Hamkorlik';
    
    try {
      const aboutButtonResponse = await axios.get(`${BACKEND_URL}/api/bot/settings/bot_about_button_text`);
      if (aboutButtonResponse.data?.value) {
        botAboutButtonText = aboutButtonResponse.data.value;
      }
    } catch (error) {
      console.log(`[BOT] Ошибка получения текста кнопки "Bot haqida":`, error.message);
    }
    
    try {
      const partnershipButtonResponse = await axios.get(`${BACKEND_URL}/api/bot/settings/bot_partnership_button_text`);
      if (partnershipButtonResponse.data?.value) {
        botPartnershipButtonText = partnershipButtonResponse.data.value;
      }
    } catch (error) {
      console.log(`[BOT] Ошибка получения текста кнопки "Hamkorlik":`, error.message);
    }
    
    // Заменяем {name} на имя пользователя, если есть
    const personalizedMessage = welcomeMessage.replace(/{name}/g, firstName);
    console.log(`[BOT] Отправка сообщения пользователю ${chatId}:`, personalizedMessage);

    // Отправляем welcome message с inline кнопкой для Web App
    bot.sendMessage(chatId, personalizedMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛒 Do\'konni ochish',
              web_app: { url: FRONTEND_URL }
            }
          ]
        ]
      }
    });

    // Отправляем reply keyboard (кнопки под полем ввода)
    bot.sendMessage(chatId, 'Quyidagi tugmalardan birini tanlang:', {
      reply_markup: {
        keyboard: [
          [
            {
              text: botAboutButtonText
            },
            {
              text: botPartnershipButtonText
            }
          ],
          [
            {
              text: '🆔 Mening Chat ID'
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    });
  } catch (error) {
    console.error('[BOT] Ошибка получения welcome message:', error.message);
    console.error('[BOT] URL был:', `${BACKEND_URL}/api/bot/settings/welcome_message`);
    console.error('[BOT] Полная ошибка:', error.response?.data || error.message);
    // Fallback на дефолтное сообщение
    console.log(`[BOT] Используем дефолтное сообщение для пользователя ${chatId}`);
    // Отправляем welcome message с inline кнопкой для Web App
    bot.sendMessage(chatId, `Salom, ${firstName}! 👋\n\nB2B Chust do'koniga xush kelibsiz!`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🛒 Do\'konni ochish',
              web_app: { url: FRONTEND_URL }
            }
          ]
        ]
      }
    });

    // Отправляем reply keyboard (кнопки под полем ввода)
    bot.sendMessage(chatId, 'Quyidagi tugmalardan birini tanlang:', {
      reply_markup: {
        keyboard: [
          [
            {
              text: 'ℹ️ Bot haqida'
            },
            {
              text: '🤝 Hamkorlik'
            }
          ],
          [
            {
              text: '🆔 Mening Chat ID'
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
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

  // Получаем тексты кнопок из настроек для проверки
  let botAboutButtonText = 'ℹ️ Bot haqida';
  let botPartnershipButtonText = '🤝 Hamkorlik';
  
  try {
    const aboutButtonResponse = await axios.get(`${BACKEND_URL}/api/bot/settings/bot_about_button_text`);
    if (aboutButtonResponse.data?.value) {
      botAboutButtonText = aboutButtonResponse.data.value;
    }
  } catch (error) {
    console.log(`[BOT] Ошибка получения текста кнопки "Bot haqida":`, error.message);
  }
  
  try {
    const partnershipButtonResponse = await axios.get(`${BACKEND_URL}/api/bot/settings/bot_partnership_button_text`);
    if (partnershipButtonResponse.data?.value) {
      botPartnershipButtonText = partnershipButtonResponse.data.value;
    }
  } catch (error) {
    console.log(`[BOT] Ошибка получения текста кнопки "Hamkorlik":`, error.message);
  }

  // Обработка нажатий на reply keyboard кнопки
  if (text === '🆔 Mening Chat ID' || text === 'Mening Chat ID') {
    // Отправляем Chat ID отдельно (для легкого копирования)
    bot.sendMessage(chatId, String(chatId));
    
    // Отправляем подсказку отдельным сообщением
    setTimeout(() => {
      bot.sendMessage(chatId, 
        '📋 Bu Chat ID ni nusxalab oling va buyurtma berishda "Telegram Chat ID" maydoniga kiriting.\n\n' +
        '✅ Shunda siz buyurtma holati haqida xabar olasiz.'
      );
    }, 500);
    return;
  } else if (text === botAboutButtonText) {
    // Получаем сообщение "Bot haqida" из настроек
    try {
      const response = await axios.get(`${BACKEND_URL}/api/bot/settings/bot_about_message`);
      let message = response.data?.value;
      
      if (!message || message === null || message === '') {
        message = 'Bu bot B2B Chust do\'koni uchun yaratilgan. Bu yerda siz mahsulotlarni ko\'rishingiz va buyurtma berishingiz mumkin.';
      }
      
      bot.sendMessage(chatId, message);
      return;
    } catch (error) {
      console.error('[BOT] Ошибка получения сообщения "Bot haqida":', error.message);
      bot.sendMessage(chatId, 'Bu bot B2B Chust do\'koni uchun yaratilgan. Bu yerda siz mahsulotlarni ko\'rishingiz va buyurtma berishingiz mumkin.');
      return;
    }
  } else if (text === botPartnershipButtonText) {
    // Получаем сообщение "Hamkorlik" из настроек
    try {
      const response = await axios.get(`${BACKEND_URL}/api/bot/settings/bot_partnership_message`);
      let message = response.data?.value;
      
      if (!message || message === null || message === '') {
        message = 'Hamkorlik uchun biz bilan bog\'laning:\n\n📞 Telefon: +998 XX XXX XX XX\n📧 Email: info@example.com\n\nBiz sizning taklifingizni kutamiz!';
      }
      
      bot.sendMessage(chatId, message);
      return;
    } catch (error) {
      console.error('[BOT] Ошибка получения сообщения "Hamkorlik":', error.message);
      bot.sendMessage(chatId, 'Hamkorlik uchun biz bilan bog\'laning:\n\n📞 Telefon: +998 XX XXX XX XX\n📧 Email: info@example.com\n\nBiz sizning taklifingizni kutamiz!');
      return;
    }
  }

  // Для других текстовых сообщений
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

// Обработка callback_query (нажатия на inline кнопки)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const messageId = query.message.message_id;

  // Обновляем активность пользователя
  await updateUserActivity(
    chatId,
    query.from.first_name,
    query.from.last_name,
    query.from.username
  );

  try {
    // Обработка кнопки "Принят" для товара в заказе
    if (data && data.startsWith('accept_item:')) {
      const parts = data.split(':');
      if (parts.length === 4) {
        const [, orderId, productId, storeId] = parts;
        
        console.log(`[BOT] Обработка принятия товара: orderId=${orderId}, productId=${productId}, storeId=${storeId}`);
        
        // Вызываем API для обновления статуса товара
        try {
          const response = await axios.post(`${BACKEND_URL}/api/orders/${orderId}/accept-item`, {
            productId,
            storeId
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.ADMIN_TOKEN || ''}` // Если нужна авторизация
            }
          });

          if (response.data.success) {
            bot.answerCallbackQuery(query.id, { text: '✅ Mahsulot qabul qilindi!', show_alert: false });
            
            // Обновляем сообщение
            const updatedMessage = query.message.text.replace(
              /⏳ (\d+\. .+? -)/g,
              (match, item) => {
                if (item.includes(response.data.productName)) {
                  return `✅ ${item}`;
                }
                return match;
              }
            );
            
            bot.editMessageText(updatedMessage, {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: query.message.reply_markup
            });

            // Отправляем уведомление клиенту, если указан chat_id
            if (response.data.customerNotification) {
              console.log(`[BOT] Отправка уведомления клиенту: ${response.data.customerNotification.chatId}`);
              bot.sendMessage(
                response.data.customerNotification.chatId,
                response.data.customerNotification.message
              );
            }
          } else {
            bot.answerCallbackQuery(query.id, { text: '❌ Xatolik yuz berdi', show_alert: true });
          }
        } catch (error) {
          console.error('[BOT] Ошибка при принятии товара:', error.message);
          bot.answerCallbackQuery(query.id, { text: '❌ Xatolik yuz berdi', show_alert: true });
        }
        return;
      }
    }

    // Обрабатываем другие callback
    bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('[BOT] Ошибка обработки callback_query:', error);
    try {
      bot.answerCallbackQuery(query.id, { text: 'Xatolik yuz berdi', show_alert: false });
    } catch (e) {
      // Игнорируем ошибку, если query уже обработан
    }
  }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('✅ Telegram Bot готов к работе!');

