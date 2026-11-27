import { findEntry } from "@md/core";
import Icon from "../components/Icon.jsx";

// A screen whose feature isn't built yet says which feature brings it.
export default function Placeholder({ view }) {
  const e = findEntry(view);
  if (!e) return null;
  const when = e.state === "later" ? "Comes later, in its own stages." : `Comes with ${e.feature}, in the build order of the Master Checklist.`;
  return (
    <div className="placeholder" data-testid="placeholder">
      <Icon name={e.icon} width={42} />
      <h2>{e.label}</h2>
      <p>{when}</p>
    </div>
  );
}
