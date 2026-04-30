import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { C } from '@/lib/constants';
import { StoreProvider } from '@/lib/store';
import { supabase } from '@/lib/supabase';

function AuthRedirect({ session, ready }: { session: Session | null; ready: boolean }) {
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, ready, segments]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [session,     setSession]     = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const ready = loaded && !authLoading;

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <StoreProvider>
      <AuthRedirect session={session} ready={ready} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="customer/[id]" />
        <Stack.Screen name="invoice/[id]" />
        <Stack.Screen name="new-job"       options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-job"      options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-customer"  options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-customer" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </StoreProvider>
  );
}
