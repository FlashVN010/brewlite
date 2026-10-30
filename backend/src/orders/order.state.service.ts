import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InvalidTransitionError } from './order-state.error';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrderStateService {
  constructor(private readonly prisma: PrismaService) {}

  assertTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new InvalidTransitionError(from, to);
    }
  }

  async transition(orderId: number, to: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new InvalidTransitionError('NOT_FOUND', to);
    }

    // Kiểm tra tính hợp lệ trước khi chuyển
    this.assertTransition(order.status, to);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: to },
    });
  }
}