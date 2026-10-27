import { ConflictException, NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentService } from './mock-payment.service';
import { PaymentsService } from './payments.service';
import { describe } from 'node:test';

describe('PaymentsService', () => {
  let service: PaymentsService;
  const order = {
    id: 12,
    createdAt: new Date(2026, 9, 27),
    total: 75000,
    status: 'PENDING',
  };
  const tx = {
    payment: { create: jest.fn() },
    order: { update: jest.fn() },
  };
  const prisma = {
    payment: { findUnique: jest.fn() },
    order: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const mockPaymentService = { charge: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.payment.create.mockResolvedValue({ createdAt: order.createdAt });
    tx.order.update.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MockPaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('charges and persists the payment and order status', async () => {
    const dto: CreatePaymentDto = {
      orderId: 'ORD-20261027-0012',
      method: 'CARD',
    };
    mockPaymentService.charge.mockResolvedValue({
      success: true,
      transactionId: 'TXN-1',
    });

    await expect(service.processPayment(dto, 'request-key')).resolves.toEqual({
      status: 'PAID',
      transactionId: 'TXN-1',
      paidAt: order.createdAt.toISOString(),
    });
    expect(mockPaymentService.charge).toHaveBeenCalledWith(75000, 'CARD', undefined);
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: 12,
        idempotencyKey: 'request-key',
        amount: 75000,
        method: 'CARD',
      },
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { status: 'PAID' },
    });
  });

  it('rejects unknown order codes without charging', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.processPayment(
        { orderId: 'ORD-20261027-9999', method: 'CARD' },
        'request-key',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockPaymentService.charge).not.toHaveBeenCalled();
  });

  it('rejects a reused idempotency key without charging', async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: 1 });

    await expect(
      service.processPayment(
        { orderId: 'ORD-20261027-0012', method: 'CARD' },
        'request-key',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(mockPaymentService.charge).not.toHaveBeenCalled();
  });
});
