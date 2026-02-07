import "./globals.css";

export const metadata = {
  title: "Maison Félicien — Commandes évènement",
  description: "Précommande de paniers déjeuner pendant un évènement"
};

function NavBtn({ href, children }) {
  return (
    <a href={href}>
      <span className="btn">{children}</span>
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
                <div className="sub">Commandes évènement</div>
              </div>
            </div>

            <div className="nav">
              <NavBtn href="/">Accueil</NavBtn>
              <NavBtn href="/order">Commander</NavBtn>
              <NavBtn href="/admin/login">Admin</NavBtn>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>{children}</div>

          <div style={{ marginTop: 26 }} className="small">
            Version “réelle” minimale : commandes stockées dans Supabase. Admin/Employé via login.
          </div>
        </div>
      </body>
    </html>
  );
}
