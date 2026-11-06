export interface SealedSession {
  title: string;
  text: string;
  pwHash: string;
  startTs: number;
  goal: number | null;
}

export interface HistoryEntry {
  id: number;
  title: string;
  text: string;
  goal: number | null;
  words: number;
  chars: number;
  ms: number;
  finishedAt: number;
}

const KEY = "sealed.session.v1";
const HKEY = "sealed.history.v1";
const HMAX = 30;

/** Đọc phiên đang phong tỏa (nếu có) — tải lại trang cũng không thoát được. */
export function loadSession(): SealedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<SealedSession>;
    if (!s || typeof s.pwHash !== "string" || !s.pwHash) return null;
    return {
      title: typeof s.title === "string" ? s.title : "",
      text: typeof s.text === "string" ? s.text : "",
      pwHash: s.pwHash,
      startTs: typeof s.startTs === "number" ? s.startTs : Date.now(),
      goal: typeof s.goal === "number" && s.goal > 0 ? s.goal : null,
    };
  } catch {
    return null;
  }
}

export function saveSession(s: SealedSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* bộ nhớ đầy — bỏ qua */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}

/* ---------------- Lịch sử phiên đã hoàn tất ---------------- */

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HKEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e): e is HistoryEntry =>
        e && typeof e.id === "number" && typeof e.text === "string" && typeof e.finishedAt === "number"
    );
  } catch {
    return [];
  }
}

export function addHistory(e: Omit<HistoryEntry, "id" | "finishedAt">): HistoryEntry[] {
  const entry: HistoryEntry = {
    ...e,
    id: Date.now() + Math.floor(Math.random() * 1000),
    finishedAt: Date.now(),
  };
  const next = [entry, ...loadHistory()].slice(0, HMAX);
  try {
    localStorage.setItem(HKEY, JSON.stringify(next));
  } catch {
    /* bỏ qua */
  }
  return next;
}

export function removeHistory(id: number): HistoryEntry[] {
  const next = loadHistory().filter((e) => e.id !== id);
  try {
    localStorage.setItem(HKEY, JSON.stringify(next));
  } catch {
    /* bỏ qua */
  }
  return next;
}
