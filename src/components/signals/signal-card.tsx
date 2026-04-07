import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Signal } from "@/types";
import { SIGNAL_TYPE_LABELS } from "@/types";
import { getSourceTypeLabel } from "@/lib/source-presentation";

const priorityStyles: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  medium: "border-l-yellow-500 bg-yellow-500/5",
  low: "border-l-blue-500/50",
};

const priorityBadge: Record<string, string> = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

const typeBadge: Record<string, string> = {
  product_launch: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  partnership: "bg-green-500/15 text-green-700 dark:text-green-400",
  funding: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  pricing_change: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  technical: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  marketing: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  legal: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  other: "bg-gray-500/15 text-gray-700 dark:text-gray-400",
};

const sourceBadge: Record<string, string> = {
  blog: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  github: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  hiring: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  rss: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SignalCard({ signal }: { signal: Signal }) {
  const publishedDate = signal.publishedAt?.toDate
    ? signal.publishedAt.toDate()
    : new Date();

  return (
    <Card
      className={cn(
        "border-l-4 p-4 transition-colors hover:bg-accent/50",
        priorityStyles[signal.priority],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs font-medium", priorityBadge[signal.priority])}
            >
              {signal.priority.toUpperCase()}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", typeBadge[signal.signalType] ?? typeBadge.other)}
            >
              {SIGNAL_TYPE_LABELS[signal.signalType] ?? "Other"}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", sourceBadge[signal.sourceType])}
            >
              {getSourceTypeLabel(signal.sourceType)}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {signal.competitorName}
            </span>
            <span className="text-muted-foreground text-xs">
              {timeAgo(publishedDate)}
            </span>
          </div>

          {/* Title */}
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-1 flex items-center gap-1.5"
          >
            <h3 className="text-sm font-semibold leading-tight group-hover:underline">
              {signal.title}
            </h3>
            <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" />
          </a>

          {/* Summary */}
          <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
            {signal.summary}
          </p>

          {/* Recommended action */}
          {signal.recommendedAction && (
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Recommended Action
              </span>
              <p className="mt-0.5 text-sm">{signal.recommendedAction}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
