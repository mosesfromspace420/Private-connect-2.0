import { eq, and, desc, asc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  profiles,
  InsertProfile,
  posts,
  InsertPost,
  likes,
  InsertLike,
  comments,
  InsertComment,
  follows,
  InsertFollow,
  messages,
  InsertMessage,
  groups,
  InsertGroup,
  groupMembers,
  InsertGroupMember,
  liveStreams,
  InsertLiveStream,
  marketplaceListings,
  InsertMarketplaceListing,
  marketplaceTransactions,
  InsertMarketplaceTransaction,
  gameProgress,
  InsertGameProgress,
  privacySettings,
  InsertPrivacySetting,
  twoFactorAuth,
  accountDeletionRequests,
  memories,
  notificationBatches,
  userSessions,
  pushTokens,
  InsertPushToken,
  notificationQueue,
  InsertNotificationQueueItem,
  profileThemes,
  InsertProfileTheme,
  userThemes,
  InsertUserTheme,
  groupMessages,
  InsertGroupMessage,
  groupMessageReads,
  InsertGroupMessageRead,
  groupTypingIndicators,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Profile queries
export async function getOrCreateProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let profile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  if (profile.length === 0) {
    await db.insert(profiles).values({ userId });
    profile = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  }

  return profile[0];
}

export async function updateProfile(userId: number, data: Partial<InsertProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(profiles).set(data).where(eq(profiles.userId, userId));
}

// Post queries
export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values(data);
  return result[0]?.insertId || 0;
}

export async function getFeed(userId: number, limit = 20, offset = 0, followingOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (followingOnly) {
    // Get posts only from users that the current user follows
    return db
      .select()
      .from(posts)
      .innerJoin(follows, eq(posts.userId, follows.followingId))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)
      .then(results => results.map(r => r.posts));
  }

  // Get all public posts
  return db
    .select()
    .from(posts)
    .where(eq(posts.privacyLevel, "public"))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserPosts(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function deletePost(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(posts).where(eq(posts.id, postId));
}

// Like queries
export async function likePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(likes).values({ userId, postId });
  await db.update(posts).set({ likeCount: sql`likeCount + 1` }).where(eq(posts.id, postId));
}

export async function unlikePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  await db.update(posts).set({ likeCount: sql`likeCount - 1` }).where(eq(posts.id, postId));
}

export async function hasUserLikedPost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
    .limit(1);

  return result.length > 0;
}

// Comment queries
export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values(data);
  await db.update(posts).set({ commentCount: sql`commentCount + 1` }).where(eq(posts.id, data.postId));
  return result[0]?.insertId || 0;
}

export async function getPostComments(postId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt)).limit(limit);
}

// Follow queries
export async function followUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(follows).values({ followerId, followingId });
  await db.update(profiles).set({ followerCount: sql`followerCount + 1` }).where(eq(profiles.userId, followingId));
  await db.update(profiles).set({ followingCount: sql`followingCount + 1` }).where(eq(profiles.userId, followerId));
}

export async function unfollowUser(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  await db.update(profiles).set({ followerCount: sql`followerCount - 1` }).where(eq(profiles.userId, followingId));
  await db.update(profiles).set({ followingCount: sql`followingCount - 1` }).where(eq(profiles.userId, followerId));
}

export async function isFollowing(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);

  return result.length > 0;
}

export async function getFollowers(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: users.id,
      username: users.name,
      email: users.email,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followerId, users.id))
    .where(eq(follows.followingId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getFollowing(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: users.id,
      username: users.name,
      email: users.email,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(users, eq(follows.followingId, users.id))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(follows.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

// Message queries
export async function sendMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  return result[0]?.insertId || 0;
}

export async function getConversation(userId1: number, userId2: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(messages)
    .where(
      sql`(senderId = ${userId1} AND recipientId = ${userId2}) OR (senderId = ${userId2} AND recipientId = ${userId1})`
    )
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

// Group queries
export async function createGroup(data: InsertGroup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(groups).values(data);
  return result[0]?.insertId || 0;
}

export async function getGroups(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(groups).orderBy(desc(groups.createdAt)).limit(limit).offset(offset);
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
}

export async function joinGroup(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(groupMembers).values({ groupId, userId });
  await db.update(groups).set({ memberCount: sql`memberCount + 1` }).where(eq(groups.id, groupId));
}

// Live Stream queries
export async function createLiveStream(data: InsertLiveStream) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(liveStreams).values(data);
  return result[0]?.insertId || 0;
}

export async function getLiveStreams(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(liveStreams)
    .where(eq(liveStreams.status, "live"))
    .orderBy(desc(liveStreams.startedAt))
    .limit(limit);
}

export async function endLiveStream(streamId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(liveStreams).set({ status: "ended", endedAt: new Date() }).where(eq(liveStreams.id, streamId));
}

// Marketplace queries
export async function createMarketplaceListing(data: InsertMarketplaceListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(marketplaceListings).values(data);
  return result[0]?.insertId || 0;
}

export async function getMarketplaceListings(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.status, "active"))
    .orderBy(desc(marketplaceListings.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getSellerListings(sellerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.sellerId, sellerId))
    .orderBy(desc(marketplaceListings.createdAt));
}

export async function createMarketplaceTransaction(data: InsertMarketplaceTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(marketplaceTransactions).values(data);
  return result[0]?.insertId || 0;
}

// Game queries
export async function getOrCreateGameProgress(userId: number, gameName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let progress = await db
    .select()
    .from(gameProgress)
    .where(and(eq(gameProgress.userId, userId), eq(gameProgress.gameName, gameName)))
    .limit(1);

  if (progress.length === 0) {
    await db.insert(gameProgress).values({ userId, gameName });
    progress = await db
      .select()
      .from(gameProgress)
      .where(and(eq(gameProgress.userId, userId), eq(gameProgress.gameName, gameName)))
      .limit(1);
  }

  return progress[0];
}

export async function updateGameProgress(userId: number, gameName: string, data: Partial<InsertGameProgress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(gameProgress)
    .set(data)
    .where(and(eq(gameProgress.userId, userId), eq(gameProgress.gameName, gameName)));
}

export async function getGameLeaderboard(gameName: string, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(gameProgress)
    .where(eq(gameProgress.gameName, gameName))
    .orderBy(desc(gameProgress.score))
    .limit(limit);
}

// Privacy Settings queries
export async function getOrCreatePrivacySettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let settings = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);

  if (settings.length === 0) {
    await db.insert(privacySettings).values({ userId });
    settings = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);
  }

  return settings[0];
}

export async function updatePrivacySettings(userId: number, data: Partial<InsertPrivacySetting>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(privacySettings).set(data).where(eq(privacySettings.userId, userId));
}


// Authentication functions
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting user by email:", error);
    return null;
  }
}

export async function createUser(data: { email: string; username: string; password: string }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(users).values({
      email: data.email,
      name: data.username,
      password: data.password,
      openId: `user_${Date.now()}`,
      loginMethod: "email",
      lastSignedIn: new Date(),
    });

    // Get the inserted user
    const user = await getUserByEmail(data.email);
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  } catch (error) {
    console.error("[Database] Error creating user:", error);
    throw error;
  }
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(users).set({ password: newPassword }).where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Error updating password:", error);
    throw error;
  }
}


export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all unique conversations for the user
  const result = await db
    .selectDistinct({
      id: messages.id,
      otherUserId: sql<number>`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.recipientId} ELSE ${messages.senderId} END`,
      lastMessage: messages.content,
      lastMessageTime: messages.createdAt,
      unreadCount: sql<number>`SUM(CASE WHEN ${messages.isRead} = 'false' AND ${messages.recipientId} = ${userId} THEN 1 ELSE 0 END)`,
    })
    .from(messages)
    .where(
      or(
        eq(messages.senderId, userId),
        eq(messages.recipientId, userId)
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(50);

  return result;
}


// ==================== CONTENT MODERATION ====================

import {
  contentReports,
  InsertContentReport,
  contentFlags,
  InsertContentFlag,
  moderationActions,
  InsertModerationAction,
  userAppeals,
  InsertUserAppeal,
  kindnessScores,
  InsertKindnessScore,
  platformAnalytics,
  InsertPlatformAnalytic,
} from "../drizzle/schema";

// Content Reports
export async function createReport(data: InsertContentReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contentReports).values(data);
  
  // Update kindness score for reported user
  await updateKindnessScore(data.reportedUserId, { reportsReceived: 1 });
  
  return result[0]?.insertId || 0;
}

export async function getReports(status?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return db
      .select()
      .from(contentReports)
      .where(eq(contentReports.status, status as "pending" | "reviewing" | "resolved" | "dismissed"))
      .orderBy(desc(contentReports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(contentReports)
    .orderBy(desc(contentReports.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getReportById(reportId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(contentReports)
    .where(eq(contentReports.id, reportId))
    .limit(1);

  return result[0] || null;
}

export async function updateReport(reportId: number, data: Partial<InsertContentReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contentReports).set(data).where(eq(contentReports.id, reportId));
}

export async function resolveReport(
  reportId: number,
  moderatorId: number,
  resolution: "warning" | "content_removed" | "user_suspended" | "user_banned" | "no_action",
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const report = await getReportById(reportId);
  if (!report) throw new Error("Report not found");

  await db.update(contentReports).set({
    status: "resolved",
    moderatorId,
    resolution,
    moderatorNotes: notes,
  }).where(eq(contentReports.id, reportId));

  // Update kindness scores
  if (resolution !== "no_action") {
    await updateKindnessScore(report.reportedUserId, { 
      reportsConfirmed: 1,
      negativeActions: 1,
    });
    // Reward the reporter for helpful report
    await updateKindnessScore(report.reporterId, { helpfulFlags: 1 });
  }

  return { success: true };
}

// Content Flags (AI/Auto-detection)
export async function createFlag(data: InsertContentFlag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contentFlags).values(data);
  return result[0]?.insertId || 0;
}

export async function getFlags(reviewStatus?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (reviewStatus) {
    return db
      .select()
      .from(contentFlags)
      .where(eq(contentFlags.reviewStatus, reviewStatus as "pending" | "confirmed" | "false_positive"))
      .orderBy(desc(contentFlags.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(contentFlags)
    .orderBy(desc(contentFlags.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function reviewFlag(
  flagId: number,
  reviewedBy: number,
  status: "confirmed" | "false_positive"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contentFlags).set({
    reviewedBy,
    reviewStatus: status,
  }).where(eq(contentFlags.id, flagId));

  return { success: true };
}

// Moderation Actions
export async function createModerationAction(data: InsertModerationAction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(moderationActions).values(data);
  
  // Update kindness score
  if (["warning", "content_removed", "muted", "suspended", "banned"].includes(data.actionType)) {
    await updateKindnessScore(data.targetUserId, { negativeActions: 1 });
  }
  
  return result[0]?.insertId || 0;
}

export async function getModerationActions(targetUserId?: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (targetUserId) {
    return db
      .select()
      .from(moderationActions)
      .where(eq(moderationActions.targetUserId, targetUserId))
      .orderBy(desc(moderationActions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(moderationActions)
    .orderBy(desc(moderationActions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserSuspensionStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(moderationActions)
    .where(
      and(
        eq(moderationActions.targetUserId, userId),
        sql`${moderationActions.actionType} IN ('suspended', 'banned')`,
        sql`(${moderationActions.expiresAt} IS NULL OR ${moderationActions.expiresAt} > NOW())`
      )
    )
    .orderBy(desc(moderationActions.createdAt))
    .limit(1);

  return result[0] || null;
}

// User Appeals
export async function createAppeal(data: InsertUserAppeal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userAppeals).values(data);
  return result[0]?.insertId || 0;
}

export async function getAppeals(status?: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status) {
    return db
      .select()
      .from(userAppeals)
      .where(eq(userAppeals.status, status as "pending" | "reviewing" | "approved" | "denied"))
      .orderBy(desc(userAppeals.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(userAppeals)
    .orderBy(desc(userAppeals.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function reviewAppeal(
  appealId: number,
  reviewedBy: number,
  status: "approved" | "denied",
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userAppeals).set({
    status,
    reviewedBy,
    reviewNotes: notes,
  }).where(eq(userAppeals.id, appealId));

  return { success: true };
}

// Kindness Scores
export async function getOrCreateKindnessScore(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let score = await db
    .select()
    .from(kindnessScores)
    .where(eq(kindnessScores.userId, userId))
    .limit(1);

  if (score.length === 0) {
    await db.insert(kindnessScores).values({ userId, score: 100 });
    score = await db
      .select()
      .from(kindnessScores)
      .where(eq(kindnessScores.userId, userId))
      .limit(1);
  }

  return score[0];
}

export async function updateKindnessScore(
  userId: number,
  changes: {
    positiveActions?: number;
    negativeActions?: number;
    reportsReceived?: number;
    reportsConfirmed?: number;
    helpfulFlags?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure score exists
  await getOrCreateKindnessScore(userId);

  // Calculate score change
  let scoreChange = 0;
  if (changes.positiveActions) scoreChange += changes.positiveActions * 2;
  if (changes.negativeActions) scoreChange -= changes.negativeActions * 5;
  if (changes.reportsConfirmed) scoreChange -= changes.reportsConfirmed * 10;
  if (changes.helpfulFlags) scoreChange += changes.helpfulFlags * 3;

  await db.update(kindnessScores).set({
    score: sql`GREATEST(0, LEAST(200, score + ${scoreChange}))`,
    positiveActions: changes.positiveActions ? sql`positiveActions + ${changes.positiveActions}` : sql`positiveActions`,
    negativeActions: changes.negativeActions ? sql`negativeActions + ${changes.negativeActions}` : sql`negativeActions`,
    reportsReceived: changes.reportsReceived ? sql`reportsReceived + ${changes.reportsReceived}` : sql`reportsReceived`,
    reportsConfirmed: changes.reportsConfirmed ? sql`reportsConfirmed + ${changes.reportsConfirmed}` : sql`reportsConfirmed`,
    helpfulFlags: changes.helpfulFlags ? sql`helpfulFlags + ${changes.helpfulFlags}` : sql`helpfulFlags`,
    lastUpdated: new Date(),
  }).where(eq(kindnessScores.userId, userId));
}

export async function getKindnessLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      userId: kindnessScores.userId,
      score: kindnessScores.score,
      positiveActions: kindnessScores.positiveActions,
    })
    .from(kindnessScores)
    .orderBy(desc(kindnessScores.score))
    .limit(limit);
}

// Platform Analytics
export async function recordDailyAnalytics(data: InsertPlatformAnalytic) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(platformAnalytics).values(data);
  return result[0]?.insertId || 0;
}

export async function getAnalytics(days = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(platformAnalytics)
    .orderBy(desc(platformAnalytics.date))
    .limit(days);
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [postCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(posts);
  const [reportCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(contentReports);
  const [pendingReports] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(contentReports)
    .where(eq(contentReports.status, "pending"));

  return {
    totalUsers: userCount?.count || 0,
    totalPosts: postCount?.count || 0,
    totalReports: reportCount?.count || 0,
    pendingReports: pendingReports?.count || 0,
  };
}

// Get user by ID
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}

// Get all users (for admin)
export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

// Update user role
export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}


// ==================== DIFFERENTIATING FEATURES ====================

import {
  reactions,
  InsertReaction,
  profileVisitors,
  InsertProfileVisitor,
  timeCapsules,
  InsertTimeCapsule,
  userWellness,
  InsertUserWellness,
  appreciationNotes,
  InsertAppreciationNote,
  topFriends,
  InsertTopFriend,
  pokes,
  InsertPoke,
} from "../drizzle/schema";

// Enhanced Reactions
export async function addReaction(data: InsertReaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remove existing reaction from same user on same post
  await db.delete(reactions).where(
    and(eq(reactions.userId, data.userId), eq(reactions.postId, data.postId))
  );

  const result = await db.insert(reactions).values(data);
  return result[0]?.insertId || 0;
}

export async function removeReaction(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(reactions).where(
    and(eq(reactions.userId, userId), eq(reactions.postId, postId))
  );
}

export async function getPostReactions(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(reactions).where(eq(reactions.postId, postId));
}

export async function getReactionCounts(postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      reactionType: reactions.reactionType,
      count: sql<number>`COUNT(*)`,
    })
    .from(reactions)
    .where(eq(reactions.postId, postId))
    .groupBy(reactions.reactionType);

  return result;
}

// Profile Visitors
export async function recordProfileVisit(profileUserId: number, visitorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Don't record self-visits
  if (profileUserId === visitorUserId) return;

  // Check if visitor already exists
  const existing = await db
    .select()
    .from(profileVisitors)
    .where(
      and(
        eq(profileVisitors.profileUserId, profileUserId),
        eq(profileVisitors.visitorUserId, visitorUserId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update visit count and last visited
    await db.update(profileVisitors).set({
      visitCount: sql`visitCount + 1`,
      lastVisited: new Date(),
    }).where(eq(profileVisitors.id, existing[0].id));
  } else {
    // Create new visitor record
    await db.insert(profileVisitors).values({
      profileUserId,
      visitorUserId,
    });
  }
}

export async function getProfileVisitors(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: profileVisitors.id,
      visitorUserId: profileVisitors.visitorUserId,
      visitCount: profileVisitors.visitCount,
      lastVisited: profileVisitors.lastVisited,
      visitorName: users.name,
    })
    .from(profileVisitors)
    .innerJoin(users, eq(profileVisitors.visitorUserId, users.id))
    .where(eq(profileVisitors.profileUserId, userId))
    .orderBy(desc(profileVisitors.lastVisited))
    .limit(limit);
}

// Time Capsules
export async function createTimeCapsule(data: InsertTimeCapsule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(timeCapsules).values(data);
  return result[0]?.insertId || 0;
}

export async function getUserTimeCapsules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(timeCapsules)
    .where(eq(timeCapsules.userId, userId))
    .orderBy(asc(timeCapsules.scheduledFor));
}

export async function getScheduledTimeCapsules() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(timeCapsules)
    .where(
      and(
        eq(timeCapsules.status, "scheduled"),
        sql`${timeCapsules.scheduledFor} <= NOW()`
      )
    );
}

export async function publishTimeCapsule(capsuleId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(timeCapsules).set({
    status: "published",
    publishedPostId: postId,
  }).where(eq(timeCapsules.id, capsuleId));
}

// User Wellness
export async function getOrCreateWellnessSettings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let settings = await db
    .select()
    .from(userWellness)
    .where(eq(userWellness.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    await db.insert(userWellness).values({ userId });
    settings = await db
      .select()
      .from(userWellness)
      .where(eq(userWellness.userId, userId))
      .limit(1);
  }

  return settings[0];
}

export async function updateWellnessSettings(userId: number, data: Partial<InsertUserWellness>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userWellness).set(data).where(eq(userWellness.userId, userId));
}

export async function markCaughtUp(userId: number, lastPostId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userWellness).set({
    lastSeenPostId: lastPostId,
    lastCaughtUpAt: new Date(),
  }).where(eq(userWellness.userId, userId));
}

export async function checkIfCaughtUp(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const wellness = await getOrCreateWellnessSettings(userId);
  
  // Get the latest post from followed users
  const latestPost = await db
    .select({ id: posts.id })
    .from(posts)
    .innerJoin(follows, eq(posts.userId, follows.followingId))
    .where(eq(follows.followerId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(1);

  if (latestPost.length === 0) return true;
  
  return (wellness.lastSeenPostId ?? 0) >= latestPost[0].id;
}

// Appreciation Notes
export async function sendAppreciationNote(data: InsertAppreciationNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(appreciationNotes).values(data);
  
  // Update kindness score for sender
  await updateKindnessScore(data.senderId, { positiveActions: 1 });
  
  return result[0]?.insertId || 0;
}

export async function getReceivedAppreciationNotes(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: appreciationNotes.id,
      senderId: appreciationNotes.senderId,
      senderName: sql<string>`CASE WHEN ${appreciationNotes.isAnonymous} = true THEN 'Anonymous' ELSE ${users.name} END`,
      message: appreciationNotes.message,
      postId: appreciationNotes.postId,
      isAnonymous: appreciationNotes.isAnonymous,
      isRead: appreciationNotes.isRead,
      createdAt: appreciationNotes.createdAt,
    })
    .from(appreciationNotes)
    .leftJoin(users, eq(appreciationNotes.senderId, users.id))
    .where(eq(appreciationNotes.recipientId, userId))
    .orderBy(desc(appreciationNotes.createdAt))
    .limit(limit);
}

export async function markAppreciationNoteRead(noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(appreciationNotes).set({ isRead: true }).where(eq(appreciationNotes.id, noteId));
}

// Top Friends
export async function setTopFriends(userId: number, friendIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remove existing top friends
  await db.delete(topFriends).where(eq(topFriends.userId, userId));

  // Add new top friends (max 8)
  const topFriendsData = friendIds.slice(0, 8).map((friendId, index) => ({
    userId,
    friendId,
    position: index + 1,
  }));

  if (topFriendsData.length > 0) {
    await db.insert(topFriends).values(topFriendsData);
  }
}

export async function getTopFriends(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      position: topFriends.position,
      friendId: topFriends.friendId,
      friendName: users.name,
    })
    .from(topFriends)
    .innerJoin(users, eq(topFriends.friendId, users.id))
    .where(eq(topFriends.userId, userId))
    .orderBy(asc(topFriends.position));
}

// Pokes
export async function sendPoke(data: InsertPoke) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pokes).values(data);
  return result[0]?.insertId || 0;
}

export async function getReceivedPokes(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = db
    .select({
      id: pokes.id,
      senderId: pokes.senderId,
      senderName: users.name,
      pokeType: pokes.pokeType,
      isRead: pokes.isRead,
      createdAt: pokes.createdAt,
    })
    .from(pokes)
    .innerJoin(users, eq(pokes.senderId, users.id))
    .where(
      unreadOnly
        ? and(eq(pokes.recipientId, userId), eq(pokes.isRead, false))
        : eq(pokes.recipientId, userId)
    )
    .orderBy(desc(pokes.createdAt))
    .limit(50);

  return query;
}

export async function markPokeRead(pokeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(pokes).set({ isRead: true }).where(eq(pokes.id, pokeId));
}


// ============================================
// TWO-FACTOR AUTHENTICATION
// ============================================

export async function setup2FA(userId: number, secret: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(twoFactorAuth)
    .values({ userId, secret, isEnabled: false })
    .onDuplicateKeyUpdate({ set: { secret, isEnabled: false } });
}

export async function enable2FA(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(twoFactorAuth)
    .set({ isEnabled: true })
    .where(eq(twoFactorAuth.userId, userId));
}

export async function disable2FA(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(twoFactorAuth)
    .set({ isEnabled: false })
    .where(eq(twoFactorAuth.userId, userId));
}

export async function get2FAStatus(userId: number): Promise<{ isEnabled: boolean; secret?: string } | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(twoFactorAuth)
    .where(eq(twoFactorAuth.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function saveBackupCodes(userId: number, codes: string[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(twoFactorAuth)
    .set({ backupCodes: JSON.stringify(codes) })
    .where(eq(twoFactorAuth.userId, userId));
}

// ============================================
// ACCOUNT DELETION (GDPR COMPLIANCE)
// ============================================

export async function requestAccountDeletion(userId: number, reason?: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 30); // 30 day grace period

  const result = await db.insert(accountDeletionRequests).values({
    userId,
    reason,
    status: "pending",
    scheduledDeletionAt: scheduledDate,
  });
  return Number(result[0].insertId);
}

export async function cancelAccountDeletion(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(accountDeletionRequests)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(accountDeletionRequests.userId, userId),
        eq(accountDeletionRequests.status, "pending")
      )
    );
}

export async function getAccountDeletionStatus(userId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.userId, userId))
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(1);
  return result[0] || null;
}

export async function processAccountDeletion(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Mark as processing
  await db
    .update(accountDeletionRequests)
    .set({ status: "processing" })
    .where(
      and(
        eq(accountDeletionRequests.userId, userId),
        eq(accountDeletionRequests.status, "pending")
      )
    );

  // Delete user data (in production, this would be more comprehensive)
  await db.delete(posts).where(eq(posts.userId, userId));
  await db.delete(comments).where(eq(comments.userId, userId));
  await db.delete(likes).where(eq(likes.userId, userId));
  await db.delete(follows).where(eq(follows.followerId, userId));
  await db.delete(follows).where(eq(follows.followingId, userId));
  await db.delete(messages).where(eq(messages.senderId, userId));
  await db.delete(profiles).where(eq(profiles.userId, userId));

  // Mark as completed
  await db
    .update(accountDeletionRequests)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(accountDeletionRequests.userId, userId));

  // Finally delete the user
  await db.delete(users).where(eq(users.id, userId));
}

// ============================================
// MEMORY LANE (ON THIS DAY)
// ============================================

export async function getMemories(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Find posts from previous years on this day
  const memoriesResult = await db
    .select({
      id: posts.id,
      content: posts.content,
      image: posts.image,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        sql`MONTH(${posts.createdAt}) = ${month}`,
        sql`DAY(${posts.createdAt}) = ${day}`,
        sql`YEAR(${posts.createdAt}) < YEAR(NOW())`
      )
    )
    .orderBy(desc(posts.createdAt));

  return memoriesResult.map((m) => ({
    ...m,
    yearsAgo: today.getFullYear() - new Date(m.createdAt).getFullYear(),
  }));
}

export async function hideMemory(userId: number, postId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(memories).values({
    userId,
    postId,
    memoryDate: new Date(),
    yearsAgo: 0,
    isHidden: true,
  });
}

// ============================================
// NOTIFICATION BATCHING
// ============================================

export async function createNotificationBatch(
  userId: number,
  notificationIds: number[],
  batchType: "daily" | "weekly",
  scheduledFor: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notificationBatches).values({
    userId,
    notificationIds: JSON.stringify(notificationIds),
    batchType,
    scheduledFor,
  });
  return Number(result[0].insertId);
}

export async function getPendingBatches(): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(notificationBatches)
    .where(
      and(
        sql`${notificationBatches.sentAt} IS NULL`,
        sql`${notificationBatches.scheduledFor} <= NOW()`
      )
    );
}

export async function markBatchSent(batchId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notificationBatches)
    .set({ sentAt: new Date() })
    .where(eq(notificationBatches.id, batchId));
}

// ============================================
// USER SESSIONS (SECURITY)
// ============================================

export async function createSession(
  userId: number,
  sessionToken: string,
  deviceInfo: object,
  ipAddress: string,
  expiresAt: Date
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userSessions).values({
    userId,
    sessionToken,
    deviceInfo: JSON.stringify(deviceInfo),
    ipAddress,
    expiresAt,
  });
  return Number(result[0].insertId);
}

export async function getActiveSessions(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        sql`${userSessions.expiresAt} > NOW()`
      )
    )
    .orderBy(desc(userSessions.lastActive));
}

export async function revokeSession(sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export async function revokeAllSessions(userId: number, exceptSessionId?: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (exceptSessionId) {
    await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          sql`${userSessions.id} != ${exceptSessionId}`
        )
      );
  } else {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
  }
}


// ============================================
// PUSH NOTIFICATIONS
// ============================================

export async function savePushToken(userId: number, token: string, platform: "ios" | "android" | "web") {
  const db = await getDb();
  if (!db) return null;
  
  // Check if token already exists
  const existing = await db.select().from(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
  
  if (existing.length > 0) {
    // Update existing token
    await db.update(pushTokens).set({ isActive: true, updatedAt: new Date() }).where(eq(pushTokens.id, existing[0].id));
    return existing[0];
  }
  
  // Insert new token
  const result = await db.insert(pushTokens).values({ userId, token, platform });
  return { id: result[0].insertId, userId, token, platform };
}

export async function getUserPushTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));
}

export async function deactivatePushToken(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(pushTokens).set({ isActive: false }).where(eq(pushTokens.token, token));
}

export async function queueNotification(
  userId: number,
  title: string,
  body: string,
  type: "follow" | "like" | "comment" | "message" | "mention" | "group" | "system",
  data?: Record<string, any>
) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(notificationQueue).values({
    userId,
    title,
    body,
    type,
    data: data ? JSON.stringify(data) : null,
    status: "pending",
  });
  
  return { id: result[0].insertId };
}

export async function getPendingNotifications(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notificationQueue).where(eq(notificationQueue.status, "pending")).limit(limit);
}

export async function markNotificationSent(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificationQueue).set({ status: "sent", sentAt: new Date() }).where(eq(notificationQueue.id, notificationId));
}

export async function markNotificationFailed(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notificationQueue).set({ status: "failed" }).where(eq(notificationQueue.id, notificationId));
}

// ============================================
// PROFILE THEMES
// ============================================

export async function createProfileTheme(theme: Omit<InsertProfileTheme, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(profileThemes).values(theme);
  return { id: result[0].insertId, ...theme };
}

export async function getPublicThemes(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(profileThemes).where(eq(profileThemes.isPublic, true)).orderBy(desc(profileThemes.usageCount)).limit(limit).offset(offset);
}

export async function getFeaturedThemes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(profileThemes).where(and(eq(profileThemes.isPublic, true), eq(profileThemes.isPremium, false))).orderBy(desc(profileThemes.usageCount)).limit(10);
}

export async function getThemeById(themeId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(profileThemes).where(eq(profileThemes.id, themeId));
  return result[0] || null;
}

export async function getUserOwnedThemes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const owned = await db.select().from(userThemes).where(eq(userThemes.userId, userId));
  if (owned.length === 0) return [];
  
  const themeIds = owned.map(o => o.themeId);
  const themes = await db.select().from(profileThemes).where(sql`${profileThemes.id} IN (${themeIds.join(",")})`);
  
  return themes.map(theme => ({
    ...theme,
    isActive: owned.find(o => o.themeId === theme.id)?.isActive || false,
  }));
}

export async function purchaseTheme(userId: number, themeId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if already owned
  const existing = await db.select().from(userThemes).where(and(eq(userThemes.userId, userId), eq(userThemes.themeId, themeId)));
  if (existing.length > 0) return existing[0];
  
  // Add to user's themes
  const result = await db.insert(userThemes).values({ userId, themeId });
  
  // Increment usage count
  await db.update(profileThemes).set({ usageCount: sql`${profileThemes.usageCount} + 1` }).where(eq(profileThemes.id, themeId));
  
  return { id: result[0].insertId, userId, themeId };
}

export async function activateTheme(userId: number, themeId: number) {
  const db = await getDb();
  if (!db) return false;
  
  // Deactivate all other themes for this user
  await db.update(userThemes).set({ isActive: false }).where(eq(userThemes.userId, userId));
  
  // Activate the selected theme
  await db.update(userThemes).set({ isActive: true }).where(and(eq(userThemes.userId, userId), eq(userThemes.themeId, themeId)));
  
  return true;
}

export async function getActiveTheme(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const active = await db.select().from(userThemes).where(and(eq(userThemes.userId, userId), eq(userThemes.isActive, true)));
  if (active.length === 0) return null;
  
  return getThemeById(active[0].themeId);
}

// ============================================
// GROUP CHAT
// ============================================

export async function sendGroupMessage(groupId: number, senderId: number, content: string, messageType: "text" | "image" | "file" | "system" = "text", attachmentUrl?: string, replyToId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(groupMessages).values({
    groupId,
    senderId,
    content,
    messageType,
    attachmentUrl,
    replyToId,
  });
  
  return { id: result[0].insertId, groupId, senderId, content, messageType, attachmentUrl, replyToId, createdAt: new Date() };
}

export async function getGroupMessages(groupId: number, limit = 50, beforeId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select({
    id: groupMessages.id,
    groupId: groupMessages.groupId,
    senderId: groupMessages.senderId,
    content: groupMessages.content,
    messageType: groupMessages.messageType,
    attachmentUrl: groupMessages.attachmentUrl,
    replyToId: groupMessages.replyToId,
    isEdited: groupMessages.isEdited,
    isDeleted: groupMessages.isDeleted,
    createdAt: groupMessages.createdAt,
    senderName: users.name,
  })
    .from(groupMessages)
    .leftJoin(users, eq(groupMessages.senderId, users.id))
    .where(beforeId 
      ? and(eq(groupMessages.groupId, groupId), sql`${groupMessages.id} < ${beforeId}`, eq(groupMessages.isDeleted, false))
      : and(eq(groupMessages.groupId, groupId), eq(groupMessages.isDeleted, false))
    )
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit);
  
  const messages = await query;
  return messages.reverse(); // Return in chronological order
}

export async function editGroupMessage(messageId: number, senderId: number, newContent: string) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.update(groupMessages)
    .set({ content: newContent, isEdited: true })
    .where(and(eq(groupMessages.id, messageId), eq(groupMessages.senderId, senderId)));
  
  return true;
}

export async function deleteGroupMessage(messageId: number, senderId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.update(groupMessages)
    .set({ isDeleted: true, content: "[Message deleted]" })
    .where(and(eq(groupMessages.id, messageId), eq(groupMessages.senderId, senderId)));
  
  return true;
}

export async function updateGroupReadStatus(groupId: number, userId: number, lastReadMessageId: number) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(groupMessageReads).where(and(eq(groupMessageReads.groupId, groupId), eq(groupMessageReads.userId, userId)));
  
  if (existing.length > 0) {
    await db.update(groupMessageReads)
      .set({ lastReadMessageId, lastReadAt: new Date() })
      .where(eq(groupMessageReads.id, existing[0].id));
  } else {
    await db.insert(groupMessageReads).values({ groupId, userId, lastReadMessageId });
  }
}

export async function getGroupUnreadCount(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const readStatus = await db.select().from(groupMessageReads).where(and(eq(groupMessageReads.groupId, groupId), eq(groupMessageReads.userId, userId)));
  
  const lastReadId = readStatus[0]?.lastReadMessageId || 0;
  
  const unread = await db.select({ count: sql<number>`COUNT(*)` })
    .from(groupMessages)
    .where(and(eq(groupMessages.groupId, groupId), sql`${groupMessages.id} > ${lastReadId}`, eq(groupMessages.isDeleted, false)));
  
  return unread[0]?.count || 0;
}

export async function setGroupTypingStatus(groupId: number, userId: number, isTyping: boolean) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(groupTypingIndicators).where(and(eq(groupTypingIndicators.groupId, groupId), eq(groupTypingIndicators.userId, userId)));
  
  if (existing.length > 0) {
    await db.update(groupTypingIndicators).set({ isTyping }).where(eq(groupTypingIndicators.id, existing[0].id));
  } else {
    await db.insert(groupTypingIndicators).values({ groupId, userId, isTyping });
  }
}

export async function getGroupTypingUsers(groupId: number, excludeUserId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const typing = await db.select({
    userId: groupTypingIndicators.userId,
    userName: users.name,
  })
    .from(groupTypingIndicators)
    .leftJoin(users, eq(groupTypingIndicators.userId, users.id))
    .where(and(
      eq(groupTypingIndicators.groupId, groupId),
      eq(groupTypingIndicators.isTyping, true),
      sql`${groupTypingIndicators.userId} != ${excludeUserId}`
    ));
  
  return typing;
}
