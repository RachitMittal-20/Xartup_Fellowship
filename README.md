# VC Scout

**Precision AI scout for venture capital firms.** Discover, enrich, and evaluate startups aligned with your investment thesis.

> 📖 **[Full Documentation →](Documentation.md)**

---

## Quick Start

```bash
git clone https://github.com/RachitMittal-20/Xartup_Fellowship.git
cd Xartup_Fellowship
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
FIRECRAWL_API_KEY=fc-your-api-key-here
```

Get a free key at [firecrawl.dev](https://firecrawl.dev). If omitted, enrichment falls back to mock data — the rest of the app works fully without it.

### Run

```bash
npm run dev       # Development (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
```

---

## What It Does

| Page | Description |
|------|-------------|
| `/companies` | Search, filter, sort, paginate. Batch select → add to list or export CSV/JSON. Save searches. |
| `/companies/[id]` | Company profile with overview, thesis match score, signal timeline, notes, save-to-list, and live enrichment. |
| `/lists` | Create/manage lists. Rename, duplicate, export (CSV/JSON). Delete with confirmation. |
| `/saved` | Saved search+filter combos with result count preview. One-click re-run. |

**Live Enrichment**: Click "Enrich" on any company profile to scrape their public website via Firecrawl and extract summary, key capabilities, keywords, derived signals, and sources — all server-side.

**Global Search**: `Cmd+K` / `Ctrl+K` to search companies from anywhere.

---

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Firecrawl · localStorage

---

## Deploy

```bash
vercel
vercel env add FIRECRAWL_API_KEY
```

---

## Documentation

See **[Documentation.md](Documentation.md)** for:

- Architecture diagram & design decisions
- Complete feature deep dive
- Data model & TypeScript interfaces
- API reference (`POST /api/enrich`)
- State management (localStorage hooks)
- UI component inventory
- Deployment guide

---

*Built for the Xartup Fellowship VC Sourcing Assignment.*
