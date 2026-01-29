"use client";

interface SearchStrategy {
  filters: Record<string, unknown>;
  searchTerms: string[];
  suggestedHashtags: string[];
  searchUrls: {
    instagram: string[];
    tiktok: string[];
  };
  webSearchQueries: string[];
  tips: string[];
}

interface Props {
  results: SearchStrategy | null;
}

export default function SearchResults({ results }: Props) {
  if (!results) return null;

  return (
    <div className="space-y-6">
      {/* Search Terms */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-bold text-stone-800 mb-3">
          🏷️ Termes de recherche générés
        </h3>
        <div className="flex flex-wrap gap-2">
          {results.searchTerms.map((term) => (
            <span
              key={term}
              className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm border border-amber-200"
            >
              #{term}
            </span>
          ))}
        </div>
      </div>

      {/* Instagram Links */}
      {results.searchUrls.instagram.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-stone-800 mb-3">
            📸 Explorer sur Instagram
          </h3>
          <div className="space-y-2">
            {results.searchUrls.instagram.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:border-purple-300 transition-colors text-sm text-purple-700 hover:text-purple-900"
              >
                🔗 {url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* TikTok Links */}
      {results.searchUrls.tiktok.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-bold text-stone-800 mb-3">
            🎵 Explorer sur TikTok
          </h3>
          <div className="space-y-2">
            {results.searchUrls.tiktok.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-stone-50 rounded-xl border border-stone-200 hover:border-stone-400 transition-colors text-sm text-stone-700 hover:text-stone-900"
              >
                🔗 {url}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Web Search Queries */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <h3 className="text-lg font-bold text-stone-800 mb-3">
          🌐 Recherches Google suggérées
        </h3>
        <div className="space-y-2">
          {results.webSearchQueries.map((query, i) => (
            <a
              key={i}
              href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors text-sm text-blue-700 hover:text-blue-900"
            >
              🔍 {query}
            </a>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <h3 className="text-lg font-bold text-amber-800 mb-3">
          💡 Conseils de recherche
        </h3>
        <ul className="space-y-2">
          {results.tips.map((tip, i) => (
            <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
              <span className="mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
