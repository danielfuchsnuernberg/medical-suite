import { HOME_CARDS, formatDayLong } from "@md/core";
import Icon from "../components/Icon.jsx";

export default function Home({ go, today, baseName }) {
  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-eyebrow">REACH · Medical Suite</div>
        <h1 className="home-title">Welcome</h1>
        <p className="home-sub"><span data-testid="today">{formatDayLong(today)}</span> · {baseName}</p>
      </div>
      <div className="home-grid">
        {HOME_CARDS.map(c => (
          <button type="button" className="appcard" key={c.id} data-card={c.id} onClick={() => go(c.id)}>
            <span className="appcard-ic"><Icon name={c.icon} /></span>
            <span className="appcard-name">{c.label}{c.tag ? <span className="appcard-tag">{c.tag}</span> : null}</span>
            <span className="appcard-desc">{c.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
