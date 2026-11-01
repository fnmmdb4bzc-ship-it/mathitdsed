/* Measure Arcade: live teacher and learner views. By Debby Smit Educational Therapy. */
"use strict";
const CFG = window.ARCADE_CONFIG;
const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: false } });
const app = document.getElementById("app");
const $ = id => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";

/* ---------- helpers ---------- */
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dec = v => { const w = Math.floor(v / 1000), r = v % 1000; return r ? w + "," + String(r).padStart(3, "0").replace(/0+$/, "") : String(w); };
const pad = n => String(n).padStart(2, "0");
const hm = t => `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
const dur = m => { const h = Math.floor(m / 60), r = m % 60; return h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`; };
const U = { mass: ["kg", "g"], cap: ["ℓ", "mℓ"] };
const nb = s => String(s).replace(/(\d) (?=[a-zA-Zℓ])/g, "$1 ");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rid = () => Math.random().toString(36).slice(2, 10);
function bigForm(v, c) { const [B, s] = U[c], k = Math.floor(v / 1000), g = v % 1000; return (k && g && Math.random() < .5) ? `${k} ${B} ${g} ${s}` : `${dec(v)} ${B}`; }
function anyForm(v, c) { const [B, s] = U[c]; return pick([`${dec(v)} ${B}`, `${fmt(v)} ${s}`, (v >= 1000 && v % 1000) ? `${Math.floor(v / 1000)} ${B} ${v % 1000} ${s}` : `${dec(v)} ${B}`]); }
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const ICON_PARCEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l9-4 9 4v10l-9 4-9-4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M3 7l9 4 9-4M12 11v10" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const GAME_NAMES = { bingo: "Measure Bingo", courier: "Courier Challenge", bakery: "Bakery Rush", train: "Beat the Train" };

/* ---------- session ---------- */
const SKEY = "measureArcadeSession";
function loadSes() { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } }
function saveSes(s) { try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); } catch (e) {} }
let ses = loadSes();
let room = null, players = [], me = null, channel = null, pollId = null, lastSig = "", offline = false;
let ui = {};          // learner screen-only values (typed answers, messages)
let tickId = null;

/* ---------- start screens ---------- */
function setChip() {
  const c = $("roomchip");
  if (ses && ses.code) { c.hidden = false; c.innerHTML = `Game code <b>${esc(ses.code)}</b>`; } else c.hidden = true;
}
function startScreen(msg) {
  stopAll(); ses = null; saveSes(null); setChip();
  app.innerHTML = `
  <div><h1>Welcome to Measure Arcade</h1><p class="sub">Grade 6 Term 4 measurement games: mass, capacity and time.</p></div>
  ${msg ? `<div class="offline">${esc(msg)}</div>` : ""}
  <div class="choices">
    <button class="choice" id="beT"><span class="tt">I'm the teacher</span><span class="td">Start a lesson, get a game code and choose the games.</span></button>
    <button class="choice alt" id="beL"><span class="tt">I'm a learner</span><span class="td">Type the code from your teacher's screen and your first name.</span></button>
  </div>`;
  $("beT").onclick = teacherSetup;
  $("beL").onclick = () => joinScreen();
}
function teacherSetup() {
  app.innerHTML = `
  <div class="bar"><h2>Start a lesson</h2><button class="btn" id="back">Back</button></div>
  <div class="choices">
    <button class="choice" id="one"><span class="tt">One learner</span><span class="td">You on your device, one learner on theirs.</span></button>
    <button class="choice alt" id="grp"><span class="tt">Group of up to 4</span><span class="td">Each learner on their own device, each with their own card.</span></button>
  </div><div class="fb" id="fb"></div>`;
  $("back").onclick = () => startScreen();
  $("one").onclick = () => createRoom("one");
  $("grp").onclick = () => createRoom("group");
}
async function createRoom(mode) {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  for (let t = 0; t < 6; t++) {
    const code = Array.from({ length: 4 }, () => pick(L.split(""))).join("");
    const { error } = await sb.from("arcade_rooms").insert({ code, mode, game: "lobby", state: {} });
    if (!error) { ses = { role: "teacher", code }; saveSes(ses); return connect(); }
    if (error.code !== "23505") { $("fb").className = "fb no"; $("fb").textContent = "Could not start a lesson. Check the internet connection and try again."; return; }
  }
}
function joinScreen(msg) {
  stopAll(); setChip();
  app.innerHTML = `
  <div class="bar"><h2>Join your teacher's game</h2><button class="btn" id="back">Back</button></div>
  <div class="box" style="max-width:460px">
    <label class="lab" for="jc">Game code</label><input class="code-in" id="jc" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false">
    <label class="lab" for="jn">Your first name</label><input class="field" id="jn" maxlength="20" autocomplete="given-name">
    <div class="row" style="margin-top:14px"><button class="btn main big" id="go">Join</button></div>
    <div class="fb no" id="fb">${msg ? esc(msg) : ""}</div>
  </div>`;
  $("back").onclick = () => startScreen();
  $("go").onclick = join;
  $("jn").addEventListener("keydown", e => { if (e.key === "Enter") join(); });
}
async function join() {
  const code = $("jc").value.trim().toUpperCase(), name = $("jn").value.trim().replace(/\s+/g, " ");
  const fb = $("fb");
  if (!/^[A-Z]{4}$/.test(code)) { fb.textContent = "The code has 4 letters. Look at your teacher's screen."; return; }
  if (!name) { fb.textContent = "Type your first name."; return; }
  $("go").disabled = true;
  const { data: r, error } = await sb.from("arcade_rooms").select("*").eq("code", code).maybeSingle();
  if (error) { fb.textContent = "No internet connection. Try again."; $("go").disabled = false; return; }
  if (!r) { fb.textContent = "There is no game with that code. Check the letters."; $("go").disabled = false; return; }
  const { data: ps } = await sb.from("arcade_players").select("id,name,seat").eq("room", code);
  const same = (ps || []).find(p => p.name.toLowerCase() === name.toLowerCase());
  let id;
  if (same) id = same.id;
  else {
    const cap = r.mode === "one" ? 1 : 4, taken = (ps || []).map(p => p.seat);
    if (taken.length >= cap) { fb.textContent = r.mode === "one" ? "This game is for one learner and someone has already joined." : "This game is full (4 learners)."; $("go").disabled = false; return; }
    const seat = [1, 2, 3, 4].find(s => !taken.includes(s));
    const { data: ins, error: e2 } = await sb.from("arcade_players").insert({ room: code, name, seat, state: { stats: {} } }).select("id").single();
    if (e2) { fb.textContent = "Could not join. Try again."; $("go").disabled = false; return; }
    id = ins.id;
  }
  ses = { role: "learner", code, pid: id }; saveSes(ses); me = null; connect();
}

/* ---------- live connection ---------- */
function stopAll() {
  if (channel) { sb.removeChannel(channel); channel = null; }
  if (pollId) { clearInterval(pollId); pollId = null; }
  if (tickId) { clearInterval(tickId); tickId = null; }
  room = null; players = []; me = null; lastSig = ""; ui = {};
}
async function connect() {
  stopAll(); setChip();
  app.innerHTML = `<p class="small">Connecting…</p>`;
  const ok = await refresh(true);
  if (!ok) return;
  channel = sb.channel("arcade-" + ses.code)
    .on("postgres_changes", { event: "*", schema: "public", table: "arcade_rooms", filter: `code=eq.${ses.code}` }, () => soon())
    .on("postgres_changes", { event: "*", schema: "public", table: "arcade_players", filter: `room=eq.${ses.code}` }, () => soon())
    .subscribe();
  pollId = setInterval(() => refresh(), 4000);
  if (!window.__visHook) { window.__visHook = true; document.addEventListener("visibilitychange", () => { if (!document.hidden && ses && ses.code) refresh(); }); }
}
let soonId = null;
function soon() { clearTimeout(soonId); soonId = setTimeout(() => refresh(), 120); }
async function refresh(first) {
  if (!ses) return false;
  const [{ data: r, error: e1 }, { data: ps, error: e2 }] = await Promise.all([
    sb.from("arcade_rooms").select("*").eq("code", ses.code).maybeSingle(),
    sb.from("arcade_players").select("*").eq("room", ses.code).order("seat")
  ]);
  if (e1 || e2) { setOffline(true); return !first; }
  setOffline(false);
  if (!r) { if (ses.role === "teacher") startScreen("That lesson has ended or expired. Start a new one."); else { ses = null; saveSes(null); joinScreen("That game has ended. Ask your teacher for a new code."); } return false; }
  room = r; players = ps || [];
  if (ses.role === "learner") {
    const mine = players.find(p => p.id === ses.pid);
    if (!mine) { ses = null; saveSes(null); joinScreen("Your teacher took you out of the game. Join again if you need to."); return false; }
    if (!me) { me = mine; me.state = me.state || {}; me.state.stats = me.state.stats || {}; }
    const sig = room.game + "|" + JSON.stringify(room.state);
    if (sig !== lastSig) { lastSig = sig; renderLearner(); }
  } else { const sig = JSON.stringify(room) + JSON.stringify(players); if (sig !== lastSig) { lastSig = sig; renderTeacher(); } }
  return true;
}
function setOffline(v) {
  if (v === offline) return; offline = v;
  let b = $("offbar");
  if (v && !b) { b = document.createElement("div"); b.id = "offbar"; b.className = "offline"; b.textContent = "Connection lost. Trying again…"; app.prepend(b); }
  if (!v && b) b.remove();
}
async function saveRoom(game, state) {
  room.game = game; room.state = state; renderTeacher();
  const { error } = await sb.from("arcade_rooms").update({ game, state, updated_at: new Date().toISOString() }).eq("code", ses.code);
  if (error) setOffline(true);
  renderTeacher();
}
let saveId = null;
function savePlayer() {
  clearTimeout(saveId);
  saveId = setTimeout(async () => {
    if (!me) return;
    const { error } = await sb.from("arcade_players").update({ state: me.state, updated_at: new Date().toISOString() }).eq("id", me.id);
    if (error) setOffline(true);
  }, 200);
}
function stat(game, key, inc = 1) { const s = me.state.stats; s[game] = s[game] || {}; s[game][key] = (s[game][key] || 0) + inc; }
function prog(defaults) {
  const g = me.state.g;
  if (!g || g.rid !== room.state.rid || g.game !== room.game) { me.state.g = Object.assign({ rid: room.state.rid, game: room.game }, JSON.parse(JSON.stringify(defaults))); ui = {}; }
  return me.state.g;
}
function say(ok, text) { ui.msg = { ok, text }; const f = $("fb"); if (f) { f.textContent = text; f.className = "fb " + (ok ? "ok" : "no"); if (!ok) { f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake"); } } }
const fbHtml = () => ui.msg ? `<div class="fb ${ui.msg.ok ? "ok" : "no"}" id="fb" aria-live="polite">${esc(ui.msg.text)}</div>` : `<div class="fb" id="fb" aria-live="polite"></div>`;

/* ---------- game generators (teacher) ---------- */
function bingoItem() {
  const c = pick(["mass", "cap", "time"]);
  if (c === "time") {
    const v = R(5, 36) * 5; let call;
    if (v < 60 || Math.random() < .55) { const s = R(7 * 12, 16 * 12) * 5; call = `${hm(s)} to ${hm(s + v)}`; } else call = dur(v);
    return { c, v, cell: `${v} min`, call };
  }
  const v = Math.random() < .2 ? pick([250, 450, 600, 750, 800, 850, 950]) : R(1, 4) * 1000 + pick([0, 50, 150, 250, 300, 450, 500, 600, 750, 800, 20]);
  return { c, v, cell: `${fmt(v)} ${U[c][1]}`, call: bigForm(v, c) };
}
function genBingo() {
  const pool = [], seen = new Set();
  while (pool.length < 28) { const it = bingoItem(); if (!seen.has(it.cell)) { seen.add(it.cell); it.id = pool.length; pool.push(it); } }
  const cards = {}; [1, 2, 3, 4].forEach(s => cards[s] = shuffle(pool.map(p => p.id)).slice(0, 16));
  return { rid: rid(), pool, order: shuffle(pool.map(p => p.id)), ci: 0, cards };
}
function genCourier() {
  const parcels = []; while (parcels.length < 8) { const v = R(6, 40) * 50; parcels.push({ v, f: anyForm(v, "mass") }); }
  let best = 0; for (let m = 0; m < 256; m++) { let s = 0; for (let i = 0; i < 8; i++) if (m >> i & 1) s += parcels[i].v; if (s <= 5000 && s > best) best = s; }
  return { rid: rid(), parcels, best };
}
const RECIPES = [
  { name: "Pancakes", items: [["Flour", "mass", 250], ["Milk", "cap", 500], ["Sugar", "mass", 50], ["Oil", "cap", 50]] },
  { name: "Muffins", items: [["Flour", "mass", 300], ["Sugar", "mass", 150], ["Milk", "cap", 250], ["Butter", "mass", 100]] },
  { name: "Scones", items: [["Flour", "mass", 500], ["Butter", "mass", 100], ["Milk", "cap", 200], ["Sugar", "mass", 100]] },
  { name: "Banana bread", items: [["Flour", "mass", 400], ["Bananas", "mass", 600], ["Milk", "cap", 100], ["Oil", "cap", 100]] },
  { name: "Flapjacks", items: [["Oats", "mass", 450], ["Butter", "mass", 200], ["Syrup", "cap", 150], ["Water", "cap", 250]] }
];
function genBakery() {
  const rec = pick(RECIPES);
  const fs = [[2, "Double batch", "× 2"], [3, "Triple batch", "× 3"]];
  if (rec.items.every(i => i[2] % 100 === 0)) fs.push([.5, "Half batch", "÷ 2"]);
  let [f, fname, fop] = pick(fs);
  if (rec.items.some(i => i[2] * f > (i[1] === "cap" ? 2000 : 4950))) [f, fname, fop] = fs[0];
  return { rid: rid(), name: rec.name, f, fname, fop, items: rec.items.map(([n, c, v]) => ({ n, c, base: v, need: v * f, shown: anyForm(v, c) })), timer: { start: null, calm: false, secs: 240 } };
}
function genTrain() {
  const legs = [["Home", "Zoo", R(5, 9) * 5], ["Zoo", "Harbour", R(4, 7) * 5], ["Harbour", "Home", R(8, 12) * 5]];
  legs.forEach(L => { const gap = pick([20, 25, 30, 40]), off = R(0, gap / 5 - 1) * 5, deps = []; for (let t = 6 * 60 + off; t <= 21 * 60; t += gap) deps.push(t); L.push(deps); });
  return { rid: rid(), start: R(97, 104) * 5, legs, stays: { Zoo: R(18, 30) * 5, Harbour: R(12, 24) * 5 } };
}
const GEN = { bingo: genBingo, courier: genCourier, bakery: genBakery, train: genTrain };

/* ---------- train logic shared by both views ---------- */
function trainNew(trip) { return { leg: 0, step: 0, now: trip.start, picked: null, log: [], right: 0, wrong: 0, tries: 0, done: false }; }
function trainQ(trip, g) {
  if (g.done) return { text: `Home at ${hm(g.now)}.`, want: null, kind: "done", wantText: "" };
  const [a, b, j, deps] = trip.legs[g.leg], next = deps.find(d => d >= g.now);
  if (g.step === 0) return { kind: "pick", want: next, wantText: hm(next), text: `It is ${hm(g.now)} at ${a}. Tap the first train you can catch to ${b}.` };
  if (g.step === 1) return { kind: "dur", want: next - g.now, wantText: dur(next - g.now), text: `It is ${hm(g.now)}. How long do you wait for the ${hm(next)} train?` };
  if (g.step === 2) return { kind: "dur", want: j, wantText: dur(j), text: `How long is the trip from ${a} to ${b}? (Look at the timetable.)` };
  if (g.step === 3) { const s = trip.stays[b]; return { kind: "time", want: next + j + s, wantText: hm(next + j + s), text: `You arrive at ${b} at ${hm(next + j)} and stay for ${dur(s)}. What time do you leave ${b}?` }; }
  return { kind: "dur", want: g.now - trip.start, wantText: dur(g.now - trip.start), text: `You left home at ${hm(trip.start)} and got back at ${hm(g.now)}. How long was your whole day out?` };
}
function trainAdvance(trip, g) {
  const [a, b, j, deps] = trip.legs[g.leg], next = deps.find(d => d >= g.now);
  if (g.step === 0) g.step = 1;
  else if (g.step === 1) g.step = 2;
  else if (g.step === 2) { g.log.push(`${hm(next)} train ${a} to ${b}, arrived ${hm(next + j)}`); if (b === "Home") { g.now = next + j; g.step = 4; } else g.step = 3; }
  else if (g.step === 3) { g.now = next + j + trip.stays[b]; g.log.push(`Stayed at ${b} for ${dur(trip.stays[b])}, left at ${hm(g.now)}`); g.leg++; g.step = 0; g.picked = null; }
  else g.done = true;
  g.tries = 0;
}

/* ---------- instruments ---------- */
function dragOn(svg, fn, end) { let on = false; svg.addEventListener("pointerdown", e => { on = true; svg.setPointerCapture(e.pointerId); fn(e); e.preventDefault(); }); svg.addEventListener("pointermove", e => { if (on) fn(e); }); ["pointerup", "pointercancel"].forEach(t => svg.addEventListener(t, () => { if (on && end) end(); on = false; })); }
function svgXY(svg, e) { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return [(e.clientX - r.left) * vb.width / r.width, (e.clientY - r.top) * vb.height / r.height]; }
function scaleSVG(host, onv, onend) {
  const svg = el("svg", { viewBox: "0 0 240 240", "aria-label": "Scale, 0 to 5 kg. Drag to set." }, host);
  el("rect", { x: 6, y: 6, width: 228, height: 228, rx: 30, fill: "var(--mass-tint)", stroke: "var(--mass)", "stroke-width": 4 }, svg);
  const cx = 120, cy = 120, Rr = 100; el("circle", { cx, cy, r: Rr + 4, fill: "var(--dial)", stroke: "var(--ink)", "stroke-width": 2 }, svg);
  for (let i = 0; i < 100; i++) {
    const a = (i * 3.6 - 90) * Math.PI / 180, maj = i % 20 === 0, mid = i % 2 === 0, l = maj ? 15 : mid ? 8 : 4;
    el("line", { x1: cx + Rr * Math.cos(a), y1: cy + Rr * Math.sin(a), x2: cx + (Rr - l) * Math.cos(a), y2: cy + (Rr - l) * Math.sin(a), stroke: "var(--ink)", "stroke-width": maj ? 2.4 : mid ? 1 : .6 }, svg);
    if (maj) { const t = el("text", { x: cx + (Rr - 30) * Math.cos(a), y: cy + (Rr - 30) * Math.sin(a) + 5, "text-anchor": "middle", "font-size": 15, fill: "var(--ink)", class: "dial-text" }, svg); t.textContent = i / 20 + " kg"; }
  }
  const t2 = el("text", { x: cx, y: cy + 34, "text-anchor": "middle", "font-size": 8.5, fill: "#5C6B5A" }, svg); t2.textContent = "small mark = 50 g";
  const nd = el("g", {}, svg); el("path", { d: `M${cx} ${cy + 14} L${cx - 5} ${cy} L${cx} ${cy - Rr + 8} L${cx + 5} ${cy} Z`, fill: "var(--mass)", stroke: "var(--ink)", "stroke-width": 1 }, nd);
  el("circle", { cx, cy, r: 7, fill: "var(--ink)" }, svg);
  const set = v => nd.setAttribute("transform", `rotate(${v / 5000 * 360} ${cx} ${cy})`);
  dragOn(svg, e => { const [x, y] = svgXY(svg, e); let a = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90; if (a < 0) a += 360; let v = Math.round(a / 360 * 100) * 50; if (v >= 5000) v = a > 350 ? 0 : 4950; set(v); onv(v); }, onend);
  return { set };
}
function jugSVG(host, onv, onend) {
  const svg = el("svg", { viewBox: "0 0 240 280", "aria-label": "Jug, 0 to 2 litres. Drag up and down." }, host);
  const x = 50, w = 120, top = 30, bot = 262, H = bot - top - 10;
  el("path", { d: `M${x + w} ${top + 30} C${x + w + 45} ${top + 30} ${x + w + 45} ${top + 120} ${x + w} ${top + 120}`, fill: "none", stroke: "var(--cap)", "stroke-width": 10, "stroke-linecap": "round" }, svg);
  el("rect", { x, y: top - 10, width: w, height: bot - top + 10, rx: 10, fill: "var(--cap-tint)" }, svg);
  const wa = el("rect", { x: x + 2, width: w - 4, fill: "var(--water)", opacity: .75 }, svg);
  el("rect", { x, y: top - 10, width: w, height: bot - top + 10, rx: 10, fill: "none", stroke: "var(--cap)", "stroke-width": 4 }, svg);
  const yOf = ml => bot - ml / 2000 * H;
  for (let ml = 50; ml <= 2000; ml += 50) {
    const y = yOf(ml), maj = ml % 500 === 0, mid = ml % 100 === 0;
    el("line", { x1: x, y1: y, x2: x + (maj ? 34 : mid ? 18 : 9), y2: y, stroke: "var(--ink)", "stroke-width": maj ? 2.4 : mid ? 1.1 : .6 }, svg);
    if (maj) { const t = el("text", { x: x + 40, y: y + 5, "font-size": 15, fill: "var(--ink)", class: "dial-text" }, svg); t.textContent = { 500: "500 mℓ", 1000: "1 ℓ", 1500: "1,5 ℓ", 2000: "2 ℓ" }[ml]; }
  }
  const set = v => { const y = yOf(v); wa.setAttribute("y", y); wa.setAttribute("height", Math.max(0, bot - y)); };
  dragOn(svg, e => { const [, y] = svgXY(svg, e); let v = Math.round((bot - y) / H * 40) * 50; v = Math.max(0, Math.min(2000, v)); set(v); onv(v); }, onend);
  return { set };
}

/* =====================================================================
   TEACHER VIEW
   ===================================================================== */
function renderTeacher() {
  if (tickId) { clearInterval(tickId); tickId = null; }
  const cap = room.mode === "one" ? 1 : 4;
  const site = location.host || "this website";
  const plist = players.length ? players.map(p => `<span class="player">${esc(p.name)}<button data-rm="${p.id}" aria-label="Remove ${esc(p.name)}">✕</button></span>`).join("") : `<span class="empty">Nobody has joined yet.</span>`;
  const tiles = ["bingo", "courier", "bakery", "train"].map(g => `<button class="tile ${g}${room.game === g ? " on" : ""}" data-game="${g}"><span class="tg">${{ bingo: "Converting", courier: "Adding mass", bakery: "Scaling recipes", train: "Time and timetables" }[g]}</span><span class="tt">${GAME_NAMES[g]}</span><span class="td">${room.game === g ? "Playing now. Tap to start a fresh round." : { bingo: "Each learner gets their own card. You make the calls.", courier: "Load the truck as close to 5 kg as possible.", bakery: "Scale a recipe and measure every ingredient.", train: "Plan a day trip with a timetable, home by 17:00." }[g]}</span></button>`).join("");
  let body = "";
  if (room.game === "ended") body = teacherSummary();
  else if (room.game === "lobby") body = `<div class="box"><h3>Choose a game to start</h3><p class="small">Learners' screens switch to the game as soon as you tap it. You can change games at any time with the same code.</p></div>`;
  else body = { bingo: tBingo, courier: tCourier, bakery: tBakery, train: tTrain }[room.game]();
  app.innerHTML = `
  <div class="play" style="grid-template-columns:minmax(0,1fr) auto">
    <div class="panel"><div class="small">${room.mode === "one" ? "One learner" : "Group of up to 4"} · Learners go to <b>${esc(site)}</b>, tap "I'm a learner" and type this code:</div>
      <div class="code-big">${esc(room.code)}</div>
      <div class="players">${plist}</div><div class="small">${players.length} of ${cap} joined</div></div>
    <div class="panel" style="justify-content:flex-start"><button class="btn" id="endL">${room.game === "ended" ? "Back to the games" : "End lesson and see summary"}</button><button class="btn warn" id="closeR">Close this lesson</button></div>
  </div>
  ${room.game === "ended" ? "" : `<div class="lobby">${tiles}</div>`}
  ${body}`;
  app.querySelectorAll("[data-rm]").forEach(b => b.onclick = async () => { b.disabled = true; await sb.from("arcade_players").delete().eq("id", b.dataset.rm); refresh(); });
  app.querySelectorAll("[data-game]").forEach(b => b.onclick = () => saveRoom(b.dataset.game, GEN[b.dataset.game]()));
  $("endL").onclick = async () => { if (room.game === "ended") return saveRoom("lobby", {}); $("endL").disabled = true; await refresh(); saveRoom("ended", {}); };
  let armed = false;
  $("closeR").onclick = () => { if (!armed) { armed = true; $("closeR").textContent = "Tap again to close"; setTimeout(() => { armed = false; const b = $("closeR"); if (b) b.textContent = "Close this lesson"; }, 4000); return; } startScreen(); };
  const hook = { bingo: hBingo, courier: hCourier, bakery: hBakery, train: hTrain }[room.game]; if (hook) hook();
  const off = $("offbar"); if (offline && !off) { offline = false; setOffline(true); }
}
const learnerState = p => (p.state && p.state.g && p.state.g.rid === room.state.rid && p.state.g.game === room.game) ? p.state.g : null;
const noLearners = () => players.length ? "" : `<p class="empty">Waiting for learners to join.</p>`;

/* --- bingo --- */
const lines = (() => { const L = []; for (let r = 0; r < 4; r++) { L.push([0, 1, 2, 3].map(c => r * 4 + c)); L.push([0, 1, 2, 3].map(c => c * 4 + r)); } L.push([0, 5, 10, 15], [3, 6, 9, 12]); return L; })();
function tBingo() {
  const s = room.state, call = s.pool[s.order[s.ci]], last = s.ci >= s.order.length - 1;
  const cards = players.map(p => {
    const g = learnerState(p) || { covered: [], resp: {}, miss: 0 }, card = s.cards[p.seat];
    const r = g.resp && g.resp[s.ci];
    const pill = r === "hit" ? `<span class="pill ok">Covered it</span>` : r === "skip" ? `<span class="pill ok">Not on card</span>` : card.includes(call.id) ? `<span class="pill wait">Thinking (on card)</span>` : `<span class="pill wait">Thinking (not on card)</span>`;
    const mini = card.map(id => `<span class="${g.covered.includes(id) ? "on" : ""}${id === call.id ? " now" : ""}">${esc(s.pool[id].cell.replace(" ", " "))}</span>`).join("");
    return `<div class="lcard"><h4>${esc(p.name)} ${g.bingo ? `<span class="pill ok">BINGO!</span>` : ""}</h4>${pill}<div class="mini">${mini}</div><div class="kv"><span>Mistakes</span><b>${g.miss || 0}</b></div></div>`;
  }).join("");
  return `<div class="play"><div class="panel"><div class="box"><h3>Call ${s.ci + 1} of ${s.order.length}</h3><div class="call">${esc(nb(call.call))}</div>
    <p style="margin:8px 0 0">Answer: <span class="answer">${esc(nb(call.cell))}</span></p>
    <div class="row" style="margin-top:10px"><button class="btn main big" id="nextCall" ${last ? "disabled" : ""}>Next call</button></div>
    <p class="small">Learners tap the amount on their card, or "Not on my card". The green outline shows where the answer is on each card.</p></div></div>
    <div class="panel"><div class="learners">${cards || noLearners()}</div></div></div>`;
}
function hBingo() { const b = $("nextCall"); if (b) b.onclick = () => { const s = JSON.parse(JSON.stringify(room.state)); s.ci = Math.min(s.ci + 1, s.order.length - 1); saveRoom("bingo", s); }; }

/* --- courier --- */
function tCourier() {
  const s = room.state;
  const key = s.parcels.map(p => `<div class="kv"><span>${esc(nb(p.f))}</span><b>${fmt(p.v)} g</b></div>`).join("");
  const cards = players.map(p => {
    const g = learnerState(p) || { loaded: [], sent: false };
    const tot = (g.loaded || []).reduce((a, i) => a + s.parcels[i].v, 0);
    const status = g.sent ? `<span class="pill ok">Sent ${"★".repeat(g.stars || 0)}</span>` : tot > 5000 ? `<span class="pill no">Over 5 kg</span>` : `<span class="pill wait">Loading</span>`;
    return `<div class="lcard"><h4>${esc(p.name)} ${status}</h4><div class="small">${(g.loaded || []).map(i => esc(nb(s.parcels[i].f))).join(", ") || "No parcels yet"}</div>
      <div class="kv"><span>On the truck</span><b>${fmt(tot)} g</b></div><div class="kv"><span>Adding mistakes</span><b>${g.addErr || 0}</b></div><div class="kv"><span>Overloads</span><b>${g.over || 0}</b></div></div>`;
  }).join("");
  return `<div class="play"><div class="panel"><div class="box"><h3>Answer key</h3>${key}<p style="margin:8px 0 0">Best possible load: <span class="answer">${fmt(s.best)} g</span></p>
    <div class="row" style="margin-top:10px"><button class="btn main" id="newP">New parcels for everyone</button></div></div></div>
    <div class="panel"><div class="learners">${cards || noLearners()}</div></div></div>`;
}
function hCourier() { const b = $("newP"); if (b) b.onclick = () => saveRoom("courier", genCourier()); }

/* --- bakery --- */
function timerLeft(t) { if (!t || t.calm || !t.start) return null; return Math.max(0, Math.round(t.secs - (Date.now() - t.start) / 1000)); }
function tBakery() {
  const s = room.state, t = s.timer, left = timerLeft(t);
  const key = s.items.map(i => `<div class="kv"><span>${i.n}: ${esc(nb(i.shown))} ${s.fop}</span><b>${fmt(i.need)} ${U[i.c][1]}</b></div>`).join("");
  const cards = players.map(p => {
    const g = learnerState(p) || { set: [], baked: false };
    const rows = s.items.map((i, k) => { const v = (g.set || [])[k] || 0; return `<div class="kv"><span>${i.n}</span><b style="color:${v === i.need ? "var(--good)" : "inherit"}">${fmt(v)} ${U[i.c][1]} ${v === i.need ? "✓" : ""}</b></div>`; }).join("");
    return `<div class="lcard"><h4>${esc(p.name)} ${g.baked ? `<span class="pill ok">Baked ${"★".repeat(g.stars || 0)}</span>` : `<span class="pill wait">Measuring</span>`}</h4>${rows}<div class="kv"><span>Bake tries</span><b>${g.tries || 0}</b></div></div>`;
  }).join("");
  return `<div class="play"><div class="panel"><div class="box"><div class="bar"><h3 style="margin:0">${esc(s.name)}: ${esc(s.fname)}</h3><span class="timer" id="tTimer">${t.calm ? "No timer" : left === null ? "4:00" : `${Math.floor(left / 60)}:${pad(left % 60)}`}</span></div>${key}
    <div class="row" style="margin-top:10px">${!t.calm && !t.start ? `<button class="btn main" id="startOven">Start the oven timer</button>` : ""}<button class="btn" id="calm">${t.calm ? "Use a timer" : "No timer"}</button><button class="btn" id="newO">Next order</button></div></div></div>
    <div class="panel"><div class="learners">${cards || noLearners()}</div></div></div>`;
}
function hBakery() {
  const s = JSON.parse(JSON.stringify(room.state));
  const so = $("startOven"); if (so) so.onclick = () => { s.timer.start = Date.now(); saveRoom("bakery", s); };
  $("calm").onclick = () => { s.timer.calm = !s.timer.calm; s.timer.start = null; saveRoom("bakery", s); };
  $("newO").onclick = () => saveRoom("bakery", genBakery());
  tickId = setInterval(() => { const l = timerLeft(room.state.timer), e = $("tTimer"); if (e && l !== null) { e.textContent = `${Math.floor(l / 60)}:${pad(l % 60)}`; e.classList.toggle("low", l <= 30); } }, 1000);
}

/* --- train --- */
function tTrain() {
  const s = room.state;
  const cards = players.map(p => {
    const g = learnerState(p) || trainNew(s), q = trainQ(s, g);
    return `<div class="lcard"><h4>${esc(p.name)} ${g.done ? `<span class="pill ${g.now <= 1020 ? "ok" : "no"}">Home ${hm(g.now)}</span>` : `<span class="pill wait">Trip ${g.leg + 1} of 3</span>`}</h4>
      ${g.done ? "" : `<div>${esc(q.text)}</div><div>Answer: <span class="answer">${esc(q.wantText)}</span></div>`}
      <div class="kv"><span>Right</span><b>${g.right || 0}</b></div><div class="kv"><span>Wrong tries</span><b>${g.wrong || 0}</b></div>
      <div class="log">${(g.log || []).slice(-2).map(x => `<span>${esc(x)}</span>`).join("")}</div></div>`;
  }).join("");
  return `<div class="play"><div class="panel"><div class="box"><h3>Today's trip</h3>
    <div class="kv"><span>Leave home</span><b>${hm(s.start)}</b></div>
    ${s.legs.map(L => `<div class="kv"><span>${L[0]} to ${L[1]}</span><b>${dur(L[2])}, every ${L[3][1] - L[3][0]} min</b></div>`).join("")}
    <div class="kv"><span>Stay at the Zoo</span><b>${dur(s.stays.Zoo)}</b></div><div class="kv"><span>Stay at the Harbour</span><b>${dur(s.stays.Harbour)}</b></div>
    <div class="row" style="margin-top:10px"><button class="btn main" id="newT">New trip for everyone</button></div>
    <p class="small">Each learner works at their own pace. The answer shown is for the question on their screen right now.</p></div></div>
    <div class="panel"><div class="learners">${cards || noLearners()}</div></div></div>`;
}
function hTrain() { const b = $("newT"); if (b) b.onclick = () => saveRoom("train", genTrain()); }

/* --- summary --- */
const pl = (n, w, ws) => `${n || 0} ${(n || 0) === 1 ? w : (ws || w + "s")}`;
function summaryText() {
  const d = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  return players.map(p => {
    const s = (p.state && p.state.stats) || {}, out = [];
    if (s.bingo) out.push(`Measure Bingo: ${pl(s.bingo.right, "call")} answered correctly, ${pl(s.bingo.wrong, "mistake")}, ${pl(s.bingo.bingos, "bingo")}.`);
    if (s.courier) out.push(`Courier Challenge: ${pl(s.courier.trucks, "truck")} sent, ${pl(s.courier.stars, "star")}, ${pl(s.courier.addErr, "adding mistake")}, ${pl(s.courier.over, "overload")}.`);
    if (s.bakery) out.push(`Bakery Rush: ${pl(s.bakery.cakes, "order")} baked correctly in ${pl(s.bakery.tries, "bake try", "bake tries")}, ${pl(s.bakery.wrongIng, "ingredient")} measured wrongly along the way.`);
    if (s.train) out.push(`Beat the Train: ${pl(s.train.right, "question")} right, ${pl(s.train.wrong, "wrong try", "wrong tries")}, ${pl(s.train.trips, "trip")} completed.`);
    return `${p.name} (${d}, Measure Arcade, Grade 6 Term 4 measurement)\n` + (out.length ? out.map(x => "- " + x).join("\n") : "- Did not play a game in this lesson.");
  }).join("\n\n");
}
function teacherSummary() {
  const txt = summaryText();
  setTimeout(() => {
    const b = $("copySum"); if (!b) return;
    b.onclick = async () => { const ta = $("sumText"); try { await navigator.clipboard.writeText(ta.value); b.textContent = "Copied"; } catch (e) { ta.focus(); ta.select(); b.textContent = "Selected: press Copy"; } };
  });
  return `<div class="box"><h3>Lesson summary</h3><p class="small">Copy this into your session notes. Nothing is saved online after the lesson is closed.</p>
    <textarea class="copy" id="sumText" readonly>${esc(txt || "No learners joined this lesson.")}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn main" id="copySum">Copy summary</button></div></div>`;
}

/* =====================================================================
   LEARNER VIEW
   ===================================================================== */
function renderLearner() {
  if (tickId) { clearInterval(tickId); tickId = null; }
  if (!room || !me) return;
  const head = `<div class="bar"><div><h2>Hi ${esc(me.name)}!</h2><p class="sub">${room.game in GAME_NAMES ? GAME_NAMES[room.game] : ""}</p></div><button class="btn" id="leave">Leave</button></div>`;
  let body;
  if (room.game === "lobby") body = `<div class="box"><h3>You're in!</h3><p>Wait for your teacher to choose a game. It will appear here by itself.</p></div>`;
  else if (room.game === "ended") body = `<div class="box"><h3>Lesson finished</h3><p>Well done today, ${esc(me.name)}! You can close this page.</p></div>`;
  else body = { bingo: lBingo, courier: lCourier, bakery: lBakery, train: lTrain }[room.game]();
  app.innerHTML = head + body;
  let armed = false;
  $("leave").onclick = () => { if (!armed) { armed = true; $("leave").textContent = "Tap again to leave"; return; } startScreen(); };
  const hook = { bingo: hlBingo, courier: hlCourier, bakery: hlBakery, train: hlTrain }[room.game]; if (hook) hook();
  if (offline) { offline = false; setOffline(true); }
}

/* --- learner bingo --- */
function lBingo() {
  const s = room.state, g = prog({ covered: [], resp: {}, miss: 0, bingo: false }), card = s.cards[me.seat], call = s.pool[s.order[s.ci]];
  if (ui.ci !== s.ci) { ui.ci = s.ci; ui.msg = null; }
  const answered = g.resp[s.ci];
  const winLine = lines.find(l => l.every(k => g.covered.includes(card[k])));
  const cells = card.map((id, k) => { const it = s.pool[id]; return `<button class="cell ${it.c}${g.covered.includes(id) ? " on" : ""}${winLine && winLine.includes(k) ? " win" : ""}" data-cell="${id}">${esc(nb(it.cell))}</button>`; }).join("");
  return `<div class="play"><div class="grid">${cells}</div>
  <div class="panel"><div class="box"><h3>The caller says</h3><div class="call">${g.bingo ? "BINGO!" : esc(nb(call.call))}</div>${fbHtml()}
    <div class="row"><button class="btn" id="notOn" ${answered || g.bingo ? "disabled" : ""}>Not on my card</button><button class="btn" id="hint">Hint</button></div>
    <p class="small">${answered ? "Done! Wait for the next call." : "Change it to g, mℓ or min, then find it on your card."}</p></div>
    <div class="box"><span class="small">Mistakes: ${g.miss}</span></div></div></div>`;
}
function hlBingo() {
  const s = room.state, g = me.state.g, card = s.cards[me.seat], callId = s.order[s.ci], call = s.pool[callId];
  app.querySelectorAll("[data-cell]").forEach(b => b.onclick = () => {
    if (g.bingo) return;
    if (g.resp[s.ci]) { say(true, "You've done this call. Wait for the next one."); return; }
    const id = +b.dataset.cell;
    if (g.covered.includes(id)) return;
    if (id === callId) {
      g.covered.push(id); g.resp[s.ci] = "hit"; stat("bingo", "right");
      ui.msg = { ok: true, text: `Yes! ${call.call} = ${call.cell}` };
      if (lines.some(l => l.every(k => g.covered.includes(card[k])))) { g.bingo = true; stat("bingo", "bingos"); ui.msg = { ok: true, text: "BINGO! Shout it out!" }; }
      savePlayer(); renderLearner();
    } else { g.miss++; stat("bingo", "wrong"); savePlayer(); b.classList.add("wrong"); setTimeout(() => b.classList.remove("wrong"), 600); say(false, `Not ${s.pool[id].cell}. Convert again.`); }
  });
  $("notOn").onclick = () => {
    if (g.resp[s.ci] || g.bingo) return;
    if (card.includes(callId)) { g.miss++; stat("bingo", "wrong"); savePlayer(); say(false, "It IS on your card. Convert again and look carefully."); return; }
    g.resp[s.ci] = "skip"; stat("bingo", "right"); ui.msg = { ok: true, text: `Correct, ${call.cell} is not on your card.` }; savePlayer(); renderLearner();
  };
  $("hint").onclick = () => say(true, call.c === "time" ? "Hint: count on to the next whole hour first. 1 h = 60 min." : call.c === "mass" ? "Hint: 1 kg = 1 000 g. Move the comma 3 places right." : "Hint: 1 ℓ = 1 000 mℓ. Move the comma 3 places right.");
}

/* --- learner courier --- */
function lCourier() {
  const s = room.state, g = prog({ loaded: [], sent: false, stars: 0, addErr: 0, over: 0 });
  const tot = g.loaded.reduce((a, i) => a + s.parcels[i].v, 0);
  const parcels = s.parcels.map((p, i) => `<button class="parcel${g.loaded.includes(i) ? " in" : ""}" data-p="${i}" ${g.loaded.includes(i) || g.sent ? "disabled" : ""}>${ICON_PARCEL}<span>${esc(nb(p.f))}</span></button>`).join("");
  const chips = g.loaded.map(i => `<button class="chip" data-off="${i}" ${g.sent ? "disabled" : ""} aria-label="Take off ${esc(s.parcels[i].f)}">${esc(nb(s.parcels[i].f))} ✕</button>`).join("") || `<span class="small">Empty. Tap a parcel to load it.</span>`;
  return `<div class="play"><div class="panel"><div class="parcels">${parcels}</div>
    <div class="box"><h3>Truck (5 kg limit)</h3><div class="load">${chips}</div>
    <div class="gauge${tot > 5000 ? " over" : ""}" id="gauge" ${ui.showg ? "" : "hidden"}><i style="width:${Math.min(100, tot / 50)}%"></i></div>
    <label class="switch" style="margin-top:8px"><input type="checkbox" id="showg" ${ui.showg ? "checked" : ""}> Show how full the truck is</label></div></div>
  <div class="panel"><div class="box"><h3>${g.sent ? "Truck sent!" : "Ready to go?"}</h3><p style="margin:0 0 6px">Work out how much is on the truck.</p>
    <div class="inp"><input id="tot" inputmode="numeric" aria-label="total in grams" value="${esc(ui.tot || "")}" ${g.sent ? "disabled" : ""}> g</div>
    <div class="row" style="margin-top:10px"><button class="btn main" id="send" ${g.sent ? "disabled" : ""}>Send the truck</button></div>
    ${fbHtml()}<div class="stars">${g.sent ? "★".repeat(g.stars) + "☆".repeat(3 - g.stars) : ""}</div>
    <p class="small">${g.sent ? "Wait for your teacher to bring new parcels." : "Tip: write each parcel in grams first, then add."}</p></div></div></div>`;
}
function hlCourier() {
  const s = room.state, g = me.state.g;
  app.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { g.loaded.push(+b.dataset.p); savePlayer(); renderLearner(); });
  app.querySelectorAll("[data-off]").forEach(b => b.onclick = () => { g.loaded = g.loaded.filter(i => i !== +b.dataset.off); savePlayer(); renderLearner(); });
  $("showg").onchange = e => { ui.showg = e.target.checked; $("gauge").hidden = !ui.showg; };
  $("tot").oninput = e => ui.tot = e.target.value;
  $("send").onclick = () => {
    const tot = g.loaded.reduce((a, i) => a + s.parcels[i].v, 0);
    if (!tot) return say(false, "Load some parcels first.");
    const t = parseInt(String(ui.tot || "").replace(/\D/g, ""), 10);
    if (isNaN(t)) return say(false, "Type the total in grams first.");
    if (t !== tot) { g.addErr++; stat("courier", "addErr"); savePlayer(); return say(false, "Check your adding. Change each parcel to grams, then add again."); }
    if (tot > 5000) { g.over++; stat("courier", "over"); savePlayer(); return say(false, `${fmt(tot)} g is ${fmt(tot - 5000)} g over 5 kg. The truck can't leave! Take a parcel off.`); }
    const st = tot === s.best ? 3 : s.best - tot <= 250 ? 2 : 1;
    g.sent = true; g.stars = st; stat("courier", "trucks"); stat("courier", "stars", st);
    ui.msg = { ok: true, text: st === 3 ? `Perfect load! ${fmt(tot)} g = ${dec(tot)} kg. That's the best possible.` : `Sent! ${fmt(tot)} g = ${dec(tot)} kg. A fuller load was possible.` };
    savePlayer(); renderLearner();
  };
}

/* --- learner bakery --- */
function lBakery() {
  const s = room.state, g = prog({ set: s.items.map(() => 0), baked: false, tries: 0, stars: 0, st: [] });
  ui.cur = ui.cur || 0; const t = s.timer, left = timerLeft(t);
  const ings = s.items.map((i, k) => `<button class="ing ${g.st[k] || ""}" data-ing="${k}" aria-pressed="${k === ui.cur}">${i.n} ${i.c === "mass" ? "(scale)" : "(jug)"}<br><span class="ingv" id="ingv${k}">${g.set[k] ? fmt(g.set[k]) + "\u00a0" + U[i.c][1] : "not measured"}</span></button>`).join("");
  const times = s.f === 2 ? "Make 2 times this recipe" : s.f === 3 ? "Make 3 times this recipe" : "Make half of this recipe";
  const i = s.items[ui.cur];
  return `<div class="play"><div class="panel">
    <div class="orderbar"><span class="ob1">Order: ${esc(s.fname)}</span><span class="ob2">${times}</span></div>
    <div class="recipe"><div class="bar"><h3 style="margin:0">${esc(s.name)}: recipe for ONE batch</h3><span class="order">${s.fop}</span></div>
    <table>${s.items.map(x => `<tr><td>${x.n}</td><td style="text-align:right;font-weight:700">${esc(nb(x.shown))}</td></tr>`).join("")}</table><p class="small">These are the amounts for ONE batch.</p></div>
    <div class="box"><h3>Ingredients: tap one to measure it</h3><div class="ings">${ings}</div></div></div>
  <div class="panel"><div class="box"><div class="bar"><h3 style="margin:0">${i.n}</h3><span class="timer" id="lTimer">${t.calm ? "" : left === null ? "Oven off" : `${Math.floor(left / 60)}:${pad(left % 60)}`}</span></div>
    <div class="instr" id="instr"></div><div class="row" id="nudge" style="margin-top:8px"></div>
    <label class="switch" style="margin-top:8px"><input type="checkbox" id="showr" ${ui.showr ? "checked" : ""}> Show the reading</label><div class="small" id="rd"></div></div>
    <div class="box"><div class="row"><button class="btn main" id="bake" ${g.baked ? "disabled" : ""}>Bake!</button></div>${fbHtml()}
    <div class="stars">${g.baked ? "★".repeat(g.stars) + "☆".repeat(3 - g.stars) : ""}</div>${g.baked ? `<p class="small">Wait for your teacher's next order.</p>` : ""}</div></div></div>`;
}
function hlBakery() {
  const s = room.state, g = me.state.g, k = ui.cur, i = s.items[k];
  const readout = () => { const iv = $("ingv" + k); if (iv) iv.textContent = g.set[k] ? fmt(g.set[k]) + "\u00a0" + U[i.c][1] : "not measured"; $("rd").textContent = ui.showr ? `${fmt(g.set[k])} ${U[i.c][1]} = ${dec(g.set[k])} ${U[i.c][0]}` : ""; };
  const api = (i.c === "mass" ? scaleSVG : jugSVG)($("instr"), v => { g.set[k] = v; readout(); }, () => savePlayer());
  api.set(g.set[k]); readout();
  const steps = i.c === "mass" ? [-1000, -100, -50, 50, 100, 1000] : [-500, -100, -50, 50, 100, 500], max = i.c === "mass" ? 4950 : 2000, u = U[i.c][1];
  steps.forEach(d => { const b = document.createElement("button"); b.className = "btn"; b.textContent = (d < 0 ? "−" : "+") + (Math.abs(d) >= 1000 ? Math.abs(d) / 1000 + " " + U[i.c][0] : Math.abs(d) + " " + u); b.disabled = g.baked; b.onclick = () => { g.set[k] = Math.max(0, Math.min(max, g.set[k] + d)); api.set(g.set[k]); readout(); savePlayer(); }; $("nudge").appendChild(b); });
  app.querySelectorAll("[data-ing]").forEach(b => b.onclick = () => { ui.cur = +b.dataset.ing; renderLearner(); });
  $("showr").onchange = e => { ui.showr = e.target.checked; readout(); };
  $("bake").onclick = () => {
    let right = 0; g.tries++; stat("bakery", "tries");
    s.items.forEach((x, j) => { const ok = g.set[j] === x.need; g.st[j] = ok ? "ok" : "no"; if (ok) right++; else stat("bakery", "wrongIng"); });
    if (right === s.items.length) {
      const l = timerLeft(s.timer); g.baked = true; g.stars = (l === null || l > 60) ? 3 : l > 0 ? 2 : 1; stat("bakery", "cakes");
      ui.msg = { ok: true, text: `Perfect ${s.name.toLowerCase()}! Every ingredient is right.` };
    } else {
      const op = s.f === .5 ? "halve it" : s.f === 2 ? "multiply by 2" : "multiply by 3";
      const notes = s.items.map((x, j) => { const v = g.set[j]; if (v === x.need) return null;
        if (!v) return `${x.n}: not measured yet.`;
        if (v === x.base) return `${x.n}: ${fmt(v)} ${U[x.c][1]} is the amount for ONE batch. This order says ${op}.`;
        return `${x.n}: ${fmt(v)} ${U[x.c][1]} is not right yet. Change ${x.shown} to ${U[x.c][1]}, then ${op}.`; }).filter(Boolean);
      const wrong = s.items.filter((x, j) => g.set[j] !== x.need);
      const allOne = wrong.length > 1 && wrong.every(x => g.set[s.items.indexOf(x)] === x.base);
      ui.msg = { ok: false, text: `${right} of ${s.items.length} right. ` + (allOne ? `You measured the amounts for ONE batch. This order is a ${s.fname.toLowerCase()}, so ${op} for every red ingredient.` : notes.join(" ")) };
    }
    savePlayer(); renderLearner();
  };
  tickId = setInterval(() => { const l = timerLeft(room.state.timer), e = $("lTimer"); if (!e || l === null) return; e.textContent = `${Math.floor(l / 60)}:${pad(l % 60)}`; e.classList.toggle("low", l <= 30); if (l === 0 && !g.baked && !ui.rang) { ui.rang = true; say(false, "Ding! The oven timer rang. Finish measuring and press Bake."); } }, 1000);
}

/* --- learner train --- */
function lTrain() {
  const s = room.state, g = prog(trainNew(s)), q = trainQ(s, g);
  const st = ["Home", "Zoo", "Harbour", "Home"].map((x, k) => `<span class="stop${k <= (g.done ? 3 : g.leg) ? " done" : ""}">${x}</span>`).join(" → ");
  let table = "";
  if (!g.done && g.step < 4) {
    const [a, b, j, deps] = s.legs[g.leg], vis = deps.filter(d => d >= g.now - 60 && d <= g.now + 150);
    table = `<div class="box"><h3>Trains from ${a} to ${b}</h3><div class="tt-wrap"><table class="tt"><tr><th>Leaves ${a}</th><th>Arrives ${b}</th></tr>${vis.map(d => `<tr${g.picked === d ? ' class="pick"' : ""}><td><button data-dep="${d}" ${g.step !== 0 ? "disabled" : ""}>${hm(d)}</button></td><td>${hm(d + j)}</td></tr>`).join("")}</table></div></div>`;
  }
  const input = q.kind === "dur" ? `<div class="inp"><input id="dh" inputmode="numeric" aria-label="hours" value="${esc(ui.dh || "")}"> h <input id="dm" inputmode="numeric" aria-label="minutes" value="${esc(ui.dm || "")}"> min</div>`
    : q.kind === "time" ? `<div class="inp"><input id="th" inputmode="numeric" aria-label="hours" placeholder="hh" value="${esc(ui.th || "")}"> : <input id="tm" inputmode="numeric" aria-label="minutes" placeholder="mm" value="${esc(ui.tm || "")}"></div>` : "";
  const end = g.done ? `<div class="q">${g.now <= 17 * 60 ? `Home at ${hm(g.now)}. You beat the 17:00 deadline by ${dur(17 * 60 - g.now)}!` : `Home at ${hm(g.now)}. That's ${dur(g.now - 17 * 60)} after 17:00.`}</div><p class="small">Wait for your teacher to start a new trip.</p>` : "";
  return `<div class="play"><div class="panel"><div class="box"><div class="route">${st}</div></div>${table}</div>
  <div class="panel"><div class="box">${g.done ? end : `<div class="q">${esc(q.text)}</div><div style="margin-top:8px">${input}</div><div class="row" style="margin-top:10px"><button class="btn main" id="chk">Check</button></div>`}${fbHtml()}</div>
    <div class="box"><h3>Trip diary</h3><div class="log">${g.log.length ? g.log.map(x => `<span>${esc(x)}</span>`).join("") : "<span>Nothing yet.</span>"}</div></div></div></div>`;
}
function hlTrain() {
  const s = room.state, g = me.state.g; if (g.done) return;
  app.querySelectorAll("[data-dep]").forEach(b => b.onclick = () => { g.picked = +b.dataset.dep; savePlayer(); renderLearner(); });
  ["dh", "dm", "th", "tm"].forEach(id => { const e = $(id); if (e) e.oninput = () => ui[id] = e.value; });
  $("chk").onclick = () => {
    const q = trainQ(s, g); let got;
    if (q.kind === "pick") { if (g.picked === null) return say(false, "Tap a train in the timetable first."); got = g.picked; }
    else if (q.kind === "dur") { const a = String(ui.dh || "").trim(), b = String(ui.dm || "").trim(); if (!a && !b) return say(false, "Type a number in the boxes."); const x = parseInt(a || "0", 10), y = parseInt(b || "0", 10); if (isNaN(x) || isNaN(y)) return say(false, "Use numbers only."); got = x * 60 + y; }
    else { const x = parseInt(ui.th, 10), y = parseInt(ui.tm, 10); if (isNaN(x) || isNaN(y) || x > 23 || y > 59) return say(false, "Type the time as hours and minutes, for example 14 and 05."); got = x * 60 + y; }
    if (got === q.want) { g.right++; stat("train", "right"); ui.msg = { ok: true, text: `Correct! ${q.wantText}.` }; }
    else {
      g.wrong++; stat("train", "wrong"); g.tries++;
      if (g.tries < 2) { savePlayer(); return say(false, q.kind === "time" ? "Not yet. Add the hours first, then the minutes. Remember 60 min = 1 h." : q.kind === "pick" ? "That's not the first train you can catch. Look at the time now." : "Not yet. Count on to the next whole hour, then add the rest."); }
      ui.msg = { ok: false, text: `The answer was ${q.wantText}. Let's keep going.` };
    }
    if (q.kind === "pick") g.picked = got === q.want ? got : q.want;
    trainAdvance(s, g); if (g.done) stat("train", "trips");
    ui.dh = ui.dm = ui.th = ui.tm = "";
    savePlayer(); renderLearner();
  };
}

/* ---------- boot ---------- */
setChip();
if (ses && ses.code) connect(); else startScreen();
