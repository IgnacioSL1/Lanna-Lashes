/**
 * CommunityScreen — The Lanna Circle
 * Social feed with posts, tags, likes, comments
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, FlatList,
  StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CommunityAPI, Post } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { PostCard } from '../components';
import { Colors, Typography, Spacing, Radius } from '../theme';

const TAGS = ['All Posts', 'Questions', 'Inspo', 'My Work', 'Tips'];
const TAG_MAP: Record<string, string | undefined> = {
  'All Posts': undefined,
  'Questions': 'question',
  'Inspo': 'inspo',
  'My Work': 'my_work',
  'Tips': 'tip',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuthStore();

  const [posts, setPosts]           = useState<Post[]>([]);
  const [stats, setStats]           = useState({ memberCount: 0, postsToday: 0, liveNow: 0 });
  const [tag, setTag]               = useState('All Posts');
  const [isLoading, setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cursor, setCursor]         = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (reset = false, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else if (reset) setIsLoading(true);

    try {
      const [postsRes, statsRes] = await Promise.all([
        CommunityAPI.getPosts(TAG_MAP[tag]),
        CommunityAPI.getStats(),
      ]);
      setPosts(postsRes.posts);
      setCursor(postsRes.nextCursor);
      setStats(statsRes);
    } catch (e: any) {
      Alert.alert('Could not load community', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [tag]);

  useEffect(() => { load(true); }, [tag]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await CommunityAPI.getPosts(TAG_MAP[tag], cursor);
      setPosts(prev => [...prev, ...res.posts]);
      setCursor(res.nextCursor);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated()) {
      Alert.alert('Sign in to like posts', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ));
    try {
      await CommunityAPI.likePost(postId);
    } catch {
      // Revert on failure
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      ));
    }
  };

  const handleNewPost = () => {
    if (!isAuthenticated()) {
      Alert.alert('Sign in to post', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    navigation.navigate('NewPost');
  };

  return (
    <View style={styles.container}>

      {/* Dark header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>The Lanna Circle</Text>
          <Text style={styles.headerSub}>Connect · Learn · Grow together</Text>
        </View>
        <TouchableOpacity onPress={handleNewPost} style={styles.newPostBtn}>
          <Text style={styles.newPostBtnText}>+ POST</Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{stats.memberCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>MEMBERS</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={styles.statNum}>{stats.postsToday}</Text>
          <Text style={styles.statLabel}>POSTS TODAY</Text>
        </View>
        <View style={styles.statItem}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.statNum}>{stats.liveNow}</Text>
          </View>
          <Text style={styles.statLabel}>LIVE NOW</Text>
        </View>
      </View>

      {/* Tag filter */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {TAGS.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTag(t)}
              style={[styles.chip, tag === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, tag === t && styles.chipTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loader}><ActivityIndicator color={Colors.black} /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => load(false, true)} tintColor={Colors.black} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color={Colors.light} style={{ paddingVertical: 16 }} />
              : <View style={{ height: 32 }} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts yet — be the first!</Text>
              <TouchableOpacity onPress={handleNewPost} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>CREATE POST</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              authorName={`${item.author.firstName} ${item.author.lastName}`}
              authorAvatar={item.author.avatar}
              timeAgo={timeAgo(item.createdAt)}
              tag={item.tag}
              content={item.content}
              images={item.images}
              likeCount={item.likeCount}
              commentCount={item.commentCount}
              isLiked={item.isLiked}
              onLike={() => handleLike(item.id)}
              onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'InterTight-Bold', fontSize: 24,
    color: Colors.white, letterSpacing: -0.3, marginBottom: 3,
  },
  headerSub: { ...Typography.bodySmall, color: Colors.light },
  newPostBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: Spacing.md + 2, paddingVertical: 8, borderRadius: Radius.sm,
  },
  newPostBtnText: { fontFamily: 'InterTight-Bold', fontSize: 10, color: Colors.white, letterSpacing: 0.15 },

  statsBar: {
    flexDirection: 'row', backgroundColor: Colors.dark,
    borderBottomWidth: 0.5, borderBottomColor: '#444',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: '#444' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  statNum: { fontFamily: 'InterTight-Bold', fontSize: 20, color: Colors.white, letterSpacing: -0.3 },
  statLabel: { fontFamily: 'InterTight-Medium', fontSize: 9, color: Colors.mid, letterSpacing: 0.15, marginTop: 2 },

  filterWrap: { backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  filterScroll: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm,
    borderWidth: 0.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { fontFamily: 'InterTight-SemiBold', fontSize: 10, color: Colors.light, letterSpacing: 0.12 },
  chipTextActive: { color: Colors.white },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  feed: { padding: Spacing.xl, paddingBottom: 0 },
  empty: { paddingTop: 60, alignItems: 'center', gap: Spacing.lg },
  emptyText: { ...Typography.body, color: Colors.light },
  emptyBtn: {
    backgroundColor: Colors.black, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.sm,
  },
  emptyBtnText: { fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.white, letterSpacing: 0.15 },
});
