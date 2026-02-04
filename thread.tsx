import { View, Text, FlatList, TextInput, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { SendIcon, CheckDoubleIcon } from "@/components/ui/custom-icons";

export default function MessageThreadScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch message history
  const getConversationMutation = trpc.messages.getConversation.useMutation();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = async () => {
    if (!userId || !user) return;
    setIsLoading(true);
    try {
      const result = await getConversationMutation.mutateAsync({
        userId: parseInt(userId as string),
      });
      setMessages(result || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [userId, user]);

  // Send message mutation
  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage("");
      setSending(false);
      fetchMessages();
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      setSending(false);
    },
  });

  const handleSend = async () => {
    if (!message.trim() || !userId) return;
    
    setSending(true);
    await sendMessageMutation.mutateAsync({
      recipientId: parseInt(userId as string),
      content: message,
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontSize: 18, color: colors.primary }}>← Back</Text>
          </Pressable>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                User #{userId}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>🔒 Encrypted</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={messages || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                justifyContent: item.senderId === user?.id ? "flex-end" : "flex-start",
                flexDirection: "row",
              }}
            >
              <View
                style={{
                  maxWidth: "80%",
                  backgroundColor: item.senderId === user?.id ? colors.primary : colors.surface,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: item.senderId === user?.id ? 0 : 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: item.senderId === user?.id ? colors.background : colors.foreground,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {item.content}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: item.senderId === user?.id ? colors.background : colors.muted,
                      opacity: 0.7,
                    }}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {item.senderId === user?.id && (
                    <CheckDoubleIcon
                      size={12}
                      color={item.isRead === "true" ? colors.background : colors.background}
                    />
                  )}
                </View>
              </View>
            </View>
          )}
          scrollEnabled={true}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-4xl mb-4">💬</Text>
              <Text className="text-foreground font-semibold mb-2">No messages yet</Text>
              <Text className="text-muted text-center px-4">Start a conversation!</Text>
            </View>
          }
        />

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: colors.foreground,
              fontSize: 14,
            }}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
            editable={!sending}
          />
          <Pressable
            onPress={handleSend}
            disabled={!message.trim() || sending}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: message.trim() && !sending ? colors.primary : colors.surface,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <SendIcon size={20} color={message.trim() ? colors.background : colors.muted} />
            )}
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
