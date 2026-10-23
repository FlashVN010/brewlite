import { TOPPING_PRICE_DELTAS, ToppingOption } from '@/lib/pricing';

const TOPPING_LABELS: Record<ToppingOption, string> = {
  'tran-chau': 'Trân châu',
  kem: 'Kem',
  pudding: 'Pudding',
};

const TOPPINGS: ToppingOption[] = ['tran-chau', 'kem', 'pudding'];

const formatPrice = (value: number) => `+${new Intl.NumberFormat('vi-VN').format(value)}đ`;

export function ToppingSelector({
  value,
  onChange,
}: {
  value: ToppingOption[];
  onChange: (toppings: ToppingOption[]) => void;
}) {
  const toggleTopping = (topping: ToppingOption) => {
    if (value.includes(topping)) {
      onChange(value.filter((item) => item !== topping));
      return;
    }

    onChange([...value, topping]);
  };

  return (
    <fieldset>
      <legend className="font-semibold text-gray-900 mb-2">Chọn topping</legend>
      <div className="space-y-2">
        {TOPPINGS.map((topping) => (
          <label
            key={topping}
            className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2"
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.includes(topping)}
                onChange={() => toggleTopping(topping)}
                className="h-4 w-4"
              />
              <span>{TOPPING_LABELS[topping]}</span>
            </span>
            <span className="text-sm text-gray-600">{formatPrice(TOPPING_PRICE_DELTAS[topping])}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
