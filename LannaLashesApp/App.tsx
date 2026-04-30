/**
 * Lanna Lashes — App Root
 * Wraps the app with Stripe, gesture handler, safe area, and navigation
 */
import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuthStore } from './src/store/authStore';
import { useCartStore } from './src/store/cartStore';
import AppNavigator from './src/navigation';

// Suppress noisy warnings from third-party libs in dev
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

const STRIPE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? '';

export default function App() {
  const { refreshUser, token } = useAuthStore();
  const { initCart } = useCartStore();

  useEffect(() => {
    // Restore auth session on cold start
    if (token) refreshUser().catch(() => {});
    // Init Shopify cart
    initCart().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_KEY} merchantIdentifier="merchant.com.lannalashes">
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <AppNavigator />
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
