import { useEffect, useRef } from "react";

/**
 * Lớp "phong tỏa": chặn sao chép / cắt / dán / chuột phải / kéo–thả
 * và các phím tắt Ctrl(Cmd)+C / V / X ở cấp tài liệu.
 */
export function useSeal(enabled: boolean, onBlock: (msg: string) => void) {
  const cb = useRef(onBlock);
  useEffect(() => {
    cb.current = onBlock;
  }, [onBlock]);

  useEffect(() => {
    if (!enabled) return;
    const notify = (msg: string) => cb.current(msg);

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      notify("Sao chép đã bị chặn");
    };
    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      notify("Cắt đã bị chặn");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      notify("Dán đã bị chặn");
    };
    const onMenu = (e: MouseEvent) => {
      e.preventDefault();
      notify("Chuột phải đã bị vô hiệu");
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      notify("Kéo – thả đã bị chặn");
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "c" || k === "v" || k === "x")) {
        e.preventDefault();
        e.stopPropagation();
        notify(`Ctrl + ${k.toUpperCase()} đã bị chặn`);
      }
    };

    const opts: AddEventListenerOptions = { capture: true };
    document.addEventListener("copy", onCopy, opts);
    document.addEventListener("cut", onCut, opts);
    document.addEventListener("paste", onPaste, opts);
    document.addEventListener("contextmenu", onMenu, opts);
    document.addEventListener("dragover", onDragOver, opts);
    document.addEventListener("drop", onDrop, opts);
    document.addEventListener("keydown", onKey, opts);
    return () => {
      document.removeEventListener("copy", onCopy, opts);
      document.removeEventListener("cut", onCut, opts);
      document.removeEventListener("paste", onPaste, opts);
      document.removeEventListener("contextmenu", onMenu, opts);
      document.removeEventListener("dragover", onDragOver, opts);
      document.removeEventListener("drop", onDrop, opts);
      document.removeEventListener("keydown", onKey, opts);
    };
  }, [enabled]);
}
