import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  category?: string;
  updatedAt: number;
}

export interface LocalCustomer {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  debt: number;
  updatedAt: number;
}

export interface LocalSale {
  id: string;
  total: number;
  date: number;
  status: string;
  items: any[];
  paymentMethod: string;
  updatedAt: number;
}

export class OfflineDB extends Dexie {
  products!: Table<LocalProduct>;
  customers!: Table<LocalCustomer>;
  sales!: Table<LocalSale>;
  categories!: Table<any>;
  subcategories!: Table<any>;
  expenses!: Table<any>;
  revenues!: Table<any>;
  purchases!: Table<any>;
  raw_materials!: Table<any>;
  product_recipes!: Table<any>;
  stock_moves!: Table<any>;
  deliveries!: Table<any>;
  payment_methods!: Table<any>;
  shopkeepers!: Table<any>;
  shopkeeper_deliveries!: Table<any>;
  roles!: Table<any>;
  system_users!: Table<any>;
  cashier_sessions!: Table<any>;
  delivery_methods!: Table<any>;

  constructor() {
    super('PDV_Offline_DB');
    this.version(8).stores({
      products: 'id, name, category, updatedAt',
      customers: 'id, name, email, updatedAt',
      sales: 'id, date, status, updatedAt',
      categories: 'id, name, updatedAt',
      subcategories: 'id, categoryId, name, updatedAt',
      expenses: 'id, date, category, userId, updatedAt',
      revenues: 'id, date, status, userId, updatedAt',
      purchases: 'id, date, itemName, userId, updatedAt',
      raw_materials: 'id, name, userId, updatedAt',
      product_recipes: 'id, productId, updatedAt',
      stock_moves: 'id, productId, type, updatedAt',
      deliveries: 'id, saleId, status, updatedAt',
      payment_methods: 'id, name, updatedAt',
      delivery_methods: 'id, name, updatedAt',
      shopkeepers: 'id, name, updatedAt',
      shopkeeper_deliveries: 'id, shopkeeperId, status, updatedAt',
      roles: 'id, name, updatedAt',
      system_users: 'id, username, updatedAt',
      cashier_sessions: 'id, userId, status, updatedAt'
    });
  }
}

export const db = new OfflineDB();
