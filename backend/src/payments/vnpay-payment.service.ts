import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VnpayService } from './vnpay.service';

export interface IpnResult {
  RspCode: '00' | '01' | '02' | '04' | '97' | '99';
  Message: string;
}

export interface VnpayReturnResult {
  valid: boolean;
  success: boolean;
  orderCode: string | null;
  responseCode: string | null;
  message: string;
}

const RESPONSE_MESSAGES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP)',
  '24': 'Bạn đã hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi không xác định',
};

@Injectable()
export class VnpayPaymentService {
  private readonly logger = new Logger(VnpayPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpay: VnpayService,
  ) {}

  /** Tạo URL chuyển hướng sang cổng VNPAY cho đơn hàng của user. */
  async createPaymentUrl(
    userId: number,
    orderCode: string,
    ipAddr: string,
    bankCode?: string,
  ): Promise<{ paymentUrl: string }> {
    const order = await this.findOrderByCode(orderCode);
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
    }
    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      throw new ConflictException(
        `Đơn hàng đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }

    // vnp_TxnRef không được trùng trong ngày, nên mỗi lần thử thanh toán
    // dùng một mã mới: <orderId>T<timestamp>
    const txnRef = `${order.id}T${Date.now()}`;
    const paymentUrl = this.vnpay.buildPaymentUrl({
      txnRef,
      amount: order.total,
      orderInfo: `Thanh toan don hang ${orderCode}`,
      ipAddr,
      bankCode,
    });

    return { paymentUrl };
  }

  /** IPN: VNPAY gọi server-to-server để báo kết quả thanh toán. */
  async handleIpn(query: Record<string, unknown>): Promise<IpnResult> {
    try {
      const { valid, params } = this.vnpay.verify(query);
      if (!valid) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }
      return await this.confirmPayment(params);
    } catch (error) {
      this.logger.error('Lỗi xử lý IPN VNPAY', error as Error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  /**
   * Return URL: trình duyệt khách quay về sau khi thanh toán.
   * Chỉ dùng chữ ký hợp lệ để hiển thị kết quả. Ngoài ra cũng ghi nhận
   * kết quả (idempotent) để môi trường local, nơi VNPAY không gọi được IPN,
   * vẫn cập nhật được đơn hàng.
   */
  async handleReturn(query: Record<string, unknown>): Promise<VnpayReturnResult> {
    const { valid, params } = this.vnpay.verify(query);
    const orderId = this.orderIdFromTxnRef(params.vnp_TxnRef);
    const order = orderId
      ? await this.prisma.order.findUnique({ where: { id: orderId } })
      : null;
    const orderCode = order ? this.formatOrderCode(order.id, order.createdAt) : null;
    const responseCode = params.vnp_ResponseCode ?? null;

    if (!valid) {
      return {
        valid: false,
        success: false,
        orderCode,
        responseCode,
        message: 'Chữ ký không hợp lệ',
      };
    }

    const confirm = await this.confirmPayment(params).catch((error) => {
      this.logger.error('Lỗi ghi nhận kết quả từ Return URL', error as Error);
      return null;
    });

    const paid =
      params.vnp_ResponseCode === '00' &&
      params.vnp_TransactionStatus === '00' &&
      (confirm?.RspCode === '00' || confirm?.RspCode === '02');

    return {
      valid: true,
      success: paid,
      orderCode,
      responseCode,
      message: paid
        ? RESPONSE_MESSAGES['00']
        : confirm?.RspCode === '04'
          ? 'Số tiền thanh toán không khớp với đơn hàng'
          : (RESPONSE_MESSAGES[responseCode ?? ''] ?? 'Giao dịch không thành công'),
    };
  }

  /** Ghi nhận kết quả thanh toán, an toàn khi bị gọi lại nhiều lần. */
  private async confirmPayment(params: Record<string, string>): Promise<IpnResult> {
    const orderId = this.orderIdFromTxnRef(params.vnp_TxnRef);
    const order = orderId
      ? await this.prisma.order.findUnique({ where: { id: orderId } })
      : null;
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    const paidAmount = Number(params.vnp_Amount) / 100;
    if (Math.round(order.total * 100) !== Number(params.vnp_Amount)) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    const idempotencyKey = `vnpay:${params.vnp_TxnRef}`;
    const alreadyRecorded = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (alreadyRecorded || order.status === 'PAID') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }
    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    const success =
      params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';

    if (!success) {
      // Không lưu Payment cho giao dịch thất bại, chỉ đánh dấu đơn để khách thử lại
      await this.prisma.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: { status: 'PAYMENT_FAILED' },
      });
      return { RspCode: '00', Message: 'Confirm Success' };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey,
            amount: paidAmount,
            method: 'VNPAY',
          },
        });

        // Chỉ đổi trạng thái nếu đơn vẫn chưa PAID (tránh race giữa IPN và Return)
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: { in: ['PENDING', 'PAYMENT_FAILED'] } },
          data: { status: 'PAID' },
        });
        if (updated.count === 0) {
          throw new ConflictException('Order already confirmed');
        }

        const pointsEarned = Math.floor(order.total / 10000);
        if (pointsEarned > 0) {
          await tx.user.update({
            where: { id: order.userId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });
        }
      });
    } catch (error) {
      if (
        error instanceof ConflictException ||
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002')
      ) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }
      throw error;
    }

    return { RspCode: '00', Message: 'Confirm Success' };
  }

  private orderIdFromTxnRef(txnRef?: string): number | null {
    const match = /^(\d+)T\d+$/.exec(txnRef ?? '');
    return match ? Number(match[1]) : null;
  }

  private async findOrderByCode(code: string) {
    const match = /^ORD-\d{8}-(\d+)$/.exec(code);
    if (!match) return null;
    const order = await this.prisma.order.findUnique({
      where: { id: Number(match[1]) },
    });
    if (!order || this.formatOrderCode(order.id, order.createdAt) !== code) {
      return null;
    }
    return order;
  }

  private formatOrderCode(id: number, createdAt: Date): string {
    const y = createdAt.getFullYear();
    const m = String(createdAt.getMonth() + 1).padStart(2, '0');
    const d = String(createdAt.getDate()).padStart(2, '0');
    return `ORD-${y}${m}${d}-${String(id).padStart(4, '0')}`;
  }
}
