/**
 * AuthScreen — Sign In / Sign Up
 * Email + password auth, with Apple and Google social login hooks
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components';
import { Colors, Typography, Spacing, Radius } from '../theme';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode]             = useState<Mode>(route.params?.mode ?? 'signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    clearError();
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Missing fields', 'Please enter your name.');
      return;
    }
    try {
      if (mode === 'signin') {
        await signIn(email.trim().toLowerCase(), password);
      } else {
        await signUp(email.trim().toLowerCase(), password, firstName.trim(), lastName.trim());
      }
      navigation.goBack();
    } catch { /* error shown from store */ }
  };

  const switchMode = () => {
    clearError();
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setEmail(''); setPassword(''); setFirstName(''); setLastName('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Close */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>LL</Text>
          </View>
          <Text style={styles.logoText}>LANNA LASHES</Text>
        </View>

        <Text style={styles.title}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signin'
            ? 'Sign in to access your courses and community'
            : 'Join thousands of lash artists on Lanna Lashes'}
        </Text>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Fields */}
        <View style={styles.form}>
          {mode === 'signup' && (
            <View style={styles.nameRow}>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Text style={styles.inputLabel}>FIRST NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lanna"
                  placeholderTextColor={Colors.light}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Text style={styles.inputLabel}>LAST NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="K."
                  placeholderTextColor={Colors.light}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
          )}

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={Colors.light}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                placeholderTextColor={Colors.light}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Text style={styles.passwordToggleText}>{showPassword ? 'hide' : 'show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {mode === 'signin' && (
            <TouchableOpacity onPress={() => Alert.alert('Reset password', 'Check your email for a reset link.')}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <Button
          label={mode === 'signin' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
          style={styles.submitBtn}
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social */}
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => Alert.alert('Apple Sign In', 'Configure Apple Sign In in your Xcode project.')}
        >
          <Text style={styles.socialBtnIcon}>🍎</Text>
          <Text style={styles.socialBtnText}>Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => Alert.alert('Google Sign In', 'Configure Google Sign In with @react-native-google-signin.')}
        >
          <Text style={styles.socialBtnIcon}>G</Text>
          <Text style={styles.socialBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Switch mode */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={switchMode}>
            <Text style={styles.switchLink}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'signup' && (
          <Text style={styles.termsText}>
            By creating an account you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { paddingHorizontal: Spacing.xl },

  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: Spacing.lg },
  closeBtnText: { fontSize: 18, color: Colors.dark },

  logoWrap: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoMark: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  logoMarkText: {
    fontFamily: 'InterTight-Bold', fontSize: 18, color: Colors.white, letterSpacing: -1,
  },
  logoText: {
    fontFamily: 'InterTight-Bold', fontSize: 12, color: Colors.black, letterSpacing: 0.2,
  },

  title: {
    fontFamily: 'InterTight-Bold', fontSize: 26, color: Colors.black,
    letterSpacing: -0.3, marginBottom: 8,
  },
  subtitle: { ...Typography.body, color: Colors.light, marginBottom: Spacing.xl },

  errorBanner: {
    backgroundColor: '#FEF2F2', borderWidth: 0.5, borderColor: '#FECACA',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#DC2626' },

  form: { gap: Spacing.md, marginBottom: Spacing.lg },
  nameRow: { flexDirection: 'row', gap: Spacing.md },

  inputWrap: { gap: 6 },
  inputLabel: {
    fontFamily: 'InterTight-SemiBold', fontSize: 9, color: Colors.light, letterSpacing: 0.2,
  },
  input: {
    fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.black,
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md + 2, paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  passwordWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    backgroundColor: Colors.white, overflow: 'hidden',
  },
  passwordToggle: { paddingHorizontal: Spacing.md },
  passwordToggleText: { fontFamily: 'InterTight-Medium', fontSize: 11, color: Colors.light },
  forgotLink: {
    ...Typography.bodySmall, color: Colors.dark,
    textAlign: 'right', textDecorationLine: 'underline',
  },

  submitBtn: { marginBottom: Spacing.xl },

  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: Colors.border },
  dividerText: { fontFamily: 'InterTight-Medium', fontSize: 11, color: Colors.light },

  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: 13, marginBottom: Spacing.md, backgroundColor: Colors.white,
  },
  socialBtnIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  socialBtnText: { fontFamily: 'InterTight-SemiBold', fontSize: 13, color: Colors.black },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
  switchText: { ...Typography.body, color: Colors.light },
  switchLink: { ...Typography.body, color: Colors.black, textDecorationLine: 'underline' },

  termsText: { ...Typography.bodySmall, color: Colors.light, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.dark, textDecorationLine: 'underline' },
});
