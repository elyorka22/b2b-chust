import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createCustomerToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Telefon raqami va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    const customer = db.customers.getByPhone(phone);
    if (!customer || !customer.password) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri telefon raqami yoki parol' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, customer.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri telefon raqami yoki parol' },
        { status: 401 }
      );
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
      { error: error.message || 'Kirishda xatolik' },
      { status: 500 }
    );
  }
}





