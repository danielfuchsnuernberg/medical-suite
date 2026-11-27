import { useEffect, useRef } from "react";

// A box over the screen for one task (move, edit, add, confirm). Escape or Cancel closes it; nothing is saved until the main button.
export default function Dialog({ title, children, onClose, footer, testid = "dialog" }) {
  const box = useRef(null);
  useEffect(() => {
    const first = box.current?.querySelector("input:not([disabled]), select:not([disabled]), button.primary");
    first?.focus();
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} data-testid={testid} ref={box}>
        <h2>{title}</h2>
        <div className="dialog-body">{children}</div>
        <div className="dialog-foot">{footer}</div>
      </div>
    </div>
  );
}
