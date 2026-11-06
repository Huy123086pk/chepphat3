import { useState, type FormEvent } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ClipboardX,
  Download,
  Eye,
  EyeOff,
  FileText,
  Keyboard,
  LockKeyhole,
  PenLine,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { EyeGrid } from "./EyeGrid";
import type { HistoryEntry } from "../lib/storage";
import { asciiName, downloadTextFile } from "../lib/download";
import { fmtClock } from "../lib/text";

interface Props {
  onStart: (password: string, goal: number | null) => void;
  history: HistoryEntry[];
  continueEntry: HistoryEntry | null;
  onContinue: (e: HistoryEntry) => void;
  onCancelContinue: () => void;
  onRemoveHistory: (id: number) => void;
  onNotify: (msg: string) => void;
}

const RULES = [
  {
    icon: Keyboard,
    title: "Chỉ bàn phím & chuột",
    desc: "Gõ từng ký tự bằng tay. Không đường tắt, không thủ thuật, không trợ lý.",
  },
  {
    icon: ClipboardX,
    title: "Ctrl+C / Ctrl+V vô hiệu",
    desc: "Sao chép, cắt, dán, kéo–thả và chuột phải đều bị chặn tuyệt đối trong phòng.",
  },
  {
    icon: LockKeyhole,
    title: "Thoát bằng mật khẩu",
    desc: "Cánh cửa chỉ mở khi nhập đúng mật khẩu bạn đặt. Tải lại trang cũng không chạy thoát được.",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Đoạn code Python minh họa luật chơi — áp dụng tô màu cú pháp */
function Snippet() {
  return (
    <div className="glass max-w-md overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-bone/10 px-4 py-2.5">
        <div className="win-dots">
          <span />
          <span />
          <span />
        </div>
        <span className="font-mono text-[10px] tracking-wide text-comment">luat_choi.py</span>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-6 text-bone/90">
        <code>
          <span className="tok-kw">if</span> <span className="tok-fn">nhap_dung_mat_khau</span>()
          <span className="tok-op">:</span>
          {"\n    "}cua.<span className="tok-fn">mo</span>()      <span className="tok-cm"># duoc thoat ra</span>
          {"\n"}
          <span className="tok-kw">else</span>
          <span className="tok-op">:</span>
          {"\n    "}
          <span className="tok-fn">tiep_tuc_viet</span>() <span className="tok-cm"># khong co loi tat</span>
        </code>
      </pre>
    </div>
  );
}

function HistoryPanel({
  history,
  onContinue,
  onRemove,
  onNotify,
}: {
  history: HistoryEntry[];
  onContinue: (e: HistoryEntry) => void;
  onRemove: (id: number) => void;
  onNotify: (msg: string) => void;
}) {
  if (!history.length) return null;
  const act =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-bone/10 text-bone/50 transition hover:border-candle/60 hover:text-candle";
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">
        Lưu trữ phiên — mở lại & viết tiếp
      </p>
      <ul className="mt-3 space-y-2">
        {history.slice(0, 3).map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 rounded-xl border border-bone/10 bg-panel/40 px-4 py-3"
          >
            <FileText className="h-4 w-4 shrink-0 text-candle/80" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-bone/90">
                {e.title.trim() || "Tài liệu không tên"}
              </p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/40">
                {fmtDate(e.finishedAt)} · {e.words} từ · {fmtClock(e.ms)}
              </p>
            </div>
            <button className={act} title="Viết tiếp bản này" onClick={() => onContinue(e)}>
              <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button
              className={act}
              title="Tải .txt"
              onClick={() => {
                downloadTextFile(
                  `${asciiName(e.title)}.txt`,
                  `${e.title.trim() ? e.title.trim() + "\n\n" : ""}${e.text}`
                );
                onNotify("Đã tải xuống tệp .txt");
              }}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button className={act} title="Xóa bản lưu" onClick={() => onRemove(e.id)}>
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SetupScreen({
  onStart,
  history,
  continueEntry,
  onContinue,
  onCancelContinue,
  onRemoveHistory,
  onNotify,
}: Props) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [goal, setGoal] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 4) return setErr("Mật khẩu cần ít nhất 4 ký tự");
    if (pw !== pw2) return setErr("Mật khẩu xác nhận không khớp");
    const g = parseInt(goal, 10);
    onStart(pw, Number.isFinite(g) && g > 0 ? g : null);
  };

  return (
    <div className="relative z-10 grid min-h-screen overflow-hidden lg:grid-cols-[1.12fr_1fr]">
      {/* Những con mắt dõi theo con trỏ */}
      <EyeGrid tone="dim" density={5} className="absolute inset-0" />

      {/* Cột trái — tuyên ngôn */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col gap-12 p-7 sm:p-12 lg:p-16"
      >
        <motion.header variants={item} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-candle/40 bg-candle/10">
            <LockKeyhole className="h-4 w-4 text-candle" strokeWidth={1.5} />
          </div>
          <span className="font-mono text-lg font-semibold tracking-tight text-bone">
            sealed<span className="tok-kw">.py</span>
          </span>
          <span className="mt-0.5 hidden font-mono text-[9px] uppercase tracking-[0.3em] text-bone/35 sm:inline">
            # phòng viết kín
          </span>
        </motion.header>

        <div>
          <motion.p variants={item} className="mb-6 font-mono text-[10px] uppercase tracking-[0.35em] text-candle">
            {"// Không sao chép — Không dán — Không lối thoát tắt"}
          </motion.p>
          <motion.h1
            variants={item}
            className="font-display text-[40px] font-bold leading-[1.06] tracking-[-0.02em] text-bone sm:text-6xl"
          >
            Ngồi xuống.
            <br />
            Gõ <span className="tok-fn">cho hết</span>
            <br />
            rồi mới được ra.
          </motion.h1>
          <motion.p variants={item} className="mt-7 max-w-md text-[15px] leading-relaxed text-bone/55">
            Một căn phòng văn bản kín. Khi cánh cửa đã đóng, chỉ còn bạn với bàn phím — và một lối ra duy nhất được
            khóa bằng mật khẩu của chính bạn.
          </motion.p>
          <motion.div variants={item} className="mt-8">
            <Snippet />
          </motion.div>
        </div>

        <motion.div variants={item}>
          <ul className="divide-y divide-bone/10 border-y border-bone/10">
            {RULES.map((r, i) => (
              <li key={r.title} className="flex items-start gap-5 py-5">
                <span className="tok-num w-7 pt-1.5 font-mono text-[10px] tracking-[0.2em]">0{i + 1}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-bone/90">{r.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-bone/45">{r.desc}</p>
                </div>
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-bone/10 bg-panel">
                  <r.icon className="h-4 w-4 text-bone/60" strokeWidth={1.5} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <HistoryPanel history={history} onContinue={onContinue} onRemove={onRemoveHistory} onNotify={onNotify} />
          </div>
        </motion.div>
      </motion.section>

      {/* Cột phải — tạo chìa khóa (form kính) */}
      <motion.aside
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex items-center p-7 sm:p-12 lg:border-l lg:border-bone/10 lg:p-14"
      >
        <form onSubmit={submit} className="glass mx-auto w-full max-w-sm rounded-2xl p-7 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="win-dots">
              <span />
              <span />
              <span />
            </div>
            <span className="font-mono text-[10px] tracking-wide text-comment">cau_hinh_phong.py</span>
          </div>

          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-bone">Đặt mật khẩu phong tỏa</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-bone/45">
            Mật khẩu là cánh cửa duy nhất để rời khỏi phòng viết. Chọn thứ bạn nhớ được — bài viết không xóa được.
          </p>

          {continueEntry && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-2.5 rounded-xl border border-candle/30 bg-candle/10 px-4 py-3"
            >
              <PenLine className="h-3.5 w-3.5 shrink-0 text-candle" strokeWidth={1.75} />
              <p className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-bone/80">
                Nạp bản thảo: <span className="text-candle">{continueEntry.title.trim() || "Tài liệu không tên"}</span>
              </p>
              <button
                type="button"
                onClick={onCancelContinue}
                aria-label="Hủy viết tiếp"
                className="text-bone/40 transition hover:text-danger"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </motion.div>
          )}

          <div className="mt-7 space-y-4">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr("");
                }}
                autoComplete="new-password"
                spellCheck={false}
                placeholder="Mật khẩu (tối thiểu 4 ký tự)"
                aria-label="Mật khẩu"
                className="input-pill pr-12"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-bone/35 transition hover:text-candle"
              >
                {show ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw2}
                onChange={(e) => {
                  setPw2(e.target.value);
                  setErr("");
                }}
                autoComplete="new-password"
                spellCheck={false}
                placeholder="Xác nhận mật khẩu"
                aria-label="Xác nhận mật khẩu"
                className="input-pill pr-12"
              />
              <LockKeyhole
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/30"
                strokeWidth={1.5}
              />
            </div>

            <div className="relative">
              <input
                type="number"
                min={1}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Mục tiêu số từ (không bắt buộc)"
                aria-label="Mục tiêu số từ"
                className="input-pill pr-12"
              />
              <Target
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/30"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="mt-4 min-h-5">
            {err && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-[10px] tracking-[0.05em] text-danger"
              >
                ValueError: {err}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            className="btn-accent group mt-2 flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.24em]"
          >
            Phong tỏa & bắt đầu viết
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
          </button>

          <p className="mt-5 font-mono text-[10px] leading-relaxed text-comment">
            # mat_khau duoc bam phia client, khong luu plain-text
          </p>
        </form>
      </motion.aside>
    </div>
  );
}
