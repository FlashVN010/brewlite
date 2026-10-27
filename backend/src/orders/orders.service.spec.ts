import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  const prisma = {
    order: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('returns only the authenticated user orders, newest first', async () => {
    const createdAt = new Date('2026-10-27T10:00:00.000Z');
    prisma.order.findMany.mockResolvedValue([
      {
        id: 12,
        status: 'PENDING',
        total: 45000,
        createdAt,
        items: [
          {
            productId: 3,
            product: {
              name: 'Cappuccino',
              imageUrl: '/images/cappuccino.jpg',
            },
            size: 'M',
            toppings: 'tran-chau',
            qty: 1,
            lineTotal: 45000,
          },
        ],
        payments: [],
      },
    ]);

    await expect(service.findMyOrders(7)).resolves.toEqual([
      {
        orderId: 12,
        code: 'ORD-20261027-0012',
        status: 'PENDING',
        total: 45000,
        items: [
          {
            productId: 3,
            name: 'Cappuccino',
            imageUrl: '/images/cappuccino.jpg',
            size: 'M',
            toppings: ['tran-chau'],
            quantity: 1,
            lineTotal: 45000,
          },
        ],
        payments: [],
        createdAt: createdAt.toISOString(),
      },
    ]);
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true } },
          },
        },
        payments: {
          select: { amount: true, method: true, createdAt: true },
        },
      },
    });
  });

  it('returns an empty list when the user has no orders', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    await expect(service.findMyOrders(7)).resolves.toEqual([]);
  });
});
