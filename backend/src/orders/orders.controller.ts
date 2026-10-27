import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

type AuthenticatedRequest = ExpressRequest & {
  user: { sub: number; email: string };
};

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async findMyOrders(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findMyOrders(req.user.sub);
  }

  // Gắn JwtAuthGuard từ Task 7 để bảo vệ route
  // (Nếu muốn kiểm tra nhanh không cần token, bạn có thể tạm bỏ dòng @UseGuards này)
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED) // Trả về HTTP 201 Created chuẩn AC1
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user.sub;
    return this.ordersService.createOrder(createOrderDto, userId);
  }
}