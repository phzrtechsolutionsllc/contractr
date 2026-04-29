import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { useJob } from '@/db/hooks';
import { JobDetail } from '@/components/JobDetail';
import { C, FONT } from '@/lib/constants';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const job    = useJob(id ?? '');

  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: FONT.extrabold, color: C.muted }}>Job not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <JobDetail job={job} />
    </SafeAreaView>
  );
}
