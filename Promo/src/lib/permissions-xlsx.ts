// .xlsx export for «Матрица прав» (tracker V1-8). Reads the same single source of truth as the
// screen (ACCESS_MATRIX/ACCESS_AREAS/ACCESS_LEVEL_META + CAPABILITIES via rolesWithCapability from
// lib/permissions.ts) so the export can't drift from what's on screen. Two sheets, one workbook —
// mirrors the page's two tabs.

import * as XLSX from "xlsx";
import { PROMO_ROLES } from "../app/role-context";
import {
  ACCESS_AREAS,
  ACCESS_MATRIX,
  ACCESS_LEVEL_META,
  CAPABILITY_GROUPS,
  CAPABILITIES,
  rolesWithCapability,
} from "./permissions";
import { exportStamp } from "./promo-export";

/** «Матрица прав» → .xlsx: «Сводная матрица» (роли × области) + «Детальные права» (по capability). */
export function exportPermissionsXlsx(): void {
  const matrixHeader = ["Область", ...PROMO_ROLES];
  const matrixRows = ACCESS_AREAS.map((area) => [
    area.label,
    ...PROMO_ROLES.map(
      (role) => ACCESS_LEVEL_META[ACCESS_MATRIX[role][area.id].level].label
    ),
  ]);
  const matrixSheet = XLSX.utils.aoa_to_sheet([matrixHeader, ...matrixRows]);

  const capsHeader = ["Группа", "Право", "Описание", "Разрешённые роли", "Где проверяется"];
  const capsRows = CAPABILITY_GROUPS.flatMap((group) =>
    CAPABILITIES.filter((c) => c.group === group).map((c) => [
      c.group,
      c.label,
      c.description,
      rolesWithCapability(c).join(", ") || "—",
      c.enforcedIn,
    ])
  );
  const capsSheet = XLSX.utils.aoa_to_sheet([capsHeader, ...capsRows]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, matrixSheet, "Матрица прав");
  XLSX.utils.book_append_sheet(wb, capsSheet, "Детальные права");
  XLSX.writeFile(wb, `Матрица_прав_${exportStamp()}.xlsx`);
}
