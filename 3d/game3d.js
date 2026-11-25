// Pixel Hoops 3D. The 1-on-1 game on a full court you can move around in every direction: timing shots, pump fakes,
// steal windows, ankle breakers, dunks, blocks. Blocky outlined ballers rendered at a low resolution and scaled up with
// hard pixels, so it keeps the pixel look. Characters live in models.js, effects in fx.js.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
import { CHARS, makeBaller, animate, mat } from "./models.js";
import { createFx } from "./fx.js";

// ---------- words ----------
const LANG = localStorage.getItem("hoops.lang") === "ko" ? "ko" : "en";
const KO = {
  PERFECT: "퍼펙트!", GOOD: "굿", EARLY: "빠름", LATE: "늦음", "STEAL!": "스틸!", WHIFF: "허공", "BLOCK!": "블락!", "ANKLES!": "발목!",
  "SLAM!": "덩크!", "3PT!": "3점!", "NICE!": "좋아요!", "SWISH!": "스위시!", FAKE: "페이크", "BIT!": "속았다!", "GO!": "지금!", SKY: "날았다!",
  "DENIED!": "거절!", WALL: "철벽", "STRIPPED!": "털렸다!", "GET UP!": "연타로 일어나!", SHOOT: "슛", STEAL: "스틸", DUNK: "덩크", JUMP: "점프", DASH: "대시",
  OVERTIME: "연장전", WINS: "승리!", REMATCH: "한 판 더", "CHANGE BALLERS": "선수 바꾸기", "BACK TO 2D": "2D로", DRAW: "무승부",
  "SO CLOSE": "아깝다!", CONTEST: "견제!", MINE: "내 꺼!", "GLASS!!": "백보드 박살!!", "CHOOSE YOUR BALLER": "선수 선택", PLAY: "시작",
  "THE HOTHEAD": "열혈 슈터", "COLD BLOODED": "냉정한 저격수", "SPEED DEMON": "번개 발", "THE BRICK WALL": "인간 장벽", "THE PICKPOCKET": "소매치기 장인", "OLD BUT GOLD": "왕년의 전설",
  SPD: "속도", JMP: "점프", SHOT: "슛", "3PT": "3점", DEF: "수비", "VS CPU": "CPU와 대결",
  PICK: "← → 고르기   F / ENTER 결정",
  HELP: "우클릭/WASD 이동  SPACE 슛·스틸(꾹→꼭대기에서 떼기, 톡=페이크)  SHIFT 대시  E 점프  Q 크로스오버  R 스핀  F 스텝백  C(꾹) 공 보호  X 스킬  V 시점",
  VIEW: "시점", SIDE: "옆", HIGH: "위", BEHIND: "뒤",
  CROSS: "크로스!", "SPIN!": "스핀!", "STEP BACK": "스텝백!", PASSIVE: "패시브", SKILL: "스킬", MOVE: "기술", "SKILL READY": "스킬 준비!",
  "GET AWAY!": "피해!", "JUMP!": "점프!", "DASH!": "대시!", DODGED: "피했다!", "JUMPED IT": "점프로 회피", FIZZLED: "불발", "GOT IT ALREADY": "이미 내 공",
  "INFERNO!": "인페르노!", "FROZEN!": "꽁꽁!", "THUNDER STEP!": "번개 이동!", "EARTHQUAKE!": "지진이다!", "BLACK HOLE!": "블랙홀!", "TIME OUT!": "타임아웃!", "DENTURES!": "틀니 발사!", "CHOMP!": "콱!", "ZAPPED!": "찌릿!",
  "AWAKENED!": "각성!", "HOT HAND": "손이 뜨겁다", "AWAKENS AFTER 2 MAKES": "2골 연속이면 각성", INFERNO: "인페르노", "AWAKEN 10S + KNOCKBACK": "10초 각성 + 날려버림",
  "ICE VEINS": "강철 멘탈", "BIGGER PERFECT ZONE": "퍼펙트 판정 넓음", "DEEP FREEZE": "꽁꽁", "ICE SPIKES FREEZE HIM": "얼음 가시로 얼려버림",
  "QUICK FEET": "날쌘 발", "DASHES COST HALF STAMINA": "대시 스태미나 절반", "THUNDER STEP": "번개 이동", "WARP TO RIM AND DUNK": "림으로 순간이동 덩크",
  "ROCK SOLID": "통곡의 벽", "DRIVES BOUNCE OFF HIM": "발목 무적, 돌파는 튕겨냄", EARTHQUAKE: "지진", "TWO QUAKES. JUMP BOTH!": "땅 쾅쾅! 두 번 다 피해라",
  "STICKY HANDS": "끈끈이 손", "STEALS WORK MORE OFTEN": "스틸이 잘 들어감", "BLACK HOLE": "블랙홀", "SUCKS THE BALL IN": "공을 강제 소환",
  EXPERIENCE: "짬바", "SP FILLS 50% FASTER": "SP 1.5배 빨리 참", "TIME OUT": "타임아웃", "TIMESTOP GRANNY SHOT": "시간 정지 후 언더슛",
};
const T = (s) => (LANG === "ko" ? KO[s] ?? s : s);
const HELP_EN = "RCLICK/WASD MOVE  SPACE SHOOT/STEAL (HOLD, LET GO AT THE TOP; TAP = FAKE)  SHIFT DASH  E JUMP  Q CROSSOVER  R SPIN  F STEPBACK  HOLD C PROTECT  X SKILL  V VIEW";

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#0b0914"); scene.fog = new THREE.Fog("#0b0914", 34, 70);
const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 140);
const LOW_H = 270;                                     // the internal picture is 270 pixels tall, whatever the screen
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(Math.round((LOW_H * w) / h), LOW_H, false); camera.aspect = stageCam.aspect = w / h; camera.updateProjectionMatrix(); stageCam.updateProjectionMatrix();
  // the stage camera backs off on a narrow screen so all six fit
  const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) * (w / h)), dist = Math.max(7.4, 4.7 / Math.tan(half));
  stageCam.position.set(0, 1.5 + (dist - 7.4) * 0.12, dist); stageCam.lookAt(0, 0.75, 0);
}
const stage = new THREE.Scene(), stageCam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 60);
addEventListener("resize", resize);

scene.add(new THREE.HemisphereLight("#c4bcff", "#3a2418", 1.1));
const sun = new THREE.DirectionalLight("#fff0d8", 1.7);
sun.position.set(-6, 20, 12); sun.castShadow = true; sun.shadow.mapSize.set(1024, 512);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 10, bottom: -10, near: 1, far: 60 });
scene.add(sun);
const fx = createFx(scene);

// ---------- the arena ----------
const HALF_L = 14, HALF_W = 7.5, RIM_X = 12.6, RIM_Y = 3.05, THREE_R = 6.75, BR = 0.15;
const G = 18, BALL_G = 12;
const crowd = {}, nets = [], rims = [], boards = [];
let jumbo = null;
(function buildArena() {
  const px = 20, cv = document.createElement("canvas"); cv.width = HALF_L * 2 * px; cv.height = HALF_W * 2 * px;
  const g = cv.getContext("2d"), X = (x) => (x + HALF_L) * px, Z = (z) => (z + HALF_W) * px;
  const planks = ["#c47e44", "#b8743a", "#cc8a4e", "#b06c34"];
  for (let y = 0; y < cv.height; y += 6) { g.fillStyle = planks[(y / 6) % 4]; g.fillRect(0, y, cv.width, 6); }
  g.fillStyle = "#9a5c2a"; for (let y = 0; y < cv.height; y += 6) for (let x = ((y / 6) * 37) % 90; x < cv.width; x += 90) g.fillRect(x, y, 1, 6);
  g.strokeStyle = "#f2ead8"; g.lineWidth = 2;
  g.strokeRect(2, 2, cv.width - 4, cv.height - 4);
  g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), cv.height); g.stroke();
  g.fillStyle = "#7a2a5a"; g.beginPath(); g.arc(X(0), Z(0), 1.8 * px, 0, Math.PI * 2); g.fill(); g.stroke();
  for (const s of [-1, 1]) {
    const base = s * HALF_L, ft = s * (HALF_L - 5.8);
    g.fillStyle = "rgba(138,47,92,.75)"; g.fillRect(Math.min(X(base), X(ft)), Z(-2.45), Math.abs(X(base) - X(ft)), 4.9 * px);
    g.strokeRect(Math.min(X(base), X(ft)), Z(-2.45), Math.abs(X(base) - X(ft)), 4.9 * px);
    g.beginPath(); g.arc(X(ft), Z(0), 1.8 * px, 0, Math.PI * 2); g.stroke();
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
  // courtside: an LED board along the far side, padded
  const ledCv = document.createElement("canvas"); ledCv.width = 256; ledCv.height = 8; const lg = ledCv.getContext("2d");
  lg.fillStyle = "#05040a"; lg.fillRect(0, 0, 256, 8); lg.fillStyle = "#f53cd1"; lg.font = "8px monospace"; lg.fillText("PIXEL HOOPS * 1 ON 1 STREETBALL * NO REFS NO RULES * ", 0, 7);
  const ledTex = new THREE.CanvasTexture(ledCv); ledTex.magFilter = ledTex.minFilter = THREE.NearestFilter; ledTex.wrapS = THREE.RepeatWrapping; ledTex.repeat.set(3, 1);
  const led = new THREE.Mesh(new THREE.BoxGeometry(36, 0.7, 0.3), [mat("#14101f"), mat("#14101f"), mat("#14101f"), mat("#14101f"), new THREE.MeshBasicMaterial({ map: ledTex }), mat("#14101f")]);
  led.position.set(0, 0.35, -8.6); scene.add(led); crowd.led = ledTex;
  // the stands behind, stepping up, and the fans on them
  const rows = 9, perRow = 64, fans = rows * perRow;
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.5, 0.3), mat("#ffffff"), fans);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat("#ffffff"), fans);
  const m = new THREE.Matrix4(), col = new THREE.Color(), shirts = ["#3a3550", "#4a4258", "#5a3a4a", "#2f3a5a", "#2a4a3a"], skins = ["#f0c8a8", "#d79a6a", "#8d5a3b", "#6b4a3a"];
  crowd.base = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    const z = -10 - r * 0.9, y = 0.3 + r * 0.6;
    const step = new THREE.Mesh(new THREE.BoxGeometry(40, 0.6, 0.9), mat(r % 2 ? "#1c1729" : "#221b34")); step.position.set(0, y - 0.3, z); scene.add(step);
    for (let i = 0; i < perRow; i++, n++) {
      const x = -17.5 + i * 0.55 + (r % 2) * 0.27, empty = Math.random() < 0.12;
      crowd.base.push([x, empty ? -20 : y, z, Math.random() < 0.55]);
      m.makeTranslation(x, empty ? -20 : y + 0.25, z); bodies.setMatrixAt(n, m); heads.setMatrixAt(n, m.makeTranslation(x, empty ? -20 : y + 0.68, z));
      bodies.setColorAt(n, col.set(shirts[Math.floor(Math.random() * shirts.length)])); heads.setColorAt(n, col.set(skins[Math.floor(Math.random() * skins.length)]));
    }
  }
  scene.add(bodies, heads);
  Object.assign(crowd, { bodies, heads, n: fans });
  // the jumbotron over center court, showing the score
  const jcv = document.createElement("canvas"); jcv.width = 64; jcv.height = 24;
  const jt = new THREE.CanvasTexture(jcv); jt.magFilter = jt.minFilter = THREE.NearestFilter; jt.colorSpace = THREE.SRGBColorSpace;
  const jb = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.7, 4.4), [new THREE.MeshBasicMaterial({ map: jt }), new THREE.MeshBasicMaterial({ map: jt }), mat("#14101f"), mat("#14101f"), new THREE.MeshBasicMaterial({ map: jt }), new THREE.MeshBasicMaterial({ map: jt })]);
  jb.position.set(0, 9.6, -1); scene.add(jb);
  for (const x of [-1.6, 1.6]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4, 0.05), mat("#3a3550")); c.position.set(x, 12.4, -1); scene.add(c); }
  jumbo = { cv: jcv, tex: jt, key: "" };
  // the lights up top, and their beams
  for (const x of [-10, -3.5, 3.5, 10]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.6), new THREE.MeshBasicMaterial({ color: "#fff4d8" })); l.position.set(x, 13, -3); scene.add(l);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3, 13, 10, 1, true), new THREE.MeshBasicMaterial({ color: "#fff2d6", transparent: true, opacity: 0.045, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.position.set(x * 0.8, 6.5, -1.5); scene.add(beam);
  }
  // the hoops: padded base, pole, arm, glass, rim, net
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1.4), mat("#3a3550")); pad.position.set(s * 15.4, 0.5, 0); pad.castShadow = true; scene.add(pad);
    const padTop = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.15, 1.42), mat("#f53cd1")); padTop.position.set(s * 15.4, 0.95, 0); scene.add(padTop);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 0.22), mat("#6a6080")); pole.position.set(s * 15.2, 2.3, 0); pole.castShadow = true; scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 0.16), mat("#6a6080")); arm.position.set(s * 14.1, 3.7, 0); scene.add(arm);
    const board = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.05, 1.8), mat("#dcecff", { transparent: true, opacity: 0.8 })); board.add(glass);
    const sq = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.45, 0.6), mat("#ff6a2a", { transparent: true, opacity: 0.6 })); sq.position.y = -0.2; board.add(sq);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 1.85), new THREE.MeshBasicMaterial({ color: "#0d0a14", wireframe: true })); board.add(frame);
    board.position.set(s * 13.0, 3.5, 0); scene.add(board); boards[s > 0 ? 1 : 0] = board;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.03, 6, 16), mat("#ff6a2a")); rim.rotation.x = Math.PI / 2; rim.position.set(s * RIM_X, RIM_Y, 0); scene.add(rim); rims[s > 0 ? 1 : 0] = { mesh: rim, wob: 0 };
    const net = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.14, 0.45, 10, 2, true), new THREE.MeshBasicMaterial({ color: "#e6e1ee", wireframe: true })); net.position.set(s * RIM_X, RIM_Y - 0.24, 0); scene.add(net);
    nets[s > 0 ? 1 : 0] = net;
  }
})();
function drawJumbo() {
  const [a, b] = players, s = Math.ceil(clock), key = `${a?.score}|${b?.score}|${s}|${overtime}`;
  if (!a || key === jumbo.key) return;
  jumbo.key = key; const g = jumbo.cv.getContext("2d");
  g.fillStyle = "#05040a"; g.fillRect(0, 0, 64, 24); g.font = "bold 10px monospace"; g.textAlign = "center";
  g.fillStyle = a.ch.col; g.fillText(String(a.score), 14, 14); g.fillStyle = b.ch.col; g.fillText(String(b.score), 50, 14);
  g.fillStyle = "#ffe03c"; g.font = "8px monospace"; g.fillText(overtime ? "OT" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`, 32, 21);
  g.fillStyle = "#f53cd1"; g.fillRect(0, 0, 64, 1); g.fillRect(0, 23, 64, 1);
  jumbo.tex.needsUpdate = true;
}

// ---------- the select stage: the six on a lit stage ----------
const stageFigs = [];
(function buildStage() {
  stage.background = new THREE.Color("#0b0914");
  stage.add(new THREE.HemisphereLight("#c4bcff", "#3a2418", 0.9));
  const key = new THREE.DirectionalLight("#fff0d8", 1.6); key.position.set(3, 8, 8); key.castShadow = true; key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 4, bottom: -2, near: 1, far: 30 }); stage.add(key);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.8, 0.3, 24), mat("#221b34")); floor.position.y = -0.15; floor.receiveShadow = true; stage.add(floor);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6.6, 0.06, 4, 48), new THREE.MeshBasicMaterial({ color: "#f53cd1" })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; stage.add(rim);
  CHARS.forEach((ch, i) => {
    const b = makeBaller(ch); b.root.position.set((i - 2.5) * 1.35, 0, 0); b.root.rotation.y = -Math.PI / 2; stage.add(b.root);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), new THREE.MeshBasicMaterial({ color: ch.col, transparent: true, opacity: 0.35 }));
    spot.rotation.x = -Math.PI / 2; spot.position.set(b.root.position.x, 0.02, 0); stage.add(spot);
    stageFigs.push({ b, spot, x: b.root.position.x });
  });
})();
const stageBall = new THREE.Mesh(new THREE.SphereGeometry(BR, 10, 8), mat("#f08a2a")); stageBall.castShadow = true; stage.add(stageBall);
resize();

// ---------- the ballers ----------
const NONE = { mx: 0, mz: 0, jump: false, shoot: false, shootHeld: false, dash: false, special: false, move: null, protect: false };
let players = [];
function makePlayer(i, ci) {
  const ch = CHARS[ci], body = makeBaller(ch); scene.add(body.root);
  return { i, name: ch.name, ch, body, dir: i === 0 ? 1 : -1, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, onGround: true, face: [1, 0],
    score: 0, shooting: false, shootT: 0, gather: 0, fakeT: 0, bitDone: false, dashT: 0, dashCd: 0, dashV: [1, 0], dashRolled: false, dunkWin: 0, ghostT: 0,
    hand: 1, crossT: 0, followT: 0, landA: 0, sp: 0.3, charge: null, quakeT: 0, frozen: 0, frozenKind: "", fire: false, fireT: 0, streak: 0, granny: false,
    moveT: 0, moveV: [0, 0], moveCd: 0, moveKind: "", spinT: 0, safeT: 0, openT: 0, protect: false, stam: 1, fallen: 0, ankled: false, whiff: 0, cd: 0, stun: 0, landT: 0, dunk: null, hang: 0, walk: 0, celebrate: 0, winner: false, loser: false, ai: { t: 0 } };
}
const other = (p) => players[1 - p.i];
const hoop = (p) => ({ x: p.dir * RIM_X, z: 0 });
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const norm = (x, z) => { const d = Math.hypot(x, z) || 1; return [x / d, z / d]; };

// the ball, and the steal cue: a ring around it, turned to the camera
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 10, 8), mat("#f08a2a")); ballMesh.castShadow = true; scene.add(ballMesh);
const ballInk = new THREE.Mesh(new THREE.SphereGeometry(BR + 0.025, 10, 8), new THREE.MeshBasicMaterial({ color: "#0d0a14", side: THREE.BackSide })); ballMesh.add(ballInk);
const ball = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, owner: null, live: false, shooter: null, made: false, t: 0, T: 1, pts: 2, resolved: false, quality: "" };
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
  dunk: () => { beep(70, 0.3, "sine", 0.25, -30); noise(0.2, 0.2, 400); }, glass: () => { for (let i = 0; i < 6; i++) beep(rnd(1800, 3600), 0.15, "triangle", 0.04, -300, i * 0.03); noise(0.4, 0.2, 5000); },
  click: () => beep(880, 0.04, "square", 0.04), lock: () => { beep(660, 0.08, "square", 0.05); beep(990, 0.12, "square", 0.05, 0, 0.08); },
  firework: () => { noise(0.3, 0.1, 3000); beep(rnd(300, 600), 0.2, "triangle", 0.03, 400); },
};

// ---------- floating words ----------
const fxEl = document.getElementById("fx"), cueEl = document.getElementById("cue"), meterEl = document.getElementById("meter"), centerEl = document.getElementById("center"), selEl = document.getElementById("sel");
const pops = [];
function pop(text, x, y, z, color = "#fff", big = false) {
  if (pops.some((f) => f.text === text && f.t < 0.35)) return;                    // never the same word stacked on itself
  if (pops.length > 8) { pops[0].el.remove(); pops.shift(); }
  const el = document.createElement("div"); el.className = "pop" + (big ? " big" : ""); el.textContent = T(text); el.style.color = color; fxEl.appendChild(el);
  pops.push({ el, text, x, y, z, t: 0, life: big ? 1.2 : 0.9 });
}
const say = (p, text, color = "#fff", big = false) => pop(text, p.x, p.y + 2.6, p.z, color, big);
const v3 = new THREE.Vector3();
function toScreen(x, y, z) { v3.set(x, y, z).project(camera); return [(v3.x * 0.5 + 0.5) * innerWidth, (-v3.y * 0.5 + 0.5) * innerHeight]; }

// ---------- rules ----------
let screen = "select", phase = "countdown", stateT = 0, clock = 60, overtime = false, worldT = 0, hype = 0, lastScorer = null;
let pickI = 0, cpuI = 1, locked = false, spinT = 0;
const committed = (d) => d.whiff > 0 || d.landT > 0 || d.dashT > 0 || (!d.onGround && !d.dunk);
function stealPhase(p, opp) {
  const cyc = opp.dashT > 0 ? 0.65 : 0.95, t = (worldT + opp.i * 0.37) % cyc;
  // SHADE's sticky hands open it wider; a ball handler protecting it low closes it down
  const win = ((isTouch && p.i === 0 ? 0.36 : 0.3) + (p.ch.def - 1) * 0.25 + (p.ch.name === "SHADE" ? 0.12 : 0)) * (opp.protect ? 0.5 : 1);
  const open = t >= cyc - win || t < 0.07, warn = !open && t >= cyc - win - 0.4 ? (t - (cyc - win - 0.4)) / 0.4 : 0;
  return { open, warn };
}
const inReach = (p, o) => flat(p, o) < 1.35 && Math.abs(p.y - o.y) < 1;
const stealOpen = (p, opp) => ball.owner === opp && !opp.shooting && !opp.dunk && opp.gather <= 0 && opp.fakeT <= 0 && opp.safeT <= 0 && opp.onGround && inReach(p, opp) && stealPhase(p, opp).open;
const DASH_COST = (p) => (p.ch.name === "VOLT" ? 0.2 : 0.4);                                  // VOLT's quick feet
const perfectZone = (p) => 0.9 * (p.ch.name === "FROST" ? 1.6 : 1);                            // FROST's ice veins
const gainSp = (p, v) => { p.sp = Math.min(1, p.sp + v * (p.ch.name === "GRAMPS" ? 1.5 : 1)); };   // GRAMPS's experience
const busy = (p) => p.fallen > 0 || p.frozen > 0 || p.stun > 0 || p.dunk || p.hang > 0;
const goOpen = (a) => { const d = other(a); return ball.owner === a && a.onGround && !a.shooting && a.gather <= 0 && !a.charge && a.stam >= DASH_COST(a) && flat(a, d) < 2.6 && committed(d) && d.fallen <= 0 && d.ch.name !== "TANK"; };
function contest(p, d) {
  const dist = flat(p, d); if (d.fallen > 0 || dist > 1.8) return 0;
  if (!d.onGround) return d.vy > -1 && dist < 1.3 ? 1 : 0.15;
  if (d.landT > 0 || d.whiff > 0) return 0.1;
  return dist < 1.3 ? 0.55 * d.ch.def : 0.15;
}
const busyShot = (p) => p.shooting || p.gather > 0 || p.charge || p.moveT > 0 || p.spinT > 0;
function canDunk(p) {
  const h = hoop(p), d = Math.hypot(h.x - p.x, h.z - p.z), tow = ((h.x - p.x) * p.dashV[0] + (h.z - p.z) * p.dashV[1]) / (d || 1);
  return p.onGround && p.dunkWin > 0 && d < 4 && d > 0.8 && tow > 0.6;
}
function setPossession(i) {
  const off = players[i], def = other(off);
  for (const p of players) Object.assign(p, { y: 0, vx: 0, vz: 0, vy: 0, onGround: true, shooting: false, gather: 0, fakeT: 0, dashT: 0, fallen: 0, ankled: false, whiff: 0, stun: 0, dunk: null, hang: 0, landT: 0, celebrate: 0,
    frozen: 0, moveT: 0, spinT: 0, granny: false, openT: 0 });
  ball.homing = null;
  off.x = -off.dir * 4; off.z = 0; def.x = -off.dir * 1.2; def.z = 0;
  off.face = [off.dir, 0]; def.face = [-off.dir, 0];
  Object.assign(ball, { owner: off, live: false, shooter: null, made: false, resolved: true });
  for (const b of boards) b.visible = true;                                     // a fresh backboard after the glass went
}
function startDash(p, dv) {
  p.dashT = 0.2; p.dunkWin = isTouch && p.i === 0 ? 0.55 : 0.35; p.dashV = dv; p.face = dv; p.dashRolled = ball.owner !== p;
  p.stam = Math.max(0, p.stam - DASH_COST(p)); p.dashCd = 0.22; sfx.whoosh(); fx.dust(p.x, p.z, 8);
}
// dashing into the defender: past a defender who bit, it breaks his ankles (a stumble he can mash his way out of);
// into one who is set, you bounce off and may lose the ball
function dashContact(p) {
  const d = other(p);
  if (p.dashRolled || ball.owner !== p || d.fallen > 0 || flat(p, d) > 0.8) return;
  p.dashRolled = true;
  if (committed(d) && d.ch.name !== "TANK") {
    d.fallen = 0.6; d.ankled = true; d.vy = Math.max(d.vy, 2); say(p, "ANKLES!", "#ffe03c", true); say(d, "GET UP!", "#c8c0dc");
    fx.ring(d.x, d.z, "#ffe03c", 2.2, 0.5); fx.ring(d.x, d.z, p.ch.col, 1.4, 0.35); fx.dust(d.x, d.z, 16); fx.burst(d.x, 1.6, d.z, 10, ["#ffe03c", "#ffffff"], 3, 0.6, { lift: 2 });
    fx.impact({ stop: 0.1, slow: 0.5, shake: 0.35, punch: 0.6 }); sfx.crack(); hype = 1;
  } else {
    p.dashT = 0; p.vx = -p.dashV[0] * 3; p.vz = -p.dashV[1] * 3; p.stun = 0.2; say(d, "WALL", "#c8c0dc");
    fx.flash((p.x + d.x) / 2, 1.2, (p.z + d.z) / 2, "#ffffff", 1, 0.12); fx.impact({ stop: 0.05, shake: 0.2 });
    if (d.ch.name === "TANK") { say(d, "ROCK SOLID", d.ch.col); fx.ring(d.x, d.z, d.ch.col, 1.8, 0.35); p.stun = 0.45; }
    if (Math.random() < (d.ch.name === "TANK" ? 0.75 : 0.5)) { looseBall(p, -p.dashV[0] * 2, 3, -p.dashV[1] * 2); say(p, "STRIPPED!", "#ff3a4a"); }
  }
}
function looseBall(p, vx, vy, vz) { const [x, y, z] = heldPos(p); Object.assign(ball, { owner: null, live: false, shooter: null, x, y, z, vx, vy, vz }); }
function trySteal(p, opp) {
  p.cd = 0.7; p.face = norm(opp.x - p.x, opp.z - p.z);
  if (!stealOpen(p, opp)) { p.whiff = p.ch.name === "SHADE" ? 0.2 : 0.45; say(p, "WHIFF", "#9088a4"); sfx.whoosh(); fx.burst(p.x + p.face[0] * 0.6, 0.9, p.z + p.face[1] * 0.6, 4, "#9088a4", 1.5, 0.3); return; }
  const dx = p.x - opp.x, dz = p.z - opp.z, d = Math.hypot(dx, dz) || 1, [bx, by, bz] = heldPos(opp);
  looseBall(opp, (dx / d) * 2.5, 3, (dz / d) * 2.5); opp.stun = 0.45;
  say(p, "STEAL!", "#ffe03c", true); sfx.steal(); hype = Math.max(hype, 0.6); gainSp(p, 0.15);
  if (p.ch.name === "SHADE") { fx.vortex(bx, by, bz, 0.5, 0.35); say(p, "STICKY HANDS", p.ch.col); }
  fx.flash(bx, by, bz, "#ffe03c", 1.4, 0.18); fx.halo(bx, by, bz, p.ch.col, 0.9, 0.3); fx.burst(bx, by, bz, 14, [p.ch.col, "#ffe03c", "#ffffff"], 3.5, 0.5);
  fx.impact({ stop: 0.07, shake: 0.2, punch: 0.3 });
}
function startShot(p) {
  p.shooting = true; p.shootT = 0; p.face = norm(hoop(p).x - p.x, hoop(p).z - p.z);
  if (p.onGround) { p.vy = 6.2 * p.ch.jmp; p.onGround = false; p.vx *= 0.3; p.vz *= 0.3; }
}
function release(p, forced = false) {
  const h = hoop(p), d = Math.hypot(h.x - p.x, h.z - p.z), def = other(p);
  const q = forced || Math.abs(p.vy) <= perfectZone(p) ? "perfect" : Math.abs(p.vy) <= 2.4 ? "good" : p.vy > 0 ? "early" : "late";
  const ms = Math.round((p.shootT - (6.2 * p.ch.jmp) / G) * 1000), cont = forced ? 0 : contest(p, def) * (p.openT > 0 ? 0.35 : 1);
  if (!forced && q === "perfect" && p.ch.name === "FROST" && Math.abs(p.vy) > 0.9) say(p, "ICE VEINS", p.ch.col);
  let k = d < 2 ? 0.75 : d <= THREE_R ? (0.62 - (d - 2) * 0.03) * p.ch.shot : (0.44 - (d - THREE_R) * 0.05) * p.ch.three;
  k *= 1 - cont * 0.6; k *= { perfect: 1.45, good: 1, early: 0.35, late: 0.35 }[d < 2 && q !== "perfect" ? "good" : q];
  if (p.fire) k *= 1.25;
  const made = Math.random() < (forced ? 0.92 : clamp(k, 0.03, 0.97));
  const [sx, sy, sz] = heldPos(p), [ox, oz] = norm(sx - h.x, sz - h.z), miss = Math.random() < 0.6 ? 0.24 : -0.24;
  const tx = made ? h.x : h.x + ox * miss + rnd(-0.08, 0.08), tz = made ? h.z : h.z + oz * miss + rnd(-0.12, 0.12), ty = RIM_Y + 0.05;
  const Tt = (0.7 + d * 0.06) * (forced ? 1.45 : 1);
  Object.assign(ball, { owner: null, live: true, shooter: p, made, t: 0, T: Tt, pts: d > THREE_R ? 3 : 2, resolved: false, x: sx, y: sy, z: sz, quality: q,
    vx: (tx - sx) / Tt, vy: (ty - sy + 0.5 * BALL_G * Tt * Tt) / Tt, vz: (tz - sz) / Tt });
  sfx.whoosh(); p.followT = 0.4; p.openT = 0;
  if (forced) return;
  if (q === "perfect") { say(p, "PERFECT", "#5ad84a"); sfx.perfect(); fx.flash(sx, sy, sz, "#5ad84a", 1.3, 0.2); fx.burst(sx, sy, sz, 10, ["#5ad84a", "#ffffff"], 2.5, 0.4, { floor: false, g: 2 }); fx.impact({ stop: 0.04 }); }
  else if (q === "good") say(p, "GOOD", "#ffe03c"); else say(p, `${T(q === "early" ? "EARLY" : "LATE")} ${Math.abs(ms)}ms`, "#ff3a4a");
  if (cont >= 0.5) say(def, "CONTEST", "#ffe03c");
}
function startDunk(p) {
  const h = hoop(p); p.dunk = { t: 0, dur: 0.5, fx: p.x, fz: p.z, tx: h.x - p.dir * 0.3, tz: h.z, contested: false };
  p.onGround = false; p.dashT = 0; p.face = [p.dir, 0]; say(p, "SKY", "#ffe03c"); sfx.whoosh(); fx.dust(p.x, p.z, 12); fx.ring(p.x, p.z, "#ffffff", 1.2, 0.3);
}
function updateDunk(p, dt) {
  const d = p.dunk, def = other(p); d.t += dt;
  const k = Math.min(1, d.t / d.dur);
  p.x = d.fx + (d.tx - d.fx) * k; p.z = d.fz + (d.tz - d.fz) * k; p.y = Math.sin((k * Math.PI) / 2) * 1.45;
  if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.05; fx.ghost(p.body.root, p.ch.col); }
  if (!def.onGround && flat(def, p) < 1.1 && def.y > 0.5) d.contested = true;
  if (k < 1) return;
  p.dunk = null;
  const h = hoop(p), side = p.dir > 0 ? 1 : 0;
  if (Math.random() < (d.contested ? 0.45 : 0.96)) {
    p.hang = 0.4; Object.assign(ball, { owner: null, live: false, shooter: null, x: h.x, y: RIM_Y - 0.1, z: 0, vx: 0, vy: -3, vz: 0 });
    rims[side].wob = 1.5;
    const glass = Math.random() < 0.12;
    fx.ring(h.x, 0, "#ffffff", 4, 0.5); fx.ring(h.x, 0, p.ch.col, 3, 0.4); fx.flash(h.x, RIM_Y, 0, "#ffffff", 3, 0.2);
    fx.burst(h.x, RIM_Y, 0, 20, [p.ch.col, "#ffe03c", "#ffffff"], 5, 0.7); fx.dust(h.x - p.dir * 0.5, 0, 14);
    if (glass) {
      boards[side].visible = false; sfx.glass(); fx.burst(p.dir * 13, 3.5, 0, 70, ["#c8e8ff", "#ffffff", "#8cc8f0"], 6, 1.5, { size: 0.1 });
      fx.impact({ stop: 0.3, slow: 0.8, shake: 0.8, punch: 1 });
    } else fx.impact({ stop: 0.18, slow: d.contested ? 0.5 : 0, shake: 0.55, punch: 0.8 });
    sfx.dunk(); score(p, 2, glass ? "GLASS!!" : "SLAM!");
  } else {
    looseBall(p, -p.dir * 3, 1, rnd(-1, 1)); p.fallen = 0.6; say(def, "DENIED!", "#ffe03c", true); sfx.block(); hype = 1;
    fx.flash(p.x, p.y + 2.2, p.z, "#ffffff", 2.2, 0.18); fx.burst(p.x, p.y + 2.2, p.z, 18, [def.ch.col, "#ffe03c"], 4, 0.5); fx.impact({ stop: 0.16, shake: 0.5, punch: 0.6 });
  }
}
function score(p, pts, word) {
  const o = other(p);
  p.score += pts; p.streak = lastScorer === p ? p.streak + 1 : 1; o.streak = 0; lastScorer = p; phase = "scored"; stateT = 0; hype = 1; p.celebrate = 1.5;
  gainSp(p, 0.2); gainSp(o, 0.25);
  if (o.fireT <= 0 && o.fire) { o.fire = false; }                                   // a basket puts the other one's fire out
  if (p.ch.name === "BLAZE" && p.streak >= 2 && !p.fire) awaken(p);
  const h = hoop(p); pop(word, h.x, RIM_Y + 1, h.z, "#ffe03c", true); pop("+" + pts, h.x, RIM_Y + 0.4, h.z, "#fff");
  sfx.swish(); sfx.cheer(); netT[p.dir > 0 ? 1 : 0] = 1;
  // fireworks over the hoop: one for a basket, three for a three or a dunk
  const n = pts >= 3 || word !== "NICE!" && word !== "SWISH!" ? 3 : 1;
  for (let i = 0; i < n; i++) later(0.15 + i * 0.25, () => { const x = h.x - p.dir * rnd(1, 4), y = rnd(6, 8.5), z = rnd(-3, -1); fx.burst(x, y, z, 30, [p.ch.col, "#ffe03c", "#ffffff"], 4, 1, { floor: false, g: 2, size: 0.1 }); fx.flash(x, y, z, p.ch.col, 2.5, 0.25); sfx.firework(); });
  if (!(ball.made === false)) fx.burst(h.x, RIM_Y - 0.4, h.z, 8, "#e6e1ee", 1.5, 0.4, { g: 4 });
}
const netT = [0, 0];
const timers = [];
const later = (t, fn) => timers.push({ t, fn });

// ---------- the ball ----------
function heldPos(p) {
  const [fx_, fz] = p.face, sx = -fz, sz = fx_;
  if (p.dunk || p.hang > 0) return [p.x + fx_ * 0.25, p.y + 2.25, p.z + fz * 0.25];
  if (p.shooting || p.gather > 0) return [p.x + fx_ * 0.15, p.y + 2.15, p.z + fz * 0.15];
  if (p.fakeT > 0.25) return [p.x + fx_ * 0.12, p.y + 2.35, p.z + fz * 0.12];   // the fake: ball high over his head
  if (!p.onGround) return [p.x + fx_ * 0.35 + sx * 0.25 * p.hand, p.y + 1.25, p.z + fz * 0.35 + sz * 0.25 * p.hand];
  // the dribble: down from the ball hand and back up into it; a crossover carries it low across the front
  if (p.crossT > 0) {
    const k = 1 - p.crossT / 0.18, side = (-p.hand + 2 * p.hand * k) * 0.32;
    return [p.x + fx_ * 0.42 + sx * side, 0.2 + Math.abs(Math.sin(k * Math.PI)) * 0.15, p.z + fz * 0.42 + sz * side];
  }
  const ph = dribbleLow(p);
  if (p.protect) return [p.x + fx_ * 0.2 + sx * 0.4 * p.hand, 0.55 - ph * 0.42, p.z + fz * 0.2 + sz * 0.4 * p.hand];   // low, tight, on the far side
  if (p.granny) return [p.x + fx_ * 0.3, 0.7, p.z + fz * 0.3];
  return [p.x + fx_ * 0.36 + sx * 0.32 * p.hand, 0.95 - ph * 0.8, p.z + fz * 0.36 + sz * 0.32 * p.hand];
}
const dribbleLow = (p) => Math.abs(Math.sin(worldT * (p.dashT > 0 || p.moveT > 0 ? 16 : p.protect ? 15 : 9) + p.i));   // 0 at the top of the bounce, 1 on the floor
// keep the ball on the side away from the defender: switch hands at the top of a bounce, with a crossover
function protectBall(p, dt) {
  p.crossT = Math.max(0, p.crossT - dt);
  if (ball.owner !== p || !p.onGround || p.shooting || p.gather > 0 || p.crossT > 0) return;
  const d = other(p), [fx_, fz] = p.face, lat = (d.x - p.x) * -fz + (d.z - p.z) * fx_;
  const want = flat(p, d) < 3 && Math.abs(lat) > 0.15 ? (lat > 0 ? -1 : 1) : p.hand;
  if (want !== p.hand && dribbleLow(p) < 0.3) { p.hand = want; p.crossT = 0.18; }
}
let wasLow = false;
function updateBall(dt) {
  if (ball.owner) {
    [ball.x, ball.y, ball.z] = heldPos(ball.owner);
    const low = ball.y < 0.3; if (low && !wasLow) sfx.bounce(); wasLow = low; return;
  }
  if (ball.homing) {
    // pulled by the black hole into SHADE's hands
    const p = ball.homing, tx = p.x + p.face[0] * 0.4, ty = p.y + 1.2, tz = p.z + p.face[1] * 0.4, dx = tx - ball.x, dy = ty - ball.y, dz = tz - ball.z, d = Math.hypot(dx, dy, dz);
    const sp = Math.min(14, d * 6); ball.x += (dx / (d || 1)) * sp * dt; ball.y += (dy / (d || 1)) * sp * dt; ball.z += (dz / (d || 1)) * sp * dt; ball.vx = ball.vy = ball.vz = 0;
    if (Math.random() < 0.7) fx.shard({ x: ball.x, y: ball.y, z: ball.z, g: 0, floor: false, life: 0.3, c: "#9a7cff", size: 0.08 });
    if (d < 0.35 || (ball.homeT -= dt) <= 0) { if (d < 1 && !busy(p)) ball.owner = p; ball.homing = null; }
    return;
  }
  ball.vy -= BALL_G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
  if (ball.live) {
    ball.t += dt;
    // the trail of a shot: green after a perfect release
    fx.shard({ x: ball.x, y: ball.y, z: ball.z, g: 0, floor: false, life: 0.25, size: 0.1, c: ball.quality === "perfect" ? "#5ad84a" : "#f08a2a" });
    const s = ball.shooter, d = s && other(s);
    // a block: a defender in the air meets it on the way up
    if (d && ball.t < 0.35 && ball.vy > 0 && !d.onGround && flat(ball, d) < (isTouch && d.i === 0 ? 0.95 : 0.75) && ball.y > d.y + 1.2 && ball.y < d.y + 2.7) {
      ball.live = false; ball.lastShooter = s; ball.noCatchT = 0.45; s.shooting = false; const [ox, oz] = norm(ball.x - d.x, ball.z - d.z); ball.vx = ox * 2 + d.face[0] * 3; ball.vz = oz * 2 + d.face[1] * 3; ball.vy = -1;
      say(d, "BLOCK!", "#ffe03c", true); sfx.block(); hype = 1; gainSp(d, 0.15);
      fx.flash(ball.x, ball.y, ball.z, "#ffffff", 2.4, 0.2); fx.halo(ball.x, ball.y, ball.z, d.ch.col, 1.4, 0.3); fx.burst(ball.x, ball.y, ball.z, 22, [d.ch.col, "#ffe03c", "#ffffff"], 4.5, 0.6);
      fx.impact({ stop: 0.12, slow: 0.3, shake: 0.45, punch: 0.6 }); return;
    }
    if (ball.t >= ball.T && !ball.resolved) {
      ball.resolved = true; ball.live = false;
      const h = hoop(ball.shooter);
      if (ball.made) { Object.assign(ball, { x: h.x, z: h.z, vx: 0, vz: 0, vy: -2 }); score(ball.shooter, ball.pts, ball.pts === 3 ? "3PT!" : Math.random() < 0.5 ? "SWISH!" : "NICE!"); }
      else {
        const [ox, oz] = norm(ball.x - h.x + rnd(-0.1, 0.1), ball.z - h.z + rnd(-0.1, 0.1)); ball.vx = ox * 2.4 - ball.shooter.dir * 0.6; ball.vz = oz * 2.4; ball.vy = rnd(2.5, 4);
        sfx.rim(); say(ball.shooter, "SO CLOSE", "#9088a4"); rims[ball.shooter.dir > 0 ? 1 : 0].wob = 0.6; fx.burst(ball.x, ball.y, ball.z, 5, "#ff6a2a", 1.5, 0.3);
      }
    }
  }
  if (ball.y < BR) { ball.y = BR; if (ball.vy < -1.5) { sfx.bounce(); fx.dust(ball.x, ball.z, 3); } ball.vy = Math.abs(ball.vy) < 0.8 ? 0 : -ball.vy * 0.62; ball.vx *= 0.85; ball.vz *= 0.85; }
  // the walls keep a loose ball where someone can reach it
  if (Math.abs(ball.x) > HALF_L - 0.3) { ball.x = Math.sign(ball.x) * (HALF_L - 0.3); ball.vx *= -0.5; }
  if (Math.abs(ball.z) > HALF_W - 0.3) { ball.z = Math.sign(ball.z) * (HALF_W - 0.3); ball.vz *= -0.5; }
  if (ball.live || phase !== "play") return;
  // a loose ball: whoever gets a hand on it (in the air too)
  // (the shooter can't grab his own blocked or rimmed shot for a moment, and a catch ends his shot: no shoot-block-catch
  // loop in one frame after another)
  ball.noCatchT = Math.max(0, (ball.noCatchT ?? 0) - dt);
  for (const p of players) {
    if (p.fallen > 0 || p.stun > 0 || p.dunk || p.hang > 0 || (ball.noCatchT > 0 && p === ball.lastShooter)) continue;
    if (flat(ball, p) < 0.6 && ball.y < p.y + 2.5 && ball.y > p.y - 0.1) {
      ball.owner = p; p.ai.plan = null; p.shooting = false; p.gather = 0; p.fakeT = 0;
      if (!p.onGround && ball.y > 1.6) { say(p, "MINE", "#ffe03c"); fx.flash(ball.x, ball.y, ball.z, "#ffffff", 1, 0.12); }
      break;
    }
  }
}

// ---------- dribble moves ----------
// Q crossover: the ball to the other hand and a jab that way; a defender leaning (or reaching) the old way goes down.
// R spin: a spin move toward the rim that rolls off a set defender, the ball shielded the whole way.
// F stepback: a hop back for room; the next shot is hardly contested. Hold C: dribble low and slow, the ball protected.
function dribbleMove(p, kind) {
  const d = other(p);
  if (ball.owner !== p || !p.onGround || busyShot(p) || p.moveCd > 0 || p.dashT > 0 || busy(p)) return;
  const cost = { cross: 0.12, spin: 0.3, step: 0.25 }[kind];
  if (p.stam < cost) { say(p, "WHIFF", "#9088a4"); return; }
  p.stam -= cost; p.moveCd = kind === "cross" ? 0.35 : 0.6; p.moveKind = kind;
  const [fx_, fz] = p.face, sx = -fz, sz = fx_, toHoop = norm(hoop(p).x - p.x, hoop(p).z - p.z);
  if (kind === "cross") {
    const oldHand = p.hand; p.hand = -p.hand; p.crossT = 0.18; p.safeT = 0.35; p.moveT = 0.18;
    p.moveV = [sx * p.hand * 6.5 + fx_ * 1.5, sz * p.hand * 6.5 + fz * 1.5];
    // the defender bit if he was reaching, or leaning toward the side the ball just left
    const lean = d.vx * sx * oldHand + d.vz * sz * oldHand, close = flat(p, d) < 1.9;
    const bit = close && d.fallen <= 0 && d.ch.name !== "TANK" && (d.whiff > 0 || lean > 1.5 || (d.i === 1 && Math.random() < 0.3));
    sfx.bounce(); fx.dust(p.x, p.z, 5);
    if (bit) {
      d.fallen = 0.45; d.ankled = true; say(p, "ANKLES!", "#ffe03c", true); fx.ring(d.x, d.z, "#ffe03c", 1.8, 0.4); fx.dust(d.x, d.z, 10);
      fx.impact({ stop: 0.07, slow: 0.35, shake: 0.25, punch: 0.4 }); sfx.crack(); gainSp(p, 0.1); hype = 1;
    } else say(p, "CROSS", "#ffffff");
  } else if (kind === "spin") {
    p.spinT = 0.38; p.safeT = 0.45; p.moveT = 0.38; p.moveV = [toHoop[0] * 6.5, toHoop[1] * 6.5]; p.face = toHoop;
    say(p, "SPIN!", "#ffe03c"); sfx.whoosh(); fx.ring(p.x, p.z, p.ch.col, 1.2, 0.3);
    if (flat(p, d) < 1.5 && d.fallen <= 0 && d.onGround) { d.stun = 0.3; d.face = [-d.face[0], -d.face[1]]; }   // he spun right off him
  } else {
    const away = flat(p, d) < 3 ? norm(p.x - d.x, p.z - d.z) : [-toHoop[0], -toHoop[1]];
    p.moveT = 0.22; p.moveV = [away[0] * 6, away[1] * 6]; p.openT = 1.0; p.face = toHoop;
    say(p, "STEP BACK", "#5ad84a"); sfx.whoosh(); fx.dust(p.x, p.z, 6);
  }
}

// ---------- skills: the SP bar's special, with a wind-up you can see and get out of ----------
const WIND_UP = 0.6;
const cutinEl = document.getElementById("cutin");
function trySpecial(p) {
  if (p.sp < 1 || busy(p) || p.shooting || p.charge || phase !== "play") return;
  if (p.ch.name === "SHADE" && ball.owner === p) { say(p, "GOT IT ALREADY", "#9088a4"); return; }
  p.sp = 0; p.charge = { t: WIND_UP, dur: WIND_UP };
  other(p).ai.dodge = Math.random() < 0.45;
  beep(180, WIND_UP, "sawtooth", 0.045, 520); noise(WIND_UP, 0.06, 900);
  fx.impact({ slow: 0.25, punch: 0.4 }); fx.ring(p.x, p.z, p.ch.col, 2.2, 0.6);
  cutinEl.innerHTML = `<i style="background:${p.ch.dark}"></i><b style="color:${p.ch.col}">${p.name}</b><span>${T(p.ch.special)}</span>`;
  cutinEl.className = p.i ? "ui r on" : "ui on"; clearTimeout(cutinEl.t); cutinEl.t = setTimeout(() => (cutinEl.className = p.i ? "ui r" : "ui"), 900);
}
// what the target should do to get out of it right now (null: it can't reach him)
function dodgeHow(p) {
  const o = other(p), n = p.ch.name, d = flat(p, o);
  if (n === "SHADE") return ball.owner === o ? "DASH!" : null;
  if (n === "BLAZE") return d < 4.5 ? "GET AWAY!" : null;
  if (n === "VOLT") return ball.owner === p && d > 2.5 ? null : "JUMP!";
  if (n === "GRAMPS") return ball.owner === p ? "JUMP!" : null;
  if (n === "FROST") { const [fx_, fz] = norm(o.x - p.x, o.z - p.z); return d < 13 ? "JUMP!" : null; }
  return d < 10 ? "JUMP!" : null;
}
function dangerFor(me) {
  const o = other(me);
  if (o.charge) { const how = dodgeHow(o); return how && { how, left: o.charge.t / o.charge.dur }; }
  if (o.quakeT > 0 && o.quakeT < 0.4 && me.onGround) return { how: "JUMP!", left: o.quakeT / 0.4 };
  const t = teeth.find((t) => t.from === o && flat(t, me) < 4 && ((me.x - t.x) * t.vx + (me.z - t.z) * t.vz) > 0);
  return t ? { how: "JUMP!", left: flat(t, me) / 4 } : null;
}
function freeze(o, t, kind) { o.frozen = t; o.frozenKind = kind; o.vx = o.vz = 0; o.dunk = null; o.shooting = false; o.gather = 0; if (ball.owner === o) looseBall(o, 0, 1, 0); }
function awaken(p, t = 0) {
  p.fire = true; p.fireT = Math.max(p.fireT, t); say(p, "AWAKENED!", "#ff9a2a", true); fx.pillar(p.x, p.z, "#ff6a1a", 3.5, 0.7, 0.7);
  fx.impact({ slow: 0.3, punch: 0.4 }); if (!t) say(p, "HOT HAND", p.ch.col);
}
const SPECIALS = {
  BLAZE(p) {
    const o = other(p), d = flat(p, o);
    fx.pillar(p.x, p.z, "#ff6a1a", 6, 1.3, 1.4); fx.ring(p.x, p.z, "#ff9a2a", 4, 0.5); awaken(p, 10);
    if (d < 3.2) { const [nx, nz] = norm(o.x - p.x, o.z - p.z); o.fallen = 1; o.vx = nx * 7; o.vz = nz * 7; o.vy = 5; o.onGround = false; if (ball.owner === o) looseBall(o, nx * 3, 4, nz * 3); }
    else if (d < 5) say(o, "DODGED", "#ffe03c");
    pop("INFERNO!", p.x, p.y + 3.4, p.z, "#ff9a2a", true); fx.impact({ stop: 0.1, shake: 0.7, punch: 0.8 }); noise(0.6, 0.25, 400); beep(55, 0.5, "sawtooth", 0.12, -20);
  },
  FROST(p) {
    const o = other(p), [dx, dz] = norm(o.x - p.x, o.z - p.z);
    fx.spikes(p.x, p.z, dx, dz, 13); pop("FROZEN!", p.x, p.y + 3.4, p.z, "#a6ecff", true);
    for (let i = 0; i < 6; i++) beep(rnd(1800, 3200), 0.12, "triangle", 0.03, 0, i * 0.05);
    later(0.1, () => {
      const along = (o.x - p.x) * dx + (o.z - p.z) * dz, side = Math.abs((o.x - p.x) * -dz + (o.z - p.z) * dx);
      if (along > 0 && along < 13 && side < 1.3 && o.y < 0.3) { freeze(o, 2.2, "ice"); fx.burst(o.x, 1, o.z, 20, ["#a6ecff", "#ffffff"], 3, 0.6); fx.impact({ stop: 0.12, shake: 0.4 }); }
      else say(o, "DODGED", "#a6ecff");
    });
  },
  VOLT(p) {
    const o = other(p), h = hoop(p);
    if (ball.owner === p) {
      fx.bolt(p.x, 10, p.z, p.x, 0, p.z); p.x = h.x - p.dir * 2.4; p.z = 0; p.face = [p.dir, 0]; p.dashV = [p.dir, 0]; fx.bolt(p.x, 10, p.z, p.x, 0, p.z);
      if (flat(p, o) < 1.8) { if (o.onGround) { o.stun = 0.8; say(o, "ZAPPED!", "#fff6a0"); } else say(o, "DODGED", "#fff6a0"); }
      startDunk(p);
    } else {
      const tx = ball.owner === o ? o.x + o.face[0] * 0.8 : ball.x, tz = ball.owner === o ? o.z + o.face[1] * 0.8 : ball.z;
      fx.bolt(p.x, 10, p.z, p.x, 0, p.z); p.x = clamp(tx, -HALF_L + 0.3, HALF_L - 0.3); p.z = clamp(tz, -HALF_W + 0.3, HALF_W - 0.3); fx.bolt(o.x, 10, o.z, o.x, 1, o.z);
      if (ball.owner === o) { if (o.onGround) { o.stun = 0.9; looseBall(o, (p.x - o.x) * 2, 3, (p.z - o.z) * 2); say(o, "ZAPPED!", "#fff6a0"); } else say(o, "DODGED", "#fff6a0"); }
    }
    pop("THUNDER STEP!", p.x, p.y + 3.4, p.z, "#fff6a0", true); fx.impact({ stop: 0.1, shake: 0.5, punch: 0.6 }); noise(0.4, 0.2, 5000);
  },
  TANK(p) {
    const o = other(p);
    const shock = (big) => {
      fx.ring(p.x, p.z, "#d8b48a", big ? 9 : 7, 0.6, 0.03, 0.08); fx.ring(p.x, p.z, p.ch.col, big ? 6 : 4, 0.45); fx.dust(p.x, p.z, big ? 30 : 18);
      for (const r of rims) r.wob = big ? 1.2 : 0.8;
      if (o.onGround && o.fallen <= 0 && o.hang <= 0 && flat(p, o) < 10) { o.fallen = 1.6; o.vy = 3; o.onGround = false; if (ball.owner === o) looseBall(o, (p.x - o.x) * 0.4, 4, 0); }
      else if (o.fallen <= 0) say(o, "JUMPED IT", "#ffe03c");
      if (!ball.owner) ball.vy += big ? 4 : 3;
      fx.impact({ stop: big ? 0.14 : 0.06, shake: big ? 0.9 : 0.6, punch: big ? 0.5 : 0.3 }); beep(45, 0.5, "sine", 0.3, -15); noise(0.5, 0.25, 300);
    };
    shock(true); pop("EARTHQUAKE!", p.x, p.y + 3.4, p.z, p.ch.col, true); p.quakeT = 0.55;
    later(0.55, () => { if (phase === "play") shock(false); });
  },
  SHADE(p) {
    const o = other(p);
    fx.vortex(ball.x, ball.y + 0.3, ball.z, 1.3, 0.9); pop("BLACK HOLE!", p.x, p.y + 3.4, p.z, "#9a7cff", true); beep(600, 0.6, "sine", 0.06, -480);
    if (ball.owner === o && (o.dashT > 0 || o.dashCd > 0)) { say(o, "DODGED", "#9a7cff"); return; }
    if (ball.owner === o) { o.stun = 0.5; looseBall(o, 0, 1, 0); }
    if (!ball.owner && !ball.live) { ball.homing = p; ball.homeT = 1.5; }
    fx.impact({ stop: 0.08, shake: 0.4, punch: 0.5 });
  },
  GRAMPS(p) {
    const o = other(p);
    if (ball.owner === p) {
      fx.clock(o.x, 1.4, o.z, 1.6, 1.4); pop("TIME OUT!", p.x, p.y + 3.4, p.z, "#e6e1ee", true);
      if (o.onGround) freeze(o, 2.4, "time"); else say(o, "DODGED", "#ffffff");
      p.granny = true; p.vx = p.vz = 0; p.face = norm(hoop(p).x - p.x, hoop(p).z - p.z);
      later(0.5, () => { if (ball.owner === p) { release(p, true); say(p, "GRANNY STYLE", "#ffe03c"); } p.granny = false; });
      beep(1568, 0.5, "sine", 0.05); beep(2093, 0.4, "sine", 0.03, 0, 0.12);
    } else {
      const [dx, dz] = norm(o.x - p.x, o.z - p.z), g = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), mat("#ffffff")), gum = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.22), mat("#ff86a0"));
      gum.position.y = 0.08; g.add(upper, gum); scene.add(g);
      teeth.push({ x: p.x + dx * 0.6, z: p.z + dz * 0.6, vx: dx * 7, vz: dz * 7, from: p, mesh: g, t: 0 });
      pop("DENTURES!", p.x, p.y + 3.4, p.z, "#ffffff", true); sfx.whoosh();
    }
  },
};
// the dentures chatter along the floor at ankle height: jump them
const teeth = [];
function updateTeeth(dt) {
  for (let i = teeth.length - 1; i >= 0; i--) {
    const t = teeth[i]; t.t += dt; t.x += t.vx * dt; t.z += t.vz * dt;
    t.mesh.position.set(t.x, 0.12 + Math.abs(Math.sin(t.t * 20)) * 0.18, t.z); t.mesh.rotation.y = Math.atan2(-t.vz, t.vx); t.mesh.children[1].position.y = 0.08 + Math.abs(Math.sin(t.t * 30)) * 0.08;
    const o = other(t.from);
    if (flat(t, o) < 0.5 && o.y < 0.3 && o.fallen <= 0) {
      o.stun = 1.2; if (ball.owner === o) looseBall(o, t.vx * 0.2, 3, t.vz * 0.2); say(o, "CHOMP!", "#ffffff", true);
      fx.burst(o.x, 0.4, o.z, 12, ["#ffffff", "#ff86a0"], 3, 0.5); fx.impact({ stop: 0.1, shake: 0.4 }); sfx.crack(); t.t = 99;
    }
    if (t.t > 2.5 || Math.abs(t.x) > HALF_L || Math.abs(t.z) > HALF_W) { scene.remove(t.mesh); teeth.splice(i, 1); }
  }
}
// what the CPU wants a special for, right now
function wantsSpecial(me, o) {
  const has = ball.owner === me, oppHas = ball.owner === o, d = flat(me, o), dh = Math.hypot(hoop(me).x - me.x, me.z);
  switch (me.ch.name) {
    case "BLAZE": return has ? dh < 7 : d < 2.6;
    case "FROST": return oppHas && d < 10;
    case "VOLT": return has ? dh > 5 : oppHas;
    case "TANK": return oppHas && o.onGround && d < 8;
    case "SHADE": return oppHas;
    case "GRAMPS": return has ? dh > 4 : oppHas && d < 9;
  }
  return false;
}

// ---------- a baller's frame ----------
function updatePlayer(p, c, dt) {
  const opp = other(p);
  for (const k of ["cd", "whiff", "dashCd", "landT", "dunkWin", "celebrate", "followT", "quakeT", "moveCd", "safeT", "openT"]) p[k] -= dt;
  p.landA = Math.max(0, p.landA - dt * 5);
  if (phase === "play") gainSp(p, dt * 0.045);
  if (p.fireT > 0 && (p.fireT -= dt) <= 0 && p.streak < 2) p.fire = false;
  if (p.fire && Math.random() < 0.8) fx.shard({ x: p.x + rnd(-0.3, 0.3), y: p.y + rnd(0.2, 2), z: p.z + rnd(-0.3, 0.3), vy: rnd(1.5, 3), g: -1, floor: false, life: 0.4, c: ["#ff4a2a", "#ff9a2a", "#ffe03c"], size: 0.09 });
  if (c.special) trySpecial(p);
  if (c.move) dribbleMove(p, c.move);
  p.protect = !!c.protect && ball.owner === p && p.onGround;
  // the wind-up: he gathers it standing still; knock him down, freeze or stun him and it fizzles
  if (p.charge) {
    if (p.fallen > 0 || p.frozen > 0 || p.stun > 0.3) { p.charge = null; say(p, "FIZZLED", "#9088a4"); }
    else if ((p.charge.t -= dt) <= 0) { p.charge = null; SPECIALS[p.ch.name](p); }
    else { c = NONE; if (p.onGround) p.vx = p.vz = 0; if (Math.random() < 0.8) fx.shard({ x: p.x + rnd(-0.4, 0.4), y: p.y + rnd(0, 2), z: p.z + rnd(-0.4, 0.4), vy: rnd(2, 4), g: 0, floor: false, life: 0.35, c: p.ch.col, size: 0.08 }); }
  }
  if (p.frozen > 0) { p.frozen -= dt; c = NONE; p.vx = p.vz = 0; if (p.frozenKind === "time") { p.vy = 0; return; } if (p.frozen <= 0) { fx.burst(p.x, 1, p.z, 24, ["#a6ecff", "#ffffff", "#8cc8f0"], 4, 0.7); sfx.glass(); } }
  if (p.granny) { c = NONE; p.vx = p.vz = 0; }
  protectBall(p, dt);
  p.stam = Math.min(1, p.stam + dt * 0.3);
  if (p.hang > 0) { p.hang -= dt; if (p.hang <= 0) { p.vy = -1; fx.dust(p.x, p.z, 6); } return; }
  if (p.dunk) { updateDunk(p, dt); return; }
  if (p.fallen > 0) {
    if (p.ankled && (c.shoot || c.jump || c.dash || (p.i === 1 && Math.random() < dt * 4))) { p.fallen -= 0.12; fx.dust(p.x, p.z, 2); }   // mash to get up
    p.fallen -= dt; c = NONE; if (p.fallen <= 0) p.ankled = false;
  } else if (p.stun > 0) { p.stun -= dt; c = NONE; }
  const has = ball.owner === p;
  let mx = c.mx, mz = c.mz; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  if (c.dash && p.dashCd <= 0 && p.onGround && !busyShot(p) && p.stam >= DASH_COST(p) && p.fallen <= 0) startDash(p, c.dashDir ?? (ml > 0.2 ? norm(mx, mz) : p.face));
  const sp = 5.2 * p.ch.spd * (has ? 0.92 : 1) * (p.whiff > 0 ? 0.35 : 1) * (p.i === 1 && !dbg.auto ? 0.93 : 1) * (p.protect ? 0.62 : 1) * (p.fire ? 1.1 : 1);
  if (p.moveT > 0) {
    // a dribble move carries him; a spin turns him all the way round
    p.moveT -= dt; p.vx = p.moveV[0]; p.vz = p.moveV[1];
    if (p.spinT > 0) p.spinT -= dt;
    if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.05; fx.ghost(p.body.root, p.ch.col); }
  } else if (p.dashT > 0) {
    p.dashT -= dt; p.vx = p.dashV[0] * 14 * p.ch.spd; p.vz = p.dashV[1] * 14 * p.ch.spd; dashContact(p);
    if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.04; fx.ghost(p.body.root, p.ch.col); }
  } else if (!p.shooting && p.gather <= 0 && p.fallen <= 0) {
    if (p.onGround) { p.vx = mx * sp; p.vz = mz * sp; } else { p.vx += (mx * sp - p.vx) * Math.min(1, dt * 3); p.vz += (mz * sp - p.vz) * Math.min(1, dt * 3); }
    if (ml > 0.2) p.face = norm(mx, mz);
  } else if (p.fallen > 0 && p.onGround) { p.vx *= 0.85; p.vz *= 0.85; }
  // a defender squares up to the ball handler
  if (ball.owner === opp && p.fallen <= 0 && p.dashT <= 0) p.face = norm(opp.x - p.x, opp.z - p.z);
  if (c.jump && p.onGround && !p.shooting && p.whiff <= 0 && p.fallen <= 0 && p.moveT <= 0) { p.vy = 6.6 * p.ch.jmp * (p.fire ? 1.12 : 1); p.onGround = false; fx.dust(p.x, p.z, 4); }
  if (c.shoot && p.fallen <= 0) {
    if (has && !p.shooting && p.gather <= 0 && p.moveT <= 0) { if (canDunk(p)) startDunk(p); else if (p.onGround) p.gather = 0.13; else startShot(p); }
    else if (!has && p.cd <= 0 && ball.owner === opp) trySteal(p, opp);
  }
  if (p.gather > 0) {
    p.vx = p.vz = 0;
    if (!c.shootHeld || ball.owner !== p) { p.gather = 0; if (ball.owner === p) { p.fakeT = 0.4; p.bitDone = false; say(p, "FAKE", "#9088a4"); sfx.whoosh(); } }
    else if ((p.gather -= dt) <= 0) { p.gather = 0; startShot(p); }
  }
  if (p.fakeT > 0) {
    p.fakeT -= dt;
    if (!p.bitDone && !opp.onGround && flat(p, opp) < 2.2) {
      p.bitDone = true; say(opp, "BIT!", "#ffe03c", true); hype = 0.6;
      fx.flash(opp.x, opp.y + 2.4, opp.z, "#ffe03c", 1.6, 0.2); fx.burst(opp.x, opp.y + 2.4, opp.z, 8, "#ffe03c", 2, 0.4); fx.impact({ slow: 0.3, punch: 0.3 });
    }
  }
  if (p.shooting) {
    p.shootT += dt;
    if (ball.owner === p && ((!c.shootHeld && p.shootT > 0.03) || p.vy < -4)) release(p);
    if (p.onGround && p.shootT > 0.1) { if (ball.owner === p) release(p); p.shooting = false; }
  }
  const wasAir = !p.onGround, fallV = p.vy;
  p.vy -= G * dt; p.x += p.vx * dt; p.z += p.vz * dt; p.y += p.vy * dt;
  if (p.y <= 0) { p.y = 0; p.vy = 0; p.onGround = true; if (wasAir && fallV < -4) { if (p.fallen <= 0) p.landT = 0.2; p.landA = 1; fx.dust(p.x, p.z, fallV < -7 ? 10 : 4); } } else p.onGround = false;
  p.x = clamp(p.x, -HALF_L + 0.3, HALF_L - 0.3); p.z = clamp(p.z, -HALF_W + 0.3, HALF_W - 0.3);
}

// ---------- the CPU ----------
function cpuControl(me, dt) {
  const c = { ...NONE }, o = other(me), ai = me.ai; ai.t -= dt;
  const go = (tx, tz, dead = 0.25) => { const dx = tx - me.x, dz = tz - me.z, d = Math.hypot(dx, dz); if (d > dead) { c.mx = dx / d; c.mz = dz / d; } };
  if (me.shooting && ball.owner === me) { c.shootHeld = me.shootT < ai.releaseAt; return c; }
  if (me.gather > 0 && ball.owner === me) { c.shootHeld = !ai.faking; return c; }
  if (ai.jumpIn > 0 && (ai.jumpIn -= dt) <= 0) c.jump = true;
  // a special coming at him: read it and get out of the way (most of the time)
  const how = o.charge && dodgeHow(o);
  if (how && ai.dodge) {
    const left = o.charge.t;
    if (how === "GET AWAY!") { [c.mx, c.mz] = norm(me.x - o.x, me.z - o.z); if (me.dashCd <= 0 && me.onGround) { c.dash = true; c.dashDir = [c.mx, c.mz]; } return c; }
    if (how === "DASH!" && left < 0.14 && me.dashCd <= 0 && me.onGround) { c.dash = true; [c.mx, c.mz] = norm(hoop(me).x - me.x, -me.z); return c; }
    if (how === "JUMP!" && left < 0.12 && me.onGround) { c.jump = true; return c; }
  }
  if (o.quakeT > 0 && o.quakeT < 0.12 && ai.dodge && me.onGround) c.jump = true;
  if (ai.dodge !== false && me.onGround && teeth.some((t) => t.from === o && flat(t, me) < 1.4)) c.jump = true;
  ai.spT = (ai.spT ?? rnd(1, 3)) - dt;
  if (me.sp >= 1 && ai.spT <= 0 && wantsSpecial(me, o)) { c.special = true; ai.spT = rnd(1, 3); return c; }
  if (ball.owner === me) {
    const h = hoop(me), d = Math.hypot(h.x - me.x, h.z - me.z), near = flat(me, o) < 1.5 && o.fallen <= 0;
    if (!ai.plan) { const r = Math.random(), t3 = 0.2 + (me.ch.three - 1) * 0.6; ai.plan = r < t3 ? { kind: "three", at: rnd(7, 7.8) } : r < 0.62 ? { kind: "drive" } : { kind: "mid", at: rnd(3.5, 5.5) }; ai.lane = rnd(-3, 3); }
    const shoot = () => {
      if (near && me.fakeT <= 0 && Math.random() < 0.3) { ai.faking = true; c.shoot = c.shootHeld = true; return; }
      ai.faking = false; c.shoot = c.shootHeld = true; ai.releaseAt = (6.2 * me.ch.jmp) / G + gauss() * 0.08; ai.plan = null;
    };
    const toward = norm(h.x - me.x, h.z - me.z);
    if (committed(o) && o.ch.name !== "TANK" && flat(me, o) < 2.5 && me.dashCd <= 0 && me.stam >= DASH_COST(me) && o.fallen <= 0) { c.dash = true; [c.mx, c.mz] = toward; return c; }
    // dribble moves against a defender in his face: crossovers, a spin on a drive, a stepback before a jumper
    if (near && me.onGround && me.moveCd <= 0 && !busyShot(me)) {
      if (ai.plan.kind !== "drive" && me.openT <= 0 && me.stam > 0.4 && Math.random() < dt * 1.2) { c.move = "step"; ai.afterStep = true; return c; }
      if (ai.plan.kind === "drive" && me.stam > 0.5 && Math.random() < dt * 0.5) { c.move = "spin"; return c; }
      if (me.stam > 0.25 && Math.random() < dt * 0.9) { c.move = "cross"; return c; }
    }
    if (ai.afterStep && me.moveT <= 0 && me.openT > 0 && me.onGround) { ai.afterStep = false; shoot(); return c; }
    c.protect = near && ai.plan.kind !== "drive" && Math.random() < 0.3;
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
  const stickEl = document.getElementById("stick"), knobEl = document.getElementById("knob");
  addEventListener("pointerdown", (e) => {
    audio();
    if (e.pointerType !== "touch" || e.target.classList.contains("b") || screen !== "game") return;
    if (e.clientX < innerWidth * 0.45 && !touch.stick) touch.stick = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
  });
  addEventListener("pointermove", (e) => { const s = touch.stick; if (s && e.pointerId === s.id) { s.x = e.clientX; s.y = e.clientY; const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 50) { s.ox = s.x - (dx / d) * 50; s.oy = s.y - (dy / d) * 50; } } });
  const up = (e) => { if (touch.stick && e.pointerId === touch.stick.id) touch.stick = null; };
  addEventListener("pointerup", up); addEventListener("pointercancel", up);
  for (const [id, name] of [["bShoot", "shoot"], ["bJump", "jump"], ["bDash", "dash"], ["bMove", "move"], ["bSkill", "skill"]]) {
    const el = document.getElementById(id);
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault(); audio(); touch.held.add(name); touch.tap.add(name); el.classList.add("on");
      if (name === "move") { const now = performance.now(); touch.moveTwice = now - (touch.lastMove ?? 0) < 300; touch.lastMove = now; }
    });
    const off = () => { touch.held.delete(name); el.classList.remove("on"); };
    el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("pointerleave", off);
  }
  setInterval(() => {
    const s = touch.stick; stickEl.style.display = knobEl.style.display = s ? "block" : "none";
    if (s) { stickEl.style.left = s.ox + "px"; stickEl.style.top = s.oy + "px"; knobEl.style.left = s.x + "px"; knobEl.style.top = s.y + "px"; }
  }, 16);
}
// ---- the mouse: right click (or hold and drag) to run there; a dash goes toward the cursor ----
const raycaster = new THREE.Raycaster(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2();
const mouse = { ground: null, target: null, right: false };
const marker = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 16), new THREE.MeshBasicMaterial({ color: "#5ad84a", transparent: true, depthWrite: false }));
marker.rotation.x = -Math.PI / 2; marker.visible = false; scene.add(marker);
function groundAt(e) {
  const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return raycaster.ray.intersectPlane(floorPlane, p) ? p : null;
}
function setTarget(p, mark) {
  if (!p || screen !== "game") return;
  mouse.target = { x: clamp(p.x, -HALF_L + 0.3, HALF_L - 0.3), z: clamp(p.z, -HALF_W + 0.3, HALF_W - 0.3) };
  if (mark) fx.ring(mouse.target.x, mouse.target.z, "#5ad84a", 0.7, 0.3);
}
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; audio(); if (e.button === 2) { mouse.right = true; setTarget(groundAt(e), true); } });
addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; mouse.ground = groundAt(e); if (mouse.right) setTarget(mouse.ground, false); });
addEventListener("pointerup", (e) => { if (e.button === 2) mouse.right = false; });
addEventListener("wheel", (e) => { if (screen === "game") camZoom = clamp(camZoom * (e.deltaY > 0 ? 1.1 : 0.9), 0.6, 1.6); }, { passive: true });
// keys and the stick move you relative to the camera: up on the screen is away from you, whatever the view
let camFwd = [0, -1];
const camRel = (kx, kz) => { const [fx_, fz] = camFwd; return [kx * -fz - kz * fx_, kx * fx_ - kz * fz]; };
function humanControl() {
  const c = { ...NONE };
  const kx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const kz = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  const me = players[0];
  if (kx || kz) { [c.mx, c.mz] = camRel(kx, kz); mouse.target = null; }
  else if (mouse.target) {
    const dx = mouse.target.x - me.x, dz = mouse.target.z - me.z, d = Math.hypot(dx, dz);
    if (d < 0.18) mouse.target = null; else { c.mx = dx / d; c.mz = dz / d; }
  }
  c.jump = pressed.has("KeyE") || pressed.has("KeyK");
  c.special = pressed.has("KeyX") || touch.tap.has("skill");
  c.move = pressed.has("KeyQ") ? "cross" : pressed.has("KeyR") ? "spin" : pressed.has("KeyF") ? "step" : null;
  c.protect = keys.has("KeyC") || keys.has("ControlLeft");
  // on a phone: the MOVE button crosses over, twice quickly spins; dashing away from the rim with the ball is a stepback
  if (touch.tap.has("move")) c.move = touch.moveTwice ? "spin" : "cross";
  c.dash = pressed.has("ShiftLeft") || pressed.has("ShiftRight") || pressed.has("KeyL");
  c.shoot = pressed.has("Space") || pressed.has("KeyJ"); c.shootHeld = keys.has("Space") || keys.has("KeyJ");
  // a dash with the mouse goes toward the cursor (and stops the run to the old click)
  if (c.dash && !isTouch && mouse.ground && Math.hypot(mouse.ground.x - me.x, mouse.ground.z - me.z) > 0.5) { c.dashDir = norm(mouse.ground.x - me.x, mouse.ground.z - me.z); mouse.target = null; }
  const s = touch.stick;
  if (s) { const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 8) [c.mx, c.mz] = camRel(dx / 50, dy / 50); }
  if (touch.tap.has("jump")) c.jump = true; if (touch.tap.has("dash")) c.dash = true;
  if (isTouch && c.dash && ball.owner === me && (c.mx * me.dir < -0.5)) { c.dash = false; c.move = "step"; }
  if (touch.tap.has("shoot")) c.shoot = true; if (touch.held.has("shoot")) c.shootHeld = true;
  // on a phone, the shot button near the rim after a dash is the dunk (pressed for you when it becomes possible)
  if (isTouch && touch.held.has("shoot") && ball.owner === players[0] && canDunk(players[0])) c.shoot = true;
  touch.tap.clear();
  return c;
}

// ---------- screens: select, game, over ----------
const STATS = [["SPD", "spd"], ["JMP", "jmp"], ["SHOT", "shot"], ["3PT", "three"], ["DEF", "def"]];
const pips = (v) => clamp(Math.round((v - 0.7) / 0.15) + 1, 1, 5);
function showSelect() {
  screen = "select"; locked = false; spinT = 0; fx.clear();
  centerEl.innerHTML = ""; document.getElementById("touch").style.display = "none"; document.getElementById("score").style.display = "none"; document.getElementById("bars").style.display = "none";
  for (const p of players) scene.remove(p.body.root);
  selEl.style.display = "flex"; document.getElementById("help").style.display = "none"; document.getElementById("viewB").style.display = "none"; mouse.target = null;
  selEl.innerHTML = `<h1>${T("CHOOSE YOUR BALLER")}</h1><div id="tabs">${CHARS.map((c, i) => `<button class="tab" data-i="${i}" style="--c:${c.col}">${c.name}</button>`).join("")}</div>
    <div id="card"></div><div id="selBtns"><button id="prevB">&lt;</button><button id="playB">${T("PLAY")}</button><button id="nextB">&gt;</button></div><small>${isTouch ? "" : LANG === "ko" ? KO.PICK : "< > OR A D TO PICK   F / ENTER TO PLAY"}</small>`;
  selEl.querySelectorAll(".tab").forEach((b) => (b.onclick = () => { audio(); if (locked) return; if (pickI === +b.dataset.i) lockIn(); else { pickI = +b.dataset.i; sfx.click(); drawCard(); } }));
  document.getElementById("prevB").onclick = () => { audio(); if (!locked) { pickI = (pickI + 5) % 6; sfx.click(); drawCard(); } };
  document.getElementById("nextB").onclick = () => { audio(); if (!locked) { pickI = (pickI + 1) % 6; sfx.click(); drawCard(); } };
  document.getElementById("playB").onclick = () => { audio(); lockIn(); };
  drawCard();
}
function drawCard() {
  const ch = CHARS[pickI];
  selEl.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", +b.dataset.i === pickI));
  document.getElementById("card").innerHTML = `<b style="color:${ch.col}">${ch.name}</b><i>${T(ch.title)}</i>
    <div class="abil"><span>${T("PASSIVE")}</span><b style="color:${ch.col}">${T(ch.passive)}</b><em>${T(ch.pdesc)}</em><span>${T("SKILL")}</span><b style="color:#ffe03c">${T(ch.special)}</b><em>${T(ch.sdesc)}</em></div>
    <div class="stats">${STATS.map(([l, k]) => `<span>${T(l)}</span><span class="pips">${[0, 1, 2, 3, 4].map((j) => `<u style="background:${j < pips(ch[k]) ? ch.col : "#2a2440"}"></u>`).join("")}</span>`).join("")}</div>`;
}
function lockIn() {
  if (locked) return;
  locked = true; spinT = 0.9; sfx.lock();
  const f = stageFigs[pickI]; fx.clear();
  do cpuI = Math.floor(Math.random() * CHARS.length); while (cpuI === pickI);
}
function startGame() {
  selEl.style.display = "none"; document.getElementById("score").style.display = "flex"; document.getElementById("bars").style.display = "flex"; document.getElementById("help").style.display = "block";
  const vb = document.getElementById("viewB"); vb.style.display = "block"; vb.textContent = `${T("VIEW")}: ${T(VIEWS[view])}`;
  vb.onclick = (e) => { e.stopPropagation(); audio(); nextView(); vb.blur(); };
  if (isTouch) document.getElementById("touch").style.display = "block";
  for (const p of players) scene.remove(p.body.root);
  players = [makePlayer(0, pickI), makePlayer(1, cpuI)];
  document.getElementById("na").textContent = players[0].name; document.getElementById("na").style.color = players[0].ch.col;
  document.getElementById("nb").textContent = players[1].name; document.getElementById("nb").style.color = players[1].ch.col;
  newGame();
}
function newGame() {
  for (const t of teeth) scene.remove(t.mesh); teeth.length = 0;
  for (const p of players) Object.assign(p, { sp: 0.3, fire: false, fireT: 0, streak: 0, charge: null, frozen: 0 });
  screen = "game"; fx.clear(); mouse.target = null;
  document.activeElement?.blur?.();                                             // so Space shoots instead of pressing a button again
  for (const p of players) { p.score = 0; p.stam = 1; p.winner = p.loser = false; }
  clock = 60; overtime = false; phase = "countdown"; stateT = 0; lastScorer = null; jumbo.key = "";
  setPossession(Math.random() < 0.5 ? 0 : 1);
  centerEl.innerHTML = "";
}
function endGame() {
  phase = "over"; screen = "over"; sfx.whistle();
  const [a, b] = players, win = a.score === b.score ? null : a.score > b.score ? a : b;
  if (win) { win.winner = true; other(win).loser = true; other(win).fallen = 999; }
  for (let i = 0; i < 6; i++) later(i * 0.2, () => fx.burst(rnd(-6, 6) + (win ? win.x * 0.5 : 0), 8, rnd(-3, 2), 40, ["#ff4a3a", "#ffe03c", "#5cc4ff", "#5ad84a", "#f53cd1", "#ffffff"], 3, 2.2, { g: 3, size: 0.12 }));
  centerEl.innerHTML = `<div style="color:${win ? win.ch.col : "#fff"}">${win ? `${win.name} ${T("WINS")}` : T("DRAW")}</div><div>${a.score} - ${b.score}</div>
    <div style="display:flex;gap:12px"><button id="again">${T("REMATCH")}</button><button id="change">${T("CHANGE BALLERS")}</button><a href="../">${T("BACK TO 2D")}</a></div>`;
  document.getElementById("again").onclick = () => { audio(); for (const p of players) p.fallen = 0; newGame(); };
  document.getElementById("change").onclick = () => { audio(); showSelect(); };
}
document.getElementById("help").textContent = isTouch ? "" : LANG === "ko" ? KO.HELP : HELP_EN;

function step(dt) {
  worldT += dt; stateT += dt; hype = Math.max(0, hype - dt * 0.5);
  for (const t of timers) t.t -= dt;
  for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= 0) { const t = timers.splice(i, 1)[0]; t.fn(); }
  for (const r of rims) r.wob = Math.max(0, r.wob - dt * 2.5);
  if (screen === "select") {
    if (!locked) {
      if (pressed.has("ArrowLeft") || pressed.has("KeyA")) { pickI = (pickI + 5) % 6; sfx.click(); drawCard(); }
      if (pressed.has("ArrowRight") || pressed.has("KeyD")) { pickI = (pickI + 1) % 6; sfx.click(); drawCard(); }
      if (pressed.has("Enter") || pressed.has("KeyF") || pressed.has("Space")) lockIn();
    } else if ((spinT -= dt) <= 0) startGame();
    return;
  }
  if (pressed.has("KeyV") || pressed.has("KeyC")) nextView();
  if (screen === "over") { for (const p of players) updatePlayer(p, NONE, dt); updateBall(dt); return; }
  if (phase === "countdown") {
    const n = 3 - Math.floor(stateT / 0.6);
    centerEl.innerHTML = n > 0 ? `<div>${n}</div>` : `<div style="color:#ffe03c">GO!</div>`;
    if (stateT > 2.2) { phase = "play"; centerEl.innerHTML = ""; sfx.whistle(); } else if (stateT < 1.8) return;
  }
  const ctrls = [phase === "play" ? (dbg.auto ? cpuControl(players[0], dt) : humanControl()) : NONE, phase === "play" ? cpuControl(players[1], dt) : NONE];
  players.forEach((p, i) => updatePlayer(p, ctrls[i], dt));
  // bodies don't pass through each other on the floor, except on a dash
  const [a, b] = players, d = flat(a, b), room = 0.62 + (a.ch.wide || b.ch.wide ? 0.12 : 0);
  if (d < room && d > 0 && a.dashT <= 0 && b.dashT <= 0 && a.onGround && b.onGround && a.fallen <= 0 && b.fallen <= 0) {
    const [nx, nz] = norm(b.x - a.x, b.z - a.z), push = (room - d) / 2; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
  }
  updateBall(dt); updateTeeth(dt);
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
const camPos = new THREE.Vector3(0, 6.6, 17), camLook = new THREE.Vector3(0, 1.2, 0), camGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3();
// three views, V (or the button) to switch: side-on like a broadcast, high above, behind you; the wheel zooms
const VIEWS = ["SIDE", "HIGH", "BEHIND"];
let view = +(localStorage.getItem("hoops3d.view") ?? 0) % 3, camZoom = 1, camYaw = 0;
function nextView() {
  view = (view + 1) % VIEWS.length; localStorage.setItem("hoops3d.view", view); sfx.click();
  const el = document.getElementById("viewB"); el.textContent = `${T("VIEW")}: ${T(VIEWS[view])}`;
}
let cueWas = false;
function drawStage(dt) {
  stageFigs.forEach((f, i) => {
    const on = i === pickI, lockedOn = on && locked;
    f.b.root.position.z += ((on ? 0.7 : 0) - f.b.root.position.z) * Math.min(1, dt * 8);
    f.b.root.position.y = lockedOn ? Math.abs(Math.sin(worldT * 12)) * 0.25 : 0;
    f.b.root.rotation.y = -Math.PI / 2 + (on ? Math.sin(worldT * 1.5) * 0.35 : 0);
    animate(f.b, { speed: 0, walk: 0, air: false, dance: lockedOn, dribble: on && !lockedOn ? { hand: 1, low: Math.abs(Math.sin(worldT * 7)) } : null, mood: on ? "happy" : "calm", t: worldT + i });
    // the one you're on dribbles a ball of his own
    if (on && !lockedOn) stageBall.position.set(f.b.root.position.x - 0.32, 0.95 - Math.abs(Math.sin(worldT * 7)) * 0.8, f.b.root.position.z + 0.36);
    if (on) stageBall.visible = !lockedOn;
    f.spot.material.opacity = on ? 0.6 + Math.sin(worldT * 6) * 0.15 : 0.18; f.spot.position.z = f.b.root.position.z;
  });
  if (locked && Math.random() < 0.5) { const f = stageFigs[pickI]; }
  renderer.render(stage, stageCam);
}
function draw(dt) {
  if (screen === "select") { drawStage(dt); return; }
  for (const p of players) {
    const b = p.body, spd = Math.hypot(p.vx, p.vz);
    b.root.position.set(p.x, p.y, p.z); b.root.rotation.y = Math.atan2(-p.face[1], p.face[0]) + (p.spinT > 0 ? (1 - p.spinT / 0.38) * Math.PI * 2 : 0);
    b.root.scale.setScalar(p.fire ? 1.12 : 1);
    if (!p.iceBox) { p.iceBox = new THREE.Mesh(new THREE.BoxGeometry(1, 2.3, 1), new THREE.MeshLambertMaterial({ color: "#a6ecff", transparent: true, opacity: 0.55 })); b.root.add(p.iceBox); p.iceBox.position.y = 1.1; }
    p.iceBox.visible = p.frozen > 0; if (p.frozen > 0) p.iceBox.material.color.set(p.frozenKind === "time" ? "#c8c0dc" : "#a6ecff");
    p.walk += spd * dt;
    const up = p.shooting || p.gather > 0 || p.fakeT > 0.2 || !!p.dunk || p.hang > 0;
    const has = ball.owner === p, guarding = ball.owner === other(p) && p.onGround && p.fallen <= 0 && p.dashT <= 0 && p.whiff <= 0;
    const dribbling = has && p.onGround && !up && p.dashT <= 0.05 && !p.granny;
    animate(b, {
      speed: p.frozen > 0 ? 0 : spd, walk: p.walk, air: !p.onGround && !p.dunk && p.hang <= 0, guard: guarding || p.protect, dash: p.dashT > 0 || p.moveT > 0,
      dribble: dribbling ? { hand: p.hand, low: p.crossT > 0 ? 1 : dribbleLow(p) } : null,
      shoot: p.shooting || p.gather > 0 || p.fakeT > 0.2, follow: p.followT > 0 && !has ? p.followT : 0, dunk: !!p.dunk, hang: p.hang > 0,
      block: !p.onGround && !up && !has && !p.dunk && p.followT <= 0, reach: p.whiff > 0 || p.cd > 0.5, fall: p.fallen > 0,
      toes: p.fakeT > 0.25, shootGranny: p.granny, dance: p.celebrate > 0 || p.winner, land: p.landA,
      mood: p.fallen > 0 || p.stun > 0 || p.loser ? "hurt" : p.celebrate > 0 || p.winner ? "happy" : "calm", t: worldT,
    });
  }
  ballMesh.position.set(ball.x, ball.y, ball.z);
  for (const [k, n] of nets.entries()) { netT[k] = Math.max(0, netT[k] - dt * 2); n.scale.y = 1 + netT[k] * 0.6; n.position.y = RIM_Y - 0.24 - netT[k] * 0.12; }
  for (const r of rims) r.mesh.position.y = RIM_Y - Math.abs(Math.sin(worldT * 40)) * r.wob * 0.06;
  crowd.led.offset.x = (crowd.led.offset.x + dt * (0.08 + hype * 0.2)) % 1;
  // the crowd jumps when it's loud
  if (hype > 0.3 || crowd.wasLoud) {
    const m = new THREE.Matrix4();
    crowd.base.forEach(([x, y, z, fan], i) => {
      const jump = hype > 0.3 && fan ? Math.abs(Math.sin(worldT * 8 + i)) * 0.25 * hype : 0;
      crowd.bodies.setMatrixAt(i, m.makeTranslation(x, y + 0.25 + jump, z)); crowd.heads.setMatrixAt(i, m.makeTranslation(x, y + 0.68 + jump, z));
    });
    crowd.bodies.instanceMatrix.needsUpdate = crowd.heads.instanceMatrix.needsUpdate = true;
    crowd.wasLoud = hype > 0.3;
  }
  drawJumbo();
  // the camera: side-on like a broadcast, looking ahead to the hoop being attacked; shake and a zoom punch on big hits
  const me = players[0];
  const ahead = ball.live && ball.shooter ? hoop(ball.shooter).x * 0.6 + ball.x * 0.4 : ball.x * 0.8 + (ball.owner ? ball.owner.dir * 2.5 : 0);
  const fxX = clamp(ahead, -10, 10), z = camZoom, vw = VIEWS[view];
  if (vw === "SIDE") { camGoal.set(fxX, 6.6 * z, 17 * z + Math.abs(ball.z) * 0.2); lookGoal.set(fxX, 1.3, ball.z * 0.25 - 1); }
  else if (vw === "HIGH") { camGoal.set(fxX, 16 * z, 10 * z + ball.z * 0.3); lookGoal.set(fxX, 0, ball.z * 0.4 - 0.5); }
  else {
    // a chase camera behind you that keeps the play in front: toward your hoop with the ball, toward the ball without it
    const tx = ball.owner === me ? me.dir * RIM_X : ball.x, tz = ball.owner === me ? 0 : ball.z;
    if (Math.hypot(tx - me.x, tz - me.z) > 1.2) {
      const want = Math.atan2(tz - me.z, tx - me.x); let d = want - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      camYaw += d * Math.min(1, dt * 2.2);
    }
    const dx = Math.cos(camYaw), dz = Math.sin(camYaw);
    camGoal.set(me.x - dx * 8 * z, 5.2 * z + 0.4, me.z - dz * 8 * z); lookGoal.set(me.x + dx * 7, 0.8, me.z + dz * 7);
  }
  camPos.lerp(camGoal, Math.min(1, dt * 3)); camLook.lerp(lookGoal, Math.min(1, dt * 4));
  camFwd = norm(camLook.x - camPos.x, camLook.z - camPos.z);
  marker.visible = !!mouse.target && screen === "game";
  if (marker.visible) { marker.position.set(mouse.target.x, 0.03, mouse.target.z); marker.material.opacity = 0.6 + Math.sin(worldT * 10) * 0.3; }
  const sh = fx.shake * 0.25;
  camera.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z);
  camera.lookAt(camLook); camera.fov = 32 - fx.punch * 3.5; camera.updateProjectionMatrix();
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
  const danger = phase === "play" && dangerFor(me);
  if (danger) { cue = danger.how; cueCol = Math.floor(worldT * 10) % 2 ? "#ff3a4a" : "#ffffff"; ring.visible = false; }
  if (ring.visible) { ring.position.set(ball.x, ball.y, ball.z); ring.lookAt(camera.position); }
  if (cue && cue !== "GET UP!" && !cueWas) { if (danger) { beep(330, 0.09, "square", 0.05); beep(247, 0.14, "square", 0.05, 0, 0.1); } else sfx.cue(); } cueWas = !!cue && cue !== "GET UP!";
  if (cue && screen === "game") { const [sx, sy] = toScreen(me.x, me.y + 3.1, me.z); cueEl.style.display = "block"; cueEl.style.left = sx + "px"; cueEl.style.top = sy + "px"; cueEl.textContent = T(cue); cueEl.style.color = cueCol; }
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
  // the SP and stamina bars under the scoreboard
  players.forEach((p, i) => {
    const bar = document.getElementById(i ? "spB" : "spA"); if (!bar) return;
    bar.querySelector("i").style.width = Math.round(p.sp * 100) + "%"; bar.querySelector("i").style.background = p.sp >= 1 ? (Math.floor(worldT * 6) % 2 ? "#ffffff" : "#ffe03c") : p.ch.col;
    bar.querySelector("u").style.width = Math.round(p.stam * 100) + "%";
    bar.querySelector("b").textContent = p.sp >= 1 ? (i === 0 && !isTouch ? T("SKILL READY") + " (X)" : T("SKILL READY")) : "";
  });
  const s = Math.ceil(clock); document.getElementById("clock").textContent = overtime ? "OT" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  // the touch buttons say what they do now
  if (isTouch) {
    const bs = document.getElementById("bShoot"), bd = document.getElementById("bDash");
    bs.textContent = T(ball.owner === me ? (canDunk(me) ? "DUNK" : "SHOOT") : "STEAL");
    bs.classList.toggle("gold", cue === "STEAL!"); bd.classList.toggle("gold", cue === "GO!"); bd.textContent = T(cue === "GO!" ? "GO!" : "DASH");
    const sk = document.getElementById("bSkill"); sk.classList.toggle("gold", me.sp >= 1); sk.style.opacity = me.sp >= 1 ? 1 : 0.5;
    document.getElementById("bMove").style.opacity = ball.owner === me ? 1 : 0.4;
  }
  renderer.render(scene, camera);
}

const dbg = { auto: false, hold: false };   // tests: the CPU plays you too; hold freezes the loop
let last = performance.now();
function frame(real) {
  // hitstop freezes the game for a beat; slow motion runs it at a third
  let dt = real;
  if (fx.stop > 0) dt = 0; else if (fx.slow > 0) dt *= 0.35;
  step(dt); pressed.clear();
  fx.update(dt, camera, real);
  if (screen === "over" && (keys.has("KeyR") || keys.has("Enter"))) { for (const p of players) p.fallen = 0; newGame(); }
  draw(real);
}
function loop(now) {
  if (dbg.hold) { last = now; requestAnimationFrame(loop); return; }
  if (now - last < 1000 / 60 - 3) { requestAnimationFrame(loop); return; }
  const real = Math.min(1 / 30, (now - last) / 1000); last = now;
  frame(real);
  requestAnimationFrame(loop);
}
showSelect();
requestAnimationFrame(loop);
window.hoops3d = { get players() { return players; }, ball, get phase() { return phase; }, get screen() { return screen; }, step, draw, frame, cpuControl, newGame, dbg, fx,
  pick(i) { pickI = i; drawCard(); }, lockIn, trySpecial, dribbleMove, startGame, set cpuI(v) { cpuI = v; } };
