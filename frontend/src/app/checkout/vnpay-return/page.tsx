'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AUTH_TOKEN_KEY,
  getMyProfile,
  verifyVnpayReturn,
  VnpayReturnResult,
} from '@/lib/api';

export default function VnpayReturnPage() {
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const verified = await verifyVnpayReturn(window.location.search);
        if (cancelled) return;
        setResult(verified);

        const token = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
        if (verified.success && token) {
          const profile = await getMyProfile(token).catch(() => null);
          if (!cancelled && profile) setLoyaltyPoints(profile.loyaltyPoints);
        }
      } catch (verifyError) {
        if (!cancelled) {
          setError(
            verifyError instanceof Error
              ? verifyError.message
              : 'Không thể kiểm tra kết quả thanh toán.',
          );
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <section className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Kết quả thanh toán VNPAY</h1>

        {!result && !error && (
          <p className="mt-6 text-gray-600" role="status">
            Đang kiểm tra kết quả giao dịch...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-6 text-sm text-red-600">
            {error}
          </p>
        )}

        {result?.success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center"
          >
            <div
              aria-hidden="true"
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white"
            >
              ✓
            </div>
            <h2 className="mt-4 text-xl font-bold text-green-800">Thanh toán thành công</h2>
            <div className="mt-5 rounded-lg bg-white p-4">
              <p className="text-sm text-gray-500">Mã đơn</p>
              <p className="mt-1 text-2xl font-bold tracking-wide text-gray-900">
                {result.orderCode}
              </p>
              <p className="mt-3 text-sm text-gray-700">
                Trạng thái: <strong className="text-green-700">Đã thanh toán</strong>
              </p>
              {loyaltyPoints !== null && (
                <p className="mt-3 text-sm font-medium text-amber-800">
                  Điểm thưởng hiện có: {loyaltyPoints} điểm
                </p>
              )}
            </div>
            <p className="mt-5 font-medium text-gray-800">Vui lòng tới quầy để lấy nước.</p>
          </div>
        )}

        {result && !result.success && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <h2 className="text-lg font-bold text-red-800">Thanh toán không thành công</h2>
            <p className="mt-2 text-sm text-red-700">{result.message}</p>
            {result.orderCode && (
              <p className="mt-3 text-sm text-gray-700">
                Mã đơn: <strong>{result.orderCode}</strong>
              </p>
            )}
            <p className="mt-3 text-sm text-gray-600">
              Đơn hàng chưa bị trừ tiền. Bạn có thể đặt lại từ menu hoặc xem trạng thái trong
              mục Đơn hàng của tôi.
            </p>
          </div>
        )}

        {(result || error) && (
          <div className="mt-6 flex gap-3">
            <Link
              href="/"
              className="flex-1 rounded-lg bg-amber-600 py-3 text-center font-semibold text-white hover:bg-amber-700"
            >
              Về trang menu
            </Link>
            <Link
              href="/orders"
              className="flex-1 rounded-lg border border-amber-600 py-3 text-center font-semibold text-amber-700 hover:bg-amber-50"
            >
              Đơn hàng của tôi
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
