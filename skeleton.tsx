import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated skeleton loader component with shimmer effect
 */
export function Skeleton({ width = "100%", height = 20, borderRadius = 8, style }: SkeletonProps) {
  const colors = useColors();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton loader for post cards in the feed
 */
export function PostSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header with avatar and name */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>

      {/* Content lines */}
      <View style={{ marginBottom: 12 }}>
        <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={14} />
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: "row", gap: 24, marginTop: 8 }}>
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton loader for user profile cards
 */
export function UserCardSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Skeleton width={100} height={16} style={{ marginBottom: 6 }} />
        <Skeleton width={140} height={12} />
      </View>
      <Skeleton width={80} height={32} borderRadius={16} />
    </View>
  );
}

/**
 * Skeleton loader for message conversations
 */
export function ConversationSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={12} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Skeleton width={40} height={10} style={{ marginBottom: 6 }} />
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>
    </View>
  );
}

/**
 * Skeleton loader for marketplace product cards
 */
export function ProductSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Product image */}
      <Skeleton width="100%" height={180} borderRadius={0} />
      
      {/* Product info */}
      <View style={{ padding: 16 }}>
        <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width={80} height={22} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width={100} height={12} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton loader for profile header
 */
export function ProfileHeaderSkeleton() {
  const colors = useColors();

  return (
    <View style={{ marginBottom: 24 }}>
      {/* Cover image */}
      <Skeleton width="100%" height={150} borderRadius={0} />
      
      {/* Avatar and info */}
      <View style={{ alignItems: "center", marginTop: -50 }}>
        <Skeleton width={100} height={100} borderRadius={50} />
        <Skeleton width={150} height={24} style={{ marginTop: 12 }} />
        <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
        <Skeleton width={200} height={14} style={{ marginTop: 8 }} />
        
        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 32, marginTop: 16 }}>
          <View style={{ alignItems: "center" }}>
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
          <View style={{ alignItems: "center" }}>
            <Skeleton width={40} height={20} />
            <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Skeleton loader for notification items
 */
export function NotificationSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
        <Skeleton width={60} height={10} />
      </View>
    </View>
  );
}

/**
 * Skeleton loader for game cards
 */
export function GameCardSkeleton() {
  const colors = useColors();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width="100%" height={120} borderRadius={0} />
      <View style={{ padding: 16 }}>
        <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={8} borderRadius={4} />
      </View>
    </View>
  );
}

/**
 * Feed skeleton showing multiple post skeletons
 */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * User list skeleton showing multiple user card skeletons
 */
export function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </View>
  );
}
