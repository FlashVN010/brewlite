'use client';

import { ProductGrid } from '@/components/ProductGrid';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

export default function MenuPage() {
  const totalItems = useCartStore((s) => s.totalItems()); // lấy số luôn

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-800">BrewLite</h1>

        <Link href="/cart" className="relative p-2" aria-label="Giỏ hàng">
          <span className="text-2xl">🛒</span>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
      </main>
    </div>
  );
}