import { PrismaClient, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const productData = [
  {
    name: 'Cà phê sữa',
    price: 35000,
    imageUrl: '/images/cf-sua.jpg',
    stock: 100,
    category: ProductCategory.coffee,
  },
  {
    name: 'Americano',
    price: 40000,
    imageUrl: '/images/americano.jpg',
    stock: 80,
    category: ProductCategory.coffee,
  },
  {
    name: 'Cappuccino',
    price: 45000,
    imageUrl: '/images/cappuccino.jpg',
    stock: 50,
    category: ProductCategory.coffee,
  },
  {
    name: 'Trà đào',
    price: 39000,
    imageUrl: '/images/tra-dao.jpg',
    stock: 60,
    category: ProductCategory.tea,
  },
];

const userData = [
  { email: 'demo@brewlite.vn', password: 'BrewLite123!' },
  { email: 'customer@brewlite.vn', password: 'BrewLite123!' },
];

const orderData = [
  {
    userEmail: 'demo@brewlite.vn',
    status: 'PAID' as const,
    method: 'CARD',
    idempotencyKey: 'seed-payment-demo-001',
    items: [
      { productName: 'Cà phê sữa', size: 'M', toppings: 'tran-chau', qty: 2 },
      { productName: 'Americano', size: 'S', toppings: null, qty: 1 },
    ],
  },
  {
    userEmail: 'customer@brewlite.vn',
    status: 'PAYMENT_FAILED' as const,
    method: 'WALLET',
    idempotencyKey: 'seed-payment-customer-001',
    items: [{ productName: 'Trà đào', size: 'L', toppings: null, qty: 1 }],
  },
];

const sizeExtraPrice: Record<string, number> = { S: 0, M: 5000, L: 10000 };
const toppingPrice: Record<string, number> = {
  'tran-chau': 5000,
  kem: 5000,
  pudding: 5000,
};

async function main() {
  const users = new Map<string, number>();
  for (const user of userData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
    const savedUser =
      existingUser ??
      (await prisma.user.create({
        data: {
          email: user.email,
          passwordHash: await bcrypt.hash(user.password, 10),
        },
      }));
    users.set(savedUser.email, savedUser.id);
  }

  const products = new Map<string, { id: number; price: number }>();
  for (const product of productData) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name },
    });
    const savedProduct = existingProduct
      ? await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
          },
        })
      : await prisma.product.create({ data: product });
    products.set(savedProduct.name, {
      id: savedProduct.id,
      price: savedProduct.price,
    });
  }

  for (const orderSeed of orderData) {
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey: orderSeed.idempotencyKey },
    });
    if (existingPayment) {
      continue;
    }

    const userId = users.get(orderSeed.userEmail);
    if (userId === undefined) {
      throw new Error(`Không tìm thấy user mẫu: ${orderSeed.userEmail}`);
    }

    const items = orderSeed.items.map(({ productName, ...item }) => {
      const product = products.get(productName);
      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm mẫu: ${productName}`);
      }

      const toppingsTotal = item.toppings
        ? item.toppings
            .split(',')
            .reduce((total, topping) => total + (toppingPrice[topping] ?? 0), 0)
        : 0;
      const lineTotal =
        (product.price + sizeExtraPrice[item.size] + toppingsTotal) * item.qty;

      return {
        productId: product.id,
        size: item.size,
        toppings: item.toppings,
        qty: item.qty,
        lineTotal,
      };
    });
    const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (result.count === 0) {
          throw new Error(`Không đủ tồn kho cho productId ${item.productId}`);
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          status: orderSeed.status,
          total,
          items: { create: items },
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: orderSeed.idempotencyKey,
          amount: total,
          method: orderSeed.method,
        },
      });
    });
  }

  console.log(
    'Đã nạp dữ liệu mẫu: 2 users, 4 products, 2 orders, order items và payments.',
  );
  console.log('Tài khoản mẫu: demo@brewlite.vn / BrewLite123!');
}

main()
  .catch((error: unknown) => {
    console.error('Không thể nạp dữ liệu mẫu:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
