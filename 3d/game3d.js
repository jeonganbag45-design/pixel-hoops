// Pixel Hoops 3D: a test of the game in 3D. Same 1-on-1 rules as the 2D game (timing shots, pump fakes, steal windows,
// ankle breakers, dunks, blocks), on a full court you can move around in depth. Blocky ballers, rendered at a low
// resolution and scaled up with hard pixels so it keeps the pixel look.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// ---------- words ----------
const LANG = localStorage.getItem("hoops.lang") === "ko" ? "ko" : "en";
const KO = {
  PERFECT: "퍼펙트!", GOOD: "굿", EARLY: "빠름", LATE: "늦음", "STEAL!": "스틸!", WHIFF: "허공", "BLOCK!": "블락!", "ANKLES!": "발목!",
  "SLAM!": "덩크!", "3PT!": "3점!", "NICE!": "좋아요!", "SWISH!": "스위시!", FAKE: "페이크", "BIT!": "속았다!", "GO!": "지금!", SKY: "날았다!",
  "DENIED!": "거절!", WALL: "철벽", "STRIPPED!": "털렸다!", "GET UP!": "연타로 일어나!", SHOOT: "슛", STEAL: "스틸", DUNK: "덩크", JUMP: "점프", DASH: "대시",
  "OVERTIME": "연장전", "NEXT BASKET WINS": "다음 골이 결승골", WINS: "승리!", "PLAY AGAIN": "한 판 더", "BACK TO 2D": "2D로 돌아가기", DRAW: "무승부",
  "3D TEST": "3D 테스트", "SO CLOSE": "아깝다!", CONTEST: "견제!", "AIRBALL": "에어볼",
  HELP: "WASD 이동   SPACE 점프   F 슛/스틸 (꾹 누르고 꼭대기에서 떼기, 짧게 톡 = 페이크)   SHIFT 대시 (림 쪽 대시 + F = 덩크)",
};
const T = (s) => (LANG === "ko" ? KO[s] ?? s : s);

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#0b0914"); scene.fog = new THREE.Fog("#0b0914", 34, 70);
const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 140);
const LOW_H = 270;                                     // the internal picture is 270 pixels tall, whatever the screen
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(Math.round((LOW_H * w) / h), LOW_H, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();

scene.add(new THREE.HemisphereLight("#c4bcff", "#3a2418", 1.1));
const sun = new THREE.DirectionalLight("#fff0d8", 1.7);
sun.position.set(-6, 20, 12); sun.castShadow = true; sun.shadow.mapSize.set(512, 512);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 10, bottom: -10, near: 1, far: 60 });
scene.add(sun);
const mat = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o });

// ---------- the court ----------
const HALF_L = 14, HALF_W = 7.5, RIM_X = 12.6, RIM_Y = 3.05, THREE_R = 6.75, BR = 0.15;
const G = 18, BALL_G = 12;
const crowd = {}, nets = [];
(function buildCourt() {
  const px = 20, cv = document.createElement("canvas"); cv.width = HALF_L * 2 * px; cv.height = HALF_W * 2 * px;
  const g = cv.getContext("2d"), X = (x) => (x + HALF_L) * px, Z = (z) => (z + HALF_W) * px;
  const planks = ["#c47e44", "#b8743a", "#cc8a4e", "#b06c34"];
  for (let y = 0; y < cv.height; y += 6) { g.fillStyle = planks[(y / 6) % 4]; g.fillRect(0, y, cv.width, 6); }
  g.fillStyle = "#9a5c2a"; for (let y = 0; y < cv.height; y += 6) for (let x = ((y / 6) * 37) % 90; x < cv.width; x += 90) g.fillRect(x, y, 1, 6);
  g.strokeStyle = "#f2ead8"; g.lineWidth = 2;
  g.strokeRect(2, 2, cv.width - 4, cv.height - 4);
  g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), cv.height); g.stroke();
  g.beginPath(); g.arc(X(0), Z(0), 1.8 * px, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#7a2a5a"; g.beginPath(); g.arc(X(0), Z(0), 1.7 * px, 0, Math.PI * 2); g.fill();
  for (const s of [-1, 1]) {
    const base = s * HALF_L, ft = s * (HALF_L - 5.8);
    g.fillStyle = "rgba(138,47,92,.75)"; g.fillRect(Math.min(X(base), X(ft)), Z(-2.45), Math.abs(X(base) - X(ft)), 4.9 * px);
    g.strokeRect(Math.min(X(base), X(ft)), Z(-2.45), Math.abs(X(base) - X(ft)), 4.9 * px);
    g.beginPath(); g.arc(X(ft), Z(0), 1.8 * px, 0, Math.PI * 2); g.stroke();
    // the three point line: straight in the corners, an arc around the rim
    const cz = 6.6, a = Math.asin(cz / THREE_R), rx = s * RIM_X, dx = Math.cos(a) * THREE_R;
    g.beginPath(); g.moveTo(X(base), Z(-cz)); g.lineTo(X(rx - s * dx), Z(-cz));
    if (s > 0) g.arc(X(rx), Z(0), THREE_R * px, Math.PI + a, Math.PI - a, true); else g.arc(X(rx), Z(0), THREE_R * px, -a, a, false);
    g.lineTo(X(base), Z(cz)); g.stroke();
  }
  g.fillStyle = "#ffe03c"; g.font = "bold 28px monospace"; g.textAlign = "center"; g.fillText("PIXEL HOOPS", X(0), Z(0) + 10);
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF_L * 2, HALF_W * 2), new THREE.MeshLambertMaterial({ map: tex }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), mat("#1a1424")); apron.rotation.x = -Math.PI / 2; apron.position.y = -0.01; apron.receiveShadow = true; scene.add(apron);
  // the stands behind, stepping up, and the fans on them
  const rows = 9, perRow = 64, fans = rows * perRow;
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.5, 0.3), mat("#ffffff"), fans);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat("#ffffff"), fans);
  const m = new THREE.Matrix4(), col = new THREE.Color(), shirts = ["#3a3550", "#4a4258", "#5a3a4a", "#2f3a5a", "#ff4a3a", "#5cc4ff", "#ffe03c", "#2a4a3a"], skins = ["#f0c8a8", "#d79a6a", "#8d5a3b", "#6b4a3a"];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const z = -10 - r * 0.9, y = 0.3 + r * 0.6;
    const step = new THREE.Mesh(new THREE.BoxGeometry(40, 0.6, 0.9), mat(r % 2 ? "#1c1729" : "#221b34")); step.position.set(0, y - 0.3, z); scene.add(step);
    for (let i = 0; i < perRow; i++, n++) {
      const x = -17.5 + i * 0.55 + (r % 2) * 0.27, empty = Math.random() < 0.12;
      m.makeTranslation(x, empty ? -10 : y + 0.25, z); bodies.setMatrixAt(n, m); heads.setMatrixAt(n, m.makeTranslation(x, empty ? -10 : y + 0.68, z));
      bodies.setColorAt(n, col.set(shirts[Math.floor(Math.random() * shirts.length)])); heads.setColorAt(n, col.set(skins[Math.floor(Math.random() * skins.length)]));
    }
  }
  scene.add(bodies, heads);
  crowd.bodies = bodies; crowd.heads = heads; crowd.n = fans;
  // the lights up top
  for (const x of [-10, -3.5, 3.5, 10]) { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.6), new THREE.MeshBasicMaterial({ color: "#fff4d8" })); l.position.set(x, 13, -3); scene.add(l); }
  // the hoops: stanchion, arm, glass, rim, net
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1.4), mat("#3a3550")); pad.position.set(s * 15.4, 0.5, 0); pad.castShadow = true; scene.add(pad);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), mat("#6a6080")); pole.position.set(s * 15.2, 2.3, 0); pole.castShadow = true; scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 0.16), mat("#6a6080")); arm.position.set(s * 14.1, 3.7, 0); scene.add(arm);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 1.8), mat("#dcecff", { transparent: true, opacity: 0.8 })); board.position.set(s * 13.0, 3.5, 0); scene.add(board);
    const sq = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.6), mat("#ff6a2a", { transparent: true, opacity: 0.6 })); sq.position.set(s * 13.0, 3.3, 0); scene.add(sq);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.03, 6, 16), mat("#ff6a2a")); rim.rotation.x = Math.PI / 2; rim.position.set(s * RIM_X, RIM_Y, 0); scene.add(rim);
    const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.14, 0.45, 10, 2, true), new THREE.MeshBasicMaterial({ color: "#e6e1ee", wireframe: true })); net.position.set(s * RIM_X, RIM_Y - 0.24, 0); scene.add(net);
    nets[s > 0 ? 1 : 0] = net;
  }
})();

// ---------- the ballers ----------
const CHARS = {
  BLAZE: { col: "#ff4a3a", dark: "#8a1a1a", skin: "#d79a6a", hair: "#ff9a2a", spd: 1.05, jmp: 1, shot: 1 },
  FROST: { col: "#5cc4ff", dark: "#1a4a7a", skin: "#f0c8a8", hair: "#e6fbff", spd: 0.95, jmp: 1, shot: 1.1 },
};
function makeBody(ch) {
  const root = new THREE.Group(), pose = new THREE.Group(); root.add(pose);
  const box = (w, h, d, c, x, y, z, parent = pose) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const legs = [-1, 1].map((s) => {
    const pv = new THREE.Group(); pv.position.set(0, 0.8, s * 0.13); pose.add(pv);
    box(0.24, 0.42, 0.22, ch.dark, 0, -0.2, 0, pv); box(0.18, 0.32, 0.18, ch.skin, 0, -0.55, 0, pv); box(0.32, 0.12, 0.22, "#f2ead8", 0.05, -0.76, 0, pv);
    return pv;
  });
  box(0.36, 0.62, 0.52, ch.col, 0, 1.12, 0);
  box(0.37, 0.12, 0.53, ch.dark, 0, 0.86, 0);
  box(0.52, 0.5, 0.5, ch.skin, 0, 1.7, 0);
  box(0.56, 0.16, 0.56, ch.hair, -0.02, 1.98, 0);
  box(0.04, 0.09, 0.07, "#14101f", 0.27, 1.74, -0.11); box(0.04, 0.09, 0.07, "#14101f", 0.27, 1.74, 0.11);
  const arms = [-1, 1].map((s) => { const pv = new THREE.Group(); pv.position.set(0, 1.38, s * 0.34); pose.add(pv); box(0.16, 0.58, 0.16, ch.skin, 0, -0.26, 0, pv); return pv; });
  scene.add(root);
  return { root, pose, legs, arms };
}
const NONE = { mx: 0, mz: 0, jump: false, shoot: false, shootHeld: false, dash: false };
function makePlayer(i, name) {
  const ch = CHARS[name];
  return { i, name, ch, body: makeBody(ch), dir: i === 0 ? 1 : -1, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, onGround: true, face: [1, 0],
    score: 0, shooting: false, shootT: 0, gather: 0, fakeT: 0, bitDone: false, dashT: 0, dashCd: 0, dashV: [1, 0], dashRolled: false, dunkWin: 0,
    stam: 1, fallen: 0, ankled: false, whiff: 0, cd: 0, stun: 0, landT: 0, dunk: null, hang: 0, walk: 0, ai: { t: 0 } };
}
const players = [makePlayer(0, "BLAZE"), makePlayer(1, "FROST")];
const other = (p) => players[1 - p.i];
const hoop = (p) => ({ x: p.dir * RIM_X, z: 0 });
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// the ball
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 10, 8), mat("#f08a2a")); ballMesh.castShadow = true; scene.add(ballMesh);
const ball = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, owner: null, live: false, shooter: null, made: false, t: 0, T: 1, pts: 2, resolved: false };
// the steal cue: a ring around the ball, turned to the camera
const ring = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.3, 20), new THREE.MeshBasicMaterial({ color: "#ffe03c", transparent: true, depthTest: false }));
ring.renderOrder = 5; scene.add(ring);

// ---------- sound ----------
let ac = null;
const audio = () => { try { if (!ac) ac = new AudioContext(); if (ac.state === "suspended") ac.resume(); } catch {} };
function beep(f, d = 0.08, type = "square", vol = 0.05, slide = 0, delay = 0) {
  if (!ac) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d = 0.2, vol = 0.08, freq = 1200) {
  if (!ac) return; const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f).connect(g).connect(ac.destination); s.start();
}
const sfx = {
  bounce: () => { beep(95, 0.08, "sine", 0.2, -35); noise(0.04, 0.06, 500); }, swish: () => noise(0.3, 0.2, 5200), rim: () => { beep(523, 0.3, "triangle", 0.06, -8); noise(0.05, 0.08, 4000); },
  whoosh: () => noise(0.12, 0.08, 1600), steal: () => { noise(0.08, 0.12, 2500); beep(200, 0.1, "sawtooth", 0.05, -120); }, crack: () => { noise(0.1, 0.2, 900); beep(80, 0.2, "square", 0.08, -40); },
  perfect: () => { beep(1046, 0.08, "square", 0.05); beep(1568, 0.14, "square", 0.05, 0, 0.06); }, block: () => { beep(120, 0.15, "square", 0.1, -60); noise(0.1, 0.15, 800); },
  cheer: () => noise(1.2, 0.18, 1100), whistle: () => { beep(2400, 0.3, "sine", 0.06); beep(2500, 0.3, "sine", 0.04); }, cue: () => { beep(1568, 0.05, "triangle", 0.06); beep(2093, 0.07, "triangle", 0.05, 0, 0.05); },
  dunk: () => { beep(70, 0.3, "sine", 0.25, -30); noise(0.2, 0.2, 400); },
};

// ---------- floating words ----------
const fxEl = document.getElementById("fx"), cueEl = document.getElementById("cue"), meterEl = document.getElementById("meter"), centerEl = document.getElementById("center");
const pops = [];
function pop(text, x, y, z, color = "#fff", big = false) {
  const el = document.createElement("div"); el.className = "pop" + (big ? " big" : ""); el.textContent = T(text); el.style.color = color; fxEl.appendChild(el);
  pops.push({ el, x, y, z, t: 0, life: big ? 1.2 : 0.9 });
}
const say = (p, text, color = "#fff", big = false) => pop(text, p.x, p.y + 2.6, p.z, color, big);
const v3 = new THREE.Vector3();
function toScreen(x, y, z) { v3.set(x, y, z).project(camera); return [(v3.x * 0.5 + 0.5) * innerWidth, (-v3.y * 0.5 + 0.5) * innerHeight]; }

// ---------- rules ----------
let phase = "countdown", stateT = 0, clock = 60, overtime = false, worldT = 0, hype = 0, lastScorer = null, slow = 0;
const committed = (d) => d.whiff > 0 || d.landT > 0 || d.dashT > 0 || (!d.onGround && !d.dunk);
function stealPhase(p, opp) {
  const cyc = opp.dashT > 0 ? 0.65 : 0.95, t = (worldT + opp.i * 0.37) % cyc, win = isTouch ? 0.36 : 0.3;
  const open = t >= cyc - win || t < 0.07, warn = !open && t >= cyc - win - 0.4 ? (t - (cyc - win - 0.4)) / 0.4 : 0;
  return { open, warn };
}
const inReach = (p, o) => flat(p, o) < 1.35 && Math.abs(p.y - o.y) < 1;
const stealOpen = (p, opp) => ball.owner === opp && !opp.shooting && !opp.dunk && opp.gather <= 0 && opp.fakeT <= 0 && opp.onGround && inReach(p, opp) && stealPhase(p, opp).open;
const goOpen = (a) => { const d = other(a); return ball.owner === a && a.onGround && !a.shooting && a.gather <= 0 && a.stam >= 0.4 && flat(a, d) < 2.6 && committed(d) && d.fallen <= 0; };
function contest(p, d) {
  const dist = flat(p, d); if (d.fallen > 0 || dist > 1.8) return 0;
  if (!d.onGround) return d.vy > -1 && dist < 1.3 ? 1 : 0.15;
  if (d.landT > 0 || d.whiff > 0) return 0.1;
  return dist < 1.3 ? 0.55 : 0.15;
}
function canDunk(p) {
  const h = hoop(p), d = Math.hypot(h.x - p.x, h.z - p.z), tow = ((h.x - p.x) * p.dashV[0] + (h.z - p.z) * p.dashV[1]) / (d || 1);
  return p.onGround && p.dunkWin > 0 && d < 4 && d > 0.8 && tow > 0.6;
}
function setPossession(i) {
  const off = players[i], def = other(off);
  for (const p of players) Object.assign(p, { y: 0, vx: 0, vz: 0, vy: 0, onGround: true, shooting: false, gather: 0, fakeT: 0, dashT: 0, fallen: 0, ankled: false, whiff: 0, stun: 0, dunk: null, hang: 0, landT: 0 });
  off.x = -off.dir * 4; off.z = 0; def.x = -off.dir * 1.2; def.z = 0;
  off.face = [off.dir, 0]; def.face = [-off.dir, 0];
  Object.assign(ball, { owner: off, live: false, shooter: null, made: false, resolved: true });
}
function startDash(p, dv) {
  p.dashT = 0.2; p.dunkWin = isTouch && p.i === 0 ? 0.55 : 0.35; p.dashV = dv; p.face = dv; p.dashRolled = ball.owner !== p;
  p.stam = Math.max(0, p.stam - 0.4); p.dashCd = 0.22; sfx.whoosh();
}
// dashing into the defender: past a defender who bit, it breaks his ankles (a stumble he can mash his way out of);
// into one who is set, you bounce off and may lose the ball
function dashContact(p) {
  const d = other(p);
  if (p.dashRolled || ball.owner !== p || d.fallen > 0 || flat(p, d) > 0.8) return;
  p.dashRolled = true;
  if (committed(d)) {
    d.fallen = 0.6; d.ankled = true; d.vy = Math.max(d.vy, 2); say(p, "ANKLES!", "#ffe03c", true); say(d, "GET UP!", "#c8c0dc");
    sfx.crack(); slow = 0.35; hype = 1;
  } else {
    p.dashT = 0; p.vx = -p.dashV[0] * 3; p.vz = -p.dashV[1] * 3; p.stun = 0.2; say(d, "WALL", "#c8c0dc");
    if (Math.random() < 0.5) { looseBall(p, -p.dashV[0] * 2, 3, -p.dashV[1] * 2); say(p, "STRIPPED!", "#ff3a4a"); }
  }
}
function looseBall(p, vx, vy, vz) { const [x, y, z] = heldPos(p); Object.assign(ball, { owner: null, live: false, shooter: null, x, y, z, vx, vy, vz }); }
function trySteal(p, opp) {
  p.cd = 0.7; p.face = norm(opp.x - p.x, opp.z - p.z);
  if (!stealOpen(p, opp)) { p.whiff = 0.45; say(p, "WHIFF", "#9088a4"); sfx.whoosh(); return; }
  const dx = p.x - opp.x, dz = p.z - opp.z, d = Math.hypot(dx, dz) || 1;
  looseBall(opp, (dx / d) * 2.5, 3, (dz / d) * 2.5); opp.stun = 0.45;
  say(p, "STEAL!", "#ffe03c", true); sfx.steal(); hype = Math.max(hype, 0.6);
}
const norm = (x, z) => { const d = Math.hypot(x, z) || 1; return [x / d, z / d]; };
function startShot(p) {
  p.shooting = true; p.shootT = 0; p.face = norm(hoop(p).x - p.x, hoop(p).z - p.z);
  if (p.onGround) { p.vy = 6.2 * p.ch.jmp; p.onGround = false; p.vx *= 0.3; p.vz *= 0.3; }
}
function release(p) {
  const h = hoop(p), d = Math.hypot(h.x - p.x, h.z - p.z), def = other(p);
  const q = Math.abs(p.vy) <= 0.9 ? "perfect" : Math.abs(p.vy) <= 2.4 ? "good" : p.vy > 0 ? "early" : "late";
  const ms = Math.round((p.shootT - (6.2 * p.ch.jmp) / G) * 1000), cont = contest(p, def);
  let k = d < 2 ? 0.75 : d <= THREE_R ? (0.62 - (d - 2) * 0.03) * p.ch.shot : (0.44 - (d - THREE_R) * 0.05) * p.ch.shot;
  k *= 1 - cont * 0.6; k *= { perfect: 1.45, good: 1, early: 0.35, late: 0.35 }[d < 2 && q !== "perfect" ? "good" : q];
  const made = Math.random() < clamp(k, 0.03, 0.97);
  const [sx, sy, sz] = heldPos(p), [ox, oz] = norm(sx - h.x, sz - h.z), miss = Math.random() < 0.6 ? 0.24 : -0.24;
  const tx = made ? h.x : h.x + ox * miss + rnd(-0.08, 0.08), tz = made ? h.z : h.z + oz * miss + rnd(-0.12, 0.12), ty = RIM_Y + 0.05;
  const Tt = 0.7 + d * 0.06;
  Object.assign(ball, { owner: null, live: true, shooter: p, made, t: 0, T: Tt, pts: d > THREE_R ? 3 : 2, resolved: false, x: sx, y: sy, z: sz,
    vx: (tx - sx) / Tt, vy: (ty - sy + 0.5 * BALL_G * Tt * Tt) / Tt, vz: (tz - sz) / Tt });
  sfx.whoosh();
  if (q === "perfect") { say(p, "PERFECT", "#5ad84a"); sfx.perfect(); } else if (q === "good") say(p, "GOOD", "#ffe03c"); else say(p, `${T(q === "early" ? "EARLY" : "LATE")} ${Math.abs(ms)}ms`, "#ff3a4a");
  if (cont >= 0.5) say(def, "CONTEST", "#ffe03c");
}
function startDunk(p) {
  const h = hoop(p); p.dunk = { t: 0, dur: 0.5, fx: p.x, fz: p.z, tx: h.x - p.dir * 0.3, tz: h.z, contested: false };
  p.onGround = false; p.dashT = 0; p.face = [p.dir, 0]; say(p, "SKY", "#ffe03c"); sfx.whoosh();
}
function updateDunk(p, dt) {
  const d = p.dunk, def = other(p); d.t += dt;
  const k = Math.min(1, d.t / d.dur);
  p.x = d.fx + (d.tx - d.fx) * k; p.z = d.fz + (d.tz - d.fz) * k; p.y = Math.sin((k * Math.PI) / 2) * 1.45;
  if (!def.onGround && flat(def, p) < 1.1 && def.y > 0.5) d.contested = true;
  if (k < 1) return;
  p.dunk = null;
  if (Math.random() < (d.contested ? 0.45 : 0.96)) {
    p.hang = 0.4; Object.assign(ball, { owner: null, live: false, shooter: null, x: hoop(p).x, y: RIM_Y - 0.1, z: 0, vx: 0, vy: -3, vz: 0 });
    sfx.dunk(); slow = 0.25; score(p, 2, "SLAM!");
  } else {
    looseBall(p, -p.dir * 3, 1, rnd(-1, 1)); p.fallen = 0.6; say(def, "DENIED!", "#ffe03c", true); sfx.block(); hype = 1;
  }
}
function score(p, pts, word) {
  p.score += pts; lastScorer = p; phase = "scored"; stateT = 0; hype = 1;
  const h = hoop(p); pop(word, h.x, RIM_Y + 1, h.z, "#ffe03c", true); pop("+" + pts, h.x, RIM_Y + 0.4, h.z, "#fff");
  sfx.swish(); sfx.cheer(); netT[p.dir > 0 ? 1 : 0] = 1;
}
const netT = [0, 0];

// ---------- the ball ----------
function heldPos(p) {
  const [fx, fz] = p.face, sx = -fz, sz = fx;
  if (p.dunk || p.hang > 0) return [p.x + fx * 0.25, p.y + 2.25, p.z + fz * 0.25];
  if (p.shooting || p.gather > 0) return [p.x + fx * 0.15, p.y + 2.15, p.z + fz * 0.15];
  if (p.fakeT > 0.25) return [p.x + fx * 0.12, p.y + 2.35, p.z + fz * 0.12];   // the fake: ball high over his head
  if (!p.onGround) return [p.x + fx * 0.35, p.y + 1.2, p.z + fz * 0.35];
  const ph = Math.abs(Math.sin(worldT * (p.dashT > 0 ? 16 : 9)));
  return [p.x + fx * 0.4 + sx * 0.2, 1.0 - ph * 0.85, p.z + fz * 0.4 + sz * 0.2];
}
let wasLow = false;
function updateBall(dt) {
  if (ball.owner) {
    [ball.x, ball.y, ball.z] = heldPos(ball.owner);
    const low = ball.y < 0.3; if (low && !wasLow) sfx.bounce(); wasLow = low; return;
  }
  ball.vy -= BALL_G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
  if (ball.live) {
    ball.t += dt;
    // a block: a defender in the air meets it on the way up
    const s = ball.shooter, d = s && other(s);
    if (d && ball.t < 0.35 && ball.vy > 0 && !d.onGround && flat(ball, d) < (isTouch && d.i === 0 ? 0.95 : 0.75) && ball.y > d.y + 1.2 && ball.y < d.y + 2.7) {
      ball.live = false; const [ox, oz] = norm(ball.x - d.x, ball.z - d.z); ball.vx = ox * 2 + d.face[0] * 3; ball.vz = oz * 2 + d.face[1] * 3; ball.vy = -1;
      say(d, "BLOCK!", "#ffe03c", true); sfx.block(); slow = 0.25; hype = 1; return;
    }
    if (ball.t >= ball.T && !ball.resolved) {
      ball.resolved = true; ball.live = false;
      const h = hoop(ball.shooter);
      if (ball.made) { Object.assign(ball, { x: h.x, z: h.z, vx: 0, vz: 0, vy: -2 }); score(ball.shooter, ball.pts, ball.pts === 3 ? "3PT!" : Math.random() < 0.5 ? "SWISH!" : "NICE!"); }
      else { const [ox, oz] = norm(ball.x - h.x + rnd(-0.1, 0.1), ball.z - h.z + rnd(-0.1, 0.1)); ball.vx = ox * 2.4 - ball.shooter.dir * 0.6; ball.vz = oz * 2.4; ball.vy = rnd(2.5, 4); sfx.rim(); say(ball.shooter, "SO CLOSE", "#9088a4"); }
    }
  }
  if (ball.y < BR) { ball.y = BR; if (ball.vy < -1.5) sfx.bounce(); ball.vy = Math.abs(ball.vy) < 0.8 ? 0 : -ball.vy * 0.62; ball.vx *= 0.85; ball.vz *= 0.85; }
  // the walls keep a loose ball where someone can reach it
  if (Math.abs(ball.x) > HALF_L - 0.3) { ball.x = Math.sign(ball.x) * (HALF_L - 0.3); ball.vx *= -0.5; }
  if (Math.abs(ball.z) > HALF_W - 0.3) { ball.z = Math.sign(ball.z) * (HALF_W - 0.3); ball.vz *= -0.5; }
  if (ball.live || phase !== "play") return;
  // a loose ball: whoever gets a hand on it (in the air too)
  for (const p of players) {
    if (p.fallen > 0 || p.stun > 0 || p.dunk || p.hang > 0) continue;
    if (flat(ball, p) < 0.6 && ball.y < p.y + 2.5 && ball.y > p.y - 0.1) { ball.owner = p; p.ai.plan = null; if (!p.onGround && ball.y > 1.6) say(p, "MINE", "#ffe03c"); break; }
  }
}

// ---------- a baller's frame ----------
function updatePlayer(p, c, dt) {
  const opp = other(p);
  for (const k of ["cd", "whiff", "dashCd", "landT", "dunkWin"]) p[k] -= dt;
  p.stam = Math.min(1, p.stam + dt * 0.3);
  if (p.hang > 0) { p.hang -= dt; return; }
  if (p.dunk) { updateDunk(p, dt); return; }
  if (p.fallen > 0) {
    if (p.ankled && (c.shoot || c.jump || c.dash || (p.i === 1 && Math.random() < dt * 4))) p.fallen -= 0.12;   // mash to get up
    p.fallen -= dt; c = NONE; if (p.fallen <= 0) p.ankled = false;
  } else if (p.stun > 0) { p.stun -= dt; c = NONE; }
  const has = ball.owner === p;
  let mx = c.mx, mz = c.mz; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  if (c.dash && p.dashCd <= 0 && p.onGround && !p.shooting && p.gather <= 0 && p.stam >= 0.4 && p.fallen <= 0) startDash(p, ml > 0.2 ? norm(mx, mz) : p.face);
  const sp = 5.2 * p.ch.spd * (has ? 0.92 : 1) * (p.whiff > 0 ? 0.35 : 1) * (p.i === 1 ? 0.93 : 1);
  if (p.dashT > 0) { p.dashT -= dt; p.vx = p.dashV[0] * 14 * p.ch.spd; p.vz = p.dashV[1] * 14 * p.ch.spd; dashContact(p); }
  else if (!p.shooting && p.gather <= 0 && p.fallen <= 0) {
    if (p.onGround) { p.vx = mx * sp; p.vz = mz * sp; } else { p.vx += (mx * sp - p.vx) * Math.min(1, dt * 3); p.vz += (mz * sp - p.vz) * Math.min(1, dt * 3); }
    if (ml > 0.2 && !(ball.owner === opp && p.i === 1)) p.face = norm(mx, mz);
  } else if (p.fallen > 0 && p.onGround) { p.vx *= 0.85; p.vz *= 0.85; }
  // a defender squares up to the ball handler
  if (ball.owner === opp && p.fallen <= 0 && p.dashT <= 0) p.face = norm(opp.x - p.x, opp.z - p.z);
  if (c.jump && p.onGround && !p.shooting && p.whiff <= 0 && p.fallen <= 0) { p.vy = 6.6 * p.ch.jmp; p.onGround = false; }
  if (c.shoot && p.fallen <= 0) {
    if (has && !p.shooting && p.gather <= 0) { if (canDunk(p)) startDunk(p); else if (p.onGround) p.gather = 0.13; else startShot(p); }
    else if (!has && p.cd <= 0 && ball.owner === opp) trySteal(p, opp);
  }
  if (p.gather > 0) {
    p.vx = p.vz = 0;
    if (!c.shootHeld || ball.owner !== p) { p.gather = 0; if (ball.owner === p) { p.fakeT = 0.4; p.bitDone = false; say(p, "FAKE", "#9088a4"); sfx.whoosh(); } }
    else if ((p.gather -= dt) <= 0) { p.gather = 0; startShot(p); }
  }
  if (p.fakeT > 0) {
    p.fakeT -= dt;
    if (!p.bitDone && !opp.onGround && flat(p, opp) < 2.2) { p.bitDone = true; say(opp, "BIT!", "#ffe03c", true); slow = 0.3; hype = 0.6; }
  }
  if (p.shooting) {
    p.shootT += dt;
    if (ball.owner === p && ((!c.shootHeld && p.shootT > 0.03) || p.vy < -4)) release(p);
    if (p.onGround && p.shootT > 0.1) { if (ball.owner === p) release(p); p.shooting = false; }
  }
  const wasAir = !p.onGround, fallV = p.vy;
  p.vy -= G * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt;
  if (p.y <= 0) { p.y = 0; p.vy = 0; p.onGround = true; if (wasAir && fallV < -4 && p.fallen <= 0) p.landT = 0.2; } else p.onGround = false;
  p.x = clamp(p.x, -HALF_L + 0.3, HALF_L - 0.3); p.z = clamp(p.z, -HALF_W + 0.3, HALF_W - 0.3);
}

// ---------- the CPU ----------
function cpuControl(me, dt) {
  const c = { ...NONE }, o = other(me), ai = me.ai; ai.t -= dt;
  const go = (tx, tz, dead = 0.25) => { const dx = tx - me.x, dz = tz - me.z, d = Math.hypot(dx, dz); if (d > dead) { c.mx = dx / d; c.mz = dz / d; } };
  if (me.shooting && ball.owner === me) { c.shootHeld = me.shootT < ai.releaseAt; return c; }
  if (me.gather > 0 && ball.owner === me) { c.shootHeld = !ai.faking; return c; }
  if (ai.jumpIn > 0 && (ai.jumpIn -= dt) <= 0) c.jump = true;
  if (ball.owner === me) {
    const h = hoop(me), d = Math.hypot(h.x - me.x, h.z - me.z), near = flat(me, o) < 1.5 && o.fallen <= 0;
    if (!ai.plan) { const r = Math.random(); ai.plan = r < 0.3 ? { kind: "three", at: rnd(7, 7.8) } : r < 0.62 ? { kind: "drive" } : { kind: "mid", at: rnd(3.5, 5.5) }; ai.lane = rnd(-3, 3); }
    const shoot = () => {
      if (near && me.fakeT <= 0 && Math.random() < 0.3) { ai.faking = true; c.shoot = c.shootHeld = true; return; }
      ai.faking = false; c.shoot = c.shootHeld = true; ai.releaseAt = (6.2 * me.ch.jmp) / G + gauss() * 0.08; ai.plan = null;
    };
    const toward = norm(h.x - me.x, h.z - me.z);
    if (committed(o) && flat(me, o) < 2.5 && me.dashCd <= 0 && me.stam >= 0.4 && o.fallen <= 0) { c.dash = true; [c.mx, c.mz] = toward; return c; }
    if (me.fakeT > 0 && o.onGround && me.fakeT < 0.15) { shoot(); return c; }
    if (ai.plan.kind === "drive") {
      go(h.x - me.dir * 1.2, ai.lane * 0.3);
      if (canDunk(me)) c.shoot = true;
      else if (d < 4.6 && d > 1.8 && me.dashCd <= 0 && me.stam >= 0.4) { c.dash = true; [c.mx, c.mz] = toward; }
      else if (d < 1.8 && me.onGround) shoot();
    } else if (d > ai.plan.at) go(h.x - me.dir * ai.plan.at * 0.9, ai.lane);
    else if (me.onGround && me.dashT <= 0) shoot();
  } else if (ball.owner === o) {
    const h = hoop(o);
    if (ai.t <= 0) { ai.t = rnd(0.08, 0.22); const [dx, dz] = norm(h.x - o.x, h.z - o.z); ai.tx = o.x + dx * 1.15; ai.tz = o.z + dz * 1.15; }
    go(ai.tx, ai.tz, 0.15);
    const close = flat(me, o) < 1.8;
    if (o.gather > 0 && !ai.saw) { ai.saw = true; if (close && me.onGround && Math.random() < 0.4) ai.jumpIn = rnd(0.01, 0.06); }
    if (o.shooting && !ai.decided) { ai.decided = true; if (close && me.onGround && ai.jumpIn <= 0 && Math.random() < 0.5) ai.jumpIn = rnd(0.02, 0.12); }
    if (!o.shooting) ai.decided = false; if (o.gather <= 0 && o.fakeT <= 0) ai.saw = false;
    if (me.cd <= 0 && stealOpen(me, o) && Math.random() < 0.1) c.shoot = true;
    else if (me.cd <= 0 && inReach(me, o) && Math.random() < dt * 0.35) c.shoot = true;
  } else {
    go(ball.x, ball.z, 0.1);
    if (flat(me, ball) < 0.8 && ball.y > 2.3 && ball.vy < 1 && me.onGround && Math.random() < 0.2) c.jump = true;
  }
  return c;
}

// ---------- input ----------
const keys = new Set(), pressed = new Set();
addEventListener("keydown", (e) => { audio(); if (!e.repeat) pressed.add(e.code); keys.add(e.code); if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault(); });
addEventListener("keyup", (e) => keys.delete(e.code));
const isTouch = matchMedia("(pointer: coarse)").matches;
const touch = { stick: null, held: new Set(), tap: new Set() };
if (isTouch) {
  document.getElementById("touch").style.display = "block";
  const stickEl = document.getElementById("stick"), knobEl = document.getElementById("knob");
  addEventListener("pointerdown", (e) => {
    audio();
    if (e.pointerType !== "touch" || e.target.classList.contains("b") || phase === "over") return;
    if (e.clientX < innerWidth * 0.45 && !touch.stick) { touch.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY }; }
  });
  addEventListener("pointermove", (e) => { const s = touch.stick; if (s && e.pointerId === s.id) { s.x = e.clientX; s.y = e.clientY; const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 50) { s.ox = s.x - (dx / d) * 50; s.oy = s.y - (dy / d) * 50; } } });
  const up = (e) => { if (touch.stick && e.pointerId === touch.stick.id) touch.stick = null; };
  addEventListener("pointerup", up); addEventListener("pointercancel", up);
  for (const [id, name] of [["bShoot", "shoot"], ["bJump", "jump"], ["bDash", "dash"]]) {
    const el = document.getElementById(id);
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); audio(); touch.held.add(name); touch.tap.add(name); el.classList.add("on"); });
    const off = () => { touch.held.delete(name); el.classList.remove("on"); };
    el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off);
  }
  setInterval(() => {
    const s = touch.stick; stickEl.style.display = knobEl.style.display = s ? "block" : "none";
    if (s) { stickEl.style.left = s.ox + "px"; stickEl.style.top = s.oy + "px"; knobEl.style.left = s.x + "px"; knobEl.style.top = s.y + "px"; }
  }, 16);
}
function humanControl() {
  const c = { ...NONE };
  c.mx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  c.mz = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  c.jump = pressed.has("Space") || pressed.has("KeyK"); c.dash = pressed.has("ShiftLeft") || pressed.has("ShiftRight") || pressed.has("KeyL");
  c.shoot = pressed.has("KeyF") || pressed.has("KeyJ"); c.shootHeld = keys.has("KeyF") || keys.has("KeyJ");
  const s = touch.stick;
  if (s) { const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 8) { c.mx = dx / 50; c.mz = dy / 50; } }
  if (touch.tap.has("jump")) c.jump = true; if (touch.tap.has("dash")) c.dash = true;
  if (touch.tap.has("shoot")) c.shoot = true; if (touch.held.has("shoot")) c.shootHeld = true;
  // on a phone, the shot button near the rim after a dash is the dunk (pressed for you when it becomes possible)
  if (isTouch && touch.held.has("shoot") && ball.owner === players[0] && canDunk(players[0])) c.shoot = true;
  touch.tap.clear();
  return c;
}

// ---------- the game ----------
function newGame() {
  for (const p of players) { p.score = 0; p.stam = 1; }
  clock = 60; overtime = false; phase = "countdown"; stateT = 0; lastScorer = null;
  setPossession(Math.random() < 0.5 ? 0 : 1);
  centerEl.innerHTML = "";
}
function endGame() {
  phase = "over"; sfx.whistle();
  const [a, b] = players, win = a.score === b.score ? null : a.score > b.score ? a : b;
  centerEl.innerHTML = `<div style="color:${win ? win.ch.col : "#fff"}">${win ? `${win.name} ${T("WINS")}` : T("DRAW")}</div><div>${a.score} - ${b.score}</div>
    <div style="display:flex;gap:12px"><button id="again">${T("PLAY AGAIN")}</button><a href="../">${T("BACK TO 2D")}</a></div>`;
  document.getElementById("again").onclick = () => { audio(); newGame(); };
}
document.getElementById("na").textContent = players[0].name; document.getElementById("na").style.color = players[0].ch.col;
document.getElementById("nb").textContent = players[1].name; document.getElementById("nb").style.color = players[1].ch.col;
document.getElementById("help").textContent = isTouch ? "" : LANG === "ko" ? KO.HELP : "WASD MOVE   SPACE JUMP   F SHOOT/STEAL (HOLD, LET GO AT THE TOP; TAP = FAKE)   SHIFT DASH (DASH AT THE RIM + F = DUNK)";

function step(dt) {
  worldT += dt; stateT += dt; hype = Math.max(0, hype - dt * 0.5);
  if (phase === "countdown") {
    const n = 3 - Math.floor(stateT / 0.6);
    centerEl.innerHTML = n > 0 ? `<div>${n}</div><small>${T("3D TEST")}</small>` : `<div style="color:#ffe03c">GO!</div>`;
    if (stateT > 2.2) { phase = "play"; centerEl.innerHTML = ""; sfx.whistle(); } else if (stateT < 1.8) return;
  }
  if (phase === "over") return;
  const ctrls = [phase === "play" ? (dbg.auto ? cpuControl(players[0], dt) : humanControl()) : NONE, phase === "play" ? cpuControl(players[1], dt) : NONE];
  players.forEach((p, i) => updatePlayer(p, ctrls[i], dt));
  // bodies don't pass through each other on the floor, except on a dash
  const [a, b] = players, d = flat(a, b);
  if (d < 0.62 && d > 0 && a.dashT <= 0 && b.dashT <= 0 && a.onGround && b.onGround && a.fallen <= 0 && b.fallen <= 0) {
    const [nx, nz] = norm(b.x - a.x, b.z - a.z), push = (0.62 - d) / 2; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
  }
  updateBall(dt);
  if (phase === "scored") { if (stateT > 1.6) { setPossession(1 - lastScorer.i); phase = "play"; } return; }
  if (phase !== "play") return;
  clock -= dt;
  if (clock <= 0) {
    clock = 0;
    if (!ball.live && !players.some((p) => p.dunk || p.shooting)) {
      if (a.score !== b.score) endGame();
      else if (!overtime) { overtime = true; pop("OVERTIME", 0, 4, 0, "#f53cd1", true); }
    }
  }
}

// ---------- drawing ----------
const camPos = new THREE.Vector3(0, 6.4, 16), camLook = new THREE.Vector3(0, 1.2, 0);
let cueWas = false;
function draw(dt) {
  for (const p of players) {
    const b = p.body, spd = Math.hypot(p.vx, p.vz);
    b.root.position.set(p.x, p.y, p.z); b.root.rotation.y = Math.atan2(-p.face[1], p.face[0]);
    p.walk += spd * dt;
    const sw = p.onGround ? Math.sin(p.walk * 2.4) * Math.min(1, spd / 4) * 0.9 : 0.4;
    b.legs[0].rotation.z = sw; b.legs[1].rotation.z = p.onGround ? -sw : -0.2;
    const up = p.shooting || p.gather > 0 || p.fakeT > 0.2 || p.dunk || p.hang > 0, block = !p.onGround && !up && ball.owner !== p;
    for (const [k, arm] of b.arms.entries()) arm.rotation.z = up || block ? 2.8 : p.whiff > 0 ? 1.5 : (k ? -sw : sw) * 0.8;
    b.pose.rotation.z = p.fallen > 0 ? 1.35 : p.whiff > 0 ? -0.35 : p.dashT > 0 ? -0.3 : 0;
    b.pose.position.y = p.fallen > 0 ? 0.25 : p.fakeT > 0.25 ? 0.08 : 0;
  }
  ballMesh.position.set(ball.x, ball.y, ball.z);
  for (const [k, n] of nets.entries()) { netT[k] = Math.max(0, netT[k] - dt * 2); n.scale.y = 1 + netT[k] * 0.6; n.position.y = RIM_Y - 0.24 - netT[k] * 0.12; }
  // the crowd jumps when it's loud
  if (crowd.bodies && hype > 0.3) {
    const m = new THREE.Matrix4(), q = new THREE.Vector3();
    for (let i = 0; i < crowd.n; i += 1) {
      crowd.bodies.getMatrixAt(i, m); q.setFromMatrixPosition(m); if (q.y < -5) continue;
      const r = Math.round((-q.z - 10) / 0.9), base = 0.3 + r * 0.6, jump = Math.abs(Math.sin(worldT * 8 + i)) * 0.25 * hype;
      m.makeTranslation(q.x, base + 0.25 + jump, q.z); crowd.bodies.setMatrixAt(i, m); m.makeTranslation(q.x, base + 0.68 + jump, q.z); crowd.heads.setMatrixAt(i, m);
    }
    crowd.bodies.instanceMatrix.needsUpdate = crowd.heads.instanceMatrix.needsUpdate = true;
  }
  // the camera: side-on like a broadcast, following the ball, leaning toward the action
  // (a shot in the air pulls it toward the rim; with the ball, it looks ahead to the hoop he's attacking)
  const me = players[0];
  const ahead = ball.live && ball.shooter ? hoop(ball.shooter).x * 0.6 + ball.x * 0.4 : ball.x * 0.8 + (ball.owner ? ball.owner.dir * 2.5 : 0);
  const fx = clamp(ahead, -10, 10);
  camPos.lerp(v3.set(fx, 6.6, 17 + Math.abs(ball.z) * 0.2), Math.min(1, dt * 3)); camLook.lerp(v3.set(fx, 1.3, ball.z * 0.25 - 1), Math.min(1, dt * 4));
  camera.position.copy(camPos); camera.lookAt(camLook);
  // cues for you: the steal window on the ball, GO! when the defender bit, the shot meter while you shoot
  const o = players[1];
  let cue = "", cueCol = "#ffe03c";
  ring.visible = false;
  if (phase === "play" && ball.owner === o && me.fallen <= 0) {
    const ph = stealPhase(me, o);
    if (stealOpen(me, o)) { cue = "STEAL!"; ring.visible = true; ring.scale.setScalar(1); ring.material.color.set("#ffe03c"); }
    else if (inReach(me, o) && ph.warn > 0) { ring.visible = true; ring.scale.setScalar(1 + (1 - ph.warn) * 2.2); ring.material.color.set(ph.warn > 0.6 ? "#ffe03c" : "#ffffff"); }
  }
  if (phase === "play" && goOpen(me)) cue = "GO!";
  if (me.fallen > 0 && me.ankled) { cue = "GET UP!"; cueCol = "#ff3a4a"; }
  if (ring.visible) { ring.position.set(ball.x, ball.y, ball.z); ring.lookAt(camera.position); }
  if (cue && cue !== "GET UP!" && !cueWas) sfx.cue(); cueWas = !!cue && cue !== "GET UP!";
  if (cue) { const [sx, sy] = toScreen(me.x, me.y + 3.1, me.z); cueEl.style.display = "block"; cueEl.style.left = sx + "px"; cueEl.style.top = sy + "px"; cueEl.textContent = T(cue); cueEl.style.color = cueCol; }
  else cueEl.style.display = "none";
  if (me.shooting && ball.owner === me) {
    const [sx, sy] = toScreen(me.x, me.y + 2.9, me.z); meterEl.style.display = "block"; meterEl.style.left = sx + "px"; meterEl.style.top = sy + "px";
    meterEl.querySelector("u").style.left = clamp(50 - (me.vy / (6.2 * me.ch.jmp)) * 50, 0, 100) + "%";
  } else meterEl.style.display = "none";
  // the floating words
  for (const f of pops) {
    f.t += dt; const [sx, sy] = toScreen(f.x, f.y + f.t * 0.9, f.z);
    f.el.style.left = sx + "px"; f.el.style.top = sy + "px"; f.el.style.opacity = Math.min(1, (f.life - f.t) * 3);
  }
  for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t >= pops[i].life) { pops[i].el.remove(); pops.splice(i, 1); }
  // the scoreboard
  document.getElementById("sa").textContent = players[0].score; document.getElementById("sb").textContent = players[1].score;
  const s = Math.ceil(clock); document.getElementById("clock").textContent = overtime ? "OT" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  // the touch buttons say what they do now
  if (isTouch) {
    const bs = document.getElementById("bShoot"), bd = document.getElementById("bDash");
    bs.textContent = T(ball.owner === me ? (canDunk(me) ? "DUNK" : "SHOOT") : "STEAL");
    bs.classList.toggle("gold", cue === "STEAL!"); bd.classList.toggle("gold", cue === "GO!"); bd.textContent = T(cue === "GO!" ? "GO!" : "DASH");
  }
  renderer.render(scene, camera);
}

const dbg = { auto: false, hold: false };   // tests: the CPU plays you too; hold freezes the loop
let last = performance.now();
function loop(now) {
  if (dbg.hold) { last = now; requestAnimationFrame(loop); return; }
  const real = Math.min(1 / 30, (now - last) / 1000);
  if (now - last < 1000 / 60 - 3) { requestAnimationFrame(loop); return; }
  last = now;
  let dt = real; if (slow > 0) { slow -= real; dt *= 0.35; }
  step(dt); pressed.clear();
  if (phase === "over" && (keys.has("KeyR") || keys.has("Enter"))) newGame();
  draw(real);
  requestAnimationFrame(loop);
}
newGame();
requestAnimationFrame(loop);
window.hoops3d = { players, ball, get phase() { return phase; }, step, draw, cpuControl, newGame, dbg };
