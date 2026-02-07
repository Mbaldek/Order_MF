"use client";

import { useEffect, useMemo, useState } from "react";
import { load, seed, save, resetAll } from "../../lib/mockStore";

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("DAY");
  const [dayId, setDayId] = useState("d1");

  useEffect(() => {
    const d = load() || seed();
    setData(d);
    setDayId(d.config.days[0]?.id || "d1");
  }, []);

  const allDayOrders = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (const o of data.orders) for (const d of o.dayOrders) out.push({ order: o, day: d });
    return out;
  }, [data]);

  const byDay = useMemo(() => allDayOrders.filter(x => x.day.dayId === dayId), [allDayOrders, dayId]);

  function reset() {
    resetAll();
    const d = seed();
    setData(d);
    setDayId(d.config.days[0]?.id || "d1");
  }

  function updateEventName(v) {
    const next = structuredClone(data);
    next.config.eventName = v;
    save(next); setData(next);
  }

  function addDay() {
    const next = structuredClone(data);
    const n = next.config.days.length + 1;
    next.config.days.push({ id: "d"+n, label: "Jour "+n, dateISO: "2026-03-"+String(9+n).padStart(2,"0") });
    save(next); setData(next);
  }

  function updateDay(id, patch) {
    const next = structuredClone(data);
    const idx = next.config.days.findIndex(d => d.id === id);
    if (idx >= 0) next.config.days[idx] = { ...next.config.days[idx], ...patch };
    save(next); setData(next);
  }

  function addEmployee() {
    const next = structuredClone(data);
    const id = "e" + Math.random().toString(16).slice(2,6);
    next.config.employees.push({ id, name: "Nouveau", active: true });
    save(next); setData(next);
  }

  function updateEmployee(id, patch) {
    const next = structuredClone(data);
    const idx = next.config.employees.findIndex(e => e.id === id);
    if (idx >= 0) next.config.employees[idx] = { ...next.config.employees[idx], ...patch };
    save(next); setData(next);
  }

  function updateMenu(section, id, patch) {
    const next = structuredClone(data);
    const arr = next.config.menus[section];
    const idx = arr.findIndex(x => x.id === id);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...patch };
    save(next); setData(next);
  }

  const agg = useMemo(() => {
    if (!data) return null;
    const c = { entrees: new Map(), plats: new Map(), desserts: new Map() };
    for (const { day } of allDayOrders) {
      c.entrees.set(day.entree, (c.entrees.get(day.entree) || 0) + 1);
      c.plats.set(day.plat, (c.plats.get(day.plat) || 0) + 1);
      c.desserts.set(day.dessert, (c.desserts.get(day.dessert) || 0) + 1);
    }
    return c;
  }, [data, allDayOrders]);

  const labelOf = (section, id) => data?.config.menus[section].find(x => x.id === id)?.label || id;

  if (!data) return <div className="card">Chargement…</div>;

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div className="badge">Admin • Paramétrage + vues</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Back-office (MOCK)</h1>
            <p className="p">Configurer jours, menus, employés. Explorer les commandes dynamiquement.</p>
          </div>
          <button className="btn" onClick={reset}>Reset mock</button>
        </div>

        <hr className="hr" />

        <div className="row">
          <Field label="Nom événement">
            <input className="input" value={data.config.eventName} onChange={(e)=>updateEventName(e.target.value)} />
          </Field>
          <Field label="Vue">
            <select className="select" value={view} onChange={(e)=>setView(e.target.value)}>
              <option value="DAY">Par jour</option>
              <option value="MENU">Par menu</option>
            </select>
          </Field>
        </div>

        <div className="tabs">
          {data.config.days.map(d => (
            <div key={d.id} className={"tab "+(dayId===d.id?"active":"")} onClick={()=>setDayId(d.id)}>{d.label}</div>
          ))}
          <div className="tab" onClick={addDay}>+ jour</div>
        </div>
      </div>

      <div className="row">
        <div className="card">
          <h2 className="h2">Jours</h2>
          <div className="grid">
            {data.config.days.map(d => (
              <div key={d.id} className="card" style={{ background: "rgba(15,15,20,.85)" }}>
                <div className="row">
                  <Field label="Label"><input className="input" value={d.label} onChange={(e)=>updateDay(d.id,{label:e.target.value})} /></Field>
                  <Field label="Date ISO"><input className="input" value={d.dateISO} onChange={(e)=>updateDay(d.id,{dateISO:e.target.value})} /></Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="h2">Employés</h2>
          <div style={{ marginBottom: 10 }}><button className="btn" onClick={addEmployee}>+ Ajouter</button></div>
          <div className="grid">
            {data.config.employees.map(e => (
              <div key={e.id} className="card" style={{ background: "rgba(15,15,20,.85)" }}>
                <div className="row">
                  <Field label="Nom"><input className="input" value={e.name} onChange={(ev)=>updateEmployee(e.id,{name:ev.target.value})} /></Field>
                  <Field label="Actif">
                    <select className="select" value={e.active?"1":"0"} onChange={(ev)=>updateEmployee(e.id,{active:ev.target.value==="1"})}>
                      <option value="1">Oui</option>
                      <option value="0">Non</option>
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Menus</h2>
        <div className="small">Édition rapide (mock)</div>
        <hr className="hr" />
        {["entrees","plats","desserts"].map(section => (
          <div key={section} style={{ marginBottom: 14 }}>
            <div className="badge">{section}</div>
            <div className="grid" style={{ marginTop: 10 }}>
              {data.config.menus[section].map(m => (
                <div key={m.id} className="card" style={{ background: "rgba(15,15,20,.85)" }}>
                  <div className="row">
                    <Field label="Label"><input className="input" value={m.label} onChange={(e)=>updateMenu(section, m.id, { label: e.target.value })} /></Field>
                    <Field label="Prix"><input className="input" value={String(m.price)} onChange={(e)=>updateMenu(section, m.id, { price: Number(e.target.value || 0) })} /></Field>
                  </div>
                  <div className="small" style={{ marginTop: 8 }}>id: {m.id}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="h2">Vues</h2>

        {view === "DAY" ? (
          <>
            <div className="badge">Par jour — {data.config.days.find(d=>d.id===dayId)?.label}</div>
            <div style={{ marginTop: 10, overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Jour</th><th>Exposant</th><th>Stand</th><th>Menu</th><th>Statut</th><th>Employé</th>
                  </tr>
                </thead>
                <tbody>
                  {byDay.map(({order,day}) => (
                    <tr key={day.dayOrderId}>
                      <td>{day.dayLabel} ({day.dateISO})</td>
                      <td>{order.exhibitor.company}</td>
                      <td>{order.exhibitor.stand}</td>
                      <td>{day.entree} / {day.plat} / {day.dessert}</td>
                      <td>{day.status}</td>
                      <td>{day.employeeName || "-"}</td>
                    </tr>
                  ))}
                  {byDay.length===0 ? <tr><td colSpan="6" className="small">Aucune donnée.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {view === "MENU" ? (
          <>
            <div className="badge">Par menu — compteurs</div>
            <div className="row" style={{ marginTop: 10 }}>
              <div className="card" style={{ background: "rgba(15,15,20,.85)" }}>
                <div className="badge">Entrées</div>
                <div style={{ marginTop: 10 }}>
                  {[...(agg?.entrees?.entries() || [])].sort((a,b)=>b[1]-a[1]).map(([id,n]) => (
                    <div key={id} className="badge" style={{ justifyContent:"space-between", width:"100%", marginBottom:8 }}>
                      <span>{labelOf("entrees", id)}</span><span>{n}</span>
                    </div>
                  ))}
                  {(agg?.entrees?.size||0)===0 ? <div className="small">Aucune donnée.</div> : null}
                </div>
              </div>

              <div className="card" style={{ background: "rgba(15,15,20,.85)" }}>
                <div className="badge">Plats</div>
                <div style={{ marginTop: 10 }}>
                  {[...(agg?.plats?.entries() || [])].sort((a,b)=>b[1]-a[1]).map(([id,n]) => (
                    <div key={id} className="badge" style={{ justifyContent:"space-between", width:"100%", marginBottom:8 }}>
                      <span>{labelOf("plats", id)}</span><span>{n}</span>
                    </div>
                  ))}
                  {(agg?.plats?.size||0)===0 ? <div className="small">Aucune donnée.</div> : null}
                </div>
              </div>

              <div className="card" style={{ background: "rgba(15,15,20,.85)" }}>
                <div className="badge">Desserts</div>
                <div style={{ marginTop: 10 }}>
                  {[...(agg?.desserts?.entries() || [])].sort((a,b)=>b[1]-a[1]).map(([id,n]) => (
                    <div key={id} className="badge" style={{ justifyContent:"space-between", width:"100%", marginBottom:8 }}>
                      <span>{labelOf("desserts", id)}</span><span>{n}</span>
                    </div>
                  ))}
                  {(agg?.desserts?.size||0)===0 ? <div className="small">Aucune donnée.</div> : null}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
