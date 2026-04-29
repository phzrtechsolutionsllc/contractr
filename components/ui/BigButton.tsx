import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Icon, type IconName } from './Icon';
import { C, FONT } from '@/lib/constants';

interface BigButtonProps {
  children: string;
  icon?: IconName;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

export function BigButton({ children, icon, onPress, style, variant = 'primary' }: BigButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, style]}
    >
      {icon && <Icon name={icon} size={26} stroke={2.5} color={isPrimary ? '#0A0A0A' : C.ink} />}
      <Text style={[styles.label, { color: isPrimary ? '#0A0A0A' : C.ink }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 72,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primary:   { backgroundColor: C.accent },
  secondary: { backgroundColor: C.surface2 },
  label: {
    fontFamily: FONT.extrabold,
    fontSize: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
