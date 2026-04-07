import { useState, useCallback, useMemo } from "react";
import type { Priority, SourceType } from "@/types";
import {
  applySignalFilters,
  EMPTY_FILTERS,
  type Filters,
} from "@/lib/signal-filters";

export type { Filters } from "@/lib/signal-filters";

export function useFilters() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const setCompanies = useCallback((companies: string[]) => {
    setFilters((prev) => ({ ...prev, companies }));
  }, []);

  const setSourceTypes = useCallback((sourceTypes: SourceType[]) => {
    setFilters((prev) => ({ ...prev, sourceTypes }));
  }, []);

  const setPriorities = useCallback((priorities: Priority[]) => {
    setFilters((prev) => ({ ...prev, priorities }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.companies.length > 0 ||
      filters.sourceTypes.length > 0 ||
      filters.priorities.length > 0,
    [filters],
  );

  const applyFilters = useCallback((signals: import("@/types").Signal[]) => {
    return applySignalFilters(signals, filters);
  }, [filters]);

  return {
    filters,
    setCompanies,
    setSourceTypes,
    setPriorities,
    clearFilters,
    hasActiveFilters,
    applyFilters,
  };
}
