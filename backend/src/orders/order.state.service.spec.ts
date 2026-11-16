import { describe, it, expect, beforeEach } from '@jest/globals';
import { OrderStateService } from './order.state.service';
import { InvalidTransitionError } from './order-state.error';

describe('OrderStateService', () => {
  let service: OrderStateService;

  beforeEach(() => {
    service = new OrderStateService({} as any);
  });

  // 1. Test case hợp lệ
  it('cho phép chuyển từ PENDING sang PAID', () => {
    expect(() => service.assertTransition('PENDING', 'PAID')).not.toThrow();
  });

  // 2. Test 3 case KHÔNG hợp lệ
  it('ném lỗi khi chuyển từ COMPLETED sang PAID', () => {
    expect(() => service.assertTransition('COMPLETED', 'PAID')).toThrow(
      InvalidTransitionError,
    );
  });

  it('ném lỗi khi chuyển từ CANCELLED sang PREPARING', () => {
    expect(() => service.assertTransition('CANCELLED', 'PREPARING')).toThrow(
      InvalidTransitionError,
    );
  });

  it('ném lỗi khi chuyển từ READY sang PENDING', () => {
    expect(() => service.assertTransition('READY', 'PENDING')).toThrow(
      InvalidTransitionError,
    );
  });
});