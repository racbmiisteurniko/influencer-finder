export interface SearchFilters {
  keywords: string;
  hashtags: string;
  platform: "instagram" | "tiktok" | "both";
  followersMin: number;
  followersMax: number;
  engagementMin: number;
  engagementMax: number;
  language: string;
  country: string;
  niche: string;
  contactOnly: boolean;
  verified: boolean;
}

export interface InfluencerProfile {
  id: string;
  username: string;
  fullName: string;
  platform: "instagram" | "tiktok";
  profileUrl: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  email: string | null;
  country: string | null;
  language: string | null;
  niche: string[];
  verified: boolean;
  lastPost: string | null;
  score: number;
}

export interface SearchResult {
  profiles: InfluencerProfile[];
  total: number;
  query: SearchFilters;
  scrapedAt: string;
}
