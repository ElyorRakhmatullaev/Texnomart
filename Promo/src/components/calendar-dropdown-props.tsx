"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@texnomart/ui/utils";
import { CalendarDropdown } from "./CalendarDropdown";

/**
 * Shared month/year dropdown navigation for every calendar popover in the app
 * (client feedback: clicking the month/year in the caption should jump
 * straight to a picker instead of paging one month at a time via the arrows).
 * `packages/ui/src/calendar.tsx` is a shadcn primitive (do-not-edit per
 * `.claude/rules/design.md`), so this is applied from each caller instead —
 * `Calendar` already spreads extra props onto `DayPicker` and merges an
 * extra `classNames` object in, so no shared-package edit is needed.
 *
 * Client feedback (30.07.2026): the native browser `<select>` list looked out
 * of place (system font/colors) next to the rest of the app's themed
 * dropdowns — `components.Dropdown: CalendarDropdown` replaces it with our
 * own `Select` everywhere this object is spread onto a `Calendar`.
 *
 * `components` is a single prop object — `Calendar` sets its own
 * `{ IconLeft, IconRight }` before spreading `{...props}` over it, and since
 * JSX props aren't merged (the later one wins outright), spreading a
 * `components` key here would silently drop those two icon overrides unless
 * they're repeated here too.
 */
const CURRENT_YEAR = new Date().getFullYear();

export const CALENDAR_DROPDOWN_PROPS = {
  captionLayout: "dropdown-buttons" as const,
  fromYear: CURRENT_YEAR - 3,
  toYear: CURRENT_YEAR + 5,
  classNames: {
    caption_dropdowns: "flex items-center justify-center gap-1.5",
    // The decorative `aria-hidden` div react-day-picker's default `Dropdown`
    // rendered next to the (now-replaced) native select doesn't exist in our
    // `CalendarDropdown`, but `classNames.caption_label` is shared with the
    // plain (non-dropdown) caption component too — kept hidden defensively
    // in case anything else ever reads it in this dropdown context.
    caption_label: "hidden",
    vhidden: "sr-only",
  },
  components: {
    IconLeft: ({ className, ...props }: React.ComponentProps<typeof ChevronLeft>) => (
      <ChevronLeft className={cn("size-4", className)} {...props} />
    ),
    IconRight: ({ className, ...props }: React.ComponentProps<typeof ChevronRight>) => (
      <ChevronRight className={cn("size-4", className)} {...props} />
    ),
    Dropdown: CalendarDropdown,
  },
};
