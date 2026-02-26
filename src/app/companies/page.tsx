"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Bookmark,
  CheckSquare,
  Square,
  Minus,
  ListPlus,
  Download,
  FileSpreadsheet,
  FileJson,
  Check,
} from "lucide-react";
import { companies, sectors, stages, locations, teamSizes } from "@/lib/data";
import { Company } from "@/lib/types";
import { useSavedSearches, useLists } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortKey = "name" | "sector" | "stage" | "location" | "foundedYear" | "teamSize";
type SortDir = "asc" | "desc";

const STAGE_ORDER: Record<string, number> = {
  "Pre-Seed": 0,
  Seed: 1,
  "Series A": 2,
  "Series B": 3,
  "Series C": 4,
};

const TEAM_ORDER: Record<string, number> = {
  "1-10": 0,
  "11-50": 1,
  "51-200": 2,
  "201-500": 3,
};

const PAGE_SIZE = 10;

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CompaniesLoadingSkeleton />}>
      <CompaniesPageInner />
    </Suspense>
  );
}

function CompaniesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="mt-1 text-muted-foreground">
          Discover and evaluate startups aligned with your thesis.
        </p>
      </div>
      <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-muted" />
      <div className="h-64 w-full animate-pulse rounded-lg border bg-muted/30" />
    </div>
  );
}

function CompaniesPageInner() {
  const searchParams = useSearchParams();
  const { saveSearch } = useSavedSearches();
  const {
    lists,
    createList,
    addCompaniesToList,
    loaded: listsLoaded,
  } = useLists();

  // --- state ---
  const [query, setQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [teamSizeFilter, setTeamSizeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Hydrate from URL params (for saved search re-runs)
  useEffect(() => {
    const q = searchParams.get("q");
    const sector = searchParams.get("sector");
    const stage = searchParams.get("stage");
    const location = searchParams.get("location");
    const teamSize = searchParams.get("teamSize");
    if (q) setQuery(q);
    if (sector) setSectorFilter(sector);
    if (stage) setStageFilter(stage);
    if (location) setLocationFilter(location);
    if (teamSize) setTeamSizeFilter(teamSize);
  }, [searchParams]);

  // --- derived ---
  const filtered = useMemo(() => {
    let list = [...companies];

    // text search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // filters
    if (sectorFilter !== "all") list = list.filter((c) => c.sector === sectorFilter);
    if (stageFilter !== "all") list = list.filter((c) => c.stage === stageFilter);
    if (locationFilter !== "all") list = list.filter((c) => c.location === locationFilter);
    if (teamSizeFilter !== "all") list = list.filter((c) => c.teamSize === teamSizeFilter);

    return list;
  }, [query, sectorFilter, stageFilter, locationFilter, teamSizeFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "sector":
          cmp = a.sector.localeCompare(b.sector);
          break;
        case "stage":
          cmp = (STAGE_ORDER[a.stage] ?? 99) - (STAGE_ORDER[b.stage] ?? 99);
          break;
        case "location":
          cmp = a.location.localeCompare(b.location);
          break;
        case "foundedYear":
          cmp = a.foundedYear - b.foundedYear;
          break;
        case "teamSize":
          cmp = (TEAM_ORDER[a.teamSize] ?? 99) - (TEAM_ORDER[b.teamSize] ?? 99);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // reset page when filters change
  const resetPage = () => setPage(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const activeFilterCount = [sectorFilter, stageFilter, locationFilter, teamSizeFilter].filter(
    (f) => f !== "all"
  ).length;

  const clearFilters = () => {
    setSectorFilter("all");
    setStageFilter("all");
    setLocationFilter("all");
    setTeamSizeFilter("all");
    setQuery("");
    resetPage();
  };

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  }

  // ── Batch selection helpers ──
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(sorted.map((c) => c.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const pageSelectedCount = paginated.filter((c) => selectedIds.has(c.id)).length;
  const allPageSelected = paginated.length > 0 && pageSelectedCount === paginated.length;
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected;

  // ── Export helpers ──
  const exportSelectedCSV = () => {
    const selected = sorted.filter((c) => selectedIds.has(c.id));
    if (selected.length === 0) return;

    const headers = ["Name", "Sector", "Stage", "Location", "Founded", "Team Size", "Website", "Founders", "Tags", "Description"];
    const rows = selected.map((c) => [
      c.name, c.sector, c.stage, c.location,
      String(c.foundedYear), c.teamSize, c.website,
      c.founders.join("; "), c.tags.join("; "), c.description,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile(csv, `companies-export-${selectedIds.size}.csv`, "text/csv");
  };

  const exportSelectedJSON = () => {
    const selected = sorted.filter((c) => selectedIds.has(c.id));
    if (selected.length === 0) return;
    const json = JSON.stringify(
      { exportedAt: new Date().toISOString(), count: selected.length, companies: selected },
      null,
      2
    );
    downloadFile(json, `companies-export-${selectedIds.size}.json`, "application/json");
  };

  const handleAddToList = (listId: string) => {
    addCompaniesToList(listId, Array.from(selectedIds));
    setAddToListOpen(false);
  };

  const handleCreateAndAdd = () => {
    if (!newListName.trim()) return;
    const list = createList(newListName.trim());
    addCompaniesToList(list.id, Array.from(selectedIds));
    setNewListName("");
    setAddToListOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="mt-1 text-muted-foreground">
          Discover and evaluate startups aligned with your thesis.
        </p>
      </div>

      {/* Search + Filters bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies…"
              className="pl-9"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetPage();
              }}
            />
          </div>

          {/* Filter selects */}
          <Select
            value={sectorFilter}
            onValueChange={(v) => {
              setSectorFilter(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stageFilter}
            onValueChange={(v) => {
              setStageFilter(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={locationFilter}
            onValueChange={(v) => {
              setLocationFilter(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={teamSizeFilter}
            onValueChange={(v) => {
              setTeamSizeFilter(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Team Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              {teamSizes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {(activeFilterCount > 0 || query) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Clear{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
          )}

          {/* Save Search */}
          {(activeFilterCount > 0 || query) && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  Save Search
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Search</DialogTitle>
                  <DialogDescription>
                    Save this search and filter combination to re-run later.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="Search name…"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchName.trim()) {
                      saveSearch(searchName.trim(), query, {
                        sector: sectorFilter !== "all" ? sectorFilter : undefined,
                        stage: stageFilter !== "all" ? stageFilter : undefined,
                        location: locationFilter !== "all" ? locationFilter : undefined,
                        teamSize: teamSizeFilter !== "all" ? teamSizeFilter : undefined,
                      });
                      setSearchName("");
                      setSaveDialogOpen(false);
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1.5 text-sm">
                  {query && <Badge variant="secondary">Query: "{query}"</Badge>}
                  {sectorFilter !== "all" && <Badge variant="secondary">Sector: {sectorFilter}</Badge>}
                  {stageFilter !== "all" && <Badge variant="secondary">Stage: {stageFilter}</Badge>}
                  {locationFilter !== "all" && <Badge variant="secondary">Location: {locationFilter}</Badge>}
                  {teamSizeFilter !== "all" && <Badge variant="secondary">Team: {teamSizeFilter}</Badge>}
                </div>
                <DialogFooter>
                  <Button
                    disabled={!searchName.trim()}
                    onClick={() => {
                      saveSearch(searchName.trim(), query, {
                        sector: sectorFilter !== "all" ? sectorFilter : undefined,
                        stage: stageFilter !== "all" ? stageFilter : undefined,
                        location: locationFilter !== "all" ? locationFilter : undefined,
                        teamSize: teamSizeFilter !== "all" ? teamSizeFilter : undefined,
                      });
                      setSearchName("");
                      setSaveDialogOpen(false);
                    }}
                  >
                    <Bookmark className="h-4 w-4" /> Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {sorted.length} {sorted.length === 1 ? "company" : "companies"} found
            {selectedIds.size > 0 && (
              <span className="ml-2 text-foreground font-medium">
                · {selectedIds.size} selected
              </span>
            )}
          </span>
          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>
                  {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? "company" : "companies"} selected
          </span>
          {selectedIds.size < sorted.length && (
            <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={selectAllFiltered}>
              Select all {sorted.length}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {/* Add to List */}
            <Dialog open={addToListOpen} onOpenChange={setAddToListOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListPlus className="h-4 w-4" /> Add to List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add {selectedIds.size} Companies to List</DialogTitle>
                  <DialogDescription>
                    Choose an existing list or create a new one.
                  </DialogDescription>
                </DialogHeader>
                {listsLoaded && (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {lists.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No lists yet. Create one below.
                      </p>
                    )}
                    {lists.map((list) => (
                      <button
                        key={list.id}
                        onClick={() => handleAddToList(list.id)}
                        className="flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-accent transition-colors"
                      >
                        <ListPlus className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{list.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {list.companyIds.length} companies
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t">
                  <Input
                    placeholder="New list name…"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateAndAdd()}
                  />
                  <Button size="sm" disabled={!newListName.trim()} onClick={handleCreateAndAdd}>
                    Create & Add
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportSelectedCSV}>
                  <FileSpreadsheet className="h-4 w-4" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSelectedJSON}>
                  <FileJson className="h-4 w-4" /> Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  className="flex items-center justify-center hover:text-foreground transition-colors"
                  onClick={toggleSelectAll}
                  title={allPageSelected ? "Deselect all" : "Select all on page"}
                >
                  {allPageSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : somePageSelected ? (
                    <Minus className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleSort("name")}
                >
                  Company <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleSort("sector")}
                >
                  Sector <SortIcon column="sector" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleSort("stage")}
                >
                  Stage <SortIcon column="stage" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleSort("location")}
                >
                  Location <SortIcon column="location" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleSort("foundedYear")}
                >
                  Founded <SortIcon column="foundedYear" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  onClick={() => handleSort("teamSize")}
                >
                  Team <SortIcon column="teamSize" />
                </button>
              </TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No companies match your search.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((company) => (
                <TableRow key={company.id} className={`group ${selectedIds.has(company.id) ? "bg-muted/50" : ""}`}>
                  <TableCell>
                    <button
                      className="flex items-center justify-center hover:text-foreground transition-colors"
                      onClick={() => toggleSelect(company.id)}
                    >
                      {selectedIds.has(company.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/companies/${company.id}`}
                      className="flex items-center gap-3 font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                        {company.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {company.description.slice(0, 60)}…
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{company.sector}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{company.location}</TableCell>
                  <TableCell className="text-muted-foreground">{company.foundedYear}</TableCell>
                  <TableCell className="text-muted-foreground">{company.teamSize}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {company.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                      {company.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{company.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === safePage ? "default" : "outline"}
                size="sm"
                className="w-8"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}