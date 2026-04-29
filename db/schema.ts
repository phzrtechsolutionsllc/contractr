import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id:          text('id').primaryKey(),
  title:       text('title').notNull(),
  customer:    text('customer').notNull(),
  customerId:  text('customer_id').notNull(),
  address:     text('address').notNull().default('—'),
  status:      text('status').notNull().default('new'),
  scheduled:   text('scheduled').notNull().default('Needs scheduling'),
  due:         text('due').notNull().default('—'),
  price:       real('price').notNull().default(0),
  hours:       real('hours').notNull().default(0),
  hoursEst:    real('hours_est').notNull().default(0),
  photos:      integer('photos').notNull().default(0),
  notes:       integer('notes').notNull().default(0),
  materials:   integer('materials').notNull().default(0),
  desc:        text('desc').notNull().default(''),
  clockedInAt: integer('clocked_in_at'),
  createdAt:   integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const customers = sqliteTable('customers', {
  id:      text('id').primaryKey(),
  name:    text('name').notNull(),
  phone:   text('phone').notNull().default(''),
  address: text('address').notNull().default(''),
  jobs:    integer('jobs').notNull().default(0),
  since:   text('since').notNull().default(''),
});

export const timeline = sqliteTable('timeline', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  jobId:     text('job_id').notNull(),
  when:      text('when').notNull(),
  who:       text('who').notNull(),
  what:      text('what').notNull(),
  kind:      text('kind').notNull(),
  n:         integer('n'),
  uri:       text('uri'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const materials = sqliteTable('materials', {
  id:       integer('id').primaryKey({ autoIncrement: true }),
  jobId:    text('job_id').notNull(),
  name:     text('name').notNull(),
  qty:      text('qty').notNull().default(''),
  cost:     real('cost').notNull().default(0),
  supplier: text('supplier').notNull().default(''),
  got:      integer('got', { mode: 'boolean' }).notNull().default(false),
});
