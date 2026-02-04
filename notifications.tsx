import { View, Text, ScrollView, Switch, Pressable } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

/**
 * Notification Preferences Screen - Manage notification settings
 */
export default function NotificationPreferencesScreen() {
  const colors = useColors();

  // Notification preferences state
  const [preferences, setPreferences] = useState({
    // Notification Types
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    marketplace: true,
    gameInvites: true,

    // Notification Methods
    pushNotifications: true,
    emailNotifications: false,
    inAppNotifications: true,

    // Frequency
    realTime: true,
    dailyDigest: false,
    weeklyDigest: false,

    // Quiet Hours
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const PreferenceRow = ({
    label,
    description,
    value,
    onToggle,
  }: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
          {label}
        </Text>
        {description && (
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.background : colors.muted}
      />
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text
      style={{
        fontSize: 14,
        fontWeight: "700",
        color: colors.muted,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 12,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  );

  return (
    <ScreenContainer className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            Notifications
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Control how you receive notifications
          </Text>
        </View>

        {/* Notification Types */}
        <SectionHeader title="Notification Types" />
        <View style={{ backgroundColor: colors.surface }}>
          <PreferenceRow
            label="Likes"
            description="When someone likes your post"
            value={preferences.likes}
            onToggle={() => togglePreference("likes" as keyof typeof preferences)}
          />
          <PreferenceRow
            label="Comments"
            description="When someone comments on your post"
            value={preferences.comments}
            onToggle={() => togglePreference("comments")}
          />
          <PreferenceRow
            label="Follows"
            description="When someone follows you"
            value={preferences.follows}
            onToggle={() => togglePreference("follows")}
          />
          <PreferenceRow
            label="Messages"
            description="When you receive a new message"
            value={preferences.messages}
            onToggle={() => togglePreference("messages")}
          />
          <PreferenceRow
            label="Marketplace"
            description="Updates on your listings and purchases"
            value={preferences.marketplace}
            onToggle={() => togglePreference("marketplace")}
          />
          <PreferenceRow
            label="Game Invites"
            description="When friends invite you to play"
            value={preferences.gameInvites}
            onToggle={() => togglePreference("gameInvites")}
          />
        </View>

        {/* Notification Methods */}
        <SectionHeader title="Delivery Methods" />
        <View style={{ backgroundColor: colors.surface }}>
          <PreferenceRow
            label="Push Notifications"
            description="Notifications on your device"
            value={preferences.pushNotifications}
            onToggle={() => togglePreference("pushNotifications")}
          />
          <PreferenceRow
            label="Email Notifications"
            description="Notifications via email"
            value={preferences.emailNotifications}
            onToggle={() => togglePreference("emailNotifications")}
          />
          <PreferenceRow
            label="In-App Notifications"
            description="Notifications inside the app"
            value={preferences.inAppNotifications}
            onToggle={() => togglePreference("inAppNotifications")}
          />
        </View>

        {/* Frequency */}
        <SectionHeader title="Notification Frequency" />
        <View style={{ backgroundColor: colors.surface }}>
          <PreferenceRow
            label="Real-Time Notifications"
            description="Get notified immediately"
            value={preferences.realTime}
            onToggle={() => togglePreference("realTime")}
          />
          <PreferenceRow
            label="Daily Digest"
            description="Summary of activity once per day"
            value={preferences.dailyDigest}
            onToggle={() => togglePreference("dailyDigest")}
          />
          <PreferenceRow
            label="Weekly Digest"
            description="Summary of activity once per week"
            value={preferences.weeklyDigest}
            onToggle={() => togglePreference("weeklyDigest")}
          />
        </View>

        {/* Quiet Hours */}
        <SectionHeader title="Quiet Hours" />
        <View style={{ backgroundColor: colors.surface }}>
          <PreferenceRow
            label="Enable Quiet Hours"
            description="Disable notifications during specific times"
            value={preferences.quietHoursEnabled}
            onToggle={() => togglePreference("quietHoursEnabled")}
          />
          {preferences.quietHoursEnabled && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                  Start Time
                </Text>
                <Pressable
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>
                    {preferences.quietHoursStart}
                  </Text>
                </Pressable>
              </View>
              <View>
                <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>
                  End Time
                </Text>
                <Pressable
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>
                    {preferences.quietHoursEnd}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: colors.background, fontSize: 14, fontWeight: "600" }}>
              Save Preferences
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
