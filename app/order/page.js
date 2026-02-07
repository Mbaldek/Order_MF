"use client";

import { useEffect, useMemo, useState } from "react";
import {
  load, seed, save, resetAll,
  createOrder, addOrUpdateDayOrder, removeDayOrder,
  newDayOrderFromDefaults, calcDayTotal, calcOrderTotal
} from "../../lib/mockStore";

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function money(x) {
  return (Math.round(x * 100) / 100).toFixed(2) + " €";
}

export default function OrderPage() {
  const [data, setData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [ex, setEx] = useState({ company:"", first:"", last:"", phone:"", email:"", stand:"" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const d = load() || seed();
    setData(d);
  }, []);

  const order = useMemo(() => {
    if (!data || !orderId) return null;
    return data.orders.find(o => o.orderId === orderId) || null;
  }, [data, orderId]);

  const canCreate = useMemo(() => (
    ex.company.trim() && ex.first.trim() && ex.last.trim() && ex.phone.trim() && ex.email.trim() && ex.stand.trim()
  ), [ex]);

  function updateEx(k, v) { setEx(p => ({ ...p, [k]: v })); }

  function newGlobalOrder() {
    const { data: d, order } = createOrder(ex);
    setData(d);
    setOrderId(order.orderId);
    setToast({ type: "ok", msg: `Commande globale créée: ${order.orderId}` });
  }

  function addDay() {
    if (!data || !orderId) return;
    const day = newDayOrderFromDefaults(data.config);
    const dayRef = data.config.days.find(x => x.id === day.dayId);
    day.dayLabel = dayRef?.label || "";
    day.dateISO = dayRef?.dateISO || "";
    const res = addOrUpdateDayOrder(orderId, day);
    setData(res.data);
  }

  function updateDay(dayOrderId, patch) {
    if (!data || !orderId) return;
    const current = data.orders.find(o => o.orderId === orderId)?.dayOrders.find(d => d.dayOrderId === dayOrderId);
    if (!current) return;
    const next = { ...current, ...patch };
    if (patch.dayId) {
      const dayRef = data.config.days.find(x => x.id === patch.dayId);
      next.dayLabel = dayRef?.label || "";
      next.dateISO = dayRef?.dateISO || "";
    }
    const res = addOrUpdateDayOrder(orderId, next);
    setData(res.data);
  }

  function deleteDay(dayOrderId) {
    const res = removeDayOrder(orderId, dayOrderId);
    setData(res.data);
  }

  function confirmAll() {
    if (!data || !order) return;
    const next = structuredClone(data);
    const o = next.orders.find(x => x.orderId === order.orderId);
    o.dayOrders = o.dayOrders.map(d => ({ ...d, status: "CONFIRMED" }));
    save(next);
    setData(next);
    setToast({ type: "ok", msg: "Sous-commandes confirmées (MOCK)" });
  }

  function resetMock() {
    resetAll();
    const d = seed();
    setData(d);
    setOrderId(null);
    setToast({ type: "ok", msg: "Mock reset OK" });
  }

  if (!data) return <div className="card">Chargement…</div>;

  const total = order ? calcOrderTotal(data.config, order) : 0;

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div className="badge">User • Commande</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Commande multi-jours (MOCK)</h1>
            <p className="p">1 commande globale → N sous-commandes (tracking jour par jour).</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn" onClick={resetMock}>Reset mock</button>
            <a href="/employee"><button className="btn">Employé</button></a>
            <a href="/admin"><button className="btn">Admin</button></a>
          </div>
        </div>

        {toast ? (
          <div style={{ marginTop: 12 }} className={"badge " + (toast.type === "ok" ? "ok" : "bad")}>
            {toast.msg}
          </div>
        ) : null}

        <hr className="hr" />

        <h2 className="h2">Identité exposant</h2>

        <div className="row">
          <Field label="Société *"><input className="input" value={ex.company} onChange={(e) => updateEx("company", e.target.value)} /></Field>
          <Field label="Stand *"><input className="input" value={ex.stand} onChange={(e) => updateEx("stand", e.target.value)} /></Field>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <Field label="Prénom *"><input className="input" value={ex.first} onChange={(e) => updateEx("first", e.target.value)} /></Field>
          <Field label="Nom *"><input className="input" value={ex.last} onChange={(e) => updateEx("last", e.target.value)} /></Field>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <Field label="Téléphone *"><input className="input" value={ex.phone} onChange={(e) => updateEx("phone", e.target.value)} /></Field>
          <Field label="Email *"><input className="input" type="email" value={ex.email} onChange={(e) => updateEx("email", e.target.value)} /></Field>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn primary" disabled={!canCreate} onClick={newGlobalOrder}>Créer commande globale</button>
          {order ? <span className="badge ok">ORDER_ID_GLOBAL: {order.orderId}</span> : <span className="badge">Pas encore créée</span>}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2 className="h2">Sous-commandes par jour</h2>
            <div className="small">Chaque carte = 1 jour = 1 tracking opérationnel</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" disabled={!order} onClick={addDay}>+ Ajouter un jour</button>
            <button className="btn primary" disabled={!order || order.dayOrders.length === 0} onClick={confirmAll}>Valider / confirmer</button>
          </div>
        </div>

        <hr className="hr" />

        {!order ? (
          <div className="badge bad">Crée d’abord une commande globale.</div>
        ) : order.dayOrders.length === 0 ? (
          <div className="badge">Aucune sous-commande. Clique “Ajouter un jour”.</div>
        ) : (
          <div className="grid" style={{ marginTop: 10 }}>
            {order.dayOrders.map((d) => {
              const dayTotal = calcDayTotal(data.config, d);
              return (
                <div className="card" key={d.dayOrderId} style={{ background: "rgba(15,15,20,.85)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div className="badge">ORDER_DAY_ID: {d.dayOrderId}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className={"badge " + (d.status === "CONFIRMED" ? "ok" : "")}>Statut: {d.status}</span>
                        <span className="badge">Total jour: {money(dayTotal)}</span>
                      </div>
                    </div>
                    <button className="btn" onClick={() => deleteDay(d.dayOrderId)}>Supprimer</button>
                  </div>

                  <hr className="hr" />

                  <div className="row">
                    <Field label="Jour">
                      <select className="select" value={d.dayId} onChange={(e) => updateDay(d.dayOrderId, { dayId: e.target.value })}>
                        {data.config.days.map(day => <option key={day.id} value={day.id}>{day.label} — {day.dateISO}</option>)}
                      </select>
                    </Field>
                    <Field label="Livraison">
                      <select className="select" value={d.delivery.mode} onChange={(e) => updateDay(d.dayOrderId, { delivery: { ...d.delivery, mode: e.target.value } })}>
                        <option value="DELIVERY">Livraison stand</option>
                        <option value="PICKUP">Retrait</option>
                      </select>
                    </Field>
                  </div>

                  {d.delivery.mode === "DELIVERY" ? (
                    <div style={{ marginTop: 12 }}>
                      <Field label="Instructions livraison (optionnel)">
                        <input className="input" value={d.delivery.instructions || ""} onChange={(e) => updateDay(d.dayOrderId, { delivery: { ...d.delivery, instructions: e.target.value } })} />
                      </Field>
                    </div>
                  ) : null}

                  <div className="row" style={{ marginTop: 12 }}>
                    <Field label="Entrée">
                      <select className="select" value={d.entree} onChange={(e) => updateDay(d.dayOrderId, { entree: e.target.value })}>
                        {data.config.menus.entrees.map(o => <option key={o.id} value={o.id}>{o.label} — {money(o.price)}</option>)}
                      </select>
                    </Field>
                    <Field label="Plat">
                      <select className="select" value={d.plat} onChange={(e) => updateDay(d.dayOrderId, { plat: e.target.value })}>
                        {data.config.menus.plats.map(o => <option key={o.id} value={o.id}>{o.label} — {money(o.price)}</option>)}
                      </select>
                    </Field>
                  </div>

                  <div className="row" style={{ marginTop: 12 }}>
                    <Field label="Dessert">
                      <select className="select" value={d.dessert} onChange={(e) => updateDay(d.dayOrderId, { dessert: e.target.value })}>
                        {data.config.menus.desserts.map(o => <option key={o.id} value={o.id}>{o.label} — {money(o.price)}</option>)}
                      </select>
                    </Field>
                    <Field label="Options">
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <label className="badge" style={{ cursor: "pointer" }}>
                          <input type="checkbox" checked={!!d.options.veggie} onChange={(e) => updateDay(d.dayOrderId, { options: { ...d.options, veggie: e.target.checked } })} /> Végé
                        </label>
                        <label className="badge" style={{ cursor: "pointer" }}>
                          <input type="checkbox" checked={!!d.options.noPork} onChange={(e) => updateDay(d.dayOrderId, { options: { ...d.options, noPork: e.target.checked } })} /> Sans porc
                        </label>
                        <label className="badge" style={{ cursor: "pointer" }}>
                          <input type="checkbox" checked={!!d.options.glutenFree} onChange={(e) => updateDay(d.dayOrderId, { options: { ...d.options, glutenFree: e.target.checked } })} /> Sans gluten
                        </label>
                      </div>
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <hr className="hr" />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div className="badge">Total global (MOCK): {money(total)}</div>
          <div className="small">Chaque jour = tracking ID distinct.</div>
        </div>
      </div>
    </div>
  );
}
