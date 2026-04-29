import { SafeAreaView } from 'react-native-safe-area-context';
import { Schedule } from '@/components/tabs/Schedule';
import { C } from '@/lib/constants';

export default function ScheduleScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Schedule />
    </SafeAreaView>
  );
}
