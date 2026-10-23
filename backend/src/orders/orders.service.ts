import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';

// Bảng giá phụ thu size
const SIZE_EXTRA_PRICE: Record<string, number> = {
  S: 0,
  M: 5000,
  L: 10000,
};

// Bảng giá topping (5.000đ / loại)
const TOPPING_PRICE: Record<string, number> = {
  'tran-chau': 5000,
  kem: 5000,
  default: 5000,
};

let dailyOrderCount = 1;

@Injectable()
export class OrdersService {
  constructor(private readonly productsService: ProductsService) {}

  // Hàm sinh mã ORD-YYYYMMDD-XXXX chuẩn AC1
  private generateOrderId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const sequence = String(dailyOrderCount++).padStart(4, '0');
    return `ORD-${year}${month}${day}-${sequence}`;
  }

  async createOrder(dto: CreateOrderDto, userId?: number) {
    let orderTotal = 0;
    const processedItems = [];

    for (const item of dto.items) {
      // 1. Kiểm tra productId tồn tại (AC3)
      let product;
      try {
        product = await this.productsService.findOne(item.productId);
      } catch (err) {
        throw new BadRequestException(`productId ${item.productId} không tồn tại`);
      }

      // 2. Tự tính tiền ở Server, loại bỏ hoàn toàn giá tiền gửi từ client (AC5)
      const basePrice = product.price;
      const sizePrice = SIZE_EXTRA_PRICE[item.size] || 0;

      const toppings = item.toppings || [];
      const toppingsPrice = toppings.reduce((sum, top) => {
        return sum + (TOPPING_PRICE[top] || TOPPING_PRICE['default']);
      }, 0);

      const unitPrice = basePrice + sizePrice + toppingsPrice;
      const lineTotal = unitPrice * item.quantity;
      orderTotal += lineTotal;

      processedItems.push({
        productId: product.id,
        name: product.name,
        size: item.size,
        toppings: toppings,
        quantity: item.quantity,
        lineTotal: lineTotal,
      });
    }

    // 3. Khởi tạo đơn hàng ở trạng thái PENDING
    return {
      orderId: this.generateOrderId(),
      status: 'PENDING',
      total: orderTotal,
      items: processedItems,
      createdAt: new Date().toISOString(),
    };
  }
}