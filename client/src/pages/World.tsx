import { useCallback } from "react";
import { Layout } from "@/components/Layout";
import MapChart, { getCountryName } from "@/components/MapChart";
import { useWorldStats, useVisitedCountries, useAddVisitedCountry, useRemoveVisitedCountry } from "@/hooks/use-world";
import { Loader2, Trophy, Globe, X } from "lucide-react";

export default function World() {
  const { data: stats, isLoading: loadingStats } = useWorldStats();
  const { data: visited, isLoading: loadingVisited } = useVisitedCountries();
  const { mutate: addCountry } = useAddVisitedCountry();
  const { mutate: removeCountry } = useRemoveVisitedCountry();

  const countryCodes = visited?.map(v => v.countryCode) || [];

  const handleToggleCountry = useCallback((code: string, name: string) => {
    if (countryCodes.includes(code)) {
      removeCountry(code);
    } else {
      addCountry({ countryCode: code });
    }
  }, [countryCodes, addCountry, removeCountry]);

  if (loadingStats || loadingVisited) {
    return (
      <Layout className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-extrabold mb-2" data-testid="text-world-title">My World</h1>
        <p className="text-muted-foreground text-sm mb-6">Tap countries on the map to mark them as visited</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card p-5 rounded-2xl border-2 border-border shadow-sm" data-testid="stat-countries">
                <div className="flex items-center gap-2 mb-2 text-yellow-500">
                    <Trophy className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Countries</span>
                </div>
                <div className="text-4xl font-black text-foreground" data-testid="text-visited-count">{stats?.visitedCount || 0}</div>
            </div>
            <div className="bg-card p-5 rounded-2xl border-2 border-border shadow-sm" data-testid="stat-percent">
                <div className="flex items-center gap-2 mb-2 text-blue-500">
                    <Globe className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">World %</span>
                </div>
                <div className="text-4xl font-black text-foreground" data-testid="text-world-percent">{stats?.percent || 0}%</div>
            </div>
        </div>

        <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full" />
                Map View
            </h2>
            <MapChart
              visitedCountryCodes={countryCodes}
              interactive
              onToggleCountry={handleToggleCountry}
            />
        </div>

        <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-secondary rounded-full" />
                Visited List ({countryCodes.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="visited-list">
                {visited?.map(v => (
                    <div
                      key={v.countryCode}
                      className="px-4 py-3 bg-card rounded-xl border border-border font-bold text-sm text-center shadow-sm flex items-center justify-between gap-2"
                      data-testid={`visited-country-${v.countryCode}`}
                    >
                        <span className="truncate">{getCountryName(v.countryCode)}</span>
                        <button
                          onClick={() => removeCountry(v.countryCode)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          data-testid={`button-remove-${v.countryCode}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {visited?.length === 0 && (
                    <p className="text-muted-foreground text-sm col-span-full">Tap countries on the map above to start tracking!</p>
                )}
            </div>
        </div>
      </div>
    </Layout>
  );
}
