# MF — Prototype MOCK (UI/UX)

## Pages
- `/` : welcome / landing
- `/order` : commande multi-jours (1 commande globale + N sous-commandes)
- `/employee` : préparation / livraison + photo validation
- `/admin` : paramétrage + vues dynamiques
- `/health` : healthcheck

## Stockage
- 100% MOCK via `localStorage` (clé `mf_mock_v1`)
- Bouton **Reset mock** sur /order et /admin

## Netlify (stable)
- Branch: main
- Base directory: vide
- Build command: `npm run build`
- Publish directory: vide
- Functions directory: vide

Note: `netlify.toml` force `publish = ".next"` pour éviter l'erreur Netlify (publish==base).
