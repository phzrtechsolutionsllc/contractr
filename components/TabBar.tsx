import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from './ui/Icon';
import { C, FONT } from '@/lib/constants';

interface TabBarProps {
  state: { index: number };
  navigation: { navigate: (name: string) => void };
  insets: { bottom: number };
}

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index',     label: 'Today',  icon: 'home' },
  { name: 'jobs',      label: 'Jobs',   icon: 'jobs' },
  { name: 'customers', label: 'People', icon: 'people' },
  { name: 'schedule',  label: 'Week',   icon: 'calendar' },
];

export function TabBar({ state, navigation, insets }: TabBarProps) {
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab, i) => {
        const on = state.index === i;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(tab.name)}
          >
            {on && <View style={styles.activeBar} />}
            <Icon name={tab.icon} size={28} stroke={on ? 2.5 : 2} color={on ? C.accent : C.muted} />
            <Text style={[styles.label, { color: on ? C.accent : C.muted }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#16181C',
    borderTopWidth: 2,
    borderTopColor: C.accent,
    flexDirection: 'row',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: C.accent,
  },
  label: {
    fontFamily: FONT.extrabold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
