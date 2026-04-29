import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT } from '@/lib/constants';
import { addJob } from '@/db/hooks';
import { CustomerPicker } from '@/components/CustomerPicker';
import { DateField, fmtDueDate } from '@/components/ui/DateField';
import type { Customer } from '@/lib/types';
import { Icon } from '@/components/ui/Icon';

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
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
        autoCapitalize={keyboardType === 'decimal-pad' ? 'none' : 'words'}
        returnKeyType="next"
        selectionColor={C.accent}
      />
    </View>
  );
}

export default function NewJobScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    customerAddress?: string;
  }>();

  const [title,      setTitle]      = useState('');
  const [customerId, setCustomerId] = useState(params.customerId ?? '');
  const [customer,   setCustomer]   = useState(params.customerName ? decodeURIComponent(params.customerName) : '');
  const [address,    setAddress]    = useState(params.customerAddress ? decodeURIComponent(params.customerAddress) : '');
  const [price,      setPrice]      = useState('');
  const [hours,      setHours]      = useState('');
  const [dueDate,    setDueDate]    = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const canSave = title.trim().length > 0 && customer.trim().length > 0;

  function handleSelectCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustomer(c.name);
    if (c.address) setAddress(c.address);
  }

  function handleSave() {
    if (!canSave) return;
    addJob({
      id:         `j${Date.now()}`,
      title:      title.trim(),
      customer:   customer.trim(),
      customerId: customerId || `c${Date.now()}`,
      address:    address.trim() || '—',
      status:     'new',
      scheduled:  'Needs scheduling',
      due:        dueDate ? fmtDueDate(dueDate) : '—',
      price:      parseFloat(price) || 0,
      hours:      0,
      hoursEst:   parseFloat(hours) || 0,
      photos:     0,
      notes:      0,
      materials:  0,
      desc:       '',
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
          <Text style={styles.headerTitle}>New Job</Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={!canSave}>
            <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Field label="Job Title" value={title} onChangeText={setTitle} placeholder="e.g. Kitchen cabinet install" autoFocus />

          {/* Customer picker row */}
          <View style={field.wrapper}>
            <Text style={field.label}>Customer</Text>
            <TouchableOpacity style={styles.pickerRow} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
              <Text style={[styles.pickerText, !customer && styles.pickerPlaceholder]}>
                {customer || 'Select customer...'}
              </Text>
              <Icon name="chevron" size={18} color={C.muted} />
            </TouchableOpacity>
          </View>

          <Field label="Address"    value={address} onChangeText={setAddress} placeholder="Street address" />
          <Field label="Price ($)"  value={price}   onChangeText={setPrice}   placeholder="0" keyboardType="decimal-pad" />
          <Field label="Est. Hours" value={hours} onChangeText={setHours} placeholder="0" keyboardType="decimal-pad" />
          <DateField label="Start Date" value={dueDate} onChange={setDueDate} />
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomerPicker
        visible={pickerOpen}
        onSelect={handleSelectCustomer}
        onClose={() => setPickerOpen(false)}
      />
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
  pickerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pickerText:        { fontFamily: FONT.bold, fontSize: 18, color: C.ink, flex: 1 },
  pickerPlaceholder: { color: C.muted },
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
