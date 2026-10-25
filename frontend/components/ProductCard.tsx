import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="relative aspect-square">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-amber-700 font-bold mt-1">
          {formatPrice(product.price)}
        </p>

        <Link
          href={`/products/${product.id}`}
          className="mt-3 inline-block text-sm text-amber-600 font-medium hover:underline"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
