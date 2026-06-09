"use client";

import * as React from "react";

interface UsePaginationOptions {
  initialPageSize?: number;
  pageSizes?: readonly number[];
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  paginatedItems: T[];
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  nextPage: () => void;
  prevPage: () => void;
  pageSizes: readonly number[];
}

const DEFAULT_PAGE_SIZES = [20, 50, 100] as const;

export function usePagination<T>(
  items: T[],
  options?: UsePaginationOptions
): UsePaginationReturn<T> {
  const pageSizes = options?.pageSizes ?? DEFAULT_PAGE_SIZES;
  const [pageSize, setPageSizeRaw] = React.useState(
    options?.initialPageSize ?? pageSizes[0]
  );
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  const paginatedItems = React.useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const setPageSize = React.useCallback(
    (size: number) => {
      setPageSizeRaw(size);
      setCurrentPage(1);
    },
    []
  );

  return {
    currentPage: safePage,
    pageSize,
    totalPages,
    paginatedItems,
    rangeStart: items.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    rangeEnd: Math.min(safePage * pageSize, items.length),
    totalItems: items.length,
    setCurrentPage,
    setPageSize,
    goToFirstPage: () => setCurrentPage(1),
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    pageSizes,
  };
}
