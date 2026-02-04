/**
 * Video Streaming Features for PrivateConnect
 * Includes live streaming, video posts, and stories
 */

export interface VideoStream {
  id: string;
  userId: string;
  title: string;
  description: string;
  isLive: boolean;
  startedAt: number;
  endedAt?: number;
  viewerCount: number;
  likes: number;
  category: "gaming" | "music" | "creative" | "educational" | "lifestyle" | "other";
  isAgeRestricted: boolean;
  groupId?: string;
}

export interface VideoPost {
  id: string;
  userId: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  createdAt: number;
  likes: number;
  comments: number;
  views: number;
  isEphemeral: boolean; // 24-hour story-style posts
  expiresAt?: number;
}

export interface VideoQuality {
  resolution: "360p" | "480p" | "720p" | "1080p" | "4k";
  bitrate: number; // in kbps
  fps: number;
}

export interface StreamChat {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  isModerated: boolean;
}

export interface StreamGift {
  id: string;
  name: string;
  emoji: string;
  cost: number; // in coins
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Available gifts for tipping streamers
export const STREAM_GIFTS: StreamGift[] = [
  { id: "heart", name: "Heart", emoji: "❤️", cost: 1, rarity: "common" },
  { id: "star", name: "Star", emoji: "⭐", cost: 5, rarity: "common" },
  { id: "fire", name: "Fire", emoji: "🔥", cost: 10, rarity: "rare" },
  { id: "diamond", name: "Diamond", emoji: "💎", cost: 50, rarity: "epic" },
  { id: "crown", name: "Crown", emoji: "👑", cost: 100, rarity: "legendary" },
];

// Video quality presets
export const VIDEO_QUALITY_PRESETS: Record<string, VideoQuality> = {
  "360p": { resolution: "360p", bitrate: 500, fps: 24 },
  "480p": { resolution: "480p", bitrate: 1000, fps: 30 },
  "720p": { resolution: "720p", bitrate: 2500, fps: 30 },
  "1080p": { resolution: "1080p", bitrate: 5000, fps: 60 },
  "4k": { resolution: "4k", bitrate: 15000, fps: 60 },
};

export function createVideoStream(
  userId: string,
  title: string,
  description: string,
  category: VideoStream["category"],
  isAgeRestricted: boolean = false,
  groupId?: string,
): VideoStream {
  return {
    id: `stream_${Date.now()}_${Math.random()}`,
    userId,
    title,
    description,
    isLive: true,
    startedAt: Date.now(),
    viewerCount: 0,
    likes: 0,
    category,
    isAgeRestricted,
    groupId,
  };
}

export function createVideoPost(
  userId: string,
  caption: string,
  videoUrl: string,
  thumbnailUrl: string,
  duration: number,
  isEphemeral: boolean = false,
): VideoPost {
  const now = Date.now();
  return {
    id: `video_${now}_${Math.random()}`,
    userId,
    caption,
    videoUrl,
    thumbnailUrl,
    duration,
    createdAt: now,
    likes: 0,
    comments: 0,
    views: 0,
    isEphemeral,
    expiresAt: isEphemeral ? now + 24 * 60 * 60 * 1000 : undefined,
  };
}

export function isVideoExpired(video: VideoPost): boolean {
  if (!video.isEphemeral || !video.expiresAt) return false;
  return Date.now() > video.expiresAt;
}

export function getTimeUntilExpiry(video: VideoPost): number {
  if (!video.isEphemeral || !video.expiresAt) return 0;
  const timeLeft = video.expiresAt - Date.now();
  return Math.max(0, timeLeft);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function getRecommendedQuality(bandwidth: number): VideoQuality {
  // bandwidth in kbps
  if (bandwidth < 1000) return VIDEO_QUALITY_PRESETS["360p"];
  if (bandwidth < 2000) return VIDEO_QUALITY_PRESETS["480p"];
  if (bandwidth < 5000) return VIDEO_QUALITY_PRESETS["720p"];
  if (bandwidth < 10000) return VIDEO_QUALITY_PRESETS["1080p"];
  return VIDEO_QUALITY_PRESETS["4k"];
}

export function calculateStreamRevenue(
  viewerCount: number,
  giftValue: number,
  streamDurationMinutes: number,
): number {
  // Base revenue: $0.01 per viewer per minute
  const viewerRevenue = viewerCount * streamDurationMinutes * 0.01;
  // Gift revenue: 50% of gift value
  const giftRevenue = giftValue * 0.5;
  return Math.round((viewerRevenue + giftRevenue) * 100) / 100;
}

export function getStreamCategory(category: string): string {
  const categoryEmojis: Record<string, string> = {
    gaming: "🎮",
    music: "🎵",
    creative: "🎨",
    educational: "📚",
    lifestyle: "✨",
    other: "📺",
  };
  return categoryEmojis[category] || "📺";
}

export function shouldAgeGate(stream: VideoStream): boolean {
  return stream.isAgeRestricted;
}

export function validateStreamTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: "Stream title is required" };
  }
  if (title.length > 100) {
    return { valid: false, error: "Stream title must be less than 100 characters" };
  }
  return { valid: true };
}

export function validateStreamDescription(description: string): {
  valid: boolean;
  error?: string;
} {
  if (description.length > 500) {
    return { valid: false, error: "Description must be less than 500 characters" };
  }
  return { valid: true };
}
