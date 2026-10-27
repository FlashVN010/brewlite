import type { ProductCategory } from '@prisma/client';

export type { ProductCategory };

export class ProductDto {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: ProductCategory;
}