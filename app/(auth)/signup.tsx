import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { C, FONT } from '@/lib/constants';
import { Icon } from '@/components/ui/Icon';

export default function SignUpScreen() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const passwordsMatch = password === confirm;
  const canSignUp = email.trim().length > 0 && password.length >= 6 && passwordsMatch;

  async function handleSignUp() {
    if (!canSignUp) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email:    email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to ' + email.trim() + '. Click it to activate your account.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Icon name="chevron" size={18} color={C.ink} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backLabel}>Sign In</Text>
          </TouchableOpacity>

          {/* Heading */}
          <View style={styles.hero}>
            <Text style={styles.title}>Create{'\n'}Account</Text>
            <Text style={styles.subtitle}>Free forever for solo contractors.</Text>
          </View>

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
              autoFocus
            />
          </View>

          {/* Password */}
          <View style={field.wrapper}>
            <Text style={field.label}>Password</Text>
            <TextInput
              style={field.input}
              value={password}
              onChangeText={setPassword}
              placeholder="6+ characters"
              placeholderTextColor={C.muted}
              secureTextEntry
              returnKeyType="next"
              selectionColor={C.accent}
            />
          </View>

          {/* Confirm */}
          <View style={field.wrapper}>
            <Text style={field.label}>Confirm Password</Text>
            <TextInput
              style={[field.input, confirm.length > 0 && !passwordsMatch && field.inputError]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
              selectionColor={C.accent}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <Text style={field.errorText}>Passwords don't match</Text>
            )}
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={[styles.signUpBtn, (!canSignUp || loading) && styles.signUpBtnDisabled]}
            onPress={handleSignUp}
            disabled={!canSignUp || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#0A0A0A" />
              : <Text style={styles.signUpLabel}>Create Account</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

  backBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    height:         44,
    paddingLeft:    10,
    paddingRight:   14,
    borderWidth:    1.5,
    borderColor:    C.border,
    alignSelf:      'flex-start',
    marginBottom:   36,
  },
  backLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  hero: { marginBottom: 36 },
  title: {
    fontFamily:    FONT.black,
    fontSize:      42,
    letterSpacing: -1.5,
    lineHeight:    40,
    color:         C.ink,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: FONT.regular,
    fontSize:   15,
    color:      C.muted,
    marginTop:  10,
  },

  signUpBtn: {
    backgroundColor: C.accent,
    height:          52,
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       24,
  },
  signUpBtnDisabled: { opacity: 0.4 },
  signUpLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      15,
    color:         '#0A0A0A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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
  inputError: { color: '#FF4444' },
  errorText: {
    fontFamily: FONT.semibold,
    fontSize:   12,
    color:      '#FF4444',
    marginTop:  4,
  },
});
