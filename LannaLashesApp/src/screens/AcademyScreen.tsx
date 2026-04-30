/**
 * AcademyScreen — Lanna Lashes course catalogue
 * Fetches from custom backend, Stripe for payments
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  StyleSheet, Alert, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CourseAPI, Course } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { CourseCard } from '../components';
import { Colors, Typography, Spacing, Radius } from '../theme';

const FILTERS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Business'];

export default function AcademyScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuthStore();

  const [courses, setCourses]         = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, number>>({});
  const [filter, setFilter]           = useState('All');
  const [isLoading, setIsLoading]     = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true); else setIsLoading(true);
    try {
      const level = filter === 'All' || filter === 'Business' ? undefined : filter.toLowerCase() as any;
      const category = filter === 'Business' ? 'business' : undefined;
      const [data, myEnrollments] = await Promise.all([
        CourseAPI.list({ level, category }),
        isAuthenticated() ? CourseAPI.myEnrollments() : Promise.resolve([]),
      ]);
      setCourses(data);
      const map: Record<string, number> = {};
      myEnrollments.forEach(e => { map[e.courseId] = e.progressPercent; });
      setEnrollments(map);
    } catch (e: any) {
      Alert.alert('Could not load courses', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, isAuthenticated]);

  useEffect(() => { load(); }, [filter]);

  const handleEnroll = (course: Course) => {
    if (!isAuthenticated()) {
      Alert.alert(
        'Sign in required',
        'Create a free account to enroll in courses.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }
    if (enrollments[course.id] !== undefined) {
      navigation.navigate('CoursePlayer', { courseSlug: course.slug });
      return;
    }
    navigation.navigate('CourseCheckout', { course });
  };

  const filteredCourses = courses; // filtering already done via API

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBg}>
          <Text style={styles.headerBgText}>LL</Text>
        </View>
        <Text style={styles.headerLabel}>LANNA ACADEMY</Text>
        <Text style={styles.headerTitle}>Master the Art{'\n'}of Lashes</Text>
        <Text style={styles.headerSub}>Professional techniques, every level</Text>
      </View>

      {/* Filter row */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.black} /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={Colors.black} />
          }
        >
          {filteredCourses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No courses in this category yet</Text>
            </View>
          ) : (
            filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                title={course.title}
                category={course.category}
                level={course.level}
                price={`$${course.price}`}
                totalLessons={course.totalLessons}
                durationHours={Math.round(course.totalDurationMinutes / 60)}
                enrolledCount={course.enrolledCount}
                thumbnailUrl={course.thumbnail}
                progress={enrollments[course.id]}
                onPress={() => navigation.navigate('CourseDetail', { slug: course.slug })}
                onEnroll={() => handleEnroll(course)}
              />
            ))
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
    backgroundColor: Colors.black, padding: Spacing.xxl,
    paddingTop: Spacing.xxl + 4, overflow: 'hidden',
  },
  headerBg: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  headerBgText: {
    fontFamily: 'InterTight-Bold', fontSize: 80,
    color: 'rgba(255,255,255,0.05)', letterSpacing: -4,
  },
  headerLabel: { ...Typography.labelSm, color: Colors.mid, letterSpacing: 0.28, marginBottom: 8 },
  headerTitle: {
    fontFamily: 'InterTight-Bold', fontSize: 26,
    color: Colors.white, letterSpacing: -0.3, lineHeight: 32, marginBottom: 4,
  },
  headerSub: { ...Typography.bodySmall, color: Colors.light },

  filterWrap: {
    backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  filterScroll: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm,
    borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { fontFamily: 'InterTight-SemiBold', fontSize: 10, color: Colors.light, letterSpacing: 0.12 },
  chipTextActive: { color: Colors.white },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  list: { padding: Spacing.xl, paddingBottom: 0 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { ...Typography.body, color: Colors.light },
  border: Colors.border,
});
