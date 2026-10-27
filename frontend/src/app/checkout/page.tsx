'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import {
  AUTH_TOKEN_KEY,
  createOrder,
  CreatedOrder,
  payOrder,
} from '@/lib/api';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.totalPrice());
  const clearCart = useCartStore((state) => state.clearCart);
  const [token, setToken] = useState('');
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'WALLET'>('CARD');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!savedToken) {
        router.replace('/login?next=/checkout');
        return;
      }
      setToken(savedToken);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  async function handleCreateOrder() {
    setError('');
    setSubmitting(true);
    try {
      const createdOrder = await createOrder(
        token,
        items.map((item) => ({
          productId: Number(item.productId),
          size: item.size,
          toppings: item.toppings,
          quantity: item.quantity,
        })),
      );
      setOrder(createdOrder);
      clearCart();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Không thể tạo đơn hàng.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePayment() {
    if (!order) return;
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const result = await payOrder(token, order.code, paymentMethod);
      if (result.status === 'PAID') {
        setMessage(`Thanh toán thành công cho đơn ${order.code}.`);
      } else {
        setError(result.reason || 'Thanh toán không thành công.');
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Không thể thanh toán đơn hàng.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        Đang kiểm tra đăng nhập...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <Link href="/cart" className="text-sm font-medium text-amber-700 hover:underline">
          ← Quay lại giỏ hàng
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {order ? 'Thanh toán đơn hàng' : 'Xác nhận đơn hàng'}
        </h1>

        {!order && items.length === 0 && (
          <div className="mt-6">
            <p className="text-gray-600">Giỏ hàng đang trống.</p>
            <Link href="/" className="mt-3 inline-block font-semibold text-amber-700 hover:underline">
              Quay lại menu
            </Link>
          </div>
        )}

        {!order && items.length > 0 && (
          <>
            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.toppings.join(',')}`}
                  className="flex items-center gap-3 border-b pb-3"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Size {item.size} · {item.quantity} món
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-between text-lg font-bold">
              <span>Tạm tính</span>
              <span className="text-amber-700">{formatPrice(totalPrice)}</span>
            </div>
            <button
              type="button"
              onClick={handleCreateOrder}
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {submitting ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'}
            </button>
          </>
        )}

        {order && (
          <div className="mt-6 space-y-4">
            <p className="text-gray-700">
              Mã đơn: <strong>{order.code}</strong>
            </p>
            <p className="text-gray-700">
              Tổng tiền: <strong>{formatPrice(order.total)}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700">
              Phương thức thanh toán
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as 'CARD' | 'WALLET')
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="CARD">Thẻ</option>
                <option value="WALLET">Ví</option>
              </select>
            </label>
            {!message && (
              <button
                type="button"
                onClick={handlePayment}
                disabled={submitting}
                className="w-full rounded-lg bg-amber-600 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {submitting ? 'Đang thanh toán...' : 'Thanh toán'}
              </button>
            )}
            {message && (
              <p role="status" className="text-sm text-green-700">
                {message}
              </p>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
