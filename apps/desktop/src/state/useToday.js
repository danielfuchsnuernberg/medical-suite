import { useEffect, useState } from "react";
import { todayIn } from "@md/core";

// "Today" at the base, kept fresh while the program stays open (F1.5, B7): checked every 30 seconds
// and whenever the window comes back to the front.
export default function useToday(timeZone) {
  const [today, setToday] = useState(() => todayIn(timeZone));
  useEffect(() => {
    const tick = () => setToday((prev) => { const t = todayIn(timeZone); return t === prev ? prev : t; });
    tick();
    const id = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); window.removeEventListener("focus", tick); document.removeEventListener("visibilitychange", tick); };
  }, [timeZone]);
  return today;
}
