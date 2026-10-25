import { ProductGrid } from '@/components/ProductGrid';
import Link from 'next/link';

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-800">BrewLite</h1>

        <Link href="/cart" className="relative p-2">
          <span className="text-2xl">🛒</span>
        </Link>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6">
        <ProductGrid />
      </main>
    </div>
  );
}