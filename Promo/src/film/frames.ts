/** Ждёт n кадров отрисовки окна: после этого изменения DOM уже на экране. */
export function nextFrames(win: Window, n: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (left: number) => {
      if (left === 0) resolve();
      else win.requestAnimationFrame(() => step(left - 1));
    };
    step(n);
  });
}
