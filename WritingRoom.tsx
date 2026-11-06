import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { LockOverlay } from "./LockOverlay";
import { BongoCat } from "./BongoCat";
import { WatcherEye } from "./EyeGrid";
import { ThemeToggle, type Theme } from "./ThemeToggle";
import { useKeySound } from "../hooks/useKeySound";
import { countWords, fmtClock } from "../lib/text";
import { saveSession, type SealedSession } from "../lib/storage";

interface Props {
  session: SealedSession;
  verify: (pw: string) => Promise<boolean>;
  onUnlocked: (data: { title: string; text: string }) => void;
  onNotify: (msg: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
}

function grow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "0px";
  el.style.height = `${el.scrollHeight}px`;
}

function IconBtn({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-bone/10 text-bone/55 transition hover:border-candle/50 hover:text-candle"
    >
      {children}
    </button>
  );
}

export function WritingRoom({ session, verify, onUnlocked, onNotify, theme, onToggleTheme }: Props) {
  const { startTs, goal, pwHash } = session;
  const [title, setTitle] = useState(session.title);
  const [text, setText] = useState(session.text);
  const [now, setNow] = useState(() => Date.now());
  const [lockOpen, setLockOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [tick, setTick] = useState(0);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const announced = useRef(goal != null && countWords(session.text) >= goal);
  const play = useKeySound(!muted);

  const words = useMemo(() => countWords(text), [text]);
  const elapsed = Math.max(0, now - startTs);
  const goalHit = goal != null && words >= goal;

  // Đồng hồ phiên
  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(i);
  }, []);

  // Tự giãn chiều cao textarea
  useLayoutEffect(() => {
    grow(titleRef.current);
    grow(bodyRef.current);
  }, [title, text]);

  useEffect(() => {
    bodyRef.current?.focus();
  }, []);

  // Tự lưu — thoát bằng cách tải lại trang là vô nghĩa
  useEffect(() => {
    const t = window.setTimeout(() => saveSession({ title, text, pwHash, startTs, goal }), 300);
    return () => window.clearTimeout(t);
  }, [title, text, pwHash, startTs, goal]);

  // Phím ESC mở/đóng lớp khóa
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setLockOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cảnh báo trước khi đóng tab
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  // Theo dõi toàn màn hình
  useEffect(() => {
    const h = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Thông báo đạt mục tiêu (một lần)
  useEffect(() => {
    if (goalHit && !announced.current) {
      announced.current = true;
      onNotify("Đã đạt mục tiêu số từ — cửa vẫn khóa nhé");
    }
  }, [goalHit, onNotify]);

  const onTypeKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === " ") play("space");
    else if (e.key === "Enter") play("enter");
    else if (e.key === "Backspace" || e.key === "Delete") play("back");
    else if (e.key.length === 1) play("tap");
    if (e.key.length === 1 || e.key === " " || e.key === "Enter" || e.key === "Backspace") {
      setTick((t) => t + 1);
    }
  };

  const toggleFs = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void document.documentElement.requestFullscreen().catch(() => undefined);
  };

  const handleUnlock = () => {
    setLockOpen(false);
    onUnlocked({ title, text });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 min-h-screen"
    >
      {/* Vài con mắt lặng lẽ dõi theo — chỉ vài con thôi, kẻo rối */}
      <WatcherEye size={64} style={{ left: "3.5%", top: "24%" }} className="hidden lg:block" />
      <WatcherEye size={88} style={{ right: "3%", top: "44%" }} className="hidden lg:block" />
      <WatcherEye size={54} style={{ left: "8%", bottom: "16%" }} className="hidden lg:block" />

      {/* Thanh trên */}
      <header className="fade-top fixed inset-x-0 top-0 z-40">
        <div className="relative mx-auto flex max-w-[1100px] items-center justify-between px-5 pb-5 pt-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-semibold tracking-tight text-bone">
              sealed<span className="tok-kw">.py</span>
            </span>
            <span className="hidden items-center gap-2 rounded-full border border-candle/25 bg-candle/10 px-3 py-1.5 sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-candle opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-candle" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-candle">Đang phong tỏa</span>
            </span>
          </div>

          <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/45 lg:flex">
            <span className="tok-num">{words} từ</span>
            <span className="text-bone/15">|</span>
            <span>{text.length} ký tự</span>
            <span className="text-bone/15">|</span>
            <span className="tok-fn">{fmtClock(elapsed)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {goalHit && (
              <span className="mr-1 hidden items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-candle md:flex">
                <Check className="h-3 w-3" strokeWidth={2.5} />
                Đạt mục tiêu
              </span>
            )}
            <IconBtn onClick={() => setMuted((m) => !m)} label={muted ? "Bật tiếng phím" : "Tắt tiếng phím"}>
              {muted ? (
                <VolumeX className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Volume2 className="h-4 w-4" strokeWidth={1.5} />
              )}
            </IconBtn>
            <IconBtn onClick={toggleFs} label={fs ? "Thoát toàn màn hình" : "Toàn màn hình"}>
              {fs ? (
                <Minimize2 className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
              )}
            </IconBtn>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              onClick={() => setLockOpen(true)}
              className="btn-ghost ml-1 flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em]"
            >
              <Lock className="h-3 w-3" strokeWidth={2} />
              Thoát
            </button>
          </div>
        </div>
      </header>

      {/* Vùng soạn */}
      <main className="mx-auto max-w-[760px] px-6 pb-44 pt-32 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onTypeKey}
            rows={1}
            placeholder="nhan_de"
            spellCheck={false}
            aria-label="Nhan đề"
            className="w-full resize-none overflow-hidden bg-transparent font-mono text-2xl font-semibold leading-[1.3] text-bone placeholder:font-normal placeholder:text-bone/20 sm:text-3xl"
          />
          <div className="hairline my-9" />
          <textarea
            ref={bodyRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onTypeKey}
            placeholder="# chi co ban, con tro va ban phim. bat dau go..."
            spellCheck={false}
            aria-label="Nội dung"
            className="min-h-[45vh] w-full resize-none overflow-hidden bg-transparent font-mono text-[14.5px] leading-[2.05] text-bone/85 placeholder:italic placeholder:text-bone/20 sm:text-[15px]"
          />
        </motion.div>
      </main>

      {/* Thanh đáy: gợi ý + tiến độ mục tiêu */}
      <footer className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex max-w-[1100px] items-center gap-6 px-5 pb-3 pr-48 font-mono text-[9px] uppercase tracking-[0.22em] text-bone/30">
          <span className="hidden sm:inline">esc() — cua_thoat</span>
          <span className="hidden flex-1 text-center md:inline">ban_phim + chuot · copy/paste = False</span>
          {goal != null && (
            <span className={`ml-auto ${goalHit ? "tok-num" : ""}`}>
              {words} / {goal} từ {goalHit && "— hoàn thành"}
            </span>
          )}
        </div>
        {goal != null && (
          <div className="h-[3px] w-full bg-bone/[0.07]">
            <motion.div
              className="progress-fill"
              initial={false}
              animate={{ width: `${Math.min(100, (words / goal) * 100)}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
            />
          </div>
        )}
      </footer>

      {/* Bongo Cat gõ phím cùng bạn */}
      <BongoCat tick={tick} />

      <LockOverlay open={lockOpen} onClose={() => setLockOpen(false)} verify={verify} onUnlock={handleUnlock} />
    </motion.div>
  );
}
