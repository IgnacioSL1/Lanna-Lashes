/**
 * Lanna Lashes — shared UI components
 * All on-brand: Inter Tight + Inter, black/white/greige palette
 */
import React from 'react';
import {
  View, Text, TouchableOpacity, Image, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, ImageStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  variant?: 'black' | 'outline' | 'mid';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'black', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label, onPress, variant = 'primary', loading, disabled, style, fullWidth,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.btn,
        styles[`btn_${variant}`],
        fullWidth && { width: '100%' },
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.black} size="small" />
        : <Text style={[styles.btnText, styles[`btnText_${variant}`]]}>{label.toUpperCase()}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  badge?: string | null;
  onPress: () => void;
  onAddToCart: () => void;
  style?: ViewStyle;
}

export function ProductCard({
  title, description, price, compareAtPrice, imageUrl, badge, onPress, onAddToCart, style,
}: ProductCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.productCard, style]}>
      <View style={styles.productImageWrap}>
        {imageUrl
          ? <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          : <View style={styles.productImagePlaceholder}>
              <Text style={styles.llMark}>LL</Text>
            </View>
        }
        {badge && (
          <Badge
            label={badge}
            variant={badge === 'Sale' ? 'outline' : 'black'}
            style={styles.productBadge}
          />
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{title}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>{description}</Text>
        <View style={styles.productPriceRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            {compareAtPrice && (
              <Text style={styles.productOldPrice}>{compareAtPrice}</Text>
            )}
            <Text style={styles.productPrice}>{price}</Text>
          </View>
          <TouchableOpacity onPress={onAddToCart} style={styles.addBtn} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── CourseCard ───────────────────────────────────────────────────────────────

interface CourseCardProps {
  title: string;
  category: string;
  level: string;
  price: string;
  totalLessons: number;
  durationHours: number;
  enrolledCount: number;
  thumbnailUrl?: string;
  progress?: number;
  onPress: () => void;
  onEnroll: () => void;
}

export function CourseCard({
  title, category, level, price, totalLessons, durationHours,
  enrolledCount, thumbnailUrl, progress, onPress, onEnroll,
}: CourseCardProps) {
  const isEnrolled = progress !== undefined;
  const thumbBg = level === 'beginner' ? Colors.black
    : level === 'intermediate' ? Colors.dark
    : '#5a5857';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.courseCard}>
      <View style={[styles.courseThumb, { backgroundColor: thumbBg }]}>
        {thumbnailUrl
          ? <Image source={{ uri: thumbnailUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Text style={styles.courseThumbLL}>LL</Text>
        }
        <View style={styles.playBtn}>
          <Text style={{ color: Colors.white, fontSize: 14, marginLeft: 2 }}>▶</Text>
        </View>
        <View style={styles.courseLevelBadge}>
          <Text style={styles.courseLevelText}>{level.toUpperCase()}</Text>
        </View>
        <Text style={styles.courseLessonsText}>
          {totalLessons} lessons · {durationHours}h
        </Text>
        {isEnrolled && (
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
          </View>
        )}
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseCategory}>{category.toUpperCase()}</Text>
        <Text style={styles.courseTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.courseMeta}>
          {enrolledCount.toLocaleString()} students enrolled
        </Text>
        <View style={styles.courseFooter}>
          <Text style={styles.coursePrice}>{price}</Text>
          <Button
            label={isEnrolled ? `${progress}% done` : 'Enroll'}
            onPress={onEnroll}
            variant={isEnrolled ? 'outline' : 'primary'}
            style={{ paddingHorizontal: Spacing.lg }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── PostCard ────────────────────────────────────────────────────────────────

interface PostCardProps {
  authorName: string;
  authorAvatar?: string | null;
  timeAgo: string;
  tag: string;
  content: string;
  images?: string[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onPress: () => void;
}

export function PostCard({
  authorName, authorAvatar, timeAgo, tag, content, images,
  likeCount, commentCount, isLiked, onLike, onComment, onPress,
}: PostCardProps) {
  const initials = authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {authorAvatar
            ? <Image source={{ uri: authorAvatar }} style={styles.avatarImg} />
            : <Text style={styles.avatarText}>{initials}</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{authorName}</Text>
          <Text style={styles.postTime}>{timeAgo}</Text>
        </View>
        <View style={styles.postTagPill}>
          <Text style={styles.postTagText}>{tag.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.postContent} numberOfLines={4}>{content}</Text>

      {images && images.length > 0 && (
        <Image source={{ uri: images[0] }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity onPress={onLike} style={styles.postAction}>
          <Text style={[styles.postActionText, isLiked && styles.postActionActive]}>
            ♥  {likeCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={styles.postAction}>
          <Text style={styles.postActionText}>💬  {commentCount}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── FilterChips ─────────────────────────────────────────────────────────────

interface FilterChipsProps {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <View style={styles.filterRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          style={[styles.chip, selected === opt && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
            {opt.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────

export function SectionHeader({
  title, linkLabel, onLink,
}: { title: string; linkLabel?: string; onLink?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {linkLabel && (
        <TouchableOpacity onPress={onLink}>
          <Text style={styles.sectionLink}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Badge
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  badge_black: { backgroundColor: Colors.black },
  badge_outline: { backgroundColor: Colors.white, borderWidth: 0.5, borderColor: Colors.black },
  badge_mid: { backgroundColor: Colors.mid },
  badgeText: { ...Typography.labelSm, letterSpacing: 0.12 },
  badgeText_black: { color: Colors.white },
  badgeText_outline: { color: Colors.black },
  badgeText_mid: { color: Colors.dark },

  // Button
  btn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn_primary: { backgroundColor: Colors.black },
  btn_outline: { backgroundColor: 'transparent', borderWidth: 0.5, borderColor: Colors.black },
  btn_ghost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.4 },
  btnText: { ...Typography.label, letterSpacing: 0.15 },
  btnText_primary: { color: Colors.white },
  btnText_outline: { color: Colors.black },
  btnText_ghost: { color: Colors.dark },

  // ProductCard
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  productImageWrap: { aspectRatio: 1, backgroundColor: Colors.offWhite, position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
  },
  llMark: { fontFamily: 'InterTight-Bold', fontSize: 36, color: Colors.mid, letterSpacing: -2 },
  productBadge: { position: 'absolute', top: 8, left: 8 },
  productInfo: { padding: Spacing.md, paddingBottom: Spacing.md + 2 },
  productName: { ...Typography.heading4, color: Colors.black, marginBottom: 2 },
  productDesc: { ...Typography.bodySmall, color: Colors.light, marginBottom: Spacing.sm + 2 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productOldPrice: {
    ...Typography.bodySmall, color: Colors.light,
    textDecorationLine: 'line-through',
  },
  productPrice: { ...Typography.price, color: Colors.black },
  addBtn: {
    width: 28, height: 28, backgroundColor: Colors.black,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: Colors.white, fontSize: 18, lineHeight: 20, fontFamily: 'Inter-Regular' },

  // CourseCard
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  courseThumb: {
    height: 140, alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  courseThumbLL: {
    fontFamily: 'InterTight-Bold', fontSize: 64, color: 'rgba(255,255,255,0.07)',
    letterSpacing: -4, position: 'absolute',
  },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  courseLevelBadge: {
    position: 'absolute', top: 10, right: 10,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.sm,
  },
  courseLevelText: { ...Typography.labelSm, color: 'rgba(255,255,255,0.7)' },
  courseLessonsText: {
    position: 'absolute', bottom: 10, left: 10,
    ...Typography.bodySmall, color: 'rgba(255,255,255,0.55)',
  },
  progressBarWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBarFill: { height: 3, backgroundColor: Colors.white },
  courseBody: { padding: Spacing.md + 2, paddingBottom: Spacing.lg },
  courseCategory: { ...Typography.labelSm, color: Colors.light, marginBottom: 4, letterSpacing: 0.2 },
  courseTitle: { ...Typography.heading4, color: Colors.black, marginBottom: 4 },
  courseMeta: { ...Typography.bodySmall, color: Colors.light, marginBottom: Spacing.md },
  courseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coursePrice: { fontFamily: 'InterTight-Bold', fontSize: 20, color: Colors.black, letterSpacing: -0.3 },

  // PostCard
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2, marginBottom: Spacing.sm + 2 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 34, height: 34, borderRadius: 17 },
  avatarText: { fontFamily: 'InterTight-Bold', fontSize: 12, color: Colors.white },
  postAuthor: { ...Typography.heading4, fontSize: 13, color: Colors.black },
  postTime: { ...Typography.bodySmall, color: Colors.light },
  postTagPill: {
    backgroundColor: Colors.offWhite, borderWidth: 0.5, borderColor: Colors.border,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm,
  },
  postTagText: { ...Typography.labelSm, color: Colors.dark },
  postContent: { ...Typography.body, fontSize: 13, color: Colors.dark, marginBottom: Spacing.sm + 2 },
  postImage: { width: '100%', height: 160, borderRadius: Radius.md, marginBottom: Spacing.sm + 2 },
  postActions: { flexDirection: 'row', gap: Spacing.lg + 2 },
  postAction: { flexDirection: 'row', alignItems: 'center' },
  postActionText: { ...Typography.bodySmall, color: Colors.light },
  postActionActive: { color: Colors.black },

  // FilterChips
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md + 2, paddingVertical: 6,
    borderRadius: Radius.sm, borderWidth: 0.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  chipText: { ...Typography.labelSm, color: Colors.light, letterSpacing: 0.12 },
  chipTextActive: { color: Colors.white },

  // SectionHeader
  sectionHeader: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.heading3, color: Colors.black },
  sectionLink: { ...Typography.bodySmall, color: Colors.light, textDecorationLine: 'underline' },
} as any);
