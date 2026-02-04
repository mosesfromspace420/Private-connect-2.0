import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, Platform } from "react-native";
import { useEffect, useState } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useNotifications } from "@/hooks/use-notifications";
import { trpc } from "@/lib/trpc";

// Badge component for tab icons
function TabIconWithBadge({ 
  icon, 
  color, 
  badgeCount 
}: { 
  icon: React.ReactNode; 
  color: string; 
  badgeCount: number;
}) {
  const colors = useColors();
  
  return (
    <View style={{ position: "relative" }}>
      {icon}
      {badgeCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -8,
            backgroundColor: colors.error,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 10,
              fontWeight: "bold",
            }}
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  
  // Get notification counts
  const { unreadCount: notificationCount } = useNotifications();
  const [messageCount, setMessageCount] = useState(0);
  
  // Fetch unread message count
  const conversationsQuery = trpc.messages.getConversations.useMutation();
  
  useEffect(() => {
    // Fetch conversations to count unread messages
    const fetchUnreadMessages = async () => {
      try {
        const result = await conversationsQuery.mutateAsync({ limit: 50 });
        if (result && Array.isArray(result)) {
          // Count conversations with unread messages (simplified - would need actual unread tracking)
          const unread = result.filter((c: any) => c.lastMessage && !c.lastMessage.isRead).length;
          setMessageCount(unread);
        }
      } catch (error) {
        // Silently fail - user might not be logged in
      }
    };
    
    fetchUnreadMessages();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="compass.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => (
            <TabIconWithBadge
              icon={<IconSymbol size={28} name="message.fill" color={color} />}
              color={color}
              badgeCount={messageCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <TabIconWithBadge
              icon={<IconSymbol size={28} name="person.fill" color={color} />}
              color={color}
              badgeCount={notificationCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar but keep accessible
        }}
      />
    </Tabs>
  );
}
