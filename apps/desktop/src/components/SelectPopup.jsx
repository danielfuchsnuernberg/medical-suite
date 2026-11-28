import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";

// B72 (A3, Q35 = A): the open list of every drop-down, drawn by the program instead of the computer's own menu.
// Mounted once. Every screen keeps its ordinary <select> (labels, values, onChange and the tests stay as they are);
// a click, Space, Enter or an arrow on a select opens this list instead of the computer's. Picking sets the select's
// value and sends the same "change" the computer's menu would, so each screen's own onChange runs unchanged.
// Typing letters on a closed drop-down still jumps (the computer does that), and in the open list too.

const setValue = (el, v) => {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
};
const OPEN_KEYS = new Set([" ", "Enter", "ArrowDown", "ArrowUp"]);

export default function SelectPopup() {
  const [open, setOpen] = useState(null);            // { el, rect, options, active }
  const ref = useRef(null); ref.current = open;
  const listRef = useRef(null);
  const typed = useRef({ text: "", at: 0 });

  useEffect(() => {
    const close = (focus = true) => { const o = ref.current; if (!o) return; o.el.removeAttribute("aria-expanded"); setOpen(null); if (focus) o.el.focus(); };
    const openFor = (el) => {
      if (el.disabled || el.multiple || el.size > 1) return;
      const options = [...el.options].map((o, i) => ({ i, value: o.value, label: o.text, disabled: o.disabled, group: o.parentElement?.tagName === "OPTGROUP" ? o.parentElement.label : null }));
      el.setAttribute("aria-expanded", "true");
      setOpen({ el, rect: el.getBoundingClientRect(), options, active: Math.max(0, el.selectedIndex) });
    };
    const down = (e) => {
      const o = ref.current;
      if (o && listRef.current && listRef.current.contains(e.target)) return;   // a click in the list
      const el = e.target instanceof Element ? e.target.closest("select") : null;
      if (el && e.button === 0) {
        e.preventDefault();                                                   // no computer menu
        el.focus();
        if (o && o.el === el) close(); else { if (o) o.el.removeAttribute("aria-expanded"); openFor(el); }
        return;
      }
      if (o) close(false);
    };
    const move = (o, dir) => {
      let i = o.active;
      for (let n = 0; n < o.options.length; n++) { i = (i + dir + o.options.length) % o.options.length; if (!o.options[i].disabled) break; }
      setOpen({ ...o, active: i });
    };
    const pick = (o, i) => { const opt = o.options[i]; if (!opt || opt.disabled) return; close(); if (o.el.value !== opt.value) setValue(o.el, opt.value); };
    const key = (e) => {
      const o = ref.current;
      if (!o) {
        const el = e.target instanceof Element && e.target.tagName === "SELECT" ? e.target : null;
        if (el && OPEN_KEYS.has(e.key) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openFor(el); }
        return;
      }
      if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); move(o, 1); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); move(o, -1); return; }
      if (e.key === "Home") { e.preventDefault(); setOpen({ ...o, active: o.options.findIndex(x => !x.disabled) }); return; }
      if (e.key === "End") { e.preventDefault(); const r = [...o.options].reverse().findIndex(x => !x.disabled); setOpen({ ...o, active: o.options.length - 1 - r }); return; }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(o, o.active); return; }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {                   // type to jump, like the computer's list
        e.preventDefault();
        const now = Date.now(), t = typed.current;
        t.text = (now - t.at < 700 ? t.text : "") + e.key.toLowerCase(); t.at = now;
        const start = t.text.length === 1 ? o.active + 1 : o.active;
        for (let n = 0; n < o.options.length; n++) {
          const i = (start + n) % o.options.length;
          if (!o.options[i].disabled && o.options[i].label.toLowerCase().startsWith(t.text)) { setOpen({ ...o, active: i }); break; }
        }
      }
    };
    const away = (e) => { if (ref.current && !(listRef.current && listRef.current.contains(e.target))) close(false); };
    const blur = () => close(false);
    window.addEventListener("mousedown", down, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("scroll", away, true);
    window.addEventListener("resize", blur);
    window.addEventListener("blur", blur);
    SelectPopup.pick = (i) => { const o = ref.current; if (o) pick(o, i); };
    return () => {
      window.removeEventListener("mousedown", down, true);
      window.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", away, true);
      window.removeEventListener("resize", blur);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => { if (open && listRef.current) listRef.current.querySelector(".opt.active")?.scrollIntoView({ block: "nearest" }); }, [open]);
  // the select can disappear while open (its screen closed): then the list goes too
  useEffect(() => { if (open && !open.el.isConnected) setOpen(null); });
  if (!open) return null;

  const { rect } = open;
  const below = window.innerHeight - rect.bottom - 8, above = rect.top - 8;
  const up = below < 180 && above > below;
  const maxHeight = Math.max(120, Math.min(320, up ? above : below));
  const style = { left: Math.min(rect.left, window.innerWidth - Math.max(rect.width, 160) - 8), minWidth: Math.max(rect.width, 160), maxWidth: Math.max(rect.width, 420), maxHeight, ...(up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }) };
  let lastGroup = null;
  return createPortal(
    <div className="selpop" role="listbox" ref={listRef} style={style} data-testid="select-list" aria-label={open.el.getAttribute("aria-label") || undefined}>
      {open.options.map((o, idx) => {
        const head = o.group && o.group !== lastGroup ? <div className="grp" key={`g${idx}`}>{o.group}</div> : null;
        lastGroup = o.group;
        const selected = open.el.selectedIndex === o.i;
        return [head, (
          <div key={idx} role="option" aria-selected={selected} aria-disabled={o.disabled || undefined} className={`opt${idx === open.active ? " active" : ""}`}
            onMouseEnter={() => !o.disabled && setOpen({ ...open, active: idx })}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => SelectPopup.pick(idx)}>
            <span className="tick">{selected ? <Icon name="check" width={14} stroke={2.4} /> : null}</span>{o.label}
          </div>)];
      })}
    </div>, document.body);
}
