"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Download,
  List,
  Building2,
  X,
  FileJson,
  FileSpreadsheet,
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
  CardFooter,
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

export default function ListsPage() {
  const {
    lists,
    createList,
    deleteList,
    removeCompanyFromList,
    loaded,
  } = useLists();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [expandedList, setExpandedList] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createList(newName.trim(), newDesc.trim() || undefined);
    setNewName("");
    setNewDesc("");
    setCreateOpen(false);
  };

  const exportCSV = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;
    const listCompanies = list.companyIds
      .map((cid) => companies.find((c) => c.id === cid))
      .filter(Boolean);

    const headers = [
      "Name",
      "Sector",
      "Stage",
      "Location",
      "Founded",
      "Team Size",
      "Website",
      "Tags",
    ];
    const rows = listCompanies.map((c) => [
      c!.name,
      c!.sector,
      c!.stage,
      c!.location,
      String(c!.foundedYear),
      c!.teamSize,
      c!.website,
      c!.tags.join("; "),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
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

      {/* Lists */}
      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <List className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No lists yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a list and add companies from their profile pages.
            </p>
            <Button
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" /> Create Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => {
            const isExpanded = expandedList === list.id;
            const listCompanies = list.companyIds
              .map((cid) => companies.find((c) => c.id === cid))
              .filter(Boolean);

            return (
              <Card key={list.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() =>
                        setExpandedList(isExpanded ? null : list.id)
                      }
                    >
                      <CardTitle className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        {list.name}
                        <Badge variant="secondary" className="ml-1">
                          {list.companyIds.length}
                        </Badge>
                      </CardTitle>
                      {list.description && (
                        <CardDescription className="mt-1">
                          {list.description}
                        </CardDescription>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Created{" "}
                        {new Date(list.createdAt).toLocaleDateString()} ·
                        Updated{" "}
                        {new Date(list.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => exportCSV(list.id)}
                        disabled={list.companyIds.length === 0}
                        title="Export CSV"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => exportJSON(list.id)}
                        disabled={list.companyIds.length === 0}
                        title="Export JSON"
                      >
                        <FileJson className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteList(list.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    {listCompanies.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No companies in this list yet. Go to a company profile
                        and click &quot;Save to List&quot;.
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
