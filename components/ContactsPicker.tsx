import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONT } from '@/lib/constants';
import { Icon } from '@/components/ui/Icon';

export interface ContactResult {
  name: string;
  phone: string;
  address: string;
}

interface Props {
  visible: boolean;
  onSelect: (contact: ContactResult) => void;
  onClose: () => void;
}

interface FlatContact {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export function ContactsPicker({ visible, onSelect, onClose }: Props) {
  const [contacts, setContacts]   = useState<FlatContact[]>([]);
  const [query,    setQuery]      = useState('');
  const [loading,  setLoading]    = useState(false);
  const [denied,   setDenied]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setDenied(false);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      setDenied(true);
      setLoading(false);
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Addresses,
      ],
    });
    const flat: FlatContact[] = data
      .filter(c => c.name)
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      .map(c => ({
        id:      c.id ?? `${c.name}-${Math.random()}`,
        name:    c.name ?? '',
        phone:   c.phoneNumbers?.[0]?.number ?? '',
        address: c.addresses?.[0]
          ? [c.addresses[0].street, c.addresses[0].city].filter(Boolean).join(', ')
          : '',
      }));
    setContacts(flat);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setQuery('');
      load();
    }
  }, [visible, load]);

  const filtered = query.trim()
    ? contacts.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
      )
    : contacts;

  function handleSelect(c: FlatContact) {
    onSelect({ name: c.name, phone: c.phone, address: c.address });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Contacts</Text>
          <View style={styles.cancelBtn} />
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Icon name="search" size={16} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search contacts..."
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={C.accent}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={14} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} />
          </View>
        )}

        {denied && !loading && (
          <View style={styles.center}>
            <Text style={styles.deniedText}>Contacts permission denied.</Text>
            <Text style={styles.deniedSub}>Enable it in Settings → CONTRACTR → Contacts.</Text>
          </View>
        )}

        {!loading && !denied && (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query ? 'No contacts match' : 'No contacts found'}
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
              >
                <View style={styles.avatar}>
                  <Text style={styles.initials}>
                    {item.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('')}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {item.phone ? <Text style={styles.sub} numberOfLines={1}>{item.phone}</Text> : null}
                  {item.address ? <Text style={styles.sub} numberOfLines={1}>{item.address}</Text> : null}
                </View>
                <Icon name="chevron" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cancelBtn:   { minWidth: 64 },
  cancelText:  { fontFamily: FONT.semibold, fontSize: 16, color: C.muted },
  title: {
    fontFamily:    FONT.extrabold,
    fontSize:      14,
    color:         C.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  searchBar: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    marginHorizontal:  16,
    marginVertical:    12,
    paddingHorizontal: 14,
    paddingVertical:   10,
    backgroundColor:   C.surface,
    borderRadius:      2,
  },
  searchInput: {
    flex:       1,
    fontFamily: FONT.semibold,
    fontSize:   15,
    color:      C.ink,
    padding:    0,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  deniedText: { fontFamily: FONT.extrabold, fontSize: 14, color: C.ink, textAlign: 'center' },
  deniedSub:  { fontFamily: FONT.regular,   fontSize: 13, color: C.muted, marginTop: 8, textAlign: 'center' },

  list: { paddingHorizontal: 16, paddingBottom: 40 },
  sep:  { height: 1, backgroundColor: C.border, marginLeft: 68 },
  empty: {
    fontFamily:  FONT.semibold,
    fontSize:    14,
    color:       C.muted,
    textAlign:   'center',
    paddingTop:  40,
  },

  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            12,
    paddingVertical: 10,
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: C.surface,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  initials: { fontFamily: FONT.black, fontSize: 16, color: C.accent },
  info:     { flex: 1, minWidth: 0 },
  name:     { fontFamily: FONT.extrabold, fontSize: 15, color: C.ink },
  sub:      { fontFamily: FONT.regular,   fontSize: 12, color: C.muted, marginTop: 1 },
});
