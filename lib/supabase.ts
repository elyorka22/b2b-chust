import { createClient } from '@supabase/supabase-js';
import { Product, Order, User, Customer } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Клиент для серверных операций (с полными правами)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Клиент для клиентских операций (с ограниченными правами через RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы для Supabase (соответствуют нашим интерфейсам)
type SupabaseProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: 'dona' | 'upakovka' | 'karobka';
  image: string | null;
  category: string | null;
  stock: number;
  store_id: string | null;
  created_at: string;
  updated_at: string;
};

type SupabaseOrder = {
  id: string;
  phone: string;
  address: string;
  items: any; // JSONB
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

type SupabaseUser = {
  id: string;
  username: string;
  password: string;
  role: 'super-admin' | 'magazin';
  store_name: string | null;
  created_at: string;
};

type SupabaseCustomer = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  address: string | null;
  password: string | null;
  created_at: string;
};

// Конвертеры из Supabase формата в наш формат
function convertProduct(row: SupabaseProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: parseFloat(row.price.toString()),
    unit: row.unit,
    image: row.image || undefined,
    category: row.category || undefined,
    stock: row.stock,
    storeId: row.store_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function convertOrder(row: SupabaseOrder): Order {
  return {
    id: row.id,
    phone: row.phone,
    address: row.address,
    items: row.items,
    total: parseFloat(row.total.toString()),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function convertUser(row: SupabaseUser): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
    storeName: row.store_name || undefined,
    createdAt: row.created_at,
  };
}

function convertCustomer(row: SupabaseCustomer): Customer {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name || undefined,
    email: row.email || undefined,
    address: row.address || undefined,
    password: row.password || undefined,
    createdAt: row.created_at,
  };
}

// Экспорт функций для работы с БД (совместимо с текущим интерфейсом)
export const supabaseDb = {
  products: {
    getAll: async (): Promise<Product[]> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(convertProduct);
    },
    
    getById: async (id: string): Promise<Product | undefined> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return convertProduct(data);
    },
    
    create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
      console.log('Supabase create product:', { 
        name: product.name, 
        image: product.image, 
        hasImage: !!product.image,
        imageLength: product.image?.length 
      });
      
      const insertData = {
        name: product.name,
        description: product.description,
        price: product.price,
        unit: product.unit || 'dona',
        image: product.image || null,
        category: product.category || null,
        stock: product.stock,
        store_id: product.storeId || null,
      };
      
      console.log('Данные для вставки в Supabase:', insertData);
      
      const { data, error } = await supabaseAdmin
        .from('b2b_products')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Ошибка при создании товара в Supabase:', error);
        throw error;
      }
      
      console.log('Товар создан в Supabase:', { id: data.id, image: data.image });
      return convertProduct(data);
    },
    
    update: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.unit !== undefined) updateData.unit = updates.unit;
      if (updates.image !== undefined) updateData.image = updates.image || null;
      if (updates.category !== undefined) updateData.category = updates.category || null;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.storeId !== undefined) updateData.store_id = updates.storeId || null;
      
      const { data, error } = await supabaseAdmin
        .from('b2b_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) return null;
      return convertProduct(data);
    },
    
    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabaseAdmin
        .from('b2b_products')
        .delete()
        .eq('id', id);
      
      return !error;
    },
  },
  
  orders: {
    getAll: async (): Promise<Order[]> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(convertOrder);
    },
    
    getById: async (id: string): Promise<Order | undefined> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return convertOrder(data);
    },
    
    create: async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Order> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_orders')
        .insert({
          phone: order.phone,
          address: order.address,
          items: order.items,
          total: order.total,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return convertOrder(data);
    },
    
    update: async (id: string, updates: Partial<Order>): Promise<Order | null> => {
      const updateData: any = {};
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.items !== undefined) updateData.items = updates.items;
      if (updates.total !== undefined) updateData.total = updates.total;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      const { data, error } = await supabaseAdmin
        .from('b2b_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) return null;
      return convertOrder(data);
    },
  },
  
  users: {
    getAll: async (): Promise<User[]> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(convertUser);
    },
    
    getById: async (id: string): Promise<User | undefined> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return convertUser(data);
    },
    
    getByUsername: async (username: string): Promise<User | undefined> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !data) return undefined;
      return convertUser(data);
    },
    
    create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_users')
        .insert({
          username: user.username,
          password: user.password,
          role: user.role,
          store_name: user.storeName || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return convertUser(data);
    },
  },
  
  customers: {
    getAll: async (): Promise<Customer[]> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(convertCustomer);
    },
    
    getById: async (id: string): Promise<Customer | undefined> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) return undefined;
      return convertCustomer(data);
    },
    
    getByPhone: async (phone: string): Promise<Customer | undefined> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_customers')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (error || !data) return undefined;
      return convertCustomer(data);
    },
    
    create: async (customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
      const { data, error } = await supabaseAdmin
        .from('b2b_customers')
        .insert({
          phone: customer.phone,
          name: customer.name || null,
          email: customer.email || null,
          address: customer.address || null,
          password: customer.password || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return convertCustomer(data);
    },
    
    update: async (id: string, updates: Partial<Customer>): Promise<Customer | null> => {
      const updateData: any = {};
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.name !== undefined) updateData.name = updates.name || null;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.address !== undefined) updateData.address = updates.address || null;
      if (updates.password !== undefined) updateData.password = updates.password || null;
      
      const { data, error } = await supabaseAdmin
        .from('b2b_customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) return null;
      return convertCustomer(data);
    },
  },
};

