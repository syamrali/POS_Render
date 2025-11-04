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