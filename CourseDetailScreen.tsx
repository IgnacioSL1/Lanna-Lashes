/**
 * CourseDetailScreen
 * Full course overview: thumbnail, curriculum, instructor, reviews, enroll CTA
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseAPI, Course, Enrollment } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button, Badge } from '../components';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

export default function CourseDetailScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [course, setCourse]         = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, enroll] = await Promise.all([
          CourseAPI.get(route.params.slug),
          isAuthenticated()
            ? CourseAPI.getEnrollment(route.params.slug).catch(() => null)
            : Promise.resolve(null),
        ]);
        setCourse(data);
        setEnrollment(enroll);
        // Auto-expand first module
        if (data.modules[0]) setExpandedModule(data.modules[0].id);
      } catch (e: any) {
        Alert.alert('Error', e.message);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleEnroll = () => {
    if (!isAuthenticated()) {
      Alert.alert('Sign in required', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    if (enrollment) {
      navigation.navigate('CoursePlayer', { courseSlug: course?.slug });
      return;
    }
    navigation.navigate('CourseCheckout', { course });
  };

  const levelColor = (level: string) => {
    if (level === 'beginner') return Colors.black;
    if (level === 'intermediate') return Colors.dark;
    return '#5a5857';
  };

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.black} size="large" /></View>;
  }
  if (!course) return null;

  const totalHours = Math.round(course.totalDurationMinutes / 60 * 10) / 10;
  const isEnrolled = !!enrollment;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Back */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Thumbnail */}
        <View style={[styles.hero, { backgroundColor: levelColor(course.level) }]}>
          {course.thumbnail
            ? <Image source={{ uri: course.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <Text style={styles.heroLL}>LL</Text>
          }
          <View style={styles.heroOverlay}>
            <TouchableOpacity
              onPress={() => isEnrolled && navigation.navigate('CoursePlayer', { courseSlug: course.slug })}
              style={styles.playBtn}
            >
              <Text style={{ color: Colors.white, fontSize: 18, marginLeft: 3 }}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.heroLevelBadge}>
              <Text style={styles.heroLevelText}>{course.level.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Title + Category */}
          <Text style={styles.category}>{course.category.toUpperCase()}</Text>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.shortDesc}>{course.shortDescription}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{course.totalLessons}</Text>
              <Text style={styles.statLabel}>LESSONS</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statNum}>{totalHours}h</Text>
              <Text style={styles.statLabel}>CONTENT</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statNum}>⭐ {course.rating}</Text>
              <Text style={styles.statLabel}>{course.ratingCount} REVIEWS</Text>
            </View>
            <View style={[styles.statItem, styles.statBorder]}>
              <Text style={styles.statNum}>{course.enrolledCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>STUDENTS</Text>
            </View>
          </View>

          {/* Progress bar if enrolled */}
          {isEnrolled && enrollment && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>YOUR PROGRESS</Text>
                <Text style={styles.progressPct}>{enrollment.progressPercent}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${enrollment.progressPercent}%` as any }]} />
              </View>
              {enrollment.completedAt && (
                <Text style={styles.completedText}>
                  ✓ Completed {new Date(enrollment.completedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}

          {/* Instructor */}
          <View style={styles.instructorCard}>
            <View style={styles.instructorAvatar}>
              {course.instructor.avatar
                ? <Image source={{ uri: course.instructor.avatar }} style={styles.instructorAvatarImg} />
                : <Text style={styles.instructorAvatarText}>
                    {course.instructor.name.split(' ').map(n => n[0]).join('')}
                  </Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instructorLabel}>INSTRUCTOR</Text>
              <Text style={styles.instructorName}>{course.instructor.name}</Text>
              <Text style={styles.instructorBio} numberOfLines={2}>{course.instructor.bio}</Text>
            </View>
          </View>

          {/* Curriculum */}
          <Text style={styles.sectionTitle}>CURRICULUM</Text>
          {course.modules.map((mod, modIdx) => (
            <View key={mod.id} style={styles.moduleCard}>
              <TouchableOpacity
                onPress={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                style={styles.moduleHeader}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.moduleName}>{mod.title}</Text>
                  <Text style={styles.moduleMeta}>{mod.lessons.length} lessons</Text>
                </View>
                <Text style={styles.moduleChevron}>
                  {expandedModule === mod.id ? '↑' : '↓'}
                </Text>
              </TouchableOpacity>

              {expandedModule === mod.id && (
                <View style={styles.lessonsList}>
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <TouchableOpacity
                      key={lesson.id}
                      style={styles.lessonRow}
                      onPress={() => {
                        if (isEnrolled || lesson.isPreview) {
                          navigation.navigate('CoursePlayer', {
                            courseSlug: course.slug,
                            lessonId: lesson.id,
                          });
                        } else {
                          handleEnroll();
                        }
                      }}
                    >
                      <View style={styles.lessonNum}>
                        {lesson.isCompleted
                          ? <Text style={styles.lessonCheck}>✓</Text>
                          : <Text style={styles.lessonNumText}>{lessonIdx + 1}</Text>
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                        <Text style={styles.lessonDuration}>{lesson.durationMinutes} min</Text>
                      </View>
                      {lesson.isPreview && !isEnrolled && (
                        <View style={styles.previewBadge}>
                          <Text style={styles.previewBadgeText}>FREE</Text>
                        </View>
                      )}
                      {!isEnrolled && !lesson.isPreview && (
                        <Text style={styles.lockIcon}>🔒</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Tags */}
          {course.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {course.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom || Spacing.lg }]}>
        <View>
          <Text style={styles.stickyPrice}>${course.price}</Text>
          {course.compareAtPrice && course.compareAtPrice > course.price && (
            <Text style={styles.stickyOldPrice}>${course.compareAtPrice}</Text>
          )}
        </View>
        <Button
          label={isEnrolled ? (enrollment?.progressPercent ?? 0) > 0 ? 'Continue Learning' : 'Start Course' : 'Enroll Now'}
          onPress={handleEnroll}
          style={styles.enrollBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute', left: Spacing.xl, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 18, color: Colors.white },

  hero: { height: 220, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroLL: { fontFamily: 'InterTight-Bold', fontSize: 80, color: 'rgba(255,255,255,0.07)', letterSpacing: -4 },
  heroOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroMeta: { position: 'absolute', top: 12, right: 12 },
  heroLevelBadge: {
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm,
  },
  heroLevelText: { fontFamily: 'InterTight-SemiBold', fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.2 },

  body: { padding: Spacing.xl },
  category: { fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2, marginBottom: 6 },
  title: { fontFamily: 'InterTight-Bold', fontSize: 22, color: Colors.black, letterSpacing: -0.3, marginBottom: 8, lineHeight: 28 },
  shortDesc: { ...Typography.body, color: Colors.dark, marginBottom: Spacing.xl },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border,
    marginBottom: Spacing.xl, ...Shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderLeftWidth: 0.5, borderColor: Colors.border },
  statNum: { fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.black, marginBottom: 2 },
  statLabel: { fontFamily: 'InterTight-Medium', fontSize: 8, color: Colors.light, letterSpacing: 0.1 },

  progressSection: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md + 2, marginBottom: Spacing.xl, ...Shadows.card,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2 },
  progressPct: { fontFamily: 'InterTight-Bold', fontSize: 13, color: Colors.black },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: Colors.black, borderRadius: 2 },
  completedText: { ...Typography.bodySmall, color: Colors.dark, marginTop: 8 },

  instructorCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md + 2, marginBottom: Spacing.xl, ...Shadows.card,
  },
  instructorAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  instructorAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  instructorAvatarText: { fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.white },
  instructorLabel: { fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2 },
  instructorName: { fontFamily: 'InterTight-Bold', fontSize: 14, color: Colors.black, marginBottom: 2 },
  instructorBio: { ...Typography.bodySmall, color: Colors.dark },

  sectionTitle: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light,
    letterSpacing: 0.2, marginBottom: Spacing.md,
  },
  moduleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    marginBottom: Spacing.sm + 2, overflow: 'hidden', ...Shadows.card,
  },
  moduleHeader: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md + 2,
  },
  moduleName: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black, marginBottom: 2 },
  moduleMeta: { ...Typography.bodySmall, color: Colors.light },
  moduleChevron: { fontSize: 14, color: Colors.light },
  lessonsList: { borderTopWidth: 0.5, borderTopColor: Colors.border },
  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.md + 2, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  lessonNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.offWhite, borderWidth: 0.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  lessonCheck: { fontSize: 11, color: Colors.black },
  lessonNumText: { fontFamily: 'InterTight-Medium', fontSize: 10, color: Colors.dark },
  lessonTitle: { fontFamily: 'InterTight-Medium', fontSize: 12, color: Colors.black, marginBottom: 1 },
  lessonDuration: { ...Typography.bodySmall, color: Colors.light },
  previewBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm,
    backgroundColor: Colors.offWhite, borderWidth: 0.5, borderColor: Colors.border,
  },
  previewBadgeText: { fontFamily: 'InterTight-SemiBold', fontSize: 8, color: Colors.dark, letterSpacing: 0.1 },
  lockIcon: { fontSize: 11 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xl },
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
  stickyPrice: { fontFamily: 'InterTight-Bold', fontSize: 22, color: Colors.black, letterSpacing: -0.3 },
  stickyOldPrice: {
    fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.light,
    textDecorationLine: 'line-through', marginTop: -2,
  },
  enrollBtn: { flex: 1 },
  borderLight: Colors.borderLight,
});
