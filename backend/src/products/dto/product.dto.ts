export type ProductCategory = 'coffee' | 'tea' | 'smoothie' | 'other';

export class ProductDto {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: ProductCategory;
}