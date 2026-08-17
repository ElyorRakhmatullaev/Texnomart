# Client Broker

Operator-facing scoring application used in-store: after a client applies for BNPL/rassrochka, the operator picks a bank offer and walks the client through that bank's flow. Originated as a new sub-project bootstrapped in this monorepo (2026-08-17), starting with the **Alif Nasiya** flow.

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For the design spec see [docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md](../docs/superpowers/specs/2026-08-17-broker-alif-flow-screens-design.md).
> Figma: `https://www.figma.com/design/gJWaXJEtxG06aAOhpIa11L/Texnomart-Broker` (canvas «Client Broker»).
> Scenario source: `Alif_PM_Scenario_RU.md` — a PM-authored integration scenario for the Alif frontend, external to this repo (not checked in).

## Scope

Only the **Alif** bank branch is built (4 screens after bank selection: card attach → additional data → credit confirm → success). Login/PIN, «Верификация клиента», «Проверка MyID», «Подбор товара», other banks' branches, and error/Messages screens are out of scope — the mock enters directly at the bank-offer step with a seeded client. Clicking «Оформить» on a non-Alif bank shows a toast: «В прототипе реализован сценарий Alif».

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
    contract-mock.pdf                 # Mock signed-contract PDF served on the success screen
  src/
    main.tsx                          # Entry point
    app/
      App.tsx                         # RouterProvider + ScoringFlowProvider + Toaster
      routes.tsx                      # All routes (createBrowserRouter) + RequireAlif stage guards
      scoring-flow.tsx                # ScoringFlowProvider — flow state in sessionStorage
      components/
        shell/
          BrokerShell.tsx             # Own top-bar shell (NOT the shared AppShell — operator terminal layout) + Outlet
          ScoringStepper.tsx          # 5-step / Alif-expanded 7-step stepper
          ActionRail.tsx              # Floating right-side action rail (new tab / send to Telegram / end scoring)
        scoring/
          BanksPage.tsx               # Screen 2 — bank offer cards + Alif waiting-for-limit state
          BankCard.tsx                # Single bank offer card (tenor chips, limit panel, «Оформить»)
          ClientInfoBand.tsx          # Seeded client info strip (ФИО / телефон / ПИНФЛ / карта)
        alif/
          CardAttachPage.tsx          # Screen 3 — OTP 1 of 2, card attach
          AdditionalDataPage.tsx      # Screen 4 — доверительные лица + дата списания
          CreditConfirmPage.tsx       # Screen 5 — OTP 2 of 2, credit confirm (visually distinct from screen 3)
          SuccessPage.tsx             # Screen 6 — contract number + PDF download + reset
          OtpStepCard.tsx             # Shared OTP-screen shell used by CardAttachPage + CreditConfirmPage
    lib/
      broker-mock-data.ts             # Seeded client, banks, order, timer/OTP constants, contract-number generator
    styles/
      index.css                       # CSS entry (imports fonts, tailwind, theme)
      tailwind.css                    # Tailwind v4 config
      theme.css                       # Design tokens (CSS variables) — light only, no dark mode yet
      fonts.css                       # Inter font import
      globals.css                     # Global overrides
```

## Implemented Routes

| Route | Component | Notes |
|---|---|---|
| `/` | — | redirect → `/scoring/banks` |
| `/scoring/banks` | BanksPage | Bank offer cards; Alif shows a ~6s mock-callback waiting state before its limit appears |
| `/scoring/alif/card` | CardAttachPage | OTP 1 of 2 — card attach; guarded on `alifSelected` |
| `/scoring/alif/details` | AdditionalDataPage | Доверительные лица (1 required, 2 optional) + дата списания; guarded on `alifSelected && cardAttached` |
| `/scoring/alif/confirm` | CreditConfirmPage | OTP 2 of 2 — credit confirm, visually distinguished from screen 3; guarded on additional data being saved |
| `/scoring/alif/success` | SuccessPage | Contract number, PDF download, «Завершить скоринг» resets the flow; guarded on `creditConfirmed` |

Guards (`RequireAlif` in `routes.tsx`) redirect to `/scoring/banks` if the flow state for that stage hasn't been reached yet — direct deep-links into the middle of the flow without state fall back to the start.

## State — `ScoringFlowProvider`

`Broker/src/app/scoring-flow.tsx` — React context backed by **`sessionStorage`** under the key **`broker:scoring-flow`**. The flow survives a page reload but resets on a new session (tab/browser close), which matches a scoring session's real-world lifetime. `resetFlow()` clears the key and returns to the initial state.

## Mock Conventions

- **OTP failure code**: `000000` (`OTP_FAIL_CODE` in `broker-mock-data.ts`) — any other 6-digit code succeeds on both OTP screens (card attach and credit confirm use two visually distinct steps, per the PM scenario's requirement that they never be shown as one merged screen).
- **Alif limit delay**: the Alif bank card starts in a `pending` state and flips to `ready` after **~6 seconds** (`ALIF_LIMIT_DELAY_MS`), mocking the real backend's async callback — Iman Invest returns its limit instantly for contrast.
- **OTP resend timer**: 60s countdown (`OTP_RESEND_SECONDS`) before «Отправить код повторно» becomes clickable.
- **Contract/order numbers**: `makeContractNo()` generates `ALF-2026-XXXXXX` on credit confirmation; `ONE_C_ORDER_NO` is a fixed seeded 1С order number (`235662235`, as in the Figma design).
- **Contract PDF**: the success screen serves the static mock `public/contract-mock.pdf`, downloaded as `Договор_ALF-2026-XXXXXX.pdf`.

## Assumption — Additional Data Form Composition

`Alif_PM_Scenario_RU.md` marks the additional-data form's field composition as **«уточнить у бекенда»** (to be confirmed with backend) — it wasn't specified. The composition implemented here (Доверительное лицо 1 required + Доверительное лицо 2 optional, each with phone + вид родства; дата списания оплаты) was taken from the matching **Figma** screen («4-step: Additional Info») instead, since that screen already exists in the design file. Revisit this form if/when the backend contract for this step is confirmed.

## When Adding New Pages

1. Add the route (+ any `RequireAlif` stage guard) in `src/app/routes.tsx`
2. Create the component under `src/app/components/<feature>/`
3. Follow Patterns A–K (see root CLAUDE.md) — this app does not use the shared `AppShell`; extend `BrokerShell`/`ScoringStepper` instead
4. Extend `ScoringFlowState` in `scoring-flow.tsx` for any new persisted flow data
5. Use mock data from `src/lib/broker-mock-data.ts` or extend it
6. All text in Russian
7. Use `@texnomart/ui/` for primitives (Button, Card, InputOTP, etc.)
8. Mobile responsive — test at sm/md/lg breakpoints
