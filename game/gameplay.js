// =====================================================================
// GAMEPLAY
// =====================================================================
// Everything that happens while playing.
//
//    7. Tray & burgers      - putting things on the tray, building burgers
//    8. Order board         - showing the current order
//    9. Score & timer       - the clock and points on screen
//   10. Customer            - reactions, walking in/out, sauce requests
//   11. Serving             - DONE: checking the tray and sending it
//   12. Game flow           - start, timer, end
//
// Uses makeOrders() and makeSauceRequest() from orders.js.
// Load order (see index.html): orders.js, setup.js, gameplay.js, screens.js (all in game/).

// =====================================================================
// 7. Tray & burgers
// =====================================================================
// Clicking an item presses it and puts it on the tray.
//  - bun: starts a burger on the tray (bottom bun)
//  - burger ingredients and sauce bottles: stack on the burger being built
//  - bun again: puts the top bun on and finishes the burger
//  - anything else: goes on the tray as its own item
// Clicking something on the tray takes it off again.
function handleItemClick(el) {
  restartAnimation(el, "press");
  playClickSound();

  const id = el.dataset.id;
  const src = (el.tagName === "IMG" ? el : el.querySelector("img")).src;
  if (id === "burger-bun") openBurger ? closeBurger() : startBurger();
  else if (BURGER_INGREDIENTS.includes(id)) addLayer(src, id);
  else if (SAUCE_TOPPINGS[id]) addLayer(SAUCE_TOPPINGS[id], id, "sauce");
  else if (el.closest(".packets")) addSauceItem(src, "packet", PACKET_MAX, id);
  else if (el.closest(".sauces")) addSauceItem(src, "dip", DIP_MAX, id);
  else addItem(src, id);
}

// Phone layout: shows the cards of one tab (Food, Drinks, Sides or Sauces).
function selectItemTab(name) {
  itemPanel.dataset.tab = name;
  document.querySelectorAll(".item-tab").forEach(function (tab) {
    tab.classList.toggle("active", tab.dataset.tab === name);
  });
}

// A short "bop" when an item is tapped (bop 1 or bop 2, at random).
// Each sound is loaded once; cloning lets quick taps overlap.
const clickSounds = CLICK_SOUNDS.map(function (src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  return audio;
});
// A phone: a touch screen whose short side is phone-sized (either way up).
function isPhone() {
  const touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  return touch && Math.min(screen.width, screen.height) < 600;
}
function soundsAllowed() {
  return SOUNDS_ON_PHONE || !isPhone();
}

const successSound = new Audio(SUCCESS_SOUND);
successSound.preload = "auto";
function playSuccessSound() {
  if (!soundsAllowed()) return;
  const sound = successSound.cloneNode();
  sound.volume = SUCCESS_VOLUME;
  sound.play().catch(function () {});
}

function playClickSound() {
  if (!soundsAllowed()) return;
  const sound = clickSounds[Math.floor(Math.random() * clickSounds.length)].cloneNode();
  sound.volume = CLICK_VOLUME;
  sound.play().catch(function () {}); // ignore if the browser blocks sound
}

// How many main items are on the tray (everything except packets and dips).
function mainItemCount() {
  return trayFood.querySelectorAll(":scope > :not(.packet):not(.dip)").length;
}

function startBurger() {
  if (mainItemCount() >= TRAY_MAX) return;
  const burger = document.createElement("div");
  burger.className = "burger";
  burger.title = "Click to remove";
  burger.appendChild(makeImg("photos/ingredients/bun-bottom.png", "bun-bottom"));
  burger.addEventListener("click", function () {
    if (burger === openBurger) openBurger = null;
    burger.remove();
  });
  trayFood.appendChild(burger);
  openBurger = burger;
}

function layerCount(burger) {
  return burger.querySelectorAll(".layer").length;
}

function addLayer(src, id, extraClass) {
  if (!openBurger) return;
  const n = layerCount(openBurger);
  if (n >= BURGER_MAX_LAYERS) return;
  const layer = makeImg(src, extraClass ? "layer " + extraClass : "layer");
  layer.dataset.id = id;
  layer.style.bottom = LAYER_FIRST + n * LAYER_STEP + "px";
  openBurger.appendChild(layer);
  openBurger.style.height = LAYER_FIRST + n * LAYER_STEP + LAYER_HEIGHT + "px";
}

function closeBurger() {
  const n = layerCount(openBurger);
  const topBun = makeImg("photos/ingredients/bun-top.png", "bun-top");
  topBun.style.bottom = (n ? LAYER_FIRST + (n - 1) * LAYER_STEP + TOP_BUN_GAP : 26) + "px";
  openBurger.appendChild(topBun);
  openBurger.style.height = parseInt(topBun.style.bottom) + TOP_BUN_HEIGHT + "px";
  openBurger = null;
}

function addItem(src, id) {
  if (mainItemCount() >= TRAY_MAX) return;
  const item = makeImg(src, "tray-item");
  item.dataset.id = id;
  item.title = "Click to remove";
  item.addEventListener("click", function () { item.remove(); });
  trayFood.appendChild(item);
}

// Small sauce items (packets and dips) that sit in the row under the main items.
function addSauceItem(src, kind, max, id) {
  if (trayFood.querySelectorAll("." + kind).length >= max) return;
  const item = makeImg(src, kind);
  if (id) item.dataset.id = id;
  item.title = "Click to remove";
  item.addEventListener("click", function () { item.remove(); });
  trayFood.appendChild(item);
}

function clearTray() {
  trayFood.innerHTML = "";
  openBurger = null;
}

// =====================================================================
// 8. Order board
// =====================================================================
// One row on the order board, e.g. "1×  McChicken".
function addOrderRow(count, name) {
  const row = document.createElement("div");
  row.className = "order-row";
  const qty = document.createElement("span");
  qty.className = "order-qty";
  qty.textContent = count + "×";
  const label = document.createElement("span");
  label.textContent = name;
  row.append(qty, label);
  orderLines.appendChild(row);
}

// Small coloured chips under a row, e.g. the dips that go with nuggets.
function addOrderChips(list) {
  const chips = document.createElement("div");
  chips.className = "order-chips";
  for (const group of countItems(list)) {
    const chip = document.createElement("span");
    chip.className = "order-chip " + group.item.id;
    const name = group.item.name.replace(" Dip", "");
    chip.textContent = group.count > 1 ? group.count + "× " + name : name;
    chips.appendChild(chip);
  }
  orderLines.appendChild(chips);
}

// Shrinks the board text a little at a time until the whole order fits.
// Runs again when the font finishes loading and when the screen size changes,
// because both change how much space the text takes.
function fitOrderText() {
  let fit = 1;
  orderTextEl.style.setProperty("--fit", fit);
  // the bottom of the space inside the board / bubble (minus its padding)
  const padBottom = parseFloat(getComputedStyle(orderTextEl).paddingBottom) || 0;
  const bottom = orderTextEl.clientHeight - Math.max(padBottom, 12);
  while (orderLines.offsetTop + orderLines.offsetHeight > bottom && fit > 0.5) {
    fit -= 0.05;
    orderTextEl.style.setProperty("--fit", fit);
  }
}

// Shows the current order on the board and its customer at the counter.
function showOrder(order) {
  orderTitle.textContent = "Order #" + String(orderNumber).padStart(3, "0"); // CSS shows it in capitals on tablets

  orderLines.innerHTML = "";
  if (order.burger) addOrderRow(1, order.burger.name);
  for (const extra of order.extras) {
    addOrderRow(1, extra.name);
    // the dips go right under the nuggets as chips
    if (extra.id === "nuggets" && order.dips && order.dips.length) addOrderChips(order.dips);
  }
  fitOrderText();

  customerEl.src = order.customer.image;
  customerEl.alt = order.customer.name;
  restartAnimation(customerEl, "arrive");
}

function nextOrder() {
  if (orderQueue.length === 0) {
    const d = gameData;
    orderQueue = makeOrders(d.items, d.customers, d.recipes);
  }
  currentOrder = orderQueue.shift();
  orderNumber++;
  showOrder(currentOrder);
}

// =====================================================================
// 9. Score & timer
// =====================================================================
function renderTimer() {
  timerEl.textContent = formatTime(timeLeft);
  timerEl.classList.toggle("hurry", playing && timeLeft <= 10);
}

function renderPoints() {
  pointsEl.textContent = points.toLocaleString("en-US");
}

// The little "+100" / "-10" that floats up from the points box.
function popPoints(text, good) {
  pointsPop.textContent = text;
  pointsPop.classList.toggle("wrong", !good);
  restartAnimation(pointsPop, "show");
}

// =====================================================================
// 10. Customer
// =====================================================================
// Happy face with a heart popping up, or angry face with a shake.
function react(good) {
  const customer = currentOrder.customer;
  customerEl.src = (good ? customer.happy : customer.angry);
  customerEl.classList.remove("arrive");
  restartAnimation(customerEl, good ? "happy" : "angry");
  if (good) {
    restartAnimation(heartEl, "show");
    playSuccessSound();
  }
}

// The customer walks out to the left, then the next one walks in from the right.
function leaveAndNext() {
  customerEl.classList.remove("happy", "angry");
  restartAnimation(customerEl, "leave");
  reactionTimer = setTimeout(function () {
    reacting = false;
    customerEl.classList.remove("leave");
    if (playing) nextOrder();
  }, LEAVE_MS);
}

// The customer asks for sauce packets in a talk bubble (also listed on the board).
function askForSauce() {
  sauceRequest = makeSauceRequest(gameData.items);
  customerEl.classList.remove("happy", "angry");
  customerEl.src = currentOrder.customer.image;

  bubbleItems.innerHTML = "";
  for (const packet of sauceRequest) {
    const img = makeImg(packet.image);
    img.alt = packet.name;
    bubbleItems.appendChild(img);
  }
  bubbleItems.append("?");
  bubbleEl.hidden = false;
  restartAnimation(bubbleEl, "show");

  orderLines.innerHTML = "";
  for (const group of countItems(sauceRequest)) addOrderRow(group.count, group.item.name);
  fitOrderText();
  reacting = false; // DONE works again, now for the packets
}

function hideSauceRequest() {
  sauceRequest = null;
  bubbleEl.hidden = true;
}

// =====================================================================
// 11. Serving (DONE)
// =====================================================================
// DONE sends the tray to the customer, right or wrong. Only a correct order
// earns points. An empty tray can't be sent (so a double click can't skip an order).
function handleDone() {
  if (!playing || reacting) return;
  if (sauceRequest) serveSauce();
  else serveOrder();
}

// Checks the tray against the order. The order of burger ingredients doesn't
// matter, only that the right ones are there.
function trayMatchesOrder(order) {
  const burgers = trayFood.querySelectorAll(":scope > .burger");
  const extras = idsOf(trayFood.querySelectorAll(":scope > .tray-item"));

  // the extras (fries, drinks, desserts...) must match exactly
  if (!sameItems(extras, order.extras.map((e) => e.id))) return false;

  // nuggets need their dips; other orders shouldn't have any
  const dips = idsOf(trayFood.querySelectorAll(":scope > .dip"));
  if (!sameItems(dips, (order.dips || []).map((d) => d.id))) return false;

  if (!order.burger) return burgers.length === 0;
  if (burgers.length !== 1) return false;

  const burger = burgers[0];
  if (!burger.querySelector(".bun-top")) return false; // not closed yet
  const layers = idsOf(burger.querySelectorAll(".layer:not(.sauce)"));
  const sauces = idsOf(burger.querySelectorAll(".layer.sauce"));
  return sameItems(layers, order.burger.layers) && sameItems(sauces, order.burger.sauces);
}

// A copy of the tray (with the food) flies up to the customer and shrinks,
// while the real tray is emptied and slides back in. `onArrive` runs when the
// copy reaches the customer.
function sendTray(onArrive) {
  const shopBox = shopEl.getBoundingClientRect();
  const scale = shopBox.width / shopEl.offsetWidth;
  const trayBox = trayEl.getBoundingClientRect();
  const customerBox = customerEl.getBoundingClientRect();

  // the flying copy, placed exactly over the real tray
  const flying = trayEl.cloneNode(true);
  flying.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  flying.className = "abs tray flying-tray";
  Object.assign(flying.style, {
    left: (trayBox.left - shopBox.left) / scale + "px",
    top: (trayBox.top - shopBox.top) / scale + "px",
    marginTop: "0px",
  });
  shopEl.appendChild(flying);

  // move its centre to the customer's counter spot (a bit above their paws)
  const dx = (customerBox.left + customerBox.width / 2 - (trayBox.left + trayBox.width / 2)) / scale;
  const dy = (customerBox.top + customerBox.height * 0.75 - (trayBox.top + trayBox.height / 2)) / scale;
  flying.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.6}px) scale(0.7)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 },
  ], { duration: SEND_MS, easing: "ease-in" });

  clearTray();
  restartAnimation(trayEl, "tray-in");

  // a timer (not the animation's finish event) so it always fires on time
  reactionTimer = setTimeout(function () {
    flying.remove();
    if (playing) onArrive();
  }, SEND_MS);
}

function serveOrder() {
  // Nothing to serve (empty, or only sauce packets / dips): the order can't be sent.
  if (mainItemCount() === 0) {
    restartAnimation(trayEl, "shake");
    return;
  }
  const correct = trayMatchesOrder(currentOrder);
  reacting = true; // DONE is paused until the next customer is ready
  sendTray(function () {
    if (correct) {
      points += POINTS_PER_ORDER;
      ordersServed++;
      renderPoints();
    }
    popPoints(correct ? "+" + POINTS_PER_ORDER : "+0", correct);
    react(correct);
    reactionTimer = setTimeout(function () {
      if (playing && correct && Math.random() < SAUCE_REQUEST_CHANCE) askForSauce();
      else leaveAndNext();
    }, REACTION_MS);
  });
}

function serveSauce() {
  const packets = idsOf(trayFood.querySelectorAll(":scope > .packet"));
  if (packets.length === 0) {
    restartAnimation(trayEl, "shake");
    return;
  }
  const correct = sameItems(packets, sauceRequest.map((p) => p.id));
  reacting = true;
  sendTray(function () {
    if (correct) points += SAUCE_POINTS;
    else points = Math.max(0, points - SAUCE_PENALTY); // never below 0
    renderPoints();
    popPoints(correct ? "+" + SAUCE_POINTS : "-" + SAUCE_PENALTY, correct);
    hideSauceRequest();
    react(correct);
    reactionTimer = setTimeout(leaveAndNext, REACTION_MS);
  });
}

// =====================================================================
// 12. Game flow
// =====================================================================
function startGame() {
  timeLeft = GAME_SECONDS;
  points = 0;
  ordersServed = 0;
  orderNumber = 0;
  orderQueue = [];
  clearTray();
  clearTimeout(reactionTimer);
  document.querySelectorAll(".flying-tray").forEach((el) => el.remove());
  reacting = false;
  customerEl.classList.remove("happy", "angry", "leave");
  hideSauceRequest();
  playing = true;
  renderTimer();
  renderPoints();
  nextOrder();
  gameOverlay.hidden = true;
  endScreen.hidden = true;
  applyScreen.hidden = true;

  clearInterval(timerId);
  if (!tutorialRunning) startTimer(); // during the tutorial the clock waits
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(function () {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  playing = false;
  clearInterval(timerId);
  clearTimeout(reactionTimer);
  hideSauceRequest();
  renderTimer();
  closeRecipes();
  endScore.textContent =
    "You served " + ordersServed + " " + (ordersServed === 1 ? "order" : "orders") +
    " · " + points.toLocaleString("en-US") + " points";
  endScreen.hidden = false;
}

function showLoadError() {
  loadingScreen.hidden = true;
  gameTitle.textContent = "OOPS!";
  gameMessage.innerHTML =
    "The game couldn't load its data.<br>" +
    "Open it through a local server<br>(for example VS Code Live Server).";
  gameButtons.hidden = true;
  gameOverlay.hidden = false;
}

