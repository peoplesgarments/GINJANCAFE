/* =========================================================
   GINJAN · order by mood
   Shared app: the phone UI, the glass illustration, the ticket.
   Each prototype plugs in a different language "engine".
   ========================================================= */

// ---------- moods: what each feeling tends to call for (from my Ginjan menu) ----------
const MOODS = {
  tired: {
    label: "tired", chip: "tired",
    keywords: ["storm grey","grey","tired","exhausted","sleepy","sleep","awake","energy","drained","five","shift","long day","wake"],
    recipe: { ginger: 5, sugar: 2, addins: [] }, menu: "just ginger, extra strong",
    copy: ["sharp enough to wake you up", "loud, hot, and awake", "a second wind in a glass", "for the ones who were up before the sun"],
  },
  homesick: {
    label: "homesick", chip: "homesick",
    keywords: ["warm amber","bone white","amber","home","homesick","miss","mom","mother","family","kitchen","back home","childhood"],
    recipe: { ginger: 3, sugar: 2, addins: ["pineapple","mint","lemon"] }, menu: "the o.g. (mom's recipe)",
    copy: ["tastes like somebody's mother made it", "balanced, refreshing, a bit of spice", "the one from home", "a sunday kitchen in a glass"],
  },
  celebrating: {
    label: "celebrating", chip: "celebrating",
    keywords: ["bright orange","orange","celebrate","celebrating","birthday","job","party","news","engaged","won","finished","excited","yay"],
    recipe: { ginger: 3, sugar: 2, addins: ["pineapple","lemon","sparkling"] }, menu: "the fizzy one",
    copy: ["spicy, tropical, citrus, fizzy", "a toast with a little burn", "bright, loud, and bubbly", "for good news only"],
  },
  heartbroken: {
    label: "heartbroken", chip: "heartbroken",
    keywords: ["night blue","blue","sad","heartbroken","broke","breakup","lonely","cry","miss him","miss her","didn't call","hurt","down"],
    recipe: { ginger: 2, sugar: 4, addins: ["mango","guava"] }, menu: "ginger + mango + guava",
    copy: ["soft, tropical, and sweet", "gentle on the burn", "sweet enough to forget today", "a soft landing"],
  },
  stressed: {
    label: "stressed", chip: "stressed",
    keywords: ["black","stress","stressed","deadline","busy","anxious","overwhelmed","loud","too much","breathe","work"],
    recipe: { ginger: 2, sugar: 2, addins: ["mint","lemon"] }, menu: "off-menu: mint + lemon, easy on the ginger",
    copy: ["cool, calm, and fresh", "a minute to breathe", "mint first, ginger later", "quiet in a glass"],
  },
  inlove: {
    label: "in love", chip: "in love",
    keywords: ["blush pink","hibiscus red","love","crush","date","romantic","smiling","butterflies","pink","met someone"],
    recipe: { ginger: 3, sugar: 3, addins: ["hibiscus"] }, menu: "ginger + hibiscus",
    copy: ["deep, floral, a little dramatic", "pink and a little nervous", "like a first date", "warm and a little tart"],
  },
  sunny: {
    label: "sunny", chip: "sunny",
    keywords: ["corn yellow","yellow","sun","sunny","happy","good mood","warm","bright","great day","nice day","morning"],
    recipe: { ginger: 3, sugar: 2, addins: ["orange"] }, menu: "ginger + orange",
    copy: ["bright and sunny", "breakfast in the sun", "golden and happy", "citrus with a little heat"],
  },
  sick: {
    label: "under the weather", chip: "under the weather",
    keywords: ["mint green","sick","cold","flu","throat","stuffy","under the weather","cough","heal","fever"],
    recipe: { ginger: 5, sugar: 3, addins: ["lemon"] }, menu: "just ginger + lemon, extra sharp",
    copy: ["sharp, warming, and healing", "what mom gave you when you were sick", "clears your head", "lemon and a lot of ginger"],
  },
};

function detectMood(text){
  const t = " " + text.toLowerCase() + " ";
  let best = null, bestHits = 0;
  for (const [key, m] of Object.entries(MOODS)){
    const hits = m.keywords.filter(k => t.includes(k)).length;
    if (hits > bestHits){ best = key; bestHits = hits; }
  }
  return best;
}

// ---------- add-ins (original flat icons) ----------
const ADDINS = {
  pineapple: { name: "pineapple", color: "#EBC43F", weight: 1,
    icon: `<polygon points="25,4 21,16 29,16" fill="#6E8B3D"/><polygon points="18,8 22,17 27,15" fill="#7FA650"/><polygon points="32,8 28,17 23,15" fill="#7FA650"/><ellipse cx="25" cy="31" rx="11" ry="15" fill="#EBC43F"/><path d="M16 24 L34 40 M16 32 L28 44 M20 18 L34 32 M34 24 L16 40 M34 32 L22 44 M30 18 L16 32" stroke="#B8892A" stroke-width="1.4"/>` },
  mint: { name: "mint", color: "#9CCB6A", weight: .5,
    icon: `<ellipse cx="18" cy="26" rx="9" ry="17" transform="rotate(-25 18 26)" fill="#5E9B4A"/><ellipse cx="32" cy="26" rx="9" ry="17" transform="rotate(25 32 26)" fill="#7FB35E"/><path d="M14 14 Q19 26 23 40 M36 14 Q31 26 27 40" stroke="#F3F2EC" stroke-width="1.3" fill="none"/>` },
  lemon: { name: "lemon", color: "#F2E14C", weight: .7,
    icon: `<circle cx="25" cy="25" r="18" fill="#F2E14C"/><circle cx="25" cy="25" r="13" fill="#F7EE98"/><path d="M25 12 V38 M12 25 H38 M16 16 L34 34 M34 16 L16 34" stroke="#F2E14C" stroke-width="1.6"/>` },
  sparkling: { name: "sparkling", color: null, weight: 0,
    icon: `<circle cx="17" cy="33" r="8" fill="none" stroke="#3D6E9C" stroke-width="3"/><circle cx="32" cy="22" r="6" fill="none" stroke="#3D6E9C" stroke-width="3"/><circle cx="22" cy="12" r="4" fill="#3D6E9C"/><circle cx="36" cy="38" r="3.5" fill="#3D6E9C"/>` },
  orange: { name: "orange", color: "#E9822A", weight: 2,
    icon: `<circle cx="25" cy="25" r="18" fill="#E9822A"/><circle cx="25" cy="25" r="13" fill="#F4A65A"/><path d="M25 12 V38 M12 25 H38 M16 16 L34 34 M34 16 L16 34" stroke="#E9822A" stroke-width="1.6"/>` },
  hibiscus: { name: "hibiscus", color: "#D8345A", weight: 2.4,
    icon: `<g fill="#B41A27"><circle cx="25" cy="12" r="9"/><circle cx="37" cy="21" r="9"/><circle cx="33" cy="36" r="9"/><circle cx="17" cy="36" r="9"/><circle cx="13" cy="21" r="9"/></g><circle cx="25" cy="25" r="5" fill="#F2C14E"/>` },
  mango: { name: "mango", color: "#F2A33A", weight: 2,
    icon: `<path d="M25 8 C40 10 42 34 30 42 C20 48 8 38 12 24 C14 15 19 8 25 8 Z" fill="#F2A33A"/><ellipse cx="32" cy="9" rx="8" ry="3.5" transform="rotate(-20 32 9)" fill="#6E8B3D"/>` },
  guava: { name: "guava", color: "#EF8F8F", weight: 1.5,
    icon: `<circle cx="25" cy="25" r="18" fill="#7FA650"/><circle cx="25" cy="25" r="14" fill="#EF8F8F"/><g fill="#F3F2EC"><circle cx="21" cy="22" r="1.6"/><circle cx="28" cy="21" r="1.6"/><circle cx="25" cy="28" r="1.6"/><circle cx="20" cy="29" r="1.6"/><circle cx="30" cy="29" r="1.6"/></g>` },
};
const ADDIN_KEYS = Object.keys(ADDINS);

// ---------- the glass illustration ----------
function hexToRgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function mix(colors){ // [[hex, weight]]
  let r = 0, g = 0, b = 0, w = 0;
  for (const [hex, wt] of colors){ const [R, G, B] = hexToRgb(hex); r += R * wt; g += G * wt; b += B * wt; w += wt; }
  return `rgb(${Math.round(r / w)},${Math.round(g / w)},${Math.round(b / w)})`;
}
function seeded(i){ const x = Math.sin(i * 999.7) * 10000; return x - Math.floor(x); }

function liquidColor(r){
  const gingerShades = ["#F4EDC4","#EFE3A6","#E8D57E","#DEC25A","#D2AE3E"];
  const parts = [[gingerShades[r.ginger - 1], 2.2]];
  for (const a of r.addins){ const A = ADDINS[a]; if (A && A.color) parts.push([A.color, A.weight]); }
  return mix(parts);
}

// ---------- extra station icons ----------
const ICON_GINGER = `<g fill="#E3BE72" stroke="#A97B22" stroke-width="2"><ellipse cx="18" cy="28" rx="11" ry="8" transform="rotate(-20 18 28)"/><ellipse cx="32" cy="24" rx="10" ry="7" transform="rotate(25 32 24)"/><ellipse cx="27" cy="36" rx="8" ry="6"/><ellipse cx="37" cy="14" rx="5" ry="7" transform="rotate(30 37 14)"/></g>`;
const ICON_SUGAR = `<g fill="#fff" stroke="#1E1E1E" stroke-width="2"><rect x="8" y="24" width="15" height="15" rx="2"/><rect x="26" y="24" width="15" height="15" rx="2"/><rect x="17" y="8" width="15" height="15" rx="2"/></g>`;

// ---------- colors ----------
function drinkColor(r){
  if (r.ginger === 0 && !r.addins.some(a => ADDINS[a].color)) return "#E9EFEC";   // just water
  return liquidColor({ ...r, ginger: Math.max(1, r.ginger) });
}
function capColor(r){
  const a = r.addins;
  if (a.includes("hibiscus")) return ["#562528", "#9C7389"];
  if (a.includes("sparkling")) return ["#1E1E1E", "#F3F2EC"];
  if (a.includes("orange")) return ["#B41A27", "#1E1E1E"];
  if (a.includes("mango") || a.includes("guava")) return ["#855572", "#E2DA8A"];
  return ["#CCC54A", "#E2DA8A"];
}
const maskCSS = url => `-webkit-mask-image:url(${url});mask-image:url(${url});-webkit-mask-size:100% 100%;mask-size:100% 100%;`;

// ---------- what each thing looks like once it's inside the bottle (SVG coords 395 x 772) ----------
function itemSVG(it){
  const { x, y, rot } = it;
  switch (it.type){
    case "ginger": return [0,1,2].map(i => `<line x1="${x + i * 14 - 14}" y1="${y + i * 9}" x2="${x + i * 14}" y2="${y + i * 9}" transform="rotate(${rot + i * 40} ${x} ${y})" stroke="#A97B22" stroke-width="4" stroke-linecap="round" opacity=".6"/>`).join("") +
      `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(${rot} ${x} ${y})" fill="#E3BE72" stroke="#A97B22" stroke-width="3"/>`;
    case "sugar": return [0,1,2,3,4].map(i => `<circle cx="${x + (i - 2) * 16}" cy="${y + (i % 2) * 10}" r="3.5" fill="#fff"/>`).join("");
    case "pineapple": return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-15" y="-15" width="30" height="30" rx="4" fill="#EBC43F" stroke="#B8892A" stroke-width="3"/><path d="M-15 0 H15 M0 -15 V15" stroke="#B8892A" stroke-width="2"/></g>`;
    case "mango": return `<rect x="${x - 14}" y="${y - 14}" width="28" height="28" rx="5" fill="#F2A33A" stroke="#C97A1E" stroke-width="3" transform="rotate(${rot} ${x} ${y})"/>`;
    case "guava": return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-30 0 A30 30 0 0 1 30 0 Z" fill="#EF8F8F" stroke="#7FA650" stroke-width="6"/><circle cx="-10" cy="-9" r="3" fill="#fff"/><circle cx="4" cy="-14" r="3" fill="#fff"/><circle cx="14" cy="-7" r="3" fill="#fff"/></g>`;
    case "mint": return `<ellipse cx="${x}" cy="${y}" rx="13" ry="28" transform="rotate(${rot} ${x} ${y})" fill="#5E9B4A"/><line x1="${x}" y1="${y - 24}" x2="${x}" y2="${y + 24}" transform="rotate(${rot} ${x} ${y})" stroke="#9CCB6A" stroke-width="2"/>`;
    case "hibiscus": return `<g transform="translate(${x} ${y}) rotate(${rot})"><g fill="#B41A27"><circle cx="0" cy="-16" r="14"/><circle cx="16" cy="-4" r="14"/><circle cx="10" cy="15" r="14"/><circle cx="-10" cy="15" r="14"/><circle cx="-16" cy="-4" r="14"/></g><circle r="7" fill="#F2C14E"/></g>`;
    case "lemon": case "orange": {
      const [c1, c2] = it.type === "lemon" ? ["#F2E14C", "#F7EE98"] : ["#E9822A", "#F4A65A"];
      return `<g transform="translate(${x} ${y}) rotate(${rot})"><circle r="30" fill="${c1}"/><circle r="23" fill="${c2}"/><path d="M0 -23 V23 M-23 0 H23 M-16 -16 L16 16 M16 -16 L-16 16" stroke="${c1}" stroke-width="3"/></g>`; }
    case "sparkling": return [0,1,2,3,4,5].map(i => `<circle cx="${x + (i % 3) * 30 - 30}" cy="${y + Math.floor(i / 3) * 40}" r="${5 + (i % 3) * 2}" fill="none" stroke="#fff" stroke-width="3" class="bubble" style="animation-delay:${(i * .37).toFixed(2)}s"/>`).join("");
  }
  return "";
}

// ---------- grainy gradient (the drink as a color field) ----------
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`;
const BLOB_SPOTS = [[22, 78], [78, 62], [35, 40], [70, 88], [50, 20], [15, 55], [85, 30], [55, 70]];
function drinkBG(r){
  const gingerShades = ["#F4EDC4","#EFE3A6","#E8D57E","#DEC25A","#D2AE3E"];
  const g = r.ginger ? gingerShades[r.ginger - 1] : "#E9EFEC";
  const g2 = r.ginger ? gingerShades[Math.min(4, r.ginger)] : "#DDE6E3";
  const layers = [];
  if (r.sugar) layers.push(`linear-gradient(to top, rgba(255,255,255,0) 35%, rgba(255,255,255,${(r.sugar * .07).toFixed(2)}) 100%)`);
  r.addins.forEach((a, i) => { const c = ADDINS[a].color; if (!c) return; const [x, y] = BLOB_SPOTS[(ADDIN_KEYS.indexOf(a) + i) % BLOB_SPOTS.length];
    layers.push(`radial-gradient(circle at ${x}% ${y}%, ${c} 0%, ${c}00 58%)`); });
  layers.push(`linear-gradient(to top, ${g2}, ${g})`);
  return layers.join(",");
}

// ---------- the bottle (my Ginjan bottle drawing, filled in) ----------
// level: 0..1 how full · items: things inside · capped / labeled: end state
function bottleHTML(o){
  const { r, items = [], level = 1, capped = true, labeled = true, name = "", w = 180, id = "" } = o;
  const [W, H] = ASSETS.bottleSize, [cap, gcol] = capColor(r);
  const pct = 12 + level * 77;   // inside of the bottle runs from 12% to 89% of its height
  return `<div class="bottle" ${id ? `id="${id}"` : ""} style="width:${w}px;aspect-ratio:${W}/${H}">
    <div class="b-shadow"></div>
    <div class="b-layer" style="background:#EDF1EE;${maskCSS(ASSETS.bottleGlass)}"></div>
    <div class="b-layer" style="${maskCSS(ASSETS.bottleLiquid)}">
      <div class="b-fill" style="height:${pct}%;background:${drinkBG(r)}"><div class="grain"></div></div>
    </div>
    <svg class="b-layer" viewBox="0 0 ${W} ${H}" style="${maskCSS(ASSETS.bottleLiquid)}">${items.map(itemSVG).join("")}</svg>
    <svg class="b-layer" viewBox="0 0 ${W} ${H}" style="${maskCSS(ASSETS.bottleGlass)}">
      <path d="M300 300 Q345 470 330 640 L395 640 L395 300 Z" fill="#1E1E1E" opacity=".10"/>
      <rect x="72" y="300" width="20" height="230" rx="10" fill="#fff" opacity=".75" transform="rotate(-8 82 415)"/>
      <rect x="64" y="555" width="14" height="40" rx="7" fill="#fff" opacity=".6"/>
      <rect x="150" y="95" width="10" height="70" rx="5" fill="#fff" opacity=".6"/>
    </svg>
    <img class="b-layer b-lines" src="${ASSETS.bottleLines}" alt="">
    <div class="b-label ${labeled ? "on" : ""}" style="top:${(540 / H) * 100}%">
      <img src="${ASSETS.wordmark}" class="b-mark" alt="GINJAN">
    </div>
  </div>`;
}

// ---------- ticket icons (like an order ticket in Papa's games) ----------
function ticketRows(r, made){
  const rows = [];
  rows.push({ key: "ginger", icon: ICON_GINGER, label: "ginger", want: r.ginger, have: made?.ginger });
  rows.push({ key: "sugar", icon: ICON_SUGAR, label: "sugar", want: r.sugar, have: made?.sugar });
  for (const a of r.addins) rows.push({ key: a, icon: ADDINS[a].icon, label: ADDINS[a].name, want: 1, have: made ? (made.addins.includes(a) ? 1 : 0) : undefined });
  return rows;
}

// ---------- GINJAN: order by sharing your mood ----------
const PRODUCTS = {
  ginger:    { name: "ginger root", price: 1.50, icon: () => ICON_GINGER },
  sugar:     { name: "cane sugar", price: 0.25, icon: () => ICON_SUGAR },
  pineapple: { name: "pineapple", price: 1.20 }, mint: { name: "mint", price: 0.80 }, lemon: { name: "lemon", price: 0.60 },
  sparkling: { name: "sparkling water", price: 1.00 }, orange: { name: "orange", price: 0.90 }, hibiscus: { name: "hibiscus", price: 1.40 },
  mango: { name: "mango", price: 1.60 }, guava: { name: "guava", price: 1.80 },
};
const BASE_PRICE = 4.00;
const ALL_KEYS = ["ginger", "sugar", ...ADDIN_KEYS];
const iconOf = k => PRODUCTS[k].icon ? PRODUCTS[k].icon() : ADDINS[k].icon;
const money = n => "$" + n.toFixed(2);

// describe your day in colors: each color is a family of feelings, and a drink it calls for
const DAY_COLORS = {
  red:    { swatch: "#B41A27", label: "red", means: "upset, frustrated, a rough day", mood: "stressed",
            recipe: { ginger: 2, sugar: 2, addins: ["mint", "lemon"] } },
  bright: { swatch: "linear-gradient(135deg,#F2D54A 0%,#E9822A 50%,#EFA3B5 100%)", tint: "#EDB04A", label: "yellow · orange · pink", means: "happy, bubbly, goofy, a good day", mood: "sunny",
            recipe: { ginger: 3, sugar: 2, addins: ["pineapple", "orange", "sparkling"] } },
  blue:   { swatch: "#4F6FA8", label: "blue", means: "mellow, calm, nostalgic, homesick", mood: "homesick",
            recipe: { ginger: 3, sugar: 2, addins: ["pineapple", "mint", "lemon"] } },
  black:  { swatch: "#1E1E1E", label: "black", means: "sad, need a pick-me-up", mood: "heartbroken",
            recipe: { ginger: 4, sugar: 3, addins: ["mango", "sparkling"] } },
};
const tintOf = k => DAY_COLORS[k].tint ?? DAY_COLORS[k].swatch;

// short notes from the barista when Qwen isn't connected
const DAY_NOTES = {
  red: "Rough day. Hope this cools it down a little.",
  bright: "Hope the good mood sticks around.",
  blue: "Something that tastes like home, for a mellow day.",
  black: "Hope this lifts you, even a little.",
};

// a soft color swatch for a recipe (menu thumbnails)
function gradientBG(r){
  const blobs = [];
  const gold = r.ginger ? ["#F4EDC4","#EFE3A6","#E8D57E","#DEC25A","#D2AE3E"][r.ginger - 1] : "#E6ECE9";
  blobs.push(`radial-gradient(ellipse at 50% 85%, ${gold} 0%, ${gold}00 70%)`);
  r.addins.forEach((a, i) => { const c = ADDINS[a].color || "#BFD3E6"; const [x, y] = BLOB_SPOTS[(ADDIN_KEYS.indexOf(a) + i) % BLOB_SPOTS.length];
    blobs.push(`radial-gradient(ellipse at ${x}% ${y}%, ${c} 0%, ${c}00 62%)`); });
  return blobs.join(",") + ",#EFEEEA";
}

// my menu (from the Ginjan packaging deck)
const MENU = [
  { name: "the o.g.", sub: "mom's recipe", tag: "Top 1", r: { ginger: 3, sugar: 2, addins: ["pineapple", "mint", "lemon"] } },
  { name: "just ginger", sub: "sharp, warming, sweet", tag: "Best!", r: { ginger: 4, sugar: 3, addins: [] } },
  { name: "the fizzy one", sub: "spicy, tropical, fizzy", tag: "Hot!", r: { ginger: 3, sugar: 2, addins: ["pineapple", "lemon", "mint", "sparkling"] } },
  { name: "ginger + hibiscus", sub: "deep, floral", tag: "New!", r: { ginger: 3, sugar: 3, addins: ["hibiscus"] } },
  { name: "ginger + orange", sub: "bright", tag: "New!", r: { ginger: 3, sugar: 2, addins: ["orange"] } },
  { name: "mango + guava", sub: "soft, tropical", tag: "New!", r: { ginger: 2, sugar: 3, addins: ["mango", "guava"] } },
];
const LAYER_COLORS = { ginger: "#E3BE72", sugar: "#F3F2EC", pineapple: "#EBC43F", mint: "#9CCB6A", lemon: "#F2E14C", sparkling: "#BFD3E6", orange: "#E9822A", hibiscus: "#C2264B", mango: "#F2A33A", guava: "#EF8F8F" };
const copyR = r => ({ ginger: r.ginger, sugar: r.sugar, addins: [...r.addins] });

// your shelf: every drink you order is kept
function shelfLoad(){ try { return JSON.parse(localStorage.getItem("ginjan-shelf") || "[]"); } catch { return []; } }
function shelfSave(list){ try { localStorage.setItem("ginjan-shelf", JSON.stringify(list.slice(-8))); } catch {} }
const barcode = () => `<span class="bc">${Array.from({ length: 22 }, (_, i) => `<i style="width:${1 + (i * 7 % 3)}px"></i>`).join("")}</span>`;

const Stand = {
  logs: [],
  log(kind, input, output){
    this.logs.unshift(`— ${new Date().toLocaleTimeString()} · ${kind} —\nIN: ${input}\nOUT: ${output}\n`);
    const el = document.getElementById("log"); if (el) el.textContent = this.logs.join("\n");
  },

  init(engine){
    this.engine = engine;
    this.day = {};
    this.cart = { ginger: 0, sugar: 0, addins: [] };
    this.items = [];
    document.documentElement.style.setProperty("--grain", GRAIN);
    document.getElementById("app").innerHTML = `
      <div class="viewswitch"><button data-view="desktop" class="on">desktop</button><button data-view="app">app</button></div>
      <div class="store" id="store">
        <div class="top2"><img src="${ASSETS.wordmark}" class="logo" alt="GINJAN"><div class="top2-r"><button class="link" data-go="s0">store</button><a data-open="about" class="link">about the machine</a></div></div>

        <!-- 0 · the storefront -->
        <section class="scr show" id="s0">
          <div class="front-head">
            <div><div class="eyebrow">GINJAN café · ginger juice</div><h1 class="big">What are you having?</h1></div>
            <button class="cta mood-cta" data-go="s1">order by mood →</button>
          </div>
          <div class="wall">
            <div class="shelf-title">The menu</div>
            <div class="shelf" id="menuShelf"></div>
            <div class="shelf-title">Your shelf</div>
            <div class="shelf" id="myShelf"></div>
          </div>
        </section>

        <!-- 1 · order by mood -->
        <section class="scr" id="s1">
          <div class="mood">
            <div class="eyebrow">Order by mood</div>
            <h1 class="big">How was your day?</h1>
            <textarea id="q" rows="2" placeholder="a few words, or a few lines…"></textarea>
            <div class="sub">Describe it in colors. Tap more than once to make that part bigger.</div>
            <div class="colors">${Object.entries(DAY_COLORS).map(([k, c]) => `
              <button class="cbtn" data-c="${k}"><span class="dot" style="background:${c.swatch}"></span><span><b>${c.label}</b><em>${c.means}</em></span><span class="n" id="n-${k}"></span></button>`).join("")}</div>
            <div class="strip" id="strip"><span class="empty">your day in colors</span></div>
            <div class="row"><button class="ghost" id="clearDay">clear</button><button class="cta" id="read">make me a drink</button></div>
          </div>
        </section>

        <!-- 2 · customize: menu · catalogue · your cart -->
        <section class="scr" id="s2">
          <div class="shop3">
            <nav class="menu3">
              <div class="eyebrow">Menu</div>
              ${MENU.map((d, i) => `<button class="menu-item" data-menu2="${i}"><span class="mi-sw" style="background:${gradientBG(d.r)}"></span><span><b>${d.name}</b><br><em>${d.sub}</em></span></button>`).join("")}
            </nav>
            <main class="cat3">
              <div class="eyebrow" id="readout"></div>
              <h1 class="big" id="dname">your ginjan</h1>
              <p class="why" id="why"></p>
              <div class="catalogue">${ALL_KEYS.map(k => `
                <div class="prod" data-k="${k}">
                  <div class="prod-img"><svg viewBox="0 0 50 50">${iconOf(k)}</svg></div>
                  <div class="prod-name">${PRODUCTS[k].name}</div><div class="prod-price">${money(PRODUCTS[k].price)}</div>
                  <div class="prod-qty" id="pn-${k}"></div>
                  <div class="prod-btns"><button class="minus" data-dec="${k}">−</button><button class="plus" data-inc="${k}">+ add</button></div>
                </div>`).join("")}</div>
            </main>
            <aside class="cart3">
              <div class="cart-top"><div class="h2">your bottle <span id="count">(0)</span></div><div class="total" id="total"></div></div>
              <div class="cartchart" id="cartchart"></div>
              <div class="row"><button class="ghost" data-go="s0">back</button><button class="cta" id="make">send to barista</button></div>
            </aside>
          </div>
        </section>

        <!-- 3 · on your shelf -->
        <section class="scr" id="s3">
          <div class="front-head"><div><div class="eyebrow">Your order is ready</div><h1 class="big" id="doneName">It's on your shelf.</h1><p class="note" id="bnote"></p><div class="note-from">— a note from your barista</div></div><button class="cta mood-cta" data-go="s0">back to the store</button></div>
          <div class="wall"><div class="shelf-title">Your shelf</div><div class="shelf" id="myShelf2"></div></div>
        </section>
      </div>

      <div class="making" id="making"></div>
      <div class="modal" id="aboutModal"><div class="about">
        <button class="x" data-close>×</button>
        <img src="${ASSETS.wordmark}" style="width:120px" alt="GINJAN">
        <div class="tag">${engine.tag}</div>
        <div class="title">${engine.title}</div>
        <p>${engine.how}</p>
        ${engine.extraPanel ? engine.extraPanel() : ""}
        <details><summary>${engine.sourceTitle}</summary><pre>${engine.source()}</pre></details>
        <details open><summary>outputs log</summary><pre id="log">nothing yet</pre></details>
      </div></div>`;
    this.bind();
    this.drawShelves();
    if (engine.onReady) engine.onReady();
    this.intro();
  },

  go(id){ document.querySelectorAll(".scr").forEach(s => s.classList.toggle("show", s.id === id)); if (id === "s0") this.drawShelves(); },

  intro(){
    const el = document.createElement("div");
    el.className = "intro";
    el.innerHTML = `<div class="i-type" id="iType"></div><div class="i-cta"><button class="openbtn" id="openShop">ORDER</button></div>`;
    document.body.appendChild(el);
    const box = el.querySelector("#iType"); let stop = false;
    (async () => {
      while (!stop && box.scrollHeight <= el.clientHeight + 40){
        for (const ch of "GINJAN "){ if (stop) break; box.textContent += ch; await new Promise(r => setTimeout(r, 14)); }
      }
      el.classList.add("full");
    })();
    el.querySelector("#openShop").onclick = () => { stop = true; el.classList.add("out"); setTimeout(() => el.remove(), 700); };
  },

  bind(){
    const $ = id => document.getElementById(id);
    document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
      document.querySelectorAll("[data-view]").forEach(x => x.classList.toggle("on", x === b));
      document.body.classList.toggle("appview", b.dataset.view === "app"); this.drawShelves(); this.drawLayers();
    });
    document.querySelectorAll("[data-go]").forEach(b => b.onclick = () => this.go(b.dataset.go));
    document.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
      if (Object.values(this.day).reduce((a, n) => a + n, 0) >= 8) return;
      this.day[b.dataset.c] = (this.day[b.dataset.c] || 0) + 1; this.drawDay();
    });
    $("clearDay").onclick = () => { this.day = {}; this.drawDay(); };
    $("read").onclick = () => this.read();
    document.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => this.add(b.dataset.inc));
    document.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => this.remove(b.dataset.dec));
    $("make").onclick = () => this.make();
    document.querySelectorAll("[data-open=about]").forEach(a => a.onclick = () => $("aboutModal").classList.add("show"));
    document.querySelectorAll(".modal").forEach(m => m.onclick = e => { if (e.target === m || e.target.dataset.close !== undefined) m.classList.remove("show"); });
  },

  // ---------- the storefront shelves ----------
  shelfItem(d, i, kind){
    const price = this.total(d.r);
    return `<button class="sh-item" data-${kind}="${i}">
      <div class="sh-bottle">${bottleHTML({ r: d.r, items: [], level: .85, capped: false, labeled: true, w: document.body.classList.contains("appview") ? 58 : 78 })}</div>
      <div class="sh-tag"><span class="sh-name">${d.name}</span>${kind === "mine" ? `<span class="sh-sub">${new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>` : ""}</div>
    </button>`;
  },
  drawShelves(){
    const mine = shelfLoad();
    document.getElementById("menuShelf").innerHTML = MENU.map((d, i) => this.shelfItem(d, i, "menu")).join("");
    const mineHTML = mine.length ? mine.map((d, i) => this.shelfItem(d, i, "mine")).join("") : `<div class="sh-empty">Your drinks will live here.</div>`;
    document.getElementById("myShelf").innerHTML = mineHTML;
    const s2 = document.getElementById("myShelf2"); if (s2) s2.innerHTML = mineHTML;
    document.querySelectorAll("[data-menu]").forEach(b => b.onclick = () => this.startFrom(MENU[+b.dataset.menu], "from the menu"));
    document.querySelectorAll("[data-menu2]").forEach(b => b.onclick = () => this.startFrom(MENU[+b.dataset.menu2], "from the menu"));
    document.querySelectorAll("[data-mine]").forEach(b => b.onclick = () => this.startFrom(mine[+b.dataset.mine], "from your shelf"));
  },

  startFrom(d, from){
    this.cart = copyR(d.r); this.label = { name: d.name, why: d.sub ?? "" }; this.fromMood = false;
    document.getElementById("readout").textContent = from;
    document.getElementById("dname").textContent = d.name;
    document.getElementById("why").textContent = d.why ?? d.sub ?? "";
    this.go("s2"); this.drawLayers();
  },

  // ---------- order by mood ----------
  dominant(){ const e = Object.entries(this.day).sort((a, b) => b[1] - a[1]); return e.length ? e[0][0] : "blue"; },
  dayWords(){
    const total = Object.values(this.day).reduce((a, n) => a + n, 0);
    return Object.entries(this.day).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${Math.round(n / total * 100)}% ${DAY_COLORS[k].label} (${DAY_COLORS[k].means})`).join(", ");
  },
  drawDay(){
    const total = Object.values(this.day).reduce((a, n) => a + n, 0);
    document.getElementById("strip").innerHTML = total ? Object.entries(this.day).map(([k, n]) => `<span style="flex:${n};background:${DAY_COLORS[k].swatch}"></span>`).join("") : `<span class="empty">your day in colors</span>`;
    for (const k of Object.keys(DAY_COLORS)) document.getElementById("n-" + k).textContent = this.day[k] ? "×" + this.day[k] : "";
  },

  async read(){
    const $ = id => document.getElementById(id);
    const words = $("q").value.trim();
    if (!Object.keys(this.day).length){ document.querySelector(".colors").animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 300 }); return; }
    const text = `${words || "(no words)"}\nMy day in colors: ${this.dayWords()}.`;
    this.query = text; this.fromMood = true;
    this.cart = { ginger: 0, sugar: 0, addins: [] };
    this.go("s2"); this.drawLayers();
    $("readout").textContent = "reading your day…"; $("dname").textContent = "…"; $("why").textContent = "";
    const out = await this.engine.suggest({ text, mood: DAY_COLORS[this.dominant()].mood, prompt: "how was your day?", colors: this.day, dominant: this.dominant() });
    const r = out.recipe ?? DAY_COLORS[this.dominant()].recipe;
    this.label = { name: out.name, why: out.why ?? out.note ?? "" };
    $("readout").textContent = out.reading ?? "made from your day";
    $("dname").textContent = out.name; $("why").textContent = this.label.why;
    if (!out.live){
      const seq = [...Array(r.ginger).fill("ginger"), ...Array(r.sugar).fill("sugar"), ...r.addins];
      for (const k of seq){ this.add(k, true); await new Promise(res => setTimeout(res, 260)); }
    }
  },

  // ---------- customize ----------
  total(c = this.cart){ return BASE_PRICE + c.ginger * PRODUCTS.ginger.price + c.sugar * PRODUCTS.sugar.price + c.addins.reduce((t, a) => t + PRODUCTS[a].price, 0); },
  add(k, quiet){
    const c = this.cart;
    if (k === "ginger" || k === "sugar"){ if (c[k] >= 5) return this.bump(k); c[k]++; }
    else if (c.addins.includes(k)) return this.bump(k);
    else c.addins.push(k);
    this.drawLayers(k);
  },
  remove(k){
    const c = this.cart;
    if (k === "ginger" || k === "sugar") c[k] = Math.max(0, c[k] - 1); else c.addins = c.addins.filter(x => x !== k);
    this.drawLayers();
  },
  bump(k){ document.querySelector(`.prod[data-k="${k}"]`)?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 220 }); },

  // your cart as a chart: one block per ingredient, sized by amount, stacked in a cart (like the grocery reference)
  drawLayers(fresh){
    const c = this.cart, el = document.getElementById("cartchart"); if (!el) return;
    const blocks = [];
    if (c.ginger) blocks.push(["ginger", c.ginger]);
    c.addins.forEach(a => blocks.push([a, 1]));
    if (c.sugar) blocks.push(["sugar", c.sugar]);
    const cols = [[], [], []], hts = [0, 0, 0];
    blocks.sort((x, y) => y[1] - x[1]).forEach(bk => { const i = hts.indexOf(Math.min(...hts)); cols[i].push(bk); hts[i] += bk[1] * (bk[0] === "sugar" ? .6 : 1); });
    const count = c.ginger + c.sugar + c.addins.length;
    el.innerHTML = `
      <div class="cc-cols">${cols.map(col => `<div class="cc-col">${col.map(([k, n]) => `
        <div class="cc-block ${k === fresh ? "fresh" : ""}" style="flex:none;height:${Math.max(44, n * (k === "sugar" ? 26 : 52))}px;background:${LAYER_COLORS[k]}">
          <span class="cc-num">${money(PRODUCTS[k].price * n)}</span><span class="cc-name">${PRODUCTS[k].name}${n > 1 ? " ×" + n : ""}</span><svg viewBox="0 0 50 50">${iconOf(k)}</svg>
        </div>`).join("")}</div>`).join("")}</div>
      <div class="cc-basket"></div>
      <svg class="cc-handle" viewBox="0 0 100 60"><path d="M0 58 L22 8 L96 0" fill="none" stroke="#1E1E1E" stroke-width="2.4"/></svg>
      <div class="cc-tag"><b>${money(this.total())}</b><span>${count} item${count === 1 ? "" : "s"}</span></div>
      <div class="cc-wheels"><i></i><i></i></div>
      ${count ? "" : `<div class="cc-empty">your cart is empty. tap + add</div>`}`;
    document.getElementById("count").textContent = `(${count})`;
    document.getElementById("total").textContent = money(this.total());
    for (const k of ALL_KEYS){
      const n = k === "ginger" || k === "sugar" ? c[k] : (c.addins.includes(k) ? 1 : 0);
      document.getElementById("pn-" + k).textContent = n ? "×" + n : "";
      document.querySelector(`.prod[data-k="${k}"]`).classList.toggle("on", n > 0);
    }
  },

  // ---------- made slowly, then it goes on your shelf ----------
  async make(){
    const c = this.cart;
    if (!(c.ginger + c.sugar + c.addins.length)) return;
    if (this.engine.onCheckout) this.engine.onCheckout({ question: "how was your day?", answer: this.query ?? "", machine: null, cart: copyR(c), diffs: [] });
    const ov = document.getElementById("making");
    ov.innerHTML = `<div class="mk-stage"><div class="mk-bottle">${bottleHTML({ r: c, items: [], level: 0, capped: false, labeled: false, w: 150 })}</div></div><div class="mk-text" id="mkText"></div>`;
    ov.classList.add("show");
    requestAnimationFrame(() => { const f = ov.querySelector(".b-fill"); if (f){ f.style.transition = "height 6s cubic-bezier(.4,0,.2,1)"; f.style.height = "80%"; } });
    const lines = [];
    if (c.ginger) lines.push(`grating ${c.ginger} thumb${c.ginger > 1 ? "s" : ""} of ginger`);
    c.addins.forEach(a => lines.push(`adding ${PRODUCTS[a].name}`));
    if (c.sugar) lines.push(`stirring in ${c.sugar} spoon${c.sugar > 1 ? "s" : ""} of cane sugar`);
    lines.push("letting it steep", "putting it on your shelf");
    const el = document.getElementById("mkText");
    for (const t of lines){
      const row = document.createElement("div"); row.className = "mk-line"; el.appendChild(row);
      for (const ch of t){ row.textContent += ch; await new Promise(r => setTimeout(r, 28)); }
      await new Promise(r => setTimeout(r, 450));
    }
    await new Promise(r => setTimeout(r, 500));
    ov.classList.remove("show");
    const mine = shelfLoad();
    mine.push({ name: this.label?.name ?? "your ginjan", sub: this.fromMood ? "made from your day" : "customized", why: this.label?.why ?? "", r: copyR(c), date: Date.now() });
    shelfSave(mine);
    let note = this.fromMood ? (DAY_NOTES[this.dominant()] ?? "") : "Enjoy it. Made just how you like it.";
    if (this.fromMood && this.engine.note){ const n = await this.engine.note({ text: this.query, recipe: copyR(c) }); if (n) note = n; }
    document.getElementById("bnote").textContent = "“" + note + "”";
    document.getElementById("doneName").textContent = `${(this.label?.name ?? "your ginjan").replace(/^./, m => m.toUpperCase())} is on your shelf.`;
    this.drawShelves();
    this.go("s3");
    const last = document.querySelector("#myShelf2 .sh-item:last-child"); if (last) last.classList.add("new");
    this.day = {}; document.getElementById("q").value = ""; this.drawDay();
  },
};

// small helpers engines can use
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function recipeFor(mood){ const r = MOODS[mood]?.recipe ?? { ginger: 3, sugar: 2, addins: [] }; return { ginger: r.ginger, sugar: r.sugar, addins: [...r.addins] }; }
function describe(r){ return `ginger ${r.ginger}/5, sugar ${r.sugar}/5, add-ins: ${r.addins.join(", ") || "none"}`; }
