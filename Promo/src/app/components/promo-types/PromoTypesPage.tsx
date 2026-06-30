"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Settings2 } from "lucide-react";
import { PageHeader } from "@texnomart/shared/components/page-header";
import { buttonVariants } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { useRole } from "../../role-context";
import { getPromoTypeSettingsAccess } from "../../../lib/promo-mock-data";
import { usePromoTypes } from "./PromoTypesProvider";
import { RuleListPanel } from "./RuleListPanel";
import { RuleEditor } from "./RuleEditor";

/**
 * S7 — Настройки типов промо (spec §9). Two-pane on lg+: rule list (left) +
 * editor (right). Below lg it's a list ↔ editor stack driven by the URL: a
 * selected rule lives at /promo-types/:ruleId, so deep-links work and the
 * provider (mounted on the layout route) keeps the store alive across selection.
 */
export function PromoTypesPage() {
  const { currentRole } = useRole();
  const access = React.useMemo(
    () => getPromoTypeSettingsAccess(currentRole),
    [currentRole]
  );
  const { rules } = usePromoTypes();
  const { ruleId } = useParams<{ ruleId?: string }>();
  const navigate = useNavigate();

  const selected = rules.find((r) => r.id === ruleId);

  // A stale/unknown :ruleId (e.g. after reload reseed) falls back to the list.
  React.useEffect(() => {
    if (ruleId && !selected) navigate("/promo-types", { replace: true });
  }, [ruleId, selected, navigate]);

  const select = (id: string) => navigate(`/promo-types/${id}`);
  const backToList = () => navigate("/promo-types");

  const subtitle = `${access.note} Всего правил: ${rules.length.toLocaleString("ru-RU")}.`;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Настройки типов промо"
        subtitle={subtitle}
        showCompare={false}
        showExport={false}
      />

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        {/* Left: rule list — hidden on mobile once a rule is selected. */}
        <div className={cn("min-h-0", selected && "hidden lg:block")}>
          <RuleListPanel
            rules={rules}
            selectedId={selected?.id}
            canEdit={access.canEdit}
            onSelect={select}
          />
        </div>

        {/* Right: editor or empty-state hint. */}
        <div className={cn("min-h-0", !selected && "hidden lg:block")}>
          {selected ? (
            <>
              {/* Mobile back-to-list affordance (the list is hidden here). */}
              <button
                type="button"
                onClick={backToList}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "mb-2 lg:hidden"
                )}
              >
                <ChevronLeft className="size-4" />К списку правил
              </button>
              <RuleEditor
                key={selected.id}
                rule={selected}
                access={access}
                role={currentRole}
              />
            </>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-border bg-white dark:bg-card py-16 text-center">
              <Settings2 className="size-12 text-muted-foreground" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Выберите правило
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Выберите правило слева, чтобы посмотреть или изменить перечень
                  обязательных полей{access.canEdit ? ", либо создайте новое" : ""}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
