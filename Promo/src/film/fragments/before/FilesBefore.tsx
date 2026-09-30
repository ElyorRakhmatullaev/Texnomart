"use client";

import { FileSpreadsheet } from "lucide-react";
import { FILM, INK } from "../../palette";
import { painOf } from "../../story";
import { easeOutExpo, progress } from "../../timeline";
import type { SceneProps } from "../../types";
import { BeforeFrame } from "./BeforeFrame";

/** Имена файлов — «интерфейс», по-русски в обеих версиях. */
const FILES = [
  "План_акций_октябрь.xlsx",
  "План_акций_октябрь_v2.xlsx",
  "План_акций_октябрь_финал.xlsx",
  "План_акций_октябрь_финал_ИСПР.xlsx",
  "План_акций_октябрь_финал_ТОЧНО.xlsx",
];
/** Новое окно — каждые 0,42 с: чуть чаще удара, нарастание. */
const STEP = 0.42;

/** Сетка таблицы; часть ячеек подсвечена — правки, которые расходятся между копиями. */
function SheetGrid({ seed }: { seed: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gridAutoRows: 40, padding: 12 }}>
      {Array.from({ length: 35 }, (_, k) => (
        <div
          key={k}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            borderRight: `1px solid ${INK.gray200}`,
            borderBottom: `1px solid ${INK.gray200}`,
            background: (k * 7 + seed * 3) % 11 === 0 ? INK.amber100 : "transparent",
          }}
        >
          <span
            style={{
              height: 8,
              width: `${40 + ((k * 13 + seed) % 5) * 10}%`,
              borderRadius: 4,
              background: INK.gray200,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Окна-таблицы множатся каскадом; у последнего — «Изменён другим пользователем». */
export function FilesIllustration({ t }: { t: number }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {FILES.map((name, i) => {
        const p = progress(t, i * STEP, i * STEP + 0.3, easeOutExpo);
        if (p <= 0) return null;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: 120 + i * 150,
              top: i * 48,
              width: 640,
              height: 380,
              overflow: "hidden",
              borderRadius: 12,
              background: FILM.card,
              boxShadow: FILM.shadow,
              opacity: p,
              transform: `translateY(${(1 - p) * 60}px) rotate(${-4 + i * 2}deg)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 44,
                padding: "0 16px",
                background: INK.gray100,
                borderBottom: `1px solid ${INK.gray200}`,
              }}
            >
              <FileSpreadsheet size={20} color={INK.gray500} />
              <span style={{ fontSize: 17, fontWeight: 600, color: INK.gray900, whiteSpace: "nowrap" }}>{name}</span>
            </div>
            <SheetGrid seed={i} />
            {i === FILES.length - 1 && (
              <span
                style={{
                  position: "absolute",
                  right: 16,
                  bottom: 16,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: INK.red50,
                  color: INK.red,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Изменён другим пользователем
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FilesBefore({ t, lang }: SceneProps) {
  return (
    <BeforeFrame t={t} headline={painOf("files").headline[lang]}>
      <FilesIllustration t={t} />
    </BeforeFrame>
  );
}
