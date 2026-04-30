/**
 * ShopScreen — Shopify Storefront-powered product browsing
 * Fetches live products from lannalashes.com via Storefront API
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, ActivityIndicator,
  TextInput, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getProducts, getCollections, formatPrice, getProductBadge, ShopifyProduct,
} from '../services/shopify';
import { useCartStore } from '../store/cartStore';
import { ProductCard, SectionHeader, FilterChips, Badge } from '../components';
import { Colors, Typography, Spacing, Radius } from '../theme';

const CATEGORIES = ['All', 'Lashes', 'Adhesives', 'Tools', 'Bundles'];
const CATEGORY_HANDLES: Record<string, string | undefined> = {
  All: undefined,
  Lashes: 'lashes',
  Adhesives: 'adhesives',
  Tools: 'tools',
  Bundles: 'bundles',
};

export default function ShopScreen() {
  const navigation = useNavigation<any>();
  const { addItem, totalItems } = useCartStore();

  const [products, setProducts]           = useState<ShopifyProduct[]>([]);
  const [bestSellers, setBestSellers]     = useState<ShopifyProduct[]>([]);
  const [category, setCategory]           = useState('All');
  const [searchQuery, setSearchQuery]     = useState('');
  const [isLoading, setIsLoading]         = useState(true);
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const [addingId, setAddingId]           = useState<string | null>(null);
  const [searchActive, setSearchActive]   = useState(false);

  const loadProducts = useCallback(async (cat = category, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const handle = CATEGORY_HANDLES[cat];
      const data = await getProducts(24, handle);
      setProducts(data);
      if (cat === 'All') setBestSellers(data.slice(0, 6));
    } catch (e: any) {
      Alert.alert('Could not load products', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [category]);

  useEffect(() => { loadProducts(); }, []);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    loadProducts(cat);
  };

  const handleAddToCart = async (product: ShopifyProduct) => {
    const firstVariant = product.variants.edges[0]?.node;
    if (!firstVariant) return;
    if (!firstVariant.availableForSale) {
      Alert.alert('Out of stock', 'This item is currently unavailable.');
      return;
    }
    setAddingId(product.id);
    try {
      await addItem(firstVariant.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setAddingId(null);
    }
  };

  const filteredProducts = searchQuery.trim()
    ? products.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>LANNA LASHES</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setSearchActive(!searchActive)} style={styles.headerIcon}>
            <Text style={styles.headerIconText}>⌕</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.headerIcon}>
            <Text style={styles.headerIconText}>⊡</Text>
            {totalItems() > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {searchActive && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.light}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading && !isRefreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.black} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadProducts(category, true)}
              tintColor={Colors.black}
            />
          }
        >
          {/* Hero Banner */}
          {!searchActive && (
            <View style={styles.hero}>
              <Text style={styles.heroLL}>LL</Text>
              <Text style={styles.heroEyebrow}>NEW COLLECTION</Text>
              <Text style={styles.heroTitle}>Volume Lash{'\n'}Starter Kit</Text>
              <Text style={styles.heroSub}>Everything you need to begin</Text>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => handleCategoryChange('Bundles')}
              >
                <Text style={styles.heroBtnText}>SHOP NOW</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Category Filter */}
          <View style={styles.filterWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategoryChange(cat)}
                  style={[styles.chip, category === cat && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Best Sellers (All tab only) */}
          {category === 'All' && !searchActive && bestSellers.length > 0 && (
            <>
              <SectionHeader
                title="Bestsellers"
                linkLabel="View all"
                onLink={() => {}}
              />
              <View style={styles.grid}>
                {bestSellers.map(product => (
                  <ProductCard
                    key={product.id}
                    title={product.title}
                    description={product.description.replace(/<[^>]+>/g, '')}
                    price={formatPrice(
                      product.priceRange.minVariantPrice.amount,
                      product.priceRange.minVariantPrice.currencyCode,
                    )}
                    compareAtPrice={
                      parseFloat(product.compareAtPriceRange.minVariantPrice.amount) > 0
                      && parseFloat(product.compareAtPriceRange.minVariantPrice.amount) >
                         parseFloat(product.priceRange.minVariantPrice.amount)
                        ? formatPrice(product.compareAtPriceRange.minVariantPrice.amount)
                        : undefined
                    }
                    imageUrl={product.images.edges[0]?.node.url}
                    badge={getProductBadge(product)}
                    onPress={() => navigation.navigate('ProductDetail', { handle: product.handle })}
                    onAddToCart={() => handleAddToCart(product)}
                    style={styles.gridItem}
                  />
                ))}
              </View>
            </>
          )}

          {/* All / Filtered Products */}
          <SectionHeader
            title={searchActive && searchQuery
              ? `Results for "${searchQuery}"`
              : category === 'All' ? 'All Products' : category}
            linkLabel={undefined}
          />

          {filteredProducts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  title={product.title}
                  description={product.description.replace(/<[^>]+>/g, '')}
                  price={formatPrice(
                    product.priceRange.minVariantPrice.amount,
                    product.priceRange.minVariantPrice.currencyCode,
                  )}
                  compareAtPrice={
                    parseFloat(product.compareAtPriceRange.minVariantPrice.amount) > 0
                    && parseFloat(product.compareAtPriceRange.minVariantPrice.amount) >
                       parseFloat(product.priceRange.minVariantPrice.amount)
                      ? formatPrice(product.compareAtPriceRange.minVariantPrice.amount)
                      : undefined
                  }
                  imageUrl={product.images.edges[0]?.node.url}
                  badge={getProductBadge(product)}
                  onPress={() => navigation.navigate('ProductDetail', { handle: product.handle })}
                  onAddToCart={() => handleAddToCart(product)}
                  style={styles.gridItem}
                />
              ))}
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, height: 54,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  headerLogo: { fontFamily: 'InterTight-Bold', fontSize: 15, letterSpacing: 0.2, color: Colors.black },
  headerActions: { flexDirection: 'row', gap: Spacing.lg },
  headerIcon: { position: 'relative', padding: 4 },
  headerIconText: { fontSize: 20, color: Colors.black },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.black, borderRadius: Radius.full,
    width: 14, height: 14, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: Colors.white, fontSize: 8, fontFamily: 'InterTight-Bold' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.black,
  },
  searchClear: { fontSize: 14, color: Colors.light },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  hero: {
    backgroundColor: Colors.black, padding: Spacing.xxl,
    paddingTop: Spacing.xxxl, overflow: 'hidden', position: 'relative',
  },
  heroLL: {
    position: 'absolute', right: -10, top: '50%',
    fontFamily: 'InterTight-Bold', fontSize: 110,
    color: 'rgba(255,255,255,0.05)', letterSpacing: -4,
  },
  heroEyebrow: {
    ...Typography.labelSm, color: Colors.mid, letterSpacing: 0.28, marginBottom: Spacing.sm + 2,
  },
  heroTitle: {
    fontFamily: 'InterTight-Bold', fontSize: 32,
    color: Colors.white, letterSpacing: -0.5, lineHeight: 38, marginBottom: 6,
  },
  heroSub: { ...Typography.bodySmall, color: Colors.light, marginBottom: Spacing.xl },
  heroBtn: {
    alignSelf: 'flex-start', backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl, paddingVertical: 10, borderRadius: Radius.sm,
  },
  heroBtnText: { fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.black, letterSpacing: 0.18 },

  filterWrap: {
    backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  filterScroll: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md + 2, paddingVertical: 7,
    borderRadius: Radius.sm, borderWidth: 0.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { fontFamily: 'InterTight-SemiBold', fontSize: 11, color: Colors.light, letterSpacing: 0.1 },
  chipTextActive: { color: Colors.white },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl, gap: 10,
  },
  gridItem: { width: '47.5%' },

  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.light },
});
