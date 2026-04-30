/**
 * EditProfileScreen
 * Update display name, avatar photo, and bio
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuthStore } from '../store/authStore';
import { apiPut } from '../services/api';
import { Button } from '../components';
import { Colors, Typography, Spacing, Radius } from '../theme';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { user, refreshUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [avatar, setAvatar]       = useState<string | null>(user?.avatar ?? null);
  const [isSaving, setIsSaving]   = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = () => setHasChanges(true);

  const handlePickAvatar = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.9, selectionLimit: 1 });
    if (result.assets?.[0]?.uri) {
      setAvatar(result.assets[0].uri);
      markChanged();
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing fields', 'First and last name are required.');
      return;
    }
    setIsSaving(true);
    try {
      await apiPut('/auth/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatar,
      });
      await refreshUser();
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Could not save', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          style={[styles.saveBtn, (!hasChanges || isSaving) && styles.saveBtnDisabled]}
        >
          {isSaving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.saveBtnText}>SAVE</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrap}>
            {avatar
              ? <Image source={{ uri: avatar }} style={styles.avatarImg} />
              : <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
            }
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>✎</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Name fields */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR NAME</Text>
          <View style={styles.nameRow}>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>FIRST NAME</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={v => { setFirstName(v); markChanged(); }}
                placeholder="First name"
                placeholderTextColor={Colors.light}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>LAST NAME</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={v => { setLastName(v); markChanged(); }}
                placeholder="Last name"
                placeholderTextColor={Colors.light}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Read-only email */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EMAIL</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{user?.email}</Text>
            <Text style={styles.readOnlyNote}>Contact support to change your email</Text>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerLabel}>ACCOUNT</Text>
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Delete account',
              'This permanently deletes your account, courses, and community posts. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Account', style: 'destructive', onPress: () => {} },
              ]
            )}
            style={styles.dangerBtn}
          >
            <Text style={styles.dangerBtnText}>Delete my account</Text>
          </TouchableOpacity>
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
  backBtn: { width: 36, padding: 4 },
  backBtnText: { fontSize: 18, color: Colors.black },
  headerTitle: { fontFamily: 'InterTight-Bold', fontSize: 13, color: Colors.black, letterSpacing: 0.15 },
  saveBtn: {
    backgroundColor: Colors.black, paddingHorizontal: Spacing.md + 2,
    paddingVertical: 8, borderRadius: Radius.sm, minWidth: 56, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: Colors.mid },
  saveBtnText: { fontFamily: 'InterTight-Bold', fontSize: 11, color: Colors.white, letterSpacing: 0.15 },

  scroll: { padding: Spacing.xl, gap: Spacing.xxl },

  avatarSection: { alignItems: 'center', gap: Spacing.sm },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: Colors.border },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  avatarInitials: { fontFamily: 'InterTight-Bold', fontSize: 28, color: Colors.white, letterSpacing: -0.5 },
  avatarEditBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.black, borderWidth: 2, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { color: Colors.white, fontSize: 12 },
  avatarHint: { ...Typography.bodySmall, color: Colors.light },

  section: { gap: Spacing.sm + 2 },
  sectionLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2,
  },
  nameRow: { flexDirection: 'row', gap: Spacing.md },
  fieldWrap: { gap: 5 },
  fieldLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.15,
  },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md + 2, paddingVertical: 12,
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.black,
  },
  readOnlyField: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border, padding: Spacing.md + 2, gap: 3,
  },
  readOnlyText: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.dark },
  readOnlyNote: { ...Typography.bodySmall, color: Colors.light },

  dangerSection: { gap: Spacing.sm + 2 },
  dangerLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2,
  },
  dangerBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: '#FECACA',
    padding: Spacing.md + 2,
  },
  dangerBtnText: { fontFamily: 'InterTight-Medium', fontSize: 13, color: '#DC2626' },
});
