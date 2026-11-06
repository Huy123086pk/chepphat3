import { useCallback, useEffect, useRef } from "react";

type Kind = "tap" | "space" | "enter" | "back";

/**
 * Tiếng gõ phím cơ tổng hợp bằng WebAudio — transient noise + "thock" trầm.
 * Không cần tệp âm thanh ngoài.
 */
export function useKeySound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(
    () => () => {
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
    },
    []
  );

  return useCallback(
    (kind: Kind) => {
      if (!enabled) return;
      try {
        if (!ctxRef.current) {
          const AC =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AC) return;
          ctxRef.current = new AC();
        }
        const ac = ctxRef.current;
        if (ac.state === "suspended") void ac.resume();
        const t = ac.currentTime;

        const master = ac.createGain();
        master.gain.setValueAtTime(0.15, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
        master.connect(ac.destination);

        // Click trong suốt (noise burst qua bandpass)
        const len = Math.floor(ac.sampleRate * 0.03);
        const buf = ac.createBuffer(1, len, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ac.createBufferSource();
        src.buffer = buf;
        const bp = ac.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value =
          kind === "enter" ? 850 : kind === "back" ? 1350 : kind === "space" ? 1050 : 1750 + Math.random() * 900;
        bp.Q.value = 1.1;
        src.connect(bp);
        bp.connect(master);
        src.start(t);

        // Thock trầm của thân phím
        const osc = ac.createOscillator();
        osc.type = "sine";
        const base = kind === "space" ? 140 : kind === "enter" ? 120 : 180 + Math.random() * 50;
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.08);
        const og = ac.createGain();
        og.gain.setValueAtTime(0.4, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(og);
        og.connect(master);
        osc.start(t);
        osc.stop(t + 0.1);
      } catch {
        /* âm thanh là phần thưởng, không phải nghĩa vụ */
      }
    },
    [enabled]
  );
}
