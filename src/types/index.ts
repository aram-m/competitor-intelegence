import type { Timestamp } from "firebase/firestore";

export type CompetitorCategory = "staking" | "vaults";

export type SourceType = "rss" | "github" | "blog" | "hiring";

export type SignalType =
  | "product_launch"
  | "partnership"
  | "funding"
  | "pricing_change"
  | "technical"
  | "marketing"
  | "legal"
  | "other";

export type Priority = "critical" | "high" | "medium" | "low";

export interface Competitor {
  id: string;
  name: string;
  slug: string;
  category: CompetitorCategory;
  logoUrl?: string;
  website: string;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Source {
  id: string;
  competitorId: string;
  competitorName: string;
  type: SourceType;
  url: string;
  config: {
    selector?: string;
    githubOrg?: string;
    feedUrl?: string;
    allowedUrlPattern?: string;
    repoFilter?: string;
  };
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Signal {
  id: string;
  competitorId: string;
  competitorName: string;
  sourceId: string;
  sourceType: SourceType;
  title: string;
  url: string;
  rawContent: string;
  publishedAt: Timestamp;
  signalType: SignalType;
  priority: Priority;
  summary: string;
  recommendedAction: string;
  isArchived: boolean;
  digestId?: string;
  createdAt: Timestamp;
}

export type CompanyBriefGeneration = "ai" | "fallback" | "deterministic";

export interface StoredCompanySummary {
  id: string;
  competitorId: string;
  competitorName: string;
  recentCount: number;
  sourceTypes: SourceType[];
  strongestPriority: Priority;
  latestSignalAt?: Timestamp;
  windowStart?: Timestamp;
  summary: string;
  whyItMatters: string;
  watchNext: string;
  generatedBy: Exclude<CompanyBriefGeneration, "deterministic">;
  updatedAt?: Timestamp;
}

export interface CrawlState {
  sourceId: string;
  lastCrawledAt: Timestamp;
  lastSuccessAt: Timestamp | null;
  etag?: string;
  lastModified?: string;
  cursor?: string;
  lastItemUrl?: string;
  errorCount: number;
  lastError?: string;
  status: "idle" | "crawling" | "error";
}

export interface Digest {
  id: string;
  channel: "telegram" | "slack";
  sentAt: Timestamp;
  signalCount: number;
  signalIds: string[];
  status: "sent" | "failed";
  error?: string;
}

// Display helpers
export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  product_launch: "Product Launch",
  partnership: "Partnership",
  funding: "Funding",
  pricing_change: "Pricing Change",
  technical: "Technical",
  marketing: "Marketing",
  legal: "Legal",
  other: "Other",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  rss: "RSS",
  github: "GitHub",
  blog: "Blog",
  hiring: "Hiring",
};
