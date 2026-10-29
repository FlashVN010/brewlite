import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MockPaymentService } from './mock-payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrderStateService } from '../orders/order.state.service'; 

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mockPaymentService: MockPaymentService,
    private readonly prisma: PrismaService,
  ) {}

  async processPayment(
    dto: CreatePaymentDto,
    idempotencyKey?: string,
    mockResultHeader?: string,
  ) {
const key = idempotencyKey || randomUUID();
const previousPayment = await this.prisma.payment.findUnique({
  where: { idempotencyKey: key },
});
if (previousPayment) {
  throw new ConflictException('Idempotency key đã được sử dụng');
}

const orderCode = /^ORD-\d{8}-(\d+)$/.exec(dto.orderId);
if (!orderCode) {
  throw new NotFoundException('Đơn hàng không tồn tại');
}

const order = await this.prisma.order.findUnique({
  where: { id: Number(orderCode[1]) },
});
if (!order || this.formatOrderCode(order.id, order.createdAt) !== dto.orderId) {
  throw new NotFoundException('Đơn hàng không tồn tại');
}
if (order.status === 'PAID') {
  throw new ConflictException('Đơn hàng đã ở trạng thái PAID');
}

const result = await this.mockPaymentService.charge(
  order.total,
  dto.method,
  mockResultHeader,
);

let payment: { createdAt: Date };
try {
  payment = await this.prisma.$transaction(async (tx) => {
    // Chỉ ở phần D: Tích điểm Loyalty khi thanh toán thành công
    const createdPayment = await tx.payment.create({
      data: {
        orderId: order.id,
        idempotencyKey: key,
        amount: order.total,
        method: dto.method,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: result.success ? 'PAID' : 'PAYMENT_FAILED' },
    });
    if (result.success) {
      const pointsEarned = Math.floor(order.total / 10000); // 130.000đ -> 13 điểm
      if (pointsEarned > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }
    }
    return createdPayment;
  });
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Idempotency key đã được sử dụng');
  }
  throw error;
}

if (result.success) {
  return {
    status: 'PAID',
    transactionId: result.transactionId,
    paidAt: payment.createdAt.toISOString(),
  };
}

return {
  status: 'PAYMENT_FAILED',
  reason: result.reason,
  transactionId: null,
};
  }

  private formatOrderCode(id: number, createdAt: Date): string {
const year = createdAt.getFullYear();
const month = String(createdAt.getMonth() + 1).padStart(2, '0');
const day = String(createdAt.getDate()).padStart(2, '0');
return `ORD-${year}${month}${day}-${String(id).padStart(4, '0')}`;
  }
}