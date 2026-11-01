function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Picks a random burger from recipes.json.
// Returns the recipe: { id, name, layers, sauces, notInGame }
function makeRandomBurger(recipes) {
  return pick(recipes.recipes);
}

function pickExtras(items, count) {
  const pool = [...items.food, ...items.drinks, ...items.desserts].filter(
    (i) => i.id !== "chicken-cutlet"
  );
  const extras = [];
  while (extras.length < count && pool.length) {
    extras.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return extras;
}

// Picks 1-2 random dips (BBQ, Sweet Chili, Sweet 'n Sour) to go with nuggets.
// The same dip can come up twice.
function pickDips(items) {
  const dips = items.sauces.filter((s) => s.type === "dip");
  const count = 1 + Math.floor(Math.random() * 2);
  const result = [];
  for (let i = 0; i < count; i++) result.push(pick(dips));
  return result;
}

function makeOrders(items, customers, recipes, count = 8) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const hasBurger = Math.random() < 0.6;
    const burger = hasBurger ? makeRandomBurger(recipes) : null;

    // With a burger: 0-2 extras. Without one: 1-3 extras, so the order is never empty.
    const extraCount = hasBurger
      ? Math.floor(Math.random() * 3)
      : 1 + Math.floor(Math.random() * 3);

    const extras = pickExtras(items, extraCount);
    orders.push({
      customer: pick(customers.customers),
      burger: burger,
      extras: extras,
      // nuggets come with 1-2 dipping sauces
      dips: extras.some((e) => e.id === "nuggets") ? pickDips(items) : [],
    });
  }
  return orders;
}

// Picks 1-2 random sauce packets for a customer to ask for after their order.
// The same packet can come up twice (e.g. two ketchups).
function makeSauceRequest(items) {
  const packets = items.sauces.filter((s) => s.type === "packet");
  const count = 1 + Math.floor(Math.random() * 2);
  const request = [];
  for (let i = 0; i < count; i++) request.push(pick(packets));
  return request;
}
