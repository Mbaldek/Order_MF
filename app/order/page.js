"use client";

import Header from "../../components/Header";
import TagChips from "../../components/TagChips";
import DrinkPicker from "../../components/DrinkPicker";
import { supabase } from "../../lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

function euros(cents) {
  return (cents / 100).toFixed(2);
}

function defaultDay() {
  return {
    day_date: "",
    day_label: "",
    delivery_mode: "DELIVERY", // DELIVERY | PICKUP
    delivery_instructions: "",
    entree_id: "",
    plat_id: "",
    dessert_id: "",
    drinks: [],
    diet_notes: "",
  };
}

export default function OrderPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [event, setEvent] = useState(null);
  const [days, setDays] = useState([]);
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [itemTags, setItemTags] = useState([]);

  const [identity, setIdentity] = useState({
    company: "",
    stand: "",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });

  const [orderId, setOrderId] = useState(null);
  const [dayOrders, setDayOrders] = useState([defaultDay()]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErr("");

      const ev = await supabase
        .from("event_config")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ev.error) {
        if (mounted) setErr(`Erreur chargement event: ${ev.error.message}`);
        setLoading(false);
        return;
      }
      if (!ev.data) {
        if (mounted) setErr("Aucun event actif. Crée une ligne event_config is_active=true.");
        setLoading(false);
        return;
      }

      const eventId = ev.data.id;

      const d = await supabase
        .from("event_days")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("day_date", { ascending: true });

      if (d.error) {
        if (mounted) setErr(`Erreur chargement jours: ${d.error.message}`);
        setLoading(false);
        return;
      }

      const it = await supabase
        .from("menu_items")
        .select("*")
        .eq("event_id", eventId)
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (it.error) {
        if (mounted) setErr(`Erreur chargement menu: ${it.error.message}`);
        setLoading(false);
        return;
      }

      const tg = await supabase.from("tags").select("*").order("code", { ascending: true });
      if (tg.error) {
        if (mounted) setErr(`Erreur chargement tags: ${tg.error.message}`);
        setLoading(false);
        return;
      }

      const mt = await supabase.from("menu_item_tags").select("*");
      if (mt.error) {
        if (mounted) setErr(`Erreur chargement tags↔items: ${mt.error.message}`);
        setLoading(false);
        return;
      }

      if (!mounted) return;
      setEvent(ev.data);
      setDays(d.data || []);
      setItems(it.data || []);
      setTags(tg.data || []);
      setItemTags(mt.data || []);
      setLoading(false);
    }

    load();
    return () => (mounted = false);
  }, []);

  const byId = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(it.id, it);
    return m;
  }, [items]);

  const tagsByItemId = useMemo(() => {
    const tagsById = new Map(tags.map((t) => [t.id, t]));
    const map = new Map();
    for (const row of itemTags) {
      const t = tagsById.get(row.tag_id);
      if (!t) continue;
      if (!map.has(row.menu_item_id)) map.set(row.menu_item_id, []);
      map.get(row.menu_item_id).push(t);
    }
    return map;
  }, [tags, itemTags]);

  const categories = useMemo(() => {
    const entree = items.filter((i) => i.category === "entree");
    const plat = items.filter((i) => i.category === "plat");
    const dessert = items.filter((i) => i.category === "dessert");
    const boisson = items.filter((i) => i.category === "boisson");
    return { entree, plat, dessert, boisson };
  }, [items]);

  const totals = useMemo(() => {
    let totalHt = 0;
    let totalTtc = 0;

    const perDay = dayOrders.map((d) => {
      let ht = 0;
      let ttc = 0;

      const e = byId.get(d.entree_id);
      const p = byId.get(d.plat_id);
      const ds = byId.get(d.dessert_id);

      for (const x of [e, p, ds]) {
        if (x) {
          ht += x.price_ht_cents;
          ttc += x.price_ttc_cents;
        }
      }

      for (const b of d.drinks || []) {
        ht += (b.price_ht_cents || 0) * (b.qty || 0);
        ttc += (b.price_ttc_cents || 0) * (b.qty || 0);
      }

      totalHt += ht;
      totalTtc += ttc;
      return { ht, ttc };
    });

    return { totalHt, totalTtc, perDay };
  }, [dayOrders, byId]);

  async function createGlobalOrder() {
    setErr("");
    const required = ["company", "stand", "first_name", "last_name", "phone", "email"];
    for (const k of required) {
      if (!identity[k] || String(identity[k]).trim() === "") {
        setErr("Merci de compléter tous les champs identité.");
        return;
      }
    }

    const ins = await supabase
      .from("orders")
      .insert({
        company: identity.company.trim(),
        stand: identity.stand.trim(),
        first_name: identity.first_name.trim(),
        last_name: identity.last_name.trim(),
        phone: identity.phone.trim(),
        email: identity.email.trim(),
      })
      .select("id")
      .single();

    if (ins.error) {
      setErr(ins.error.message);
      return;
    }
    setOrderId(ins.data.id);
  }

  function addDay() {
    if (!orderId) {
      setErr("Crée d’abord la commande globale, puis ajoute les jours.");
      return;
    }
    setDayOrders((prev) => [...prev, defaultDay()]);
  }

  function removeDay(idx) {
    setDayOrders((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateDay(idx, patch) {
    setDayOrders((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  async function confirmAll() {
    setErr("");
    if (!orderId) {
      setErr("Crée d’abord la commande globale.");
      return;
    }

    for (const d of dayOrders) {
      if (!d.day_date) return setErr("Choisis un jour pour chaque sous-commande.");
      if (!d.entree_id || !d.plat_id || !d.dessert_id) return setErr("Choisis entrée/plat/dessert pour chaque jour.");
    }

    const payload = dayOrders.map((d, idx) => {
      const dayObj = days.find((x) => String(x.day_date) === String(d.day_date));
      const label = dayObj?.label || `Jour ${idx + 1}`;

      const delivery = {
        mode: d.delivery_mode,
        instructions: d.delivery_mode === "DELIVERY" ? (d.delivery_instructions || "") : "",
      };

      return {
        order_id: orderId,
        day_date: d.day_date,
        day_label: label,
        entree: byId.get(d.entree_id)?.name || "",
        plat: byId.get(d.plat_id)?.name || "",
        dessert: byId.get(d.dessert_id)?.name || "",
        drinks: d.drinks || [],
        diet_notes: d.diet_notes || "",
        options: {},
        delivery,
        status: "CONFIRMED",
      };
    });

    const ins = await supabase.from("order_days").insert(payload).select("id");
    if (ins.error) {
      setErr(ins.error.message);
      return;
    }

    alert(`OK. ${ins.data?.length || 0} sous-commande(s) créée(s).`);
    setDayOrders([defaultDay()]);
    setOrderId(null);
    setIdentity({ company: "", stand: "", first_name: "", last_name: "", phone: "", email: "" });
  }

  const infoBlock = (
    <div className="mainCard" style={{ marginBottom: 14 }}>
      <div className="badge">User • Commande</div>
      <h1 className="h1" style={{ fontSize: 40 }}>Commande multi-jours</h1>
      <p className="p">
        <b>Flux :</b> 1 commande globale (identité) → N sous-commandes (1 par jour) pour le suivi cuisine/livraison.
      </p>
      <div className="small">
        1) Identité • 2) Créer commande globale • 3) Ajouter jour • 4) Menus/boissons • 5) Confirmer
      </div>
      <div className="hr" />
      <div className="small">
        <b>FAQ</b><br />
        • Allergies : à préciser pour chaque jour.<br />
        • Modifs : Sprint 2 (règles + rôles).<br />
        • Paiement : Sprint suivant.
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Header />
        <main className="container">
          {infoBlock}
          <div className="mainCard">Chargement configuration…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        {infoBlock}
        {err ? <div className="alert" style={{ marginBottom: 14 }}>{err}</div> : null}

        <div className="mainCard">
          <h2 className="h2">Identité exposant</h2>

          <div className="grid2">
            <div className="field">
              <label>Société *</label>
              <input value={identity.company} onChange={(e) => setIdentity({ ...identity, company: e.target.value })} />
            </div>
            <div className="field">
              <label>Stand *</label>
              <input value={identity.stand} onChange={(e) => setIdentity({ ...identity, stand: e.target.value })} />
            </div>
            <div className="field">
              <label>Prénom *</label>
              <input value={identity.first_name} onChange={(e) => setIdentity({ ...identity, first_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Nom *</label>
              <input value={identity.last_name} onChange={(e) => setIdentity({ ...identity, last_name: e.target.value })} />
            </div>
            <div className="field">
              <label>Téléphone *</label>
              <input value={identity.phone} onChange={(e) => setIdentity({ ...identity, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Email *</label>
              <input value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} />
            </div>
          </div>

          <div className="hr" />

          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <button className="btn mf" onClick={createGlobalOrder}>Créer commande globale</button>
              <span style={{ marginLeft: 10 }} className="badge">
                {orderId ? `Commande globale: ${orderId}` : "Pas encore créée"}
              </span>
            </div>

            <div className="small">
              Event actif : <b>{event?.name || "—"}</b>
            </div>
          </div>

          <div className="hr" />
          <div className="small">
            Ajoute ensuite une sous-commande par jour. Total global, suivi journalier.
          </div>
        </div>

        <div className="mainCard" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h2 className="h2" style={{ marginBottom: 4 }}>Sous-commandes par jour</h2>
              <div className="small">Chaque carte = 1 jour = 1 tracking opérationnel</div>
            </div>
            <div className="row">
              <button className="btn secondary" onClick={addDay} disabled={!orderId}>+ Ajouter un jour</button>
            </div>
          </div>

          <div className="hr" />

          {dayOrders.map((d, idx) => {
            const perDay = totals.perDay[idx] || { ht: 0, ttc: 0 };

            return (
              <div
                key={idx}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 14,
                  background: "#fff",
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="badge">Jour #{idx + 1} • Tracking généré au save</div>
                  <button className="btn secondary" onClick={() => removeDay(idx)} disabled={dayOrders.length === 1}>
                    Supprimer
                  </button>
                </div>

                <div className="grid2" style={{ marginTop: 12 }}>
                  <div className="field">
                    <label>Jour *</label>
                    <select value={d.day_date} onChange={(e) => updateDay(idx, { day_date: e.target.value })} disabled={!orderId}>
                      <option value="">— Choisir —</option>
                      {days.map((x) => (
                        <option key={x.id} value={x.day_date}>
                          {x.label} ({x.day_date})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Livraison *</label>
                    <select value={d.delivery_mode} onChange={(e) => updateDay(idx, { delivery_mode: e.target.value })} disabled={!orderId}>
                      <option value="DELIVERY">Livraison stand</option>
                      <option value="PICKUP">Retrait</option>
                    </select>
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label>Instructions (si livraison)</label>
                    <input
                      value={d.delivery_instructions}
                      onChange={(e) => updateDay(idx, { delivery_instructions: e.target.value })}
                      placeholder="Ex: entrée côté allée B"
                      disabled={!orderId || d.delivery_mode !== "DELIVERY"}
                    />
                  </div>

                  <div className="field">
                    <label>Entrée *</label>
                    <select value={d.entree_id} onChange={(e) => updateDay(idx, { entree_id: e.target.value })} disabled={!orderId}>
                      <option value="">— Choisir —</option>
                      {categories.entree.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} • HT {euros(x.price_ht_cents)} € • TTC {euros(x.price_ttc_cents)} €
                        </option>
                      ))}
                    </select>
                    <TagChips tags={tagsByItemId.get(d.entree_id)} />
                  </div>

                  <div className="field">
                    <label>Plat *</label>
                    <select value={d.plat_id} onChange={(e) => updateDay(idx, { plat_id: e.target.value })} disabled={!orderId}>
                      <option value="">— Choisir —</option>
                      {categories.plat.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} • HT {euros(x.price_ht_cents)} € • TTC {euros(x.price_ttc_cents)} €
                        </option>
                      ))}
                    </select>
                    <TagChips tags={tagsByItemId.get(d.plat_id)} />
                  </div>

                  <div className="field">
                    <label>Dessert *</label>
                    <select value={d.dessert_id} onChange={(e) => updateDay(idx, { dessert_id: e.target.value })} disabled={!orderId}>
                      <option value="">— Choisir —</option>
                      {categories.dessert.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} • HT {euros(x.price_ht_cents)} € • TTC {euros(x.price_ttc_cents)} €
                        </option>
                      ))}
                    </select>
                    <TagChips tags={tagsByItemId.get(d.dessert_id)} />
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label>Boissons (quantités)</label>
                    <DrinkPicker
                      drinks={categories.boisson}
                      selected={d.drinks}
                      onChange={(next) => updateDay(idx, { drinks: next })}
                    />
                  </div>

                  <div className="field" style={{ gridColumn: "1 / -1" }}>
                    <label>Allergies / régime spécifique</label>
                    <textarea
                      rows={3}
                      value={d.diet_notes}
                      onChange={(e) => updateDay(idx, { diet_notes: e.target.value })}
                      placeholder="Ex: sans arachide, sans lactose, etc."
                      disabled={!orderId}
                    />
                  </div>
                </div>

                <div className="hr" />
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div className="small">
                    Total jour HT: <b>{euros(perDay.ht)} €</b> • Total jour TTC: <b>{euros(perDay.ttc)} €</b>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="hr" />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Total global</div>
              <div className="small">
                HT <b>{euros(totals.totalHt)} €</b> • TTC <b>{euros(totals.totalTtc)} €</b>
              </div>
            </div>

            <button className="btn mf" onClick={confirmAll} disabled={!orderId}>
              Valider / confirmer
            </button>
          </div>
        </div>

        <div className="footer">© {new Date().getFullYear()} Maison Félicien</div>
      </main>
    </>
  );
}
