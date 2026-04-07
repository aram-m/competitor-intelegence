import TelegramBot from "node-telegram-bot-api";
import type { NotificationChannel } from "./channel";
import type { DigestPayload, Signal, Priority } from "../types";
import { getTelegramConfig } from "../config";

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
  return (
    `${emoji} <b>[${s.priority.toUpperCase()}]</b> ${escapeHtml(s.competitorName)} — ${escapeHtml(typeLabel)}\n` +
    `<a href="${s.url}">${escapeHtml(s.title)}</a>\n` +
    `${escapeHtml(s.summary)}\n` +
    `<i>Action: ${escapeHtml(s.recommendedAction)}</i>`
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

export class TelegramChannel implements NotificationChannel {
  private bot: TelegramBot;
  private chatId: string;

  constructor() {
    const { telegramBotToken, telegramChatId } = getTelegramConfig();
    this.chatId = telegramChatId;
    this.bot = new TelegramBot(telegramBotToken);
  }

  async send(payload: DigestPayload): Promise<void> {
    const { signals } = payload;
    if (signals.length === 0) return;

    const grouped = groupByPriority(signals);
    const parts: string[] = [];

    parts.push(
      `<b>📊 Competitor Intelligence Digest</b>\n` +
        `<i>${payload.generatedAt.toISOString().split("T")[0]}</i> — ${signals.length} signal(s)\n`,
    );

    for (const [priority, items] of grouped) {
      if (items.length === 0) continue;
      parts.push(
        `\n<b>— ${priority.toUpperCase()} (${items.length}) —</b>\n`,
      );
      for (const signal of items) {
        parts.push(formatSignal(signal));
      }
    }

    // Split into Telegram-safe chunks (4096 char limit)
    const fullMessage = parts.join("\n");
    const chunks = splitMessage(fullMessage, 4096);

    for (const chunk of chunks) {
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
