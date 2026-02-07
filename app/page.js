import Header from "../components/Header";
import { supabase } from "../lib/supabaseClient";

export const revalidate = 60; // cache 60s (safe)

export default async function HomePage() {
  // Server Component: on récupère l'event actif (si possible)
  let event = null;
  try {
    const { data, error } = await supabase
      .from("event_config")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error) event = data;
  } catch (_) {}

  const logoSrc = event?.logo_url || "/asset/logo.svg";
  const heroSrc = event?.hero_image_url || "/asset/eventmain.jpg";
  const eventName = event?.name || "Votre évènement";

  return (
    <>
      <Header />

      <main className="container">
        <section className="heroCard">
          <div className="heroGrid">
            <div>
              <div className="badge">Bienvenue</div>
              <h1 className="h1" style={{ fontSize: 44, marginTop: 10 }}>
                Maison Félicien — Commandes déjeuner
              </h1>
              <p className="p" style={{ maxWidth: 560 }}>
                Bienvenue sur <b>{eventName}</b>. Commandez à l’avance vos paniers déjeuner
                pendant la période de l’évènement, pour une livraison stand ou un retrait simple.
              </p>

              <div className="row" style={{ marginTop: 18, gap: 10, flexWrap: "wrap" }}>
                <a className="btn mf" href="/order">Commander</a>
              </div>

              <div className="hr" />

              <div className="small">
                • 1 commande globale → plusieurs jours<br />
                • Suivi opérationnel par jour (préparation / livraison)
              </div>
            </div>

            <div className="heroVisual">
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{ height: 38, width: "auto" }}
                />
                <span className="badge">Précommande</span>
              </div>

              <img
                src={heroSrc}
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
          <div className="small" style={{ lineHeight: 1.6 }}>
            1) Saisissez votre identité exposant<br />
            2) Créez la commande globale (pour le total)<br />
            3) Ajoutez un ou plusieurs jours (1 carte = 1 jour)<br />
            4) Choisissez menus + boissons + allergies<br />
            5) Confirmez : chaque jour obtient un suivi dédié
          </div>
        </section>

        <div className="footer">© {new Date().getFullYear()} Maison Félicien</div>
      </main>
    </>
  );
}
