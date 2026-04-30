import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { eq, desc } from 'drizzle-orm';
import { db } from './client';
import { jobs, customers, timeline, materials } from './schema';
import type { Job } from '@/lib/types';

// ---- Sync query helpers ----

function queryJobs(): Job[] {
  return db.select().from(jobs).orderBy(desc(jobs.createdAt)).all() as unknown as Job[];
}

function queryJob(id: string): Job | null {
  return (db.select().from(jobs).where(eq(jobs.id, id)).all()[0] ?? null) as unknown as Job | null;
}

function queryTimeline(jobId: string) {
  return db.select().from(timeline).where(eq(timeline.jobId, jobId)).orderBy(desc(timeline.createdAt)).all();
}

function queryMaterials(jobId: string) {
  return db.select().from(materials).where(eq(materials.jobId, jobId)).all();
}

function queryCustomers() {
  return db.select().from(customers).all();
}

function queryCustomer(id: string) {
  return db.select().from(customers).where(eq(customers.id, id)).get() ?? null;
}

function queryJobsByCustomer(customerId: string): Job[] {
  return db.select().from(jobs).where(eq(jobs.customerId, customerId)).orderBy(desc(jobs.createdAt)).all() as unknown as Job[];
}

// ---- Reactive hooks ----
// Synchronous initialization avoids any render with empty/stale data on mount.
// addDatabaseChangeListener fires synchronously from the native layer for each
// committed write, so state updates land in the same React batch as the mutation.

export function useJobs(): Job[] {
  const [data, setData] = useState<Job[]>(queryJobs);
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'jobs') setData(queryJobs());
    });
    return () => sub.remove();
  }, []);
  return data;
}

export function useJob(id: string): Job | null {
  const [data, setData] = useState<Job | null>(() => queryJob(id));
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'jobs') setData(queryJob(id));
    });
    return () => sub.remove();
  }, [id]);
  return data;
}

export function useJobTimeline(jobId: string) {
  const [data, setData] = useState(() => queryTimeline(jobId));
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'timeline') setData(queryTimeline(jobId));
    });
    return () => sub.remove();
  }, [jobId]);
  return data;
}

export function useJobMaterials(jobId: string) {
  const [data, setData] = useState(() => queryMaterials(jobId));
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'materials') setData(queryMaterials(jobId));
    });
    return () => sub.remove();
  }, [jobId]);
  return data;
}

export function useCustomers() {
  const [data, setData] = useState(queryCustomers);
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'customers') setData(queryCustomers());
    });
    return () => sub.remove();
  }, []);
  return data;
}

export function useCustomer(id: string) {
  const [data, setData] = useState(() => queryCustomer(id));
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'customers') setData(queryCustomer(id));
    });
    return () => sub.remove();
  }, [id]);
  return data;
}

export function useCustomerJobs(customerId: string) {
  const [data, setData] = useState<Job[]>(() => queryJobsByCustomer(customerId));
  useEffect(() => {
    const sub = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === 'jobs') setData(queryJobsByCustomer(customerId));
    });
    return () => sub.remove();
  }, [customerId]);
  return data;
}

// ---- Mutations ----

export function addJob(job: Omit<Job, 'clockedInAt'>) {
  db.insert(jobs).values({
    id:         job.id,
    title:      job.title,
    customer:   job.customer,
    customerId: job.customerId,
    address:    job.address,
    status:     job.status,
    scheduled:  job.scheduled,
    due:        job.due,
    price:      job.price,
    hours:      job.hours,
    hoursEst:   job.hoursEst,
    photos:     job.photos,
    notes:      job.notes,
    materials:  job.materials,
    desc:       job.desc,
    createdAt:  Date.now(),
  }).run();
  const cRow = db.select({ jobs: customers.jobs }).from(customers).where(eq(customers.id, job.customerId)).get();
  if (cRow !== undefined) {
    db.update(customers).set({ jobs: cRow.jobs + 1 }).where(eq(customers.id, job.customerId)).run();
  }
}

export function updateJob(id: string, patch: Partial<typeof jobs.$inferInsert>) {
  db.update(jobs).set(patch).where(eq(jobs.id, id)).run();
}

export function clockIn(jobId: string) {
  db.update(jobs)
    .set({ clockedInAt: Date.now(), status: 'in-progress' })
    .where(eq(jobs.id, jobId))
    .run();
  db.insert(timeline).values({
    jobId,
    when:      fmtNow(),
    who:       'Mike',
    what:      'Clocked in',
    kind:      'status',
    createdAt: Date.now(),
  }).run();
}

export function clockOut(jobId: string, clockedInAt: number) {
  const elapsed   = (Date.now() - clockedInAt) / 3600000;
  const row       = db.select({ hours: jobs.hours }).from(jobs).where(eq(jobs.id, jobId)).get();
  const newHours  = Math.round(((row?.hours ?? 0) + elapsed) * 100) / 100;
  const totalMins = Math.round(elapsed * 60);
  const timeStr   = totalMins < 60
    ? `${totalMins}m`
    : `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;

  db.update(jobs)
    .set({ clockedInAt: null, hours: newHours })
    .where(eq(jobs.id, jobId))
    .run();
  db.insert(timeline).values({
    jobId,
    when:      fmtNow(),
    who:       'Mike',
    what:      `Clocked out · ${timeStr}`,
    kind:      'status',
    createdAt: Date.now(),
  }).run();
}

export function updateStatus(jobId: string, status: string) {
  db.update(jobs).set({ status }).where(eq(jobs.id, jobId)).run();
  db.insert(timeline).values({
    jobId,
    when:      fmtNow(),
    who:       'Mike',
    what:      `Status → ${status.replace(/-/g, ' ')}`,
    kind:      'status',
    createdAt: Date.now(),
  }).run();
}

export function addPhotoEntry(jobId: string, uri: string) {
  db.insert(timeline).values({
    jobId,
    when:      fmtNow(),
    who:       'Mike',
    what:      'Photo captured',
    kind:      'photo',
    n:         1,
    uri,
    createdAt: Date.now(),
  }).run();
  const row = db.select({ photos: jobs.photos }).from(jobs).where(eq(jobs.id, jobId)).get();
  db.update(jobs).set({ photos: (row?.photos ?? 0) + 1 }).where(eq(jobs.id, jobId)).run();
}

export function addVoiceEntry(jobId: string, uri: string, seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toString().padStart(2, '0');
  db.insert(timeline).values({
    jobId,
    when:      fmtNow(),
    who:       'Mike',
    what:      `Voice memo · ${m}:${s}`,
    kind:      'voice',
    uri,
    createdAt: Date.now(),
  }).run();
  const row = db.select({ notes: jobs.notes }).from(jobs).where(eq(jobs.id, jobId)).get();
  db.update(jobs).set({ notes: (row?.notes ?? 0) + 1 }).where(eq(jobs.id, jobId)).run();
}

// ---- Customer mutations ----

export function addCustomer(c: { id: string; name: string; phone: string; address: string; since: string }) {
  db.insert(customers).values({ ...c, jobs: 0 }).run();
}

export function updateCustomer(id: string, patch: Partial<typeof customers.$inferInsert>) {
  db.update(customers).set(patch).where(eq(customers.id, id)).run();
}

// ---- Material mutations ----

export function addMaterial(m: { jobId: string; name: string; qty: string; cost: number; supplier: string }) {
  db.insert(materials).values({ ...m, got: false }).run();
  const row = db.select({ materials: jobs.materials }).from(jobs).where(eq(jobs.id, m.jobId)).get();
  db.update(jobs).set({ materials: (row?.materials ?? 0) + 1 }).where(eq(jobs.id, m.jobId)).run();
}

export function toggleMaterialGot(id: number, got: boolean) {
  db.update(materials).set({ got }).where(eq(materials.id, id)).run();
}

export function deleteMaterial(id: number, jobId: string) {
  db.delete(materials).where(eq(materials.id, id)).run();
  const row = db.select({ materials: jobs.materials }).from(jobs).where(eq(jobs.id, jobId)).get();
  db.update(jobs).set({ materials: Math.max(0, (row?.materials ?? 1) - 1) }).where(eq(jobs.id, jobId)).run();
}

export function deleteJob(id: string) {
  const job = db.select({ customerId: jobs.customerId }).from(jobs).where(eq(jobs.id, id)).get();
  if (job) {
    const cRow = db.select({ jobs: customers.jobs }).from(customers).where(eq(customers.id, job.customerId)).get();
    if (cRow !== undefined) {
      db.update(customers).set({ jobs: Math.max(0, cRow.jobs - 1) }).where(eq(customers.id, job.customerId)).run();
    }
  }
  db.delete(materials).where(eq(materials.jobId, id)).run();
  db.delete(timeline).where(eq(timeline.jobId, id)).run();
  db.delete(jobs).where(eq(jobs.id, id)).run();
}

export function deleteCustomer(id: string) {
  db.delete(customers).where(eq(customers.id, id)).run();
}

function fmtNow() {
  const d    = new Date();
  let h      = d.getHours();
  const m    = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h          = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
