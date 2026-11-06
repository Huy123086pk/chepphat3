import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, LockOpen, TimerReset } from "lucide-react";
import { EyeGrid } from "./EyeGrid";

interface Props {
  open: boolean;
  onClose: () => void;
  verify: (pw: string) => Promise<boolean>;
  onUnlock: () => void;
}

const COOLDOWN_MS = 30_000;

export function LockOverlay({ open, onClose, verify, onUnlock }: Props) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [shakeKey, setShakeKey] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cooldownLeft = cooldownEnd ? Math.max(0, Math.ceil((cooldownEnd - nowTs) / 1000)) : 0;

  // Đếm ngược thời gian phạt
  useEffect(() => {
    if (!cooldownEnd) return;
    const i = window.setInterval(() => setNowTs(Date.now()), 250);
    return () => window.clearInterval(i);
  }, [cooldownEnd]);

  useEffect(() => {
    if (cooldownEnd && cooldownLeft <= 0) setCooldownEnd(null);
  }, [cooldownLeft, cooldownEnd]);

  // Khóa cuộn trang khi lớp khóa mở + reset trạng thái
  useEffect(() => {
    if (open) {
      setValue("");
      setError("");
      setUnlocked(false);
      document.documentElement.style.overflow = "hidden";
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => {
        window.clearTimeout(t);
        document.documentElement.style.overflow = "";
      };
    }
  }, [open]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!value || cooldownLeft > 0 || unlocked) return;
    const ok = await verify(value);
    if (ok) {
      setUnlocked(true);
      setError("");
      window.setTimeout(onUnlock, 750);
    } else {
      const n = attempts + 1;
      setAttempts(n);
      setValue("");
      setShakeKey((k) => k + 1);
      if (n % 5 === 0) {
        setCooldownEnd(Date.now() + COOLDOWN_MS);
        setError("quá nhiều lần thử sai — phòng tạm khóa 30 giây");
      } else {
        setError("mật khẩu không đúng — cánh cửa vẫn khóa");
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className="absolute inset-0 backdrop-blur-2xl"
            style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}
            onClick={unlocked ? undefined : onClose}
          />

          {/* Cả căn phòng trừng mắt nhìn kẻ định trốn ra */}
          <EyeGrid tone="alert" density={5} className="absolute inset-0" />

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
            className="glass relative w-full max-w-md rounded-2xl px-7 py-8"
          >
            <motion.div key={shakeKey} animate={{ x: [0, -12, 12, -8, 8, -3, 0] }} transition={{ duration: 0.45 }}>
              <div className="flex items-center justify-between">
                <div className="win-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="font-mono text-[10px] tracking-wide text-comment">mo_khoa.py</span>
              </div>

              {/* Vòng khóa */}
              <div className="relative mx-auto mb-6 mt-6 h-24 w-24">
                <div
                  className={`animate-spin-slow absolute inset-0 rounded-full border border-dashed ${
                    unlocked ? "border-candle" : "border-candle/40"
                  }`}
                />
                <div className="absolute inset-2 rounded-full border border-bone/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {unlocked ? (
                    <Check className="h-8 w-8 text-candle" strokeWidth={1.5} />
                  ) : (
                    <LockKeyhole className="h-8 w-8 text-candle" strokeWidth={1.25} />
                  )}
                </div>
              </div>

              <h2 className="text-center font-display text-2xl font-bold tracking-tight text-bone">
                {unlocked ? "Cửa đã mở" : "Cánh cửa đã khóa"}
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-center text-[13.5px] leading-relaxed text-bone/50">
                {unlocked
                  ? "Phiên viết kết thúc. Bản thảo đã được lưu vào lịch sử."
                  : "Nhập mật khẩu để rời khỏi phòng. Hoặc quay lại — bài viết vẫn đang chờ bạn."}
              </p>

              {!unlocked && (
                <form onSubmit={submit} className="mt-7 space-y-4">
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={show ? "text" : "password"}
                      value={value}
                      disabled={cooldownLeft > 0}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setError("");
                      }}
                      autoComplete="new-password"
                      spellCheck={false}
                      placeholder="Mật khẩu phong tỏa"
                      aria-label="Mật khẩu mở phong tỏa"
                      className="input-pill pr-12 text-center tracking-[0.3em] placeholder:tracking-normal"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35 transition hover:text-candle"
                    >
                      {show ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>

                  <div className="min-h-5 text-center">
                    {cooldownLeft > 0 ? (
                      <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-candle">
                        <TimerReset className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Thử lại sau {cooldownLeft}s
                      </p>
                    ) : (
                      error && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="font-mono text-[10px] tracking-[0.05em] text-danger"
                        >
                          PermissionError: {error}
                        </motion.p>
                      )
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!value || cooldownLeft > 0}
                    className="btn-accent flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em]"
                  >
                    <LockOpen className="h-4 w-4" strokeWidth={2} />
                    Mở phong tỏa
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-ghost flex w-full items-center justify-center gap-2.5 rounded-full px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Quay lại viết
                  </button>

                  {attempts > 0 && (
                    <p className="text-center font-mono text-[9px] uppercase tracking-[0.22em] text-bone/30">
                      Lần thử sai: {attempts}
                    </p>
                  )}
                </form>
              )}

              <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-[0.28em] text-bone/25">
                ESC — Quay lại viết
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
