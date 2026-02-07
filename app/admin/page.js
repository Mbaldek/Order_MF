"use client";

import Header from "../../components/Header";
import TagChips from "../../components/TagChips";
import { supabase } from "../../lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

function euros(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("orders"); // orders | config

  const [event, setEvent] = useState(null);
  const [days, setDays] = useState([]);
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [itemTags, setItemTags] = useState([]);
  const [orderDays, setOrderDays] = useState([]);
  const [orders, setOrders] = useState([]);

  const [newDay, setNewDay] = useState({ day_date: "", label: "" });
  const [newTag, setNewTag] = useState({ code: "", label: "", color: "#d47a77" });
  const [newItem, setNewItem] = useState({
    category: "plat",
    name: "",
    description: "",
    price_ht_cents: 0,
    image_url: "",
  });

  const [eventEdit, setEventEdit] = useState({
    name: "",
    logo_url: "",
    hero_image_url: "",
    is_active: true,
  });

  async function loadAll() {
    setLoading(true);
    setErr("");

    const ev = await supabase
      .from("event_config")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ev.error) return setErr(`Erreur event: ${ev.error.message}`), setLoading(false);
    if (!ev.data) return setErr("Aucun event actif. (event_config is_active=true)"), setLoading(false);

    const eventId = ev.data.id;

    const d = await supabase
      .from("event_days")
      .select("*")
      .eq("event_id", eventId)
      .order("day_date", { ascending: true });

    const it = await supabase
      .from("menu_items")
      .select("*")
      .eq("event_id", eventId)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    const tg = await supabase.from("tags").select("*").order("code", { ascending: true });
    const mt = await supabase.from("menu_item_tags").select("*");

    const od = await supabase
      .from("order_days")
      .select("id, created_at, day_date, day_label, entree, plat, dessert, delivery, status, employee_name, proof_url, diet_notes, drinks, orders:orders(id, company, stand, first_name, last_name, phone, email)")
      .order("created_at", { ascending: false })
      .limit(300);

    const o = await supabase
      .from("orders")
      .select("id, created_at, company, stand, first_name, last_name, phone, email")
      .order("created_at", { ascending: false })
      .limit(300);

    if (d.error) return setErr(d.error.message), setLoading(false);
    if (it.error) return setErr(it.error.message), setLoading(false);
    if (tg.error) return setErr(tg.error.message), setLoading(false);
    if (mt.error) return setErr(mt.error.message), setLoading(false);
    if (od.error) return setErr(od.error.message), setLoading(false);
    if (o.error) return setErr(o.error.message), setLoading(false);

    setEvent(ev.data);
    setEventEdit({
      name: ev.data?.name || "",
      logo_url: ev.data?.logo_url || "",
      hero_image_url: ev.data?.hero_image_url || "",
      is_active: !!ev.data?.is_active,
    });

    setDays(d.data || []);
    setItems(it.data || []);
    setTags(tg.data || []);
    setItemTags(mt.data || []);
    setOrderDays(od.data || []);
    setOrders(o.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const stats = useMemo(() => {
    const s = { Total: 0, Confirmées: 0, Préparation: 0, Prêtes: 0, Livraison: 0, Livrées: 0 };
    for (const r of orderDays) {
      s.Total += 1;
      if (r.status === "CONFIRMED") s["Confirmées"] += 1;
      if (r.status === "PREPARING") s["Préparation"] += 1;
      if (r.status === "READY") s["Prêtes"] += 1;
      if (r.status === "DELIVERING") s["Livraison"] += 1;
      if (r.status === "DELIVERED" || r.status === "CLOSED") s["Livrées"] += 1;
    }
    return s;
  }, [orderDays]);

  const ordersGrouped = useMemo(() => {
    const byOrderId = new Map();
    for (const od of orderDays) {
      const oid = od.orders?.id;
      if (!oid) continue;
      if (!byOrderId.has(oid)) byOrderId.set(oid, { order: od.orders, days: [] });
      byOrderId.get(oid).days.push(od);
    }
    return Array.from(byOrderId.values());
  }, [orderDays]);

  async function saveEvent() {
    setErr("");
    if (!event?.id) return;

    const res = await supabase
      .from("event_config")
      .update({
        name: eventEdit.name || null,
        logo_url: eventEdit.logo_url || null,
        hero_image_url: eventEdit.hero_image_url || null,
      })
      .eq("id", event.id);

    if (res.error) return setErr(res.error.message);
    loadAll();
  }

  async function addEventDay() {
    setErr("");
    if (!event?.id) return;
    if (!newDay.day_date || !newDay.label) return setErr("Jour + label requis.");

    const res = await supabase.from("event_days").insert({
      event_id: event.id,
      day_date: newDay.day_date,
      label: newDay.label,
      is_active: true,
    });
    if (res.error) return setErr(res.error.message);

    setNewDay({ day_date: "", label: "" });
    loadAll();
  }

  async function toggleDay(id, is_active) {
    const res = await supabase.from("event_days").update({ is_active: !is_active }).eq("id", id);
    if (res.error) return setErr(res.error.message);
    loadAll();
  }

  async function addTag() {
    setErr("");
    if (!newTag.code || !newTag.label) return setErr("code + label requis.");

    const res = await supabase.from("tags").insert({
      code: newTag.code.trim(),
      label: newTag.label.trim(),
      color: newTag.color || "#d47a77",
    });
    if (res.error) return setErr(res.error.message);

    setNewTag({ code: "", label: "", color: "#d47a77" });
    loadAll();
  }

  async function addItem() {
    setErr("");
    if (!event?.id) return;
    if (!newItem.name) return setErr("Nom item requis.");

    const ht = Number(newItem.price_ht_cents || 0);
    const vat = 0.10; // TVA 10%
    const ttc = Math.round(ht * (1 + vat));

    const res = await supabase.from("menu_items").insert({
      event_id: event.id,
      category: newItem.category,
      name: newItem.name.trim(),
      description: newItem.description?.trim() || null,
      price_ht_cents: ht,
      vat_rate: vat,
      price_ttc_cents: ttc,
      image_url: newItem.image_url?.trim() || null,
      is_active: true,
    });
    if (res.error) return setErr(res.error.message);

    setNewItem({ category: "plat", name: "", description: "", price_ht_cents: 0, image_url: "" });
    loadAll();
  }

  async function toggleItem(id, is_active) {
    const res = await supabase.from("menu_items").update({ is_active: !is_active }).eq("id", id);
    if (res.error) return setErr(res.error.message);
    loadAll();
  }

  async function setTagForItem(itemId, tagId, checked) {
    setErr("");
    if (checked) {
      const res = await supabase.from("menu_item_tags").insert({ menu_item_id: itemId, tag_id: tagId });
      if (res.error) return setErr(res.error.message);
    } else {
      const res = await supabase.from("menu_item_tags").delete().eq("menu_item_id", itemId).eq("tag_id", tagId);
      if (res.error) return setErr(res.error.message);
    }
    loadAll();
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="mainCard">Chargement…</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div className="badge">Admin</div>
            <h1 className="h1" style={{ fontSize: 40, marginTop: 8 }}>Back-office</h1>
            <div className="small">Event actif : <b>{event?.name || "—"}</b></div>
          </div>

          <div className="row">
            <button className="btn secondary" onClick={() => setTab("orders")}>Commandes</button>
            <button className="btn secondary" onClick={() => setTab("config")}>Configuration</button>
            <button className="btn" onClick={loadAll}>Rafraîchir</button>
          </div>
        </div>

        {err ? <div className="alert" style={{ marginBottom: 14 }}>{err}</div> : null}

        {tab === "orders" ? (
          <div className="mainCard">
            <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
              {Object.entries(stats).map(([k, v]) => (
                <div key={k} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 14, minWidth: 150 }}>
                  <div style={{ fontWeight: 900 }}>{k}</div>
                  <div className="small">{v}</div>
                </div>
              ))}
            </div>

            <div className="hr" />

            <h2 className="h2">Vue par jour (sous-commandes)</h2>
            <div className="small">Dernières 300 lignes</div>

            <div className="hr" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={{ padding: 10 }}>Jour</th>
                    <th style={{ padding: 10 }}>Exposant</th>
                    <th style={{ padding: 10 }}>Stand</th>
                    <th style={{ padding: 10 }}>Menu</th>
                    <th style={{ padding: 10 }}>Allergies</th>
                    <th style={{ padding: 10 }}>Livraison</th>
                    <th style={{ padding: 10 }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDays.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 10 }} className="small">Aucune donnée.</td></tr>
                  ) : (
                    orderDays.map((r) => (
                      <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: 10 }}>{r.day_label} ({String(r.day_date)})</td>
                        <td style={{ padding: 10 }}>{r.orders?.company || "—"}</td>
                        <td style={{ padding: 10 }}>{r.orders?.stand || "—"}</td>
                        <td style={{ padding: 10 }}>
                          <div className="small"><b>Entrée:</b> {r.entree}</div>
                          <div className="small"><b>Plat:</b> {r.plat}</div>
                          <div className="small"><b>Dessert:</b> {r.dessert}</div>
                        </td>
                        <td style={{ padding: 10 }} className="small">{r.diet_notes || "—"}</td>
                        <td style={{ padding: 10 }} className="small">
                          {r.delivery?.mode || "—"}<br />
                          {r.delivery?.instructions ? <span>({r.delivery.instructions})</span> : null}
                        </td>
                        <td style={{ padding: 10 }}><span className="badge">{r.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="hr" />

            <h2 className="h2">Vue par exposant (commande globale)</h2>
            <div className="small">Groupé par order_id</div>

            <div className="hr" />

            {ordersGrouped.length === 0 ? (
              <div className="small">Aucune commande.</div>
            ) : (
              ordersGrouped.map((g) => (
                <div key={g.order.id} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 14, marginBottom: 12 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        {g.order.company} — Stand {g.order.stand}
                      </div>
                      <div className="small">{g.order.first_name} {g.order.last_name} • {g.order.email} • {g.order.phone}</div>
                    </div>
                    <span className="badge">{g.days.length} jour(s)</span>
                  </div>

                  <div className="hr" />
                  <div className="small" style={{ lineHeight: 1.6 }}>
                    {g.days.map((d) => (
                      <div key={d.id}>
                        <b>{d.day_label}</b> — {d.entree} / {d.plat} / {d.dessert} • <span className="badge">{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mainCard">
            <h2 className="h2">Configuration</h2>
            <div className="small">Event + jours + menus + tags + associations.</div>

            <div className="hr" />

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Event</div>
              <div className="grid2">
                <div className="field">
                  <label>Nom</label>
                  <input value={eventEdit.name} onChange={(e) => setEventEdit({ ...eventEdit, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Logo URL (optionnel)</label>
                  <input value={eventEdit.logo_url} onChange={(e) => setEventEdit({ ...eventEdit, logo_url: e.target.value })} placeholder="/asset/logo.svg ou https://..." />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Hero image URL (optionnel)</label>
                  <input value={eventEdit.hero_image_url} onChange={(e) => setEventEdit({ ...eventEdit, hero_image_url: e.target.value })} placeholder="/asset/eventmain.jpg ou https://..." />
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn mf" onClick={saveEvent}>Sauver event</button>
              </div>
            </div>

            <div className="hr" />

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Jours</div>
              <div className="grid2">
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={newDay.day_date} onChange={(e) => setNewDay({ ...newDay, day_date: e.target.value })} />
                </div>
                <div className="field">
                  <label>Label</label>
                  <input value={newDay.label} onChange={(e) => setNewDay({ ...newDay, label: e.target.value })} placeholder="Jour 1" />
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn mf" onClick={addEventDay}>Ajouter</button>
              </div>

              <div className="hr" />
              {days.map((d) => (
                <div key={d.id} className="row" style={{ justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <div>
                    <b>{d.label}</b> <span className="small">({d.day_date})</span>
                    <span style={{ marginLeft: 10 }} className="badge">{d.is_active ? "actif" : "inactif"}</span>
                  </div>
                  <button className="btn secondary" onClick={() => toggleDay(d.id, d.is_active)}>
                    {d.is_active ? "Désactiver" : "Activer"}
                  </button>
                </div>
              ))}
            </div>

            <div className="hr" />

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Tags</div>
              <div className="grid2">
                <div className="field">
                  <label>Code</label>
                  <input value={newTag.code} onChange={(e) => setNewTag({ ...newTag, code: e.target.value })} placeholder="vegan" />
                </div>
                <div className="field">
                  <label>Label</label>
                  <input value={newTag.label} onChange={(e) => setNewTag({ ...newTag, label: e.target.value })} placeholder="Vegan" />
                </div>
                <div className="field">
                  <label>Couleur (hex)</label>
                  <input value={newTag.color} onChange={(e) => setNewTag({ ...newTag, color: e.target.value })} placeholder="#2ecc71" />
                </div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn mf" onClick={addTag}>Ajouter</button>
              </div>

              <div className="hr" />
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                {tags.map((t) => (
                  <span
                    key={t.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      background: t.color || "#eee",
                      fontWeight: 900,
                      border: "1px solid rgba(0,0,0,.06)",
                    }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="hr" />

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Menu items</div>

              <div className="grid2">
                <div className="field">
                  <label>Catégorie</label>
                  <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                    <option value="entree">Entrée</option>
                    <option value="plat">Plat</option>
                    <option value="dessert">Dessert</option>
                    <option value="boisson">Boisson</option>
                  </select>
                </div>
                <div className="field">
                  <label>Nom</label>
                  <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Prix HT (cents)</label>
                  <input
                    type="number"
                    value={newItem.price_ht_cents}
                    onChange={(e) => setNewItem({ ...newItem, price_ht_cents: Number(e.target.value || 0) })}
                  />
                  <div className="small">TTC auto (TVA 10%) : {euros(Math.round(Number(newItem.price_ht_cents || 0) * 1.1))} €</div>
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Description</label>
                  <input value={newItem.description || ""} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Image URL (optionnel)</label>
                  <input value={newItem.image_url || ""} onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })} />
                </div>
              </div>

              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn mf" onClick={addItem}>Ajouter item</button>
              </div>

              <div className="hr" />

              {items.map((it) => (
                <div key={it.id} style={{ borderTop: "1px solid var(--border)", padding: "12px 0" }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 900 }}>
                        {it.category.toUpperCase()} • {it.name}{" "}
                        <span className="small">
                          (HT {euros(it.price_ht_cents)} € • TTC {euros(it.price_ttc_cents)} €)
                        </span>
                      </div>
                      <div className="small">{it.description || ""}</div>
                      <TagChips tags={tagsByItemId.get(it.id)} />
                      <div className="small">{it.image_url ? `image: ${it.image_url}` : ""}</div>
                    </div>
                    <button className="btn secondary" onClick={() => toggleItem(it.id, it.is_active)}>
                      {it.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </div>

                  <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                    {tags.map((t) => {
                      const current = (tagsByItemId.get(it.id) || []).some((x) => x.id === t.id);
                      return (
                        <label
                          key={t.id}
                          className="row"
                          style={{
                            gap: 8,
                            border: "1px solid var(--border)",
                            borderRadius: 999,
                            padding: "6px 10px",
                            background: current ? "rgba(212,122,119,.10)" : "transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={current}
                            onChange={(e) => setTagForItem(it.id, t.id, e.target.checked)}
                          />
                          <span style={{ fontWeight: 800 }}>{t.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="footer">© {new Date().getFullYear()} Maison Félicien</div>
      </main>
    </>
  );
}
