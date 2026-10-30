import {
  assertTransition,
  InvalidTransitionError,
  OrderStatus,
} from './order-status';

describe('order state machine', () => {
  it('allows valid transition from PENDING to PAID', () => {
    expect(() =>
      assertTransition(OrderStatus.PENDING, OrderStatus.PAID),
    ).not.toThrow();
  });

  it('throws for invalid transition from COMPLETED to PAID', () => {
    expect(() =>
      assertTransition(OrderStatus.COMPLETED, OrderStatus.PAID),
    ).toThrow(InvalidTransitionError);
  });

  it('throws for invalid transition from CANCELLED to READY', () => {
    expect(() =>
      assertTransition(OrderStatus.CANCELLED, OrderStatus.READY),
    ).toThrow(InvalidTransitionError);
  });

  it('throws for invalid transition from PENDING to COMPLETED', () => {
    expect(() =>
      assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
    ).toThrow(InvalidTransitionError);
  });
});
