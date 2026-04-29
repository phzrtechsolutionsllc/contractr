import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, FONT } from '@/lib/constants';

interface HeaderProps {
  title: string;
  sub?: string;
  trailing?: React.ReactNode;
}

export function Header({ title, sub, trailing }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {sub && <Text style={styles.sub}>{sub}</Text>}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: { flex: 1, minWidth: 0 },
  sub: {
    fontFamily: FONT.extrabold,
    fontSize: 12,
    color: C.accent,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: FONT.black,
    fontSize: 38,
    color: C.ink,
    letterSpacing: -1.2,
    lineHeight: 36,
    textTransform: 'uppercase',
  },
});
