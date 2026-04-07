import { useMemo, useState } from "react";
import { LoaderCircle, Radar } from "lucide-react";
import { Header } from "@/components/layout/header";
import { FilterBar } from "@/components/filters/filter-bar";
import { SignalList } from "@/components/signals/signal-list";
import { Button } from "@/components/ui/button";
import { useSignals } from "@/hooks/use-signals";
import { useCompetitors } from "@/hooks/use-competitors";
import { useCompanySummaries } from "@/hooks/use-company-summaries";
import { useFilters } from "@/hooks/use-filters";
import { triggerManualCrawl } from "@/lib/manual-crawl";
import { getAvailableSourceTypeOptions } from "@/lib/source-presentation";

export function Dashboard() {
  const { signals, loading: signalsLoading } = useSignals();
  const { competitors, loading: competitorsLoading } = useCompetitors();
  const { companySummaries, loading: summariesLoading } = useCompanySummaries();
  const [crawlRunning, setCrawlRunning] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const {
    filters,
    setCompanies,
    setSignalTypes,
    setSourceTypes,
    setPriorities,
    clearFilters,
    hasActiveFilters,
    applyFilters,
  } = useFilters();

  const filteredSignals = useMemo(
    () => applyFilters(signals),
    [signals, applyFilters],
  );
  const activeCompetitorCount = useMemo(
    () => new Set(filteredSignals.map((signal) => signal.competitorId)).size,
    [filteredSignals],
  );
  const sourceTypeOptions = useMemo(
    () => getAvailableSourceTypeOptions(signals),
    [signals],
  );

  const loading = signalsLoading || competitorsLoading || summariesLoading;

  async function handleRunCrawl() {
    setCrawlRunning(true);
    setCrawlError(null);
    setCrawlMessage(null);

    try {
      const result = await triggerManualCrawl();
      setCrawlMessage(
        result.signalsStored > 0
          ? `Crawl finished. Stored ${result.signalsStored} new signal${result.signalsStored === 1 ? "" : "s"}.`
          : "Crawl finished. No new signals were stored.",
      );
    } catch (error) {
      setCrawlError(
        error instanceof Error ? error.message : "Manual crawl failed.",
      );
    } finally {
      setCrawlRunning(false);
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(43,89,255,0.22),transparent_24rem),linear-gradient(180deg,rgba(14,19,30,0.98),rgba(8,11,18,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/90">
                P2P competitive watch
              </div>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                One AI brief per company. Only the last 30 days that matter.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#a9b5d3]">
                Track blog, GitHub, and hiring motion across the competitor set with
                compact company summaries and linked evidence.
              </p>
              <p className="mt-6 text-sm text-[#8b98b7]">
              {loading
                ? "Loading..."
                : `${filteredSignals.length} recent change${filteredSignals.length !== 1 ? "s" : ""} across ${activeCompetitorCount} competitor${activeCompetitorCount === 1 ? "" : "s"} in the last 30 days`}
              </p>
              {crawlMessage && (
                <p className="mt-2 text-sm text-emerald-400">{crawlMessage}</p>
              )}
              {crawlError && (
                <p className="mt-2 text-sm text-red-400">{crawlError}</p>
              )}
            </div>
            <Button
              onClick={handleRunCrawl}
              disabled={crawlRunning}
              size="lg"
              className="min-w-40 self-start"
            >
              {crawlRunning ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Radar className="h-4 w-4" />
              )}
              {crawlRunning ? "Running Crawl" : "Run Crawl"}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <FilterBar
            competitors={competitors}
            sourceTypeOptions={sourceTypeOptions}
            filters={filters}
            onCompaniesChange={setCompanies}
            onSignalTypesChange={setSignalTypes}
            onSourceTypesChange={setSourceTypes}
            onPrioritiesChange={setPriorities}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <SignalList
          competitors={competitors}
          companySummaries={companySummaries}
          signals={filteredSignals}
          loading={loading}
        />
      </main>
    </div>
  );
}
