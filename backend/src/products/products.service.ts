import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: ProductDto['category']): Promise<ProductDto[]> {
    return this.prisma.product.findMany({
      where: category ? { category } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID = ${id}`);
    }
    return product;
  }
}