import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStateService } from './order-state.service';
import { InvalidTransitionError, OrderStatus } from './order-status';

describe('OrderStateService', () => {
  let service: OrderStateService;
  const prisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OrderStateService>(OrderStateService);
  });

  it('adds loyalty points when transitioning to PAID', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 1,
      userId: 10,
      status: OrderStatus.PENDING,
      total: 130000,
    });
    prisma.order.update.mockResolvedValue({});

    await expect(service.transition(1, OrderStatus.PAID)).resolves.toBe(
      OrderStatus.PAID,
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { loyaltyPoints: { increment: 13 } },
    });
  });

  it('throws InvalidTransitionError for COMPLETED to PAID and does not update', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 1,
      userId: 10,
      status: OrderStatus.COMPLETED,
      total: 130000,
    });

    await expect(service.transition(1, OrderStatus.PAID)).rejects.toBeInstanceOf(
      InvalidTransitionError,
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
