import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Skeleton } from "@/components/skeleton";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Theme {
  id: number;
  name: string;
  description: string | null;
  previewImage: string | null;
  backgroundColor: string | null;
  backgroundGradient: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  textColor: string | null;
  cardStyle: "solid" | "glass" | "gradient" | "outline" | null;
  price: number | null;
  isPremium: boolean | null;
  usageCount: number | null;
  isActive?: boolean;
}

export default function ThemesMarketplaceScreen() {
  const router = useRouter();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "owned">("browse");

  const featuredQuery = trpc.themes.featured.useMutation();
  const listQuery = trpc.themes.list.useMutation();
  const myThemesQuery = trpc.themes.myThemes.useMutation();
  const purchaseMutation = trpc.themes.purchase.useMutation();
  const activateMutation = trpc.themes.activate.useMutation();

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    featuredQuery.mutate();
    listQuery.mutate({ limit: 50, offset: 0 });
    myThemesQuery.mutate();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadThemes();
    setRefreshing(false);
  };

  const handlePurchase = async (theme: Theme) => {
    try {
      await purchaseMutation.mutateAsync({ themeId: theme.id });
      Alert.alert("Success", `You now own "${theme.name}"!`);
      myThemesQuery.mutate();
    } catch (error) {
      Alert.alert("Error", "Failed to purchase theme");
    }
  };

  const handleActivate = async (theme: Theme) => {
    try {
      await activateMutation.mutateAsync({ themeId: theme.id });
      Alert.alert("Success", `"${theme.name}" is now active!`);
      myThemesQuery.mutate();
    } catch (error) {
      Alert.alert("Error", "Failed to activate theme");
    }
  };

  const renderThemeCard = (theme: Theme, isOwned = false) => (
    <TouchableOpacity
      key={theme.id}
      onPress={() => {
        setSelectedTheme(theme);
        setPreviewModalVisible(true);
      }}
      style={{
        width: "48%",
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: theme.isActive ? colors.primary : colors.border,
      }}
    >
      {/* Theme Preview */}
      <View
        style={{
          height: 120,
          backgroundColor: theme.backgroundColor || "#ffffff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {theme.previewImage ? (
          <Image
            source={{ uri: theme.previewImage }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.primaryColor || "#0a7ea4",
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: 60,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.textColor || "#11181C",
                opacity: 0.5,
              }}
            />
          </View>
        )}
      </View>

      {/* Theme Info */}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: "600",
              color: colors.foreground,
            }}
            numberOfLines={1}
          >
            {theme.name}
          </Text>
          {theme.isPremium && (
            <View
              style={{
                backgroundColor: "#FFD700",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#000" }}>PRO</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {theme.usageCount || 0} users
          </Text>
          {isOwned ? (
            theme.isActive ? (
              <View
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#fff" }}>ACTIVE</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => handleActivate(theme)}
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: colors.primary }}>USE</Text>
              </TouchableOpacity>
            )
          ) : (
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
              {(theme.price || 0) === 0 ? "FREE" : `${theme.price} coins`}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const featuredThemes = featuredQuery.data || [];
  const allThemes = listQuery.data || [];
  const ownedThemes = myThemesQuery.data || [];
  const isLoading = featuredQuery.isPending || listQuery.isPending;

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            Theme Store
          </Text>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("browse")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "browse" ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: activeTab === "browse" ? "#fff" : colors.muted,
              }}
            >
              Browse
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("owned")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: activeTab === "owned" ? colors.primary : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontWeight: "600",
                color: activeTab === "owned" ? "#fff" : colors.muted,
              }}
            >
              My Themes ({ownedThemes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "browse" ? (
          <>
            {/* Featured Section */}
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              Featured Themes
            </Text>

            {isLoading ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} width="48%" height={180} style={{ marginBottom: 16 }} />
                ))}
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {featuredThemes.map((theme: Theme) => renderThemeCard(theme))}
              </View>
            )}

            {/* All Themes */}
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16, marginTop: 8 }}>
              All Themes
            </Text>

            {isLoading ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} width="48%" height={180} style={{ marginBottom: 16 }} />
                ))}
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {allThemes.map((theme: Theme) => renderThemeCard(theme))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Owned Themes */}
            {ownedThemes.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  No themes yet
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
                  Browse the store to find themes that match your style!
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {ownedThemes.map((theme: Theme) => renderThemeCard(theme, true))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Theme Preview Modal */}
      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: "80%",
            }}
          >
            {selectedTheme && (
              <>
                {/* Preview */}
                <View
                  style={{
                    height: 200,
                    backgroundColor: selectedTheme.backgroundColor || "#ffffff",
                    borderRadius: 16,
                    marginBottom: 24,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: selectedTheme.primaryColor || "#0a7ea4",
                      marginBottom: 12,
                    }}
                  />
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: selectedTheme.textColor || "#11181C" }}>
                    Preview Profile
                  </Text>
                  <Text style={{ fontSize: 14, color: selectedTheme.secondaryColor || "#687076" }}>
                    @username
                  </Text>
                </View>

                {/* Info */}
                <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
                  {selectedTheme.name}
                </Text>
                {selectedTheme.description && (
                  <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
                    {selectedTheme.description}
                  </Text>
                )}

                {/* Colors */}
                <View style={{ flexDirection: "row", marginBottom: 24 }}>
                  {[
                    selectedTheme.backgroundColor || "#ffffff",
                    selectedTheme.primaryColor || "#0a7ea4",
                    selectedTheme.secondaryColor || "#687076",
                    selectedTheme.textColor || "#11181C",
                  ].map((color, i) => (
                    <View
                      key={i}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: color,
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    />
                  ))}
                </View>

                {/* Actions */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setPreviewModalVisible(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      borderRadius: 12,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ textAlign: "center", fontWeight: "600", color: colors.foreground }}>
                      Close
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      handlePurchase(selectedTheme);
                      setPreviewModalVisible(false);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ textAlign: "center", fontWeight: "600", color: "#fff" }}>
                      {(selectedTheme.price || 0) === 0 ? "Get Free" : `Buy for ${selectedTheme.price} coins`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
