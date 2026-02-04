import { View, Text, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/**
 * Analytics & Insights Screen - View user activity and engagement metrics
 */
export default function AnalyticsScreen() {
  const colors = useColors();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Mock analytics data
  const analytics = {
    totalPosts: 42,
    totalLikes: 1234,
    totalComments: 456,
    totalFollowers: 789,
    engagementRate: 8.5,
    averageLikesPerPost: 29,
    averageCommentsPerPost: 11,
    topPost: {
      title: "My amazing travel story",
      likes: 234,
      comments: 45,
    },
  };

  const StatCard = ({
    label,
    value,
    unit,
    color,
  }: {
    label: string;
    value: number | string;
    unit?: string;
    color?: string;
  }) => (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 6,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: color || colors.primary,
          }}
        >
          {value}
        </Text>
        {unit && (
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {unit}
          </Text>
        )}
      </View>
    </View>
  );

  const ChartBar = ({
    label,
    value,
    maxValue,
  }: {
    label: string;
    value: number;
    maxValue: number;
  }) => {
    const percentage = (value / maxValue) * 100;

    return (
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.foreground }}>
            {label}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
            {value}
          </Text>
        </View>
        <View
          style={{
            height: 8,
            backgroundColor: colors.border,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${percentage}%`,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            Analytics
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Track your engagement and growth
          </Text>
        </View>

        {/* Time Range Filter */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row", gap: 8 }}>
          {(["week", "month", "year"] as const).map((range) => (
            <Pressable
              key={range}
              onPress={() => setTimeRange(range)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: timeRange === range ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: timeRange === range ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  color: timeRange === range ? colors.background : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {range}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row" }}>
            <StatCard label="Total Posts" value={analytics.totalPosts} />
            <StatCard label="Total Likes" value={analytics.totalLikes} />
          </View>
          <View style={{ flexDirection: "row" }}>
            <StatCard label="Total Comments" value={analytics.totalComments} />
            <StatCard label="Followers" value={analytics.totalFollowers} />
          </View>
        </View>

        {/* Engagement Rate */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
              Engagement Rate
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "bold",
                  color: colors.success,
                }}
              >
                {analytics.engagementRate}%
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>
                of followers engaged
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
              Average {analytics.averageLikesPerPost} likes and {analytics.averageCommentsPerPost} comments per post
            </Text>
          </View>
        </View>

        {/* Top Performing Post */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
            TOP PERFORMING POST
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.foreground,
                marginBottom: 12,
              }}
            >
              {analytics.topPost.title}
            </Text>
            <ChartBar
              label="Likes"
              value={analytics.topPost.likes}
              maxValue={250}
            />
            <ChartBar
              label="Comments"
              value={analytics.topPost.comments}
              maxValue={50}
            />
          </View>
        </View>

        {/* Activity Breakdown */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
            ACTIVITY BREAKDOWN
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ChartBar label="Posts" value={42} maxValue={50} />
            <ChartBar label="Likes Received" value={1234} maxValue={1500} />
            <ChartBar label="Comments Received" value={456} maxValue={500} />
            <ChartBar label="Followers Gained" value={789} maxValue={1000} />
          </View>
        </View>

        {/* Export Data Button */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
              📊 Export Analytics
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
