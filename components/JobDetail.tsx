import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Image, TextInput, Modal, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { C, FONT, STATUS_LABEL, STATUS_COLOR, money } from '@/lib/constants';
import {
  useJobTimeline, useJobMaterials, useCustomer,
  clockIn, clockOut, updateStatus, updateJob,
  addPhotoEntry, addVoiceEntry,
  addMaterial, toggleMaterialGot, deleteMaterial,
} from '@/db/hooks';
import type { Job, StatusId } from '@/lib/types';
import { Icon } from './ui/Icon';
import { SyncBadge } from './ui/SyncBadge';
import { BigButton } from './ui/BigButton';
import { PhotoPh } from './ui/PhotoPh';
import { VoiceNotePlayer } from './ui/VoiceNotePlayer';
import { RecordingOverlay } from './RecordingOverlay';

interface JobDetailProps {
  job: Job;
  sync?: 'synced' | 'syncing' | 'offline';
}

const KIND_ICON: Record<string, 'camera' | 'note' | 'mic' | 'check' | 'phone'> = {
  photo: 'camera', note: 'note', voice: 'mic', status: 'check', message: 'phone',
};

const TRANSITIONS: Partial<Record<StatusId, StatusId[]>> = {
  'new':         ['quote-sent', 'scheduled'],
  'quote-sent':  ['scheduled', 'done'],
  'scheduled':   ['in-progress'],
  'in-progress': ['done'],
};

export function JobDetail({ job, sync = 'synced' }: JobDetailProps) {
  const router    = useRouter();
  const timeline  = useJobTimeline(job.id);
  const materials = useJobMaterials(job.id);
  const customer  = useCustomer(job.customerId);
  const sc        = STATUS_COLOR[job.status];
  const nexts     = TRANSITIONS[job.status] ?? [];
  const isClockedIn = Boolean(job.clockedInAt);

  // ---- Phone / Map ----
  function handleCall() {
    const phone = customer?.phone;
    if (!phone) { Alert.alert('No phone number', 'Edit this customer to add one.'); return; }
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
  }

  function handleMap() {
    const addr = job.address !== '—' ? job.address : null;
    if (!addr) { Alert.alert('No address', 'Edit this job to add an address.'); return; }
    const encoded = encodeURIComponent(addr);
    Linking.openURL(`maps://?q=${encoded}`).catch(() =>
      Linking.openURL(`https://maps.apple.com/?q=${encoded}`)
    );
  }

  // ---- Notes ----
  const [notes, setNotes] = useState(job.desc ?? '');
  const notesRef = useRef(job.desc ?? '');

  function handleNotesSave() {
    const trimmed = notes.trim();
    if (trimmed !== (job.desc ?? '').trim()) {
      updateJob(job.id, { desc: trimmed });
    }
  }

  // ---- Status transitions ----
  const handleStatus = useCallback((next: StatusId) => {
    if (next === 'in-progress') {
      clockIn(job.id);
    } else {
      if (job.status === 'in-progress' && isClockedIn && job.clockedInAt) {
        clockOut(job.id, job.clockedInAt);
      }
      updateStatus(job.id, next);
    }
  }, [job, isClockedIn]);

  // ---- Clock In / Out ----
  const handleClockIn  = useCallback(() => clockIn(job.id), [job.id]);
  const handleClockOut = useCallback(() => {
    if (job.clockedInAt) clockOut(job.id, job.clockedInAt);
  }, [job]);

  // ---- Photo ----
  const handlePhoto = useCallback(async () => {
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
      addPhotoEntry(job.id, result.assets[0].uri);
    }
  }, [job.id]);

  // ---- Voice Recording ----
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs,  setRecordSecs]  = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const handleVoice = useCallback(async () => {
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
    const uri = recorder.uri;
    const dur = recordSecs;
    setIsRecording(false);
    setRecordSecs(0);
    if (uri) addVoiceEntry(job.id, uri, dur);
  }, [recorder, recordSecs, job.id]);

  // ---- Add Material Modal ----
  const [showAddMat,  setShowAddMat]  = useState(false);
  const [matName,     setMatName]     = useState('');
  const [matQty,      setMatQty]      = useState('');
  const [matSupplier, setMatSupplier] = useState('');
  const [matCost,     setMatCost]     = useState('');

  function handleAddMaterial() {
    if (!matName.trim()) return;
    addMaterial({
      jobId:    job.id,
      name:     matName.trim(),
      qty:      matQty.trim(),
      supplier: matSupplier.trim(),
      cost:     parseFloat(matCost) || 0,
    });
    setMatName(''); setMatQty(''); setMatSupplier(''); setMatCost('');
    setShowAddMat(false);
  }

  function confirmDeleteMaterial(id: number) {
    Alert.alert('Remove material?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMaterial(id, job.id) },
    ]);
  }

  const gotCount     = materials.filter(m => m.got).length;
  const pendingCount = materials.length - gotCount;

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Icon name="chevron" size={18} color={C.ink} style={{ transform: [{ rotate: '180deg' }] }} />
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/edit-job?id=${job.id}`)}
            >
              <Icon name="edit" size={16} stroke={2} color={C.ink} />
            </TouchableOpacity>
            <SyncBadge state={sync} />
          </View>
        </View>

        {/* Job header */}
        <View style={styles.jobHeader}>
          <Text style={[styles.statusLine, { color: sc }]}>● {STATUS_LABEL[job.status]}</Text>
          <Text style={styles.jobTitle}>{job.title}</Text>

          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{job.customer}</Text>
              <Text style={styles.customerAddr}>{job.address}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8} onPress={handleCall}>
              <Icon name="phone" size={22} stroke={2.5} color="#0A0A0A" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8} onPress={handleMap}>
              <Icon name="map" size={22} stroke={2} color={C.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {[
              { lbl: 'Hrs',   val: `${job.hours}/${job.hoursEst}` },
              { lbl: 'Value', val: job.price > 0 ? money(job.price) : '—' },
              { lbl: 'Due',   val: job.due },
            ].map(s => (
              <View key={s.lbl} style={styles.statBox}>
                <Text style={styles.statLabel}>{s.lbl}</Text>
                <Text style={styles.statVal}>{s.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status transitions */}
        {nexts.length > 0 && (
          <View style={styles.transitionRow}>
            {nexts.map(next => (
              <TouchableOpacity
                key={next}
                style={[styles.transitionChip, { borderColor: STATUS_COLOR[next] }]}
                onPress={() => handleStatus(next)}
                activeOpacity={0.8}
              >
                <Text style={[styles.transitionLabel, { color: STATUS_COLOR[next] }]}>
                  → {STATUS_LABEL[next]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Clock in/out */}
        {job.status === 'in-progress' && (
          <View style={styles.clockRow}>
            {isClockedIn ? (
              <TouchableOpacity style={styles.clockOutBtn} onPress={handleClockOut} activeOpacity={0.85}>
                <Icon name="clock" size={16} stroke={2.5} color={C.ink} />
                <Text style={[styles.clockBtnLabel, { color: C.ink }]}>Clock Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.clockInBtn} onPress={handleClockIn} activeOpacity={0.85}>
                <Icon name="clock" size={16} stroke={2.5} color="#0A0A0A" />
                <Text style={[styles.clockBtnLabel, { color: '#0A0A0A' }]}>Clock In</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={v => { setNotes(v); notesRef.current = v; }}
            onEndEditing={handleNotesSave}
            placeholder="Tap to add notes about this job..."
            placeholderTextColor={C.muted}
            multiline
            textAlignVertical="top"
            selectionColor={C.accent}
          />
        </View>

        {/* Materials */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionHeader}>Materials</Text>
              {materials.length > 0 && (
                <Text style={styles.sectionSub}>
                  {gotCount} got · {pendingCount} pending
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.addMatBtn} onPress={() => setShowAddMat(true)} activeOpacity={0.8}>
              <Icon name="plus" size={14} stroke={2.5} color="#0A0A0A" />
              <Text style={styles.addMatLabel}>Add</Text>
            </TouchableOpacity>
          </View>

          {materials.length === 0 && (
            <Text style={styles.emptySection}>No materials added yet</Text>
          )}

          <View style={styles.matList}>
            {materials.map(m => (
              <View key={m.id} style={styles.matRow}>
                <TouchableOpacity
                  style={[styles.matCheck, m.got && styles.matCheckDone]}
                  onPress={() => toggleMaterialGot(m.id, !m.got)}
                  activeOpacity={0.8}
                >
                  {m.got && <Icon name="check" size={12} stroke={3} color="#0A0A0A" />}
                </TouchableOpacity>
                <View style={styles.matInfo}>
                  <Text style={[styles.matName, m.got && styles.matNameDone]} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.matMeta} numberOfLines={1}>
                    {[m.qty, m.supplier, m.cost > 0 ? money(m.cost) : null].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.matDelete}
                  onPress={() => confirmDeleteMaterial(m.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="trash" size={14} stroke={2} color={C.muted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Activity Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Activity · {timeline.length}</Text>
          <View style={styles.timelineList}>
            <View style={styles.timelineLine} />
            {timeline.map((t, i) => {
              const isPhoto = t.kind === 'photo';
              const isVoice = t.kind === 'voice';
              return (
                <View key={t.id ?? i} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, isPhoto && styles.timelineDotPhoto]}>
                    <Icon
                      name={KIND_ICON[t.kind] ?? 'note'}
                      size={12}
                      stroke={2.5}
                      color={isPhoto ? '#0A0A0A' : C.ink}
                    />
                  </View>
                  <View style={styles.timelineCard}>
                    <Text style={styles.timelineWhen}>{t.when}</Text>
                    <Text style={styles.timelineWhat}>{t.what}</Text>
                    {isPhoto && t.uri && (
                      <Image source={{ uri: t.uri }} style={styles.photoThumb} resizeMode="cover" />
                    )}
                    {isPhoto && !t.uri && t.n && (
                      <View style={styles.photoRow}>
                        {Array.from({ length: t.n }).map((_, k) => (
                          <PhotoPh key={k} w={52} h={52} tint={C.surface2} radius={2} />
                        ))}
                      </View>
                    )}
                    {isVoice && t.uri && <VoiceNotePlayer uri={t.uri} label={t.what} />}
                  </View>
                </View>
              );
            })}
            {timeline.length === 0 && (
              <Text style={styles.emptySection}>No activity yet</Text>
            )}
          </View>
        </View>

        {/* Bottom actions */}
        <View style={styles.actions}>
          <BigButton icon="camera" variant="secondary" style={{ flex: 1, height: 64 }} onPress={handlePhoto}>
            Photo
          </BigButton>
          <BigButton icon="mic" variant="secondary" style={{ flex: 1, height: 64 }} onPress={handleVoice}>
            Voice
          </BigButton>
        </View>
      </ScrollView>

      <RecordingOverlay visible={isRecording} seconds={recordSecs} onStop={handleStopRecording} />

      {/* Add Material Modal */}
      <Modal visible={showAddMat} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddMat(false)}>
        <View style={mat.root}>
          <View style={mat.header}>
            <Text style={mat.title}>Add Material</Text>
            <TouchableOpacity onPress={() => setShowAddMat(false)} style={mat.closeBtn} activeOpacity={0.8}>
              <Icon name="x" size={20} color={C.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={mat.form} keyboardShouldPersistTaps="handled">
            {[
              { label: 'Item Name *', value: matName,     set: setMatName,     placeholder: 'e.g. 2×4 Lumber', kb: 'default' as const, focus: true },
              { label: 'Qty',        value: matQty,      set: setMatQty,      placeholder: 'e.g. 10 pcs', kb: 'default' as const },
              { label: 'Supplier',   value: matSupplier, set: setMatSupplier, placeholder: 'e.g. Home Depot', kb: 'default' as const },
              { label: 'Cost ($)',   value: matCost,     set: setMatCost,     placeholder: '0', kb: 'decimal-pad' as const },
            ].map(f => (
              <View key={f.label} style={mat.fieldWrapper}>
                <Text style={mat.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={mat.fieldInput}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.muted}
                  keyboardType={f.kb}
                  autoCapitalize={f.kb === 'decimal-pad' ? 'none' : 'words'}
                  autoFocus={f.focus}
                  selectionColor={C.accent}
                  returnKeyType="next"
                />
              </View>
            ))}

            <TouchableOpacity
              style={[mat.saveBtn, !matName.trim() && mat.saveBtnDisabled]}
              onPress={handleAddMaterial}
              disabled={!matName.trim()}
              activeOpacity={0.85}
            >
              <Text style={mat.saveBtnLabel}>Add Material</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1 },
  content: { paddingBottom: 24 },

  topBar: {
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     8,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
  },
  backBtn: {
    height:            44,
    paddingHorizontal: 14,
    paddingLeft:       10,
    borderWidth:       1.5,
    borderColor:       C.border,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
  },
  backLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editBtn: {
    width:          44,
    height:         44,
    borderWidth:    1.5,
    borderColor:    C.border,
    alignItems:     'center',
    justifyContent: 'center',
  },

  jobHeader:     { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  statusLine: {
    fontFamily:    FONT.extrabold,
    fontSize:      11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  jobTitle: {
    fontFamily:    FONT.black,
    fontSize:      34,
    letterSpacing: -1,
    lineHeight:    32,
    textTransform: 'uppercase',
    color:         C.ink,
    marginTop:     6,
  },
  customerCard: {
    marginTop:         14,
    backgroundColor:   C.surface,
    padding:           14,
    paddingHorizontal: 16,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    borderLeftWidth:   4,
    borderLeftColor:   C.accent,
  },
  customerInfo: { flex: 1, minWidth: 0 },
  customerName: { fontFamily: FONT.extrabold, fontSize: 15, color: C.ink },
  customerAddr: { fontFamily: FONT.semibold, fontSize: 13, color: C.muted },
  callBtn: {
    width:           48,
    height:          48,
    backgroundColor: C.accent,
    alignItems:      'center',
    justifyContent:  'center',
  },
  mapBtn: {
    width:          48,
    height:         48,
    borderWidth:    1.5,
    borderColor:    C.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  statsGrid: { flexDirection: 'row', gap: 4, marginTop: 4 },
  statBox: {
    flex:              1,
    backgroundColor:   C.surface,
    padding:           10,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statVal: { fontFamily: FONT.black, fontSize: 18, color: C.ink, marginTop: 2 },

  transitionRow: {
    paddingHorizontal: 20,
    paddingBottom:     12,
    flexDirection:     'row',
    gap:               8,
    flexWrap:          'wrap',
  },
  transitionChip: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderWidth:       1.5,
  },
  transitionLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  clockRow:    { paddingHorizontal: 20, paddingBottom: 12 },
  clockInBtn: {
    height:          52,
    backgroundColor: C.accent,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             10,
  },
  clockOutBtn: {
    height:         52,
    borderWidth:    2,
    borderColor:    C.accent,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
  },
  clockBtnLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  section: {
    paddingHorizontal: 20,
    paddingBottom:     20,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    paddingTop:        16,
  },
  sectionRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  sectionHeader: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         C.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  10,
  },
  sectionSub: {
    fontFamily: FONT.regular,
    fontSize:   12,
    color:      C.muted,
    marginTop:  2,
  },
  emptySection: {
    fontFamily:    FONT.regular,
    fontSize:      14,
    color:         C.muted,
    paddingVertical: 4,
  },

  notesInput: {
    fontFamily:   FONT.regular,
    fontSize:     15,
    color:        C.ink,
    lineHeight:   22,
    minHeight:    72,
    backgroundColor: C.surface,
    padding:      14,
    textAlignVertical: 'top',
  },

  addMatBtn: {
    backgroundColor:   C.accent,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 12,
    paddingVertical:   7,
  },
  addMatLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      12,
    color:         '#0A0A0A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  matList: { gap: 2 },
  matRow: {
    backgroundColor: C.surface,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  matCheck: {
    width:           24,
    height:          24,
    borderWidth:     2,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  matCheckDone:  { backgroundColor: C.accent, borderColor: C.accent },
  matInfo:       { flex: 1, minWidth: 0 },
  matName: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         C.ink,
    letterSpacing: -0.1,
  },
  matNameDone: { color: C.muted, textDecorationLine: 'line-through' },
  matMeta: {
    fontFamily: FONT.regular,
    fontSize:   12,
    color:      C.muted,
    marginTop:  2,
  },
  matDelete: {
    width:          32,
    height:         32,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },

  timelineList:  { paddingLeft: 30 },
  timelineLine: {
    position:        'absolute',
    left:            29,
    top:             6,
    bottom:          6,
    width:           2,
    backgroundColor: C.border,
  },
  timelineRow:  { position: 'relative', paddingBottom: 14 },
  timelineDot: {
    position:        'absolute',
    left:            -30,
    top:             0,
    width:           20,
    height:          20,
    backgroundColor: C.surface2,
    borderWidth:     2,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  timelineDotPhoto:  { backgroundColor: C.accent, borderColor: C.accent },
  timelineCard:      { backgroundColor: C.surface, padding: 10, paddingHorizontal: 12 },
  timelineWhen: {
    fontFamily:    FONT.extrabold,
    fontSize:      11,
    color:         C.muted,
    letterSpacing: 0.5,
  },
  timelineWhat: {
    fontFamily: FONT.semibold,
    fontSize:   14,
    color:      C.ink,
    marginTop:  3,
    lineHeight: 19,
  },
  photoRow:  { flexDirection: 'row', gap: 4, marginTop: 8 },
  photoThumb: {
    width:           120,
    height:          90,
    marginTop:       8,
    borderRadius:    2,
    backgroundColor: C.surface2,
  },

  actions: {
    paddingHorizontal: 20,
    paddingBottom:     8,
    flexDirection:     'row',
    gap:               6,
  },
});

const mat = StyleSheet.create({
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
  title: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  form: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 4 },
  fieldWrapper: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  fieldLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom:  6,
  },
  fieldInput: { fontFamily: FONT.bold, fontSize: 18, color: C.ink, padding: 0 },
  saveBtn: {
    marginTop:       24,
    backgroundColor: C.accent,
    paddingVertical: 16,
    alignItems:      'center',
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      15,
    color:         '#0A0A0A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
