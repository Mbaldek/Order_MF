"use client";

import { useEffect, useMemo, useState } from "react";
import { load, seed, updateDayStatus } from "../../lib/mockStore";

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function statusLabel(s) {
  return ({
    DRAFT: "Brouillon",
    CONFIRMED: "Confirmée",
    PREPARING: "En préparation",
    READY: "Prête",
    DELIVERING: "En livraison",
    DELIVERED: "Livrée",
    CLOSED: "Clôturée"
  }[s] || s);
}

export default function EmployeePage() {
  const [data, setData] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [tab, setTab] = useState("TODAY");
  const [filter, setFilter] = useState("CONFIRMED");
  const [todayId, setTodayId] = useState("d1");

  useEffect(() => {
    const d = load() || seed();
    setData(d);
    setEmployeeId(d.config.employees.find(e => e.active)?.id || "");
    setTodayId(d.config.days[0]?.id || "d1");
  }, []);

  const employeeName = useMemo(() => {
    if (!data) return "";
    return data.config.employees.find(e => e.id === employeeId)?.name || "";
  }, [data, employeeId]);

  const dayOrders = useMemo(() => {
    if (!data) return [];
    const orders = [];
    for (const o of data.orders) for (const d of o.dayOrders) orders.push({ order: o, day: d });
    let out = orders;
    if (tab === "TODAY") out = out.filter(x => x.day.dayId === todayId);
    if (filter !== "ALL") out = out.filter(x => x.day.status === filter);
    return out;
  }, [data, tab, filter, todayId]);

  function setStatus(dayOrderId, status) {
    const res = updateDayStatus(dayOrderId, { status, employeeName: employeeName || null });
    setData(res.data);
  }

  function attachProof(dayOrderId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = updateDayStatus(dayOrderId, { proofPhotoDataUrl: reader.result, status: "DELIVERED", employeeName: employeeName || null });
      setData(res.data);
    };
    reader.readAsDataURL(file);
  }

  if (!data) return <div className="card">Chargement…</div>;

  return (
    <div className="grid">
      <div className="card">
        <div className="badge">Employé • Exécution</div>
        <h1 className="h1" style={{ marginTop: 10 }}>Préparation & livraison (MOCK)</h1>
        <p className="p">Flux: Confirmée → Préparation → Prête → Livraison → Photo → Livrée → Clôturée.</p>

        <hr className="hr" />

        <div className="row">
          <Field label="Employé">
            <select className="select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {data.config.employees.filter(e => e.active).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="Jour (vue Today)">
            <select className="select" value={todayId} onChange={(e) => setTodayId(e.target.value)}>
              {data.config.days.map(d => <option key={d.id} value={d.id}>{d.label} — {d.dateISO}</option>)}
            </select>
          </Field>
        </div>

        <div className="tabs">
          <div className={"tab " + (tab === "TODAY" ? "active" : "")} onClick={() => setTab("TODAY")}>Aujourd’hui</div>
          <div className={"tab " + (tab === "ALL" ? "active" : "")} onClick={() => setTab("ALL")}>Tous</div>
        </div>

        <div className="tabs">
          {["CONFIRMED","PREPARING","READY","DELIVERING","DELIVERED","CLOSED","ALL"].map(s => (
            <div key={s} className={"tab " + (filter === s ? "active" : "")} onClick={() => setFilter(s)}>
              {s === "ALL" ? "Tous" : statusLabel(s)}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Liste</h2>
        {dayOrders.length === 0 ? (
          <div className="badge">Aucun élément.</div>
        ) : (
          <div className="grid" style={{ marginTop: 10 }}>
            {dayOrders.map(({ order, day }) => (
              <div className="card" key={day.dayOrderId} style={{ background: "rgba(15,15,20,.85)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div className="badge">ORDER_DAY_ID: {day.dayOrderId}</div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span className="badge ok">Stand: {order.exhibitor.stand}</span>
                      <span className="badge">Exposant: {order.exhibitor.company}</span>
                      <span className="badge">Statut: {statusLabel(day.status)}</span>
                      {day.employeeName ? <span className="badge">Employé: {day.employeeName}</span> : null}
                    </div>
                  </div>
                  <div className="small">{day.dayLabel} — {day.dateISO}</div>
                </div>

                <hr className="hr" />

                <div className="small">
                  Menu: <b>{day.entree}</b> / <b>{day.plat}</b> / <b>{day.dessert}</b> • {day.delivery.mode === "DELIVERY" ? "Livraison stand" : "Retrait"}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn" onClick={() => setStatus(day.dayOrderId, "PREPARING")} disabled={day.status !== "CONFIRMED"}>Préparer</button>
                  <button className="btn" onClick={() => setStatus(day.dayOrderId, "READY")} disabled={day.status !== "PREPARING"}>Prêt</button>
                  <button className="btn" onClick={() => setStatus(day.dayOrderId, "DELIVERING")} disabled={day.status !== "READY"}>Livraison</button>

                  <label className="btn primary" style={{ display: "inline-flex", alignItems: "center", gap: 8, opacity: day.status === "DELIVERING" ? 1 : 0.6 }}>
                    📷 Photo + valider
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => attachProof(day.dayOrderId, e.target.files?.[0])}
                      disabled={day.status !== "DELIVERING"}
                    />
                  </label>

                  <button className="btn" onClick={() => setStatus(day.dayOrderId, "CLOSED")} disabled={day.status !== "DELIVERED"}>Clôturer</button>
                </div>

                {day.proofPhotoDataUrl ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="label">Preuve (MOCK)</div>
                    <img src={day.proofPhotoDataUrl} alt="preuve" style={{ width: "100%", maxWidth: 520, borderRadius: 14, border: "1px solid var(--line)" }} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
