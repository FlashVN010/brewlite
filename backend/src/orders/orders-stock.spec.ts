import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('Task 10c - Inventory & Optimistic Locking Test', () => {
  let service: OrdersService;
  let mockPrisma: any;

  beforeEach(() => {
    // Khởi tạo mockPrisma với đầy đủ findMany, updateMany, order.create
    mockPrisma = {
      product: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      order: {
        create: jest.fn(),
      },
      promotion: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    service = new OrdersService(mockPrisma);
  });

  it('Kịch bản 1: Mua vượt quá tồn kho phải ném lỗi 400 (Không đủ hàng)', async () => {
    // Mock sản phẩm có stock = 5
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Cà phê sữa',
        price: 35000,
        stock: 5,
        version: 1,
      },
    ]);

    // Khách đặt 6 ly
    const dto: any = {
      items: [{ productId: 1, size: 'S', quantity: 6 }],
    };

    await expect(service.createOrder(dto, 1)).rejects.toThrow(BadRequestException);
    await expect(service.createOrder(dto, 1)).rejects.toThrow('không đủ số lượng trong kho');
  });

  it('Kịch bản 2: Đặt hàng đồng thời khi stock = 1 -> Chỉ 1 đơn thành công, đơn kia bị 409 (Hết hàng)', async () => {
    const sampleProduct = {
      id: 1,
      name: 'Cappuccino',
      price: 45000,
      stock: 1,
      version: 1,
    };

    // Khi 2 request gọi findMany, đều thấy stock = 1, version = 1
    mockPrisma.product.findMany.mockResolvedValue([sampleProduct]);

    // Lần update 1 thành công (count = 1), lần update 2 thất bại vì version/stock đã đổi (count = 0)
    mockPrisma.product.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    mockPrisma.order.create.mockResolvedValue({
      id: 101,
      userId: 1,
      status: 'PENDING',
      total: 45000,
      createdAt: new Date(),
      items: [
        {
          productId: 1,
          size: 'S',
          qty: 1,
          lineTotal: 45000,
          product: { name: 'Cappuccino' },
        },
      ],
    });

    const dto: any = {
      items: [{ productId: 1, size: 'S', quantity: 1 }],
    };

    // Chạy đồng thời 2 request
    const results = await Promise.allSettled([
      service.createOrder(dto, 1),
      service.createOrder(dto, 2),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    // Khẳng định: Đúng 1 thành công và 1 thất bại với mã lỗi HTTP 409 Conflict
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
    expect((failed[0] as any).reason).toBeInstanceOf(ConflictException);
    expect((failed[0] as any).reason.message).toContain('đã hết hàng do xung đột đặt hàng đồng thời');
  });
});