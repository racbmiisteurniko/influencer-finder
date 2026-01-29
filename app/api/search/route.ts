import { NextRequest, NextResponse } from "next/server";
import { SearchFilters, InfluencerProfile } from "@/app/types";

// Niches et hashtags associés
const NICHE_HASHTAGS: Record<string, string[]> = {
  beaute_naturelle: [
    "beautynaturelle",
    "cosmetiquenaturel",
    "beautebio",
    "skincarenaturel",
    "routinebeaute",
    "soinnaturel",
    "cleanbeauty",
  ],
  zero_dechet: [
    "zerodechet",
    "zerowaste",
    "ecologie",
    "ecoresponsable",
    "vracaddict",
    "reduiresesdechets",
  ],
  savon_artisanal: [
    "savonartisanal",
    "savonnaturel",
    "saponification",
    "savonfroid",
    "handmadesoap",
    "savondemaison",
  ],
  lifestyle_bio: [
    "lifestylebio",
    "vieeco",
    "slowlife",
    "slowliving",
    "minimalisme",
    "consommerresponsable",
  ],
  maman_bio: [
    "mamanbio",
    "mamaneco",
    "maternite",
    "bebenaturel",
    "familleeco",
    "parentalite",
  ],
  bien_etre: [
    "bienetre",
    "wellness",
    "selfcare",
    "routineselfcare",
    "prendresoindesoi",
    "rituelbeaute",
  ],
  made_in_france: [
    "madeinfrance",
    "fabricationfrancaise",
    "artisanatfrancais",
    "createurfrancais",
    "fabriquenfrance",
  ],
};

// Simulated search - In production, this would use Instagram/TikTok APIs or scraping
async function searchInstagram(
  filters: SearchFilters
): Promise<InfluencerProfile[]> {
  const baseUrl = "https://www.instagram.com";

  // Build search hashtags from filters
  const searchHashtags: string[] = [];

  if (filters.hashtags) {
    searchHashtags.push(
      ...filters.hashtags.split(",").map((h) => h.trim().replace("#", ""))
    );
  }

  if (filters.niche && NICHE_HASHTAGS[filters.niche]) {
    searchHashtags.push(...NICHE_HASHTAGS[filters.niche]);
  }

  if (filters.keywords) {
    searchHashtags.push(
      ...filters.keywords.split(",").map((k) => k.trim().replace(/\s+/g, ""))
    );
  }

  // For now, return structured search instructions
  // In production, this would scrape Instagram or use the Graph API
  return [];
}

async function searchTikTok(
  filters: SearchFilters
): Promise<InfluencerProfile[]> {
  // Similar implementation for TikTok
  return [];
}

// Web search for public influencer data
async function webSearchInfluencers(
  filters: SearchFilters
): Promise<InfluencerProfile[]> {
  const niches = filters.niche ? NICHE_HASHTAGS[filters.niche] || [] : [];
  const keywords = filters.keywords
    ? filters.keywords.split(",").map((k) => k.trim())
    : [];
  const hashtags = filters.hashtags
    ? filters.hashtags.split(",").map((h) => h.trim().replace("#", ""))
    : [];

  const allTerms = [...niches.slice(0, 3), ...keywords, ...hashtags];

  // Build search queries
  const queries = [];

  if (filters.platform === "instagram" || filters.platform === "both") {
    queries.push(
      `site:instagram.com ${allTerms.join(" ")} influenceuse ${filters.followersMin / 1000}k ${filters.country || "france"}`
    );
  }

  if (filters.platform === "tiktok" || filters.platform === "both") {
    queries.push(
      `site:tiktok.com ${allTerms.join(" ")} influenceuse ${filters.country || "france"}`
    );
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const filters: SearchFilters = await request.json();

    // Build comprehensive search strategy
    const niches = filters.niche ? NICHE_HASHTAGS[filters.niche] || [] : [];
    const keywords = filters.keywords
      ? filters.keywords.split(",").map((k) => k.trim())
      : [];
    const hashtags = filters.hashtags
      ? filters.hashtags
          .split(",")
          .map((h) => h.trim().replace("#", ""))
      : [];

    const allTerms = [
      ...new Set([...niches, ...keywords, ...hashtags]),
    ];

    // Generate search strategy response
    const strategy = {
      filters,
      searchTerms: allTerms,
      suggestedHashtags: niches,
      searchUrls: {
        instagram: allTerms.slice(0, 5).map(
          (t) => `https://www.instagram.com/explore/tags/${t}/`
        ),
        tiktok: allTerms.slice(0, 5).map(
          (t) => `https://www.tiktok.com/tag/${t}`
        ),
      },
      webSearchQueries: [
        `influenceuse ${filters.platform} ${allTerms.slice(0, 3).join(" ")} ${filters.followersMin / 1000}k-${filters.followersMax / 1000}k abonnés france`,
        `micro influenceuse cosmetique bio ${filters.platform} france ${new Date().getFullYear()}`,
        `top influenceurs beauté naturelle ${filters.platform} france`,
      ],
      profiles: [] as InfluencerProfile[],
      tips: [
        "Explorez les hashtags suggérés directement sur Instagram/TikTok",
        "Vérifiez le taux d'engagement (likes+comments/followers) — visez 3-10%",
        "Regardez la cohérence du contenu avec votre marque",
        "Vérifiez que l'audience est française/francophone",
        "Cherchez une adresse email dans la bio (signe de professionnalisme)",
      ],
    };

    return NextResponse.json(strategy);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
