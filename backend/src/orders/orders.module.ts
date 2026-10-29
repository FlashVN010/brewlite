import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductsModule } from '../products/products.module';
import { OrderStateService } from './order.state.service';

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderStateService],
  exports: [OrdersService, OrderStateService],
})
export class OrdersModule {}