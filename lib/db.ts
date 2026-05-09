import { kv } from "@vercel/kv";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderStatus = "pending_payment" | "paid" | "fulfilled" | "cancelled";

export type OrderItem = {
  product: string;   // product name
  strength: string;  // e.g. "10mg"
  price: string;     // e.g. "$52.50" — per-unit price
  qty: number;
};

export type Order = {
  id: string;
  createdAt: string; // ISO
  status: OrderStatus;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shipping: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  items: OrderItem[];
  subtotal: string; // formatted total, e.g. "$104.50"
  notes?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(): string {
  // Collision-resistant: timestamp base36 + 5 random chars
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function parsePrice(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function calcSubtotal(items: OrderItem[]): string {
  const total = items.reduce((sum, item) => {
    return sum + parsePrice(item.price) * item.qty;
  }, 0);
  return `$${total.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "status">
): Promise<Order> {
  const order: Order = {
    ...data,
    id: genId(),
    createdAt: new Date().toISOString(),
    status: "pending_payment",
  };
  await kv.set(`order:${order.id}`, order);
  await kv.zadd("orders", { score: Date.now(), member: order.id });
  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  return kv.get<Order>(`order:${id}`);
}

export async function listOrders(): Promise<Order[]> {
  const ids = (await kv.zrange("orders", 0, -1, { rev: true })) as string[];
  if (!ids.length) return [];
  const orders = await Promise.all(ids.map((id) => kv.get<Order>(`order:${id}`)));
  return orders.filter(Boolean) as Order[];
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  const updated: Order = { ...order, status };
  await kv.set(`order:${id}`, updated);
  return updated;
}
