export type TabId = 'today' | 'jobs' | 'customers' | 'schedule';
export type SyncState = 'synced' | 'syncing' | 'offline';
export type StatusId =
  | 'new'
  | 'quote-sent'
  | 'scheduled'
  | 'in-progress'
  | 'done'
  | 'errand'
  | 'quote';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  jobs: number;
  since: string;
}

export interface Job {
  id: string;
  title: string;
  customer: string;
  customerId: string;
  address: string;
  status: StatusId;
  scheduled: string;
  due: string;
  price: number;
  hours: number;
  hoursEst: number;
  photos: number;
  notes: number;
  materials: number;
  desc: string;
  clockedInAt?: number | null;
}

export interface Material {
  id: number;
  jobId: string;
  name: string;
  qty: string;
  cost: number;
  supplier: string;
  got: boolean;
}

export interface TimelineEntry {
  when: string;
  who: string;
  what: string;
  kind: 'status' | 'photo' | 'note' | 'voice' | 'message';
  n?: number;
}

export interface TodayEntry {
  time: string;
  title: string;
  who: string;
  addr: string;
  tag: StatusId;
}

export interface CRMData {
  contractor: {
    name: string;
    business: string;
    trade: string;
    truck: string;
  };
  customers: Customer[];
  jobs: Job[];
  materials: Material[];
  timeline: TimelineEntry[];
  todaySchedule: TodayEntry[];
}
