import {
    Category,
    Order,
    OrderStatus,
    Product,
    Rider,
    Subcategory,
} from "@/types/admin";

/*
 * ============================================================
 * IN-MEMORY MOCK DATA
 * ============================================================
 * Replace every function body below with a real API call once
 * the backend endpoints are ready. Keep the function signatures
 * the same so screens don't need to change.
 */

let MOCK_RIDERS: Rider[] = [
  { id: "r1", name: "Ali Raza", phone: "0300-1234567", isAvailable: true },
  { id: "r2", name: "Bilal Khan", phone: "0301-2345678", isAvailable: true },
  { id: "r3", name: "Usman Tariq", phone: "0302-3456789", isAvailable: false },
];

let MOCK_ORDERS: Order[] = [
  {
    id: "o1",
    orderNumber: "#1001",
    customerName: "Sara Ahmed",
    customerPhone: "0333-1112223",
    address: "House 12, Street 4, F-7, Islamabad",
    items: [
      { id: "i1", name: "Chicken Burger", qty: 2, price: 550 },
      { id: "i2", name: "Fries", qty: 1, price: 250 },
    ],
    total: 1350,
    status: "pending",
    riderId: null,
    riderName: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "o2",
    orderNumber: "#1002",
    customerName: "Hamza Iqbal",
    customerPhone: "0345-9998887",
    address: "Flat 3B, Blue Area, Islamabad",
    items: [{ id: "i3", name: "Zinger Meal", qty: 1, price: 850 }],
    total: 850,
    status: "preparing",
    riderId: "r1",
    riderName: "Ali Raza",
    createdAt: new Date().toISOString(),
  },
];

let MOCK_CATEGORIES: Category[] = [
  { id: "c1", name: "Fast Food", isActive: true },
  { id: "c2", name: "Beverages", isActive: true },
];

let MOCK_SUBCATEGORIES: Subcategory[] = [
  { id: "sc1", name: "Burgers", categoryId: "c1", categoryName: "Fast Food", isActive: true },
  { id: "sc2", name: "Fries & Sides", categoryId: "c1", categoryName: "Fast Food", isActive: true },
  { id: "sc3", name: "Soft Drinks", categoryId: "c2", categoryName: "Beverages", isActive: true },
];

let MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Chicken Burger",
    price: 550,
    stock: 50,
    categoryId: "c1",
    subcategoryId: "sc1",
    description: "Crispy chicken patty with lettuce & mayo",
    isActive: true,
  },
];

const delay = <T,>(value: T, ms = 400): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const genId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

/* ============================== ORDERS ============================== */

export async function getOrders(): Promise<Order[]> {
  // TODO: return api.get("/admin/orders")
  return delay([...MOCK_ORDERS]);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  // TODO: return api.get(`/admin/orders/${orderId}`)
  const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? null;
  return delay(order);
}

export async function getRiders(): Promise<Rider[]> {
  // TODO: return api.get("/admin/riders")
  return delay([...MOCK_RIDERS]);
}

export async function assignRiderToOrder(
  orderId: string,
  riderId: string,
): Promise<Order> {
  // TODO: return api.post(`/admin/orders/${orderId}/assign-rider`, { riderId })
  const rider = MOCK_RIDERS.find((r) => r.id === riderId);
  MOCK_ORDERS = MOCK_ORDERS.map((o) =>
    o.id === orderId
      ? { ...o, riderId, riderName: rider?.name ?? null }
      : o,
  );
  const updated = MOCK_ORDERS.find((o) => o.id === orderId)!;
  return delay(updated);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  // TODO: return api.post(`/admin/orders/${orderId}/status`, { status })
  MOCK_ORDERS = MOCK_ORDERS.map((o) =>
    o.id === orderId ? { ...o, status } : o,
  );
  const updated = MOCK_ORDERS.find((o) => o.id === orderId)!;
  return delay(updated);
}

/* ============================ CATEGORIES ============================ */

export async function getCategories(): Promise<Category[]> {
  // TODO: return api.get("/admin/categories")
  return delay([...MOCK_CATEGORIES]);
}

export async function addCategory(payload: {
  name: string;
  image?: string;
}): Promise<Category> {
  // TODO: return api.post("/admin/categories", payload)
  const newCategory: Category = {
    id: genId("c"),
    name: payload.name,
    image: payload.image,
    isActive: true,
  };
  MOCK_CATEGORIES = [newCategory, ...MOCK_CATEGORIES];
  return delay(newCategory);
}

/* ========================== SUBCATEGORIES ============================ */

export async function getSubcategories(
  categoryId?: string,
): Promise<Subcategory[]> {
  // TODO: return api.get(`/admin/subcategories${categoryId ? `?categoryId=${categoryId}` : ""}`)
  const list = categoryId
    ? MOCK_SUBCATEGORIES.filter((s) => s.categoryId === categoryId)
    : MOCK_SUBCATEGORIES;
  return delay([...list]);
}

export async function addSubcategory(payload: {
  name: string;
  categoryId: string;
  categoryName: string;
  image?: string;
}): Promise<Subcategory> {
  // TODO: return api.post("/admin/subcategories", payload)
  const newSubcategory: Subcategory = {
    id: genId("sc"),
    name: payload.name,
    categoryId: payload.categoryId,
    categoryName: payload.categoryName,
    image: payload.image,
    isActive: true,
  };
  MOCK_SUBCATEGORIES = [newSubcategory, ...MOCK_SUBCATEGORIES];
  return delay(newSubcategory);
}

/* ============================= PRODUCTS ============================== */

export async function getProducts(): Promise<Product[]> {
  // TODO: return api.get("/admin/products")
  return delay([...MOCK_PRODUCTS]);
}

export async function addProduct(payload: {
  name: string;
  price: number;
  stock?: number;
  categoryId: string;
  subcategoryId?: string;
  description?: string;
  image?: string;
}): Promise<Product> {
  // TODO: return api.post("/admin/products", payload)
  const newProduct: Product = {
    id: genId("p"),
    isActive: true,
    ...payload,
  };
  MOCK_PRODUCTS = [newProduct, ...MOCK_PRODUCTS];
  return delay(newProduct);
}