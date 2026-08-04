# «10-я часть» Волна 4 — «План акций»: циклы согласования, сроки по этапам и удаление через согласование — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать строке плана акций собственный журнал циклов согласования, чтобы в таблице были дата решения и признак «в срок / с просрочкой» по каждому этапу (R29.5), повторная отправка показывала актуальный цикл без затирания прежних (R30.1), а удаление ранее согласованной строки проходило через согласование согласовавших её ролей (R30.2).

**Architecture:** Персистентный пер-строчный журнал (`rowJournal` в `lib/plan-store.ts`) + чистый слой деривации (`lib/plan-approval.ts`), из которого **один и тот же** набор функций питает таблицу, боковую панель и CSV-экспорт. Существующие слайсы (`sendStatus`, `decisions`, `rejectionLog`) не заменяются — журнал их дополняет датами и историей. Решения по удалению гейтируются пер-строчно, вне плановой цепочки `planStatus`.

**Tech Stack:** React 18 + TypeScript, Vite 6, Tailwind v4, shadcn/ui через `@texnomart/ui`, `date-fns`-free собственные хелперы дат из `promo-mock-data`, localStorage-персистентность.

**Спека:** `docs/superpowers/specs/2026-08-04-promo-plan-approval-cycles-removal-design.md`

## Global Constraints

- **В репозитории нет тест-раннера.** Нет `tsconfig.json`, нет `typescript`/`vitest`/`jest`/`vite-plugin-checker`. `corepack pnpm --filter promo build` — это **esbuild-транспайл**, он завершается с кодом 0 при неверных типах, неисчерпаемых `Record`, импортах несуществующих экспортов и пропущенных ветках `switch`. Поэтому каждая задача заканчивается **явной типовой проверкой чтением** по перечисленным в ней пунктам — зелёная сборка доказывает только, что файл парсится и собирается.
- **pnpm вызывается через corepack:** `corepack pnpm --filter promo build` (корневые `build:promo`/`dev:promo` дёргают голый `pnpm` и падают).
- **Только Promo.** `packages/ui`, `packages/shared` и `Dashboard/` не трогать. Финальная проверка включает `corepack pnpm --filter dashboard build`.
- **Весь UI-текст по-русски.** Даты — `DD.MM.YYYY`, дата-время — `DD.MM.YYYY HH:MM`.
- **Единицы срока подписывать всегда:** дедлайны — «кал. дн.», SLA согласования — «раб. дн.» (конвенция проекта).
- **Тёмная тема обязательна:** к каждому светлому цвету добавлять `dark:`-вариант (`text-gray-900 dark:text-gray-100`, `bg-white dark:bg-card`); мягкие тинты — `bg-X-50 dark:bg-X-500/15` + `text-X-700 dark:text-X-300`.
- **Радиксовые ловушки этого экрана** (обе уже ломали именно `PlanMode`):
  1. контролируемый `Dialog`/`Sheet`, открываемый обычной кнопкой (не `DialogTrigger`), открывать **только** через `setTimeout(() => setOpen(...), 0)` — иначе DismissableLayer ловит тот же клик как outside-interaction и закрывает окно;
  2. `DropdownMenu`/`Popover`/`Tooltip` под shared `<Button asChild>` рендерятся **за экраном** — использовать нативный `<button className={cn(buttonVariants({...}))}>`.
- **Константы SLA брать из `promo-mock-data`,** не хардкодить: `PLAN_MARKETING_SUBMIT_LEAD_DAYS` (60 кал. дн.), `PLAN_DIRECTOR_SLA_WORKING_DAYS` (3 раб. дн.).
- **Обратная совместимость:** при пустом `localStorage` экран обязан выглядеть и вести себя ровно как до изменений (сид-строки читаются из `PLAN_APPROVALS`).
- **Коммиты** — по одному на задачу, сообщение на русском, префикс `feat(promo):` / `refactor(promo):`, и в конце:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  ```

## File Structure

| Файл | Ответственность |
|---|---|
| `Promo/src/lib/plan-store.ts` (M) | Персистентность: типы журнала + слайс `rowJournal` в `PersistedPlanState`, защитный разбор |
| `Promo/src/lib/plan-approval.ts` (C) | Чистый слой: чтение журнала (ячейки этапов, статус строки, запросы на удаление) и запись (циклы, решения) |
| `Promo/src/app/components/short-calendar/PlanApprovalTable.tsx` (M) | Рендер строк из `StageCellData`, статус «Удаление на согласовании», действие «История», единицы срока |
| `Promo/src/app/components/short-calendar/PlanRowHistoryDrawer.tsx` (C) | Боковая панель строки: запрос на удаление + решения, текущий цикл, история |
| `Promo/src/app/components/short-calendar/PlanRejectionDrawer.tsx` (D) | Удаляется — поглощён панелью истории |
| `Promo/src/app/components/short-calendar/PlanMode.tsx` (M) | Состояние журнала, стемпы на переходах, поток удаления, живой аудит |
| `Promo/src/lib/promo-export.ts` (M) | `buildPlanCsv` из журнала + колонка «Цикл согласования» |

Порядок задач подобран так, чтобы **после каждой задачи сборка была зелёной, а экран — рабочим**: таблица и панель сначала получают опциональные пропсы (без журнала работают по-старому), и только потом `PlanMode` их заполняет.

---

### Task 1: Слайс журнала в plan-store

**Files:**
- Modify: `Promo/src/lib/plan-store.ts`

**Interfaces:**
- Consumes: ничего (первая задача).
- Produces: экспортируемые типы `PlanReviewerStage = "kd" | "od"`, `PlanStageDecisionKind = "approved" | "rejected"`, `PlanStageDecision`, `PlanApprovalCycle`, `PlanRemovalRequest`, `PlanRowJournal`; поле `PersistedPlanState.rowJournal: Record<string, PlanRowJournal>`.

- [ ] **Шаг 1: Экспортировать стадию и вид решения как именованные типы**

В `plan-store.ts` заменить два приватных алиаса (сейчас строки 15–20) на экспортируемые, сохранив приватные имена как алиасы — так существующий код в файле не меняется, а новые модули получают публичные имена без коллизии с `RowDecision` из `PlanApprovalTable`:

```ts
/** The two interactive reviewer stages (mirrors PlanMode's `ReviewerStage`). */
export type PlanReviewerStage = "kd" | "od";
type ReviewerStage = PlanReviewerStage;
/** Reviewer decision on a row (mirrors `PlanApprovalTable`'s `RowDecision`). */
export type PlanStageDecisionKind = "approved" | "rejected";
type RowDecision = PlanStageDecisionKind;
/** Per-row send lifecycle (mirrors `PlanApprovalTable`'s `PlanRowSend`). */
type PlanRowSend = "draft" | "sent";
```

- [ ] **Шаг 2: Добавить типы журнала**

Вставить сразу после интерфейса `PlanRejectionEvent`:

```ts
/**
 * «10-я часть» Волна 4 — решение одного согласующего этапа внутри цикла.
 * `comment` — единое поле «Комментарий» (без отдельной «Причины», §9.2 «7-й части»).
 */
export interface PlanStageDecision {
  decision: PlanStageDecisionKind;
  /** ISO date-time момента решения. */
  at: string;
  /** ФИО вошедшего пользователя (fallback — метка роли). */
  by: string;
  /** Роль согласующего. */
  role: string;
  comment?: string;
}

/**
 * Один цикл согласования строки плана: отправка → решение КД → решение ОД.
 * Правка отправленной строки и «Вернуть на доработку» ЗАКРЫВАЮТ цикл
 * (`closedAt`/`closedReason`), повторная отправка открывает следующий (R30.1) —
 * прежние даты и решения при этом не затираются.
 */
export interface PlanApprovalCycle {
  /** 1-based номер цикла. */
  no: number;
  /** ISO — дата (повторной) отправки на согласование. */
  sentAt: string;
  sentBy: string;
  kd?: PlanStageDecision;
  od?: PlanStageDecision;
  closedAt?: string;
  closedReason?: "return" | "edit";
}

/**
 * Запрос на удаление ранее согласованной строки (R30.2). `requiredStages` —
 * СНИМОК согласовавших строку этапов на момент запроса: если позже цикл
 * изменится, требования к удалению остаются прежними.
 */
export interface PlanRemovalRequest {
  requestedAt: string;
  requestedBy: string;
  reason: string;
  requiredStages: PlanReviewerStage[];
  kd?: PlanStageDecision;
  od?: PlanStageDecision;
}

/** Журнал одной строки плана: циклы согласования + запрос на удаление. */
export interface PlanRowJournal {
  /** От старых к новым; последний — текущий. */
  cycles: PlanApprovalCycle[];
  /** Активный запрос на удаление (максимум один). */
  removal?: PlanRemovalRequest;
  /** Завершённые (отклонённые или применённые) запросы, новые сверху. */
  removalHistory?: PlanRemovalRequest[];
}
```

- [ ] **Шаг 3: Добавить слайс в `PersistedPlanState`**

В интерфейсе `PersistedPlanState` пометить `rejectionLog` как legacy и добавить `rowJournal`:

```ts
  /**
   * LEGACY (до Волны 4). Новые отклонения пишутся в `rowJournal`; этот слайс
   * остаётся ТОЛЬКО НА ЧТЕНИЕ, чтобы снапшоты прошлых сессий по-прежнему
   * показывали историю. Двойной записи нет осознанно — это шов, на котором
   * в E-4 разъехались `.role`/`.roles`.
   */
  rejectionLog: Record<string, PlanRejectionEvent[]>;
  /**
   * «10-я часть» Волна 4 — пер-строчный журнал циклов согласования и запросов
   * на удаление. Отсутствует в старых снапшотах → `{}` (поведение как раньше).
   */
  rowJournal: Record<string, PlanRowJournal>;
```

- [ ] **Шаг 4: Защитный разбор в `getPlanState`**

Добавить последним полем возвращаемого объекта (после `rejectionLog`):

```ts
      // Absent in pre-Волна-4 snapshots → default {} (backward-compatible).
      rowJournal: isRecord(parsed.rowJournal)
        ? (parsed.rowJournal as Record<string, PlanRowJournal>)
        : {},
```

- [ ] **Шаг 5: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

> ⚠️ Сборка сейчас **пройдёт даже если `persistPlanState` вызывается без нового поля** — `PlanMode` передаёт объектный литерал без `rowJournal`, а esbuild этого не увидит. Это ожидаемо: поле заполнит Task 6. Если хочется убрать временную несогласованность немедленно — этого делать НЕ нужно, Task 6 её закрывает.

- [ ] **Шаг 6: Типовая проверка чтением**

Убедиться глазами:
- `PlanReviewerStage` и `PlanStageDecisionKind` экспортированы, а приватные `ReviewerStage`/`RowDecision` объявлены как их алиасы (не как самостоятельные строковые юнионы — иначе появятся два несвязанных типа);
- `PlanRemovalRequest.requiredStages` имеет тип `PlanReviewerStage[]`;
- `PlanRowJournal.cycles` — обязательное поле (не `?`), потому что все читатели рассчитывают на массив;
- новое поле `rowJournal` присутствует и в интерфейсе `PersistedPlanState`, и в возвращаемом объекте `getPlanState`.

- [ ] **Шаг 7: Коммит**

```bash
git add Promo/src/lib/plan-store.ts
git commit -F - <<'EOF'
feat(promo): Волна 4 (T1) — слайс журнала циклов согласования в plan-store

Типы PlanStageDecision/PlanApprovalCycle/PlanRemovalRequest/PlanRowJournal
+ поле rowJournal в PersistedPlanState с защитным разбором (отсутствует в
старых снапшотах → {}). rejectionLog помечен legacy-read-only.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 2: Чтение журнала — `lib/plan-approval.ts`

**Files:**
- Create: `Promo/src/lib/plan-approval.ts`

**Interfaces:**
- Consumes: типы из Task 1 (`PlanRowJournal`, `PlanApprovalCycle`, `PlanRemovalRequest`, `PlanReviewerStage`, `PlanStageDecisionKind`); из `promo-mock-data` — `PLAN_MARKETING_SUBMIT_LEAD_DAYS`, `PLAN_DIRECTOR_SLA_WORKING_DAYS`, `addCalendarDays`, `addWorkingDays`, `getOverdueDays`, `workingDaysBetween`, `getPlanApproval`, тип `PlanStageStatus`.
- Produces: `PlanRowRef`, `StageCellData`, `PlanRowLifecycle`, `JournalRejection`, `STAGE_LABEL`, функции `currentCycle`, `openCycle`, `marketingStageCell`, `directorStageCell`, `planRowLifecycle`, `approvedStages`, `removalNeedsApproval`, `pendingRemovalStageFor`, `removalFullyApproved`, `removalRejected`, `latestJournalRejection`.

- [ ] **Шаг 1: Создать файл с шапкой и импортами**

```ts
// «10-я часть» Волна 4 (R29.5 / R30.1 / R30.2) — чистый слой над журналом строки плана.
//
// ЕДИНСТВЕННАЯ деривация состояния строки: таблица, боковая панель и CSV-экспорт
// читают состояние только отсюда, поэтому разъехаться они не могут (урок E-3:
// вкладки согласуются только по конструкции). Сид `PLAN_APPROVALS` — это fallback
// ВНУТРИ этих функций, а не отдельная ветка у каждого потребителя.
//
// Единицы: маркетинговый дедлайн отправки — КАЛЕНДАРНЫЕ дни (за 60 дн. до старта),
// SLA согласования КД/ОД — РАБОЧИЕ дни (3 раб. дн. на этап).

import {
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  addCalendarDays,
  addWorkingDays,
  getOverdueDays,
  getPlanApproval,
  workingDaysBetween,
  type PlanStageStatus,
} from "./promo-mock-data";
import type {
  PlanApprovalCycle,
  PlanRemovalRequest,
  PlanReviewerStage,
  PlanRowJournal,
  PlanStageDecisionKind,
} from "./plan-store";

/** Минимум, который дериваторам нужно знать о строке плана. */
export interface PlanRowRef {
  id: string;
  startDate: Date;
}

/** Пустой журнал — для строк, по которым живых событий ещё не было. */
export const EMPTY_JOURNAL: PlanRowJournal = { cycles: [] };

export const STAGE_LABEL: Record<PlanReviewerStage, string> = {
  kd: "Коммерческий директор",
  od: "Операционный директор",
};
```

- [ ] **Шаг 2: Доступ к циклам**

```ts
/** Последний цикл строки — даже закрытый. undefined — живых циклов не было. */
export function currentCycle(j?: PlanRowJournal): PlanApprovalCycle | undefined {
  const cycles = j?.cycles;
  if (!cycles || cycles.length === 0) return undefined;
  return cycles[cycles.length - 1];
}

/** Последний цикл, если он ещё не закрыт возвратом/правкой. */
export function openCycle(j?: PlanRowJournal): PlanApprovalCycle | undefined {
  const c = currentCycle(j);
  return c && !c.closedAt ? c : undefined;
}
```

- [ ] **Шаг 3: Тип ячейки этапа**

```ts
/**
 * Всё, что нужно ячейке этапа в таблице/экспорте. `unit` определяет подпись
 * просрочки — «кал. дн.» у маркетинга, «раб. дн.» у директоров.
 */
export interface StageCellData {
  /** «Озн.» — только из сида, живого источника у ознакомления нет. */
  reviewedAt?: Date;
  /** «Отпр.» — из текущего цикла, иначе из сида. */
  sentAt?: Date;
  decidedAt?: Date;
  decision?: PlanStageDecisionKind;
  status: PlanStageStatus;
  overdueDays?: number;
  unit: "cal" | "work";
  by?: string;
  /** Проставляется только при no > 1 — метка «Цикл N». */
  cycleNo?: number;
}
```

- [ ] **Шаг 4: Ячейка этапа «Директор маркетинга»**

```ts
/**
 * Дедлайн отправки плана — за `PLAN_MARKETING_SUBMIT_LEAD_DAYS` КАЛЕНДАРНЫХ
 * дней до старта акции. При живом цикле статус пересчитывается от фактической
 * даты отправки; без цикла отдаётся сид как есть.
 */
export function marketingStageCell(
  row: PlanRowRef,
  j?: PlanRowJournal
): StageCellData | undefined {
  const seed = getPlanApproval(row.id);
  const cyc = currentCycle(j);

  if (!cyc) {
    if (!seed) return undefined; // ни сида, ни живого цикла → «—»
    return {
      reviewedAt: seed.marketing.reviewedAt,
      sentAt: seed.marketing.sentAt,
      status: seed.marketing.status,
      overdueDays: seed.marketing.overdueDays,
      unit: "cal",
    };
  }

  const sentAt = new Date(cyc.sentAt);
  const deadline = addCalendarDays(row.startDate, -PLAN_MARKETING_SUBMIT_LEAD_DAYS);
  const over = getOverdueDays(deadline, sentAt);
  return {
    reviewedAt: seed?.marketing.reviewedAt,
    sentAt,
    status: over > 0 ? "overdue" : "onTime",
    overdueDays: over > 0 ? over : undefined,
    unit: "cal",
    by: cyc.sentBy,
    cycleNo: cyc.no > 1 ? cyc.no : undefined,
  };
}
```

- [ ] **Шаг 5: Ячейка этапа КД / ОД**

```ts
/**
 * Старт этапа: КД считает от отправки цикла, ОД — от СОГЛАСОВАНИЯ КД
 * (пока КД не согласовал, этап ОД не начат). Дедлайн — `+3 раб. дн.`
 *
 * Пять исходов: решение в срок · решение с просрочкой · ожидание в срок ·
 * ожидание с просрочкой (утверждено клиентом: раздел про контроль сроков,
 * молчащая просрочка — пробел; ничего не блокирует) · этап не начат.
 */
export function directorStageCell(
  stage: PlanReviewerStage,
  row: PlanRowRef,
  j?: PlanRowJournal,
  ref: Date = new Date()
): StageCellData | undefined {
  const seed = getPlanApproval(row.id);
  const seedStage = stage === "kd" ? seed?.kd : seed?.od;
  const cyc = currentCycle(j);

  if (!cyc) {
    if (!seedStage) return undefined;
    return {
      decidedAt: seedStage.decidedAt,
      status: seedStage.status,
      overdueDays: seedStage.overdueDays,
      unit: "work",
    };
  }

  const cycleNo = cyc.no > 1 ? cyc.no : undefined;
  const decision = stage === "kd" ? cyc.kd : cyc.od;

  const start =
    stage === "kd"
      ? new Date(cyc.sentAt)
      : cyc.kd?.decision === "approved"
        ? new Date(cyc.kd.at)
        : undefined;

  // Этап не начат — ждём предыдущий, просрочки быть не может.
  if (!start) return { status: "waiting", unit: "work", cycleNo };

  const deadline = addWorkingDays(start, PLAN_DIRECTOR_SLA_WORKING_DAYS);

  if (decision) {
    const at = new Date(decision.at);
    const over = at > deadline ? workingDaysBetween(deadline, at) : 0;
    return {
      decidedAt: at,
      decision: decision.decision,
      status: over > 0 ? "overdue" : "onTime",
      overdueDays: over > 0 ? over : undefined,
      unit: "work",
      by: decision.by,
      cycleNo,
    };
  }

  // Цикл закрыт возвратом/правкой — строка вернулась владельцу, никто не ждёт.
  if (cyc.closedAt) return { status: "waiting", unit: "work", cycleNo };

  const over = ref > deadline ? workingDaysBetween(deadline, ref) : 0;
  return {
    status: "waiting",
    overdueDays: over > 0 ? over : undefined,
    unit: "work",
    cycleNo,
  };
}
```

- [ ] **Шаг 6: Статус строки**

```ts
export type PlanRowLifecycle =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "removal-pending";

/**
 * Журнал добавляет ровно одно новое состояние — «Удаление на согласовании»;
 * остальные по-прежнему выводятся из существующих `sendStatus`/`decisions`,
 * поэтому сид-строки и снапшоты прошлых сессий выглядят как раньше.
 */
export function planRowLifecycle(args: {
  journal?: PlanRowJournal;
  send: "draft" | "sent";
  decision?: PlanStageDecisionKind;
}): PlanRowLifecycle {
  if (args.journal?.removal) return "removal-pending";
  if (args.send === "draft") return "draft";
  if (args.decision === "rejected") return "rejected";
  if (args.decision === "approved") return "approved";
  return "sent";
}
```

- [ ] **Шаг 7: Хелперы удаления**

```ts
/**
 * Этапы, согласовавшие строку в ПОСЛЕДНЕМ цикле. Закрытый цикл (возврат/правка)
 * не даёт ни одного — правка уже вывела строку из согласованного плана.
 *
 * Сид-строка без живого журнала: у `PlanStageDirector` нет вида решения, только
 * статус, поэтому этап с датой решения и статусом ≠ «waiting» считается
 * согласованным (все сиды — согласования).
 */
export function approvedStages(
  rowId: string,
  j?: PlanRowJournal
): PlanReviewerStage[] {
  const cyc = currentCycle(j);
  if (cyc) {
    if (cyc.closedAt) return [];
    const out: PlanReviewerStage[] = [];
    if (cyc.kd?.decision === "approved") out.push("kd");
    if (cyc.od?.decision === "approved") out.push("od");
    return out;
  }
  const seed = getPlanApproval(rowId);
  const out: PlanReviewerStage[] = [];
  if (seed?.kd.decidedAt && seed.kd.status !== "waiting") out.push("kd");
  if (seed?.od.decidedAt && seed.od.status !== "waiting") out.push("od");
  return out;
}

/** true — удалять строку можно только через согласование (R30.2). */
export function removalNeedsApproval(rowId: string, j?: PlanRowJournal): boolean {
  return approvedStages(rowId, j).length > 0;
}

const STAGE_BY_ROLE: Record<string, PlanReviewerStage> = {
  "Коммерческий директор": "kd",
  "Операционный директор": "od",
};

/**
 * Этап, на котором ТЕКУЩАЯ роль может решить судьбу запроса на удаление,
 * либо undefined. Гейт пер-строчный и НЕ зависит от `planStatus`: при
 * «Утверждён» `actorForPlanStatus` возвращает undefined, и очередь, выведенная
 * из агрегатного статуса, новую работу просто не увидит (урок Волны 3).
 */
export function pendingRemovalStageFor(
  role: string,
  j?: PlanRowJournal
): PlanReviewerStage | undefined {
  const req = j?.removal;
  if (!req) return undefined;
  const stage = STAGE_BY_ROLE[role];
  if (!stage || !req.requiredStages.includes(stage)) return undefined;
  return req[stage] ? undefined : stage;
}

/** Все требуемые этапы согласовали удаление → строку можно применять. */
export function removalFullyApproved(req: PlanRemovalRequest): boolean {
  return req.requiredStages.every((s) => req[s]?.decision === "approved");
}

/** Хотя бы один требуемый этап отклонил удаление → строка остаётся в плане. */
export function removalRejected(req: PlanRemovalRequest): boolean {
  return req.requiredStages.some((s) => req[s]?.decision === "rejected");
}
```

- [ ] **Шаг 8: Последнее отклонение из журнала (для панели и экспорта)**

```ts
export interface JournalRejection {
  stage: PlanReviewerStage;
  cycleNo: number;
  by: string;
  role: string;
  at: string;
  comment?: string;
}

/**
 * Самое свежее отклонение по журналу: циклы просматриваются от новых к старым,
 * внутри цикла ОД считается более поздним этапом, чем КД.
 */
export function latestJournalRejection(
  j?: PlanRowJournal
): JournalRejection | undefined {
  const cycles = j?.cycles ?? [];
  for (let i = cycles.length - 1; i >= 0; i--) {
    const c = cycles[i];
    const ordered: PlanReviewerStage[] = ["od", "kd"];
    for (const stage of ordered) {
      const d = c[stage];
      if (d?.decision === "rejected") {
        return {
          stage,
          cycleNo: c.no,
          by: d.by,
          role: d.role,
          at: d.at,
          comment: d.comment,
        };
      }
    }
  }
  return undefined;
}
```

- [ ] **Шаг 9: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 10: Типовая проверка чтением**

Проверить глазами (сборка этого не ловит):
- каждое имя в блоке `import { … } from "./promo-mock-data"` действительно экспортировано этим файлом — сверить `addCalendarDays`, `addWorkingDays`, `getOverdueDays`, `workingDaysBetween`, `getPlanApproval`, `PLAN_MARKETING_SUBMIT_LEAD_DAYS`, `PLAN_DIRECTOR_SLA_WORKING_DAYS`, `PlanStageStatus`;
- нигде не сравнивается ISO-строка с `Date`: в `directorStageCell` сравнение идёт как `at > deadline`, где `at = new Date(decision.at)` — **не** `decision.at > deadline`;
- `STAGE_LABEL` исчерпывает `PlanReviewerStage` (обе стадии `kd`/`od` присутствуют);
- `marketingStageCell` и `directorStageCell` возвращают `undefined` только там, где потребитель нарисует «—», а не бросают при отсутствии сида;
- в `approvedStages` ветка сида читает `seed.kd`/`seed.od` (это `PlanStageDirector` с полями `decidedAt`/`status`), а не несуществующее поле решения.

- [ ] **Шаг 11: Коммит**

```bash
git add Promo/src/lib/plan-approval.ts
git commit -F - <<'EOF'
feat(promo): Волна 4 (T2) — чтение журнала плана (ячейки этапов, статус, удаление)

Новый чистый модуль lib/plan-approval.ts: currentCycle/openCycle,
marketingStageCell/directorStageCell (сроки по этапам с единицами кал./раб.
дней, включая просрочку ожидающих решений), planRowLifecycle, хелперы
запроса на удаление и latestJournalRejection. Сид PLAN_APPROVALS — fallback
внутри деривации, поэтому у таблицы, панели и экспорта один источник.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 3: Запись в журнал — writers в `lib/plan-approval.ts`

**Files:**
- Modify: `Promo/src/lib/plan-approval.ts`

**Interfaces:**
- Consumes: всё из Task 2 + тип `PlanStageDecision` из `plan-store`.
- Produces: `withSend(j, at, by)`, `ensureOpenCycle(j, rowId, fallbackSentAt, sentBy)`, `withDecision(j, rowId, stage, decision, meta)`, `withCycleClosed(j, reason, at)`, `withRemovalRequest(j, req)`, `withRemovalDecision(j, stage, decision, meta)`, `withRemovalArchived(j)`. Все чистые: принимают `PlanRowJournal | undefined`, возвращают **новый** `PlanRowJournal`.

- [ ] **Шаг 1: Добавить `PlanStageDecision` в импорт типов**

В существующем `import type { … } from "./plan-store";` добавить `PlanStageDecision` (алфавитно — между `PlanRowJournal` и `PlanStageDecisionKind`).

- [ ] **Шаг 2: Клонирование**

Добавить в конец файла:

```ts
// ── Запись в журнал ───────────────────────────────────────────────────────────
// Все функции ниже чистые: возвращают НОВЫЙ объект, чтобы React-мемо и
// write-through-эффект персистентности срабатывали по ссылке.

function cloneJournal(j?: PlanRowJournal): PlanRowJournal {
  return {
    cycles: [...(j?.cycles ?? [])],
    removal: j?.removal,
    removalHistory: j?.removalHistory ? [...j.removalHistory] : undefined,
  };
}
```

- [ ] **Шаг 3: Открытие цикла**

```ts
/**
 * Отправка строки на согласование открывает НОВЫЙ цикл. Если предыдущий цикл
 * ещё открыт, повтор игнорируется — «Отправлено» уже блокирует повторную
 * отправку в UI («6-я часть» №7), это защита на уровне модели.
 */
export function withSend(
  j: PlanRowJournal | undefined,
  at: Date,
  by: string
): PlanRowJournal {
  const next = cloneJournal(j);
  const last = next.cycles[next.cycles.length - 1];
  if (last && !last.closedAt) return next;
  next.cycles.push({
    no: (last?.no ?? 0) + 1,
    sentAt: at.toISOString(),
    sentBy: by,
  });
  return next;
}

/**
 * Гарантирует наличие открытого цикла перед записью решения. Сид-строка,
 * отправленная до появления журнала, материализуется как цикл №1 с датой
 * отправки из `PLAN_APPROVALS` — так SLA КД считается от реальной отправки,
 * а не от момента клика проверяющего.
 */
export function ensureOpenCycle(
  j: PlanRowJournal | undefined,
  rowId: string,
  fallbackSentAt: Date,
  sentBy: string
): PlanRowJournal {
  if (openCycle(j)) return j as PlanRowJournal;
  const seed = getPlanApproval(rowId);
  return withSend(
    j,
    seed?.marketing.sentAt ?? fallbackSentAt,
    seed ? "Директор маркетинга" : sentBy
  );
}
```

- [ ] **Шаг 4: Решение этапа и закрытие цикла**

```ts
/** Решение КД/ОД в текущем цикле (цикл при необходимости материализуется). */
export function withDecision(
  j: PlanRowJournal | undefined,
  rowId: string,
  stage: PlanReviewerStage,
  decision: PlanStageDecisionKind,
  meta: { at: Date; by: string; role: string; comment?: string }
): PlanRowJournal {
  const base = ensureOpenCycle(j, rowId, meta.at, meta.by);
  const next = cloneJournal(base);
  const idx = next.cycles.length - 1;
  const cyc = next.cycles[idx];
  if (!cyc) return next;
  const entry: PlanStageDecision = {
    decision,
    at: meta.at.toISOString(),
    by: meta.by,
    role: meta.role,
    comment: meta.comment,
  };
  // Ветвление вместо вычисляемого ключа: computed key расширил бы тип, а
  // транспайл-онли билд такого не поймает.
  next.cycles[idx] = stage === "kd" ? { ...cyc, kd: entry } : { ...cyc, od: entry };
  return next;
}

/**
 * Закрывает текущий цикл без результата: «Вернуть на доработку» (`return`)
 * или правка отправленной строки (`edit`). Данные цикла остаются — именно они
 * попадают в историю (R30.1).
 */
export function withCycleClosed(
  j: PlanRowJournal | undefined,
  reason: "return" | "edit",
  at: Date
): PlanRowJournal {
  const next = cloneJournal(j);
  const idx = next.cycles.length - 1;
  const cyc = next.cycles[idx];
  if (!cyc || cyc.closedAt) return next;
  next.cycles[idx] = { ...cyc, closedAt: at.toISOString(), closedReason: reason };
  return next;
}
```

- [ ] **Шаг 5: Запрос на удаление**

```ts
export function withRemovalRequest(
  j: PlanRowJournal | undefined,
  req: PlanRemovalRequest
): PlanRowJournal {
  const next = cloneJournal(j);
  next.removal = req;
  return next;
}

export function withRemovalDecision(
  j: PlanRowJournal | undefined,
  stage: PlanReviewerStage,
  decision: PlanStageDecisionKind,
  meta: { at: Date; by: string; role: string; comment?: string }
): PlanRowJournal {
  const next = cloneJournal(j);
  const req = next.removal;
  if (!req) return next;
  const entry: PlanStageDecision = {
    decision,
    at: meta.at.toISOString(),
    by: meta.by,
    role: meta.role,
    comment: meta.comment,
  };
  next.removal = stage === "kd" ? { ...req, kd: entry } : { ...req, od: entry };
  return next;
}

/**
 * Переносит завершённый запрос в историю — после отклонения (строка остаётся
 * в плане) или после применения удаления (строка уходит в tombstone-набор,
 * но её история сохраняется).
 */
export function withRemovalArchived(
  j: PlanRowJournal | undefined
): PlanRowJournal {
  const next = cloneJournal(j);
  if (!next.removal) return next;
  next.removalHistory = [next.removal, ...(next.removalHistory ?? [])];
  next.removal = undefined;
  return next;
}
```

- [ ] **Шаг 6: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 7: Типовая проверка чтением**

- ни одна из семи функций не мутирует входной журнал: все идут через `cloneJournal`, а элементы `cycles` заменяются созданием нового объекта (`{ ...cyc, kd: entry }`), а не присваиванием в поле;
- `withDecision` и `withRemovalDecision` используют **ветвление** `stage === "kd" ? … : …`, а не вычисляемый ключ `[stage]:`;
- `ensureOpenCycle` не может уйти в рекурсию: `openCycle` проверен до вызова `withSend`, а `withSend` при закрытом/отсутствующем последнем цикле всегда добавляет новый;
- `PlanStageDecision` присутствует в `import type` из `plan-store`.

- [ ] **Шаг 8: Коммит**

```bash
git add Promo/src/lib/plan-approval.ts
git commit -F - <<'EOF'
feat(promo): Волна 4 (T3) — запись в журнал плана (циклы, решения, удаление)

Чистые writers: withSend/ensureOpenCycle (сид-строка материализуется как
цикл №1 с датой отправки из PLAN_APPROVALS), withDecision, withCycleClosed
(возврат/правка), withRemovalRequest/withRemovalDecision/withRemovalArchived.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 4: Таблица плана — ячейки из журнала, статус удаления, «История»

**Files:**
- Modify: `Promo/src/app/components/short-calendar/PlanApprovalTable.tsx`

**Interfaces:**
- Consumes: из `plan-approval` — `marketingStageCell`, `directorStageCell`, тип `StageCellData`, тип `PlanRowRef`; из `plan-store` — тип `PlanRowJournal`.
- Produces: новые **опциональные** пропсы `PlanApprovalTableProps`: `journalFor?: (id: string) => PlanRowJournal | undefined`, `onShowHistory?: (id: string) => void`. Без них таблица рендерит сид ровно как сегодня.

- [ ] **Шаг 1: Обновить импорты**

Заменить импорт из `promo-mock-data` (убрать `getPlanApproval` и типы стадий — их владелец теперь деривация) и добавить два новых:

```ts
import { Check, Clock, FilePen, History, Pencil, Send, Trash2, TriangleAlert, X } from "lucide-react";
import {
  formatPromoNo,
  PLAN_DIRECTOR_SLA_WORKING_DAYS,
  PLAN_MARKETING_REVIEW_LEAD_DAYS,
  PLAN_MARKETING_SUBMIT_LEAD_DAYS,
  type PlanStageStatus,
} from "../../../lib/promo-mock-data";
import {
  directorStageCell,
  marketingStageCell,
  type StageCellData,
} from "../../../lib/plan-approval";
import type { PlanRowJournal } from "../../../lib/plan-store";
```

> Если `History` не экспортируется установленной `lucide-react@0.487.0` — подставить `Clock` и отметить замену в отчёте (не блокироваться).

- [ ] **Шаг 2: Единицы срока в бейдже этапа**

Заменить `StageStatusBadge` целиком:

```tsx
const UNIT_LABEL: Record<"cal" | "work", string> = {
  cal: "кал. дн.",
  work: "раб. дн.",
};

function StageStatusBadge({
  status,
  overdueDays,
  unit = "work",
}: {
  status: PlanStageStatus;
  overdueDays?: number;
  unit?: "cal" | "work";
}) {
  const u = UNIT_LABEL[unit];
  if (status === "waiting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-muted dark:text-gray-400">
        <Clock className="size-3" />
        Ожидает согласования
        {overdueDays ? (
          <span className="font-semibold text-red-600 dark:text-red-400">
            · просрочка +{overdueDays} {u}
          </span>
        ) : null}
      </span>
    );
  }
  if (status === "onTime") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <Check className="size-3" />В срок
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">
      <TriangleAlert className="size-3" />
      Просрочка +{overdueDays ?? 0} {u}
    </span>
  );
}
```

- [ ] **Шаг 3: Ячейки этапов из `StageCellData`**

Заменить `MarketingCell` и `DirectorCell`:

```tsx
/** Метка цикла — выводится ТОЛЬКО в маркетинговой колонке, чтобы не троиться. */
function CycleTag({ no }: { no?: number }) {
  if (!no) return null;
  return (
    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
      Цикл {no}
    </span>
  );
}

function MarketingCell({ cell }: { cell?: StageCellData }) {
  if (!cell) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      {cell.reviewedAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          <span className="text-muted-foreground">Озн.:</span>{" "}
          {formatDateTime(cell.reviewedAt)}
        </div>
      )}
      {cell.sentAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          <span className="text-muted-foreground">Отпр.:</span>{" "}
          {formatDateTime(cell.sentAt)}
        </div>
      )}
      <StageStatusBadge
        status={cell.status}
        overdueDays={cell.overdueDays}
        unit={cell.unit}
      />
      <CycleTag no={cell.cycleNo} />
    </div>
  );
}

function DirectorCell({ cell }: { cell?: StageCellData }) {
  if (!cell) return <Dash />;
  return (
    <div className="flex flex-col gap-1">
      {cell.decidedAt && (
        <div className="text-xs tabular-nums text-gray-700 dark:text-gray-200">
          {formatDateTime(cell.decidedAt)}
        </div>
      )}
      <StageStatusBadge
        status={cell.status}
        overdueDays={cell.overdueDays}
        unit={cell.unit}
      />
      {cell.by && (
        <span className="text-[10px] text-muted-foreground">{cell.by}</span>
      )}
    </div>
  );
}
```

- [ ] **Шаг 4: Статус «Удаление на согласовании»**

В `RowLifecycleBadge` добавить два пропса и первую по приоритету ветку:

```tsx
function RowLifecycleBadge({
  send,
  decision,
  removalPending,
  onRejectedClick,
  onRemovalClick,
}: {
  send?: PlanRowSend;
  decision?: RowDecision;
  /** R30.2 — активный запрос на удаление перекрывает остальные состояния. */
  removalPending?: boolean;
  onRejectedClick?: () => void;
  onRemovalClick?: () => void;
}) {
  if (removalPending) {
    return (
      <button
        type="button"
        onClick={onRemovalClick}
        title="Показать запрос на удаление"
        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 underline decoration-orange-300 decoration-dotted underline-offset-2 transition-colors hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-300 dark:decoration-orange-500/50 dark:hover:bg-orange-500/25"
      >
        <Trash2 className="size-3" />
        Удаление на согласовании
      </button>
    );
  }
  // …существующие ветки без изменений…
}
```

- [ ] **Шаг 5: Колонка «Действия» — всегда, с кнопкой «История»**

Заменить `RowActions`:

```tsx
function RowActions({
  id,
  canManage,
  removalPending,
  onHistory,
  onEdit,
  onDelete,
}: {
  id: string;
  canManage: boolean;
  removalPending: boolean;
  onHistory?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {/* Доступна всем ролям: история согласования — не действие владельца. */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => onHistory?.(id)}
      >
        <History className="size-3.5" />
        История
      </Button>
      {/* Пока удаление на согласовании — строку не правят и не удаляют повторно. */}
      {canManage && !removalPending && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onEdit?.(id)}
          >
            <Pencil className="size-3.5" />
            Изменить
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete?.(id)}
          >
            <Trash2 className="size-3.5" />
            Удалить
          </Button>
        </>
      )}
    </div>
  );
}
```

> Изменение поведения по сравнению с текущим: «Удалить» теперь отдаётся не только черновикам. Для согласованной строки `PlanMode` (Task 7) откроет запрос на удаление вместо жёсткого удаления.

- [ ] **Шаг 6: Новые пропсы и рендер строк**

В `PlanApprovalTableProps` добавить:

```ts
  /**
   * Журнал строки (Волна 4). Без него ячейки этапов читаются из сида
   * `PLAN_APPROVALS` — ровно сегодняшнее поведение.
   */
  journalFor?: (id: string) => PlanRowJournal | undefined;
  /** Открыть боковую панель истории строки (доступна всем ролям). */
  onShowHistory?: (id: string) => void;
```

и в сигнатуру компонента — `journalFor,` и `onShowHistory,`.

В шапке таблицы: колонку «Действия» сделать безусловной и расширить, а `min-w` таблицы поднять:

```tsx
        <table className="w-full min-w-[1320px] border-separate border-spacing-0 text-sm">
```
```tsx
              <th className={cn(HEAD, "w-[240px]")}>Действия</th>
```
(убрать обрамляющее `{canManage && …}`).

В теле `rows.map` заменить вычисление `appr` на деривацию и обновить ячейки:

```tsx
              const journal = journalFor?.(r.id);
              const rowRef = { id: r.id, startDate: r.startDate };
              const removalPending = Boolean(journal?.removal);
              const decision = decisionFor?.(r.id);
              const send = sendStatusFor?.(r.id);
              const checked = selectedIds?.has(r.id) ?? false;
```

```tsx
                  <td className={CELL}>
                    <MarketingCell cell={marketingStageCell(rowRef, journal)} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell cell={directorStageCell("kd", rowRef, journal)} />
                  </td>
                  <td className={CELL}>
                    <DirectorCell cell={directorStageCell("od", rowRef, journal)} />
                  </td>
                  <td className={cn(CELL, "align-middle")}>
                    <RowActions
                      id={r.id}
                      canManage={canManage}
                      removalPending={removalPending}
                      onHistory={onShowHistory}
                      onEdit={onEditRow}
                      onDelete={onDeleteRow}
                    />
                  </td>
```

и в `RowLifecycleBadge` передать:

```tsx
                    <RowLifecycleBadge
                      send={send}
                      decision={decision}
                      removalPending={removalPending}
                      onRejectedClick={
                        onShowHistory ? () => onShowHistory(r.id) : undefined
                      }
                      onRemovalClick={
                        onShowHistory ? () => onShowHistory(r.id) : undefined
                      }
                    />
```

Удалить локальную переменную `isDraft` — она больше не нужна.

- [ ] **Шаг 7: То же в мобильных карточках**

В блоке `md:hidden` повторить: `journal`/`rowRef`/`removalPending`, `MarketingCell`/`DirectorCell` с `cell={…}`, `RowLifecycleBadge` с `removalPending`+`onRemovalClick`, и блок действий сделать безусловным:

```tsx
              <div className="mt-3 border-t pt-2">
                <RowActions
                  id={r.id}
                  canManage={canManage}
                  removalPending={removalPending}
                  onHistory={onShowHistory}
                  onEdit={onEditRow}
                  onDelete={onDeleteRow}
                />
              </div>
```

- [ ] **Шаг 8: Совместимость вызывающего кода**

`PlanMode` сейчас передаёт `onShowRejection`. Оставить проп `onShowRejection` в интерфейсе **нельзя** — он заменён на `onShowHistory`. Обновить единственный вызов в `PlanMode.tsx`:

```tsx
            onShowHistory={setRejectionRowId}
```

(переименование состояния — в Task 5.)

- [ ] **Шаг 9: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 10: Типовая проверка чтением**

- в файле не осталось обращений к `getPlanApproval`, `appr`, `PlanStageMarketing`, `PlanStageDirector` и `isDraft` — иначе останется мёртвый импорт или битая ссылка (сборка промолчит);
- `UNIT_LABEL` — `Record<"cal" | "work", string>` и содержит оба ключа;
- проп `onShowRejection` удалён из интерфейса **и** из деструктуризации, а его единственный вызывающий (`PlanMode.tsx`) переведён на `onShowHistory`;
- колонок в `<thead>` ровно столько же, сколько `<td>` в строке `<tbody>` (с учётом того, что «Действия» теперь безусловна, а чекбокс — по-прежнему по `selectable`);
- `RowActions` вызывается с новым набором пропсов в обоих местах — и в таблице, и в мобильной карточке.

- [ ] **Шаг 11: Быстрая визуальная проверка**

Запустить `corepack pnpm --filter promo dev`, открыть `/short-calendar` → вкладка «План акций». Убедиться: сид-строки показывают те же даты и статусы, что раньше, но с подписью «раб. дн.»/«кал. дн.»; у каждой строки есть кнопка «История» (пока ничего не открывает у не-владельца — панель подключается в Task 5).

- [ ] **Шаг 12: Коммит**

```bash
git add Promo/src/app/components/short-calendar/PlanApprovalTable.tsx Promo/src/app/components/short-calendar/PlanMode.tsx
git commit -F - <<'EOF'
feat(promo): Волна 4 (T4) — таблица плана рендерит этапы из журнала

MarketingCell/DirectorCell принимают StageCellData из lib/plan-approval;
StageStatusBadge подписывает единицу срока и умеет «ожидает · просрочка +N»;
метка «Цикл N»; статус «Удаление на согласовании»; колонка «Действия» стала
безусловной и получила «Историю» для всех ролей.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 5: Боковая панель истории строки

**Files:**
- Create: `Promo/src/app/components/short-calendar/PlanRowHistoryDrawer.tsx`
- Delete: `Promo/src/app/components/short-calendar/PlanRejectionDrawer.tsx`
- Modify: `Promo/src/app/components/short-calendar/PlanMode.tsx` (только импорт, состояние и рендер панели)

**Interfaces:**
- Consumes: `PlanRowJournal`, `PlanRejectionEvent`, `PlanReviewerStage` из `plan-store`; `STAGE_LABEL`, `pendingRemovalStageFor` из `plan-approval`; `formatPromoNo` из `promo-mock-data`.
- Produces: компонент `PlanRowHistoryDrawer` с пропсами `{ open, onOpenChange, rowId, rowName, journal?, legacyEvents, removalStage?, onApproveRemoval?, onRejectRemoval? }`.

- [ ] **Шаг 1: Создать файл — шапка, импорты, утилиты**

```tsx
"use client";

import * as React from "react";
import {
  History,
  MessageSquare,
  Send,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@texnomart/ui/sheet";
import { Button } from "@texnomart/ui/button";
import { cn } from "@texnomart/ui/utils";
import { formatPromoNo } from "../../../lib/promo-mock-data";
import { STAGE_LABEL } from "../../../lib/plan-approval";
import type {
  PlanApprovalCycle,
  PlanRejectionEvent,
  PlanReviewerStage,
  PlanRowJournal,
} from "../../../lib/plan-store";

// «10-я часть» Волна 4 — правая панель строки плана. Поглощает прежний
// `PlanRejectionDrawer` («7-я часть» §9): секция «Запрос на удаление» (R30.2,
// с кнопками решения для действующей роли), «Текущий цикл» и «История
// согласования» по всем прежним циклам (R30.1).
//
// Обратная совместимость: если журнала по строке нет, панель рендерит прежний
// вид из legacy `rejectionLog` — без слияния и дедупликации.

interface PlanRowHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowId: string | null;
  rowName?: string;
  journal?: PlanRowJournal;
  /** Отклонения из legacy-слайса — показываются, когда журнала нет. */
  legacyEvents: PlanRejectionEvent[];
  /** Этап, на котором ТЕКУЩАЯ роль может решить судьбу запроса на удаление. */
  removalStage?: PlanReviewerStage;
  onApproveRemoval?: () => void;
  onRejectRemoval?: () => void;
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  );
}
```

- [ ] **Шаг 2: Блок одного цикла**

```tsx
function CycleBlock({
  cycle,
  current,
}: {
  cycle: PlanApprovalCycle;
  current?: boolean;
}) {
  const stages: PlanReviewerStage[] = ["kd", "od"];
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-3",
        current ? "border-primary/40 bg-primary/5" : "bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-200">
          <Send className="size-3.5" />
          Цикл {cycle.no}
          {current ? " — текущий" : ""}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {fmtDateTime(cycle.sentAt)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        Отправил: {cycle.sentBy}
      </div>

      {stages.map((s) => {
        const d = cycle[s];
        if (!d) return null;
        const rejected = d.decision === "rejected";
        return (
          <div
            key={s}
            className={cn(
              "space-y-1 rounded-md border p-2",
              rejected
                ? "border-red-200 bg-red-50/50 dark:border-red-500/30 dark:bg-red-500/10"
                : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  rejected
                    ? "text-red-700 dark:text-red-300"
                    : "text-emerald-700 dark:text-emerald-300"
                )}
              >
                {rejected ? (
                  <ThumbsDown className="size-3.5" />
                ) : (
                  <ThumbsUp className="size-3.5" />
                )}
                {STAGE_LABEL[s]} — {rejected ? "отклонил" : "согласовал"}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {fmtDateTime(d.at)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{d.by}</div>
            {d.comment && (
              <p className="flex items-start gap-1.5 text-sm leading-snug text-gray-900 dark:text-gray-100">
                <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {d.comment}
              </p>
            )}
          </div>
        );
      })}

      {cycle.closedAt && (
        <div className="flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
          <Undo2 className="size-3.5" />
          {cycle.closedReason === "edit"
            ? "Цикл закрыт правкой строки"
            : "Цикл закрыт возвратом на доработку"}{" "}
          · <span className="tabular-nums">{fmtDateTime(cycle.closedAt)}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Шаг 3: Блок запроса на удаление**

```tsx
function RemovalBlock({
  journal,
  removalStage,
  onApprove,
  onReject,
}: {
  journal: PlanRowJournal;
  removalStage?: PlanReviewerStage;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const req = journal.removal;
  if (!req) return null;
  return (
    <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/60 p-3 dark:border-orange-500/30 dark:bg-orange-500/10">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-orange-800 dark:text-orange-200">
        <Trash2 className="size-4" />
        Запрос на удаление строки
      </div>
      <div className="space-y-2">
        <DetailRow label="Кто запросил" value={req.requestedBy} />
        <DetailRow
          label="Дата и время"
          value={<span className="tabular-nums">{fmtDateTime(req.requestedAt)}</span>}
        />
      </div>
      <div className="space-y-1 border-t border-orange-200/60 pt-2 dark:border-orange-500/20">
        <span className="text-xs text-muted-foreground">Причина</span>
        <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
          {req.reason || "—"}
        </p>
      </div>

      <div className="space-y-1.5 border-t border-orange-200/60 pt-2 dark:border-orange-500/20">
        <span className="text-xs text-muted-foreground">
          Требуется согласование
        </span>
        <ul className="space-y-1">
          {req.requiredStages.map((s) => {
            const d = req[s];
            return (
              <li key={s} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-gray-900 dark:text-gray-100">
                  {STAGE_LABEL[s]}
                </span>
                {d ? (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      d.decision === "approved"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                    )}
                  >
                    {d.decision === "approved" ? "Согласовал" : "Отклонил"} ·{" "}
                    <span className="tabular-nums">{fmtDateTime(d.at)}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Ожидает решения
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {removalStage && (
        <div className="flex flex-wrap gap-2 border-t border-orange-200/60 pt-2 dark:border-orange-500/20">
          <Button size="sm" onClick={onApprove}>
            <ThumbsUp className="size-4" />
            Согласовать удаление
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onReject}
          >
            <ThumbsDown className="size-4" />
            Отклонить удаление
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Шаг 4: Legacy-блок (прежний вид панели)**

```tsx
/** Прежний вид «7-й части» §9 — используется, когда журнала по строке нет. */
function LegacyRejections({ events }: { events: PlanRejectionEvent[] }) {
  const latest = events.find((e) => e.kind !== "return");
  return (
    <div className="space-y-4">
      {latest ? (
        <div className="space-y-2.5 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
          <DetailRow label="Кто отклонил" value={latest.by} />
          <DetailRow label="Роль согласующего" value={latest.role} />
          <DetailRow
            label="Дата и время"
            value={<span className="tabular-nums">{fmtDateTime(latest.at)}</span>}
          />
          <div className="space-y-1 border-t border-red-200/60 pt-2.5 dark:border-red-500/20">
            <span className="text-xs text-muted-foreground">Комментарий</span>
            <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
              {latest.comment || "—"}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          По этой строке ещё нет событий согласования. Они появятся здесь после
          отправки на согласование и решений согласующих.
        </div>
      )}

      {events.length > (latest ? 1 : 0) && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            История отклонений
          </h3>
          <ol className="space-y-2">
            {events.map((e, i) => {
              const isReturn = e.kind === "return";
              return (
                <li
                  key={`${e.at}-${i}`}
                  className={cn(
                    "rounded-lg border p-3",
                    isReturn
                      ? "bg-muted/30"
                      : "border-red-100 bg-red-50/30 dark:border-red-500/20 dark:bg-red-500/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        isReturn
                          ? "text-gray-600 dark:text-gray-300"
                          : "text-red-700 dark:text-red-300"
                      )}
                    >
                      {isReturn ? (
                        <Undo2 className="size-3.5" />
                      ) : (
                        <ThumbsDown className="size-3.5" />
                      )}
                      {isReturn ? "Возврат на доработку" : "Отклонение"}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {fmtDateTime(e.at)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {e.by} · {e.role}
                  </div>
                  {e.comment && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-snug text-gray-900 dark:text-gray-100">
                      <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      {e.comment}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Шаг 5: Сам компонент**

```tsx
export function PlanRowHistoryDrawer({
  open,
  onOpenChange,
  rowId,
  rowName,
  journal,
  legacyEvents,
  removalStage,
  onApproveRemoval,
  onRejectRemoval,
}: PlanRowHistoryDrawerProps) {
  const cycles = journal?.cycles ?? [];
  const hasJournal = cycles.length > 0 || Boolean(journal?.removal);
  const current = cycles[cycles.length - 1];
  const previous = cycles.slice(0, -1).reverse(); // новые сверху

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            История согласования строки
          </SheetTitle>
          <SheetDescription>
            {rowId ? (
              <span className="tabular-nums">
                № {formatPromoNo(rowId)}
                {rowName ? ` · ${rowName}` : ""}
              </span>
            ) : (
              "Строка плана"
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {journal?.removal && (
            <RemovalBlock
              journal={journal}
              removalStage={removalStage}
              onApprove={onApproveRemoval}
              onReject={onRejectRemoval}
            />
          )}

          {hasJournal ? (
            <>
              {current && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Текущий цикл
                  </h3>
                  <CycleBlock cycle={current} current />
                </div>
              )}

              {previous.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    История согласования
                  </h3>
                  <div className="space-y-2">
                    {previous.map((c) => (
                      <CycleBlock key={c.no} cycle={c} />
                    ))}
                  </div>
                </div>
              )}

              {(journal?.removalHistory?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Завершённые запросы на удаление
                  </h3>
                  <ol className="space-y-2">
                    {journal?.removalHistory?.map((r, i) => (
                      <li
                        key={`${r.requestedAt}-${i}`}
                        className="space-y-1 rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
                            <Trash2 className="size-3.5" />
                            Запрос на удаление
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {fmtDateTime(r.requestedAt)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.requestedBy}
                        </div>
                        <p className="text-sm leading-snug text-gray-900 dark:text-gray-100">
                          {r.reason}
                        </p>
                        {r.requiredStages.map((s) => {
                          const d = r[s];
                          if (!d) return null;
                          return (
                            <div key={s} className="text-xs text-muted-foreground">
                              {STAGE_LABEL[s]}:{" "}
                              {d.decision === "approved" ? "согласовал" : "отклонил"}
                              {d.comment ? ` — ${d.comment}` : ""}
                            </div>
                          );
                        })}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          ) : (
            <LegacyRejections events={legacyEvents} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Шаг 6: Удалить прежнюю панель и переключить `PlanMode`**

```bash
git rm Promo/src/app/components/short-calendar/PlanRejectionDrawer.tsx
```

В `PlanMode.tsx`:
- заменить импорт `import { PlanRejectionDrawer } from "./PlanRejectionDrawer";` на `import { PlanRowHistoryDrawer } from "./PlanRowHistoryDrawer";`;
- переименовать состояние `rejectionRowId`/`setRejectionRowId` → `historyRowId`/`setHistoryRowId` (включая проп таблицы `onShowHistory={setHistoryRowId}`);
- заменить рендер панели:

```tsx
      {/* «7-я часть» §9 + Волна 4 — история согласования строки и запрос на удаление. */}
      <PlanRowHistoryDrawer
        open={historyRowId !== null}
        onOpenChange={(o) => !o && setHistoryRowId(null)}
        rowId={historyRowId}
        rowName={historyRowId ? rowById(historyRowId)?.name : undefined}
        legacyEvents={historyRowId ? rejectionLog[historyRowId] ?? [] : []}
      />
```

(`journal`/`removalStage`/обработчики подключаются в Task 6 и Task 7.)

- [ ] **Шаг 7: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 8: Типовая проверка чтением**

- в репозитории не осталось ни одной ссылки на `PlanRejectionDrawer` — проверить `grep -rn "PlanRejectionDrawer" Promo/src` (ожидается пусто);
- `cycle[s]` и `req[s]`, где `s: PlanReviewerStage`, действительно индексируют поля `kd`/`od` соответствующих интерфейсов;
- `STAGE_LABEL` импортирован из `plan-approval`, а типы — из `plan-store` (не наоборот);
- все иконки (`History`, `MessageSquare`, `Send`, `ThumbsDown`, `ThumbsUp`, `Trash2`, `Undo2`) есть в установленной `lucide-react`; при отсутствии `History` — заменить на `Clock` и отметить в отчёте;
- у `Button` внутри панели нет `asChild` — это обычные кнопки, ловушка с ref не применяется.

- [ ] **Шаг 9: Коммит**

```bash
git add Promo/src/app/components/short-calendar/PlanRowHistoryDrawer.tsx Promo/src/app/components/short-calendar/PlanMode.tsx
git commit -F - <<'EOF'
feat(promo): Волна 4 (T5) — панель истории согласования строки плана

PlanRowHistoryDrawer заменяет PlanRejectionDrawer: блок запроса на удаление
с кнопками решения, текущий цикл, история прежних циклов и завершённых
запросов. Если журнала по строке нет — рендерится прежний вид из legacy
rejectionLog, байт-в-байт.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 6: Стемпы циклов и живой аудит в `PlanMode` (R29.5 + R30.1)

**Files:**
- Modify: `Promo/src/app/components/short-calendar/PlanMode.tsx`

**Interfaces:**
- Consumes: writers из Task 3 (`withSend`, `withDecision`, `withCycleClosed`); `PlanRowJournal` из `plan-store`; `appendAuditEvent` из `lib/audit-store`; типы `AuditActionType` из `promo-mock-data`.
- Produces: состояние `rowJournal` + `journalOf(id)`; журнал передаётся в таблицу (`journalFor`) и панель (`journal`).

- [ ] **Шаг 1: Импорты**

```ts
import {
  getPlanState,
  persistPlanState,
  reviveOverrides,
  reviveRows,
  serializeOverrides,
  serializeRows,
  type PlanRejectionEvent,
  type PlanRowJournal,
} from "../../../lib/plan-store";
import {
  withCycleClosed,
  withDecision,
  withSend,
} from "../../../lib/plan-approval";
import { appendAuditEvent } from "../../../lib/audit-store";
import type { AuditActionType } from "../../../lib/promo-mock-data";
```

- [ ] **Шаг 2: Состояние журнала и персистентность**

Рядом с `rejectionLog`:

```ts
  // Волна 4 — пер-строчный журнал циклов согласования (R29.5/R30.1) и запросов
  // на удаление (R30.2). Живёт рядом с decisions/sendStatus, а не вместо них.
  const [rowJournal, setRowJournal] = React.useState<
    Record<string, PlanRowJournal>
  >(() => initialStored?.rowJournal ?? {});
```

В `persistPlanState({...})` добавить `rowJournal,` и в массив зависимостей эффекта — `rowJournal`.

Ниже `sendOf` добавить аксессор:

```ts
  const journalOf = (id: string): PlanRowJournal | undefined => rowJournal[id];
```

- [ ] **Шаг 3: Хелпер живого аудита**

```ts
  /**
   * Живое событие плана в общий аудит-лог. Новые типы действий НЕ вводим:
   * `AUDIT_ACTION_META` — это `Record<AuditActionType, …>`, и его неисчерпаемость
   * невидима для транспайл-онли билда (уже ломало аудит в E-4).
   */
  function logPlan(
    action: AuditActionType,
    row: PlanRow,
    comment?: string,
    statuses?: { from?: string; to?: string }
  ) {
    appendAuditEvent({
      user: currentUser?.fullName ?? currentRole,
      role: currentRole,
      action,
      objectType: "план",
      objectLabel: row.name,
      campaignId: row.id,
      statusFrom: statuses?.from,
      statusTo: statuses?.to,
      comment,
    });
  }
```

- [ ] **Шаг 4: Стемп отправки**

В `sendSelected`, сразу после `setSendStatus(...)`:

```ts
    const now = new Date();
    const sentBy = currentUser?.fullName ?? PLAN_EDITOR;
    setRowJournal((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = withSend(next[id], now, sentBy);
      return next;
    });
    for (const id of ids) {
      const row = rowById(id);
      if (row) {
        const cycleNo = (journalOf(id)?.cycles.length ?? 0) + 1;
        logPlan("отправка на согласование", row, `Цикл ${cycleNo}`);
      }
    }
```

- [ ] **Шаг 5: Стемп согласования**

В `approveSelected`, после `setDecisions(next)`:

```ts
    const now = new Date();
    const by = currentUser?.fullName ?? currentRole;
    setRowJournal((prev) => {
      const out = { ...prev };
      for (const id of ids)
        out[id] = withDecision(out[id], id, reviewerStage, "approved", {
          at: now,
          by,
          role: currentRole,
        });
      return out;
    });
    for (const id of ids) {
      const row = rowById(id);
      if (row) logPlan("согласование", row, `Согласовано на этапе ${stageLabel}`);
    }
```

- [ ] **Шаг 6: Стемп отклонения**

В `rejectSelected`, рядом с существующей записью в `rejectionLog` — **заменить** запись в `rejectionLog` на запись в журнал (двойной записи быть не должно; legacy-слайс остаётся только на чтение). Удалить блок `setRejectionLog((prev) => …)` и вместо него:

```ts
    const now = new Date();
    const by = currentUser?.fullName ?? currentActor ?? currentRole;
    setRowJournal((prev) => {
      const out = { ...prev };
      for (const id of ids)
        out[id] = withDecision(out[id], id, reviewerStage, "rejected", {
          at: now,
          by,
          role: currentActor ?? currentRole,
          comment: reason,
        });
      return out;
    });
    for (const id of ids) {
      const row = rowById(id);
      if (row) logPlan("отклонение", row, reason);
    }
```

Локальную переменную `event: PlanRejectionEvent` в этой функции удалить.

- [ ] **Шаг 7: Возврат на доработку и правка закрывают цикл**

В `returnForRework` — заменить запись в `rejectionLog` на закрытие цикла:

```ts
    const now = new Date();
    setRowJournal((prev) => {
      const out = { ...prev };
      for (const id of rejectedIds) out[id] = withCycleClosed(out[id], "return", now);
      return out;
    });
    for (const id of rejectedIds) {
      const row = rowById(id);
      if (row) logPlan("изменение", row, "Возврат на доработку");
    }
```

В `handleEdit`, внутри ветки `if (sendOf(id) === "sent")`:

```ts
      setRowJournal((prev) => ({
        ...prev,
        [id]: withCycleClosed(prev[id], "edit", new Date()),
      }));
      logPlan("изменение", patch, "Правка отправленной строки — требуется повторная отправка");
```

- [ ] **Шаг 8: Прокинуть журнал в таблицу и панель**

```tsx
          <PlanApprovalTable
            …
            journalFor={journalOf}
            onShowHistory={setHistoryRowId}
          />
```

```tsx
      <PlanRowHistoryDrawer
        open={historyRowId !== null}
        onOpenChange={(o) => !o && setHistoryRowId(null)}
        rowId={historyRowId}
        rowName={historyRowId ? rowById(historyRowId)?.name : undefined}
        journal={historyRowId ? journalOf(historyRowId) : undefined}
        legacyEvents={historyRowId ? rejectionLog[historyRowId] ?? [] : []}
      />
```

- [ ] **Шаг 9: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 10: Типовая проверка чтением**

- `rowJournal` присутствует **и** в объекте `persistPlanState({...})`, **и** в массиве зависимостей эффекта — иначе изменения не сохранятся либо сохранятся с задержкой на один рендер;
- `setRejectionLog` больше нигде не вызывается (`grep -n "setRejectionLog" PlanMode.tsx` → пусто); состояние `rejectionLog` остаётся только на чтение для legacy-панели, и его инициализатор не тронут;
- если после удаления записей тип `PlanRejectionEvent` больше не используется — убрать его из импорта;
- в `sendSelected` номер цикла для аудита берётся ДО обновления состояния (`journalOf(id)` читает предыдущий журнал) — это осознанно, `+1` даёт номер нового цикла;
- `logPlan` вызывается только со значениями из юниона `AuditActionType`: «отправка на согласование», «согласование», «отклонение», «изменение».

- [ ] **Шаг 11: Контрольная точка QA (R29.5 + R30.1)**

`corepack pnpm --filter promo dev` → `/short-calendar` → «План акций».

1. Роль **Коммерческий директор**: выбрать строку, «Согласовать выбранные» → в колонке «Коммерческий директор» появились дата-время и «В срок» (или «Просрочка +N раб. дн.»).
2. Перезагрузить страницу → значения на месте (персистентность).
3. Роль **Директор маркетинга**: «Изменить» согласованную строку → она стала «Черновик»; отправить снова → в колонке «Директор маркетинга» новая дата «Отпр.» и метка «Цикл 2».
4. «История» на этой строке → «Текущий цикл» = цикл 2, ниже «История согласования» с циклом 1 и пометкой о закрытии правкой.
5. `/audit` → вкладка «Аудит-лог»: свежие записи «отправка на согласование» / «согласование» с объектом «План».

- [ ] **Шаг 12: Коммит**

```bash
git add Promo/src/app/components/short-calendar/PlanMode.tsx
git commit -F - <<'EOF'
feat(promo): Волна 4 (T6) — циклы согласования строки плана и живой аудит

R29.5/R30.1: отправка открывает цикл, решения КД/ОД пишутся в него с датой,
возврат и правка цикл закрывают, повторная отправка открывает следующий —
прежние даты и решения не затираются. Отклонения переехали из legacy
rejectionLog в журнал (двойной записи нет). Переходы плана пишутся в живой
аудит существующими типами действий.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 7: Удаление согласованной строки через согласование (R30.2)

**Files:**
- Modify: `Promo/src/app/components/short-calendar/PlanMode.tsx`

**Interfaces:**
- Consumes: из `plan-approval` — `approvedStages`, `removalNeedsApproval`, `pendingRemovalStageFor`, `removalFullyApproved`, `removalRejected`, `withRemovalRequest`, `withRemovalDecision`, `withRemovalArchived`, `STAGE_LABEL`; из `plan-store` — тип `PlanRemovalRequest`.
- Produces: конечное поведение экрана; дальнейших потребителей нет.

- [ ] **Шаг 1: Дополнить импорты**

```ts
import {
  approvedStages,
  pendingRemovalStageFor,
  removalFullyApproved,
  removalNeedsApproval,
  removalRejected,
  withCycleClosed,
  withDecision,
  withRemovalArchived,
  withRemovalDecision,
  withRemovalRequest,
  withSend,
} from "../../../lib/plan-approval";
import type { PlanRemovalRequest, PlanRowJournal } from "../../../lib/plan-store";
```

- [ ] **Шаг 2: Состояние диалога запроса**

Рядом с `rejectOpen`:

```ts
  // R30.2 — строка, для которой владелец плана запрашивает удаление (null = диалог закрыт).
  const [removalRowId, setRemovalRowId] = React.useState<string | null>(null);
  // Строка, по которой проверяющий отклоняет удаление (нужен комментарий).
  const [removalRejectRowId, setRemovalRejectRowId] = React.useState<string | null>(null);
```

- [ ] **Шаг 3: Развилка в `handleDelete`**

Заменить тело `handleDelete`:

```ts
  function handleDelete(id: string) {
    const row = rowById(id);
    if (!row) return;
    // R30.2 — строка, согласованная в последнем цикле, не удаляется сразу:
    // сначала удаление согласуют те же этапы, что её согласовали.
    if (removalNeedsApproval(id, journalOf(id))) {
      // Контролируемый диалог из обычной кнопки — открывать только отложенно,
      // иначе DismissableLayer закроет его тем же кликом.
      setTimeout(() => setRemovalRowId(id), 0);
      return;
    }
    setDeletedIds((prev) => new Set(prev).add(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    logPlan("отмена", row, "Черновик удалён");
    toast.success("Черновик удалён");
  }
```

- [ ] **Шаг 4: Создание запроса на удаление**

```ts
  function requestRemoval(reason: string) {
    const id = removalRowId;
    if (!id) return;
    const row = rowById(id);
    if (!row) return;
    const stages = approvedStages(id, journalOf(id));
    if (stages.length === 0) return; // защита: развилка уже это проверила

    const req: PlanRemovalRequest = {
      requestedAt: new Date().toISOString(),
      requestedBy: currentUser?.fullName ?? PLAN_EDITOR,
      reason,
      requiredStages: stages,
    };
    setRowJournal((prev) => ({ ...prev, [id]: withRemovalRequest(prev[id], req) }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setRemovalRowId(null);
    logPlan("изменение", row, `Запрос на удаление строки: ${reason}`);
    toast.success(
      `Запрос на удаление отправлен на согласование: ${stages
        .map((s) => STAGE_LABEL[s])
        .join(", ")}`
    );
  }
```

- [ ] **Шаг 5: Решение проверяющего**

```ts
  /**
   * Решение по запросу на удаление. Гейт пер-строчный: `pendingRemovalStageFor`
   * смотрит только на роль и на требуемые этапы, НЕ на `planStatus` — при
   * «Утверждён» плановая цепочка вообще не имеет актора.
   */
  function decideRemoval(id: string, decision: "approved" | "rejected", reason?: string) {
    const row = rowById(id);
    const stage = pendingRemovalStageFor(currentRole, journalOf(id));
    if (!row || !stage) return;

    const now = new Date();
    const meta = {
      at: now,
      by: currentUser?.fullName ?? currentRole,
      role: currentRole,
      comment: reason,
    };

    // Решение считаем синхронно: асинхронное состояние ещё не обновилось.
    let after = withRemovalDecision(journalOf(id), stage, decision, meta);
    const req = after.removal;
    if (!req) return;

    if (decision === "rejected" || removalRejected(req)) {
      after = withRemovalArchived(after);
      setRowJournal((prev) => ({ ...prev, [id]: after }));
      logPlan("отклонение", row, `Удаление строки отклонено: ${reason ?? "—"}`);
      toast.success("Удаление отклонено — строка остаётся в плане");
      return;
    }

    if (removalFullyApproved(req)) {
      after = withRemovalArchived(after);
      setRowJournal((prev) => ({ ...prev, [id]: after }));
      setDeletedIds((prev) => new Set(prev).add(id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setHistoryRowId(null);
      // Два разных факта: кто решил и что произошло с планом.
      logPlan("согласование", row, `Удаление согласовано (${STAGE_LABEL[stage]})`);
      logPlan("отмена", row, "Строка удалена из плана");
      toast.success("Удаление согласовано — строка исключена из плана");
      return;
    }

    setRowJournal((prev) => ({ ...prev, [id]: after }));
    logPlan("согласование", row, `Удаление согласовано (${STAGE_LABEL[stage]})`);
    const waiting = req.requiredStages.filter((s) => !req[s]).map((s) => STAGE_LABEL[s]);
    toast.success(`Удаление согласовано. Ожидает: ${waiting.join(", ")}`);
  }
```

- [ ] **Шаг 6: Исключить строки с запросом из выбора и из проверки продвижения**

В `selectablePool`:

```ts
  const selectablePool: PlanRow[] = reviewMode
    ? sentRows.filter(
        (r) => !decisions[r.id]?.[reviewerStage!] && !journalOf(r.id)?.removal
      )
    : sendMode
      ? sendableDrafts.filter((r) => !journalOf(r.id)?.removal)
      : [];
```

Объявить **один** набор строк, участвующих в продвижении плана — рядом с `sentRows`/`draftRows`:

```ts
  // Строка с активным запросом на удаление решается отдельным треком и не должна
  // блокировать продвижение плана: без этого исключения `every(...)` никогда не
  // станет истинным и цепочка КД → ОД → «Утверждён» встанет.
  const gatingRows = sentRows.filter((r) => !journalOf(r.id)?.removal);
```

Заменить `approvedCount`, использовав его:

```ts
  const approvedCount = reviewerStage
    ? gatingRows.filter((r) => decisions[r.id]?.[reviewerStage] === "approved").length
    : 0;
```

В строке прогресса («Согласовано N из M на этапе …») заменить `{sentRows.length}` на `{gatingRows.length}`.

В `approveSelected` заменить оба обращения к `sentRows` на `gatingRows`:

```ts
    const allApproved = gatingRows.every(
      (r) => next[r.id]?.[reviewerStage] === "approved"
    );
```
```ts
      const remaining = gatingRows.filter(
        (r) => !next[r.id]?.[reviewerStage]
      ).length;
```

- [ ] **Шаг 7: Диалоги и пропсы панели**

Добавить рядом с существующим `ReasonDialog`:

```tsx
      {/* R30.2 — владелец плана запрашивает удаление согласованной строки. */}
      <ReasonDialog
        open={removalRowId !== null}
        onOpenChange={(o) => !o && setRemovalRowId(null)}
        title="Запросить удаление строки плана"
        description="Строка была согласована, поэтому удаление требует согласования. До решения она останется в плане."
        reasonLabel="Причина удаления"
        confirmLabel="Отправить запрос"
        destructive
        onConfirm={requestRemoval}
      />

      {/* R30.2 — проверяющий отклоняет удаление (комментарий обязателен). */}
      <ReasonDialog
        open={removalRejectRowId !== null}
        onOpenChange={(o) => !o && setRemovalRejectRowId(null)}
        title="Отклонить удаление строки"
        description="Строка останется в плане. Причина будет видна в истории строки."
        reasonLabel="Комментарий"
        confirmLabel="Отклонить удаление"
        destructive
        onConfirm={(reason) => {
          if (removalRejectRowId) decideRemoval(removalRejectRowId, "rejected", reason);
          setRemovalRejectRowId(null);
        }}
      />
```

Дополнить панель:

```tsx
        removalStage={
          historyRowId ? pendingRemovalStageFor(currentRole, journalOf(historyRowId)) : undefined
        }
        onApproveRemoval={() =>
          historyRowId && decideRemoval(historyRowId, "approved")
        }
        onRejectRemoval={() => {
          const id = historyRowId;
          setHistoryRowId(null);
          if (id) setTimeout(() => setRemovalRejectRowId(id), 0);
        }}
```

- [ ] **Шаг 8: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 9: Типовая проверка чтением**

- `decideRemoval` считает результат **синхронно** от `journalOf(id)` и локальной переменной `after`, а не от состояния после `setRowJournal` — иначе последнее согласование не применит удаление (та же ловушка, что в «8-й части» с продвижением плана);
- `gatingRows` объявлена один раз рядом с `sentRows` (не локально внутри `approveSelected`) и используется во всех трёх местах: `approvedCount`, строка прогресса, `approveSelected`; старое `sentRows.length` в прогрессе заменено;
- `removalRejectRowId` открывается отложенно (`setTimeout(…, 0)`), потому что триггер — кнопка внутри уже открытого `Sheet`;
- `logPlan` в `handleDelete` вызывается **до** `toast`, и обе ветки развилки взаимоисключающие (после `return` в ветке запроса жёсткое удаление недостижимо);
- `PlanRemovalRequest` импортирован как тип, `STAGE_LABEL` — как значение.

- [ ] **Шаг 10: Контрольная точка QA (R30.2)**

1. Роль **КД**: согласовать строку (или взять сид-строку `26-1`, уже согласованную КД и ОД).
2. Роль **Директор маркетинга**: «Удалить» на этой строке → открылся диалог с обязательной причиной; отправить запрос → строка **осталась** в таблице со статусом «Удаление на согласовании», кнопки «Изменить»/«Удалить» у неё исчезли, чекбокса нет.
3. Роль **КД**: «История» на строке → блок «Запрос на удаление» с кнопками. Нажать «Согласовать удаление» → если требуется и ОД, статус «Ожидает решения» у ОД сохраняется.
4. Роль **Операционный директор**: «История» → «Согласовать удаление» → строка исчезла из таблицы.
5. `/audit` → записи «изменение» (запрос), «согласование» (решения) и «отмена» (удаление применено).
6. Повторить с отклонением: строка возвращается в план, в «Истории» — блок «Завершённые запросы на удаление» с причиной.
7. Перезагрузка страницы на каждом шаге — состояние сохраняется.
8. Черновик: «Удалить» удаляет сразу, без диалога.
9. Проверить 390 px и тёмную тему.

- [ ] **Шаг 11: Коммит**

```bash
git add Promo/src/app/components/short-calendar/PlanMode.tsx
git commit -F - <<'EOF'
feat(promo): Волна 4 (T7) — удаление согласованной строки плана через согласование

R30.2: «Удалить» на согласованной строке создаёт запрос с обязательной
причиной; строка остаётся в плане со статусом «Удаление на согласовании»,
решение принимают согласовавшие её этапы из боковой панели — пер-строчно,
вне цепочки planStatus. После всех согласований строка уходит в tombstone,
история сохраняется; отклонение возвращает строку в план. Строки с активным
запросом исключены из выбора и из проверки продвижения плана.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 8: CSV-экспорт плана из журнала

**Files:**
- Modify: `Promo/src/lib/promo-export.ts`

**Interfaces:**
- Consumes: `marketingStageCell`, `directorStageCell`, `currentCycle`, `latestJournalRejection` из `plan-approval`; `getPlanState` из `plan-store` (уже импортирован).
- Produces: обновлённый `buildPlanCsv` — дальнейших потребителей нет.

- [ ] **Шаг 1: Импорты**

Добавить в `promo-export.ts`:

```ts
import {
  currentCycle,
  directorStageCell,
  latestJournalRejection,
  marketingStageCell,
  planRowLifecycle,
  type PlanRowLifecycle,
} from "./plan-approval";
```

- [ ] **Шаг 2: Единицы в `stageLabel`**

Заменить существующий хелпер (`promo-export.ts:56`, сейчас `function stageLabel(status: PlanStageStatus, overdueDays?: number): string`) на вариант с необязательным третьим параметром — вызовы без `unit` сохраняют прежнее поведение, кроме явной подписи единицы:

```ts
function stageLabel(
  status: PlanStageStatus,
  overdueDays?: number,
  unit: "cal" | "work" = "work"
): string {
  const u = unit === "cal" ? "кал. дн." : "раб. дн.";
  if (status === "waiting")
    return overdueDays
      ? `Ожидает согласования (просрочка +${overdueDays} ${u})`
      : "Ожидает согласования";
  if (status === "onTime") return "В срок";
  return `Просрочка +${overdueDays ?? 0} ${u}`;
}
```

`PlanStageStatus` уже импортирован в этом файле — новых импортов типов не требуется.

- [ ] **Шаг 3: Читать журнал в `buildPlanCsv`; статус строки — через общую деривацию**

Внутри `buildPlanCsv`, после `const state = getPlanState();`:

```ts
  const journalOf = (id: string) => state?.rowJournal?.[id];
```

Заменить `lifecycleOf` целиком, чтобы состав состояний строки жил в **одном** месте (`planRowLifecycle` из Task 2), а не дублировался между таблицей и выгрузкой:

```ts
  const LIFECYCLE_LABEL: Record<PlanRowLifecycle, string> = {
    draft: "Черновик",
    sent: "Отправлено",
    approved: "Согласовано",
    rejected: "Отклонено",
    "removal-pending": "Удаление на согласовании",
  };

  const lifecycleOf = (id: string): string => {
    const d = state?.decisions?.[id];
    // Та же композиция, что у `rowDecision` в PlanMode: отклонение любого этапа
    // важнее согласования, «Согласовано» — только у утверждённого плана.
    const decision =
      d?.kd === "rejected" || d?.od === "rejected"
        ? ("rejected" as const)
        : state?.planStatus === "Утверждён" && sendOf(id) === "sent"
          ? ("approved" as const)
          : undefined;
    return LIFECYCLE_LABEL[
      planRowLifecycle({ journal: journalOf(id), send: sendOf(id), decision })
    ];
  };
```

- [ ] **Шаг 4: Колонка «Цикл согласования» и данные из деривации**

Заменить заголовок и тело:

```ts
  const header = [
    "Код акции",
    "Статус строки",
    "Цикл согласования",
    "Тип акции",
    "Наименование акции",
    "Период (начало)",
    "Период (окончание)",
    "Маркетинг: ознакомление",
    "Маркетинг: отправка на согл.",
    "Маркетинг: статус",
    "КД: согласование",
    "КД: статус",
    "ОД: согласование",
    "ОД: статус",
    "Отклонил",
    "Роль согласующего",
    "Дата и время отклонения",
    "Комментарий отклонения",
  ];
  const out = rows.map((r) => {
    const j = journalOf(r.id);
    const ref = { id: r.id, startDate: r.startDate };
    const m = marketingStageCell(ref, j);
    const kd = directorStageCell("kd", ref, j);
    const od = directorStageCell("od", ref, j);
    const cyc = currentCycle(j);

    // Отклонение: журнал — источник; legacy-слайс читается, когда журнала нет.
    const fromJournal = latestJournalRejection(j);
    const legacy = (state?.rejectionLog?.[r.id] ?? []).find(
      (e) => e.kind !== "return"
    );
    const rejection = fromJournal
      ? {
          by: fromJournal.by,
          role: fromJournal.role,
          at: fromJournal.at,
          comment: fromJournal.comment ?? "",
        }
      : legacy;
    const rejectionAt = rejection ? new Date(rejection.at) : undefined;

    return [
      formatPromoNo(r.id),
      lifecycleOf(r.id),
      cyc ? String(cyc.no) : "—",
      r.type,
      r.name,
      fmtDate(r.startDate),
      fmtDate(r.endDate),
      m?.reviewedAt ? fmtDateTime(m.reviewedAt) : "—",
      m?.sentAt ? fmtDateTime(m.sentAt) : "—",
      m ? stageLabel(m.status, m.overdueDays, m.unit) : "—",
      kd?.decidedAt ? fmtDateTime(kd.decidedAt) : "—",
      kd ? stageLabel(kd.status, kd.overdueDays, kd.unit) : "—",
      od?.decidedAt ? fmtDateTime(od.decidedAt) : "—",
      od ? stageLabel(od.status, od.overdueDays, od.unit) : "—",
      rejection?.by ?? "—",
      rejection?.role ?? "—",
      rejectionAt && !Number.isNaN(rejectionAt.getTime())
        ? fmtDateTime(rejectionAt)
        : "—",
      rejection?.comment || "—",
    ];
  });
```

- [ ] **Шаг 5: Собрать**

Run: `corepack pnpm --filter promo build`
Expected: exit 0.

- [ ] **Шаг 6: Типовая проверка чтением**

- длина `header` **равна** длине каждой строки массива `out` — пересчитать: 18 и 18;
- `LIFECYCLE_LABEL` исчерпывает `PlanRowLifecycle` (все пять состояний); при добавлении шестого сюда компилятор не пожалуется — сверить вручную по объявлению типа в `plan-approval.ts`;
- `PlanExportRow` содержит `startDate`/`endDate` типа `Date` (нужны для `PlanRowRef` и `fmtDate`) — сверить объявление типа;
- `getPlanApproval` из этого файла больше не вызывается для колонок этапов; если он остался нужен только для `sendOf`, импорт сохранить, иначе убрать;
- в `promo-export.ts` не возникло циклического импорта: `plan-approval` тянет `promo-mock-data` и типы `plan-store`, но не `promo-export`.

- [ ] **Шаг 7: Проверка выгрузки**

В dev-режиме на вкладке «План акций» нажать «Экспорт» → CSV. Открыть файл: есть колонка «Цикл согласования»; у строки, согласованной в текущей сессии, колонки «КД: согласование»/«КД: статус» заполнены датой и «В срок»; у строки с запросом на удаление «Статус строки» = «Удаление на согласовании».

- [ ] **Шаг 8: Коммит**

```bash
git add Promo/src/lib/promo-export.ts
git commit -F - <<'EOF'
feat(promo): Волна 4 (T8) — CSV плана из журнала согласования

buildPlanCsv читает этапы через ту же деривацию, что таблица и панель
(сид — fallback внутри неё), добавлена колонка «Цикл согласования», статус
«Удаление на согласовании» и отклонение из журнала с fallback на legacy-слайс.
Подписи статусов получили единицу срока.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 9: Финальная проверка и документация

**Files:**
- Modify: `docs/AI_CONTEXT.md`, `HISTORY.md`, `CLAUDE.md`, `Promo/CLAUDE.md`, `tasks/lessons.md`

**Interfaces:**
- Consumes: результат задач 1–8.
- Produces: обновлённая документация; дальнейших потребителей нет.

- [ ] **Шаг 1: Обе сборки**

```bash
corepack pnpm --filter promo build
corepack pnpm --filter dashboard build
```
Expected: обе — exit 0. Dashboard обязателен: он делит `packages/*`, и зелёная сборка Promo не доказывает отсутствие регресса.

- [ ] **Шаг 2: Проверка чистого старта**

В devtools выполнить `localStorage.removeItem('promo:plan-state')` и перезагрузить `/short-calendar` → «План акций». Ожидается: таблица выглядит как до Волны 4 (сид-даты и статусы), с единственным отличием — подписи единиц срока, метка цикла отсутствует, «История» показывает пустое состояние.

- [ ] **Шаг 3: Матричный проход по критериям приёмки**

Пройти список §13 спеки целиком, в ролях Директор маркетинга / КД / ОД, на 1440 и 390 px, в светлой и тёмной темах. Каждый невыполненный пункт — дефект, а не «доработка потом».

- [ ] **Шаг 4: `/code-review`**

Запустить ревью изменений ветки. Особое внимание — швам, которые не видны изнутри одной задачи:
- совпадают ли значения этапов в таблице, в панели и в CSV для одной и той же строки;
- не осталось ли места, где отклонение пишется и в журнал, и в `rejectionLog`;
- не блокируют ли строки с активным запросом на удаление продвижение плана.

- [ ] **Шаг 5: Обновить документацию**

- `HISTORY.md` — новая запись сверху: что вошло в Волну 4, номера коммитов, ограничения мока.
- `docs/AI_CONTEXT.md` — новая строка `> Last updated:` с переносом прежней в `> Prev:`; отметить, что остались Волны 5 и 6.
- `CLAUDE.md` (корневой) и `Promo/CLAUDE.md` — раздел про «10-ю часть»: Волна 4 complete, перечень новых файлов и поведения.
- `tasks/lessons.md` — новая секция с датой и уроками волны (кандидаты: пер-строчный гейт вместо агрегатного статуса; синхронный расчёт решения по удалению; единицы срока как часть контракта ячейки).

- [ ] **Шаг 6: Коммит документации**

```bash
git add HISTORY.md docs/AI_CONTEXT.md CLAUDE.md Promo/CLAUDE.md tasks/lessons.md
git commit -F - <<'EOF'
docs(promo): doc_sync — «10-я часть» Волна 4 (циклы согласования плана и удаление)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
```

---

## Ограничения мока (зафиксировать в документации)

- Журнал живёт в `localStorage` конкретного браузера — общего бэкенда нет.
- «Кто отправил / согласовал / отклонил» = ФИО вошедшего пользователя, роль = активная роль god-mode-переключателя.
- «Озн.» (ознакомление директора маркетинга) живого источника не имеет — берётся только из сида.
- У сид-строк вид решения (`approved`/`rejected`) не хранится: этап с датой и статусом ≠ «waiting» считается согласованным.
- Вкладка «Сроки по плану» в `/audit` остаётся сид-производной — она не читает журнал.
