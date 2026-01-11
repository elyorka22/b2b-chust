import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Необходимо указать имя пользователя и пароль' },
        { status: 400 }
      );
    }

    const user = db.users.getByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверное имя пользователя или пароль' },
        { status: 401 }
      );
    }

    const token = createToken({
      id: user.id,
      username: user.username,
      role: user.role,
      storeName: user.storeName,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        storeName: user.storeName,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка при входе' },
      { status: 500 }
    );
  }
}

