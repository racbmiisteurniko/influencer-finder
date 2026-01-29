import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
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

// Scrape Instagram hashtag page
async function scrapeInstagramHashtag(
  hashtag: string,
  filters: SearchFilters
): Promise<InfluencerProfile[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    const cleanHashtag = hashtag.replace(/[#\s]/g, "");
    await page.goto(`https://www.instagram.com/explore/tags/${cleanHashtag}/`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait for posts to load
    await page.waitForSelector("article", { timeout: 10000 });

    // Extract post links
    const postLinks = await page.evaluate(() => {
      const links: string[] = [];
      const anchors = document.querySelectorAll(
        'article a[href^="/p/"], article a[href^="/reel/"]'
      );
      for (const a of Array.from(anchors).slice(0, 20)) {
        const href = (a as HTMLAnchorElement).href;
        if (href) links.push(href);
      }
      return [...new Set(links)];
    });

    const profiles: InfluencerProfile[] = [];
    const seenUsernames = new Set<string>();

    // Extract profile info from each post
    for (const postUrl of postLinks.slice(0, 12)) {
      try {
        await page.goto(postUrl, { waitUntil: "networkidle", timeout: 20000 });
        await page.waitForTimeout(2000);

        const postData = await page.evaluate(() => {
          // Try to find username from header link
          const headerLink = document.querySelector(
            'header a[href^="/"][href*="/"]'
          );
          const username = headerLink
            ? (headerLink as HTMLAnchorElement).href
                .split("/")
                .filter((p) => p)[2]
            : null;

          // Extract engagement data
          const likesText =
            document.querySelector('button[aria-label*="like"]')?.textContent ||
            document.querySelector('section span')?.textContent ||
            "";
          const commentsText =
            document.querySelector('button[aria-label*="comment"]')
              ?.textContent || "";

          return {
            username,
            likes: likesText,
            comments: commentsText,
          };
        });

        if (!postData.username || seenUsernames.has(postData.username)) {
          continue;
        }

        seenUsernames.add(postData.username);

        // Fetch profile data via Instagram API
        const res = await fetch(
          `https://www.instagram.com/api/v1/users/web_profile_info/?username=${postData.username}`,
          {
            headers: {
              "User-Agent": page.context().browser()
                ? "Mozilla/5.0..."
                : "Mozilla/5.0...",
              "x-ig-app-id": "936619743392459",
            },
          }
        );

        if (!res.ok) continue;

        const data = await res.json();
        const user = data?.data?.user;
        if (!user) continue;

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

        const keywords = [
          ...filters.keywords.split(",").map((k) => k.trim()),
          ...filters.hashtags.split(",").map((h) => h.trim().replace("#", "")),
        ].filter(Boolean);

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

        // Rate limiting
        await page.waitForTimeout(2000);
      } catch (error) {
        console.error(`Error processing post ${postUrl}:`, error);
        continue;
      }
    }

    return profiles.sort((a, b) => b.score - a.score);
  } finally {
    await browser.close();
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

    // Search first hashtag only (to avoid long execution)
    const profiles = await scrapeInstagramHashtag(hashtags[0], filters);

    return NextResponse.json({
      profiles,
      total: profiles.length,
      hashtag: hashtags[0],
      scrapedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: `Erreur lors du scraping automatique: ${message}` },
      { status: 500 }
    );
  }
}
