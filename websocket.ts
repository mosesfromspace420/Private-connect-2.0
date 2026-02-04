import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { COOKIE_NAME } from "../shared/const.js";
import { sdk } from "./_core/sdk";

let io: SocketIOServer | null = null;

// Track online users and their socket IDs
const onlineUsers = new Map<number, Set<string>>();
// Track typing status per conversation
const typingStatus = new Map<string, { userId: number; username: string; timestamp: number }>();

export function initializeWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", async (socket: Socket) => {
    console.log("[WebSocket] User connected:", socket.id);

    let userId: number | null = null;

    // Get user ID from cookie or auth message
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const cookieArray = cookies.split("; ");
      const sessionCookie = cookieArray.find((c: string) => c.startsWith(COOKIE_NAME));
      if (sessionCookie) {
        const token = sessionCookie.split("=")[1];
        try {
          // Verify the JWT token - returns { openId, appId, name }
          const session = await sdk.verifySession(token);
          if (session && session.openId) {
            // Extract user ID from openId (format: "user_123" or just the ID)
            const idMatch = session.openId.match(/\d+/);
            if (idMatch) {
              userId = parseInt(idMatch[0], 10);
            }
          }
        } catch (error) {
          console.log("[WebSocket] Invalid session token");
        }
      }
    }

    // Handle authentication message (for clients that can't send cookies)
    socket.on("auth", (data: { userId: number }) => {
      if (data.userId && !userId) {
        userId = data.userId;
        joinUserRoom(socket, userId);
      }
    });

    if (userId) {
      joinUserRoom(socket, userId);
    }

    // ==================== TYPING INDICATORS ====================
    socket.on("typing:start", (data: { conversationId: number; userId: number; username: string }) => {
      if (!userId) return;
      
      const key = `conv:${data.conversationId}`;
      typingStatus.set(key, {
        userId: data.userId,
        username: data.username,
        timestamp: Date.now(),
      });

      // Broadcast to conversation room
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId: data.userId,
        username: data.username,
      });

      console.log(`[WebSocket] User ${data.username} is typing in conversation ${data.conversationId}`);
    });

    socket.on("typing:stop", (data: { conversationId: number; userId: number }) => {
      if (!userId) return;

      const key = `conv:${data.conversationId}`;
      typingStatus.delete(key);

      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId: data.userId,
      });
    });

    // ==================== INSTANT MESSAGING ====================
    socket.on("message:send", (data: {
      recipientId: number;
      senderId: number;
      senderName: string;
      content: string;
      timestamp: string;
    }) => {
      if (!userId) return;

      const messageId = Math.random().toString(36).substr(2, 9);

      // Send to recipient immediately
      io?.to(`user:${data.recipientId}`).emit("message:new", {
        id: messageId,
        senderId: data.senderId,
        senderName: data.senderName,
        content: data.content,
        timestamp: data.timestamp,
      });

      // Confirm delivery to sender
      socket.emit("message:delivered", {
        messageId,
        recipientId: data.recipientId,
        timestamp: new Date().toISOString(),
      });

      console.log(`[WebSocket] Message from ${data.senderId} to ${data.recipientId}: ${data.content.slice(0, 30)}...`);
    });

    // ==================== CONVERSATION ROOMS ====================
    socket.on("conversation:join", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[WebSocket] User ${userId} joined conversation ${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`[WebSocket] User ${userId} left conversation ${conversationId}`);
    });

    // ==================== NOTIFICATIONS ====================
    socket.on("notification:read", (notificationId: string) => {
      console.log(`[WebSocket] Notification ${notificationId} marked as read by user ${userId}`);
    });

    socket.on("notification:read_all", () => {
      console.log(`[WebSocket] All notifications marked as read by user ${userId}`);
    });

    // ==================== REAL-TIME FEED UPDATES ====================
    socket.on("feed:subscribe", () => {
      socket.join("feed:global");
      console.log(`[WebSocket] User ${userId} subscribed to feed updates`);
    });

    socket.on("feed:unsubscribe", () => {
      socket.leave("feed:global");
    });

    // ==================== DISCONNECT ====================
    socket.on("disconnect", () => {
      console.log("[WebSocket] User disconnected:", socket.id);
      
      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            // Broadcast user went offline
            io?.emit("user:offline", { userId });
          }
        }
      }
    });
  });

  // Clean up stale typing indicators every 5 seconds
  setInterval(() => {
    const now = Date.now();
    typingStatus.forEach((value, key) => {
      if (now - value.timestamp > 5000) {
        typingStatus.delete(key);
      }
    });
  }, 5000);

  return io;
}

function joinUserRoom(socket: Socket, userId: number) {
  socket.join(`user:${userId}`);
  
  // Track online users
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
    // Broadcast user came online
    io?.emit("user:online", { userId });
  }
  onlineUsers.get(userId)?.add(socket.id);
  
  console.log(`[WebSocket] User ${userId} joined room user:${userId}`);
}

export function getWebSocketServer() {
  return io;
}

// ==================== SERVER-SIDE NOTIFICATION HELPERS ====================

export function sendNotification(userId: number, notification: Record<string, unknown>) {
  if (!io) return;

  io.to(`user:${userId}`).emit("notification:new", {
    id: Math.random().toString(36).substr(2, 9),
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

export function sendFollowNotification(followedUserId: number, follower: { id: number; name: string }) {
  if (!io) return;

  io.to(`user:${followedUserId}`).emit("notification:follow", {
    id: Math.random().toString(36).substr(2, 9),
    type: "follow",
    followerId: follower.id,
    followerName: follower.name,
    title: "New Follower",
    message: `${follower.name} started following you`,
    timestamp: new Date().toISOString(),
  });
}

export function sendLikeNotification(postOwnerId: number, liker: { id: number; name: string }, postId: number) {
  if (!io) return;

  io.to(`user:${postOwnerId}`).emit("notification:like", {
    id: Math.random().toString(36).substr(2, 9),
    type: "like",
    likerId: liker.id,
    likerName: liker.name,
    postId,
    title: "New Like",
    message: `${liker.name} liked your post`,
    timestamp: new Date().toISOString(),
  });
}

export function sendCommentNotification(
  postOwnerId: number,
  commenter: { id: number; name: string },
  postId: number,
  commentText: string
) {
  if (!io) return;

  io.to(`user:${postOwnerId}`).emit("notification:comment", {
    id: Math.random().toString(36).substr(2, 9),
    type: "comment",
    commenterId: commenter.id,
    commenterName: commenter.name,
    postId,
    commentText: commentText.slice(0, 100),
    title: "New Comment",
    message: `${commenter.name} commented: ${commentText.slice(0, 50)}`,
    timestamp: new Date().toISOString(),
  });
}

export function sendMessageNotification(
  recipientId: number,
  sender: { id: number; name: string },
  messagePreview: string
) {
  if (!io) return;

  io.to(`user:${recipientId}`).emit("notification:message", {
    id: Math.random().toString(36).substr(2, 9),
    type: "message",
    senderId: sender.id,
    senderName: sender.name,
    messagePreview: messagePreview.slice(0, 100),
    title: "New Message",
    message: `${sender.name}: ${messagePreview.slice(0, 50)}`,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastFeedUpdate(post: Record<string, unknown>) {
  if (!io) return;

  io.to("feed:global").emit("feed:update", {
    type: "new_post",
    post,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastNotification(notification: Record<string, unknown>) {
  if (!io) return;
  
  io.emit("notification:broadcast", {
    id: Math.random().toString(36).substr(2, 9),
    ...notification,
    timestamp: new Date().toISOString(),
  });
}

export function isUserOnline(userId: number): boolean {
  return onlineUsers.has(userId);
}

export function getOnlineUserCount(): number {
  return onlineUsers.size;
}
