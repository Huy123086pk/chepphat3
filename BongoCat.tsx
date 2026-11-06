import { useEffect, useRef, useState } from "react";

interface Props {
  /** Tăng lên mỗi lần gõ phím — mèo sẽ đập bàn tay tương ứng */
  tick: number;
}

/**
 * Bongo Cat mini ngồi góc dưới bên phải, gõ bàn phím theo bạn.
 * Vẽ thủ công bằng SVG + CSS, đổi màu theo theme.
 */
export function BongoCat({ tick }: Props) {
  const [paw, setPaw] = useState<"left" | "right" | null>(null);
  const [keyHit, setKeyHit] = useState(0);
  const sideRef = useRef<"left" | "right">("left");
  const timerRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tick) return;
    const side = sideRef.current;
    sideRef.current = side === "left" ? "right" : "left";
    setPaw(side);
    setKeyHit((k) => (k + 1) % 6);
    if (wrapRef.current) {
      wrapRef.current.style.setProperty("--tilt", side === "left" ? "-2.5deg" : "2.5deg");
      wrapRef.current.classList.add("bongo-typing");
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setPaw(null);
      wrapRef.current?.classList.remove("bongo-typing");
    }, 140);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [tick]);

  return (
    <div className="bongo" ref={wrapRef} aria-hidden="true">
      <svg viewBox="0 0 240 172">
        {/* thân ẩn sau bàn */}
        <ellipse className="bongo-fur" cx="120" cy="128" rx="52" ry="26" />

        {/* đầu mèo */}
        <g className="bongo-head">
          <path className="bongo-ear" d="M 88 46 L 99 14 L 113 41 Z" />
          <path className="bongo-ear" d="M 127 41 L 141 14 L 152 46 Z" />
          <circle className="bongo-fur" cx="120" cy="64" r="37" />
          <g className="bongo-eyes">
            <circle cx="107" cy="62" r="4.6" />
            <circle cx="133" cy="62" r="4.6" />
          </g>
          <circle className="bongo-blush" cx="95" cy="75" r="6" />
          <circle className="bongo-blush" cx="145" cy="75" r="6" />
          {/* mũi + miệng */}
          <path className="bongo-line" d="M 117 71 L 123 71 L 120 75 Z" />
          <path className="bongo-line" d="M 120 75 Q 120 81 113 82" />
          <path className="bongo-line" d="M 120 75 Q 120 81 127 82" />
          {/* ria mép */}
          <path className="bongo-line" opacity="0.55" d="M 62 62 L 86 67" />
          <path className="bongo-line" opacity="0.55" d="M 62 76 L 86 74" />
          <path className="bongo-line" opacity="0.55" d="M 154 67 L 178 62" />
          <path className="bongo-line" opacity="0.55" d="M 154 74 L 178 76" />
        </g>

        {/* bàn phím mini trên mặt bàn */}
        <rect className="bongo-keys" x="86" y="106" width="88" height="24" rx="8" />
        <g className="bongo-keycaps">
          <rect className={keyHit === 0 ? "is-hit" : ""} x="94" y="113" width="10" height="4" rx="2" />
          <rect className={keyHit === 1 ? "is-hit" : ""} x="108" y="113" width="10" height="4" rx="2" />
          <rect className={keyHit === 2 ? "is-hit" : ""} x="122" y="113" width="10" height="4" rx="2" />
          <rect className={keyHit === 3 ? "is-hit" : ""} x="136" y="113" width="10" height="4" rx="2" />
          <rect className={keyHit === 4 ? "is-hit" : ""} x="150" y="113" width="10" height="4" rx="2" />
          <rect className={keyHit === 5 ? "is-hit" : ""} x="106" y="121" width="44" height="4" rx="2" />
        </g>

        {/* hai bàn tay */}
        <ellipse className={`bongo-fur bongo-paw ${paw === "left" ? "is-up" : ""}`} cx="72" cy="118" rx="19" ry="12" />
        <ellipse className={`bongo-fur bongo-paw ${paw === "right" ? "is-up" : ""}`} cx="184" cy="118" rx="19" ry="12" />

        {/* mặt bàn */}
        <rect className="bongo-desk" x="6" y="128" width="228" height="36" rx="16" />
      </svg>
    </div>
  );
}
