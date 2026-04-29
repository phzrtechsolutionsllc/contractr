import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT } from '@/lib/constants';
import { useCustomers } from '@/db/hooks';
import type { Customer } from '@/lib/types';
import { Icon } from './ui/Icon';

interface Props {
  visible: boolean;
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}

export function CustomerPicker({ visible, onSelect, onClose }: Props) {
  const customers          = useCustomers();
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Customer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Icon name="x" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search customers..."
            placeholderTextColor={C.muted}
            autoFocus
            selectionColor={C.accent}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="x" size={14} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item: c }) => {
            const initials = c.name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('');
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => { onSelect(c); onClose(); setSearch(''); }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.initials}>{initials}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.sub} numberOfLines={1}>{c.phone || c.address || '—'}</Text>
                </View>
                <Icon name="arrowR" size={18} color={C.muted} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No customers found</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: {
    width:           44,
    height:          44,
    alignItems:      'center',
    justifyContent:  'center',
  },
  searchRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    marginHorizontal:  16,
    marginVertical:    10,
    backgroundColor:   C.surface,
    paddingHorizontal: 14,
    paddingVertical:   10,
  },
  searchInput: {
    flex:       1,
    fontFamily: FONT.semibold,
    fontSize:   16,
    color:      C.ink,
    padding:    0,
  },
  list:  { paddingHorizontal: 16, gap: 2, paddingBottom: 24 },
  row: {
    backgroundColor: C.surface,
    padding:         14,
    paddingHorizontal: 16,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
  },
  avatar: {
    width:           44,
    height:          44,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  initials: { fontFamily: FONT.black, fontSize: 15, color: '#0A0A0A' },
  info:     { flex: 1, minWidth: 0 },
  name: {
    fontFamily:    FONT.extrabold,
    fontSize:      15,
    color:         C.ink,
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: FONT.regular,
    fontSize:   13,
    color:      C.muted,
    marginTop:  2,
  },
  empty: {
    fontFamily:  FONT.semibold,
    fontSize:    14,
    color:       C.muted,
    textAlign:   'center',
    paddingTop:  40,
  },
});
