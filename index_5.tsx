import { Text, View, TouchableOpacity, FlatList, ActivityIndicator, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const getConversationsMutation = trpc.messages.getConversations.useMutation();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      getConversationsMutation.mutateAsync({})
        .then((result) => setConversations(result || []))
        .catch((err) => console.error("Failed to load conversations:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <View className="items-center gap-4">
          <Text className="text-4xl">💬</Text>
          <Text className="text-2xl font-bold text-foreground">Messages</Text>
          <Text className="text-muted text-center text-base">
            Please log in to see your messages
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View className="flex-1">
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="text-3xl font-bold text-foreground">Messages</Text>
          <Text className="text-sm text-muted mt-1">🔒 End-to-end encrypted</Text>
        </View>

        {/* Conversations List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Loading conversations...</Text>
          </View>
        ) : (
          <FlatList
            data={conversations || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/messages/thread?userId=${item.otherUserId}`)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: pressed ? colors.surface : colors.background,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: colors.foreground,
                      }}
                    >
                      User #{item.otherUserId}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        color: colors.muted,
                        marginTop: 4,
                      }}
                    >
                      {item.lastMessage}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.muted,
                      }}
                    >
                      {new Date(item.lastMessageTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          borderRadius: 10,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginTop: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: colors.background,
                          }}
                        >
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            )}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-16">
                <Text className="text-4xl mb-4">📭</Text>
                <Text className="text-foreground font-semibold mb-2">No messages yet</Text>
                <Text className="text-muted text-center px-4">
                  Start a conversation with someone!
                </Text>
              </View>
            }          />
        )}
      </View>
    </ScreenContainer>
  );
}