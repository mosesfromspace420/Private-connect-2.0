import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { SearchIcon, FollowIcon } from "@/components/ui/custom-icons";
import { debounceSearch, generateSuggestions, validateSearchQuery } from "@/lib/search";

export default function SearchScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "users" | "posts" | "hashtags">("all");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Mock search data for now (will connect to API)
  const mockUsers = [
    { id: 1, name: "Alice Johnson", username: "alice", bio: "Privacy advocate" },
    { id: 2, name: "Bob Smith", username: "bob", bio: "Tech enthusiast" },
  ];

  const mockPosts = [
    { id: 1, author: "Alice", content: "Just launched my new privacy-focused blog!" },
    { id: 2, author: "Bob", content: "Check out this amazing tech article" },
  ];

  const mockHashtags = [
    { id: 1, name: "PrivacyMatters", postCount: 2341 },
    { id: 2, name: "TechNews", postCount: 5678 },
  ];

  // Filter mock data based on query
  const filteredUsers = query
    ? mockUsers.filter((u) =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.username.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredPosts = query
    ? mockPosts.filter((p) => p.content.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredHashtags = query
    ? mockHashtags.filter((h) => h.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  // Debounced search handler
  const debouncedSearch = debounceSearch((searchQuery: string) => {
    const validation = validateSearchQuery(searchQuery);
    if (!validation.valid) return;
    // Trigger searches
  }, 300);

  useEffect(() => {
    if (query.length > 0) {
      debouncedSearch(query);
      setShowSuggestions(true);
      const suggestions = generateSuggestions(query, recentSearches, [
        "React Native",
        "Privacy",
        "Social Media",
        "Web Development",
      ]);
      setSuggestions(suggestions);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      setRecentSearches((prev) => {
        const updated = [searchQuery, ...prev.filter((s) => s !== searchQuery)];
        return updated.slice(0, 10);
      });
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    handleSearch(suggestion);
    setShowSuggestions(false);
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Search Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        {/* Search Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <SearchIcon size={20} color={colors.muted} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              color: colors.foreground,
              fontSize: 16,
            }}
            placeholder="Search users, posts, hashtags..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery("");
                setShowSuggestions(false);
              }}
            >
              <Text style={{ fontSize: 20, color: colors.muted }}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Search Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
          {(["all", "users", "posts", "hashtags"] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => setSearchType(type)}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: searchType === type ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: searchType === type ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  color: searchType === type ? colors.background : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Suggestions or Results */}
      {showSuggestions && suggestions.length > 0 && !query.trim() ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          renderItem={({ item: suggestion }) => (
            <Pressable
              onPress={() => handleSuggestionSelect(suggestion)}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: pressed ? colors.surface : colors.background,
              })}
            >
              <Text style={{ color: colors.foreground, fontSize: 14 }}>{suggestion}</Text>
            </Pressable>
          )}
          scrollEnabled={false}
        />
      ) : query.length > 0 ? (
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Users Results */}
            {(searchType === "all" || searchType === "users") && filteredUsers.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                  Users
                </Text>
                {filteredUsers.map((user: any) => (
                  <Pressable
                    key={user.id}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      marginBottom: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                        {user.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        @{user.username}
                      </Text>
                    </View>
                    <FollowIcon size={20} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* Posts Results */}
            {(searchType === "all" || searchType === "posts") && filteredPosts.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                  Posts
                </Text>
                {filteredPosts.map((post: any) => (
                  <Pressable
                    key={post.id}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      marginBottom: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                      {post.author}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.foreground,
                        lineHeight: 20,
                      }}
                      numberOfLines={3}
                    >
                      {post.content}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Hashtags Results */}
            {(searchType === "all" || searchType === "hashtags") && filteredHashtags.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                  Hashtags
                </Text>
                {filteredHashtags.map((tag: any) => (
                  <Pressable
                    key={tag.id}
                    style={({ pressed }) => ({
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      marginBottom: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
                      #{tag.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                      {tag.postCount} posts
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* No Results */}
            {filteredUsers.length === 0 && filteredPosts.length === 0 && filteredHashtags.length === 0 && (
              <View className="items-center justify-center py-12">
                <Text className="text-4xl mb-2">🔍</Text>
                <Text className="text-muted text-center">No results found for "{query}"</Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        // Empty State
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">🔍</Text>
          <Text className="text-foreground text-lg font-semibold mb-2">Start Searching</Text>
          <Text className="text-muted text-center px-6">
            Find users, posts, and hashtags to connect with the community
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}
