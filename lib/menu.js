export const DEFAULT_DAYS = [
  { id: "d1", label: "Jour 1", dateISO: "2026-03-10" },
  { id: "d2", label: "Jour 2", dateISO: "2026-03-11" },
  { id: "d3", label: "Jour 3", dateISO: "2026-03-12" }
];

export const MENU = {
  entrees: [
    { id: "salade", label: "Salade du jour", price: 6.0 },
    { id: "soupe", label: "Soupe maison", price: 6.0 },
    { id: "tartare", label: "Tartare (option)", price: 7.5 }
  ],
  plats: [
    { id: "poulet", label: "Poulet rôti + légumes", price: 14.0 },
    { id: "pates", label: "Pâtes (végé)", price: 12.5 },
    { id: "poisson", label: "Poisson + riz", price: 15.0 }
  ],
  desserts: [
    { id: "fruit", label: "Salade de fruits", price: 4.5 },
    { id: "tarte", label: "Tarte du jour", price: 5.0 },
    { id: "mousse", label: "Mousse chocolat", price: 5.0 }
  ]
};

export function money(x) {
  return (Math.round(x * 100) / 100).toFixed(2) + " €";
}

export function dayTotal(day) {
  const e = MENU.entrees.find(x => x.id === day.entree)?.price || 0;
  const p = MENU.plats.find(x => x.id === day.plat)?.price || 0;
  const d = MENU.desserts.find(x => x.id === day.dessert)?.price || 0;
  return e+p+d;
}
