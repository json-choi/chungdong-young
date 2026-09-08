import { utcTimestamp, utcNow } from "../d1-columns";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
    image: text("image"),
    role: text("role").notNull().default("user"),
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("ban_reason"),
    banExpires: utcTimestamp("ban_expires"),
    createdAt: utcTimestamp("created_at")
      .notNull()
      .default(utcNow),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .default(utcNow),
  },
  (t) => [uniqueIndex("user_email_unique").on(t.email)]
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: utcTimestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: utcTimestamp("created_at")
      .notNull()
      .default(utcNow),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .default(utcNow),
  },
  (t) => [
    uniqueIndex("session_token_unique").on(t.token),
    index("session_user_id_idx").on(t.userId),
  ]
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: utcTimestamp("access_token_expires_at"),
    refreshTokenExpiresAt: utcTimestamp("refresh_token_expires_at"),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: utcTimestamp("created_at")
      .notNull()
      .default(utcNow),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .default(utcNow),
  },
  (t) => [
    index("account_user_id_idx").on(t.userId),
    uniqueIndex("account_provider_account_unique").on(
      t.providerId,
      t.accountId
    ),
  ]
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: utcTimestamp("expires_at").notNull(),
    createdAt: utcTimestamp("created_at")
      .notNull()
      .default(utcNow),
    updatedAt: utcTimestamp("updated_at")
      .notNull()
      .default(utcNow),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);
