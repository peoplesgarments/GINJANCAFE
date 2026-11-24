/* =========================================================
   Shared local-model helper (same setup as the Week 12 "Local Model APIs" workshop)
   Llama App: http://127.0.0.1:9931/v1 · Ollama: http://127.0.0.1:11434/v1
   GET /models to find Qwen, POST /chat/completions to talk to it.
   ========================================================= */
const LLM = {
  base: null, model: null, isLlamaApp: true,

  panel: () => `
    <div class="conn"><div class="muted" style="margin-bottom:6px">connect the local model</div>
      <span class="dot" id="dot"></span>
      <select id="app-select">
        <option value="http://127.0.0.1:9931/v1|llama">Llama App (port 9931)</option>
        <option value="http://127.0.0.1:8080/v1|llama">Llama App (port 8080)</option>
        <option value="http://127.0.0.1:11434/v1|ollama">Ollama (port 11434)</option>
      </select>
      <button class="btn" id="connect">find model</button>
      <div class="muted" id="status" style="margin-top:8px">not connected</div>
    </div>`,

  bind(){ document.getElementById("connect").onclick = () => this.connect(); this.connect(); },

  async connect(){
    const [url, kind] = document.getElementById("app-select").value.split("|");
    this.base = url; this.isLlamaApp = kind === "llama";
    const status = document.getElementById("status");
    status.textContent = "looking for models…";
    try {
      const res = await fetch(this.base + "/models");
      const { data: models } = await res.json();
      const chosen = models.find(m => /qwen/i.test(m.id) && m.status?.value === "loaded")
        ?? models.find(m => m.status?.value === "loaded") ?? models.find(m => /qwen/i.test(m.id)) ?? models[0];
      this.model = chosen?.id;
      if (!this.model) throw new Error("no models found");
      document.getElementById("dot").classList.add("on");
      status.textContent = "connected: " + this.model;
      const nm = document.querySelector(".nav-machine"); if (nm) nm.classList.add("live");
    } catch (e){
      this.model = null; document.getElementById("dot").classList.remove("on");
      status.textContent = `couldn't connect (${e.message}). Is the app open with Qwen loaded? Until then it falls back to the mood list.`;
    }
  },

  // send a full message list; returns the reply message object (content and/or tool_calls)
  async chat(messages, opts = {}, label = "qwen"){
    if (!this.model) return null;
    const body = { model: this.model, messages, max_tokens: opts.max_tokens ?? 220, temperature: opts.temperature ?? 0.8 };
    if (opts.tools){ body.tools = opts.tools; body.tool_choice = opts.tool_choice ?? "auto"; }
    if (this.isLlamaApp) body.thinking_budget_tokens = 0;
    const lastUser = [...messages].reverse().find(m => m.role === "user" || m.role === "tool");
    try {
      const res = await fetch(this.base + "/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? res.status);
      const msg = result.choices[0].message;
      Stand.log(label, lastUser?.content ?? "", (msg.content ?? "") + (msg.tool_calls ? "\nTOOL CALLS: " + JSON.stringify(msg.tool_calls.map(t => t.function)) : ""));
      return msg;
    } catch (e){ Stand.log(label + " error", lastUser?.content ?? "", e.message); return null; }
  },

  async ask(system, user, opts = {}, label){
    const msg = await this.chat([{ role: "system", content: system }, { role: "user", content: user }], opts, label);
    return msg?.content ?? null;
  },
};

// Small models don't always return clean JSON, so dig it out and check every field
function parseJSON(text){
  if (!text) return null;
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}
const clamp = (v, lo, hi, d) => { v = parseInt(v); return isNaN(v) ? d : Math.max(lo, Math.min(hi, v)); };
const ADDIN_ALIASES = { "sparkling water": "sparkling", "soda": "sparkling", "lime": "lemon", "sugar": "sugar", "cane sugar": "sugar", "ginger root": "ginger" };
const normKey = a => { a = String(a).toLowerCase().trim(); return ADDIN_ALIASES[a] ?? a; };
function cleanAddins(list){
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(normKey).filter(a => ADDIN_KEYS.includes(a)))].slice(0, 3);
}
function recipeFromJSON(j, d = { ginger: 3, sugar: 2 }){
  return { ginger: clamp(j.ginger, 1, 5, d.ginger), sugar: clamp(j.sugar, 0, 5, d.sugar), addins: cleanAddins(j.addins) };
}
function fallbackLabel(mood){
  const m = MOODS[mood] ?? MOODS.homesick;
  return { name: m.menu.replace(/^off-menu: /, ""), note: pick(m.copy), barista: "make it with care." };
}
