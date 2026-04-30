/**
 * CartScreen
 * Shows cart items, quantity controls, and opens Shopify-hosted checkout in a WebView.
 * Shopify handles all payment processing, shipping, and taxes natively.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useCartStore } from '../store/cartStore';
import { CartLine } from '../services/shopify';
import { Button } from '../components';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const {
    cart, isLoading, removeItem, updateItem, refreshCart, totalItems, subtotal,
  } = useCartStore();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);

  useEffect(() => { refreshCart(); }, []);

  const lines = cart?.lines.edges.map(e => e.node) ?? [];

  const handleQuantityChange = async (line: CartLine, delta: number) => {
    const newQty = line.quantity + delta;
    if (newQty < 1) {
      Alert.alert('Remove item', `Remove ${line.merchandise.product.title} from cart?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(line.id) },
      ]);
      return;
    }
    setUpdatingId(line.id);
    await updateItem(line.id, newQty);
    setUpdatingId(null);
  };

  const handleCheckout = () => {
    if (!cart?.checkoutUrl) {
      Alert.alert('Error', 'Could not load checkout. Please try again.');
      return;
    }
    setCheckoutOpen(true);
  };

  // Detect when Shopify checkout completes (redirects to thank you page)
  const handleCheckoutNav = (navState: { url: string }) => {
    if (navState.url.includes('thank_you') || navState.url.includes('orders')) {
      setCheckoutOpen(false);
      Alert.alert(
        'Order placed!',
        'Thank you for your order. You\'ll receive a confirmation email shortly.',
        [{ text: 'Continue Shopping', onPress: () => navigation.navigate('ShopHome') }]
      );
    }
  };

  if (isLoading && lines.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.black} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR CART</Text>
        <Text style={styles.headerCount}>{totalItems()} {totalItems() === 1 ? 'item' : 'items'}</Text>
      </View>

      {lines.length === 0 ? (
        /* Empty state */
        <View style={styles.empty}>
          <Text style={styles.emptyLL}>LL</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add some products to get started</Text>
          <Button
            label="Continue Shopping"
            onPress={() => navigation.goBack()}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {lines.map(line => (
              <CartLineItem
                key={line.id}
                line={line}
                isUpdating={updatingId === line.id}
                onQuantityChange={(delta) => handleQuantityChange(line, delta)}
                onRemove={() => removeItem(line.id)}
              />
            ))}
          </ScrollView>

          {/* Order Summary + Checkout */}
          <View style={[styles.summary, { paddingBottom: insets.bottom || Spacing.xl }]}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{subtotal()}</Text>
            </View>
            <Text style={styles.summaryNote}>
              Shipping and taxes calculated at checkout
            </Text>
            <Button
              label="Proceed to Checkout"
              onPress={handleCheckout}
              loading={isLoading}
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.continueLink}>
              <Text style={styles.continueLinkText}>Continue shopping</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Shopify Checkout WebView Modal */}
      <Modal visible={checkoutOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.checkoutModal, { paddingTop: insets.top }]}>
          <View style={styles.checkoutHeader}>
            <TouchableOpacity onPress={() => setCheckoutOpen(false)} style={styles.checkoutClose}>
              <Text style={styles.checkoutCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.checkoutTitle}>SECURE CHECKOUT</Text>
            <View style={styles.lockIcon}>
              <Text style={{ fontSize: 12 }}>🔒</Text>
            </View>
          </View>
          <WebView
            source={{ uri: cart?.checkoutUrl ?? '' }}
            onNavigationStateChange={handleCheckoutNav}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoader}>
                <ActivityIndicator color={Colors.black} />
              </View>
            )}
            style={{ flex: 1 }}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── CartLineItem ─────────────────────────────────────────────────────────────

function CartLineItem({
  line, isUpdating, onQuantityChange, onRemove,
}: {
  line: CartLine;
  isUpdating: boolean;
  onQuantityChange: (delta: number) => void;
  onRemove: () => void;
}) {
  const imageUrl = line.merchandise.product.images.edges[0]?.node.url;
  const { amount, currencyCode } = line.cost.totalAmount;
  const linePrice = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currencyCode, minimumFractionDigits: 0,
  }).format(parseFloat(amount));

  return (
    <View style={lineStyles.card}>
      <View style={lineStyles.imageWrap}>
        {imageUrl
          ? <Image source={{ uri: imageUrl }} style={lineStyles.image} resizeMode="cover" />
          : <View style={lineStyles.imagePlaceholder}>
              <Text style={lineStyles.imagePlaceholderText}>LL</Text>
            </View>
        }
      </View>

      <View style={lineStyles.info}>
        <Text style={lineStyles.productTitle} numberOfLines={2}>
          {line.merchandise.product.title}
        </Text>
        {line.merchandise.title !== 'Default Title' && (
          <Text style={lineStyles.variantTitle}>{line.merchandise.title}</Text>
        )}
        <Text style={lineStyles.unitPrice}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: line.merchandise.price.currencyCode,
            minimumFractionDigits: 0,
          }).format(parseFloat(line.merchandise.price.amount))} each
        </Text>

        <View style={lineStyles.footer}>
          <View style={lineStyles.qtyRow}>
            <TouchableOpacity
              onPress={() => onQuantityChange(-1)}
              style={lineStyles.qtyBtn}
              disabled={isUpdating}
            >
              <Text style={lineStyles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={lineStyles.qty}>
              {isUpdating
                ? <ActivityIndicator color={Colors.black} size="small" />
                : line.quantity
              }
            </Text>
            <TouchableOpacity
              onPress={() => onQuantityChange(1)}
              style={lineStyles.qtyBtn}
              disabled={isUpdating}
            >
              <Text style={lineStyles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={lineStyles.lineTotal}>{linePrice}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onRemove} style={lineStyles.removeBtn}>
        <Text style={lineStyles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const lineStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.card,
  },
  imageWrap: {
    width: 80, height: 80, borderRadius: Radius.sm,
    overflow: 'hidden', backgroundColor: Colors.offWhite, flexShrink: 0,
  },
  image: { width: 80, height: 80 },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: {
    fontFamily: 'InterTight-Bold', fontSize: 18, color: Colors.mid, letterSpacing: -1,
  },
  info: { flex: 1, gap: 3 },
  productTitle: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black, lineHeight: 18 },
  variantTitle: { ...Typography.bodySmall, color: Colors.light },
  unitPrice: { ...Typography.bodySmall, color: Colors.light },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 28, height: 28, borderRadius: Radius.sm,
    borderWidth: 0.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, color: Colors.black, lineHeight: 20 },
  qty: { fontFamily: 'InterTight-SemiBold', fontSize: 14, color: Colors.black, minWidth: 20, textAlign: 'center' },
  lineTotal: { fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.black },
  removeBtn: { padding: 4, alignSelf: 'flex-start' },
  removeBtnText: { fontSize: 12, color: Colors.light },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  closeBtn: { padding: 4, marginRight: Spacing.md },
  closeBtnText: { fontSize: 16, color: Colors.black },
  headerTitle: {
    flex: 1, fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.black, letterSpacing: 0.15,
  },
  headerCount: { ...Typography.bodySmall, color: Colors.light },

  list: { padding: Spacing.xl },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyLL: { fontFamily: 'InterTight-Bold', fontSize: 64, color: Colors.mid, letterSpacing: -3, marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: 'InterTight-Bold', fontSize: 20, color: Colors.black, marginBottom: 8 },
  emptySub: { ...Typography.body, color: Colors.light },

  summary: {
    backgroundColor: Colors.white, padding: Spacing.xl,
    borderTopWidth: 0.5, borderTopColor: Colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontFamily: 'InterTight-SemiBold', fontSize: 14, color: Colors.dark },
  summaryValue: { fontFamily: 'InterTight-Bold', fontSize: 18, color: Colors.black },
  summaryNote: { ...Typography.bodySmall, color: Colors.light },
  continueLink: { alignItems: 'center', paddingTop: Spacing.md },
  continueLinkText: { ...Typography.bodySmall, color: Colors.light, textDecorationLine: 'underline' },

  checkoutModal: { flex: 1, backgroundColor: Colors.white },
  checkoutHeader: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  checkoutClose: { padding: 4 },
  checkoutCloseText: { fontSize: 16, color: Colors.black },
  checkoutTitle: {
    flex: 1, textAlign: 'center',
    fontFamily: 'InterTight-Bold', fontSize: 12, color: Colors.black, letterSpacing: 0.2,
  },
  lockIcon: { padding: 4 },
  webviewLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
