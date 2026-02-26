"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Calendar,
  Users,
  Tag,
  ExternalLink,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ListPlus,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { companies } from "@/lib/data";
import { FUND_THESIS } from "@/lib/types";
import { useNotes, useLists } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ── Thesis score helper ───────────────────────────────────

function computeThesisScore(company: (typeof companies)[0]) {
  let score = 0;
  let factors = 0;

  // Sector match (40 pts)
  factors += 40;
  if (FUND_THESIS.preferredSectors.includes(company.sector)) score += 40;

  // Stage match (25 pts)
  factors += 25;
  if (FUND_THESIS.preferredStages.includes(company.stage)) score += 25;

  // Location match (20 pts)
  factors += 20;
  if (FUND_THESIS.preferredLocations.includes(company.location)) score += 20;

  // Tag overlap (15 pts)
  factors += 15;
  const aiTags = ["AI", "ML", "LLM", "NLP", "foundation-models", "RAG"];
  const tagOverlap = company.tags.filter(
    (t) =>
      aiTags.some((a) => t.toLowerCase().includes(a.toLowerCase())) ||
      t.toLowerCase().includes("developer")
  ).length;
  score += Math.min(15, tagOverlap * 5);

  return Math.round((score / factors) * 100);
}

// ── Signals generator ─────────────────────────────────────

function generateSignals(company: (typeof companies)[0]) {
  const signals: {
    label: string;
    type: "positive" | "neutral" | "negative";
    detail: string;
    date: string;
  }[] = [];

  // Year-based signals
  const age = new Date().getFullYear() - company.foundedYear;
  if (age <= 1) {
    signals.push({
      label: "Recently Founded",
      type: "positive",
      detail: `Founded in ${company.foundedYear} — early-stage opportunity`,
      date: `${company.foundedYear}-01-15`,
    });
  }

  // Stage signals
  if (company.stage === "Pre-Seed" || company.stage === "Seed") {
    signals.push({
      label: "Early Stage",
      type: "positive",
      detail: `Currently at ${company.stage} — aligns with early-stage thesis`,
      date: `${company.foundedYear}-06-01`,
    });
  } else if (company.stage === "Series B") {
    signals.push({
      label: "Growth Stage",
      type: "neutral",
      detail: `Already at ${company.stage} — may be beyond typical entry point`,
      date: `${company.foundedYear + 1}-03-01`,
    });
  }

  // Sector match
  if (FUND_THESIS.preferredSectors.includes(company.sector)) {
    signals.push({
      label: "Thesis Sector Match",
      type: "positive",
      detail: `${company.sector} is a focus sector for the fund`,
      date: `${company.foundedYear}-03-01`,
    });
  }

  // Team size
  if (company.teamSize === "1-10") {
    signals.push({
      label: "Small Team",
      type: "neutral",
      detail: "Lean team — high execution risk but capital-efficient",
      date: `${company.foundedYear}-09-01`,
    });
  } else if (company.teamSize === "51-200") {
    signals.push({
      label: "Scaling Team",
      type: "positive",
      detail: "Growing team indicates traction and product-market fit",
      date: `${company.foundedYear + 1}-01-01`,
    });
  }

  // AI/ML tag
  if (
    company.tags.some(
      (t) =>
        t.toLowerCase().includes("ai") || t.toLowerCase().includes("ml")
    )
  ) {
    signals.push({
      label: "AI/ML Focus",
      type: "positive",
      detail: "Company leverages AI/ML — high strategic alignment",
      date: `${company.foundedYear}-04-01`,
    });
  }

  // Sort by date desc
  signals.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return signals;
}

// ── Main page component ───────────────────────────────────

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const company = companies.find((c) => c.id === id);

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-bold">Company Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          No company with ID &quot;{id}&quot; exists.
        </p>
        <Link href="/companies">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4" /> Back to Companies
          </Button>
        </Link>
      </div>
    );
  }

  const thesisScore = computeThesisScore(company);
  const signals = generateSignals(company);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Companies
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-xl font-bold">
            {company.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {company.name}
            </h1>
            <p className="mt-1 text-muted-foreground max-w-xl">
              {company.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{company.sector}</Badge>
              <Badge variant="outline">{company.stage}</Badge>
              {company.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a href={company.website} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Globe className="h-4 w-4" /> Website
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
          <SaveToListButton companyId={company.id} />
        </div>
      </div>

      <Separator />

      {/* Info cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={MapPin} label="Location" value={company.location} />
        <InfoCard
          icon={Calendar}
          label="Founded"
          value={String(company.foundedYear)}
        />
        <InfoCard icon={Users} label="Team Size" value={company.teamSize} />
        <ThesisCard score={thesisScore} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Founders
                  </p>
                  <p className="mt-1">{company.founders.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Website
                  </p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Sector
                  </p>
                  <p className="mt-1">{company.sector}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Funding Stage
                  </p>
                  <p className="mt-1">{company.stage}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {company.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thesis match explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Thesis Match Analysis
              </CardTitle>
              <CardDescription>
                How this company aligns with: {FUND_THESIS.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold">{thesisScore}%</div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${thesisScore}%`,
                        backgroundColor:
                          thesisScore >= 70
                            ? "oklch(0.6 0.2 145)"
                            : thesisScore >= 40
                            ? "oklch(0.7 0.15 80)"
                            : "oklch(0.6 0.2 25)",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <MatchRow
                  label="Sector"
                  match={FUND_THESIS.preferredSectors.includes(company.sector)}
                  detail={company.sector}
                />
                <MatchRow
                  label="Stage"
                  match={FUND_THESIS.preferredStages.includes(company.stage)}
                  detail={company.stage}
                />
                <MatchRow
                  label="Location"
                  match={FUND_THESIS.preferredLocations.includes(
                    company.location
                  )}
                  detail={company.location}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signals tab */}
        <TabsContent value="signals" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Signal Timeline</CardTitle>
              <CardDescription>
                Key signals and events detected for this company
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No signals detected yet.
                </p>
              ) : (
                <div className="relative space-y-0">
                  {/* vertical line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
                  {signals.map((signal, index) => (
                    <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                      <div
                        className={`relative z-10 mt-1 flex h-[10px] w-[10px] shrink-0 rounded-full border-2 ${
                          signal.type === "positive"
                            ? "border-green-500 bg-green-100"
                            : signal.type === "negative"
                            ? "border-red-500 bg-red-100"
                            : "border-yellow-500 bg-yellow-100"
                        }`}
                        style={{ marginLeft: "14px" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{signal.label}</p>
                          <Badge
                            variant={
                              signal.type === "positive"
                                ? "default"
                                : signal.type === "negative"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {signal.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {signal.detail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(signal.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes" className="pt-4">
          <NotesSection companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ThesisCard({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-green-600"
      : score >= 40
      ? "text-yellow-600"
      : "text-red-500";
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">Thesis Match</p>
          <p className={`font-bold text-lg ${color}`}>{score}%</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MatchRow({
  label,
  match,
  detail,
}: {
  label: string;
  match: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {match ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="text-muted-foreground w-20">{label}</span>
      <span className={match ? "font-medium" : "text-muted-foreground"}>
        {detail}
      </span>
    </div>
  );
}

// ── Notes Section ─────────────────────────────────────────

function NotesSection({ companyId }: { companyId: string }) {
  const { notes, addNote, deleteNote, updateNote, loaded } =
    useNotes(companyId);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  if (!loaded)
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading notes…
        </CardContent>
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>
          Add private notes about this company
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New note form */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Write a note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <Button
          size="sm"
          disabled={!draft.trim()}
          onClick={() => {
            addNote(draft.trim());
            setDraft("");
          }}
        >
          <Plus className="h-4 w-4" /> Add Note
        </Button>

        {notes.length > 0 && <Separator />}

        {/* Notes list */}
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-lg border p-3 text-sm"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="xs"
                      onClick={() => {
                        updateNote(note.id, editDraft.trim());
                        setEditingId(null);
                      }}
                      disabled={!editDraft.trim()}
                    >
                      <Check className="h-3 w-3" /> Save
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{note.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditDraft(note.content);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No notes yet. Add one above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Save to List Dialog ───────────────────────────────────

function SaveToListButton({ companyId }: { companyId: string }) {
  const {
    lists,
    createList,
    addCompanyToList,
    removeCompanyFromList,
    getListsForCompany,
    loaded,
  } = useLists();
  const [newListName, setNewListName] = useState("");
  const [open, setOpen] = useState(false);

  const companyLists = getListsForCompany(companyId);
  const isInList = (listId: string) =>
    companyLists.some((l) => l.id === listId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListPlus className="h-4 w-4" />
          Save to List
          {companyLists.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {companyLists.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to List</DialogTitle>
          <DialogDescription>
            Add or remove this company from your lists.
          </DialogDescription>
        </DialogHeader>

        {loaded && (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {lists.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No lists yet. Create one below.
              </p>
            )}
            {lists.map((list) => {
              const inList = isInList(list.id);
              return (
                <button
                  key={list.id}
                  onClick={() =>
                    inList
                      ? removeCompanyFromList(list.id, companyId)
                      : addCompanyToList(list.id, companyId)
                  }
                  className="flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-accent transition-colors"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      inList
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-input"
                    }`}
                  >
                    {inList && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{list.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {list.companyIds.length}{" "}
                      {list.companyIds.length === 1 ? "company" : "companies"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <Separator />

        {/* Create new list inline */}
        <div className="flex gap-2">
          <Input
            placeholder="New list name…"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newListName.trim()) {
                const list = createList(newListName.trim());
                addCompanyToList(list.id, companyId);
                setNewListName("");
              }
            }}
          />
          <Button
            size="sm"
            disabled={!newListName.trim()}
            onClick={() => {
              const list = createList(newListName.trim());
              addCompanyToList(list.id, companyId);
              setNewListName("");
            }}
          >
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
