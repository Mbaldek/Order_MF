"use client";

export default function DrinkPicker({ drinks, selected, onChange }) {
  // drinks: [{id,name,price_ht_cents,price_ttc_cents}]
  // selected: [{item_id, name, qty, price_ht_cents, price_ttc_cents}]
  const map = new Map((selected || []).map((d) => [d.item_id, d]));

  function setQty(item, qty) {
    const next = new Map(map);
    if (!qty || qty <= 0) {
      next.delete(item.id);
    } else {
      next.set(item.id, {
        item_id: item.id,
        name: item.name,
        qty,
        price_ht_cents: item.price_ht_cents,
        price_ttc_cents: item.price_ttc_cents,
      });
    }
    onChange(Array.from(next.values()));
  }

  if (!drinks || drinks.length === 0) {
    return <div className="small">Aucune boisson disponible.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {drinks.map((b) => {
        const current = map.get(b.id);
        const qty = current?.qty || 0;
        return (
          <div
            key={b.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px",
              gap: 10,
              alignItems: "center",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 12,
              background: "#fff",
            }}
          >
            <div>
              <div style={{ fontWeight: 900 }}>{b.name}</div>
              <div className="small">
                HT {(b.price_ht_cents / 100).toFixed(2)} € • TTC {(b.price_ttc_cents / 100).toFixed(2)} €
              </div>
            </div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => setQty(b, Math.max(0, qty - 1))}>-</button>
              <div style={{ minWidth: 28, textAlign: "center", fontWeight: 900 }}>{qty}</div>
              <button className="btn secondary" onClick={() => setQty(b, qty + 1)}>+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

