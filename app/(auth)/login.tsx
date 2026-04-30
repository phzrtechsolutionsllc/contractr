import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { C, FONT } from '@/lib/constants';

export default function LoginScreen() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleAppleSignIn() {
    try {
      const rawNonce    = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token:    credential.identityToken!,
        nonce:    rawNonce,
      });

      if (error) throw error;
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign in failed', e.message);
      }
    }
  }

  async function handleEmailSignIn() {
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert('Enter your email first', 'Type your email above, then tap Forgot Password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', 'A password reset link has been sent.');
    }
  }

  const canSignIn = email.trim().length > 0 && password.length >= 6;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Wordmark */}
          <View style={styles.hero}>
            <Text style={styles.wordmark}>CONTRACTR</Text>
            <Text style={styles.tagline}>Your jobs, organized.</Text>
          </View>

          {/* Sign in with Apple */}
          {Platform.OS === 'ios' && (
            <>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={0}
                style={styles.appleBtn}
                onPress={handleAppleSignIn}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {/* Email */}
          <View style={field.wrapper}>
            <Text style={field.label}>Email</Text>
            <TextInput
              style={field.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              selectionColor={C.accent}
            />
          </View>

          {/* Password */}
          <View style={field.wrapper}>
            <Text style={field.label}>Password</Text>
            <TextInput
              style={field.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleEmailSignIn}
              selectionColor={C.accent}
            />
          </View>

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In */}
          <TouchableOpacity
            style={[styles.signInBtn, (!canSignIn || loading) && styles.signInBtnDisabled]}
            onPress={handleEmailSignIn}
            disabled={!canSignIn || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#0A0A0A" />
              : <Text style={styles.signInLabel}>Sign In</Text>
            }
          </TouchableOpacity>

          {/* Sign Up link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>New to CONTRACTR? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
              <Text style={styles.signUpLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },

  hero: { marginBottom: 48 },
  wordmark: {
    fontFamily:    FONT.black,
    fontSize:      42,
    letterSpacing: -1.5,
    color:         C.ink,
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: FONT.regular,
    fontSize:   15,
    color:      C.muted,
    marginTop:  6,
  },

  appleBtn: { width: '100%', height: 52, marginBottom: 20 },

  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    marginBottom:   20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: {
    fontFamily:    FONT.extrabold,
    fontSize:      11,
    color:         C.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 8, marginBottom: 4 },
  forgotText: {
    fontFamily: FONT.semibold,
    fontSize:   13,
    color:      C.muted,
  },

  signInBtn: {
    backgroundColor: C.accent,
    height:          52,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       12,
  },
  signInBtnDisabled: { opacity: 0.4 },
  signInLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      15,
    color:         '#0A0A0A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  signUpRow: {
    flexDirection:  'row',
    justifyContent: 'center',
    marginTop:      28,
  },
  signUpPrompt: { fontFamily: FONT.regular, fontSize: 14, color: C.muted },
  signUpLink:   { fontFamily: FONT.extrabold, fontSize: 14, color: C.accent },
});

const field = StyleSheet.create({
  wrapper: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  label: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom:  6,
  },
  input: {
    fontFamily: FONT.bold,
    fontSize:   18,
    color:      C.ink,
    padding:    0,
  },
});
