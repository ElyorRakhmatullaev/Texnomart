# Client Broker

Operator-facing scoring application used in-store: after a client applies for BNPL/rassrochka, the operator picks a bank offer and walks the client through that bank's flow. Originated as a new sub-project bootstrapped in this monorepo (2026-08-17), starting with the **Alif Nasiya** flow; reworked end-to-end on 2026-08-18 per the designer's ТЗ for the missing Alif-integration screens; reworked again the same day (PM verbal clarification, second iteration) to move the whole Alif branch off its own routes and into a single popup hosted on «Выбор рассрочки».

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For the popup rework (18.08, second iteration — current architecture) see [docs/superpowers/specs/2026-08-18-broker-alif-checkout-popup-design.md](../docs/superpowers/specs/2026-08-18-broker-alif-checkout-popup-design.md). Its predecessor, [docs/superpowers/specs/2026-08-18-broker-alif-rework-tz-design.md](../docs/superpowers/specs/2026-08-18-broker-alif-rework-tz-design.md), is kept as history — its step *content* (hold, additional data, credit OTP, success/contract) still stands, only the carrier changed (route pages → dialog phases). The original bootstrap spec, [docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md](../docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md), is kept as history too.
> ТЗ source: **`TZ-Dizayner-Alif-UI.md`** — designer's brief for the screens missing from the Alif integration (18.08.2026, based on Alif API backend documentation), external to this repo (not checked in).
> Figma: `https://www.figma.com/design/gJWaXJEtxG06aAOhpIa11L/Texnomart-Broker` (canvas «Client Broker»), frames 8–10 (Верификация клиента + карты), 11 (Проверка MyID — camera), 27/32/46 (банки — frame 32 is the popup's «Подтвердить выбор предложения?» confirm phase), 39/40 (доп. данные), 41/42 (финал — two states). A second page **«Мок 18.08 — Alif (из кода)»** (node `420-4309`) holds 14 frames captured pixel-perfect from the running mock (verification + card-OTP modal states, MyID photo states, banks pending/ready, all 5 popup phases) — editable layers, not linked to library components.

## Scope

Only the **Alif** bank branch is built. There are just **4 routes** (see below) — the entire Alif branch (hold → additional data → credit OTP → success) lives as phases of a single popup (`AlifCheckoutDialog`) hosted on `/scoring/banks`, not as its own routes. Login/PIN, real MyID/ML face verification, an in-app PDF previewer, other banks' branches, real API integration, «Подбор товара», and dark theme are out of scope — the mock enters directly at the «Верификация клиента» step with a seeded client and one pre-confirmed card. Clicking «Оформить» on a non-Alif bank shows a toast: «В прототипе реализован сценарий Alif».

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
      routes.tsx                      # All routes (createBrowserRouter) + RequireStage guards (only steps 1–2 gated; Alif branch has no routes)
      scoring-flow.tsx                # ScoringFlowProvider — flow state in sessionStorage + checkoutPhaseOf() phase derivation
      components/
        shell/
          BrokerShell.tsx             # Own top-bar shell (NOT the shared AppShell — operator terminal layout) + Outlet
          ScoringStepper.tsx          # Constant 5-step stepper; highlights by popup phase (checkoutPhaseOf) when checkoutOpen on /scoring/banks
          ActionRail.tsx              # Floating right-side action rail (new tab / send to Telegram / end scoring)
        scoring/
          VerificationPage.tsx        # Screen 1 — client data + card list/add + OTP modal host
          CardOtpDialog.tsx           # Card-confirmation OTP modal (hosts OtpPanel, variant="card")
          MyIdPhotoPage.tsx           # Screen 2 — camera capture (oval guide) + photo validation + MyID check
          useCameraCapture.ts         # getUserMedia lifecycle hook (start/stop/capture → Blob)
          BanksPage.tsx               # Screen 3 — bank offer cards + Alif waiting-for-limit state; hosts <AlifCheckoutDialog/>
          BankCard.tsx                # Single bank offer card (tenor chips, limit panel, «Оформить»; «✓ Оформлена» badge once creditConfirmed)
          ClientInfoBand.tsx          # Seeded client info strip (ФИО / телефон / ПИНФЛ / карта)
        checkout/
          AlifCheckoutDialog.tsx      # Host Dialog for the whole Alif branch — derives the active phase from flow state (checkoutPhaseOf), 600ms hold→details lag
          ConfirmPhase.tsx            # Phase "confirm" — «Подтвердить выбор предложения?» (Figma frame 32)
          HoldPhase.tsx               # Phase "hold" — prepayment hold (content moved from the deleted HoldPage)
          DetailsPhase.tsx            # Phase "details" — доверительные лица + дата списания (content moved from the deleted AdditionalDataPage)
          CreditOtpPhase.tsx          # Phase "otp" — hosts OtpPanel variant="credit" (content moved from the deleted CreditOtpDialog)
          SuccessPhase.tsx            # Phase "success" — green final state (content moved from the deleted InstallmentInfoPage's green state)
        alif/
          OtpPanel.tsx                # Shared unstyled OTP content (chip + subtitle + children + code + resend + CTA) — hosted by CardOtpDialog (step 1) and CreditOtpPhase (popup), no card wrapper
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
| `/scoring/banks` | BanksPage (hosts `AlifCheckoutDialog`) | 3–5, see phase table below | `myidDone` |
| `*` | — | — | redirect → `/scoring/verification` |

Only 4 routes total — the `Stage` union in `routes.tsx` is now just `"myid" | "banks"`. Every guard failure redirects to `/scoring/verification` (not to an intermediate step) — direct deep-links without state fall all the way back to the start. The old `/scoring/alif/hold`, `/scoring/alif/details`, `/scoring/alif/info` routes and their guards are gone: the whole Alif branch (hold → additional data → credit OTP → success) is now phases of a single popup (`AlifCheckoutDialog`) opened from `/scoring/banks` — see «Alif checkout popup» below. The URL never changes while the popup is open.

**Deleted from the 17.08 build** (do not reintroduce): routes `/scoring/alif/card`, `/scoring/alif/confirm`, `/scoring/alif/success`; components `CardAttachPage.tsx`, `CreditConfirmPage.tsx`, `SuccessPage.tsx`, `OtpStepCard.tsx`; state field `cardAttached` (replaced by `cards[].confirmed`); the 7-step Alif-expanded stepper branch (stepper is a flat constant 5 steps now).

**Deleted from the 18.08 popup rework** (second iteration; do not reintroduce): routes `/scoring/alif/hold`, `/scoring/alif/details`, `/scoring/alif/info` and their `RequireStage` guard clauses; components `HoldPage.tsx`, `AdditionalDataPage.tsx`, `InstallmentInfoPage.tsx`, `CreditOtpDialog.tsx` (content carried over, with minimal adaptation, into `checkout/HoldPhase.tsx`, `checkout/DetailsPhase.tsx`, `checkout/SuccessPhase.tsx`, `checkout/CreditOtpPhase.tsx` respectively — no page container/back-link, footer buttons instead). The Alif branch has zero routes of its own now.

## Flow (per screen)

1. **`/scoring/verification` — Верификация клиента.** Left: read-only seeded client fields (телефон / серия и номер паспорта / ПИНФЛ). Right: card list (seed: one card, already `confirmed`) + «Номер карты»/«Срок карты» inputs + green «Добавить». Adding a card validates, in order: duplicate mask → «Эта карта уже добавлена»; number ending `0000` → «Карта не найдена. Проверьте номер карты»; ending `9999` → AlertDialog «Карта заблокирована» («Лимит исчерпан на привязку. Карта заблокирована для привязки.»), no OTP shown; otherwise the card is added (unconfirmed) and `CardOtpDialog` opens. The OTP modal (`OtpPanel variant="card"`) asks for a 6-digit SMS code; `000000` fails with «Неверный код. Проверьте SMS и попробуйте ещё раз»; any other code confirms the card (toast «Карта подтверждена»). Clicking an unconfirmed card row reopens its OTP modal. «Продолжить» is enabled once ≥1 card is confirmed → `/scoring/myid`.

2. **`/scoring/myid` — Проверка MyID.** Camera capture via `getUserMedia` (hint chips «Держите положение лица» / «Не закрывайте лицо» / «Хорошее освещение», an oval face-positioning guide once the stream is live). Phases: `camera → preview → invalid|checking → done`. «Сделать снимок» captures a JPEG frame; «Переснять» / «Использовать фото» decide the preview. Validation (`validatePhoto`): MIME must be `image/jpeg` or `image/png` (size is not checked); failing shows «Фото не соответствует требованиям (нужен формат PNG или JPG)» + «Переснять». Passing photo → `checking` phase (**~2,5 с** mock MyID check, `MYID_CHECK_DELAY_MS`) → `done` («Личность подтверждена») → «Продолжить» → `/scoring/banks`. If the camera is denied/unavailable, a «Камера недоступна» placeholder offers «Использовать демо-фото» (bundled `assets/demo-photo.jpg`, forced to `image/jpeg` MIME). «Вернуться к предыдущему шагу» → `/scoring/verification` (hidden during the `checking` phase only).

3. **`/scoring/banks` — Выбор рассрочки.** `ClientInfoBand` (seeded ФИО/телефон/ПИНФЛ/карта) + two `BankCard`s (Alif, Iman). Alif starts in a `pending` state («Рассчитывается…», skeleton rows) and flips to ready after **~6 с** (`ALIF_LIMIT_DELAY_MS`), mocking an async backend callback; Iman returns its limit instantly (`instantLimit: true`). «Оформить» on Alif calls `selectAlif(tenor)` then `openCheckout()` — **the URL does not change**; the rest of the Alif branch (steps 3–5 of the stepper) plays out entirely inside `AlifCheckoutDialog`, a popup hosted right here on `/scoring/banks` (see below). «Оформить» on Iman just shows the out-of-scope toast. Once `creditConfirmed`, Alif's `BankCard` shows a green «✓ Оформлена» badge (instead of «✓ Одобрена») but the «Оформить» button stays enabled — clicking it again reopens the popup directly on its `success` phase (see «Reopen at success» below).

### Alif checkout popup (`AlifCheckoutDialog`, hosted on `/scoring/banks`)

A single Radix `Dialog` (`Broker/src/app/components/checkout/AlifCheckoutDialog.tsx`) is the phase-machine host for the whole Alif branch. It renders one of five phase components (`checkout/*Phase.tsx`) — each is the former route page's content, carried over with the page container/back-link stripped and its primary action moved into a `DialogFooter`.

**Phase derivation.** The active phase is **not stored** — it is derived on every render from `checkoutPhaseOf(state, alifPrepayment)` in `scoring-flow.tsx`, checked top-down so the most-advanced state always wins:

| Order | Condition | Phase | Content (former route/component) | Stepper step |
|---|---|---|---|---|
| 1 | `state.creditConfirmed` | `success` | green final state (former `InstallmentInfoPage` green state) — «Кредит оформлен! Договор №… подписан.» + «Заявка №235662235 в базе 1С Texnomart…» + «Скачать договор (PDF)» / «Посмотреть договор» / green «Завершить скоринг» → `resetFlow()` + navigate `/scoring/verification` | 5 |
| 2 | `state.additionalData` set | `otp` | credit-confirmation OTP (former `CreditOtpDialog`) — `OtpPanel variant="credit"`, order/tenor/prepayment summary, amber callout «Это другой код — не тот, что вы вводили при подтверждении карты»; `000000` fails the same way as step 1's modal; success → `confirmCredit()` (stamps `contractNo` via `makeContractNo()` + `oneCOrderNo`) | 5 |
| 3 | `state.offerConfirmed` and (`holdStatus === "confirmed"` or `alifPrepayment === 0`) | `details` | additional data (former `AdditionalDataPage`, behavior unchanged) — Доверительное лицо 1 (required: phone + вид родства) + Доверительное лицо 2 (optional, both-or-neither) + дата списания (defaults to +1 month); «Продолжить» → `saveAdditionalData()` | 4 |
| 4 | `state.offerConfirmed` | `hold` | prepayment hold (former `HoldPage`) — amount **1 000 000 сум**, debit card (first confirmed card, masked `9860 •••• 1296`), explanation; «Подтвердить удержание» → `holdHold()` → `held` spinner («Предоплата удерживается…») → after **~2 с** (`PREPAYMENT_HOLD_DELAY_MS`) auto-`holdConfirm()` → `confirmed` badge; «Отменить холд» (hidden while `held` and once `creditConfirmed`) → `holdCancel()` + `closeCheckout()` + toast «Холд отменён» (`alifSelected`/`tenor` are **not** reset) | 3 |
| — (fallback) | none of the above | `confirm` | «Подтвердить выбор предложения?» (Figma frame 32) — offer summary row (bank/tenor/limit/prepayment); «Назад» closes the popup, «Подтвердить» → `confirmOffer()` | 3 |

The seeded Alif `prepayment` (`ALIF_PREPAYMENT`) is `1_000_000` (non-zero), so `hold` is always on the path for the current seed; the `alifPrepayment === 0` clause in row 3 exists for a future bank/seed where the hold phase is skippable end-to-end, and is not currently exercised.

**600ms hold→details lag.** `AlifCheckoutDialog` keeps a local `phase` state that normally mirrors the derived phase instantly. The one exception: the `hold → details` transition is deliberately delayed by `HOLD_TO_DETAILS_DELAY_MS = 600` ms so the operator has time to see the green «Предоплата подтверждена» badge before the phase switches away from it. Every other phase change (including `confirm → hold`, `details → otp`, `otp → success`) applies immediately.

**Close / resume semantics.** `checkoutOpen` persists in flow state (`sessionStorage`) alongside everything else, so closing the popup does **not** discard progress — `offerConfirmed`, `holdStatus`, `additionalData`, `creditConfirmed` all survive, and the next «Оформить» / page reload reopens the popup on the same derived phase. Closing is possible via the × / Escape / overlay click **except** while `holdStatus === "held"` (the ~2s auto-confirm window) — `handleOpenChange` plus `onPointerDownOutside`/`onEscapeKeyDown` all block it during that window. `holdCancel()` additionally resets `offerConfirmed` to `false` (so the next open starts back at `confirm`) while leaving `alifSelected`/`tenor` untouched.

**Reopen at success.** After `creditConfirmed`, the Alif `BankCard` badge switches to «✓ Оформлена», but the «Оформить» button is neither hidden nor disabled — a repeat click just calls `openCheckout()` again, and since `checkoutPhaseOf` sees `creditConfirmed` first, the popup reopens straight on the `success` phase (a read-only revisit for the contract download/view links), never restarting the flow. **Tenor freeze:** `handleCheckout` calls `selectAlif(tenor)` only while `!state.offerConfirmed` — once the offer is confirmed (and through finalization), a reopen can no longer rewrite `state.tenor`, even though the card's local tenor chip resets to the default on remount. Re-picking the tenor works again after «Назад» on `confirm` or «Отменить холд» (both leave/reset `offerConfirmed === false`).

**Stepper highlight (`ScoringStepper.tsx`).** For the 3 real routes, the active step index comes from the pathname (`activeIndexFor`, steps 0/1/2). While `state.checkoutOpen` is true **and the current route is `/scoring/banks`** (the only route that hosts the popup — a browser-Back to `/scoring/myid` with `checkoutOpen` still true falls back to pathname mapping), the index instead comes from `PHASE_INDEX[checkoutPhaseOf(state, ALIF_PREPAYMENT)]` — `confirm`/`hold` → step 3 (index 2, same as «Выбор рассрочки»), `details` → step 4 (index 3), `otp`/`success` → step 5 (index 4). So opening the popup visually advances the stepper through steps 3→4→5 without the URL ever leaving `/scoring/banks` — steps 4–5 have no route/page of their own, they are reachable only as popup-phase highlights.

The floating `ActionRail` (right edge, ≥lg only) is available on every screen, but not interactive while the popup is open — the modal overlay (`z-50`) sits above it (`z-10`) and disables pointer events on the rest of the page; reset while the popup is open happens via the popup's own controls, or by closing the popup first. Otherwise: «Завершить скоринг» opens an AlertDialog confirmation and, on confirm, does the same `resetFlow()` + navigate-to-verification as the success phase's green button.

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
  offerConfirmed: boolean                        // "confirm" phase decided — gates entry into "hold"
  checkoutOpen: boolean                          // AlifCheckoutDialog open/closed — persisted so a reload/reopen resumes on the same derived phase
  additionalData?: AdditionalData
  creditConfirmed: boolean
  contractNo?: string
  oneCOrderNo?: string
}
```

Actions: `markAlifLimitReady()`, `selectAlif(tenor)`, `addCard(mask, expiry)`, `confirmCard(mask)`, `removeCard(mask)`, `setPhotoDone()`, `setMyidDone()`, `holdHold()`, `holdConfirm()`, `holdCancel()`, `confirmOffer()`, `openCheckout()`, `closeCheckout()`, `saveAdditionalData(data)`, `confirmCredit()`, `resetFlow()`.

**`checkoutPhaseOf(state, alifPrepayment): CheckoutPhase`** — a pure function (not an action; called by `AlifCheckoutDialog` and `ScoringStepper`, never stored) that derives which of the 5 popup phases (`"confirm" | "hold" | "details" | "otp" | "success"`) is currently active, purely from flow state. See the phase table under «Alif checkout popup» above for the exact per-phase conditions and their check order.

## Mock Conventions

All magic values live in `src/lib/broker-mock-data.ts`.

- **OTP failure code**: `000000` (`OTP_FAIL_CODE`) — used identically by both OTP modals (card confirmation on step 1, credit confirmation on step 5, hosted by the shared `OtpPanel`); any other 6-digit code succeeds. **OTP resend timer**: `OTP_RESEND_SECONDS = 60`.
- **Card validation** (`VerificationPage`, before the OTP modal ever opens): number ending `CARD_NOT_FOUND_SUFFIX = "0000"` → «Карта не найдена»; ending `CARD_BLOCKED_SUFFIX = "9999"` → AlertDialog «Карта заблокирована» («Лимит исчерпан на привязку. Карта заблокирована для привязки.»), no OTP step.
- **Seeded card**: `SEED_CARD = { mask: "9860 3569 7266 1296", expiry: "11/29" }` — pre-confirmed in `INITIAL` state.
- **Seeded client**: `BROKER_CLIENT` (Артем Борисов, `+998 94 983 98 48`, ПИНФЛ `2116358415458`, паспорт `AD 1276543`, `cardMask: "9860 **** **** 1296"` — kept in sync with `SEED_CARD` for `ClientInfoBand` on `/scoring/banks`).
- **Alif limit delay**: `ALIF_LIMIT_DELAY_MS = 6000` (~6 с) — Alif's `BankCard` starts `pending` and flips to `ready`; Iman is `instantLimit: true` for contrast.
- **Prepayment hold delay**: `PREPAYMENT_HOLD_DELAY_MS = 2000` (~2 с) — `HoldPhase`'s `held → confirmed` auto-transition, inside the Alif checkout popup.
- **MyID check delay**: `MYID_CHECK_DELAY_MS = 2500` (~2,5 с) — `MyIdPhotoPage`'s `checking → done` transition.
- **Photo requirements**: MIME `image/jpeg`/`image/png` only — `validatePhoto()` in `MyIdPhotoPage.tsx`. **File size is NOT checked** (removed 18.08 по просьбе PM — the ТЗ's 300 КБ – 1,5 МБ range is pending confirmation from Alif/MyID; re-add in `validatePhoto()` if it gets confirmed).
- **Bank seeds** (`BANKS`): Alif — `limit: 8_546_000`, `prepayment: 1_000_000`, `tenors: [2,3,6,9,12,18,24,36]`; Iman — `limit: 6_120_000`, `prepayment: 0`, `instantLimit: true`. `ORDER = { amount: 10_000_000, tenor: 6 }` is the shared order summary shown in the credit-confirmation modal.
- **Contract/order numbers**: `makeContractNo()` generates `ALF-2026-XXXXXX` on credit confirmation; `ONE_C_ORDER_NO = "235662235"` is the fixed seeded 1С order number (as in the Figma design).
- **Contract PDF**: the popup's `SuccessPhase` serves the static mock `public/contract-mock.pdf`, both as a download (`Договор_<№>.pdf`) and as a `target="_blank"` view link — no in-app previewer is built.
- **`ClientInfoBand`**: renders only on `/scoring/banks` — deliberate; the other screens' spec sections don't include it.
- **Bank logos**: colored letter-square fallbacks (`Bank.brandColor` + `Bank.initial`) — the Figma SVG export isn't used.
- **Camera**: `useCameraCapture` (`getUserMedia` → video → canvas → JPEG blob at quality 0.92) always stops its `MediaStream` tracks on unmount/`stop()`, and guards against a permission promise resolving after a newer `start()`/`stop()` call (generation counter) so a stale stream never gets attached.

## Note — Photo Requirements May Change

⚠️ The 18.08 ТЗ (`TZ-Dizayner-Alif-UI.md`) states the MyID photo requirements (format, 300 КБ – 1,5 МБ size range) may change once Alif/MyID's actual API response is confirmed. Because of that uncertainty, the mock deliberately does **not** enforce the size range (PM decision, 18.08) — only the PNG/JPG format check remains. **If final requirements arrive, only `validatePhoto()` in `Broker/src/app/components/scoring/MyIdPhotoPage.tsx` needs editing** — no other screen depends on photo validation.

## Assumption — Additional Data Form Composition

The additional-data form's field composition (Доверительное лицо 1 required + Доверительное лицо 2 optional, each with phone + вид родства; дата списания оплаты) was originally taken from the Figma screen («4-step: Additional Info») because the earlier PM scenario (`Alif_PM_Scenario_RU.md`, 17.08 build) marked it «уточнить у бекенда». The 18.08 ТЗ explicitly confirms this screen «напрямую соответствует Alif additional-data → relations» and should be reused as-is — the field composition and validation carried over unchanged through both 18.08 reworks (page `AdditionalDataPage.tsx` → popup phase `checkout/DetailsPhase.tsx`).

## When Adding New Pages

1. For a new gated *route*: add it (+ any `RequireStage` guard, extending the `Stage` union in `routes.tsx`) in `src/app/routes.tsx`. For a new *phase* of the Alif checkout popup: add a case to `checkoutPhaseOf()` in `scoring-flow.tsx` (respect the top-down most-advanced-wins check order), a `checkout/<Name>Phase.tsx` component, and a branch in `AlifCheckoutDialog.tsx` + `PHASE_INDEX` in `ScoringStepper.tsx` — do not add a route for it.
2. Create the component under `src/app/components/<feature>/`
3. Follow Patterns A–K (see root CLAUDE.md) — this app does not use the shared `AppShell`; extend `BrokerShell`/`ScoringStepper` instead (the stepper is a flat 5-step constant — do not reintroduce branching)
4. Extend `ScoringFlowState` in `scoring-flow.tsx` for any new persisted flow data
5. Use mock data from `src/lib/broker-mock-data.ts` or extend it
6. All text in Russian
7. Use `@texnomart/ui/` for primitives (Button, Card, InputOTP, Dialog, etc.) — open modals with a plain `<button>`/`Button` trigger, not `asChild` Radix triggers (a known off-screen-menu gotcha elsewhere in this monorepo)
8. Mobile responsive — test at sm/md/lg breakpoints
