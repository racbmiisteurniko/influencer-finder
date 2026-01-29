"use client";

import { useState } from "react";

interface ScrapedProfile {
  username: string;
  fullName: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  email: string | null;
  verified: boolean;
  score: number;
  profileUrl: string;
  lastPost: string | null;
}

interface ScrapeResult {
  profiles: ScrapedProfile[];
  errors: { error: string }[];
  total: number;
}

export default function ProfileAnalyzer() {
  const [usernames, setUsernames] = useState("");
  const [keywords, setKeywords] = useState("savon, cosmétique, naturel, bio");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResult | null>(null);

  const handleAnalyze = async () => {
    if (!usernames.trim()) return;

    setLoading(true);
    try {
      const usernameList = usernames
        .split(/[\n,]/)
        .map((u) => u.trim())
        .filter(Boolean);
      const keywordList = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: usernameList,
          keywords: keywordList,
        }),
      });

      const data = await res.json();
      setResults(data);
    } catch {
      console.error("Erreur lors de l'analyse");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-stone-600 bg-stone-50 border-stone-200";
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 5) return "text-green-600";
    if (rate >= 3) return "text-amber-600";
    if (rate >= 1) return "text-orange-600";
    return "text-red-600";
  };

  const exportCSV = () => {
    if (!results?.profiles.length) return;
    const headers = [
      "Username",
      "Nom",
      "Abonnés",
      "Engagement %",
      "Likes moy.",
      "Comments moy.",
      "Email",
      "Score",
      "URL",
      "Bio",
    ];
    const rows = results.profiles.map((p) => [
      p.username,
      p.fullName,
      p.followers,
      p.engagementRate,
      p.avgLikes,
      p.avgComments,
      p.email || "",
      p.score,
      p.profileUrl,
      `"${(p.bio || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `influenceurs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h2 className="text-lg font-bold text-stone-800 mb-4">
          🔬 Analyser des profils Instagram
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Collez des noms d&apos;utilisateur Instagram (un par ligne ou séparés par
          des virgules). L&apos;outil va analyser chaque profil et le noter selon sa
          pertinence pour Savon Yvard.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              📋 Usernames Instagram
            </label>
            <textarea
              value={usernames}
              onChange={(e) => setUsernames(e.target.value)}
              placeholder={`exemple_influenceuse1\nexemple_influenceuse2\nexemple_influenceuse3`}
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              🏷️ Mots-clés de scoring (pertinence pour votre marque)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="savon, cosmétique, naturel, bio, artisanal..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !usernames.trim()}
            className="w-full py-3 px-6 bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-800 hover:to-stone-900 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyse en cours... (max 10 profils)
              </span>
            ) : (
              "🔬 Analyser les profils"
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-stone-800">
              📊 Résultats ({results.total} profil
              {results.total > 1 ? "s" : ""})
            </h3>
            {results.profiles.length > 0 && (
              <button
                onClick={exportCSV}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                📥 Exporter CSV
              </button>
            )}
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                ⚠️ Erreurs :
              </p>
              {results.errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600">
                  {err.error}
                </p>
              ))}
            </div>
          )}

          {results.profiles.map((profile) => (
            <div
              key={profile.username}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-bold text-stone-800 hover:text-amber-700 transition-colors"
                    >
                      @{profile.username}
                    </a>
                    {profile.verified && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{profile.fullName}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full border text-sm font-bold ${getScoreColor(profile.score)}`}
                >
                  Score: {profile.score}/100
                </div>
              </div>

              <p className="text-sm text-stone-600 mb-4 bg-stone-50 rounded-lg p-3">
                {profile.bio || "Pas de bio"}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center p-2 bg-stone-50 rounded-lg">
                  <div className="text-lg font-bold text-stone-800">
                    {formatNumber(profile.followers)}
                  </div>
                  <div className="text-xs text-stone-500">Abonnés</div>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg">
                  <div className="text-lg font-bold text-stone-800">
                    {formatNumber(profile.posts)}
                  </div>
                  <div className="text-xs text-stone-500">Posts</div>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg">
                  <div
                    className={`text-lg font-bold ${getEngagementColor(profile.engagementRate)}`}
                  >
                    {profile.engagementRate}%
                  </div>
                  <div className="text-xs text-stone-500">Engagement</div>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg">
                  <div className="text-lg font-bold text-stone-800">
                    {formatNumber(profile.avgLikes)}
                  </div>
                  <div className="text-xs text-stone-500">Likes moy.</div>
                </div>
                <div className="text-center p-2 bg-stone-50 rounded-lg">
                  <div className="text-lg font-bold text-stone-800">
                    {profile.email ? "📧 Oui" : "—"}
                  </div>
                  <div className="text-xs text-stone-500">Email</div>
                </div>
              </div>

              {profile.email && (
                <div className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-2">
                  📧 {profile.email}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
