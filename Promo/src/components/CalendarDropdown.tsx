"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@texnomart/ui/select";

/**
 * Custom month/year picker for `Calendar`'s `dropdown-buttons` caption
 * (client feedback, 30.07.2026: the native browser `<select>` list — plain
 * system font, system colors — looks out of place next to the rest of the
 * app's themed dropdowns). react-day-picker (`Dropdown`/`MonthsDropdown`/
 * `YearsDropdown`, react-day-picker/dist/index.js) lets a `components.Dropdown`
 * override replace the native `<select>` entirely — it hands over the same
 * `<option>` elements it would have rendered natively as `children`, a
 * numeric `value` (month index or year), and an `onChange` shaped like a
 * native select's `ChangeEvent` (`e.target.value`). This adapts that contract
 * onto our own themed `Select`.
 */
export function CalendarDropdown({
  value,
  onChange,
  children,
  "aria-label": ariaLabel,
  caption,
}: {
  name?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  children?: React.ReactNode;
  "aria-label"?: string;
  caption?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const options = React.useMemo(() => {
    return React.Children.toArray(children).flatMap((child) => {
      if (!React.isValidElement(child)) return [];
      const props = child.props as { value?: string | number; children?: React.ReactNode };
      if (props.value === undefined) return [];
      return [{ value: String(props.value), label: props.children }];
    });
  }, [children]);

  return (
    <Select
      value={value !== undefined ? String(value) : undefined}
      onValueChange={(next) => {
        onChange?.({
          target: { value: next },
        } as unknown as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger size="sm" aria-label={ariaLabel} className="h-8 min-w-0 gap-1 px-2 text-sm">
        <SelectValue>{caption}</SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
