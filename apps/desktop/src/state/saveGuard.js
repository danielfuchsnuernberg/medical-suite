// B37 (Stage 7): a double click on a save button saved twice (restock +2 added 4, two stock takes, a course completed twice).
// One guard for every screen: a click on a main button (primary, danger or a form's submit button) locks that button while
// anything it asked for is queued or saving (door.busy()). If something was really saved (door.saved() went up), it stays locked
// until LOCK_MS after the click, longer than any double click. If nothing was saved (a refusal), it unlocks at once, so the
// person can correct and try again. Meanwhile further clicks and Enter presses on it are swallowed; it shows as busy.
export const LOCK_MS = 600;
const SAVE = "button.primary, button.danger, button[type=submit]";

export function installSaveGuard(door) {
  if (window.__saveGuard) return;
  window.__saveGuard = true;
  const lock = (btn) => {
    btn.dataset.saving = "1"; btn.setAttribute("aria-busy", "true");
    const t0 = Date.now(), saved0 = door.saved();
    const tick = () => {
      const idle = door.busy() === 0, savedSomething = door.saved() > saved0;
      if (!btn.isConnected || (idle && (!savedSomething || Date.now() - t0 >= LOCK_MS))) { delete btn.dataset.saving; btn.removeAttribute("aria-busy"); return; }
      setTimeout(tick, 25);
    };
    setTimeout(tick, 0);
  };
  document.addEventListener("click", (e) => {
    const btn = e.target instanceof Element ? e.target.closest(SAVE) : null;
    if (!btn || btn.disabled) return;
    if (btn.dataset.saving) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    lock(btn);
  }, true);
  // Typing or changing something near a locked button means a new save is meant, not a double click: unlock it.
  const unlockNear = (e) => {
    if (!(e.target instanceof Element)) return;
    document.querySelectorAll("button[data-saving]").forEach(btn => {
      const area = btn.closest("form, .dialog, .panel");
      if (area && area.contains(e.target)) { delete btn.dataset.saving; btn.removeAttribute("aria-busy"); }
    });
  };
  document.addEventListener("input", unlockNear, true);
  document.addEventListener("change", unlockNear, true);
  // Enter in a dialog box runs the main button's action without a click (onKeyDown): lock that dialog's main button the same way.
  // Not inside a form: there Enter makes the browser click the submit button itself, which the click guard above handles.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !(e.target instanceof Element) || e.target.tagName !== "INPUT" || e.target.closest("form")) return;
    const box = e.target.closest(".dialog"); if (!box) return;
    const btn = box.querySelector(".dialog-foot " + SAVE.split(", ").join(", .dialog-foot ")); if (!btn) return;
    if (btn.dataset.saving) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    lock(btn);
  }, true);
}
