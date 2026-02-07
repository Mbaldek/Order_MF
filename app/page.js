import Header from "@/components/Header";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="container">
        <div className="hero">
          <section className="mainCard">
            <div className="badge">Maison Félicien • Commandes événement</div>
            <h1 className="h1">Commandez vos paniers déjeuner à l’avance</h1>
            <p className="p">
              Pendant l’événement, nous préparons et livrons vos paniers au stand (ou retrait).
              Vous passez une commande globale, puis une sous-commande par jour pour le suivi opérationnel.
            </p>

            <div className="hr" />

            <div className="small">
              • Déjeuner jour par jour (tracking) • Totaux HT/TTC • Tags (vegan, viande, poisson...) • Allergies/régime
            </div>
          </section>

          <aside className="heroMedia" style={{ overflow: "hidden" }}>
            {/* Placeholder: mets ton vrai visuel dans public/assets/eventmain.jpg */}
            <img
              src="/asset/eventmain.jpg"
              alt="Event"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div style={{ position: "absolute", padding: 22, textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 8 }}>Visuel événement</div>
              <div className="small">Remplacer /assets/eventmain.jpg</div>
            </div>
          </aside>
        </div>

        {/* CTA en bas */}
        <div style={{ marginTop: 22 }} className="mainCard">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Prêt à commander ?</div>
              <div className="small">Commande multi-jours, suivi jour par jour.</div>
            </div>
            <Link className="btn mf" href="/order">Commander</Link>
          </div>
        </div>

        <div className="footer">© {new Date().getFullYear()} Maison Félicien</div>
      </main>
    </>
  );
}
