import { ProductSize, SIZE_PRICE_DELTAS } from '@/lib/pricing';

const SIZES: ProductSize[] = ['S', 'M', 'L'];

function formatDelta(value: number): string {
  if (value === 0) return '0đ';
  const prefix = value > 0 ? '+' : '-';
  return `${prefix}${new Intl.NumberFormat('vi-VN').format(Math.abs(value))}đ`;
}

export function SizeSelector({
  value,
  onChange,
}: {
  value: ProductSize;
  onChange: (size: ProductSize) => void;
}) {
  return (
    <fieldset>
      <legend className="font-semibold text-gray-900 mb-2">Chọn size</legend>
      <div className="grid grid-cols-3 gap-2">
        {SIZES.map((size) => (
          <label
            key={size}
            className={`border rounded-lg px-3 py-2 text-center cursor-pointer ${
              value === size ? 'border-amber-600 bg-amber-50' : 'border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="size"
              value={size}
              checked={value === size}
              onChange={() => onChange(size)}
              className="sr-only"
            />
            <span className="font-medium">{size}</span>
            <span className="block text-xs text-gray-600">{formatDelta(SIZE_PRICE_DELTAS[size])}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
