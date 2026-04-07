import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "./multi-select";
import type { Competitor, SignalType, Priority, SourceType } from "@/types";
import {
  SIGNAL_TYPE_LABELS,
  PRIORITY_LABELS,
} from "@/types";
import type { Filters } from "@/hooks/use-filters";

const signalTypeOptions = (Object.keys(SIGNAL_TYPE_LABELS) as SignalType[]).map(
  (key) => ({
    value: key,
    label: SIGNAL_TYPE_LABELS[key],
  }),
);

const priorityOptions = (Object.keys(PRIORITY_LABELS) as Priority[]).map(
  (key) => ({
    value: key,
    label: PRIORITY_LABELS[key],
  }),
);

export function FilterBar({
  competitors,
  sourceTypeOptions,
  filters,
  onCompaniesChange,
  onSignalTypesChange,
  onSourceTypesChange,
  onPrioritiesChange,
  onClear,
  hasActiveFilters,
}: {
  competitors: Competitor[];
  sourceTypeOptions: { value: SourceType; label: string }[];
  filters: Filters;
  onCompaniesChange: (ids: string[]) => void;
  onSignalTypesChange: (types: SignalType[]) => void;
  onSourceTypesChange: (types: SourceType[]) => void;
  onPrioritiesChange: (priorities: Priority[]) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  const companyOptions = competitors.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(16,21,33,0.92),rgba(10,14,24,0.95))] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/90">
            Control Surface
          </div>
          <p className="mt-1 text-sm text-[#cad2ea]">
            Slice the feed by company, source, signal type, or urgency.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
      <MultiSelect
        options={companyOptions}
        selected={filters.companies}
        onChange={onCompaniesChange}
        placeholder="All Companies"
      />
      <MultiSelect
        options={signalTypeOptions}
        selected={filters.signalTypes}
        onChange={(v) => onSignalTypesChange(v as SignalType[])}
        placeholder="All Types"
      />
      <MultiSelect
        options={sourceTypeOptions}
        selected={filters.sourceTypes}
        onChange={(v) => onSourceTypesChange(v as SourceType[])}
        placeholder="All Sources"
      />
      <MultiSelect
        options={priorityOptions}
        selected={filters.priorities}
        onChange={(v) => onPrioritiesChange(v as Priority[])}
        placeholder="All Priorities"
      />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-11 rounded-2xl px-4">
          <X className="mr-1 h-3.5 w-3.5" />
          Clear
        </Button>
      )}
      </div>
    </div>
  );
}
