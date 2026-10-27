import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentService } from './mock-payment.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentService],
  imports: [OrdersModule],
})
export class PaymentsModule {}