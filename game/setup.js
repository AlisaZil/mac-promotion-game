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
// Landscape layout for computers and tablets held sideways (see "WIDE LAYOUT" in style.css)
const WIDE_W = 1448, WIDE_H = 1086;

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

// Sounds
const CLICK_SOUNDS = ["sound/bop_1.mp3", "sound/bop_2.mp3"]; // one is picked at random on each item tap
const CLICK_VOLUME = 0.6;
// plays when a correct order (or sauce request) is served.
// success.mp3 with the 1.4s of silence at the start cut off.
const SUCCESS_SOUND = "sound/success-trimmed.wav";
const SUCCESS_VOLUME = 0.7;
const SOUNDS_ON_PHONE = false;   // phones play no sound effects; set to true to turn them back on

// Animation timings (ms)
const LOADING_MIN_MS = 900; // the loading screen shows at least this long
const SEND_MS = 600;      // tray flying to the customer
const REACTION_MS = 1100; // customer showing their happy / angry face
const LEAVE_MS = 600;     // walking out (matches .customer.leave in the CSS)

// Phone layout with tabs (see "PHONE LAYOUT" in style.css). Switched off:
// phones use the tall layout, like tablets held upright. Set to true to use it again.
const USE_TAB_LAYOUT = false;
const MOBILE_MAX_WIDTH = 600; // portrait screens narrower than this get the phone layout
const MOBILE_MIN_H = 1780;    // shortest the phone layout gets before it shrinks to fit

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

// Tutorial steps for the phone layout (the item groups are tabs there)
const TUTORIAL_STEPS_MOBILE = [
  { target: ".order", text: "This is the order. Each customer tells you what they want here." },
  { target: ".item-tabs", text: "Pick items here. Switch between Food, Drinks, Sides and Sauces with the tabs." },
  { target: ".item-grid", text: "To make a burger: tap the bun, add the ingredients, then tap the bun again to put the top on." },
  { target: ".item-tabs", text: "In Sauces: bottles go on the burger, dips go with nuggets, and packets are for customers who ask for them." },
  { target: ".recipes-btn", text: "Not sure what goes in a burger? Open the recipe book." },
  { target: ".tray", text: "Everything you tap lands on the tray. Tap something on the tray to take it off." },
  { target: ".done-btn", text: "Tap Serve order when it's ready. A right order gets 100 points!" },
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

// item panel (tabs on phones)
const itemPanel = document.getElementById("item-panel");

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
// On a phone (narrow portrait screen) the separate phone layout is used and
// fills the screen (see "PHONE LAYOUT" in style.css).
//
// On a computer or a tablet held sideways (a wide screen) the wide 1448 x 1086
// layout is used, scaled to fit (see "WIDE LAYOUT" in style.css).
//
// On a tablet held upright the shop always fills the screen edge to edge: it's scaled to the full width, and then the height is adjusted:
//   - taller screen: the extra height is shared out between the gaps
//   - shorter screen (e.g. with the browser's toolbars showing), in this order:
//       1. the gaps above the panels and above the tray get smaller
//       2. the empty floor under DONE is trimmed
//       3. the top of the awning goes past the top of the screen
//     (only if the screen is shorter than even that, it falls back to
//      fitting the height, with a little cream at the sides)
const GAP_SHRINK_MAX = 70;  // step 1: how far the tray area can move up
const FLOOR_TRIM_MAX = 90;  // step 2: how much of the floor can be cut
const TOP_CROP_MAX = 140;   // step 3: how much of the awning can go off screen

function fit() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const mobile = USE_TAB_LAYOUT && vh > vw && vw < MOBILE_MAX_WIDTH; // phone: tab layout (off)
  const phone = vh > vw && !mobile;                 // phone / tablet held upright: tall layout, full width
  const wide = vw >= vh;                            // computer / tablet sideways: wide layout
  stage.classList.toggle("mobile", mobile);
  stage.classList.toggle("phone", phone);
  stage.classList.toggle("wide", wide);

  let stageW = W, stageH = H, s, mid = 0, bot = 0, rest = 0, cropTop = 0;

  if (mobile) {
    // full width, full height; on short screens the stage gets wider instead
    // (the phone layout is placed from the edges, so it just spreads out)
    stageW = SHOP_W;
    s = vw / SHOP_W;
    stageH = vh / s;
    if (stageH < MOBILE_MIN_H) {
      stageH = MOBILE_MIN_H;
      s = vh / MOBILE_MIN_H;
      stageW = vw / s;
    }
  } else if (wide) {
    stageW = WIDE_W; stageH = WIDE_H;
    s = Math.min(vw / WIDE_W, vh / WIDE_H);
  } else {
    stageW = SHOP_W;
    s = vw / SHOP_W;
    const visibleH = vh / s;            // how much layout height fits on screen
    if (visibleH >= H) {
      const extra = visibleH - H;
      mid = extra * 0.3; bot = extra * 0.7; rest = extra * 0.3;
      stageH = visibleH;
    } else {
      let missing = H - visibleH;
      const shrink = Math.min(missing, GAP_SHRINK_MAX);
      mid = -shrink * 0.3; bot = -shrink;
      missing -= shrink;
      const trim = Math.min(missing, FLOOR_TRIM_MAX);
      missing -= trim;
      stageH = H - shrink - trim;
      cropTop = Math.min(missing, TOP_CROP_MAX);
      missing -= cropTop;
      if (missing > 0) s = vh / (stageH - cropTop); // very short screen: fit the height
    }
  }

  stage.style.width = stageW + "px";
  stage.style.height = Math.round(stageH) + "px";
  stage.style.setProperty("--mid", Math.round(mid) + "px");
  stage.style.setProperty("--bot", Math.round(bot) + "px");
  stage.style.setProperty("--rest", Math.round(rest) + "px");
  stage.style.setProperty("--crop", Math.round(cropTop) + "px"); // part of the stage above the screen

  viewport.style.width = stageW * s + "px";
  viewport.style.height = (stageH - cropTop) * s + "px";
  // move the stage up by cropTop (in screen pixels), then scale it
  stage.style.transform = "translateY(" + (-cropTop * s) + "px) scale(" + s + ")";
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

