// ===== Word Rain — game logic =====

// ---------- 1. Words ----------
const WORDS = [
  // short
  "rain", "code", "sun", "tree", "fish", "moon", "star", "cake", "blue", "jump",
  "fast", "kind", "home", "song", "wave", "leaf", "milk", "rice", "gold", "snow",
  "door", "book", "cat", "dog", "sky", "cloud", "storm", "light", "dream", "smile",
  "bird", "rose", "fire", "lake", "ship", "king", "game", "play", "hope", "glow",
  // medium
  "planet", "rocket", "garden", "button", "window", "bridge", "orange", "silver",
  "jungle", "pocket", "candle", "forest", "thunder", "rainbow", "puzzle", "market",
  "github", "browser", "coffee", "monkey", "basket", "dragon", "mirror", "canvas",
  "pirate", "castle", "wizard", "galaxy", "banana", "island", "spirit", "melody",
  // long
  "keyboard", "umbrella", "adventure", "chocolate", "butterfly", "lightning",
  "beautiful", "mountain", "elephant", "computer", "sunflower", "waterfall",
  "javascript", "developer", "repository", "challenge", "fantastic", "telescope",
  "hurricane", "pineapple", "astronaut", "crocodile", "symphony", "champion"
];

// ---------- 2. Settings ----------
const DIFFICULTIES = {
  easy:   { label: "Easy",   speed: 38, speedStep: 9,  spawn: 2100, minSpawn: 900, lives: 5, info: "5 lives · slower words · perfect for warming up" },
  normal: { label: "Normal", speed: 52, speedStep: 13, spawn: 1700, minSpawn: 650, lives: 3, info: "3 lives · the classic Word Rain" },
  hard:   { label: "Hard",   speed: 68, speedStep: 16, spawn: 1350, minSpawn: 500, lives: 3, info: "3 lives · fast, long words from the start" }
};

const POWERUPS = {
  bomb:   { icon: "💣", words: ["boom", "blast", "kaboom"],          cls: "pu-bomb" },
  freeze: { icon: "❄️", words: ["ice", "frost", "chill", "freeze"], cls: "pu-freeze" },
  heart:  { icon: "❤️", words: ["love", "heart", "life"],           cls: "pu-heart" }
};

const MAX_LIVES       = 5;
const WORDS_PER_LEVEL = 8;
const FREEZE_SECONDS  = 5;
const POWER_CHANCE    = 0.12;  // 12% of words are power-ups

// ---------- 3. Page elements ----------
const $ = id => document.getElementById(id);
const game = $("game"), rain = $("rain"), sky = $("sky"), input = $("typing");
const toast = $("toast"), flash = $("flash");
const scoreEl = $("score"), comboEl = $("combo"), levelEl = $("level"), livesEl = $("lives"), bestEl = $("best");
const startScreen = $("startScreen"), pauseScreen = $("pauseScreen"), overScreen = $("overScreen");
const muteBtn = $("muteBtn"), pauseBtn = $("pauseBtn");

// ---------- 4. Saving in the browser ----------
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* not available — fine */ }
  }
};

// ---------- 5. Sound effects (made with code, no audio files) ----------
const sound = (() => {
  let ctx = null;
  let muted = store.get("wordRainMuted", "0") === "1";

  function audio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = "sine", vol = 0.15, delay = 0, slideTo = null) {
    if (muted) return;
    const c = audio(); if (!c) return;
    const t = c.currentTime + delay;
    const osc = c.createOscillator(), gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol) {
    if (muted) return;
    const c = audio(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    src.buffer = buf;
    filter.type = "lowpass";
    filter.frequency.value = 900;
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(c.destination);
    src.start();
  }

  const notes = (list, gap, type = "triangle", vol = 0.12, dur = 0.15) =>
    list.forEach((f, i) => tone(f, dur, type, vol, i * gap));

  // Soft rain sound in the background
  function rainSound(dur) {
    if (muted) return;
    const c = audio(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    src.buffer = buf;
    filter.type = "bandpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.6;
    const t = c.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 1);
    gain.gain.setValueAtTime(0.06, t + dur - 1.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
  }

  return {
    unlock: () => audio(),
    key:    () => tone(900, 0.03, "square", 0.025),
    error:  () => tone(150, 0.12, "sawtooth", 0.07),
    clear:  combo => { const b = 520 + Math.min(combo, 20) * 25; tone(b, 0.12, "triangle", 0.15); tone(b * 1.5, 0.15, "triangle", 0.1, 0.05); },
    miss:   () => tone(220, 0.35, "sine", 0.25, 0, 55),
    power:  () => notes([523, 659, 784, 1047], 0.07),
    boom:   () => { noise(0.6, 0.45); tone(120, 0.5, "sine", 0.3, 0, 40); },
    level:  () => notes([392, 523, 659, 784], 0.09, "triangle", 0.12, 0.2),
    over:   () => notes([392, 330, 262, 196], 0.18, "triangle", 0.15, 0.35),
    // Bubbly "bloop" — each letter a little higher than the last
    bloop:  (i, delay) => {
      const f = 330 + i * 48;
      tone(f, 0.11, "sine", 0.22, delay, f * 2.6);
      tone(f * 2.2, 0.07, "sine", 0.07, delay + 0.07, f * 3.2);
    },
    ready:  () => notes([784, 988, 1175, 1568], 0.08, "sine", 0.1, 0.25),
    rain:   dur => rainSound(dur),
    toggle() { muted = !muted; store.set("wordRainMuted", muted ? "1" : "0"); return muted; },
    get muted() { return muted; }
  };
})();

// ---------- 6. Game state ----------
let diffKey = store.get("wordRainDifficulty", "normal");
if (!DIFFICULTIES[diffKey]) diffKey = "normal";
let diff = DIFFICULTIES[diffKey];

let words = [];          // { text, el, typedEl, restEl, x, y, width, height, power }
let score, lives, level, cleared, combo, bestCombo;
let keystrokes, mistakes, correctChars, playTime;
let freezeLeft = 0;
let spawnTimer = 0, lastTime = 0, rafId = null;
let running = false, paused = false;
let prevTyped = "";

const bestKey   = () => "wordRainBest_" + diffKey;
const getBest   = () => Number(store.get(bestKey(), 0)) || 0;
const fallSpeed = () => diff.speed + (level - 1) * diff.speedStep;
const spawnGap  = () => Math.max(diff.minSpawn, diff.spawn - (level - 1) * 170);
const multiplier = () => Math.min(5, 1 + Math.floor(combo / 5));

// ---------- 7. Background rain ----------
function makeRain() {
  for (let i = 0; i < 70; i++) {
    const d = document.createElement("div");
    d.className = "drop";
    d.style.left = Math.random() * 100 + "%";
    d.style.animationDuration = 0.6 + Math.random() * 0.8 + "s";
    d.style.animationDelay = -Math.random() * 2 + "s";
    d.style.opacity = 0.3 + Math.random() * 0.7;
    rain.appendChild(d);
  }
}

// ---------- 8. Top bar ----------
function updateHud() {
  scoreEl.textContent = score;
  comboEl.firstChild.textContent = combo;
  $("mult").textContent = "x" + multiplier();
  levelEl.textContent = level;
  livesEl.textContent = "❤".repeat(lives) + "♡".repeat(Math.max(0, diff.lives - lives));
  bestEl.textContent = Math.max(getBest(), score);
}

function bump(el) {
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function showToast(message, color) {
  toast.textContent = message;
  toast.style.color = color || "";
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
}

function restartAnimation(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// ---------- 9. Menu: difficulty ----------
function selectDifficulty(key) {
  diffKey = key;
  diff = DIFFICULTIES[key];
  store.set("wordRainDifficulty", key);
  document.querySelectorAll("#difficulty .chip").forEach(c =>
    c.classList.toggle("active", c.dataset.diff === key));
  const best = getBest();
  $("diffInfo").textContent = diff.info + (best ? ` · Best: ${best}` : "");
  bestEl.textContent = best;
}

document.querySelectorAll("#difficulty .chip").forEach(chip =>
  chip.addEventListener("click", () => { selectDifficulty(chip.dataset.diff); sound.key(); }));

// ---------- 9b. Menu: background scene ----------
let themeKey = store.get("wordRainTheme", "sunset");
if (!SCENES[themeKey]) themeKey = "sunset";

function selectTheme(key) {
  themeKey = key;
  store.set("wordRainTheme", key);
  $("scene").innerHTML = SCENES[key].draw();
  document.querySelectorAll("#themes .chip").forEach(c =>
    c.classList.toggle("active", c.dataset.theme === key));
}

for (const [key, scene] of Object.entries(SCENES)) {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.dataset.theme = key;
  chip.textContent = scene.label;
  chip.addEventListener("click", () => { selectTheme(key); sound.key(); });
  $("themes").appendChild(chip);
}

// ---------- 10. Start / pause / quit ----------
function clearBoard() {
  sky.querySelectorAll(".word, .particle, .float, .splash").forEach(el => el.remove());
  words = [];
}

function startGame() {
  sound.unlock();
  clearBoard();
  score = 0; lives = diff.lives; level = 1; cleared = 0;
  combo = 0; bestCombo = 0;
  keystrokes = 0; mistakes = 0; correctChars = 0; playTime = 0;
  freezeLeft = 0; spawnTimer = 0;
  game.classList.remove("frozen");
  updateHud();

  [startScreen, pauseScreen, overScreen].forEach(s => s.classList.add("hidden"));
  input.disabled = false;
  input.value = "";
  prevTyped = "";
  input.classList.remove("wrong");
  input.focus();

  running = true;
  paused = false;
  lastTime = performance.now();
  spawnWord();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function pauseGame() {
  if (!running || paused) return;
  paused = true;
  pauseScreen.classList.remove("hidden");
  input.blur();
}

function resumeGame() {
  if (!running || !paused) return;
  paused = false;
  pauseScreen.classList.add("hidden");
  lastTime = performance.now();
  input.focus();
}

function goToMenu() {
  running = false;
  paused = false;
  cancelAnimationFrame(rafId);
  clearBoard();
  game.classList.remove("frozen");
  input.disabled = true;
  input.value = "";
  pauseScreen.classList.add("hidden");
  overScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  selectDifficulty(diffKey);
}

// ---------- 11. New falling word ----------
function spawnWord() {
  // Which power-up (if any)?
  let power = null;
  if (cleared >= 3 && Math.random() < POWER_CHANCE) {
    const options = ["bomb", "freeze"];
    if (lives < MAX_LIVES) options.push("heart");
    power = options[Math.floor(Math.random() * options.length)];
  }

  // Pick a word that isn't already on screen
  let pool;
  if (power) {
    pool = POWERUPS[power].words;
  } else {
    const effLevel = level + (diffKey === "hard" ? 2 : 0);
    const maxLen = effLevel <= 2 ? 5 : effLevel <= 4 ? 7 : 99;
    pool = WORDS.filter(w => w.length <= maxLen);
  }
  const choices = pool.filter(w => !words.some(x => x.text === w));
  if (choices.length === 0) return;
  const text = choices[Math.floor(Math.random() * choices.length)];

  // Build the word bubble
  const el = document.createElement("div");
  el.className = "word";
  if (power) {
    el.classList.add("power", POWERUPS[power].cls);
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = POWERUPS[power].icon;
    el.appendChild(icon);
  }
  const typedEl = document.createElement("span");
  typedEl.className = "typed";
  const restEl = document.createElement("span");
  restEl.textContent = text;
  const textWrap = document.createElement("span");
  textWrap.append(typedEl, restEl);
  el.appendChild(textWrap);
  sky.appendChild(el);

  const width = el.offsetWidth, height = el.offsetHeight;
  const maxX = Math.max(10, sky.clientWidth - width - 10);
  const x = 10 + Math.random() * (maxX - 10);
  el.style.left = x + "px";

  const word = { text, el, typedEl, restEl, x, y: -height, width, height, power };
  el.style.transform = `translateY(${word.y}px)`;
  words.push(word);

  // Keep the current highlight correct
  if (prevTyped) highlight(prevTyped);
}

// ---------- 12. Game loop (about 60 times a second) ----------
function loop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (!paused) {
    playTime += dt;

    let slow = 1;
    if (freezeLeft > 0) {
      slow = 0.25;
      freezeLeft -= dt;
      if (freezeLeft <= 0) game.classList.remove("frozen");
    }

    spawnTimer += dt * 1000 * slow;
    if (spawnTimer >= spawnGap()) {
      spawnTimer = 0;
      spawnWord();
    }

    const groundY = sky.clientHeight;
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      w.y += fallSpeed() * dt * slow;
      w.el.style.transform = `translateY(${w.y}px)`;
      w.el.classList.toggle("danger", w.y + w.height > groundY * 0.75);
      if (w.y + w.height >= groundY) {
        missWord(i);
        if (!running) return;
      }
    }
  }

  rafId = requestAnimationFrame(loop);
}

// ---------- 13. Typing ----------
input.addEventListener("input", () => {
  if (!running || paused) return;
  const typed = input.value.trim().toLowerCase();
  const grew = typed.length > prevTyped.length;
  prevTyped = typed;

  const hit = words.findIndex(w => w.text === typed);
  if (hit !== -1) {
    keystrokes++;
    clearWord(hit);
    return;
  }

  const target = highlight(typed);
  if (grew) {
    keystrokes++;
    if (target) {
      sound.key();
    } else {
      mistakes++;
      sound.error();
    }
  }
});

// Light up the word you're typing (the lowest one that matches)
function highlight(typed) {
  let target = null;
  for (const w of words) {
    w.el.classList.remove("target");
    w.typedEl.textContent = "";
    w.restEl.textContent = w.text;
    if (typed && w.text.startsWith(typed) && (!target || w.y > target.y)) target = w;
  }
  if (target) {
    target.el.classList.add("target");
    target.typedEl.textContent = target.text.slice(0, typed.length);
    target.restEl.textContent = target.text.slice(typed.length);
  }
  input.classList.toggle("wrong", typed.length > 0 && !target);
  return target;
}

// ---------- 14. Effects ----------
function burst(w, color) {
  const cx = w.x + w.width / 2, cy = w.y + w.height / 2;
  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 70;
    p.style.left = cx + "px";
    p.style.top = cy + "px";
    p.style.background = color;
    p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
    sky.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
}

function floatText(w, text) {
  const f = document.createElement("div");
  f.className = "float";
  f.textContent = text;
  f.style.left = w.x + w.width / 2 - 15 + "px";
  f.style.top = w.y + "px";
  sky.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

const POWER_COLORS = { bomb: "#ff9f43", freeze: "#7fd3ff", heart: "#ff6b9d" };

// ---------- 15. Word cleared ----------
function clearWord(index, byBomb = false) {
  const w = words.splice(index, 1)[0];

  combo++;
  bestCombo = Math.max(bestCombo, combo);
  const mult = multiplier();
  const points = w.text.length * 10 * mult;
  score += points;
  correctChars += w.text.length;
  cleared++;

  burst(w, w.power ? POWER_COLORS[w.power] : "#ffd166");
  floatText(w, `+${points}`);
  w.el.style.setProperty("--pos", `translateY(${w.y}px)`);
  w.el.classList.remove("target", "danger");
  w.el.classList.add("pop");
  setTimeout(() => w.el.remove(), 350);

  bump(scoreEl);
  if (combo % 5 === 0) bump(comboEl);

  if (!byBomb) {
    input.value = "";
    prevTyped = "";
    highlight("");
    sound.clear(combo);
    if (w.power) usePower(w.power);
  }

  if (cleared % WORDS_PER_LEVEL === 0) {
    level++;
    showToast(`Level ${level}`);
    sound.level();
  } else if (!byBomb && !w.power && combo % 5 === 0 && combo <= 20) {
    showToast(`Combo x${mult}!`);
  }

  updateHud();
}

// ---------- 16. Power-ups ----------
function usePower(type) {
  if (type === "bomb") {
    sound.boom();
    restartAnimation(flash, "show");
    restartAnimation(game, "shake");
    for (let i = words.length - 1; i >= 0; i--) clearWord(i, true);
    showToast("💣 BOOM!", "#ff9f43");
  } else if (type === "freeze") {
    sound.power();
    freezeLeft = FREEZE_SECONDS;
    game.classList.add("frozen");
    showToast("❄️ Freeze!", "#7fd3ff");
  } else if (type === "heart") {
    sound.power();
    lives = Math.min(MAX_LIVES, lives + 1);
    bump(livesEl);
    showToast("❤️ +1 life", "#ff6b9d");
  }
}

// ---------- 17. Word hit the ground ----------
function missWord(index) {
  const w = words.splice(index, 1)[0];
  w.el.remove();

  const s = document.createElement("div");
  s.className = "splash";
  s.style.left = w.x + "px";
  sky.appendChild(s);
  setTimeout(() => s.remove(), 600);

  combo = 0;

  // Missing a power-up doesn't cost a life — you just lose the bonus
  if (!w.power) {
    lives--;
    sound.miss();
    restartAnimation(game, "shake");
    bump(livesEl);
  }

  updateHud();
  highlight(prevTyped);

  if (lives <= 0) endGame();
}

// ---------- 18. Game over ----------
function endGame() {
  running = false;
  cancelAnimationFrame(rafId);
  input.disabled = true;
  input.blur();
  game.classList.remove("frozen");
  sound.over();

  const isNewBest = score > getBest();
  if (isNewBest) store.set(bestKey(), score);

  const accuracy = keystrokes ? Math.round((1 - mistakes / keystrokes) * 100) : 100;
  const wpm = playTime > 0 ? Math.round((correctChars / 5) / (playTime / 60)) : 0;

  $("finalScore").textContent = score;
  $("newBest").classList.toggle("hidden", !isNewBest);
  $("rWords").textContent = cleared;
  $("rAcc").textContent = accuracy + "%";
  $("rWpm").textContent = wpm;
  $("rCombo").textContent = bestCombo;
  $("rLevel").textContent = level;
  $("rDiff").textContent = diff.label;
  updateHud();

  setTimeout(() => overScreen.classList.remove("hidden"), 400);
}

// ---------- 19. Buttons and keys ----------
$("startBtn").addEventListener("click", startGame);
$("restartBtn").addEventListener("click", startGame);
$("resumeBtn").addEventListener("click", resumeGame);
$("quitBtn").addEventListener("click", goToMenu);
$("menuBtn").addEventListener("click", goToMenu);

pauseBtn.addEventListener("click", e => {
  e.stopPropagation();
  paused ? resumeGame() : pauseGame();
});

muteBtn.addEventListener("click", e => {
  e.stopPropagation();
  muteBtn.textContent = sound.toggle() ? "🔇" : "🔊";
  if (running && !paused) input.focus();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (running) paused ? resumeGame() : pauseGame();
  } else if (e.key === "Enter") {
    if (!running && overScreen.classList.contains("hidden") === false) startGame();
    else if (!running && !startScreen.classList.contains("hidden")) startGame();
    else if (paused) resumeGame();
  }
});

// Auto-pause if you switch tabs
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseGame();
});

// Clicking anywhere in the game puts the cursor back in the box
game.addEventListener("click", () => {
  if (running && !paused) input.focus();
});

// ---------- 20. Logo ----------
function buildLogo(el, mode) {
  el.textContent = "";
  el.classList.add(mode);
  let i = 0;
  for (const [text, cls] of [["WORD", "part-word"], ["RAIN", "part-rain"]]) {
    const part = document.createElement("span");
    part.className = "logo-part " + cls;
    for (const ch of text) {
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.textContent = ch;
      letter.style.setProperty("--i", i++);
      part.appendChild(letter);
    }
    el.appendChild(part);
  }
  const drip = document.createElement("span");
  drip.className = "drip";
  el.appendChild(drip);
}

// ---------- 21. Loading screen (about 5 seconds) ----------
const LOAD_TIME = 5000;
const LOAD_STEPS = [
  "Gathering clouds…",
  "Warming up the keyboard…",
  "Mixing raindrops…",
  "Polishing power-ups…",
  "Almost there…"
];
let waitingToEnter = false;
let atGate = true;

// First tap: unlocks sound, then the intro starts
function beginIntro() {
  if (!atGate) return;
  atGate = false;
  sound.unlock();
  $("gate").classList.add("hidden");
  $("loadBits").classList.remove("hidden");
  runLoader();
}

function runLoader() {
  buildLogo($("loaderLogo"), "dropping");

  // A bloop as each letter lands (matches the CSS timing: delay i*0.2s + 0.3s, lands ~0.45s later)
  for (let i = 0; i < 8; i++) sound.bloop(i, i * 0.2 + 0.3 + 0.45);
  sound.rain(LOAD_TIME / 1000 + 0.8);

  const fill = $("loadFill"), text = $("loadText"), pct = $("loadPct");
  const begin = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - begin) / LOAD_TIME);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    fill.style.width = eased * 100 + "%";
    pct.textContent = Math.round(eased * 100) + "%";
    text.textContent = LOAD_STEPS[Math.min(LOAD_STEPS.length - 1, Math.floor(t * LOAD_STEPS.length))];
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      text.textContent = "Ready!";
      sound.ready();
      $("pressKey").classList.remove("hidden");
      waitingToEnter = true;
    }
  }
  requestAnimationFrame(tick);
}

function enterMenu() {
  if (!waitingToEnter) return;
  waitingToEnter = false;
  sound.unlock();
  sound.level();
  const loader = $("loader");
  loader.classList.add("fade-out");
  startScreen.classList.remove("hidden");
  setTimeout(() => loader.classList.add("hidden"), 600);
}

document.addEventListener("keydown", e => {
  if (atGate) { e.stopImmediatePropagation(); e.preventDefault(); beginIntro(); }
  else if (waitingToEnter) { e.stopImmediatePropagation(); e.preventDefault(); enterMenu(); }
}, true);
document.addEventListener("pointerdown", () => {
  if (atGate) beginIntro();
  else enterMenu();
});

// ---------- Go! ----------
makeRain();
selectTheme(themeKey);
buildLogo($("menuLogo"), "idle");
muteBtn.textContent = sound.muted ? "🔇" : "🔊";
score = 0; lives = diff.lives; level = 1; combo = 0;
selectDifficulty(diffKey);
updateHud();
