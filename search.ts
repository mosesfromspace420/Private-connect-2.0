/**
 * Search utility functions for users, posts, and hashtags
 */

export interface SearchResult {
  type: "user" | "post" | "hashtag";
  id: number;
  title: string;
  subtitle?: string;
  icon?: string;
}

export interface SearchFilters {
  type?: "user" | "post" | "hashtag" | "all";
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: "relevance" | "recent" | "popular";
}

/**
 * Normalize search query for better matching
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s#@]/g, "");
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex) || [];
  return matches.map((tag) => tag.substring(1).toLowerCase());
}

/**
 * Extract mentions from text
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w]+/g;
  const matches = text.match(mentionRegex) || [];
  return matches.map((mention) => mention.substring(1).toLowerCase());
}

/**
 * Check if query matches a string (case-insensitive)
 */
export function matchesQuery(text: string, query: string): boolean {
  const normalizedText = normalizeQuery(text);
  const normalizedQuery = normalizeQuery(query);
  return normalizedText.includes(normalizedQuery);
}

/**
 * Calculate relevance score for search results
 */
export function calculateRelevanceScore(
  text: string,
  query: string,
  isExactMatch: boolean = false
): number {
  const normalizedText = normalizeQuery(text);
  const normalizedQuery = normalizeQuery(query);

  if (isExactMatch && normalizedText === normalizedQuery) {
    return 100;
  }

  if (normalizedText.startsWith(normalizedQuery)) {
    return 80;
  }

  const occurrences = (normalizedText.match(new RegExp(normalizedQuery, "g")) || []).length;
  return Math.min(occurrences * 20, 60);
}

/**
 * Filter and sort search results
 */
export function filterAndSortResults(
  results: SearchResult[],
  filters: SearchFilters
): SearchResult[] {
  let filtered = results;

  // Filter by type
  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((r) => r.type === filters.type);
  }

  // Sort results
  if (filters.sortBy === "recent") {
    filtered.sort((a, b) => b.id - a.id);
  } else if (filters.sortBy === "popular") {
    // In a real app, this would sort by engagement metrics
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  return filtered;
}

/**
 * Generate autocomplete suggestions
 */
export function generateSuggestions(
  query: string,
  recentSearches: string[] = [],
  trendingTopics: string[] = []
): string[] {
  if (!query.trim()) {
    return recentSearches.slice(0, 5).concat(trendingTopics.slice(0, 3));
  }

  const normalizedQuery = normalizeQuery(query);

  // Combine and filter suggestions
  const allSuggestions = [...recentSearches, ...trendingTopics];
  const filtered = allSuggestions.filter((s) =>
    normalizeQuery(s).includes(normalizedQuery)
  );

  // Remove duplicates and limit
  return Array.from(new Set(filtered)).slice(0, 10);
}

/**
 * Debounce search function
 */
export function debounceSearch<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Highlight search query in text
 */
export function highlightQuery(text: string, query: string): string {
  const normalizedQuery = normalizeQuery(query);
  const regex = new RegExp(`(${normalizedQuery})`, "gi");
  return text.replace(regex, "**$1**");
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): {
  valid: boolean;
  error?: string;
} {
  if (!query || query.trim().length === 0) {
    return { valid: false, error: "Search query cannot be empty" };
  }

  if (query.length > 100) {
    return { valid: false, error: "Search query is too long (max 100 characters)" };
  }

  if (query.length < 2) {
    return { valid: false, error: "Search query must be at least 2 characters" };
  }

  return { valid: true };
}
