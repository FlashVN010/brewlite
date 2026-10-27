'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QuantityStepper } from '@/components/QuantityStepper';
import { SizeSelector } from '@/components/SizeSelector';
import { ToppingSelector } from '@/components/ToppingSelector';
import { getProductById } from '@/lib/api';
import { calcLineTotal, ProductSize, ToppingOption } from '@/lib/pricing';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types/product';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

// 1. Tách logic chính ra một component con riêng để dùng useParams() bên trong Suspense
function ProductDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const productId = Number(params.id);
  const isValidProductId = Number.isInteger(productId);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<ProductSize>('M');
  const [toppings, setToppings] = useState<ToppingOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!isValidProductId) {
      return;
    }

    const fetchProduct = async () => {
      const data = await getProductById(productId);
      setProduct(data);
      setLoading(false);
    };

    fetchProduct();
  }, [isValidProductId, productId]);

  const lineTotal = useMemo(() => {
    if (!product) {
      return 0;
    }

    return calcLineTotal(product, size, toppings, quantity);
  }, [product, quantity, size, toppings]);

  const notFoundPage = (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-gray-900 mb-2">Sản phẩm không tồn tại</p>
        <Link href="/" className="inline-flex mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
          ← Quay lại menu
        </Link>
      </div>
    </div>
  );

  if (!isValidProductId) {
    return notFoundPage;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-8 w-28 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return notFoundPage;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-amber-700 font-medium hover:underline mb-6"
        >
          ← Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-gray-600 mt-2">{product.description || 'Thức uống thơm ngon, pha chế tại chỗ.'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Giá gốc</p>
              <p className="text-2xl font-bold text-amber-700">{formatPrice(product.price)}</p>
            </div>

            <SizeSelector value={size} onChange={setSize} />
            <ToppingSelector value={toppings} onChange={setToppings} />
            <QuantityStepper value={quantity} onChange={setQuantity} />

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600">Giá tạm tính</p>
              <p className="text-3xl font-bold text-amber-700">{formatPrice(lineTotal)}</p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!product) {
                  return;
                }

                addItem({
                  productId: Number(product.id),
                  name: product.name,
                  imageUrl: product.imageUrl,
                  size,
                  toppings,
                  unitPrice: calcLineTotal(product, size, toppings, 1),
                  quantity,
                });
                setAddedToCart(true);
              }}
              className="w-full py-3 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
            >
              Thêm vào giỏ
            </button>
            {addedToCart && (
              <p role="status" className="text-sm text-green-700">
                Đã thêm vào giỏ hàng.{' '}
                <Link href="/cart" className="font-semibold underline">
                  Xem giỏ hàng
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Component chính của trang bọc trong Suspense theo đúng chuẩn Next.js
export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Đang tải trang sản phẩm...</div>}>
      <ProductDetailContent />
    </Suspense>
  );
}