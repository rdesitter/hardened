import { pgTable, uuid, varchar, integer, boolean, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  plan: varchar('plan', { length: 20 }).default('free'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  url: varchar('url', { length: 2048 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  score: integer('score'),
  results: jsonb('results'),
  error: text('error'),
  isMonitoring: boolean('is_monitoring').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').references(() => scans.id, { onDelete: 'cascade' }).notNull(),
  publicToken: varchar('public_token', { length: 32 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
