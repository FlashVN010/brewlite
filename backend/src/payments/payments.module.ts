import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentService } from './mock-payment.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentService],
})
export class PaymentsModule {}