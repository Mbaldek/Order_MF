import "./globals.css";

export const metadata = {
  title: "Maison Félicien — Commandes Salon (MOCK)",
  description: "Mock UI/UX - sans Supabase"
};

function NavBtn({ href, children }) {
  return (
    <a href={href}>
      <span className="btn ghost">{children}</span>
    </a>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div className="container">
          <div className="header">
            <div className="brand">
              <img src="/M.svg" alt="Maison Félicien" />
              <div>
                <div className="title">Maison Félicien</div>
                <div className="sub">Commandes salon — prototype (MOCK)</div>
              </div>
            </div>
            <div className="nav">
              <NavBtn href="/">Accueil</NavBtn>
              <NavBtn href="/order">Commander</NavBtn>
              <NavBtn href="/employee">Employé</NavBtn>
              <NavBtn href="/admin">Admin</NavBtn>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>{children}</div>
          <div style={{ marginTop: 24 }} className="small">
            Données MOCK via localStorage (clé: <code>mf_mock_v1</code>).
          </div>
        </div>
      </body>
    </html>
  );
}
