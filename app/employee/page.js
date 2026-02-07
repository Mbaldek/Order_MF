"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getMyProfile, signOut } from "../../lib/auth";

const STATUSES = ["CONFIRMED","PREPARING","READY","DELIVERING","DELIVERED","CLOSED"];

export default function EmployeePage() {
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [rows, setRows] = useState([]);
  const [day, setDay] = useState(new Date().toISOString().slice(0,10));
  const [filter, setFilter] = useState("CONFIRMED");

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProfile();
        if (!p) { window.location.href = "/admin/login"; return; }
        if (p.role === "admin") { window.location.href = "/admin"; return; }
        if (p.role !== "employee") { window.location.href = "/admin/login"; return; }
        setProfile(p);
        await load(p);
      } catch {
        window.location.href = "/admin/login";
      }
    })();
  }, []);

  async function load(p=profile) {
    setToast({ type:"ok", msg:"Chargement…" });
    const q = supabase
      .from("order_days")
      .select("id, day_date, day_label, entree, plat, dessert, status, delivery, orders:order_id(company, stand)")
      .eq("day_date", day)
      .order("created_at", { ascending: true });

    if (filter !== "ALL") q.eq("status", filter);

    const { data, error } = await q;
    if (error) {
      setToast({ type:"bad", msg: `${error.message}${error.code ? " (code: "+error.code+")" : ""}` });
      return;
    }
    setRows(data || []);
    setToast(null);
  }

  async function setStatus(id, status) {
    setToast({ type:"ok", msg:"Mise à jour…" });
    const { error } = await supabase
      .from("order_days")
      .update({ status, employee_name: profile?.full_name || null })
      .eq("id", id);

    if (error) {
      setToast({ type:"bad", msg: `${error.message}${error.code ? " (code: "+error.code+")" : ""}` });
      return;
    }
    await load();
  }

  async function uploadProof(id, file) {
    if (!file) return;
    setToast({ type:"ok", msg:"Upload preuve…" });

    const path = `proof_${id}_${Date.now()}_${file.name}`.replaceAll(" ", "_");
    const up = await supabase.storage.from("proofs").upload(path, file, { upsert: true });

    if (up.error) {
      setToast({ type:"bad", msg: up.error.message });
      return;
    }

    const { data: pub } = supabase.storage.from("proofs").getPublicUrl(path);

    const { error } = await supabase
      .from("order_days")
      .update({ proof_url: pub.publicUrl, status: "DELIVERED", employee_name: profile?.full_name || null })
      .eq("id", id);

    if (error) {
      setToast({ type:"bad", msg: `${error.message}${error.code ? " (code: "+error.code+")" : ""}` });
      return;
    }
    await load();
  }

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
            <div className="badge">Employé</div>
            <h1 className="h1" style={{ marginTop: 10 }}>Préparation & livraison</h1>
            <div className="small">Connecté: {profile.full_name || profile.id}</div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button className="btn light" onClick={()=>load()}>Rafraîchir</button>
            <button className="btn light" onClick={logout}>Déconnexion</button>
          </div>
        </div>

        {toast ? (
          <div style={{ marginTop: 12 }} className={"badge " + (toast.type === "ok" ? "ok" : "bad")}>
            {toast.msg}
          </div>
        ) : null}

        <hr className="hr" />

        <div className="row">
          <div>
            <div className="label">Jour</div>
            <input className="input" type="date" value={day} onChange={(e)=>setDay(e.target.value)} />
          </div>
          <div>
            <div className="label">Filtre statut</div>
            <select className="select" value={filter} onChange={(e)=>setFilter(e.target.value)}>
              <option value="ALL">Tous</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <button className="btn light" onClick={()=>load()}>Appliquer</button>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Liste</h2>

        {rows.length===0 ? (
          <div className="badge">Aucune commande pour ce jour/filtre.</div>
        ) : (
          <div className="grid">
            {rows.map(r => (
              <div key={r.id} className="card" style={{ boxShadow:"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontWeight: 900 }}>{r.orders?.company}</div>
                    <div className="small">Stand {r.orders?.stand} • {r.day_label} ({r.day_date})</div>
                  </div>
                  <div className="badge">Statut: {r.status}</div>
                </div>

                <hr className="hr" />

                <div className="small">Menu: <b>{r.entree}</b> / <b>{r.plat}</b> / <b>{r.dessert}</b></div>
                <div className="small">Livraison: <b>{r.delivery?.mode}</b>{r.delivery?.mode==="DELIVERY" ? ` • ${r.delivery?.instructions || "-"}` : ""}</div>

                <div style={{ marginTop: 12, display:"flex", gap:10, flexWrap:"wrap" }}>
                  <button className="btn light" disabled={r.status!=="CONFIRMED"} onClick={()=>setStatus(r.id,"PREPARING")}>Préparer</button>
                  <button className="btn light" disabled={r.status!=="PREPARING"} onClick={()=>setStatus(r.id,"READY")}>Prêt</button>
                  <button className="btn light" disabled={r.status!=="READY"} onClick={()=>setStatus(r.id,"DELIVERING")}>Livraison</button>

                  <label className="btn light" style={{ cursor: r.status==="DELIVERING" ? "pointer" : "not-allowed", opacity: r.status==="DELIVERING" ? 1 : .55 }}>
                    📷 Preuve (upload)
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display:"none" }}
                      disabled={r.status!=="DELIVERING"}
                      onChange={(e)=>uploadProof(r.id, e.target.files?.[0])}
                    />
                  </label>

                  <button className="btn light" disabled={r.status!=="DELIVERED"} onClick={()=>setStatus(r.id,"CLOSED")}>Clôturer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
