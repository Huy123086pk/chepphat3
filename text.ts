export function countWords(t: string): number {
  const x = t.trim();
  return x ? x.split(/\s+/).length : 0;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
