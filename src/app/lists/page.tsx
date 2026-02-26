"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  List,
  Building2,
  X,
  FileJson,
  FileSpreadsheet,
  Pencil,
  Check,
  Copy,
  Search,
  ChevronDown,
  ChevronRight,
  Download,
  AlertTriangle,
} from "lucide-react";
import { companies } from "@/lib/data";
import { useLists } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ListsPage() {
  const {
    lists,
    createList,
    deleteList,
    renameList,
    updateListDescription,
    removeCompanyFromList,
    duplicateList,
    loaded,
  } = useLists();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Inline editing
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [editDescValue, setEditDescValue] = useState("");

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createList(newName.trim(), newDesc.trim() || undefined);
    setNewName("");
    setNewDesc("");
    setCreateOpen(false);
  };

  // Filter lists by search query
  const filteredLists = useMemo(() => {
    if (!searchQuery.trim()) return lists;
    const q = searchQuery.toLowerCase();
    return lists.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        l.companyIds.some((cid) => {
          const c = companies.find((co) => co.id === cid);
          return c && c.name.toLowerCase().includes(q);
        })
    );
  }, [lists, searchQuery]);

  // Stats
  const totalCompanies = new Set(lists.flatMap((l) => l.companyIds)).size;

  const exportCSV = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const listCompanies = list.companyIds
      .map((cid) => companies.find((c) => c.id === cid))
      .filter(Boolean);

    const headers = [
      "Name", "Sector", "Stage", "Location", "Founded",
      "Team Size", "Website", "Founders", "Tags", "Description",
    ];
    const rows = listCompanies.map((c) => [
      c!.name, c!.sector, c!.stage, c!.location,
      String(c!.foundedYear), c!.teamSize, c!.website,
      c!.founders.join("; "), c!.tags.join("; "), c!.description,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    download(csv, `${list.name}.csv`, "text/csv");
  };

  const exportJSON = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const listCompanies = list.companyIds
      .map((cid) => companies.find((c) => c.id === cid))
      .filter(Boolean);

    const json = JSON.stringify(
      {
        listName: list.name,
        description: list.description,
        exportedAt: new Date().toISOString(),
        companies: listCompanies,
      },
      null,
      2
    );

    download(json, `${list.name}.json`, "application/json");
  };

  const exportAllCSV = () => {
    const allCompanyIds = new Set(lists.flatMap((l) => l.companyIds));
    const allCompanies = Array.from(allCompanyIds)
      .map((cid) => companies.find((c) => c.id === cid))
      .filter(Boolean);

    const headers = [
      "Name", "Sector", "Stage", "Location", "Founded",
      "Team Size", "Website", "Founders", "Tags", "Description", "In Lists",
    ];
    const rows = allCompanies.map((c) => {
      const inLists = lists
        .filter((l) => l.companyIds.includes(c!.id))
        .map((l) => l.name)
        .join("; ");
      return [
        c!.name, c!.sector, c!.stage, c!.location,
        String(c!.foundedYear), c!.teamSize, c!.website,
        c!.founders.join("; "), c!.tags.join("; "), c!.description, inLists,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    download(csv, "all-lists-export.csv", "text/csv");
  };

  const startEditName = (listId: string, currentName: string) => {
    setEditingNameId(listId);
    setEditNameValue(currentName);
  };

  const saveEditName = () => {
    if (editingNameId && editNameValue.trim()) {
      renameList(editingNameId, editNameValue.trim());
    }
    setEditingNameId(null);
  };

  const startEditDesc = (listId: string, currentDesc: string) => {
    setEditingDescId(listId);
    setEditDescValue(currentDesc);
  };

  const saveEditDesc = () => {
    if (editingDescId) {
      updateListDescription(editingDescId, editDescValue.trim());
    }
    setEditingDescId(null);
  };

  if (!loaded) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Loading lists…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lists</h1>
          <p className="mt-1 text-muted-foreground">
            Organize companies into custom lists. Export as CSV or JSON.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk export */}
          {lists.length > 0 && totalCompanies > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4" /> Export All
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAllCSV}>
                  <FileSpreadsheet className="h-4 w-4" /> Export all as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
                <DialogDescription>
                  Give your list a name and optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="List name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newName.trim()}>
                  <Plus className="h-4 w-4" /> Create List
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      {lists.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <List className="h-4 w-4" />
            <span>{lists.length} {lists.length === 1 ? "list" : "lists"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            <span>{totalCompanies} unique {totalCompanies === 1 ? "company" : "companies"}</span>
          </div>
        </div>
      )}

      {/* Search bar */}
      {lists.length > 1 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lists or companies…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Lists */}
      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <List className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No lists yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a list and add companies from their profile pages or the Companies table.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create Your First List
            </Button>
          </CardContent>
        </Card>
      ) : filteredLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium">No lists match &quot;{searchQuery}&quot;</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLists.map((list) => {
            const isExpanded = expandedList === list.id;
            const listCompanies = list.companyIds
              .map((cid) => companies.find((c) => c.id === cid))
              .filter(Boolean);

            return (
              <Card key={list.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() =>
                        setExpandedList(isExpanded ? null : list.id)
                      }
                    >
                      {/* Title (inline editable) */}
                      {editingNameId === list.id ? (
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditName();
                              if (e.key === "Escape") setEditingNameId(null);
                            }}
                            className="h-8 text-base font-semibold"
                            autoFocus
                          />
                          <Button size="icon-xs" onClick={saveEditName}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setEditingNameId(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <CardTitle className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate">{list.name}</span>
                          <Badge variant="secondary" className="ml-1 shrink-0">
                            {list.companyIds.length}
                          </Badge>
                        </CardTitle>
                      )}

                      {/* Description (inline editable) */}
                      {editingDescId === list.id ? (
                        <div
                          className="flex items-start gap-2 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Textarea
                            value={editDescValue}
                            onChange={(e) => setEditDescValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveEditDesc();
                              }
                              if (e.key === "Escape") setEditingDescId(null);
                            }}
                            className="min-h-[40px] text-sm"
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <Button size="icon-xs" onClick={saveEditDesc}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => setEditingDescId(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        list.description && (
                          <CardDescription className="mt-1 ml-6">
                            {list.description}
                          </CardDescription>
                        )
                      )}

                      <p className="text-xs text-muted-foreground mt-1.5 ml-6">
                        Created{" "}
                        {new Date(list.createdAt).toLocaleDateString()} ·
                        Updated{" "}
                        {new Date(list.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Export dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            disabled={list.companyIds.length === 0}
                            title="Export"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportCSV(list.id)}>
                            <FileSpreadsheet className="h-4 w-4" /> Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportJSON(list.id)}>
                            <FileJson className="h-4 w-4" /> Export JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* More actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="More actions"
                          >
                            <span className="text-lg leading-none">···</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => startEditName(list.id, list.name)}
                          >
                            <Pencil className="h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              startEditDesc(list.id, list.description || "")
                            }
                          >
                            <Pencil className="h-4 w-4" /> Edit Description
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateList(list.id)}
                          >
                            <Copy className="h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirmId(list.id)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    {listCompanies.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No companies in this list yet. Go to a company profile
                        or select companies in the table to add them.
                      </p>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company</TableHead>
                              <TableHead>Sector</TableHead>
                              <TableHead>Stage</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead className="w-10" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {listCompanies.map((company) => (
                              <TableRow key={company!.id}>
                                <TableCell>
                                  <Link
                                    href={`/companies/${company!.id}`}
                                    className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                                  >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
                                      {company!.name.charAt(0)}
                                    </div>
                                    {company!.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {company!.sector}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {company!.stage}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {company!.location}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {company!.teamSize}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() =>
                                      removeCompanyFromList(
                                        list.id,
                                        company!.id
                                      )
                                    }
                                    title="Remove from list"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                )}
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
              Delete List
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;
              {lists.find((l) => l.id === deleteConfirmId)?.name}&quot;? This
              action cannot be undone. The companies themselves will not be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteList(deleteConfirmId);
                  if (expandedList === deleteConfirmId) setExpandedList(null);
                }
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

// ── Helpers ───────────────────────────────────────────────

function download(content: string, filename: string, type: string) {
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
