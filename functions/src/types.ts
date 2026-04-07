import type { Timestamp } from "firebase-admin/firestore";

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

export type CompanyBriefGeneration = "ai" | "fallback";

export interface CompanySummary {
  competitorId: string;
  competitorName: string;
  recentCount: number;
  sourceTypes: SourceType[];
  strongestPriority: Priority;
  latestSignalAt: Timestamp;
  windowStart: Timestamp;
  summary: string;
  whyItMatters: string;
  watchNext: string;
  generatedBy: CompanyBriefGeneration;
  updatedAt: Timestamp;
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

export interface RawCrawlItem {
  title: string;
  url: string;
  content: string;
  publishedAt: Date;
}

export interface ClassificationResult {
  signalType: SignalType;
  priority: Priority;
  summary: string;
  recommendedAction: string;
}

export interface DigestPayload {
  signals: Signal[];
  generatedAt: Date;
}

export const SIGNAL_TYPES: SignalType[] = [
  "product_launch",
  "partnership",
  "funding",
  "pricing_change",
  "technical",
  "marketing",
  "legal",
  "other",
];

export const PRIORITIES: Priority[] = ["critical", "high", "medium", "low"];
