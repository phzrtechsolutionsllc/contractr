import type { StatusId } from './types';

export const C = {
  bg:       '#22262C',
  surface:  '#2C3137',
  surface2: '#363C44',
  ink:      '#F5F5F2',
  inkSoft:  '#CED2D7',
  muted:    '#98A0AA',
  border:   '#404750',
  accent:   '#E8643A',
} as const;

export const FONT = {
  black:     'Archivo_900Black',
  extrabold: 'Archivo_800ExtraBold',
  bold:      'Archivo_700Bold',
  semibold:  'Inter_600SemiBold',
  medium:    'Inter_500Medium',
  regular:   'Inter_400Regular',
} as const;

export const STATUS_LABEL: Record<StatusId, string> = {
  'new':          'New',
  'quote-sent':   'Quote sent',
  'scheduled':    'Scheduled',
  'in-progress':  'In progress',
  'done':         'Done',
  'errand':       'Errand',
  'quote':        'Walk-through',
};

export const STATUS_COLOR: Record<StatusId, string> = {
  'new':          '#6B7280',
  'quote-sent':   '#8B6FE8',
  'scheduled':    '#F6B400',
  'in-progress':  '#E8643A',
  'done':         '#1F8F5E',
  'errand':       '#8B6FE8',
  'quote':        '#F6B400',
};

export function money(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
