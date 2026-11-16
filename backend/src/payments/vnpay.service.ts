import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export type VnpParams = Record<string, string>;

export interface BuildPaymentUrlInput {
  txnRef: string;
  amount: number; // VND, chưa nhân 100
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
  locale?: 'vn' | 'en';
  expireMinutes?: number;
  now?: Date;
}

const VNP_VERSION = '2.1.0';
const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Ký và kiểm tra chữ ký giao dịch VNPAY (HMAC-SHA512).
 * Cách mã hoá giống code demo NodeJS của VNPAY:
 * sắp xếp key tăng dần, encodeURIComponent value, đổi %20 thành +.
 */
@Injectable()
export class VnpayService {
  constructor(private readonly config: ConfigService) {}

  private get tmnCode(): string {
    return this.required('VNPAY_TMN_CODE');
  }

  private get hashSecret(): string {
    return this.required('VNPAY_HASH_SECRET');
  }

  private get payUrl(): string {
    return (
      this.config.get<string>('VNPAY_URL') ??
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    );
  }

  private get returnUrl(): string {
    return this.required('VNPAY_RETURN_URL');
  }

  buildPaymentUrl(input: BuildPaymentUrlInput): string {
    const now = input.now ?? new Date();
    const expire = new Date(
      now.getTime() + (input.expireMinutes ?? 15) * 60 * 1000,
    );

    const params: VnpParams = {
      vnp_Version: VNP_VERSION,
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(Math.round(input.amount * 100)),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: input.txnRef,
      vnp_OrderInfo: input.orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: input.locale ?? 'vn',
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: input.ipAddr,
      vnp_CreateDate: VnpayService.formatDate(now),
      vnp_ExpireDate: VnpayService.formatDate(expire),
    };
    if (input.bankCode) {
      params.vnp_BankCode = input.bankCode;
    }

    const signData = VnpayService.buildSignData(params);
    const secureHash = this.sign(signData);
    return `${this.payUrl}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  /** Kiểm tra checksum của dữ liệu VNPAY gửi về (IPN / Return URL). */
  verify(query: Record<string, unknown>): { valid: boolean; params: VnpParams } {
    const params: VnpParams = {};
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('vnp_') && typeof value === 'string') {
        params[key] = value;
      }
    }

    const receivedHash = params.vnp_SecureHash ?? '';
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const expected = this.sign(VnpayService.buildSignData(params));
    const a = Buffer.from(expected.toLowerCase());
    const b = Buffer.from(receivedHash.toLowerCase());
    const valid = a.length === b.length && timingSafeEqual(a, b);

    return { valid, params };
  }

  private sign(data: string): string {
    return createHmac('sha512', this.hashSecret)
      .update(Buffer.from(data, 'utf-8'))
      .digest('hex');
  }

  private required(name: string): string {
    const value = this.config.get<string>(name);
    if (!value) {
      throw new InternalServerErrorException(
        `Thiếu cấu hình ${name} cho VNPAY`,
      );
    }
    return value;
  }

  static buildSignData(params: VnpParams): string {
    return Object.keys(params)
      .sort()
      .map(
        (key) =>
          `${key}=${encodeURIComponent(params[key]).replace(/%20/g, '+')}`,
      )
      .join('&');
  }

  /** yyyyMMddHHmmss theo giờ GMT+7, không phụ thuộc timezone của server. */
  static formatDate(date: Date): string {
    const d = new Date(date.getTime() + GMT7_OFFSET_MS);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
    );
  }
}
