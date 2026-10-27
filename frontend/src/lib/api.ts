import { Product } from '@/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const AUTH_TOKEN_KEY = 'brewlite-token';

let productsCache: Product[] | null = null;

async function parseResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message || defaultMessage);
  }
  return res.json() as Promise<T>;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: { id: number; email: string };
}

export interface CreatedOrder {
  orderId: number;
  code: string;
  status: string;
  total: number;
}

export interface OrderHistoryItem {
  productId: number;
  name: string;
  imageUrl: string;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  quantity: number;
  lineTotal: number;
}

export interface OrderHistoryEntry {
  orderId: number;
  code: string;
  status: string;
  total: number;
  items: OrderHistoryItem[];
  payments: Array<{
    amount: number;
    method: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  await parseResponse<unknown>(res, 'Không thể tạo tài khoản');
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<AuthResponse>(res, 'Không thể đăng nhập');
}

export async function createOrder(
  token: string,
  items: Array<{
    productId: number;
    size: 'S' | 'M' | 'L';
    toppings: string[];
    quantity: number;
  }>,
): Promise<CreatedOrder> {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });
  return parseResponse<CreatedOrder>(res, 'Không thể tạo đơn hàng');
}

export async function getMyOrders(token: string): Promise<OrderHistoryEntry[]> {
  const res = await fetch(`${API_URL}/orders/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return parseResponse<OrderHistoryEntry[]>(
    res,
    'Không thể tải lịch sử đơn hàng',
  );
}

export async function payOrder(
  token: string,
  orderCode: string,
  method: 'WALLET' | 'CARD',
): Promise<{ status: 'PAID' | 'PAYMENT_FAILED'; reason?: string }> {
  const res = await fetch(`${API_URL}/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({ orderId: orderCode, method }),
  });
  return parseResponse(res, 'Không thể thanh toán đơn hàng');
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
  const products = await parseResponse<Product[]>(res, 'Không thể tải menu');
  productsCache = products;
  return products;
}

export async function getProductById(id: number): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { cache: 'no-store' });

    if (res.status === 404) {
      return findProductInCache(id);
    }

    const product = await parseResponse<Product>(res, 'Không thể tải chi tiết sản phẩm');

    if (productsCache) {
      const exists = productsCache.some((item) => item.id === product.id);
      if (!exists) {
        productsCache = [...productsCache, product];
      }
    } else {
      productsCache = [product];
    }

    return product;
  } catch {
    return findProductInCache(id);
  }
}

function findProductInCache(id: number): Product | null {
  if (productsCache) {
    return productsCache.find((product) => product.id === id) ?? null;
  }

  return null;
}
