import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { C, FONT } from '@/lib/constants';
import { useJobs, clockIn, clockOut, addPhotoEntry, addVoiceEntry } from '@/db/hooks';
import { Icon } from '../ui/Icon';
import { SyncBadge } from '../ui/SyncBadge';
import { BigButton } from '../ui/BigButton';
import { Header } from '../ui/Header';
import { RecordingOverlay } from '../RecordingOverlay';

const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function parseDue(due: string) {
  const [m, d] = due.split(' ');
  return { month: m?.toUpperCase() ?? '', day: d ?? '' };
}

function fmtClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function Today() {
  const router = useRouter();
  const jobs   = useJobs();

  const now      = new Date();
  const dayLabel = `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  const inProgress = jobs.find(j => j.status === 'in-progress');
  const next       = jobs.find(j => j.status === 'scheduled');

  // Tick every second when clocked in — actual elapsed computed from clockedInAt
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!inProgress?.clockedInAt) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [inProgress?.clockedInAt]);

  const sessionSecs  = inProgress?.clockedInAt
    ? Math.floor((Date.now() - inProgress.clockedInAt) / 1000)
    : 0;
  const clockSeconds = Math.round((inProgress?.hours ?? 0) * 3600) + sessionSecs;

  // --- Clock In / Out ---
  const handleClockIn = useCallback(() => {
    if (!inProgress) {
      // clock in to the next scheduled job
      if (next) {
        clockIn(next.id);
      } else {
        Alert.alert('No job to clock into', 'Create or schedule a job first.');
      }
      return;
    }
    clockIn(inProgress.id);
  }, [inProgress, next]);

  const handleClockOut = useCallback(() => {
    if (!inProgress?.clockedInAt) return;
    clockOut(inProgress.id, inProgress.clockedInAt);
  }, [inProgress]);

  // --- Snap Photo ---
  const handleSnapPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access required', 'Go to Settings to allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (inProgress) {
        addPhotoEntry(inProgress.id, uri);
        Alert.alert('Photo saved', `Added to ${inProgress.title}`, [{ text: 'OK' }]);
      } else {
        Alert.alert('Photo captured', 'No active job — photo not linked.', [{ text: 'OK' }]);
      }
    }
  }, [inProgress]);

  // --- Voice Recording ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording,  setIsRecording]  = useState(false);
  const [recordSecs,   setRecordSecs]   = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const handleVoiceNote = useCallback(async () => {
    const { status } = await requestRecordingPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone access required', 'Go to Settings to allow microphone access.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordSecs(0);
    setIsRecording(true);
    recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    clearInterval(recordTimerRef.current);
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    const uri      = recorder.uri;
    const duration = recordSecs;
    setIsRecording(false);
    setRecordSecs(0);
    if (uri && inProgress) {
      addVoiceEntry(inProgress.id, uri, duration);
      const mins = Math.floor(duration / 60);
      const secs = (duration % 60).toString().padStart(2, '0');
      Alert.alert('Voice note saved', `${mins}:${secs} · ${inProgress.title}`, [{ text: 'OK' }]);
    }
  }, [recorder, recordSecs, inProgress]);

  const isClockedIn = Boolean(inProgress?.clockedInAt);

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Header sub={dayLabel} title="Clock in" trailing={<SyncBadge state="synced" compact />} />

        {/* Live job card */}
        {inProgress && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/job/${inProgress.id}`)}
              style={styles.liveCard}
            >
              <Text style={styles.livePulse}>
                {isClockedIn ? '● LIVE · ON THE CLOCK' : '○ IN PROGRESS · NOT CLOCKED IN'}
              </Text>
              <Text style={styles.liveTitle}>{inProgress.title}</Text>
              <Text style={styles.liveCustomer}>{inProgress.customer.toUpperCase()}</Text>
              <View style={styles.liveStats}>
                <View style={styles.liveStat}>
                  <Text style={styles.liveStatLabel}>Elapsed</Text>
                  <Text style={styles.liveStatVal}>{fmtClock(clockSeconds)}</Text>
                </View>
                <View style={styles.liveStat}>
                  <Text style={styles.liveStatLabel}>Photos</Text>
                  <Text style={styles.liveStatVal}>{inProgress.photos}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick actions */}
        <View style={[styles.section, styles.actions]}>
          <BigButton icon="camera" variant="secondary" onPress={handleSnapPhoto}>
            Snap photo
          </BigButton>
          <BigButton icon="mic" variant="secondary" onPress={handleVoiceNote}>
            Voice note
          </BigButton>
          {isClockedIn ? (
            <BigButton icon="clock" variant="secondary" onPress={handleClockOut}>
              Clock out
            </BigButton>
          ) : (
            <BigButton
              icon={inProgress ? 'clock' : 'plus'}
              onPress={inProgress ? handleClockIn : () => router.push('/new-job')}
            >
              {inProgress ? 'Clock in' : 'New job'}
            </BigButton>
          )}
        </View>

        {/* Up next */}
        {next && !inProgress && (
          <View style={styles.section}>
            <View style={styles.upNextDivider}>
              <Text style={styles.sectionLabel}>Up next</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/job/${next.id}`)}
              style={styles.nextCard}
            >
              <View style={styles.nextDate}>
                <Text style={styles.nextDateMonth}>{parseDue(next.due).month}</Text>
                <Text style={styles.nextDateDay}>{parseDue(next.due).day}</Text>
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextTitle} numberOfLines={1}>{next.title}</Text>
                <Text style={styles.nextSub}>{next.customer} · 8:00 AM</Text>
              </View>
              <Icon name="chevron" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <RecordingOverlay visible={isRecording} seconds={recordSecs} onStop={handleStopRecording} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { paddingBottom: 24 },
  section:  { paddingHorizontal: 20, paddingBottom: 16 },
  actions:  { gap: 8 },
  liveCard: { backgroundColor: C.accent, padding: 20, borderRadius: 2 },
  livePulse: {
    fontFamily:    FONT.black,
    fontSize:      11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color:         '#0A0A0A',
    marginBottom:  8,
  },
  liveTitle: {
    fontFamily:    FONT.black,
    fontSize:      26,
    lineHeight:    26,
    letterSpacing: -0.6,
    textTransform: 'uppercase',
    color:         '#0A0A0A',
  },
  liveCustomer: {
    fontFamily: FONT.bold,
    fontSize:   15,
    color:      '#0A0A0A',
    marginTop:  6,
  },
  liveStats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  liveStat: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding:         10,
    paddingHorizontal: 12,
    borderRadius:    2,
  },
  liveStatLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color:         'rgba(0,0,0,0.7)',
    marginBottom:  2,
  },
  liveStatVal: { fontFamily: FONT.black, fontSize: 22, color: '#0A0A0A' },
  upNextDivider: {
    borderTopWidth:  1,
    borderTopColor:  C.border,
    paddingTop:      16,
    marginBottom:    10,
  },
  sectionLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         C.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  nextCard: {
    backgroundColor: C.surface,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         16,
    flexDirection:   'row',
    gap:             14,
    alignItems:      'center',
    borderRadius:    2,
  },
  nextDate: {
    width:           56,
    paddingVertical: 10,
    backgroundColor: C.bg,
    borderRadius:    2,
    alignItems:      'center',
    flexShrink:      0,
  },
  nextDateMonth: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.accent,
    letterSpacing: 0.8,
  },
  nextDateDay: {
    fontFamily: FONT.black,
    fontSize:   24,
    lineHeight: 24,
    color:      C.ink,
  },
  nextInfo:  { flex: 1, minWidth: 0 },
  nextTitle: {
    fontFamily:    FONT.extrabold,
    fontSize:      16,
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    color:         C.ink,
  },
  nextSub: {
    fontFamily: FONT.regular,
    fontSize:   13,
    color:      C.muted,
    marginTop:  3,
  },
});
