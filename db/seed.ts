import { db } from './client';
import { jobs, customers, timeline, materials } from './schema';
import { CRM_DATA } from '@/lib/data';

export function seedIfEmpty() {
  const row = db.$client.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM jobs');
  if (row && row.count > 0) return;

  for (const j of CRM_DATA.jobs) {
    db.insert(jobs).values({
      id:         j.id,
      title:      j.title,
      customer:   j.customer,
      customerId: j.customerId,
      address:    j.address,
      status:     j.status,
      scheduled:  j.scheduled,
      due:        j.due,
      price:      j.price,
      hours:      j.hours,
      hoursEst:   j.hoursEst,
      photos:     j.photos,
      notes:      j.notes,
      materials:  j.materials,
      desc:       j.desc,
      createdAt:  Date.now(),
    }).run();
  }

  for (const c of CRM_DATA.customers) {
    db.insert(customers).values({
      id:      c.id,
      name:    c.name,
      phone:   c.phone,
      address: c.address,
      jobs:    c.jobs,
      since:   c.since,
    }).run();
  }

  for (const entry of CRM_DATA.timeline) {
    db.insert(timeline).values({
      jobId:     'j1',
      when:      entry.when,
      who:       entry.who,
      what:      entry.what,
      kind:      entry.kind,
      n:         entry.n ?? null,
      createdAt: Date.now(),
    }).run();
  }

  for (const m of CRM_DATA.materials) {
    db.insert(materials).values({
      jobId:    'j1',
      name:     m.name,
      qty:      m.qty,
      cost:     m.cost,
      supplier: m.supplier,
      got:      m.got,
    }).run();
  }
}
