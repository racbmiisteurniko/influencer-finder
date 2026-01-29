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
  const [results, setResults] = useState(null);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
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
              <SearchForm onSearch={handleSearch} loading={loading} />
            </div>
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
