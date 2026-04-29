import { Stack } from 'expo-router';
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
import { View } from 'react-native';
import { C } from '@/lib/constants';
import { StoreProvider } from '@/lib/store';

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

  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <StoreProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="customer/[id]" />
        <Stack.Screen name="new-job"       options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-job"      options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-customer"  options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-customer" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </StoreProvider>
  );
}
