"use client";

import * as React from "react";
import { useNavigate } from "react-router";
import { Copy, Plus, Search } from "lucide-react";
import { Input } from "@texnomart/ui/input";
import { ScrollArea } from "@texnomart/ui/scroll-area";
import { buttonVariants } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { useRole } from "../../role-context";
import {
  PROMO_TYPE_RULE_STATUS_LABEL,
  PROMO_TYPE_RULE_STATUS_TINT,
  promoTypeNamesFor,
  type PromoTypeRule,
} from "../../../lib/promo-mock-data";
import { usePromoTypes } from "./PromoTypesProvider";

interface RuleListPanelProps {
  rules: PromoTypeRule[];
  selectedId?: string;
  canEdit: boolean;
  onSelect: (id: string) => void;
}

export function RuleListPanel({
  rules,
  selectedId,
  canEdit,
  onSelect,
}: RuleListPanelProps) {
  const { currentRole } = useRole();
  const { create, copy } = usePromoTypes();
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        promoTypeNamesFor(r.promoTypeIds).some((n) =>
          n.toLowerCase().includes(q)
        )
    );
  }, [rules, query]);

  const onCreate = () => {
    const id = create(currentRole);
    navigate(`/promo-types/${id}`);
  };
  const onCopy = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    const id = copy(sourceId, currentRole);
    navigate(`/promo-types/${id}`);
  };

  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-xl border border-gray-200 bg-white">
      {/* Header: search + create */}
      <div className="space-y-2 border-b border-gray-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск правила…"
            className="pl-8"
          />
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onCreate}
            className={cn(buttonVariants({ size: "sm" }), "w-full")}
          >
            <Plus className="size-4" />
            Создать правило
          </button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Правила не найдены.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((rule) => {
              const tint = PROMO_TYPE_RULE_STATUS_TINT[rule.status];
              const types = promoTypeNamesFor(rule.promoTypeIds);
              const active = rule.id === selectedId;
              return (
                <li key={rule.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(rule.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(rule.id);
                      }
                    }}
                    className={cn(
                      "group flex w-full cursor-pointer flex-col gap-1.5 px-3 py-3 text-left transition-colors hover:bg-gray-50",
                      active && "bg-amber-50/60 hover:bg-amber-50/60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 font-medium text-gray-900">
                        {rule.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                          tint.bg,
                          tint.text
                        )}
                      >
                        {PROMO_TYPE_RULE_STATUS_LABEL[rule.status]}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {types.length > 0
                        ? types.join(", ")
                        : "Типы промо не выбраны"}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        Обязательных полей:{" "}
                        <span className="font-medium text-gray-700 tabular-nums">
                          {rule.requiredFieldIds.length}
                        </span>
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => onCopy(e, rule.id)}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-700 focus:opacity-100 group-hover:opacity-100"
                          title="Копировать правило"
                        >
                          <Copy className="size-3.5" />
                          Копировать
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
