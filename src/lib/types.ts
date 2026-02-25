// Core types for the VC Scout application

export interface Company {
  id: string;
  name: string;
  website: string;
  description: string;
  sector: string;
  stage: string;
  location: string;
  foundedYear: number;
  teamSize: string;
  founders: string[];
  tags: string[];
  thesisMatch?: number; // 0-100 score
  enrichment?: EnrichmentData;
}

export interface EnrichmentData {
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  signals: Signal[];
  sources: EnrichmentSource[];
  enrichedAt: string; // ISO timestamp
}

export interface Signal {
  label: string;
  type: "positive" | "neutral" | "negative";
  detail?: string;
}

export interface EnrichmentSource {
  url: string;
  scrapedAt: string; // ISO timestamp
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface SearchFilters {
  sector?: string;
  stage?: string;
  location?: string;
  teamSize?: string;
}

export interface CompanyList {
  id: string;
  name: string;
  description?: string;
  companyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyNote {
  id: string;
  companyId: string;
  content: string;
  createdAt: string;
}

// Sample thesis for scoring
export const FUND_THESIS = {
  name: "Early-stage AI & developer infrastructure",
  description:
    "We invest in Seed to Series A companies building AI infrastructure, developer tools, and vertical AI applications. Focus on North America and Europe.",
  preferredSectors: ["AI/ML", "Developer Tools", "Data Infrastructure"],
  preferredStages: ["Seed", "Pre-Seed", "Series A"],
  preferredLocations: ["San Francisco", "New York", "London", "Toronto", "Berlin"],
};
