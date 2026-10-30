'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  AUTH_TOKEN_KEY,
  getMyOrders,
  OrderHistoryEntry,
} from '@/lib/api';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Chờ thanh toán',
    className: 'bg-amber-100 text-amber-800',
  },
  PAID: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
  PAYMENT_FAILED: {
    label: 'Thanh toán thất bại',
    className: 'bg-red-100 text-red-800',
  },
  PREPARING: { label: 'Đang pha chế', className: 'bg-blue-100 text-blue-800' },
  READY: { label: 'Đã sẵn sàng', className: 'bg-teal-100 text-teal-800' },
  COMPLETED: { label: 'Hoàn tất', className: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-700' },
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const loadOrders = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    try {
      setOrders(await getMyOrders(token));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải lịch sử đơn hàng.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        router.replace('/login?next=/orders');
        return;
      }

      setReady(true);
      void loadOrders(token);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrders, router]);

  if (!ready || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600">Đang tải lịch sử đơn hàng...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-medium text-amber-700 hover:underline">
              ← BrewLite
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Lịch sử đơn hàng
            </h1>
          </div>
          <Link
            href="/cart"
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
          >
            Giỏ hàng
          </Link>
        </header>

        {error && (
          <section className="rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <p role="alert" className="text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                const token = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
                if (token) void loadOrders(token);
              }}
              className="mt-4 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-700"
            >
              Thử lại
            </button>
          </section>
        )}

        {!error && orders.length === 0 && (
          <section className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="text-4xl" aria-hidden="true">☕</div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Bạn chưa có đơn hàng nào
            </h2>
            <p className="mt-2 text-gray-500">
              Những đơn hàng bạn đặt sẽ hiển thị tại đây.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-amber-600 px-5 py-2.5 font-medium text-white hover:bg-amber-700"
            >
              Khám phá menu
            </Link>
          </section>
        )}

        {!error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = ORDER_STATUS[order.status] ?? {
                label: order.status,
                className: 'bg-gray-100 text-gray-700',
              };

              return (
                <article
                  key={order.orderId}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{order.code}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                  </header>

                  <div className="space-y-3 px-5 py-4">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.productId}-${index}`}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-amber-50">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-800">
                              {item.name}{' '}
                              <span className="text-gray-500">× {item.quantity}</span>
                            </p>
                            <p className="mt-1 text-gray-500">
                              Size {item.size}
                              {item.toppings.length > 0 &&
                                ` · ${item.toppings.join(', ')}`}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-nowrap font-medium text-gray-700">
                          {formatPrice(item.lineTotal)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 bg-amber-50/50 px-5 py-4">
                    <div className="text-sm text-gray-600">
                      {order.payments.length > 0 ? (
                        <p>
                          Thanh toán bằng {order.payments[0].method}
                          {' · '}
                          {formatDate(order.payments[0].createdAt)}
                        </p>
                      ) : (
                        <p>Chưa có giao dịch thanh toán</p>
                      )}
                    </div>
                    <p className="text-right font-semibold text-gray-900">
                      Tổng cộng{' '}
                      <span className="ml-1 text-lg text-amber-700">
                        {formatPrice(order.total)}
                      </span>
                    </p>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
