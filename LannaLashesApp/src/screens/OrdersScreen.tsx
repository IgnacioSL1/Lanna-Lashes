/**
 * OrdersScreen
 * Fetches and displays Shopify order history for the logged-in customer.
 *
 * Uses Shopify Customer Account API (separate from Storefront API).
 * Requires the customer's access token obtained via multipass or email login.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { apiGet } from '../services/api';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

// These types reflect what your backend returns after fetching from Shopify Customer API
interface OrderLineItem {
  id: string;
  title: string;
  variantTitle: string;
  quantity: number;
  price: string;
  imageUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: string;
  currencyCode: string;
  lineItems: OrderLineItem[];
  trackingUrl: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PAID:      { label: 'Paid',       color: '#166534', bg: '#DCFCE7' },
  PENDING:   { label: 'Pending',    color: '#92400E', bg: '#FEF3C7' },
  REFUNDED:  { label: 'Refunded',   color: '#1E40AF', bg: '#DBEAFE' },
  FULFILLED: { label: 'Shipped',    color: '#166534', bg: '#DCFCE7' },
  UNFULFILLED: { label: 'Processing', color: '#92400E', bg: '#FEF3C7' },
  PARTIALLY_FULFILLED: { label: 'Partially shipped', color: '#92400E', bg: '#FEF3C7' },
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthStore();

  const [orders, setOrders]         = useState<Order[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      // Your backend proxies the Shopify Customer Account API
      // and returns orders for the authenticated user
      const data = await apiGet<Order[]>('/shopify/orders');
      setOrders(data);
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (e: any) {
      Alert.alert('Could not load orders', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.black} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORDER HISTORY</Text>
        <View style={{ width: 36 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyLL}>LL</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySub}>Your Lanna Lashes orders will appear here</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Shop')}
            style={styles.shopBtn}
          >
            <Text style={styles.shopBtnText}>SHOP NOW</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={Colors.black} />
          }
        >
          {orders.map(order => {
            const isExpanded      = expandedId === order.id;
            const financialStatus = STATUS_LABELS[order.financialStatus] ?? { label: order.financialStatus, color: Colors.dark, bg: Colors.offWhite };
            const fulfillStatus   = STATUS_LABELS[order.fulfillmentStatus] ?? { label: order.fulfillmentStatus, color: Colors.dark, bg: Colors.offWhite };
            const price = new Intl.NumberFormat('en-US', {
              style: 'currency', currency: order.currencyCode, minimumFractionDigits: 0,
            }).format(parseFloat(order.totalPrice));

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Order header */}
                <TouchableOpacity
                  onPress={() => setExpandedId(isExpanded ? null : order.id)}
                  style={styles.orderHeader}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.processedAt)}</Text>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderTotal}>{price}</Text>
                    <Text style={styles.chevron}>{isExpanded ? '↑' : '↓'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Status pills */}
                <View style={styles.statusRow}>
                  <View style={[styles.statusPill, { backgroundColor: financialStatus.bg }]}>
                    <Text style={[styles.statusText, { color: financialStatus.color }]}>
                      {financialStatus.label}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: fulfillStatus.bg }]}>
                    <Text style={[styles.statusText, { color: fulfillStatus.color }]}>
                      {fulfillStatus.label}
                    </Text>
                  </View>
                </View>

                {/* Expanded: line items + track */}
                {isExpanded && (
                  <View style={styles.orderBody}>
                    {order.lineItems.map(item => (
                      <View key={item.id} style={styles.lineItem}>
                        <View style={styles.lineItemImage}>
                          {item.imageUrl
                            ? <Image source={{ uri: item.imageUrl }} style={styles.lineItemImg} resizeMode="cover" />
                            : <Text style={styles.lineItemLL}>LL</Text>
                          }
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lineItemTitle} numberOfLines={1}>{item.title}</Text>
                          {item.variantTitle && item.variantTitle !== 'Default Title' && (
                            <Text style={styles.lineItemVariant}>{item.variantTitle}</Text>
                          )}
                          <Text style={styles.lineItemQty}>Qty: {item.quantity}</Text>
                        </View>
                        <Text style={styles.lineItemPrice}>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency', currency: order.currencyCode, minimumFractionDigits: 0,
                          }).format(parseFloat(item.price))}
                        </Text>
                      </View>
                    ))}

                    {/* Track package */}
                    {order.trackingUrl && (
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => Alert.alert('Track your order', order.trackingUrl ?? '')}
                      >
                        <Text style={styles.trackBtnText}>TRACK PACKAGE →</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 36, padding: 4 },
  backBtnText: { fontSize: 18, color: Colors.black },
  headerTitle: { fontFamily: 'InterTight-Bold', fontSize: 13, color: Colors.black, letterSpacing: 0.15 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.md },
  emptyLL: { fontFamily: 'InterTight-Bold', fontSize: 64, color: Colors.mid, letterSpacing: -3 },
  emptyTitle: { fontFamily: 'InterTight-Bold', fontSize: 20, color: Colors.black, letterSpacing: -0.2 },
  emptySub: { ...Typography.body, color: Colors.light, textAlign: 'center' },
  shopBtn: {
    backgroundColor: Colors.black, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: Radius.sm, marginTop: Spacing.sm,
  },
  shopBtnText: { fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.white, letterSpacing: 0.18 },

  list: { padding: Spacing.xl, gap: Spacing.md },

  orderCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden', ...Shadows.card,
  },
  orderHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md + 2, paddingVertical: Spacing.md + 2,
  },
  orderNumber: { fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.black, marginBottom: 2 },
  orderDate: { ...Typography.bodySmall, color: Colors.light },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderTotal: { fontFamily: 'InterTight-Bold', fontSize: 15, color: Colors.black },
  chevron: { fontSize: 12, color: Colors.light },

  statusRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.md + 2, paddingBottom: Spacing.md,
  },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontFamily: 'InterTight-SemiBold', fontSize: 10, letterSpacing: 0.05 },

  orderBody: {
    borderTopWidth: 0.5, borderTopColor: Colors.border, paddingVertical: Spacing.sm,
  },
  lineItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md + 2, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  lineItemImage: {
    width: 52, height: 52, borderRadius: Radius.sm,
    backgroundColor: Colors.offWhite, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  lineItemImg: { width: 52, height: 52 },
  lineItemLL: { fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.mid, letterSpacing: -1 },
  lineItemTitle: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black, marginBottom: 2 },
  lineItemVariant: { ...Typography.bodySmall, color: Colors.light },
  lineItemQty: { ...Typography.bodySmall, color: Colors.light },
  lineItemPrice: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black },

  trackBtn: {
    margin: Spacing.md + 2, marginTop: Spacing.sm,
    borderWidth: 0.5, borderColor: Colors.black,
    paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center',
  },
  trackBtnText: { fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.black, letterSpacing: 0.15 },
});
