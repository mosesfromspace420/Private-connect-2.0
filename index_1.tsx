import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/hooks/use-auth";

type ThemeMode = "system" | "light" | "dark";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { user, logout } = useAuth();
  
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("themeMode");
      if (savedTheme) {
        setThemeMode(savedTheme as ThemeMode);
      }
      const notifications = await AsyncStorage.getItem("notificationsEnabled");
      if (notifications !== null) {
        setNotificationsEnabled(notifications === "true");
      }
      const sound = await AsyncStorage.getItem("soundEnabled");
      if (sound !== null) {
        setSoundEnabled(sound === "true");
      }
      const haptic = await AsyncStorage.getItem("hapticEnabled");
      if (haptic !== null) {
        setHapticEnabled(haptic === "true");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem("themeMode", mode);
    
    if (mode === "system") {
      // Use system preference
      const systemScheme = "light"; // Default, will be overridden by system
      setColorScheme(systemScheme);
    } else {
      setColorScheme(mode);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showArrow = true,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: danger ? colors.error + "20" : colors.primary + "20",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: danger ? colors.error : colors.foreground,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
      {showArrow && onPress && (
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
      )}
    </TouchableOpacity>
  );

  const ThemeOption = ({ mode, label }: { mode: ThemeMode; label: string }) => (
    <TouchableOpacity
      onPress={() => handleThemeChange(mode)}
      style={{
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: themeMode === mode ? colors.primary : colors.surface,
        marginHorizontal: 4,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: themeMode === mode ? "#fff" : colors.foreground,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            Settings
          </Text>
        </View>

        {/* User Info */}
        {user && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: colors.surface,
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>
                {(user.name || "U")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
                {user.name || "User"}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                {user.email || ""}
              </Text>
            </View>
          </View>
        )}

        {/* Appearance */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, marginLeft: 4 }}>
          APPEARANCE
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "500", color: colors.foreground, marginBottom: 12 }}>
            Theme
          </Text>
          <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
            <ThemeOption mode="system" label="System" />
            <ThemeOption mode="light" label="Light" />
            <ThemeOption mode="dark" label="Dark" />
          </View>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 12, textAlign: "center" }}>
            Current: {colorScheme === "dark" ? "Dark Mode" : "Light Mode"}
          </Text>
        </View>

        {/* Notifications */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, marginLeft: 4 }}>
          NOTIFICATIONS
        </Text>
        <SettingRow
          icon="🔔"
          title="Push Notifications"
          subtitle="Receive alerts for new activity"
          showArrow={false}
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                setNotificationsEnabled(value);
                await AsyncStorage.setItem("notificationsEnabled", value.toString());
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          }
        />
        <SettingRow
          icon="🔊"
          title="Sound"
          subtitle="Play sounds for notifications"
          showArrow={false}
          rightElement={
            <Switch
              value={soundEnabled}
              onValueChange={async (value) => {
                setSoundEnabled(value);
                await AsyncStorage.setItem("soundEnabled", value.toString());
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          }
        />
        <SettingRow
          icon="📳"
          title="Haptic Feedback"
          subtitle="Vibrate for interactions"
          showArrow={false}
          rightElement={
            <Switch
              value={hapticEnabled}
              onValueChange={async (value) => {
                setHapticEnabled(value);
                await AsyncStorage.setItem("hapticEnabled", value.toString());
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          }
        />

        {/* Privacy & Security */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, marginLeft: 4, marginTop: 16 }}>
          PRIVACY & SECURITY
        </Text>
        <SettingRow
          icon="🔐"
          title="Security"
          subtitle="2FA, sessions, account deletion"
          onPress={() => router.push("/settings/security")}
        />
        <SettingRow
          icon="👁️"
          title="Privacy"
          subtitle="Profile visibility, data controls"
          onPress={() => Alert.alert("Coming Soon", "Privacy settings will be available soon.")}
        />
        <SettingRow
          icon="🚫"
          title="Blocked Users"
          subtitle="Manage blocked accounts"
          onPress={() => Alert.alert("Coming Soon", "Blocked users management will be available soon.")}
        />

        {/* Content */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, marginLeft: 4, marginTop: 16 }}>
          CONTENT
        </Text>
        <SettingRow
          icon="🎨"
          title="Profile Themes"
          subtitle="Customize your profile appearance"
          onPress={() => router.push("/themes")}
        />
        <SettingRow
          icon="💾"
          title="Data & Storage"
          subtitle="Manage cache and downloads"
          onPress={() => Alert.alert("Coming Soon", "Data management will be available soon.")}
        />

        {/* Support */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, marginLeft: 4, marginTop: 16 }}>
          SUPPORT
        </Text>
        <SettingRow
          icon="❓"
          title="Help Center"
          subtitle="FAQs and guides"
          onPress={() => Alert.alert("Help", "Visit our help center for assistance.")}
        />
        <SettingRow
          icon="📝"
          title="Send Feedback"
          subtitle="Help us improve PrivateConnect"
          onPress={() => Alert.alert("Feedback", "Thank you for your interest in providing feedback!")}
        />
        <SettingRow
          icon="📄"
          title="Terms & Privacy Policy"
          onPress={() => Alert.alert("Legal", "Terms of Service and Privacy Policy")}
        />

        {/* Account Actions */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, marginLeft: 4, marginTop: 16 }}>
          ACCOUNT
        </Text>
        <SettingRow
          icon="🚪"
          title="Log Out"
          onPress={handleLogout}
          danger
          showArrow={false}
        />

        {/* App Info */}
        <View style={{ alignItems: "center", marginTop: 32, marginBottom: 48 }}>
          <Text style={{ fontSize: 14, color: colors.muted }}>PrivateConnect v1.0.0</Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Made with ❤️ for privacy
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
