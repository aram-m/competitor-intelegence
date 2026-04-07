import * as cheerio from "cheerio";
import type { RawCrawlItem, SourceType } from "../types";
import { normalizeSignalUrl } from "../services/signal-identity";

const GENERIC_HIRING_TITLES = new Set([
  "apply",
  "apply now",
  "apply today",
  "learn more",
  "view details",
  "view job",
  "view open positions",
  "view roles",
  "see open roles",
]);

const HIRING_TITLE_SELECTORS = [
  "[fs-cmsfilter-field='role']",
  "[data-role-title]",
  "[itemprop='title']",
  ".job-title",
  ".position-title",
  ".posting-title",
  "[class*='job-title']",
  "[class*='position-title']",
  "[class*='posting-title']",
];

const BLOG_TITLE_SELECTORS = [
  ".subheader_2",
  "[itemprop='headline']",
  ".text-size-medium.text-weight-medium",
  ".blog_article-wrapper .text-size-medium",
  ".blog_article-wrapper [class*='title']",
  "[class*='post-title']",
  "[class*='blog-title']",
  "h1",
  "h2",
  "h3",
  "h4",
];

const DATE_TEXT_SELECTORS = [
  "time[datetime]",
  "[itemprop='datePublished']",
  "[class*='date']",
  ".all-caps-grey",
];

const MONTH_DAY_YEAR_PATTERN =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/i;
const MONTH_INDEX: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function resolveUrl(sourceUrl: string, href: string): string {
  return normalizeSignalUrl(new URL(href, sourceUrl).toString());
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function readGenericTitle(title: string): boolean {
  return GENERIC_HIRING_TITLES.has(title.toLowerCase());
}

function readMeaningfulTitle(title: string): string | null {
  const cleaned = normalizeWhitespace(title);
  if (!cleaned || readGenericTitle(cleaned)) {
    return null;
  }
  return cleaned;
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function extractTitleFromHiringUrl(url: string): string {
  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  const slug = segments[segments.length - 2] === "jobs"
    ? segments[segments.length - 1]
    : segments[segments.length - 1];

  return titleCaseFromSlug(slug.replace(/[0-9.]+$/g, ""));
}

export function isConcreteHiringUrl(url: string): boolean {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, "");
  const path = parsed.pathname;

  if (host === "job-boards.greenhouse.io" || host === "boards.greenhouse.io") {
    return /\/jobs\/\d+/.test(path);
  }

  if (host === "jobs.lever.co") {
    return /^\/[^/]+\/[0-9a-f-]+$/.test(path);
  }

  if (host.endsWith(".workable.com")) {
    return /^\/jobs\/\d+/.test(path);
  }

  if (host === "jobs.ashbyhq.com") {
    return /^\/[^/]+\/job\/[^/]+/.test(path);
  }

  if (host === "comeet.com" || host === "www.comeet.com") {
    return /^\/jobs\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(path);
  }

  return false;
}

function extractHiringTitle(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<any>,
  $link: cheerio.Cheerio<any>,
): string {
  for (const selector of HIRING_TITLE_SELECTORS) {
    const preferredTitle = readMeaningfulTitle($el.find(selector).first().text());
    if (preferredTitle) {
      return preferredTitle;
    }
  }

  const heading = readMeaningfulTitle(
    $el.find("h1, h2, h3, h4, h5, [role='heading']").first().text(),
  );
  if (heading) {
    return heading;
  }

  const linkTitle = readMeaningfulTitle($link.text());
  if (linkTitle) {
    return linkTitle;
  }

  const firstLine = readMeaningfulTitle(
    $el
      .clone()
      .find("a, button, p")
      .remove()
      .end()
      .text()
      .split(/\n+/)
      .find((line) => normalizeWhitespace(line).length > 0) || "",
  );
  if (firstLine) {
    return firstLine;
  }

  const cardText = normalizeWhitespace(
    $el.clone().find("a, button").remove().end().text(),
  );
  if (cardText && !readGenericTitle(cardText)) {
    return cardText
      .replace(/\bApply\b.*$/i, "")
      .replace(/\bView Open Positions\b.*$/i, "")
      .trim();
  }

  return extractTitleFromHiringUrl($link.attr("href") || "");
}

function extractDefaultTitle(
  $el: cheerio.Cheerio<any>,
  $link: cheerio.Cheerio<any>,
): string {
  for (const selector of BLOG_TITLE_SELECTORS) {
    const preferredTitle = normalizeWhitespace($el.find(selector).first().text());
    if (preferredTitle) {
      return preferredTitle;
    }
  }

  return normalizeWhitespace(
    $link.text().trim() || $el.find("h1, h2, h3, h4").first().text().trim(),
  );
}

function parseDateText(value: string): Date | null {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return null;
  }

  const monthDayYear = trimmed.match(MONTH_DAY_YEAR_PATTERN);
  if (monthDayYear) {
    const parts = monthDayYear[0].match(
      /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})$/i,
    );
    if (parts) {
      const month = MONTH_INDEX[parts[1].toLowerCase()];
      const day = Number(parts[2]);
      const year = Number(parts[3]);
      return new Date(Date.UTC(year, month, day));
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function extractPublishedAt(
  $el: cheerio.Cheerio<any>,
): Date | null {
  for (const selector of DATE_TEXT_SELECTORS) {
    const matches = $el.find(selector);

    for (let index = 0; index < matches.length; index += 1) {
      const element = matches.eq(index);
      const text = normalizeWhitespace(element.text());
      const parsed = parseDateText(text);
      if (parsed) {
        return parsed;
      }

      const datetime = element.attr("datetime");
      const parsedDatetime = parseDateText(datetime || "");
      if (parsedDatetime) {
        return parsedDatetime;
      }
    }
  }

  const fullText = normalizeWhitespace($el.text());
  const parsedFromBody = parseDateText(fullText);
  if (parsedFromBody) {
    return parsedFromBody;
  }

  return null;
}

function extractContent(
  $el: cheerio.Cheerio<any>,
): string {
  return normalizeWhitespace(
    $el.find("p, .summary, .excerpt, .description").first().text(),
  ).slice(0, 2000);
}

export function extractWebItems({
  html,
  sourceUrl,
  selector,
  allowedUrlPattern,
  sourceType,
  lastItemUrl,
}: {
  html: string;
  sourceUrl: string;
  selector: string;
  allowedUrlPattern?: string;
  sourceType: SourceType;
  lastItemUrl?: string;
}): RawCrawlItem[] {
  const $ = cheerio.load(html);
  const items: RawCrawlItem[] = [];
  const seen = new Set<string>();
  const allowedUrlRegex = allowedUrlPattern ? new RegExp(allowedUrlPattern) : null;

  $(selector).each((_, el) => {
    const $el = $(el);
    const $link = $el.is("a") ? $el : $el.find("a[href]").first();
    const href = $link.attr("href") || "";

    if (!href || href === "#" || href.startsWith("javascript:")) return;

    const url = resolveUrl(sourceUrl, href);
    if (seen.has(url)) return;
    seen.add(url);

    if (lastItemUrl && url === lastItemUrl) return;

    if (allowedUrlRegex && !allowedUrlRegex.test(url)) {
      return;
    }

    if (sourceType === "hiring" && !isConcreteHiringUrl(url)) {
      return;
    }

    const title =
      sourceType === "hiring"
        ? extractHiringTitle($, $el, $link)
        : extractDefaultTitle($el, $link);

    if (
      !title ||
      title.length < 5 ||
      (sourceType === "hiring" && readGenericTitle(title))
    ) {
      return;
    }

    items.push({
      title,
      url,
      content: extractContent($el),
      publishedAt: extractPublishedAt($el) || new Date(),
    });
  });

  return items;
}
