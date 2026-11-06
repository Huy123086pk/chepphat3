import { motion, type Variants } from "framer-motion";
import { Copy, Download, FileText, History, LockOpen, PenLine, Target } from "lucide-react";
import { fmtClock } from "../lib/text";
import { asciiName, downloadTextFile } from "../lib/download";

export interface SessionStats {
  ms: number;
  words: number;
  chars: number;
  wpm: number;
}

interface Props {
  data: {
    title: string;
    text: string;
    goal: number | null;
    stats: SessionStats;
  };
  onRestart: () => void;
  onNotify: (msg: string) => void;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export function CompleteScreen({ data, onRestart, onNotify }: Props) {
  const { title, text, goal, stats } = data;
  const fullText = `${title.trim() ? title.trim() + "\n\n" : ""}${text}`;
  const goalHit = goal != null && stats.words >= goal;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      onNotify("Đã sao chép toàn bộ văn bản");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = fullText;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        onNotify("Đã sao chép toàn bộ văn bản");
      } catch {
        onNotify("Không sao chép được — hãy tải tệp .txt");
      }
      ta.remove();
    }
  };

  const cells: { label: string; value: string; cls: string; unit?: string }[] = [
    { label: "thời_gian", value: fmtClock(stats.ms), cls: "tok-fn" },
    { label: "so_tu", value: stats.words.toLocaleString("vi-VN"), cls: "tok-num" },
    { label: "ky_tu", value: stats.chars.toLocaleString("vi-VN"), cls: "tok-num" },
    { label: "toc_do", value: `${stats.wpm}`, cls: "tok-num", unit: "từ/phút" },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16"
    >
      <motion.p
        variants={item}
        className="inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.32em] text-candle"
      >
        <LockOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
        {"// phiên viết hoàn tất"}
      </motion.p>

      <motion.h1
        variants={item}
        className="mt-5 font-display text-5xl font-bold leading-[1.06] tracking-[-0.02em] text-bone sm:text-6xl"
      >
        Cửa đã mở.
        <br />
        <span className="tok-fn">Chữ vẫn ở lại.</span>
      </motion.h1>

      {goal != null && (
        <motion.p
          variants={item}
          className={`mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] ${
            goalHit ? "tok-num" : "text-bone/40"
          }`}
        >
          <Target className="h-3.5 w-3.5" strokeWidth={1.75} />
          {goalHit
            ? `Mục tiêu ${goal.toLocaleString("vi-VN")} từ — đã hoàn thành`
            : `Mục tiêu ${goal.toLocaleString("vi-VN")} từ — đạt ${Math.round((stats.words / goal) * 100)}%`}
        </motion.p>
      )}

      <motion.div
        variants={item}
        className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-bone/10 bg-bone/10 sm:grid-cols-4"
      >
        {cells.map((c) => (
          <div key={c.label} className="bg-panel p-5 sm:p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-bone/40">{c.label}</p>
            <p className={`mt-3 font-mono text-xl font-semibold sm:text-2xl ${c.cls}`}>
              {c.value}
              {c.unit && (
                <span className="ml-1.5 font-mono text-[10px] font-normal uppercase tracking-wider text-bone/40">
                  {c.unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} className="glass mt-8 overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-bone/10 px-5 py-3.5">
          <div className="win-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-wide text-comment">
            <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
            ban_thao.txt
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto px-6 py-6">
          <h3 className="font-mono text-lg font-semibold text-bone">{title.trim() || "tai_lieu_khong_ten"}</h3>
          <p className="mt-4 whitespace-pre-wrap font-mono text-[13.5px] leading-[1.9] text-bone/70">
            {text.trim() || "…trang giấy trắng tinh. Lần sau sẽ khác."}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={copyAll}
          className="btn-ghost flex items-center gap-2.5 rounded-full px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em]"
        >
          <Copy className="h-4 w-4" strokeWidth={1.5} />
          Sao chép văn bản
        </button>
        <button
          onClick={() => {
            downloadTextFile(`${asciiName(title)}.txt`, fullText);
            onNotify("Đã tải xuống tệp .txt");
          }}
          className="btn-ghost flex items-center gap-2.5 rounded-full px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em]"
        >
          <Download className="h-4 w-4" strokeWidth={1.5} />
          Tải .txt
        </button>
        <button
          onClick={onRestart}
          className="btn-accent flex items-center gap-2.5 rounded-full px-7 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em]"
        >
          <PenLine className="h-4 w-4" strokeWidth={2} />
          Phiên viết mới
        </button>
      </motion.div>

      <motion.p
        variants={item}
        className="mt-7 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/35"
      >
        <History className="h-3.5 w-3.5" strokeWidth={1.75} />
        Đã lưu vào lịch sử — mở lại & viết tiếp bản này ở màn thiết lập
      </motion.p>
      <motion.p variants={item} className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-bone/30">
        Phong tỏa đã tắt — bạn có thể sao chép tự do trở lại
      </motion.p>
    </motion.div>
  );
}
