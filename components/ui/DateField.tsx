import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT } from '@/lib/constants';
import { Icon } from './Icon';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDueDate(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

export function displayDueDate(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

interface Props {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
}

export function DateField({ label, value, onChange, placeholder = 'Select date...' }: Props) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(value ?? new Date());

  const displayText = value ? displayDueDate(value) : placeholder;

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (date) setTemp(date);
  }

  function handleDone() {
    onChange(temp);
    setOpen(false);
  }

  // Android: no modal needed, picker opens as a dialog inline
  if (Platform.OS === 'android') {
    return (
      <View style={field.wrapper}>
        <Text style={field.label}>{label}</Text>
        <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8} style={field.row}>
          <Text style={[field.value, !value && field.placeholder]}>{displayText}</Text>
          <Icon name="calendar" size={18} color={C.muted} />
        </TouchableOpacity>
        {open && (
          <DateTimePicker
            mode="date"
            display="default"
            value={temp}
            onChange={(e, d) => {
              setOpen(false);
              if (d) onChange(d);
            }}
          />
        )}
      </View>
    );
  }

  return (
    <>
      <View style={field.wrapper}>
        <Text style={field.label}>{label}</Text>
        <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8} style={field.row}>
          <Text style={[field.value, !value && field.placeholder]}>{displayText}</Text>
          <Icon name="calendar" size={18} color={C.muted} />
        </TouchableOpacity>
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.root}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setOpen(false)} style={styles.headerBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{label}</Text>
            <TouchableOpacity onPress={handleDone} style={styles.headerBtn}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            mode="date"
            display="inline"
            value={temp}
            onChange={handleChange}
            themeVariant="dark"
            accentColor={C.accent}
            style={styles.picker}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBtn:  { minWidth: 64 },
  title: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cancelText: { fontFamily: FONT.semibold,  fontSize: 16, color: C.muted },
  doneText:   { fontFamily: FONT.extrabold, fontSize: 16, color: C.accent, letterSpacing: 0.5, textAlign: 'right' },
  picker:     { marginTop: 8, alignSelf: 'center', width: '100%' },
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
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  value:       { fontFamily: FONT.bold, fontSize: 18, color: C.ink, flex: 1 },
  placeholder: { color: C.muted },
});
