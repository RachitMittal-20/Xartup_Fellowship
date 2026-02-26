"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Trash2,
  Play,
  Search,
  SlidersHorizontal,
  Pencil,
  Check,
  X,
  Copy,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { companies } from "@/lib/data";
import { useSavedSearches } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SavedSearchesPage() {
  const { searches, deleteSearch, renameSearch, duplicateSearch, loaded } =
    useSavedSearches();
  const router = useRouter();

  // Inline rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  // Compute result count for each saved search
  const getResultCount = (search: (typeof searches)[0]) => {
    let list = [...companies];
    if (search.query) {
      const q = search.query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (search.filters.sector)
      list = list.filter((c) => c.sector === search.filters.sector);
    if (search.filters.stage)
      list = list.filter((c) => c.stage === search.filters.stage);
    if (search.filters.location)
      list = list.filter((c) => c.location === search.filters.location);
    if (search.filters.teamSize)
      list = list.filter((c) => c.teamSize === search.filters.teamSize);
    return list.length;
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveRename = () => {
    if (editingId && editValue.trim()) {
      renameSearch(editingId, editValue.trim());
    }
    setEditingId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Searches</h1>
          <p className="mt-1 text-muted-foreground">
            Re-run previously saved search and filter combinations.
          </p>
        </div>
        {searches.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Bookmark className="h-4 w-4" />
            <span>
              {searches.length}{" "}
              {searches.length === 1 ? "search" : "searches"} saved
            </span>
          </div>
        )}
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
            const resultCount = getResultCount(search);

            return (
              <Card key={search.id} className="flex flex-col">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingId === search.id ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            className="h-7 text-sm font-semibold"
                            autoFocus
                          />
                          <Button size="icon-xs" onClick={saveRename}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <CardTitle className="text-base flex items-center gap-2">
                          <Bookmark className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate">{search.name}</span>
                        </CardTitle>
                      )}
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

                    {/* More actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs">
                          <span className="text-sm leading-none">···</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => startRename(search.id, search.name)}
                        >
                          <Pencil className="h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => duplicateSearch(search.id)}
                        >
                          <Copy className="h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteConfirmId(search.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

                    {/* Result count preview */}
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>
                        {resultCount}{" "}
                        {resultCount === 1 ? "company" : "companies"} match
                      </span>
                    </div>
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

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Saved Search
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {searches.find((s) => s.id === deleteConfirmId)?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteSearch(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
