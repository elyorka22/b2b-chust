import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  role: 'super-admin' | 'magazin';
  storeName?: string;
}

export interface CustomerAuth {
  id: string;
  phone: string;
  name?: string;
}

export function createCustomerToken(customer: CustomerAuth): string {
  return jwt.sign(customer, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyCustomerToken(token: string): CustomerAuth | null {
  try {
    return jwt.verify(token, JWT_SECRET) as CustomerAuth;
  } catch {
    return null;
  }
}

export async function getCurrentCustomer(): Promise<CustomerAuth | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer-token')?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & { storeName?: string };
    return {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      storeName: decoded.storeName,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(requiredRole?: 'super-admin' | 'magazin'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (requiredRole && user.role !== requiredRole && user.role !== 'super-admin') {
    throw new Error('Forbidden');
  }
  return user;
}

