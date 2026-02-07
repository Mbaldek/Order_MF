"use client";

import { useEffect, useState } from "react";
import { getMyProfile, signInWithPassword } from "../../../lib/auth";

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // If already logged, route
    (async () => {
      try {
        const p = await getMyProfile();
        if (p?.role === "admin") window.location.href = "/admin";
        if (p?.role === "employee") window.location.href = "/employee";
      } catch {
        // ignore
      }
    })();
  }, []);

  async function login(e) {
    e.preventDefault();
    setToast({ type:"ok", msg:"Connexion…" });
    try {
      await signInWithPassword(email, password);
      const p = await getMyProfile();
      if (!p) throw new Error("Profil manquant (table profiles).");
      if (p.role === "admin") window.location.href = "/admin";
      else if (p.role === "employee") window.location.href = "/employee";
      else throw new Error("Role invalide. Attendu: admin | employee.");
    } catch (err) {
      setToast({ type:"bad", msg: err?.message || String(err) });
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ maxWidth: 520 }}>
        <div className="badge">Espace staff</div>
        <h1 className="h1" style={{ marginTop: 10 }}>Login</h1>
        <p className="p">Connexion Supabase Auth. Redirection automatique selon votre rôle.</p>

        {toast ? (
          <div style={{ marginTop: 12 }} className={"badge " + (toast.type === "ok" ? "ok" : "bad")}>
            {toast.msg}
          </div>
        ) : null}

        <hr className="hr" />

        <form onSubmit={login} className="grid">
          <Field label="Email">
            <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </Field>
          <Field label="Mot de passe">
            <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </Field>

          <button className="btn light" style={{ fontWeight: 900, padding: "12px 14px" }} type="submit">
            Se connecter
          </button>

          <div className="small">
            Prérequis : table <code>profiles</code> + role <code>admin</code>/<code>employee</code> défini pour votre user.
          </div>
        </form>
      </div>
    </div>
  );
}
