const KEY = "mf_mock_v1";

function uid(prefix="id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function load() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return seed();
  try { return JSON.parse(raw); } catch { return seed(); }
}

export function save(data) {
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

export function resetAll() {
  window.localStorage.removeItem(KEY);
}

export function seed() {
  const data = {
    config: {
      eventName: "Salon — Démo",
      days: [
        { id: "d1", label: "Jour 1", dateISO: "2026-03-10" },
        { id: "d2", label: "Jour 2", dateISO: "2026-03-11" },
        { id: "d3", label: "Jour 3", dateISO: "2026-03-12" }
      ],
      menus: {
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
      },
      employees: [
        { id: "e1", name: "Camille", active: true },
        { id: "e2", name: "Léa", active: true },
        { id: "e3", name: "Nicolas", active: true }
      ]
    },
    orders: []
  };
  if (typeof window !== "undefined") save(data);
  return data;
}

export function createOrder(exhibitor) {
  const data = load() || seed();
  const order = {
    orderId: uid("order"),
    createdAt: new Date().toISOString(),
    exhibitor,
    dayOrders: []
  };
  data.orders.unshift(order);
  save(data);
  return { data, order };
}

export function addOrUpdateDayOrder(orderId, dayOrder) {
  const data = load() || seed();
  const order = data.orders.find(o => o.orderId === orderId);
  if (!order) return { data, order: null };
  const idx = order.dayOrders.findIndex(d => d.dayOrderId === dayOrder.dayOrderId);
  if (idx >= 0) order.dayOrders[idx] = dayOrder; else order.dayOrders.push(dayOrder);
  save(data);
  return { data, order };
}

export function removeDayOrder(orderId, dayOrderId) {
  const data = load() || seed();
  const order = data.orders.find(o => o.orderId === orderId);
  if (!order) return { data, order: null };
  order.dayOrders = order.dayOrders.filter(d => d.dayOrderId !== dayOrderId);
  save(data);
  return { data, order };
}

export function updateDayStatus(dayOrderId, patch) {
  const data = load() || seed();
  for (const o of data.orders) {
    const d = o.dayOrders.find(x => x.dayOrderId === dayOrderId);
    if (d) {
      Object.assign(d, patch);
      save(data);
      return { data, day: d, order: o };
    }
  }
  return { data, day: null, order: null };
}

export function calcDayTotal(config, day) {
  const ent = config.menus.entrees.find(x => x.id === day.entree);
  const pl = config.menus.plats.find(x => x.id === day.plat);
  const des = config.menus.desserts.find(x => x.id === day.dessert);
  return (ent?.price || 0) + (pl?.price || 0) + (des?.price || 0);
}

export function calcOrderTotal(config, order) {
  return order.dayOrders.reduce((acc, d) => acc + calcDayTotal(config, d), 0);
}

export function newDayOrderFromDefaults(config) {
  const day = config.days[0];
  return {
    dayOrderId: uid("day"),
    dayId: day?.id || "",
    dayLabel: day?.label || "",
    dateISO: day?.dateISO || "",
    entree: config.menus.entrees[0]?.id || "",
    plat: config.menus.plats[0]?.id || "",
    dessert: config.menus.desserts[0]?.id || "",
    options: { veggie: false, noPork: false, glutenFree: false },
    delivery: { mode: "DELIVERY", instructions: "" },
    status: "DRAFT",
    employeeName: null,
    proofPhotoDataUrl: null
  };
}
