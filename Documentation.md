# VC Scout — Full Documentation

> **Precision AI Scout for Venture Capital Firms**
> Discover, enrich, and evaluate startups aligned with your investment thesis.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Getting Started](#4-getting-started)
5. [Environment Variables](#5-environment-variables)
6. [Project Structure](#6-project-structure)
7. [Features Deep Dive](#7-features-deep-dive)
8. [Data Model](#8-data-model)
9. [API Reference](#9-api-reference)
10. [State Management](#10-state-management)
11. [UI Components](#11-ui-components)
12. [Deployment](#12-deployment)
13. [Design Decisions](#13-design-decisions)

---

## 1. Project Overview

VC Scout is a VC deal-sourcing tool inspired by [Harmonic](https://harmonic.ai) and [Cardinal](https://trycardinal.ai). It provides a modern intelligence interface for:

- **Discovering** companies through fast search and faceted filters
- **Evaluating** startups with thesis-based scoring and signal timelines
- **Enriching** company profiles with real-time public website scraping
- **Organizing** research into custom lists with CSV/JSON export
- **Saving** search + filter combinations for repeatable scouting

The app seeds from a mock dataset of **25 companies** across 6 sectors and enriches them on demand using [Firecrawl](https://firecrawl.dev) for AI-powered web scraping.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix primitives) | — |
| Icons | Lucide React | 0.575.0 |
| Command Palette | cmdk | 1.1.1 |
| AI Scraping | Firecrawl JS SDK | 4.13.1 |
| Fonts | Geist Sans + Geist Mono | — |
| Persistence | localStorage | — |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  App Shell                                     │  │
│  │  ┌──────────┐  ┌───────────────────────────┐   │  │
│  │  │ Sidebar  │  │ Header (Global Search)    │   │  │
│  │  │ (nav)    │  ├───────────────────────────┤   │  │
│  │  │          │  │ Main Content              │   │  │
│  │  │          │  │  /companies               │   │  │
│  │  │          │  │  /companies/[id]          │   │  │
│  │  │          │  │  /lists                   │   │  │
│  │  │          │  │  /saved                   │   │  │
│  │  └──────────┘  └───────────────────────────┘   │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  localStorage: notes, lists, saved searches, cache   │
└──────────────────────┬───────────────────────────────┘
                       │ POST /api/enrich
                       ▼
┌──────────────────────────────────────────────────────┐
│                  Server (Next.js API)                │
│                                                      │
│  /api/enrich                                         │
│    → Firecrawl SDK (scrape public website)           │
│    → Content extraction (summary, bullets, keywords) │
│    → Signal inference (hiring, funding, product)     │
│    → Return structured EnrichmentData                │
│                                                      │
│  FIRECRAWL_API_KEY stays server-side (never exposed) │
└──────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Server-side enrichment**: API keys are never exposed to the browser. The `/api/enrich` route handles all Firecrawl calls.
- **Client-side persistence**: All user data (notes, lists, saved searches, enrichment cache) is stored in `localStorage` for zero-backend simplicity.
- **Static + Dynamic rendering**: Most pages are statically prerendered. Only `/api/enrich` and `/companies/[id]` are server-rendered on demand.

---

## 4. Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or pnpm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/RachitMittal-20/Xartup_Fellowship.git
cd Xartup_Fellowship

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Firecrawl API key (see Section 5)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack (hot reload) |
| `npm run build` | Create optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint checks |

---

## 5. Environment Variables

Create a `.env.local` file in the project root:

```env
# Required for live enrichment (Firecrawl AI scraping)
# Get your key at https://firecrawl.dev
FIRECRAWL_API_KEY=fc-your-api-key-here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `FIRECRAWL_API_KEY` | No* | API key for Firecrawl web scraping service |

*If omitted, enrichment falls back to **mock data** — the rest of the app works fully without it.

> **Security**: The API key is only accessed server-side in `/api/enrich`. It is never bundled into client JavaScript. The `.env*` pattern is in `.gitignore`.

---

## 6. Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (sidebar + header shell)
│   ├── page.tsx                # Landing / redirect
│   ├── globals.css             # Tailwind + custom CSS variables
│   ├── companies/
│   │   ├── page.tsx            # Companies discovery table
│   │   └── [id]/
│   │       └── page.tsx        # Company profile (overview, signals, notes, enrichment)
│   ├── lists/
│   │   └── page.tsx            # List management + export
│   ├── saved/
│   │   └── page.tsx            # Saved searches management
│   └── api/
│       └── enrich/
│           └── route.ts        # Server-side enrichment endpoint
├── components/
│   ├── sidebar.tsx             # Desktop + mobile sidebar navigation
│   ├── header.tsx              # Sticky header with search + mobile menu
│   ├── global-search.tsx       # Cmd+K command palette search
│   └── ui/                     # shadcn/ui component library (16 components)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
└── lib/
    ├── data.ts                 # Mock dataset (25 companies)
    ├── types.ts                # TypeScript interfaces + fund thesis
    ├── store.ts                # localStorage hooks (notes, lists, searches, cache)
    └── utils.ts                # cn() utility for className merging
```

---

## 7. Features Deep Dive

### 7.1 App Shell & Navigation

- **Desktop sidebar**: Fixed 240px sidebar with logo, nav links (Companies, Lists, Saved Searches), and thesis label. Hidden below `md` breakpoint.
- **Mobile sidebar**: Hamburger menu in the header opens a Sheet overlay with identical navigation. Auto-closes on link click.
- **Global search** (`Cmd+K` / `Ctrl+K`): Command palette that searches companies by name, sector, and description. Click a result to navigate directly to the company profile.

### 7.2 Companies Page (`/companies`)

| Feature | Details |
|---------|---------|
| **Text search** | Filters by name, sector, description, and tags |
| **Filter dropdowns** | Sector (6), Stage (5), Location (8), Team Size (4) |
| **Sortable table** | 7 columns, click to toggle asc/desc. Custom sort order for Stage and Team Size |
| **Pagination** | 10 companies per page with numbered page buttons |
| **Batch selection** | Checkbox per row, select-all on page, select all filtered |
| **Bulk "Add to List"** | Multi-select → choose or create list → batch add |
| **Bulk export** | Export selected companies as CSV or JSON |
| **Save Search** | Save current query + filters as a named search for re-use |
| **URL params** | Query and filters are encoded in URL params (shareable, used by Saved Searches) |

### 7.3 Company Profile (`/companies/[id]`)

Four tabs:

**Overview**
- Company details card (founders, website, sector, stage, tags)
- Thesis Match Analysis: scored 0–100% based on sector (40pts), stage (25pts), location (20pts), and AI/ML tag overlap (15pts). Color-coded progress bar (green/yellow/red).

**Signals**
- Auto-generated signal timeline with color-coded dots (green = positive, yellow = neutral, red = negative)
- Signals include: recently founded, early stage match, thesis sector match, scaling team, AI/ML focus

**Notes**
- Add, edit, and delete private notes per company
- Persisted in localStorage, timestamped

**Enrichment**
- One-click "Enrich Now" button to fetch live data
- Loading state with spinner
- Error handling with retry
- Displays: Summary, What They Do (bullets), Keywords (badges), Derived Signals (color-coded), Sources (clickable URLs with timestamps)
- Cached in localStorage — skip re-fetch, with "Re-enrich" option

**Save to List**
- Dialog showing all lists with toggle checkboxes
- Create new list inline and add company simultaneously

### 7.4 Lists Page (`/lists`)

| Feature | Details |
|---------|---------|
| **Create list** | Dialog with name + optional description |
| **Stats bar** | Total list count + unique company count |
| **Search** | Filter lists by name, description, or company names within |
| **Expand/collapse** | Click card to reveal companies table |
| **Inline rename** | Edit name in-place via dropdown menu |
| **Edit description** | Edit description in-place |
| **Duplicate** | Clone list with all companies |
| **Remove companies** | Per-row remove button in expanded view |
| **Export per-list** | CSV or JSON download via dropdown |
| **Export All** | CSV of all unique companies across all lists |
| **Delete confirmation** | Dialog before destructive delete |

### 7.5 Saved Searches (`/saved`)

| Feature | Details |
|---------|---------|
| **Display** | Grid of cards showing name, query, filter badges |
| **Result count** | Live preview of how many companies currently match |
| **Run Search** | Navigates to `/companies` with filters pre-applied via URL params |
| **Inline rename** | Edit search name in-place |
| **Duplicate** | Clone search with "(copy)" suffix |
| **Delete confirmation** | Dialog before deletion |

### 7.6 Live Enrichment

**Flow**: Profile → Click "Enrich" → `POST /api/enrich` → Firecrawl scrapes website → Extract fields → Cache + Display

**Extracted fields:**

| Field | Extraction Method |
|-------|------------------|
| Summary | First meaningful paragraph from markdown (1-2 sentences) |
| What They Do | Bullet points extracted from structured content (3-6 items) |
| Keywords | Pattern-matched from a curated tech keyword list + proper nouns (5-10) |
| Derived Signals | Rule-based inference: hiring page, blog/content, pricing page, changelog, social proof, funding mentions (2-4 signals) |
| Sources | Exact URL scraped + ISO timestamp |

**States**: Empty (CTA) → Loading (spinner) → Error (message + retry) → Cached (display with re-enrich option)

**Mock fallback**: When `FIRECRAWL_API_KEY` is not set, the API returns realistic mock enrichment data so the full UI can be demonstrated without an API key.

### 7.7 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `Escape` | Close global search / dialogs |

---

## 8. Data Model

### Company

```typescript
interface Company {
  id: string;           // URL-safe slug (e.g., "synth-ai")
  name: string;
  website: string;      // Public URL for enrichment
  description: string;
  sector: string;       // AI/ML, Developer Tools, Healthtech, etc.
  stage: string;        // Pre-Seed, Seed, Series A, Series B, Series C
  location: string;     // City
  foundedYear: number;
  teamSize: string;     // "1-10", "11-50", "51-200", "201-500"
  founders: string[];
  tags: string[];       // Freeform tags
  thesisMatch?: number; // Computed 0-100 score
  enrichment?: EnrichmentData;
}
```

### EnrichmentData

```typescript
interface EnrichmentData {
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  signals: Signal[];
  sources: EnrichmentSource[];
  enrichedAt: string;   // ISO timestamp
}
```

### Signal

```typescript
interface Signal {
  label: string;
  type: "positive" | "neutral" | "negative";
  detail?: string;
}
```

### CompanyList

```typescript
interface CompanyList {
  id: string;
  name: string;
  description?: string;
  companyIds: string[];
  createdAt: string;
  updatedAt: string;
}
```

### SavedSearch

```typescript
interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}
```

### Fund Thesis (Scoring Config)

```typescript
const FUND_THESIS = {
  name: "Early-stage AI & developer infrastructure",
  preferredSectors: ["AI/ML", "Developer Tools", "Data Infrastructure"],
  preferredStages: ["Seed", "Pre-Seed", "Series A"],
  preferredLocations: ["San Francisco", "New York", "London", "Toronto", "Berlin"],
};
```

---

## 9. API Reference

### `POST /api/enrich`

Server-side endpoint for live company enrichment. Keeps API keys safe.

**Request:**

```json
{
  "url": "https://example.com",
  "companyName": "Example Inc"
}
```

**Response (200):**

```json
{
  "summary": "Example Inc builds AI-powered developer tools...",
  "whatTheyDo": [
    "Automated code review",
    "CI/CD optimization"
  ],
  "keywords": ["AI", "developer-tools", "code-review"],
  "signals": [
    {
      "label": "Active Hiring",
      "type": "positive",
      "detail": "Careers page detected with open positions"
    }
  ],
  "sources": [
    {
      "url": "https://example.com",
      "scrapedAt": "2026-02-26T10:30:00.000Z"
    }
  ],
  "enrichedAt": "2026-02-26T10:30:01.000Z"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| 400 | Missing or invalid `url` field |
| 502 | Firecrawl scrape failed (site unreachable or invalid API key) |
| 502 | No content extracted from website |
| 500 | Unexpected server error |

**Behavior without API key**: Returns mock enrichment data with a console warning. This allows the full UI to be demonstrated without a Firecrawl account.

---

## 10. State Management

All client state uses custom React hooks backed by `localStorage`.

### Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `vc-scout-notes` | `CompanyNote[]` | All notes across all companies |
| `vc-scout-lists` | `CompanyList[]` | User-created lists |
| `vc-scout-saved-searches` | `SavedSearch[]` | Saved search + filter combos |
| `vc-scout-enrichment-cache` | `Record<string, EnrichmentData>` | Cached enrichment results per company ID |

### Hooks (from `src/lib/store.ts`)

| Hook | Operations |
|------|-----------|
| `useNotes(companyId)` | `addNote`, `deleteNote`, `updateNote` |
| `useLists()` | `createList`, `deleteList`, `renameList`, `updateListDescription`, `addCompanyToList`, `addCompaniesToList`, `removeCompanyFromList`, `duplicateList`, `getListsForCompany` |
| `useSavedSearches()` | `saveSearch`, `deleteSearch`, `renameSearch`, `duplicateSearch`, `updateSearch` |
| `useEnrichmentCache()` | `getCached`, `setCached`, `clearCached` |

All hooks are built on a generic `useLocalStorage<T>` hook that handles JSON serialization, hydration, and a `loaded` flag to prevent SSR hydration mismatches.

---

## 11. UI Components

The app uses **16 shadcn/ui components** built on Radix UI primitives:

| Component | Usage |
|-----------|-------|
| Badge | Tags, filter pills, status indicators |
| Button | 8 size variants including `icon-xs`, `icon-sm`, `icon-lg` |
| Card | Company cards, profile sections, list cards |
| Command | Global search palette (cmdk) |
| Dialog | Create list, save search, delete confirmations |
| Dropdown Menu | Export options, list actions, search actions |
| Input | Search fields, inline rename |
| Scroll Area | Scrollable content regions |
| Select | Filter dropdowns |
| Separator | Visual dividers |
| Sheet | Mobile sidebar overlay |
| Table | Companies table, list companies table |
| Tabs | Company profile tabs (Overview, Signals, Notes, Enrichment) |
| Textarea | Notes, descriptions |
| Tooltip | Icon button hints |

---

## 12. Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add FIRECRAWL_API_KEY
```

Or connect the GitHub repo to [Vercel Dashboard](https://vercel.com/new) for automatic deployments on push.

**Environment variables to set in Vercel:**

| Key | Value |
|-----|-------|
| `FIRECRAWL_API_KEY` | Your Firecrawl API key |

### Build Output

```
Route (app)
┌ ○ /                   (Static)
├ ○ /companies          (Static)
├ ƒ /companies/[id]     (Dynamic - server-rendered)
├ ○ /lists              (Static)
├ ○ /saved              (Static)
└ ƒ /api/enrich         (Dynamic - API route)
```

---

## 13. Design Decisions

### Why localStorage instead of a database?
The assignment is scoped as a frontend-heavy prototype. localStorage provides instant persistence with zero backend setup. The generic `useLocalStorage` hook makes it trivial to swap for an API layer later.

### Why server-side enrichment?
API keys must never be exposed in client bundles. The `/api/enrich` Next.js Route Handler keeps the Firecrawl key server-side while providing a clean REST interface for the frontend.

### Why mock fallback?
Not everyone reviewing the project will have a Firecrawl API key. The mock fallback ensures the full enrichment UI (loading states, data display, caching) can be evaluated without any external dependencies.

### Why Firecrawl?
Firecrawl provides AI-optimized web scraping that returns clean markdown from any URL, handles JavaScript-rendered pages, and strips boilerplate. This produces much better extraction results than raw HTTP fetches.

### Why shadcn/ui?
Copy-paste component ownership means no version-lock to a component library. Components are fully customizable, tree-shakeable, and built on accessible Radix primitives.

### Thesis-first scoring
The scoring algorithm is intentionally transparent: sector match (40pts), stage match (25pts), location match (20pts), tag relevance (15pts). Every dimension is shown to the user so they understand *why* a company scored as it did.

---

## Mock Dataset

The app ships with **25 companies** across **6 sectors**:

| Sector | Count |
|--------|-------|
| AI/ML | 5 |
| Developer Tools | 5 |
| Healthtech | 4 |
| Climatetech | 4 |
| Fintech | 4 |
| Data Infrastructure | 3 |

Companies span 5 funding stages (Pre-Seed through Series C), 8 locations, and 4 team-size bands. Each has a unique slug ID, real-looking website URL, founders, description, and 2-4 tags.

---

*Built as part of the Xartup Fellowship VC Sourcing Assignment.*
