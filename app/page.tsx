"use client";

import { useState } from "react";
import SearchForm from "./components/SearchForm";
import SearchResults from "./components/SearchResults";
import ProfileAnalyzer from "./components/ProfileAnalyzer";
import { SearchFilters } from "./types";

type Tab = "search" | "analyze";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [autoResults, setAutoResults] = useState<{
    profiles: unknown[];
    total: number;
    hashtag: string;
  } | null>(null);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setAutoResults(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      setResults(data);
    } catch {
      console.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSearch = async (filters: SearchFilters) => {
    setAutoLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/auto-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      setAutoResults(data);
    } catch {
      console.error("Erreur lors du scraping automatique");
    } finally {
      setAutoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                🔍 Influencer Finder
              </h1>
              <p className="text-stone-500 text-sm mt-1">
                Recherche d&apos;influenceurs pour Savon Yvard — Cosmétiques
                artisanaux
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                🧼 Savon Yvard
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 bg-stone-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "search"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              🔍 Recherche
            </button>
            <button
              onClick={() => setActiveTab("analyze")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "analyze"
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              🔬 Analyser des profils
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === "search" && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
              <SearchForm
                onSearch={handleSearch}
                onAutoSearch={handleAutoSearch}
                loading={loading}
                autoLoading={autoLoading}
              />
            </div>
            {autoResults && autoResults.profiles && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-stone-800">
                    🤖 Profils trouvés automatiquement ({autoResults.total})
                  </h3>
                  <span className="text-sm text-stone-500">
                    Hashtag: #{autoResults.hashtag}
                  </span>
                </div>
                {(autoResults.profiles as {
                  username: string;
                  fullName: string;
                  followers: number;
                  engagementRate: number;
                  score: number;
                  profileUrl: string;
                  bio: string;
                  email: string | null;
                  verified: boolean;
                  avgLikes: number;
                  posts: number;
                }[]).map((profile) => (
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
                        <p className="text-sm text-stone-500">
                          {profile.fullName}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full border text-sm font-bold ${
                          profile.score >= 70
                            ? "text-green-600 bg-green-50 border-green-200"
                            : profile.score >= 40
                              ? "text-amber-600 bg-amber-50 border-amber-200"
                              : "text-stone-600 bg-stone-50 border-stone-200"
                        }`}
                      >
                        Score: {profile.score}/100
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 mb-4 bg-stone-50 rounded-lg p-3">
                      {profile.bio || "Pas de bio"}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-stone-50 rounded-lg">
                        <div className="text-lg font-bold text-stone-800">
                          {profile.followers >= 1000000
                            ? `${(profile.followers / 1000000).toFixed(1)}M`
                            : profile.followers >= 1000
                              ? `${(profile.followers / 1000).toFixed(1)}k`
                              : profile.followers}
                        </div>
                        <div className="text-xs text-stone-500">Abonnés</div>
                      </div>
                      <div className="text-center p-2 bg-stone-50 rounded-lg">
                        <div className="text-lg font-bold text-stone-800">
                          {profile.posts}
                        </div>
                        <div className="text-xs text-stone-500">Posts</div>
                      </div>
                      <div className="text-center p-2 bg-stone-50 rounded-lg">
                        <div
                          className={`text-lg font-bold ${
                            profile.engagementRate >= 5
                              ? "text-green-600"
                              : profile.engagementRate >= 3
                                ? "text-amber-600"
                                : profile.engagementRate >= 1
                                  ? "text-orange-600"
                                  : "text-red-600"
                          }`}
                        >
                          {profile.engagementRate}%
                        </div>
                        <div className="text-xs text-stone-500">
                          Engagement
                        </div>
                      </div>
                      <div className="text-center p-2 bg-stone-50 rounded-lg">
                        <div className="text-lg font-bold text-stone-800">
                          {profile.avgLikes >= 1000
                            ? `${(profile.avgLikes / 1000).toFixed(1)}k`
                            : profile.avgLikes}
                        </div>
                        <div className="text-xs text-stone-500">
                          Likes moy.
                        </div>
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
            <SearchResults results={results} />
          </div>
        )}

        {activeTab === "analyze" && <ProfileAnalyzer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 mt-12 py-6 text-center text-stone-400 text-sm">
        Influencer Finder — Outil interne Savon Yvard · Créé par Orion ⚒️
      </footer>
    </div>
  );
}
