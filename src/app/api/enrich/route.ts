import { NextRequest, NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";

// ── Types matching our frontend EnrichmentData ────────────

interface EnrichmentResult {
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  signals: { label: string; type: "positive" | "neutral" | "negative"; detail?: string }[];
  sources: { url: string; scrapedAt: string }[];
  enrichedAt: string;
}

// ── POST /api/enrich ──────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { url, companyName } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' field" },
        { status: 400 }
      );
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;

    // ── If no API key, return mock data for demo purposes ──
    if (!apiKey) {
      console.warn("[enrich] No FIRECRAWL_API_KEY — returning mock data");
      return NextResponse.json(mockEnrichment(url, companyName));
    }

    // ── Real scrape via Firecrawl ──────────────────────────
    const firecrawl = new FirecrawlApp({ apiKey });

    let markdown = "";
    let scrapedAt = new Date().toISOString();

    try {
      const doc = await firecrawl.scrape(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      });
      markdown = doc.markdown || "";
      scrapedAt = new Date().toISOString();
    } catch (scrapeError: unknown) {
      console.error("[enrich] Firecrawl scrape error:", scrapeError);
      return NextResponse.json(
        { error: "Failed to scrape the website. The site may be unreachable or the API key may be invalid." },
        { status: 502 }
      );
    }

    if (!markdown) {
      return NextResponse.json(
        { error: "No content could be extracted from the website." },
        { status: 502 }
      );
    }

    // ── Extract structured fields from the scraped content ──
    const enrichment = extractFieldsFromContent(markdown, url, companyName, scrapedAt);

    return NextResponse.json(enrichment);
  } catch (error: unknown) {
    console.error("[enrich] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Content extraction logic ──────────────────────────────

function extractFieldsFromContent(
  content: string,
  url: string,
  companyName: string,
  scrapedAt: string
): EnrichmentResult {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // --- Summary: first meaningful paragraph(s) ---
  const summary = extractSummary(lines, companyName);

  // --- What they do: bullet-worthy sentences ---
  const whatTheyDo = extractBullets(lines, companyName);

  // --- Keywords: extract from content ---
  const keywords = extractKeywords(content);

  // --- Signals: inferred from page content ---
  const signals = inferSignals(content, url);

  return {
    summary,
    whatTheyDo,
    keywords,
    signals,
    sources: [{ url, scrapedAt }],
    enrichedAt: scrapedAt,
  };
}

function extractSummary(lines: string[], companyName: string): string {
  // Look for sentences that describe the company
  const descriptionPatterns = [
    /(?:is|are)\s+(?:a|an|the)\s+/i,
    /(?:helps?|enables?|provides?|offers?|builds?|delivers?|creates?)/i,
    /(?:platform|solution|tool|service|company|startup)/i,
  ];

  const candidates = lines
    .filter((l) => l.length > 40 && l.length < 500)
    .filter((l) => !l.startsWith("#") && !l.startsWith("[") && !l.startsWith("!"))
    .filter((l) => descriptionPatterns.some((p) => p.test(l)));

  if (candidates.length > 0) {
    // Take the best 1-2 sentences
    const best = candidates.slice(0, 2).join(" ");
    return best.length > 300 ? best.slice(0, 300) + "…" : best;
  }

  // Fallback: first substantive lines
  const fallback = lines
    .filter((l) => l.length > 30 && !l.startsWith("#"))
    .slice(0, 2)
    .join(" ");

  return fallback || `${companyName} — details available on their website.`;
}

function extractBullets(lines: string[], _companyName: string): string[] {
  const bullets: string[] = [];

  // Look for existing bullet points or list items
  const listItems = lines.filter(
    (l) => /^[-*•]\s/.test(l) || /^\d+[.)]\s/.test(l)
  );
  for (const item of listItems.slice(0, 6)) {
    const clean = item.replace(/^[-*•\d.)]+\s*/, "").trim();
    if (clean.length > 15 && clean.length < 200) {
      bullets.push(clean);
    }
  }

  // If not enough, extract sentence-level info
  if (bullets.length < 3) {
    const actionVerbs =
      /(?:helps?|enables?|provides?|offers?|allows?|supports?|automates?|simplifies?|streamlines?)/i;
    const sentenceCandidates = lines
      .filter(
        (l) =>
          actionVerbs.test(l) &&
          l.length > 30 &&
          l.length < 200 &&
          !l.startsWith("#")
      )
      .filter((l) => !bullets.includes(l));

    for (const s of sentenceCandidates) {
      if (bullets.length >= 6) break;
      bullets.push(s);
    }
  }

  // Still not enough — grab heading-like content
  if (bullets.length < 3) {
    const headings = lines
      .filter((l) => l.startsWith("#") && l.length > 10 && l.length < 100)
      .map((l) => l.replace(/^#+\s*/, ""));
    for (const h of headings) {
      if (bullets.length >= 6) break;
      if (!bullets.includes(h)) bullets.push(h);
    }
  }

  return bullets.slice(0, 6);
}

function extractKeywords(content: string): string[] {
  const text = content.toLowerCase();

  // Domain-specific keyword candidates
  const techKeywords = [
    "ai", "machine learning", "deep learning", "nlp", "natural language",
    "computer vision", "blockchain", "cloud", "saas", "api", "automation",
    "data", "analytics", "iot", "cybersecurity", "devops", "kubernetes",
    "microservices", "serverless", "fintech", "healthtech", "edtech",
    "marketplace", "platform", "open-source", "real-time", "scalable",
    "enterprise", "b2b", "b2c", "developer tools", "infrastructure",
    "payments", "compliance", "sustainability", "climate", "energy",
    "genomics", "robotics", "autonomous", "augmented reality", "virtual reality",
    "llm", "generative ai", "rag", "vector database", "embedding",
  ];

  const found = techKeywords.filter((kw) => text.includes(kw));

  // Also extract capitalized multi-word terms (potential product/tech names)
  const properNouns = content.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g) || [];
  const uniqueProper = [...new Set(properNouns)]
    .filter((n) => n.length > 4 && n.length < 30)
    .slice(0, 3);

  const combined = [...new Set([...found, ...uniqueProper.map((p) => p.toLowerCase())])];
  return combined.slice(0, 10);
}

function inferSignals(content: string, url: string): EnrichmentResult["signals"] {
  const text = content.toLowerCase();
  const signals: EnrichmentResult["signals"] = [];

  // Careers / hiring
  if (/(?:careers?|jobs?|hiring|we'?re\s+hiring|open\s+positions?|join\s+(?:our|the)\s+team)/i.test(text)) {
    signals.push({
      label: "Actively Hiring",
      type: "positive",
      detail: "Career or job listings detected on the website",
    });
  }

  // Blog / content
  if (/(?:blog|articles?|insights?|news|press|updates?)/i.test(text)) {
    signals.push({
      label: "Content Publishing",
      type: "positive",
      detail: "Blog or news section found — indicates active communication",
    });
  }

  // Pricing page
  if (/(?:pricing|plans?|subscription|free\s+trial|get\s+started|sign\s+up)/i.test(text)) {
    signals.push({
      label: "Product Live",
      type: "positive",
      detail: "Pricing or sign-up flow detected — product appears to be live",
    });
  }

  // Changelog / product updates
  if (/(?:changelog|release\s+notes?|what'?s\s+new|product\s+updates?|version\s+\d)/i.test(text)) {
    signals.push({
      label: "Active Development",
      type: "positive",
      detail: "Changelog or release notes found — active product iteration",
    });
  }

  // Customers / social proof
  if (/(?:customers?|trusted\s+by|used\s+by|case\s+stud|testimonial|partner)/i.test(text)) {
    signals.push({
      label: "Social Proof",
      type: "positive",
      detail: "Customer references or case studies found",
    });
  }

  // Funding mention
  if (/(?:raised|funding|series\s+[a-c]|seed\s+round|backed\s+by|investors?)/i.test(text)) {
    signals.push({
      label: "Funding Mentioned",
      type: "neutral",
      detail: "Funding or investor information mentioned on the site",
    });
  }

  // Limited content
  if (content.length < 500) {
    signals.push({
      label: "Limited Web Presence",
      type: "negative",
      detail: "Very little content found on the website — may be early stage or stealth",
    });
  }

  return signals.slice(0, 4);
}

// ── Mock enrichment for demo/no-key mode ──────────────────

function mockEnrichment(url: string, companyName: string): EnrichmentResult {
  return {
    summary: `${companyName || "This company"} is building innovative solutions in their domain. They focus on delivering high-quality products to their target market with emphasis on technology-driven approaches.`,
    whatTheyDo: [
      "Develops core technology platform for their target market",
      "Provides end-to-end solutions with enterprise-grade reliability",
      "Leverages AI and automation to streamline key workflows",
      "Offers integrations with major third-party platforms",
      "Focuses on security and compliance across all products",
    ],
    keywords: [
      "technology",
      "platform",
      "automation",
      "enterprise",
      "integration",
      "ai",
      "analytics",
      "cloud",
    ],
    signals: [
      {
        label: "Product Live",
        type: "positive",
        detail: "Website indicates an active and available product",
      },
      {
        label: "Content Publishing",
        type: "positive",
        detail: "Blog or news section detected on their site",
      },
      {
        label: "Growth Indicators",
        type: "neutral",
        detail: "Team and product appear to be scaling",
      },
    ],
    sources: [
      {
        url,
        scrapedAt: new Date().toISOString(),
      },
    ],
    enrichedAt: new Date().toISOString(),
  };
}
