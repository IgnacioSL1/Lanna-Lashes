/**
 * ProfileScreen — User dashboard
 * Shows enrolled courses, order history, account settings
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { CourseAPI, Enrollment } from '../services/api';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

interface MenuItem {
  icon: string;
  label: string;
  sub: string;
  onPress: () => void;
  section: 'learning' | 'shop' | 'account';
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut, isAuthenticated } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading]     = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setIsLoading(true);
      CourseAPI.myEnrollments()
        .then(setEnrollments)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated()]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  // ── Not signed in ────────────────────────────────────────────────────────
  if (!isAuthenticated()) {
    return (
      <View style={styles.container}>
        <View style={styles.cover}>
          <Text style={styles.coverLL}>LL</Text>
        </View>
        <View style={styles.guestWrap}>
          <Text style={styles.guestTitle}>Join the Community</Text>
          <Text style={styles.guestSub}>
            Sign in to access your courses,{'\n'}track your progress, and shop faster.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth', { mode: 'signin' })}
            style={styles.guestBtn}
          >
            <Text style={styles.guestBtnText}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Auth', { mode: 'signup' })}>
            <Text style={styles.guestLink}>Create a free account →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Signed in ─────────────────────────────────────────────────────────────
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const completedCount = enrollments.filter(e => e.completedAt).length;
  const certCount = enrollments.filter(e => e.certificateUrl).length;

  const menuItems: MenuItem[] = [
    {
      section: 'learning',
      icon: '◉',
      label: 'My Courses',
      sub: `${enrollments.length} enrolled · ${enrollments.filter(e => !e.completedAt && e.progressPercent > 0).length} in progress`,
      onPress: () => navigation.navigate('MyCourses'),
    },
    {
      section: 'learning',
      icon: '✦',
      label: 'Certificates',
      sub: `${certCount} earned`,
      onPress: () => navigation.navigate('Certificates'),
    },
    {
      section: 'shop',
      icon: '◫',
      label: 'Order History',
      sub: 'Track and manage your orders',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      section: 'shop',
      icon: '▣',
      label: 'Payment Methods',
      sub: 'Saved cards and billing',
      onPress: () => navigation.navigate('PaymentMethods'),
    },
    {
      section: 'account',
      icon: '◌',
      label: 'Edit Profile',
      sub: 'Name, photo, bio',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      section: 'account',
      icon: '◉',
      label: 'Notifications',
      sub: 'Manage your alerts',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      section: 'account',
      icon: '◻',
      label: 'Privacy & Security',
      sub: 'Password, data settings',
      onPress: () => navigation.navigate('Privacy'),
    },
  ];

  const sections = [
    { key: 'learning', label: 'MY LEARNING' },
    { key: 'shop',     label: 'MY SHOP' },
    { key: 'account',  label: 'ACCOUNT' },
  ] as const;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cover */}
      <View style={styles.cover}>
        <Text style={styles.coverLL}>LL</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {user?.avatar
          ? <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
          : <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        }
      </View>

      <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.handle}>@{user?.email?.split('@')[0]} · {user?.isPro ? 'Pro Member' : 'Member'}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{enrollments.length}</Text>
          <Text style={styles.statLabel}>COURSES</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statNum}>{completedCount}</Text>
          <Text style={styles.statLabel}>COMPLETED</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{certCount}</Text>
          <Text style={styles.statLabel}>CERTIFICATES</Text>
        </View>
      </View>

      {/* In-progress course widget */}
      {enrollments.some(e => e.progressPercent > 0 && !e.completedAt) && (
        <View style={styles.inProgressWrap}>
          <Text style={styles.inProgressLabel}>CONTINUE LEARNING</Text>
          {enrollments
            .filter(e => e.progressPercent > 0 && !e.completedAt)
            .slice(0, 1)
            .map(e => (
              <TouchableOpacity
                key={e.id}
                style={styles.inProgressCard}
                onPress={() => navigation.navigate('CoursePlayer', { courseId: e.courseId })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.inProgressCourseTitle} numberOfLines={1}>
                    Continue course
                  </Text>
                  <Text style={styles.inProgressSub}>{e.progressPercent}% complete</Text>
                  <View style={styles.progressBarWrap}>
                    <View style={[styles.progressBarFill, { width: `${e.progressPercent}%` as any }]} />
                  </View>
                </View>
                <Text style={styles.inProgressArrow}>›</Text>
              </TouchableOpacity>
            ))
          }
        </View>
      )}

      {/* Menu Sections */}
      {sections.map(({ key, label }) => (
        <View key={key} style={styles.section}>
          <Text style={styles.sectionLabel}>{label}</Text>
          {menuItems.filter(m => m.section === key).map(item => (
            <TouchableOpacity key={item.label} onPress={item.onPress} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuItemName}>{item.label}</Text>
                <Text style={styles.menuItemSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Sign out */}
      <View style={{ paddingHorizontal: Spacing.xl, paddingBottom: 40 }}>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },

  cover: {
    height: 90, backgroundColor: Colors.black,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'flex-end',
  },
  coverLL: {
    fontFamily: 'InterTight-Bold', fontSize: 90,
    color: 'rgba(255,255,255,0.06)', letterSpacing: -4, marginRight: 8,
  },

  avatarWrap: { paddingHorizontal: Spacing.xl, marginTop: -28, marginBottom: 12 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.black,
    borderWidth: 3, borderColor: Colors.offWhite,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: Colors.offWhite },
  avatarText: { fontFamily: 'InterTight-Bold', fontSize: 16, color: Colors.white },

  name: {
    fontFamily: 'InterTight-Bold', fontSize: 20, color: Colors.black,
    paddingHorizontal: Spacing.xl, letterSpacing: -0.2, marginBottom: 2,
  },
  handle: { ...Typography.bodySmall, color: Colors.light, paddingHorizontal: Spacing.xl, marginBottom: 16 },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.border,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: Colors.border },
  statNum: { fontFamily: 'InterTight-Bold', fontSize: 20, color: Colors.black, letterSpacing: -0.3 },
  statLabel: { fontFamily: 'InterTight-Medium', fontSize: 9, color: Colors.light, letterSpacing: 0.14, marginTop: 2 },

  inProgressWrap: { paddingHorizontal: Spacing.xl, marginBottom: 16 },
  inProgressLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light,
    letterSpacing: 0.22, marginBottom: 8,
  },
  inProgressCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md + 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    ...Shadows.card,
  },
  inProgressCourseTitle: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black, marginBottom: 2 },
  inProgressSub: { ...Typography.bodySmall, color: Colors.light, marginBottom: 8 },
  progressBarWrap: { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: 3, backgroundColor: Colors.black, borderRadius: 2 },
  inProgressArrow: { fontFamily: 'Inter-Regular', fontSize: 22, color: Colors.light },

  section: { paddingHorizontal: Spacing.xl, marginBottom: 16 },
  sectionLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light,
    letterSpacing: 0.22, marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: 13, backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, marginBottom: 6, ...Shadows.card,
  },
  menuIcon: {
    width: 34, height: 34, borderRadius: 6,
    backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center',
  },
  menuIconText: { color: Colors.white, fontSize: 14 },
  menuItemName: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black },
  menuItemSub: { ...Typography.bodySmall, color: Colors.light },
  menuArrow: { fontFamily: 'Inter-Regular', fontSize: 20, color: Colors.mid },

  signOutBtn: {
    borderWidth: 0.5, borderColor: Colors.border,
    paddingVertical: 13, borderRadius: Radius.md, alignItems: 'center',
  },
  signOutText: { fontFamily: 'InterTight-SemiBold', fontSize: 11, color: Colors.light, letterSpacing: 0.15 },

  // Guest
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.lg },
  guestTitle: { fontFamily: 'InterTight-Bold', fontSize: 24, color: Colors.black, letterSpacing: -0.3 },
  guestSub: { ...Typography.body, color: Colors.light, textAlign: 'center', lineHeight: 22 },
  guestBtn: {
    backgroundColor: Colors.black, paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: Radius.sm, marginTop: Spacing.sm,
  },
  guestBtnText: { fontFamily: 'InterTight-Bold', fontSize: 12, color: Colors.white, letterSpacing: 0.18 },
  guestLink: { ...Typography.body, color: Colors.light, textDecorationLine: 'underline' },
});
