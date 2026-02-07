"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const MENUS = {
  entrees: [
    { id: "salade", label: "Salade du jour" },
    { id: "soupe", label: "Soupe maison" },
    { id: "tartare", label: "Tartare (option)" }
  ],
  plats: [
    { id: "poulet", label: "Poulet rôti + légumes" },
    { id: "pates", label: "Pâtes (végé)" },
    { id: "poisson", label: "Poisson + riz" }
  ],
  desserts: [
    { id: "fruit", label: "Salade de fruits" },
    { id: "tarte", label: "Tarte du jour" },
    { id: "mousse", label: "Mousse chocolat" }
  ]
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export default function OrderPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    entree: "salade",
    plat: "poulet",
    dessert: "fruit",
    notes: ""
  });
  const [status, setStatus] = useState({ state: "idle", msg: "" });

  const canSubmit = useMemo(() => {
    return (
      form.first_name.trim() &&
      form.last_name.trim() &&
      form.phone.trim() &&
      form.email.trim()
    );
  }, [form]);

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setStatus({ state: "loading", msg: "Envoi…" });

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setStatus({ state: "error", msg: "ENV manquantes: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY" });
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      entree: form.entree,
      plat: form.plat,
      dessert: form.dessert,
      notes: form.notes?.trim() || null
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("id, created_at")
      .single();

    if (error) {
      setStatus({ state: "error", msg: `${error.message}${error.code ? " (code: " + error.code + ")" : ""}` });
      return;
    }

    setStatus({ state: "ok", msg: `OK — commande créée: ${data.id}` });
    setForm((p) => ({ ...p, notes: "" }));
  }

  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 18 }}>
      <h1 style={{ marginTop: 0 }}>Commande déjeuner (test)</h1>

      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
        Objectif : un insert Supabase simple (table <code>public.orders</code>).
      </div>

      <form onSubmit={submit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Prénom *">
            <input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </Field>
          <Field label="Nom *">
            <input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </Field>
          <Field label="Téléphone *">
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </Field>
          <Field label="Email *">
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
          </Field>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "14px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Field label="Entrée">
            <select value={form.entree} onChange={(e) => set("entree", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
              {MENUS.entrees.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Plat">
            <select value={form.plat} onChange={(e) => set("plat", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
              {MENUS.plats.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Dessert">
            <select value={form.dessert} onChange={(e) => set("dessert", e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}>
              {MENUS.desserts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Notes (optionnel)">
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }} />
        </Field>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="submit"
            disabled={!canSubmit || status.state === "loading"}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: canSubmit ? "#111" : "#777",
              color: "white",
              cursor: canSubmit ? "pointer" : "not-allowed"
            }}
          >
            Envoyer la commande
          </button>
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            {status.state === "loading" ? "Envoi…" : null}
            {status.state === "ok" ? <span style={{ color: "green" }}>{status.msg}</span> : null}
            {status.state === "error" ? <span style={{ color: "crimson" }}>{status.msg}</span> : null}
          </div>
        </div>
      </form>
    </div>
  );
}
