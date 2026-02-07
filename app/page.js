export default function Home() {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 18 }}>
      <h1 style={{ marginTop: 0 }}>OK — App en ligne</h1>
      <p style={{ marginBottom: 0 }}>
        Objectif : valider la liaison GitHub → Netlify → Supabase par un insert simple.
      </p>
      <div style={{ marginTop: 14 }}>
        <a href="/order">
          <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "white", cursor: "pointer" }}>
            Ouvrir le formulaire de commande
          </button>
        </a>
      </div>
    </div>
  );
}
