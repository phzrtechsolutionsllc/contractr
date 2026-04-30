import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT } from '@/lib/constants';
import { useCustomer, updateCustomer } from '@/db/hooks';
import { ContactsPicker } from '@/components/ContactsPicker';
import { Icon } from '@/components/ui/Icon';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: FieldProps) {
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
        autoCapitalize="words"
        returnKeyType="next"
        selectionColor={C.accent}
      />
    </View>
  );
}

export default function EditCustomerScreen() {
  const router     = useRouter();
  const { id }     = useLocalSearchParams<{ id: string }>();
  const customer   = useCustomer(id ?? '');

  const [name,         setName]         = useState(customer?.name    ?? '');
  const [phone,        setPhone]        = useState(customer?.phone   ?? '');
  const [address,      setAddress]      = useState(customer?.address ?? '');
  const [contactsOpen, setContactsOpen] = useState(false);

  const canSave = name.trim().length > 0;

  function handleImport(c: { name: string; phone: string; address: string }) {
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
  }

  function handleSave() {
    if (!canSave || !id) return;
    updateCustomer(id, {
      name:    name.trim(),
      phone:   phone.trim(),
      address: address.trim(),
    });
    router.back();
  }

  if (!customer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONT.extrabold, color: C.muted }}>Customer not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Customer</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!canSave}>
            <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.importBtn}
            onPress={() => setContactsOpen(true)}
            activeOpacity={0.8}
          >
            <Icon name="people" size={16} stroke={2} color={C.ink} />
            <Text style={styles.importLabel}>Import from Contacts</Text>
          </TouchableOpacity>

          <Field label="Full Name" value={name}    onChangeText={setName}    placeholder="e.g. Patricia Nguyen" />
          <Field label="Phone"     value={phone}   onChangeText={setPhone}   placeholder="(555) 000-0000" keyboardType="phone-pad" />
          <Field label="Address"   value={address} onChangeText={setAddress} placeholder="Street address" />
        </ScrollView>
      </KeyboardAvoidingView>

      <ContactsPicker
        visible={contactsOpen}
        onSelect={handleImport}
        onClose={() => setContactsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  importBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  importLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         C.ink,
    letterSpacing: 0.3,
  },
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
