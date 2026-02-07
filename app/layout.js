export const metadata = {
  title: "MF - Commande Déjeuner (Test)",
  description: "Sprint 0 - Liaison Supabase"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: 24 }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700 }}>Maison Félicien</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Sprint 0 — liaison Netlify ↔ Supabase</div>
            </div>
            <nav style={{ fontSize: 14 }}>
              <a href="/" style={{ marginRight: 12 }}>Accueil</a>
              <a href="/order">Commander</a>
            </nav>
          </header>
          <main style={{ marginTop: 18 }}>{children}</main>
          <footer style={{ marginTop: 28, fontSize: 12, opacity: 0.7 }}>
            © {new Date().getFullYear()} Maison Félicien
          </footer>
        </div>
      </body>
    </html>
  );
}
