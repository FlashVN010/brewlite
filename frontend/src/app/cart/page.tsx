'use client';

import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import Image from 'next/image';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

function getItemKey(item: {
  productId: number;
  size: string;
  toppings: string[];
}) {
  return `${item.productId}-${item.size}-${[...item.toppings].sort().join(',')}`;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const totalItems = useCartStore((s) => s.totalItems());

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
          <Link href="/" className="text-xl font-bold text-amber-800">
            BrewLite
          </Link>
        </header>

        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-xl text-gray-500 mb-2">Giỏ hàng trống</p>
          <p className="text-gray-400 mb-6">Hãy chọn món yêu thích của bạn</p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
          >
            Khám phá menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-amber-800">
          BrewLite
        </Link>
        <span className="text-sm text-gray-500">{totalItems} món</span>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Giỏ hàng</h1>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={getItemKey(item)}
              className="flex gap-3 bg-white rounded-xl p-3 shadow-sm"
            >
              <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Size {item.size}
                      {item.toppings.length > 0 &&
                        ` · ${item.toppings.join(', ')}`}
                    </p>
                    <p className="text-amber-700 font-medium mt-0.5">
                      {formatPrice(item.unitPrice)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      removeItem(item.productId, item.size, item.toppings)
                    }
                    className="text-red-500 text-sm hover:underline ml-2 flex-shrink-0"
                  >
                    Xóa
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.size,
                        item.toppings,
                        item.quantity - 1
                      )
                    }
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    −
                  </button>

                  <span className="w-6 text-center font-medium">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      updateQuantity(
                        item.productId,
                        item.size,
                        item.toppings,
                        item.quantity + 1
                      )
                    }
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>

                  <span className="ml-auto font-semibold text-gray-800">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="container mx-auto max-w-lg">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-600">Tổng cộng</span>
            <span className="text-xl font-bold text-amber-700">
              {formatPrice(totalPrice)}
            </span>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 text-center py-3 border border-amber-600 text-amber-600 rounded-lg font-medium hover:bg-amber-50 transition"
            >
              Tiếp tục mua
            </Link>
            <Link
              href="/checkout"
              className="flex-1 text-center py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
