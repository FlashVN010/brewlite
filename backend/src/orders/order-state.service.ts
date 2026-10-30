import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertTransition, OrderStatus } from './order-status';

type DbClient = PrismaClient | Prisma.TransactionClient;

@Injectable()
export class OrderStateService {
  constructor(private readonly prisma: PrismaService) {}

  async transition(
    orderId: number,
    to: OrderStatus,
    dbClient?: DbClient,
  ): Promise<OrderStatus> {
    const db = dbClient ?? this.prisma;
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, total: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    assertTransition(order.status as OrderStatus, to);

    await db.order.update({
      where: { id: order.id },
      data: { status: to },
    });

    if (to === OrderStatus.PAID) {
      const points = Math.floor(order.total / 10000);
      if (points > 0) {
        await db.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: points } },
        });
      }
    }

    return to;
  }
}
