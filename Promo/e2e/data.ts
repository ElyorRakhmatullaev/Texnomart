/** Сиды прототипа, на которые опираются тесты (Promo/src/lib/*). */

/** 28.09.2026 12:00 по Ташкенту, понедельник. Все сроки в сидах считаются от «сейчас». */
export const FIXED_NOW = new Date('2026-09-28T12:00:00+05:00');

export const ROLES = {
  KD: 'Коммерческий директор',
  OD: 'Операционный директор',
  DM: 'Директор маркетинга',
  KM: 'Категорийный менеджер (КМ)',
  SKM: 'Старший КМ',
  MKT: 'Сотрудник маркетинга',
  PUR: 'Сотрудник закупа',
  ANL: 'Сотрудник аналитики',
  ADMIN: 'Администратор',
} as const;
export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** users-store.ts:97-134. role — основная роль (с неё начинается сессия). */
export const USERS = {
  'u-1': { name: 'Сардор Мавлянов', email: 'sardor@texnomart.uz', password: 'Director2026!', role: ROLES.KD },
  'u-2': { name: 'Администратор Системы', email: 'admin@texnomart.uz', password: 'Admin2026!', role: ROLES.ADMIN },
  'u-3': { name: 'Резервный Администратор', email: 'reserv@texnomart.uz', password: 'Backup2026!', role: ROLES.ADMIN },
  'u-4': { name: 'Каримов Шохрух', email: 'karimov@texnomart.uz', password: 'Manager2026!', role: ROLES.KM },
  'u-5': { name: 'Исмаилов Жасур', email: 'ismailov@texnomart.uz', password: 'Senior2026!', role: ROLES.SKM },
  'u-6': { name: 'Алиева Нигора', email: 'alieva@texnomart.uz', password: 'Market2026!', role: ROLES.MKT },
  'u-7': { name: 'Новый Сотрудник', email: 'newuser@texnomart.uz', password: 'Temp1234!a', role: ROLES.PUR },
  // u-8 — активное «Уполномоченное лицо КД» до 31.12.2026: для роли КМ не использовать.
  'u-8': { name: 'Тошматов Фаррух', email: 'toshmatov@texnomart.uz', password: 'Manager2026!', role: ROLES.KM },
} as const;
export type UserId = keyof typeof USERS;

/** PR-2026-00X ↔ «26-X» (formatPromoNo). */
export const PROMO = {
  p1: { id: 'PR-2026-001', no: '26-1', name: 'Чёрная пятница 2026' },
  p2: { id: 'PR-2026-002', no: '26-2', name: 'Рассрочка на технику к Новому году' },
  p3: { id: 'PR-2026-003', no: '26-3', name: '1+1 на мелкую бытовую технику' },
  p4: { id: 'PR-2026-004', no: '26-4', name: 'Распродажа ТВ и аудио' },
  p5: { id: 'PR-2026-005', no: '26-5', name: 'Cashback на смартфоны' },
  p6: { id: 'PR-2026-006', no: '26-6', name: 'Скидки на климатическую технику' },
  p8: { id: 'PR-2026-008', no: '26-8' },
  p11: { id: 'PR-2026-011', no: '26-11' },
  u15: { id: 'UN-2026-015', no: '26-15' },
} as const;

/** Строки полного календаря и отчётов (promo-mock-data.ts:1016-1121, отчёты :3158+). */
export const LINES = {
  saundbar: 'Saund-бар Samsung HW-B650', // 26-1, km-1, отклонена
  xiaomi: 'Xiaomi TV A2 50"', // 26-3, km-1, согласована
  lgOled: 'LG OLED 48" OLED48C4', // 26-3, km-1, ожидает добавления
  delonghi: "Кофемашина De'Longhi Magnifica", // 26-3, km-4, ожидает изменения
  dyson: 'Пылесос Dyson V12', // 26-3, km-4, согласована
  boschBlender: 'Блендер Bosch ErgoMixx', // 26-3, km-4, ожидает исключения
  fan: 'Вентилятор Centek CT-5015', // нигде не используется — для добавления
  samsungFridge: 'Samsung RB37 No Frost', // отчёт 26-15: Добавлено
  lgFridge: 'LG GC-B247 Side-by-Side', // отчёт 26-15: Изменено
  boschWasher: 'Стиральная машина Bosch WGG', // отчёт 26-15: Исключено
} as const;

export const KM = {
  aliev: 'Алиев Бекзод', // km-1 — КМ-вид полного календаря
  yusupova: 'Юсупова Нигора', // km-2
  karimov: 'Каримов Шерзод', // km-3 — КМ-область аудита
  ismailov: 'Исмаилов Жасур', // km-6, старший КМ
} as const;

/** Девять согласованных категорий распределения (distribution-store.ts:28-38). */
export const CATEGORIES = [
  'Климатическая техника и техника для ухода за домом',
  'Крупно-бытовая техника для кухни',
  'Мелко-бытовая техника для дома, уход за одеждой, красота и здоровье',
  'Мелко-бытовая техника для кухни',
  'Аудио и видео техника, геймерские товары',
  'Техника для офиса, умный дом, компьютеры и периферия',
  'Персональная электроника',
  'Автотовары, спорт товары и товары для дома и сада',
  'Посуда для дома',
] as const;

/** Старые названия (distribution-store.ts:49-56) — не должны показываться. */
export const LEGACY_CATEGORIES = [
  'Телевизоры и аудио',
  'Холодильники и крупная БТ',
  'Смартфоны и гаджеты',
  'Мелкая бытовая техника',
  'Ноутбуки и ПК',
  'Климатическая техника',
] as const;
