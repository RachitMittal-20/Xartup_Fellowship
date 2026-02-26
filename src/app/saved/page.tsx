"use client";

import { useRouter } from "next/navigation";
import {
  Bookmark,
  Trash2,
  Play,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useSavedSearches } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SavedSearchesPage() {
  const { searches, deleteSearch, loaded } = useSavedSearches();
  const router = useRouter();

  const runSearch = (search: (typeof searches)[0]) => {
    const params = new URLSearchParams();
    if (search.query) params.set("q", search.query);
    if (search.filters.sector) params.set("sector", search.filters.sector);
    if (search.filters.stage) params.set("stage", search.filters.stage);
    if (search.filters.location)
      params.set("location", search.filters.location);
    if (search.filters.teamSize)
      params.set("teamSize", search.filters.teamSize);
    router.push(`/companies?${params.toString()}`);
  };

  if (!loaded) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading saved searches…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved Searches</h1>
        <p className="mt-1 text-muted-foreground">
          Re-run previously saved search and filter combinations.
        </p>
      </div>

      {/* Search cards */}
      {searches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No saved searches</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Go to the Companies page, apply filters or enter a search query,
              then click &quot;Save Search&quot; to save it here.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/companies")}
            >
              <Search className="h-4 w-4" /> Go to Companies
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {searches.map((search) => {
            const activeFilters = Object.entries(search.filters).filter(
              ([, v]) => v && v !== "all"
            );
            return (
              <Card key={search.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-primary" />
                        {search.name}
                      </CardTitle>
                      <CardDescription className="mt-1.5">
                        Saved{" "}
                        {new Date(search.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => deleteSearch(search.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  {/* Query & filters */}
                  <div className="mt-3 space-y-2">
                    {search.query && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Query:</span>
                        <span className="font-medium">
                          &quot;{search.query}&quot;
                        </span>
                      </div>
                    )}
                    {activeFilters.length > 0 && (
                      <div className="flex items-start gap-1.5 text-sm">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {activeFilters.map(([key, value]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="text-xs"
                            >
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {!search.query && activeFilters.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No filters — shows all companies
                      </p>
                    )}
                  </div>
                </CardHeader>

                <div className="px-6 pb-6">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => runSearch(search)}
                  >
                    <Play className="h-4 w-4" /> Run Search
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
