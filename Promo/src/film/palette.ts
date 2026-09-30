/** Цвета фильма — точные hex через style (правило .claude/rules/design.md). */
export const FILM = {
  stage: "#0E0E10",
  text: "#FFFFFF",
  muted: "#A1A1AA",
  /** Фирменный жёлтый — только акцент: линии, кольцо курсора, полосы. */
  accent: "#FFD60A",
  card: "#FFFFFF",
  shadow: "0 40px 120px rgba(0, 0, 0, 0.55)",
} as const;

/** Цвета иллюстраций первого акта — токены дизайн-системы (styles-config.md). */
export const INK = {
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray900: "#111827",
  red: "#EF4444",
  red50: "#FEF2F2",
  amber100: "#FEF3C7",
  blue50: "#EFF6FF",
} as const;
