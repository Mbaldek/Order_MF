import Header from "../components/Header";

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="container">
        <section className="heroCard">
          <div className="heroGrid">
            <div>
              <div className="badge">Accueil</div>
              <h1 className="h1" style={{ fontSize: 44, marginTop: 10 }}>
                Commandes événement
              </h1>
              <p className="p" style={{ maxWidth: 520 }}>
                Bienvenue sur le site de l’évènement. Nous vous proposons de commander à l’avance
                vos paniers déjeuners durant la période de l’évènement.
              </p>

              <div className="row" style={{ marginTop: 18, gap: 10, flexWrap: "wrap" }}>
                <a className="btn mf" href="/order">Commander</a>
                <a className="btn secondary" href="/admin">Admin</a>
              </div>

              <div className="hr" />
              <div className="small">
                • Commande multi-jours (1 globale → N jours)<br />
                • Suivi opérationnel par jour (prépa / livraison)
              </div>
            </div>

            <div className="heroVisual">
              {/* IMPORTANT : pas de onError ici (Server Component) */}
              <img
                src="/asset/eventmain.jpg"
                alt="Event"
                style={{
                  width: "100%",
                  height: 320,
                  objectFit: "cover",
                  borderRadius: 18,
                  border: "1px solid var(--border)",
                }}
              />
            </div>
          </div>
        </section>

        <section className="mainCard" style={{ marginTop: 14 }}>
          <h2 className="h2">Comment ça marche</h2>
          <div className="small">
            1) Saisir votre identité exposant<br />
            2) Créer la commande globale<br />
            3) Ajouter un ou plusieurs jours (1 carte = 1 jour)<br />
            4) Choisir entrée / plat / dessert + boissons + allergies<br />
            5) Confirmer
          </div>
        </section>

        <div className="footer">© {new Date().getFullYear()} Maison Félicien</div>
      </main>
    </>
  );
}
