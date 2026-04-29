import { SafeAreaView } from 'react-native-safe-area-context';
import { JobsList } from '@/components/tabs/JobsList';
import { C } from '@/lib/constants';

export default function JobsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <JobsList />
    </SafeAreaView>
  );
}
