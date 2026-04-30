import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Share, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT, money } from '@/lib/constants';
import { useJob, useCustomer, useJobMaterials } from '@/db/hooks';
import { Icon } from '@/components/ui/Icon';

export default function InvoiceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const job       = useJob(id ?? '');
  const customer  = useCustomer(job?.customerId ?? '');
  const materials = useJobMaterials(id ?? '');

  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONT.extrabold, color: C.muted }}>Job not found</Text>
      </SafeAreaView>
    );
  }

  const matTotal = materials.reduce((s, m) => s + m.cost, 0);
  const laborVal = job.price - matTotal;
  const today    = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  function buildText(): string {
    const lines: string[] = [
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      'INVOICE',
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      `Date: ${today}`,
      '',
      'BILL TO',
      customer?.name  ?? job.customer,
      customer?.phone ? `Phone: ${customer.phone}` : '',
      customer?.address ? customer.address : '',
      '',
      'JOB',
      job.title,
      job.address !== '—' ? job.address : '',
      job.due !== '—' ? `Start Date: ${job.due}` : '',
      '',
    ];

    if (materials.length > 0) {
      lines.push('MATERIALS');
      for (const m of materials) {
        const cost = m.cost > 0 ? `  $${m.cost.toFixed(2)}` : '';
        lines.push(`  • ${m.name}${m.qty ? ` (${m.qty})` : ''}${cost}`);
      }
      lines.push(`  Subtotal: ${money(matTotal)}`);
      lines.push('');
    }

    if (job.hoursEst > 0 || job.hours > 0) {
      const hrs = job.hours > 0 ? job.hours : job.hoursEst;
      lines.push(`Labor: ${hrs}h`);
      if (laborVal > 0) lines.push(`  Subtotal: ${money(laborVal)}`);
      lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`TOTAL: ${job.price > 0 ? money(job.price) : 'TBD'}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');

    if (job.desc) {
      lines.push('');
      lines.push('NOTES');
      lines.push(job.desc);
    }

    return lines.filter(l => l !== undefined).join('\n');
  }

  async function handleShare() {
    try {
      await Share.share({ message: buildText(), title: `Invoice – ${job.title}` });
    } catch {
      Alert.alert('Could not open share sheet');
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Icon name="chevron" size={18} color={C.ink} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Icon name="arrowR" size={16} stroke={2} color="#0A0A0A" />
          <Text style={styles.shareBtnLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Invoice label */}
        <View style={styles.invoiceHeader}>
          <Text style={styles.invoiceLabel}>Invoice</Text>
          <Text style={styles.invoiceDate}>{today}</Text>
        </View>

        {/* Bill To */}
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Bill To</Text>
          <Text style={styles.blockPrimary}>{customer?.name ?? job.customer}</Text>
          {customer?.phone ? <Text style={styles.blockSub}>{customer.phone}</Text> : null}
          {customer?.address ? <Text style={styles.blockSub}>{customer.address}</Text> : null}
        </View>

        {/* Job */}
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Job</Text>
          <Text style={styles.blockPrimary}>{job.title}</Text>
          {job.address !== '—' ? <Text style={styles.blockSub}>{job.address}</Text> : null}
          {job.due !== '—' ? <Text style={styles.blockSub}>Start: {job.due}</Text> : null}
        </View>

        {/* Materials */}
        {materials.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Materials</Text>
            {materials.map(m => (
              <View key={m.id} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineItemName}>{m.name}{m.qty ? ` · ${m.qty}` : ''}</Text>
                  {m.supplier ? <Text style={styles.lineItemSub}>{m.supplier}</Text> : null}
                </View>
                <Text style={styles.lineItemPrice}>{m.cost > 0 ? money(m.cost) : '—'}</Text>
              </View>
            ))}
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalVal}>{money(matTotal)}</Text>
            </View>
          </View>
        )}

        {/* Labor */}
        {(job.hoursEst > 0 || job.hours > 0) && (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Labor</Text>
            <View style={styles.lineItem}>
              <Text style={[styles.lineItemName, { flex: 1 }]}>
                {job.hours > 0 ? `${job.hours}h logged` : `${job.hoursEst}h estimated`}
              </Text>
              {laborVal > 0 && <Text style={styles.lineItemPrice}>{money(laborVal)}</Text>}
            </View>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>{job.price > 0 ? money(job.price) : 'TBD'}</Text>
        </View>

        {/* Notes */}
        {job.desc ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>Notes</Text>
            <Text style={styles.notesText}>{job.desc}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48 },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     8,
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
  shareBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   C.accent,
    paddingHorizontal: 16,
    height:            44,
  },
  shareBtnLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         '#0A0A0A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  invoiceHeader: {
    paddingTop:    20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom:  20,
  },
  invoiceLabel: {
    fontFamily:    FONT.black,
    fontSize:      40,
    letterSpacing: -1,
    textTransform: 'uppercase',
    color:         C.ink,
    lineHeight:    38,
  },
  invoiceDate: {
    fontFamily: FONT.regular,
    fontSize:   13,
    color:      C.muted,
    marginTop:  6,
  },

  block: {
    marginBottom:    20,
    paddingBottom:   20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  blockLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      10,
    color:         C.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom:  8,
  },
  blockPrimary: {
    fontFamily: FONT.extrabold,
    fontSize:   16,
    color:      C.ink,
  },
  blockSub: {
    fontFamily: FONT.regular,
    fontSize:   14,
    color:      C.muted,
    marginTop:  3,
  },

  lineItem: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  lineItemName: {
    fontFamily: FONT.semibold,
    fontSize:   14,
    color:      C.ink,
  },
  lineItemSub: {
    fontFamily: FONT.regular,
    fontSize:   12,
    color:      C.muted,
    marginTop:  2,
  },
  lineItemPrice: {
    fontFamily: FONT.extrabold,
    fontSize:   14,
    color:      C.ink,
    flexShrink: 0,
  },
  subtotalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      10,
  },
  subtotalLabel: { fontFamily: FONT.extrabold, fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  subtotalVal:   { fontFamily: FONT.extrabold, fontSize: 12, color: C.muted },

  totalRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    backgroundColor: C.surface,
    padding:        16,
    marginBottom:   20,
  },
  totalLabel: {
    fontFamily:    FONT.extrabold,
    fontSize:      13,
    color:         C.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  totalVal: {
    fontFamily: FONT.black,
    fontSize:   28,
    color:      C.ink,
    letterSpacing: -0.5,
  },

  notesText: {
    fontFamily: FONT.regular,
    fontSize:   14,
    color:      C.ink,
    lineHeight: 21,
  },
});
