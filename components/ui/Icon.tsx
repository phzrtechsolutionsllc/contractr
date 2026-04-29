import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';
import { C } from '@/lib/constants';

export type IconName =
  | 'home' | 'jobs' | 'calendar' | 'people' | 'plus' | 'camera'
  | 'mic' | 'note' | 'phone' | 'map' | 'check' | 'clock' | 'chevron'
  | 'search' | 'dollar' | 'hammer' | 'settings' | 'cloud' | 'wifi'
  | 'wifioff' | 'truck' | 'pin' | 'edit' | 'filter' | 'more' | 'arrowR' | 'warning'
  | 'play' | 'pause' | 'trash' | 'x';

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

type IconDef = (col: string, sw: number) => React.ReactNode;

const p = (d: string, col: string, sw: number) => (
  <Path d={d} stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
);
const ci = (cx: number, cy: number, r: number, col: string, sw: number) => (
  <Circle cx={cx} cy={cy} r={r} stroke={col} strokeWidth={sw} fill="none" />
);
const re = (x: number, y: number, w: number, h: number, rx: number, col: string, sw: number) => (
  <Rect x={x} y={y} width={w} height={h} rx={rx} stroke={col} strokeWidth={sw} fill="none" />
);

const ICONS: Record<IconName, IconDef> = {
  home:     (col, sw) => p('M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z', col, sw),
  jobs:     (col, sw) => <>{re(3, 6, 18, 14, 2, col, sw)}{p('M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18', col, sw)}</>,
  calendar: (col, sw) => <>{re(3, 5, 18, 16, 2, col, sw)}{p('M3 9h18M8 3v4M16 3v4', col, sw)}</>,
  people:   (col, sw) => <>{ci(9, 8, 3.5, col, sw)}{p('M2 20a7 7 0 0 1 14 0', col, sw)}{ci(17, 9, 2.5, col, sw)}{p('M16 20a5 5 0 0 1 6-4.5', col, sw)}</>,
  plus:     (col, sw) => p('M12 5v14M5 12h14', col, sw),
  camera:   (col, sw) => <>{p('M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', col, sw)}{ci(12, 13, 3.5, col, sw)}</>,
  mic:      (col, sw) => <>{re(9, 3, 6, 12, 3, col, sw)}{p('M6 11a6 6 0 0 0 12 0M12 17v4', col, sw)}</>,
  note:     (col, sw) => <>{p('M5 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', col, sw)}{p('M8 12h8M8 16h5', col, sw)}</>,
  phone:    (col, sw) => p('M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z', col, sw),
  map:      (col, sw) => <>{p('M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z', col, sw)}{p('M9 4v16M15 6v16', col, sw)}</>,
  check:    (col, sw) => p('M4 12l5 5 11-11', col, sw),
  clock:    (col, sw) => <>{ci(12, 12, 9, col, sw)}{p('M12 7v5l3 2', col, sw)}</>,
  chevron:  (col, sw) => p('M9 6l6 6-6 6', col, sw),
  search:   (col, sw) => <>{ci(11, 11, 7, col, sw)}{p('M20 20l-4-4', col, sw)}</>,
  dollar:   (col, sw) => p('M12 3v18M16 7H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H8', col, sw),
  hammer:   (col, sw) => <>{p('M13 3l7 7-3 3-7-7z', col, sw)}{p('M10 6L4 12l4 4 6-6', col, sw)}{p('M7 15l-4 4 2 2 4-4', col, sw)}</>,
  settings: (col, sw) => <>{ci(12, 12, 3, col, sw)}{p('M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1', col, sw)}</>,
  cloud:    (col, sw) => p('M7 18a5 5 0 0 1-1-9.9 6 6 0 0 1 11.7 1A4 4 0 0 1 17 18z', col, sw),
  wifi:     (col, sw) => <>{p('M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 17a5 5 0 0 1 7 0', col, sw)}{ci(12, 20, 1, col, sw)}</>,
  wifioff:  (col, sw) => <>{p('M2 2l20 20M8.5 17a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4-2.8M19 13a10 10 0 0 0-4-2.8M2 9a15 15 0 0 1 5-3.5', col, sw)}{ci(12, 20, 1, col, sw)}</>,
  truck:    (col, sw) => <>{p('M2 7h11v10H2zM13 11h4l4 3v3h-8z', col, sw)}{ci(7, 17, 2, col, sw)}{ci(17, 17, 2, col, sw)}</>,
  pin:      (col, sw) => <>{p('M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z', col, sw)}{ci(12, 9, 2.5, col, sw)}</>,
  edit:     (col, sw) => p('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', col, sw),
  filter:   (col, sw) => p('M3 5h18M6 12h12M10 19h4', col, sw),
  more:     (col, sw) => <>{ci(6, 12, 1.4, col, sw)}{ci(12, 12, 1.4, col, sw)}{ci(18, 12, 1.4, col, sw)}</>,
  arrowR:   (col, sw) => p('M5 12h14M13 6l6 6-6 6', col, sw),
  warning:  (col, sw) => <>{p('M12 3l10 18H2z', col, sw)}{p('M12 10v5M12 18v.01', col, sw)}</>,
  play:     (col, sw) => p('M6 4l12 8-12 8V4z', col, sw),
  pause:    (col, sw) => <>{re(6, 4, 4, 16, 1, col, sw)}{re(14, 4, 4, 16, 1, col, sw)}</>,
  trash:    (col, sw) => p('M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6', col, sw),
  x:        (col, sw) => p('M18 6L6 18M6 6l12 12', col, sw),
};

export function Icon({ name, size = 24, stroke = 2, color = C.ink, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {ICONS[name]?.(color, stroke)}
    </Svg>
  );
}
