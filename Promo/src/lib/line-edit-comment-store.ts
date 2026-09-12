"use client";

/**
 * Комментарий КМ к правке строки (трекер стр. 57 п. 2).
 *
 * До этого комментарий существовал только внутри `LinePendingChange.comment`
 * — то есть приходил из сида вместе с повторным действием, и КМ не мог ни
 * написать свой, ни поправить написанный. Здесь живёт то, что КМ ввёл сам.
 *
 * Приём тот же, что у `line-decision-store` и `distribution-store`: факт
 * складывается в localStorage, потребители читают его на входе. Провайдер не
 * нужен — потребителей два (панель деталей и карточка согласования), оба
 * читают по id строки.
 *
 * Ключ один: `promo:line-edit-comments`.
 */

const STORAGE_KEY = "promo:line-edit-comments";

export interface LineEditComment {
  comment: string;
  /** Роль-подпись: персональной идентичности в моках нет. */
  by: string;
  /** ISO-момент сохранения. */
  at: string;
}

type StoredMap = Record<string, LineEditComment>;

function read(): StoredMap {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StoredMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: StoredMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // квота / приватный режим — молча пропускаем, комментарий не критичен.
  }
}

export function getLineEditComment(lineId: string): LineEditComment | undefined {
  return read()[lineId];
}

/**
 * Сохранить или снять комментарий. Пустая строка удаляет запись целиком, а не
 * оставляет пустой комментарий: иначе в панели висела бы подпись «Комментарий
 * КМ:» без текста.
 */
export function setLineEditComment(
  lineId: string,
  comment: string,
  by: string
): void {
  const map = read();
  const text = comment.trim();
  if (!text) {
    if (!(lineId in map)) return;
    delete map[lineId];
  } else {
    map[lineId] = { comment: text, by, at: new Date().toISOString() };
  }
  write(map);
}
