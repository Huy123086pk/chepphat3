import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SetupScreen } from "./components/SetupScreen";
import { WritingRoom } from "./components/WritingRoom";
import { CompleteScreen, type SessionStats } from "./components/CompleteScreen";
import { Toasts, type Toast } from "./components/Toasts";
import { ThemeToggle, type Theme } from "./components/ThemeToggle";
import { useSeal } from "./hooks/useSeal";
import { hashText } from "./lib/crypto";
import {
  addHistory,
  clearSession,
  loadHistory,
  loadSession,
  removeHistory,
  saveSession,
  type HistoryEntry,
  type SealedSession,
} from "./lib/storage";
import { countWords } from "./lib/text";

type Phase = "setup" | "writing" | "complete";

interface CompletedData {
  title: string;
  text: string;
  goal: number | null;
  stats: SessionStats;
}

function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-ink" />
      <div className="animate-float amb-a absolute -top-44 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-[140px]" />
      <div className="animate-float-late amb-b absolute -bottom-52 -right-40 h-[480px] w-[480px] rounded-full blur-[130px]" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(0,0,0,0.28) 100%)" }}
      />
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<SealedSession | null>(null);
  const [completed, setCompleted] = useState<CompletedData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [continueEntry, setContinueEntry] = useState<HistoryEntry | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastToast = useRef({ msg: "", ts: 0 });

  // ---------- Theme Dark / Light ----------
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"
  );
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("sealed.theme", next);
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  }, []);

  const notify = useCallback((msg: string) => {
    const now = Date.now();
    if (lastToast.current.msg === msg && now - lastToast.current.ts < 1800) return;
    lastToast.current = { msg, ts: now };
    const id = now + Math.random();
    setToasts((t) => [...t.slice(-2), { id, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  // Lớp phong tỏa: hoạt động ở mọi màn, trừ màn kết thúc (để sao chép lại được)
  useSeal(phase !== "complete", notify);

  // Khôi phục phiên đang bị nhốt — tải lại trang không mở được cửa
  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
      setPhase("writing");
      window.setTimeout(() => notify("Đã khôi phục phiên đang phong tỏa"), 500);
    }
  }, [notify]);

  const handleStart = useCallback(
    async (password: string, goal: number | null) => {
      const pwHash = await hashText(password);
      const cont = continueEntry;
      const s: SealedSession = {
        title: cont?.title ?? "",
        text: cont?.text ?? "",
        pwHash,
        startTs: Date.now(),
        goal: goal ?? cont?.goal ?? null,
      };
      saveSession(s);
      setContinueEntry(null);
      setSession(s);
      setPhase("writing");
    },
    [continueEntry]
  );

  const verify = useCallback(
    async (pw: string) => {
      if (!session) return false;
      return (await hashText(pw)) === session.pwHash;
    },
    [session]
  );

  const handleUnlocked = useCallback(
    ({ title, text }: { title: string; text: string }) => {
      if (!session) return;
      const ms = Math.max(1, Date.now() - session.startTs);
      const words = countWords(text);
      const stats: SessionStats = {
        ms,
        words,
        chars: text.length,
        wpm: Math.round(words / (ms / 60000)),
      };
      // Lưu vào lịch sử — lần sau có thể mở lại viết tiếp
      setHistory(addHistory({ title, text, goal: session.goal, words, chars: text.length, ms }));
      clearSession();
      setCompleted({ title, text, goal: session.goal, stats });
      setSession(null);
      setPhase("complete");
    },
    [session]
  );

  const handleRestart = useCallback(() => {
    setCompleted(null);
    setPhase("setup");
  }, []);

  const handleContinue = useCallback(
    (e: HistoryEntry) => {
      setContinueEntry(e);
      notify("Sẽ nạp bản thảo — đặt mật khẩu mới để phong tỏa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [notify]
  );

  const handleRemoveHistory = useCallback(
    (id: number) => {
      setHistory(removeHistory(id));
      setContinueEntry((c) => (c?.id === id ? null : c));
      notify("Đã xóa bản lưu");
    },
    [notify]
  );

  return (
    <div className="relative min-h-screen bg-ink text-bone">
      <Ambient />
      <div className="grain" />

      {/* Nút chuyển Dark / Light — trong phòng viết nó nằm trên thanh công cụ */}
      {phase !== "writing" && (
        <div className="fixed right-5 top-5 z-40">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            transition={{ duration: 0.5 }}
          >
            <SetupScreen
              onStart={(p, g) => void handleStart(p, g)}
              history={history}
              continueEntry={continueEntry}
              onContinue={handleContinue}
              onCancelContinue={() => setContinueEntry(null)}
              onRemoveHistory={handleRemoveHistory}
              onNotify={notify}
            />
          </motion.div>
        )}

        {phase === "writing" && session && (
          <WritingRoom
            key="writing"
            session={session}
            verify={verify}
            onUnlocked={handleUnlocked}
            onNotify={notify}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {phase === "complete" && completed && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            transition={{ duration: 0.5 }}
          >
            <CompleteScreen data={completed} onRestart={handleRestart} onNotify={notify} />
          </motion.div>
        )}
      </AnimatePresence>

      <Toasts items={toasts} />
    </div>
  );
}
