import type { StatusConfig } from "../types";

export type { StatusConfig };

export function getStatusStyle(
  config: Record<string, StatusConfig>,
  status: string
): StatusConfig {
  return (
    config[status] ?? { label: status, bg: "bg-gray-100", text: "text-gray-700" }
  );
}

export function getScoringColor(score: number): {
  dot: string;
  text: string;
  bg: string;
} {
  if (score >= 800)
    return {
      dot: "bg-green-500",
      text: "text-green-700",
      bg: "bg-green-100",
    };
  if (score >= 600)
    return {
      dot: "bg-yellow-500",
      text: "text-yellow-700",
      bg: "bg-yellow-100",
    };
  if (score >= 400)
    return {
      dot: "bg-orange-500",
      text: "text-orange-700",
      bg: "bg-orange-100",
    };
  return { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-100" };
}
