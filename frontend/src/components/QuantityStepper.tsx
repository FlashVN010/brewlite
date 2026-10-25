export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div>
      <p className="font-semibold text-gray-900 mb-2">Số lượng</p>
      <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-10 h-10 text-lg hover:bg-gray-100"
          aria-label="Giảm số lượng"
        >
          -
        </button>
        <span className="w-12 text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 text-lg hover:bg-gray-100"
          aria-label="Tăng số lượng"
        >
          +
        </button>
      </div>
    </div>
  );
}
