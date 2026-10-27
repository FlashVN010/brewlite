import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  const prisma = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('finds all products and optionally filters by category', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
    expect(prisma.product.findMany).toHaveBeenLastCalledWith({
      where: undefined,
      orderBy: { id: 'asc' },
    });

    await expect(service.findAll('coffee')).resolves.toEqual([]);
    expect(prisma.product.findMany).toHaveBeenLastCalledWith({
      where: { category: 'coffee' },
      orderBy: { id: 'asc' },
    });
  });

  it('finds a product by ID', async () => {
    const product = {
      id: 1,
      name: 'Americano',
      price: 40000,
      imageUrl: '/images/americano.jpg',
      stock: 80,
      category: 'coffee',
    };
    prisma.product.findUnique.mockResolvedValue(product);

    await expect(service.findOne(1)).resolves.toEqual(product);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('throws when the product does not exist', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
