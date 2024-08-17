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
export const userStatusEnum = pgEnum("user_status", [
  "online",
  "offline",
  "typing",
]);
export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read",
]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
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
  conversationId: integer("conversationId")
    .notNull()
    .references(() => conversation.id),
  status: messageStatusEnum("status").default("sent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversation = pgTable("conversation", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  user1Id: integer("user1id").references(() => users.id),
  user2Id: integer("user2id").references(() => users.id),
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

// Types for Users
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Types for Messages
export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

// Types for MediaUploads
export type MediaUpload = InferSelectModel<typeof mediaUploads>;
export type NewMediaUpload = InferInsertModel<typeof mediaUploads>;

export type conversation = InferSelectModel<typeof conversation>;
export type NewConversation = InferInsertModel<typeof conversation>;
