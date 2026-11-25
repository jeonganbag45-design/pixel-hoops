// Pixel Hoops: 1v1 streetball. The world and the HUD are two pixelfx frames; the camera punches the world, not the HUD.
import { createFrame, clearFrame, createFx, composite, painterFor, hex, scale as shade, textWidth, Painter, INK, WHITE } from "./pixelfx/core/index.js";
import * as countdown from "./pixelfx/fx/ui/countdown.js";
import * as confetti from "./pixelfx/fx/ui/confetti.js";
import * as dmgNum from "./pixelfx/fx/ui/damage-number.js";
import * as critNum from "./pixelfx/fx/ui/crit-number.js";
import * as pow from "./pixelfx/fx/explosions/cartoon-pow.js";
import * as firework from "./pixelfx/fx/explosions/firework-burst.js";
import * as hitSpark from "./pixelfx/fx/impacts/hit-spark.js";
import * as critHit from "./pixelfx/fx/impacts/crit-hit.js";
import * as impactFrame from "./pixelfx/fx/impacts/impact-frame.js";
import * as collect from "./pixelfx/fx/pickups/collect-burst.js";
import * as poof from "./pixelfx/fx/spawn/poof.js";
import * as flamePillar from "./pixelfx/fx/fire/flame-pillar.js";
import * as iceSpikes from "./pixelfx/fx/ice/ice-spikes.js";
import * as iceShatter from "./pixelfx/fx/ice/ice-shatter.js";
import * as lightning from "./pixelfx/fx/lightning/lightning-strike.js";
import * as zap from "./pixelfx/fx/lightning/zap-hit.js";
import * as quake from "./pixelfx/fx/nature/quake.js";
import * as blackHole from "./pixelfx/fx/shadow/black-hole.js";
import * as timeStop from "./pixelfx/fx/arcane/time-stop.js";
import * as storm from "./pixelfx/fx/weather/storm.js";
import * as shootingStars from "./pixelfx/fx/weather/shooting-stars.js";
import * as godRays from "./pixelfx/fx/weather/god-rays.js";

const W = 320, H = 180, S = 3, FLOOR = 150;
// K: how much taller the players are than the first 24 px sprites; every body-relative distance below is scaled by it
const K = 1.6, GRAV = 520, JUMP = 215, SHOT_JUMP = 200, SPEED = 72, DASH = 2.6, BALL_G = 320, BR = 4;
const GAME_TIME = 75, THREE = 95, CHAOS_AT = [55, 35, 15];
const HANG = 28 * K, DUNK_TOP = HANG - 16;        // feet below the rim when hanging on it, and at the top of the dunk jump

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const world = createFrame(W, H), hud = createFrame(W, H);
const worldImg = new ImageData(W, H), hudImg = new ImageData(W, H);
const mkBuf = () => Object.assign(document.createElement("canvas"), { width: W, height: H });
const worldBuf = mkBuf(), hudBuf = mkBuf();
const worldCtx = worldBuf.getContext("2d"), hudCtx = hudBuf.getContext("2d");

const C = {
  wallTop: hex("#120f1e"), wallBot: hex("#241c38"), crowd: ["#3a3550", "#4a4258", "#5a3a4a", "#2f3a5a", "#4a3a2a", "#2a4a3a"].map(hex),
  wood: hex("#b8743a"), woodDark: hex("#9a5c2a"), woodLine: hex("#8a4f22"), paint: hex("#7a3b5c"), line: hex("#f2ead8"),
  board: hex("#c8e8ff"), boardEdge: hex("#9088a4"), rim: hex("#ff6a2a"), net: hex("#e6e1ee"), pole: hex("#4a4258"),
  ball: hex("#f08a2a"), ballDark: hex("#8a3b12"), gold: hex("#ffe03c"), goldDark: hex("#a87a12"), shadow: hex("#000000"),
  shoe: hex("#f2ead8"), dust: hex("#d8b48a"), dim: hex("#9088a4"), green: hex("#5ad84a"), red: hex("#ff3a4a"),
  panel: hex("#16141f"), panelEdge: hex("#5a5070"), pink: hex("#f53cd1"), banana: hex("#ffe03c"), bananaTip: hex("#6b4a1a"),
  tear: hex("#5cc4ff"), ice: hex("#a6ecff"), iceHi: hex("#e6fbff"), grey: hex("#8a8698"), space: hex("#05030c"), moon: hex("#d8d4e6"),
  fire: [hex("#ff4a2a"), hex("#ff9a2a"), hex("#ffe03c")], glass: [hex("#c8e8ff"), hex("#ffffff"), hex("#8cc8f0")], volt: hex("#fff6a0"),
};
const OUTLINE = hex("#0d0a14");

// ---------- characters: stats, a passive that is always on, and a special on the SP bar ----------
const SHOES = { BLAZE: "#ffe03c", FROST: "#e6fbff", VOLT: "#3a3550", TANK: "#ff6a2a", SHADE: "#6a5ac0", GRAMPS: "#8a5a32" };
const CHARS = [
  { name: "BLAZE", title: "THE HOTHEAD", col: "#ff4a3a", dark: "#a8201e", skin: "#d79a6a", hair: "#ff9a2a", style: "flame",
    spd: 1, jmp: 1, shot: 1, three: 1, def: 1,
    passive: "HOT HAND", pdesc: "AWAKENS AFTER 2 MAKES", special: "INFERNO", sdesc: "AWAKEN 10S + KNOCKBACK" },
  { name: "FROST", title: "COLD BLOODED", col: "#5cc4ff", dark: "#1f62ae", skin: "#f0c8a8", hair: "#e6fbff", style: "fluffy",
    spd: 0.95, jmp: 1, shot: 1.05, three: 1.15, def: 0.95,
    passive: "ICE VEINS", pdesc: "BIGGER PERFECT ZONE", special: "DEEP FREEZE", sdesc: "ICE SPIKES FREEZE HIM" },
  { name: "VOLT", title: "SPEED DEMON", col: "#ffe03c", dark: "#a87a12", skin: "#8d5a3b", hair: "#fff6a0", style: "spiky",
    spd: 1.15, jmp: 1.05, shot: 0.95, three: 0.9, def: 1,
    passive: "QUICK FEET", pdesc: "DASHES COST HALF STAMINA", special: "THUNDER STEP", sdesc: "WARP TO RIM AND DUNK" },
  { name: "TANK", title: "THE BRICK WALL", col: "#5ad84a", dark: "#22882a", skin: "#6b4a3a", hair: "#1c1a24", style: "bald", wide: 1,
    spd: 0.85, jmp: 0.85, shot: 0.95, three: 0.7, def: 1.3,
    passive: "ROCK SOLID", pdesc: "DRIVES BOUNCE OFF HIM", special: "EARTHQUAKE", sdesc: "TWO QUAKES. JUMP BOTH!" },
  { name: "SHADE", title: "THE PICKPOCKET", col: "#9a7cff", dark: "#3a2a8a", skin: "#3a3550", hair: "#1a1430", style: "hood",
    spd: 1.05, jmp: 1.1, shot: 0.95, three: 0.95, def: 1.2,
    passive: "STICKY HANDS", pdesc: "STEALS WORK MORE OFTEN", special: "BLACK HOLE", sdesc: "SUCKS THE BALL IN" },
  { name: "GRAMPS", title: "OLD BUT GOLD", col: "#e6e1ee", dark: "#6b6280", skin: "#e0b090", hair: "#bdb6cc", style: "old",
    spd: 0.75, jmp: 0.7, shot: 1.25, three: 1.3, def: 0.8,
    passive: "EXPERIENCE", pdesc: "SP FILLS 50% FASTER", special: "TIME OUT", sdesc: "TIMESTOP GRANNY SHOT" },
].map((c) => ({ ...c, col: hex(c.col), dark: hex(c.dark), skin: hex(c.skin), hair: hex(c.hair), wide: c.wide ?? 0, shoe: hex(SHOES[c.name]) }));
const pips = (v) => clamp(Math.round((v - 0.7) / 0.15) + 1, 1, 5);

// hoop 0 on the left (P2 attacks it), hoop 1 on the right (P1 attacks it); dir points from the board into the court
const HOOPS = [
  { board: 14, back: 16, front: 34, y: 80, dir: 1 },
  { board: 306, back: 304, front: 286, y: 80, dir: -1 },
].map((h) => ({ ...h, cx: (h.back + h.front) / 2, lo: Math.min(h.back, h.front), hi: Math.max(h.back, h.front), wob: 0, net: 0, broken: false }));

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
const gauss = () => Math.random() + Math.random() + Math.random() - 1.5;

// ---------- input ----------
const keys = new Set(), pressed = new Set();
const GAME_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter", "Slash", "ShiftRight", "Period"];
addEventListener("keydown", (e) => {
  if (GAME_KEYS.includes(e.code)) e.preventDefault();
  if (!e.repeat) pressed.add(e.code);
  keys.add(e.code);
  audio();
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => { keys.clear(); if (screen === "game" && !cutin && !chaosIntro) setScreen("paused"); });
// ---- touch: buttons hold their key while a finger is on them (captured, so a finger that slides a little keeps it),
// and the pad on the left reads left / right from where the finger is on it
const root = document.documentElement;
const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch {} };   // never let a capture failure eat the press
let isTouch = matchMedia("(pointer: coarse)").matches;
const goTouch = () => {
  if (!isTouch) { isTouch = true; }
  root.classList.add("touch");
};
if (isTouch) goTouch();
addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  goTouch();
  // the first tap on a phone goes full screen and holds landscape, where the browser allows it
  if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen({ navigationUI: "hide" }).then(() => window.screen?.orientation?.lock?.("landscape")).catch(() => {});
}, { capture: true });
for (const b of document.querySelectorAll("[data-k]")) {
  const k = b.dataset.k;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); capture(b, e); pressed.add(k); keys.add(k); b.classList.add("on"); audio(); });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(ev, () => { keys.delete(k); b.classList.remove("on"); });
}
const pad = document.getElementById("pad");
if (pad) {
  const fingers = new Map();
  const readPad = () => {
    let l = false, r = false;
    const box = pad.getBoundingClientRect(), mid = box.left + box.width / 2, dead = box.width * 0.06;
    for (const x of fingers.values()) { if (x < mid - dead) l = true; else if (x > mid + dead) r = true; }
    for (const [on, k] of [[l, "KeyA"], [r, "KeyD"]]) { if (on && !keys.has(k)) pressed.add(k); if (on) keys.add(k); else keys.delete(k); }
    pad.classList.toggle("l", l); pad.classList.toggle("r", r); pad.classList.toggle("on", l || r);
  };
  pad.addEventListener("pointerdown", (e) => { e.preventDefault(); capture(pad, e); fingers.set(e.pointerId, e.clientX); audio(); readPad(); });
  pad.addEventListener("pointermove", (e) => { if (fingers.has(e.pointerId)) { fingers.set(e.pointerId, e.clientX); readPad(); } });
  for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) pad.addEventListener(ev, (e) => { fingers.delete(e.pointerId); readPad(); });
}
// ---- touch play: one surface over the whole screen, read finger by finger (touch events track each finger
// reliably on phones). The left side is a floating stick: put a thumb down anywhere, slide to run, flick to dash,
// slide up to jump. The right side is four buttons, and a touch counts for the nearest one, so nothing is missed.
// The controls are drawn inside the game, in its own pixels (see drawTouch).
// one big button does whatever the moment needs (smartKey), and a small one fires the special when it's charged
const TBTN = {
  act: { x: 290, y: 148, r: 21 },
  dash: { x: 250, y: 133, r: 13, key: "KeyS" },
  sp: { x: 298, y: 112, r: 10, key: "KeyE" },
};
// the buttons as laid out right now: scaled from the bottom corner, mirrored for left-handed play
function tbtn() {
  const k = { S: 0.85, M: 1, L: 1.2 }[settings.btn] ?? 1, lay = {};
  for (const [n, b] of Object.entries(TBTN)) {
    let x = W - (W - b.x) * k; const y = H - (H - b.y) * k;
    if (settings.lefty) x = W - x;
    lay[n] = { ...b, x: Math.round(x), y: Math.round(y), r: Math.round(b.r * k) };
  }
  return lay;
}
// the action for a press right now: shoot (or dunk) with the ball; block or catch when the ball is in the air near you;
// otherwise reach for a steal
// with the ball in driving range of the rim, the big button dashes in and the dunk follows on its own
const driveRange = (p) => { const f = courtSide(p); return ball.owner === p && p.onGround && f > 18 && f < 80 && p.dashCd <= 0 && !p.shooting; };
function smartKey() {
  const me = players[0], opp = players[1];
  if (driveRange(me)) return "DRIVE";
  if (ball.owner === me) return "KeyF";
  const threat = (opp.shooting || opp.dunk) && Math.abs(opp.x - me.x) < 60;
  const high = !ball.owner && Math.abs(ball.x - me.x) < 30 && ball.y < me.y - 36;
  if ((threat || high) && me.onGround) return "KeyW";
  return "KeyF";
}
function smartLabel() {
  const me = players[0], opp = players[1];
  if (ball.owner === me) return driveRange(me) || canDunk(me) ? "DUNK" : "SHOOT";
  const k = smartKey();
  if (k === "KeyW") return opp.shooting || opp.dunk ? "BLOCK" : "CATCH";
  return ball.owner === opp ? "STEAL" : "GRAB";
}
const touch = { stick: null, btn: new Map(), lastUp: -1, lastDur: 9, autoDunk: 0, burn: 0, wasFire: false };
const gameXY = (cx, cy) => { const r = canvas.getBoundingClientRect(); return [((cx - r.left) / r.width) * W, ((cy - r.top) / r.height) * H]; };
const touchPlay = () => screen === "game" && phase !== "done";
function stickKeys() {
  const s = touch.stick, dir = s ? s.dir : 0;
  for (const [on, k] of [[dir < 0, "KeyA"], [dir > 0, "KeyD"]]) { if (on && !keys.has(k)) pressed.add(k); if (on) keys.add(k); else keys.delete(k); }
}
addEventListener("touchstart", (e) => {
  goTouch(); audio();
  if (!touchPlay()) return;                                   // menus and panels: taps go to the canvas as clicks
  e.preventDefault();
  for (const t of e.changedTouches) {
    const [gx, gy] = gameXY(t.clientX, t.clientY);
    if (gx > 226 && gx < 246 && gy < 18) { pressed.add("Escape"); continue; }                     // the pause icon
    const face = infoBoxes.find((b) => gx >= b.x && gx < b.x + b.w && gy >= b.y && gy < b.y + b.h);
    if (face) { pinned[face.i] = !pinned[face.i]; sfx.click(); continue; }
    if (settings.lefty ? gx > W * 0.55 : gx < W * 0.45) {
      if (!touch.stick) {
        const now = performance.now();
        touch.stick = { id: t.identifier, ox: gx, oy: gy, sx: gx, sy: gy, x: gx, y: gy, t0: now, dir: 0, jumped: false };
      }
      continue;
    }
    let best = "act", bd = Infinity;
    const lay = tbtn();
    for (const [n, b] of Object.entries(lay)) { const d = Math.hypot(gx - b.x, gy - b.y) / b.r; if (d < bd) { bd = d; best = n; } }
    let key = best === "act" ? smartKey() : lay[best].key;
    if (key === "DRIVE") {
      // face the rim and dash; the dunk is pressed for you the moment it becomes possible
      const me = players[0], toward = Math.sign(hoopOf(me).cx - me.x) || 1;
      key = toward > 0 ? "KeyD" : "KeyA"; pressed.add("KeyS"); touch.autoDunk = 0.5;
    }
    touch.btn.set(t.identifier, { name: best, key });
    pressed.add(key); keys.add(key);
  }
}, { passive: false });
addEventListener("touchmove", (e) => {
  if (!touch.stick && !touch.btn.size) return;
  e.preventDefault();
  for (const t of e.changedTouches) {
    const s = touch.stick;
    if (!s || t.identifier !== s.id) continue;
    [s.x, s.y] = gameXY(t.clientX, t.clientY);
    const dx = s.x - s.ox;
    s.dir = dx > 4 ? 1 : dx < -4 ? -1 : 0;
    if (Math.abs(dx) > 16) s.ox = s.x - Math.sign(dx) * 16;                // the base trails the thumb, so turning around is instant
    // a quick flick sideways is a dash; sliding up is a jump (once per slide)
    if (!s.jumped && s.sy - s.y > 14) { s.jumped = true; pressed.add("KeyW"); }
    if (s.jumped && s.sy - s.y < 6) s.jumped = false;
    stickKeys();
  }
}, { passive: false });
function touchEnd(e) {
  for (const t of e.changedTouches) {
    if (touch.stick && t.identifier === touch.stick.id) { const now = performance.now(); touch.lastDur = now - touch.stick.t0; touch.lastUp = now; touch.stick = null; stickKeys(); }
    const b = touch.btn.get(t.identifier);
    if (b) { touch.btn.delete(t.identifier); if (![...touch.btn.values()].some((o) => o.key === b.key)) keys.delete(b.key); stickKeys(); }   // the stick keeps its direction
  }
}
addEventListener("touchend", touchEnd);
addEventListener("touchcancel", touchEnd);
// leaving a game (pause, the end) lets go of everything held
function touchReset() { touch.stick = null; touch.btn.clear(); for (const k of ["KeyA", "KeyD", "KeyF", "KeyW", "KeyS", "KeyE"]) keys.delete(k); }
function buzz(ms) { if (isTouch && !demo && settings.vibe && navigator.vibrate) try { navigator.vibrate(ms); } catch {} }
// each frame of a touch game: finish a drive with the dunk, and light the controls when BLAZE awakens
function touchFrame(dt) {
  if (!isTouch || demo || !players.length) return;
  const me = players[0];
  if (touch.autoDunk > 0) {
    touch.autoDunk -= dt;
    if (canDunk(me) && ball.owner === me) { pressed.add("KeyF"); touch.autoDunk = 0; }
  }
  if (me.fire && !touch.wasFire) { touch.burn = 1; buzz([30, 40, 60]); }
  touch.wasFire = me.fire;
  touch.burn = Math.max(0, touch.burn - dt * 1.4);
}
// help for thumbs: a human on a touch screen gets a little more reach on steals, blocks and dunks
const assist = (p) => isTouch && !demo && p.tag !== "CPU";
addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("visibilitychange", () => {
  if (!ac) return;
  if (document.hidden) ac.suspend().catch(() => {});
  else ac.resume().catch(() => {});
});
const mouse = { x: -1, y: -1, moved: false };
const toGame = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
const inside = (b) => mouse.x >= b.x && mouse.x < b.x + b.w && mouse.y >= b.y && mouse.y < b.y + b.h;
canvas.addEventListener("pointermove", (e) => { [mouse.x, mouse.y] = toGame(e); mouse.moved = true; });
canvas.addEventListener("pointerleave", () => { mouse.x = mouse.y = -1; });
canvas.addEventListener("pointerdown", (e) => {
  audio();
  if (e.pointerType === "touch" && touchPlay()) return;
  [mouse.x, mouse.y] = toGame(e);
  if (screen === "settings") { settingsTap(); return; }
  const face = infoBoxes.find(inside);
  if (face) { pinned[face.i] = !pinned[face.i]; sfx.click(); return; }
  const card = cards.find(inside);
  if (card) { selectPick(card.i); return; }
  const b = buttons.find(inside);
  if (b) { sfx.click(); b.act(); }
});

const BINDS = [
  { left: ["KeyA"], right: ["KeyD"], jump: ["KeyW"], dash: ["KeyS"], shoot: ["KeyF", "Space"], special: ["KeyE", "KeyQ"] },
  { left: ["ArrowLeft"], right: ["ArrowRight"], jump: ["ArrowUp"], dash: ["ArrowDown"], shoot: ["Enter", "Slash", "KeyL", "Numpad0"], special: ["ShiftRight", "Period", "KeyK", "Numpad1"] },
];
const SOLO = Object.fromEntries(Object.keys(BINDS[0]).map((k) => [k, [...BINDS[0][k], ...BINDS[1][k]]]));
const NONE = { left: false, right: false, jump: false, dash: false, shoot: false, shootHeld: false, special: false };
const any = (list, set) => list.some((k) => set.has(k));
const humanControl = (b) => ({
  left: any(b.left, keys), right: any(b.right, keys), jump: any(b.jump, pressed), dash: any(b.dash, pressed),
  shoot: any(b.shoot, pressed), shootHeld: any(b.shoot, keys), special: any(b.special, pressed),
});

// ---------- sound ----------
// Everything is synthesized: a master bus with a compressor, beeps, filtered noise, a formant "voice" per character,
// and a crowd (a murmur that follows the hype, roars, ooohs and claps).
let ac = null, muted = false, out = null, mixIn = null, white = null, amb = null;
function audio() {
  if (!ac) try {
    ac = new AudioContext();
    const comp = ac.createDynamicsCompressor(), master = ac.createGain();
    comp.threshold.value = -20; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    master.gain.value = 0.9; comp.connect(master).connect(ac.destination); mixIn = comp; out = ac.createGain(); out.connect(comp);   // out: the sound effects bus
    const n = ac.sampleRate * 2; white = ac.createBuffer(1, n, ac.sampleRate);
    const d = white.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    startAmbience();
    musicInit();
  } catch { ac = false; }
  if (ac && ac.state === "suspended") ac.resume();
}
function beep(freq, dur = 0.08, type = "square", vol = 0.05, slide = 0, delay = 0) {
  if (!ac || muted) return;
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur);
}
// filtered noise; type picks the filter, env "fade" decays, "swell" rises then falls (a roar)
function noise(dur = 0.2, vol = 0.08, freq = 1200, delay = 0, type = "lowpass", q = 1, env = "fade") {
  if (!ac || muted) return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime + delay;
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  if (env === "swell") { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  else { g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  s.buffer = white; s.connect(f).connect(g).connect(out); s.start(t, Math.random() * 1.5, dur + 0.05);
}
// a vowel: a buzzy source through two band-pass formants, with a pitch slide and vibrato
const VOWEL = { a: [800, 1200], o: [500, 880], e: [450, 1900], u: [330, 800], i: [290, 2300] };
function vox(f0, dur, { v = "a", to = null, wave = "sawtooth", vol = 0.22, slide = 0, vib = 0, rate = 6, delay = 0, breath = 0 } = {}) {
  if (!ac || muted) return;
  const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = wave; o.frequency.setValueAtTime(f0, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f0 + slide), t + dur);
  if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = rate; lg.gain.value = vib; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  VOWEL[v].forEach((fq, i) => {
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 5; bp.frequency.setValueAtTime(fq, t);
    if (to) bp.frequency.linearRampToValueAtTime(VOWEL[to][i], t + dur);
    o.connect(bp).connect(g);
  });
  g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  if (breath) noise(dur, breath, VOWEL[v][1], delay, "bandpass", 2);
}
// the crowd's murmur, a loop that swells with the hype (set each frame)
function startAmbience() {
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = white; s.loop = true; f.type = "bandpass"; f.frequency.value = 700; f.Q.value = 0.6; f2.type = "lowpass"; f2.frequency.value = 1600;
  g.gain.value = 0; s.connect(f).connect(f2).connect(g).connect(out); s.start();
  amb = g;
}
let stompT = 0;
function updateAmbience() {
  if (!amb) return;
  updateMusic();
  const live = screen === "game" || screen === "over", v = muted || !live ? 0 : 0.06 + hype * 0.16;
  amb.gain.setTargetAtTime(v, ac.currentTime, 0.25);
  // when the game is hot the crowd stomps along
  stompT -= 1 / 60;
  if (live && !demo && phase === "play" && hype > 0.5 && stompT <= 0) { stompT = 1.9; crowd$.stomp(); }
}
const crowd$ = {
  // a basket: a roar that swells and dies, a few voices on top, then applause. power 1 (two) .. 3 (glass, buzzer)
  cheer(power = 1) {
    if (!ac || muted) return;
    // the roar: a wide band of voices rushing in, with a brighter layer of screams on top
    noise(1.8 + power * 0.6, 0.26 + power * 0.08, 900, 0, "bandpass", 0.6, "swell");
    noise(1.5 + power * 0.5, 0.14 + power * 0.05, 2400, 0.04, "bandpass", 1, "swell");
    for (let i = 0; i < 8 + power * 6; i++) vox(rnd(200, 520), rnd(0.5, 1.2), { v: pick(["a", "e", "o", "i"]), to: "a", vol: 0.07, slide: rnd(-40, 220), vib: 10, rate: rnd(5, 9), delay: rnd(0, 0.3) });
    // whistles, applause
    for (let i = 0; i < power * 2; i++) beep(rnd(2200, 2800), 0.4, "sine", 0.05, rnd(300, 900), rnd(0.1, 0.6));
    for (let i = 0; i < 30 + power * 22; i++) noise(0.03, rnd(0.08, 0.2), rnd(1600, 4000), 0.2 + Math.random() * (1.4 + power * 0.5), "bandpass", 1.4);
    if (power >= 2) crowd$.horn(power >= 3 ? 2 : 1);
  },
  // the stadium air horn
  horn(n = 1) { for (let k = 0; k < n; k++) for (const f of [311, 370, 466]) beep(f, k === n - 1 ? 0.75 : 0.22, "sawtooth", 0.045, -14, 0.08 + k * 0.3); },
  // stomp, stomp, clap: the crowd keeps a beat when the game is hot
  stomp() {
    if (!ac || muted) return;
    for (const t of [0, 0.3]) { beep(62, 0.16, "sine", 0.3, -22, t); noise(0.1, 0.16, 240, t); }
    for (let i = 0; i < 6; i++) noise(0.05, 0.12, rnd(1800, 2800), 0.6 + rnd(0, 0.02), "bandpass", 1.3);
  },
  // the final buzzer: you won, or you didn't
  win() {
    [523, 659, 784, 1046].forEach((f, i) => { beep(f, 0.16, "square", 0.05, 0, i * 0.11); beep(f / 2, 0.16, "triangle", 0.06, 0, i * 0.11); });
    for (const f of [523, 659, 784, 1046]) beep(f, 0.9, "square", 0.03, 0, 0.5);
    crowd$.cheer(3); setTimeout(() => crowd$.stomp(), 1500); setTimeout(() => crowd$.stomp(), 2400);
  },
  lose() {
    // the sad trombone: wah, wah, wah, waaaah
    [392, 370, 349].forEach((f, i) => vox(f / 2, 0.32, { wave: "sawtooth", v: "o", to: "u", vol: 0.22, delay: i * 0.38 }));
    vox(330 / 2, 1.2, { wave: "sawtooth", v: "o", to: "u", vol: 0.22, vib: 6, rate: 6, slide: -12, delay: 1.14 });
    crowd$.aww(); setTimeout(() => crowd$.aww(), 900);
  },
  // a big defensive play: "ooooh"
  ooh() { for (let i = 0; i < 9; i++) vox(rnd(160, 320), rnd(0.7, 1), { v: "u", to: "o", vol: 0.045, slide: rnd(-40, 40), vib: 5, delay: rnd(0, 0.12) }); noise(0.9, 0.05, 700, 0, "bandpass", 0.8, "swell"); },
  // a miss or an airball: "awww"
  aww() { for (let i = 0; i < 8; i++) vox(rnd(220, 360), rnd(0.6, 0.9), { v: "a", to: "u", vol: 0.04, slide: -rnd(60, 140), delay: rnd(0, 0.1) }); },
  // cheering the clock down, or the winner
  chant() { for (let k = 0; k < 3; k++) { for (let i = 0; i < 6; i++) vox(rnd(200, 320), 0.18, { v: "e", to: "o", vol: 0.04, delay: k * 0.42 + rnd(0, 0.03) }); noise(0.05, 0.12, 2500, k * 0.42 + 0.21, "bandpass", 1.5); } },
};

// ---------- music ----------
// A boom-bap loop built from the same synths, scheduled a beat ahead of the audio clock. It follows the game:
// laid back on the menu, the full groove in play, an arpeggio on top when the crowd is hot, faster and tenser in
// the last 10 seconds and in overtime. It dips under the big moments. N switches it off and on.
const music = { on: true, bus: null, next: 0, step: 0, bpm: 92, mode: "menu", duck: 0, lastMode: "" };
(() => { try { music.on = localStorage.getItem("hoops.music") !== "off"; } catch {} })();
function musicInit() {
  music.bus = ac.createGain(); music.bus.gain.value = 0;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 9000; music.lp = lp;
  music.bus.connect(lp).connect(mixIn);
  music.next = ac.currentTime + 0.15;
  setInterval(musicTick, 25);
}
const M = {
  kick(t, v = 1) { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13); g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28); o.connect(g).connect(music.bus); o.start(t); o.stop(t + 0.3); },
  noise(t, dur, vol, freq, type = "bandpass", q = 1) { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.buffer = white; s.connect(f).connect(g).connect(music.bus); s.start(t, Math.random() * 1.5, dur + 0.02); },
  snare(t, v = 1) { M.noise(t, 0.16, 0.42 * v, 1900, "bandpass", 0.7); M.tone(t, 185, 0.07, "triangle", 0.25 * v); },
  hat(t, open = false, v = 1) { M.noise(t, open ? 0.14 : 0.035, (open ? 0.12 : 0.1) * v, 8000, "highpass", 1); },
  tone(t, f, dur, type, vol, cutoff = 0) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (cutoff) { const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = cutoff; lp.Q.value = 5; o.connect(lp).connect(g); } else o.connect(g);
    g.connect(music.bus); o.start(t); o.stop(t + dur + 0.02);
  },
};
// A minor: Am, F, C, G, a bar each; the overtime loop goes darker (Am, Dm, Em, Am)
const CHORDS = { main: [[110, 0], [87.31, 1], [130.81, 1], [98, 1]], dark: [[110, 0], [73.42, 0], [82.41, 0], [110, 0]] };
const triad = (root, major) => [root * 2, root * 2 * (major ? 1.26 : 1.189), root * 3];
function musicTick() {
  if (!ac || !music.bus) return;
  while (music.next < ac.currentTime + 0.12) {
    playStep(music.step, music.next);
    const swing = music.step % 2 ? 0.92 : 1.08;                   // a little swing on the 16ths
    music.next += (60 / music.bpm / 4) * swing;
    music.step++;
  }
}
function playStep(s, t) {
  const mode = music.mode, i = s % 16, bar = Math.floor(s / 16) % 4;
  if (mode === "silent") return;
  const prog = CHORDS[mode === "ot" ? "dark" : "main"], [root, major] = prog[bar], ch = triad(root, major);
  const hot = mode === "final" || mode === "ot" || hype > 0.55, chill = mode === "menu" || mode === "paused";
  // drums: boom bap
  if (i === 0 || i === 10 || (!chill && i === 7 && bar % 2)) M.kick(t, chill ? 0.7 : 1);
  if (i === 4 || i === 12) M.snare(t, chill ? 0.5 : 1);
  if (!chill && i === 15 && bar === 3) M.snare(t, 0.5);
  if (i % 2 === 0 || hot) M.hat(t, i === 14 && !chill, i % 4 === 2 ? 1 : 0.6);
  // bass
  const bassAt = { 0: 1, 3: 1, 6: 2, 8: 1, 10: 1.5, 14: 2 };
  if (bassAt[i] && !(chill && i % 4)) M.tone(t, root * (bassAt[i] === 2 ? 2 : bassAt[i] === 1.5 ? 1.5 : 1), 0.22, "sawtooth", 0.22, 520);
  // a soft chord stab, and the arpeggio when it's hot
  if (!chill && (i === 2 || i === 10)) for (const f of ch) M.tone(t, f * 2, 0.12, "square", 0.025, 2400);
  if (chill && i === 0) for (const f of ch) M.tone(t, f * 2, 1.2, "triangle", 0.03);
  if (hot && i % 2 === 0) M.tone(t, ch[(i / 2) % 3] * 4, 0.09, "square", 0.022, 3000);
  // the last seconds: a riser every bar
  if (mode === "final" && i === 0) M.noise(t, 60 / music.bpm * 4, 0.05, 3000, "bandpass", 2);
}
// set each frame from the game state
function updateMusic() {
  if (!ac || !music.bus) return;
  const mode = !music.on || muted ? "silent"
    : screen === "game" ? (overtime ? "ot" : clock <= 10 && phase !== "countdown" ? "final" : "game")
    : screen === "paused" ? "paused" : screen === "over" ? "silent" : "menu";
  music.mode = mode;
  music.bpm = { menu: 88, paused: 88, game: 94 + hype * 6, final: 112, ot: 104, silent: 94 }[mode];
  music.duck = Math.max(0, music.duck - 1 / 60 / 0.9);
  const vol = mode === "silent" ? 0 : (mode === "paused" ? 0.12 : 0.3) * (1 - music.duck * 0.7) * (settings.music / 7);
  out.gain.setTargetAtTime(settings.sfx / 8, ac.currentTime, 0.05);
  music.bus.gain.setTargetAtTime(vol, ac.currentTime, 0.08);
  music.lp.frequency.setTargetAtTime(mode === "paused" ? 700 : 9000, ac.currentTime, 0.1);
}
const duckMusic = (k = 1) => { music.duck = Math.max(music.duck, k); };

// Each baller has a voice (pitch, timbre, wobble) and a sound of his element that rides on top of it.
const VOICE = {
  BLAZE: { f0: 190, wave: "sawtooth", vib: 6, rate: 9, breath: 0.03 },
  FROST: { f0: 230, wave: "triangle", vib: 2, rate: 4 },
  VOLT: { f0: 280, wave: "square", vib: 25, rate: 28 },
  TANK: { f0: 78, wave: "sawtooth", vib: 3, rate: 3, breath: 0.02 },
  SHADE: { f0: 150, wave: "sine", vib: 4, rate: 5, breath: 0.06 },
  GRAMPS: { f0: 125, wave: "sawtooth", vib: 14, rate: 5.5 },
};
const ELEMENT = {
  BLAZE: (big) => { noise(0.35 + big * 0.3, 0.08 + big * 0.05, 1800, 0, "bandpass", 0.8, "swell"); beep(150, 0.3, "sawtooth", 0.03, 250); },
  FROST: (big) => { for (let i = 0; i < 3 + big * 3; i++) beep(rnd(1800, 3200), 0.12, "triangle", 0.03, 0, i * 0.05); },
  VOLT: (big) => { for (let i = 0; i < 2 + big * 2; i++) { noise(0.05, 0.1, 5000, i * 0.06, "highpass"); beep(rnd(900, 1600), 0.05, "square", 0.03, -600, i * 0.06); } },
  TANK: (big) => { beep(55, 0.3 + big * 0.2, "sine", 0.18, -15); noise(0.2, 0.12, 300); },
  SHADE: (big) => { beep(600, 0.45 + big * 0.2, "sine", 0.05, -480); noise(0.4, 0.05, 600, 0, "bandpass", 2, "swell"); },
  GRAMPS: (big) => { beep(1568, 0.5, "sine", 0.05); beep(2093, 0.4, "sine", 0.03, 0, 0.12 + big * 0.05); },
};
// what he says: a little grunt on a jump, a breath on a shot, a yell on a basket, a groan when he goes down
function say$(p, line) {
  if (!ac || muted || demo) return;
  const v = VOICE[p.ch.name], o = { wave: v.wave, vib: v.vib, rate: v.rate, breath: v.breath ?? 0 }, f = v.f0;
  switch (line) {
    case "hup": vox(f * 1.2, 0.08, { ...o, v: "u", vol: 0.07, slide: f * 0.4 }); break;
    case "shot": vox(f * 1.1, 0.12, { ...o, v: "a", to: "u", vol: 0.08, slide: -f * 0.2 }); break;
    case "score":
      if (p.ch.name === "GRAMPS") for (let i = 0; i < 3; i++) vox(f * 1.3, 0.1, { ...o, v: "e", vol: 0.14, delay: i * 0.13 });   // heh heh heh
      else if (p.ch.name === "SHADE") vox(f, 0.5, { ...o, v: "e", to: "i", vol: 0.1, slide: -40 });                              // a cold heheh
      else vox(f * 1.15, 0.42, { ...o, v: "e", to: "a", vol: 0.18, slide: f * 0.5 });                                        // YEAH
      ELEMENT[p.ch.name](0); break;
    case "big": vox(f * 1.1, 0.6, { ...o, v: "a", vol: 0.2, slide: f * 0.7 }); ELEMENT[p.ch.name](1); break;                  // dunk, special
    case "hurt": vox(f * 1.25, 0.3, { ...o, v: "o", to: "u", vol: 0.14, slide: -f * 0.5 }); break;
    case "steal": vox(f * 1.4, 0.15, { ...o, v: "e", vol: 0.12, slide: f * 0.3 }); break;
    case "win": vox(f * 1.1, 0.9, { ...o, v: "a", to: "e", vol: 0.2, slide: f * 0.6 }); ELEMENT[p.ch.name](1); break;
  }
}
const sfx = {
  click: () => beep(880, 0.04, "square", 0.04),
  tick: () => beep(1200, 0.025, "square", 0.03),
  bounce: () => { beep(95, 0.09, "sine", 0.22, -35); noise(0.05, 0.08, 500); },
  rim: () => { beep(523, 0.35, "triangle", 0.06, -8); beep(1180, 0.25, "sine", 0.03, -20); noise(0.06, 0.08, 4000, 0, "highpass"); },
  shoot: () => noise(0.16, 0.06, 1400, 0, "bandpass", 1.5, "swell"),
  swish: () => noise(0.3, 0.14, 5200, 0, "bandpass", 1.2, "swell"),
  perfect: () => { beep(1046, 0.08, "square", 0.05); beep(1568, 0.14, "square", 0.05, 0, 0.06); },
  score: () => { sfx.swish(); beep(660, 0.1, "square", 0.035, 0, 0.12); beep(988, 0.16, "square", 0.035, 0, 0.2); },
  three: () => { sfx.swish(); [660, 880, 1320].forEach((f, i) => beep(f, 0.14, "square", 0.04, 0, 0.12 + i * 0.08)); },
  dunk: () => { noise(0.35, 0.22, 500); beep(70, 0.3, "sawtooth", 0.12, -30); beep(523, 0.15, "square", 0.05, 0, 0.12); },
  glass: () => { noise(0.8, 0.2, 6000); for (let i = 0; i < 6; i++) beep(rnd(1800, 3200), 0.06, "triangle", 0.04, 0, i * 0.05); },
  steal: () => { noise(0.08, 0.1, 2500); beep(200, 0.1, "sawtooth", 0.05, -120); },
  block: () => { noise(0.15, 0.2, 800); beep(90, 0.18, "sawtooth", 0.08, -40); },
  whoosh: () => noise(0.18, 0.06, 1800),
  thud: () => { noise(0.1, 0.12, 400); beep(80, 0.08, "triangle", 0.1); },
  crack: () => { noise(0.12, 0.2, 3000); beep(140, 0.25, "sawtooth", 0.06, -90, 0.05); },
  boing: () => beep(220, 0.35, "sine", 0.1, 500),
  ooh: () => crowd$.ooh(),
  whistle: () => { for (let i = 0; i < 7; i++) beep(i % 2 ? 2650 : 2900, 0.05, "sine", 0.07, 0, i * 0.045); beep(2800, 0.35, "sine", 0.06, -60, 0.32); },
  dribble: (v = 1) => { beep(105, 0.07, "sine", 0.16 * v, -40); noise(0.04, 0.05 * v, 700); },
  board: () => { noise(0.12, 0.16, 900); beep(160, 0.18, "triangle", 0.08, -50); beep(620, 0.12, "square", 0.02, -200, 0.01); },
  clockTick: (last) => beep(last ? 1320 : 990, last ? 0.3 : 0.08, "square", 0.05),
  roll: () => noise(0.05, 0.1, 1900, 0, "bandpass", 0.8),
  thump: () => { beep(70, 0.12, "sine", 0.2, -20); noise(0.08, 0.1, 300); },
  squeak: () => beep(rnd(2400, 3200), 0.06, "sine", 0.025, rnd(-600, 400)),
  laugh: () => { for (let i = 0; i < 6; i++) beep(rnd(300, 420), 0.07, "triangle", 0.03, 0, i * 0.09); },
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.12, "square", 0.04, 0, i * 0.08)),
  siren: () => { for (let i = 0; i < 4; i++) beep(i % 2 ? 660 : 880, 0.14, "sawtooth", 0.04, 0, i * 0.14); },
  boom: () => { noise(0.6, 0.25, 400); beep(55, 0.5, "sawtooth", 0.12, -20); },
  thunder: () => { noise(0.9, 0.25, 900); beep(60, 0.4, "sawtooth", 0.08, -20); },
  cutin: () => { noise(0.2, 0.1, 5000); beep(392, 0.1, "square", 0.05, 0); beep(784, 0.25, "square", 0.05, 0, 0.08); },
  freeze: () => { for (let i = 0; i < 5; i++) beep(2000 - i * 250, 0.08, "triangle", 0.05, 0, i * 0.04); },
  buzzer: () => beep(140, 0.7, "sawtooth", 0.07),
  cue: (go) => { beep(go ? 1175 : 1568, 0.05, "triangle", 0.06); beep(go ? 1568 : 2093, 0.07, "triangle", 0.05, 0, 0.05); },
  catch: () => { beep(330, 0.04, "square", 0.05); beep(660, 0.06, "square", 0.04, 0, 0.03); },
  passive: () => { beep(1320, 0.05, "triangle", 0.04); beep(1760, 0.09, "triangle", 0.035, 0, 0.05); },
};

// ---------- feel: hitstop, slow motion, camera ----------
let hitstop = 0, slowmo = 0;
const cam = { z: 1, fx: W / 2, fy: H / 2, amp: 0, dx: 0, dy: 0, ox: 0, oy: 0 };
function impact({ stop = 0, slow = 0, zoom = 1, at = null, shake = 0, dx = 0, dy = 0 }) {
  if (demo) return;                                                             // the attract mode behind the menu stays calm
  hitstop = Math.max(hitstop, stop); slowmo = Math.max(slowmo, slow);
  if (zoom > cam.z) { cam.z = zoom; if (at) [cam.fx, cam.fy] = at; }
  if (shake >= cam.amp) { cam.amp = shake; cam.dx = dx; cam.dy = dy; }
}
function updateCamera(dt) {
  cam.z = 1 + (cam.z - 1) * Math.exp(-dt * 5);
  cam.amp = Math.max(0, cam.amp - dt * (cam.amp * 7 + 2));
  const a = cam.amp, k = Math.sin(performance.now() / 22);
  cam.ox = cam.dx * a * k + rnd(-a, a) * 0.5; cam.oy = cam.dy * a * k + rnd(-a, a) * 0.5;
}

// ---------- effects, particles, timers ----------
let fxWorld = [], fxHud = [], parts = [], timers = [], teeth = [];
const seed = () => (Math.random() * 1e6) | 0;
const spawnW = (mod, o) => { const f = createFx(mod, { seed: seed(), ...o }); fxWorld.push(f); return f; };
const spawnH = (mod, o) => { if (!demo) fxHud.push(createFx(mod, { seed: seed(), ...o })); };
const later = (t, fn) => timers.push({ t, fn });
function part(o) { if (parts.length > 450) return; parts.push({ vx: 0, vy: 0, g: 0, s: 1, life: 0.5, floor: true, ...o, max: o.life ?? 0.5 }); }
function dust(x, n, dir = 0, y = FLOOR) {
  for (let i = 0; i < n; i++) part({ x: x + rnd(-3, 3), y: y - 1, vx: dir * rnd(10, 50) + rnd(-25, 25), vy: -rnd(8, 40), g: 80, life: rnd(0.25, 0.55), c: C.dust, s: pick([1, 1, 2]) });
}
function burst(x, y, n, c, sp = 60, life = 0.5) {
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; part({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, g: 120, life, c: Array.isArray(c) ? pick(c) : c }); }
}

// ---------- state ----------
let screen = "menu", menuSel = 0, buttons = [], cards = [], demo = true, cpu = true;
let phase = "play", stateT = 0, worldT = 0, clock = GAME_TIME, overtime = false, chaosIdx = 0;
let players = [], ball = null, lastScorer = null, bananas = [], chosen = [0, 1];
let gravMul = 1, golden = false, hype = 0, chaos = null, chaosIntro = null, chaosFx = [], strikes = [], cutin = null;
let banner = null, caption = null, flash = null, sel = null, pinned = [false, false], infoBoxes = [];

const ANKLE = ["CALL AN AMBULANCE", "HIS ANKLES ARE GONE", "HE NEEDS A DOCTOR", "PLEASE STAND UP", "FLOOR LOOKED COMFY"];
const POSTER = ["PUT IT ON A POSTER", "HE WAS IN THE PHOTO", "FRAME THAT ONE", "DISRESPECTFUL"];
const AIR = ["AIR BALL! AIR BALL!", "IT DIDNT EVEN TOUCH", "BRICK LAYER", "HE AIMED AT THE MOON"];
const SLIP = ["BANANA 1 - HUMAN 0", "WHO LEFT THAT THERE", "CLASSIC", "PHYSICS WON"];

function makePlayer(i, ci) {
  const ch = CHARS[ci], mirror = i === 1 && players[0]?.ch === ch;
  return {
    i, ch, tag: i === 0 ? (demo ? "CPU" : "P1") : cpu ? "CPU" : "P2",
    col: mirror ? ch.dark : ch.col, dark: mirror ? INK : ch.dark,
    target: i === 0 ? 1 : 0, x: 0, y: FLOOR, vx: 0, vy: 0, onGround: true, facing: 1, walk: 0,
    shooting: false, shootT: 0, stun: 0, swipe: 0, cd: 0, whiff: 0, dashT: 0, dashCd: 0, dunkWin: 0, dashDir: 1, dashRolled: false,
    fallen: 0, fallDir: 1, hang: 0, dunk: null, squash: 0, flash: 0, celebrate: 0, ghosts: [], ghostT: 0,
    frozen: 0, frozenKind: "ice", infernoT: 0, granny: 0, sp: 0.3, ptag: null, stam: 1, dashGap: 0, gather: 0, fakeT: 0, landT: 0, bitDone: false,
    msg: null, score: 0, streak: 0, fire: false, winner: false, loser: false,
    ai: { t: 0, tx: 0, plan: null, releaseAt: 0.33, jumpIn: 0, decided: false, spT: rnd(0.5, 2) },
  };
}

function newGame(kind, force = null) {
  tut = kind === "tutorial" ? { step: 0, wait: 0, done: 0, moved: 0, idle: 0, shotIn: 1.2 } : null;
  if (tut) kind = "cpu";
  demo = kind === "demo"; cpu = kind !== "pvp";
  const picks = force ?? (demo ? [Math.floor(Math.random() * CHARS.length), Math.floor(Math.random() * CHARS.length)] : chosen);
  players = [];
  players.push(makePlayer(0, picks[0])); players.push(makePlayer(1, picks[1]));
  clock = GAME_TIME; overtime = false; chaosIdx = 0; lastScorer = null; bananas = []; teeth = []; timers = []; strikes = [];
  endChaos(); gravMul = 1; golden = false; banner = caption = flash = null; cutin = null; chaosIntro = null;
  fxWorld = []; fxHud = []; parts = []; pfx = [];
  for (const h of HOOPS) Object.assign(h, { broken: false, wob: 0, net: 0 });
  ball = { x: 0, y: 0, vx: 0, vy: 0, owner: null, live: false, shooter: null, pts: 2, rimmed: false, blocked: false, counted: false, age: 0, prevY: 0, fromX: 0, trail: [], homing: null };
  setPossession(Math.random() < 0.5 ? 0 : 1);
  stateT = 0;
  if (demo) { phase = "play"; return; }
  if (tut) { tutSetup(); return; }
  phase = "countdown";
  spawnH(countdown, { x: W / 2, y: 80 });
}
function startGame(kind) { newGame(kind); setScreen("game"); }
function toMenu() { newGame("demo"); setScreen("menu"); }
function setScreen(s) { screen = s; menuSel = 0; touchReset(); if (s === "over") stateT = 0; }
function startSelect(mode) {
  sel = { mode, cur: [chosen[0], chosen[1]], lock: [false, false], spin: 0, go: 0 };
  setScreen("select");
}

function setPossession(i) {
  const off = players[i], def = players[1 - i];
  off.x = i === 0 ? 90 : 230; def.x = i === 0 ? 150 : 170;
  for (const p of players) Object.assign(p, { y: FLOOR, vx: 0, vy: 0, onGround: true, shooting: false, gather: 0, fakeT: 0, landT: 0, stun: 0, swipe: 0, whiff: 0, dashT: 0, fallen: 0, hang: 0, dunk: null, celebrate: 0, frozen: 0, granny: 0 });
  off.facing = i === 0 ? 1 : -1; def.facing = -off.facing;
  Object.assign(ball, { owner: off, live: false, shooter: null, rimmed: false, blocked: false, vx: 0, vy: 0, trail: [], homing: null });
  for (const h of HOOPS) h.broken = false;
}

const other = (p) => players[1 - p.i];
const hoopOf = (p) => HOOPS[p.target];
const courtSide = (p) => (p.x - hoopOf(p).cx) * hoopOf(p).dir;          // distance in front of the hoop it attacks
const say = (p, text, c = WHITE) => { p.msg = { text, c, t: 0.9 }; };
const announce = (text, sub = "", t = 2.2) => { if (!demo) banner = { text, sub, t, max: t }; };
const quip = (list) => { if (!demo) caption = { text: typeof list === "string" ? list : pick(list), t: 2 }; };
const shout = (text) => { if (!demo) flash = { text, t: 0.9 }; };
const gainSp = (p, v) => {
  const was = p.sp, gramps = p.ch.name === "GRAMPS";
  p.sp = Math.min(1, p.sp + v * (gramps ? 1.5 : 1));
  if (gramps && was < 1 && p.sp >= 1) passiveFx(p);                              // the bar he filled faster than anyone
};
// a passive just did its thing: an effect in that baller's theme, and its name under his feet
// at: where it happens when that isn't the body (SHADE's stealing hand, FROST's ball)
let pfx = [];
const PFX_DUR = { SHADE: 0.9, TANK: 0.8, BLAZE: 1, FROST: 0.8, VOLT: 0.7, GRAMPS: 1.1 };
function passiveFx(p, at = null) {
  if (p.ptag && p.ptag.t > 0.7) return;
  p.ptag = { t: 1.1 };
  const kind = p.ch.name;
  pfx.push({ kind, p, x: at ? at[0] : p.x, y: at ? at[1] : p.y, t: 0, dur: PFX_DUR[kind], f: p.facing, seed: Math.random() * 100 });
  const cx = at ? at[0] : p.x, cy = at ? at[1] : p.y - 20;
  if (kind === "SHADE") for (let i = 0; i < 14; i++) { const a = rnd(0, 6.28), r = rnd(14, 22); part({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 3, life: 0.32, c: pick([hex("#9a7cff"), hex("#5a3ac8"), WHITE]), floor: false }); }
  if (kind === "TANK") { dust(p.x + p.facing * 8, 10, p.facing); impact({ shake: 2, dx: p.facing }); }
  if (kind === "BLAZE") for (let i = 0; i < 20; i++) part({ x: p.x + rnd(-10, 10), y: p.y - rnd(0, 30), vy: -rnd(30, 70), vx: rnd(-15, 15), g: -30, life: rnd(0.4, 0.7), c: pick(C.fire), s: pick([1, 2, 2]), floor: false });
  if (kind === "FROST") burst(cx, cy, 12, [C.ice, C.iceHi, WHITE], 55, 0.45);
  if (kind === "GRAMPS") for (let i = 0; i < 10; i++) part({ x: p.x + rnd(-10, 10), y: p.y - rnd(10, 40), vy: -rnd(15, 35), life: rnd(0.6, 1), c: pick([C.gold, WHITE]), floor: false });
  (PFX_SFX[kind] ?? sfx.passive)();
}
const PFX_SFX = {
  SHADE: () => { beep(420, 0.3, "sawtooth", 0.04, -330); noise(0.25, 0.05, 900); },
  TANK: () => { noise(0.15, 0.18, 500); beep(110, 0.12, "square", 0.07, -40); beep(70, 0.2, "triangle", 0.08, 0, 0.04); },
  BLAZE: () => { noise(0.4, 0.09, 2200); beep(220, 0.25, "sawtooth", 0.04, 300); },
  FROST: () => { for (let i = 0; i < 4; i++) beep(1800 + i * 300, 0.06, "triangle", 0.035, 0, i * 0.04); },
  VOLT: () => { noise(0.12, 0.1, 6000); beep(1400, 0.05, "square", 0.04, -800); beep(1700, 0.05, "square", 0.03, -900, 0.06); },
  GRAMPS: () => [784, 988, 1175, 1568].forEach((f, i) => beep(f, 0.09, "triangle", 0.04, 0, i * 0.06)),
};
function updatePfx(dt) {
  for (const e of pfx) {
    e.t += dt;
    if (["TANK", "BLAZE", "VOLT", "GRAMPS"].includes(e.kind)) { e.x = e.p.x; e.y = e.p.y; e.f = e.p.facing; }
    if (e.kind === "FROST" && e.t < 0.5 && !ball.owner) { e.x = ball.x; e.y = ball.y; }   // the snowflake rides the ball out
    if (e.kind === "BLAZE" && Math.random() < 0.7) part({ x: e.x + rnd(-9, 9), y: e.y - rnd(0, 6), vy: -rnd(40, 80), g: -20, life: rnd(0.3, 0.5), c: pick(C.fire), s: 2, floor: false });
    if (e.kind === "TANK" && e.t >= e.dur && !e.done) {
      e.done = true;
      for (let i = 0; i < 14; i++) part({ x: e.x + e.f * 11 + rnd(-3, 3), y: e.y - rnd(4, 34), vx: e.f * rnd(10, 60), vy: -rnd(20, 80), g: 300, life: rnd(0.5, 0.9), c: pick([hex("#8a8698"), hex("#5c5866"), hex("#b0acbc")]), s: pick([1, 2, 2]) });
    }
  }
  pfx = pfx.filter((e) => e.t < e.dur);
}
function drawPfx(p) {
  for (const e of pfx) {
    const k = e.t / e.dur, x = Math.round(e.x), y = Math.round(e.y), fade = Math.min(1, (1 - k) * 4);
    if (e.kind === "SHADE") {
      // a small black hole opens in the stealing hand and swallows the light around it
      const r = Math.round(2 + Math.sin(Math.min(1, k * 1.4) * Math.PI) * 5);
      p.glow(x, y, 22, hex("#7a4cff"), 0.8 * fade);
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * 6.28 + e.t * 9 + e.seed, rr = (r + 4) + ((i * 37) % 7) * (1 - k);
        p.rect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.45), 2, 1, i % 3 ? hex("#9a7cff") : WHITE, fade);
      }
      p.ring(x, y, r + 1, 1, hex("#c8b0ff"), fade);
      p.disc(x, y, r, hex("#05030c"), 1);
    } else if (e.kind === "TANK") {
      // a wall of rock pops up in front of him and takes the hit
      const pop = Math.min(1, e.t / 0.08), shake = e.t < 0.25 ? Math.round(Math.sin(e.t * 90) * 1.5) : 0, sx = x + e.f * 11 + shake;
      for (let j = 0; j < 5; j++) {
        const by = y - 8 - j * 7, bw = j % 2 ? 7 : 8, hgt = Math.round(7 * pop);
        p.rect(sx - bw / 2 - 1, by - 1, bw + 2, hgt + 1, OUTLINE, fade);
        p.rect(sx - bw / 2, by, bw, hgt - 1, j % 2 ? hex("#8a8698") : hex("#a09cb0"), fade);
        p.rect(sx - bw / 2, by, bw, 1, hex("#cfcbdc"), fade);
        p.px(sx - 1 + (j % 3), by + 3, hex("#4a4658"));
      }
      if (e.t < 0.12) p.rect(sx - 6, y - 44, 12, 40, WHITE, 0.7);
    } else if (e.kind === "BLAZE") {
      // a ring of fire runs out along the floor and flames lick up his body
      const rr = Math.round(6 + k * 24);
      p.ellipse(x, FLOOR, rr, 3, C.fire[1], 0.8 * fade); p.ellipse(x, FLOOR, Math.max(1, rr - 3), 2, C.fire[2], 0.6 * fade);
      for (let i = 0; i < 7; i++) {
        const fx = x - 10 + i * 3.3, fl = 6 + Math.round((Math.sin(worldT * 20 + i * 2.1) + 1) * 6) * (1 - k * 0.6);
        p.rect(Math.round(fx), y - fl - 2, 2, fl, C.fire[i % 3], 0.85 * fade);
      }
      p.glow(x, y - 16, 30, hex("#ff6a2a"), 0.7 * fade);
    } else if (e.kind === "FROST") {
      // a snowflake grows on the ball and spins off it
      const L = Math.round(4 + Math.min(1, k * 3) * 7), rot = e.t * 5;
      for (let i = 0; i < 6; i++) {
        const a = rot + (i / 6) * 6.28, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
        p.line(x, y, Math.round(ex), Math.round(ey), C.iceHi, fade);
        const b = a + 0.6, c2 = a - 0.6, m = L * 0.6, mx = x + Math.cos(a) * m, my = y + Math.sin(a) * m;
        p.line(Math.round(mx), Math.round(my), Math.round(mx + Math.cos(b) * 3), Math.round(my + Math.sin(b) * 3), C.ice, fade);
        p.line(Math.round(mx), Math.round(my), Math.round(mx + Math.cos(c2) * 3), Math.round(my + Math.sin(c2) * 3), C.ice, fade);
        p.rect(Math.round(ex) - 1, Math.round(ey) - 1, 2, 2, WHITE, fade);
      }
      p.glow(x, y, 20, hex("#5cc4ff"), 0.8 * fade);
    } else if (e.kind === "VOLT") {
      // lightning crackles off his sneakers
      for (let b = 0; b < 3; b++) {
        let px0 = x + rnd(-4, 4), py0 = y - rnd(0, 4);
        const dir = b % 2 ? 1 : -1;
        for (let s = 0; s < 4; s++) {
          const nx = px0 + dir * rnd(3, 6), ny = py0 - rnd(-3, 5);
          p.line(Math.round(px0), Math.round(py0), Math.round(nx), Math.round(ny), s % 2 ? WHITE : C.volt, fade);
          px0 = nx; py0 = ny;
        }
      }
      p.glow(x, y - 4, 22, C.gold, 0.8 * fade);
      if (Math.floor(e.t * 20) % 2) p.ellipse(x, FLOOR + 1, 12, 2, C.volt, 0.5 * fade);
    } else if (e.kind === "GRAMPS") {
      // a golden pocket watch over his head, hands spinning: he has seen this play before
      const cy = y - 50 - Math.round(k * 6), r = 7;
      p.disc(x, cy, r + 1, OUTLINE, fade); p.disc(x, cy, r, C.gold, fade); p.disc(x, cy, r - 2, hex("#fff6d0"), fade);
      p.rect(x - 1, cy - r - 3, 3, 2, C.gold, fade);
      const a1 = e.t * 14, a2 = e.t * 3;
      p.line(x, cy, Math.round(x + Math.cos(a1) * 4), Math.round(cy + Math.sin(a1) * 4), INK, fade);
      p.line(x, cy, Math.round(x + Math.cos(a2) * 3), Math.round(cy + Math.sin(a2) * 3), C.red, fade);
      p.glow(x, cy, 20, C.gold, 0.7 * fade);
    } else if (e.kind === "ankle") {
      // broken ankles: the floor cracks under him, a shock ring runs out, the stars come out early
      const L = Math.round(Math.min(1, k * 4) * 20);
      for (const s of [-1, 1]) {
        let px0 = x, py0 = FLOOR + 1;
        for (let i = 1; i <= 4; i++) { const nx = x + s * (L * i) / 4, ny = FLOOR + 1 + ((i + (s > 0 ? 0 : 1)) % 2 ? 1 : -1) + (i > 2 ? 1 : 0); p.line(Math.round(px0), py0, Math.round(nx), ny, hex("#3a2418"), fade); px0 = nx; py0 = ny; }
      }
      p.ellipse(x, FLOOR + 1, Math.round(4 + k * 34), Math.round(2 + k * 4), WHITE, 0.6 * (1 - k));
      p.ellipse(x, FLOOR + 1, Math.round(2 + k * 22), Math.round(1 + k * 3), e.col, 0.7 * (1 - k));
      for (let s = 0; s < 4; s++) { const a = e.t * 9 + s * 1.57; p.rect(Math.round(x + Math.cos(a) * 9), Math.round(FLOOR - 6 + Math.sin(a) * 2), 2, 2, s % 2 ? WHITE : C.gold, fade); }
      if (e.t < 0.2) for (let i = 0; i < 4; i++) p.line(x - e.f * (6 + i * 5), FLOOR - 4 - i * 6, x - e.f * (16 + i * 7), FLOOR - 4 - i * 6, e.col, 1 - e.t * 5);   // the attacker's wake
    } else if (e.kind === "block") {
      // a swat: a white crescent sweeps through the ball, with speed lines thrown out the other way
      const sc = e.size, r = Math.round((7 + Math.min(1, k * 3) * 7) * sc), a0 = e.f > 0 ? 0 : Math.PI;
      for (let i = -6; i <= 6; i++) {
        const a = a0 + (i / 6) * 1.2 - Math.PI / 2 * 0.3, w2 = i === 0 ? 3 : i % 3 === 0 ? 2 : 1;
        p.rect(Math.round(x + Math.cos(a) * r) - (w2 >> 1), Math.round(y + Math.sin(a) * r) - (w2 >> 1), w2, w2, Math.abs(i) < 4 ? WHITE : e.col, fade);
      }
      for (let i = 0; i < 6; i++) { const a = a0 + Math.PI + (i - 2.5) * 0.35, r0 = 4 + k * 10; p.line(Math.round(x + Math.cos(a) * r0), Math.round(y + Math.sin(a) * r0), Math.round(x + Math.cos(a) * (r0 + 7 * sc)), Math.round(y + Math.sin(a) * (r0 + 7 * sc)), e.col, fade); }
      if (k < 0.3) p.ring(x, y, Math.round(3 + k * 30), 1, WHITE, 1 - k / 0.3);
      p.glow(x, y, 18 * sc, e.col, 0.6 * fade);
    } else if (e.kind === "steal") {
      // a quick snatch: an X of sparks where the hand met the ball, in the thief's color
      const r = Math.round(3 + k * 10);
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; p.line(Math.round(x + Math.cos(a) * (r - 4)), Math.round(y + Math.sin(a) * (r - 4)), Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), i % 2 ? WHITE : e.col, fade); }
      p.ring(x, y, Math.max(2, r - 2), 1, e.col, fade);
      p.glow(x, y, 12, e.col, 0.5 * fade);
    } else if (e.kind === "snatch") {
      // caught out of the air: two brackets close on the ball and a gold ring pops
      const g = Math.round((1 - Math.min(1, k * 3)) * 8) + 5;
      for (const s of [-1, 1]) { p.rect(x + s * g - (s > 0 ? 1 : 0), y - 5, 1, 11, WHITE, fade); p.rect(x + s * g - (s > 0 ? 2 : 0), y - 5, 3, 1, WHITE, fade); p.rect(x + s * g - (s > 0 ? 2 : 0), y + 5, 3, 1, WHITE, fade); }
      if (k > 0.25) p.ring(x, y, Math.round(4 + (k - 0.25) * 24), 1, C.gold, 1 - k);
      p.glow(x, y, 16, C.gold, 0.6 * fade);
    } else if (e.kind === "slip") {
      // the peel flies off spinning and he sweats
      const bx = x + e.f * (8 + k * 30), by = y - 10 - Math.sin(k * Math.PI) * 18, s = Math.round(Math.sin(e.t * 20) * 2);
      p.rect(Math.round(bx) - 3, Math.round(by) + s, 6, 2, C.banana, fade); p.rect(Math.round(bx) - 3, Math.round(by) - 2 - s, 2, 2, C.bananaTip, fade);
      for (let i = 0; i < 3; i++) p.rect(x - 6 + i * 6, Math.round(y - 14 + k * 10 + i), 1, 2, C.tear, fade);
    }
  }
}
// an impact effect at a spot: ankle, block, steal, snatch, slip
function hitFx(kind, x, y, col, f = 1, size = 1) {
  pfx.push({ kind, x, y, col, f, size, t: 0, dur: { ankle: 0.7, block: 0.45, steal: 0.35, snatch: 0.5, slip: 0.8 }[kind], seed: Math.random() * 100 });
}
// a callout that jumps up over a player (instead of a word in the middle of the screen)
function pop(p, text, c = WHITE) { if (!demo) p.msg = { text, c, t: 1, max: 1, big: true }; }
function drawPassiveFx(p, pl) {
  const tg = pl.ptag;
  if (!tg || tg.t <= 0) return;
  const both = other(pl).ptag && Math.abs(other(pl).x - pl.x) < 60;               // two labels at once stack instead of overlapping
  p.text(pl.ch.passive, pl.x, FLOOR + 4 + (both ? pl.i * 8 : 0), pl.col, { align: "center", outline: INK, a: Math.min(1, tg.t * 3) });
}
// passives
const fireAt = (p) => (p.ch.name === "BLAZE" ? 2 : Infinity);   // awakening is BLAZE's thing: nobody else catches fire
const perfectZone = (p) => 32 * p.ch.jmp * (p.ch.name === "FROST" ? 1.6 : 1);   // |vy| at release that counts as perfect
const busy = (p) => p.fallen > 0 || p.hang > 0 || p.dunk || p.frozen > 0 || p.stun > 0;
function dropBall(p, vx = 0, vy = -120) {
  if (ball.owner !== p) return;
  const [hx, hy] = ballHeld(p);
  Object.assign(ball, { owner: null, live: false, shooter: null, x: hx, y: hy, prevY: hy, vx, vy });
}

// ---------- AI ----------
function wantsSpecial(me, opp) {
  const has = ball.owner === me, oppHas = ball.owner === opp, gap = Math.abs(opp.x - me.x), front = courtSide(me);
  switch (me.ch.name) {
    case "BLAZE": return has ? Math.abs(me.x - hoopOf(me).cx) < 110 : gap < 30;
    case "FROST": return oppHas && gap < 150 && Math.sign(opp.x - me.x) === me.facing;
    case "VOLT": return has ? front > 60 : oppHas;
    case "TANK": return oppHas && opp.onGround && gap < 150;
    case "SHADE": return oppHas;
    case "GRAMPS": return has ? Math.abs(me.x - hoopOf(me).cx) > 50 : oppHas && gap < 140;
  }
  return false;
}

function cpuControl(me, opp, dt) {
  const c = { ...NONE }, ai = me.ai;
  ai.t -= dt; ai.spT -= dt;
  if (busy(me) || me.granny > 0) return c;
  const go = (tx, dead = 3) => { if (tx < me.x - dead) c.left = true; else if (tx > me.x + dead) c.right = true; };
  const apex = (SHOT_JUMP * me.ch.jmp) / (GRAV * gravMul);
  if (me.shooting && ball.owner === me) { c.shootHeld = me.shootT < ai.releaseAt; return c; }
  if (me.gather > 0 && ball.owner === me) { c.shootHeld = !ai.faking; return c; }   // holding through the gather, or letting go: a fake
  if (ai.jumpIn > 0 && (ai.jumpIn -= dt) <= 0) c.jump = true;
  if (me.sp >= 1 && ai.spT <= 0 && wantsSpecial(me, opp)) { c.special = true; ai.spT = rnd(...lvl(me).special); return c; }

  if (ball.owner === me) {
    const h = hoopOf(me), front = courtSide(me), dist = Math.abs(me.x - h.cx), toward = Math.sign(h.cx - me.x) || 1;
    if (!ai.plan) {
      const r = Math.random(), t3 = 0.2 + (me.ch.three - 1) * 0.6;
      ai.plan = r < t3 ? { kind: "three", at: rnd(100, 122) } : r < 0.62 ? { kind: "drive" } : { kind: "mid", at: rnd(36, 78) };
    }
    const ahead = (opp.x - me.x) * toward > 0 && Math.abs(opp.x - me.x) < 26 && opp.fallen <= 0;
    const L = lvl(me), beat = committed(opp, toward) && Math.abs(opp.x - me.x) < 40;
    // a covered shot is sometimes a fake first; a defender who bit gets attacked at once
    const shoot = () => {
      if (ahead && !beat && opp.onGround && me.fakeT <= 0 && Math.random() < L.fake) { c.shoot = c.shootHeld = true; ai.faking = true; return; }
      ai.faking = false; c.shoot = c.shootHeld = true; ai.releaseAt = apex + gauss() * L.aim; ai.plan = null;
    };
    if (beat && me.onGround && me.dashT <= 0) {
      if (me.dashCd <= 0 && courtSide(me) > 14) { c.dash = true; if (toward > 0) c.right = true; else c.left = true; return c; }
      if (me.fakeT > 0) { shoot(); return c; }
    }
    // a jab step away, then the crossover back at him
    if (ai.jabT > 0) { ai.jabT -= dt; if (toward > 0) c.left = true; else c.right = true; if (ai.jabT <= 0 && me.dashCd <= 0) { c.dash = true; if (toward > 0) c.right = true; else c.left = true; } return c; }
    if (ahead && me.dashCd <= 0 && me.onGround && Math.random() < dt * L.jab) { ai.jabT = rnd(0.12, 0.28); return c; }
    if (ai.plan.kind === "drive") {
      go(h.cx);
      if (canDunk(me) && Math.random() < 0.6) { c.shoot = true; ai.plan = null; }
      else if (front > 18 && front < 70 && me.dashCd <= 0 && !ahead) c.dash = true;
      else if (front < 18 && me.onGround) shoot();
      else if (ahead && front < 18 && me.onGround) shoot();
    } else if (dist > ai.plan.at) {
      go(h.cx);
    } else if (me.onGround && me.dashT <= 0) shoot();
  } else if (ball.owner === opp) {
    const h = hoopOf(opp), dir = Math.sign(h.cx - opp.x) || 1;
    if (ai.t <= 0) { ai.t = rnd(...lvl(me).react); ai.tx = opp.x + dir * rnd(16, 23); }
    go(ai.tx, 2);
    const L = lvl(me), near = Math.abs(opp.x - me.x) < (opp.dunk ? 46 : 32);
    // the ball goes up: a shot or a fake? the easier the CPU, the more often he jumps at it right away
    if (opp.gather > 0 && !ai.sawGather) { ai.sawGather = true; if (near && me.onGround && Math.random() < L.bite) ai.jumpIn = rnd(0.01, 0.06); }
    if ((opp.shooting || opp.dunk) && !ai.decided) {
      ai.decided = true;
      if (near && me.onGround && ai.jumpIn <= 0 && Math.random() < L.block) ai.jumpIn = opp.dunk ? rnd(0.08, 0.22) : rnd(0.02, 0.12);
    }
    if (opp.gather <= 0 && opp.fakeT <= 0) ai.sawGather = false;
    // steals: take the open window, and now and then reach in when it isn't
    if (me.cd <= 0 && stealOpen(me, opp) && Math.random() < L.steal) c.shoot = true;
    else if (me.cd <= 0 && Math.abs(opp.x - me.x) < 24 && Math.random() < dt * L.reach) c.shoot = true;
    if (Math.abs(ai.tx - me.x) > 45 && me.dashCd <= 0 && Math.random() < dt * 3) c.dash = true;
  } else {
    go(ball.x, 2);
    if (Math.abs(ball.x - me.x) < 16 && ball.y < me.y - 50 && ball.vy > -40 && me.onGround && Math.random() < 0.15) c.jump = true;
    if (Math.abs(ball.x - me.x) > 70 && me.dashCd <= 0 && Math.random() < dt * 2) c.dash = true;
  }
  if (!opp.shooting && !opp.dunk) ai.decided = false;
  // jump the bananas and the earthquake, most of the time
  for (const b of bananas) {
    if (!b.landed || b.seen?.has(me)) continue;
    const ahead = (b.x - me.x) * Math.sign(me.vx || (c.right ? 1 : c.left ? -1 : 0)) > 0;
    if (ahead && Math.abs(b.x - me.x) < 18) { (b.seen ??= new Set()).add(me); if (Math.random() < 0.55) c.jump = true; }
  }
  if (cutin?.p === opp && opp.ch.name === "TANK" && me.onGround && Math.random() < 0.45) c.jump = true;
  return c;
}

// ---------- rules ----------
// ---- the mind games ----
// a defender who has bitten on something can't stay in front: he is in the air, reaching, lunging, landing flat-footed
// from a jump, or leaning the wrong way
function committed(d, dashDir = 0) {
  if (d.whiff > 0 || d.swipe > 0 || d.dashT > 0 || d.landT > 0 || (!d.onGround && !d.dunk)) return true;
  return dashDir !== 0 && Math.sign(d.vx) === -dashDir && Math.abs(d.vx) > 45;    // moving one way as you go the other
}
// set: on his feet, square to the ball handler, not moving. Running into him loses the ball.
const isSet = (d, p) => d.onGround && d.fallen <= 0 && d.frozen <= 0 && !committed(d) && Math.abs(d.vx) < 12 && d.facing === Math.sign(p.x - d.x);
// the steal window: the ball low on its bounce, on your side of him (SHADE reaches either side). The ball flashes when it's open.
function stealOpen(p, opp) {
  if (ball.owner !== opp || opp.shooting || opp.dunk || opp.gather > 0 || opp.fakeT > 0 || !opp.onGround) return false;
  const reach = Math.abs(opp.x - p.x) <= (p.fire ? 30 : 24) + (assist(p) ? 6 : 0) && Math.abs(opp.y - p.y) <= 24;
  const side = opp.facing === Math.sign(p.x - opp.x) || p.ch.name === "SHADE";
  return reach && side && stealPhase(p, opp).open;
}
// the steal rhythm: slow enough to read and react to. Every cycle the handler's ball hangs loose for a beat
// (about 0.3s, a little longer on a phone and for good defenders), and the cue warns you just before it does.
function stealPhase(p, opp) {
  const cyc = opp.dashT > 0 ? 0.65 : 0.95, t = (worldT + opp.i * 0.37) % cyc;
  const win = Math.min(cyc * 0.45, (assist(p) ? 0.36 : 0.28) + (p.ch.def - 1) * 0.25);
  const open = t >= cyc - win || t < 0.07;                       // a short grace after it closes, for your thumb
  const warn = !open && t >= cyc - win - 0.4 ? (t - (cyc - win - 0.4)) / 0.4 : 0;   // 0..1 as it gets close
  return { open, warn };
}
// how much the defender bothers a shot: 0 open, 1 a hand in the face
function contest(p, d) {
  const dx = Math.abs(d.x - p.x);
  if (d.fallen > 0 || d.frozen > 0 || dx > 34) return 0;
  if (!d.onGround) return d.vy < 60 && dx < 26 ? 1 : 0.15;                         // up with him, or already coming down
  if (d.landT > 0 || d.whiff > 0) return 0.1;                                       // caught flat-footed
  return d.facing === Math.sign(p.x - d.x) && dx < 26 ? 0.55 * d.ch.def : 0.15;
}
const DASH_COST = (p) => (p.ch.name === "VOLT" ? 0.2 : 0.4);

function canDunk(p) {
  // a dunk takes a dash toward the rim: during it, or a moment after
  const front = courtSide(p), toward = -hoopOf(p).dir;
  return p.onGround && front > 12 && front < 78 && p.dunkWin > 0 && p.dashDir === toward;
}

function makeChance(p, def) {
  const h = hoopOf(p), dist = Math.abs(p.x - h.cx);
  let k = dist < 34 ? 0.74 : dist <= THREE ? (0.6 - (dist - 34) * 0.0022) * p.ch.shot : (0.42 - (dist - THREE) * 0.003) * p.ch.three;
  k *= 1 - contest(p, def) * 0.6;
  if (p.fire) k *= p.infernoT > 0 ? 1.4 : 1.25;
  return k;
}

function startShot(p) {
  p.shooting = true; p.shootT = 0; say$(p, "shot"); p.facing = Math.sign(hoopOf(p).cx - p.x) || 1;
  if (p.onGround) { p.vy = -SHOT_JUMP * p.ch.jmp; p.onGround = false; p.vx *= 0.3; }
}

function release(p, forced = null) {
  const def = other(p), h = hoopOf(p), dist = Math.abs(p.x - h.cx), sj = SHOT_JUMP * p.ch.jmp;
  const iceVeins = !forced && p.ch.name === "FROST" && Math.abs(p.vy) > 32 * p.ch.jmp && Math.abs(p.vy) <= perfectZone(p);
  const cont = forced ? 0 : contest(p, def), apexT = sj / (GRAV * gravMul), ms = Math.round((p.shootT - apexT) * 1000);
  let q = Math.abs(p.vy) <= perfectZone(p) ? "perfect" : Math.abs(p.vy) <= 85 ? "good" : p.vy < 0 ? "early" : "late";
  if (dist < 34 && q !== "perfect") q = "good";
  if (forced) q = "perfect";
  // timing and the contest decide it: a perfect release over an open look almost always drops, a rushed one rarely does
  const chance = forced ? 0.92 : Math.min(0.97, Math.max(0.03, makeChance(p, def) * { perfect: 1.45, good: 1, early: 0.35, late: 0.35 }[q]));
  const made = Math.random() < chance, air = !made && (q === "early" || q === "late") && Math.random() < 0.4;
  // a miss is aimed at the rim: short off the front, long off the back, or nowhere near it
  const tx = made ? h.cx + rnd(-1.2, 1.2) : air ? h.front + h.dir * rnd(12, 20) : Math.random() < 0.65 ? h.front + h.dir * rnd(0, 3) : h.back - h.dir * rnd(0, 2);
  // under the rim the ball is laid up from the court side, never shot up through the rim
  const bx = (p.x - h.cx) * h.dir < 18 ? h.cx + h.dir * 18 : p.x + p.facing * 2 * K, by = forced ? p.y - 12 * K : p.y - 28 * K;
  const g = BALL_G * gravMul, ty = h.y - 2, T = Math.max(0.75, 0.55 + Math.abs(bx - h.cx) / 190) / Math.sqrt(gravMul) * (forced ? 1.45 : 1);
  Object.assign(ball, {
    owner: null, live: true, shooter: p, pts: dist > THREE ? 3 : 2, rimmed: false, blocked: false, counted: false, age: 0, quality: q, granny: !!forced,
    x: bx, y: by, prevY: by, fromX: p.x, vx: (tx - bx) / T, vy: (ty - by - 0.5 * g * T * T) / T, trail: [], homing: null,
  });
  sfx.shoot();
  if (p.i === 0 && (q === "perfect" || q === "good")) tutHit("shoot");
  if (forced) return;
  if (q === "perfect") {
    say(p, "PERFECT", C.green); sfx.perfect(); impact({ stop: 0.05, zoom: 1.04, at: [p.x, p.y - 28 * K] });
    burst(bx, by, 10, C.green, 50, 0.3);
    if (iceVeins) passiveFx(p, [bx, by]);                                                    // only perfect thanks to the wider zone
  } else if (q === "good") say(p, "GOOD", C.gold);
  else say(p, `${q === "early" ? "EARLY" : "LATE"} ${Math.abs(ms)}MS`, C.red);           // how far off, so you can fix it
  if (cont >= 0.5) say(def, "CONTEST", C.gold);
}

function startDunk(p) {
  const h = hoopOf(p), g = GRAV * gravMul, rise = p.y - (h.y + DUNK_TOP), vy = -Math.sqrt(2 * g * rise), up = -vy / g;
  p.dunk = { t: 0, up, h, contested: false, tx: h.cx + h.dir * 3 };
  p.vx = (p.dunk.tx - p.x) / up; p.vy = vy; p.onGround = false; p.dashT = 0; p.facing = -h.dir;
  dust(p.x, 8, -p.facing); sfx.whoosh(); hype = Math.max(hype, 0.5);
  say(p, "SKY", C.gold);
}

function updateDunk(p, dt) {
  const d = p.dunk, def = other(p);
  d.t += dt;
  if (!def.onGround && def.frozen <= 0 && Math.abs(def.x - p.x) < 20 && Math.abs(def.y - p.y) < 38) d.contested = true;
  if (d.t < d.up) return;
  p.dunk = null;
  const h = d.h;
  if (Math.random() < (d.contested ? 0.45 * (p.ch.def / def.ch.def) : 0.95)) {
    p.hang = 0.45; p.x = d.tx; p.y = h.y + HANG; p.vx = p.vy = 0;
    Object.assign(ball, { owner: null, live: false, x: h.cx, y: h.y - 1, prevY: h.y - 1, vx: 0, vy: 140 });
    h.wob = 1.4;
    const shatter = Math.random() < (gravMul < 1 || p.ch.name === "TANK" ? 0.35 : 0.12);
    if (d.contested) { def.fallen = 1.4; def.fallDir = -h.dir; def.flash = 0.1; def.vy = 80; }
    if (shatter) {
      h.broken = true;
      for (let i = 0; i < 60; i++) part({ x: h.board + rnd(-1, 1), y: h.y - 26 + rnd(0, 30), vx: h.dir * rnd(10, 130), vy: rnd(-140, 20), g: 420, life: rnd(0.8, 1.6), c: pick(C.glass), s: pick([1, 1, 2]) });
      impact({ stop: 0.3, slow: 0.8, zoom: 1.22, at: [h.cx, h.y], shake: 7, dy: 1 });
      sfx.glass(); quip(["WHO PAYS FOR THAT", "THE GLASS IS GONE", "SEND THE JANITOR"]);
    } else {
      impact({ stop: 0.18, slow: d.contested ? 0.6 : 0, zoom: 1.16, at: [h.cx, h.y], shake: 5, dy: 1 });
      if (d.contested) quip(POSTER);
    }
    if (!demo) spawnW(impactFrame, { x: W / 2, y: H / 2 });
    sfx.dunk(); if (p.i === 0) tutHit("dunk");
    score(h, { dunk: true, word: shatter ? "GLASS!!" : d.contested ? "POSTER!" : "SLAM!" });
  } else {
    Object.assign(ball, { owner: null, live: false, blocked: true, shooter: null, x: p.x + p.facing * 4 * K, y: p.y - 30 * K, vx: def.facing * 110, vy: -50 });
    p.fallen = 0.9; p.fallDir = h.dir; p.flash = 0.1; p.vx = h.dir * 60;
    hitFx("block", ball.x, ball.y, def.col, def.facing, 1.6); pop(def, "DENIED!", C.gold);
    impact({ stop: 0.16, zoom: 1.12, at: [ball.x, ball.y], shake: 5, dx: def.facing });
    sfx.block(); sfx.ooh(); hype = 1; gainSp(def, 0.15); quip(["GET THAT OUT OF HERE", "NOT IN MY HOUSE", "REJECTED"]);
  }
}

function startDash(p, dir) {
  const opp = other(p);
  p.dashT = 0.2; p.dunkWin = assist(p) ? 0.55 : 0.35; p.dashDir = dir; p.facing = dir; p.dashRolled = false;
  // a dash spends stamina (VOLT's cost half); it comes back over time
  if (p.ch.name === "VOLT" && p.stam < 0.4) passiveFx(p);                          // a dash nobody else could afford right now
  p.stam = Math.max(0, p.stam - DASH_COST(p)); p.dashGap = 0.22; p.dashCd = 0.22;
  dust(p.x, 5, -dir); sfx.whoosh(); sfx.squeak();
  if (ball.owner !== p) return;
  p.dashRolled = !((opp.x - p.x) * dir > 0);                                      // only a dash at the defender can break him
}

// dashing into the defender: break his ankles, or bounce off him
function dashContact(p) {
  const d = other(p);
  if (p.dashRolled || ball.owner !== p || d.fallen > 0 || d.frozen > 0 || !d.onGround || Math.abs(d.x - p.x) > 14) return;
  p.dashRolled = true;
  if (d.ch.name !== "TANK" && committed(d, p.dashDir)) {
    d.fallen = 1.4; d.fallDir = -p.dashDir; d.vy = -70; d.onGround = false; d.flash = 0.1;
    say(p, "CROSSOVER", C.gold); gainSp(p, 0.15);
    hitFx("ankle", d.x, FLOOR, p.col, p.dashDir); pop(d, "ANKLES!", C.gold);
    impact({ stop: 0.12, slow: 0.5, zoom: 1.14, at: [d.x, d.y - 12 * K], shake: 4, dx: p.dashDir });
    sfx.crack(); sfx.ooh(); hype = 1; quip(ANKLE);
  } else {
    // into TANK it is a wall: the driver bounces back hard, stumbles, and loses the ball more often than not
    const rock = d.ch.name === "TANK";
    p.dashT = 0; p.vx = -p.dashDir * (rock ? 140 : 60); p.stun = rock ? 0.5 : 0.18; d.x += p.dashDir * (rock ? 0 : 2); d.flash = 0.06;
    if (rock) { p.vy = -60; p.onGround = false; dust(d.x + p.dashDir * 6, 8, -p.dashDir); hitFx("block", d.x - p.dashDir * 9, d.y - 22, hex("#a09cb0"), -p.dashDir); }
    say(d, "WALL", C.dim);
    if (d.ch.name === "TANK") passiveFx(d);
    impact({ stop: 0.05, shake: 2, dx: p.dashDir });
    sfx.thud();
    if (rock || isSet(d, p)) { dropBall(p, rock ? -p.dashDir * 50 : p.dashDir * 40, -100); pop(p, "STRIPPED!", C.red); hitFx("steal", p.x, p.y - 20, d.col, -p.dashDir); }
  }
}

function trySteal(p, opp) {
  p.cd = 0.7; p.swipe = 0.18; p.facing = Math.sign(opp.x - p.x) || p.facing;
  const dx = opp.x - p.x, sticky = p.ch.name === "SHADE";
  if (!stealOpen(p, opp)) { p.whiff = sticky ? 0.2 : 0.45; say(p, "WHIFF", C.dim); sfx.whoosh(); return; }
  const [hx, hy] = ballHeld(opp);
  dropBall(opp, -Math.sign(dx) * 45, -90);
  opp.stun = 0.45; opp.flash = 0.08; gainSp(p, 0.15);
  hitFx("steal", hx, hy, p.col, Math.sign(dx) || 1);
  impact({ stop: 0.08, zoom: 1.06, at: [hx, hy], shake: 3, dx: -Math.sign(dx) });
  sfx.steal(); hype = Math.max(hype, 0.5); say$(p, "steal"); if (p.i === 0) tutHit("steal");
  pop(p, "STEAL!", p.col);
  if (sticky) passiveFx(p, [hx, hy]);
}

function slip(p, b) {
  p.fallen = 1; p.fallDir = Math.sign(p.vx) || p.facing; p.vy = -150; p.onGround = false; p.flash = 0.06;
  bananas.splice(bananas.indexOf(b), 1);
  spawnW(poof, { x: b.x, y: FLOOR });
  dropBall(p, p.vx * 0.5, -160);
  p.dunk = null; p.shooting = false;
  hitFx("slip", p.x, p.y - 16, C.banana, p.fallDir); pop(p, "SLIP!", C.banana);
  impact({ stop: 0.06, slow: 0.4, zoom: 1.08, at: [p.x, p.y], shake: 3 });
  sfx.boing(); sfx.laugh(); hype = 1; quip(SLIP);
}

// ---------- specials ----------
function trySpecial(p) {
  if (p.sp < 1 || busy(p) || p.shooting || p.granny > 0 || cutin || phase !== "play") return;
  if (p.ch.name === "SHADE" && ball.owner === p) { say(p, "GOT IT ALREADY", C.dim); return; }
  p.sp = 0;
  if (p.i === 0) tutHit("special");
  if (demo) { SPECIALS[p.ch.name](p); return; }
  cutin = { p, t: 0, dur: 0.85, fn: () => SPECIALS[p.ch.name](p) }; duckMusic(1);
  sfx.cutin(); say$(p, "big");
}

function zapped(p, t = 1) {
  p.stun = t; p.flash = 0.12; dropBall(p, rnd(-40, 40), -120);
  spawnW(zap, { x: p.x, y: p.y - 14 * K });
  for (let i = 0; i < 12; i++) part({ x: p.x + rnd(-6, 6) * K, y: p.y - rnd(0, 26) * K, vx: rnd(-40, 40), vy: rnd(-40, 40), life: 0.3, c: C.volt, floor: false });
}

const SPECIALS = {
  BLAZE(p) {
    const f = spawnW(flamePillar, { x: p.x, y: FLOOR });
    later(1.4, () => f.stop());
    p.fire = true; p.infernoT = 10;
    const o = other(p);
    if (Math.abs(o.x - p.x) < 50) {
      const d = Math.sign(o.x - p.x) || 1;
      o.fallen = 1; o.fallDir = d; o.vx = d * 150; o.vy = -160; o.onGround = false; o.flash = 0.12;
      dropBall(o, d * 60, -150);
    }
    impact({ stop: 0.1, zoom: 1.12, at: [p.x, p.y - 20 * K], shake: 6, dy: 1 });
    sfx.boom(); hype = 1; shout("INFERNO!"); quip("HE IS LITERALLY ON FIRE");
  },
  FROST(p) {
    const o = other(p), f = p.facing;
    spawnW(iceSpikes, { x: p.x + f * 6 * K, y: FLOOR, flip: f < 0 });
    sfx.freeze();
    later(0.25, () => {
      if ((o.x - p.x) * f > 0 && Math.abs(o.x - p.x) < 230 && o.y > FLOOR - 30) {
        o.frozen = 2.2; o.frozenKind = "ice"; o.vx = 0; o.dunk = null; o.shooting = false;
        dropBall(o, 0, -40);
        impact({ stop: 0.12, zoom: 1.1, at: [o.x, o.y - 14 * K], shake: 4, dx: f });
        sfx.glass(); shout("FROZEN!"); quip(["STAY FROSTY", "CHILL OUT", "ICE ICE BABY"]);
      } else say(o, "DODGED", C.ice);
    });
  },
  VOLT(p) {
    const o = other(p), h = hoopOf(p);
    spawnW(zap, { x: p.x, y: p.y - 14 * K });
    if (Math.abs(o.x - p.x) < 40) zapped(o, 0.8);
    if (ball.owner === p) {
      p.x = h.cx + h.dir * 40; p.y = FLOOR; p.vx = p.vy = 0; p.onGround = true; p.dashDir = -h.dir;
      spawnW(lightning, { x: p.x, y: FLOOR });
      startDunk(p);
    } else {
      const tx = ball.owner === o ? o.x + o.facing * 16 : ball.x;
      p.x = clamp(tx, 8, W - 8); p.y = FLOOR; p.vy = 0; p.onGround = true;
      spawnW(lightning, { x: p.x, y: FLOOR });
      if (ball.owner === o) { zapped(o, 0.9); }
    }
    impact({ stop: 0.1, zoom: 1.12, at: [p.x, p.y - 20 * K], shake: 5 });
    sfx.thunder(); hype = 1; shout("THUNDER STEP!");
  },
  TANK(p) {
    const o = other(p);
    // two quakes: the slam, and an aftershock that catches anyone who jumped the first one and landed
    const shock = (big) => {
      spawnW(quake, { x: p.x, y: FLOOR });
      dust(p.x, big ? 30 : 18, 0);
      for (const h of HOOPS) h.wob = big ? 1.2 : 0.8;
      if (o.onGround && o.y >= FLOOR - 2 && o.hang <= 0 && o.fallen <= 0) {
        o.fallen = 1.8; o.fallDir = Math.sign(o.x - p.x) || 1; o.vy = -110; o.onGround = false; o.flash = 0.1;
        dropBall(o, Math.sign(p.x - o.x) * 90, -170);                               // the ball bounces his way
        quip(["THE FLOOR IS LAVA. NO, ROCKS", "RICHTER SCALE: YES"]);
      } else if (o.fallen <= 0) say(o, "JUMPED IT", C.gold);
      if (!ball.owner) ball.vy -= big ? 120 : 80;
      impact({ stop: big ? 0.14 : 0.06, zoom: big ? 1.08 : 1.04, shake: big ? 9 : 6, dy: 1 });
      sfx.boom();
    };
    shock(true); shout("EARTHQUAKE!"); hype = 1;
    later(0.55, () => { if (phase === "play") shock(false); });
  },
  SHADE(p) {
    const f = spawnW(blackHole, { x: ball.x, y: ball.y + 20 });
    later(1.3, () => f.stop());
    const o = other(p);
    if (ball.owner === o) { o.stun = 0.5; }
    dropBall(o, 0, -30);
    if (!ball.owner) { ball.homing = p; ball.homeT = 1.6; ball.live = false; ball.shooter = null; }
    impact({ stop: 0.08, zoom: 1.1, at: [ball.x, ball.y], shake: 4 });
    sfx.boom(); shout("BLACK HOLE!"); quip(["YOINK", "PHYSICS SAYS NO", "IT JUST... LEFT"]);
  },
  GRAMPS(p) {
    const o = other(p);
    if (ball.owner === p) {
      spawnW(timeStop, { x: p.x, y: FLOOR });
      o.frozen = 2.4; o.frozenKind = "time"; o.vx = 0;
      p.granny = 0.5; p.vx = 0; p.facing = Math.sign(hoopOf(p).cx - p.x) || 1;
      later(0.5, () => { if (ball.owner === p) release(p, true); });
      shout("TIME OUT!"); quip(["BACK IN MY DAY...", "GRANNY STYLE", "HE INVENTED THIS"]);
      sfx.freeze();
    } else {
      teeth.push({ x: p.x + p.facing * 6 * K, y: p.y - 22 * K, vx: p.facing * 210, vy: -40, from: p, spin: 0 });
      shout("DENTURES!"); sfx.whoosh();
    }
    impact({ stop: 0.06, zoom: 1.06, at: [p.x, p.y - 20 * K], shake: 2 });
  },
};

function updatePlayer(p, c, dt) {
  const opp = other(p), g = GRAV * gravMul;
  for (const k of ["cd", "swipe", "whiff", "dashGap", "dunkWin", "squash", "flash", "celebrate", "granny"]) p[k] -= dt;
  p.stam = Math.min(1, p.stam + dt * 0.3);
  p.dashCd = p.stam >= DASH_COST(p) ? Math.max(0, p.dashGap) : (DASH_COST(p) - p.stam) / 0.3;
  p.landT -= dt;
  if (p.msg && (p.msg.t -= dt) <= 0) p.msg = null;
  const down = p.fallen > 0 || p.stun > 0.3 || (p.frozen > 0 && p.frozenKind === "ice");
  if (down && !p.hurt) { p.hurt = true; if (!p.loser) say$(p, "hurt"); } else if (!down) p.hurt = false;
  if (p.ptag && (p.ptag.t -= dt) <= 0) p.ptag = null;
  for (const gh of p.ghosts) gh.a -= dt * 3;
  p.ghosts = p.ghosts.filter((gh) => gh.a > 0);
  if (phase === "play") gainSp(p, dt * 0.045);
  if (p.infernoT > 0 && (p.infernoT -= dt) <= 0 && p.streak < fireAt(p)) p.fire = false;
  if (p.fire && Math.random() < (p.infernoT > 0 ? 1 : 0.5)) part({ x: p.x + rnd(-4, 4) * K, y: p.y - rnd(4, 22) * K, vy: -rnd(20, 45), g: -20, life: rnd(0.25, 0.45), c: pick(C.fire), floor: false });
  if (p.hang > 0) {
    if ((p.hang -= dt) <= 0) { p.vy = 30; dust(p.x, 4); }
    return;
  }
  if (p.frozen > 0) {
    c = NONE; if (p.onGround) p.vx = 0;
    if ((p.frozen -= dt) <= 0 && p.frozenKind === "ice") { spawnW(iceShatter, { x: p.x - 10, y: p.y - 4 * K }); burst(p.x, p.y - 14 * K, 14, C.glass, 70, 0.6); sfx.glass(); }
    if (p.frozenKind === "time") { p.vx = p.vy = 0; return; }
  } else if (p.fallen > 0) { p.fallen -= dt; c = NONE; if (p.onGround) p.vx *= 0.85; }
  else if (p.stun > 0) { p.stun -= dt; c = NONE; }
  else if (p.granny > 0) c = NONE;
  if (c.special) trySpecial(p);
  const has = ball.owner === p, dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);

  if (c.dash && p.dashCd <= 0 && p.onGround && !p.shooting && !p.dunk) startDash(p, dir || p.facing);
  if (p.dashT > 0) {
    p.dashT -= dt; p.vx = p.dashDir * SPEED * DASH * p.ch.spd;
    if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.03; p.ghosts.push({ x: p.x, y: p.y, f: p.facing, a: 0.6 }); }
    dashContact(p);
  } else if (!p.shooting && !p.dunk && p.fallen <= 0 && p.frozen <= 0 && p.gather <= 0) {
    const sp = SPEED * p.ch.spd * (cpu && p.i === 1 && !demo ? lvl(p).speed : 1) * (has ? 0.92 : 1) * (p.whiff > 0 ? 0.35 : 1) * (p.fire ? 1.12 : 1);
    if (p.onGround) p.vx = dir * sp; else p.vx += (dir * sp - p.vx) * Math.min(1, dt * 3);
    if (dir) p.facing = dir;
  }
  if (c.jump && p.onGround && !p.shooting && p.whiff <= 0 && !p.dunk) { p.vy = -JUMP * p.ch.jmp * (p.fire ? 1.15 : 1); p.onGround = false; dust(p.x, 3); if (Math.random() < 0.3) say$(p, "hup"); }
  if (c.shoot) {
    // with the ball: a dunk if you're driving at the rim; otherwise you gather (ball up), and holding through it is a shot
    if (has && !p.shooting && !p.dunk && p.gather <= 0) { if (canDunk(p)) startDunk(p); else if (p.onGround) p.gather = 0.13; else startShot(p); }
    else if (!has && p.cd <= 0 && ball.owner === opp) trySteal(p, opp);
  }
  if (p.gather > 0) {
    p.vx = 0;
    if (!c.shootHeld || ball.owner !== p) {
      // let go early: a pump fake. Whoever jumps at it is in the air while you go.
      p.gather = 0;
      if (ball.owner === p) { p.fakeT = 0.4; p.bitDone = false; sfx.whoosh(); beep(520, 0.08, "square", 0.04, 300); if (!demo) say(p, "FAKE", C.dim); }
    } else if ((p.gather -= dt) <= 0) { p.gather = 0; startShot(p); }
  }
  if (p.fakeT > 0) {
    p.fakeT -= dt;
    if (!p.bitDone && !opp.onGround && !opp.dunk && Math.abs(opp.x - p.x) < 40) {
      p.bitDone = true; pop(opp, "BIT!", C.gold); sfx.boing(); hype = Math.max(hype, 0.6);
      impact({ slow: 0.3, zoom: 1.07, at: [opp.x, opp.y - 30] }); hitFx("steal", opp.x, opp.y - 44, C.gold, 1);
      if (!demo) crowd$.ooh();
      if (p.i === 0) tutHit("fake");
    }
  }
  if (p.shooting) {
    p.shootT += dt;
    if (ball.owner === p && ((!c.shootHeld && p.shootT > 0.03) || p.vy > 150)) release(p);
    if (p.onGround && p.shootT > 0.1) { if (ball.owner === p) release(p); p.shooting = false; }
  }
  if (p.dunk) updateDunk(p, dt);
  if (p.hang > 0) return;

  const wasAir = !p.onGround, fallV = p.vy;
  p.vy += g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  if (p.y >= FLOOR) {
    p.y = FLOOR; p.vy = 0; p.onGround = true;
    if (wasAir) { p.squash = 0.1; if (p.fallen <= 0 && fallV > 120) p.landT = 0.2; dust(p.x, fallV > 250 ? 10 : 4); if (fallV > 250) impact({ shake: 1.5, dy: 1 }); if (p.fallen > 0) sfx.thud(); }
  } else p.onGround = false;
  p.x = clamp(p.x, 8, W - 8);
  if (p.y < 50) { p.y = 50; p.vy = Math.max(p.vy, 0); }                          // moon jumps stop at the rafters, not off the screen
  p.walk += Math.abs(p.vx) * dt;
  const dirNow = Math.sign(Math.round(p.vx / 20));
  if (dirNow && p.lastDir && dirNow !== p.lastDir && p.onGround && !demo && Math.random() < 0.7) sfx.squeak();   // a hard cut
  if (dirNow) p.lastDir = dirNow;
  if (gravMul < 1 && !p.onGround && Math.random() < 0.3) part({ x: p.x + rnd(-3, 3), y: p.y, life: 0.4, c: C.moon, floor: false });
  for (const b of bananas) if (b.landed && p.onGround && Math.abs(p.vx) > 15 && Math.abs(b.x - p.x) < 7 && p.fallen <= 0) { slip(p, b); break; }
}

function ballHeld(p) {
  if (p.dunk) return [p.x + p.facing * 4 * K, p.y - 31 * K];
  if (p.granny > 0) return [p.x + p.facing * 3 * K, p.y - 10 * K];
  if (p.shooting) return [p.x + p.facing * 2 * K, p.y - 28 * K];
  if (p.fakeT > 0.27) return [p.x + p.facing * 2 * K, p.y - 31 * K];                 // the fake: the ball high over his head
  if (p.gather > 0 || p.fakeT > 0.2) return [p.x + p.facing * 3 * K, p.y - 22 * K];   // ball up: the gather
  if (!p.onGround) return [p.x + p.facing * 6 * K, p.y - 14 * K];
  if (p.frozen > 0) return [p.x + p.facing * 7 * K, p.y - 12 * K];
  const hand = p.y - 12 * K, ph = Math.abs(Math.sin(worldT * (p.dashT > 0 ? 16 : 9)));
  return [clamp(p.x + p.facing * 7 * K, BR, W - BR), hand + (FLOOR - BR - hand) * ph];   // at the wall he dribbles on the inside
}

function collidePoint(px, py) {
  const dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy), r = BR + 1;
  if (d >= r || d === 0) return false;
  const nx = dx / d, ny = dy / d, vn = ball.vx * nx + ball.vy * ny;
  ball.x = px + nx * r; ball.y = py + ny * r;
  if (vn < 0) { ball.vx -= 1.55 * vn * nx; ball.vy -= 1.55 * vn * ny; ball.vx *= 0.9; }
  return true;
}

function updateBall(dt) {
  if (ball.owner) {
    const o = ball.owner, low = ball.y > FLOOR - BR - 4 && o.onGround && !o.shooting && !o.dunk && o.granny <= 0;
    if (low && !o.dribbleLow && !demo) sfx.dribble(o.i === 0 ? 1 : 0.7);
    o.dribbleLow = low;
  }
  if (ball.owner) { [ball.x, ball.y] = ballHeld(ball.owner); ball.x = clamp(ball.x, BR, W - BR); ball.prevY = ball.y; ball.trail = []; return; }
  ball.age += dt; ball.prevY = ball.y;
  if (ball.homing) {
    // pulled by a black hole into SHADE's hands
    const p = ball.homing, tx = p.x + p.facing * 6 * K, ty = p.y - 16 * K, dx = tx - ball.x, dy = ty - ball.y, d = Math.hypot(dx, dy);
    const sp = Math.min(260, d * 7);
    ball.vx += ((dx / (d || 1)) * sp - ball.vx) * Math.min(1, dt * 8); ball.vy += ((dy / (d || 1)) * sp - ball.vy) * Math.min(1, dt * 8);
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 10) ball.trail.shift();
    if (Math.random() < 0.6) part({ x: ball.x + rnd(-4, 4), y: ball.y + rnd(-4, 4), vx: -ball.vx * 0.2, vy: -ball.vy * 0.2, life: 0.3, c: hex("#9a7cff"), floor: false });
    if (d < 9 || (ball.homeT -= dt) <= 0) { if (d < 20 && !busy(p)) ball.owner = p; ball.homing = null; }
    return;
  }
  if (ball.live && (ball.quality === "perfect" || golden || ball.shooter?.fire)) { ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 8) ball.trail.shift(); }
  else if (ball.trail.length) ball.trail.shift();
  ball.vy += BALL_G * gravMul * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  for (const h of HOOPS) {
    if (collidePoint(h.front, h.y) || collidePoint(h.back, h.y)) {
      if (!ball.rimmed || Math.abs(ball.vy) > 40) { sfx.rim(); h.wob = Math.max(h.wob, 0.6); }
      ball.rimmed = true; ball.live = false;
    }
    const face = h.board + h.dir;
    if (!h.broken && ball.y > h.y - 26 && ball.y < h.y + 4 && (ball.x - face) * h.dir < BR && ball.vx * h.dir < 0) {
      ball.x = face + h.dir * BR; ball.vx = -ball.vx * 0.6; ball.rimmed = true; ball.live = false; sfx.board(); h.wob = Math.max(h.wob, 0.4);
    }
    if (phase === "play" && ball.prevY < h.y && ball.y >= h.y && ball.vy > 0 && ball.x > h.lo + 2 && ball.x < h.hi - 2) return score(h);
  }
  if (ball.y > FLOOR - BR) {
    ball.y = FLOOR - BR; ball.vx *= 0.82;
    if (ball.shooter && ball.rimmed && !ball.blocked && !ball.counted && phase === "play" && !demo) {
      ball.counted = true; crowd$.ooh(); say(ball.shooter, "SO CLOSE", C.dim);
    }
    if (ball.shooter && !ball.rimmed && !ball.blocked && !ball.counted && phase === "play") {
      ball.counted = true; say(ball.shooter, "AIRBALL", C.dim); sfx.laugh(); crowd$.aww(); hype = 0.8; quip(AIR);
    }
    ball.live = false;
    if (ball.vy > 30) sfx.bounce();
    ball.vy = Math.abs(ball.vy) < 25 ? 0 : -ball.vy * 0.62;
  }
  if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx) * 0.5; }
  if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx) * 0.5; }

  // blocks: a defender in the air meets the ball on its way up (a granny shot is too slow and too high to block)
  if (ball.live && ball.vy < 0 && ball.age < 0.5 && !ball.granny) {
    const s = ball.shooter, d = other(s);
    if (!d.onGround && d.frozen <= 0 && Math.abs(ball.x - d.x) < (d.fire ? 12 : 9) && ball.y > d.y - (d.fire ? 63 : 56) && ball.y < d.y - 34) return snatch(d);   // right in his hands
    if (!d.onGround && d.frozen <= 0 && Math.abs(ball.x - d.x) < (assist(d) ? 16 : 12) && ball.y > d.y - 60 && ball.y < d.y - 12) {
      ball.live = false; ball.blocked = true; ball.vx = -ball.vx * 0.5 + d.facing * 30; ball.vy = 50;
      hitFx("block", ball.x, ball.y, d.col, d.facing); pop(d, "BLOCK!", C.gold); if (d.i === 0) tutHit("block");
      impact({ stop: 0.12, zoom: 1.1, at: [ball.x, ball.y], shake: 5, dx: d.facing });
      sfx.block(); sfx.ooh(); hype = 1; gainSp(d, 0.15);
      if (Math.random() < 0.2) { s.fallen = 0.7; s.fallDir = -s.facing; s.flash = 0.1; burst(s.x, s.y - 26 * K, 8, C.gold); sfx.boing(); quip("BALL TO THE FACE"); }
      return;
    }
  }
  // catching: a loose ball anywhere on the body, and in the air anything the raised hands touch (even his shot on the way down)
  for (const p of players) {
    if (busy(p) || ball.owner) continue;
    const air = !p.onGround, hands = air && Math.abs(ball.x - p.x) < (p.fire ? 13 : 10) && ball.y > p.y - (p.fire ? 63 : 56) && ball.y < p.y - 30;
    if (ball.live) { if (ball.shooter !== p && hands && !ball.granny) return snatch(p); continue; }
    if (hands || (Math.abs(ball.x - p.x) < 13 && ball.y > p.y - 46 && ball.y < p.y + 2)) {
      const high = air && ball.y < p.y - 30;
      ball.owner = p; ball.shooter = null; p.ai.plan = null;
      if (p.shooting) p.shooting = false;
      if (high && phase === "play") { say(p, "MINE", C.gold); sfx.catch(); burst(ball.x, ball.y, 6, WHITE, 40, 0.25); }
      break;
    }
  }
}

// a shot caught out of the air by the defender
function snatch(p) {
  const s = ball.shooter;
  Object.assign(ball, { owner: p, live: false, shooter: null, blocked: true, trail: [], homing: null });
  p.ai.plan = null; p.shooting = false;
  hitFx("snatch", ball.x, ball.y, p.col, p.facing); pop(p, "SNATCHED!", C.gold); if (p.i === 0) tutHit("block");
  impact({ stop: 0.1, zoom: 1.08, at: [ball.x, ball.y], shake: 3, dx: p.facing });
  sfx.steal(); sfx.ooh(); hype = 1; gainSp(p, 0.15); say$(p, "steal");
  if (s) say(s, "HEY!", C.red);
  quip(["MINE NOW", "THANKS FOR THE PASS", "HE JUST TOOK IT", "SPECIAL DELIVERY"]);
}

function updateTeeth(dt) {
  for (const t of teeth) {
    t.vy += 120 * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.spin += dt;
    const o = other(t.from);
    if (!t.hit && Math.abs(t.x - o.x) < 10 && t.y > o.y - 46 && t.y < o.y - 2) {
      t.hit = true; o.stun = 1.2; o.flash = 0.12; dropBall(o, t.vx * 0.2, -110);
      burst(t.x, t.y, 10, WHITE, 50, 0.4);
      spawnW(hitSpark, { x: t.x, y: t.y + 6, flip: t.vx < 0 });
      impact({ stop: 0.1, zoom: 1.1, at: [t.x, t.y], shake: 4, dx: Math.sign(t.vx) });
      sfx.crack(); sfx.laugh(); pop(o, "CHOMP!", WHITE); quip(["HE BIT HIM", "GRANDPA PLEASE", "THOSE WERE EXPENSIVE"]);
    }
  }
  teeth = teeth.filter((t) => !t.hit && t.y < FLOOR && t.x > -10 && t.x < W + 10);
}

function score(h, info = {}) {
  const p = players[HOOPS.indexOf(h) === 1 ? 0 : 1], o = other(p), shot = ball.shooter === p;
  let pts = info.dunk ? 2 : shot ? ball.pts : 2;
  const gold = golden;
  if (golden) { pts *= 2; golden = false; if (chaos?.kind === "golden") endChaos(); }
  p.score += pts; p.streak = lastScorer === p ? p.streak + 1 : 1; lastScorer = p; o.streak = 0;
  duckMusic(info.dunk || pts >= 3 ? 1 : 0.6);
  if (!demo && p.ch.name !== "BLAZE" || (!demo && p.streak >= 3)) {
    if (p.streak === 2) later(0.9, () => quip("TWO IN A ROW"));
    if (p.streak === 3) later(0.9, () => { quip("HE IS ON A ROLL"); crowd$.stomp(); });
    if (p.streak >= 4) later(0.9, () => { quip("SOMEBODY STOP HIM"); crowd$.horn(1); });
  }
  if (o.infernoT <= 0) o.fire = false;
  gainSp(p, 0.2); gainSp(o, 0.25);
  const lit = p.streak >= fireAt(p) && !p.fire;
  if (p.streak >= fireAt(p)) p.fire = true;
  if (lit && fireAt(p) < 3) passiveFx(p);                                         // lit a make earlier than anyone else
  const swish = shot && !ball.rimmed, layup = shot && Math.abs(ball.fromX - h.cx) < 34, perfect = shot && ball.quality === "perfect";
  const granny = shot && ball.granny;
  Object.assign(ball, { owner: null, live: false, shooter: null, vx: ball.vx * 0.2, vy: Math.max(ball.vy, 60), homing: null });
  h.net = 1; h.wob = Math.max(h.wob, 0.3);
  const word = info.word ?? (granny ? "GRANNY!" : lit ? "ON FIRE!" : !shot ? "PUTBACK!" : pts >= 3 && !gold ? "3PT!" : swish ? "SWISH!" : layup ? "LAYUP!" : perfect ? "WET!" : "NICE!");
  spawnW(collect, { x: h.cx, y: h.y + 22 });
  spawnW(dmgNum, { x: h.cx + h.dir * 4, y: h.y - 6, text: "+" + pts });
  if (info.dunk) spawnH(critNum, { x: W / 2, y: 62, text: "+" + pts, label: word.replace(/!/g, "") });
  else spawnH(pow, { x: W / 2, y: 64, text: word });
  if (gold) quip("GOLDEN BALL  X2");
  if (lit) { if (p === players[0]) buzz([30, 40, 60]); quip("AWAKENED: BIGGER, HIGHER, HOTTER"); pop(p, "AWAKENED!", C.fire[1]); for (let i = 0; i < 30; i++) part({ x: p.x + rnd(-12, 12), y: p.y - rnd(0, 44), vy: -rnd(40, 110), vx: rnd(-20, 20), g: -30, life: rnd(0.4, 0.9), c: pick(C.fire), s: 2, floor: false }); }
  if (info.dunk || lit || pts >= 3) spawnW(firework, { x: h.cx + h.dir * 50, y: 56 });
  if (!info.dunk) impact({ zoom: pts >= 3 ? 1.08 : 1.04, at: [h.cx, h.y + 6], shake: pts >= 3 ? 3 : 1.5, dy: 1 });
  if (!info.dunk) (pts >= 3 ? sfx.three : sfx.score)();
  hype = Math.max(hype, pts >= 3 || info.dunk ? 1 : 0.5);
  if (clock <= 0 && !overtime && !demo) { quip("BUZZER BEATER!!"); impact({ slow: 0.8 }); }
  p.celebrate = 1.6;
  say$(p, info.dunk || pts >= 3 ? "big" : "score");
  if (!demo) crowd$.cheer(info.word === "GLASS!!" || (clock <= 0 && !overtime) ? 3 : info.dunk || pts >= 3 || lit ? 2 : 1);
  phase = "scored"; stateT = 0;
}

function endGame() {
  phase = "done"; sfx.buzzer(); endChaos();
  const [a, b] = players, win = a.score === b.score ? null : a.score > b.score ? a : b;
  if (!demo) {
    // the sting is from the human's side: against the CPU, P1 losing is a loss; two humans always get the fanfare
    const lost = win && cpu && win.i === 1;
    if (win) { say$(win, "win"); if (cpu) say$(other(win), "hurt"); }
    if (!win) crowd$.aww(); else if (lost) crowd$.lose(); else crowd$.win();
  }
  if (win) { const l = other(win); win.winner = true; l.loser = true; l.fallen = 999; l.fallDir = l.facing; l.frozen = 0; }
  spawnH(confetti, { x: W / 2, y: FLOOR });
  if (win) spawnW(firework, { x: win.i === 0 ? 220 : 100, y: 60 });
  hype = 1;
  setScreen("over");
}

// ---------- chaos ----------
const CHAOS = {
  moon: { name: "MOON GRAVITY", sub: "EVERYONE FLOATS", col: hex("#b0a8ff"), dur: 10,
    start: () => { gravMul = 0.42; chaosFx.push(spawnW(shootingStars, { x: W / 2, y: H })); }, end: () => { gravMul = 1; } },
  banana: { name: "BANANA RAIN", sub: "WATCH YOUR STEP", col: hex("#ffe03c"), dur: 3,
    start: () => { for (let i = 0; i < 8; i++) bananas.push({ x: rnd(44, 276), y: -rnd(10, 160), vy: 0, landed: false, life: 18, spin: rnd(0, 6) }); } },
  bighead: { name: "BIG HEAD MODE", sub: "HUGE BRAIN ENERGY", col: hex("#ff86e6"), dur: 12,
    start: () => { for (const p of players) spawnW(poof, { x: p.x, y: p.y - 14 * K }); } },
  golden: { name: "GOLDEN BALL", sub: "NEXT BASKET X2", col: hex("#ffc23c"), dur: 0,
    start: () => { golden = true; chaosFx.push(spawnW(godRays, { x: W / 2, y: FLOOR + 20 })); }, end: () => { golden = false; } },
  storm: { name: "LIGHTNING STORM", sub: "DONT STAND STILL", col: hex("#8cf0ff"), dur: 9,
    start: () => { chaosFx.push(spawnW(storm, { x: W / 2, y: FLOOR + 20 })); chaos.next = 0.6; } },
};
let chaosBag = [];
function startChaos(kind) {
  if (!kind) { if (!chaosBag.length) chaosBag = Object.keys(CHAOS).sort(() => Math.random() - 0.5); kind = chaosBag.pop(); }
  if (demo) { beginChaos(kind); return; }
  chaosIntro = { kind, t: 0, dur: 2.1, lockAt: 1.15, locked: false, shown: 0, last: -1 };
  sfx.siren();
}
function beginChaos(kind) {
  endChaos();
  const ev = CHAOS[kind];
  chaos = { kind, t: ev.dur, dur: ev.dur };
  ev.start();
  spawnW(poof, { x: W / 2, y: 112 });
  hype = 1;
}
function endChaos() {
  if (!chaos) return;
  CHAOS[chaos.kind].end?.();
  for (const f of chaosFx) f.stop();
  chaosFx = []; strikes = [];
  chaos = null;
}
function updateChaos(dt) {
  if (!chaos) return;
  if (chaos.kind === "storm") {
    if ((chaos.next -= dt) <= 0) {
      chaos.next = rnd(0.7, 1.2);
      const target = Math.random() < 0.5 ? pick(players).x + rnd(-10, 10) : rnd(30, 290);
      strikes.push({ x: clamp(target, 20, 300), t: 0.7 });
    }
    for (const s of strikes) if ((s.t -= dt) <= 0 && !s.done) {
      s.done = true;
      spawnW(lightning, { x: s.x, y: FLOOR });
      impact({ shake: 3, dy: 1 }); sfx.thunder();
      for (const p of players) if (Math.abs(p.x - s.x) < 18 && p.hang <= 0) { zapped(p, 1.1); p.fallen = 0.8; p.fallDir = Math.sign(p.x - s.x) || 1; pop(p, "ZAPPED!", C.volt); }
      if (!ball.owner && Math.abs(ball.x - s.x) < 14) { ball.vy = -220; ball.vx = rnd(-80, 80); }
    }
    strikes = strikes.filter((s) => !s.done || s.t > -0.2);
  }
  if (chaos.dur > 0 && (chaos.t -= dt) <= 0) endChaos();
}

// ---------- simulation ----------
function step(dt) {
  touchFrame(dt);
  if (tut && screen === "game") tutUpdate(dt);
  stateT += dt; worldT += dt;
  for (const f of fxWorld) f.update(dt);
  for (const f of fxHud) f.update(dt);
  fxWorld = fxWorld.filter((f) => !f.done()); fxHud = fxHud.filter((f) => !f.done());
  for (const q of parts) {
    q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.floor && q.y > FLOOR + 2) { q.y = FLOOR + 2; q.vy *= -0.3; q.vx *= 0.6; }
  }
  parts = parts.filter((q) => q.life > 0);
  updatePfx(dt);
  for (const t of timers) t.t -= dt;
  const due = timers.filter((t) => t.t <= 0);
  timers = timers.filter((t) => t.t > 0);
  for (const t of due) t.fn();
  for (const b of bananas) {
    b.life -= dt; b.spin += dt * 8;
    if (!b.landed) { b.vy += 300 * dt * gravMul; b.y += b.vy * dt; if (b.y >= FLOOR) { b.y = FLOOR; b.landed = true; dust(b.x, 3); } }
  }
  bananas = bananas.filter((b) => b.life > 0);
  for (const h of HOOPS) { h.wob = Math.max(0, h.wob - dt * 2.5); h.net = Math.max(0, h.net - dt * 2); }
  hype = Math.max(0, hype - dt * 0.5);
  if (banner && (banner.t -= dt) <= 0) banner = null;
  if (caption && (caption.t -= dt) <= 0) caption = null;
  if (flash && (flash.t -= dt) <= 0) flash = null;

  if (screen === "over") {
    const l = players.find((p) => p.loser);
    if (l && Math.random() < dt * 14) part({ x: l.x + l.fallDir * 9 * K, y: l.y - 6 * K, vx: rnd(-30, 30), vy: -rnd(30, 60), g: 200, life: 0.6, c: C.tear });
    return;
  }
  if (phase === "countdown") { if (stateT > 1.86) { phase = "play"; sfx.fanfare(); sfx.whistle(); } else return; }

  const ctrls = players.map((p, i) => (i === 1 && tut ? tutControl(p) : demo || (i === 1 && cpu) ? cpuControl(p, other(p), dt) : humanControl(cpu ? SOLO : BINDS[i])));
  if (phase === "scored") ctrls.forEach((c, i) => { ctrls[i] = NONE; });
  players.forEach((p, i) => updatePlayer(p, ctrls[i], dt));
  // bodies don't pass through each other on the floor, except on a dash
  const [a, b] = players, gap = b.x - a.x;
  const solid = (p) => p.dashT <= 0 && p.fallen <= 0 && p.hang <= 0 && !p.dunk;
  const room = (9 + (a.ch.wide + b.ch.wide) * 2) * K;
  if (solid(a) && solid(b) && Math.abs(gap) < room && Math.abs(a.y - b.y) < 20 * K) {
    const push = ((room - Math.abs(gap)) / 2) * (Math.sign(gap) || 1);
    a.x = clamp(a.x - push * (a.frozen > 0 ? 0 : 1), 8, W - 8); b.x = clamp(b.x + push * (b.frozen > 0 ? 0 : 1), 8, W - 8);
  }
  updateBall(dt);
  updateTeeth(dt);
  updateChaos(dt);
  if (phase === "scored") {
    if (stateT > 1.6) { if (tut) tutSetup(); else setPossession(1 - lastScorer.i); phase = "play"; }
    return;
  }
  if (phase !== "play") return;
  if (tut) return;                                                         // practice: no clock, no chaos, no end
  const secBefore = Math.ceil(clock);
  clock -= dt;
  if (!demo && !overtime && Math.ceil(clock) !== secBefore && secBefore <= 5 && secBefore >= 1) sfx.clockTick(secBefore === 1);
  if (chaosIdx < CHAOS_AT.length && clock <= CHAOS_AT[chaosIdx] && !cutin) { chaosIdx++; startChaos(); }
  if (clock <= 0) {
    clock = 0;
    const inPlay = ball.live || ball.homing || players.some((p) => p.dunk || p.shooting || p.granny > 0);
    if (demo) { clock = GAME_TIME; chaosIdx = 0; players.forEach((p) => (p.score = 0)); }
    else if (!inPlay) {
      if (a.score !== b.score) endGame();
      else if (!overtime) { overtime = true; announce("OVERTIME", "NEXT BASKET WINS", 2.4); sfx.buzzer(); }
    }
  }
}

// cut-ins and the chaos roulette stop the game while they play
function updateFreeze(real) {
  if (cutin) {
    cutin.t += real;
    if (cutin.t >= cutin.dur) { const f = cutin.fn; cutin = null; f(); }
    return true;
  }
  if (chaosIntro) {
    const ci = chaosIntro;
    ci.t += real;
    if (!ci.locked) {
      // the roulette slows down before it lands
      const idx = Math.floor(Math.pow(ci.t / ci.lockAt, 0.55) * 22);
      if (idx !== ci.last) { ci.last = idx; ci.shown = (ci.shown + 1) % Object.keys(CHAOS).length; sfx.tick(); sfx.roll(); }
      if (ci.t >= ci.lockAt) {
        ci.locked = true;
        if (!demo) spawnW(impactFrame, { x: W / 2, y: H / 2 });
        impact({ zoom: 1.1, shake: 7, dy: 1 }); sfx.boom(); sfx.fanfare();
      }
    }
    if (ci.t >= ci.dur) { chaosIntro = null; beginChaos(ci.kind); }
    return true;
  }
  return false;
}

// ---------- menus and character select ----------
function menuItems() {
  if (screen === "menu") return [["VS CPU", () => startSelect("cpu")], ["2 PLAYERS", () => startSelect("pvp")], ["TUTORIAL", startTutorial], ["HOW TO PLAY", () => setScreen("howto")], ["SETTINGS", openSettings]];
  if (screen === "howto") return [["BACK", () => setScreen("menu")]];
  if (screen === "paused" && tut) return [["RESUME", () => setScreen("game")], ["SKIP STEP", () => { setScreen("game"); tut.wait = 0.01; }], ["SETTINGS", openSettings], ["QUIT TO MENU", toMenu]];
  if (screen === "paused") return [["RESUME", () => setScreen("game")], ["SETTINGS", openSettings], ["CHANGE BALLERS", () => { toMenu(); startSelect(sel?.mode ?? "cpu"); }], ["QUIT TO MENU", toMenu]];
  if (screen === "over") return [["REMATCH", () => startGame(cpu ? "cpu" : "pvp")], ["CHANGE BALLERS", () => { const m = cpu ? "cpu" : "pvp"; toMenu(); startSelect(m); }], ["MENU", toMenu]];
  return [];
}

function selectPick(i) {
  if (screen !== "select") return;
  const who = sel.lock[0] ? (sel.mode === "pvp" ? 1 : -1) : 0;
  if (who < 0 || sel.lock[who]) return;
  sel.cur[who] = i; lockIn(who);
}
function lockIn(who) {
  sel.lock[who] = true;
  sfx.fanfare();
  spawnW(poof, { x: who ? 240 : 80, y: 150 });
  if (who === 0 && sel.mode === "cpu") sel.spin = 0.9;
}
function selectInput(real) {
  if (sel.go > 0) { if ((sel.go -= real) <= 0) { chosen = [...sel.cur]; startGame(sel.mode); } return; }
  if (sel.spin > 0) {
    sel.spin -= real;
    if (Math.floor(sel.spin * 14) !== Math.floor((sel.spin + real) * 14)) { sel.cur[1] = Math.floor(Math.random() * CHARS.length); sfx.tick(); }
    if (sel.spin <= 0) { sel.lock[1] = true; sfx.fanfare(); }
  }
  const n = CHARS.length, pvp = sel.mode === "pvp";
  const P = [
    { l: ["KeyA", ...(pvp ? [] : ["ArrowLeft"])], r: ["KeyD", ...(pvp ? [] : ["ArrowRight"])], ok: ["KeyF", "Space", ...(pvp ? [] : ["Enter"])] },
    { l: ["ArrowLeft"], r: ["ArrowRight"], ok: ["Enter", "Slash"] },
  ];
  for (const who of pvp ? [0, 1] : [0]) {
    if (sel.lock[who]) continue;
    if (any(P[who].l, pressed)) { sel.cur[who] = (sel.cur[who] + n - 1) % n; sfx.click(); }
    if (any(P[who].r, pressed)) { sel.cur[who] = (sel.cur[who] + 1) % n; sfx.click(); }
    if (any(P[who].ok, pressed)) lockIn(who);
  }
  if (mouse.moved) {
    const card = cards.find(inside), who = !sel.lock[0] ? 0 : pvp && !sel.lock[1] ? 1 : -1;
    if (card && who >= 0) sel.cur[who] = card.i;
  }
  if (pressed.has("Escape")) {
    if (sel.lock[1] && pvp) sel.lock[1] = false;
    else if (sel.lock[0]) { sel.lock[0] = false; sel.lock[1] = false; sel.spin = 0; }
    else setScreen("menu");
  }
  if (sel.lock[0] && sel.lock[1] && sel.go <= 0) sel.go = 0.9;
}

function menuInput(real) {
  if (pressed.has("KeyM")) muted = !muted;
  if (pressed.has("KeyN")) { music.on = !music.on; try { localStorage.setItem("hoops.music", music.on ? "on" : "off"); } catch {} }
  if (pressed.has("KeyT")) setLang(lang === "ko" ? "en" : "ko");
  if (pressed.has("KeyH")) { const v = !(pinned[0] && pinned[1]); pinned = [v, v]; }
  if (screen === "select") { selectInput(real); mouse.moved = false; return; }
  if (screen === "settings") { settingsInput(); return; }
  mouse.moved = false;
  if (pressed.has("Escape") || pressed.has("KeyP")) {
    if (screen === "game" && phase !== "done" && !cutin && !chaosIntro) setScreen("paused");
    else if (screen === "paused") setScreen("game");
    else if (screen === "howto") setScreen("menu");
    return;
  }
  if (screen === "game") return;
  if (screen === "menu") {
    if (pressed.has("Digit1")) return startSelect("cpu");
    if (pressed.has("Digit2")) return startSelect("pvp");
  }
  const n = buttons.length;
  if (!n) return;
  if (["KeyW", "ArrowUp"].some((k) => pressed.has(k))) { menuSel = (menuSel + n - 1) % n; sfx.click(); }
  if (["KeyS", "ArrowDown"].some((k) => pressed.has(k))) { menuSel = (menuSel + 1) % n; sfx.click(); }
  if (screen === "over" && stateT < 1.2) return;
  if (["Enter", "Space", "KeyF"].some((k) => pressed.has(k))) { sfx.click(); buttons[menuSel]?.act(); }
}


// ---------- settings ----------
// Kept on the device. Music and sound volume, vibration, how hard the CPU plays, the size of the touch buttons,
// a left-handed layout (stick on the right), and the language.
const settings = Object.assign({ music: 7, sfx: 8, vibe: true, diff: "normal", btn: "M", lefty: false, tutDone: false },
  (() => { try { return JSON.parse(localStorage.getItem("hoops.settings") || "{}"); } catch { return {}; } })());
const saveSettings = () => { try { localStorage.setItem("hoops.settings", JSON.stringify(settings)); } catch {} };
const DIFFS = ["easy", "normal", "hard"], BTNS = ["S", "M", "L"];
// how the CPU opponent plays at each level
const DIFF = {
  // steal: chance per frame to take an open window; reach: careless reaches per second; bite: how often he jumps at a fake;
  // fake: how often he fakes a covered shot; jab: how often he jabs to set up a crossover
  easy: { speed: 0.82, aim: 0.17, react: [0.22, 0.42], steal: 0.05, reach: 0.7, block: 0.3, bite: 0.65, fake: 0.1, jab: 0.2, special: [3, 6] },
  normal: { speed: 0.93, aim: 0.09, react: [0.08, 0.22], steal: 0.12, reach: 0.35, block: 0.5, bite: 0.4, fake: 0.3, jab: 0.45, special: [1, 3] },
  hard: { speed: 1.02, aim: 0.05, react: [0.04, 0.12], steal: 0.25, reach: 0.1, block: 0.7, bite: 0.15, fake: 0.5, jab: 0.8, special: [0.6, 1.6] },
};
// the level for this CPU: the player's choice against a human, normal when CPUs play each other
const lvl = (p) => DIFF[!demo && cpu && p.i === 1 && !tut ? settings.diff : "normal"];

let settingsBack = "menu", setSel = 0, setRows = [];
function openSettings() { settingsBack = screen; setSel = 0; setScreen("settings"); }
const SETTING_ROWS = [
  { key: "lang", label: "LANGUAGE", show: () => (lang === "ko" ? "한국어" : "ENGLISH"), step: () => setLang(lang === "ko" ? "en" : "ko") },
  { key: "music", label: "MUSIC", show: () => volBar(settings.music), step: (d) => { settings.music = clamp(settings.music + d, 0, 10); } },
  { key: "sfx", label: "SOUND", show: () => volBar(settings.sfx), step: (d) => { settings.sfx = clamp(settings.sfx + d, 0, 10); sfx.click(); } },
  { key: "vibe", label: "VIBRATION", show: () => (settings.vibe ? "ON" : "OFF"), step: () => { settings.vibe = !settings.vibe; buzz(30); } },
  { key: "diff", label: "CPU LEVEL", show: () => settings.diff.toUpperCase(), step: (d) => { settings.diff = DIFFS[(DIFFS.indexOf(settings.diff) + d + 3) % 3]; } },
  { key: "btn", label: "BUTTON SIZE", show: () => ({ S: "SMALL", M: "MEDIUM", L: "LARGE" })[settings.btn], step: (d) => { settings.btn = BTNS[(BTNS.indexOf(settings.btn) + d + 3) % 3]; } },
  { key: "lefty", label: "LEFT-HANDED", show: () => (settings.lefty ? "ON" : "OFF"), step: () => { settings.lefty = !settings.lefty; } },
];
const volBar = (v) => "#".repeat(v) + "-".repeat(10 - v);
function changeSetting(i, d) { SETTING_ROWS[i].step(d); saveSettings(); sfx.click(); }
function settingsInput() {
  const n = SETTING_ROWS.length + 1;                                      // the last row is BACK
  if (["KeyW", "ArrowUp"].some((k) => pressed.has(k))) { setSel = (setSel + n - 1) % n; sfx.click(); }
  if (["KeyS", "ArrowDown"].some((k) => pressed.has(k))) { setSel = (setSel + 1) % n; sfx.click(); }
  const d = ["KeyA", "ArrowLeft"].some((k) => pressed.has(k)) ? -1 : ["KeyD", "ArrowRight"].some((k) => pressed.has(k)) ? 1 : 0;
  if (d && setSel < SETTING_ROWS.length) changeSetting(setSel, d);
  if (["Enter", "Space", "KeyF"].some((k) => pressed.has(k))) { if (setSel === SETTING_ROWS.length) closeSettings(); else changeSetting(setSel, 1); }
  if (pressed.has("Escape")) closeSettings();
}
function closeSettings() { sfx.click(); setScreen(settingsBack === "paused" ? "paused" : "menu"); }
// a tap on a row: the arrows step down or up, anywhere else on the row steps up; the back button closes
function settingsTap() {
  const hit = setRows.find(inside);
  if (!hit) return false;
  if (hit.back) { closeSettings(); return true; }
  setSel = hit.i;
  changeSetting(hit.i, mouse.x < hit.x + hit.w * 0.62 && mouse.x > hit.x + hit.w * 0.4 ? -1 : 1);
  return true;
}
function drawSettings(p) {
  veil(p, 0, 0, W, H, INK, 0.6);
  panel(p, 46, 14, 228, 152);
  p.text("SETTINGS", 160, 20, C.gold, { font: "big", align: "center", outline: INK });
  setRows = [];
  SETTING_ROWS.forEach((r, i) => {
    const y = 36 + i * 16, on = setSel === i, box = { x: 54, y: y - 2, w: 212, h: 14, i };
    setRows.push(box);
    if (mouse.moved && inside(box)) setSel = i;
    if (on) p.rect(box.x, box.y, box.w, box.h, lerpC(C.pink, INK, 0.55));
    p.text(r.label, 60, y + 2, on ? WHITE : C.line);
    p.text("<", 186, y + 2, on ? WHITE : C.dim, { align: "center" });
    p.text(">", 258, y + 2, on ? WHITE : C.dim, { align: "center" });
    p.text(r.show(), 222, y + 2, on ? C.gold : WHITE, { align: "center" });
  });
  const by = 36 + SETTING_ROWS.length * 16 + 4, back = { x: 130, y: by, w: 60, h: 13, back: true };
  setRows.push(back);
  if (mouse.moved && inside(back)) setSel = SETTING_ROWS.length;
  const sel = setSel === SETTING_ROWS.length;
  p.rect(back.x, back.y, back.w, back.h, sel ? C.pink : C.panel); frameBox(p, back.x, back.y, back.w, back.h, sel ? hex("#ff86e6") : C.panelEdge);
  p.text("BACK", 160, by + 4, sel ? WHITE : C.line, { align: "center" });
}

// ---------- tutorial ----------
// Six short drills against a slow, scripted GRAMPS: move, shoot on time, dunk, steal, block, special. Each one
// waits until you have done it, cheers, and sets up the next. Nothing counts: no clock, no chaos.
const TUT = [
  { key: "move", title: "MOVE", keys: "A D (OR ARROWS) TO MOVE", touch: "LEFT THUMB: SLIDE TO MOVE" },
  { key: "shoot", title: "SHOOT", keys: "HOLD F, LET GO AT THE TOP OF THE JUMP", touch: "HOLD THE BIG BUTTON, LET GO AT THE TOP" },
  { key: "dunk", title: "DUNK", keys: "DASH (S) AT THE RIM, THEN F", touch: "NEAR THE RIM THE BIG BUTTON SAYS DUNK: PRESS IT" },
  { key: "fake", title: "FAKE", keys: "TAP F QUICKLY: HE JUMPS, THEN GO PAST", touch: "TAP THE BIG BUTTON QUICKLY: HE JUMPS, THEN GO" },
  { key: "steal", title: "STEAL", keys: "PRESS F WHEN THE BALL FLASHES", touch: "PRESS STEAL WHEN THE BALL FLASHES" },
  { key: "block", title: "BLOCK", keys: "JUMP (W) WHEN HE SHOOTS", touch: "PRESS BLOCK WHEN HE SHOOTS" },
  { key: "special", title: "SPECIAL", keys: "YOUR SP IS FULL: PRESS E", touch: "YOUR SP IS FULL: PRESS SP" },
];
let tut = null;
function startTutorial() {
  const mine = chosen[0], coach = mine === 5 ? 3 : 5;
  chosen = [mine, chosen[1]];
  newGame("tutorial", [mine, coach]);
  setScreen("game");
}
function tutSetup() {
  const [me, op] = players, k = TUT[tut.step]?.key;
  tut.moved = 0; tut.idle = 0; tut.shotIn = 1.2;
  if (k === "fake") { setPossession(0); me.x = 170; op.x = 196; me.facing = 1; op.facing = -1; }
  else if (k === "steal" || k === "block") {
    setPossession(1); op.x = k === "steal" ? 250 : 215; me.x = k === "steal" ? 170 : 199; op.facing = -1; me.facing = 1;
  } else {
    setPossession(0); me.x = k === "dunk" ? 232 : k === "shoot" ? 210 : 140; op.x = 40; me.facing = 1; op.facing = 1;
  }
  if (k === "special") me.sp = 1;
  phase = "play"; stateT = 0;
}
// a drill was done: cheer, then the next one (or the end)
function tutHit(kind) {
  if (!tut || tut.wait > 0 || TUT[tut.step]?.key !== kind) return;
  tut.wait = 1.3; sfx.fanfare(); crowd$.cheer(1); buzz(20);
  shout("NICE!");
}
function tutUpdate(dt) {
  const [me, op] = players;
  clock = GAME_TIME;                                                        // no clock in practice
  if (tut.wait > 0 && (tut.wait -= dt) <= 0) {
    tut.step++;
    if (tut.step >= TUT.length) { tut.done = 3; settings.tutDone = true; saveSettings(); sfx.three(); crowd$.cheer(3); return; }
    tutSetup();
  }
  if (tut.done > 0 && (tut.done -= dt) <= 0) { tut = null; toMenu(); startSelect("cpu"); return; }
  const k = TUT[tut.step]?.key;
  if (k === "move") { tut.moved += Math.abs(me.vx) * dt; if (tut.moved > 90) tutHit("move"); }
  // the drills against his ball start over when it is gone for a moment
  if ((k === "steal" || k === "block") && ball.owner !== op && !ball.live && phase === "play") { if ((tut.idle += dt) > 1.4) tutSetup(); } else tut.idle = 0;
  if ((k === "shoot" || k === "dunk" || k === "special" || k === "fake") && ball.owner !== me && !ball.live && phase === "play") { if ((tut.idle += dt) > 1.6) tutSetup(); }
}
// GRAMPS, scripted: stands aside for your drills, dribbles slowly at you for the steal, shoots for the block
function tutControl(me) {
  const c = { ...NONE }, k = TUT[tut?.step]?.key;
  if (!tut || tut.wait > 0 || tut.done > 0) return c;
  if (k === "fake") { const at = players[0]; if (Math.abs(me.x - 196) > 3) { if (me.x < 196) c.right = true; else c.left = true; } if (at.gather > 0 && me.onGround) c.jump = true; }   // he always bites
  if (k === "steal" && ball.owner === me) { if (Math.floor(worldT * 3) % 3) c.left = true; if (me.x < 70) tutSetup(); }
  if (k === "block" && ball.owner === me) {
    if (!me.shooting && (tut.shotIn -= 1 / 60) <= 0) { c.shoot = c.shootHeld = true; me.ai.releaseAt = 0.34; tut.shotIn = 2.2; }
    else if (me.gather > 0) c.shootHeld = true;                              // hold through the gather: a real shot, not a fake
    else if (me.shooting) c.shootHeld = me.shootT < me.ai.releaseAt;
  }
  return c;
}
function drawTutorial(p) {
  if (!tut) return;
  if (tut.done > 0) {
    veil(p, 0, 70, W, 40, INK, 0.75);
    p.text("YOU'RE READY!", 160, 76, C.gold, { font: "big", scale: 2, align: "center", outline: INK });
    p.text("NOW GO WIN A REAL GAME", 160, 96, WHITE, { align: "center", outline: INK });
    return;
  }
  const s = TUT[tut.step], x = 50, w = 220, y = 32;
  veil(p, x, y, w, 30, INK, 0.82); frameBox(p, x, y, w, 30, tut.wait > 0 ? C.green : C.gold);
  p.text(`${tut.step + 1}/${TUT.length}`, x + 5, y + 4, C.dim);
  p.text(s.title, 160, y + 3, tut.wait > 0 ? C.green : C.gold, { font: "big", align: "center" });
  p.text(isTouch ? s.touch : s.keys, 160, y + 17, WHITE, { align: "center" });
  for (let i = 0; i < TUT.length; i++) p.rect(x + w - 8 - (TUT.length - 1 - i) * 6, y + 5, 4, 4, i < tut.step || (i === tut.step && tut.wait > 0) ? C.green : i === tut.step ? C.gold : hex("#3a3550"));
}

// ---------- language ----------
// The pixel fonts have no Hangul. In Korean every string the game draws is looked up here and drawn with Galmuri,
// a Korean pixel font: each string is rasterized once at its native size, thresholded to hard pixels, and stamped
// into the frame like any other pixel text, so it sits on the same grid, under the same panels, centered on the line
// the English text would have used.
let lang = (() => { try { return localStorage.getItem("hoops.lang") === "ko" ? "ko" : "en"; } catch { return "en"; } })();
function setLang(l) { lang = l; try { localStorage.setItem("hoops.lang", l); } catch {} }
const KO = {
  // characters
  "THE HOTHEAD": "열혈 슈터", "COLD BLOODED": "냉정한 저격수", "SPEED DEMON": "번개 발", "THE BRICK WALL": "인간 장벽", "THE PICKPOCKET": "소매치기 장인", "OLD BUT GOLD": "왕년의 전설",
  "HOT HAND": "손이 뜨겁다", "INFERNO": "인페르노", 
  "ICE VEINS": "강철 멘탈", "BIGGER PERFECT ZONE": "퍼펙트 판정 넓음", "DEEP FREEZE": "꽁꽁", "ICE SPIKES FREEZE HIM": "얼음 가시로 얼려버림",
  "THUNDER STEP": "번개 이동", "WARP TO RIM AND DUNK": "림으로 순간이동 덩크",
  "ROCK SOLID": "통곡의 벽", "DRIVES BOUNCE OFF HIM": "발목 무적, 돌파는 튕겨냄", "EARTHQUAKE": "지진", "TWO QUAKES. JUMP BOTH!": "땅 쾅쾅! 두 번 다 피해라",
  "STICKY HANDS": "끈끈이 손", "STEALS WORK MORE OFTEN": "스틸이 잘 들어감", "BLACK HOLE": "블랙홀", "SUCKS THE BALL IN": "공을 강제 소환",
  "EXPERIENCE": "짬바", "SP FILLS 50% FASTER": "SP 1.5배 빨리 참", "TIME OUT": "타임아웃", "TIMESTOP GRANNY SHOT": "시간 정지 후 언더슛",
  // chaos
  "MOON GRAVITY": "달 중력", "EVERYONE FLOATS": "다들 둥둥 뜬다", "BANANA RAIN": "바나나 폭우", "WATCH YOUR STEP": "미끄러짐 주의",
  "BIG HEAD MODE": "대두 모드", "HUGE BRAIN ENERGY": "머리 크기 실화냐", "GOLDEN BALL": "황금 공", "NEXT BASKET X2": "다음 골 점수 2배",
  "LIGHTNING STORM": "번개 폭풍", "DONT STAND STILL": "멈추면 맞는다", "!! CHAOS !!": "!! 카오스 !!", "NEXT SCORE": "다음 골까지",
  // over the players' heads
  "PERFECT": "퍼펙트!", "GOOD": "굿", "TOO EARLY": "빨랐다", "TOO LATE": "늦었다", "SKY": "날았다!", "CROSSOVER": "크로스오버!",
  "WALL": "철벽", "WHIFF": "허공", "GOT IT ALREADY": "이미 내 공", "DODGED": "안 맞지롱", "JUMPED IT": "점프로 회피", "AIRBALL": "에어볼",
  "MINE": "내 꺼!", "HEY!": "야!!", "NOW!": "지금!",
  // shouts
  "STRIPPED!": "털렸다!", "STEAL!": "스틸!", "INFERNO!": "인페르노!", "FROZEN!": "꽁꽁!", "THUNDER STEP!": "번개 이동!", "EARTHQUAKE!": "지진이다!",
  "BLACK HOLE!": "블랙홀!", "TIME OUT!": "타임아웃!", "DENTURES!": "틀니 발사!", "CHOMP!": "콱!", "ZAPPED!": "찌릿!",
  // the commentator
  "CALL AN AMBULANCE": "119 불러주세요", "HIS ANKLES ARE GONE": "발목 실종", "HE NEEDS A DOCTOR": "의사 어디 없나요", "PLEASE STAND UP": "일어나... 제발",
  "FLOOR LOOKED COMFY": "바닥이랑 친해졌다", "PUT IT ON A POSTER": "이건 포스터각", "HE WAS IN THE PHOTO": "졸지에 들러리", "FRAME THAT ONE": "액자로 걸어라",
  "DISRESPECTFUL": "예의가 없네", "AIR BALL! AIR BALL!": "에어볼! 에어볼!", "IT DIDNT EVEN TOUCH": "림도 안 스쳤다", "BRICK LAYER": "벽돌 장인",
  "HE AIMED AT THE MOON": "달 보고 쐈냐", "BANANA 1 - HUMAN 0": "바나나 1 : 인간 0", "WHO LEFT THAT THERE": "누가 여기 버렸어", "CLASSIC": "근본 슬랩스틱", "PHYSICS WON": "물리법칙 승",
  "WHO PAYS FOR THAT": "유리값 누가 내냐", "THE GLASS IS GONE": "백보드 사망", "SEND THE JANITOR": "청소 아저씨 호출", "GET THAT OUT OF HERE": "저리 치워!",
  "NOT IN MY HOUSE": "내 앞에선 안 돼", "REJECTED": "반사!", "HE IS LITERALLY ON FIRE": "진짜로 불탄다", "STAY FROSTY": "얼어붙었다", "CHILL OUT": "좀 식혀라",
  "ICE ICE BABY": "아이스 아이스 베이비", "THE FLOOR IS LAVA. NO, ROCKS": "바닥이 터졌다", "RICHTER SCALE: YES": "진도 9.0", "YOINK": "슈슉",
  "PHYSICS SAYS NO": "물리법칙 무시", "IT JUST... LEFT": "공이... 가출했다", "BACK IN MY DAY...": "라떼는 말이야...", "GRANNY STYLE": "근본 언더슛",
  "HE INVENTED THIS": "이 슛 내가 만들었어", "BALL TO THE FACE": "얼굴로 받아버림", "MINE NOW": "이제 내 공", "THANKS FOR THE PASS": "패스 땡큐",
  "HE JUST TOOK IT": "그냥 뺏어버림", "SPECIAL DELIVERY": "특급 배송 완료", "HE BIT HIM": "물었다!!", "GRANDPA PLEASE": "할아버지 진정하세요", "THOSE WERE EXPENSIVE": "그거 임플란트야",
  "GOLDEN BALL  X2": "황금 공 2배!", "HE IS HEATING UP": "손끝이 달아오른다", "BUZZER BEATER!!": "버저비터!!", "OVERTIME": "연장전", "NEXT BASKET WINS": "다음 골이 결승골",
  // menus and HUD
  "VS CPU": "CPU랑 붙기", "2 PLAYERS": "둘이 하기", "HOW TO PLAY": "조작법", "BACK": "뒤로", "RESUME": "계속하기", "CHANGE BALLERS": "선수 바꾸기",
  "QUIT TO MENU": "메인으로", "REMATCH": "한 판 더", "MENU": "메인으로", "PAUSED": "일시정지", "DRAW": "무승부", "PASSIVE": "패시브", 
  "1 ON 1 STREETBALL MAYHEM": "1대1 길거리 농구 난장판", "6 BALLERS  6 SPECIALS  5 KINDS OF CHAOS": "선수 6명 · 필살기 6개 · 카오스 5종",
  "M SOUND OFF": "M 소리 꺼짐", "M SOUND ON": "M 소리 켜짐", "CHOOSE YOUR BALLER": "선수 선택", "WAITING FOR P1": "P1 고르는 중...",
  "GET READY!": "준비!", "SHOOT": "슛", "STEAL": "스틸", "JUMP": "점프", "BLOCK": "블락", "LEFT THUMB: MOVE   RIGHT THUMB: BIG BUTTON DOES IT ALL, DASH NEXT TO IT": "왼손: 이동   오른손: 큰 버튼 하나로 다 됨, 옆 버튼은 대시", "DASH": "대시", "DUNK": "덩크", "GO!": "지금!", "STEAL!": "스틸!", "FAKE": "페이크", "BIT!": "속았다!", "CONTEST": "견제!", "QUICK FEET": "날쌘 발", "DASHES COST HALF STAMINA": "대시 스태미나 절반",
  "TAP F QUICKLY: HE JUMPS, THEN GO PAST": "F를 짧게 톡: 상대가 뜨면 그 틈에 돌파", "TAP THE BIG BUTTON QUICKLY: HE JUMPS, THEN GO": "큰 버튼을 짧게 톡: 상대가 뜨면 그 틈에 돌파",
  "PRESS F WHEN THE BALL FLASHES": "공이 번쩍일 때 F", "PRESS STEAL WHEN THE BALL FLASHES": "공이 번쩍일 때 스틸",
  "DASH PAST A DEFENDER WHO JUMPED, REACHED OR LEANED = ANKLES": "뜨거나 손 뻗거나 반대로 쏠린 수비를 대시로 제치면 발목 브레이커",
  "TAP SHOOT = PUMP FAKE. STEAL WHEN THE BALL FLASHES": "슛 짧게 톡 = 페이크. 공이 번쩍일 때 스틸", "SETTINGS": "설정", "TUTORIAL": "튜토리얼", "LANGUAGE": "언어", "MUSIC": "음악", "SOUND": "효과음", "VIBRATION": "진동",
  "CPU LEVEL": "CPU 난이도", "BUTTON SIZE": "버튼 크기", "LEFT-HANDED": "왼손잡이 모드", "ON": "켜짐", "OFF": "꺼짐", "EASY": "쉬움", "NORMAL": "보통", "HARD": "어려움",
  "SMALL": "작게", "MEDIUM": "보통", "LARGE": "크게", "PRACTICE": "연습", "SKIP STEP": "이 단계 건너뛰기", "NICE!": "좋아요!", "YOU'RE READY!": "준비 완료!", "NOW GO WIN A REAL GAME": "이제 실전에서 이겨보세요",
  "SPECIAL": "필살기", "A D (OR ARROWS) TO MOVE": "A D (또는 방향키)로 이동", "LEFT THUMB: SLIDE TO MOVE": "왼손 엄지로 밀어서 이동",
  "HOLD F, LET GO AT THE TOP OF THE JUMP": "F를 누르고 점프 꼭대기에서 떼기", "HOLD THE BIG BUTTON, LET GO AT THE TOP": "큰 버튼을 누르고 점프 꼭대기에서 떼기",
  "DASH (S) AT THE RIM, THEN F": "림 쪽으로 대시(S) 후 F", "NEAR THE RIM THE BIG BUTTON SAYS DUNK: PRESS IT": "림 근처에서 큰 버튼이 덩크로 바뀌면 누르기",
  "GET CLOSE AND PRESS F": "가까이 붙어서 F로 스틸", "GET CLOSE AND PRESS STEAL": "가까이 붙어서 스틸 누르기",
  "JUMP (W) WHEN HE SHOOTS": "상대가 슛할 때 점프(W)", "PRESS BLOCK WHEN HE SHOOTS": "상대가 슛할 때 블락 누르기",
  "YOUR SP IS FULL: PRESS E": "SP가 찼어요: E 누르기", "YOUR SP IS FULL: PRESS SP": "SP가 찼어요: SP 버튼 누르기", "SO CLOSE": "아깝다!", "TWO IN A ROW": "2연속 득점", "HE IS ON A ROLL": "손끝이 뜨겁다", "SOMEBODY STOP HIM": "누가 좀 막아봐", "CATCH": "잡기", "GRAB": "줍기", "SPECIAL MOVE": "필살기",
  "< > OR A D TO PICK   F / ENTER TO LOCK   ESC BACK": "< > / A D 고르기   F / ENTER 확정   ESC 뒤로",
  "P1: A D + F     P2: < > + ENTER     ESC BACK": "P1  A D + F    P2  < > + ENTER    ESC 뒤로",
  "MOVE": "이동", "JUMP / BLOCK": "점프 / 블락", "DASH": "대시", "SHOOT / STEAL": "슛 / 스틸",
  "HOLD SHOOT, LET GO AT THE TOP OF THE JUMP = PERFECT": "슛 꾹 누르고 점프 꼭대기에서 떼면 퍼펙트",
  "DASH THEN SHOOT NEAR THE RIM = DUNK (SOMETIMES GLASS)": "림 근처에서 대시 + 슛 = 덩크 (가끔 백보드 박살)",
  "DASH INTO A DEFENDER = BREAK HIS ANKLES... OR HIT A WALL": "수비 정면으로 대시 = 발목 브레이커 (아니면 튕김)",
  "BLAZE: 2 MAKES IN A ROW = AWAKEN (BIGGER, HIGHER, HOTTER)": "BLAZE 전용: 2골 연속이면 각성 (커지고 높이 뜀)",
  "AWAKENS AFTER 2 MAKES": "2골 연속이면 각성", "AWAKEN 10S + KNOCKBACK": "10초 각성 + 날려버림",
  "DOUBLE DASH": "더블 대시", "DASH TWICE IN A ROW": "대시 2번 연속 가능",
  "AWAKENED!": "각성!", "AWAKENED: BIGGER, HIGHER, HOTTER": "각성! 커지고 빨라진다",
  "ANKLES!": "발목 아웃!", "BLOCK!": "블락!", "DENIED!": "거절!", "SNATCHED!": "가로채기!", "SLIP!": "꽈당!",
  "A PASSIVE + A SPECIAL EACH. HOVER THE FACE UP TOP (OR H)": "선수마다 패시브 + 필살기 (위쪽 얼굴에 마우스)",
  "JUMP INTO A FLYING BALL WITH YOUR HANDS UP = CATCH IT": "점프해서 날아오는 공에 손 대면 낚아채기",
  "CHAOS EVERY 20 SECONDS. IT GETS WEIRD": "20초마다 카오스. 갈수록 이상해짐",
  "ESC PAUSE   M SOUND   N MUSIC   T LANGUAGE   1P ALSO WORKS WITH ARROWS": "ESC 일시정지   M 소리   N 음악   T 언어   1P는 방향키도 OK",
  "PIXEL HOOPS  *  1 ON 1 STREETBALL  *  NO REFS  NO RULES  *  ": "PIXEL HOOPS  *  1대1 길거리 농구  *  심판 없음 반칙 없음  *  ",
};
const KO_PATTERNS = [
  [/^(\w+) WINS!$/, (m) => `${m[1]} 승리!`],
  [/^EARLY (\d+)MS$/, (m) => `빠름 ${m[1]}ms`],
  [/^LATE (\d+)MS$/, (m) => `늦음 ${m[1]}ms`],
  [/^(\w+) TAKES IT$/, (m) => `${m[1]} 승!`],
  [/^(\w+) SCORES!  \*  $/, (m) => `${m[1]} 득점!  *  `],
  [/^!! (.+) !!  $/, (m) => `!! ${KO[m[1]] ?? m[1]} !!  `],
];
const hasHangul = (s) => /[^\x00-\x7f]/.test(s);
function tr(s) {
  if (KO[s]) return KO[s];
  for (const [re, f] of KO_PATTERNS) { const m = s.match(re); if (m) return f(m); }
  return null;
}

// Galmuri at its native sizes: body text (9 px glyphs) and bold for the big lines (11 px glyphs)
const KO_FACES = { body: ["Galmuri9", "fonts/Galmuri9.woff2", 10], bold: ["Galmuri11B", "fonts/Galmuri11-Bold.woff2", 12] };
let koReady = false;
const koCache = new Map(), koRefs = {};
Promise.all(Object.values(KO_FACES).map(([n, u]) => new FontFace(n, `url(${u})`).load().then((f) => document.fonts.add(f))))
  .then(() => { koReady = true; koCache.clear(); }).catch(() => {});
const rasterC = Object.assign(document.createElement("canvas"), { width: 1024, height: 32 });
const rasterX = rasterC.getContext("2d", { willReadFrequently: true });
// a string as hard pixels: its fill mask and the ring of pixels around it (for the outline)
function koMask(s, kind) {
  const key = kind + "|" + s;
  let m = koCache.get(key);
  if (m) return m;
  const [fam, , px] = KO_FACES[kind];
  rasterX.font = `${px}px ${fam}`; rasterX.textBaseline = "alphabetic";
  const w = Math.max(1, Math.min(rasterC.width - 2, Math.ceil(rasterX.measureText(s).width))), h = px + 5;
  rasterX.clearRect(0, 0, rasterC.width, rasterC.height); rasterX.fillStyle = "#fff"; rasterX.fillText(s, 1, px + 1);
  const d = rasterX.getImageData(0, 0, w + 2, h).data, W2 = w + 2, fill = [], edge = [], on = new Uint8Array(W2 * h);
  for (let i = 0; i < W2 * h; i++) if (d[i * 4 + 3] >= 200) on[i] = 1;   // the font edges come out soft: keep only the solid pixels
  for (let y = 0; y < h; y++) for (let x = 0; x < W2; x++) {
    if (on[y * W2 + x]) { fill.push(x, y); continue; }
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < W2 && Y < h && on[Y * W2 + X]) { near = true; break; }
    }
    if (near) edge.push(x, y);
  }
  // the outline may reach one pixel past the box on the left and top
  for (let y = 0; y < h; y++) if (on[y * W2]) edge.push(-1, y);
  m = { w: W2, h, fill, edge };
  koCache.set(key, m);
  return m;
}
// where the glyphs sit in the box: measured on a full syllable, so every string in a font shares one line
function koRef(kind) {
  if (koRefs[kind]) return koRefs[kind];
  const m = koMask("뷁한글", kind);
  let top = m.h, bot = 0;
  for (let i = 1; i < m.fill.length; i += 2) { top = Math.min(top, m.fill[i]); bot = Math.max(bot, m.fill[i]); }
  return (koRefs[kind] = { top, h: bot - top + 1 });
}
// Hangul needs ~9 font pixels to read, which at a whole game pixel each is twice the height of the 5 px English
// text. So Korean is stamped on a finer grid: each font pixel is FP screen pixels (2 against the game's 3), which
// lands it at about the English size while it stays a crisp pixel font. It goes onto the canvas after the frame:
// world text under the HUD (and through the camera), HUD text last; a panel that covers the HUD drops what's under it.
const FP = 2;
function koPlan(o) {
  const ePx = (o.font === "big" ? 7 : 5) * (o.scale ?? 1), kind = ePx <= 6 ? "body" : "bold", ref = koRef(kind);
  return { ePx, kind, ref, fp: Math.max(FP, Math.round((ePx * S) / ref.h)) };
}
// a string drawn once, at one canvas pixel per font pixel, with its outline and shadow baked in
const koSprites = new Map();
function koSprite(s, kind, c, outline, shadow) {
  const key = `${kind}|${c}|${outline}|${shadow}|${s}`;
  let sp = koSprites.get(key);
  if (sp) return sp;
  const m = koMask(s, kind), cv = Object.assign(document.createElement("canvas"), { width: m.w + 3, height: m.h + 3 }), x = cv.getContext("2d");
  const plot = (list, col, dx, dy) => { x.fillStyle = css(col); for (let i = 0; i < list.length; i += 2) x.fillRect(list[i] + 1 + dx, list[i + 1] + 1 + dy, 1, 1); };
  if (shadow) plot(m.fill, shadow, 1, 1);
  if (outline) plot(m.edge, outline, 0, 0);
  plot(m.fill, c, 0, 0);
  sp = { cv, w: m.w - 2 };
  if (koSprites.size > 600) koSprites.clear();
  koSprites.set(key, sp);
  return sp;
}
const css = (c) => `rgb(${c & 255},${(c >>> 8) & 255},${(c >>> 16) & 255})`;
let koQ = [], fxDraw = false;
const koCover = () => { koQ = koQ.filter((t) => !t.hud); };
function drawKo(list, sx, sy, z) {
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const t of list) {
    const o = t.o, { ePx, kind, ref, fp } = koPlan(o), sp = koSprite(t.s, kind, t.c ?? WHITE, o.outline ?? 0, o.shadow ?? 0), k = fp * z;
    const w = sp.w * k, X = (t.x - sx) * S * z, Y = (t.y + ePx / 2 - sy) * S * z;
    const snap = (v) => (z === 1 ? Math.round(v / k) * k : Math.round(v));
    const x0 = snap((o.align === "center" ? X - w / 2 : o.align === "right" ? X - w : X) - 2 * k);
    const y0 = snap(Y - (ref.h / 2 + ref.top + 1) * k);
    ctx.globalAlpha = Math.max(0, Math.min(1, o.a ?? 1));
    ctx.drawImage(sp.cv, x0, y0, Math.round(sp.cv.width * k), Math.round(sp.cv.height * k));
  }
  ctx.restore();
}
const rawText = Painter.prototype.text;
Painter.prototype.text = function (str, x, y, c, o = {}) {
  if (!fxDraw && typeof str === "string" && koReady) {
    let s = hasHangul(str) ? str : lang === "ko" ? tr(str) : null;
    // in Korean, the small English labels on the HUD (SP, P1, names, stats) use Galmuri too, so a row reads as one face
    if (!s && lang === "ko" && this.frame === hud && o.font !== "big" && (o.scale ?? 1) === 1 && /[A-Za-z]/.test(str)) s = str;
    if (s) {
      if (o.led) return stampKo(this, s, x, y, c, o);
      koQ.push({ hud: this.frame === hud, s, x: this.cellX(x, y), y: this.cellY(x, y), c, o });
      return;
    }
  }
  return rawText.call(this, str, x, y, c, o);
};
// Galmuri stamped straight into the frame, one game pixel per font pixel: for text that sits behind things (the LED ribbon)
function stampKo(p, s, x, y, c, o) {
  const m = koMask(s, "body"), ref = koRef("body"), w = m.w - 2;
  const x0 = Math.round(o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x) - 1;
  const y0 = Math.round(y + (5 - ref.h) / 2) - ref.top;
  for (let i = 0; i < m.fill.length; i += 2) p.px(x0 + m.fill[i], y0 + m.fill[i + 1], c);
}
// width in game pixels of a string as it will be drawn (for tiling the LED ribbon)
function textW(str, led = false) {
  const s = koReady && (hasHangul(str) ? str : lang === "ko" ? tr(str) : null);
  if (!s) return textWidth(str);
  return led ? koMask(s, "body").w - 2 : Math.ceil(((koMask(s, "body").w - 2) * FP) / S);
}
// how far apart lines of small text sit (Korean glyphs are a little taller)
const LH = () => (lang === "ko" && koReady ? 8 : 7);


// ---------- drawing ----------
// The arena, back to front: a dark roof with a lighting truss, tiered stands full of fans, a wall with a scrolling
// LED ribbon, then a polished floor. Everything that never moves is baked once into courtColor / courtLight.
let courtColor, courtLight, crowd = [], starsBg = [];
const ROOF = 22, STANDS = 114, RIBBON = 118, LAMPS = [44, 92, 228, 276];
// a smooth translucent rectangle (the painter's own alpha is an ordered dither, which reads as grain on big areas)
function veil(p, x, y, w, h, c, a) {
  const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y)), x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(H, Math.round(y + h));
  const B = p.C;
  if (!B || p.ox || p.oy || p.w !== W) { for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) p.blendPx(i, j, c, a); return; }
  a = Math.max(0, Math.min(1, a * (p.fade ?? 1)));
  if (a <= 0.004) return;
  const cr = c & 255, cg = (c >>> 8) & 255, cb = (c >>> 16) & 255, over = (((a * 255) & 255) << 24 | (cb << 16) | (cg << 8) | cr) >>> 0;
  for (let j = y0; j < y1; j++) {
    let i = j * W + x0;
    for (let x2 = x0; x2 < x1; x2++, i++) {
      const d = B[i];
      if (!d) { B[i] = over; continue; }                                   // nothing under it: just the tint
      const da = (d >>> 24) / 255, oa = a + da * (1 - a), k = a / oa, q = 1 - k;
      B[i] = ((((oa * 255) & 255) << 24) | ((((cb * k + ((d >>> 16) & 255) * q)) & 255) << 16) | ((((cg * k + ((d >>> 8) & 255) * q)) & 255) << 8) | ((cr * k + (d & 255) * q) & 255)) >>> 0;
    }
  }
}
const lerpC = (a, b, k) => {
  const ch = (s) => Math.round(((a >>> s) & 255) * (1 - k) + ((b >>> s) & 255) * k);
  return ch(0) | (ch(8) << 8) | (ch(16) << 16) | (255 << 24);
};
function buildCourt() {
  const p = painterFor(world); p.place(0, 0);
  clearFrame(world);
  // the roof and its truss
  for (let y = 0; y < ROOF; y++) p.rect(0, y, W, 1, lerpC(hex("#07060c"), hex("#110e1c"), y / ROOF));
  p.rect(0, 5, W, 2, hex("#262036")); p.rect(0, 13, W, 2, hex("#262036"));
  for (let x = 0; x < W; x += 10) { p.line(x, 7, x + 5, 12, hex("#1c1729")); p.line(x + 5, 7, x, 12, hex("#1c1729")); }
  p.rect(0, 5, W, 1, hex("#3a3350"));
  for (const x of LAMPS) {
    p.rect(x - 1, 15, 2, 3, hex("#262036")); p.rect(x - 4, 18, 8, 3, hex("#3a3550")); p.rect(x - 3, 21, 6, 1, hex("#fff4d8"));
    p.glow(x, 22, 16, hex("#fff0c8"), 0.6);
    // the beam: a faint cone down to the floor, and the pool of light it leaves on the wood
    for (let y = 22; y < FLOOR; y += 2) { const hw = 3 + (y - 22) * 0.16; veil(p, Math.round(x - hw), y, Math.round(hw * 2), 2, hex("#fff2d6"), 0.035); }
    p.glow(x, FLOOR + 6, 22, hex("#ffe0a8"), 0.35);
  }
  // the stands: tiers stepping up and away, darker the farther back
  for (let y = ROOF; y < STANDS; y++) {
    const r = Math.floor((y - ROOF) / 13), inTier = (y - ROOF) % 13;
    const base = lerpC(hex("#100d1a"), hex("#221b34"), (y - ROOF) / (STANDS - ROOF));
    p.rect(0, y, W, 1, inTier < 2 ? lerpC(base, hex("#3a3152"), 0.6) : base);
    if (inTier === 12) p.rect(0, y, W, 1, hex("#0a0812"));
  }
  for (let x = 0; x < W; x += 64) veil(p, x + 30, ROOF, 4, STANDS - ROOF, hex("#0c0a14"), 0.6);   // the aisles
  // the wall under the stands: a rail, the LED ribbon, padded panels
  p.rect(0, STANDS, W, 2, hex("#5a5070")); p.rect(0, STANDS + 2, W, 2, hex("#14101f"));
  p.rect(0, RIBBON, W, 11, hex("#05040a")); p.rect(0, RIBBON - 1, W, 1, hex("#2a2440")); p.rect(0, RIBBON + 11, W, 1, hex("#2a2440"));
  for (let y = RIBBON + 12; y < FLOOR; y++) p.rect(0, y, W, 1, lerpC(hex("#1e1830"), hex("#2a2240"), (y - RIBBON) / (FLOOR - RIBBON)));
  for (let x = 20; x < W; x += 40) p.rect(x, RIBBON + 12, 1, FLOOR - RIBBON - 12, hex("#151124"));
  p.rect(0, FLOOR - 2, W, 2, hex("#100c1a"));
  // the floor: planks with staggered joints, lighter far away, a gloss line where it meets the wall
  const planks = [hex("#c47e44"), hex("#b8743a"), hex("#cc8a4e"), hex("#b06c34")];
  for (let y = FLOOR; y < H; y++) {
    const row = Math.floor((y - FLOOR) / 3), c = planks[row % 4];
    p.rect(0, y, W, 1, lerpC(c, hex("#8a4f22"), Math.min(0.45, (y - FLOOR) / 70)));
    if ((y - FLOOR) % 3 === 2) veil(p, 0, y, W, 1, hex("#9a5c2a"), 0.5);
  }
  for (let row = 0; row * 3 < H - FLOOR; row++) for (let x = (row * 13) % 37; x < W; x += 37) veil(p, x, FLOOR + row * 3, 1, 2, hex("#8a4f22"), 0.7);
  veil(p, 0, FLOOR + 1, W, 1, hex("#f0b878"), 0.45);
  // the paint under each hoop, the free throw line, the three point mark
  for (const h of HOOPS) {
    const ft = h.cx + h.dir * 46, x0 = Math.min(h.board, ft), x1 = Math.max(h.board, ft), t3 = h.cx + h.dir * THREE;
    veil(p, x0, FLOOR + 1, x1 - x0, H - FLOOR - 1, hex("#8a2f5c"), 0.55);
    veil(p, x0, FLOOR + 2, x1 - x0, 1, hex("#b04a7a"), 0.5);
    p.rect(ft - 1, FLOOR + 1, 2, H - FLOOR, C.line);
    p.ellipse(ft, FLOOR + 14, 10, 4, hex("#d8b8a8"));
    p.rect(t3 - 1, FLOOR + 1, 2, H - FLOOR, C.line);
    p.text("3", t3 + h.dir * 5, FLOOR + 8, C.line, { align: "center" });
    p.rect(h.dir > 0 ? 0 : W - 3, FLOOR + 1, 3, H - FLOOR, C.line);           // the baseline
  }
  p.rect(0, FLOOR, W, 1, C.line);
  // half court: the line, the circle and the logo in the middle
  p.rect(159, FLOOR + 1, 2, H - FLOOR, C.line);
  p.ellipse(160, FLOOR + 15, 31, 8, C.line); p.ellipse(160, FLOOR + 15, 29, 7, hex("#7a2a5a"));
  p.disc(160, FLOOR + 14, 5, C.ball, 1); p.line(155, FLOOR + 14, 165, FLOOR + 14, C.ballDark); p.line(160, FLOOR + 9, 160, FLOOR + 19, C.ballDark);
  p.text("PIXEL", 144, FLOOR + 12, C.gold, { align: "center" }); p.text("HOOPS", 177, FLOOR + 12, C.gold, { align: "center" });
  // the stanchions: padded base on the floor, a pole and an arm out to the board
  for (const h of HOOPS) {
    const px = h.board - h.dir * 7, side = h.dir > 0 ? 0 : W - 18;
    p.rect(side, FLOOR - 12, 18, 13, OUTLINE); p.rect(side + 1, FLOOR - 11, 16, 11, hex("#3a3550"));
    p.rect(side + 1, FLOOR - 11, 16, 2, C.pink); p.rect(side + 1, FLOOR - 5, 16, 1, hex("#2a2440"));
    p.rect(px - 2, h.y - 10, 5, FLOOR - h.y - 1, OUTLINE); p.rect(px - 1, h.y - 9, 3, FLOOR - h.y - 3, hex("#6a6080")); p.rect(px - 1, h.y - 9, 1, FLOOR - h.y - 3, hex("#8a82a0"));
    p.line(px, h.y - 9, h.board, h.y - 18, hex("#6a6080")); p.line(px, h.y - 3, h.board, h.y - 6, hex("#6a6080"));
  }
  courtColor = world.color.slice(); courtLight = world.light.slice();
  // the fans: a seat for each, some empty; shirts are filled in at draw time from the two players' colors
  let s = 7;
  const r01 = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const skins = ["#f0c8a8", "#d79a6a", "#8d5a3b", "#6b4a3a", "#e0b090", "#b47a52"].map(hex);
  const hairs = ["#1c1a24", "#3a2418", "#6b4a1a", "#c8a050", "#e6e1ee", "#a8201e"].map(hex);
  for (let row = 0; row < 7; row++) for (let x = 3 + (row % 2) * 4; x < W; x += 8) {
    if ((x + 34) % 64 < 6 || r01() < 0.12) continue;                            // aisles and empty seats
    crowd.push({ x: x + Math.floor(r01() * 2), y: ROOF + 4 + row * 13, row, skin: skins[Math.floor(r01() * skins.length)], hair: hairs[Math.floor(r01() * hairs.length)],
      neutral: C.crowd[Math.floor(r01() * C.crowd.length)], fan: r01() < 0.55, ph: r01() * 6.28, sign: r01() < 0.05, phone: r01() < 0.08, tall: r01() < 0.3 });
  }
  for (let i = 0; i < 60; i++) starsBg.push({ x: Math.floor(r01() * W), y: Math.floor(r01() * 60), ph: r01() * 6.28 });
}

function drawBackdrop(p) {
  const k = chaos?.kind;
  if (k === "moon") {
    // the roof opens on space
    p.rect(0, 0, W, 64, C.space);
    for (const s of starsBg) if (Math.sin(worldT * 3 + s.ph) > -0.3) p.px(s.x, s.y, Math.sin(worldT * 3 + s.ph) > 0.7 ? WHITE : C.dim);
    p.disc(262, 26, 15, C.moon, 1); p.disc(256, 22, 3, C.grey, 1); p.disc(268, 31, 4, C.grey, 1); p.disc(265, 18, 2, C.grey, 1);
    p.glow(262, 26, 30, hex("#6a64a0"), 0.4);
  }
  if (k === "storm") { veil(p, 0, 0, W, FLOOR, hex("#05040a"), 0.55); }
  if (k === "golden") { veil(p, 0, FLOOR, W, H - FLOOR, C.gold, 0.18); }
  drawRibbon(p);
}

// the LED ribbon: scrolls a slogan, shouts on a basket, turns into the chaos warning
let ribbonX = 0;
function drawRibbon(p) {
  const ev = chaos && CHAOS[chaos.kind], blink = Math.floor(worldT * 6) % 2;
  ribbonX += (1 / 60) * (20 + hype * 60);
  let msg, col;
  if (phase === "scored" && lastScorer) { msg = `${lastScorer.ch.name} SCORES!  *  `; col = blink ? lastScorer.col : WHITE; }
  else if (ev) { msg = `!! ${ev.name} !!  `; col = ev.col; }
  else { msg = "PIXEL HOOPS  *  1 ON 1 STREETBALL  *  NO REFS  NO RULES  *  "; col = Math.floor(worldT / 4) % 2 ? C.pink : C.gold; }
  const tw = textW(msg, true) + 4, x0 = -Math.round(ribbonX % tw);
  for (let x = x0; x < W; x += tw) p.text(msg, x, RIBBON + 3, col, { led: true });
  for (let x = 0; x < W; x += 2) p.px(x, RIBBON + 1 + ((x / 2) % 2) * 8, hex("#14101f"));    // the LED grid
  p.glow(80, RIBBON + 6, 40, col, 0.12); p.glow(240, RIBBON + 6, 40, col, 0.12);
}

function drawCrowd(p) {
  const [a, b] = players, moon = chaos?.kind === "moon", cheer = hype > 0.6, bg = hex("#14101f");
  // solid colors, darkened toward the stands for the back rows (no dithered alpha: that read as grain)
  const tone = (c, row) => lerpC(c, bg, 0.62 - row * 0.06);
  for (const c of crowd) {
    const shirt = tone(c.fan && a ? (c.x < W / 2 ? a.col : b.col) : c.neutral, c.row), skin = tone(c.skin, c.row), hair = tone(c.hair, c.row);
    let y = c.y;
    if (moon && y < 64) y += Math.round(Math.sin(worldT * 2 + c.ph) * 3);         // the crowd floats a bit too
    else if (hype > 0.3) y -= Math.round(Math.abs(Math.sin(worldT * 7 + c.ph)) * 1.5 * hype);
    const hy = y - (c.tall ? 1 : 0);
    p.rect(c.x - 1, y + 4, 7, 6, shirt);                                         // shoulders
    p.rect(c.x, hy, 5, 5, skin); p.rect(c.x, hy, 5, 1, hair);                    // head and hair
    if (cheer && c.fan && c.row > 2) {                                           // the near rows throw their arms up
      const up = Math.floor(worldT * 3 + c.ph) % 2;
      p.rect(c.x - 2, hy - 3 + up, 1, 5, skin); p.rect(c.x + 6, hy - 3 + up, 1, 5, skin);
    }
    if (c.sign && hype > 0.3) { p.rect(c.x - 2, hy - 8, 9, 5, tone(Math.floor(worldT * 2) % 2 ? C.pink : C.gold, c.row - 3)); p.text("D", c.x + 3, hy - 8, INK, { align: "center" }); }
    if (c.phone && phase === "scored" && Math.sin(worldT * 9 + c.ph * 7) > 0.9) p.glow(c.x + 2, hy - 2, 4, WHITE, 0.5);
  }
}

function drawHoopBack(p) {
  for (const h of HOOPS) {
    const fx = h.board - 1;
    if (h.broken) {
      p.rect(fx, h.y - 28, 3, 3, C.boardEdge); p.rect(fx, h.y + 3, 3, 3, C.boardEdge);
      p.px(h.board, h.y - 25, C.glass[0]); p.px(h.board, h.y + 1, C.glass[2]);
    } else {
      p.rect(fx - 1, h.y - 29, 5, 36, OUTLINE);
      p.rect(fx, h.y - 28, 3, 34, hex("#dcd8e8"));
      p.rect(h.board, h.y - 26, 1, 30, C.board); p.px(h.board, h.y - 24, WHITE);
      p.rect(h.board, h.y - 12, 1, 9, C.rim, 0.8);                                 // the shooter's square, seen edge on
    }
    p.rect(h.board + h.dir, h.y - 3, 2, 4, hex("#6a6080"));                       // the rim's bracket
    // a shot clock on top of the board, counting the game down in red
    const sx = h.board - 4, sy = h.y - 38;
    p.rect(sx - 1, sy - 1, 11, 9, OUTLINE); p.rect(sx, sy, 9, 7, hex("#14101f"));
    p.text(String(Math.min(99, Math.ceil(clock))).padStart(2, "0"), sx + 5, sy + 1, clock <= 10 ? C.red : hex("#ff6a4a"), { align: "center" });
    p.glow(sx + 4, sy + 3, 8, C.red, 0.3);
  }
}

function drawHoopFront(p) {
  for (const h of HOOPS) {
    const dy = Math.round(Math.sin(worldT * 50) * h.wob * 1.5), bend = h.wob > 1 ? 1 : 0;
    p.line(h.back, h.y + 1, h.front, h.y + 1 + dy + bend, hex("#a83a12"));
    p.line(h.back, h.y, h.front, h.y + dy + bend, C.rim);
    const len = 10 + h.net * 7, sway = Math.sin(worldT * 20) * h.net * 2;
    for (let i = 0; i <= 4; i++) {
      const x0 = h.lo + 1 + i * 4, x1 = h.cx + (x0 - h.cx) * 0.55 + sway;
      p.line(x0, h.y + 2, x1, h.y + len, C.net, 0.85);
    }
    p.line(h.lo + 2, h.y + len * 0.4, h.hi - 2, h.y + len * 0.4, C.net, 0.55);
    p.line(h.lo + 3 + sway, h.y + len * 0.8, h.hi - 3 + sway, h.y + len * 0.8, C.net, 0.55);
  }
}

// A player, drawn in local space (feet at 0,0), front of the body toward +x, every part outlined in ink.
// o: { ghost, k, x, y, pose, bust } where pose is "idle" or "dance" and bust draws only the chest up (portraits)
function drawPlayer(p, pl, o = {}) {
  const ghost = o.ghost, k = o.k ?? 1, ch = pl.ch, w = ch.wide;
  const tint = ghost ? pl.col : pl.flash > 0 ? WHITE : pl.frozen > 0 && pl.frozenKind === "time" ? C.grey : 0, ga = ghost ? ghost.a * 0.7 : 1;
  const ax = Math.round(o.x ?? (ghost ? ghost.x : pl.x)), ay = Math.round(o.y ?? (ghost ? ghost.y : pl.y)) + (!ghost && !o.pose && pl.squash > 0 ? 1 : 0);
  const f = ghost ? ghost.f : pl.facing, live = !ghost && !o.pose, has = live && ball.owner === pl, big = live && chaos?.kind === "bighead" ? 2 : 1;
  const skin = ch.skin, skinD = shade(ch.skin, 0.72), col = pl.col, colD = pl.dark, colL = shade(pl.col, 1.25), shoe = ch.shoe;
  // parts are collected first, then drawn: the outline pass of everything, then the fills (edge: own outline, for limbs in front)
  const parts = [];
  const P = (x, y, ww, hh, c, edge = false) => parts.push([x, y, ww, hh, c, edge]);
  const flush = (dir) => {
    const X = (x, ww) => (dir > 0 ? x : -x - ww);
    const box = (x, y, ww, hh, c, a = 1) => p.rect(ax + X(x, ww) * k, ay + y * k, ww * k, hh * k, c, a * ga);
    const edgeC = live && pl.fire ? (Math.floor(worldT * 12) % 2 ? hex("#ff5a1a") : hex("#ffb02a")) : OUTLINE;
    if (!ghost) for (const [x, y, ww, hh] of parts) box(x - 1 / k, y - 1 / k, ww + 2 / k, hh + 2 / k, edgeC);
    for (const [x, y, ww, hh, c, edge] of parts) {
      if (edge && !ghost) box(x - 1 / k, y - 1 / k, ww + 2 / k, hh + 2 / k, edgeC === OUTLINE ? OUTLINE : shade(edgeC, 0.7));
      box(x, y, ww, hh, tint || c);
    }
    parts.length = 0;
  };
  if (live) p.ellipse(ax, FLOOR + 1, Math.max(3, 8 + w * 2 - (FLOOR - pl.y) / 6), 2, C.shadow, 0.5);

  if (live && pl.fallen > 0) {
    // flat on the floor, head toward fallDir
    const d = pl.fallDir;
    P(-17, -3, 4, 3, shoe); P(-17, -1, 4, 1, WHITE);
    P(-13, -3, 7, 3, skin); P(-9, -3, 2, 3, WHITE);
    P(-6, -5 - w, 6, 5 + w, colD);
    P(0, -6 - w, 10, 6 + w, col); P(0, -6 - w, 10, 1, colL);
    P(1, -9 - w, 7, 3, skin, true);
    const hs = 8 * big;
    P(10, -hs, hs, hs, ch.style === "hood" ? colD : skin);
    if (ch.style === "bald") P(10 + hs - 2, -hs, 2, hs, skinD);
    else if (ch.style === "old") P(10 + hs - 2, -hs + 2, 2, hs - 4, ch.hair);
    else P(10 + hs - 3, -hs - 1, 4, hs + 2, ch.hair);
    P(12, -hs + 2, 1, 2, INK); P(15, -hs + 2, 1, 2, INK);
    flush(d);
    if (!pl.loser) for (let s = 0; s < 3; s++) {
      const a = worldT * 7 + s * 2.09, hx = ax + d * 14 * k;
      p.rect(Math.round(hx + Math.cos(a) * 8), Math.round(ay - 14 * big + Math.sin(a) * 2), 2, 2, s === 1 ? WHITE : C.gold);
    }
    return;
  }

  const air = live && !pl.onGround, moving = live && Math.abs(pl.vx) > 1 && !air;
  const dance = !ghost && (o.pose === "dance" || (live && (pl.celebrate > 0 || pl.winner)));
  const bob = dance ? Math.round(Math.abs(Math.sin(worldT * 10)) * 2) : o.pose === "idle" ? Math.round(Math.abs(Math.sin(worldT * 3))) : moving ? Math.round(Math.abs(Math.sin(pl.walk / 4))) : 0;
  const old = ch.style === "old", hunch = old ? 1 : 0, Y = -bob - (live && pl.fakeT > 0.27 ? 2 : 0), awake = live && pl.fire, G = awake ? 5 : 0;
  const stride = moving ? Math.round(Math.sin(pl.walk / 4) * 3) : 0;
  const bw = 12 + 2 * w, bx = -6 - w;                                            // torso box
  const top = Y - 29 - w - G;                                                    // shoulders (higher when awakened)
  const up = live && (pl.shooting || pl.hang > 0 || pl.dunk || pl.gather > 0 || pl.fakeT > 0.2 || (air && !has));
  const swipe = live && pl.swipe > 0, granny = live && pl.granny > 0;

  // the back arm, behind everything
  const arm = (front) => {
    const x = front ? 5 + w : -8 - w, c = front ? skin : skinD, band = front ? col : colD;
    if (dance) { const s = (Math.floor(worldT * 6) + (front ? 1 : 0)) % 2; if (s) { P(x, top - 11, 3, 12, c, front); P(x, top - 11, 3, 2, band); } else { P(x, top + 1, 3, 11, c, front); P(x, top + 9, 3, 2, band); } return; }
    if (up) { P(x, top - 12, 3, 13, c, front); P(x, top - 10, 3, 2, band); return; }
    if (granny) { P(front ? 2 : -2, top + 6, 3, 7, c, front); return; }
    if (swipe && front) { P(x, top + 2, 11, 3, c, true); P(x + 8, top + 2, 2, 3, band); return; }
    if (has && front) { P(x, top + 1, 3, 6, c, true); P(x + 1, top + 6, 6, 3, c, true); P(x + 5, top + 6, 2, 3, band); return; }
    const sw = moving ? Math.round(Math.sin(pl.walk / 4 + (front ? Math.PI : 0)) * 1.5) : 0;
    P(x + sw, top + 1, 3, 11, c, front); P(x + sw, top + 9, 3, 2, band);
  };
  // a leg with its sock and its sneaker
  const leg = (front) => {
    const s = front ? stride : -stride;
    if (air) {
      const lx = front ? 1 : -4, ly = front ? -12 : -13;
      P(lx, Y + ly - G, 3, 7 + G, skin); P(lx + (front ? 0 : -1), Y + ly + 6, 5, 3, shoe); P(lx + (front ? 0 : -1), Y + ly + 8, 5, 1, WHITE);
      return;
    }
    const lx = (front ? 1 : -4) + s, lift = moving && s > 1 ? 1 : 0;
    P(lx, Y - 11 - G, 3, 9 - lift + bob + G, front ? skin : skinD);
    P(lx, -6 - lift, 3, old ? 4 : 2, old ? WHITE : WHITE);
    if (old) P(lx, -5 - lift, 3, 1, col);
    P(lx - 1, -3 - lift, 5, 3, shoe); P(lx - 1, -1 - lift, 5, 1, WHITE); P(lx + 2, -3 - lift, 2, 1, shade(shoe, 1.3));
  };
  if (!o.bust) { arm(false); leg(false); leg(true); }
  else arm(false);
  // shorts and jersey
  if (!o.bust) {
    // baggy shorts down to the knee: waistband, side stripes, hem
    P(bx - 1, Y - 19 - G, bw + 2, 9, colD);
    P(bx - 1, Y - 19 - G, bw + 2, 1, col);
    P(bx + bw - 1, Y - 18 - G, 1, 8, col); P(bx, Y - 18 - G, 1, 8, colL);
    P(bx - 1, Y - 11 - G, bw + 2, 1, shade(colD, 0.7));
  }
  // a sleeveless jersey: narrower than the shorts, with trim round the arm holes and the neck
  const jx = bx + 1, jw = bw - 2, jh = Y - 18 - G - top;
  P(jx, top, jw, jh, col);
  P(jx, top, 2, jh, shade(col, 0.82));                                           // the back of the body in shade
  P(jx + jw - 1, top + 1, 1, jh - 1, colL);
  P(jx, top, 1, 5, colL); P(jx + jw - 1, top, 1, 5, WHITE);                      // arm hole trim
  P(-3, top, 6, 1, colL); P(-2, top, 4, 2, skin); P(-2, top + 2, 4, 1, colL);    // the V of the neck
  // the neck and the head
  const hw = 10 * big + w, hx = -Math.floor(hw / 2) + 1 + hunch, hy = top - hw + 1 + hunch;
  P(-2 - w, top - 2, 4 + 2 * w, 3, skinD);
  const sty = ch.style, hair = ch.hair, hairD = shade(ch.hair, 0.7);
  if (sty === "hood") {
    P(hx - 2, hy - 2, hw + 3, hw + 3, colD); P(hx - 3, hy + 1, 2, hw - 2, colD); // the hood, its point behind
    P(hx + 1, hy - 1, hw, 1, col); P(hx + 1, hy - 1, 1, hw, col);               // its rim catching the light
    P(hx + 2, hy + 1, hw - 3, hw - 2, skin);                                     // the face in its opening
    P(hx + 2, hy + Math.ceil(hw / 2) + 1, hw - 3, Math.floor(hw / 2) - 2, INK);  // the mask
  } else {
    P(hx, hy, hw, hw, skin);
    P(hx, hy, 2, hw, skinD);
    P(hx + 2, hy + 4 * big, 1, 2 * big, skinD);                                 // the ear
  }
  // hair: what makes each baller read at a glance
  if (sty === "flame") {
    P(hx - 1, hy - 1, hw + 1, 3, hair); P(hx - 1, hy + 2, 2, 3, hair);
    P(hx, hy + 2, hw, 1, WHITE);                                                 // the headband
    for (let i = 0; i < hw; i += 2) { const fl = (2 + Math.floor((Math.sin(worldT * 14 + i * 1.7) + 1) * 1.5) + (i < hw / 2 ? 1 : 0)) * (awake ? 2 : 1); P(hx + i - 1, hy - 1 - fl, 2, fl, i % 4 ? C.fire[2] : C.fire[1]); }
  } else if (sty === "fluffy") {
    P(hx - 2, hy - 3, hw + 3, 5, hair); P(hx - 2, hy + 2, 3, 5, hair); P(hx + 3, hy - 4, 4, 2, hair);
    P(hx, hy - 3, 3, 1, C.ice);
  } else if (sty === "spiky") {
    P(hx - 1, hy - 1, hw + 1, 3, hair);
    for (let i = 0; i < 4; i++) P(hx - 2 + i * 2 - 1, hy - 3 - (i % 2 ? 1 : 3), 2, (i % 2 ? 1 : 3) + 2, i % 2 ? hairD : hair);
    P(hx - 3, hy, 2, 2, hair);
  } else if (sty === "bald") {
    P(hx + 2, hy + 1, 2, 1, WHITE);
    P(hx + 3, hy + hw - 2, hw - 3, 2, hair); P(hx + hw - 4, hy + hw - 4, 2, 2, hair);   // the beard round the chin
    P(hx + hw - 3, hy + hw - 4, 2, 1, shade(skin, 0.55));                       // the mouth
  } else if (sty === "old") {
    P(hx - 1, hy + 2, 2, 4, hair); P(hx + 1, hy + 1, 2, 2, hair);
    P(hx, hy + 1, hw, 1, C.red);                                                 // the sweatband
  }
  // the face
  if (!ghost) {
    const ex = hx + hw - 3 * big, ey = hy + 3 * big + (sty === "fluffy" ? 1 : 0);
    if (sty === "hood") { P(ex - 3, ey, 2, 1, hex("#e6d8ff")); P(ex, ey, 2, 1, hex("#e6d8ff")); }
    else if (sty === "fluffy") { P(hx + hw - 6, ey, 6, 2, INK); P(hx + hw - 5, ey, 1, 1, C.ice); P(hx + hw - 2, ey, 1, 1, C.ice); }
    else {
      P(ex - big, ey, 2 * big, 2 * big, awake ? C.fire[2] : WHITE); P(ex, ey, big, 2 * big, pl.flash > 0 ? WHITE : awake ? WHITE : INK);
      P(ex - big, ey - big, 3 * big, big, sty === "old" ? WHITE : sty === "bald" ? INK : hairD);
      if (sty === "old") { P(ex - 2, ey - 1, 4, 1, C.dim); P(ex - 3, ey + 3, 4, 1, WHITE); }    // glasses, moustache
    }
    if (sty !== "hood" && sty !== "bald") P(hx + hw - 2 * big, hy + hw - 2 * big, 2 * big, big, shade(skin, 0.6));
    if (big > 1) P(hx + hw - 6, hy + hw - 5, 4, 1, INK);
  }
  arm(true);
  flush(f);
  if (!ghost && !o.bust) {
    const num = pl.i ? "2" : "1", ny = ay + (Y - 26 - w) * k;
    if (live) p.text(num, ax + (f > 0 ? 1 : 0), ny, colD, { align: "center" });
    if (sty === "hood" && live) p.light(ax + (hx + hw - 3) * f, ay + (hy + 3) * k, hex("#9a7cff"), 0.8);
  }
  if (live) {
    const ht = ay + hy * k;
    if (pl.stun > 0) p.text("?", ax, ht - 12, C.gold, { scale: 2, align: "center", outline: INK });
    if (pl.whiff > 0) p.rect(ax - f * 7, ht + 2, 1, 2, C.tear);
    if (pl.fire) {
      // flames licking off the shoulders and the head
      p.glow(ax, ay + Y - 22, 26, hex("#ff6a1a"), pl.infernoT > 0 ? 0.45 : 0.3);
      for (let i = 0; i < 7; i++) {
        const fx = ax - 8 - w + i * (16 + 2 * w) / 6, base = i === 0 || i === 6 ? ay + top + 2 : ay + hy * k + 1;
        const fl = 3 + Math.round((Math.sin(worldT * 16 + i * 2.3) + 1) * 3);
        p.rect(Math.round(fx), base - fl, 2, fl, C.fire[(i + Math.floor(worldT * 10)) % 3], 0.9);
      }
    }
    if (has && !pl.shooting) p.tri(ax - 3, ht - 9, ax + 3, ht - 9, ax, ht - 5, pl.col);
    if (pl.stam < 0.999 && !demo) {
      // stamina on the floor under him: his color while a dash is affordable, red when it isn't
      const sw = 14, ok = pl.stam >= DASH_COST(pl);
      p.rect(ax - sw / 2 - 1, FLOOR + 4, sw + 2, 3, INK); p.rect(ax - sw / 2, FLOOR + 5, Math.round(sw * pl.stam), 1, ok ? pl.col : C.red);
    }
    if (pl.frozen > 0 && pl.frozenKind === "ice") {
      const iw = bw + 8, ih = 44, ix = ax - iw / 2;
      veil(p, ix, ay - ih, iw, ih, C.ice, 0.55);
      p.rect(ix, ay - ih, iw, 1, C.iceHi); p.rect(ix + 2, ay - ih + 4, 1, 26, C.iceHi, 0.8); p.rect(ix + 5, ay - ih + 8, 1, 8, C.iceHi, 0.8);
    }
    if (pl.frozen > 0 && pl.frozenKind === "time") p.text("ZZ", ax + 8, ht - 4 - Math.round(Math.sin(worldT * 3) * 2), C.dim, { outline: INK });
  }
}

// the release meter: a bar beside the shooter and a ring that closes on the ball at the top of the jump
function drawMeter(p, pl) {
  if (!pl.shooting || ball.owner !== pl) return;
  const sj = SHOT_JUMP * pl.ch.jmp, pz = perfectZone(pl), v = pl.vy, inP = Math.abs(v) <= pz, inG = Math.abs(v) <= 85;
  const col = inP ? C.green : inG ? C.gold : C.red, blink = Math.floor(worldT * 20) % 2;
  const [bx, by] = ballHeld(pl), r = Math.round(5 + Math.min(1, Math.abs(v) / sj) * 18);
  p.ring(bx, by, 5, 1, WHITE, 0.5);
  p.ring(bx, by, r, inP ? 2 : 1, col);
  p.glow(bx, by, r + 4, col, inP ? 0.7 : 0.25);
  const x = Math.round(pl.x - pl.facing * 18) - 2, top = Math.round(pl.y - 58), hgt = 34;
  const m = clamp((v + sj) / (2 * sj), 0, 1), my = top + hgt - Math.round(m * hgt);
  p.rect(x - 2, top - 2, 9, hgt + 4, INK);
  frameBox(p, x - 2, top - 2, 9, hgt + 4, inP && blink ? C.green : C.panelEdge);
  p.rect(x, top, 5, hgt, hex("#5a1a2a"));
  const zone = (z, c) => p.rect(x, top + Math.round(hgt * (0.5 - z)), 5, Math.max(2, Math.round(hgt * z * 2)), c);
  zone(85 / (2 * sj), hex("#c89a1a")); zone(pz / (2 * sj), C.green);
  p.light(x + 2, top + hgt / 2, C.green, inP ? 1 : 0.3);
  p.rect(x - 3, my - 1, 11, 3, INK); p.rect(x - 2, my, 9, 1, WHITE);
  p.tri(x - 6, my - 2, x - 6, my + 2, x - 3, my, WHITE);
  if (inP) p.text("NOW!", x + 2, top - 10, C.green, { align: "center", outline: INK });
}

// ---- cues for a human player: the openings, shown where they are and heard when they open ----
// defending: the ball gets a dotted ring when it is in your reach, and turns gold with a "!" in the steal window.
// attacking: a defender who bit (in the air, reached, landed flat, leaning the wrong way) gets dizzy stars, and a gold
// "GO!" arrow says dash past him now.
const goOpen = (a) => {
  const d = other(a), toward = Math.sign(hoopOf(a).cx - a.x) || 1;
  return ball.owner === a && a.onGround && !a.shooting && a.gather <= 0 && a.stam >= DASH_COST(a) && d.ch.name !== "TANK"
    && Math.abs(d.x - a.x) < 60 && committed(d, toward) && d.fallen <= 0;
};
const inReach = (p, o) => Math.abs(o.x - p.x) <= (p.fire ? 30 : 24) + (assist(p) ? 6 : 0) && Math.abs(o.y - p.y) <= 24;
const cueWas = { steal: false, go: false };
function drawCues(p) {
  if (demo || tut?.done > 0) return;
  const blink = Math.floor(worldT * 10) % 2;
  let steal = false, go = false;
  for (const me of players) {
    if (me.tag === "CPU") continue;
    const o = other(me);
    if (ball.owner === o && me.fallen <= 0) {
      const bx = Math.round(ball.x), by = Math.round(ball.y);
      if (stealOpen(me, o)) {
        steal = true;
        p.ring(bx, by, BR + 3, 2, C.gold); p.glow(bx, by, 14, C.gold, 0.9);
        // over your own head, where GO! shows on offense: one place to look for "now"
        p.text("STEAL!", Math.round(me.x), Math.round(me.y - 62) - (blink ? 1 : 0), C.gold, { font: "big", align: "center", outline: INK });
        p.line(Math.round(me.x), Math.round(me.y - 52), bx, by - BR - 2, C.gold);
      } else if (inReach(me, o) && stealPhase(me, o).warn > 0) {
        // get ready: a gold ring closes in on the ball, and it lands when the window opens
        const w = stealPhase(me, o).warn;
        p.ring(bx, by, Math.round(BR + 3 + (1 - w) * 12), 1, w > 0.6 ? C.gold : WHITE);
      } else if (inReach(me, o)) {
        for (let i = 0; i < 6; i++) { const a = worldT * 4 + (i / 6) * Math.PI * 2; p.px(Math.round(bx + Math.cos(a) * (BR + 4)), Math.round(by + Math.sin(a) * (BR + 4)), WHITE); }
      }
    }
    if (goOpen(me)) {
      go = true;
      const toward = Math.sign(hoopOf(me).cx - me.x) || 1, gx = Math.round(me.x), gy = Math.round(me.y - 86);   // over your own head, above the callouts
      p.text("GO!", gx, gy - 4, C.gold, { font: "big", align: "center", outline: INK });
      const ax = gx + toward * (14 + (blink ? 2 : 0));
      p.tri(ax, gy, ax - toward * 6, gy - 5, ax - toward * 6, gy + 5, C.gold);
    }
  }
  // dizzy stars over anyone who has bitten while the other side has the ball
  for (const d of players) {
    const a = other(d);
    if (ball.owner !== a || d.ch.name === "TANK" || d.fallen > 0 || !committed(d, Math.sign(hoopOf(a).cx - a.x) || 1)) continue;
    const hy = Math.round(d.y - 44 - (d.fire ? 5 : 0));
    for (let s = 0; s < 3; s++) { const ang = worldT * 9 + s * 2.09; p.rect(Math.round(d.x + Math.cos(ang) * 7), Math.round(hy + Math.sin(ang) * 2), 2, 2, s === 1 ? WHITE : C.gold); }
  }
  // a chime when an opening appears, so you can hear it as well as see it
  if (steal && !cueWas.steal) sfx.cue(); if (go && !cueWas.go) sfx.cue(true);
  cueWas.steal = steal; cueWas.go = go;
}

function drawBall(p) {
  // a human defender sees the steal window: the ball flashes white
  const x = Math.round(ball.x), y = Math.round(ball.y), gold = golden, r = gold ? BR + 1 : BR, col = gold ? C.gold : C.ball;
  ball.trail.forEach(([tx, ty], i) => p.rect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2, ball.homing ? hex("#9a7cff") : gold ? C.gold : ball.shooter?.fire ? C.fire[i % 3] : C.green, (i + 1) / 12));
  if (!ball.owner) p.ellipse(x, FLOOR + 1, Math.max(1, 3 - (FLOOR - y) / 30), 1, C.shadow, 0.5);
  p.disc(x, y, r, col, 1);
  p.line(x - r + 1, y, x + r - 1, y, gold ? C.goldDark : C.ballDark);
  p.line(x, y - r + 1, x, y + r - 1, gold ? C.goldDark : C.ballDark);
  p.px(x - 1, y - 2, hex("#fff0c4"));
  if (gold) { p.glow(x, y, 12, C.gold, 0.6); if (Math.random() < 0.5) part({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), vy: -14, life: 0.35, c: WHITE, floor: false }); }
}

let crowdBake = { key: "", color: null, light: null };
function drawWorld() {
  const calm = hype <= 0.3 && chaos?.kind !== "moon" && phase !== "scored" && players.length;
  let p;
  if (calm) {
    const key = players.map((q) => q.col).join("|");
    if (crowdBake.key !== key) {
      world.color.set(courtColor); world.light.set(courtLight);
      p = painterFor(world); p.place(0, 0); drawCrowd(p);
      crowdBake = { key, color: world.color.slice(), light: world.light.slice() };
    }
    world.color.set(crowdBake.color); world.light.set(crowdBake.light);
    p = painterFor(world); p.place(0, 0);
    drawBackdrop(p);
  } else {
    world.color.set(courtColor); world.light.set(courtLight);
    p = painterFor(world); p.place(0, 0);
    drawBackdrop(p);
    drawCrowd(p);
  }
  drawHoopBack(p);
  drawFxList(fxWorld, world, "back");
  p = painterFor(world); p.place(0, 0);
  for (const s of strikes) if (!s.done && Math.floor(s.t * 12) % 2 === 0) {
    p.ellipse(s.x, FLOOR + 1, 10, 2, C.red, 0.8);
    p.text("!", s.x, FLOOR - 16, C.red, { font: "big", align: "center", outline: INK });
  }
  for (const b of bananas) {
    if (!b.landed) {
      p.ellipse(b.x, FLOOR + 1, 4, 1, C.banana, 0.6);
      if (b.y > -20 && Math.floor(worldT * 8) % 2) p.text("!", b.x, FLOOR - 12, C.banana, { align: "center", outline: INK });
    }
    const s = b.landed ? 0 : Math.round(Math.sin(b.spin) * 2);
    p.rect(b.x - 3, b.y - 3 + s, 7, 2, C.banana); p.rect(b.x - 4, b.y - 5 - s, 2, 2, C.bananaTip); p.rect(b.x + 3, b.y - 5 + s, 2, 2, C.banana);
    p.rect(b.x - 2, b.y - 1, 5, 1, C.goldDark);
  }
  for (const pl of players) for (const g of pl.ghosts) drawPlayer(p, pl, { ghost: g });
  const order = [...players].sort((a, b) => (a === ball.owner) - (b === ball.owner));
  for (const pl of order) drawPlayer(p, pl);
  for (const t of teeth) {
    const tx = Math.round(t.x), ty = Math.round(t.y);
    p.rect(tx - 2, ty - 1, 5, 3, hex("#ff86a0")); p.rect(tx - 2, ty - 1, 5, 1, WHITE); p.rect(tx - 2, ty + 1, 5, 1, WHITE);
  }
  drawBall(p);
  drawHoopFront(p);
  for (const q of parts) p.rect(Math.round(q.x), Math.round(q.y), q.s, q.s, q.c, Math.min(1, (q.life / q.max) * 1.6));
  drawPfx(p);
  drawCues(p);
  for (const pl of players) {
    drawMeter(p, pl);
    drawPassiveFx(p, pl);
    if (pl.msg) {
      const m = pl.msg, age = (m.max ?? 0.9) - m.t, rise = m.big ? Math.min(1, age * 8) * 6 + age * 8 : age * 14;
      p.text(m.text, pl.x, pl.y - 54 - (pl.fire ? 5 : 0) - rise, m.c, { align: "center", outline: INK, a: Math.min(1, m.t * 3), font: m.big ? "big" : undefined });
    }
  }
  drawFxList(fxWorld, world, "front");
}

function drawButton(p, i, label, x, y, w) {
  const h = 13, b = { x, y, w, h };
  if (mouse.moved && inside(b)) menuSel = i;
  const sel = menuSel === i;
  p.rect(x, y, w, h, sel ? C.pink : C.panel);
  p.rect(x, y, w, 1, sel ? hex("#ff86e6") : C.panelEdge); p.rect(x, y + h - 1, w, 1, sel ? hex("#701560") : INK);
  p.rect(x, y, 1, h, sel ? hex("#ff86e6") : C.panelEdge); p.rect(x + w - 1, y, 1, h, sel ? hex("#701560") : INK);
  p.text(label, x + w / 2, y + 4, sel ? WHITE : C.line, { align: "center" });
  if (sel) p.text(">", x + 5, y + 4, WHITE);
  return b;
}
function drawButtons(p, x, y0, w, gap = 16) {
  const name = (l) => (l === "LANGUAGE" ? (lang === "ko" ? "언어: 한국어" : "LANGUAGE: ENGLISH") : l);
  buttons = menuItems().map(([label, act], i) => ({ ...drawButton(p, i, name(label), x, y0 + i * gap, w), act }));
}
function frameBox(p, x, y, w, h, c, t = 1) {
  p.rect(x, y, w, t, c); p.rect(x, y + h - t, w, t, c); p.rect(x, y, t, h, c); p.rect(x + w - t, y, t, h, c);
}
function panel(p, x, y, w, h, edge = C.panelEdge) { veil(p, x, y, w, h, INK, 0.9); frameBox(p, x, y, w, h, edge); }
function keycap(p, label, x, y) {
  const w = Math.max(9, label.length * 4 + 4);
  p.rect(x, y, w, 9, hex("#3a3550")); p.rect(x, y + 8, w, 1, INK); p.rect(x, y, w, 1, hex("#5a5070"));
  p.text(label, x + w / 2, y + 2, WHITE, { align: "center" });
  return x + w + 2;
}
const dummy = (ch, facing = 1) => ({ ch, col: ch.col, dark: ch.dark, facing, flash: 0, frozen: 0, vx: 0, onGround: true });

function drawIcon(p, kind, x, y) {
  if (kind === "moon") { p.disc(x, y, 7, C.moon, 1); p.disc(x - 2, y - 2, 2, C.grey, 1); p.disc(x + 3, y + 2, 2, C.grey, 1); }
  if (kind === "banana") { p.rect(x - 6, y + 1, 12, 3, C.banana); p.rect(x - 7, y - 2, 3, 3, C.banana); p.rect(x + 5, y - 3, 2, 3, C.bananaTip); }
  if (kind === "bighead") { p.rect(x - 7, y - 7, 14, 13, CHARS[0].skin); p.rect(x - 7, y - 8, 14, 3, INK); p.rect(x + 2, y - 2, 2, 2, INK); p.rect(x - 4, y - 2, 2, 2, INK); p.rect(x - 3, y + 2, 6, 1, INK); }
  if (kind === "golden") { p.disc(x, y, 7, C.gold, 1); p.line(x - 6, y, x + 6, y, C.goldDark); p.line(x, y - 6, x, y + 6, C.goldDark); p.glow(x, y, 14, C.gold, 0.6); }
  if (kind === "storm") { p.poly([[x + 2, y - 8], [x - 5, y + 1], [x, y + 1], [x - 3, y + 9], [x + 6, y - 2], [x + 1, y - 2]], C.volt); p.glow(x, y, 12, hex("#8cf0ff"), 0.6); }
}

function drawHowTo(p) {
  panel(p, 14, 6, 292, 168);
  p.text("HOW TO PLAY", 160, 12, C.gold, { font: "big", align: "center", outline: INK });
  const rows = ["MOVE", "JUMP / BLOCK", "DASH", "SHOOT / STEAL", "SPECIAL MOVE"];
  const keysP1 = [["A", "D"], ["W"], ["S"], ["F"], ["E"]], keysP2 = [["<", ">"], ["UP"], ["DOWN"], ["ENTER"], ["R-SHIFT"]];
  p.text("P1", 64, 24, CHARS[0].col, { font: "big", align: "center" });
  p.text("P2", 150, 24, CHARS[1].col, { font: "big", align: "center" });
  rows.forEach((label, i) => {
    const y = 33 + i * 10;
    let x = 50; for (const k of keysP1[i]) x = keycap(p, k, x, y);
    x = 130; for (const k of keysP2[i]) x = keycap(p, k, x, y);
    p.text(label, 196, y + 2, C.line);
  });
  const tips = [
    [C.green, "HOLD SHOOT, LET GO AT THE TOP OF THE JUMP = PERFECT"],
    [C.gold, "DASH THEN SHOOT NEAR THE RIM = DUNK (SOMETIMES GLASS)"],
    [CHARS[0].col, "DASH PAST A DEFENDER WHO JUMPED, REACHED OR LEANED = ANKLES"],
    [C.fire[1], "BLAZE: 2 MAKES IN A ROW = AWAKEN (BIGGER, HIGHER, HOTTER)"],
    [CHARS[4].col, "TAP SHOOT = PUMP FAKE. STEAL WHEN THE BALL FLASHES"],
    [C.gold, "JUMP INTO A FLYING BALL WITH YOUR HANDS UP = CATCH IT"],
    [C.pink, "CHAOS EVERY 20 SECONDS. IT GETS WEIRD"],
  ];
  const ko = LH() > 7;
  tips.forEach(([c, t], i) => p.text(t, 160, 88 + Math.round(i * 8.4), c, { align: "center" }));
  p.text("ESC PAUSE   M SOUND   N MUSIC   T LANGUAGE   1P ALSO WORKS WITH ARROWS", 160, 147, C.dim, { align: "center" });
  drawButtons(p, 130, 157, 60);
}

function drawSelect(p) {
  veil(p, 0, 0, W, H, INK, 0.82);
  p.text("CHOOSE YOUR BALLER", 160, 5, C.gold, { font: "big", align: "center", outline: INK });
  cards = [];
  const cw = 46, gap = 4, x0 = (W - (CHARS.length * cw + (CHARS.length - 1) * gap)) / 2, y0 = 15, chh = 56;
  CHARS.forEach((ch, i) => {
    const x = x0 + i * (cw + gap), b = { x, y: y0, w: cw, h: chh, i };
    cards.push(b);
    const on = sel.cur.map((c, who) => c === i && (who === 0 || sel.mode === "pvp" || sel.lock[0]));
    p.rect(x, y0, cw, chh, on[0] || on[1] ? hex("#2a2440") : C.panel);
    p.rect(x + 2, y0 + 2, cw - 4, 41, lerpC(C.panel, ch.dark, 0.55));
    drawPlayer(p, dummy(ch, i < 3 ? 1 : -1), { x: x + cw / 2, y: y0 + 42, pose: on.some(Boolean) ? "dance" : "idle" });
    p.text(ch.name, x + cw / 2, y0 + 46, on.some(Boolean) ? WHITE : C.line, { align: "center" });
    frameBox(p, x, y0, cw, chh, C.panelEdge);
    on.forEach((o, who) => {
      if (!o) return;
      const c = who ? CHARS[1].col : CHARS[0].col, lk = sel.lock[who], blink = lk ? Math.floor(worldT * 10) % 2 : 1;
      frameBox(p, x - who, y0 - who, cw + who * 2, chh + who * 2, blink ? (lk ? WHITE : c) : c, 2);
      const tag = who ? (sel.mode === "cpu" ? "CPU" : "2P") : "1P";
      p.rect(x + (who ? cw - 15 : 1), y0 + chh - 1, 14, 7, c);
      p.text(lk ? "OK" : tag, x + (who ? cw - 8 : 8), y0 + chh, INK, { align: "center" });
    });
  });
  // two info panels with a big portrait each
  [0, 1].forEach((who) => {
    const KOL = LH() > 7, px = who ? 164 : 8, py = KOL ? 84 : 85, pw = 148, ph = KOL ? 95 : 93, ch = CHARS[sel.cur[who]];
    const hidden = who === 1 && sel.mode === "cpu" && !sel.lock[0];
    const c = who ? CHARS[1].col : CHARS[0].col;
    panel(p, px, py, pw, ph, sel.lock[who] ? WHITE : c);
    p.text(who ? (sel.mode === "cpu" ? "CPU" : "P2") : "P1", px + 4, py + 3, c);
    if (who && sel.mode === "cpu") p.text(settings.diff.toUpperCase(), px + pw - 4, py + 3, C.dim, { align: "right" });
    if (hidden) { p.text("WAITING FOR P1", px + pw / 2, py + 44, C.dim, { align: "center" }); return; }
    p.rect(px + 4, py + 10, 34, KOL ? 44 : 50, lerpC(C.panel, ch.dark, 0.6));
    drawPlayer(p, dummy(ch, who ? -1 : 1), { x: px + 21, y: py + (KOL ? 51 : 55), pose: sel.lock[who] ? "dance" : "idle" });
    p.text(ch.name, px + 44, py + 9, ch.col, { font: "big", scale: 2, outline: INK });
    p.text(ch.title, px + 44, py + 25, C.dim);
    [["SPD", ch.spd], ["JMP", ch.jmp], ["SHOT", ch.shot], ["3PT", ch.three], ["DEF", ch.def]].forEach(([l, v], r) => {
      // in Korean the stats go in two columns, to leave room for the taller lines below
      const y = KOL ? py + 37 + (r % 3) * 6 : py + 31 + r * 6, sx = KOL && r >= 3 ? px + 96 : px + 44;
      p.text(l, sx, y, C.line);
      for (let k = 0; k < 5; k++) p.rect(sx + (KOL ? 18 : 20) + k * (KOL ? 5 : 6), y, 4, 4, k < pips(v) ? ch.col : hex("#2a2440"));
    });
    const ko = KOL, r0 = ko ? 59 : 64, rs = ko ? 8.4 : 7.4;
    p.text("PASSIVE", px + 4, py + r0, C.dim); p.text(ch.passive, px + pw - 4, py + r0, ch.col, { align: "right" });
    p.text(ch.pdesc, px + 4, py + Math.round(r0 + rs), C.line);
    p.text("SP", px + 4, py + Math.round(r0 + rs * 2), C.dim); p.text(ch.special, px + pw - 4, py + Math.round(r0 + rs * 2), C.gold, { align: "right" });
    p.text(ch.sdesc, px + 4, py + Math.round(r0 + rs * 3), C.line);
  });
  const hint = sel.mode === "pvp" ? "P1: A D + F     P2: < > + ENTER     ESC BACK" : "< > OR A D TO PICK   F / ENTER TO LOCK   ESC BACK";
  p.text(hint, 160, 79, C.dim, { align: "center" });
  if (sel.go > 0) p.text("GET READY!", 160, 120, C.gold, { font: "big", scale: 2, align: "center", outline: INK });
}

function drawCutin(p) {
  const { p: pl, t, dur } = cutin, ch = pl.ch, k = Math.min(1, t / 0.12), out = Math.max(0, (t - (dur - 0.12)) / 0.12);
  veil(p, 0, 0, W, H, INK, 0.6);
  if (t < 0.06) veil(p, 0, 0, W, H, WHITE, 0.8);
  const slide = Math.round((1 - k) * -W + out * W), dir = pl.i ? -1 : 1;
  // a slanted band in the character's colors with streaks running through it
  const y0 = 58, bh = 56;
  p.poly([[slide * dir - 20, y0 + 6], [W + slide * dir + 20, y0], [W + slide * dir + 20, y0 + bh - 6], [slide * dir - 20, y0 + bh]], ch.dark);
  for (let i = 0; i < 9; i++) {
    const sx = ((i * 53 + t * 900 * dir) % (W + 60) + W + 60) % (W + 60) - 30;
    p.rect(sx + slide * dir, y0 + 6 + ((i * 17) % (bh - 12)), 26, 1, ch.col, 0.8);
  }
  p.rect(0, y0 + 2, W, 2, ch.col); p.rect(0, y0 + bh - 4, W, 2, ch.col);
  const px = pl.i ? 250 : 70;
  drawPlayer(p, dummy(ch, dir), { x: px + slide * dir, y: y0 + bh + 30, k: 2, pose: "idle", bust: true });
  const tx = pl.i ? 110 : 210;
  p.text(ch.name + (pl.tag === "CPU" ? "  (CPU)" : "  (" + pl.tag + ")"), tx - slide * dir, y0 + 10, WHITE, { align: "center" });
  p.text(ch.special, tx - slide * dir, y0 + 22, C.gold, { font: "big", scale: 2, align: "center", outline: INK });
  p.text("SPECIAL MOVE", tx - slide * dir, y0 + 42, ch.col, { align: "center" });
}

function drawChaosIntro(p) {
  const ci = chaosIntro, names = Object.keys(CHAOS), kind = ci.locked ? ci.kind : names[ci.shown], ev = CHAOS[kind];
  veil(p, 0, 0, W, H, INK, 0.65);
  const siren = Math.floor(ci.t * 8) % 2;
  frameBox(p, 0, 0, W, H, siren ? C.red : ev.col, 4);
  const sh = ci.locked ? 0 : Math.round(rnd(-1, 1));
  p.text("!! CHAOS !!", 160 + sh, 26, siren ? C.red : WHITE, { font: "big", scale: 3, align: "center", outline: INK });
  // the slot window
  panel(p, 50, 64, 220, 52, ci.locked ? ev.col : C.panelEdge);
  drawIcon(p, kind, 76, 90);
  p.text(ev.name, 180, 78, ci.locked ? ev.col : WHITE, { font: "big", scale: ci.locked ? 2 : 1, align: "center", outline: INK });
  if (ci.locked) {
    p.text(ev.sub, 180, 100, WHITE, { align: "center" });
    const fl = 1 - (ci.t - ci.lockAt) / 0.25;
    if (fl > 0) p.rect(0, 0, W, H, WHITE, fl);
  } else {
    const prev = CHAOS[names[(ci.shown + names.length - 1) % names.length]].name;
    p.text(prev, 180, 70, C.dim, { align: "center", a: 0.5 });
    p.text(CHAOS[names[(ci.shown + 1) % names.length]].name, 180, 104, C.dim, { align: "center", a: 0.5 });
  }
}

function drawChaosActive(p) {
  if (!chaos) return;
  const ev = CHAOS[chaos.kind], pulse = 0.5 + Math.sin(worldT * 8) * 0.5;
  frameBox(p, 0, 0, W, H, ev.col, 2);
  if (pulse > 0.5) frameBox(p, 2, 2, W - 4, H - 4, ev.col, 1);
  const w = 120, x = 100, y = 39;
  const ko = LH() > 7, ch3 = ko ? (chaos.dur > 0 ? 17 : 24) : 15;
  veil(p, x, y, w, ch3, INK, 0.85); frameBox(p, x, y, w, ch3, ev.col);
  p.text(ev.name, x + w / 2, y + (ko ? 4 : 3), ev.col, { align: "center" });
  if (chaos.dur > 0) {
    p.rect(x + 3, y + ch3 - 4, w - 6, 2, hex("#2a2440"));
    p.rect(x + 3, y + ch3 - 4, Math.round((w - 6) * (chaos.t / chaos.dur)), 2, ev.col);
  } else p.text("NEXT SCORE", x + w / 2, y + (ko ? 14 : 9), WHITE, { align: "center" });
}

// the touch controls, in the game's pixels: the stick appears under the thumb, the buttons light up while held
// and say what they will do right now (shoot or steal, jump or block)
function drawTouch(p) {
  if (!isTouch || screen !== "game") return;
  const me = players[0], held = new Set([...touch.btn.values()].map((b) => b.name)), s = touch.stick;
  const dim = lerpC(WHITE, INK, 0.45), faint = lerpC(WHITE, INK, 0.7);
  const lay = tbtn(), bx = Math.round(s ? s.ox : settings.lefty ? W - 42 : 42), by = Math.round(s ? s.oy : 150);
  const hot = me.fire, flick = Math.floor(worldT * 12) % 2, fireRim = flick ? C.fire[1] : C.fire[2];
  // flames licking up from a control's rim while awakened
  const burn = (x, y, r, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / (n - 1)) * Math.PI, fx = x + Math.cos(a) * r, fy = y + Math.sin(a) * r;
      const fl = 2 + Math.round((Math.sin(worldT * 18 + i * 2.1) + 1) * 2.5) + Math.round(touch.burn * 6);
      p.rect(Math.round(fx), Math.round(fy) - fl, 2, fl, C.fire[(i + Math.floor(worldT * 10)) % 3]);
    }
    p.glow(x, y, r + 8, hex("#ff6a1a"), 0.35 + touch.burn * 0.5);
  };
  if (touch.burn > 0) for (const b of [{ x: bx, y: by, r: 15 }, ...Object.values(lay)]) p.ring(b.x, b.y, Math.round(b.r + (1 - touch.burn) * 26), 2, C.fire[1], touch.burn);   // the burst when he lights up
  if (hot) burn(bx, by, 15, 7);
  p.disc(bx, by, 15, hot ? hex("#3a0a04") : INK, 0.3); p.ring(bx, by, 15, 1, hot ? fireRim : s ? dim : faint);
  if (s) {
    const kx = Math.round(bx + clamp(s.x - s.ox, -15, 15)), ky = Math.round(by + clamp(s.y - s.oy, -8, 4));
    p.disc(kx, ky, 7, hot ? C.fire[1] : me.col, 0.8); p.ring(kx, ky, 7, 1, hot ? C.fire[2] : WHITE);
  } else {
    p.tri(bx - 12, by, bx - 7, by - 4, bx - 7, by + 4, dim); p.tri(bx + 12, by, bx + 7, by - 4, bx + 7, by + 4, dim);
  }
  for (const [n, b] of Object.entries(lay)) {
    const on = held.has(n), ready = n === "sp" && me.sp >= 1, blink = Math.floor(worldT * 6) % 2;
    const go = n === "dash" && goOpen(me), window_ = n === "act" && ball.owner === other(me) && stealOpen(me, other(me));
    const label = n === "act" ? smartLabel() : n === "dash" ? (go ? "GO!" : "DASH") : "SP";
    if (go || window_) { const pr = b.r + 3 + Math.round((Math.sin(worldT * 18) + 1) * 2); p.ring(b.x, b.y, pr, 2, C.gold); p.disc(b.x, b.y, b.r, C.gold, 0.45); }
    // the big button takes the color of what it will do: gold to score, the player's color to defend
    const col = hot && n !== "sp" ? fireRim : n === "dash" ? me.col : n === "sp" ? (ready ? C.gold : dim) : label === "SHOOT" || label === "DUNK" ? C.gold : me.col;
    if (hot && n !== "sp") burn(b.x, b.y, b.r, n === "act" ? 11 : 7);
    p.disc(b.x, b.y, b.r, on ? col : hot && n !== "sp" ? hex("#3a0a04") : INK, on ? 0.8 : 0.45);
    p.ring(b.x, b.y, b.r, on || (ready && blink) || hot ? 2 : 1, on ? WHITE : col);
    if (n === "act") p.ring(b.x, b.y, b.r - 4, 1, lerpC(col, INK, 0.6));
    p.text(label, b.x, b.y - 2, on ? INK : n === "sp" && !ready ? dim : (n === "dash" && me.stam < DASH_COST(me)) ? C.red : WHITE, { align: "center", outline: on ? undefined : INK });
    if (n === "dash") { p.rect(b.x - 7, b.y + 5, 14, 2, INK); p.rect(b.x - 7, b.y + 5, Math.round(14 * me.stam), 2, me.stam >= DASH_COST(me) ? me.col : C.red); }
  }
  // pause
  veil(p, 229, 3, 15, 12, INK, 0.7); frameBox(p, 229, 3, 15, 12, dim); p.rect(233, 6, 2, 6, WHITE); p.rect(238, 6, 2, 6, WHITE);
  // a reminder at the start of a game
  if (!tut && clock > GAME_TIME - 6 && !overtime) p.text("LEFT THUMB: MOVE   RIGHT THUMB: BIG BUTTON DOES IT ALL, DASH NEXT TO IT", 160, 104, WHITE, { align: "center", outline: INK, a: Math.min(1, (clock - (GAME_TIME - 6)) / 1.5) });
}

// each top corner holds a small portrait; hovering it (or pinning it with a click / H) opens the passive and special card
function drawInfo(p, pl) {
  const right = pl.i === 1, ch = pl.ch, ready = pl.sp >= 1, blink = Math.floor(worldT * 6) % 2;
  const fw = 24, fh = 30, fx = right ? W - 4 - fw : 4, face = { x: fx, y: 2, w: fw, h: fh, i: pl.i };
  const hot = inside(face), open = hot || pinned[pl.i];
  infoBoxes.push(face);
  p.rect(fx, 2, fw, fh, INK);
  p.rect(fx + 1, 3, fw - 2, fh - 2, lerpC(INK, ch.dark, 0.5));
  drawPlayer(p, dummy(ch, right ? -1 : 1), { x: fx + fw / 2, y: 2 + fh + 10, pose: "idle", bust: true });
  frameBox(p, fx, 2, fw, fh, ready && blink ? C.gold : hot ? WHITE : pl.dark);
  if (pl.ptag) frameBox(p, fx - 1, 1, fw + 2, fh + 2, pl.col);                    // the portrait lights up when the passive fires
  p.text("?", right ? fx + 2 : fx + fw - 2, 4, open ? WHITE : C.dim, { align: right ? "left" : "right" });
  if (!open) return;
  const lh = LH(), w = lh > 7 ? 104 : 94, x = right ? W - 4 - w : 4, y = 2 + fh + 2, ch2 = 8 + lh * 4;
  veil(p, x, y, w, ch2, INK, 0.9);
  frameBox(p, x, y, w, ch2, pinned[pl.i] ? pl.col : pl.dark);
  p.text("PASSIVE", x + 3, y + 3, C.dim);
  p.text(ch.passive, x + w - 3, y + 3, pl.col, { align: "right" });
  p.text(ch.pdesc, x + 3, y + 3 + lh, C.line);
  p.text("SP", x + 3, y + 6 + lh * 2, ready ? C.gold : C.dim);
  p.text(ch.special, x + w - 3, y + 6 + lh * 2, C.gold, { align: "right" });
  p.text(ch.sdesc, x + 3, y + 6 + lh * 3, C.line);
}

function drawHud() {
  clearFrame(hud);
  drawFxList(fxHud, hud, "back");
  const p = painterFor(hud); p.place(0, 0);
  buttons = []; infoBoxes = []; if (screen !== "select") cards = [];
  if (screen === "select") { drawSelect(p); return; }
  if (screen === "settings") { drawSettings(p); mouse.moved = false; return; }
  if (screen === "menu" || screen === "howto") {
    veil(p, 0, 0, W, H, INK, 0.45);
    if (screen === "howto") { drawHowTo(p); return; }
    p.text("PIXEL HOOPS", 160, 30, C.gold, { font: "big", scale: 3, align: "center", outline: INK, shadow: hex("#7a3b5c") });
    p.text("1 ON 1 STREETBALL MAYHEM", 160, 58, WHITE, { align: "center", outline: INK });
    drawButtons(p, 110, 78, 100);
    p.text("6 BALLERS  6 SPECIALS  5 KINDS OF CHAOS", 160, 160, C.line, { align: "center", outline: INK });
    p.text("EFFECTS BY PIXELFX", 6, 172, C.dim);
    p.text(muted ? "M SOUND OFF" : "M SOUND ON", 314, 172, C.dim, { align: "right" });
    return;
  }
  const [a, b] = players, sec = Math.ceil(clock), mm = Math.floor(sec / 60), ss = String(sec % 60).padStart(2, "0");
  veil(p, 100, 2, 120, 21, INK, 0.88);
  p.text(a.ch.name, 104, 5, a.col);
  p.text(b.ch.name, 216, 5, b.col, { align: "right" });
  p.text(String(a.score), 124, 12, a.col, { font: "big", align: "center", outline: INK });
  p.text(String(b.score), 196, 12, b.col, { font: "big", align: "center", outline: INK });
  if (tut) p.text("PRACTICE", 160, 7, C.gold, { align: "center" }); else p.text(overtime ? "OT" : `${mm}:${ss}`, 160, 6, clock <= 10 && !overtime ? C.gold : WHITE, { font: "big", align: "center" });
  // special meters
  for (const pl of players) {
    const x = pl.i ? 162 : 100, full = pl.sp >= 1, blink = Math.floor(worldT * 6) % 2;
    veil(p, x, 24, 58, 5, INK, 0.88);
    p.rect(x + 1, 25, Math.round(56 * pl.sp), 3, full ? (blink ? WHITE : C.gold) : pl.col);
    if (full) p.text(pl.tag === "CPU" || isTouch ? "SP!" : `SP! ${pl.i ? "R-SHIFT" : "E"}`, pl.i ? x + 58 : x, 31, C.gold, { align: pl.i ? "right" : "left", outline: INK });
    if (pl.fire) {
      const fx = pl.i ? 212 : 107, fy = 13, fl = Math.floor(worldT * 8) % 2;
      p.rect(fx - 2, fy + 3, 5, 4, C.fire[0]); p.rect(fx - 1, fy + 1 - fl, 3, 5, C.fire[1]); p.rect(fx, fy - fl, 1, 6, C.fire[2]); p.px(fx, fy + 5, WHITE);
      p.glow(fx, fy + 4, 8, C.fire[1], 0.6);
    }
  }
  infoBoxes = [];
  for (const pl of players) drawInfo(p, pl);
  drawChaosActive(p);
  drawTouch(p);
  drawTutorial(p);
  if (banner) {
    const k = banner.max - banner.t, slide = Math.round(Math.max(0, 1 - k * 5) * -120 + Math.max(0, 1 - banner.t * 5) * 120);
    veil(p, 0, 92, W, 26, INK, 0.75);
    p.text(banner.text, 160 + slide, 95, C.pink, { font: "big", scale: 2, align: "center", outline: INK });
    p.text(banner.sub, 160 - slide, 110, WHITE, { align: "center" });
  }
  if (flash) p.text(flash.text, 160, 57, C.gold, { font: "big", scale: 2, align: "center", outline: INK });
  if (caption) p.text(caption.text, 160, 136, WHITE, { align: "center", outline: INK, a: Math.min(1, caption.t * 2) });
  if (cutin || chaosIntro) {
    // these take over the screen, so they go over the HUD effects too
    drawFxList(fxHud, hud, "front");
    const q = painterFor(hud); q.place(0, 0);
    koCover();
    if (cutin) drawCutin(q); else drawChaosIntro(q);
    return;
  }
  if (screen === "paused") {
    koCover();
    panel(p, 95, 40, 130, 104);
    p.text("PAUSED", 160, 48, C.gold, { font: "big", scale: 2, align: "center" });
    drawButtons(p, 110, 70, 100);
  }
  if (screen === "over") {
    const win = players.find((q) => q.winner);
    koCover();
    panel(p, 80, 40, 160, 104, win ? win.col : C.panelEdge);
    p.text(win ? `${win.ch.name} WINS!` : "DRAW", 160, 46, win ? win.col : WHITE, { font: "big", scale: 2, align: "center", outline: INK });
    p.text(win ? `${win.tag} TAKES IT` : "", 160, 62, C.dim, { align: "center" });
    p.text(`${a.score} - ${b.score}`, 160, LH() > 7 ? 72 : 70, WHITE, { font: "big", align: "center" });
    if (stateT > 1.2) drawButtons(p, 110, 82, 100, 15);
  }
  drawFxList(fxHud, hud, "front");
}

function drawFxList(list, frame, layer) { fxDraw = true; try { for (const f of list) f.draw(frame, layer); } finally { fxDraw = false; } }
function render() {
  koQ = [];
  drawWorld();
  drawHud();
  composite(world, worldImg.data, 0xff000000);
  composite(hud, hudImg.data, null);
  worldCtx.putImageData(worldImg, 0, 0);
  hudCtx.putImageData(hudImg, 0, 0);
  const sw = W / cam.z, sh = H / cam.z;
  const sx = clamp(cam.fx - sw / 2, 0, W - sw) + cam.ox, sy = clamp(cam.fy - sh / 2, 0, H - sh) + cam.oy;
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W * S, H * S);
  ctx.drawImage(worldBuf, sx, sy, sw, sh, 0, 0, W * S, H * S);
  if (koQ.length) drawKo(koQ.filter((t) => !t.hud), sx, sy, cam.z);
  ctx.drawImage(hudBuf, 0, 0, W * S, H * S);
  if (koQ.length) drawKo(koQ.filter((t) => t.hud), 0, 0, 1);
}

buildCourt();
toMenu();
window.hoops = {
  get players() { return players; }, get ball() { return ball; }, get phase() { return phase; }, get screen() { return screen; },
  get chaos() { return chaos; }, get freeze() { return !!(cutin || chaosIntro); },
  set clock(v) { clock = v; }, setPossession, step, startGame, startChaos, beginChaos, setScreen, endGame, render, startSelect, trySpecial, updateFreeze,
  set chosen(v) { chosen = v; },
  // a debug sheet of every baller, big: hoops.sheet(k, pose)
  set hold(v) { hold = v; }, stealOpen, committed, isSet, get tut() { return tut; }, get settings() { return settings; }, tick(dt = 1 / 60) { if (!updateFreeze(dt)) step(dt); menuInput(dt); pressed.clear(); }, passiveFx, hitFx, pop,
  sheet(k = 3, pose = "idle") {
    hold = true;
    clearFrame(hud); const p = painterFor(hud); p.place(0, 0); p.rect(0, 0, W, H, hex("#2a2440"));
    CHARS.forEach((ch, i) => drawPlayer(p, dummy(ch, 1), { x: 27 + i * 53, y: 150, k, pose }));
    composite(hud, hudImg.data, 0xff000000); hudCtx.putImageData(hudImg, 0, 0); ctx.drawImage(hudBuf, 0, 0, W * S, H * S);
  },
};
let last = performance.now(), hold = false;
function loop(now) {
  if (hold) { last = now; requestAnimationFrame(loop); return; }   // debug: the test drives the frames
  // skip a display frame when it comes sooner than the cap: 60 fps for play, 30 for menus and pauses
  const cap = screen === "game" && !document.hidden ? 60 : 30;
  if (now - last < 1000 / cap - 3) { requestAnimationFrame(loop); return; }
  const real = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  let dt = real;
  if (hitstop > 0) { hitstop -= real; dt = 0; }
  else if (slowmo > 0) { slowmo -= real; dt *= 0.3; }
  if (screen !== "paused" && !(screen === "settings" && settingsBack === "paused") && !updateFreeze(real)) step(dt);
  const inMenu = screen !== "game";
  if (inMenu !== root.classList.contains("menu")) root.classList.toggle("menu", inMenu);   // the touch pad fades outside a game
  menuInput(real);
  updateCamera(real);
  updateAmbience();
  pressed.clear();
  if (!hold) render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
