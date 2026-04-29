import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, FONT } from '@/lib/constants';
import { Header } from '../ui/Header';

const WEEK: { d: number; w: string; jobs: number; today?: boolean }[] = [
  { d: 20, w: 'MON', jobs: 1 },
  { d: 21, w: 'TUE', jobs: 3 },
  { d: 22, w: 'WED', jobs: 1 },
  { d: 23, w: 'THU', jobs: 2, today: true },
  { d: 24, w: 'FRI', jobs: 0 },
  { d: 25, w: 'SAT', jobs: 0 },
  { d: 26, w: 'SUN', jobs: 0 },
];

export function Schedule() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header sub="Apr 20 — 26" title="This week" />
      <View style={styles.list}>
        {WEEK.map(day => (
          <View key={day.d} style={[styles.row, day.today && styles.rowToday]}>
            <View style={styles.dateCol}>
              <Text style={[styles.weekday, { color: day.today ? 'rgba(0,0,0,0.6)' : C.muted }]}>
                {day.w}
              </Text>
              <Text style={[styles.dayNum, { color: day.today ? '#0A0A0A' : C.ink }]}>
                {day.d}
              </Text>
            </View>
            <View style={styles.dayInfo}>
              <Text style={[styles.jobCount, { color: day.today ? '#0A0A0A' : C.ink }]}>
                {day.jobs === 0 ? 'Open' : `${day.jobs} ${day.jobs === 1 ? 'job' : 'jobs'}`}
              </Text>
              {day.today && (
                <Text style={styles.todayDetail}>Cabinet install · Supply run · Walk-thru</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { paddingBottom: 24 },
  list:     { paddingHorizontal: 20, gap: 4 },
  row: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    padding: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  rowToday: { backgroundColor: C.accent },
  dateCol:  { width: 56 },
  weekday: {
    fontFamily: FONT.black,
    fontSize: 11,
    letterSpacing: 1,
  },
  dayNum: {
    fontFamily: FONT.black,
    fontSize: 32,
    lineHeight: 30,
    marginTop: 2,
  },
  dayInfo:  { flex: 1, minWidth: 0 },
  jobCount: {
    fontFamily: FONT.extrabold,
    fontSize: 14,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  todayDetail: {
    fontFamily: FONT.bold,
    fontSize: 12,
    color: '#0A0A0A',
    marginTop: 2,
  },
});
