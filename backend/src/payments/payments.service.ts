import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { MockPaymentService } from './mock-payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { OrdersService } from '../orders/orders.service';

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
  private payments: PaymentRecord[] = [];
  private paidOrders = new Set<string>();

  constructor(
    private readonly mockPaymentService: MockPaymentService,
    private readonly ordersService: OrdersService,
  ) {}

  async processPayment(
    dto: CreatePaymentDto,
    idempotencyKey?: string,
    mockResultHeader?: string,
  ) {
    // 1. Kịch bản 409 Conflict: Đơn hàng đã được thanh toán trước đó
    if (this.paidOrders.has(dto.orderId)) {
      throw new ConflictException('Đơn hàng đã ở trạng thái PAID');
    }

    // 2. Kịch bản 404 Not Found: Đơn hàng không đúng định dạng Task 6 (bắt đầu bằng ORD-)
    if (!dto.orderId.startsWith('ORD-')) {
  throw new NotFoundException('Đơn hàng không tồn tại');
}

    const orderAmount = 50000; // Số tiền đơn hàng giả định

    // 3. Thực hiện xử lý thanh toán qua MockPaymentService
    const result = await this.mockPaymentService.charge(
      orderAmount,
      dto.method,
      mockResultHeader,
    );

    const paymentRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      orderId: dto.orderId,
      idempotencyKey,
      amount: orderAmount,
      method: dto.method,
      status: result.success ? 'PAID' : 'PAYMENT_FAILED',
      transactionId: result.transactionId,
      createdAt: new Date(),
    };

    this.payments.push(paymentRecord);
    
    // Ghi log giao dịch để debug theo yêu cầu
    console.log(
      `[PAYMENT LOG] Order: ${dto.orderId} | Status: ${paymentRecord.status} | TxnId: ${paymentRecord.transactionId || 'N/A'}`,
    );

    // 4. Trả về kết quả
    if (result.success) {
      this.paidOrders.add(dto.orderId);
      return {
        status: 'PAID',
        transactionId: result.transactionId,
        paidAt: paymentRecord.createdAt.toISOString(),
      };
    } else {
      return {
        status: 'PAYMENT_FAILED',
        reason: result.reason,
        transactionId: null,
      };
    }
  }
}