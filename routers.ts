import { z } from "zod";
import bcrypt from "bcrypt";
import { generateSecret, generateURI, verifySync } from "otplib";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";

const SALT_ROUNDS = 12;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    
    signup: publicProcedure
      .input(z.object({
        email: z.string().email(),
        username: z.string().min(3),
        password: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log("[Auth] Signup attempt for:", input.email);
        
        // Check if user already exists
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          console.log("[Auth] Email already registered:", input.email);
          throw new Error("Email already registered");
        }
        
        // Hash password with bcrypt
        const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
        
        // Create new user with hashed password
        const user = await db.createUser({
          email: input.email,
          username: input.username,
          password: hashedPassword,
        });
        
        // Create JWT session token using the SDK (auto-login after signup)
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "User",
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        // Set session cookie with JWT token
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        
        console.log("[Auth] Signup successful for:", input.email, "userId:", user.id);
        return { success: true, userId: user.id };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log("[Auth] Login attempt for:", input.email);
        
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          console.log("[Auth] User not found:", input.email);
          throw new Error("Invalid email or password");
        }
        
        // Verify password with bcrypt
        const isValidPassword = user.password ? await bcrypt.compare(input.password, user.password) : false;
        if (!isValidPassword) {
          console.log("[Auth] Password mismatch for:", input.email);
          throw new Error("Invalid email or password");
        }
        
        // Create JWT session token using the SDK
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || user.email || "User",
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        // Set session cookie with JWT token
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);
        
        console.log("[Auth] Login successful for:", input.email, "userId:", user.id);
        return { success: true, userId: user.id };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Profile routes
  profile: router({
    getProfile: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getOrCreateProfile(input.userId);
      }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          bio: z.string().optional(),
          avatar: z.string().optional(),
          backgroundImage: z.string().optional(),
          profileColor: z.string().optional(),
          musicUrl: z.string().optional(),
          musicTitle: z.string().optional(),
          spotifyUrl: z.string().optional(),
          appleMusicUrl: z.string().optional(),
          youtubeUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Post routes
  posts: router({
    create: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1).max(5000),
          image: z.string().optional(),
          privacyLevel: z.enum(["public", "followers", "private"]).default("public"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const postId = await db.createPost({
          userId: ctx.user.id,
          content: input.content,
          image: input.image,
          privacyLevel: input.privacyLevel,
        });
        return { postId, success: true };
      }),

    // Upload image for post
    uploadImage: protectedProcedure
      .input(
        z.object({
          imageData: z.string(), // Base64 encoded image data
          mimeType: z.string().default("image/jpeg"),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Generate unique file key
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const extension = input.mimeType.split("/")[1] || "jpg";
          const fileName = input.fileName || `image_${timestamp}`;
          const fileKey = `posts/${ctx.user.id}/${fileName}-${randomSuffix}.${extension}`;

          // Decode base64 to buffer
          const imageBuffer = Buffer.from(input.imageData, "base64");

          // Upload to S3
          const { url } = await storagePut(fileKey, imageBuffer, input.mimeType);

          return { success: true, imageUrl: url };
        } catch (error) {
          console.error("[Posts] Image upload failed:", error);
          throw new Error("Failed to upload image");
        }
      }),

    getFeed: protectedProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0), followingOnly: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        return db.getFeed(ctx.user.id, input.limit, input.offset, input.followingOnly);
      }),

    getUserPosts: protectedProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .mutation(async ({ input }) => {
        return db.getUserPosts(input.userId, input.limit, input.offset);
      }),

    delete: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePost(input.postId);
        return { success: true };
      }),
  }),

  // Like routes
  likes: router({
    like: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.likePost(ctx.user.id, input.postId);
        return { success: true };
      }),

    unlike: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.unlikePost(ctx.user.id, input.postId);
        return { success: true };
      }),

    hasLiked: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.hasUserLikedPost(ctx.user.id, input.postId);
      }),
  }),

  // Comment routes
  comments: router({
    create: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          content: z.string().min(1).max(1000),
          parentCommentId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createComment({
          userId: ctx.user.id,
          postId: input.postId,
          content: input.content,
          parentCommentId: input.parentCommentId,
        });
        return { commentId, success: true };
      }),

    getPostComments: protectedProcedure
      .input(z.object({ postId: z.number(), limit: z.number().default(50) }))
      .mutation(async ({ input }) => {
        return db.getPostComments(input.postId, input.limit);
      }),
  }),

  // Follow routes
  follows: router({
    follow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.followUser(ctx.user.id, input.userId);
        return { success: true };
      }),

    unfollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.unfollowUser(ctx.user.id, input.userId);
        return { success: true };
      }),

    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.isFollowing(ctx.user.id, input.userId);
      }),

    getFollowers: protectedProcedure
      .input(z.object({ 
        userId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return db.getFollowers(input.userId, input.limit, input.offset);
      }),

    getFollowing: protectedProcedure
      .input(z.object({ 
        userId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        return db.getFollowing(input.userId, input.limit, input.offset);
      }),
  }),

  // Message routes
  messages: router({
    send: protectedProcedure
      .input(
        z.object({
          recipientId: z.number(),
          content: z.string().min(1).max(5000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const messageId = await db.sendMessage({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          content: input.content,
          isEncrypted: "true",
          isRead: "false",
        });
        return { messageId, success: true };
      }),

    getConversation: protectedProcedure
      .input(z.object({ userId: z.number(), limit: z.number().default(50) }))
      .mutation(async ({ ctx, input }) => {
        return db.getConversation(ctx.user.id, input.userId, input.limit);
      }),

    getConversations: protectedProcedure
      .input(z.object({}))
      .mutation(async ({ ctx }) => {
        return db.getConversations(ctx.user.id);
      }),
  }),

  // Group routes

  groups: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          icon: z.string().optional(),
          isAdult: z.boolean().default(false),
          accessType: z.enum(["public", "password", "invite"]).default("public"),
          password: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const groupId = await db.createGroup({
          creatorId: ctx.user.id,
          name: input.name,
          description: input.description,
          icon: input.icon,
          isAdult: input.isAdult ? "true" : "false",
          accessType: input.accessType,
          password: input.password,
        });
        await db.joinGroup(groupId, ctx.user.id);
        return { groupId, success: true };
      }),

    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .mutation(async ({ input }) => {
        return db.getGroups(input.limit, input.offset);
      }),

    getMembers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ input }) => {
        return db.getGroupMembers(input.groupId);
      }),

    join: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.joinGroup(input.groupId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Live Stream routes
  liveStreams: router({
    create: protectedProcedure
      .input(
        z.object({
          groupId: z.number().optional(),
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          isAdult: z.boolean().default(false),
          requiresPassword: z.boolean().default(false),
          password: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const streamId = await db.createLiveStream({
          hostId: ctx.user.id,
          groupId: input.groupId,
          title: input.title,
          description: input.description,
          isAdult: input.isAdult ? "true" : "false",
          requiresPassword: input.requiresPassword ? "true" : "false",
          password: input.password,
          status: "live",
        });
        return { streamId, success: true };
      }),

    list: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .mutation(async ({ input }) => {
        return db.getLiveStreams(input.limit);
      }),

    end: protectedProcedure
      .input(z.object({ streamId: z.number() }))
      .mutation(async ({ input }) => {
        await db.endLiveStream(input.streamId);
        return { success: true };
      }),
  }),

  // Marketplace routes
  marketplace: router({
    createListing: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().min(1).max(5000),
          price: z.number().min(0),
          image: z.string().optional(),
          category: z.string().optional(),
          condition: z.enum(["new", "like-new", "good", "fair"]).default("good"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const listingId = await db.createMarketplaceListing({
          sellerId: ctx.user.id,
          title: input.title,
          description: input.description,
          price: input.price,
          image: input.image,
          category: input.category,
          condition: input.condition,
          isVerified: "false",
          status: "active",
        });
        return { listingId, success: true };
      }),

    list: publicProcedure
      .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
      .mutation(async ({ input }) => {
        return db.getMarketplaceListings(input.limit, input.offset);
      }),

    getSellerListings: protectedProcedure
      .input(z.object({ sellerId: z.number() }))
      .mutation(async ({ input }) => {
        return db.getSellerListings(input.sellerId);
      }),

    createTransaction: protectedProcedure
      .input(
        z.object({
          listingId: z.number(),
          sellerId: z.number(),
          amount: z.number().min(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const transactionId = await db.createMarketplaceTransaction({
          listingId: input.listingId,
          buyerId: ctx.user.id,
          sellerId: input.sellerId,
          amount: input.amount,
          status: "pending",
        });
        return { transactionId, success: true };
      }),
  }),

  // Game routes
  games: router({
    getProgress: protectedProcedure
      .input(z.object({ gameName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.getOrCreateGameProgress(ctx.user.id, input.gameName);
      }),

    updateProgress: protectedProcedure
      .input(
        z.object({
          gameName: z.string(),
          score: z.number().optional(),
          level: z.number().optional(),
          coins: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateGameProgress(ctx.user.id, input.gameName, {
          score: input.score,
          level: input.level,
          coins: input.coins,
        });
        return { success: true };
      }),

    getLeaderboard: publicProcedure
      .input(z.object({ gameName: z.string(), limit: z.number().default(10) }))
      .mutation(async ({ input }) => {
        return db.getGameLeaderboard(input.gameName, input.limit);
      }),
  }),

  // Privacy Settings routes
  privacy: router({
    getSettings: protectedProcedure
      .input(z.object({}))
      .mutation(async ({ ctx }) => {
        return db.getOrCreatePrivacySettings(ctx.user.id);
      }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          blockList: z.string().optional(),
          muteList: z.string().optional(),
          allowMessages: z.enum(["all", "followers", "none"]).optional(),
          allowProfileView: z.enum(["all", "followers", "none"]).optional(),
          dataExportRequested: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updatePrivacySettings(ctx.user.id, {
          blockList: input.blockList,
          muteList: input.muteList,
          allowMessages: input.allowMessages,
          allowProfileView: input.allowProfileView,
          dataExportRequested: input.dataExportRequested ? "true" : "false",
        });
        return { success: true };
      }),
  }),

  // Content Moderation routes
  moderation: router({
    // Report content
    reportContent: protectedProcedure
      .input(
        z.object({
          contentType: z.enum(["post", "comment", "message", "user", "group"]),
          contentId: z.number(),
          reportedUserId: z.number(),
          reason: z.enum(["spam", "harassment", "hate_speech", "violence", "nudity", "misinformation", "copyright", "other"]),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const reportId = await db.createReport({
          reporterId: ctx.user.id,
          contentType: input.contentType,
          contentId: input.contentId,
          reportedUserId: input.reportedUserId,
          reason: input.reason,
          description: input.description,
        });
        return { success: true, reportId };
      }),

    // Get reports (admin only)
    getReports: protectedProcedure
      .input(
        z.object({
          status: z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.getReports(input.status, input.limit, input.offset);
      }),

    // Resolve report (admin only)
    resolveReport: protectedProcedure
      .input(
        z.object({
          reportId: z.number(),
          resolution: z.enum(["warning", "content_removed", "user_suspended", "user_banned", "no_action"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.resolveReport(input.reportId, ctx.user.id, input.resolution, input.notes);
      }),

    // Get content flags (admin only)
    getFlags: protectedProcedure
      .input(
        z.object({
          reviewStatus: z.enum(["pending", "confirmed", "false_positive"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.getFlags(input.reviewStatus, input.limit, input.offset);
      }),

    // Review flag (admin only)
    reviewFlag: protectedProcedure
      .input(
        z.object({
          flagId: z.number(),
          status: z.enum(["confirmed", "false_positive"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.reviewFlag(input.flagId, ctx.user.id, input.status);
      }),

    // Take moderation action (admin only)
    takeAction: protectedProcedure
      .input(
        z.object({
          targetUserId: z.number(),
          actionType: z.enum(["warning", "content_removed", "muted", "suspended", "banned", "unbanned", "appeal_approved", "appeal_denied"]),
          reason: z.string(),
          contentType: z.enum(["post", "comment", "message", "user", "group"]).optional(),
          contentId: z.number().optional(),
          duration: z.number().optional(), // hours
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        const expiresAt = input.duration ? new Date(Date.now() + input.duration * 60 * 60 * 1000) : undefined;
        const actionId = await db.createModerationAction({
          moderatorId: ctx.user.id,
          targetUserId: input.targetUserId,
          actionType: input.actionType,
          reason: input.reason,
          contentType: input.contentType,
          contentId: input.contentId,
          duration: input.duration,
          expiresAt,
        });
        return { success: true, actionId };
      }),

    // Get moderation history
    getModerationHistory: protectedProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.getModerationActions(input.userId, input.limit, input.offset);
      }),

    // Submit appeal
    submitAppeal: protectedProcedure
      .input(
        z.object({
          moderationActionId: z.number(),
          appealText: z.string().min(10),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const appealId = await db.createAppeal({
          userId: ctx.user.id,
          moderationActionId: input.moderationActionId,
          appealText: input.appealText,
        });
        return { success: true, appealId };
      }),

    // Get appeals (admin only)
    getAppeals: protectedProcedure
      .input(
        z.object({
          status: z.enum(["pending", "reviewing", "approved", "denied"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.getAppeals(input.status, input.limit, input.offset);
      }),

    // Review appeal (admin only)
    reviewAppeal: protectedProcedure
      .input(
        z.object({
          appealId: z.number(),
          status: z.enum(["approved", "denied"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.reviewAppeal(input.appealId, ctx.user.id, input.status, input.notes);
      }),

    // Get kindness score
    getKindnessScore: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getOrCreateKindnessScore(ctx.user.id);
    }),

    // Get kindness leaderboard
    getKindnessLeaderboard: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .mutation(async ({ input }) => {
        return db.getKindnessLeaderboard(input.limit);
      }),
  }),

  // Admin routes
  admin: router({
    // Get platform stats
    getStats: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }
      return db.getPlatformStats();
    }),

    // Get all users
    getUsers: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.getAllUsers(input.limit, input.offset);
      }),

    // Update user role
    updateUserRole: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.updateUserRole(input.userId, input.role);
      }),

    // Get analytics
    getAnalytics: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
        return db.getAnalytics(input.days);
      }),
  }),

  // ==================== DIFFERENTIATING FEATURES ====================

  // Enhanced Reactions
  reactions: router({
    add: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          reactionType: z.enum(["like", "love", "celebrate", "support", "insightful", "funny", "sad", "angry"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const reactionId = await db.addReaction({
          userId: ctx.user.id,
          postId: input.postId,
          reactionType: input.reactionType,
        });
        return { success: true, reactionId };
      }),

    remove: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeReaction(ctx.user.id, input.postId);
        return { success: true };
      }),

    getForPost: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        return db.getReactionCounts(input.postId);
      }),
  }),

  // Profile Visitors (MySpace-style)
  visitors: router({
    record: protectedProcedure
      .input(z.object({ profileUserId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.recordProfileVisit(input.profileUserId, ctx.user.id);
        return { success: true };
      }),

    getMyVisitors: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .mutation(async ({ ctx, input }) => {
        return db.getProfileVisitors(ctx.user.id, input.limit);
      }),
  }),

  // Time Capsules
  timeCapsules: router({
    create: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1).max(5000),
          image: z.string().optional(),
          privacyLevel: z.enum(["public", "followers", "private"]).default("public"),
          scheduledFor: z.string(), // ISO date string
        })
      )
      .mutation(async ({ ctx, input }) => {
        const capsuleId = await db.createTimeCapsule({
          userId: ctx.user.id,
          content: input.content,
          image: input.image,
          privacyLevel: input.privacyLevel,
          scheduledFor: new Date(input.scheduledFor),
        });
        return { success: true, capsuleId };
      }),

    getMine: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getUserTimeCapsules(ctx.user.id);
    }),
  }),

  // Digital Wellness
  wellness: router({
    getSettings: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getOrCreateWellnessSettings(ctx.user.id);
    }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          dailyLimitMinutes: z.number().min(0).optional(),
          digestModeEnabled: z.boolean().optional(),
          digestTime: z.string().optional(),
          breakRemindersEnabled: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateWellnessSettings(ctx.user.id, input);
        return { success: true };
      }),

    markCaughtUp: protectedProcedure
      .input(z.object({ lastPostId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markCaughtUp(ctx.user.id, input.lastPostId);
        return { success: true };
      }),

    checkCaughtUp: protectedProcedure.mutation(async ({ ctx }) => {
      const isCaughtUp = await db.checkIfCaughtUp(ctx.user.id);
      return { isCaughtUp };
    }),

    trackUsage: protectedProcedure
      .input(z.object({ minutes: z.number().min(0) }))
      .mutation(async ({ ctx, input }) => {
        // Track daily usage - could be stored in a separate table
        // For now, just acknowledge the tracking
        console.log(`User ${ctx.user.id} used app for ${input.minutes} minutes`);
        return { success: true, minutesTracked: input.minutes };
      }),
  }),

  // Appreciation Notes
  appreciation: router({
    send: protectedProcedure
      .input(
        z.object({
          recipientId: z.number(),
          message: z.string().min(1).max(500),
          postId: z.number().optional(),
          isAnonymous: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const noteId = await db.sendAppreciationNote({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          message: input.message,
          postId: input.postId,
          isAnonymous: input.isAnonymous,
        });
        return { success: true, noteId };
      }),

    getReceived: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .mutation(async ({ ctx, input }) => {
        return db.getReceivedAppreciationNotes(ctx.user.id, input.limit);
      }),

    markRead: protectedProcedure
      .input(z.object({ noteId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAppreciationNoteRead(input.noteId);
        return { success: true };
      }),
  }),

  // Top Friends (MySpace Top 8)
  topFriends: router({
    set: protectedProcedure
      .input(z.object({ friendIds: z.array(z.number()).max(8) }))
      .mutation(async ({ ctx, input }) => {
        await db.setTopFriends(ctx.user.id, input.friendIds);
        return { success: true };
      }),

    get: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return db.getTopFriends(input.userId);
      }),
  }),

  // Pokes (Classic Facebook feature)
  pokes: router({
    send: protectedProcedure
      .input(
        z.object({
          recipientId: z.number(),
          pokeType: z.enum(["poke", "wave", "high_five", "hug"]).default("poke"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const pokeId = await db.sendPoke({
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          pokeType: input.pokeType,
        });
        return { success: true, pokeId };
      }),

    getReceived: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(false) }))
      .mutation(async ({ ctx, input }) => {
        return db.getReceivedPokes(ctx.user.id, input.unreadOnly);
      }),

    markRead: protectedProcedure
      .input(z.object({ pokeId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markPokeRead(input.pokeId);
        return { success: true };
      }),
  }),

  // Two-Factor Authentication
  twoFactor: router({
    setup: protectedProcedure.mutation(async ({ ctx }) => {
      const secret = generateSecret();
      await db.setup2FA(ctx.user.id, secret);
      const otpauth = generateURI({
        issuer: "PrivateConnect",
        label: ctx.user.email || `user${ctx.user.id}`,
        secret,
      });
      return { secret, otpauth };
    }),

    verify: protectedProcedure
      .input(z.object({ token: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const status = await db.get2FAStatus(ctx.user.id);
        if (!status || !status.secret) {
          throw new Error("2FA not set up");
        }
        const isValid = verifySync({ token: input.token, secret: status.secret });
        if (!isValid) {
          throw new Error("Invalid verification code");
        }
        await db.enable2FA(ctx.user.id);
        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
        await db.saveBackupCodes(ctx.user.id, backupCodes);
        return { success: true, backupCodes };
      }),

    disable: protectedProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(ctx.user.email || "");
        if (!user || !user.password) {
          throw new Error("Cannot verify password");
        }
        const isValid = await bcrypt.compare(input.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }
        await db.disable2FA(ctx.user.id);
        return { success: true };
      }),

    status: protectedProcedure.mutation(async ({ ctx }) => {
      const status = await db.get2FAStatus(ctx.user.id);
      return { isEnabled: status?.isEnabled || false };
    }),
  }),

  // Account Management (GDPR)
  account: router({
    requestDeletion: protectedProcedure
      .input(z.object({ reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const requestId = await db.requestAccountDeletion(ctx.user.id, input.reason);
        return { success: true, requestId, scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
      }),

    cancelDeletion: protectedProcedure.mutation(async ({ ctx }) => {
      await db.cancelAccountDeletion(ctx.user.id);
      return { success: true };
    }),

    getDeletionStatus: protectedProcedure.mutation(async ({ ctx }) => {
      const status = await db.getAccountDeletionStatus(ctx.user.id);
      return status;
    }),

    getSessions: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getActiveSessions(ctx.user.id);
    }),

    revokeSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        await db.revokeSession(input.sessionId);
        return { success: true };
      }),

    revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
      await db.revokeAllSessions(ctx.user.id);
      return { success: true };
    }),
  }),

  // Memory Lane (On This Day)
  memories: router({
    getToday: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getMemories(ctx.user.id);
    }),

    hide: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.hideMemory(ctx.user.id, input.postId);
        return { success: true };
      }),
  }),

  // Push Notifications
  pushNotifications: router({
    registerToken: protectedProcedure
      .input(z.object({
        token: z.string(),
        platform: z.enum(["ios", "android", "web"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.savePushToken(ctx.user.id, input.token, input.platform);
        return { success: true, tokenId: result?.id };
      }),

    unregisterToken: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        await db.deactivatePushToken(input.token);
        return { success: true };
      }),

    getTokens: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getUserPushTokens(ctx.user.id);
    }),
  }),

  // Profile Themes Marketplace
  themes: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .mutation(async ({ input }) => {
        return db.getPublicThemes(input.limit, input.offset);
      }),

    featured: publicProcedure.mutation(async () => {
      return db.getFeaturedThemes();
    }),

    getById: publicProcedure
      .input(z.object({ themeId: z.number() }))
      .mutation(async ({ input }) => {
        return db.getThemeById(input.themeId);
      }),

    myThemes: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getUserOwnedThemes(ctx.user.id);
    }),

    purchase: protectedProcedure
      .input(z.object({ themeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.purchaseTheme(ctx.user.id, input.themeId);
        return { success: true, purchase: result };
      }),

    activate: protectedProcedure
      .input(z.object({ themeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.activateTheme(ctx.user.id, input.themeId);
        return { success: true };
      }),

    getActive: protectedProcedure.mutation(async ({ ctx }) => {
      return db.getActiveTheme(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        previewImage: z.string().optional(),
        backgroundColor: z.string().optional(),
        backgroundGradient: z.string().optional(),
        backgroundImage: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        textColor: z.string().optional(),
        cardStyle: z.enum(["solid", "glass", "gradient", "outline"]).optional(),
        fontFamily: z.string().optional(),
        price: z.number().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const theme = await db.createProfileTheme({
          ...input,
          creatorId: ctx.user.id,
        });
        return { success: true, theme };
      }),
  }),

  // Group Chat
  groupChat: router({
    sendMessage: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        content: z.string().min(1),
        messageType: z.enum(["text", "image", "file", "system"]).optional(),
        attachmentUrl: z.string().optional(),
        replyToId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const message = await db.sendGroupMessage(
          input.groupId,
          ctx.user.id,
          input.content,
          input.messageType || "text",
          input.attachmentUrl,
          input.replyToId
        );
        return { success: true, message };
      }),

    getMessages: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        limit: z.number().optional().default(50),
        beforeId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.getGroupMessages(input.groupId, input.limit, input.beforeId);
      }),

    editMessage: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.editGroupMessage(input.messageId, ctx.user.id, input.content);
        return { success: true };
      }),

    deleteMessage: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteGroupMessage(input.messageId, ctx.user.id);
        return { success: true };
      }),

    markRead: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        lastReadMessageId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateGroupReadStatus(input.groupId, ctx.user.id, input.lastReadMessageId);
        return { success: true };
      }),

    getUnreadCount: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const count = await db.getGroupUnreadCount(input.groupId, ctx.user.id);
        return { count };
      }),

    setTyping: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        isTyping: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.setGroupTypingStatus(input.groupId, ctx.user.id, input.isTyping);
        return { success: true };
      }),

    getTypingUsers: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.getGroupTypingUsers(input.groupId, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
