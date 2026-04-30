/**
 * ProductDetailScreen
 * Full product page: image gallery, variant selector, add to cart
 * Pulls live data from Shopify Storefront API
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Dimensions,
  FlatList, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProduct, formatPrice, ShopifyProduct, ShopifyVariant } from '../services/shopify';
import { useCartStore } from '../store/cartStore';
import { Button, Badge } from '../components';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const insets      = useSafeAreaInsets();
  const { addItem } = useCartStore();

  const [product, setProduct]             = useState<ShopifyProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ShopifyVariant | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isAdding, setIsAdding]           = useState(false);
  const [imageIndex, setImageIndex]       = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showFullDesc, setShowFullDesc]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProduct(route.params.handle);
        setProduct(data);
        const firstVariant = data.variants.edges[0]?.node;
        if (firstVariant) {
          setSelectedVariant(firstVariant);
          const opts: Record<string, string> = {};
          firstVariant.selectedOptions.forEach(o => { opts[o.name] = o.value; });
          setSelectedOptions(opts);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [route.params.handle]);

  // Find variant matching current selected options
  useEffect(() => {
    if (!product) return;
    const match = product.variants.edges.find(({ node }) =>
      node.selectedOptions.every(o => selectedOptions[o.name] === o.value)
    );
    if (match) setSelectedVariant(match.node);
  }, [selectedOptions, product]);

  const handleOptionSelect = (name: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    if (!selectedVariant.availableForSale) {
      Alert.alert('Out of stock', 'Please select a different option.');
      return;
    }
    setIsAdding(true);
    try {
      await addItem(selectedVariant.id);
      Alert.alert(
        'Added to cart',
        `${product?.title} has been added.`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setImageIndex(idx);
  };

  // Build option groups from all variants
  const optionGroups = product?.variants.edges.reduce<Record<string, Set<string>>>(
    (acc, { node }) => {
      node.selectedOptions.forEach(o => {
        if (!acc[o.name]) acc[o.name] = new Set();
        acc[o.name].add(o.value);
      });
      return acc;
    },
    {}
  ) ?? {};

  const images = product?.images.edges.map(e => e.node) ?? [];
  const isOnSale = selectedVariant?.compareAtPrice &&
    parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.black} size="large" />
      </View>
    );
  }

  if (!product) return null;

  const cleanDesc = product.description.replace(/<[^>]+>/g, '').trim();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      {/* Cart button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Cart')}
        style={[styles.cartBtn, { top: insets.top + 8 }]}
      >
        <Text style={styles.cartBtnText}>⊡</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryWrap}>
          {images.length > 0 ? (
            <>
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.url }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                )}
              />
              {images.length > 1 && (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.galleryPlaceholder}>
              <Text style={styles.galleryLL}>LL</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Title + Price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 4 }}>
              {product.collections.edges[0] && (
                <Text style={styles.collectionLabel}>
                  {product.collections.edges[0].node.title.toUpperCase()}
                </Text>
              )}
              <Text style={styles.title}>{product.title}</Text>
            </View>
            {isOnSale && <Badge label="Sale" variant="black" />}
          </View>

          <View style={styles.priceRow}>
            {isOnSale && selectedVariant?.compareAtPrice && (
              <Text style={styles.comparePrice}>
                {formatPrice(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode)}
              </Text>
            )}
            <Text style={styles.price}>
              {formatPrice(selectedVariant?.price.amount ?? '0', selectedVariant?.price.currencyCode)}
            </Text>
          </View>

          {/* Availability */}
          <View style={styles.availRow}>
            <View style={[styles.availDot, !selectedVariant?.availableForSale && styles.availDotOut]} />
            <Text style={styles.availText}>
              {selectedVariant?.availableForSale
                ? `In stock${selectedVariant.quantityAvailable > 0 ? ` · ${selectedVariant.quantityAvailable} left` : ''}`
                : 'Out of stock'}
            </Text>
          </View>

          {/* Variant Options */}
          {Object.entries(optionGroups).map(([name, valuesSet]) => {
            const values = Array.from(valuesSet);
            if (values.length <= 1) return null;
            return (
              <View key={name} style={styles.optionGroup}>
                <Text style={styles.optionLabel}>{name.toUpperCase()}</Text>
                <View style={styles.optionValues}>
                  {values.map(val => {
                    const isSelected = selectedOptions[name] === val;
                    // Check if this option combo is available
                    const variantForOption = product.variants.edges.find(({ node }) =>
                      node.selectedOptions.every(o =>
                        o.name === name ? o.value === val : selectedOptions[o.name] === o.value
                      )
                    )?.node;
                    const available = variantForOption?.availableForSale ?? false;

                    return (
                      <TouchableOpacity
                        key={val}
                        onPress={() => handleOptionSelect(name, val)}
                        style={[
                          styles.optionChip,
                          isSelected && styles.optionChipSelected,
                          !available && styles.optionChipUnavailable,
                        ]}
                      >
                        <Text style={[
                          styles.optionChipText,
                          isSelected && styles.optionChipTextSelected,
                          !available && styles.optionChipTextUnavailable,
                        ]}>
                          {val}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Description */}
          {cleanDesc.length > 0 && (
            <View style={styles.descSection}>
              <Text style={styles.descTitle}>ABOUT THIS PRODUCT</Text>
              <Text style={styles.descText} numberOfLines={showFullDesc ? undefined : 4}>
                {cleanDesc}
              </Text>
              {cleanDesc.length > 200 && (
                <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                  <Text style={styles.readMore}>{showFullDesc ? 'Show less' : 'Read more'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {product.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Add to Cart */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom || Spacing.lg }]}>
        <View style={styles.stickyPrice}>
          {isOnSale && selectedVariant?.compareAtPrice && (
            <Text style={styles.stickyOldPrice}>
              {formatPrice(selectedVariant.compareAtPrice.amount)}
            </Text>
          )}
          <Text style={styles.stickyPriceText}>
            {formatPrice(selectedVariant?.price.amount ?? '0', selectedVariant?.price.currencyCode)}
          </Text>
        </View>
        <Button
          label={selectedVariant?.availableForSale ? 'Add to Cart' : 'Out of Stock'}
          onPress={handleAddToCart}
          loading={isAdding}
          disabled={!selectedVariant?.availableForSale}
          style={styles.addToCartBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },

  backBtn: {
    position: 'absolute', left: Spacing.xl, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },
  backBtnText: { fontSize: 18, color: Colors.black },
  cartBtn: {
    position: 'absolute', right: Spacing.xl, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadows.card,
  },
  cartBtnText: { fontSize: 18, color: Colors.black },

  galleryWrap: { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: Colors.offWhite },
  galleryImage: { width: SCREEN_WIDTH, aspectRatio: 1 },
  galleryPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  galleryLL: {
    fontFamily: 'InterTight-Bold', fontSize: 80, color: Colors.mid, letterSpacing: -4,
  },
  dots: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignSelf: 'center', gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
  dotActive: { backgroundColor: Colors.black, width: 14 },

  body: { padding: Spacing.xl },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  collectionLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2,
  },
  title: {
    fontFamily: 'InterTight-Bold', fontSize: 22, color: Colors.black, letterSpacing: -0.3, lineHeight: 28,
  },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  comparePrice: {
    fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.light, textDecorationLine: 'line-through',
  },
  price: { fontFamily: 'InterTight-Bold', fontSize: 22, color: Colors.black, letterSpacing: -0.3 },

  availRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xl },
  availDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
  availDotOut: { backgroundColor: Colors.light },
  availText: { ...Typography.bodySmall, color: Colors.dark },

  optionGroup: { marginBottom: Spacing.xl },
  optionLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2, marginBottom: 10,
  },
  optionValues: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm,
    borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  optionChipSelected: { backgroundColor: Colors.black, borderColor: Colors.black },
  optionChipUnavailable: { opacity: 0.35 },
  optionChipText: {
    fontFamily: 'InterTight-Medium', fontSize: 12, color: Colors.dark, letterSpacing: 0.05,
  },
  optionChipTextSelected: { color: Colors.white },
  optionChipTextUnavailable: { textDecorationLine: 'line-through' },

  descSection: { marginBottom: Spacing.xl },
  descTitle: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2, marginBottom: 10,
  },
  descText: { ...Typography.body, color: Colors.dark, lineHeight: 22 },
  readMore: { ...Typography.bodySmall, color: Colors.black, marginTop: 6, textDecorationLine: 'underline' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.sm, borderWidth: 0.5, borderColor: Colors.border,
  },
  tagText: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.light },

  stickyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopWidth: 0.5, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
  },
  stickyPrice: { gap: 1 },
  stickyOldPrice: {
    fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.light, textDecorationLine: 'line-through',
  },
  stickyPriceText: { fontFamily: 'InterTight-Bold', fontSize: 18, color: Colors.black, letterSpacing: -0.2 },
  addToCartBtn: { flex: 1 },
});
