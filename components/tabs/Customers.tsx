import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { C, FONT } from '@/lib/constants';
import { useCustomers } from '@/db/hooks';
import { Icon } from '../ui/Icon';
import { Header } from '../ui/Header';

export function Customers() {
  const router    = useRouter();
  const customers = useCustomers();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header
        sub={`${customers.length} people`}
        title="People"
        trailing={
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/new-customer')}
          >
            <Icon name="plus" size={28} stroke={2.5} color="#0A0A0A" />
          </TouchableOpacity>
        }
      />
      <View style={styles.list}>
        {customers.map(c => {
          const initials = c.name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('');
          return (
            <TouchableOpacity
              key={c.id}
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => router.push(`/customer/${c.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                <Text style={styles.phone} numberOfLines={1}>{c.phone || c.address || '—'}</Text>
              </View>
              <View style={styles.right}>
                <View style={styles.jobsBadge}>
                  <Text style={styles.jobsText}>{c.jobs} JOBS</Text>
                </View>
                <Icon name="chevron" size={18} color={C.muted} />
              </View>
            </TouchableOpacity>
          );
        })}
        {customers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No customers yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first customer</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },
  list:    { paddingHorizontal: 20, gap: 4 },
  addBtn: {
    width:           54,
    height:          54,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  row: {
    backgroundColor:  C.surface,
    padding:          14,
    paddingHorizontal: 16,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              14,
  },
  avatar: {
    width:           48,
    height:          48,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  initials: { fontFamily: FONT.black, fontSize: 16, color: '#0A0A0A' },
  info:     { flex: 1, minWidth: 0 },
  name: {
    fontFamily:    FONT.extrabold,
    fontSize:      16,
    color:         C.ink,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  phone: {
    fontFamily: FONT.regular,
    fontSize:   13,
    color:      C.muted,
    marginTop:  2,
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  jobsBadge: {
    backgroundColor:   C.bg,
    paddingHorizontal: 8,
    paddingVertical:   4,
  },
  jobsText: {
    fontFamily:    FONT.black,
    fontSize:      11,
    color:         C.accent,
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems:   'center',
    paddingTop:   60,
    paddingBottom: 20,
  },
  emptyTitle: {
    fontFamily:    FONT.extrabold,
    fontSize:      18,
    color:         C.ink,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  emptySub: {
    fontFamily: FONT.regular,
    fontSize:   14,
    color:      C.muted,
    marginTop:  6,
  },
});
