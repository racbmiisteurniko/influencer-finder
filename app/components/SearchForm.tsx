"use client";

import { useState } from "react";
import { SearchFilters } from "../types";

const NICHES = [
  { value: "", label: "Toutes les niches" },
  { value: "beaute_naturelle", label: "🧴 Beauté naturelle" },
  { value: "zero_dechet", label: "♻️ Zéro déchet" },
  { value: "savon_artisanal", label: "🧼 Savon artisanal" },
  { value: "lifestyle_bio", label: "🌿 Lifestyle bio" },
  { value: "maman_bio", label: "👶 Maman bio" },
  { value: "bien_etre", label: "🧘 Bien-être / Self-care" },
  { value: "made_in_france", label: "🇫🇷 Made in France" },
];

const COUNTRIES = [
  { value: "", label: "Tous les pays" },
  { value: "france", label: "🇫🇷 France" },
  { value: "belgique", label: "🇧🇪 Belgique" },
  { value: "suisse", label: "🇨🇭 Suisse" },
  { value: "canada", label: "🇨🇦 Canada (QC)" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg" },
];

const LANGUAGES = [
  { value: "", label: "Toutes les langues" },
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
];

interface Props {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    keywords: "",
    hashtags: "",
    platform: "both",
    followersMin: 30000,
    followersMax: 150000,
    engagementMin: 2,
    engagementMax: 15,
    language: "fr",
    country: "france",
    niche: "",
    contactOnly: false,
    verified: false,
  });

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const formatFollowers = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            🔍 Mots-clés
          </label>
          <input
            type="text"
            value={filters.keywords}
            onChange={(e) => updateFilter("keywords", e.target.value)}
            placeholder="savon naturel, cosmétique bio..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            # Hashtags
          </label>
          <input
            type="text"
            value={filters.hashtags}
            onChange={(e) => updateFilter("hashtags", e.target.value)}
            placeholder="#savonnaturel, #cosmetiquebio..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
          />
        </div>
      </div>

      {/* Platform & Niche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            📱 Plateforme
          </label>
          <select
            value={filters.platform}
            onChange={(e) =>
              updateFilter(
                "platform",
                e.target.value as "instagram" | "tiktok" | "both"
              )
            }
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
          >
            <option value="both">Instagram + TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            🎯 Niche
          </label>
          <select
            value={filters.niche}
            onChange={(e) => updateFilter("niche", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
          >
            {NICHES.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            🌍 Pays
          </label>
          <select
            value={filters.country}
            onChange={(e) => updateFilter("country", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Followers Range */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-stone-700">
            👥 Abonnés :{" "}
            <span className="text-amber-700">
              {formatFollowers(filters.followersMin)} —{" "}
              {formatFollowers(filters.followersMax)}
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">
              Minimum
            </label>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={filters.followersMin}
              onChange={(e) =>
                updateFilter("followersMin", parseInt(e.target.value))
              }
              className="w-full accent-amber-600"
            />
            <input
              type="number"
              value={filters.followersMin}
              onChange={(e) =>
                updateFilter("followersMin", parseInt(e.target.value) || 0)
              }
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-700 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">
              Maximum
            </label>
            <input
              type="range"
              min="1000"
              max="1000000"
              step="1000"
              value={filters.followersMax}
              onChange={(e) =>
                updateFilter("followersMax", parseInt(e.target.value))
              }
              className="w-full accent-amber-600"
            />
            <input
              type="number"
              value={filters.followersMax}
              onChange={(e) =>
                updateFilter("followersMax", parseInt(e.target.value) || 0)
              }
              className="w-full mt-1 px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-700 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-amber-700 hover:text-amber-900 font-medium flex items-center gap-1"
      >
        {showAdvanced ? "▼" : "▶"} Filtres avancés
      </button>

      {showAdvanced && (
        <div className="space-y-4 bg-stone-50 rounded-xl p-4">
          {/* Engagement Rate */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              📊 Taux d&apos;engagement :{" "}
              <span className="text-amber-700">
                {filters.engagementMin}% — {filters.engagementMax}%
              </span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-stone-500 mb-1">
                  Minimum (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={filters.engagementMin}
                  onChange={(e) =>
                    updateFilter(
                      "engagementMin",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-700 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">
                  Maximum (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={filters.engagementMax}
                  onChange={(e) =>
                    updateFilter(
                      "engagementMax",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-700 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              🗣️ Langue
            </label>
            <select
              value={filters.language}
              onChange={(e) => updateFilter("language", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all text-stone-800 bg-white"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.contactOnly}
                onChange={(e) =>
                  updateFilter("contactOnly", e.target.checked)
                }
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              📧 Email visible uniquement
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => updateFilter("verified", e.target.checked)}
                className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              ✅ Comptes vérifiés
            </label>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            Recherche en cours...
          </span>
        ) : (
          "🔍 Rechercher des influenceurs"
        )}
      </button>
    </form>
  );
}
