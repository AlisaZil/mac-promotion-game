// =====================================================================
// SETUP
// =====================================================================
// Settings, page elements, game state and shared helpers used by the other files.
//
//    1. Settings            - numbers and texts you may want to change
//    2. Page elements       - everything the game reads from index.html
//    3. Game state          - values that change while playing
//    4. Helpers             - small shared functions
//    5. Screen size         - fits the game to any window / phone
//    6. Game data           - loads data/items.json, customers.json, recipes.json
//
// Load order (see index.html): orders.js, setup.js, gameplay.js, screens.js (all in game/).

// =====================================================================
// 1. Settings
// =====================================================================

// Game
const GAME_SECONDS = 120;         // length of a game
const POINTS_PER_ORDER = 100;     // correct order
const SAUCE_REQUEST_CHANCE = 0.4; // chance a happy customer asks for sauce packets
const SAUCE_POINTS = 25;          // right sauce packets
const SAUCE_PENALTY = 10;         // wrong sauce packets

// Layout (see "phone screens" in style.css)
const W = 941, H = 1672, SHOP_W = 822;

// Tray
const TRAY_MAX = 3;     // burgers, food, drinks and desserts
const PACKET_MAX = 3;   // sauce packets and dips don't count toward TRAY_MAX
const DIP_MAX = 2;

// Burgers
const BURGER_MAX_LAYERS = 7;
const BURGER_INGREDIENTS = ["beef-patty", "cheese", "lettuce", "pickles", "tomato", "chicken-cutlet"];
// Sauce bottles squirt their sauce onto the burger being built.
const SAUCE_TOPPINGS = {
  "ketchup-bottle": "photos/toppings/ketchup.png",
  "mustard-bottle": "photos/toppings/mustard.png",
  "mayo-bottle": "photos/toppings/mayo.png",
};
// Burger stacking, in px from the bottom of the burger.
const LAYER_FIRST = 22;  // first layer sits on the bottom bun
const LAYER_STEP = 18;   // each next layer is this much higher
const TOP_BUN_GAP = 34;  // top bun sits this much above the last layer
const LAYER_HEIGHT = 88; // about how tall an ingredient picture is at 100px wide
const TOP_BUN_HEIGHT = 62;

// Animation timings (ms)
const LOADING_MIN_MS = 900; // the loading screen shows at least this long
const SEND_MS = 600;      // tray flying to the customer
const REACTION_MS = 1100; // customer showing their happy / angry face
const LEAVE_MS = 600;     // walking out (matches .customer.leave in the CSS)

// Tutorial
const TUTORIAL_KEY = "mac-game-tutorial-seen";
const TUTORIAL_STEPS = [
  { target: ".order", text: "This is the order. Each customer tells you what they want here." },
  { target: ".ingredients", text: "Make burgers here. Tap the bun to start, add the ingredients, then tap the bun again to put the top on." },
  { target: ".recipes-btn", text: "Not sure what goes in a burger? Open the recipe book." },
  { target: ".condiments", text: "Tap a bottle to squeeze sauce onto the burger you're making." },
  { target: ".drinks", text: "Drinks and desserts go straight onto the tray." },
  { target: ".sauces", text: "Nuggets come with dips. Add the ones on the order." },
  { target: ".packets", text: "Sometimes a customer asks for sauce packets in a speech bubble. Add them here." },
  { target: ".tray", text: "Everything you tap lands on the tray. Tap something on the tray to take it off." },
  { target: ".done-btn", text: "Tap DONE to serve. A right order gets 100 points!" },
  { target: ".timer", text: "You have 2 minutes. Serve as many orders as you can!" },
];

// Sign-up page
// Cities in the "Preferred city" list. Replace these with your own.
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
// Where "Browse open positions" goes. Put the real jobs page link here.
const OPEN_POSITIONS_URL = "#";

// =====================================================================
// 2. Page elements
// =====================================================================
const viewport = document.getElementById("viewport");
const stage = document.getElementById("stage");
const shopEl = document.querySelector(".shop");

// tray
const trayEl = document.querySelector(".tray");
const trayFood = document.getElementById("tray-food");

// counter: timer, points, customer, order board
const timerEl = document.getElementById("timer");
const pointsEl = document.getElementById("points");
const pointsPop = document.getElementById("points-pop");
const customerEl = document.getElementById("customer");
const heartEl = document.getElementById("heart");
const bubbleEl = document.getElementById("talk-bubble");
const bubbleItems = document.getElementById("bubble-items");
const orderTextEl = document.querySelector(".order-text");
const orderTitle = document.getElementById("order-title");
const orderLines = document.getElementById("order-lines");

// end screen and loading-error message
const endScreen = document.getElementById("end-screen");
const endScore = document.getElementById("end-score");
const gameOverlay = document.getElementById("game-overlay");
const gameTitle = document.getElementById("game-title");
const gameMessage = document.getElementById("game-message");
const gameButtons = document.getElementById("game-buttons");

// start screen
const startScreen = document.getElementById("start-screen");

// loading screen
const loadingScreen = document.getElementById("loading-screen");
const loadingFill = document.getElementById("loading-fill");

// tutorial
const tutorialEl = document.getElementById("tutorial");
const tutSpot = document.getElementById("tut-spot");
const tutPop = document.getElementById("tut-pop");
const tutArrow = document.getElementById("tut-arrow");

// recipe book
const recipesBtn = document.getElementById("recipes-btn");
const recipesOverlay = document.getElementById("recipes-overlay");
const recipesList = document.getElementById("recipes-list");

// sign-up page
const applyScreen = document.getElementById("apply-screen");
const applyForm = document.getElementById("apply-form");
const applyError = document.getElementById("apply-error");
const citySelect = document.getElementById("apply-city");

// =====================================================================
// 3. Game state
// =====================================================================
let gameData = null;      // { items, customers, recipes } once loaded

let timeLeft = GAME_SECONDS;
let points = 0;
let ordersServed = 0;
let orderNumber = 0;
let orderQueue = [];
let currentOrder = null;
let timerId = null;
let playing = false;

let openBurger = null;    // the burger currently being built, if any
let reacting = false;     // true while the tray is flying / customer reacting (DONE is paused)
let reactionTimer = null;
let sauceRequest = null;  // the packets the customer is asking for, or null

let tutorialRunning = false;
let tutorialStep = 0;
let recipesLoaded = false;

// =====================================================================
// 4. Helpers
// =====================================================================
function makeImg(src, className) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  if (className) img.className = className;
  return img;
}

// Plays a CSS animation class again, even if it's already on the element.
function restartAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// Groups repeated items: [BBQ, BBQ, Mayo] -> [{ item: BBQ, count: 2 }, { item: Mayo, count: 1 }]
function countItems(list) {
  const groups = [];
  for (const item of list) {
    const group = groups.find((g) => g.item.id === item.id);
    if (group) group.count++;
    else groups.push({ item: item, count: 1 });
  }
  return groups;
}

// True if both lists have the same ids, in any order.
function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const x = a.slice().sort(), y = b.slice().sort();
  return x.every((v, i) => v === y[i]);
}

function idsOf(elements) {
  return Array.from(elements, (el) => el.dataset.id);
}

// =====================================================================
// 5. Screen size
// =====================================================================
// The layout is 941 x 1672 (the shop itself is 822 wide, with green strips on
// the sides). On a tall phone screen we drop the green strips and make the
// stage taller so it fills the whole screen; the extra height is shared out
// between the gaps (see "phone screens" in style.css).
function fit() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const phone = vw / vh < W / H; // screen is taller than the layout
  const stageW = phone ? SHOP_W : W;
  const stageH = phone ? Math.max(H, Math.round(SHOP_W * vh / vw)) : H;
  const s = Math.min(vw / stageW, vh / stageH);

  const extra = stageH - H;
  stage.classList.toggle("phone", phone);
  stage.style.width = stageW + "px";
  stage.style.height = stageH + "px";
  stage.style.setProperty("--mid", Math.round(extra * 0.3) + "px");
  stage.style.setProperty("--bot", Math.round(extra * 0.7) + "px");
  stage.style.setProperty("--rest", Math.round(extra * 0.3) + "px");

  viewport.style.width = stageW * s + "px";
  viewport.style.height = stageH * s + "px";
  stage.style.transform = "scale(" + s + ")";
}

// =====================================================================
// 6. Game data
// =====================================================================
// Browsers only allow reading these files when the game is opened through a
// local server (for example VS Code Live Server), not by double-clicking it.
async function loadData() {
  if (gameData) return gameData;
  const [items, customers, recipes] = await Promise.all([
    fetch("data/items.json").then((r) => r.json()),
    fetch("data/customers.json").then((r) => r.json()),
    fetch("data/recipes.json").then((r) => r.json()),
  ]);
  gameData = { items, customers, recipes };
  return gameData;
}

