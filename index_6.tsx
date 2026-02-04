import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

/**
 * Marketplace Transactions Screen - View purchase history and manage transactions
 */
export default function TransactionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [filterType, setFilterType] = useState<"all" | "buying" | "selling">("all");

  // Mock transaction data
  const mockTransactions = [
    {
      id: 1,
      type: "buying",
      productName: "Vintage Camera",
      seller: "John Doe",
      amount: 150,
      status: "completed",
      date: "2024-01-15",
      image: "📷",
    },
    {
      id: 2,
      type: "selling",
      productName: "Handmade Jewelry",
      buyer: "Jane Smith",
      amount: 75,
      status: "pending",
      date: "2024-01-14",
      image: "💍",
    },
    {
      id: 3,
      type: "buying",
      productName: "Book Collection",
      seller: "Bob Wilson",
      amount: 45,
      status: "in_transit",
      date: "2024-01-10",
      image: "📚",
    },
  ];

  const filteredTransactions = mockTransactions.filter(
    (t) => filterType === "all" || t.type === filterType
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "pending":
        return colors.warning;
      case "in_transit":
        return colors.primary;
      case "disputed":
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
          Transactions
        </Text>

        {/* Filter Tabs */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["all", "buying", "selling"] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setFilterType(type)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: filterType === type ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: filterType === type ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  color: filterType === type ? colors.background : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push("/(tabs)")}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 12,
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              {/* Product Image */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>{item.image}</Text>
              </View>

              {/* Transaction Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {item.productName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {item.type === "buying" ? `Seller: ${item.seller}` : `Buyer: ${item.buyer}`}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.primary }}>
                    ${item.amount}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: getStatusColor(item.status) + "20",
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: getStatusColor(item.status),
                      }}
                    >
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>📦</Text>
            <Text style={{ color: colors.muted, fontSize: 14 }}>No transactions yet</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </ScreenContainer>
  );
}
