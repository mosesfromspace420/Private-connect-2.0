import { View, Text, ScrollView, Pressable, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import {
  plantCrop,
  isReadyToHarvest,
  getGrowthProgress,
  harvestCrop,
  getTimeUntilHarvest,
  type Crop,
} from "@/lib/game-mechanics";

export default function FarmParadiseScreen() {
  const colors = useColors();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [coins, setCoins] = useState(100);
  const [level, setLevel] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh growth progress every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlantCrop = (cropType: Crop["type"]) => {
    const newCrop = plantCrop(cropType, {
      x: Math.random() * 300,
      y: Math.random() * 300,
    });
    setCrops([...crops, newCrop]);
  };

  const handleHarvestCrop = (cropId: string) => {
    const crop = crops.find((c) => c.id === cropId);
    if (crop && isReadyToHarvest(crop)) {
      const reward = harvestCrop(crop);
      setCoins(coins + reward);
      setCrops(crops.filter((c) => c.id !== cropId));
      setLevel(Math.floor((coins + reward) / 50) + 1);
    }
  };

  const getCropEmoji = (type: Crop["type"]) => {
    const emojis: Record<Crop["type"], string> = {
      wheat: "🌾",
      corn: "🌽",
      tomato: "🍅",
      carrot: "🥕",
      potato: "🥔",
    };
    return emojis[type];
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="text-3xl font-bold text-foreground">Farm Paradise</Text>
          <View className="flex-row gap-4 mt-3">
            <View>
              <Text className="text-xs text-muted">Coins</Text>
              <Text className="text-lg font-bold text-foreground">${coins}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Level</Text>
              <Text className="text-lg font-bold text-primary">{level}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Crops</Text>
              <Text className="text-lg font-bold text-foreground">{crops.length}</Text>
            </View>
          </View>
        </View>

        {/* Farm Grid */}
        <View style={{ padding: 16, flex: 1 }}>
          <Text className="text-lg font-semibold text-foreground mb-4">Your Farm</Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              minHeight: 300,
              borderWidth: 2,
              borderColor: colors.border,
              borderStyle: "dashed",
            }}
          >
            {crops.length === 0 ? (
              <View className="items-center justify-center h-64">
                <Text className="text-4xl mb-2">🌱</Text>
                <Text className="text-muted text-center">Plant crops to get started!</Text>
              </View>
            ) : (
              <View className="gap-3">
                {crops.map((crop) => {
                  const progress = getGrowthProgress(crop);
                  const ready = isReadyToHarvest(crop);
                  const timeLeft = getTimeUntilHarvest(crop);
                  const minutes = Math.floor(timeLeft / 60000);
                  const seconds = Math.floor((timeLeft % 60000) / 1000);

                  return (
                    <Pressable
                      key={crop.id}
                      onPress={() => ready && handleHarvestCrop(crop.id)}
                      style={({ pressed }) => ({
                        backgroundColor: colors.background,
                        borderRadius: 8,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: ready ? colors.success : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <Text className="text-3xl">{getCropEmoji(crop.type)}</Text>
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-foreground capitalize">
                              {crop.type}
                            </Text>
                            {ready ? (
                              <Text className="text-xs text-success font-bold">Ready to harvest!</Text>
                            ) : (
                              <Text className="text-xs text-muted">
                                {minutes}m {seconds}s remaining
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="items-end gap-2">
                          <View
                            style={{
                              width: 60,
                              height: 6,
                              backgroundColor: colors.border,
                              borderRadius: 3,
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                width: `${progress}%`,
                                height: "100%",
                                backgroundColor: ready ? colors.success : colors.primary,
                              }}
                            />
                          </View>
                          <Text className="text-xs text-muted">{Math.round(progress)}%</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Plant Options */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <Text className="text-lg font-semibold text-foreground mb-3">Plant New Crop</Text>
          <View className="gap-2">
            {(["wheat", "corn", "tomato", "carrot", "potato"] as const).map((cropType) => (
              <Pressable
                key={cropType}
                onPress={() => handlePlantCrop(cropType)}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  padding: 12,
                  opacity: pressed ? 0.8 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                })}
              >
                <Text className="text-sm font-semibold text-background capitalize">
                  {getCropEmoji(cropType)} Plant {cropType}
                </Text>
                <Text className="text-sm font-bold text-background">-5 coins</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
