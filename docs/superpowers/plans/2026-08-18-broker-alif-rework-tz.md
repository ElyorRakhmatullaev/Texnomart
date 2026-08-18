# Broker · Переработка по ТЗ 18.08 (фото · OTP-модалы · холд · договор) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перестроить ветку Alif мока `Broker/` по ТЗ дизайнера от 18.08: новый шаг «Верификация клиента» с картами и **модалом OTP привязки**, шаг «Проверка MyID» с **захватом фото** (критично), **холд предоплаты**, финальный экран «Информация по рассрочке» с **модалом OTP кредита** и просмотром/скачиванием договора; отдельные шаги «Привязка карты»/«Подтверждение кредита» удаляются, степпер возвращается к 5 шагам.

**Architecture:** Расширенный `ScoringFlowState` (карты/фото/MyID/холд), маршруты v2 с гвардами по этапам, `OtpPanel` (рефакторинг `OtpStepCard`) как начинка двух Dialog-модалов, камера через `getUserMedia` с фолбэком на демо-ассет. Полная схема — в спеке.

**Tech Stack:** React 18 + TS, Vite 6 (esbuild, без tsc), Tailwind v4, React Router v7, `@texnomart/ui` (dialog, input-otp, skeleton), sonner, lucide-react.

**Спека:** `docs/superpowers/specs/2026-08-18-broker-alif-rework-tz-design.md` (главный источник значений). ТЗ: `TZ-Dizayner-Alif-UI.md`. Figma-референсы: фреймы 8/9/10 (верификация+карты), 11 (MyID с камерой), 41/42 (финал).

## Global Constraints

- Скоуп: `Broker/**` + документация (T7). Остальное не трогать.
- Весь UI-текст по-русски; суммы `toLocaleString("ru-RU")` + «сум»; жёлтый `#FFD60A` через `style={{}}` (текст чёрный); без Tailwind-классов произвольных цветов.
- Тестраннера нет: цикл — `corepack pnpm --filter broker build` → чтение кода; **браузерный QA только в T8** (одна сольная задача — Playwright-профиль лочится при конкурентных сессиях; dev-серверы глушить по PID, НИКОГДА `taskkill /IM node.exe`).
- Radix-модалы открывать обычными кнопками (не `Button asChild` над триггером меню — репо-готча).
- Мок-константы: OTP-ошибка `000000`; карта `…0000` → «Карта не найдена»; `…9999` → «Лимит исчерпан на привязку»; `PREPAYMENT_HOLD_DELAY_MS=2000`; `MYID_CHECK_DELAY_MS=2500`; `PHOTO_MIN_BYTES=300_000`; `PHOTO_MAX_BYTES=1_500_000`; Alif `prepayment: 1_000_000`; сид-карта `9860 3569 7266 1296 · 11/29` (подтверждена).
- Каждая задача = коммит на `main`, суффикс `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## File Structure

| Файл | Судьба | Ответственность |
|---|---|---|
| `Broker/src/app/scoring-flow.tsx` | изменить | Состояние v2: `cards[]`, `photoDone`, `myidDone`, `holdStatus` + экшены; `cardAttached` удалить |
| `Broker/src/lib/broker-mock-data.ts` | изменить | + `SEED_CARD`, суффиксы ошибок, задержки/лимиты фото, Alif `prepayment: 1_000_000` |
| `Broker/src/app/routes.tsx` | изменить | Маршруты v2 + гвард `RequireStage` (verification-free / myid / banks / hold / details / info) |
| `Broker/src/app/components/shell/ScoringStepper.tsx` | изменить | Только 5 шагов; маппинг pathname v2; ветка ALIF_STEPS удалить |
| `Broker/src/app/components/alif/CardAttachPage.tsx`, `CreditConfirmPage.tsx`, `SuccessPage.tsx`, `OtpStepCard.tsx` | удалить | Заменяются модалами/`InstallmentInfoPage`/`OtpPanel` |
| `Broker/src/app/components/scoring/VerificationPage.tsx` | создать | Шаг 1: данные клиента + карты + «Добавить» |
| `Broker/src/app/components/scoring/CardOtpDialog.tsx` | создать | Модал подтверждения карты (+ ошибки «не найдена»/«заблокирована») |
| `Broker/src/app/components/scoring/MyIdPhotoPage.tsx` + `useCameraCapture.ts` | создать | Шаг 2: фото (овал, требования, ошибки, фолбэк) → проверка MyID |
| `Broker/src/app/components/alif/HoldPage.tsx` | создать | Холд предоплаты (статусы, отмена) |
| `Broker/src/app/components/alif/InstallmentInfoPage.tsx` | создать | Финал 2-состояния + `CreditOtpDialog` + договор (скачать/посмотреть) |
| `Broker/src/app/components/alif/OtpPanel.tsx`, `CreditOtpDialog.tsx` | создать | Переиспользуемая OTP-начинка; модал кредита |
| `Broker/src/assets/demo-photo.jpg` | создать | Демо-фолбэк фото (сгенерированный силуэт 300КБ–1.5МБ, не реальный человек) |
| `Broker/CLAUDE.md`, корневые доки | изменить (T7) | Новый флоу, мок-конвенции v2 |

---

## Task 1: Состояние v2, маршруты v2, степпер 5 шагов

**Files:** Modify `scoring-flow.tsx`, `broker-mock-data.ts`, `routes.tsx`, `ScoringStepper.tsx`; Delete `CardAttachPage.tsx`, `CreditConfirmPage.tsx`; Create заглушки `VerificationPage`/`MyIdPhotoPage`/`HoldPage` (инлайн в routes) + временный `InstallmentInfoPage` (копия текущего SuccessPage-контента с прежним поведением, без модала — доработка в T6; `SuccessPage.tsx` удалить).

**Interfaces (Produces):**
```ts
// broker-mock-data.ts (+)
export interface SeedCard { mask: string; expiry: string }
export const SEED_CARD: SeedCard = { mask: "9860 3569 7266 1296", expiry: "11/29" }
export const CARD_NOT_FOUND_SUFFIX = "0000"; export const CARD_BLOCKED_SUFFIX = "9999"
export const PREPAYMENT_HOLD_DELAY_MS = 2000; export const MYID_CHECK_DELAY_MS = 2500
export const PHOTO_MIN_BYTES = 300_000; export const PHOTO_MAX_BYTES = 1_500_000
// BANKS: alif.prepayment = 1_000_000 (iman не меняется)

// scoring-flow.tsx (v2)
export interface AttachedCard { mask: string; expiry: string; confirmed: boolean }
interface ScoringFlowState {
  cards: AttachedCard[]; photoDone: boolean; myidDone: boolean
  alifLimitStatus: "pending" | "ready"; alifSelected: boolean; tenor?: number
  holdStatus: "none" | "held" | "confirmed" | "cancelled"
  additionalData?: AdditionalData; creditConfirmed: boolean
  contractNo?: string; oneCOrderNo?: string
}
const INITIAL: ScoringFlowState = { cards: [{ ...SEED_CARD, confirmed: true }], photoDone: false, myidDone: false, alifLimitStatus: "pending", alifSelected: false, holdStatus: "none", creditConfirmed: false }
// экшены: addCard(mask, expiry) (confirmed:false), confirmCard(mask), removeCard(mask),
// setPhotoDone(), setMyidDone(), holdHold()→"held", holdConfirm()→"confirmed", holdCancel()→"cancelled"+alifSelected остаётся, назад к банкам; selectAlif(tenor) как было; resetFlow → INITIAL
```
Гварды (`RequireStage stage=`): `myid` ⇐ `cards.some(c=>c.confirmed)`; `banks` ⇐ `myidDone`; `hold` ⇐ `alifSelected` (и в компоненте: если prepayment===0 → redirect details); `details` ⇐ `alifSelected && (alifPrepayment===0 || holdStatus==="confirmed")`; `info` ⇐ `!!additionalData`. `/` → `/scoring/verification`; `*` → туда же. Маршруты `alif/card`, `alif/confirm` удалить. Степпер: `STEPS` = прежний BASE_STEPS; маппинг: `/verification`→0, `/myid`→1, `/banks`|`/alif/hold`→2, `/alif/details`→3, `/alif/info`→4; кламп остаётся.

- [ ] Реализация по интерфейсам выше (заглушки-страницы: `<div className="p-8">Шаг N — Task M</div>`; InstallmentInfoPage — перенос текущего Success-контента, маршрут `/scoring/alif/info`, `state.holdStatus`-строку пока не добавлять)
- [ ] `corepack pnpm --filter broker build` зелёный; чтением проверить: старт `/scoring/verification`, банки недоступны до `myidDone`
- [ ] Commit: `refactor(broker): состояние и маршруты v2 по ТЗ 18.08 — 5 шагов, этапы карты/фото/холд`

## Task 2: Экран «Верификация клиента» (Figma 8–10)

**Files:** Create `scoring/VerificationPage.tsx`; Modify `routes.tsx` (замена заглушки).

**Consumes:** `useScoringFlow` (`state.cards`, `removeCard`), `BROKER_CLIENT`. **Produces:** событие «Добавить» → колбэк `onAddCard(mask, expiry)` (в T2 — прямое `addCard`+`confirmCard` без модала + toast «Карта подтверждена (модал — Task 3)»; T3 заменит на модал).

- [ ] Карточка `max-w-[880px]`: caption «Log Id: 123456»; grid `md:grid-cols-2 gap-8`. Слева h3 «Данные клиента»: Номер телефона (`BROKER_CLIENT.phone`), «Серия и номер паспорта» (`AD 1276543` — добавить в `BROKER_CLIENT.passport`), ПИНФЛ — floating-label поля как в `AdditionalDataPage`, read-only-стиль (предзаполнены). Справа h3 «Данные карты»: строки карт (иконка карты, маска, срок, бейдж «Подтверждена» зелёный soft-tint / «Не подтверждена» серый, иконка-корзина → `removeCard`; сид-карту удалить можно, но «Продолжить» требует ≥1 подтверждённой), поля «Номер карты» (маска 16 цифр группами по 4) + «Срок карты» (MM/YY), зелёная плашка «Чем больше карт, тем выше шанс получить нужный лимит» + кнопка «Добавить» (`bg-emerald-500 text-white`, активна при валидных полях)
- [ ] Жёлтая «Продолжить» (≥1 confirmed) → `/scoring/myid`
- [ ] Build; commit: `feat(broker): экран «Верификация клиента» — данные клиента и карты (Figma 8–10)`

## Task 3: `OtpPanel` + модал подтверждения карты

**Files:** Create `alif/OtpPanel.tsx`, `scoring/CardOtpDialog.tsx`; Modify `VerificationPage.tsx`; Delete `alif/OtpStepCard.tsx`.

**Produces (контракт для T6):**
```ts
// OtpPanel — начинка без карточки/back-кнопки (перенос логики из OtpStepCard)
interface OtpPanelProps { variant: "card" | "credit"; subtitle: ReactNode; ctaLabel: string; onSuccess: () => void; children?: ReactNode }
// чипы: card → серый + CreditCard + «Подтверждение карты»; credit → emerald + FileSignature + «Подтверждение кредита»
// OTP 6, resend 60 c, OTP_FAIL_CODE → ошибка + очистка (логика 1:1 из OtpStepCard)
// CardOtpDialog: props { open, cardMask, onConfirmed, onOpenChange }
```
- [ ] «Добавить» в VerificationPage: `…0000` → инлайн-ошибка у поля «Карта не найдена»; `…9999` → модал-ошибка «Лимит исчерпан на привязку. Карта заблокирована для привязки» (без OTP, кнопка «Понятно»); иначе `addCard(...)` + открыть `CardOtpDialog` (заголовок «Подтверждение карты», subtitle «Введите код из SMS, отправленного на карту •••• <4 цифры>»); успех → `confirmCard(mask)` + toast «Карта подтверждена»; закрытие без успеха → карта остаётся «Не подтверждена», повторный клик по строке → снова модал
- [ ] Удалить `OtpStepCard.tsx` (после переноса); build; commit: `feat(broker): OTP-модал подтверждения карты + OtpPanel (ошибки «не найдена»/«заблокирована»)`

## Task 4: Шаг «Проверка MyID» — фото клиента (Figma 11 + овал)

**Files:** Create `scoring/MyIdPhotoPage.tsx`, `scoring/useCameraCapture.ts`, `Broker/src/assets/demo-photo.jpg`; Modify `routes.tsx`.

- [ ] `useCameraCapture`: `start()` → `navigator.mediaDevices.getUserMedia({video:{width:960,height:1280}})`; `capture()` → canvas → `toBlob("image/jpeg", 0.92)`; состояния `idle|streaming|denied|captured`; `stop()` (обязательный cleanup треков в unmount)
- [ ] Страница: H2 «Проверка MyID», 3 чипа-подсказки («Держите положение лица» / «Не закрывайте лицо» / «Хорошее освещение»), область 3:4 с `<video>` + **овальная рамка** (абсолютный div с `border-radius: 50%`, затемнение вокруг через box-shadow), подпись требований «Анфас, лицо полностью в овале · PNG/JPG · 300 КБ – 1,5 МБ»; кнопки: «Сделать снимок» → превью (img из blob) + «Использовать фото» / «Переснять»; `denied` → плашка «Камера недоступна» + «Использовать демо-фото» (import `demo-photo.jpg`; fetch → blob)
- [ ] Валидация blob: тип jpeg/png и размер в [PHOTO_MIN_BYTES, PHOTO_MAX_BYTES]; вне диапазона → красная плашка «Фото не соответствует требованиям (размер N КБ, нужно 300 КБ – 1,5 МБ)» + «Переснять»; успех → `setPhotoDone()` → фаза «Проверка MyID…» (спиннер, `MYID_CHECK_DELAY_MS`) → зелёная строка «Личность подтверждена» + `setMyidDone()` + «Продолжить» → `/scoring/banks`; «Вернуться к предыдущему шагу» → verification
- [ ] `demo-photo.jpg` сгенерировать скриптом в scratchpad (PIL: нейтральный градиент + силуэт-аватар, качество/размер чтобы попасть в 300КБ–1.5МБ; НЕ реальное лицо), положить в assets
- [ ] Build; commit: `feat(broker): шаг «Проверка MyID» — захват фото клиента (овал, требования, фолбэк, мок-проверка)`

## Task 5: Холд предоплаты

**Files:** Create `alif/HoldPage.tsx`; Modify `BanksPage.tsx` (переход), `BankCard.tsx` (строка «Предоплата» уже читает `bank.prepayment` — проверить формат `1 000 000 сум`).

- [ ] `BanksPage.handleCheckout("alif", tenor)`: `selectAlif(tenor)` → `alif.prepayment > 0 ? navigate("/scoring/alif/hold") : navigate("/scoring/alif/details")`
- [ ] `HoldPage` (степпер на шаге 3): карточка `max-w-[560px]` «Предоплата по рассрочке»: сумма `1 000 000 сум` (крупно, tabular-nums), строка «Карта списания: 9860 •••• 1296» (первая confirmed из `state.cards`), пояснение «Средства будут удержаны (холд) и списаны после оформления кредита. До завершения оформления холд можно отменить.»; состояния по `holdStatus`: `none` → жёлтая «Подтвердить удержание» (`holdHold()`; таймер `PREPAYMENT_HOLD_DELAY_MS` → `holdConfirm()`); `held` → строка со спиннером «Предоплата удерживается…»; `confirmed` → зелёный бейдж «Предоплата подтверждена» + жёлтая «Продолжить» → details; всегда доступна текстовая «Отменить холд» (кроме `held`): `holdCancel()` + toast «Холд отменён» + navigate banks (повторный вход на hold сбрасывает `cancelled`→`none`)
- [ ] Build; commit: `feat(broker): холд предоплаты Alif — подтверждение удержания, статусы, отмена`

## Task 6: Финальный экран «Информация по рассрочке» + модал OTP кредита + договор

**Files:** Rework `alif/InstallmentInfoPage.tsx`; Create `alif/CreditOtpDialog.tsx`.

- [ ] Левая карточка — как в текущем финале + строка «Предоплата: 1 000 000 сум · Подтверждена» (из `holdStatus`; при 0 — «0»)
- [ ] Правая панель, состояние A (`!state.creditConfirmed`): нейтральная (`bg-gray-50 border`): иконка `ShieldCheck`, «Проверьте условия и завершите оформление», текст «После подтверждения кредит будет оформлен в Alif, договор сформируется автоматически»; зелёная «Завершить скоринг» → `CreditOtpDialog` (`OtpPanel variant="credit"`, subtitle «Мы отправили код для подтверждения оформления кредита», children: сводка Банк/Сумма заказа/Срок (`state.tenor ?? ORDER.tenor`)/Предоплата + амбер-callout «Это другой код — не тот, что вы вводили при подтверждении карты»; CTA «Завершить»); успех → `confirmCredit()` + закрыть модал
- [ ] Состояние B (`creditConfirmed`) — зелёная панель как сейчас (галочка, «Кредит оформлен!», договор №, 1С) + кнопки: «Скачать договор (PDF)» (как было), новая outline «Посмотреть договор» (`<a href={BASE_URL+"contract-mock.pdf"} target="_blank" rel="noopener">` + `ExternalLink`), зелёная «Завершить скоринг» → `resetFlow()` + `/scoring/verification`
- [ ] Build; commit: `feat(broker): финал «Информация по рассрочке» — модал OTP кредита, просмотр и скачивание договора`

## Task 7: Документация

**Files:** Modify `Broker/CLAUDE.md` (переписать флоу/маршруты/мок-конвенции v2 + примечание «требования к фото могут измениться после ответа Alif/MyID»), корневой `CLAUDE.md` (строка Broker: заменить хвост на «переработан по ТЗ 18.08: верификация+карты с OTP-модалом, фото/MyID, холд, финал с OTP-модалом и договором (2026-08-18)»), `HISTORY.md`, `docs/AI_CONTEXT.md` (датированные записи).

- [ ] Правки + `corepack pnpm build` (все три) зелёный; commit: `docs(broker): документация переработки по ТЗ 18.08`

## Task 8: Сквозной QA (сольная задача, Playwright)

- [ ] Матрица (1440 + 390): (1) верификация: сид-карта видна, добавление `…1234` → модал → `111111` → «Подтверждена»; `000000` → ошибка; `…0000` → «Карта не найдена»; `…9999` → «Лимит исчерпан»; удаление карт, «Продолжить»-гейт; (2) фото: заглушить камеру (`browser_evaluate`: подменить `getUserMedia` reject) → фолбэк «Использовать демо-фото» → проверка → «Личность подтверждена»; (3) банки: ожидание лимита 6 с, предоплата 1 000 000 на карточке Alif; (4) холд: подтверждение (спиннер→бейдж), сценарий отмены → возврат к банкам → повторный заход; (5) доп. данные (без изменений — smoke); (6) инфо: модал кредита (`000000` ошибка → успех), зелёное состояние, скачивание PDF + «Посмотреть» (новая вкладка), «Завершить скоринг» → сброс на верификацию; (7) перезагрузки на myid/hold/info; прямые заходы по всем маршрутам в чистой сессии; (8) степпер всегда 5 шагов, активные позиции верны
- [ ] Дефекты — мини-коммиты `fix(broker): …`; финальный `corepack pnpm build`; dev-сервер убить по PID
- [ ] Commit(ы) фиксов + отчёт

## Self-Review (выполнен)

- Покрытие ТЗ: п.1 фото → T4; п.2 OTP карты → T2+T3; п.3 холд → T5 (+сид prepayment T1); п.4 OTP кредита → T6; п.5 договор → T6; «переиспользуем без изменений» (банки/доп.данные/структура финала) — соблюдено; приоритеты ТЗ отражены порядком T3→T4 не критичен (T4 не зависит от T3).
- Сквозные имена: `AttachedCard`, `holdStatus`-цикл, `OtpPanel` props, константы — согласованы T1↔T3↔T5↔T6.
- Плейсхолдеров нет; удаления файлов перечислены; каждый таск собирается независимо.
