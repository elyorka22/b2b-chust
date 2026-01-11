import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createCustomerToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { phone, name, email, address, password } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefon raqami kiritilishi shart' },
        { status: 400 }
      );
    }

    const existingCustomer = db.customers.getByPhone(phone);
    if (existingCustomer && password) {
      return NextResponse.json(
        { error: 'Bu telefon raqam bilan foydalanuvchi allaqachon mavjud' },
        { status: 400 }
      );
    }

    let customer;
    if (existingCustomer && !password) {
      // Если клиент уже существует без пароля, просто обновляем данные
      customer = existingCustomer;
    } else {
      // Создаем нового клиента
      const hashedPassword = password ? await hashPassword(password) : undefined;
      customer = db.customers.create({
        phone,
        name,
        email,
        address,
        password: hashedPassword,
      });
    }

    const token = createCustomerToken({
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
    });

    const response = NextResponse.json({
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
      },
    });

    response.cookies.set('customer-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ro\'yxatdan o\'tishda xatolik' },
      { status: 500 }
    );
  }
}

