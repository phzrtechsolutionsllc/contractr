import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { C, FONT } from '@/lib/constants';
import { Icon } from './Icon';

interface VoiceNotePlayerProps {
  uri: string;
  label?: string;
}

export function VoiceNotePlayer({ uri, label }: VoiceNotePlayerProps) {
  const player = useAudioPlayer(uri);

  async function handlePress() {
    if (player.playing) {
      player.pause();
    } else {
      if (player.duration > 0 && player.currentTime >= player.duration - 0.1) {
        await player.seekTo(0);
      }
      player.play();
    }
  }

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={[styles.btn, player.playing && styles.btnActive]}>
        <Icon
          name={player.playing ? 'pause' : 'play'}
          size={14}
          stroke={2}
          color="#0A0A0A"
        />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  btn: {
    width: 32,
    height: 32,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: C.surface2,
  },
  label: {
    fontFamily: FONT.semibold,
    fontSize: 12,
    color: C.muted,
  },
});
