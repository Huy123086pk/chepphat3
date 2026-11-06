import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

export interface Toast {
  id: number;
  msg: string;
}

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-10 left-1/2 z-[80] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
      <AnimatePresence mode="popLayout">
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center gap-2.5 rounded-full border border-candle/25 px-4 py-2 shadow-2xl shadow-black/40 backdrop-blur-md"
            style={{ background: "color-mix(in srgb, var(--panel) 94%, transparent)" }}
          >
            <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-candle" strokeWidth={1.75} />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/85">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
