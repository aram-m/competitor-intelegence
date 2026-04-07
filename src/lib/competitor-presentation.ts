import type { Competitor } from "@/types";

export function getCompetitorLogoUrl(
  competitor: Pick<Competitor, "logoUrl" | "website">,
): string | null {
  if (competitor.logoUrl) {
    return competitor.logoUrl;
  }

  if (!competitor.website) {
    return null;
  }

  return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(
    competitor.website,
  )}`;
}

export function getCompetitorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
