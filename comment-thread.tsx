import { View, Text, FlatList, Pressable, TextInput, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { HeartIcon, HeartFilledIcon, ReplyIcon, TrashIcon } from "@/components/ui/custom-icons";

interface Comment {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  content: string;
  likes: number;
  liked: boolean;
  createdAt: Date;
  replies?: Comment[];
  replyCount: number;
}

interface CommentThreadProps {
  postId: number;
  comments: Comment[];
  isLoading: boolean;
  onAddComment: (content: string, parentId?: number) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
}

export function CommentThread({
  postId,
  comments,
  isLoading,
  onAddComment,
  onDeleteComment,
  onLikeComment,
}: CommentThreadProps) {
  const colors = useColors();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment, replyingTo || undefined);
      setNewComment("");
      setReplyingTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item: comment }: { item: Comment }) => (
    <View style={{ marginLeft: replyingTo === comment.id ? 0 : 0, marginBottom: 12 }}>
      {/* Comment Card */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 12,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
        }}
      >
        {/* Author Info */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              {comment.authorName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {new Date(comment.createdAt).toLocaleString()}
            </Text>
          </View>
          {comment.authorId === user?.id && (
            <Pressable
              onPress={() => onDeleteComment(comment.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <TrashIcon size={18} color={colors.error} />
            </Pressable>
          )}
        </View>

        {/* Comment Text */}
        <Text style={{ fontSize: 14, color: colors.foreground, marginTop: 8, lineHeight: 20 }}>
          {comment.content}
        </Text>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: 16, marginTop: 12, alignItems: "center" }}>
          <Pressable
            onPress={() => onLikeComment(comment.id)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {comment.liked ? (
              <HeartFilledIcon size={16} color={colors.error} />
            ) : (
              <HeartIcon size={16} color={colors.muted} />
            )}
            <Text style={{ fontSize: 12, color: colors.muted }}>{comment.likes}</Text>
          </Pressable>

          <Pressable
            onPress={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ReplyIcon size={16} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary }}>Reply</Text>
          </Pressable>

          {comment.replyCount > 0 && (
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {comment.replyCount} {comment.replyCount === 1 ? "reply" : "replies"}
            </Text>
          )}
        </View>
      </View>

      {/* Reply Input */}
      {replyingTo === comment.id && (
        <View
          style={{
            marginTop: 12,
            marginLeft: 16,
            paddingLeft: 12,
            borderLeftWidth: 2,
            borderLeftColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                color: colors.foreground,
                fontSize: 14,
              }}
              placeholder={`Reply to ${comment.authorName}...`}
              placeholderTextColor={colors.muted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: newComment.trim() ? colors.primary : colors.surface,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={{ color: newComment.trim() ? colors.background : colors.muted, fontWeight: "600" }}>
                  Send
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={{ marginTop: 12, marginLeft: 16 }}>
          {comment.replies.map((reply) => (
            <View key={reply.id} style={{ marginBottom: 8 }}>
              {renderComment({ item: reply })}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Comments List */}
      {isLoading ? (
        <View className="items-center justify-center py-8">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComment}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Text className="text-4xl mb-2">💬</Text>
              <Text className="text-muted text-center">No comments yet. Be the first!</Text>
            </View>
          }
        />
      )}

      {/* Add Comment Input */}
      {!replyingTo && (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-end",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              color: colors.foreground,
              fontSize: 14,
            }}
            placeholder="Add a comment..."
            placeholderTextColor={colors.muted}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: newComment.trim() ? colors.primary : colors.surface,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={{ color: newComment.trim() ? colors.background : colors.muted, fontWeight: "600" }}>
                Send
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
