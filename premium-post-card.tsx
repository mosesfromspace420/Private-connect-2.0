import { View, Text, Pressable, Image } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";
import {
  HeartIcon,
  HeartFilledIcon,
  CommentIcon,
  ShareIcon,
  MoreIcon,
  BookmarkIcon,
  BookmarkFilledIcon,
} from "./ui/custom-icons";

interface PremiumPostCardProps {
  post: any;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  liked?: boolean;
  bookmarked?: boolean;
}

export function PremiumPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  liked = false,
  bookmarked = false,
}: PremiumPostCardProps) {
  const colors = useColors();
  const [isLiked, setIsLiked] = useState(liked);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.();
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.();
  };

  // Format relative time
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          {/* Avatar with ring */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
              User #{post.userId}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {getRelativeTime(post.createdAt)}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            padding: 8,
          })}
        >
          <MoreIcon size={20} color={colors.muted} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.foreground, marginBottom: 8 }}>
          {post.content}
        </Text>

        {post.image && (
          <Image
            source={{ uri: post.image }}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              marginBottom: 8,
              backgroundColor: colors.primary + "20",
            }}
          />
        )}
      </View>

      {/* Stats */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </Text>
      </View>

      {/* Actions */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={handleLike}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {isLiked ? (
            <HeartFilledIcon size={18} color="#EF4444" />
          ) : (
            <HeartIcon size={18} color={colors.muted} />
          )}
          <Text style={{ fontSize: 12, color: isLiked ? "#EF4444" : colors.muted, fontWeight: "500" }}>
            Like
          </Text>
        </Pressable>

        <Pressable
          onPress={onComment}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <CommentIcon size={18} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>Comment</Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ShareIcon size={18} color={colors.muted} />
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "500" }}>Share</Text>
        </Pressable>

        <Pressable
          onPress={handleBookmark}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: 8,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {isBookmarked ? (
            <BookmarkFilledIcon size={18} color={colors.primary} />
          ) : (
            <BookmarkIcon size={18} color={colors.muted} />
          )}
          <Text style={{ fontSize: 12, color: isBookmarked ? colors.primary : colors.muted, fontWeight: "500" }}>
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
