'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  AUTH_TOKEN_KEY,
  login as loginUser,
  register as registerUser,
} from '@/lib/api';

function getSafeNextPath(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//')
    ? value
    : '/checkout';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get('next'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(AUTH_TOKEN_KEY)) {
      router.replace(nextPath);
    }

    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }, [nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegistering) {
        await registerUser(email, password);
      }

      const auth = await loginUser(email, password);
      window.sessionStorage.setItem(AUTH_TOKEN_KEY, auth.accessToken);
      router.replace(nextPath);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Đã xảy ra lỗi, vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-amber-800">
            BrewLite
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-50"
          >
            <span aria-hidden="true">←</span>
            <span>Giỏ hàng</span>
          </Link>
        </div>
        <h1 className="mt-8 text-2xl font-bold text-gray-900">
          {isRegistering ? 'Tạo tài khoản' : 'Đăng nhập'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isRegistering
            ? 'Đăng ký để tiếp tục đặt món.'
            : 'Đăng nhập để tiếp tục thanh toán.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-amber-600"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Mật khẩu
            <input
              type="password"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={isRegistering ? 6 : undefined}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-amber-600"
            />
            {isRegistering && (
              <span className="mt-1 block text-xs text-gray-500">
                Mật khẩu cần có ít nhất 6 ký tự.
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Đang xử lý...'
              : isRegistering
                ? 'Đăng ký'
                : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="font-semibold text-amber-700 hover:underline"
          >
            {isRegistering ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          Đang tải...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
