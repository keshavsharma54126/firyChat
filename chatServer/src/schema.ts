import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Enums
export const userStatusEnum = pgEnum("user_status", ["online", "offline"]);
export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  googleId: text("googleId"),
  imageUrl: text("imageUrl"),
  status: userStatusEnum("status").default("offline").notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .references(() => users.id)
    .notNull(),
  recipientId: integer("recipient_id")
    .references(() => users.id)
    .notNull(),
  content: text("content"),
  status: messageStatusEnum("status").default("sent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaUploads = pgTable("media_uploads", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id")
    .references(() => messages.id)
    .notNull(),
  type: mediaTypeEnum("type").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const readReceipts = pgTable("read_receipts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  messageId: integer("message_id")
    .references(() => messages.id)
    .notNull(),
  readAt: timestamp("read_at").notNull(),
});

// Types for Users
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Types for Messages
export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

// Types for MediaUploads
export type MediaUpload = InferSelectModel<typeof mediaUploads>;
export type NewMediaUpload = InferInsertModel<typeof mediaUploads>;

// Types for ReadReceipts
export type ReadReceipt = InferSelectModel<typeof readReceipts>;
export type NewReadReceipt = InferInsertModel<typeof readReceipts>;
