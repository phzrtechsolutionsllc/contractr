import React from 'react';
import { View, Text } from 'react-native';
import { FONT } from '@/lib/constants';

interface PhotoPhProps {
  w?: number;
  h?: number;
  label?: string;
  tint?: string;
  radius?: number;
}

export function PhotoPh({ w = 100, h = 100, label, tint = '#2A3648', radius = 8 }: PhotoPhProps) {
  return (
    <View style={{ width: w, height: h, borderRadius: radius, backgroundColor: tint, flexShrink: 0, justifyContent: 'center', alignItems: 'center' }}>
      {label && (
        <Text style={{ fontFamily: FONT.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center', paddingHorizontal: 6 }}>
          {label}
        </Text>
      )}
    </View>
  );
}
