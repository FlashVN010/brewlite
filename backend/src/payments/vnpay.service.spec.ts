import { describe, it, expect } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { VnpayService } from './vnpay.service';

const SECRET = 'TESTSECRETTESTSECRETTESTSECRET12';

function makeService() {
  const config = new ConfigService({
    VNPAY_TMN_CODE: 'TESTCODE',
    VNPAY_HASH_SECRET: SECRET,
    VNPAY_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    VNPAY_RETURN_URL: 'http://localhost:3000/checkout/vnpay-return',
  });
  return new VnpayService(config);
}

describe('VnpayService', () => {
  it('formats dates in GMT+7 regardless of server timezone', () => {
    // 2026-11-13T03:04:05Z = 10:04:05 giờ Việt Nam
    expect(VnpayService.formatDate(new Date('2026-11-13T03:04:05Z'))).toBe(
      '20261113100405',
    );
  });

  it('builds a signed payment URL with sorted, encoded params', () => {
    const service = makeService();
    const url = service.buildPaymentUrl({
      txnRef: '12T1700000000000',
      amount: 75000,
      orderInfo: 'Thanh toan don hang ORD-20261113-0012',
      ipAddr: '127.0.0.1',
      now: new Date('2026-11-13T03:04:05Z'),
    });

    const [base, query] = url.split('?');
    expect(base).toBe('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');

    const [signData, hashPart] = query.split('&vnp_SecureHash=');
    expect(signData).toContain('vnp_Amount=7500000');
    expect(signData).toContain('vnp_OrderInfo=Thanh+toan+don+hang+ORD-20261113-0012');
    expect(signData).toContain(
      'vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A3000%2Fcheckout%2Fvnpay-return',
    );
    expect(signData).toContain('vnp_ExpireDate=20261113101905');

    const keys = signData.split('&').map((pair) => pair.split('=')[0]);
    expect(keys).toEqual([...keys].sort());

    const expected = createHmac('sha512', SECRET).update(signData).digest('hex');
    expect(hashPart).toBe(expected);
  });

  it('accepts a correctly signed callback and rejects a tampered one', () => {
    const service = makeService();
    const params: Record<string, string> = {
      vnp_Amount: '7500000',
      vnp_BankCode: 'NCB',
      vnp_OrderInfo: 'Thanh toan don hang ORD-20261113-0012',
      vnp_ResponseCode: '00',
      vnp_TmnCode: 'TESTCODE',
      vnp_TransactionNo: '14226112',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: '12T1700000000000',
    };
    const hash = createHmac('sha512', SECRET)
      .update(VnpayService.buildSignData(params))
      .digest('hex');

    expect(
      service.verify({ ...params, vnp_SecureHashType: 'HmacSHA512', vnp_SecureHash: hash })
        .valid,
    ).toBe(true);
    expect(
      service.verify({ ...params, vnp_Amount: '100', vnp_SecureHash: hash }).valid,
    ).toBe(false);
    expect(service.verify(params).valid).toBe(false);
  });
});
