import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentService } from './mock-payment.service';
import { OrdersModule } from '../orders/orders.module';
import { VnpayController } from './vnpay.controller';
import { VnpayService } from './vnpay.service';
import { VnpayPaymentService } from './vnpay-payment.service';

@Module({
  controllers: [PaymentsController, VnpayController],
  providers: [
    PaymentsService,
    MockPaymentService,
    VnpayService,
    VnpayPaymentService,
  ],
  imports: [OrdersModule],
})
export class PaymentsModule {}
