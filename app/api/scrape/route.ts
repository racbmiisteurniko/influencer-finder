import { NextRequest, NextResponse } from "next/server";

// Scrape public Instagram profile data
async function scrapeInstagramProfile(username: string) {
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
      return { error: `Profil non trouvé: ${username}`, status: res.status };
    }

    const data = await res.json();
    const user = data?.data?.user;

    if (!user) {
      return { error: `Données non disponibles pour ${username}` };
    }

    const followers = user.edge_followed_by?.count || 0;
    const following = user.edge_follow?.count || 0;
    const posts = user.edge_owner_to_timeline_media?.count || 0;

    // Calculate engagement from recent posts
    let totalLikes = 0;
    let totalComments = 0;
    const recentPosts = user.edge_owner_to_timeline_media?.edges || [];
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

    // Extract email from bio
    const bio = user.biography || "";
    const emailMatch = bio.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name || "",
      platform: "instagram" as const,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return { error: `Erreur scraping ${username}: ${message}` };
  }
}

// Score a profile based on relevance
function scoreProfile(
  profile: Record<string, unknown>,
  keywords: string[]
): number {
  let score = 0;
  const bio = ((profile.bio as string) || "").toLowerCase();
  const followers = (profile.followers as number) || 0;
  const engagementRate = (profile.engagementRate as number) || 0;

  // Engagement rate scoring (most important)
  if (engagementRate >= 5) score += 30;
  else if (engagementRate >= 3) score += 25;
  else if (engagementRate >= 2) score += 15;
  else if (engagementRate >= 1) score += 5;

  // Follower sweet spot (30k-150k)
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
    "handmade",
    "vegan",
    "cruelty free",
    "clean beauty",
    "routine",
    "selfcare",
    "bien-être",
    "slow",
    "minimalisme",
    "maman",
    "famille",
    "france",
    "français",
  ];

  for (const keyword of bioKeywords) {
    if (bio.includes(keyword)) score += 3;
  }

  for (const keyword of keywords) {
    if (bio.includes(keyword.toLowerCase())) score += 5;
  }

  // Has email (professional)
  if (profile.email) score += 10;

  // Active posting
  if (profile.lastPost) {
    const daysSincePost = Math.floor(
      (Date.now() - new Date(profile.lastPost as string).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSincePost <= 7) score += 10;
    else if (daysSincePost <= 30) score += 5;
  }

  return Math.min(score, 100);
}

export async function POST(request: NextRequest) {
  try {
    const { usernames, keywords = [] } = await request.json();

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json(
        { error: "Fournissez une liste de usernames" },
        { status: 400 }
      );
    }

    // Limit to 10 profiles per request
    const limitedUsernames = usernames.slice(0, 10);

    const results = [];
    const errors = [];

    for (const username of limitedUsernames) {
      const clean = username.trim().replace("@", "").replace(/\/$/, "");
      if (!clean) continue;

      const result = await scrapeInstagramProfile(clean);

      if ("error" in result) {
        errors.push(result);
      } else {
        result.score = scoreProfile(
          result as unknown as Record<string, unknown>,
          keywords
        );
        results.push(result);
      }

      // Rate limiting - wait between requests
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      profiles: results,
      errors,
      total: results.length,
      scrapedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
