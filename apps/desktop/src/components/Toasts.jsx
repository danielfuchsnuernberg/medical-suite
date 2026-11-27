import { useEffect } from "react";
export default function Toasts({ items, drop }) {
  useEffect(() => {
    if (!items.length) return;
    const t = setTimeout(() => drop(items[0].id), 4200);
    return () => clearTimeout(t);
  }, [items, drop]);
  return <div className="toasts" aria-live="polite">{items.map(t => <div key={t.id} className={`toast ${t.kind || ""}`} data-testid="toast">{t.text}</div>)}</div>;
}
