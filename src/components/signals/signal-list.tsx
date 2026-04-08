import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Competitor, Signal, StoredCompanySummary } from "@/types";
import {
  getCompetitorInitials,
  getCompetitorLogoUrl,
} from "@/lib/competitor-presentation";
import { groupSignalsByCompany } from "@/lib/signal-groups";
import {
  buildCompanySummary,
  type CompanySummary,
} from "@/lib/company-summaries";
import {
  resolveMobileCarouselSelection,
  resolveSwipeDeckTargetIndex,
} from "@/lib/company-carousel";
import { getSignalDisplaySummary } from "@/lib/signal-presentation";
import { getSourceTypeLabel } from "@/lib/source-presentation";
import { cn } from "@/lib/utils";

const priorityBadge: Record<string, string> = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const sourceBadge: Record<string, string> = {
  blog: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  github: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  hiring: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  rss: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
};

function timeAgo(date: Date | null): string {
  if (!date) return "unknown";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface CompanyCardData {
  competitorId: string;
  competitorName: string;
  logoUrl: string | null;
  summary: CompanySummary;
}

function CompanyIdentity({
  competitorName,
  logoUrl,
}: {
  competitorName: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white/5 text-xs font-semibold">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${competitorName} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          getCompetitorInitials(competitorName)
        )}
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-white">
          {competitorName}
        </h2>
      </div>
    </div>
  );
}

function CompanySummaryMeta({ summary }: { summary: CompanySummary }) {
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("text-[11px]", priorityBadge[summary.strongestPriority])}
        >
          {summary.strongestPriority.toUpperCase()}
        </Badge>
        {summary.sourceTypes.map((sourceType) => (
          <Badge
            key={sourceType}
            variant="outline"
            className={cn("text-[11px]", sourceBadge[sourceType])}
          >
            {getSourceTypeLabel(sourceType)}
          </Badge>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium leading-7 text-[#eef2ff]">
        {summary.brief.summary}
      </p>
      <p className="mt-3 text-xs text-[#8f9cb9]">
        {summary.recentCount} change{summary.recentCount === 1 ? "" : "s"} in the last 30 days
        {" · "}
        Latest activity {timeAgo(summary.latestSignalAt)}
      </p>
    </>
  );
}

function CompanyBriefPanel({
  summary,
  mobile = false,
}: {
  summary: CompanySummary;
  mobile?: boolean;
}) {
  return (
    <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(15,21,34,0.9),rgba(12,17,28,0.9))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "border-primary/25 bg-primary/12 text-[11px] text-primary",
            summary.brief.generatedBy !== "ai" &&
              "border-amber-400/20 bg-amber-400/10 text-amber-300",
          )}
        >
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {summary.brief.generatedBy === "ai" ? "AI Brief" : "Fallback Brief"}
        </Badge>
      </div>
      <div className={cn("mt-3 grid gap-3", !mobile && "sm:grid-cols-2")}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#88a0ff]">
            Why It Matters
          </p>
          <p className="mt-1 text-sm leading-6 text-[#e6ebff]">
            {summary.brief.whyItMatters}
          </p>
        </div>
        {!mobile && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#88a0ff]">
              Watch Next
            </p>
            <p className="mt-1 text-sm leading-6 text-[#e6ebff]">
              {summary.brief.watchNext}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileCompanyCard({ card }: { card: CompanyCardData }) {
  return (
    <article
      className="w-full rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(16,21,33,0.96),rgba(9,13,22,0.96))] px-5 py-5 shadow-[0_22px_60px_rgba(0,0,0,0.32)]"
    >
      <CompanyIdentity
        competitorName={card.competitorName}
        logoUrl={card.logoUrl}
      />
      <CompanySummaryMeta summary={card.summary} />
      <CompanyBriefPanel summary={card.summary} mobile />
    </article>
  );
}

function DesktopCompanyCard({
  card,
  isExpanded,
  onToggle,
}: {
  card: CompanyCardData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[1.9rem] border border-white/8 bg-[linear-gradient(180deg,rgba(16,21,33,0.96),rgba(9,13,22,0.96))] shadow-[0_22px_60px_rgba(0,0,0,0.32)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-5 py-5 text-left"
      >
        <div className="min-w-0 flex-1">
          <CompanyIdentity
            competitorName={card.competitorName}
            logoUrl={card.logoUrl}
          />
          <CompanySummaryMeta summary={card.summary} />
          <CompanyBriefPanel summary={card.summary} />
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-[#7f8fb4] transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      {isExpanded && (
        <div className="border-t border-white/8 px-5 py-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#7f8fb4]">
            Supporting items
          </p>
          <div className="space-y-3">
            {card.summary.featuredSignals.map((signal) => {
              const signalDate =
                signal.publishedAt?.toDate?.() ?? signal.createdAt?.toDate?.() ?? null;
              const displaySummary = getSignalDisplaySummary(signal);

              return (
                <a
                  key={signal.id}
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-[1.2rem] border border-white/8 bg-white/3 px-4 py-4 transition-colors hover:border-white/14 hover:bg-white/6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[11px]", sourceBadge[signal.sourceType])}
                    >
                      {getSourceTypeLabel(signal.sourceType)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[11px]", priorityBadge[signal.priority])}
                    >
                      {signal.priority.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      <span className="text-[#8f9cb9]">{timeAgo(signalDate)}</span>
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-5 text-white">
                    {signal.title}
                  </h3>
                  {displaySummary ? (
                    <p className="mt-1 text-sm leading-6 text-[#b7c2de]">
                      {displaySummary}
                    </p>
                  ) : null}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SignalList({
  competitors,
  companySummaries,
  signals,
  loading,
}: {
  competitors: Competitor[];
  companySummaries: StoredCompanySummary[];
  signals: Signal[];
  loading: boolean;
}) {
  const groups = groupSignalsByCompany(signals);
  const summaryByCompetitorId = useMemo(
    () =>
      new Map(companySummaries.map((summary) => [summary.competitorId, summary])),
    [companySummaries],
  );
  const companyCards = useMemo<CompanyCardData[]>(
    () =>
      groups.map((group) => {
        const summary = buildCompanySummary(
          group,
          new Date(),
          summaryByCompetitorId.get(group.competitorId),
        );
        const competitor = competitors.find(
          (item) => item.id === group.competitorId,
        );

        return {
          competitorId: group.competitorId,
          competitorName: group.competitorName,
          summary,
          logoUrl: competitor ? getCompetitorLogoUrl(competitor) : null,
        };
      }),
    [competitors, groups, summaryByCompetitorId],
  );
  const [expandedCompanies, setExpandedCompanies] = useState<string[]>([]);
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0);
  const [mobileActiveCompetitorId, setMobileActiveCompetitorId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeDragging, setIsSwipeDragging] = useState(false);
  const initializedRef = useRef(false);
  const mobileDeckRef = useRef<HTMLDivElement | null>(null);
  const swipeStartXRef = useRef(0);
  const swipeOffsetRef = useRef(0);

  useEffect(() => {
    if (initializedRef.current || companyCards.length === 0) {
      return;
    }

    initializedRef.current = true;
    setExpandedCompanies(companyCards.map((card) => card.competitorId));
  }, [companyCards]);

  useEffect(() => {
    const selection = resolveMobileCarouselSelection({
      currentCompetitorId: mobileActiveCompetitorId,
      currentIndex: mobileActiveIndex,
      competitorIds: companyCards.map((card) => card.competitorId),
    });

    setMobileActiveCompetitorId(selection.activeCompetitorId);
    setMobileActiveIndex(selection.activeIndex);
  }, [companyCards, mobileActiveCompetitorId, mobileActiveIndex]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground mb-2 text-4xl">--</div>
        <h3 className="text-lg font-semibold">No signals found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Adjust your filters or wait for the next crawl cycle.
        </p>
      </div>
    );
  }

  function toggleCompany(competitorId: string) {
    setExpandedCompanies((current) =>
      current.includes(competitorId)
        ? current.filter((id) => id !== competitorId)
        : [...current, competitorId],
    );
  }

  function handleMobilePagerSelect(index: number) {
    setSwipeOffset(0);
    swipeOffsetRef.current = 0;
    setIsSwipeDragging(false);
    setMobileActiveIndex(index);
    setMobileActiveCompetitorId(companyCards[index]?.competitorId ?? null);
  }

  function updateSwipeOffset(nextOffset: number) {
    swipeOffsetRef.current = nextOffset;
    setSwipeOffset(nextOffset);
  }

  function beginSwipe(clientX: number) {
    if (companyCards.length <= 1) {
      return;
    }

    swipeStartXRef.current = clientX;
    updateSwipeOffset(0);
    setIsSwipeDragging(true);
  }

  function moveSwipe(clientX: number) {
    if (!isSwipeDragging) {
      return;
    }

    let nextOffset = clientX - swipeStartXRef.current;
    const isAtStart = mobileActiveIndex === 0 && nextOffset > 0;
    const isAtEnd =
      mobileActiveIndex === companyCards.length - 1 && nextOffset < 0;

    if (isAtStart || isAtEnd) {
      nextOffset *= 0.35;
    }

    updateSwipeOffset(nextOffset);
  }

  function finishSwipe() {
    if (!isSwipeDragging) {
      return;
    }

    const cardWidth = mobileDeckRef.current?.offsetWidth ?? 320;
    const nextIndex = resolveSwipeDeckTargetIndex({
      activeIndex: mobileActiveIndex,
      cardCount: companyCards.length,
      cardWidth,
      deltaX: swipeOffsetRef.current,
    });

    setIsSwipeDragging(false);
    updateSwipeOffset(0);

    if (nextIndex !== mobileActiveIndex) {
      setMobileActiveIndex(nextIndex);
      setMobileActiveCompetitorId(companyCards[nextIndex]?.competitorId ?? null);
    }
  }

  const activeCard = companyCards[mobileActiveIndex] ?? null;
  const previewCard =
    swipeOffset > 0
      ? companyCards[mobileActiveIndex - 1] ?? null
      : companyCards[mobileActiveIndex + 1] ?? null;
  const deckRotation = Math.max(Math.min(swipeOffset / 26, 9), -9);
  const previewTransform =
    swipeOffset === 0
      ? "translate3d(0, 18px, 0) scale(0.96)"
      : `translate3d(${swipeOffset > 0 ? -18 : 18}px, 10px, 0) scale(0.98)`;
  const previewOpacity = previewCard ? Math.min(0.58, 0.24 + Math.abs(swipeOffset) / 220) : 0;

  return (
    <div>
      <div className="lg:hidden">
        <div
          ref={mobileDeckRef}
          className="mobile-swipe-deck relative min-h-[33rem] overflow-hidden pb-2"
        >
          {previewCard && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-3"
              style={{
                opacity: previewOpacity,
                transform: previewTransform,
              }}
            >
              <MobileCompanyCard card={previewCard} />
            </div>
          )}
          {activeCard && (
            <div
              className="relative z-10 cursor-grab select-none touch-pan-y active:cursor-grabbing"
              onMouseDown={(event) => beginSwipe(event.clientX)}
              onMouseMove={(event) => moveSwipe(event.clientX)}
              onMouseUp={() => finishSwipe()}
              onMouseLeave={() => {
                if (isSwipeDragging) {
                  finishSwipe();
                }
              }}
              onTouchStart={(event) => beginSwipe(event.touches[0]?.clientX ?? 0)}
              onTouchMove={(event) => {
                moveSwipe(event.touches[0]?.clientX ?? 0);
              }}
              onTouchEnd={() => finishSwipe()}
              onTouchCancel={() => finishSwipe()}
              style={{
                transform: `translate3d(${swipeOffset}px, 0, 0) rotate(${deckRotation}deg)`,
                transition: isSwipeDragging
                  ? "none"
                  : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <MobileCompanyCard card={activeCard} />
            </div>
          )}
        </div>
        {companyCards.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              {companyCards.map((card, index) => (
                <button
                  key={card.competitorId}
                  type="button"
                  aria-label={`Show ${card.competitorName}`}
                  onClick={() => handleMobilePagerSelect(index)}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    index === mobileActiveIndex
                      ? "w-8 bg-primary"
                      : "w-2.5 bg-white/18",
                  )}
                />
              ))}
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#7f8fb4]">
              {mobileActiveIndex + 1} / {companyCards.length}
            </p>
          </div>
        )}
      </div>

      <div className="hidden space-y-6 lg:block">
        {companyCards.map((card) => (
          <DesktopCompanyCard
            key={card.competitorId}
            card={card}
            isExpanded={expandedCompanies.includes(card.competitorId)}
            onToggle={() => toggleCompany(card.competitorId)}
          />
        ))}
      </div>
    </div>
  );
}
