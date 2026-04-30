/**
 * CourseCheckoutScreen
 * Stripe payment sheet for purchasing a course.
 * Uses @stripe/stripe-react-native's PaymentSheet for PCI-compliant card collection.
 *
 * Flow:
 * 1. App calls backend → /payments/create-intent (returns clientSecret)
 * 2. Stripe PaymentSheet initialises with that secret
 * 3. User confirms payment on-device (3DS handled automatically)
 * 4. On success → backend creates Enrollment, fires HubSpot event
 * 5. App navigates to CoursePlayer
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { apiPost } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function CourseCheckoutScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuthStore();

  const { course } = route.params;

  const [isReady, setIsReady]       = useState(false);
  const [isLoading, setIsLoading]   = useState(true);
  const [isPaying, setIsPaying]     = useState(false);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    setIsLoading(true);
    try {
      // 1. Ask backend to create a Stripe PaymentIntent
      const { clientSecret, ephemeralKey, customerId } = await apiPost<{
        clientSecret: string;
        ephemeralKey: string;
        customerId: string;
      }>('/payments/create-intent', {
        courseId: course.id,
        amount: Math.round(course.price * 100), // cents
        currency: 'usd',
      });

      // 2. Initialise Stripe's PaymentSheet
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Lanna Lashes',
        customerId,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          email: user?.email ?? '',
        },
        appearance: {
          colors: {
            primary: Colors.black,
            background: Colors.white,
            componentBackground: Colors.offWhite,
            componentBorder: Colors.border,
            componentDivider: Colors.border,
            primaryText: Colors.black,
            secondaryText: Colors.dark,
            componentText: Colors.black,
            placeholderText: Colors.light,
          },
          shapes: {
            borderRadius: Radius.md,
            borderWidth: 0.5,
          },
          primaryButton: {
            colors: { background: Colors.black, text: Colors.white },
          },
        },
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },
      });

      if (error) throw new Error(error.message);
      setIsReady(true);
    } catch (e: any) {
      Alert.alert('Payment setup failed', e.message, [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isReady) return;
    setIsPaying(true);
    try {
      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment failed', error.message);
        }
        return;
      }

      // Payment successful — backend webhook will create enrollment
      // Navigate to course player
      Alert.alert(
        'Enrolled!',
        `You now have full access to ${course.title}. Let\'s start learning!`,
        [{
          text: 'Start Course',
          onPress: () => {
            navigation.reset({
              index: 1,
              routes: [
                { name: 'AcademyHome' },
                { name: 'CoursePlayer', params: { courseSlug: course.slug } },
              ],
            });
          },
        }]
      );
    } finally {
      setIsPaying(false);
    }
  };

  const discountSavings = course.compareAtPrice && course.compareAtPrice > course.price
    ? course.compareAtPrice - course.price
    : null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <View style={styles.lockBadge}>
          <Text style={{ fontSize: 11 }}>🔒</Text>
          <Text style={styles.lockText}>SECURE</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.black} />
          <Text style={styles.loaderText}>Setting up payment...</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {/* Course Summary Card */}
          <View style={styles.courseCard}>
            <View style={[styles.courseThumb, {
              backgroundColor: course.level === 'beginner' ? Colors.black
                : course.level === 'intermediate' ? Colors.dark : '#5a5857'
            }]}>
              {course.thumbnail
                ? <Image source={{ uri: course.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <Text style={styles.courseThumbLL}>LL</Text>
              }
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.courseCategory}>{course.category.toUpperCase()}</Text>
              <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
              <Text style={styles.courseMeta}>
                {course.totalLessons} lessons · {Math.round(course.totalDurationMinutes / 60)}h
              </Text>
            </View>
          </View>

          {/* What's Included */}
          <View style={styles.includesCard}>
            <Text style={styles.includesTitle}>WHAT'S INCLUDED</Text>
            {[
              `${course.totalLessons} HD video lessons`,
              'Lifetime access — watch anytime',
              'Certificate of completion',
              'Access on iOS & Android',
              'Community Q&A access',
            ].map(item => (
              <View key={item} style={styles.includesRow}>
                <Text style={styles.includesCheck}>✓</Text>
                <Text style={styles.includesText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Order Summary */}
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>ORDER SUMMARY</Text>
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>{course.title}</Text>
              <Text style={styles.orderValue}>${course.compareAtPrice ?? course.price}</Text>
            </View>
            {discountSavings && (
              <View style={styles.orderRow}>
                <Text style={styles.discountLabel}>Discount</Text>
                <Text style={styles.discountValue}>−${discountSavings}</Text>
              </View>
            )}
            <View style={[styles.orderRow, styles.orderTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${course.price}</Text>
            </View>
          </View>

          <Text style={styles.guarantee}>
            🛡  30-day money-back guarantee. Not satisfied? Get a full refund, no questions asked.
          </Text>
        </View>
      )}

      {/* CTA */}
      {!isLoading && (
        <View style={styles.footer}>
          <Button
            label={`Enroll for $${course.price}`}
            onPress={handlePurchase}
            loading={isPaying}
            disabled={!isReady}
            fullWidth
          />
          <Text style={styles.footerNote}>
            Secure payment via Stripe. Your card details are never stored on our servers.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loaderText: { ...Typography.body, color: Colors.light },

  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { padding: 4, marginRight: Spacing.md },
  backBtnText: { fontSize: 18, color: Colors.black },
  headerTitle: {
    flex: 1, fontFamily: 'InterTight-Bold', fontSize: 13, color: Colors.black, letterSpacing: 0.18,
  },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockText: { fontFamily: 'InterTight-Medium', fontSize: 9, color: Colors.light, letterSpacing: 0.1 },

  body: { flex: 1, padding: Spacing.xl, gap: Spacing.md },

  courseCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, overflow: 'hidden', ...Shadows.card,
  },
  courseThumb: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  courseThumbLL: { fontFamily: 'InterTight-Bold', fontSize: 24, color: 'rgba(255,255,255,0.15)', letterSpacing: -1 },
  courseInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  courseCategory: { fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2, marginBottom: 3 },
  courseTitle: { fontFamily: 'InterTight-Bold', fontSize: 13, color: Colors.black, lineHeight: 18, marginBottom: 3 },
  courseMeta: { ...Typography.bodySmall, color: Colors.light },

  includesCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md + 2, ...Shadows.card,
  },
  includesTitle: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2, marginBottom: 10,
  },
  includesRow: { flexDirection: 'row', gap: Spacing.sm + 2, marginBottom: 7, alignItems: 'flex-start' },
  includesCheck: { fontFamily: 'InterTight-Bold', fontSize: 12, color: Colors.black, lineHeight: 20 },
  includesText: { ...Typography.body, fontSize: 13, color: Colors.dark, lineHeight: 20 },

  orderCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md + 2, ...Shadows.card,
  },
  orderTitle: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2, marginBottom: 10,
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.dark, flex: 1, paddingRight: 8 },
  orderValue: { fontFamily: 'InterTight-Medium', fontSize: 13, color: Colors.dark },
  discountLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#16a34a' },
  discountValue: { fontFamily: 'InterTight-Medium', fontSize: 13, color: '#16a34a' },
  orderTotal: {
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    paddingTop: 10, marginBottom: 0, marginTop: 2,
  },
  totalLabel: { fontFamily: 'InterTight-Bold', fontSize: 15, color: Colors.black },
  totalValue: { fontFamily: 'InterTight-Bold', fontSize: 18, color: Colors.black },

  guarantee: { ...Typography.bodySmall, color: Colors.dark, lineHeight: 18, textAlign: 'center' },

  footer: {
    backgroundColor: Colors.white, padding: Spacing.xl,
    borderTopWidth: 0.5, borderTopColor: Colors.border, gap: Spacing.md,
  },
  footerNote: {
    ...Typography.bodySmall, color: Colors.light, textAlign: 'center', lineHeight: 16,
  },
});
