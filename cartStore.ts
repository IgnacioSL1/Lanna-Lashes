/**
 * Global cart store using Zustand + AsyncStorage persistence
 * Handles Shopify cart lifecycle across app sessions
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createCart,
  addToCart,
  removeFromCart,
  updateCartLine,
  getCart,
  ShopifyCart,
} from '../services/shopify';

interface CartStore {
  cartId: string | null;
  cart: ShopifyCart | null;
  isLoading: boolean;
  error: string | null;

  initCart: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearError: () => void;

  // Derived
  totalItems: () => number;
  subtotal: () => string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartId: null,
      cart: null,
      isLoading: false,
      error: null,

      initCart: async () => {
        const { cartId } = get();
        if (cartId) {
          try {
            const cart = await getCart(cartId);
            set({ cart });
            return;
          } catch {
            // Cart expired — create a new one
          }
        }
        const cart = await createCart();
        set({ cartId: cart.id, cart });
      },

      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
          let { cartId } = get();
          if (!cartId) {
            const newCart = await createCart();
            cartId = newCart.id;
            set({ cartId });
          }
          const cart = await addToCart(cartId, variantId, quantity);
          set({ cart, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      removeItem: async (lineId) => {
        set({ isLoading: true, error: null });
        try {
          const { cartId } = get();
          if (!cartId) return;
          const cart = await removeFromCart(cartId, lineId);
          set({ cart, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      updateItem: async (lineId, quantity) => {
        set({ isLoading: true, error: null });
        try {
          const { cartId } = get();
          if (!cartId) return;
          const cart = await updateCartLine(cartId, lineId, quantity);
          set({ cart, isLoading: false });
        } catch (e: any) {
          set({ error: e.message, isLoading: false });
        }
      },

      refreshCart: async () => {
        const { cartId } = get();
        if (!cartId) return;
        try {
          const cart = await getCart(cartId);
          set({ cart });
        } catch { /* silent */ }
      },

      clearError: () => set({ error: null }),

      totalItems: () => get().cart?.totalQuantity ?? 0,

      subtotal: () => {
        const cart = get().cart;
        if (!cart) return '$0';
        const { amount, currencyCode } = cart.cost.subtotalAmount;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 0,
        }).format(parseFloat(amount));
      },
    }),
    {
      name: 'lanna-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ cartId: state.cartId }),
    }
  )
);
