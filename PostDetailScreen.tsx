/**
 * PostDetailScreen
 * Full post view with comments thread, reply input, likes
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommunityAPI, Post, Comment } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();

  const [post, setPost]               = useState<Post | null>(null);
  const [comments, setComments]       = useState<Comment[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [replyText, setReplyText]     = useState('');
  const [isSending, setIsSending]     = useState(false);
  const [replyingTo, setReplyingTo]   = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef  = useRef<TextInput>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      // In production, fetch the single post by ID
      // For now we fetch comments which includes post context
      const [commentsData] = await Promise.all([
        CommunityAPI.getComments(route.params.postId),
      ]);
      setComments(commentsData);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim()) return;
    if (!isAuthenticated()) {
      Alert.alert('Sign in to comment', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Auth') },
      ]);
      return;
    }
    setIsSending(true);
    try {
      const comment = await CommunityAPI.addComment(route.params.postId, replyText.trim());
      setComments(prev => [...prev, comment]);
      setReplyText('');
      // Scroll to bottom
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
        : c
    ));
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.black} /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>POST</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Post body — passed via route params or fetched */}
        {route.params.post && (
          <PostBody post={route.params.post} onLike={() => {}} />
        )}

        {/* Comments section */}
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsLabel}>
            COMMENTS · {comments.length}
          </Text>
        </View>

        {comments.length === 0 ? (
          <View style={styles.emptyComments}>
            <Text style={styles.emptyCommentsText}>Be the first to comment</Text>
          </View>
        ) : (
          comments.map(comment => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onLike={() => handleLikeComment(comment.id)}
              onReply={() => {
                setReplyingTo(comment.id);
                inputRef.current?.focus();
              }}
            />
          ))
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Reply input */}
      <View style={[styles.replyBar, { paddingBottom: insets.bottom || Spacing.md }]}>
        {/* Current user avatar */}
        <View style={styles.replyAvatar}>
          {user?.avatar
            ? <Image source={{ uri: user.avatar }} style={styles.replyAvatarImg} />
            : <Text style={styles.replyAvatarText}>
                {user ? initials(`${user.firstName} ${user.lastName}`) : '?'}
              </Text>
          }
        </View>

        <View style={styles.replyInputWrap}>
          {replyingTo && (
            <View style={styles.replyingToRow}>
              <Text style={styles.replyingToText}>Replying to comment</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={styles.replyingToCancel}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={styles.replyInput}
            placeholder={isAuthenticated() ? 'Add a comment...' : 'Sign in to comment'}
            placeholderTextColor={Colors.light}
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={500}
            returnKeyType="default"
            editable={isAuthenticated()}
            onFocus={() => !isAuthenticated() && navigation.navigate('Auth')}
          />
        </View>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!replyText.trim() || isSending}
          style={[styles.sendBtn, (!replyText.trim() || isSending) && styles.sendBtnDisabled]}
        >
          {isSending
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── PostBody ────────────────────────────────────────────────────────────────

function PostBody({ post, onLike }: { post: Post; onLike: () => void }) {
  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const authorName = `${post.author.firstName} ${post.author.lastName}`;

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {post.author.avatar
            ? <Image source={{ uri: post.author.avatar }} style={styles.avatarImg} />
            : <Text style={styles.avatarText}>{initials(authorName)}</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{authorName}</Text>
          <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={styles.postTagPill}>
          <Text style={styles.postTagText}>{post.tag.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      {post.images?.map((img, i) => (
        <Image key={i} source={{ uri: img }} style={styles.postImage} resizeMode="cover" />
      ))}

      <View style={styles.postActions}>
        <TouchableOpacity onPress={onLike} style={styles.postAction}>
          <Text style={[styles.postActionText, post.isLiked && styles.postActionActive]}>
            ♥  {post.likeCount}
          </Text>
        </TouchableOpacity>
        <View style={styles.postAction}>
          <Text style={styles.postActionText}>💬  {post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── CommentRow ───────────────────────────────────────────────────────────────

function CommentRow({
  comment, onLike, onReply,
}: { comment: Comment; onLike: () => void; onReply: () => void }) {
  const authorName = `${comment.author.firstName} ${comment.author.lastName}`;
  const initials   = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.commentRow}>
      <View style={styles.commentAvatar}>
        {comment.author.avatar
          ? <Image source={{ uri: comment.author.avatar }} style={styles.commentAvatarImg} />
          : <Text style={styles.commentAvatarText}>{initials}</Text>
        }
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{authorName}</Text>
          <Text style={styles.commentContent}>{comment.content}</Text>
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
          <TouchableOpacity onPress={onLike}>
            <Text style={[styles.commentActionText, comment.isLiked && styles.commentActionActive]}>
              ♥ {comment.likeCount > 0 ? comment.likeCount : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onReply}>
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
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

  scroll: { paddingBottom: 0 },

  postCard: {
    backgroundColor: Colors.white, borderBottomWidth: 0.5,
    borderBottomColor: Colors.border, padding: Spacing.xl,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, marginBottom: Spacing.md },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontFamily: 'InterTight-Bold', fontSize: 12, color: Colors.white },
  postAuthor: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black },
  postTime: { ...Typography.bodySmall, color: Colors.light },
  postTagPill: {
    backgroundColor: Colors.offWhite, borderWidth: 0.5, borderColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm,
  },
  postTagText: { fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.dark, letterSpacing: 0.12 },
  postContent: { ...Typography.body, color: Colors.dark, lineHeight: 24, marginBottom: Spacing.md },
  postImage: {
    width: '100%', height: 220, borderRadius: Radius.md,
    marginBottom: Spacing.md, backgroundColor: Colors.offWhite,
  },
  postActions: { flexDirection: 'row', gap: Spacing.xl },
  postAction: { flexDirection: 'row', alignItems: 'center' },
  postActionText: { ...Typography.body, fontSize: 14, color: Colors.light },
  postActionActive: { color: Colors.black },

  commentsHeader: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  commentsLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2,
  },

  emptyComments: { padding: Spacing.xxl, alignItems: 'center' },
  emptyCommentsText: { ...Typography.body, color: Colors.light },

  commentRow: {
    flexDirection: 'row', gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  commentAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.mid,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  commentAvatarImg: { width: 30, height: 30, borderRadius: 15 },
  commentAvatarText: { fontFamily: 'InterTight-Bold', fontSize: 10, color: Colors.white },
  commentBody: { flex: 1, gap: 5 },
  commentBubble: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md, ...Shadows.card,
  },
  commentAuthor: { fontFamily: 'InterTight-SemiBold', fontSize: 12, color: Colors.black, marginBottom: 3 },
  commentContent: { ...Typography.body, fontSize: 13, color: Colors.dark, lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingLeft: Spacing.sm },
  commentTime: { ...Typography.bodySmall, color: Colors.light },
  commentActionText: { fontFamily: 'InterTight-Medium', fontSize: 12, color: Colors.light },
  commentActionActive: { color: Colors.black },

  replyBar: {
    backgroundColor: Colors.white, borderTopWidth: 0.5, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    flexDirection: 'row', gap: Spacing.sm + 2, alignItems: 'flex-end',
  },
  replyAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 4,
  },
  replyAvatarImg: { width: 30, height: 30, borderRadius: 15 },
  replyAvatarText: { fontFamily: 'InterTight-Bold', fontSize: 10, color: Colors.white },
  replyInputWrap: {
    flex: 1, backgroundColor: Colors.offWhite,
    borderRadius: Radius.xl, borderWidth: 0.5, borderColor: Colors.border,
    overflow: 'hidden',
  },
  replyingToRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 6,
  },
  replyingToText: { fontFamily: 'InterTight-Medium', fontSize: 10, color: Colors.light },
  replyingToCancel: { fontSize: 10, color: Colors.light, padding: 2 },
  replyInput: {
    fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.black,
    paddingHorizontal: 14, paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  sendBtnDisabled: { backgroundColor: Colors.mid },
  sendBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
