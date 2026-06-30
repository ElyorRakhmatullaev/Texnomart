"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@texnomart/ui/avatar";

interface DetailPageHeroProps {
  backHref: string;
  backLabel: string;
  avatar?: {
    src?: string;
    fallback: string;
    size?: string;
  };
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function DetailPageHero({
  backHref,
  backLabel,
  avatar,
  title,
  subtitle,
  badges,
  actions,
  children,
}: DetailPageHeroProps) {
  return (
    <div className="space-y-4">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="bg-white dark:bg-card rounded-lg border p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {avatar && (
            <Avatar className={avatar.size ?? "h-16 w-16"}>
              {avatar.src && <AvatarImage src={avatar.src} />}
              <AvatarFallback className="text-lg bg-gray-100 dark:bg-muted">
                {avatar.fallback}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            {subtitle && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</div>
            )}
            {badges && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {badges}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
