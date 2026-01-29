import { NextRequest, NextResponse } from "next/server";
import { SearchFilters, InfluencerProfile } from "@/app/types";

// Score a profile based on relevance
function scoreProfile(
  profile: Partial<InfluencerProfile>,
  keywords: string[]
): number {
  let score = 0;
  const bio = (profile.bio || "").toLowerCase();
  const followers = profile.followers || 0;
  const engagementRate = profile.engagementRate || 0;

  // Engagement rate scoring (most important)
  if (engagementRate >= 5) score += 30;
  else if (engagementRate >= 3) score += 25;
  else if (engagementRate >= 2) score += 15;
  else if (engagementRate >= 1) score += 5;

  // Follower sweet spot
  if (followers >= 30000 && followers <= 150000) score += 20;
  else if (followers >= 10000 && followers <= 200000) score += 10;

  // Bio keyword matching
  const bioKeywords = [
    "savon",
    "cosmétique",
    "naturel",
    "bio",
    "artisan",
    "zéro déchet",
    "éco",
    "beauté",
    "soin",
    "peau",
    "fait main",
    "vegan",
    "france",
  ];

  for (const keyword of bioKeywords) {
    if (bio.includes(keyword)) score += 3;
  }

  for (const keyword of keywords) {
    if (bio.includes(keyword.toLowerCase())) score += 5;
  }

  if (profile.email) score += 10;

  if (profile.lastPost) {
    const daysSincePost = Math.floor(
      (Date.now() - new Date(profile.lastPost).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSincePost <= 7) score += 10;
    else if (daysSincePost <= 30) score += 5;
  }

  return Math.min(score, 100);
}

// Fetch Instagram hashtag posts via public API
async function fetchInstagramHashtag(hashtag: string) {
  try {
    const cleanHashtag = hashtag.replace(/[#\s]/g, "");
    const url = `https://www.instagram.com/api/v1/tags/web_info/?tag_name=${cleanHashtag}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "x-ig-app-id": "936619743392459",
      },
    });

    if (!res.ok) {
      return { error: `Failed to fetch hashtag ${hashtag}: ${res.status}` };
    }

    const data = await res.json();
    return data?.data?.recent?.sections?.[0]?.layout_content?.medias || [];
  } catch (error) {
    return {
      error: `Error fetching hashtag: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// Fetch profile data
async function fetchProfile(username: string) {
  try {
    const res = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "x-ig-app-id": "936619743392459",
        },
      }
    );

    if (!res.ok) {
      return { error: `Profile not found: ${username}` };
    }

    const data = await res.json();
    return data?.data?.user || { error: "No user data" };
  } catch (error) {
    return {
      error: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const filters: SearchFilters = await request.json();

    // Build hashtag list
    const hashtags = [
      ...filters.hashtags.split(",").map((h) => h.trim().replace("#", "")),
      ...filters.keywords.split(",").map((k) => k.trim().replace(/\s+/g, "")),
    ].filter(Boolean);

    if (hashtags.length === 0) {
      return NextResponse.json(
        { error: "Fournissez au moins un hashtag ou mot-clé" },
        { status: 400 }
      );
    }

    // Fetch posts from first hashtag
    const targetHashtag = hashtags[0];
    const posts = await fetchInstagramHashtag(targetHashtag);

    if ("error" in posts) {
      return NextResponse.json(
        {
          error: posts.error,
          tip: "Instagram bloque parfois les requêtes. Réessayez dans 1 minute ou utilisez l'onglet 'Analyser des profils' avec des usernames spécifiques.",
        },
        { status: 500 }
      );
    }

    // Extract unique usernames from posts
    const usernames = new Set<string>();
    for (const post of posts.slice(0, 20)) {
      const username = post?.media?.user?.username;
      if (username) usernames.add(username);
    }

    if (usernames.size === 0) {
      return NextResponse.json({
        profiles: [],
        total: 0,
        hashtag: targetHashtag,
        message: "Aucun profil trouvé pour ce hashtag",
      });
    }

    // Fetch profile data for each username
    const profiles: InfluencerProfile[] = [];
    const keywords = [
      ...filters.keywords.split(",").map((k) => k.trim()),
      ...filters.hashtags.split(",").map((h) => h.trim().replace("#", "")),
    ].filter(Boolean);

    for (const username of Array.from(usernames).slice(0, 10)) {
      const user = await fetchProfile(username);

      if ("error" in user) {
        continue;
      }

      const followers = user.edge_followed_by?.count || 0;
      const following = user.edge_follow?.count || 0;
      const posts = user.edge_owner_to_timeline_media?.count || 0;

      // Apply follower filters
      if (
        followers < filters.followersMin ||
        followers > filters.followersMax
      ) {
        continue;
      }

      // Calculate engagement
      const recentPosts = user.edge_owner_to_timeline_media?.edges || [];
      let totalLikes = 0;
      let totalComments = 0;
      const postCount = Math.min(recentPosts.length, 12);

      for (const post of recentPosts.slice(0, 12)) {
        totalLikes += post.node?.edge_liked_by?.count || 0;
        totalComments += post.node?.edge_media_to_comment?.count || 0;
      }

      const avgLikes = postCount > 0 ? Math.round(totalLikes / postCount) : 0;
      const avgComments =
        postCount > 0 ? Math.round(totalComments / postCount) : 0;
      const engagementRate =
        followers > 0
          ? parseFloat(
              (((avgLikes + avgComments) / followers) * 100).toFixed(2)
            )
          : 0;

      // Apply engagement filters
      if (
        engagementRate < filters.engagementMin ||
        engagementRate > filters.engagementMax
      ) {
        continue;
      }

      const bio = user.biography || "";
      const emailMatch = bio.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
      );

      // Apply contactOnly filter
      if (filters.contactOnly && !emailMatch) {
        continue;
      }

      // Apply verified filter
      if (filters.verified && !user.is_verified) {
        continue;
      }

      const profile: InfluencerProfile = {
        id: user.id,
        username: user.username,
        fullName: user.full_name || "",
        platform: "instagram",
        profileUrl: `https://www.instagram.com/${user.username}/`,
        avatarUrl: user.profile_pic_url_hd || user.profile_pic_url || "",
        bio,
        followers,
        following,
        posts,
        engagementRate,
        avgLikes,
        avgComments,
        email: emailMatch ? emailMatch[0] : null,
        country: null,
        language: null,
        niche: [],
        verified: user.is_verified || false,
        lastPost: recentPosts[0]?.node?.taken_at_timestamp
          ? new Date(
              recentPosts[0].node.taken_at_timestamp * 1000
            ).toISOString()
          : null,
        score: 0,
      };

      profile.score = scoreProfile(profile, keywords);
      profiles.push(profile);

      // Rate limiting - wait between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Sort by score
    profiles.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      profiles,
      total: profiles.length,
      hashtag: targetHashtag,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      {
        error: `Erreur lors du scraping automatique: ${message}`,
        tip: "Si l'erreur persiste, utilisez l'onglet 'Analyser des profils' pour analyser des usernames spécifiques.",
      },
      { status: 500 }
    );
  }
}
