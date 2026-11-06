import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

export type Theme = "dark" | "light";

interface Props {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className = "" }: Props) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      title={isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
      aria-label={isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-bone/10 text-bone/60 transition hover:border-candle/50 hover:text-candle ${className}`}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, y: 6 }}
        animate={{ rotate: 0, opacity: 1, y: 0 }}
        exit={{ rotate: 90, opacity: 0, y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex"
      >
        {isDark ? <Moon className="h-4 w-4" strokeWidth={1.6} /> : <Sun className="h-4 w-4" strokeWidth={1.6} />}
      </motion.span>
    </button>
  );
}
