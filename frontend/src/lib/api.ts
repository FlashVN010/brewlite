import { Product } from '@/types/product';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let productsCache: Product[] | null = null;

async function parseResponse<T>(res: Response, defaultMessage: string): Promise<T> {
  if (!res.ok) {
    throw new Error(defaultMessage);
  }
  return res.json() as Promise<T>;
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
