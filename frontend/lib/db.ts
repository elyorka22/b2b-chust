// Типы для фронтенда (без реализации БД)
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'dona' | 'upakovka' | 'karobka';
  image?: string;
  category?: string;
  stock: number;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  phone: string;
  address: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit?: string;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'super-admin' | 'magazin';
  storeName?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  address?: string;
}
