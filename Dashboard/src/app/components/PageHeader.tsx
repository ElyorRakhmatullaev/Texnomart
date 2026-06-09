"use client";

import { PageHeader as SharedPageHeader } from "@texnomart/shared/components/page-header";

interface PageHeaderProps {
  period?: string;
  compareEnabled?: boolean;
  onRefresh?: () => void;
  onPeriodChange?: (period: string) => void;
  onCompareToggle?: (enabled: boolean) => void;
  lastUpdated?: string;
}

export function PageHeader({
  lastUpdated = "только что",
  ...props
}: PageHeaderProps) {
  return (
    <SharedPageHeader title="Дашборд" lastUpdated={lastUpdated} {...props} />
  );
}
