import { expiryStatus, formatCalendarDate } from "@md/core";

export default function ExpiryBadge({ expiry, today, dateStyle = "long" }) {
  const s = expiryStatus(expiry, today);
  const map = {
    none: ["b-muted", "No expiry"], expired: ["b-danger", "Expired"], today: ["b-danger", "Expires today"],
    tomorrow: ["b-warning", "Expires tomorrow"], soon: ["b-warning", `Expires in ${s.days} days`],
    ok: ["b-success", expiry ? formatCalendarDate(expiry, dateStyle) : ""],
  };
  const [cls, text] = map[s.kind];
  return <span className={`badge ${cls}`} data-expiry={s.kind}>{text}</span>;
}
