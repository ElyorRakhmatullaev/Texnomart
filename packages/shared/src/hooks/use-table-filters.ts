"use client";

import * as React from "react";

interface UseTableFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterValues: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function useTableFilters(
  filterKeys: string[],
  onFilterChange?: () => void
): UseTableFiltersReturn {
  const [searchQuery, setSearchQueryRaw] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >(() => Object.fromEntries(filterKeys.map((k) => [k, "all"])));

  const setSearchQuery = React.useCallback(
    (query: string) => {
      setSearchQueryRaw(query);
      onFilterChange?.();
    },
    [onFilterChange]
  );

  const setFilter = React.useCallback(
    (key: string, value: string) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
      onFilterChange?.();
    },
    [onFilterChange]
  );

  const clearFilters = React.useCallback(() => {
    setFilterValues(Object.fromEntries(filterKeys.map((k) => [k, "all"])));
    setSearchQueryRaw("");
    onFilterChange?.();
  }, [filterKeys, onFilterChange]);

  const hasActiveFilters =
    searchQuery !== "" ||
    Object.values(filterValues).some((v) => v !== "all");

  return {
    searchQuery,
    setSearchQuery,
    filterValues,
    setFilter,
    clearFilters,
    hasActiveFilters,
  };
}
