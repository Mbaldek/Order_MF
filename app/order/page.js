"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { DEFAULT_DAYS, MENU, money, dayTotal } from "../../lib/menu";

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function uid(prefix="id"){
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export default function OrderPage() {
  const [orderId, setOrderId] = useState(null);
  const [toast, setToast] = useState(null);

  const [ex, setEx] = useState({ company:"", first:"", last:"", phone:"", email:"", stand:"" });

  const [days, setDays] = useState([]); // local UI state until confirmed
  const total = useMemo(() => days.reduce((acc,d)=>acc+dayTotal(d),0), [days]);

  const canCreate = useMemo(() => (
    ex.company.trim() && ex.first.trim() && ex.last.trim() && ex.phone.trim() && ex.email.trim() && ex.stand.trim()
  ), [ex]);

  function updateEx(k,v){ setEx(p=>({ ...p, [k]: v })); }

  function addDayCard(){
    const base = DEFAULT_DAYS[0];
    setDays(prev => ([
      ...prev,
      {
        uiId: uid("ui"),
        dayId: base.id,
        dayLabel: base.label,
        dateISO: base.dateISO,
        entree: MENU.entrees[0].id,
        plat: MENU.plats[0].id,
        dessert: MENU.desserts[0].id,
        options: { veggie:false, noPork:false, glutenFree:false },
        delivery: { mode:"DELIVERY", instructions:"" }
      }
    ]));
  }

  function updateDay(uiId, patch){
    setDays(prev => prev.map(d => {
      if (d.uiId !== uiId) return d;
      const next = { ...d, ...patch };
      if (patch.dayId) {
        const ref = DEFAULT_DAYS.find(x => x.id === patch.dayId);
        next.dayLabel = ref?.label || "";
        next.dateISO = ref?.dateISO || "";
      }
      return next;
    }));
  }

  function removeDay(uiId){ setDays(prev => prev.filter(d => d.uiId !== uiId)); }

  async function createGlobalOrder(){
    setToast({ type:"ok", msg:"Création…" });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setToast({ type:"bad", msg:"ENV manquantes: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY" });
      return;
    }

    const payload = {
      company: ex.company.trim(),
      first_name: ex.first.trim(),
      last_name: ex.last.trim(),
      phone: ex.phone.trim(),
      email: ex.email.trim(),
      stand: ex.stand.trim()
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("id, created_at")
      .single();

    if (error) {
      setToast({ type:"bad", msg: `${error.message}${error.code ? " (code: "+error.code+")" : ""}` });
      return;
    }

    setOrderId(data.id);
    setToast({ type:"ok", msg:`Commande globale créée: ${data.id}` });
  }

  async function confirmAll(){
    if (!orderId) {
      setToast({ type:"bad", msg:"Crée d’abord une commande globale." });
      return;
    }
    if (days.length === 0) {
      setToast({ type:"bad", msg:"Ajoute au moins 1 jour." });
      return;
    }

    setToast({ type:"ok", msg:"Envoi des sous-commandes…" });

    const rows = days.map(d => ({
      order_id: orderId,
      day_date: d.dateISO,
      day_label: d.dayLabel,
      entree: d.entree,
      plat: d.plat,
      dessert: d.dessert,
      options: d.options,
      delivery: d.delivery,
      status: "CONFIRMED"
    }));

    const { error } = await supabase.from("order_days").insert(rows);

    if (error) {
      setToast({ type:"bad", msg: `${error.message}${error.code ? " (code: "+error.code+")" : ""}` });
      return;
    }

    setToast({ type:"ok", msg:"OK — sous-commandes enregistrées." });
    // lock UI (simple): keep as-is; future: show read-only
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="badge">User • Commande</div>
        <h1 className="h1" style={{ marginTop: 10 }}>Commande multi-jours</h1>
        <p className="p">1 commande globale → N sous-commandes (tracking jour par jour).</p>

        {toast ? (
          <div style={{ marginTop: 12 }} className={"badge " + (toast.type === "ok" ? "ok" : "bad")}>
            {toast.msg}
          </div>
        ) : null}

        <hr className="hr" />

        <h2 className="h2">Identité exposant</h2>

        <div className="row">
          <Field label="Société *"><input className="input" value={ex.company} onChange={(e)=>updateEx("company", e.target.value)} /></Field>
          <Field label="Stand *"><input className="input" value={ex.stand} onChange={(e)=>updateEx("stand", e.target.value)} /></Field>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <Field label="Prénom *"><input className="input" value={ex.first} onChange={(e)=>updateEx("first", e.target.value)} /></Field>
          <Field label="Nom *"><input className="input" value={ex.last} onChange={(e)=>updateEx("last", e.target.value)} /></Field>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <Field label="Téléphone *"><input className="input" value={ex.phone} onChange={(e)=>updateEx("phone", e.target.value)} /></Field>
          <Field label="Email *"><input className="input" type="email" value={ex.email} onChange={(e)=>updateEx("email", e.target.value)} /></Field>
        </div>

        <div style={{ marginTop: 14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
          <button className="btn light" style={{ fontWeight: 900 }} disabled={!canCreate || !!orderId} onClick={createGlobalOrder}>
            Créer commande globale
          </button>
          {orderId ? <span className="badge ok">ORDER_ID_GLOBAL: {orderId}</span> : <span className="badge">Pas encore créée</span>}
        </div>
      </div>

      <div className="card">
        <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <div>
            <h2 className="h2">Sous-commandes par jour</h2>
            <div className="small">Chaque carte = 1 jour = 1 tracking opérationnel</div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button className="btn light" onClick={addDayCard}>+ Ajouter un jour</button>
            <button className="btn light" style={{ fontWeight: 900 }} disabled={!orderId || days.length===0} onClick={confirmAll}>
              Valider / confirmer
            </button>
          </div>
        </div>

        <hr className="hr" />

        {days.length === 0 ? (
          <div className="badge">Ajoute un jour pour commencer.</div>
        ) : (
          <div className="grid">
            {days.map(d => (
              <div key={d.uiId} className="card" style={{ boxShadow: "none", borderRadius: 18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                  <div className="badge">Tracking (jour): généré au save (Supabase)</div>
                  <button className="btn light" onClick={()=>removeDay(d.uiId)}>Supprimer</button>
                </div>

                <hr className="hr" />

                <div className="row">
                  <Field label="Jour">
                    <select className="select" value={d.dayId} onChange={(e)=>updateDay(d.uiId,{ dayId:e.target.value })}>
                      {DEFAULT_DAYS.map(x => <option key={x.id} value={x.id}>{x.label} — {x.dateISO}</option>)}
                    </select>
                  </Field>
                  <Field label="Livraison">
                    <select className="select" value={d.delivery.mode} onChange={(e)=>updateDay(d.uiId,{ delivery:{ ...d.delivery, mode:e.target.value } })}>
                      <option value="DELIVERY">Livraison stand</option>
                      <option value="PICKUP">Retrait</option>
                    </select>
                  </Field>
                </div>

                {d.delivery.mode === "DELIVERY" ? (
                  <div style={{ marginTop: 12 }}>
                    <Field label="Instructions livraison (optionnel)">
                      <input className="input" value={d.delivery.instructions} onChange={(e)=>updateDay(d.uiId,{ delivery:{ ...d.delivery, instructions:e.target.value } })} />
                    </Field>
                  </div>
                ) : null}

                <div className="row" style={{ marginTop: 12 }}>
                  <Field label="Entrée">
                    <select className="select" value={d.entree} onChange={(e)=>updateDay(d.uiId,{ entree:e.target.value })}>
                      {MENU.entrees.map(o => <option key={o.id} value={o.id}>{o.label} — {money(o.price)}</option>)}
                    </select>
                  </Field>
                  <Field label="Plat">
                    <select className="select" value={d.plat} onChange={(e)=>updateDay(d.uiId,{ plat:e.target.value })}>
                      {MENU.plats.map(o => <option key={o.id} value={o.id}>{o.label} — {money(o.price)}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <Field label="Dessert">
                    <select className="select" value={d.dessert} onChange={(e)=>updateDay(d.uiId,{ dessert:e.target.value })}>
                      {MENU.desserts.map(o => <option key={o.id} value={o.id}>{o.label} — {money(o.price)}</option>)}
                    </select>
                  </Field>

                  <Field label="Options">
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      <label className="badge" style={{ cursor:"pointer" }}>
                        <input type="checkbox" checked={!!d.options.veggie} onChange={(e)=>updateDay(d.uiId,{ options:{ ...d.options, veggie:e.target.checked } })} /> Végé
                      </label>
                      <label className="badge" style={{ cursor:"pointer" }}>
                        <input type="checkbox" checked={!!d.options.noPork} onChange={(e)=>updateDay(d.uiId,{ options:{ ...d.options, noPork:e.target.checked } })} /> Sans porc
                      </label>
                      <label className="badge" style={{ cursor:"pointer" }}>
                        <input type="checkbox" checked={!!d.options.glutenFree} onChange={(e)=>updateDay(d.uiId,{ options:{ ...d.options, glutenFree:e.target.checked } })} /> Sans gluten
                      </label>
                    </div>
                  </Field>
                </div>

                <hr className="hr" />
                <div className="badge ok">Total jour: {money(dayTotal(d))}</div>
              </div>
            ))}
          </div>
        )}

        <hr className="hr" />
        <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
          <div className="badge">Total global: {money(total)}</div>
          <div className="small">Paiement / facture : à brancher ensuite.</div>
        </div>
      </div>
    </div>
  );
}
