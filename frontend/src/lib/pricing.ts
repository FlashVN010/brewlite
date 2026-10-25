import { Product } from '@/types/product';

export type ProductSize = 'S' | 'M' | 'L';
export type ToppingOption = 'tran-chau' | 'kem' | 'pudding';

export const SIZE_PRICE_DELTAS: Record<ProductSize, number> = {
  S: -5000,
  M: 0,
  L: 10000,
};

export const TOPPING_PRICE_DELTAS: Record<ToppingOption, number> = {
  'tran-chau': 10000,
  kem: 15000,
  pudding: 12000,
};

export function calcLineTotal(
  product: Product,
  size: ProductSize,
  toppings: ToppingOption[],
  qty: number,
): number {
  const safeQuantity = Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1;
  const toppingDelta = toppings.reduce((total, topping) => total + TOPPING_PRICE_DELTAS[topping], 0);

  return (product.price + SIZE_PRICE_DELTAS[size] + toppingDelta) * safeQuantity;
}
