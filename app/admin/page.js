"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getMyProfile, signOut } from "../../lib/auth";

export default function AdminPage() {
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p) { window.location.href = "/admin/login"; return; }
        if (p.role === "employee") { window.location.href = "/employee"; return; }
        if (p.role !== "admin") { window.location.href = "/admin/login"; return; }
        setProfile(p);
        await load();
      } catch (e) {
        window.location.href = "/admin/login";
      }
    })();
  }, []);

  async function load() {
    setToast({ type:"ok", msg:"Chargement…" });
    const { data, error } = await supabase
      .from("order_days")
      .select("id, day_date, day_label, entree, plat, dessert, status, employee_name, proof_url, delivery, orders:order_id(company, stand, first_name, last_name, phone, email)")
      .order("day_date", { ascending: true });

    if (error) {
      setToast({ type:"bad", msg: `${error.message}${error.code ? " (code: "+error.code+")" : ""}` });
      return;
    }
    setRows(data || []);
    setToast(null);
  }

  const kpis = useMemo(() => {
    const total = rows.length;
    const confirmed = rows.filter(r => r.status === "CONFIRMED").length;
    const preparing = rows.filter(r => r.status === "PREPARING").length;
    const ready = rows.filter(r => r.status === "READY").length;
    const delivering = rows.filter(r => r.status === "DELIVERING").length;
    const delivered = rows.filter(r => r.status === "DELIVERED").length;
    return { total, confirmed, preparing, ready, delivering, delivered };
  }, [rows]);

  async function logout() {
    await signOut();
    window.location.href = "/admin/login";
  }

  if (!profile) return <div className="card">Chargement…</div>;

  return (
    <div className="grid">
      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <div>
            <div className="badge">Admin</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Back-office</h1>
            <div className="small">Connecté: {profile.full_name || profile.id}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <button className="btn light" onClick={load}>Rafraîchir</button>
            <button className="btn light" onClick={logout}>Déconnexion</button>
          </div>
        </div>

        {toast ? (
          <div style={{ marginTop: 12 }} className={"badge " + (toast.type === "ok" ? "ok" : "bad")}>
            {toast.msg}
          </div>
        ) : null}

        <hr className="hr" />

        <div className="kpis">
          <div className="kpi"><b>Total</b><div className="small">{kpis.total}</div></div>
          <div className="kpi"><b>Confirmées</b><div className="small">{kpis.confirmed}</div></div>
          <div className="kpi"><b>Préparation</b><div className="small">{kpis.preparing}</div></div>
          <div className="kpi"><b>Prêtes</b><div className="small">{kpis.ready}</div></div>
          <div className="kpi"><b>Livraison</b><div className="small">{kpis.delivering}</div></div>
          <div className="kpi"><b>Livrées</b><div className="small">{kpis.delivered}</div></div>
        </div>
      </div>

      <div className="card" style={{ overflowX:"auto" }}>
        <h2 className="h2">Sous-commandes (jour)</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Jour</th>
              <th>Exposant</th>
              <th>Stand</th>
              <th>Menu</th>
              <th>Livraison</th>
              <th>Statut</th>
              <th>Employé</th>
              <th>Preuve</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.day_label}<div className="small">{r.day_date}</div></td>
                <td>{r.orders?.company}</td>
                <td>{r.orders?.stand}</td>
                <td>{r.entree} / {r.plat} / {r.dessert}</td>
                <td>{r.delivery?.mode}{r.delivery?.mode === "DELIVERY" ? <div className="small">{r.delivery?.instructions || "-"}</div> : null}</td>
                <td>{r.status}</td>
                <td>{r.employee_name || "-"}</td>
                <td>{r.proof_url ? <a href={r.proof_url} target="_blank">Voir</a> : "-"}</td>
              </tr>
            ))}
            {rows.length===0 ? (
              <tr><td colSpan="8" className="small">Aucune donnée.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
