import Icon from "../components/Icon.jsx";

// Where a row in Store and bags leads (F7.3). The item page itself — every place, lot, expiry and movement — comes with F8.
export default function ItemStub({ item, back }) {
  return (
    <div className="itempage" data-testid="item-page" data-item={item ? item.id : ""}>
      <button type="button" className="btn small backlink" onClick={back}><Icon name="back" width={14} stroke={2} />Back to Store and bags</button>
      <div className="placeholder">
        <Icon name="box" width={42} />
        <h2>{item ? String(item.name) : "Item not found"}</h2>
        <p>The item page comes with F8: every place it is in, lots, expiry dates and its stock movements.</p>
      </div>
    </div>
  );
}
