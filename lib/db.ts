import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data');

// Убедимся, что папка data существует
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'dona' | 'upakovka' | 'karobka';
  image?: string;
  category?: string;
  stock: number;
  storeId?: string; // ID магазина-владельца
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
  password: string;
  role: 'super-admin' | 'magazin';
  storeName?: string; // Название магазина
  createdAt: string;
}

export interface Customer {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  password?: string;
  createdAt: string;
}

function readJsonFile<T>(filename: string, defaultValue: T[]): T[] {
  const filePath = path.join(dbPath, filename);
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filename, defaultValue);
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filename: string, data: T[]): void {
  const filePath = path.join(dbPath, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  products: {
    getAll: (): Product[] => readJsonFile<Product>('products.json', []),
    getById: (id: string): Product | undefined => {
      const products = readJsonFile<Product>('products.json', []);
      return products.find(p => p.id === id);
    },
    create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
      const products = readJsonFile<Product>('products.json', []);
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      products.push(newProduct);
      writeJsonFile('products.json', products);
      return newProduct;
    },
    update: (id: string, updates: Partial<Product>): Product | null => {
      const products = readJsonFile<Product>('products.json', []);
      const index = products.findIndex(p => p.id === id);
      if (index === -1) return null;
      products[index] = {
        ...products[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile('products.json', products);
      return products[index];
    },
    delete: (id: string): boolean => {
      const products = readJsonFile<Product>('products.json', []);
      const filtered = products.filter(p => p.id !== id);
      if (filtered.length === products.length) return false;
      writeJsonFile('products.json', filtered);
      return true;
    },
  },
  orders: {
    getAll: (): Order[] => readJsonFile<Order>('orders.json', []),
    getById: (id: string): Order | undefined => {
      const orders = readJsonFile<Order>('orders.json', []);
      return orders.find(o => o.id === id);
    },
    create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Order => {
      const orders = readJsonFile<Order>('orders.json', []);
      const newOrder: Order = {
        ...order,
        id: Date.now().toString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      orders.push(newOrder);
      writeJsonFile('orders.json', orders);
      return newOrder;
    },
    update: (id: string, updates: Partial<Order>): Order | null => {
      const orders = readJsonFile<Order>('orders.json', []);
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      orders[index] = {
        ...orders[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFile('orders.json', orders);
      return orders[index];
    },
  },
  users: {
    getAll: (): User[] => readJsonFile<User>('users.json', []),
    getById: (id: string): User | undefined => {
      const users = readJsonFile<User>('users.json', []);
      return users.find(u => u.id === id);
    },
    getByUsername: (username: string): User | undefined => {
      const users = readJsonFile<User>('users.json', []);
      return users.find(u => u.username === username);
    },
    create: (user: Omit<User, 'id' | 'createdAt'>): User => {
      const users = readJsonFile<User>('users.json', []);
      const newUser: User = {
        ...user,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      writeJsonFile('users.json', users);
      return newUser;
    },
  },
  customers: {
    getAll: (): Customer[] => readJsonFile<Customer>('customers.json', []),
    getById: (id: string): Customer | undefined => {
      const customers = readJsonFile<Customer>('customers.json', []);
      return customers.find(c => c.id === id);
    },
    getByPhone: (phone: string): Customer | undefined => {
      const customers = readJsonFile<Customer>('customers.json', []);
      return customers.find(c => c.phone === phone);
    },
    create: (customer: Omit<Customer, 'id' | 'createdAt'>): Customer => {
      const customers = readJsonFile<Customer>('customers.json', []);
      const newCustomer: Customer = {
        ...customer,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      customers.push(newCustomer);
      writeJsonFile('customers.json', customers);
      return newCustomer;
    },
    update: (id: string, updates: Partial<Customer>): Customer | null => {
      const customers = readJsonFile<Customer>('customers.json', []);
      const index = customers.findIndex(c => c.id === id);
      if (index === -1) return null;
      customers[index] = {
        ...customers[index],
        ...updates,
      };
      writeJsonFile('customers.json', customers);
      return customers[index];
    },
  },
};

