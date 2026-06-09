"use client";

import * as React from "react";
import { useParams, useNavigate, Link } from "react-router";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Monitor,
  Hash,
  Key,
} from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { Button } from "@texnomart/ui/button";
import { Card } from "@texnomart/ui/card";
import { Badge } from "@texnomart/ui/badge";
import {
  AUDIT_ENTRIES,
  ACTION_TYPE_STYLES,
} from "@/lib/audit-mock-data";

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const entry = React.useMemo(
    () => AUDIT_ENTRIES.find((e) => e.id === id),
    [id]
  );

  const relatedEntries = React.useMemo(() => {
    if (!entry) return [];
    return AUDIT_ENTRIES.filter((e) => entry.relatedEntryIds.includes(e.id));
  }, [entry]);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-500">Запись аудита не найдена</p>
        <Button variant="outline" onClick={() => navigate("/audit")}>
          Вернуться к журналу
        </Button>
      </div>
    );
  }

  const oldJson = entry.oldJson
    ? JSON.stringify(entry.oldJson, null, 2)
    : null;
  const newJson = entry.newJson
    ? JSON.stringify(entry.newJson, null, 2)
    : null;

  const oldLines = oldJson ? oldJson.split("\n") : [];
  const newLines = newJson ? newJson.split("\n") : [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        to="/audit"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к журналу
      </Link>

      {/* Hero band */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tabular-nums">
              {format(entry.timestamp, "dd MMMM yyyy, HH:mm:ss.SSS", {
                locale: ru,
              })}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  {entry.userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <span className="text-sm font-medium">{entry.userName}</span>
                <Badge variant="outline" className="text-xs">
                  {entry.userRole}
                </Badge>
              </div>
              <Badge
                className={cn(
                  "text-xs",
                  ACTION_TYPE_STYLES[entry.actionType].className
                )}
              >
                {ACTION_TYPE_STYLES[entry.actionType].label}
              </Badge>
              <button
                className="text-sm text-blue-600 hover:underline"
                onClick={() => navigate(entry.objectHref)}
              >
                {entry.objectLabel}
              </button>
            </div>
          </div>
          <Badge variant="outline" className="text-xs shrink-0 self-start">
            {entry.id}
          </Badge>
        </div>
      </Card>

      {/* Context card */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold mb-4">Контекст</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow icon={Globe} label="IP-адрес" value={`${entry.ip} (${entry.ipCity}, ${entry.ipCountry})`} />
          <InfoRow icon={Monitor} label="User-Agent" value={entry.userAgent} />
          <InfoRow icon={Hash} label="Request ID" value={entry.requestId} mono />
          <InfoRow icon={Key} label="Session ID" value={entry.sessionId} mono />
        </div>
      </Card>

      {/* Changes card — diff viewer */}
      {(entry.changes.length > 0 || oldJson || newJson) && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Изменения</h3>

          {/* Human-readable changes */}
          {entry.changes.length > 0 && (
            <div className="space-y-2 mb-6">
              {entry.changes.map((change, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="font-medium text-gray-700">
                    {change.field}:
                  </span>
                  <span className="text-red-600 line-through">
                    {change.oldValue}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-green-600">{change.newValue}</span>
                </div>
              ))}
            </div>
          )}

          {/* JSON diff — side by side (desktop) */}
          {(oldJson || newJson) && (
            <>
              <div className="hidden md:grid grid-cols-2 gap-0 border rounded-lg overflow-hidden">
                <div>
                  <div className="bg-red-50 px-4 py-2 text-xs font-medium text-red-700 border-b">
                    Было
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto bg-gray-50 min-h-[60px]">
                    {oldLines.map((line, i) => {
                      const isRemoved =
                        i < newLines.length && line !== newLines[i];
                      const isExtra = i >= newLines.length;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "px-2 -mx-2",
                            (isRemoved || isExtra) && "bg-red-100"
                          )}
                        >
                          {line}
                        </div>
                      );
                    })}
                    {oldLines.length === 0 && (
                      <span className="text-gray-400">null</span>
                    )}
                  </pre>
                </div>
                <div className="border-l">
                  <div className="bg-green-50 px-4 py-2 text-xs font-medium text-green-700 border-b">
                    Стало
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto bg-gray-50 min-h-[60px]">
                    {newLines.map((line, i) => {
                      const isAdded =
                        i < oldLines.length && line !== oldLines[i];
                      const isExtra = i >= oldLines.length;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "px-2 -mx-2",
                            (isAdded || isExtra) && "bg-green-100"
                          )}
                        >
                          {line}
                        </div>
                      );
                    })}
                    {newLines.length === 0 && (
                      <span className="text-gray-400">null</span>
                    )}
                  </pre>
                </div>
              </div>

              {/* JSON diff — unified (mobile) */}
              <div className="md:hidden border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 border-b">
                  Unified diff
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto bg-gray-50">
                  {Array.from({ length: maxLines }, (_, i) => {
                    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
                    const newLine = i < newLines.length ? newLines[i] : undefined;
                    const changed = oldLine !== newLine;

                    return (
                      <React.Fragment key={i}>
                        {changed && oldLine !== undefined && (
                          <div className="bg-red-100 px-2 -mx-2">
                            <span className="text-red-600 select-none mr-2">−</span>
                            {oldLine}
                          </div>
                        )}
                        {changed && newLine !== undefined && (
                          <div className="bg-green-100 px-2 -mx-2">
                            <span className="text-green-600 select-none mr-2">+</span>
                            {newLine}
                          </div>
                        )}
                        {!changed && oldLine !== undefined && (
                          <div className="px-2 -mx-2">
                            <span className="text-gray-300 select-none mr-2"> </span>
                            {oldLine}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </pre>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Related entries */}
      {relatedEntries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Связанные записи</h3>
          <div className="space-y-2">
            {relatedEntries.map((re) => (
              <div
                key={re.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/audit/${re.id}`)}
              >
                <Badge variant="outline" className="text-xs tabular-nums">
                  {re.id}
                </Badge>
                <span className="text-sm tabular-nums text-gray-600">
                  {format(re.timestamp, "HH:mm:ss", { locale: ru })}
                </span>
                <Badge
                  className={cn(
                    "text-xs",
                    ACTION_TYPE_STYLES[re.actionType].className
                  )}
                >
                  {ACTION_TYPE_STYLES[re.actionType].label}
                </Badge>
                <span className="text-sm text-gray-700">{re.objectLabel}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sticky bottom: open object */}
      <div className="sticky bottom-[-0.75rem] md:bottom-[-1rem] z-10 -mx-3 -mb-3 md:-mx-4 md:-mb-4 bg-white border-t border-gray-200 px-3 md:px-6 py-3">
        <div className="flex justify-end">
          <Button
            className="bg-[#FFD60A] text-black hover:bg-[#FFD60A]/90 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            onClick={() => navigate(entry.objectHref)}
          >
            Открыть объект
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── InfoRow helper ─────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={cn(
            "text-sm text-gray-900 break-all",
            mono && "font-mono"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
