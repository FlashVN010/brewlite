import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { VnpayPaymentService } from './vnpay-payment.service';

type AuthenticatedRequest = Request & { user: { sub: number; email: string } };

@Controller('payments/vnpay')
export class VnpayController {
  constructor(private readonly vnpayPayments: VnpayPaymentService) {}

  /** Frontend gọi để lấy URL chuyển hướng sang cổng VNPAY. */
  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() dto: CreateVnpayPaymentDto, @Req() req: AuthenticatedRequest) {
    return this.vnpayPayments.createPaymentUrl(
      req.user.sub,
      dto.orderId,
      clientIp(req),
      dto.bankCode,
    );
  }

  /** IPN URL: khai báo với VNPAY. Cần domain public có SSL. */
  @Get('ipn')
  ipn(@Query() query: Record<string, unknown>) {
    return this.vnpayPayments.handleIpn(query);
  }

  /** Trang /checkout/vnpay-return ở frontend chuyển nguyên query string sang đây để kiểm tra. */
  @Get('return')
  verifyReturn(@Query() query: Record<string, unknown>) {
    return this.vnpayPayments.handleReturn(query);
  }
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw =
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded?.[0]) ??
    req.socket.remoteAddress ??
    '127.0.0.1';
  const ip = raw.trim().replace(/^::ffff:/, '');
  return ip === '::1' ? '127.0.0.1' : ip;
}
