Build the Applications module at `/applications` (list) and the Detail Drawer that opens on row click. This is the operational heart of the panel — optimize for speed and information density.

### PAGE HEADER
- H1 "Заявки" + Caption with live counter "Найдено 1 247 · обновлено только что" + pulsing green dot
- Right cluster: Tabs view-mode "Таблица" / "Канбан" (default Table) · Refresh icon Button · Export DropdownMenu · primary "+ Новая заявка"

### FILTER BAR (Pattern B)
Chips, in this order:
- Статус (multi-select, 11 application statuses from Pattern H)
- Партнёр (multi-select, list of partners)
- Филиал (multi-select)
- Оператор/Агент (multi-select)
- Период (date range picker; presets: Сегодня, Вчера, 7 дней, 30 дней)
- Сумма (range slider: 100k–50M UZS)
- Срок рассрочки (multi-select 1/3/6/12/24 мес)
- Канал поступления (multi-select: Онлайн, Приложение, Telegram, Филиал)

Active filter chips fill with the canonical yellow pill style. "Очистить фильтры" ghost button appears right.

### DATA TABLE (Pattern C)
Columns:
| Width | Column | Content |
|---|---|---|
| 40  | Checkbox | bulk |
| 110 | ID | mono "BR-12483", gray-700; copy-on-click |
| 140 | Создано | "15.05.26 14:32" with relative tooltip ("2 ч назад") |
| flex| Клиент | Avatar 32 + ФИО (14 Medium) + телефон below (12 gray-700) |
| 140 | Сумма | tabular-nums 14 SemiBold + "UZS" caption + срок ("на 6 мес" 12 gray-700) |
| 160 | Партнёр(ы) | small logo 16 + name; if multiple partners → AvatarGroup of partner logos (max 3 + "+2") |
| 140 | Филиал | name; truncate; tooltip on overflow |
| 130 | Оператор | Avatar 24 + name; "—" if unassigned |
| 160 | Статус | Pattern H Badge |
| 56  | Actions | MoreHorizontal → Открыть, Одобрить, Отклонить, Переназначить, Скопировать ID |

Row height: 72px (taller because of client subtext + amount stack).
Row click → opens Detail Drawer.

### KANBAN VIEW (toggle)
- 6 columns: Новая · На скоринге · В работе у оператора · Ожидает документы · Одобрена · Отклонена
- Each column: header with status Badge + count
- Cards (radius md, padding 12, gap-8 between): ID, client name, amount, partner logo, time-since
- Drag-and-drop to change status (Operator/Admin only)
- Column scroll independently

### BULK ACTIONS TOOLBAR (Pattern F, appears when rows selected)
"Выбрано: N" + actions: Одобрить, Отклонить, Переназначить оператора, Экспорт, Удалить.

### DETAIL DRAWER (Pattern D, opens on row click)
Width: 720px. Header sticky.

**Header content:**
- Close X · Title "Заявка BR-12483" · Status Badge inline · Right actions: "Одобрить" (success Button), "Отклонить" (danger Button), MoreHorizontal (Переназначить, Запросить документы, Скопировать ссылку)

**Body sections (separated by Separator + section title):**

1. **Сводка** — 2-column grid of InfoRow:
   - Сумма: 4 200 000 UZS
   - Срок: 6 месяцев
   - Создана: 15.05.2026, 14:32
   - Канал: Мобильное приложение
   - Филиал: ТЦ Малика, Ташкент
   - Оператор: Алина Петрова (Avatar inline)

2. **Клиент** — composite block:
   - Avatar 48 + ФИО (16 SemiBold) + ПИНФЛ + телефон
   - Скоринг inline: large number "742" + caption "из 1000" + horizontal progress bar (3px, fills success green for ≥700)
   - Link "Открыть карточку клиента →" (primary)

3. **Этапы обработки (Timeline)** — Pattern J Timeline:
   - ✓ Подача заявки — 14:32
   - ✓ Скоринг отправлен — 14:33 (длительность 1 сек)
   - ✓ Получен ответ Alif Nasiya — 14:34 (53 сек) — "Одобрено"
   - ◐ Подписание договора — в процессе
   - ○ Завершение — ожидается

4. **Решения партнёров** — mini Table inside the Drawer:
   | Партнёр | Время отправки | Время ответа | Решение | Сумма одобрения | Причина |
   3 rows: Alif (Одобрено 4 200 000), Anorbank (Отклонено — низкий скоринг), Uzum (Не отвечает)

5. **Документы клиента** — Grid of doc thumbnails (120×120, radius md, border):
   - Паспорт (лицевая), Паспорт (разворот), Селфи с паспортом, ИНН
   - Hover: dark overlay with Download + Eye icons
   - "+ Загрузить" tile (dashed border, primary on hover)

6. **Банковские карты** — list of cards:
   - Card row: Visa/Mastercard logo + maskedNumber "**** 4521" + bank name + проверка status (Pattern H Badge: Проверена/Отклонена)

7. **Комментарии операторов** — Comment thread:
   - Each: Avatar 28 + name + timestamp + comment text in a gray-100 bubble
   - Compose box at bottom: Textarea + "Добавить комментарий" Button + "Внутренний" Switch (default on)

8. **История изменений (audit)** — collapsible (default closed):
   - Compact list: 12px timestamp + "Алина Петрова изменила статус: На скоринге → Одобрена"

**Footer (sticky, Pattern D):**
- Left ghost: "Скачать PDF договора"
- Right primary: "Сохранить изменения" (disabled until something changed)

### MOCK DATA (10 applications, sample first 3)
1. BR-12483 · 15.05 14:32 · Алиев Озодбек +998 90 123 45 67 · 4 200 000 UZS / 6 мес · Alif · ТЦ Малика · Алина П. · Одобрена
2. BR-12482 · 15.05 14:28 · Каримова Дилнура +998 91 234 56 78 · 1 850 000 UZS / 3 мес · Uzum · Чорсу · — · На скоринге
3. BR-12481 · 15.05 14:21 · Юсупов Жасур +998 93 345 67 89 · 7 600 000 UZS / 12 мес · Anorbank · Самарканд · Бекзод К. · В работе у оператора
(generate 7 more, varied)

### DELIVERABLE
Two routes: `/applications` (list + drawer overlay) and `/applications?id=BR-12483` (drawer pre-opened via query param).