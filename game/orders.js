// =====================================================================
// ORDERS
// =====================================================================
// Makes random customer orders for the game.
//
// HOW IT'S USED
//   The game (gameplay.js) calls makeOrders() to get a batch of 8 orders and
//   serves them one by one; when they run out it asks for 8 more. After a
//   correct order it sometimes calls makeSauceRequest() so the customer asks
//   for extra sauce packets.
//
// WHERE THE CHOICES COME FROM
//   data/items.json      - food, drinks, desserts, sauces (packets and dips)
//   data/customers.json  - who is ordering (and their happy / angry faces)
//   data/recipes.json    - the burgers (Big Mac, McChicken, ...)
//   To add something new to orders, add it to those files. Nothing here needs
//   to change, except for the chicken cutlet note in pickExtras().
//
// WHAT AN ORDER LOOKS LIKE
//   {
//     customer: { id, name, image, happy, angry },  // from customers.json
//     burger:   { id, name, layers, sauces } or null, // a recipe, or no burger
//     extras:   [ items ],                           // 0-3 sides / drinks / desserts
//     dips:     [ items ],                           // 1-2 dips if there are nuggets, else []
//   }
//   The tray has to match this exactly for the order to count as correct
//   (see trayMatchesOrder() in gameplay.js).
//
// QUICK CHANGES
//   - How often orders have a burger: BURGER_CHANCE in makeOrders()
//   - How many extras an order can have: the extraCount lines in makeOrders()
//   - How many dips / sauce packets: the count line in pickDips() / makeSauceRequest()
//   - How many orders per batch: the `count = 8` in makeOrders()

// ---------------------------------------------------------------------
// pick(list)
//   Returns one random item from a list.
//   Example: pick(["a", "b", "c"]) -> "b"
// ---------------------------------------------------------------------
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------------------------------------------------------------------
// makeRandomBurger(recipes)
//   Picks a random burger from recipes.json (every burger has the same chance).
//   Gets:    the whole recipes.json object
//   Returns: one recipe, e.g. { id: "mcchicken", name: "McChicken",
//            layers: ["chicken-cutlet", "lettuce"], sauces: ["mayo-bottle"], ... }
// ---------------------------------------------------------------------
function makeRandomBurger(recipes) {
  return pick(recipes.recipes);
}

// ---------------------------------------------------------------------
// pickExtras(items, count)
//   Picks `count` different items from food, drinks and desserts
//   (e.g. fries, soda, McFlurry). The same item never comes up twice.
//   The chicken cutlet is left out because it's used as a burger patty,
//   not served on its own.
//   Gets:    the whole items.json object, and how many to pick
//   Returns: a list of items (can be shorter than `count` if there aren't enough)
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// pickDips(items)
//   Picks 1-2 random dips (BBQ, Sweet Chili, Sweet 'n Sour) to go with nuggets.
//   The same dip can come up twice (e.g. two BBQ).
//   Gets:    the whole items.json object (uses sauces with "type": "dip")
//   Returns: a list of 1-2 dip items
//   To change how many: edit the `count` line (1 + 0..1 = 1 or 2).
// ---------------------------------------------------------------------
function pickDips(items) {
  const dips = items.sauces.filter((s) => s.type === "dip");
  const count = 1 + Math.floor(Math.random() * 2);
  const result = [];
  for (let i = 0; i < count; i++) result.push(pick(dips));
  return result;
}

// ---------------------------------------------------------------------
// makeOrders(items, customers, recipes, count = 8)
//   Makes a batch of random orders. For each order:
//     1. picks a random customer
//     2. 60% of the time adds a burger (see BURGER_CHANCE)
//     3. adds extras: 0-2 with a burger, 1-3 without one,
//        so an order is never empty and never more than 3 things
//        (the tray holds 3 main items)
//     4. if there are nuggets, adds 1-2 dips
//   Gets:    items.json, customers.json and recipes.json objects,
//            and how many orders to make (8 if left out)
//   Returns: a list of orders (see "WHAT AN ORDER LOOKS LIKE" at the top)
// ---------------------------------------------------------------------
function makeOrders(items, customers, recipes, count = 8) {
  const BURGER_CHANCE = 0.6; // 0 = never a burger, 1 = always a burger
  const orders = [];
  for (let i = 0; i < count; i++) {
    const hasBurger = Math.random() < BURGER_CHANCE;
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

// ---------------------------------------------------------------------
// makeSauceRequest(items)
//   Picks 1-2 random sauce packets (ketchup, mustard, mayo) for a customer
//   to ask for in a speech bubble after a correct order.
//   The same packet can come up twice (e.g. two ketchups).
//   How often this happens is SAUCE_REQUEST_CHANCE in setup.js.
//   Gets:    the whole items.json object (uses sauces with "type": "packet")
//   Returns: a list of 1-2 packet items
// ---------------------------------------------------------------------
function makeSauceRequest(items) {
  const packets = items.sauces.filter((s) => s.type === "packet");
  const count = 1 + Math.floor(Math.random() * 2);
  const request = [];
  for (let i = 0; i < count; i++) request.push(pick(packets));
  return request;
}
