import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// User Profiles - Extended user information
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  avatar: varchar("avatar", { length: 500 }),
  backgroundImage: varchar("backgroundImage", { length: 500 }),
  profileColor: varchar("profileColor", { length: 7 }).default("#0a7ea4"),
  musicUrl: varchar("musicUrl", { length: 500 }),
  musicTitle: varchar("musicTitle", { length: 255 }),
  spotifyUrl: varchar("spotifyUrl", { length: 500 }),
  appleMusicUrl: varchar("appleMusicUrl", { length: 500 }),
  youtubeUrl: varchar("youtubeUrl", { length: 500 }),
  followerCount: int("followerCount").default(0),
  followingCount: int("followingCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// Posts - Main social media content
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  image: varchar("image", { length: 500 }),
  privacyLevel: mysqlEnum("privacyLevel", ["public", "followers", "private"]).default("public"),
  likeCount: int("likeCount").default(0),
  commentCount: int("commentCount").default(0),
  shareCount: int("shareCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// Likes - Post interactions
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

// Comments - Post responses
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  parentCommentId: int("parentCommentId"),
  content: text("content").notNull(),
  likeCount: int("likeCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Follows - User relationships
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

// Messages - Direct messaging
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  content: text("content").notNull(),
  isEncrypted: mysqlEnum("isEncrypted", ["true", "false"]).default("true"),
  isRead: mysqlEnum("isRead", ["true", "false"]).default("false"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Groups - Community spaces
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 10 }),
  isAdult: mysqlEnum("isAdult", ["true", "false"]).default("false"),
  accessType: mysqlEnum("accessType", ["public", "password", "invite"]).default("public"),
  password: varchar("password", { length: 255 }),
  memberCount: int("memberCount").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

// Group Members
export const groupMembers = mysqlTable("groupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["member", "moderator", "admin"]).default("member"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

// Live Streams
export const liveStreams = mysqlTable("liveStreams", {
  id: int("id").autoincrement().primaryKey(),
  hostId: int("hostId").notNull(),
  groupId: int("groupId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isAdult: mysqlEnum("isAdult", ["true", "false"]).default("false"),
  requiresPassword: mysqlEnum("requiresPassword", ["true", "false"]).default("false"),
  password: varchar("password", { length: 255 }),
  viewerCount: int("viewerCount").default(0),
  status: mysqlEnum("status", ["live", "ended", "scheduled"]).default("live"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = typeof liveStreams.$inferInsert;

// Marketplace Listings
export const marketplaceListings = mysqlTable("marketplaceListings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: int("price").notNull(),
  image: varchar("image", { length: 500 }),
  category: varchar("category", { length: 100 }),
  condition: mysqlEnum("condition", ["new", "like-new", "good", "fair"]).default("good"),
  isVerified: mysqlEnum("isVerified", ["true", "false"]).default("false"),
  sellerRating: int("sellerRating").default(0),
  status: mysqlEnum("status", ["active", "sold", "removed"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = typeof marketplaceListings.$inferInsert;

// Marketplace Transactions
export const marketplaceTransactions = mysqlTable("marketplaceTransactions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  buyerId: int("buyerId").notNull(),
  sellerId: int("sellerId").notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "escrow", "completed", "disputed"]).default("pending"),
  buyerRating: int("buyerRating"),
  sellerRating: int("sellerRating"),
  disputeReason: text("disputeReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;
export type InsertMarketplaceTransaction = typeof marketplaceTransactions.$inferInsert;

// Games - User game progress
export const gameProgress = mysqlTable("gameProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameName: varchar("gameName", { length: 100 }).notNull(),
  score: int("score").default(0),
  level: int("level").default(1),
  coins: int("coins").default(0),
  lastPlayedAt: timestamp("lastPlayedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameProgress = typeof gameProgress.$inferSelect;
export type InsertGameProgress = typeof gameProgress.$inferInsert;

// Privacy Settings
export const privacySettings = mysqlTable("privacySettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  blockList: text("blockList"),
  muteList: text("muteList"),
  allowMessages: mysqlEnum("allowMessages", ["all", "followers", "none"]).default("all"),
  allowProfileView: mysqlEnum("allowProfileView", ["all", "followers", "none"]).default("all"),
  dataExportRequested: mysqlEnum("dataExportRequested", ["true", "false"]).default("false"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrivacySetting = typeof privacySettings.$inferSelect;
export type InsertPrivacySetting = typeof privacySettings.$inferInsert;


// Content Reports - User-submitted reports
export const contentReports = mysqlTable("contentReports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull(),
  contentType: mysqlEnum("contentType", ["post", "comment", "message", "user", "group"]).notNull(),
  contentId: int("contentId").notNull(),
  reportedUserId: int("reportedUserId").notNull(),
  reason: mysqlEnum("reason", [
    "spam",
    "harassment",
    "hate_speech",
    "violence",
    "nudity",
    "misinformation",
    "copyright",
    "other"
  ]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewing", "resolved", "dismissed"]).default("pending"),
  moderatorId: int("moderatorId"),
  moderatorNotes: text("moderatorNotes"),
  resolution: mysqlEnum("resolution", ["warning", "content_removed", "user_suspended", "user_banned", "no_action"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;

// Content Flags - AI/Auto-detected issues
export const contentFlags = mysqlTable("contentFlags", {
  id: int("id").autoincrement().primaryKey(),
  contentType: mysqlEnum("contentType", ["post", "comment", "message"]).notNull(),
  contentId: int("contentId").notNull(),
  userId: int("userId").notNull(),
  flagType: mysqlEnum("flagType", [
    "profanity",
    "hate_speech",
    "violence",
    "spam",
    "adult_content",
    "self_harm",
    "misinformation"
  ]).notNull(),
  confidence: int("confidence").default(0), // 0-100 confidence score
  autoAction: mysqlEnum("autoAction", ["none", "hidden", "removed"]).default("none"),
  reviewedBy: int("reviewedBy"),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "confirmed", "false_positive"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentFlag = typeof contentFlags.$inferSelect;
export type InsertContentFlag = typeof contentFlags.$inferInsert;

// Moderation Actions - Log of all moderation actions
export const moderationActions = mysqlTable("moderationActions", {
  id: int("id").autoincrement().primaryKey(),
  moderatorId: int("moderatorId").notNull(),
  targetUserId: int("targetUserId").notNull(),
  actionType: mysqlEnum("actionType", [
    "warning",
    "content_removed",
    "muted",
    "suspended",
    "banned",
    "unbanned",
    "appeal_approved",
    "appeal_denied"
  ]).notNull(),
  reason: text("reason").notNull(),
  contentType: mysqlEnum("contentType", ["post", "comment", "message", "user", "group"]),
  contentId: int("contentId"),
  duration: int("duration"), // Duration in hours for temporary actions
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModerationAction = typeof moderationActions.$inferSelect;
export type InsertModerationAction = typeof moderationActions.$inferInsert;

// User Appeals - Appeals against moderation actions
export const userAppeals = mysqlTable("userAppeals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moderationActionId: int("moderationActionId").notNull(),
  appealText: text("appealText").notNull(),
  status: mysqlEnum("status", ["pending", "reviewing", "approved", "denied"]).default("pending"),
  reviewedBy: int("reviewedBy"),
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAppeal = typeof userAppeals.$inferSelect;
export type InsertUserAppeal = typeof userAppeals.$inferInsert;

// Kindness Score - Track positive/negative interactions
export const kindnessScores = mysqlTable("kindnessScores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  score: int("score").default(100), // Start at 100, can go up or down
  positiveActions: int("positiveActions").default(0),
  negativeActions: int("negativeActions").default(0),
  reportsReceived: int("reportsReceived").default(0),
  reportsConfirmed: int("reportsConfirmed").default(0),
  helpfulFlags: int("helpfulFlags").default(0), // Reports that led to action
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KindnessScore = typeof kindnessScores.$inferSelect;
export type InsertKindnessScore = typeof kindnessScores.$inferInsert;

// Platform Analytics - Daily metrics
export const platformAnalytics = mysqlTable("platformAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  date: timestamp("date").notNull(),
  activeUsers: int("activeUsers").default(0),
  newUsers: int("newUsers").default(0),
  totalPosts: int("totalPosts").default(0),
  totalComments: int("totalComments").default(0),
  totalMessages: int("totalMessages").default(0),
  totalReports: int("totalReports").default(0),
  resolvedReports: int("resolvedReports").default(0),
  avgSessionDuration: int("avgSessionDuration").default(0), // in seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlatformAnalytic = typeof platformAnalytics.$inferSelect;
export type InsertPlatformAnalytic = typeof platformAnalytics.$inferInsert;


// ==================== DIFFERENTIATING FEATURES ====================

// Enhanced Reactions - Beyond just "like"
export const reactions = mysqlTable("reactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  reactionType: mysqlEnum("reactionType", [
    "like",
    "love",
    "celebrate",
    "support",
    "insightful",
    "funny",
    "sad",
    "angry"
  ]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = typeof reactions.$inferInsert;

// Profile Visitors - MySpace-style visitor tracking
export const profileVisitors = mysqlTable("profileVisitors", {
  id: int("id").autoincrement().primaryKey(),
  profileUserId: int("profileUserId").notNull(), // The profile being visited
  visitorUserId: int("visitorUserId").notNull(), // The visitor
  visitCount: int("visitCount").default(1),
  lastVisited: timestamp("lastVisited").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfileVisitor = typeof profileVisitors.$inferSelect;
export type InsertProfileVisitor = typeof profileVisitors.$inferInsert;

// Time Capsule Posts - Schedule posts for the future
export const timeCapsules = mysqlTable("timeCapsules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  image: varchar("image", { length: 500 }),
  privacyLevel: mysqlEnum("privacyLevel", ["public", "followers", "private"]).default("public"),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["scheduled", "published", "cancelled"]).default("scheduled"),
  publishedPostId: int("publishedPostId"), // Reference to the actual post once published
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimeCapsule = typeof timeCapsules.$inferSelect;
export type InsertTimeCapsule = typeof timeCapsules.$inferInsert;

// Digital Wellness - User activity tracking for wellness features
export const userWellness = mysqlTable("userWellness", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  dailyLimitMinutes: int("dailyLimitMinutes").default(0), // 0 = no limit
  digestModeEnabled: boolean("digestModeEnabled").default(false),
  digestTime: varchar("digestTime", { length: 5 }).default("09:00"), // HH:MM format
  lastSeenPostId: int("lastSeenPostId").default(0),
  lastCaughtUpAt: timestamp("lastCaughtUpAt"),
  todayUsageMinutes: int("todayUsageMinutes").default(0),
  lastUsageDate: timestamp("lastUsageDate"),
  breakRemindersEnabled: boolean("breakRemindersEnabled").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserWellness = typeof userWellness.$inferSelect;
export type InsertUserWellness = typeof userWellness.$inferInsert;

// Appreciation Notes - Meaningful interactions beyond reactions
export const appreciationNotes = mysqlTable("appreciationNotes", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  postId: int("postId"), // Optional - can be sent without a post
  message: text("message").notNull(),
  isAnonymous: boolean("isAnonymous").default(false),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppreciationNote = typeof appreciationNotes.$inferSelect;
export type InsertAppreciationNote = typeof appreciationNotes.$inferInsert;

// Top Friends - MySpace-style featured friends
export const topFriends = mysqlTable("topFriends", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  friendId: int("friendId").notNull(),
  position: int("position").notNull(), // 1-8 for Top 8
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopFriend = typeof topFriends.$inferSelect;
export type InsertTopFriend = typeof topFriends.$inferInsert;

// Pokes - Classic Facebook feature revival
export const pokes = mysqlTable("pokes", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  pokeType: mysqlEnum("pokeType", ["poke", "wave", "high_five", "hug"]).default("poke"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Poke = typeof pokes.$inferSelect;
export type InsertPoke = typeof pokes.$inferInsert;


// Two-Factor Authentication
export const twoFactorAuth = mysqlTable("two_factor_auth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  backupCodes: text("backupCodes"), // JSON array of hashed backup codes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;

// Account Deletion Requests (for GDPR compliance)
export const accountDeletionRequests = mysqlTable("account_deletion_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "cancelled"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  scheduledDeletionAt: timestamp("scheduledDeletionAt"), // 30 days grace period
  completedAt: timestamp("completedAt"),
});

export type AccountDeletionRequest = typeof accountDeletionRequests.$inferSelect;

// Memory Lane - "On This Day" memories
export const memories = mysqlTable("memories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  postId: int("postId").notNull(),
  memoryDate: timestamp("memoryDate").notNull(), // The original post date
  yearsAgo: int("yearsAgo").notNull(),
  isViewed: boolean("isViewed").default(false).notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Memory = typeof memories.$inferSelect;

// Notification Batches (for digest mode)
export const notificationBatches = mysqlTable("notification_batches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  batchType: mysqlEnum("batchType", ["daily", "weekly"]).default("daily").notNull(),
  notificationIds: text("notificationIds").notNull(), // JSON array of notification IDs
  scheduledFor: timestamp("scheduledFor").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationBatch = typeof notificationBatches.$inferSelect;

// User Sessions (for security - track active sessions)
export const userSessions = mysqlTable("user_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  deviceInfo: text("deviceInfo"), // JSON with device details
  ipAddress: varchar("ipAddress", { length: 45 }),
  lastActive: timestamp("lastActive").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSession = typeof userSessions.$inferSelect;


// Push Notification Tokens - Store device tokens for push notifications
export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 500 }).notNull(),
  platform: mysqlEnum("platform", ["ios", "android", "web"]).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;

// Push Notification Queue - Queue for pending notifications
export const notificationQueue = mysqlTable("notificationQueue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  data: text("data"), // JSON string with additional data
  type: mysqlEnum("type", ["follow", "like", "comment", "message", "mention", "group", "system"]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationQueueItem = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueueItem = typeof notificationQueue.$inferInsert;

// Profile Themes - Customizable profile themes
export const profileThemes = mysqlTable("profileThemes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  previewImage: varchar("previewImage", { length: 500 }),
  backgroundColor: varchar("backgroundColor", { length: 7 }).default("#ffffff"),
  backgroundGradient: varchar("backgroundGradient", { length: 255 }), // e.g., "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  backgroundImage: varchar("backgroundImage", { length: 500 }),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0a7ea4"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#687076"),
  textColor: varchar("textColor", { length: 7 }).default("#11181C"),
  cardStyle: mysqlEnum("cardStyle", ["solid", "glass", "gradient", "outline"]).default("solid"),
  fontFamily: varchar("fontFamily", { length: 100 }).default("system"),
  creatorId: int("creatorId"), // null for system themes
  price: int("price").default(0), // 0 = free, otherwise coins
  isPremium: boolean("isPremium").default(false),
  isPublic: boolean("isPublic").default(true),
  usageCount: int("usageCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfileTheme = typeof profileThemes.$inferSelect;
export type InsertProfileTheme = typeof profileThemes.$inferInsert;

// User Theme Purchases - Track which themes users own
export const userThemes = mysqlTable("userThemes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  themeId: int("themeId").notNull(),
  isActive: boolean("isActive").default(false),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = typeof userThemes.$inferInsert;

// Group Messages - Messages within groups
export const groupMessages = mysqlTable("groupMessages", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "file", "system"]).default("text"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  replyToId: int("replyToId"), // For threaded replies
  isEdited: boolean("isEdited").default(false),
  isDeleted: boolean("isDeleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = typeof groupMessages.$inferInsert;

// Group Message Read Status - Track who has read which messages
export const groupMessageReads = mysqlTable("groupMessageReads", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  lastReadMessageId: int("lastReadMessageId"),
  lastReadAt: timestamp("lastReadAt").defaultNow().notNull(),
});

export type GroupMessageRead = typeof groupMessageReads.$inferSelect;
export type InsertGroupMessageRead = typeof groupMessageReads.$inferInsert;

// Group Typing Indicators - Track who is typing in groups
export const groupTypingIndicators = mysqlTable("groupTypingIndicators", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  isTyping: boolean("isTyping").default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupTypingIndicator = typeof groupTypingIndicators.$inferSelect;
export type InsertGroupTypingIndicator = typeof groupTypingIndicators.$inferInsert;
