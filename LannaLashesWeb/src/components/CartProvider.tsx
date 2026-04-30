'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCart, addToCart, removeFromCart, updateCartLine, getCart, ShopifyCart } from '@/services/shopify';
import { useEffect } from 'react';

interface CartStore {
  cartId: string | null; cart: ShopifyCart | null;
  isLoading: boolean; error: string | null;
  initCart:   () => Promise<void>;
  addItem:    (variantId: string, quantity?: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  refreshCart:() => Promise<void>;
  clearError: () => void;
  totalItems: () => number;
  subtotal:   () => string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartId: null, cart: null, isLoading: false, error: null,

      initCart: async () => {
        const { cartId } = get();
        if (cartId) {
          try { const cart = await getCart(cartId); set({ cart }); return; } catch {}
        }
        const cart = await createCart();
        set({ cartId: cart.id, cart });
      },

      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
          let { cartId } = get();
          if (!cartId) { const c = await createCart(); cartId = c.id; set({ cartId }); }
          const cart = await addToCart(cartId, variantId, quantity);
          set({ cart, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
      },

      removeItem: async (lineId) => {
        set({ isLoading: true });
        try {
          const { cartId } = get();
          if (!cartId) return;
          const cart = await removeFromCart(cartId, lineId);
          set({ cart, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
      },

      updateItem: async (lineId, quantity) => {
        set({ isLoading: true });
        try {
          const { cartId } = get();
          if (!cartId) return;
          const cart = await updateCartLine(cartId, lineId, quantity);
          set({ cart, isLoading: false });
        } catch (e: any) { set({ error: e.message, isLoading: false }); }
      },

      refreshCart: async () => {
        const { cartId } = get();
        if (!cartId) return;
        try { const cart = await getCart(cartId); set({ cart }); } catch {}
      },

      clearError: () => set({ error: null }),
      totalItems: () => get().cart?.totalQuantity ?? 0,
      subtotal: () => {
        const cart = get().cart;
        if (!cart) return '$0';
        const { amount, currencyCode } = cart.cost.subtotalAmount;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 0 }).format(parseFloat(amount));
      },
    }),
    { name: 'lanna-cart-web', partialize: s => ({ cartId: s.cartId }) }
  )
);

// CartProvider initialises the cart on mount
export function CartProvider({ children }: { children: React.ReactNode }) {
  const initCart = useCartStore(s => s.initCart);
  useEffect(() => { initCart(); }, []);
  return <>{children}</>;
}
