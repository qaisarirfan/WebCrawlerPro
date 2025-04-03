import { integer, pgTable, text, timestamp, serial, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// URL table to store all the URLs that are crawled or pending
export const urls = pgTable('urls', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  status: text('status', { enum: ['pending', 'crawled', 'error'] }).default('pending').notNull(),
  lastCrawled: timestamp('last_crawled'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Url = typeof urls.$inferSelect;
export type InsertUrl = typeof urls.$inferInsert;

// Links table to store the links found during crawling
export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  sourceUrlId: integer('source_url_id').references(() => urls.id).notNull(),
  targetUrl: text('target_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Link = typeof links.$inferSelect;
export type InsertLink = typeof links.$inferInsert;

// Relations for URLs and Links
export const urlsRelations = relations(urls, ({ many }) => ({
  links: many(links),
}));

export const linksRelations = relations(links, ({ one }) => ({
  sourceUrl: one(urls, {
    fields: [links.sourceUrlId],
    references: [urls.id],
  }),
}));

// WhatsApp links table to store all WhatsApp group links found
export const whatsappLinks = pgTable('whatsapp_links', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  url: text('url').notNull().unique(),
  domain: text('domain').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type WhatsappLink = typeof whatsappLinks.$inferSelect;
export type InsertWhatsappLink = typeof whatsappLinks.$inferInsert;

// Crawler status table to store the current status of the crawler
export const crawlerStatus = pgTable('crawler_status', {
  id: serial('id').primaryKey(),
  isRunning: boolean('is_running').default(false).notNull(),
  currentUrl: text('current_url'),
  progress: integer('progress').default(0).notNull(),
  totalUrls: integer('total_urls').default(0).notNull(),
  processedUrls: integer('processed_urls').default(0).notNull(),
  startTime: timestamp('start_time'),
  lastUpdate: timestamp('last_update').defaultNow().notNull(),
  errors: text('errors').array(),
});

export type CrawlerStatus = typeof crawlerStatus.$inferSelect;
export type InsertCrawlerStatus = typeof crawlerStatus.$inferInsert;