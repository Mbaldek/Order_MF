export default function Home() {
  return (
    <div className="grid">
      <div className="card" style={{ padding: 22 }}>
        <div className="badge">Précommande • Paniers déjeuner</div>

        <div className="row" style={{ marginTop: 14, alignItems: "center" }}>
          <div>
            <h1 className="h1">Gagnez du temps pendant l’évènement.</h1>
            <p className="p">
              Commandez à l’avance vos paniers déjeuner (entrée + plat + dessert) pour un ou plusieurs jours.
              Retrait sur place ou livraison sur votre stand.
            </p>

            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/order"><button className="btn light" style={{ borderRadius: 14, padding: "12px 14px", fontWeight: 850 }}>Passer commande</button></a>
              <a href="/admin/login"><button className="btn light" style={{ borderRadius: 14, padding: "12px 14px" }}>Espace staff</button></a>
            </div>
          </div>

          <div>
            <div style={{
              border: "1px solid var(--line)",
              borderRadius: 18,
              height: 240,
              background: "linear-gradient(135deg, rgba(212,122,119,.18), rgba(212,122,119,.06))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)"
            }}>
              Visuel (à fournir)
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="card">
          <h2 className="h2">Comment ça marche</h2>
          <div className="grid" style={{ gap: 10 }}>
            <div className="badge">1 • Choisissez vos jours</div>
            <div className="badge">2 • Sélectionnez vos menus</div>
            <div className="badge">3 • Retrait ou livraison</div>
            <div className="badge">4 • Suivi côté Maison Félicien</div>
          </div>
        </div>

        <div className="card">
          <h2 className="h2">Informations</h2>
          <p className="p">
            Les contenus (texte, photos, menus, conditions) seront intégrés ensuite.
            Ici : une vitrine sobre + un flux de commande opérationnel.
          </p>
          <hr className="hr" />
          <div className="small">
            Astuce : test rapide → crée une commande sur <b>/order</b>, puis connecte-toi sur <b>/admin/login</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
