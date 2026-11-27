import { useMemo, useRef, useState, useEffect } from "react";
import { search } from "@md/core";
import Icon from "./Icon.jsx";
import ExpiryBadge from "./ExpiryBadge.jsx";

// Search across staff and stock (F1.4). Everything typed is shown as plain text: React writes it as text,
// never as markup (B4).
export default function SearchBox({ source, today, dateStyle, onOpen }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const r = useMemo(() => search(source, q), [source, q]);
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const pick = (kind, item) => { setOpen(false); setQ(""); onOpen(kind, item); };
  return (
    <div className="search" role="search" ref={box}>
      <Icon name="search" stroke={2} />
      <input aria-label="Search staff and inventory" placeholder="Search staff & inventory…" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); e.currentTarget.blur(); } }} />
      {open && q.trim() ? (
        <div className="results" role="listbox" aria-label="Search results">
          <div className="grp">You searched for: <span className="echo" data-testid="echo">{q}</span></div>
          {!r.people.length && !r.stock.length ? <div className="none">Nothing found for “{q}”.</div> : null}
          {r.people.length ? <div className="grp">Staff</div> : null}
          {r.people.map(p => (
            <button type="button" className="r" key={p.id} onClick={() => pick("person", p)}>
              <Icon name="users" /><span className="t">{p.name}<small>{p.job}</small></span>
            </button>
          ))}
          {r.stock.length ? <div className="grp">Inventory</div> : null}
          {r.stock.map(s => (
            <button type="button" className="r" key={s.id} onClick={() => pick("stock", s)}>
              <Icon name="box" /><span className="t">{s.item}<small>{s.location} · {s.qty}{s.unit ? ` ${s.unit}` : ""}</small></span>
              <ExpiryBadge expiry={s.expiry} today={today} dateStyle={dateStyle} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
