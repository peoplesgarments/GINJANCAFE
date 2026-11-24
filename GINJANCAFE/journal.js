// ================= GINJAN · the barista reads your journal (Markov chain) =================
// Training: every emotion gets its own word-level Markov chain, built from the reflections labeled with it.
// Reading: each chain scores how likely your entry is under it ("does this sound like a stressed day?").
// The hand-highlighted clue phrases and keywords add evidence. The highest score picks the drink.
// Writing: RiTa's Markov chain (the workshop tool) writes new reflections in the voice of each emotion.

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const words = s => (s.toLowerCase().match(/[a-z']+/g) ?? []);
const LS = { get(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

// ---------- training ----------
const Brain = {
  data: [],
  train(){
    this.data = [...CORPUS.map(c => ({ ...c, src: "starter" })), ...LS.get("ginjan-training", []).map(c => ({ ...c, src: "added" }))];
    this.models = {}; const vocab = new Set();
    for (const e of EMO_KEYS){
      const uni = {}, bi = {}; let N = 0;
      for (const d of this.data.filter(d => d.e === e)){
        const w = ["<s>", ...words(d.t)];
        w.forEach((x, i) => { uni[x] = (uni[x] || 0) + 1; N++; vocab.add(x); if (i) bi[w[i - 1] + " " + x] = (bi[w[i - 1] + " " + x] || 0) + 1; });
      }
      // the clue phrases for this emotion: hand highlights + keywords
      // a clue counts for its own mood: plain phrases belong to the entry's mood, {p, e} phrases to their tagged mood
      const clues = [...new Set(this.data.flatMap(d => (d.clues ?? []).map(c => typeof c === "string" ? { p: c, e: d.e } : c)).filter(c => c.e === e).map(c => c.p.toLowerCase()))].filter(c => c.split(" ").length > 1);
      this.models[e] = { uni, bi, N, clues, keys: EMOTIONS[e].keywords.map(k => k.toLowerCase()), count: this.data.filter(d => d.e === e).length };
    }
    this.V = vocab.size;
    // in how many entries of each mood does each word appear
    this.df = {};
    for (const e of EMO_KEYS) this.df[e] = {};
    for (const d of this.data) for (const w of new Set(words(d.t))) this.df[d.e][w] = (this.df[d.e][w] || 0) + 1;
    this.writers = {};
  },
  // how likely is this text, word by word, under one emotion's chain
  logLikelihood(e, text){
    const m = this.models[e], w = ["<s>", ...words(text)], a = .1, lam = .6;
    let ll = 0, n = 0;
    for (let i = 1; i < w.length; i++){
      const pb = ((m.bi[w[i - 1] + " " + w[i]] || 0) + a) / ((m.uni[w[i - 1]] || 0) + a * this.V);
      const pu = ((m.uni[w[i]] || 0) + a) / (m.N + a * this.V);
      ll += Math.log(lam * pb + (1 - lam) * pu); n++;
    }
    return n ? ll / n : 0;
  },
  // which words lean toward which feeling, according to the chains themselves
  // a word counts as a clue only if it shows up in at least 2 entries of one mood
  // and clearly more often there than in any other mood
  STOP: new Set("i me my the a an and or but so to of in on at it its it's is was were be been am are this that just like really very kind i'm i've i'd you your we they he she them her his with for from as all not no do did don't didn't have had has get got up out about what when then than there here because if can could would one some now still even too much more how who back kept made went anyone day time thing things way keep make said know going got today feel felt also over bit lot little class friend friends people everyone something nothing anything week morning night evening afternoon around into after before again while ok honestly literally someone hour hours minutes".split(" ")),
  distinct(w){
    const rates = EMO_KEYS.map(e => [(this.df[e][w] || 0) / this.models[e].count, e, this.df[e][w] || 0]).sort((p, q) => q[0] - p[0]);
    const [top, second] = rates;
    const elsewhere = rates.slice(1).reduce((t, r) => t + r[2], 0);
    return { e: top[1], n: top[2], of: this.models[top[1]].count, elsewhere, lead: top[0] - second[0] };
  },
  learned(e, k = 10){
    return Object.keys(this.df[e]).filter(w => !this.STOP.has(w) && !TOPICS.has(w) && w.length > 2)
      .map(w => ({ w, ...this.distinct(w) })).filter(x => x.e === e && x.n >= 2 && x.lead >= .12)
      .sort((p, q) => q.lead - p.lead || q.n - p.n).slice(0, k);
  },
  evidence(text){
    const low = text.toLowerCase(), re = /[a-z']+/g, out = [], seen = new Set(); let x;
    while ((x = re.exec(low))){
      const w = x[0];
      if (this.STOP.has(w) || TOPICS.has(w) || w.length < 3 || seen.has(w)) continue;
      const d = this.distinct(w);
      if (d.n < 2 || d.lead < .12) continue;
      seen.add(w);
      out.push({ s: x.index, t: x.index + w.length, e: d.e, w, kind: "pattern", margin: d.lead, inEntries: d.n, of: d.of, elsewhere: d.elsewhere });
    }
    return out.sort((p, q) => q.margin - p.margin).slice(0, 8).sort((p, q) => p.s - q.s);
  },
  // find the phrases in the text that give a feeling away
  matches(text){
    const low = text.toLowerCase(), found = [];
    for (const e of EMO_KEYS){
      const m = this.models[e];
      for (const c of m.clues){ let i = low.indexOf(c); while (i >= 0){ found.push({ s: i, t: i + c.length, e, kind: "phrase", w: c }); i = low.indexOf(c, i + 1); } }
      for (const k of m.keys){
        const re = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"); let x;
        while ((x = re.exec(low))) found.push({ s: x.index, t: x.index + k.length, e, kind: "word", w: k });
      }
    }
    // keep the longest match where they overlap
    found.sort((a, b) => (b.t - b.s) - (a.t - a.s));
    const kept = [];
    for (const f of found) if (!kept.some(k => f.s < k.t && f.t > k.s)) kept.push(f);
    // "not sad", "don't miss", "no longer stressed": the feeling is turned around, so it doesn't count
    const NEG = /\b(not|never|no longer|isn't|wasn't|aren't|don't|didn't|won't|doesn't|hardly)\s+(\w+\s+){0,2}$/;
    for (const k of kept){
      const hasOwnNot = /\b(not|never|n't|no longer)\b/.test(k.w);
      if (!hasOwnNot && NEG.test(low.slice(Math.max(0, k.s - 30), k.s))) k.negated = true;
    }
    return kept.sort((a, b) => a.s - b.s);
  },
  read(text){
    const ll = {}, hits = this.matches(text), ev = {};
    for (const e of EMO_KEYS){ ll[e] = this.logLikelihood(e, text); ev[e] = 0; }
    for (const h of hits) if (!h.negated) ev[h.e] += h.kind === "phrase" ? 1.3 : .45;
    const mean = EMO_KEYS.reduce((t, e) => t + ll[e], 0) / EMO_KEYS.length;
    const logits = EMO_KEYS.map(e => (ll[e] - mean) * 4 + ev[e]);
    const mx = Math.max(...logits), ex = logits.map(l => Math.exp(l - mx)), sum = ex.reduce((a, b) => a + b, 0);
    const scores = Object.fromEntries(EMO_KEYS.map((e, i) => [e, ex[i] / sum]));
    const top = EMO_KEYS.slice().sort((a, b) => scores[b] - scores[a]);
    // how strong: strong words / !! push it up, softeners pull it down, a close race keeps it middle-or-mild
    const strong = (text.match(STRONG) ?? []).length, soft = (text.match(SOFT) ?? []).length;
    const topE = top[0];
    let level = 1;
    if (strong >= 3 || (strong >= 2 && scores[topE] > .6)) level = 2;
    if (soft >= 2 || scores[topE] < .3) level = 0;
    const notes = [...hits];
    for (const p of this.evidence(text)) if (!notes.some(h => p.s < h.t && p.t > h.s)) notes.push(p);
    const low = text.toLowerCase(), seenT = new Set(); let tx; const tre = /[a-z']+/g;
    while ((tx = tre.exec(low)) && seenT.size < 3){
      const w = tx[0];
      if (TOPICS.has(w) && !seenT.has(w) && !notes.some(h => tx.index < h.t && tx.index + w.length > h.s)){ seenT.add(w); notes.push({ s: tx.index, t: tx.index + w.length, e: null, w, kind: "topic" }); }
    }
    notes.sort((p, q) => p.s - q.s);
    return { scores, top, hits, notes, ll, ev, level, strong, soft, nearest: this.nearest(text) };
  },
  // the past customer whose words overlap the most with yours
  nearest(text){
    const mine = new Set(words(text).map((w, i, a) => i ? a[i - 1] + " " + w : null).filter(Boolean));
    let best = null, bs = 0;
    for (const d of this.data){
      const w = words(d.t); let s = 0;
      for (let i = 1; i < w.length; i++) if (mine.has(w[i - 1] + " " + w[i])) s++;
      if (s > bs){ bs = s; best = d; }
    }
    return bs >= 2 ? best : null;
  },
  // RiTa Markov chains that write in the voice of each emotion
  writer(e){
    if (this.writers[e]) return this.writers[e];
    if (typeof RiTa === "undefined") return null;
    const m = RiTa.markov(2, { disableInputChecks: true });
    this.data.filter(d => !e || d.e === e).forEach(d => m.addText(d.t));
    return (this.writers[e] = m);
  },
  write(e, n = 3){
    const m = this.writer(e);
    try { if (m) return m.generate(n, { minLength: 5, maxLength: 40 }).join(" "); } catch {}
    // fallback: remix sentences from that emotion
    const sents = this.data.filter(d => !e || d.e === e).flatMap(d => d.t.match(/[^.!?]+[.!?]+/g) ?? []);
    return Array.from({ length: n }, () => sents[Math.floor(Math.random() * sents.length)].trim()).join(" ");
  },
};

// ---------- drinks ----------
const FREEBIES = [
  { k: "hibiscus", label: "extra hibiscus", add: r => { if (!r.addins.includes("hibiscus")) r.addins.push("hibiscus"); } },
  { k: "sugar", label: "a little more sugar", add: r => { r.sugar = Math.min(5, r.sugar + 1); } },
  { k: "ginger", label: "an extra kick of ginger", add: r => { r.ginger = Math.min(5, r.ginger + 1); } },
  { k: "sparkling", label: "a splash of fizz", add: r => { if (!r.addins.includes("sparkling")) r.addins.push("sparkling"); } },
  { k: "mint", label: "fresh mint", add: r => { if (!r.addins.includes("mint")) r.addins.push("mint"); } },
  { k: "lemon", label: "a squeeze of lemon", add: r => { if (!r.addins.includes("lemon")) r.addins.push("lemon"); } },
];
// each ingredient tile is a tiny room: wall + floor
const SCENES = {
  ginger: ["#F1E9C2", "#CCC54A"], sugar: ["#E7C3CF", "#F3F2EC"], pineapple: ["#BFD7E8", "#E2DA8A"], mint: ["#F3F2EC", "#E7C3CF"],
  lemon: ["#D6E6CC", "#9C7389"], sparkling: ["#E2DA8A", "#BFD7E8"], orange: ["#F3F2EC", "#CCC54A"], hibiscus: ["#F1E9C2", "#E7C3CF"],
  mango: ["#E7C3CF", "#D6E6CC"], guava: ["#BFD7E8", "#F1E9C2"],
};
// the emotion wheel: one petal per mood, rings = mild (outside) → strong (inside)
function wheelSVG(){
  const N = EMO_KEYS.length, cx = 150, cy = 150, R = [[100, 146], [62, 100], [26, 62]];
  const arc = (r0, r1, a0, a1) => { const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x1, y1] = p(r1, a0), [x2, y2] = p(r1, a1), [x3, y3] = p(r0, a1), [x4, y4] = p(r0, a0);
    return `M${x1} ${y1} A${r1} ${r1} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r0} ${r0} 0 0 0 ${x4} ${y4}Z`; };
  let out = "";
  EMO_KEYS.forEach((e, i) => {
    const a0 = (i / N) * 2 * Math.PI - Math.PI / 2 - Math.PI / N, a1 = a0 + 2 * Math.PI / N, am = (a0 + a1) / 2;
    const c = EMOTIONS[e].color === "#E9822A" ? "#EDB04A" : EMOTIONS[e].color;
    R.forEach(([r0, r1], lvl) => {
      const tint = [55, 78, 100][lvl];
      const rm = (r0 + r1) / 2, tx = cx + rm * Math.cos(am), ty = cy + rm * Math.sin(am);
      const dark = lvl > 0 && !["#EDB04A", "#A39E92"].includes(c);
      out += `<g class="seg" data-seg="${e}:${lvl}"><path d="${arc(r0, r1, a0, a1)}" fill="color-mix(in srgb, ${c} ${tint}%, #fff)" stroke="#1E1E1E" stroke-width="1.5"/>
        <text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="${lvl === 2 ? 7 : 8}" fill="${dark ? "#fff" : "#1E1E1E"}" font-family="Arial" font-weight="700">${LEVELS[e][lvl === 0 ? 0 : lvl === 1 ? 1 : 2]}</text></g>`;
    });
  });
  return `<svg viewBox="0 0 300 300">${out}<circle cx="150" cy="150" r="26" fill="#fff" stroke="#1E1E1E" stroke-width="1.5"/><text x="150" y="147" text-anchor="middle" font-size="7.5" font-family="Arial" fill="#888">tap to</text><text x="150" y="157" text-anchor="middle" font-size="7.5" font-family="Arial" fill="#888">pour</text></svg>`;
}
const units = r => { const u = { ginger: r.ginger, sugar: r.sugar }; r.addins.forEach(a => u[a] = 1); return u; };
const menuFor = e => MENU.find(m => m.name === EMOTIONS[e].drink);
function jarItems(r){
  const keys = [...Array(r.ginger).fill("ginger"), ...Array(r.sugar).fill("sugar"), ...r.addins];
  return keys.map((type, i) => ({ type, x: 120 + seeded(i * 7 + type.length * 13) * 160, y: 470 + seeded(i * 11 + 3) * 230, rot: seeded(i * 5 + 9) * 360 }));
}
function highlight(text, hits, numbered){
  let out = "", at = 0;
  for (const [i, h] of hits.entries()){
    out += esc(text.slice(at, h.s));
    const c = h.e ? EMOTIONS[h.e].color : "#A39E92";
    out += `<mark class="${h.kind ?? ""} ${h.negated ? "neg" : ""}" style="--c:${c}" title="${h.e ? EMOTIONS[h.e].short : "topic"}">${esc(text.slice(h.s, h.t))}${numbered ? `<sup>${i + 1}</sup>` : ""}</mark>`;
    at = h.t;
  }
  return out + esc(text.slice(at));
}
const bars = (scores, big) => EMO_KEYS.slice().sort((a, b) => scores[b] - scores[a]).map(e => `
  <div class="bar ${big ? "big" : ""}"><span class="bl"><i style="background:${EMOTIONS[e].color}"></i>${EMOTIONS[e].label}</span>
  <span class="bt"><b style="width:${Math.round(scores[e] * 100)}%;background:${EMOTIONS[e].color}"></b></span><span class="bn">${Math.round(scores[e] * 100)}%</span></div>`).join("");

// ---------- the shelf ----------
function shelfJars(){
  const mine = LS.get("ginjan-jars", []);
  const starters = Brain.data.filter(d => d.src === "starter").map(d => ({ who: "customer", e: d.e, t: d.t }));
  return [...mine.map(j => ({ ...j, who: "you" })).reverse(), ...starters].map(j => {
    const m = menuFor(j.e); return { ...j, r: j.r ?? copyR(m.r), drink: j.drink ?? m.name };
  });
}
function jarHTML(j, i){
  return `<button class="jar ${j.who}" data-jar="${i}" title="${EMOTIONS[j.e].short}">
    <span class="j-lid" style="background:${j.colors ? `linear-gradient(90deg,${Object.entries(j.colors).map(([k]) => EMOTIONS[k].color).join(",")})` : EMOTIONS[j.e].color}"></span>
    <span class="j-glass"><span class="j-liquid" style="background:${drinkBG(j.r)}"><span class="grain"></span></span><span class="j-note"></span><span class="j-shine"></span></span>
    <span class="j-tag"><b>${j.drink}</b><em>${j.who === "you" ? "you" : EMOTIONS[j.e].short}</em></span>
  </button>`;
}

// ---------- the app ----------
const App = {
  init(){
    Brain.train();
    document.documentElement.style.setProperty("--grain", GRAIN);
    const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    document.getElementById("app").innerHTML = `
      <div class="cafe-bg">${CAFE_SVG}<div class="cafe-grain"></div></div>
      <div class="store c-store jr" id="store">
        <div class="top2"><img src="${ASSETS.wordmark}" class="logo" alt="GINJAN">
          <div class="tabs"><button class="tab on" data-tab="s1">journal</button><button class="tab" data-tab="s4">the shelf</button><button class="tab" data-tab="s5">training</button><button class="tab" data-tab="ginjan">about GINJAN</button></div>
          <div class="top2-r"><a data-open="aboutModal" class="link">about the machine</a></div></div>

        <!-- 1 · the journal -->
        <section class="scr show" id="s1">
          <div class="j-grid">
            <div class="paper">
              <span class="tape t1"></span><span class="tape t2"></span>
              <div class="p-date">${date}</div>
              <div class="p-q">What's on your mind today?</div>
              <textarea id="entry" placeholder="dear barista, ok so today…"></textarea>
              <div class="p-foot"><span id="wc">0 / 30 words</span><button class="cta" id="give" disabled>give it to the barista</button></div>
            </div>
            <aside class="ear">
              <div class="eyebrow">what the barista hears</div>
              <div class="live" id="live"></div>
              <div class="others">
                <div class="eyebrow">stuck? the machine wrote this from other entries</div>
                <p id="example"></p>
                <div class="row"><button class="ghost" id="another">another one</button><button class="ghost" id="useit">start from it</button></div>
                <button class="ghost tryone" id="tryone">try a test entry</button>
              </div>
            </aside>
          </div>
        </section>

        <!-- 2 · the barista reads it, you add colors, it blends both -->
        <section class="scr" id="s2">
          <div class="r-grid">
            <div class="readcol">
              <div class="eyebrow">the barista read your entry</div>
              <div class="annot">
                <div class="readpaper" id="readText"></div>
                <div class="margin" id="marginNotes"></div>
              </div>
              <div class="legend" id="legend"></div>
              <div class="say" id="say"></div>
              <div class="eyebrow" style="margin-top:16px">what your words sound like</div>
              <div class="bars" id="finalBars"></div>
              <div class="near" id="near"></div>
            </div>
            <div class="mixcol">
              <div class="step" id="colorStep">
                <div class="eyebrow">your turn</div>
                <h2 class="h-step">Choose the colors you associate with this entry.</h2>
                <div class="sub">Each color has three strengths, from mild to strong. Tap as many as fit, more than once to make that part bigger.</div>
                <div class="color-hint" id="colorHint"></div>
                <div class="wheel-row">
                  <div class="cpick">${EMO_KEYS.map(e => `
                    <div class="cp-row"><span class="dot" style="background:${EMOTIONS[e].swatch ?? EMOTIONS[e].color}"></span>
                      <div class="cp-name"><b>${EMOTIONS[e].cname}</b></div>
                      <div class="cp-levels">${LEVELS[e].map((w, l) => `<button class="lvl" data-seg="${e}:${l}" style="--c:${EMOTIONS[e].color === "#E9822A" ? "#EDB04A" : EMOTIONS[e].color};--a:${[22, 50, 85][l]}%">${w}</button>`).join("")}</div>
                    </div>`).join("")}</div>
                  <div class="cpour">
                    <div class="cp-head"><span>your entry <em id="pours">(0)</em></span></div>
                    <div class="cp-panel" id="cPanel"><div class="cp-bottle" id="cBottle">${bottleHTML({ r: { ginger: 0, sugar: 0, addins: [] }, items: [], level: 0, capped: false, labeled: true, w: 96 })}</div><div class="cp-cap" id="cCap">tap a color</div></div>
                    <div class="cp-hint" id="cHint"></div>
                  </div>
                </div>
                <div class="picked" id="picked"></div>
                <div class="row"><button class="ghost" id="clearC">clear</button><button class="cta" id="blend" disabled>blend my words + colors</button></div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2b · the drink: menu · ingredient tiles · your bottle -->
        <section class="scr" id="s6">
          <div class="shop3">
            <nav class="menu3">
              <div class="eyebrow">the menu</div>
              ${MENU.map((d, i) => `<button class="menu-item" data-menu2="${i}"><span class="mi-sw" style="background:${gradientBG(d.r)}"></span><span><b>${d.name}</b><br><em>${d.sub}</em></span></button>`).join("")}
            </nav>
            <main class="cat3">
              <div class="agree" id="agree"></div>
              <div class="eyebrow">the drink you need</div>
              <h1 class="big" id="drinkName">…</h1>
              <p class="why" id="drinkWhy"></p>
              <div id="steps"></div>
              <div class="free-note" id="freeNote"></div>
              <div class="catalogue">${ALL_KEYS.map(k => `
                <div class="prod" data-k="${k}" style="--wall:${SCENES[k][0]};--floor:${SCENES[k][1]}">
                  <div class="prod-img"><svg viewBox="0 0 50 50">${iconOf(k)}</svg></div>
                  <div class="prod-name">${PRODUCTS[k].name}</div>
                  <div class="prod-qty" id="pn-${k}"></div>
                  <div class="prod-btns"><button class="minus" data-dec="${k}">−</button><button class="plus" data-inc="${k}">+ free</button></div>
                </div>`).join("")}</div>
            </main>
            <aside class="cart3">
              <div class="cart-top"><div class="h2">your bottle <span id="count">(0)</span></div><div class="total" id="total"></div></div>
              <div class="c-panel bottle-view" id="cpanel"></div>
              <div class="lines" id="lines"></div>
              <div class="row"><button class="ghost" data-tab="s2">back</button><button class="cta" id="make" disabled>make it</button></div>
            </aside>
          </div>
        </section>

        <!-- 3 · the receipt, on the café table -->
        <section class="scr" id="s3">
          <div class="on-table-wrap">
            <div class="print-col">
              <div class="printer" id="printer"><span class="pr-light"></span><span class="pr-name">GINJAN · receipts</span><span class="pr-slot"></span></div>
              <div class="rclip" id="rclip"><div class="receipt" id="receipt"></div></div>
            </div>
            <div class="table-side">
              <div class="ready-bottle" id="readyBottle"></div>
              <button class="cta" data-tab="s4">see it on the shelf</button>
              <button class="ghost" id="again">write another</button>
            </div>
          </div>
        </section>

        <!-- 4 · the shelf -->
        <section class="scr" id="s4">
          <div class="shelf-head"><div><div class="eyebrow">the shelf</div><h1 class="big">Everyone's day, bottled.</h1>
            <p class="why">Every jar is someone's answer to "what's on your mind today?" and the drink the barista made for it. Tap a jar to read it.</p></div>
            <div class="filters" id="filters"></div></div>
          <div class="shelves" id="shelves"></div>
        </section>

        <!-- 5 · training -->
        <section class="scr" id="s5">
          <div class="eyebrow">training the barista</div>
          <h1 class="big">How the barista learns to read you.</h1>
          <p class="why">Each feeling has its own Markov chain, trained on the entries below. The highlighted phrases are the clues: when someone writes something like them, that feeling gets louder.</p>
          <div class="how3 how5">
            <div><b>1 · phrases</b><p>Phrases highlighted by hand in the training entries, like “nothing here tastes like home” → homesick. Strongest clue.</p></div>
            <div><b>2 · keywords</b><p>A short list of words given to each mood, like “deadline” → stressed.</p></div>
            <div><b>3 · learned words</b><p>Words the machine noticed on its own: they show up in at least 2 entries of one mood and clearly more there than anywhere else. Listed under each mood below.</p></div>
            <div><b>· what doesn't count</b><p>Topics like “mom”, “home” or “class” are what you write about, not how you feel. And a “not” in front turns a feeling around: “I'm not sad anymore” isn't sad.</p></div>
            <div><b>4 · Markov chain</b><p>Each mood's chain scores how much your whole entry sounds like its entries, word after word. This sets the percentages; the clues push them.</p></div>
          </div>
          <div class="cmatrix" id="cmatrix"></div>
          <div class="train-cols" id="trainCols"></div>
          <div class="addtrain">
            <div class="eyebrow">add a new entry to the training</div>
            <textarea id="newT" rows="3" placeholder="paste someone's answer to “what's on your mind today?”"></textarea>
            <div class="row">
              <select id="newE">${EMO_KEYS.map(e => `<option value="${e}">${EMOTIONS[e].label}</option>`).join("")}</select>
              <input id="newC" placeholder="clue phrases, comma separated. tag another mood with :mood, e.g. so proud of myself:happy">
              <button class="ghost" id="askQwen">ask Qwen to label it</button>
              <button class="cta" id="addT">add to training</button>
            </div>
            <div class="qwen-out" id="qwenOut"></div>
          </div>
        </section>
      </div>
      <div class="making" id="making"></div>
      <div class="modal" id="jarModal"><div class="about jar-card" id="jarCard"></div></div>
      <div class="modal" id="ginjanModal"><div class="about about-ginjan">
        <button class="x" data-close>×</button>
        <img src="${ASSETS.wordmark}" style="width:150px" alt="GINJAN">
        <div class="tag">about GINJAN</div>
        <p class="ab-lede">Ginjan is an imagined beverage brand inspired by a ginger drink I grew up making with my Guinean mother, blending pineapple, mint, ginger, and water into her own distinct recipe. It is a nostalgic, bold-flavored drink designed to be shared, bringing tradition to global markets.</p>
        <div class="tag">the menu</div>
        <div class="ab-menu">
          <div><b>the o.g.</b><em>mom's recipe</em><span>ginger + pineapple + mint + lemon</span><i>balanced, refreshing, a bit of spice</i></div>
          <div><b>just ginger</b><span>ginger</span><i>sharp, warming, and sweet</i></div>
          <div><b>the fizzy one</b><span>ginger · pineapple · lemon · mint · carbonated water</span><i>spicy, tropical, citrus, mint, fizzy</i></div>
          <div><b>alternative flavors</b><span>ginger + orange · ginger + hibiscus · ginger + mango + guava</span></div>
        </div>
        <div class="tag">ordering here</div>
        <p>There's no menu to read at the counter. You write the barista a journal entry about what's on your mind, and it makes the drink you need. Every entry is bottled and shelved, so you can read what other people were carrying that day too.</p>
        <p class="ab-credit">GINJAN by Mariama Lulah Balde · Packaging Design, Pratt Institute</p>
      </div></div>
      <div class="modal" id="aboutModal"><div class="about">
        <button class="x" data-close>×</button>
        <img src="${ASSETS.wordmark}" style="width:120px" alt="GINJAN">
        <div class="tag">about the machine · Markov chain</div>
        <div class="title">The barista reads your journal</div>
        <p><b>Training.</b> ${Brain.data.length} answers to "what's on your mind today?" are labeled with one of six feelings. Each feeling gets its own word-by-word Markov chain: a table of which word tends to follow which, in that feeling's entries. The phrases highlighted by hand (like "my feet are killing me" or "nothing here tastes like home") are kept as clues.</p>
        <p><b>Reading.</b> When you write, every chain scores how likely your words are under it. Phrases and words that match the clues add to that feeling. The scores become the percentages you see, and the top feeling picks the drink from the menu.</p>
        <p><b>Writing.</b> The examples on the journal page are written by RiTa's Markov chain (n = 2), trained on the same entries.</p>
        <p><b>Feeling → drink.</b> ${EMO_KEYS.map(e => `${EMOTIONS[e].short} → ${EMOTIONS[e].drink}`).join(" · ")}</p>
        <div class="tag">optional · Qwen (Llama app) for training only</div>
        ${typeof LLM !== "undefined" ? LLM.panel() : ""}
      </div></div>`;
    this.bind();
    this.newExample();
    this.drawLive();
    if (typeof LLM !== "undefined") LLM.bind();
    this.intro();
  },

  // GINJAN types until the screen is full, then fades straight into the journal (no button)
  intro(){
    const el = document.createElement("div");
    el.className = "intro";
    el.innerHTML = `<div class="i-type" id="iType"></div>`;
    document.body.appendChild(el);
    const box = el.querySelector("#iType");
    (async () => {
      while (box.scrollHeight <= el.clientHeight + 40){
        for (const ch of "GINJAN "){ box.textContent += ch; await new Promise(r => setTimeout(r, 14)); }
      }
      el.classList.add("full");
      await new Promise(r => setTimeout(r, 700));
      el.classList.add("out");
      setTimeout(() => { el.remove(); document.getElementById("entry")?.focus(); }, 700);
    })();
  },

  go(id){
    document.querySelectorAll(".scr").forEach(s => s.classList.toggle("show", s.id === id));
    document.querySelectorAll("[data-tab]").forEach(t => t.classList.toggle("on", t.dataset.tab === id || (id === "s2" || id === "s3" || id === "s6") && t.dataset.tab === "s1"));
    document.body.classList.toggle("on-table", id === "s3");
    if (id === "s4") this.drawShelf();
    if (id === "s5") this.drawTraining();
  },

  bind(){
    const $ = id => document.getElementById(id);
    document.addEventListener("click", e => {
      const t = e.target.closest("[data-tab]");
      if (t){ if (t.dataset.tab === "ginjan") $("ginjanModal").classList.add("show"); else this.go(t.dataset.tab); }
      const o = e.target.closest("[data-open]"); if (o) $(o.dataset.open).classList.add("show");
      const m = e.target.closest(".modal"); if (m && (e.target === m || e.target.dataset.close !== undefined)) m.classList.remove("show");
      const j = e.target.closest("[data-jar]"); if (j) this.openJar(+j.dataset.jar);
      const f = e.target.closest("[data-filter]"); if (f){ this.filter = f.dataset.filter === this.filter ? null : f.dataset.filter; this.drawShelf(); }
    });
    let tm;
    $("entry").addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => this.drawLive(), 180);
      const n = words($("entry").value).length; $("wc").textContent = n < 30 ? `${n} / 30 words · keep going, take your time` : `${n} words`; $("give").disabled = n < 30; });
    $("another").onclick = () => this.newExample();
    $("useit").onclick = () => { $("entry").value = $("example").textContent; $("entry").dispatchEvent(new Event("input")); $("entry").focus(); };
    $("give").onclick = () => this.read();
    $("tryone").onclick = () => { const t = TESTS[(this.ti = ((this.ti ?? -1) + 1) % TESTS.length)]; $("entry").value = t; $("entry").dispatchEvent(new Event("input")); };
    document.querySelectorAll("[data-seg]").forEach(g => g.onclick = () => {
      const [e, lvl] = g.dataset.seg.split(":"); const tot = Object.values(this.colors).reduce((a, n) => a + n, 0); if (tot >= 8) return;
      this.colors[e] = (this.colors[e] || 0) + 1; (this.pours ??= []).push(e); (this.picks ??= []).push([e, +lvl]);
      this.pourColor(e, g);
      g.animate([{ opacity: 1 }, { opacity: .5 }, { opacity: 1 }], { duration: 250 });
    });
    $("clearC").onclick = () => { this.colors = {}; this.pours = []; this.picks = []; this.drawColors(); };
    $("blend").onclick = () => this.blend();
    document.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => this.addFree(b.dataset.inc));
    document.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => this.removeOne(b.dataset.dec));
    document.querySelectorAll("[data-menu2]").forEach(b => b.onclick = () => this.switchDrink(+b.dataset.menu2));
    $("make").onclick = () => this.make();
    $("again").onclick = () => { $("entry").value = ""; $("entry").dispatchEvent(new Event("input")); this.go("s1"); };
    $("addT").onclick = () => this.addTraining();
    $("askQwen").onclick = () => this.askQwen();
  },

  newExample(){ document.getElementById("example").textContent = Brain.write(null, 3); },

  drawLive(){
    const t = document.getElementById("entry").value;
    const scores = words(t).length ? Brain.read(t).scores : Object.fromEntries(EMO_KEYS.map(e => [e, 0]));
    document.getElementById("live").innerHTML = bars(scores);
  },

  // ---------- reading ----------
  async read(){
    const $ = id => document.getElementById(id), text = $("entry").value.trim();
    const r = Brain.read(text); this.reading = { text, ...r };
    this.colors = {}; this.pours = []; this.picks = []; this.drawColors();
    $("readText").innerHTML = esc(text); $("legend").innerHTML = ""; $("say").innerHTML = "";
    $("finalBars").innerHTML = bars(Object.fromEntries(EMO_KEYS.map(k => [k, 0])), true); $("near").innerHTML = "";
    $("colorStep").classList.add("hide", "waiting");
    this.go("s2");
    const wait = ms => new Promise(res => setTimeout(res, ms));
    await wait(600);
    $("readText").innerHTML = highlight(text, r.notes, true);
    $("marginNotes").innerHTML = `<div class="mn-head">the barista's notes</div>` + r.notes.map((h, i) => h.kind === "topic" ? `
      <div class="mn topic" style="--c:#A39E92;animation-delay:${.3 + i * .25}s"><b>${i + 1}</b><div><q>${esc(text.slice(h.s, h.t))}</q> → <span>a topic</span><em>what you're writing about, not how you feel, so it doesn't count</em></div></div>` : h.negated ? `
      <div class="mn neg" style="--c:${EMOTIONS[h.e].color};animation-delay:${.3 + i * .25}s"><b>${i + 1}</b><div><q>${esc(text.slice(h.s, h.t))}</q> → <span><s>${EMOTIONS[h.e].short}</s></span><em>I caught the “not” before it, so this doesn't count as ${EMOTIONS[h.e].short}</em></div></div>` : `
      <div class="mn" style="--c:${EMOTIONS[h.e].color};animation-delay:${.3 + i * .25}s"><b>${i + 1}</b><div><q>${esc(text.slice(h.s, h.t))}</q> → <span>${EMOTIONS[h.e].short}</span>
      <em>${h.kind === "phrase" ? `a phrase highlighted in the ${EMOTIONS[h.e].short} training entries` : h.kind === "word" ? `a ${EMOTIONS[h.e].short} keyword I was given` : `in ${h.inEntries} of ${h.of} ${EMOTIONS[h.e].short} entries · ${h.elsewhere ? h.elsewhere + " elsewhere" : "nowhere else"}`}</em></div></div>`).join("")
      + (r.notes.length ? "" : `<div class="mn"><div><em>nothing stood out. I'm reading the overall pattern of your words.</em></div></div>`);
    document.querySelectorAll("#readText mark").forEach((mk, i) => mk.style.animationDelay = (.3 + i * .25) + "s");
    const used = [...new Set(r.notes.filter(h => h.e && !h.negated).map(h => h.e))];
    $("legend").innerHTML = used.map(k => `<span><i style="background:${EMOTIONS[k].color}"></i>${EMOTIONS[k].short}</span>`).join("") + `<em>solid = trained phrases · dashed = learned words · gray = topics · crossed = turned around by “not”</em>`;
    await wait(900 + r.notes.length * 250);
    await this.say(this.reflect(r));
    if (r.scores[r.top[0]] < .35 && r.scores[r.top[1]] > .1){
      const [a, b] = r.top;
      $("say").insertAdjacentHTML("beforeend", `<div class="ask"><p>which feels closer?</p><button class="ghost" data-pick="${a}">${EMOTIONS[a].seem}</button><button class="ghost" data-pick="${b}">${EMOTIONS[b].seem}</button></div>`);
      const pick = await new Promise(res => document.querySelectorAll("[data-pick]").forEach(btn => btn.onclick = () => res(btn.dataset.pick)));
      document.querySelectorAll("[data-pick]").forEach(btn => { btn.disabled = true; btn.classList.toggle("on", btn.dataset.pick === pick); });
      // your answer moves that feeling up front
      r.scores[pick] += .25; const t = EMO_KEYS.reduce((x, e) => x + r.scores[e], 0); EMO_KEYS.forEach(e => r.scores[e] /= t);
      r.top = EMO_KEYS.slice().sort((p, q) => r.scores[q] - r.scores[p]); r.answered = pick;
      $("say").insertAdjacentHTML("beforeend", `<p class="say-after">thank you. that helps me learn.</p>`);
    }
    $("finalBars").innerHTML = bars(r.scores, true);
    if (r.nearest) $("near").innerHTML = `<div class="eyebrow">it reminded the barista of another customer's entry</div><p>“${esc(r.nearest.t.slice(0, 130))}…”</p>`;
    await wait(500);
    $("colorHint").innerHTML = this.colorHint(r.top[0]);
    $("colorStep").classList.remove("hide", "waiting");
  },
  // the barista's reply, built from the phrases it pulled
  reflect(r){
    const rank = { phrase: 3, word: 2, pattern: 1 };
    const quotes = e => [...new Set(r.notes.filter(h => h.e === e && !h.negated).sort((x, y) => rank[y.kind] - rank[x.kind] || y.w.length - x.w.length).map(h => this.reading.text.slice(h.s, h.t)))].slice(0, 2).map(q => `“${q}”`);
    const a = r.top[0], lines = [];
    const qa = quotes(a);
    const unsure = r.scores[a] < .35;
    const lw = LEVELS[a][r.level];
    lines.push(`${unsure ? "hmm, this one's mixed, so I'm not totally sure. my best guess is" : "hmm. you seem"} ${unsure ? EMOTIONS[a].short : (r.level === 0 ? "a little " : r.level === 2 ? "really " : "") + lw}${qa.length ? `, because of words like ${qa.join(", ")}.` : `. it's more in how you wrote it than any one word.`}`);
    const more = r.top.slice(1).filter(e => r.scores[e] >= .03 && r.notes.some(h => h.e === e && !h.negated)).slice(0, 2);
    const neg = r.notes.find(h => h.negated);
    if (neg) more.push(null);
    more.forEach((e, i) => e ? lines.push(`${i ? "and maybe" : "but you also seem"} ${EMOTIONS[e].seem}, from ${quotes(e).join(", ")}.`) : lines.push(`and I noticed you said “${esc(this.reading.text.slice(neg.s - 0, neg.t))}” with a “not” in front, so I didn't count it.`));
    lines.push(r.level === 2 ? "it reads strong to me, not a small feeling." : r.level === 0 ? "it reads soft, more of an undertone." : "");
    lines.push("now, choose the colors you associate with this entry, and how strong they feel.");
    return lines;
  },
  async say(lines){
    const el = document.getElementById("say");
    el.innerHTML = `<div class="say-who"><img src="${ASSETS.gIcon}" alt="">your barista</div><p id="sayP"></p>`;
    const p = document.getElementById("sayP");
    for (const line of lines){
      for (const ch of line + " "){ p.textContent += ch; await new Promise(res => setTimeout(res, 16)); }
      await new Promise(res => setTimeout(res, 350));
    }
  },
  drawColors(){
    const pours = this.pours ?? [], n = pours.length;
    const pk = {}; (this.picks ?? []).forEach(([e, l]) => { const w = LEVELS[e][l]; pk[w] = pk[w] ? [e, pk[w][1] + 1] : [e, 1]; });
    document.getElementById("picked").innerHTML = Object.entries(pk).map(([w, [e, c]]) => `<span style="--c:${EMOTIONS[e].color}"><i></i>${w}${c > 1 ? " ×" + c : ""}</span>`).join("");
    document.getElementById("blend").disabled = !n;
    const fill = document.querySelector("#cBottle .b-fill"); if (!fill) return;
    fill.style.transition = "height .7s cubic-bezier(.3,1.4,.5,1)";
    fill.style.height = (12 + Math.min(1, n / 8) * 77) + "%";
    const col = k => EMOTIONS[k].color === "#E9822A" ? "#EDB04A" : EMOTIONS[k].color;
    // each pour is a soft blob; together they blend into one mixed color
    const spots = [[30, 80], [70, 65], [45, 40], [75, 90], [20, 50], [60, 20], [35, 15], [80, 40]];
    const tot = Object.values(this.colors).reduce((a, b) => a + b, 0);
    const base = Object.entries(this.colors).sort((a, b) => b[1] - a[1]).map(([k, c]) => col(k));
    fill.style.background = n ? [...pours.map((k, i) => { const [x, y] = spots[i % spots.length], c = col(k); return `radial-gradient(ellipse at ${x}% ${y}%, ${c} 0%, ${c}00 ${45 + (this.colors[k] / tot) * 30}%)`; }),
      `linear-gradient(160deg, ${base.length > 1 ? base.join(", ") : base[0] + "," + base[0]})`].join(", ") : "";
    fill.style.filter = n ? "saturate(.9)" : "";
    const dom = n ? Object.entries(this.colors).sort((a, b) => b[1] - a[1])[0][0] : null;
    document.getElementById("pours").textContent = `(${n})`;
    document.getElementById("cHint").textContent = n ? (n >= 8 ? "full!" : `mostly ${EMOTIONS[dom].short}`) : "";
    document.getElementById("cCap").textContent = n ? "" : "tap a color";
    document.getElementById("cPanel").style.background = n ? `radial-gradient(ellipse at 50% 80%, ${col(dom)}33 0%, #F3F2EC 70%)` : "#F3F2EC";
  },
  pourColor(k, btn){
    const panel = document.getElementById("cPanel"), bottle = document.getElementById("cBottle");
    const pr = panel.getBoundingClientRect(), br = bottle.getBoundingClientRect();
    const c = EMOTIONS[k].swatch ?? EMOTIONS[k].color;
    const drop = document.createElement("div"); drop.className = "drop"; drop.style.background = c;
    const x = br.left - pr.left + br.width / 2 - 12; drop.style.left = x + "px"; panel.appendChild(drop);
    drop.animate([{ transform: `translate(${(Math.random() - .5) * 90}px,-30px) scale(.6)`, opacity: 0 }, { transform: "translate(0,14px) scale(1)", opacity: 1, offset: .25 },
      { transform: `translate(0,${br.top - pr.top + br.height * .25}px) scale(.5,.9)`, opacity: 1 }], { duration: 600, easing: "cubic-bezier(.5,0,.9,.4)" }).onfinish = () => {
      drop.remove(); this.drawColors();
      bottle.animate([{ transform: "rotate(0)" }, { transform: "rotate(-4deg)" }, { transform: "rotate(3deg)" }, { transform: "rotate(0)" }], { duration: 400 });
    };
  },
  // what other people picked when their words sounded like this
  colorHint(e){
    const log = LS.get("ginjan-colorlog", []).filter(x => x.read === e);
    if (!log.length) return `nobody whose entry sounded ${EMOTIONS[e].short} has picked colors yet. yours will teach the barista.`;
    const tally = {}; log.forEach(x => Object.entries(x.colors).forEach(([k, n]) => tally[k] = (tally[k] || 0) + n));
    const tot = Object.values(tally).reduce((a, b) => a + b, 0);
    return `people whose entries sounded ${EMOTIONS[e].short} picked: ` + Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `<span><i style="background:${EMOTIONS[k].swatch ?? EMOTIONS[k].color}"></i>${EMOTIONS[k].cname} ${Math.round(n / tot * 100)}%</span>`).join("") + ` <em>(${log.length} order${log.length === 1 ? "" : "s"})</em>`;
  },
  // words pick the drink, colors add the twist
  async blend(){
    const $ = id => document.getElementById(id), r = this.reading;
    const e = r.top[0], colorTop = Object.entries(this.colors).sort((a, b) => b[1] - a[1])[0][0];
    const clog = LS.get("ginjan-colorlog", []); clog.push({ read: e, colors: { ...this.colors }, date: Date.now() }); LS.set("ginjan-colorlog", clog.slice(-300));
    this.emotion = e; this.colorTop = colorTop; this.menuPick = MENU.indexOf(menuFor(e));
    this.base = copyR(menuFor(e).r); this.twist = null;
    if (colorTop !== e){ this.twist = EMOTIONS[colorTop].extra; FREEBIES.find(f => f.k === this.twist).add(this.base); }
    // strength: what the words said, nudged by the strength you tapped
    const wheelLvl = (this.picks ?? []).filter(([k]) => k === e).map(([, l]) => l);
    this.level = wheelLvl.length ? Math.round((r.level + wheelLvl.reduce((a, b) => a + b, 0) / wheelLvl.length) / 2) : r.level;
    this.strongAdj = null;
    if (this.level === 2){ INTENSITY[e].strong(this.base); this.strongAdj = INTENSITY[e].why; }
    if (this.level === 0){ this.base.ginger = Math.max(1, this.base.ginger - 1); this.strongAdj = "a little softer, for a softer feeling"; }
    this.cart = { ginger: 0, sugar: 0, addins: [] };
    $("agree").innerHTML = `<span><i style="background:${EMOTIONS[e].color}"></i>your words: ${LEVELS[e][this.level]}</span><span><i style="background:${EMOTIONS[colorTop].swatch ?? EMOTIONS[colorTop].color}"></i>your colors: ${EMOTIONS[colorTop].short}</span><em>${colorTop === e ? "they agree." : "a blend of both."}</em>`;
    this.setTitle();
    $("steps").innerHTML = ""; $("freeNote").textContent = ""; $("make").disabled = true;
    document.querySelector("#s6 .shop3").classList.add("building");
    this.go("s6"); this.drawCart();
    await this.build(this.base);
    document.querySelector("#s6 .shop3").classList.remove("building");
    $("freeNote").textContent = "change anything. up to 2 extras are on the house today.";
    $("make").disabled = false;
  },
  setTitle(){
    const m = MENU[this.menuPick], e = this.emotion, mine = m === menuFor(e);
    document.getElementById("drinkName").textContent = m.name === "the o.g." ? "the o.g., mom's recipe" : m.name;
    document.getElementById("drinkWhy").textContent = (mine && this.strongAdj ? this.strongAdj + ". " : "") + (mine ? (this.twist ? `${EMOTIONS[e].because}, with ${FREEBIES.find(f => f.k === this.twist).label} from your ${EMOTIONS[this.colorTop].cname}.` : `${EMOTIONS[e].because}. your colors felt the same way.`) : `you picked this one from the menu. ${m.sub}.`);
    document.querySelectorAll("[data-menu2]").forEach(b => b.classList.toggle("on", +b.dataset.menu2 === this.menuPick));
  },
  // the barista adds each ingredient, one call at a time
  async build(r){
    const $ = id => document.getElementById(id), e = this.emotion;
    const seq = [...(r.ginger ? [["ginger", r.ginger]] : []), ...r.addins.map(a => [a, 1]), ...(r.sugar ? [["sugar", r.sugar]] : [])];
    for (const [k, n] of seq){
      const why = k === this.twist ? `from your colors (${EMOTIONS[this.colorTop].short})` : `${EMOTIONS[e].short} · ${EMOTIONS[e].drink === "the o.g." ? "mom's recipe" : EMOTIONS[e].drink}`;
      $("steps").insertAdjacentHTML("beforeend", `<div class="call"><code>add(${k}${n > 1 ? ", " + n : ""})</code><span>✓</span><em>${why}</em></div>`);
      for (let i = 0; i < n; i++){
        if (k === "ginger" || k === "sugar") this.cart[k]++; else this.cart.addins.push(k);
        this.drawCart(k); await new Promise(res => setTimeout(res, 260));
      }
      await new Promise(res => setTimeout(res, 200));
    }
  },
  extrasUsed(){ const u = units(this.cart), b = units(this.base); return ALL_KEYS.reduce((t, k) => t + Math.max(0, (u[k] || 0) - (b[k] || 0)), 0); },
  addFree(k){
    if (this.extrasUsed() >= 2){ document.getElementById("freeNote").textContent = "that's your 2 free extras. remove one to swap."; return this.bump(k); }
    const c = this.cart;
    if (k === "ginger" || k === "sugar"){ if (c[k] >= 5) return this.bump(k); c[k]++; } else if (c.addins.includes(k)) return this.bump(k); else c.addins.push(k);
    document.getElementById("freeNote").textContent = `${2 - this.extrasUsed()} free extra${2 - this.extrasUsed() === 1 ? "" : "s"} left.`;
    this.drawCart(k);
  },
  removeOne(k){
    const c = this.cart;
    if (k === "ginger" || k === "sugar") c[k] = Math.max(0, c[k] - 1); else c.addins = c.addins.filter(x => x !== k);
    this.drawCart();
  },
  async switchDrink(i){
    if (document.querySelector("#s6 .shop3").classList.contains("building")) return;
    this.menuPick = i; this.base = copyR(MENU[i].r); this.twist = null; this.cart = { ginger: 0, sugar: 0, addins: [] };
    this.setTitle(); document.getElementById("steps").innerHTML = ""; this.drawCart();
    document.querySelector("#s6 .shop3").classList.add("building");
    await this.build(this.base);
    document.querySelector("#s6 .shop3").classList.remove("building");
  },
  bump(k){ document.querySelector(`.prod[data-k="${k}"]`)?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 220 }); },
  drawCart(fresh){
    const c = this.cart, count = c.ginger + c.sugar + c.addins.length, panel = document.getElementById("cpanel");
    panel.style.background = count ? gradientBG(c) : "#F3F2EC";
    panel.innerHTML = bottleHTML({ r: c, items: jarItems(c), level: Math.min(1, .15 + count * .09), capped: false, labeled: true, w: document.body.classList.contains("appview") ? 120 : 160 })
      + (fresh ? `<svg class="mx-drop" viewBox="0 0 50 50">${iconOf(fresh)}</svg>` : "");
    const b = units(this.base ?? c), u = units(c), rows = [];
    ALL_KEYS.forEach(k => { if (u[k]) rows.push([k, u[k], Math.max(0, u[k] - (b[k] || 0))]); });
    document.getElementById("lines").innerHTML = rows.map(([k, n, extra]) => `<div class="line ${k === fresh ? "fresh" : ""}"><svg viewBox="0 0 50 50">${iconOf(k)}</svg>${PRODUCTS[k].name}${n > 1 ? " ×" + n : ""}<div class="line-price">${extra ? "+" + extra + " free" : "in the recipe"}</div></div>`).join("");
    document.getElementById("count").textContent = `(${count})`;
    document.getElementById("total").textContent = money(Stand.total(this.base ?? c));
    for (const k of ALL_KEYS){
      document.getElementById("pn-" + k).textContent = u[k] ? "×" + u[k] : "";
      document.querySelector(`.prod[data-k="${k}"]`).classList.toggle("on", !!u[k]);
    }
  },

  // what goes in the mixer, one by one
  async pour(r){
    const seq = [...(r.ginger ? [["ginger", r.ginger]] : []), ...r.addins.map(a => [a, 1]), ...(r.sugar ? [["sugar", r.sugar]] : [])];
    const now = { ginger: 0, sugar: 0, addins: [] }, list = document.getElementById("mxList");
    for (const [k, n] of seq){
      if (k === "ginger" || k === "sugar") now[k] = n; else now.addins.push(k);
      const row = document.createElement("div"); row.className = "mx-row";
      row.innerHTML = `<svg viewBox="0 0 50 50">${iconOf(k)}</svg><span>${PRODUCTS[k].name}${n > 1 ? " ×" + n : ""}</span>`;
      list.appendChild(row);
      this.drawBottle(now, k);
      await new Promise(res => setTimeout(res, 520));
    }
  },
  drawBottle(r, fresh){
    const count = r.ginger + r.sugar + r.addins.length, el = document.getElementById("mxBottle");
    el.innerHTML = bottleHTML({ r, items: jarItems(r), level: Math.min(1, .15 + count * .09), capped: false, labeled: true, w: 150 })
      + (fresh ? `<svg class="mx-drop" viewBox="0 0 50 50">${iconOf(fresh)}</svg>` : "");
    el.parentElement.style.background = count ? gradientBG(r) : "#F3F2EC";
  },
  drawFreebies(){
    const e = this.emotion;
    document.getElementById("chips").innerHTML = FREEBIES.map(f => `<button class="chip ${this.freebies.includes(f.k) ? "on" : ""} ${EMOTIONS[e].extra === f.k ? "sug" : ""}" data-free="${f.k}">
      <svg viewBox="0 0 50 50">${iconOf(f.k)}</svg>${f.label}${EMOTIONS[e].extra === f.k ? "<em>the barista suggests</em>" : ""}</button>`).join("");
    document.querySelectorAll("[data-free]").forEach(b => b.onclick = () => {
      const k = b.dataset.free;
      if (this.freebies.includes(k)) this.freebies = this.freebies.filter(x => x !== k);
      else if (this.freebies.length < 2) this.freebies.push(k);
      else return b.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 200 });
      const r = copyR(this.recipe); this.freebies.forEach(f => FREEBIES.find(x => x.k === f).add(r));
      this.drawBottle(r, this.freebies.includes(k) ? k : null);
      this.drawFreebies();
    });
  },
  final(){ return copyR(this.cart); },

  // ---------- made slowly, then the receipt ----------
  async make(){
    const r = this.final(), e = this.emotion, $ = id => document.getElementById(id);
    // bottle it on the shelf
    const jars = LS.get("ginjan-jars", []);
    jars.push({ e, t: this.reading.text, r, drink: MENU[this.menuPick].name, colors: this.colors, scores: this.reading.scores, date: Date.now() });
    LS.set("ginjan-jars", jars.slice(-40));
    this.drawReceipt(r);
    $("readyBottle").innerHTML = bottleHTML({ r, items: jarItems(r), level: .85, capped: false, labeled: true, w: 150 });
    document.querySelector(".table-side").classList.add("waiting");
    $("printer").classList.remove("done"); $("rclip").classList.remove("torn");
    const clip = $("rclip"), rec = $("receipt");
    clip.style.height = "0px";
    this.go("s3");
    await new Promise(res => setTimeout(res, 500));
    $("printer").classList.add("printing");
    // print line by line
    const rows = [...rec.children];
    for (const row of rows){
      clip.style.height = (row.offsetTop + row.offsetHeight + 8) + "px";
      await new Promise(res => setTimeout(res, row.classList.contains("r-dash") ? 90 : 170));
    }
    clip.style.height = rec.offsetHeight + "px";
    await new Promise(res => setTimeout(res, 350));
    // tear it off, it drops onto the table
    $("printer").classList.remove("printing"); $("printer").classList.add("done");
    clip.classList.add("torn");
    document.querySelector(".table-side").classList.remove("waiting");
  },

  drawReceipt(r){
    const e = this.emotion, m = MENU[this.menuPick], rd = this.reading, now = new Date();
    const base = copyR(m.r), rows = [];
    rows.push(["1", m.name === "the o.g." ? "the o.g. (mom's recipe)" : m.name, Stand.total(base), m === menuFor(e) ? EMOTIONS[e].because + (this.strongAdj ? ", " + this.strongAdj : "") : "your pick from the menu"]);
    const ub = units(this.base), uc = units(r), um = units(base);
    if (this.twist && uc[this.twist]) rows.push(["1", FREEBIES.find(x => x.k === this.twist).label, 0, `a twist from your colors (${EMOTIONS[this.colorTop].cname})`]);
    ALL_KEYS.forEach(k => { const extra = (uc[k] || 0) - (ub[k] || 0); if (extra > 0) rows.push([extra, PRODUCTS[k].name, 0, "on the house, to cheer you up"]); if (extra < 0 && (um[k] || 0)) rows.push(["", "less " + PRODUCTS[k].name, 0, "your call"]); });
    const tax = Stand.total(base) * .08875, tot = Stand.total(base) + tax;
    const clues = rd.hits.filter(h => h.e === e).sort((x, y) => (y.kind === "phrase") - (x.kind === "phrase") || y.w.length - x.w.length).map(h => rd.text.slice(h.s, h.t));
    const quote = rd.text.length > 150 ? rd.text.slice(0, 150) + "…" : rd.text;
    document.getElementById("receipt").innerHTML = `
      <img class="r-logo" src="${ASSETS.wordmark}" alt="GINJAN"><div class="r-sub">GINGER JUICE CAFÉ</div>
      <div class="r-meta"><span>Order: ${String(100000 + Math.floor(Math.random() * 900000))}<br>Table: your journal<br>Barista: the machine</span><span style="text-align:right">${now.toLocaleDateString("en-US")}<br>${now.toLocaleTimeString("en-US")}</span></div>
      <div class="r-label">what's on your mind today?</div>
      <div class="r-words" style="text-align:left">“${esc(quote)}”</div>
      <div class="r-dash"></div>
      <div class="r-label">read as</div>
      ${rd.top.slice(0, 3).map((k, i) => `<div class="r-row"><span>${i ? EMOTIONS[k].short : LEVELS[k][this.level ?? rd.level] + " (" + EMOTIONS[k].short + ")"}</span><span>${Math.round(rd.scores[k] * 100)}%</span></div>`).join("")}
      ${clues.length ? `<div class="r-why">because you wrote: ${clues.slice(0, 4).map(c => `“${esc(c)}”`).join(", ")}</div>` : ""}
      <div class="r-label" style="margin-top:10px">your colors</div>
      <div class="r-strip">${Object.entries(this.colors).map(([k, n]) => `<span style="flex:${n};background:${EMOTIONS[k].swatch ?? EMOTIONS[k].color}"></span>`).join("")}</div>
      <div class="r-dash"></div>
      <div class="r-items">${rows.map(([q, n, p, why]) => `
        <div class="r-row"><span>${q} ${n}</span><span>${p ? "$" + p.toFixed(2) : "FREE"}</span></div>
        <div class="r-why">${why}</div>`).join("")}</div>
      <div class="r-dash"></div>
      <div class="r-row"><span>Sub Total</span><span>$${Stand.total(base).toFixed(2)}</span></div>
      <div class="r-row"><span>Sales Tax</span><span>$${tax.toFixed(2)}</span></div>
      <div class="r-row r-paid"><span>Paid</span><span>$${tot.toFixed(2)}</span></div>
      <img class="r-g" src="${ASSETS.gIcon}" alt="">
      <div class="r-note">${EMOTIONS[e].note}</div>
      <div class="r-thanks">— your barista</div>
      <div class="r-bc">${barcode()}</div>
      <div class="r-thanks">your day is on the shelf now.</div>`;
  },

  // ---------- the shelf ----------
  drawShelf(){
    const all = shelfJars(); this.jars = all;
    const show = all.map((j, i) => [j, i]).filter(([j]) => !this.filter || j.e === this.filter);
    document.getElementById("filters").innerHTML = EMO_KEYS.map(e => `<button class="fchip ${this.filter === e ? "on" : ""}" data-filter="${e}"><i style="background:${EMOTIONS[e].color}"></i>${EMOTIONS[e].short} <span>${all.filter(j => j.e === e).length}</span></button>`).join("");
    const per = document.body.classList.contains("appview") ? 3 : 7, rows = [];
    for (let i = 0; i < show.length; i += per) rows.push(show.slice(i, i + per));
    document.getElementById("shelves").innerHTML = rows.map(row => `<div class="shelf-row">${row.map(([j, i]) => jarHTML(j, i)).join("")}</div>`).join("");
  },
  openJar(i){
    const j = this.jars[i], rd = Brain.read(j.t), card = document.getElementById("jarCard");
    const who = j.who === "you" ? "you" : "a customer";
    card.innerHTML = `<button class="x" data-close>×</button>
      <div class="jc-top">${jarHTML(j, i)}<div><div class="tag">${who}${j.date ? " · " + new Date(j.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</div>
      <div class="title">${j.drink}</div><div class="jc-e"><i style="background:${EMOTIONS[j.e].color}"></i>${EMOTIONS[j.e].label}</div></div></div>
      <div class="tag">what's on your mind today?</div>
      <p class="jc-text">${highlight(j.t, rd.notes)}</p>
      <div class="tag">the barista heard</div>
      <div class="bars">${bars(rd.scores)}</div>`;
    document.getElementById("jarModal").classList.add("show");
  },

  // ---------- training ----------
  drawMatrix(){
    const log = LS.get("ginjan-colorlog", []);
    const cell = (e, k) => log.filter(x => x.read === e).reduce((t, x) => t + (x.colors[k] || 0), 0);
    const max = Math.max(1, ...EMO_KEYS.flatMap(e => EMO_KEYS.map(k => cell(e, k))));
    document.getElementById("cmatrix").innerHTML = `<div class="eyebrow">what the colors are teaching it · ${log.length} order${log.length === 1 ? "" : "s"} so far</div>
      <p class="why" style="font-size:12.5px;margin:2px 0 8px">Rows are how the words sounded. Columns are the colors people picked for them. Darker = picked more often.</p>
      <table><tr><th></th>${EMO_KEYS.map(k => `<th><i style="background:${EMOTIONS[k].swatch ?? EMOTIONS[k].color}"></i>${EMOTIONS[k].cname}</th>`).join("")}</tr>
      ${EMO_KEYS.map(e => `<tr><td>${EMOTIONS[e].short}</td>${EMO_KEYS.map(k => { const n = cell(e, k); return `<td style="background:${n ? `color-mix(in srgb,${EMOTIONS[k].color} ${Math.round(15 + 70 * n / max)}%,#fff)` : "#fff"}">${n || ""}</td>`; }).join("")}</tr>`).join("")}</table>`;
  },
  drawTraining(){
    this.drawMatrix();
    document.getElementById("trainCols").innerHTML = EMO_KEYS.map(e => {
      const items = Brain.data.filter(d => d.e === e);
      const lw = Brain.learned(e);
      return `<div class="tcol"><div class="tc-head" style="--c:${EMOTIONS[e].color}"><b>${EMOTIONS[e].label}</b><span>${items.length} entries → ${EMOTIONS[e].drink}</span></div>
        <div class="tc-ladder">${LEVELS[e].map((w, i) => `<span style="--c:${EMOTIONS[e].color};--a:${[30, 60, 100][i]}%">${w}</span>`).join("<b>→</b>")}</div>
        <div class="tc-learned"><div class="eyebrow">words it learned</div>${lw.length ? lw.map(x => `<span style="--c:${EMOTIONS[e].color}">${x.w} <i>${x.n}/${x.of}</i></span>`).join("") : `<em>not enough entries yet</em>`}</div>
        <div class="tc-learned"><div class="eyebrow">keywords given</div>${EMOTIONS[e].keywords.slice(0, 8).map(k => `<span class="kw">${k}</span>`).join("")}</div>
        ${items.map(d => `<div class="tc-item ${d.src}">${highlight(d.t, Brain.matches(d.t).filter(h => h.kind === "phrase"))}</div>`).join("")}
        <div class="tc-gen"><div class="eyebrow">the ${EMOTIONS[e].short} chain writes:</div><p>${esc(Brain.write(e, 2))}</p></div></div>`;
    }).join("");
  },
  addTraining(){
    const t = document.getElementById("newT").value.trim(); if (words(t).length < 5) return;
    const list = LS.get("ginjan-training", []);
    list.push({ e: document.getElementById("newE").value, t, clues: document.getElementById("newC").value.split(",").map(s => s.trim()).filter(Boolean).map(c => { const [p, m] = c.split(":").map(x => x.trim()); return m && EMOTIONS[m] ? { p, e: m } : p; }) });
    LS.set("ginjan-training", list);
    document.getElementById("newT").value = ""; document.getElementById("newC").value = ""; document.getElementById("qwenOut").textContent = "added. the barista retrained on " + (Brain.data.length + 1) + " entries.";
    Brain.train(); this.drawTraining();
  },
  // optional: the local model suggests a label + clue phrases; you decide whether to keep them
  async askQwen(){
    const t = document.getElementById("newT").value.trim(), out = document.getElementById("qwenOut");
    if (typeof LLM === "undefined" || !LLM.model){ out.textContent = "connect the Llama app first (about the machine → connect)."; return; }
    if (!t){ out.textContent = "paste an entry first."; return; }
    out.textContent = "asking Qwen…";
    const examples = CORPUS.slice(0, 8).map(d => `"${d.t}" -> {"emotion":"${d.e}","clues":${JSON.stringify(d.clues)}}`).join("\n");
    const msg = await LLM.chat([
      { role: "system", content: `You label journal entries for a cafe. Emotions: ${EMO_KEYS.join(", ")}. Reply with JSON only: {"emotion": one of those, "clues": [2-3 short exact phrases copied from the entry that show the feeling]}.` },
      { role: "user", content: `Examples:\n${examples}\n\nEntry: "${t}"` }], { max_tokens: 120 }, "qwen · label");
    const j = parseJSON(msg?.content ?? "");
    if (!j?.emotion || !EMOTIONS[j.emotion]){ out.textContent = "Qwen's answer didn't parse. label it yourself."; return; }
    document.getElementById("newE").value = j.emotion;
    document.getElementById("newC").value = (j.clues ?? []).filter(c => t.toLowerCase().includes(String(c).toLowerCase())).join(", ");
    out.textContent = `Qwen says: ${j.emotion}. check it, then add to training.`;
  },
};
