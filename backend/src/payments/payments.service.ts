import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MockPaymentService } from './mock-payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvalidTransitionError, OrderStatus } from '../orders/order-status';
import { OrderStateService } from '../orders/order-state.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly mockPaymentService: MockPaymentService,
    private readonly prisma: PrismaService,
    private readonly orderStateService: OrderStateService,
  ) {}

  async processPayment(
    dto: CreatePaymentDto,
    idempotencyKey: string | undefined,
    mockResultHeader?: string,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key là bắt buộc');
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idempotencyKey,
      )
    ) {
      throw new BadRequestException('Idempotency-Key không hợp lệ');
    }

    const now = new Date();
    const existingRecord = await this.prisma.idempotencyRecord.findUnique({
      where: { key: idempotencyKey },
    });
    if (existingRecord) {
      if (existingRecord.expiresAt.getTime() > now.getTime()) {
        return existingRecord.response;
      }
      await this.prisma.idempotencyRecord.delete({
        where: { key: idempotencyKey },
      });
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

    const result = await this.mockPaymentService.charge(
      order.total,
      dto.method,
      mockResultHeader,
    );
    try {
      return await this.prisma.$transaction(async (tx) => {
        const createdPayment = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: order.total,
            method: dto.method,
          },
        });

        const nextStatus = result.success
          ? OrderStatus.PAID
          : OrderStatus.PAYMENT_FAILED;
        await this.orderStateService.transition(order.id, nextStatus, tx);

        const response = result.success
          ? {
              status: 'PAID',
              transactionId: result.transactionId,
              paidAt: createdPayment.createdAt.toISOString(),
            }
          : {
              status: 'PAYMENT_FAILED',
              reason: result.reason,
              transactionId: null,
            };

        await tx.idempotencyRecord.create({
          data: {
            key: idempotencyKey,
            orderId: order.id,
            response,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });

        return response;
      });
    } catch (error) {
      if (error instanceof InvalidTransitionError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  private formatOrderCode(id: number, createdAt: Date): string {
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, '0');
    const day = String(createdAt.getDate()).padStart(2, '0');
    return `ORD-${year}${month}${day}-${String(id).padStart(4, '0')}`;
  }
}