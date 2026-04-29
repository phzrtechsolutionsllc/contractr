import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { C, FONT, STATUS_COLOR, STATUS_LABEL } from '@/lib/constants';
import { useJobs } from '@/db/hooks';
import type { Job } from '@/lib/types';
import { Icon } from '../ui/Icon';
import { Header } from '../ui/Header';

// ---- Date helpers ----

const MONTH_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4,  Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

function getMonday(base: Date): Date {
  const d   = new Date(base);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseDue(due: string): Date | null {
  if (!due || due === '—') return null;
  const parts = due.trim().split(' ');
  const month = MONTH_IDX[parts[0]];
  const day   = parseInt(parts[1], 10);
  if (month === undefined || isNaN(day)) return null;
  // New format: "Apr 30 2026" — use stored year
  if (parts.length >= 3) {
    const year = parseInt(parts[2], 10);
    if (!isNaN(year)) return new Date(year, month, day, 0, 0, 0, 0);
  }
  // Legacy format: "Apr 25" — infer year
  const now  = new Date();
  let year   = now.getFullYear();
  if (month < now.getMonth() - 2) year += 1;
  return new Date(year, month, day, 0, 0, 0, 0);
}

function weekRangeLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sm = MONTH_SHORT[monday.getMonth()];
  const em = MONTH_SHORT[sunday.getMonth()];
  if (sm === em) return `${sm} ${monday.getDate()}–${sunday.getDate()}`;
  return `${sm} ${monday.getDate()} – ${em} ${sunday.getDate()}`;
}

// ---- Component ----

export function Schedule() {
  const router       = useRouter();
  const jobs         = useJobs();
  const [offset, setOffset] = useState(0);     // week offset from current week

  const today       = new Date();
  today.setHours(0, 0, 0, 0);
  const weekMonday  = addDays(getMonday(today), offset * 7);
  const weekDays    = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));

  const isCurrentWeek = offset === 0;
  const weekLabel     = weekRangeLabel(weekMonday);
  const titleLabel    = offset === 0 ? 'This week'
                      : offset === 1 ? 'Next week'
                      : offset === -1 ? 'Last week'
                      : weekLabel;

  // Map each day to its jobs (keyed by due date)
  const daySlots = weekDays.map((day, i) => {
    const dayJobs = jobs.filter(j => {
      const d = parseDue(j.due);
      return d !== null && sameDay(d, day);
    });
    return {
      date:    day,
      label:   WEEKDAY_LABELS[i],
      isToday: sameDay(day, today),
      isPast:  day < today && !sameDay(day, today),
      jobs:    dayJobs,
    };
  });

  const totalJobs = daySlots.reduce((s, d) => s + d.jobs.length, 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header
        sub={weekLabel}
        title={titleLabel}
        trailing={
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setOffset(o => o - 1)}
              activeOpacity={0.8}
            >
              <Icon name="chevron" size={20} color={C.ink} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            {!isCurrentWeek && (
              <TouchableOpacity
                style={styles.todayPill}
                onPress={() => setOffset(0)}
                activeOpacity={0.8}
              >
                <Text style={styles.todayPillLabel}>Today</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => setOffset(o => o + 1)}
              activeOpacity={0.8}
            >
              <Icon name="chevron" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Week summary strip */}
      <View style={styles.summaryStrip}>
        <Text style={styles.summaryText}>
          {totalJobs === 0
            ? 'No jobs scheduled'
            : `${totalJobs} job${totalJobs > 1 ? 's' : ''} scheduled`}
        </Text>
        {totalJobs > 0 && (
          <View style={styles.summaryDots}>
            {daySlots.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  s.jobs.length > 0 && styles.dotFilled,
                  s.isToday && styles.dotToday,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Day rows */}
      <View style={styles.list}>
        {daySlots.map((slot, i) => (
          <View
            key={i}
            style={[
              styles.dayRow,
              slot.isToday  && styles.dayRowToday,
              slot.isPast   && styles.dayRowPast,
            ]}
          >
            {/* Date column */}
            <View style={[styles.dateCol, slot.isToday && styles.dateColToday]}>
              <Text style={[
                styles.weekdayLabel,
                slot.isToday && styles.textDark,
                slot.isPast  && styles.textDim,
              ]}>
                {slot.label}
              </Text>
              <Text style={[
                styles.dayNum,
                slot.isToday && styles.dayNumToday,
                slot.isPast  && styles.textDim,
              ]}>
                {slot.date.getDate()}
              </Text>
              {slot.isToday && <View style={styles.todayBar} />}
            </View>

            {/* Content column */}
            <View style={styles.dayContent}>
              {slot.jobs.length === 0 ? (
                <Text style={[
                  styles.openLabel,
                  slot.isToday && styles.textDark,
                  slot.isPast  && styles.textDim,
                ]}>
                  {slot.isPast ? '—' : 'Open'}
                </Text>
              ) : (
                <View style={styles.jobList}>
                  {slot.jobs.map(job => (
                    <JobChip
                      key={job.id}
                      job={job}
                      onToday={slot.isToday}
                      onPress={() => router.push(`/job/${job.id}`)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---- Job chip ----

interface ChipProps {
  job: Job;
  onToday: boolean;
  onPress: () => void;
}

function JobChip({ job, onToday, onPress }: ChipProps) {
  const sc = STATUS_COLOR[job.status];
  return (
    <TouchableOpacity
      style={[styles.chip, onToday && styles.chipToday]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.chipBar, { backgroundColor: onToday ? 'rgba(0,0,0,0.25)' : sc }]} />
      <View style={styles.chipBody}>
        <Text
          style={[styles.chipTitle, onToday && styles.textDark]}
          numberOfLines={1}
        >
          {job.title}
        </Text>
        <View style={styles.chipMeta}>
          <Text style={[styles.chipCustomer, onToday ? styles.textDarkSoft : {}]} numberOfLines={1}>
            {job.customer}
          </Text>
          {job.hoursEst > 0 && (
            <Text style={[styles.chipHours, onToday ? styles.textDarkSoft : {}]}>
              {job.hoursEst}h est
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.chipStatus, { borderColor: onToday ? 'rgba(0,0,0,0.2)' : C.border }]}>
        <Text style={[styles.chipStatusText, { color: onToday ? 'rgba(0,0,0,0.6)' : sc }]}>
          {STATUS_LABEL[job.status]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---- Styles ----

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
    borderColor:    C.border,
  },
  todayPill: {
    paddingHorizontal: 12,
    paddingVertical:   10,
    borderWidth:       1.5,
    borderColor:       C.accent,
  },
  todayPillLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         C.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  summaryStrip: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingBottom:     12,
  },
  summaryText: {
    fontFamily:    FONT.extrabold,
    fontSize:      11,
    color:         C.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  summaryDots: { flexDirection: 'row', gap: 4 },
  dot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: C.surface2,
  },
  dotFilled: { backgroundColor: C.inkSoft },
  dotToday:  { backgroundColor: C.accent },

  list:   { paddingHorizontal: 20, gap: 3 },
  dayRow: {
    backgroundColor: C.surface,
    flexDirection:   'row',
    overflow:        'hidden',
    borderRadius:    2,
  },
  dayRowToday: { backgroundColor: C.accent },
  dayRowPast:  { opacity: 0.55 },

  dateCol: {
    width:          68,
    paddingVertical: 14,
    paddingLeft:    16,
    flexShrink:     0,
    position:       'relative',
  },
  dateColToday: {},
  weekdayLabel: {
    fontFamily:    FONT.black,
    fontSize:      10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color:         C.muted,
  },
  dayNum: {
    fontFamily: FONT.black,
    fontSize:   34,
    lineHeight: 32,
    marginTop:  2,
    color:      C.ink,
  },
  dayNumToday: { color: '#0A0A0A' },
  todayBar: {
    position:        'absolute',
    bottom:          0,
    left:            16,
    width:           24,
    height:          3,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  dayContent: {
    flex:          1,
    paddingRight:  12,
    paddingLeft:   4,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  openLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         C.muted,
    letterSpacing: 0.3,
  },
  jobList: { gap: 4 },

  // text helpers for today (dark bg) and past (dimmed)
  textDark:     { color: '#0A0A0A' },
  textDarkSoft: { color: 'rgba(0,0,0,0.6)' },
  textDim:      { color: C.muted },

  // Job chip
  chip: {
    backgroundColor: C.surface2,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    borderRadius:    2,
  },
  chipToday: { backgroundColor: 'rgba(0,0,0,0.12)' },
  chipBar:   { width: 4, alignSelf: 'stretch' },
  chipBody: {
    flex:            1,
    paddingVertical:  8,
    paddingLeft:     10,
    paddingRight:    8,
    minWidth:        0,
  },
  chipTitle: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         C.ink,
    letterSpacing: -0.1,
    textTransform: 'uppercase',
  },
  chipMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginTop:     2,
  },
  chipCustomer: {
    fontFamily: FONT.regular,
    fontSize:   12,
    color:      C.muted,
    flex:       1,
  },
  chipHours: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.muted,
    letterSpacing: 0.5,
  },
  chipStatus: {
    borderWidth:       1,
    borderRadius:      2,
    paddingHorizontal: 6,
    paddingVertical:   3,
    marginRight:       10,
    flexShrink:        0,
  },
  chipStatusText: {
    fontFamily:    FONT.extrabold,
    fontSize:      9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
