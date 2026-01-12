import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getBotInfo, getBotStats } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    await requireAuth('super-admin');
    
    const botInfo = await getBotInfo();
    const stats = await getBotStats(supabaseAdmin);

    return NextResponse.json({
      botInfo,
      stats,
    });
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
        { error: 'Telegram бот не настроен' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}


