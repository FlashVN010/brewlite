import { Injectable } from '@nestjs/common';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reason?: string;
}

@Injectable()
export class MockPaymentService {
  async charge(
    amount: number,
    method: 'WALLET' | 'CARD',
    mockResultHeader?: string,
  ): Promise<PaymentResult> {
    if (amount <= 0) {
      return { success: false, reason: 'Số tiền thanh toán không hợp lệ' };
    }

    // Cho phép ép kết quả bằng header x-mock-result để tiện test
    if (mockResultHeader === 'success') {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
    }
    if (mockResultHeader === 'fail') {
      return { success: false, reason: 'Số dư không đủ' };
    }

    // Giả lập ngẫu nhiên: 90% thành công, 10% thất bại
    const isSuccess = Math.random() < 0.9;
    if (isSuccess) {
      return {
        success: true,
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      };
    }

    return {
      success: false,
      reason: 'Giao dịch bị từ chối bởi nhà cung cấp thanh toán',
    };
  }
}