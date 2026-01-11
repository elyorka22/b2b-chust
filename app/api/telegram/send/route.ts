import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendMessage, sendMessageWithWebApp } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    await requireAuth('super-admin');
    const body = await request.json();
    const { chatId, message, webAppUrl } = body;

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Необходимо указать chatId и message' },
        { status: 400 }
      );
    }

    let success: boolean;
    if (webAppUrl) {
      success = await sendMessageWithWebApp(chatId, message, webAppUrl);
    } else {
      success = await sendMessage(chatId, message);
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Не удалось отправить сообщение' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    if (error.message === 'TELEGRAM_BOT_TOKEN не настроен') {
      return NextResponse.json(
        { error: 'Telegram бот не настроен. Добавьте TELEGRAM_BOT_TOKEN в переменные окружения' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Ошибка при отправке сообщения' },
      { status: 500 }
    );
  }
}

