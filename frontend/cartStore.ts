import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/types/cart';

/** Key duy nhất: productId + size + toppings đã sort */
const getItemKey = (item: Pick<CartItem, 'productId' | 'size' | 'toppings'>) =>
  `${item.productId}-${item.size}-${[...item.toppings].sort().join(',')}`;

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: number, size: string, toppings: string[]) => void;
  updateQuantity: (
    productId: number,
    size: string,
    toppings: string[],
    quantity: number
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        const key = getItemKey(item);

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => getItemKey(i) === key
          );

          // AC2 – Gộp item trùng
          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
            return { items: newItems };
          }

          // AC3 – Khác size/topping → dòng mới
          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },

      removeItem: (productId, size, toppings) => {
        const key = getItemKey({
          productId,
          size: size as CartItem['size'],
          toppings,
        });
        set((state) => ({
          items: state.items.filter((i) => getItemKey(i) !== key),
        }));
      },

      updateQuantity: (productId, size, toppings, quantity) => {
        // AC4 – Không cho giảm dưới 1
        if (quantity < 1) return;

        const key = getItemKey({
          productId,
          size: size as CartItem['size'],
          toppings,
        });
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i) === key ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ),
    }),
    {
      name: 'brewlite-cart', // localStorage key
    }
  )
);