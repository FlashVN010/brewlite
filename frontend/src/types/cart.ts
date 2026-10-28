export interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  unitPrice: number; // đã tính size + toppings
  quantity: number;
}