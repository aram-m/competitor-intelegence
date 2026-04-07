import { generateCompanyBrief } from "../summary/company-brief";
import {
  getCompanySummaryWindowStart,
  listRecentSignalsByCompetitor,
  storeCompanySummary,
} from "./company-summary-store";

export async function refreshCompanySummaries(now = new Date()): Promise<number> {
  const windowStart = getCompanySummaryWindowStart(now);
  const groupedSignals = await listRecentSignalsByCompetitor(windowStart);

  let updatedCount = 0;

  for (const [competitorId, signals] of groupedSignals.entries()) {
    if (signals.length === 0) {
      continue;
    }

    const brief = await generateCompanyBrief(signals[0].competitorName, signals);
    await storeCompanySummary(competitorId, signals, brief, windowStart);
    updatedCount++;
  }

  return updatedCount;
}
