import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  // Dữ liệu mẫu chuẩn theo Issue #2 và wireframe đề bài
  private readonly products: ProductDto[] = [
    {
      id: 1,
      name: 'Cà phê sữa',
      price: 35000,
      imageUrl: '/images/cf-sua.jpg',
      stock: 100,
      category: 'coffee',
    },
    {
      id: 2,
      name: 'Americano',
      price: 40000,
      imageUrl: '/images/americano.jpg',
      stock: 80,
      category: 'coffee',
    },
    {
      id: 3,
      name: 'Cappuccino',
      price: 45000,
      imageUrl: '/images/cappuccino.jpg',
      stock: 50,
      category: 'coffee',
    },
    {
      id: 4,
      name: 'Trà đào',
      price: 39000,
      imageUrl: '/images/tra-dao.jpg',
      stock: 60,
      category: 'tea',
    },
  ];

  // AC1: GET /products trả về danh sách có category
  async findAll(category?: string): Promise<ProductDto[]> {
    if (category) {
      return this.products.filter((p) => p.category === category);
    }
    return this.products;
  }

  // Hỗ trợ thêm cho Task 4: GET /products/:id
  async findOne(id: number): Promise<ProductDto> {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID = ${id}`);
    }
    return product;
  }
}