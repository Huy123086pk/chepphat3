import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Tone = "dim" | "alert";

interface GridProps {
  tone?: Tone;
  /** Số mắt trên cạnh dài nhất của vùng chứa */
  density?: number;
  blink?: boolean;
  className?: string;
}

const LID_PATH = "M 50 500 Q 500 0 950 500 Q 500 850 50 500";
const TRAVEL_X = 280;
const TRAVEL_Y = 120;

const clamp = (v: number, min: number, max: number) => (v <= min ? min : v >= max ? max : v);
const map = (v: number, a: number, b: number, c: number, d: number) => ((v - a) * (d - c)) / (b - a) + c;

const Eye = memo(function Eye({ blinkDelay, blinkDuration }: { blinkDelay: number; blinkDuration: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "e");
  return (
    <svg viewBox="0 0 1000 1000" className="eye-svg" aria-hidden="true">
      <defs>
        <clipPath id={uid}>
          <path d={LID_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid})`}>
        <g
          className="eye-blink"
          style={{ animationDelay: `${blinkDelay}s`, animationDuration: `${blinkDuration}s` }}
        >
          <rect className="eye-whites" width="1000" height="1000" />
          <g className="eye-pupil-group">
            <circle className="eye-pupil" cx="500" cy="500" r="150" />
            <circle className="eye-glint" cx="438" cy="438" r="24" />
          </g>
        </g>
      </g>
      <path className="eye-lids" d={LID_PATH} />
    </svg>
  );
});

/** Mắt dõi dùng chung: theo tọa độ chuột, trả về transform cho phần tử */
function useEyeFollow(getSize: () => number, strength: { scaleMin: number; scaleMax: number }) {
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let center = { x: 0, y: 0 };
    let size = 1;
    let maxDist = 6;
    let raf = 0;
    let px = 0;
    let py = 0;
    let dirty = false;

    const measure = () => {
      const r = el.getBoundingClientRect();
      center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      size = Math.max(1, getSize() || r.width);
      maxDist = Math.hypot(window.innerWidth / size, window.innerHeight / size) * 0.9;
    };

    const apply = (x: number, y: number) => {
      const vx = x - center.x;
      const vy = y - center.y;
      const nd = Math.hypot(vx / size, vy / size);
      const pupilX = clamp((vx * 1000) / size, -TRAVEL_X, TRAVEL_X);
      const pupilY = clamp((vy * 1000) / size, -TRAVEL_Y, TRAVEL_Y);
      const scale = clamp(map(nd, 0, maxDist, strength.scaleMin, strength.scaleMax), 0.5, 1.25);
      el.style.setProperty("--pupil-x", `${pupilX.toFixed(1)}px`);
      el.style.setProperty("--pupil-y", `${pupilY.toFixed(1)}px`);
      el.style.setProperty("--scale", scale.toFixed(3));
    };

    const flush = () => {
      raf = 0;
      if (dirty) {
        apply(px, py);
        dirty = false;
      }
    };
    const schedule = (x: number, y: number) => {
      px = x;
      py = y;
      dirty = true;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const mm = (e: MouseEvent) => schedule(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) schedule(t.clientX, t.clientY);
    };
    const reset = () => {
      measure();
      schedule(window.innerWidth / 2, window.innerHeight * 0.42);
    };

    measure();
    schedule(window.innerWidth / 2, window.innerHeight * 0.42);
    window.addEventListener("mousemove", mm, { passive: true });
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("resize", reset);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("resize", reset);
      window.removeEventListener("scroll", measure);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return elRef;
}

/* ================== Một con mắt lẻ, dõi theo con trỏ ================== */

interface WatcherProps {
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function WatcherEye({ size = 72, style, className = "" }: WatcherProps) {
  const ref = useEyeFollow(() => size, { scaleMin: 0.85, scaleMax: 1.1 });
  const { delay, dur } = useMemo(
    () => ({ delay: -(Math.random() * 6), dur: 4 + Math.random() * 4 }),
    []
  );
  return (
    <div ref={ref} className={`watcher-eye ${className}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      <Eye blinkDelay={delay} blinkDuration={dur} />
    </div>
  );
}

/* ================== Lưới mắt phủ kín một vùng ================== */

interface Center {
  x: number;
  y: number;
  size: number;
}

export function EyeGrid({ tone = "dim", density = 5, blink = true, className = "" }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const centersRef = useRef<(Center | null)[]>([]);
  const maxDistRef = useRef(6);
  const [dims, setDims] = useState({ cols: 0, rows: 0 });

  const eyes = useMemo(() => {
    const n = dims.cols * dims.rows;
    return Array.from({ length: n }, (_, i) => ({
      key: i,
      blinkDelay: -(Math.random() * 6),
      blinkDuration: 3.6 + Math.random() * 4.4,
    }));
  }, [dims]);

  const measure = useCallback(() => {
    const cells = cellsRef.current;
    centersRef.current = cells.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: Math.max(1, r.width) };
    });
    const size = centersRef.current.find(Boolean)?.size ?? 200;
    maxDistRef.current = Math.hypot(window.innerWidth / size, window.innerHeight / size) * 0.85;
  }, []);

  const look = useCallback((x: number, y: number) => {
    const cells = cellsRef.current;
    const centers = centersRef.current;
    for (let i = 0; i < centers.length; i++) {
      const c = centers[i];
      const el = cells[i];
      if (!c || !el) continue;
      const vx = x - c.x;
      const vy = y - c.y;
      const nd = Math.hypot(vx / c.size, vy / c.size);
      const px = clamp((vx * 1000) / c.size, -TRAVEL_X, TRAVEL_X);
      const py = clamp((vy * 1000) / c.size, -TRAVEL_Y, TRAVEL_Y);
      const scale = clamp(map(nd, 0, maxDistRef.current, 0.58, 1.14), 0.5, 1.22);
      el.style.setProperty("--pupil-x", `${px.toFixed(1)}px`);
      el.style.setProperty("--pupil-y", `${py.toFixed(1)}px`);
      el.style.setProperty("--scale", scale.toFixed(3));
    }
  }, []);

  // Dựng lưới theo kích thước vùng chứa
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const size = Math.max(80, Math.round(Math.max(r.width, r.height) / density));
      const cols = Math.max(2, Math.ceil(r.width / size));
      const rows = Math.max(2, Math.ceil(r.height / size));
      setDims((d) => (d.cols === cols && d.rows === rows ? d : { cols, rows }));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [density]);

  // Đo tâm từng mắt sau khi lưới dựng xong
  useLayoutEffect(() => {
    if (!dims.cols) return;
    measure();
    look(window.innerWidth / 2, window.innerHeight * 0.42);
    const onScroll = () => measure();
    const onResize = () => {
      measure();
      look(window.innerWidth / 2, window.innerHeight * 0.42);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [dims, measure, look]);

  // Theo dõi con trỏ, giới hạn bằng requestAnimationFrame
  useEffect(() => {
    let raf = 0;
    let px = 0;
    let py = 0;
    let dirty = false;
    const flush = () => {
      raf = 0;
      if (dirty) {
        look(px, py);
        dirty = false;
      }
    };
    const schedule = (x: number, y: number) => {
      px = x;
      py = y;
      dirty = true;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const mm = (e: MouseEvent) => schedule(e.clientX, e.clientY);
    const tm = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) schedule(t.clientX, t.clientY);
    };
    window.addEventListener("mousemove", mm, { passive: true });
    window.addEventListener("touchmove", tm, { passive: true });
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("touchmove", tm);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [look]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`eye-grid eye-grid--${tone} ${blink ? "" : "eye-grid--still"} ${className}`}
      style={{
        gridTemplateColumns: `repeat(${dims.cols || 1}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${dims.rows || 1}, minmax(0, 1fr))`,
      }}
    >
      {eyes.map((e, i) => (
        <div
          key={e.key}
          ref={(el) => {
            cellsRef.current[i] = el;
          }}
          className="eye-cell"
        >
          <Eye blinkDelay={e.blinkDelay} blinkDuration={e.blinkDuration} />
        </div>
      ))}
    </div>
  );
}
