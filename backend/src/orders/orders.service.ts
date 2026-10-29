import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../../prisma/prisma.service';

// Phụ thu size (đang theo code cũ, cần thống nhất với frontend, xem ghi chú bên dưới)
const SIZE_EXTRA_PRICE: Record<string, number> = { S: 0, M: 5000, L: 10000 };

// Giá topping, 5.000đ / loại
const TOPPING_PRICE: Record<string, number> = {
  'tran-chau': 5000,
  kem: 5000,
  pudding: 5000,
};

const has = (obj: object, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        payments: {
          select: {
            amount: true,
            method: true,
            createdAt: true,
          },
        },
      },
    });

    return orders.map((order) => ({
      orderId: order.id,
      code: this.formatCode(order.id, order.createdAt),
      status: order.status,
      total: order.total,
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        size: item.size,
        toppings: item.toppings ? item.toppings.split(',') : [],
        quantity: item.qty,
        lineTotal: item.lineTotal,
      })),
      payments: order.payments,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  async createOrder(dto: CreateOrderDto, userId: number) {
    // 1. Lấy tất cả sản phẩm cần thiết bằng 1 truy vấn (thay vì N truy vấn)
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Tự tính tiền ở server, không tin bất kỳ giá nào từ client
    let orderTotal = 0;
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(`productId ${item.productId} không tồn tại`);
      }
      if (!has(SIZE_EXTRA_PRICE, item.size)) {
        throw new BadRequestException(`Size "${item.size}" không hợp lệ`);
      }

      const toppings = item.toppings ?? [];
      let toppingsPrice = 0;
      for (const t of toppings) {
        if (!has(TOPPING_PRICE, t)) {
          throw new BadRequestException(`Topping "${t}" không hợp lệ`);
        }
        toppingsPrice += TOPPING_PRICE[t];
      }

      const unitPrice = product.price + SIZE_EXTRA_PRICE[item.size] + toppingsPrice;
      const lineTotal = unitPrice * item.quantity;
      orderTotal += lineTotal;

      return {
        productId: product.id,
        size: item.size,
        toppings: toppings.length ? toppings.join(',') : null, // schema: String?
        qty: item.quantity,                                     // schema: qty
        lineTotal,
      };
    });

    // 3. Transaction: trừ kho + tạo đơn, lỗi giữa chừng thì hoàn tác tất cả
    // Áp dụng mã giảm giá (Promotion) nếu người dùng truyền promoCode
    if (dto.promoCode) {
      const promo = await this.prisma.promotion.findUnique({
        where: { code: dto.promoCode },
      });

      if (!promo || !promo.active || promo.expiresAt < new Date()) {
        throw new BadRequestException('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      }

      if (orderTotal < promo.minOrder) {
        throw new BadRequestException(
          `Đơn hàng phải tối thiểu ${promo.minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này`,
        );
      }

      if (promo.type === 'PERCENT') {
        orderTotal = orderTotal - (orderTotal * promo.value) / 100;
      } else if (promo.type === 'FIXED') {
        orderTotal = Math.max(0, orderTotal - promo.value);
      }
    }
    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of itemsData) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (result.count === 0) {
          const name = productMap.get(item.productId)!.name;
          throw new BadRequestException(`"${name}" không đủ số lượng trong kho`);
        }
      }

      return tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          total: orderTotal,
          items: { create: itemsData },
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });

    // 4. Trả về dạng response gọn cho frontend
    return {
      orderId: order.id,
      code: this.formatCode(order.id, order.createdAt),
      status: order.status,
      total: order.total,
      items: order.items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        size: i.size,
        toppings: i.toppings ? i.toppings.split(',') : [],
        quantity: i.qty,
        lineTotal: i.lineTotal,
      })),
      createdAt: order.createdAt.toISOString(),
    };
  }

  // Mã hiển thị ORD-YYYYMMDD-XXXX, suy ra từ id nên không bị trùng khi restart
  private formatCode(id: number, createdAt: Date): string {
    const y = createdAt.getFullYear();
    const m = String(createdAt.getMonth() + 1).padStart(2, '0');
    const d = String(createdAt.getDate()).padStart(2, '0');
    return `ORD-${y}${m}${d}-${String(id).padStart(4, '0')}`;
  }
}