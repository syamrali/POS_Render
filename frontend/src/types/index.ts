export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  department: string;
  productCode: string;
}

export interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied';
  seats: number;
  category: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
  sentToKitchen: boolean;
}

export type OrderType = 'dine-in' | 'takeaway';

export interface TableOrder {
  tableId: string;
  tableName: string;
  items: OrderItem[];
  startTime: Date;
}

export interface Invoice {
  id: string;
  billNumber: string;
  orderType: OrderType;
  tableName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  timestamp: Date;
}