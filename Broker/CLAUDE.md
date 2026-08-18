# Client Broker

Operator-facing scoring application used in-store: after a client applies for BNPL/rassrochka, the operator picks a bank offer and walks the client through that bank's flow. Originated as a new sub-project bootstrapped in this monorepo (2026-08-17), starting with the **Alif Nasiya** flow; reworked end-to-end on 2026-08-18 per the designer's ТЗ for the missing Alif-integration screens.

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For the design spec (18.08 rework) see [docs/superpowers/specs/2026-08-18-broker-alif-rework-tz-design.md](../docs/superpowers/specs/2026-08-18-broker-alif-rework-tz-design.md). The original bootstrap spec, [docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md](../docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md), is kept as history — its route/screen layout was superseded by the rework below.
> ТЗ source: **`TZ-Dizayner-Alif-UI.md`** — designer's brief for the screens missing from the Alif integration (18.08.2026, based on Alif API backend documentation), external to this repo (not checked in).
> Figma: `https://www.figma.com/design/gJWaXJEtxG06aAOhpIa11L/Texnomart-Broker` (canvas «Client Broker»), frames 8–10 (Верификация клиента + карты), 11 (Проверка MyID — camera), 27/32/46 (банки), 39/40 (доп. данные), 41/42 (финал — two states).

## Scope

Only the **Alif** bank branch is built (6 routes, see below). Login/PIN, real MyID/ML face verification, an in-app PDF previewer, other banks' branches, real API integration, «Подбор товара», and dark theme are out of scope — the mock enters directly at the «Верификация клиента» step with a seeded client and one pre-confirmed card. Clicking «Оформить» on a non-Alif bank shows a toast: «В прототипе реализован сценарий Alif».

## Commands

```
pnpm install       # install dependencies (from repo root)
pnpm dev:broker     # start dev server (Vite)
pnpm build:broker   # production build
```

## Project Structure

```
Broker/
  public/
    contract-mock.pdf                 # Mock signed-contract PDF (download + "Посмотреть договор")
  src/
    main.tsx                          # Entry point
    assets/
      demo-photo.jpg                  # Bundled fallback photo for the MyID step (no real camera access)
    app/
      App.tsx                         # RouterProvider + ScoringFlowProvider + Toaster
      routes.tsx                      # All routes (createBrowserRouter) + RequireStage guards
      scoring-flow.tsx                # ScoringFlowProvider — flow state in sessionStorage
      components/
        shell/
          BrokerShell.tsx             # Own top-bar shell (NOT the shared AppShell — operator terminal layout) + Outlet
          ScoringStepper.tsx          # Constant 5-step stepper (no branching)
          ActionRail.tsx              # Floating right-side action rail (new tab / send to Telegram / end scoring)
        scoring/
          VerificationPage.tsx        # Screen 1 — client data + card list/add + OTP modal host
          CardOtpDialog.tsx           # Card-confirmation OTP modal (hosts OtpPanel, variant="card")
          MyIdPhotoPage.tsx           # Screen 2 — camera capture (oval guide) + photo validation + MyID check
          useCameraCapture.ts         # getUserMedia lifecycle hook (start/stop/capture → Blob)
          BanksPage.tsx               # Screen 3 — bank offer cards + Alif waiting-for-limit state
          BankCard.tsx                # Single bank offer card (tenor chips, limit panel, «Оформить»)
          ClientInfoBand.tsx          # Seeded client info strip (ФИО / телефон / ПИНФЛ / карта)
        alif/
          HoldPage.tsx                # Screen 3b — prepayment hold (only reached when prepayment > 0)
          AdditionalDataPage.tsx      # Screen 4 — доверительные лица + дата списания
          InstallmentInfoPage.tsx     # Screen 5 — two-state final screen (pending → credit OTP → green/contract)
          CreditOtpDialog.tsx         # Credit-confirmation OTP modal (hosts OtpPanel, variant="credit")
          OtpPanel.tsx                # Shared unstyled OTP content (chip + subtitle + children + code + resend + CTA) — hosted by both dialogs, no card wrapper
    lib/
      broker-mock-data.ts             # Seeded client/card, banks, order, all timer/threshold/OTP constants, contract-number generator
    styles/
      index.css                       # CSS entry (imports fonts, tailwind, theme)
      tailwind.css                    # Tailwind v4 config
      theme.css                       # Design tokens (CSS variables) — light only, no dark mode yet
      fonts.css                       # Inter font import
      globals.css                     # Global overrides
```

## Implemented Routes

| Route | Component | Stepper step | Guard (`RequireStage`) |
|---|---|---|---|
| `/` | — | — | redirect → `/scoring/verification` |
| `/scoring/verification` | VerificationPage | 1 «Верификация клиента» | none |
| `/scoring/myid` | MyIdPhotoPage | 2 «Проверка MyID» | ≥1 confirmed card |
| `/scoring/banks` | BanksPage | 3 «Выбор рассрочки» | `myidDone` |
| `/scoring/alif/hold` | HoldPage | 3 «Выбор рассрочки» | `alifSelected` |
| `/scoring/alif/details` | AdditionalDataPage | 4 «Дополнительные данные» | `alifSelected && (prepayment === 0 || holdStatus === "confirmed")` |
| `/scoring/alif/info` | InstallmentInfoPage | 5 «Информация по рассрочке» | `additionalData && (prepayment === 0 || holdStatus === "confirmed" || creditConfirmed)` |
| `*` | — | — | redirect → `/scoring/verification` |

Every guard failure redirects to `/scoring/verification` (not to an intermediate step) — direct deep-links without state fall all the way back to the start. The seeded Alif `prepayment` is `1_000_000` (non-zero), so `/scoring/alif/hold` is always on the path to Alif; the `prepayment === 0` guard clause exists for a future bank/seed where the hold step is skippable, but is not currently exercised by any seed. The `info` guard additionally accepts `creditConfirmed` so State B (already-finalized) never gets bounced back mid-render, and it re-checks `holdStatus === "confirmed"` (not just `additionalData`) so that cancelling a hold after details were already filled in a prior pass can't leave `/scoring/alif/info` reachable without a confirmed hold — a fresh `holdHold()`/`holdConfirm()` cycle is required.

**Deleted from the 17.08 build** (do not reintroduce): routes `/scoring/alif/card`, `/scoring/alif/confirm`, `/scoring/alif/success`; components `CardAttachPage.tsx`, `CreditConfirmPage.tsx`, `SuccessPage.tsx`, `OtpStepCard.tsx`; state field `cardAttached` (replaced by `cards[].confirmed`); the 7-step Alif-expanded stepper branch (stepper is a flat constant 5 steps now).

## Flow (per screen)

1. **`/scoring/verification` — Верификация клиента.** Left: read-only seeded client fields (телефон / серия и номер паспорта / ПИНФЛ). Right: card list (seed: one card, already `confirmed`) + «Номер карты»/«Срок карты» inputs + green «Добавить». Adding a card validates, in order: duplicate mask → «Эта карта уже добавлена»; number ending `0000` → «Карта не найдена. Проверьте номер карты»; ending `9999` → AlertDialog «Карта заблокирована» («Лимит исчерпан на привязку. Карта заблокирована для привязки.»), no OTP shown; otherwise the card is added (unconfirmed) and `CardOtpDialog` opens. The OTP modal (`OtpPanel variant="card"`) asks for a 6-digit SMS code; `000000` fails with «Неверный код. Проверьте SMS и попробуйте ещё раз»; any other code confirms the card (toast «Карта подтверждена»). Clicking an unconfirmed card row reopens its OTP modal. «Продолжить» is enabled once ≥1 card is confirmed → `/scoring/myid`.

2. **`/scoring/myid` — Проверка MyID.** Camera capture via `getUserMedia` (hint chips «Держите положение лица» / «Не закрывайте лицо» / «Хорошее освещение», an oval face-positioning guide once the stream is live). Phases: `camera → preview → invalid|checking → done`. «Сделать снимок» captures a JPEG frame; «Переснять» / «Использовать фото» decide the preview. Validation (`validatePhoto`): MIME must be `image/jpeg` or `image/png` and size must be **300 КБ – 1,5 МБ**; failing shows «Фото не соответствует требованиям (размер … КБ, нужно 300 КБ – 1,5 МБ)» + «Переснять». Passing photo → `checking` phase (**~2,5 с** mock MyID check, `MYID_CHECK_DELAY_MS`) → `done` («Личность подтверждена») → «Продолжить» → `/scoring/banks`. If the camera is denied/unavailable, a «Камера недоступна» placeholder offers «Использовать демо-фото» (bundled `assets/demo-photo.jpg`, forced to `image/jpeg` MIME). «Вернуться к предыдущему шагу» → `/scoring/verification` (hidden during the `checking` phase only).

3. **`/scoring/banks` — Выбор рассрочки.** `ClientInfoBand` (seeded ФИО/телефон/ПИНФЛ/карта) + two `BankCard`s (Alif, Iman). Alif starts in a `pending` state («Рассчитывается…», skeleton rows) and flips to ready after **~6 с** (`ALIF_LIMIT_DELAY_MS`), mocking an async backend callback; Iman returns its limit instantly (`instantLimit: true`). «Оформить» on Alif calls `selectAlif(tenor)` then navigates to `/scoring/alif/hold` if `prepayment > 0` (always true for the current seed) or straight to `/scoring/alif/details` otherwise. «Оформить» on Iman just shows the out-of-scope toast.

4. **`/scoring/alif/hold` — Предоплата по рассрочке** (only reached because Alif's seeded `prepayment > 0`; step 3 in the stepper, no dedicated step of its own; if `prepayment === 0` the page redirects straight to `/scoring/alif/details` on mount — future-proofing, not exercised by the current seed). Shows the prepayment amount (**1 000 000 сум**), the debit card (first confirmed card, masked `9860 •••• 1296`), and an explanation that funds are held then charged on credit confirmation. «Подтвердить удержание» → `holdHold()` → `held` spinner state («Предоплата удерживается…») → after **~2 с** (`PREPAYMENT_HOLD_DELAY_MS`) auto-`holdConfirm()` → `confirmed` badge + «Продолжить» → `/scoring/alif/details`. «Отменить холд» — available up to finalization: hidden while `held`, and hidden once `creditConfirmed` (a back-navigation after the flow is finalized can no longer cancel the hold) → `holdCancel()` + toast «Холд отменён» + back to `/scoring/banks`; `alifSelected`/`tenor` are **not** reset, so the bank stays selected.

5. **`/scoring/alif/details` — Дополнительные данные.** Unchanged in behavior from the 17.08 build: Доверительное лицо 1 (required: phone + вид родства) + Доверительное лицо 2 (optional, both-or-neither) + дата списания (defaults to +1 month). «Продолжить» → `saveAdditionalData()` → `/scoring/alif/info`. «Вернуться к предыдущему шагу» → `/scoring/alif/hold`.

6. **`/scoring/alif/info` — Информация по рассрочке** (two-state final screen, replaces the old `SuccessPage`). Left card: bank summary (tenor from `state.tenor`, limit, предоплата + holdStatus note, contract number once confirmed). Right panel — **State A** (`!creditConfirmed`): neutral panel «Проверьте условия и завершите оформление» + «Завершить скоринг» → opens `CreditOtpDialog` (`OtpPanel variant="credit"`, chip «Подтверждение кредита», order/tenor/prepayment summary, amber callout «Это другой код — не тот, что вы вводили при подтверждении карты», OTP `000000` fails the same way as step 1's modal). Success → `confirmCredit()` (stamps `contractNo` via `makeContractNo()` and `oneCOrderNo`) → **State B** (green): «Кредит оформлен! Договор №… подписан.» + «Заявка №235662235 в базе 1С Texnomart создана автоматически…» + «Скачать договор (PDF)» (downloads `public/contract-mock.pdf` as `Договор_<contractNo>.pdf`) + «Посмотреть договор» (`target="_blank"`) + green «Завершить скоринг» → `resetFlow()` + navigate to `/scoring/verification`.

The floating `ActionRail` (right edge, ≥lg only) is available on every screen: «Завершить скоринг» opens an AlertDialog confirmation and, on confirm, does the same `resetFlow()` + navigate-to-verification as the final screen's green button.

## State — `ScoringFlowProvider`

`Broker/src/app/scoring-flow.tsx` — React context backed by **`sessionStorage`** under the key **`broker:scoring-flow`**. The flow survives a page reload but resets on a new session (tab/browser close). `resetFlow()` clears the key and returns to `INITIAL` (cards reseed to the one pre-confirmed `SEED_CARD`).

```ts
interface AttachedCard { mask: string; expiry: string; confirmed: boolean }
interface ScoringFlowState {
  cards: AttachedCard[]                          // seed: one confirmed card
  photoDone: boolean                             // MyID photo passed validation
  myidDone: boolean                              // MyID check finished
  alifLimitStatus: "pending" | "ready"
  alifSelected: boolean
  tenor?: number
  holdStatus: "none" | "held" | "confirmed" | "cancelled"
  additionalData?: AdditionalData
  creditConfirmed: boolean
  contractNo?: string
  oneCOrderNo?: string
}
```

Actions: `markAlifLimitReady()`, `selectAlif(tenor)`, `addCard(mask, expiry)`, `confirmCard(mask)`, `removeCard(mask)`, `setPhotoDone()`, `setMyidDone()`, `holdHold()`, `holdConfirm()`, `holdCancel()`, `saveAdditionalData(data)`, `confirmCredit()`, `resetFlow()`.

## Mock Conventions

All magic values live in `src/lib/broker-mock-data.ts`.

- **OTP failure code**: `000000` (`OTP_FAIL_CODE`) — used identically by both OTP modals (card confirmation on step 1, credit confirmation on step 5, hosted by the shared `OtpPanel`); any other 6-digit code succeeds. **OTP resend timer**: `OTP_RESEND_SECONDS = 60`.
- **Card validation** (`VerificationPage`, before the OTP modal ever opens): number ending `CARD_NOT_FOUND_SUFFIX = "0000"` → «Карта не найдена»; ending `CARD_BLOCKED_SUFFIX = "9999"` → AlertDialog «Карта заблокирована» («Лимит исчерпан на привязку. Карта заблокирована для привязки.»), no OTP step.
- **Seeded card**: `SEED_CARD = { mask: "9860 3569 7266 1296", expiry: "11/29" }` — pre-confirmed in `INITIAL` state.
- **Seeded client**: `BROKER_CLIENT` (Артем Борисов, `+998 94 983 98 48`, ПИНФЛ `2116358415458`, паспорт `AD 1276543`, `cardMask: "9860 **** **** 1296"` — kept in sync with `SEED_CARD` for `ClientInfoBand` on `/scoring/banks`).
- **Alif limit delay**: `ALIF_LIMIT_DELAY_MS = 6000` (~6 с) — Alif's `BankCard` starts `pending` and flips to `ready`; Iman is `instantLimit: true` for contrast.
- **Prepayment hold delay**: `PREPAYMENT_HOLD_DELAY_MS = 2000` (~2 с) — `HoldPage`'s `held → confirmed` auto-transition.
- **MyID check delay**: `MYID_CHECK_DELAY_MS = 2500` (~2,5 с) — `MyIdPhotoPage`'s `checking → done` transition.
- **Photo requirements**: `PHOTO_MIN_BYTES = 300_000`, `PHOTO_MAX_BYTES = 1_500_000` (300 КБ – 1,5 МБ), MIME `image/jpeg`/`image/png` — enforced by `validatePhoto()` in `MyIdPhotoPage.tsx`.
- **Bank seeds** (`BANKS`): Alif — `limit: 8_546_000`, `prepayment: 1_000_000`, `tenors: [2,3,6,9,12,18,24,36]`; Iman — `limit: 6_120_000`, `prepayment: 0`, `instantLimit: true`. `ORDER = { amount: 10_000_000, tenor: 6 }` is the shared order summary shown in the credit-confirmation modal.
- **Contract/order numbers**: `makeContractNo()` generates `ALF-2026-XXXXXX` on credit confirmation; `ONE_C_ORDER_NO = "235662235"` is the fixed seeded 1С order number (as in the Figma design).
- **Contract PDF**: `InstallmentInfoPage`'s green state serves the static mock `public/contract-mock.pdf`, both as a download (`Договор_<№>.pdf`) and as a `target="_blank"` view link — no in-app previewer is built.
- **`ClientInfoBand`**: renders only on `/scoring/banks` — deliberate; the other screens' spec sections don't include it.
- **Bank logos**: colored letter-square fallbacks (`Bank.brandColor` + `Bank.initial`) — the Figma SVG export isn't used.
- **Camera**: `useCameraCapture` (`getUserMedia` → video → canvas → JPEG blob at quality 0.92) always stops its `MediaStream` tracks on unmount/`stop()`, and guards against a permission promise resolving after a newer `start()`/`stop()` call (generation counter) so a stale stream never gets attached.

## Note — Photo Requirements May Change

⚠️ The 18.08 ТЗ (`TZ-Dizayner-Alif-UI.md`) states the MyID photo requirements (format, 300 КБ – 1,5 МБ size range) may change once Alif/MyID's actual API response is confirmed. The mock is built to the current spec text. **If/when these change, only `Broker/src/app/components/scoring/MyIdPhotoPage.tsx` (plus the two `PHOTO_MIN_BYTES`/`PHOTO_MAX_BYTES` constants in `broker-mock-data.ts`) needs editing** — no other screen depends on the photo validation thresholds.

## Assumption — Additional Data Form Composition

The additional-data form's field composition (Доверительное лицо 1 required + Доверительное лицо 2 optional, each with phone + вид родства; дата списания оплаты) was originally taken from the Figma screen («4-step: Additional Info») because the earlier PM scenario (`Alif_PM_Scenario_RU.md`, 17.08 build) marked it «уточнить у бекенда». The 18.08 ТЗ explicitly confirms this screen «напрямую соответствует Alif additional-data → relations» and should be reused as-is — the component (`AdditionalDataPage.tsx`) was carried over unchanged.

## When Adding New Pages

1. Add the route (+ any `RequireStage` guard, extending the `Stage` union in `routes.tsx`) in `src/app/routes.tsx`
2. Create the component under `src/app/components/<feature>/`
3. Follow Patterns A–K (see root CLAUDE.md) — this app does not use the shared `AppShell`; extend `BrokerShell`/`ScoringStepper` instead (the stepper is a flat 5-step constant — do not reintroduce branching)
4. Extend `ScoringFlowState` in `scoring-flow.tsx` for any new persisted flow data
5. Use mock data from `src/lib/broker-mock-data.ts` or extend it
6. All text in Russian
7. Use `@texnomart/ui/` for primitives (Button, Card, InputOTP, Dialog, etc.) — open modals with a plain `<button>`/`Button` trigger, not `asChild` Radix triggers (a known off-screen-menu gotcha elsewhere in this monorepo)
8. Mobile responsive — test at sm/md/lg breakpoints
