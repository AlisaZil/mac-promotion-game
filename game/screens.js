// =====================================================================
// SCREENS
// =====================================================================
// The extra screens, the button hookups, and starting the game.
//
//   13. Loading screen      - "Almost ready..." while the pictures load, then the start screen
//   14. Tutorial            - first-time walkthrough
//   15. Recipe book         - the recipes page
//   16. Sign-up page        - "Fancy a real shift?" form
//   17. Event listeners     - connects buttons and clicks to the functions
//   18. Start               - runs when the page loads
//
// Load order (see index.html): orders.js, setup.js, gameplay.js, screens.js (all in game/).
// This file must be last.

// =====================================================================
// 13. Loading screen
// =====================================================================
// Shows "Almost ready..." and fills the bar as the pictures load: every picture
// on the page, plus the ones that only appear later (customer faces, sauce
// toppings, bun halves...). Then it fades out.

// Every picture the game will show, as a list of addresses.
function allPictures(data) {
  const urls = new Set();
  document.querySelectorAll("img").forEach((img) => urls.add(img.src));
  urls.add(new URL("photos/backgrounds/kitchen.png", location.href).href);
  const add = (path) => urls.add(new URL(path, location.href).href);
  for (const category of Object.keys(data.items)) data.items[category].forEach((item) => add(item.image));
  for (const c of data.customers.customers) { add(c.image); add(c.happy); add(c.angry); }
  for (const src of Object.values(SAUCE_TOPPINGS)) urls.add(new URL(src, location.href).href);
  ["photos/ingredients/bun-top.png", "photos/ingredients/bun-bottom.png",
   "photos/ui/heart.png", "photos/ui/talk-bubble.png"].forEach(add);
  return [...urls];
}

// Loads the pictures and moves the bar. Resolves when all are done (a picture
// that fails to load still counts, so the game never gets stuck here).
function preloadPictures(urls) {
  let done = 0;
  return Promise.all(urls.map((url) => new Promise(function (resolve) {
    const img = new Image();
    img.onload = img.onerror = function () {
      done++;
      loadingFill.style.width = Math.round((done / urls.length) * 100) + "%";
      resolve();
    };
    img.src = url;
  })));
}

function hideLoading() {
  loadingScreen.classList.add("done");
  setTimeout(function () { loadingScreen.hidden = true; }, 400);
}

// The "Happy Little Orders" start screen, shown once everything is loaded.
// START GAME begins the tutorial (first time) or the game.
function showStartScreen() {
  startScreen.hidden = false;
}

function handleStartClick() {
  startScreen.hidden = true;
  document.body.classList.remove("cream"); // back to the game's green sides
  if (tutorialSeen()) startGame();
  else startTutorial();
}

// =====================================================================
// 14. Tutorial (first time only)
// =====================================================================
// Highlights one area at a time and dims the rest, with a popup next to it.
// The timer only starts once the tutorial is finished or skipped.

// localStorage can be blocked (private mode etc.), so never let it break the game.
function tutorialSeen() {
  try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch (e) { return false; }
}
function rememberTutorialSeen() {
  try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch (e) { /* ignore */ }
}

function startTutorial() {
  tutorialRunning = true;
  startGame();              // sets up the first order, but the timer waits
  tutorialEl.hidden = false;
  showTutorialStep(0);
}

function nextTutorialStep() {
  if (tutorialStep < TUTORIAL_STEPS.length - 1) showTutorialStep(tutorialStep + 1);
  else endTutorial();
}

function endTutorial() {
  tutorialRunning = false;
  tutorialEl.hidden = true;
  rememberTutorialSeen();
  startTimer();
}

function showTutorialStep(index) {
  tutorialStep = index;
  const step = TUTORIAL_STEPS[index];
  document.getElementById("tut-step").textContent = (index + 1) + " / " + TUTORIAL_STEPS.length;
  document.getElementById("tut-text").textContent = step.text;
  document.getElementById("tut-next").textContent =
    index === TUTORIAL_STEPS.length - 1 ? "Let's go!" : "Next";
  placeTutorial();
}

// Puts the spotlight on the target and the popup below it (or above, if there's no room).
function placeTutorial() {
  if (tutorialEl.hidden) return;
  const target = document.querySelector(TUTORIAL_STEPS[tutorialStep].target);
  const stageBox = stage.getBoundingClientRect();
  const scale = stageBox.width / stage.offsetWidth;
  const box = target.getBoundingClientRect();
  const pad = 12;
  const x = (box.left - stageBox.left) / scale - pad;
  const y = (box.top - stageBox.top) / scale - pad;
  const w = box.width / scale + pad * 2;
  const hgt = box.height / scale + pad * 2;
  Object.assign(tutSpot.style, { left: x + "px", top: y + "px", width: w + "px", height: hgt + "px" });

  const stageW = stage.offsetWidth, stageH = stage.offsetHeight;
  const popW = tutPop.offsetWidth, popH = tutPop.offsetHeight;
  const gap = 30;
  const below = y + hgt + gap + popH < stageH - 20;
  const top = below ? y + hgt + gap : y - gap - popH;
  const left = Math.min(Math.max(x + w / 2 - popW / 2, 20), stageW - popW - 20);
  tutPop.style.left = left + "px";
  tutPop.style.top = top + "px";
  tutArrow.className = "tut-arrow " + (below ? "up" : "down");
  tutArrow.style.left = Math.min(Math.max(x + w / 2 - left - 16, 30), popW - 60) + "px";
}

// =====================================================================
// 15. Recipe book
// =====================================================================
// Opens over the game with the background dimmed. Close with the X,
// by clicking the dim background, or with Escape. The timer keeps running.
function openRecipes() {
  recipesOverlay.hidden = false;
  if (!recipesLoaded) loadRecipes();
}

function closeRecipes() {
  recipesOverlay.hidden = true;
}

async function loadRecipes() {
  try {
    const d = await loadData();
    renderRecipes(d.recipes.recipes, d.items);
    recipesLoaded = true;
  } catch (err) {
    recipesList.innerHTML =
      '<p class="recipes-error">Couldn\'t load the recipes.<br>' +
      "Open the game through a local server (for example VS Code Live Server).</p>";
  }
}

function renderRecipes(recipes, items) {
  // item id -> { name, image }
  const lookup = {
    "bun-bottom": { name: "Bottom bun", image: "photos/ingredients/bun-bottom.png" },
    "bun-top": { name: "Top bun", image: "photos/ingredients/bun-top.png" },
  };
  for (const category of Object.keys(items)) {
    for (const item of items[category]) {
      lookup[item.id] = { name: item.name, image: item.image };
    }
  }

  function icon(id) {
    const item = lookup[id] || { name: id, image: "" };
    const img = makeImg(item.image);
    img.alt = item.name;
    img.title = item.name;
    return img;
  }

  recipesList.innerHTML = "";
  for (const recipe of recipes) {
    const card = document.createElement("div");
    card.className = "recipe";

    const name = document.createElement("div");
    name.className = "recipe-name";
    name.textContent = recipe.name;

    // steps: bottom bun, then each layer, then top bun
    const stack = document.createElement("div");
    stack.className = "recipe-stack";
    const steps = ["bun-bottom", ...recipe.layers, "bun-top"];
    steps.forEach(function (id, i) {
      if (i > 0) {
        const arrow = document.createElement("span");
        arrow.className = "recipe-arrow";
        stack.appendChild(arrow);
      }
      const step = document.createElement("div");
      step.className = "recipe-step";
      const bubble = document.createElement("div");
      bubble.className = "recipe-bubble";
      bubble.appendChild(icon(id));
      step.append(bubble);
      stack.appendChild(step);
    });

    // sauces as coloured chips (e.g. "ketchup-bottle" gets the "ketchup" colours)
    const sauces = document.createElement("div");
    sauces.className = "recipe-sauces";
    sauces.append("Sauce:");
    if (recipe.sauces.length) {
      recipe.sauces.forEach(function (id) {
        const chip = document.createElement("span");
        chip.className = "sauce-chip " + id.replace("-bottle", "");
        chip.append(icon(id), (lookup[id] || { name: id }).name);
        sauces.appendChild(chip);
      });
    } else {
      const chip = document.createElement("span");
      chip.className = "sauce-chip none";
      chip.textContent = "None";
      sauces.appendChild(chip);
    }

    card.append(name, stack, sauces);
    recipesList.appendChild(card);
  }
}

// =====================================================================
// 16. Sign-up page ("Fancy a real shift?")
// =====================================================================
// Opened from WORK WITH US on the end screen.

// Sends the sign-up details somewhere. The game has no server, so right now this
// does nothing: connect it to your backend or a form service (e.g. with fetch()).
function sendApplication(details) {
  // fetch("https://your-server.example/apply", { method: "POST", body: JSON.stringify(details) });
}

function fillCityList() {
  for (const city of CITIES) {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  }
}

function openApply() {
  document.getElementById("apply-form-view").hidden = false;
  document.getElementById("apply-thanks").hidden = true;
  applyError.hidden = true;
  applyScreen.hidden = false;
  endScreen.hidden = true;
}

function closeApply() {
  applyScreen.hidden = true;
  endScreen.hidden = false;
}

function handleApplySubmit(e) {
  e.preventDefault();
  // check every field, outline the ones that are missing or wrong
  let firstBad = null;
  for (const field of applyForm.querySelectorAll("input, select")) {
    field.value = field.value.trim ? field.value.trim() : field.value;
    const ok = field.checkValidity();
    field.classList.toggle("invalid", !ok);
    if (!ok && !firstBad) firstBad = field;
  }
  if (firstBad) {
    applyError.textContent = "Please fill in all the fields.";
    if (firstBad.type === "email" && firstBad.value) applyError.textContent = "Please check your email address.";
    applyError.hidden = false;
    firstBad.focus();
    return;
  }

  const details = Object.fromEntries(new FormData(applyForm));
  sendApplication(details);

  document.getElementById("apply-thanks-name").textContent = ", " + details.name.split(" ")[0];
  document.getElementById("apply-form-view").hidden = true;
  document.getElementById("apply-thanks").hidden = false;
  applyForm.reset();
}

// Removes a field's red outline as soon as it's filled in correctly.
function clearFieldError(e) {
  if (e.target.checkValidity()) e.target.classList.remove("invalid");
}

// =====================================================================
// 17. Event listeners
// =====================================================================
// screen size
window.addEventListener("resize", fit);
window.addEventListener("resize", placeTutorial);

// items -> tray
document.querySelectorAll(".card, .condiments img, .packets img").forEach(function (el) {
  el.addEventListener("click", function () { handleItemClick(el); });
  el.addEventListener("animationend", function () { el.classList.remove("press"); });
});
// clear the tray's own effects once they finish, so they can play again next time
trayEl.addEventListener("animationend", function (e) {
  if (e.target === trayEl) trayEl.classList.remove("tray-in", "shake");
});

// serving and game flow
document.getElementById("done-btn").addEventListener("click", handleDone);
document.getElementById("play-again").addEventListener("click", startGame);
document.getElementById("end-play-again").addEventListener("click", startGame);

// tutorial
document.getElementById("tut-next").addEventListener("click", nextTutorialStep);
document.getElementById("tut-skip-link").addEventListener("click", endTutorial);
document.getElementById("tut-skip-top").addEventListener("click", endTutorial);

// recipe book
recipesBtn.addEventListener("click", openRecipes);
document.getElementById("recipes-close").addEventListener("click", closeRecipes);
recipesOverlay.addEventListener("click", function (e) {
  if (e.target === recipesOverlay) closeRecipes();
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !recipesOverlay.hidden) closeRecipes();
});

// start screen
document.getElementById("start-btn").addEventListener("click", handleStartClick);

// sign-up page
document.getElementById("work-with-us").addEventListener("click", openApply);
document.getElementById("apply-back").addEventListener("click", closeApply);
applyForm.addEventListener("submit", handleApplySubmit);
applyForm.addEventListener("input", clearFieldError);

// =====================================================================
// 18. Start
// =====================================================================
fit();
fillCityList();
document.getElementById("open-positions").href = OPEN_POSITIONS_URL;

const loadingStarted = Date.now();
loadData()
  .then((data) => preloadPictures(allPictures(data)))
  .then(function () {
    // keep the loading screen up for a moment so it doesn't just flash
    const wait = Math.max(0, LOADING_MIN_MS - (Date.now() - loadingStarted));
    setTimeout(function () {
      showStartScreen();
      hideLoading();
    }, wait);
  }, showLoadError);
