/**
 * NewPostScreen
 * Create a community post with text, images, and tag selection
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { CommunityAPI } from '../services/api';
import { Colors, Typography, Spacing, Radius } from '../theme';

const TAGS = [
  { value: 'my_work',  label: 'My Work',  desc: 'Show off your sets' },
  { value: 'question', label: 'Question',  desc: 'Ask the community' },
  { value: 'inspo',    label: 'Inspo',     desc: 'Inspiration & mood' },
  { value: 'tip',      label: 'Tip',       desc: 'Share a technique' },
  { value: 'general',  label: 'General',   desc: 'Anything goes' },
];

export default function NewPostScreen() {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();

  const [content, setContent]     = useState('');
  const [tag, setTag]             = useState('general');
  const [images, setImages]       = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const handlePickImage = async () => {
    if (images.length >= 4) {
      Alert.alert('Max 4 images', 'You can add up to 4 images per post.');
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.85,
      selectionLimit: 4 - images.length,
    });
    if (result.assets) {
      const uris = result.assets.map(a => a.uri!).filter(Boolean);
      setImages(prev => [...prev, ...uris]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Empty post', 'Write something before posting.');
      return;
    }
    setIsPosting(true);
    try {
      // In production: upload images to S3 first, then post URLs
      // For now we pass local URIs (backend should handle S3 upload)
      await CommunityAPI.createPost(content.trim(), tag, images);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not post', e.message);
    } finally {
      setIsPosting(false);
    }
  };

  const charCount = content.length;
  const charLimit = 1000;
  const isOverLimit = charCount > charLimit;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW POST</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!content.trim() || isPosting || isOverLimit}
          style={[styles.postBtn, (!content.trim() || isPosting || isOverLimit) && styles.postBtnDisabled]}
        >
          {isPosting
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.postBtnText}>POST</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Tag selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <View style={styles.tagGrid}>
            {TAGS.map(t => (
              <TouchableOpacity
                key={t.value}
                onPress={() => setTag(t.value)}
                style={[styles.tagCard, tag === t.value && styles.tagCardActive]}
              >
                <Text style={[styles.tagLabel, tag === t.value && styles.tagLabelActive]}>
                  {t.label}
                </Text>
                <Text style={[styles.tagDesc, tag === t.value && styles.tagDescActive]}>
                  {t.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR POST</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Share something with the community..."
            placeholderTextColor={Colors.light}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={charLimit + 50}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.charRow}>
            <Text style={[styles.charCount, isOverLimit && styles.charCountOver]}>
              {charCount}/{charLimit}
            </Text>
          </View>
        </View>

        {/* Image picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTOS (optional · max 4)</Text>
          <View style={styles.imageGrid}>
            {images.map((uri, i) => (
              <View key={i} style={styles.imageThumb}>
                <Image source={{ uri }} style={styles.imageThumbImg} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => handleRemoveImage(i)}
                  style={styles.imageRemoveBtn}
                >
                  <Text style={styles.imageRemoveBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 4 && (
              <TouchableOpacity onPress={handlePickImage} style={styles.addImageBtn}>
                <Text style={styles.addImageIcon}>+</Text>
                <Text style={styles.addImageText}>Add photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Community guidelines</Text>
          <Text style={styles.tipsText}>
            Be kind and supportive. Tag your post correctly so others can find it. 
            Before/after photos and product shots are always welcome!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },

  header: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cancelBtn: { padding: 4 },
  cancelBtnText: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.dark },
  headerTitle: { fontFamily: 'InterTight-Bold', fontSize: 13, color: Colors.black, letterSpacing: 0.15 },
  postBtn: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.md + 2,
    paddingVertical: 8, borderRadius: Radius.sm, minWidth: 60, alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: Colors.mid },
  postBtnText: { fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.white, letterSpacing: 0.15 },

  scroll: { padding: Spacing.xl, gap: Spacing.xl },

  section: { gap: Spacing.sm + 2 },
  sectionLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2,
  },

  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tagCard: {
    flex: 1, minWidth: '45%', padding: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  tagCardActive: { backgroundColor: Colors.black, borderColor: Colors.black },
  tagLabel: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black, marginBottom: 2 },
  tagLabelActive: { color: Colors.white },
  tagDesc: { ...Typography.bodySmall, color: Colors.light },
  tagDescActive: { color: 'rgba(255,255,255,0.6)' },

  textInput: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    padding: Spacing.md + 2, fontFamily: 'Inter-Regular',
    fontSize: 15, color: Colors.black, lineHeight: 24,
    minHeight: 140,
  },
  charRow: { alignItems: 'flex-end' },
  charCount: { fontFamily: 'InterTight-Medium', fontSize: 11, color: Colors.light },
  charCountOver: { color: '#DC2626' },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  imageThumb: {
    width: 90, height: 90, borderRadius: Radius.md,
    overflow: 'hidden', position: 'relative',
  },
  imageThumbImg: { width: 90, height: 90 },
  imageRemoveBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  imageRemoveBtnText: { color: Colors.white, fontSize: 9, fontWeight: '700' },
  addImageBtn: {
    width: 90, height: 90, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, borderStyle: 'dashed',
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageIcon: { fontSize: 20, color: Colors.light },
  addImageText: { fontFamily: 'InterTight-Medium', fontSize: 10, color: Colors.light },

  tipsCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md + 2,
    borderLeftWidth: 3, borderLeftColor: Colors.black,
  },
  tipsTitle: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black, marginBottom: 5 },
  tipsText: { ...Typography.bodySmall, color: Colors.dark, lineHeight: 18 },
});
