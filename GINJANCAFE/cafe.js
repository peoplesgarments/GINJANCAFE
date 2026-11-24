// The GINJAN café, drawn flat with black linework (behind every screen).
// Things that matter sit along the edges so they peek out around the store panel;
// on the receipt screen the panel goes away and you see the whole café, receipt on the table.
const CAFE_SVG = (() => {
  const K = "#1E1E1E", RED = "#B41A27", CORN = "#E2DA8A", CEL = "#CCC54A", ORCH = "#9C7389", AME = "#855572", SNOW = "#F3F2EC", PORT = "#562528";
  const sw = `stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const bottle = (x, y, s, liquid, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><use href="#gbody" fill="#EEF1EE"/><g clip-path="url(#gclip)"><rect x="-5" y="58" width="70" height="70" fill="${liquid}"/></g><use href="#gbody" fill="none" ${sw}/><text x="30" y="92" font-family="Arial" font-weight="900" font-size="8" fill="#fff" text-anchor="middle">GINJAN</text></g>`;
  // tiles on the lower wall
  let tiles = "";
  for (let x = 0; x <= 1600; x += 48) tiles += `<line x1="${x}" y1="585" x2="${x}" y2="1000" stroke="#fff" stroke-width="3"/>`;
  for (let y = 585; y <= 1000; y += 48) tiles += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="#fff" stroke-width="3"/>`;
  // checker trim
  let check = "";
  for (let x = 0, i = 0; x < 1600; x += 14, i++){ check += `<rect x="${x}" y="${i % 2 ? 562 : 570}" width="14" height="8" fill="${K}"/>`; }
  // wallpaper sprigs (tiny ginger leaves)
  let sprigs = "";
  for (let y = 40; y < 540; y += 70) for (let x = (y / 70 % 2) * 45; x < 1600; x += 90)
    sprigs += `<path d="M${x} ${y} q6 -10 12 0 q-6 10 -12 0z" fill="${CEL}" opacity=".55"/>`;
  // calendar day
  const now = new Date(), MON = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(), DAY = now.getDate();
  return `<svg class="cafe" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <path id="gbody" d="M22 0 h16 v10 q0 4 3 8 v14 c14 10 19 30 19 52 c0 22 -12 36 -30 36 c-18 0 -30 -14 -30 -36 c0 -22 5 -42 19 -52 v-14 q3 -4 3 -8 z"/>
    <clipPath id="gclip"><use href="#gbody"/></clipPath>
  </defs>

  <!-- walls -->
  <rect width="1600" height="570" fill="#F1E9C2"/>
  ${sprigs}
  <rect y="570" width="1600" height="430" fill="#E7C3CF"/>
  ${tiles}
  <rect y="556" width="1600" height="30" fill="${SNOW}"/>${check}
  <line x1="0" y1="556" x2="1600" y2="556" ${sw}/><line x1="0" y1="586" x2="1600" y2="586" ${sw}/>

  <!-- left: calendar, shelf of bottles -->
  <g transform="translate(52 96)">
    <line x1="58" y1="-14" x2="58" y2="4" ${sw}/><circle cx="58" cy="-16" r="5" fill="${CORN}" ${sw}/>
    <rect width="116" height="150" fill="#fff" ${sw}/><rect width="116" height="40" fill="${RED}" ${sw}/>
    <text x="58" y="28" font-family="Arial" font-weight="900" font-size="20" fill="#fff" text-anchor="middle">${MON}</text>
    <text x="58" y="110" font-family="Arial" font-weight="900" font-size="64" fill="${K}" text-anchor="middle">${DAY}</text>
    ${[0,1,2,3,4,5].map(i => `<line x1="${14 + i * 18}" y1="126" x2="${14 + i * 18}" y2="140" stroke="${K}" stroke-width="2"/>`).join("")}
  </g>
  <g>
    <rect x="18" y="402" width="210" height="14" fill="${PORT}" ${sw}/>
    <path d="M40 416 l14 26 M206 416 l-14 26" ${sw}/>
    <!-- books -->
    <rect x="28" y="318" width="16" height="84" fill="${RED}" ${sw}/><rect x="44" y="328" width="14" height="74" fill="${CORN}" ${sw}/>
    <rect x="58" y="312" width="18" height="90" fill="${AME}" ${sw}/><rect x="76" y="332" width="12" height="70" fill="${SNOW}" ${sw}/>
    <rect x="90" y="330" width="16" height="72" fill="${CEL}" ${sw} transform="rotate(14 106 402)"/>
    <line x1="62" y1="330" x2="72" y2="330" stroke="${SNOW}" stroke-width="2"/><line x1="31" y1="338" x2="41" y2="338" stroke="${SNOW}" stroke-width="2"/>
    <!-- a dotted ceramic vase -->
    <path d="M132 402 c-14 -4 -18 -30 -8 -44 c4 -6 4 -12 2 -18 h20 c-2 6 -2 12 2 18 c10 14 6 40 -8 44 z" fill="#E7C3CF" ${sw}/>
    ${[0,1,2,3].map(i => `<circle cx="${130 + (i % 2) * 8}" cy="${362 + i * 9}" r="2.6" fill="${RED}"/>`).join("")}
    <path d="M136 340 q-6 -24 -16 -32 M136 340 q4 -26 14 -34" fill="none" ${sw}/><circle cx="120" cy="306" r="6" fill="${CORN}" ${sw}/><circle cx="150" cy="304" r="6" fill="${SNOW}" ${sw}/>
    <!-- a plant in a striped pot -->
    <path d="M168 402 l-6 -36 h50 l-6 36 z" fill="${SNOW}" ${sw}/><path d="M164 378 h46 M166 390 h42" stroke="${PORT}" stroke-width="2.5"/>
    <path d="M187 366 c-26 -14 -30 -40 -24 -52 c14 8 22 26 24 52z" fill="${CEL}" ${sw}/><path d="M187 366 c4 -30 18 -46 30 -50 c2 16 -10 38 -30 50z" fill="#8DAA4A" ${sw}/><path d="M187 366 c-4 -34 2 -54 6 -62 c8 14 6 40 -6 62z" fill="${CEL}" ${sw}/>
  </g>

  <!-- pendant lamps -->
  <g class="lamp" style="transform-origin:300px 0">
    <line x1="300" y1="0" x2="300" y2="96" ${sw}/>
    <path d="M250 140 q50 -60 100 0 z" fill="${RED}" ${sw}/><ellipse cx="300" cy="142" rx="14" ry="6" fill="${CORN}" ${sw}/>
    <path d="M262 150 L210 330 L390 330 L338 150 Z" fill="${CORN}" opacity=".22"/>
  </g>
  <g class="lamp lamp2" style="transform-origin:1290px 0">
    <line x1="1290" y1="0" x2="1290" y2="70" ${sw}/>
    <path d="M1245 112 q45 -60 90 0 z" fill="${CEL}" ${sw}/><ellipse cx="1290" cy="114" rx="12" ry="5" fill="${CORN}" ${sw}/>
    <path d="M1255 122 L1205 300 L1375 300 L1325 122 Z" fill="${CORN}" opacity=".22"/>
  </g>

  <!-- center-left: framed ginger -->
  <g transform="translate(350 190)">
    <rect width="190" height="210" fill="${PORT}" ${sw}/><rect x="16" y="16" width="158" height="178" fill="${SNOW}" ${sw}/>
    <path d="M60 130 c-20 -6 -22 -34 0 -38 c4 -22 34 -26 40 -6 c22 -4 34 18 20 32 c10 20 -12 36 -28 24 c-12 14 -36 4 -32 -12z" fill="#D9B46A" ${sw}/>
    <path d="M100 86 q-4 -30 10 -50 M104 70 q14 -10 24 -6" ${sw} fill="none"/><path d="M110 36 q16 -8 22 4 q-14 8 -22 -4z" fill="${CEL}" ${sw}/>
    <text x="95" y="178" font-family="Arial" font-weight="700" font-size="13" fill="${K}" text-anchor="middle">ginger, from home</text>
  </g>

  <!-- center: the menu board -->
  <g transform="translate(600 110)">
    <rect width="400" height="360" rx="6" fill="${PORT}" ${sw}/>
    <rect x="14" y="14" width="372" height="332" rx="3" fill="none" stroke="${CORN}" stroke-width="2"/>
    <text x="200" y="74" font-family="Arial" font-weight="900" font-size="46" letter-spacing="2" fill="${SNOW}" text-anchor="middle">GINJAN</text>
    <text x="200" y="100" font-family="Arial" font-size="13" letter-spacing="3" fill="${CORN}" text-anchor="middle">GINGER JUICE CAFÉ</text>
    ${["the o.g. · mom's recipe", "just ginger", "the fizzy one", "ginger + hibiscus", "ginger + orange", "mango + guava"].map((t, i) =>
      `<text x="200" y="${150 + i * 32}" font-family="Arial" font-weight="700" font-size="19" fill="${SNOW}" text-anchor="middle">${t}</text>`).join("")}
  </g>

  <!-- right: window -->
  <g transform="translate(1080 130)">
    <rect width="220" height="300" fill="#BFD7E8" ${sw}/>
    <circle cx="150" cy="90" r="34" fill="${CORN}" ${sw}/>
    <path d="M0 230 q60 -40 110 -10 q60 -40 110 0 v80 h-220z" fill="${CEL}" ${sw}/>
    <line x1="110" y1="0" x2="110" y2="300" ${sw}/><line x1="0" y1="150" x2="220" y2="150" ${sw}/>
    <rect x="-14" y="296" width="248" height="16" fill="${SNOW}" ${sw}/>
    <g transform="translate(160 246)"><rect x="-22" y="0" width="44" height="40" fill="${RED}" ${sw}/><path d="M0 0 c-30 -40 -10 -60 0 -70 c10 10 30 30 0 70z" fill="${CEL}" ${sw}/><path d="M0 0 c-34 -20 -40 -44 -36 -50 c12 4 30 20 36 50z" fill="${CEL}" ${sw}/></g>
  </g>

  <!-- right edge: clock + poster -->
  <g transform="translate(1490 160)">
    <circle r="66" fill="#fff" ${sw}/><circle r="56" fill="none" stroke="${RED}" stroke-width="4"/>
    ${[...Array(12)].map((_, i) => { const a = i * Math.PI / 6; return `<line x1="${Math.sin(a) * 44}" y1="${-Math.cos(a) * 44}" x2="${Math.sin(a) * 50}" y2="${-Math.cos(a) * 50}" stroke="${K}" stroke-width="${i % 3 ? 2 : 4}"/>`; }).join("")}
    <line class="hand-h" x1="0" y1="0" x2="0" y2="-26" stroke="${K}" stroke-width="5" stroke-linecap="round" style="transform:rotate(${(now.getHours() % 12) * 30 + now.getMinutes() / 2}deg)"/>
    <line class="hand-m" x1="0" y1="0" x2="0" y2="-40" stroke="${K}" stroke-width="3.5" stroke-linecap="round" style="transform:rotate(${now.getMinutes() * 6}deg)"/>
    <line class="hand-s" x1="0" y1="6" x2="0" y2="-46" stroke="${RED}" stroke-width="2" stroke-linecap="round"/>
    <circle r="5" fill="${K}"/>
  </g>
  <g transform="translate(1420 270)" class="tilt">
    <rect width="150" height="200" fill="${ORCH}" ${sw}/>
    <text x="75" y="44" font-family="Arial" font-weight="900" font-size="22" fill="#fff" text-anchor="middle">the fizzy</text>
    <text x="75" y="68" font-family="Arial" font-weight="900" font-size="22" fill="#fff" text-anchor="middle">one</text>
    ${bottle(45, 78, .9, CORN)}
    ${[0,1,2,3].map(i => `<circle cx="${28 + i * 30}" cy="${100 + (i % 2) * 30}" r="${5 + i % 2 * 3}" fill="none" stroke="#fff" stroke-width="2.5"/>`).join("")}
  </g>

  <!-- the table -->
  <path d="M90 790 L1510 790 L1600 1000 L0 1000 Z" fill="${RED}" ${sw}/>
  <path d="M90 790 L1510 790" stroke="#E25563" stroke-width="5" transform="translate(0 7)" opacity=".5"/>
  <!-- things on the table -->
  <g transform="translate(110 700)">
    <ellipse cx="50" cy="100" rx="58" ry="10" fill="rgba(30,30,30,.18)"/>
    <path d="M10 92 c-10 -40 10 -64 40 -64 c30 0 50 24 40 64 z" fill="${SNOW}" ${sw}/>
    <path d="M14 60 h72" stroke="${RED}" stroke-width="5"/><path d="M12 72 h76" stroke="${CORN}" stroke-width="5"/>
    <path d="M88 52 c18 -6 26 -24 32 -30" fill="none" ${sw}/><path d="M12 48 c-20 0 -22 30 -2 34" fill="none" ${sw}/>
    <ellipse cx="50" cy="28" rx="22" ry="7" fill="${SNOW}" ${sw}/><circle cx="50" cy="18" r="6" fill="${RED}" ${sw}/>
  </g>
  <g transform="translate(240 760)"><path d="M0 0 h40 l-4 36 h-32 z" fill="#E7C3CF" ${sw}/><path d="M40 8 c14 0 14 18 -2 18" fill="none" ${sw}/><circle cx="12" cy="16" r="3" fill="${RED}"/><circle cx="26" cy="22" r="3" fill="${RED}"/></g>
  <g transform="translate(330 770)"><ellipse cx="0" cy="40" rx="78" ry="26" fill="#fff" ${sw}/><ellipse cx="0" cy="38" rx="52" ry="15" fill="none" stroke="${ORCH}" stroke-width="2"/>
    <path d="M-30 36 c-14 -4 -12 -20 2 -20 c4 -12 22 -10 24 0 c14 -2 20 12 8 18 c2 12 -14 16 -20 8 c-6 6 -18 2 -14 -6z" fill="#D9B46A" ${sw}/></g>
  <g transform="translate(1250 700)">
    <path d="M0 0 h56 l-6 110 h-44 z" fill="#E9F0EE" ${sw}/><path d="M4 40 h48 l-4 66 h-40 z" fill="${CORN}"/><path d="M0 0 h56 l-6 110 h-44 z" fill="none" ${sw}/>
    <line x1="34" y1="-34" x2="26" y2="70" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>
    <g class="steam"><path d="M14 -20 q-10 -14 0 -28 q10 -14 0 -28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/><path d="M40 -26 q-10 -14 0 -28 q10 -14 0 -28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/></g>
  </g>
  <g transform="translate(1390 690)">
    <ellipse cx="40" cy="96" rx="42" ry="56" fill="${CORN}" ${sw}/>
    ${[0,1,2].map(r => [0,1,2].map(c => `<path d="M${18 + c * 22} ${64 + r * 26} l10 10 l-10 10 l-10 -10z" fill="none" stroke="#C9A83A" stroke-width="2"/>`).join("")).join("")}
    <path d="M40 42 c-20 -20 -24 -40 -18 -46 c10 8 16 24 18 46z M40 42 c4 -24 14 -40 22 -44 c2 14 -6 32 -22 44z M40 42 c-2 -26 2 -44 4 -52 c6 10 4 32 -4 52z" fill="${CEL}" ${sw}/>
  </g>
  <!-- the cat, under the table edge -->
  <path class="tail" d="M60 1000 c0 -60 -40 -70 -30 -120 c6 -26 34 -30 40 -12" fill="none" stroke="${K}" stroke-width="18" stroke-linecap="round" style="transform-origin:60px 1000px"/>
</svg>`;
})();
