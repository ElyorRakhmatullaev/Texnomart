"use client";

import * as React from "react";
import { Card } from "@texnomart/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@texnomart/ui/avatar";

interface MobileListCardProps {
  onClick?: () => void;
  avatar?: {
    src?: string;
    fallback: string;
    className?: string;
  };
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  badges?: React.ReactNode;
  meta?: string;
  children?: React.ReactNode;
}

export function MobileListCard({
  onClick,
  avatar,
  title,
  subtitle,
  status,
  badges,
  meta,
  children,
}: MobileListCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {avatar && (
          <Avatar className={`h-10 w-10 shrink-0 ${avatar.className ?? ""}`}>
            {avatar.src && <AvatarImage src={avatar.src} />}
            <AvatarFallback className="text-xs bg-gray-100">
              {avatar.fallback}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{title}</div>
              {subtitle && (
                <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
              )}
            </div>
            {status && <div className="shrink-0">{status}</div>}
          </div>
          {(badges || meta) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {badges}
              {meta && <span className="text-xs text-gray-400">{meta}</span>}
            </div>
          )}
          {children}
        </div>
      </div>
    </Card>
  );
}
