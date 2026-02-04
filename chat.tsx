import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

interface Message {
  id: number;
  groupId: number;
  senderId: number;
  senderName: string | null;
  content: string;
  messageType: "text" | "image" | "file" | "system";
  attachmentUrl: string | null;
  replyToId: number | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date | string;
}

interface TypingUser {
  userId: number;
  userName: string | null;
}

export default function GroupChatScreen() {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getMessagesQuery = trpc.groupChat.getMessages.useMutation();
  const sendMessageMutation = trpc.groupChat.sendMessage.useMutation();
  const markReadMutation = trpc.groupChat.markRead.useMutation();
  const setTypingMutation = trpc.groupChat.setTyping.useMutation();
  const getTypingUsersMutation = trpc.groupChat.getTypingUsers.useMutation();

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!groupId) return;
    try {
      const result = await getMessagesQuery.mutateAsync({
        groupId: parseInt(groupId),
        limit: 50,
      });
      setMessages(result as Message[]);
      setIsLoading(false);

      // Mark as read
      if (result.length > 0) {
        const lastMessage = result[result.length - 1] as Message;
        markReadMutation.mutate({
          groupId: parseInt(groupId),
          lastReadMessageId: lastMessage.id,
        });
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setIsLoading(false);
    }
  }, [groupId]);

  // Poll for new messages and typing indicators
  useEffect(() => {
    loadMessages();

    // Poll every 3 seconds for new messages
    pollIntervalRef.current = setInterval(() => {
      loadMessages();
      // Check typing users
      if (groupId) {
        getTypingUsersMutation.mutate(
          { groupId: parseInt(groupId) },
          {
            onSuccess: (data) => {
              setTypingUsers(data as TypingUser[]);
            },
          }
        );
      }
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Clear typing status when leaving
      if (groupId) {
        setTypingMutation.mutate({ groupId: parseInt(groupId), isTyping: false });
      }
    };
  }, [groupId]);

  // Handle typing indicator
  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!groupId) return;

    // Set typing status
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      setTypingMutation.mutate({ groupId: parseInt(groupId), isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingMutation.mutate({ groupId: parseInt(groupId), isTyping: false });
    }, 2000);
  };

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !groupId || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    // Clear typing status
    setIsTyping(false);
    setTypingMutation.mutate({ groupId: parseInt(groupId), isTyping: false });

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await sendMessageMutation.mutateAsync({
        groupId: parseInt(groupId),
        content: messageText,
        messageType: "text",
      });

      // Add message to list
      if (result.message) {
        setMessages((prev) => [...prev, result.message as Message]);
        flatListRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore message on error
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    const showAvatar = index === 0 || messages[index - 1]?.senderId !== item.senderId;

    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isOwnMessage ? "flex-end" : "flex-start",
          marginBottom: 8,
          paddingHorizontal: 16,
        }}
      >
        {!isOwnMessage && showAvatar && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}>
              {(item.senderName || "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
        {!isOwnMessage && !showAvatar && <View style={{ width: 40 }} />}

        <View style={{ maxWidth: "75%" }}>
          {!isOwnMessage && showAvatar && (
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
              {item.senderName || "Unknown"}
            </Text>
          )}
          <View
            style={{
              backgroundColor: isOwnMessage ? colors.primary : colors.surface,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              borderTopLeftRadius: isOwnMessage ? 18 : 4,
              borderTopRightRadius: isOwnMessage ? 4 : 18,
            }}
          >
            <Text
              style={{
                color: isOwnMessage ? "#fff" : colors.foreground,
                fontSize: 15,
                lineHeight: 20,
              }}
            >
              {item.content}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: colors.muted,
              marginTop: 4,
              textAlign: isOwnMessage ? "right" : "left",
            }}
          >
            {formatTime(item.createdAt)}
            {item.isEdited && " (edited)"}
          </Text>
        </View>
      </View>
    );
  };

  // Typing indicator text
  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName || "Someone"} is typing...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].userName || "Someone"} and ${typingUsers[1].userName || "someone"} are typing...`;
    }
    return `${typingUsers.length} people are typing...`;
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
              {groupName || "Group Chat"}
            </Text>
            {typingUsers.length > 0 && (
              <Text style={{ fontSize: 12, color: colors.primary }}>{getTypingText()}</Text>
            )}
          </View>
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              No messages yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
              Be the first to say something!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              backgroundColor: colors.surface,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginRight: 12,
              minHeight: 44,
              maxHeight: 120,
            }}
          >
            <TextInput
              value={newMessage}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor={colors.muted}
              multiline
              style={{
                flex: 1,
                fontSize: 16,
                color: colors.foreground,
                maxHeight: 100,
                paddingVertical: 4,
              }}
              returnKeyType="default"
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: newMessage.trim() ? colors.primary : colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconSymbol
                name="paperplane.fill"
                size={20}
                color={newMessage.trim() ? "#fff" : colors.muted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
