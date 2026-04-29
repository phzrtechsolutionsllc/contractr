import { SafeAreaView } from 'react-native-safe-area-context';
import { Customers } from '@/components/tabs/Customers';
import { C } from '@/lib/constants';

export default function CustomersScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Customers />
    </SafeAreaView>
  );
}
