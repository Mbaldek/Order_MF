export default function Home() {
  return (
    <div className="grid">
      <div className="card">
        <div className="badge">Événement • Précommande déjeuner</div>
        <h1 className="h1" style={{ marginTop: 10 }}>
          Commandez vos paniers déjeuner à l’avance
        </h1>
        <p className="p">
          Maison Félicien vous propose de commander à l’avance vos paniers déjeuner durant l’événement.
          Retrait sur place ou livraison sur votre stand.
        </p>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/order"><button className="btn primary">Passer commande</button></a>
          <a href="/employee"><button className="btn">Espace employé</button></a>
          <a href="/admin"><button className="btn">Espace admin</button></a>
        </div>
      </div>

      <div className="row">
        <div className="card">
          <h2 className="h2">Comment ça marche</h2>
          <div className="grid" style={{ gap: 10 }}>
            <div className="badge">1 • Choisissez vos jours</div>
            <div className="badge">2 • Sélectionnez vos menus</div>
            <div className="badge">3 • Retrait ou livraison</div>
          </div>
        </div>

        <div className="card">
          <h2 className="h2">Visuel / marque</h2>
          <div style={{
            border: "1px dashed var(--line)",
            borderRadius: 14,
            height: 170,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--muted)"
          }}>
            Photo panier (placeholder)
          </div>
          <div className="small" style={{ marginTop: 10 }}>
            On branchera la vraie identité (couleurs, images, textes) ensuite.
          </div>
        </div>
      </div>
    </div>
  );
}
