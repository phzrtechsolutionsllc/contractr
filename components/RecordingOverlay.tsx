import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { C, FONT } from '@/lib/constants';
import { Icon } from './ui/Icon';

interface RecordingOverlayProps {
  visible: boolean;
  seconds: number;
  onStop: () => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function RecordingOverlay({ visible, seconds, onStop }: RecordingOverlayProps) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible]);

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />
          <Text style={styles.label}>Recording</Text>
          <Text style={styles.timer}>{fmt(seconds)}</Text>
          <TouchableOpacity style={styles.stopBtn} onPress={onStop} activeOpacity={0.85}>
            <Icon name="check" size={24} stroke={3} color="#0A0A0A" />
            <Text style={styles.stopLabel}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 260,
    backgroundColor: C.surface,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 3,
    borderTopColor: C.accent,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E84040',
  },
  label: {
    fontFamily: FONT.extrabold,
    fontSize: 11,
    color: C.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timer: {
    fontFamily: FONT.black,
    fontSize: 52,
    color: C.ink,
    letterSpacing: -2,
    lineHeight: 52,
  },
  stopBtn: {
    marginTop: 8,
    width: '100%',
    height: 60,
    backgroundColor: C.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stopLabel: {
    fontFamily: FONT.extrabold,
    fontSize: 16,
    color: '#0A0A0A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
