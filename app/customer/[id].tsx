import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT, STATUS_COLOR, STATUS_LABEL, money } from '@/lib/constants';
import { useCustomer, useCustomerJobs, deleteCustomer } from '@/db/hooks';
import { Icon } from '@/components/ui/Icon';

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customer = useCustomer(id ?? '');
  const jobs     = useCustomerJobs(id ?? '');

  if (!customer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONT.extrabold, color: C.muted }}>Customer not found</Text>
      </SafeAreaView>
    );
  }

  const c        = customer;
  const initials = c.name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('');

  function handleCall() {
    if (!c.phone) { Alert.alert('No phone number', 'Edit this customer to add one.'); return; }
    Linking.openURL(`tel:${c.phone.replace(/\D/g, '')}`).catch(() => {
      Alert.alert(c.name, c.phone, [{ text: 'OK' }]);
    });
  }

  const totalValue = jobs.reduce((s, j) => s + j.price, 0);
  const doneCount  = jobs.filter(j => j.status === 'done').length;

  function handleDelete() {
    Alert.alert(
      'Delete customer?',
      `"${c.name}" will be permanently removed. Their jobs will remain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { deleteCustomer(c.id); router.back(); },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Icon name="chevron" size={18} color={C.ink} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backLabel}>People</Text>
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/edit-customer?id=${c.id}`)}
            >
              <Icon name="edit" size={16} stroke={2} color={C.ink} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={handleDelete}>
              <Icon name="trash" size={16} stroke={2} color="#FF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar + name */}
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{c.name}</Text>
            <Text style={styles.heroSince}>Customer since {c.since || '—'}</Text>
          </View>
        </View>

        {/* Contact row */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8} onPress={handleCall}>
            <Icon name="phone" size={18} stroke={2.5} color="#0A0A0A" />
            <Text style={styles.contactBtnLabel}>{c.phone || 'No phone'}</Text>
          </TouchableOpacity>
          {c.address ? (
            <TouchableOpacity style={styles.contactBtnOutline} activeOpacity={0.8}>
              <Icon name="map" size={18} stroke={2} color={C.ink} />
              <Text style={styles.contactBtnOutlineLabel} numberOfLines={1}>{c.address}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { lbl: 'Jobs',      val: String(jobs.length) },
            { lbl: 'Completed', val: String(doneCount) },
            { lbl: 'Total Value', val: totalValue > 0 ? money(totalValue) : '—' },
          ].map(s => (
            <View key={s.lbl} style={styles.statBox}>
              <Text style={styles.statLbl}>{s.lbl}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* Jobs list */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Jobs</Text>
          <TouchableOpacity
            style={styles.newJobBtn}
            activeOpacity={0.8}
            onPress={() => router.push(`/new-job?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}&customerAddress=${encodeURIComponent(c.address)}`)}
          >
            <Icon name="plus" size={16} stroke={2.5} color="#0A0A0A" />
            <Text style={styles.newJobLabel}>New Job</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jobsList}>
          {jobs.length === 0 && (
            <Text style={styles.empty}>No jobs yet for this customer</Text>
          )}
          {jobs.map(job => {
            const sc = STATUS_COLOR[job.status];
            return (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/job/${job.id}`)}
              >
                <View style={[styles.jobStrip, { backgroundColor: sc }]} />
                <View style={styles.jobBody}>
                  <View style={styles.jobTop}>
                    <Text style={[styles.jobStatus, { color: sc }]}>{STATUS_LABEL[job.status]}</Text>
                    {job.price > 0 && <Text style={styles.jobPrice}>{money(job.price)}</Text>}
                  </View>
                  <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                  <Text style={styles.jobAddr} numberOfLines={1}>{job.address}</Text>
                </View>
                <Icon name="chevron" size={18} color={C.muted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },

  topBar: {
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     8,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  topRight: { flexDirection: 'row', gap: 8 },
  backBtn: {
    height:          44,
    paddingHorizontal: 14,
    paddingLeft:     10,
    borderWidth:     1.5,
    borderColor:     C.border,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
  },
  backLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  editBtn: {
    width:          44,
    height:         44,
    borderWidth:    1.5,
    borderColor:    C.border,
    alignItems:     'center',
    justifyContent: 'center',
  },

  heroRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               16,
    paddingHorizontal: 20,
    paddingVertical:   16,
  },
  avatar: {
    width:           72,
    height:          72,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  initials:  { fontFamily: FONT.black, fontSize: 26, color: '#0A0A0A' },
  heroInfo:  { flex: 1 },
  heroName: {
    fontFamily:    FONT.black,
    fontSize:      26,
    letterSpacing: -0.6,
    textTransform: 'uppercase',
    color:         C.ink,
    lineHeight:    26,
  },
  heroSince: {
    fontFamily: FONT.regular,
    fontSize:   13,
    color:      C.muted,
    marginTop:  4,
  },

  contactRow: {
    paddingHorizontal: 20,
    paddingBottom:     12,
    gap:               6,
  },
  contactBtn: {
    backgroundColor: C.accent,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    paddingHorizontal: 16,
    paddingVertical:  12,
  },
  contactBtnLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         '#0A0A0A',
    letterSpacing: 0.3,
  },
  contactBtnOutline: {
    borderWidth:     1.5,
    borderColor:     C.border,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    paddingHorizontal: 16,
    paddingVertical:  12,
  },
  contactBtnOutlineLabel: {
    fontFamily: FONT.semibold,
    fontSize:   14,
    color:      C.ink,
    flex:       1,
  },

  statsRow: {
    flexDirection:     'row',
    gap:               4,
    paddingHorizontal: 20,
    paddingBottom:     20,
  },
  statBox: {
    flex:            1,
    backgroundColor: C.surface,
    padding:         10,
    paddingHorizontal: 12,
  },
  statLbl: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statVal: { fontFamily: FONT.black, fontSize: 18, color: C.ink, marginTop: 2 },

  sectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingBottom:     8,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    paddingTop:        16,
  },
  sectionLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         C.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  newJobBtn: {
    backgroundColor: C.accent,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingHorizontal: 14,
    paddingVertical:   8,
  },
  newJobLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         '#0A0A0A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  jobsList: { paddingHorizontal: 20, gap: 4 },
  jobCard: {
    backgroundColor: C.surface,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    borderRadius:    2,
  },
  jobStrip: { width: 4, alignSelf: 'stretch' },
  jobBody: { flex: 1, padding: 12, paddingHorizontal: 14 },
  jobTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  jobStatus: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  jobPrice: {
    fontFamily: FONT.black,
    fontSize:   14,
    color:      C.ink,
  },
  jobTitle: {
    fontFamily:    FONT.extrabold,
    fontSize:      15,
    color:         C.ink,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
    marginTop:     3,
  },
  jobAddr: {
    fontFamily: FONT.regular,
    fontSize:   12,
    color:      C.muted,
    marginTop:  2,
  },
  empty: {
    fontFamily: FONT.semibold,
    fontSize:   14,
    color:      C.muted,
    paddingVertical: 20,
  },
});
