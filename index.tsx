import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useNotifications } from "@/hooks/use-notifications";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useState, useEffect, useCallback } from "react";

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { notifications: localNotifications, unreadCount: localUnreadCount, markAsRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "likes" | "comments" | "follows" | "messages">("all");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Refresh local notifications
    setRefreshing(false);
  }, []);

  const handleMarkAllRead = () => {
    // Mark all local notifications as read
    localNotifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });
  };

  const notifications = localNotifications;
  const unreadCount = localUnreadCount;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "likes") return n.type === "like";
    if (filter === "comments") return n.type === "comment";
    if (filter === "follows") return n.type === "follow";
    if (filter === "messages") return n.type === "message";
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "follow":
        return "👥";
      case "message":
        return "📨";
      case "mention":
        return "@";
      default:
        return "🔔";
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
                🔔 Notifications
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {(["all", "likes", "comments", "follows", "messages"] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: filter === f ? colors.primary : colors.surface,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: filter === f ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: filter === f ? colors.background : colors.foreground,
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <View style={{ paddingHorizontal: 16 }}>
          {filteredNotifications.length > 0 ? (
            <View style={{ gap: 10, marginBottom: 20 }}>
              {filteredNotifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  onPress={() => markAsRead(notification.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: notification.read ? colors.surface : colors.primary + "15",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: notification.read ? colors.border : colors.primary,
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>
                      {getNotificationIcon(notification.type)}
                    </Text>
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: notification.read ? "500" : "700",
                        color: colors.foreground,
                        marginBottom: 4,
                      }}
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                  </View>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                        marginLeft: 8,
                      }}
                    />
                  )}
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                All caught up!
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>
                You have no {filter !== "all" ? filter : "new"} notifications
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
