import React from 'react';
import { seedIfEmpty } from '@/db/seed';

seedIfEmpty();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
