import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT } from '@/lib/constants';
import { addCustomer } from '@/db/hooks';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  autoFocus?: boolean;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoFocus }: FieldProps) {
  return (
    <View style={field.wrapper}>
      <Text style={field.label}>{label}</Text>
      <TextInput
        style={field.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        autoCapitalize="words"
        returnKeyType="next"
        selectionColor={C.accent}
      />
    </View>
  );
}

export default function NewCustomerScreen() {
  const router = useRouter();

  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [address, setAddress] = useState('');

  const canSave = name.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    const now = new Date();
    addCustomer({
      id:      `c${Date.now()}`,
      name:    name.trim(),
      phone:   phone.trim(),
      address: address.trim(),
      since:   `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`,
    });
    router.back();
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Customer</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!canSave}>
            <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Field label="Full Name" value={name}    onChangeText={setName}    placeholder="e.g. Patricia Nguyen" autoFocus />
          <Field label="Phone"     value={phone}   onChangeText={setPhone}   placeholder="(555) 000-0000" keyboardType="phone-pad" />
          <Field label="Address"   value={address} onChangeText={setAddress} placeholder="Street address" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal: 16,
    paddingVertical:  14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBtn:    { minWidth: 64 },
  headerTitle:  { fontFamily: FONT.extrabold, fontSize: 14, color: C.ink, letterSpacing: 1, textTransform: 'uppercase' },
  cancelText:   { fontFamily: FONT.semibold,  fontSize: 16, color: C.muted },
  saveText:     { fontFamily: FONT.extrabold, fontSize: 16, color: C.accent, letterSpacing: 0.5, textAlign: 'right' },
  saveDisabled: { color: C.border },
  form:         { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 4 },
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
