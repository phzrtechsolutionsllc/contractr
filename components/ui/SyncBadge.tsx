import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { C, FONT } from '@/lib/constants';
import type { SyncState } from '@/lib/types';

interface SyncBadgeProps {
  state?: SyncState;
  compact?: boolean;
}

const CFG: Record<SyncState, { icon: 'cloud' | 'wifioff'; label: string; color: string }> = {
  synced:  { icon: 'cloud',   label: 'Synced',     color: C.muted },
  syncing: { icon: 'cloud',   label: 'Syncing 3…', color: C.accent },
  offline: { icon: 'wifioff', label: 'Offline',    color: '#B14A2B' },
};

export function SyncBadge({ state = 'synced', compact = false }: SyncBadgeProps) {
  const cfg = CFG[state];
  return (
    <View style={styles.container}>
      <Icon name={cfg.icon} size={14} stroke={2} color={cfg.color} />
      {!compact && <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontFamily: FONT.semibold, fontSize: 12, letterSpacing: 0.2 },
});
