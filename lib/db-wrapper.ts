// Обертка для переключения между JSON файлами (dev) и Supabase (production)
import { Product, Order, User, Customer } from './db';

// Определяем, использовать ли Supabase
const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// Интерфейс для работы с БД (совместим с текущим кодом)
export interface Database {
  products: {
    getAll: () => Product[] | Promise<Product[]>;
    getById: (id: string) => Product | undefined | Promise<Product | undefined>;
    create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product | Promise<Product>;
    update: (id: string, updates: Partial<Product>) => Product | null | Promise<Product | null>;
    delete: (id: string) => boolean | Promise<boolean>;
  };
  orders: {
    getAll: () => Order[] | Promise<Order[]>;
    getById: (id: string) => Order | undefined | Promise<Order | undefined>;
    create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Order | Promise<Order>;
    update: (id: string, updates: Partial<Order>) => Order | null | Promise<Order | null>;
  };
  users: {
    getAll: () => User[] | Promise<User[]>;
    getById: (id: string) => User | undefined | Promise<User | undefined>;
    getByUsername: (username: string) => User | undefined | Promise<User | undefined>;
    create: (user: Omit<User, 'id' | 'createdAt'>) => User | Promise<User>;
  };
  customers: {
    getAll: () => Customer[] | Promise<Customer[]>;
    getById: (id: string) => Customer | undefined | Promise<Customer | undefined>;
    getByPhone: (phone: string) => Customer | undefined | Promise<Customer | undefined>;
    create: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer | Promise<Customer>;
    update: (id: string, updates: Partial<Customer>) => Customer | null | Promise<Customer | null>;
  };
}

// Динамический импорт и создание экземпляра БД
let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (useSupabase) {
    // Используем Supabase в production
    const { supabaseDb } = await import('./supabase');
    dbInstance = supabaseDb;
  } else {
    // Используем JSON файлы в development
    const { db } = await import('./db');
    dbInstance = db;
  }

  return dbInstance;
}

// Синхронная версия для обратной совместимости (только для JSON)
export const db = useSupabase 
  ? ({} as Database) // В production будет использоваться getDb()
  : require('./db').db;

