export const ORDER_STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];

export interface Rider {
  id: string;
  name: string;
  phone?: string;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  riderId?: string | null;
  riderName?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  image?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  categoryId: string;
  subcategoryId?: string;
  image?: string;
  description?: string;
  isActive: boolean;
}