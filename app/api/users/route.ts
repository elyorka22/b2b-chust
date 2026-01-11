import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth('super-admin');
    const body = await request.json();
    const { username, password, role, storeName } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: 'Необходимо указать имя пользователя, пароль и роль' },
        { status: 400 }
      );
    }

    if (role !== 'magazin' && role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Роль должна быть magazin или super-admin' },
        { status: 400 }
      );
    }

    const existingUser = db.users.getByUsername(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким именем уже существует' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = db.users.create({
      username,
      password: hashedPassword,
      role: role as 'magazin' | 'super-admin',
      storeName: role === 'magazin' ? storeName : undefined,
    });

    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      { status: 201 }
    );
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
    return NextResponse.json(
      { error: error.message || 'Ошибка при создании пользователя' },
      { status: 500 }
    );
  }
}

