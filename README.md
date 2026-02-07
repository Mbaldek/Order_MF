# Maison Félicien — Version réelle minimale (Supabase)

## Pages
- `/` : vitrine (pas de lien employé)
- `/order` : prise de commande multi-jours (INSERT public dans Supabase)
- `/admin/login` : login staff (Supabase Auth) => redirige automatiquement vers:
  - `/admin` si role=admin
  - `/employee` si role=employee
- `/admin` : vue globale des sous-commandes
- `/employee` : exécution terrain (statuts + upload preuve)
- `/health` : healthcheck

## 1) Variables d'environnement
Netlify > Site settings > Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2) Supabase - SQL
Exécuter `supabase_sql/01_core.sql` dans Supabase SQL editor.

## 3) Supabase - Auth
- Auth > Providers: Email ON
- Créer un utilisateur (admin) via Auth > Users > Add user (email+password)
- Dans Table editor > `profiles`, mettre `role = 'admin'` pour ce user

## 4) Storage (preuve photo)
- Storage > Create bucket: `proofs`
- Pour MVP: mettre bucket en **public**
  - (sinon, on fera une policy storage au sprint suivant)

## 5) Test
- `/order` : créer une commande + confirmer => check tables `orders` + `order_days`
- `/admin/login` : se connecter avec l'admin => `/admin` et voir la liste
- Créer un user employé (Auth > Users) (role par défaut employee) => `/admin/login` => `/employee`
- `/employee` : choisir le jour (date) et passer les statuts, uploader une preuve

## Netlify (stable)
- Branch to deploy: `main`
- Base directory: vide
- Build command: `npm run build`
- Publish directory: vide
- Functions directory: vide
