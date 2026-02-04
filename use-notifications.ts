import { useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useAuth } from "./use-auth";

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "message" | "mention" | "typing";
  title: string;
  message: string;
  userId?: number;
  postId?: number;
  conversationId?: number;
  timestamp: Date;
  read: boolean;
}

// WebSocket connection state
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, { userId: number; username: string }>>(new Map());
  const typingTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Get WebSocket URL based on environment
  const getWebSocketUrl = useCallback(() => {
    if (Platform.OS === "web") {
      // For web, use the current host
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}`;
    }
    // For native, use the API server URL
    return process.env.EXPO_PUBLIC_API_URL?.replace("http", "ws") || "ws://localhost:3000";
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!user || socket?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl();
    console.log("[Notifications] Connecting to WebSocket:", wsUrl);

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[Notifications] WebSocket connected");
        setIsConnected(true);
        reconnectAttempts = 0;

        // Authenticate with user ID
        socket?.send(JSON.stringify({
          type: "auth",
          userId: user.id,
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[Notifications] Received:", data.type);

          switch (data.type) {
            case "notification:new":
            case "notification:follow":
            case "notification:like":
            case "notification:comment":
            case "notification:message":
              const notification: Notification = {
                id: data.id || Math.random().toString(36).substr(2, 9),
                type: data.notificationType || data.type.split(":")[1] || "message",
                title: data.title || getNotificationTitle(data),
                message: data.message || getNotificationMessage(data),
                userId: data.userId || data.senderId || data.followerId || data.likerId || data.commenterId,
                postId: data.postId,
                timestamp: new Date(data.timestamp || Date.now()),
                read: false,
              };
              setNotifications((prev) => [notification, ...prev].slice(0, 50));
              setUnreadCount((prev) => prev + 1);
              break;

            case "typing:start":
              // Add typing user
              setTypingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(data.conversationId, {
                  userId: data.userId,
                  username: data.username,
                });
                return newMap;
              });
              // Clear typing after 3 seconds
              const existingTimeout = typingTimeoutsRef.current.get(data.conversationId);
              if (existingTimeout) clearTimeout(existingTimeout);
              const timeout = setTimeout(() => {
                setTypingUsers((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(data.conversationId);
                  return newMap;
                });
              }, 3000);
              typingTimeoutsRef.current.set(data.conversationId, timeout);
              break;

            case "typing:stop":
              setTypingUsers((prev) => {
                const newMap = new Map(prev);
                newMap.delete(data.conversationId);
                return newMap;
              });
              break;

            case "message:delivered":
              // Handle instant message delivery confirmation
              console.log("[Notifications] Message delivered:", data.messageId);
              break;

            case "feed:update":
              // Handle real-time feed updates
              console.log("[Notifications] Feed updated");
              break;
          }
        } catch (error) {
          console.error("[Notifications] Failed to parse message:", error);
        }
      };

      socket.onclose = () => {
        console.log("[Notifications] WebSocket disconnected");
        setIsConnected(false);
        socket = null;

        // Attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`[Notifications] Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectAttempts})`);
          setTimeout(connect, RECONNECT_DELAY);
        }
      };

      socket.onerror = (error) => {
        console.error("[Notifications] WebSocket error:", error);
      };
    } catch (error) {
      console.error("[Notifications] Failed to create WebSocket:", error);
    }
  }, [user, getWebSocketUrl]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      socket = null;
    }
    setIsConnected(false);
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((conversationId: number, isTyping: boolean) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !user) return;

    socket.send(JSON.stringify({
      type: isTyping ? "typing:start" : "typing:stop",
      conversationId,
      userId: user.id,
      username: user.name || user.email,
    }));
  }, [user]);

  // Send instant message (for real-time delivery)
  const sendInstantMessage = useCallback((recipientId: number, content: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !user) return false;

    socket.send(JSON.stringify({
      type: "message:send",
      recipientId,
      senderId: user.id,
      senderName: user.name || user.email,
      content,
      timestamp: new Date().toISOString(),
    }));
    return true;
  }, [user]);

  // Connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Clean up typing timeouts
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
    };
  }, [user, connect, disconnect]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Notify server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "notification:read",
        notificationId,
      }));
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Notify server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "notification:read_all",
      }));
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Check if a user is typing in a conversation
  const isUserTyping = useCallback((conversationId: number) => {
    return typingUsers.get(conversationId);
  }, [typingUsers]);

  return {
    notifications,
    unreadCount,
    isConnected,
    typingUsers,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendTypingIndicator,
    sendInstantMessage,
    isUserTyping,
    reconnect: connect,
  };
}

// Helper functions for notification content
function getNotificationTitle(data: Record<string, unknown>): string {
  const type = (data.type as string) || "";
  if (type.includes("follow")) return "New Follower";
  if (type.includes("like")) return "New Like";
  if (type.includes("comment")) return "New Comment";
  if (type.includes("message")) return "New Message";
  return "Notification";
}

function getNotificationMessage(data: Record<string, unknown>): string {
  const type = (data.type as string) || "";
  const name = (data.followerName || data.likerName || data.commenterName || data.senderName || "Someone") as string;
  
  if (type.includes("follow")) return `${name} started following you`;
  if (type.includes("like")) return `${name} liked your post`;
  if (type.includes("comment")) return `${name} commented: ${(data.commentText as string)?.slice(0, 50) || ""}`;
  if (type.includes("message")) return `${name}: ${(data.messagePreview as string)?.slice(0, 50) || ""}`;
  return (data.message as string) || "You have a new notification";
}
