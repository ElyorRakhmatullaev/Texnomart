# Broker · Ветка Alif в попапе на «Выборе рассрочки» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести всю ветку Alif (подтверждение выбора → холд → доп. данные → OTP кредита → успех/договор) в один попап с затемнением на странице «Выбор рассрочки» (по Figma-фрейму 32); страницы-маршруты ветки удалить. Только для Alif.

**Architecture:** `AlifCheckoutDialog` (Radix Dialog) с фазой, дериватной из `ScoringFlowState` (+ новые `offerConfirmed`, `checkoutOpen` — персистятся); фазовые компоненты — перенос контента удаляемых страниц; степпер подсвечивает шаги 3→4→5 по фазе через контекст. Полная схема — спека `docs/superpowers/specs/2026-08-18-broker-alif-checkout-popup-design.md`.

**Tech Stack:** как в предыдущем плане (React 18, Vite 6 esbuild, `@texnomart/ui` dialog/input-otp, sonner).

## Global Constraints

- Скоуп: `Broker/**` + доки (T4). UI по-русски; жёлтый `#FFD60A` через `style`; суммы ru-RU + «сум».
- Проверка задач: `corepack pnpm --filter broker build`; браузерный QA — только T5 (сольно, Playwright; dev-сервер глушить по PID).
- Модалы — обычные кнопки-триггеры (controlled open), не `asChild`.
- Каждая задача = коммит на `main` с трейлером `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `OtpPanel`, мок-константы, шаги 1–2 — не трогать.

## File Structure

| Файл | Судьба |
|---|---|
| `Broker/src/app/scoring-flow.tsx` | + `offerConfirmed`, `checkoutOpen`; экшены `confirmOffer()`, `openCheckout()`, `closeCheckout()`; `holdCancel()` сбрасывает `offerConfirmed` |
| `Broker/src/app/routes.tsx` | − маршруты/гварды `alif/*`; `Stage` сужается до `"myid" | "banks"` |
| `Broker/src/app/components/shell/ScoringStepper.tsx` | активный шаг с учётом открытого попапа/фазы (из контекста) |
| `Broker/src/app/components/checkout/AlifCheckoutDialog.tsx` (**создать**) | Dialog-хост, дериватная фаза, × закрытие |
| `.../checkout/{ConfirmPhase,HoldPhase,DetailsPhase,CreditOtpPhase,SuccessPhase}.tsx` (**создать**) | фазы (перенос контента) |
| `.../scoring/BanksPage.tsx` | «Оформить» (Alif) → `selectAlif(tenor)` + `openCheckout()`; хост диалога; бейдж «Оформлена» после финализации |
| Удалить: `alif/HoldPage.tsx`, `alif/AdditionalDataPage.tsx`, `alif/InstallmentInfoPage.tsx`, `alif/CreditOtpDialog.tsx` | контент переезжает в фазы |
| `Broker/CLAUDE.md`, корневой `CLAUDE.md`, `HISTORY.md`, `docs/AI_CONTEXT.md` | T4 |

## Task 1: Состояние + каркас попапа + фаза `confirm` + маршруты

- [ ] `scoring-flow.tsx`: `offerConfirmed: boolean`, `checkoutOpen: boolean` в `ScoringFlowState`/`INITIAL` (false); экшены `confirmOffer()`, `openCheckout()`, `closeCheckout()`; `holdCancel()` теперь также `offerConfirmed: false`
- [ ] `checkout/AlifCheckoutDialog.tsx`: Dialog (контент `sm:max-w-[640px]`, DialogTitle визуально в фазах, sr-only Description), открыт при `state.checkoutOpen`; `onOpenChange(false)` → `closeCheckout()` (запрет закрытия при `holdStatus==="held"`); фаза деривируется: `creditConfirmed→success`, `additionalData→otp`, `(holdStatus==="confirmed" || ALIF_PREPAYMENT===0) && offerConfirmed→details`, `offerConfirmed→hold`, иначе `confirm`; фазы: пока `ConfirmPhase` — «Подтвердить выбор предложения?» (по фрейму 32: заголовок по центру, «Назад» серая → `closeCheckout()`, «Подтвердить» жёлтая → `confirmOffer()`) + строка предложения (лого Alif · «Alif Nasiya» · `state.tenor` мес. · лимит · предоплата ru-RU); остальные фазы — временные заглушки-`div` (Task 2/3)
- [ ] `BanksPage.tsx`: Alif «Оформить» → `selectAlif(tenor)` + `openCheckout()` (никакой навигации); хостить `<AlifCheckoutDialog />`; при `state.creditConfirmed` бейдж карточки Alif «Оформлена» (зелёный) и «Оформить» открывает попап (фаза success)
- [ ] `routes.tsx`: удалить маршруты + гварды `hold/details/info` (и импорты страниц); `Stage = "myid" | "banks"`
- [ ] `ScoringStepper.tsx`: при `state.checkoutOpen` активный шаг из фазы (confirm/hold→2, details→3, otp/success→4 в 0-базе), иначе по pathname; фазу степпер деривирует сам из состояния тем же правилом (вынести хелпер `checkoutPhaseOf(state)` в `scoring-flow.tsx` и использовать в обоих местах)
- [ ] Build зелёный (страницы alif/* пока существуют, но не в маршрутах); commit `feat(broker): попап оформления Alif — каркас, фаза подтверждения, маршруты без страниц ветки`

## Task 2: Фазы `hold` + `details`

- [ ] `HoldPhase.tsx` ← контент `HoldPage` (без страничного контейнера/степпера): сумма, карта списания, «Подтвердить удержание» → спиннер ~2 с → «Предоплата подтверждена» + «Продолжить» (переход фазы происходит сам — деривация; «Продолжить» не нужен? НУЖЕН: деривация переводит на `details` только при `confirmed`, что случится автоматически по таймеру — тогда фаза сменится сама; кнопку «Продолжить» убрать, оставить авто-переход с задержкой 600 мс после бейджа для читаемости); «Отменить холд» (скрыта при `held`): `holdCancel()` + `closeCheckout()` + toast «Холд отменён»
- [ ] `DetailsPhase.tsx` ← контент `AdditionalDataPage` (форма+валидация 1:1, компактнее: grid как был, кнопка «Продолжить» жёлтая в футере фазы → `saveAdditionalData(...)`; «Вернуться…» не нужна — есть ×)
- [ ] Удалить `HoldPage.tsx`, `AdditionalDataPage.tsx`; build; commit `feat(broker): фазы холда и доп. данных в попапе Alif`

## Task 3: Фазы `otp` + `success`

- [ ] `CreditOtpPhase.tsx` ← контент `CreditOtpDialog` без Dialog-обёртки: `OtpPanel variant="credit"` (subtitle, сводка Банк/Сумма заказа/Срок/Предоплата, амбер-callout, CTA «Завершить») → `confirmCredit()`
- [ ] `SuccessPhase.tsx` ← зелёное состояние `InstallmentInfoPage`: галочка, «Кредит оформлен!», договор № + дата, текст 1С, «Скачать договор (PDF)», «Посмотреть договор» (`target="_blank"`), зелёная «Завершить скоринг» → `resetFlow()` + navigate `/scoring/verification`; левую карточку-сводку страницы НЕ переносить (в попапе достаточно панели успеха + строки предложения сверху)
- [ ] Удалить `InstallmentInfoPage.tsx`, `CreditOtpDialog.tsx`; build; commit `feat(broker): фазы OTP кредита и успеха в попапе Alif — ветка целиком в попапе`

## Task 4: Документация

- [ ] `Broker/CLAUDE.md`: маршруты (4), попап-флоу по фазам, деривация фазы, `offerConfirmed`/`checkoutOpen`, повторное открытие на success; корневой `CLAUDE.md` (строка Broker += «ветка Alif — в попапе на „Выборе рассрочки“ (фрейм 32)»); `HISTORY.md`, `docs/AI_CONTEXT.md`
- [ ] `corepack pnpm build` все три; commit `docs(broker): попап оформления Alif`

## Task 5: Сквозной QA (сольно)

- [ ] Матрица (1440/390): полный проход попапа; × на каждой фазе + повторное «Оформить» (резюме); отмена холда → повторный вход с confirm; перезагрузка с открытым попапом (переоткрытие, та же фаза); переоткрытие после успеха (фаза success, договор на месте); деп-линки `/scoring/alif/*` → redirect; степпер: подсветка 3→4→5 по фазам; Iman → toast; сброс «Завершить скоринг» (попап и рейка)
- [ ] Дефекты — мини-коммиты; финальный build

## Self-Review (выполнен)

Покрытие спеки: §2.1 фазы → T1–T3; §2.2 состояние/маршруты/степпер/повторное открытие → T1; §2.3 файлы → по задачам; §4 → T5. Имена сквозные: `offerConfirmed`, `checkoutOpen`, `confirmOffer/openCheckout/closeCheckout`, `checkoutPhaseOf` — T1 создаёт, T2/T3 используют. Удаления перечислены; каждый таск собирается.
