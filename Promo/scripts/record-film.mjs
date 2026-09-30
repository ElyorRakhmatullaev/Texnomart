// Записывает моушн-фильм Promo (страница /embed/film, src/film/) в MP4 — без
// видеоредактора и без лишних пакетов: headless Chrome по протоколу DevTools
// ставит каждый кадр на точный момент (window.__capture.seek), снимает PNG,
// ffmpeg собирает видео. Образец — record-tour.mjs; спецификация —
// docs/superpowers/specs/2026-09-30-promo-motion-film-design.md.
//
//   corepack pnpm film:promo                        # film-out/film-ru-16x9.mp4
//   corepack pnpm film:promo --lang uz
//   corepack pnpm film:promo --chapter approval     # одна сцена
//   corepack pnpm film:promo --audio D:\music.mp3   # с треком, затухание в конце
//   corepack pnpm film:promo --4k                   # 3840×2160
//   corepack pnpm film:promo --stills 1.2,8,23      # кадры PNG, без видео
//
// Dev-сервер Promo должен быть запущен (corepack pnpm dev:promo).
// Параметры: --base http://localhost:5173 (dev-сервер или деплой GitHub Pages),
// --out файл, --fps (60), --aspect 16x9 (9x16 — второй этап), --4k,
// --codec h264|hevc|prores (H.264 играет везде; HEVC — 10 бит и меньше;
// ProRes 4444 — мастер для монтажа, .mov), --crf, --audio.
// Chrome: $CHROME или стандартные пути Windows/macOS/Linux; ffmpeg: $FFMPEG или PATH.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

// «pnpm film:promo -- --lang ru» передаёт «--» скрипту: без этой строки
// parseArgs счёл бы всё после него позиционными аргументами.
const argv = process.argv.slice(2);
if (argv[0] === "--") argv.shift();

const { values: opt } = parseArgs({
  args: argv,
  options: {
    lang: { type: "string", default: "ru" },
    aspect: { type: "string", default: "16x9" },
    base: { type: "string", default: "http://localhost:5173" },
    chapter: { type: "string" },
    out: { type: "string" },
    fps: { type: "string", default: "60" },
    stills: { type: "string" },
    audio: { type: "string" },
    "4k": { type: "boolean", default: false },
    codec: { type: "string", default: "h264" },
    crf: { type: "string" },
  },
});

if (!["ru", "uz"].includes(opt.lang)) throw new Error(`--lang ru|uz, а не ${opt.lang}`);
// Раскладки сцен пока только под 16:9; 9:16 — второй этап (спецификация §6).
if (opt.aspect !== "16x9") {
  throw new Error(`--aspect: сейчас только 16x9 (9x16 — второй этап), а не ${opt.aspect}`);
}
const [width, height] = { "16x9": [1920, 1080], "9x16": [1080, 1920] }[opt.aspect];
// 4K — тот же холст, нарисованный вдвое плотнее.
const scale = opt["4k"] ? 2 : 1;
const fps = Number(opt.fps);
if (!(fps > 0)) throw new Error(`--fps: положительное число, а не ${opt.fps}`);
const codec = opt.codec;
const pix = { h264: "yuv420p", hevc: "yuv420p10le", prores: "yuva444p10le" }[codec];
if (!pix) throw new Error(`--codec h264|hevc|prores, а не ${codec}`);

// pnpm запускает скрипт из Promo/: пути пользователя — от папки, где он набрал команду.
const userPath = (p) => resolve(process.env.INIT_CWD ?? process.cwd(), p);
const OUT_DIR = resolve(import.meta.dirname, "..", "film-out");
mkdirSync(OUT_DIR, { recursive: true });
// Заголовок страницы Promo — по нему видно, что --base смотрит на Promo, а не
// на Dashboard/Broker (все три по умолчанию занимают порт 5173).
const PROMO_TITLE = /<title>([^<]*)<\/title>/.exec(
  readFileSync(resolve(import.meta.dirname, "..", "index.html"), "utf8"),
)?.[1];

const CHROMES = [
  process.env.CHROME,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA &&
    join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);
const chromePath = CHROMES.find((p) => existsSync(p));
if (!chromePath) throw new Error("Chrome не найден: задайте CHROME=путь\\к\\chrome.exe");

const ffmpegPath = process.env.FFMPEG ?? "ffmpeg";
if (!opt.stills && spawnSync(ffmpegPath, ["-version"]).error) {
  throw new Error(
    "ffmpeg не найден: установите его (winget install Gyan.FFmpeg) или задайте FFMPEG=путь\\к\\ffmpeg.exe",
  );
}

// ---- Chrome и протокол DevTools ----
const profile = mkdtempSync(join(tmpdir(), "promo-film-"));
const chrome = spawn(chromePath, [
  "--headless=new",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "--hide-scrollbars",
  "--mute-audio",
  "--no-first-run",
  "--no-default-browser-check",
  "--force-color-profile=srgb",
  `--window-size=${width},${height}`,
  "about:blank",
]);
// Синхронная пауза без новых зависимостей: process.on("exit") не пускает
// async/await, а retryDelay у fs.rmSync здесь не выжидает между попытками.
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// Удаление с паузами: Chrome/ffmpeg могут ещё секунду держать файлы.
const removeSync = (path) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      rmSync(path, { recursive: true, force: true });
      return;
    } catch {
      if (attempt === 9) return; /* лучшее усилие — не критично */
      sleepSync(150);
    }
  }
};
// Недописанное видео (.part) и его ffmpeg — пока идёт запись.
let partial;

// Любой выход (в том числе с ошибкой) не оставляет Chrome, ffmpeg, профиль и
// недописанный файл висеть.
process.on("exit", () => {
  for (const proc of [chrome, partial?.ffmpeg]) {
    try {
      proc?.kill();
    } catch {
      /* уже закрыт */
    }
  }
  removeSync(profile);
  if (partial) removeSync(partial.file);
});
const wsUrl = await new Promise((resolve, reject) => {
  let log = "";
  chrome.stderr.on("data", (d) => {
    log += d;
    const m = /DevTools listening on (ws:\/\/\S+)/.exec(log);
    if (m) resolve(m[1]);
  });
  chrome.on("exit", () => reject(new Error(`Chrome завершился:\n${log}`)));
});

const ws = new WebSocket(wsUrl);
await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
let nextId = 0;
const pending = new Map();
// Упавший посреди записи Chrome иначе оставил бы ждущие вызовы без ответа —
// скрипт висел бы вечно. Все ждущие и все следующие вызовы — с понятной ошибкой.
let lost;
const failAll = (why) => {
  lost ??= why;
  for (const p of pending.values()) p.reject(new Error(lost));
  pending.clear();
};
const dropped = "соединение с Chrome (DevTools) оборвалось — Chrome упал или был закрыт";
ws.addEventListener("close", () => failAll(dropped));
ws.addEventListener("error", () => failAll(dropped));
chrome.on("exit", (code) => failAll(`Chrome завершился (код ${code})`));
let onEvent = () => {};
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.method) return onEvent(msg);
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  if (msg.error) p.reject(new Error(msg.error.message));
  else p.resolve(msg.result);
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    if (lost) return reject(new Error(lost));
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const page = (method, params) => send(method, params, sessionId);

// Ошибки самой страницы (упавший импорт фильма, проверки посева) — в stderr,
// каждая по одному разу: иначе запись молча ждала бы __capture.
const pageErrors = [];
onEvent = ({ method, params, sessionId: from }) => {
  if (from !== sessionId) return;
  let text;
  if (method === "Runtime.exceptionThrown") {
    const d = params.exceptionDetails;
    text = d.exception?.description ?? d.text;
  } else if (method === "Runtime.consoleAPICalled" && params.type === "error") {
    text = params.args.map((a) => a.value ?? a.description ?? a.type).join(" ");
  }
  if (!text || pageErrors.includes(text)) return;
  pageErrors.push(text);
  console.error(`\n[страница] ${text}`);
};
await page("Runtime.enable");
const evaluate = async (expression) => {
  const r = await page("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description ?? expression);
  }
  return r.result.value;
};

await page("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: scale,
  mobile: false,
});
await page("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-color-scheme", value: "light" }],
});
// Даты в кадре не зависят от машины: часовой пояс — как в e2e.
await page("Emulation.setTimezoneOverride", { timezoneId: "Asia/Tashkent" });

// fps — в адресе: сцена-экран повторяет путь записи тактами 1/fps (FilmPage.tsx),
// а не всегда 1/60 — иначе --fps ниже 60 писал бы кадры чаще, чем повтор сцены.
const query = new URLSearchParams({ capture: "1", lang: opt.lang, aspect: opt.aspect, fps: String(fps) });
const url = `${opt.base.replace(/\/+$/, "")}/embed/film?${query}`;
const nav = await page("Page.navigate", { url });
if (nav.errorText) {
  throw new Error(
    `не открылась ${url} (${nav.errorText}) — запущен ли dev-сервер Promo: corepack pnpm dev:promo?`,
  );
}
console.log(`запись ${url}`);

// Чужой сервер на том же порту или адрес без /promo отвечает — но не Promo:
// сказать об этом сразу, а не ждать __capture минуту.
for (let i = 0; ; i++) {
  const loaded = 'document.readyState === "complete" && location.href !== "about:blank"';
  if (await evaluate(loaded).catch(() => false)) break;
  if (lost) throw new Error(lost);
  if (i > 600) throw new Error(`страница не загрузилась за 60 с: ${url}`);
  await new Promise((r) => setTimeout(r, 100));
}
const title = await evaluate("document.title");
if (title !== PROMO_TITLE) {
  throw new Error(
    `по адресу ${url} открылась не Promo (заголовок «${title}», ждали «${PROMO_TITLE}»). ` +
      "Проверьте --base (по умолчанию http://localhost:5173 — этот порт занимают и Dashboard, и Broker; " +
      "для GitHub Pages — адрес с /promo) и запущен ли dev-сервер Promo: corepack pnpm dev:promo",
  );
}

// Страница готова, когда фильм отвечает и шрифты загружены.
const ready = async () => {
  for (let i = 0; ; i++) {
    if (await evaluate("!!window.__capture").catch(() => false)) return;
    if (lost) throw new Error(lost);
    if (i > 600) {
      const cause = pageErrors.length ? ` — ошибка страницы: ${pageErrors[0].split("\n")[0]}` : "";
      throw new Error(`страница не загрузилась за 60 с: ${url}${cause}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }
};
await ready();
await evaluate("document.fonts.ready.then(() => true)");
const { duration, chapters } = await evaluate(
  "({ duration: window.__capture.duration, chapters: window.__capture.chapters })",
);
console.log(chapters.map((c) => `${c.key} ${c.at.toFixed(1)}–${c.end.toFixed(1)} с`).join(" · "));
const chapter = opt.chapter ? chapters.find((c) => c.key === opt.chapter) : undefined;
if (opt.chapter && !chapter) {
  throw new Error(`--chapter: нет главы «${opt.chapter}»; есть: ${chapters.map((c) => c.key).join(", ")}`);
}
const from = chapter?.at ?? 0;
const to = chapter?.end ?? duration;

// PNG — без потерь до кодека; быстрый zlib важен в 4K (8 млн пикселей на кадр).
const shot = async () =>
  Buffer.from(
    (await page("Page.captureScreenshot", { format: "png", optimizeForSpeed: true })).data,
    "base64",
  );
// Dev-сервер перезагружает страницу при правке файла: дождаться и нарисовать
// кадр заново, а не потерять запись.
const seek = async (t) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await evaluate(`window.__capture.seek(${t})`);
    } catch (e) {
      if (attempt > 2) throw e;
      await ready();
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
};

// Вложенные экраны грузятся по требованию: дать им загрузиться до первого кадра.
await seek(from);
await new Promise((r) => setTimeout(r, 1500));

if (opt.stills) {
  for (const t of opt.stills.split(",").map(Number)) {
    // Проиграть подход к моменту: то, что входило перед ним, успевает войти.
    for (let x = Math.max(0, t - 2); x < t; x += 1 / 15) await seek(x);
    await seek(t);
    const file = join(OUT_DIR, `film-${opt.lang}-${opt.aspect}-${t}.png`);
    writeFileSync(file, await shot());
    console.log(`кадр ${file}`);
  }
} else {
  const big = opt["4k"];
  const out = opt.out
    ? userPath(opt.out)
    : join(
        OUT_DIR,
        `film-${opt.lang}-${opt.aspect}${opt.chapter ? `-${opt.chapter}` : ""}${big ? "-4k" : ""}${codec === "prores" ? ".mov" : ".mp4"}`,
      );
  const length = to - from;
  // Трек обрезается по картинке и затухает последние 2 с.
  const audio = opt.audio
    ? [
        "-i",
        userPath(opt.audio),
        "-af",
        `afade=t=out:st=${Math.max(0, length - 2)}:d=2`,
        ...(codec === "prores" ? ["-c:a", "pcm_s16le"] : ["-c:a", "aac", "-b:a", "256k"]),
        "-shortest",
      ]
    : [];
  // Скриншоты — sRGB: перевести матрицей HD (BT.709) и записать это в файл, иначе
  // плееры сдвигают цвета; aq-mode 3 тратит биты на тёмные зоны, где иначе полосит.
  const colour = [
    "scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int",
    `format=${pix}`,
    "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709",
  ];
  const crf = opt.crf ?? (codec === "hevc" ? "16" : big ? "14" : "18");
  const encoder = {
    h264: ["-c:v", "libx264", "-preset", "slow", "-crf", crf, "-profile:v", "high", "-x264-params", "aq-mode=3"],
    hevc: ["-c:v", "libx265", "-preset", "slow", "-crf", crf, "-tag:v", "hvc1", "-x265-params", "aq-mode=3:log-level=error"],
    prores: ["-c:v", "prores_ks", "-profile:v", "4444", "-vendor", "apl0"],
  }[codec];
  // Пишем во временный файл рядом (film-ru-16x9.part.mp4: ffmpeg узнаёт
  // контейнер по расширению) и подменяем им готовый только после успеха —
  // упавшая запись не затирает прошлый удачный ролик недописанным.
  const ext = extname(out);
  const part = `${out.slice(0, out.length - ext.length)}.part${ext}`;
  const ffmpeg = spawn(
    ffmpegPath,
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-c:v",
      "png",
      "-i",
      "-",
      ...audio,
      "-vf",
      colour.join(","),
      ...encoder,
      "-movflags",
      "+faststart",
      part,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  partial = { file: part, ffmpeg };
  // Без этих обработчиков падение ffmpeg посреди потока (битый --audio,
  // неподдерживаемый кодек) роняет скрипт сырым EPIPE вместо понятной ошибки.
  let ffmpegError;
  ffmpeg.on("error", (e) => {
    ffmpegError ??= e;
  });
  ffmpeg.stdin.on("error", (e) => {
    ffmpegError ??= e;
  });
  const exited = new Promise((r) => ffmpeg.once("exit", (code) => r(code)));
  // Кадры в моменты from, from + 1/fps, … строго до to: кадр в момент to — уже
  // первый кадр следующей главы. Допуск — на погрешность сложения длительностей.
  const frames = Math.ceil(length * fps - 1e-6);
  const started = Date.now();
  let written = 0;
  try {
    for (let i = 0; i < frames; i++) {
      if (ffmpegError || ffmpeg.exitCode !== null) break;
      await seek(from + i / fps);
      const png = await shot();
      if (ffmpegError || ffmpeg.exitCode !== null) break;
      if (!ffmpeg.stdin.write(png)) {
        // Мёртвый ffmpeg никогда не пришлёт «drain» — не ждать его вечно.
        await Promise.race([new Promise((r) => ffmpeg.stdin.once("drain", r)), exited]);
      }
      written++;
      if (i % fps === 0) {
        process.stdout.write(
          `\r${Math.round((i / frames) * 100)}% · ${Math.round((Date.now() - started) / 1000)} с`,
        );
      }
    }
    if (!ffmpeg.stdin.destroyed) ffmpeg.stdin.end();
    const code = await exited;
    if (code !== 0 || ffmpegError) {
      throw new Error(
        `ffmpeg завершился с кодом ${code}${ffmpegError ? ` (${ffmpegError.message})` : ""}`,
      );
    }
  } catch (e) {
    // Остановить ffmpeg, дождаться, пока он отпустит файл, и убрать недописанное.
    ffmpeg.kill();
    await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))]);
    removeSync(part);
    partial = undefined;
    throw e;
  }
  partial = undefined;
  try {
    renameSync(part, out);
  } catch (e) {
    throw new Error(`не удалось заменить ${out} (открыт в плеере?); запись — в ${part}: ${e.message}`);
  }
  console.log(
    `\nзаписан ${out} (${written} кадров, ${(written / fps).toFixed(2)} с, ${width * scale}×${height * scale}, ${fps} к/с, ${codec})`,
  );
}

// Профиль Chrome удаляет обработчик выхода — с паузами между попытками:
// штатный rmSync с maxRetries здесь их не выжидает (tasks/lessons.md).
ws.close();
if (chrome.exitCode === null && chrome.signalCode === null) {
  const closed = new Promise((r) => chrome.once("exit", r));
  chrome.kill();
  await closed;
}
