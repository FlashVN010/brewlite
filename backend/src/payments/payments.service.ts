import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MockPaymentService } from './mock-payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

export interface Order {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'PAYMENT_FAILED';
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  idempotencyKey?: string;
  amount: number;
  method: 'WALLET' | 'CARD';
  status: 'PAID' | 'PAYMENT_FAILED';
  transactionId?: string;
  createdAt: Date;
}

@Injectable()
export class PaymentsService {
  // Dữ liệu đơn hàng mẫu phục vụ việc test
  private orders: Map<string, Order> = new Map([
    ['ORD-20261011-0001', { id: 'ORD-20261011-0001', amount: 130000, status: 'PENDING' }],
    ['ORD-PAID-TEST', { id: 'ORD-PAID-TEST', amount: 50000, status: 'PAID' }],
  ]);

  private payments: PaymentRecord[] = [];

  constructor(private readonly mockPaymentService: MockPaymentService) {}

  async processPayment(
    dto: CreatePaymentDto,
    idempotencyKey?: string,
    mockResultHeader?: string,
  ) {
    const order = this.orders.get(dto.orderId);

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.status === 'PAID') {
      throw new ConflictException('Đơn hàng đã ở trạng thái PAID');
    }

    const result = await this.mockPaymentService.charge(
      order.amount,
      dto.method,
      mockResultHeader,
    );

    const paymentRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      orderId: dto.orderId,
      idempotencyKey,
      amount: order.amount,
      method: dto.method,
      status: result.success ? 'PAID' : 'PAYMENT_FAILED',
      transactionId: result.transactionId,
      createdAt: new Date(),
    };

    this.payments.push(paymentRecord);
    console.log(`[PAYMENT LOG] Order: ${dto.orderId} | Status: ${paymentRecord.status} | TxnId: ${paymentRecord.transactionId || 'N/A'}`);

    if (result.success) {
      order.status = 'PAID';
      return {
        status: 'PAID',
        transactionId: result.transactionId,
        paidAt: paymentRecord.createdAt.toISOString(),
      };
    } else {
      order.status = 'PAYMENT_FAILED';
      return {
        status: 'PAYMENT_FAILED',
        reason: result.reason,
        transactionId: null,
      };
    }
  }
}