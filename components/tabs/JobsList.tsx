import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { C, FONT, STATUS_LABEL, STATUS_COLOR, money } from '@/lib/constants';
import { useJobs } from '@/db/hooks';
import type { StatusId } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Header } from '../ui/Header';

type FilterId = 'all' | StatusId;

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'new',         label: 'New' },
  { id: 'quote-sent',  label: 'Quote' },
  { id: 'scheduled',   label: 'Scheduled' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done',        label: 'Done' },
];

export function JobsList() {
  const router = useRouter();
  const jobs   = useJobs();
  const [filter, setFilter] = useState<FilterId>('all');

  const visible = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={[0]}>
        {/* Sticky header + filter bar */}
        <View style={styles.stickyBlock}>
          <Header
            sub={`${visible.length} of ${jobs.length} jobs`}
            title="Jobs"
            trailing={
              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/new-job')}
              >
                <Icon name="plus" size={28} stroke={2.5} color="#0A0A0A" />
              </TouchableOpacity>
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
            {FILTERS.map(f => {
              const active = filter === f.id;
              const count  = f.id === 'all' ? jobs.length : jobs.filter(j => j.status === f.id).length;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setFilter(f.id)}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
                      <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Job cards */}
        <View style={styles.list}>
          {visible.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No jobs here</Text>
              <Text style={styles.emptySub}>
                {filter === 'all' ? 'Tap + to create your first job' : `No ${STATUS_LABEL[filter as StatusId]} jobs`}
              </Text>
            </View>
          )}
          {visible.map(job => {
            const sc  = STATUS_COLOR[job.status];
            const pct = job.hoursEst > 0
              ? Math.min(1, job.hours / job.hoursEst)
              : job.status === 'done' ? 1 : 0;

            return (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/job/${job.id}`)}
                style={styles.card}
              >
                <View style={[styles.statusStrip, { backgroundColor: sc }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardLeft}>
                      <Text style={[styles.statusLabel, { color: sc }]}>{STATUS_LABEL[job.status]}</Text>
                      <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                      <Text style={styles.jobSub} numberOfLines={1}>{job.customer}</Text>
                    </View>
                    <View style={styles.cardRight}>
                      {job.price > 0 && (
                        <>
                          <Text style={styles.priceLabel}>Value</Text>
                          <Text style={styles.priceVal}>{money(job.price)}</Text>
                        </>
                      )}
                      {job.due !== '—' && (
                        <Text style={styles.dueLabel}>{job.due}</Text>
                      )}
                    </View>
                  </View>

                  {/* Stats row */}
                  <View style={styles.metaRow}>
                    {job.address !== '—' && (
                      <View style={styles.metaItem}>
                        <Icon name="pin" size={11} stroke={2} color={C.muted} />
                        <Text style={styles.metaText} numberOfLines={1}>{job.address}</Text>
                      </View>
                    )}
                    {job.materials > 0 && (
                      <View style={styles.metaItem}>
                        <Icon name="hammer" size={11} stroke={2} color={C.muted} />
                        <Text style={styles.metaText}>{job.materials} materials</Text>
                      </View>
                    )}
                    {job.photos > 0 && (
                      <View style={styles.metaItem}>
                        <Icon name="camera" size={11} stroke={2} color={C.muted} />
                        <Text style={styles.metaText}>{job.photos}</Text>
                      </View>
                    )}
                  </View>

                  {pct > 0 && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
                      </View>
                      <Text style={styles.progressLabel}>{job.hours}h / {job.hoursEst}h</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  stickyBlock:  { backgroundColor: C.bg },
  filterScroll: { marginBottom: 12 },
  filterRow: {
    paddingHorizontal: 20,
    gap:               6,
    paddingRight:      20,
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 12,
    paddingVertical:   7,
    borderWidth:       1.5,
    borderColor:       C.border,
  },
  chipActive: {
    backgroundColor: C.accent,
    borderColor:     C.accent,
  },
  chipLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         C.muted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  chipLabelActive: { color: '#0A0A0A' },
  chipBadge: {
    backgroundColor: C.surface2,
    paddingHorizontal: 5,
    paddingVertical:   1,
    borderRadius:      2,
  },
  chipBadgeActive:     { backgroundColor: 'rgba(0,0,0,0.15)' },
  chipBadgeText:       { fontFamily: FONT.black, fontSize: 10, color: C.muted },
  chipBadgeTextActive: { color: '#0A0A0A' },

  list:  { paddingHorizontal: 20, gap: 6 },
  addBtn: {
    width:           54,
    height:          54,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  card:        { backgroundColor: C.surface, borderRadius: 2, overflow: 'hidden' },
  statusStrip: { height: 5 },
  cardBody:    { padding: 14, paddingHorizontal: 16 },
  cardTop: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    justifyContent:  'space-between',
    gap:             10,
  },
  cardLeft:  { flex: 1, minWidth: 0 },
  cardRight: { alignItems: 'flex-end', flexShrink: 0 },
  statusLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  jobTitle: {
    fontFamily:    FONT.black,
    fontSize:      19,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
    lineHeight:    21,
    marginTop:     3,
    color:         C.ink,
  },
  jobSub: {
    fontFamily: FONT.regular,
    fontSize:   13,
    color:      C.muted,
    marginTop:  3,
  },
  priceLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  priceVal:  { fontFamily: FONT.black, fontSize: 18, color: C.ink },
  dueLabel: {
    fontFamily:  FONT.semibold,
    fontSize:    12,
    color:       C.muted,
    marginTop:   4,
  },

  metaRow: {
    flexDirection: 'row',
    gap:           12,
    marginTop:     8,
    flexWrap:      'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  metaText: {
    fontFamily: FONT.regular,
    fontSize:   12,
    color:      C.muted,
  },

  progressRow: {
    marginTop:     10,
    flexDirection: 'row',
    gap:           10,
    alignItems:    'center',
  },
  progressTrack: {
    flex:            1,
    height:          6,
    backgroundColor: C.bg,
    borderRadius:    2,
    overflow:        'hidden',
  },
  progressFill:  { height: '100%', backgroundColor: C.accent },
  progressLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      11,
    color:         C.muted,
    letterSpacing: 0.5,
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
    textAlign:  'center',
  },
});
