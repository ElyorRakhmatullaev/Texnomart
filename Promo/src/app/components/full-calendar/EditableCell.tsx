"use client";

import * as React from "react";
import { formatSum } from "@texnomart/shared/utils/formatters";
import { cn } from "@texnomart/ui/utils";
import { AlertCircle, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@texnomart/ui/tooltip";

export type EditableKind = "number" | "money" | "percent" | "text";

interface EditableCellProps {
  /** Current value — number for number/money/percent, string for text. */
  value: number | string | undefined;
  kind: EditableKind;
  /** Whether the current role may edit this cell (else read-only render). */
  editable: boolean;
  /** Commit handler — receives a number (number-family) or string (text); undefined when cleared. */
  onCommit: (next: number | string | undefined) => void;
  /** Required + empty → red «не заполнено» marker. */
  required?: boolean;
  /** Tooltip explaining what a manual edit signals (e.g. остаток ✏️). */
  manualHint?: string;
  /** Show a ✏️ pencil after the value (manual-override indicator, §8.2.2). */
  manualEdited?: boolean;
  align?: "left" | "right";
}

const numberKinds: EditableKind[] = ["number", "money", "percent"];

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-") return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function formatDisplay(value: number | string | undefined, kind: EditableKind): string {
  if (value == null || value === "") return "";
  if (kind === "text") return String(value);
  const n = Number(value);
  if (kind === "money") return formatSum(n);
  if (kind === "percent") return `${n}%`;
  return n.toLocaleString("ru-RU");
}

/** Raw value shown inside the input while editing (no formatting suffixes). */
function editText(value: number | string | undefined, kind: EditableKind): string {
  if (value == null || value === "") return "";
  return kind === "text" ? String(value) : String(value);
}

const RequiredMarker = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
        <AlertCircle className="size-3" />
        не заполнено
      </span>
    </TooltipTrigger>
    <TooltipContent>
      Обязательное поле — без него нельзя отправить на согласование
    </TooltipContent>
  </Tooltip>
);

const Dash = () => <span className="text-muted-foreground">—</span>;

export function EditableCell({
  value,
  kind,
  editable,
  onCommit,
  required,
  manualHint,
  manualEdited,
  align = "left",
}: EditableCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isNumeric = numberKinds.includes(kind);
  const isEmpty = value == null || value === "";

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    if (!editable) return;
    setDraft(editText(value, kind));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (kind === "text") {
      const trimmed = draft.trim();
      const next = trimmed === "" ? undefined : trimmed;
      if (next !== value) onCommit(next);
      return;
    }
    const next = parseNumber(draft);
    if (next !== value) onCommit(next);
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        inputMode={isNumeric ? "decimal" : "text"}
        className={cn(
          "h-7 w-full rounded border border-[#FFD60A] bg-white px-1.5 text-sm outline-none ring-2 ring-[#FFD60A]/30",
          align === "right" ? "text-right tabular-nums" : "text-left"
        )}
      />
    );
  }

  const ManualPencil = () =>
    manualEdited && manualHint ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Pencil className="size-3 shrink-0 text-amber-500" />
        </TooltipTrigger>
        <TooltipContent>{manualHint}</TooltipContent>
      </Tooltip>
    ) : null;

  // Read-only render — no edit affordance (keeps the ✏️ manual marker visible).
  if (!editable) {
    if (isEmpty) return required ? <RequiredMarker /> : <Dash />;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "justify-end"
        )}
      >
        <span className={cn(isNumeric && "tabular-nums")}>
          {formatDisplay(value, kind)}
        </span>
        <ManualPencil />
      </span>
    );
  }

  // Editable, empty + required → show the required marker but still click-to-edit.
  return (
    <button
      type="button"
      onClick={startEdit}
      className={cn(
        "group/cell inline-flex min-h-7 w-full items-center gap-1 rounded px-1 text-left hover:bg-[#FFD60A]/10",
        align === "right" && "justify-end text-right"
      )}
    >
      {isEmpty ? (
        required ? (
          <RequiredMarker />
        ) : (
          <span className="text-muted-foreground/50 group-hover/cell:text-muted-foreground">
            —
          </span>
        )
      ) : (
        <span className={cn(isNumeric && "tabular-nums")}>
          {formatDisplay(value, kind)}
        </span>
      )}
      {manualEdited && manualHint ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Pencil className="size-3 shrink-0 text-amber-500" />
          </TooltipTrigger>
          <TooltipContent>{manualHint}</TooltipContent>
        </Tooltip>
      ) : (
        <Pencil className="size-3 shrink-0 text-transparent group-hover/cell:text-muted-foreground/60" />
      )}
    </button>
  );
}
