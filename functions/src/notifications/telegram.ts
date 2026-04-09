import TelegramBot from "node-telegram-bot-api";
import type { NotificationChannel } from "./channel";
import type { AlertPayload, Priority, Signal } from "../types";
import type { TelegramConfig } from "../config";
import {
  FALLBACK_RECOMMENDED_ACTION,
  FALLBACK_SUMMARY,
} from "../classifier/llm";

const PRIORITY_EMOJI: Record<Priority, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
};

const SIGNAL_TYPE_LABEL: Record<string, string> = {
  product_launch: "Product Launch",
  partnership: "Partnership",
  funding: "Funding",
  pricing_change: "Pricing Change",
  technical: "Technical",
  marketing: "Marketing",
  legal: "Legal",
  other: "Other",
};

function formatSignal(s: Signal): string {
  const emoji = PRIORITY_EMOJI[s.priority];
  const typeLabel = SIGNAL_TYPE_LABEL[s.signalType] || s.signalType;
  const summary = s.summary === FALLBACK_SUMMARY ? "" : `\n${escapeHtml(s.summary)}`;
  const action =
    s.recommendedAction === FALLBACK_RECOMMENDED_ACTION
      ? ""
      : `\n<i>Action: ${escapeHtml(s.recommendedAction)}</i>`;
  return (
    `${emoji} <b>[${s.priority.toUpperCase()}]</b> ${escapeHtml(s.competitorName)} — ${escapeHtml(typeLabel)}\n` +
    `<a href="${s.url}">${escapeHtml(s.title)}</a>\n` +
    `${summary}${action}`
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupByPriority(signals: Signal[]): Map<Priority, Signal[]> {
  const order: Priority[] = ["critical", "high", "medium", "low"];
  const map = new Map<Priority, Signal[]>();
  for (const p of order) map.set(p, []);
  for (const s of signals) {
    map.get(s.priority)?.push(s);
  }
  return map;
}

export function buildTelegramMessages(payload: AlertPayload): string[] {
  const parts: string[] = [];

  parts.push(
    `<b>📡 Competitive Watch Alert</b>\n` +
      `<i>${payload.generatedAt.toISOString()}</i> — ${payload.signalIds.length} new signal(s)\n`,
  );

  for (const company of payload.companies) {
    parts.push(
      `\n<b>${escapeHtml(company.competitorName)}</b>\n` +
        `${escapeHtml(company.brief.summary)}\n` +
        `<i>Why it matters:</i> ${escapeHtml(company.brief.whyItMatters)}\n` +
        `<i>Watch next:</i> ${escapeHtml(company.brief.watchNext)}\n`,
    );

    const grouped = groupByPriority(company.signals.slice(0, 5));
    for (const [priority, items] of grouped) {
      if (items.length === 0) continue;
      parts.push(`\n<b>${priority.toUpperCase()} signals</b>\n`);
      for (const signal of items) {
        parts.push(formatSignal(signal));
      }
    }
  }

  return splitMessage(parts.join("\n"), 4096);
}

export class TelegramChannel implements NotificationChannel {
  readonly channel = "telegram" as const;
  private bot: TelegramBot;
  private chatId: string;

  constructor(config: TelegramConfig) {
    const { telegramBotToken, telegramChatId } = config;
    this.chatId = telegramChatId;
    this.bot = new TelegramBot(telegramBotToken);
  }

  async send(payload: AlertPayload): Promise<void> {
    for (const chunk of buildTelegramMessages(payload)) {
      await this.bot.sendMessage(this.chatId, chunk, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    }
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last newline before limit
    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx <= 0) splitIdx = maxLen;
    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx);
  }

  return chunks;
}
