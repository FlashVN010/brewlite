'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải menu');
      } finally {
        setLoading(false);
      }
    };

    loadInitialProducts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded mt-3 w-3/4" />
            <div className="h-4 bg-gray-200 rounded mt-2 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-lg">Chưa có sản phẩm</p>
      </div>
    );
  }

  // Success
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
