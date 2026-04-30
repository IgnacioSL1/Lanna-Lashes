/**
 * CoursePlayerScreen
 * Full-screen video player using react-native-video (Mux URLs)
 * Tracks progress, marks lessons complete, shows curriculum sidebar
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import Video, { OnProgressData, OnLoadData } from 'react-native-video';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CourseAPI, Course, Lesson } from '../services/api';
import { Colors, Typography, Spacing, Radius } from '../theme';

const { width: W, height: H } = Dimensions.get('window');
const PROGRESS_SYNC_INTERVAL = 15; // seconds between API calls

export default function CoursePlayerScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();

  const [course, setCourse]             = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [paused, setPaused]             = useState(false);
  const [duration, setDuration]         = useState(0);
  const [currentTime, setCurrentTime]   = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSidebar, setShowSidebar]   = useState(false);
  const [completed, setCompleted]       = useState<Set<string>>(new Set());

  const videoRef          = useRef<any>(null);
  const controlsTimer     = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedTime    = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await CourseAPI.get(route.params.courseSlug);
        setCourse(data);

        // Find starting lesson
        const allLessons = data.modules.flatMap(m => m.lessons);
        const startId    = route.params.lessonId;
        const startLesson = startId
          ? allLessons.find(l => l.id === startId) ?? allLessons[0]
          : allLessons.find(l => !l.isCompleted) ?? allLessons[0];

        setCurrentLesson(startLesson ?? null);

        // Build completed set
        const doneIds = new Set(allLessons.filter(l => l.isCompleted).map(l => l.id));
        setCompleted(doneIds);
      } catch (e: any) {
        Alert.alert('Error', e.message);
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Auto-hide controls after 3s
  const resetControlsTimer = useCallback(() => {
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    setShowControls(true);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleProgress = useCallback(({ currentTime: ct }: OnProgressData) => {
    setCurrentTime(ct);
    // Sync progress to backend every PROGRESS_SYNC_INTERVAL seconds
    if (currentLesson && ct - lastSyncedTime.current >= PROGRESS_SYNC_INTERVAL) {
      lastSyncedTime.current = ct;
      CourseAPI.trackProgress(currentLesson.id, Math.floor(ct)).catch(() => {});
    }
  }, [currentLesson]);

  const handleLoad = ({ duration: d }: OnLoadData) => setDuration(d);

  const handleEnd = useCallback(async () => {
    if (!currentLesson) return;
    // Mark complete
    try {
      await CourseAPI.markComplete(currentLesson.id);
      setCompleted(prev => new Set([...prev, currentLesson.id]));
    } catch { /* silent */ }

    // Auto-advance to next lesson
    const allLessons = course?.modules.flatMap(m => m.lessons) ?? [];
    const idx = allLessons.findIndex(l => l.id === currentLesson.id);
    const next = allLessons[idx + 1];
    if (next) {
      setCurrentLesson(next);
      setCurrentTime(0);
      lastSyncedTime.current = 0;
      setPaused(false);
    }
  }, [currentLesson, course]);

  const seek = (delta: number) => {
    const target = Math.max(0, Math.min(currentTime + delta, duration));
    videoRef.current?.seek(target);
    resetControlsTimer();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const allLessons = course?.modules.flatMap(m => m.lessons) ?? [];
  const currentIdx = allLessons.findIndex(l => l.id === currentLesson?.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allLessons.length - 1;

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => { setPaused(!paused); resetControlsTimer(); }}
        style={styles.videoWrap}
      >
        {currentLesson?.videoUrl ? (
          <Video
            ref={videoRef}
            source={{ uri: currentLesson.videoUrl }}
            style={styles.video}
            resizeMode="contain"
            paused={paused}
            onProgress={handleProgress}
            onLoad={handleLoad}
            onEnd={handleEnd}
            progressUpdateInterval={1000}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderLL}>LL</Text>
          </View>
        )}

        {/* Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.lessonTitle} numberOfLines={1}>
                {currentLesson?.title}
              </Text>
              <TouchableOpacity onPress={() => setShowSidebar(!showSidebar)} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>☰</Text>
              </TouchableOpacity>
            </View>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => seek(-10)} style={styles.seekBtn}>
                <Text style={styles.seekBtnText}>−10s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setPaused(!paused); resetControlsTimer(); }}
                style={styles.playPauseBtn}
              >
                <Text style={styles.playPauseBtnText}>{paused ? '▶' : '⏸'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seek(10)} style={styles.seekBtn}>
                <Text style={styles.seekBtnText}>+10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom bar */}
            <View style={styles.bottomBar}>
              {/* Progress bar */}
              <View style={styles.progressWrap}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressFill,
                    { width: duration > 0 ? `${(currentTime / duration) * 100}%` as any : '0%' }
                  ]} />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Prev / Next */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  onPress={() => hasPrev && setCurrentLesson(allLessons[currentIdx - 1])}
                  disabled={!hasPrev}
                  style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
                >
                  <Text style={styles.navBtnText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={styles.lessonCount}>
                  {currentIdx + 1} / {allLessons.length}
                </Text>
                <TouchableOpacity
                  onPress={() => hasNext && setCurrentLesson(allLessons[currentIdx + 1])}
                  disabled={!hasNext}
                  style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
                >
                  <Text style={styles.navBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Curriculum Sidebar */}
      {showSidebar && (
        <ScrollView style={styles.sidebar} showsVerticalScrollIndicator={false}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>CURRICULUM</Text>
            <TouchableOpacity onPress={() => setShowSidebar(false)}>
              <Text style={styles.sidebarClose}>✕</Text>
            </TouchableOpacity>
          </View>
          {course?.modules.map(mod => (
            <View key={mod.id} style={styles.sidebarModule}>
              <Text style={styles.sidebarModuleName}>{mod.title}</Text>
              {mod.lessons.map((lesson, i) => (
                <TouchableOpacity
                  key={lesson.id}
                  onPress={() => {
                    setCurrentLesson(lesson);
                    setCurrentTime(0);
                    lastSyncedTime.current = 0;
                    setPaused(false);
                    setShowSidebar(false);
                  }}
                  style={[
                    styles.sidebarLesson,
                    lesson.id === currentLesson?.id && styles.sidebarLessonActive,
                  ]}
                >
                  <View style={styles.sidebarLessonNum}>
                    {completed.has(lesson.id)
                      ? <Text style={styles.sidebarCheck}>✓</Text>
                      : <Text style={styles.sidebarNumText}>{i + 1}</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sidebarLessonTitle} numberOfLines={1}>{lesson.title}</Text>
                    <Text style={styles.sidebarLessonDur}>{lesson.durationMinutes} min</Text>
                  </View>
                  {lesson.id === currentLesson?.id && (
                    <Text style={{ color: Colors.white, fontSize: 10 }}>▶</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },

  videoWrap: { width: W, height: H * 0.56, backgroundColor: '#000' },
  video: { width: W, height: H * 0.56 },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  videoPlaceholderLL: {
    fontFamily: 'InterTight-Bold', fontSize: 80,
    color: 'rgba(255,255,255,0.06)', letterSpacing: -4,
  },

  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md, gap: Spacing.md,
  },
  controlBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  controlBtnText: { color: Colors.white, fontSize: 18 },
  lessonTitle: {
    flex: 1, fontFamily: 'InterTight-SemiBold', fontSize: 13,
    color: Colors.white, textAlign: 'center',
  },

  centerControls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xxl,
  },
  seekBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  seekBtnText: { fontFamily: 'InterTight-SemiBold', fontSize: 11, color: Colors.white },
  playPauseBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  playPauseBtnText: { color: Colors.white, fontSize: 22, marginLeft: 2 },

  bottomBar: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  timeText: { fontFamily: 'InterTight-Medium', fontSize: 11, color: 'rgba(255,255,255,0.7)', minWidth: 36 },
  progressTrack: {
    flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: Colors.white, borderRadius: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { fontFamily: 'InterTight-Medium', fontSize: 11, color: Colors.white },
  lessonCount: { fontFamily: 'InterTight-Medium', fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  // Sidebar
  sidebar: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: W * 0.72, backgroundColor: Colors.dark,
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarTitle: {
    fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.white, letterSpacing: 0.2,
  },
  sidebarClose: { color: Colors.mid, fontSize: 14 },
  sidebarModule: { paddingTop: Spacing.md },
  sidebarModuleName: {
    fontFamily: 'InterTight-SemiBold', fontSize: 11, color: Colors.mid,
    paddingHorizontal: Spacing.lg, marginBottom: 6,
  },
  sidebarLesson: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
  },
  sidebarLessonActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  sidebarLessonNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  sidebarCheck: { color: Colors.white, fontSize: 10 },
  sidebarNumText: { fontFamily: 'InterTight-Medium', fontSize: 9, color: Colors.mid },
  sidebarLessonTitle: { fontFamily: 'InterTight-Medium', fontSize: 12, color: Colors.white, marginBottom: 1 },
  sidebarLessonDur: { fontFamily: 'Inter-Regular', fontSize: 10, color: Colors.light },
});
