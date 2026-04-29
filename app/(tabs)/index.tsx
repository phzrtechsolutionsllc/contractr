import { SafeAreaView } from 'react-native-safe-area-context';
import { Today } from '@/components/tabs/Today';
import { C } from '@/lib/constants';

export default function TodayScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Today />
    </SafeAreaView>
  );
}
