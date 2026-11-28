// HOOPS 3D: one-on-one streetball on a half court.
// Check ball at the top, clear it past the arc after a change of possession, first to 11. Four buttons: SHOOT (hold and
// let go at the top of the jump; tap to fake; on defense it steals or jumps), TURBO (hold to sprint, tap to burst; drive
// at the rim and shoot to dunk), TRICK (your signature dribble), SPECIAL (when the meter is full). Three straight makes
// and you're on fire. Characters in models.js, 3D effects in fx.js, pixel effects in pixfx.js.
import * as THREE from "three";
import { CHARS, makeBaller, animate, mat, INK } from "./models.js";
import { createFx } from "./fx.js";
import { initPix, pix, updatePix, clearPix, PFX } from "./pixfx.js";

// ---------- words ----------
const LANG = localStorage.getItem("hoops.lang") === "ko" ? "ko" : "en";
const KO = {
  "QUICK MATCH": "빠른 대결", "STREET TOUR": "스트리트 투어", "HOW TO PLAY": "조작법", "BACK TO 2D": "2D 버전", "1 ON 1 STREETBALL": "1대1 길거리 농구",
  "FIRST TO 11": "11점 먼저", "CHOOSE YOUR BALLER": "선수 선택", PLAY: "시작", BACK: "뒤로", REMATCH: "한 판 더", MENU: "메뉴", "NEXT MATCH": "다음 상대", RETRY: "다시 도전",
  "YOU WIN": "승리!", "YOU LOSE": "패배", "TOUR CHAMP!": "투어 우승!", ROUND: "라운드", BEST: "최고 기록", ROUNDS: "라운드",
  PAUSED: "일시정지", RESUME: "계속", "CHECK BALL": "체크볼", "CLEAR IT": "3점 밖으로!", "NO CLEAR": "클리어 안 함", "ON FIRE": "불붙었다!", "FIRE OUT": "불 꺼짐",
  "STEAL!": "스틸!", "BLOCK!": "블락!", "SLAM!": "덩크!", "GO!": "지금!", "JUMP!": "점프!", "GET AWAY!": "피해!", "DASH!": "터보!", DODGED: "피했다!", FIZZLED: "불발",
  "BLOW BY!": "제쳤다!", WALL: "철벽", "STRIPPED!": "털렸다!", "SPECIAL READY": "필살기 준비!", TURBO: "터보", SPECIAL: "필살기", TRICK: "기술", SHOOT: "슛", STEAL: "스틸", JUMP: "점프", DUNK: "덩크",
  PASSIVE: "패시브", "THE HOTHEAD": "열혈 슈터", "COLD BLOODED": "냉정한 저격수", "SPEED DEMON": "번개 발", "THE BRICK WALL": "인간 장벽", "THE PICKPOCKET": "소매치기 장인", "OLD BUT GOLD": "왕년의 전설",
  SPD: "속도", JMP: "점프", SHOT: "슛", "3PT": "3점", DEF: "수비",
  "HOT HAND": "손이 뜨겁다", "ON FIRE AFTER 2 MAKES, NOT 3": "3골이 아니라 2골 연속이면 불붙음", INFERNO: "인페르노", "FIRE PILLAR KNOCKS HIM BACK, 10S ON FIRE": "불기둥으로 날려버리고 10초간 불붙음",
  "ICE VEINS": "강철 멘탈", "BIGGER PERFECT ZONE": "퍼펙트 판정이 넓다", "DEEP FREEZE": "꽁꽁", "ICE SPIKES FREEZE HIM": "얼음 가시로 얼려버림",
  "QUICK FEET": "날쌘 발", "TURBO LASTS TWICE AS LONG": "터보가 두 배 오래감", "THUNDER STEP": "번개 이동", "WARP TO THE RIM AND DUNK": "림으로 순간이동 덩크",
  "ROCK SOLID": "통곡의 벽", "DRIVES BOUNCE OFF HIM": "돌파는 튕겨내고 공을 턴다", EARTHQUAKE: "지진", "TWO QUAKES. JUMP BOTH": "땅이 두 번 울린다, 둘 다 점프로 피하기",
  "STICKY HANDS": "끈끈이 손", "LONGER STEAL WINDOW": "스틸 타이밍이 길다", "BLACK HOLE": "블랙홀", "SUCKS THE BALL INTO HIS HANDS": "공을 손으로 빨아들임",
  EXPERIENCE: "짬바", "SPECIAL METER FILLS 50% FASTER": "필살기 게이지가 1.5배 빨리 참", "TIME OUT": "타임아웃", "STOPS TIME, THEN A GRANNY SHOT": "시간을 멈추고 언더슛",
  "HEAT CHECK": "히트 체크", "FIRE CROSSOVER, THEN A BURST OF SPEED": "불꽃 크로스오버 후 가속", "ICE STEPBACK": "아이스 스텝백", "STEP BACK OFF AN ICE PATCH: AN OPEN SHOT": "얼음을 깔고 스텝백, 노마크 슛",
  BLINK: "블링크", "ZAP SIDEWAYS IN A FLASH": "옆으로 순간이동", BULLDOZE: "불도저", "SHOULDER HIM OUT OF THE WAY": "어깨로 밀어내기",
  PHANTOM: "팬텀", "FADE OUT, LEAVE A DECOY": "흐려지며 분신을 남김", "OLD MAN HESI": "할배 헤지테이션", "A PAUSE THAT FREEZES HIM": "멈칫! 상대도 굳는다",
  HELP_K: "이동 WASD/우클릭   슛 SPACE (꾹→꼭대기에서 떼기 · 톡=페이크 · 수비 땐 스틸/점프)   터보 SHIFT (꾹=질주 · 톡=돌파)   기술 Q   필살기 E   일시정지 ESC",
};
const T = (s) => (LANG === "ko" ? KO[s] ?? s : s);
const HELP_EN = "MOVE WASD / RIGHT CLICK   SHOOT SPACE (HOLD, LET GO AT THE TOP · TAP = FAKE · ON D: STEAL / JUMP)   TURBO SHIFT (HOLD = SPRINT · TAP = BURST)   TRICK Q   SPECIAL E   PAUSE ESC";
const TUNE = { speed: 1, cpuSkill: 1 };

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 200);
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener("resize", resize); resize();
const fx = createFx(scene);
initPix(scene);
const FIRE_PAL = ["#2a0602", "#7a1408", "#d8301a", "#ff6a1a", "#ffb02a", "#ffe86a", "#ffffff"];
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (x, z) => { const d = Math.hypot(x, z) || 1; return [x / d, z / d]; };
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

// ---------- the venue: a street court at dusk ----------
// the half court: x across (-7.5..7.5), z from the baseline (-7) to the half-court line (+7); the hoop near the baseline
const HW = 7.5, HL = 7, RIM = { x: 0, y: 3.05, z: -5.45 }, RIM_R = 0.4, THREE_R = 6.75, CORNER_X = 6.6, BR = 0.26;
const G = 18, BALL_G = 12;
const toRim = (p) => Math.hypot(p.x - RIM.x, p.z - RIM.z);
const isThree = (p) => (Math.abs(p.z - RIM.z) < 1.41 ? Math.abs(p.x) > CORNER_X : toRim(p) > THREE_R);
const crowd = [], lampLights = [];
let rim = null, net = null, board = null;
(function buildVenue() {
  // the sky: deep blue above, a burnt orange line at the horizon
  const sky = document.createElement("canvas"); sky.width = 4; sky.height = 256; const sg = sky.getContext("2d");
  const grd = sg.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, "#1b2347"); grd.addColorStop(0.55, "#4a3a6a"); grd.addColorStop(0.8, "#d96a4a"); grd.addColorStop(1, "#ffb26a");
  sg.fillStyle = grd; sg.fillRect(0, 0, 4, 256);
  const skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace; scene.background = skyTex;
  scene.fog = new THREE.Fog("#5a4466", 30, 75);
  // light: a low orange sun, a cool sky, two street lamps
  scene.add(new THREE.HemisphereLight("#9fb0ff", "#5a4040", 1.0));
  const sun = new THREE.DirectionalLight("#ffb27a", 1.9); sun.position.set(-14, 16, -4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 60 }); sun.shadow.bias = -0.0006; scene.add(sun);
  const back = new THREE.DirectionalLight("#7fa0ff", 0.55); back.position.set(10, 8, 14); scene.add(back);
  // the court: painted asphalt, a red key, worn white lines, cracks
  const PX = 48, cv = document.createElement("canvas"); cv.width = HW * 2 * PX; cv.height = HL * 2 * PX;
  const g = cv.getContext("2d"), X = (x) => (x + HW) * PX, Z = (z) => (z + HL) * PX;
  let seed = 7; const r01 = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = "#2f405c"; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 9000; i++) { g.fillStyle = r01() < 0.5 ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.08)"; g.fillRect(r01() * cv.width, r01() * cv.height, 2, 2); }
  g.fillStyle = "#c2452f"; g.fillRect(X(-2.45), Z(-HL), 4.9 * PX, 5.8 * PX);                                         // the key
  g.beginPath(); g.arc(X(0), Z(-HL + 5.8), 1.8 * PX, 0, Math.PI); g.fill();
  g.strokeStyle = "#f4efe4"; g.lineWidth = 4;
  const line = (f) => { g.beginPath(); f(); g.stroke(); };
  line(() => g.rect(3, 3, cv.width - 6, cv.height - 6));
  line(() => g.rect(X(-2.45), Z(-HL), 4.9 * PX, 5.8 * PX));
  line(() => g.arc(X(0), Z(-HL + 5.8), 1.8 * PX, 0, Math.PI * 2));
  const a = Math.asin(1.41 / THREE_R);
  line(() => { g.moveTo(X(-CORNER_X), Z(-HL)); g.lineTo(X(-CORNER_X), Z(RIM.z + 1.41)); g.arc(X(RIM.x), Z(RIM.z), THREE_R * PX, Math.PI - a, a, true); g.lineTo(X(CORNER_X), Z(-HL)); });
  line(() => g.arc(X(0), Z(HL), 1.8 * PX, Math.PI, Math.PI * 2));                                                  // the circle at half court
  line(() => g.arc(X(0), Z(RIM.z), 1.25 * PX, 0, Math.PI));                                                         // the restricted arc
  g.font = `bold ${1.1 * PX}px Impact, 'Arial Black', sans-serif`; g.textAlign = "center"; g.fillStyle = "rgba(244,239,228,.85)"; g.fillText("HOOPS", X(0), Z(HL - 0.35));
  // wear: gaps in the paint, and cracks through the asphalt
  for (let i = 0; i < 700; i++) { g.fillStyle = "rgba(47,64,92,.9)"; g.fillRect(r01() * cv.width, r01() * cv.height, 3 + r01() * 5, 2 + r01() * 3); }
  g.strokeStyle = "rgba(10,14,24,.55)"; g.lineWidth = 2;
  for (let i = 0; i < 14; i++) { let x = r01() * cv.width, y = r01() * cv.height; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r01() - 0.5) * 70; y += (r01() - 0.3) * 50; g.lineTo(x, y); } g.stroke(); }
  const ctex = new THREE.CanvasTexture(cv); ctex.colorSpace = THREE.SRGBColorSpace; ctex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const court = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, HL * 2), new THREE.MeshLambertMaterial({ map: ctex }));
  court.rotation.x = -Math.PI / 2; court.receiveShadow = true; scene.add(court);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshLambertMaterial({ color: "#3b3f4b" })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; scene.add(ground);
  // the hoop: a pole behind the baseline, an arm, the board, an orange rim, a net
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 3.9, 12), mat("#2a2f3f")); pole.position.set(0, 1.95, RIM.z - 2.0); pole.castShadow = true; scene.add(pole);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.6, 12), mat("#ff4f1f")); pad.position.set(0, 0.8, RIM.z - 2.0); scene.add(pad);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.5), mat("#2a2f3f")); arm.position.set(0, 3.75, RIM.z - 1.3); scene.add(arm);
  board = new THREE.Group();
  const bcv = document.createElement("canvas"); bcv.width = 256; bcv.height = 160; const bg = bcv.getContext("2d");
  bg.fillStyle = "#f4f4f6"; bg.fillRect(0, 0, 256, 160); bg.strokeStyle = "#14111c"; bg.lineWidth = 8; bg.strokeRect(4, 4, 248, 152);
  bg.strokeStyle = "#ff4f1f"; bg.lineWidth = 7; bg.strokeRect(84, 78, 88, 64);
  const btex = new THREE.CanvasTexture(bcv); btex.colorSpace = THREE.SRGBColorSpace;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 0.08), [mat("#d0d0d8"), mat("#d0d0d8"), mat("#d0d0d8"), mat("#d0d0d8"), new THREE.MeshLambertMaterial({ map: btex }), mat("#d0d0d8")]);
  board.add(glass); board.position.set(0, 3.6, RIM.z - 0.6); scene.add(board); glass.castShadow = true;
  rim = new THREE.Mesh(new THREE.TorusGeometry(RIM_R, 0.045, 8, 28), mat("#ff4f1f")); rim.rotation.x = Math.PI / 2; rim.position.set(RIM.x, RIM.y, RIM.z); scene.add(rim);
  net = new THREE.Mesh(new THREE.CylinderGeometry(RIM_R, RIM_R * 0.62, 0.7, 14, 4, true), new THREE.MeshBasicMaterial({ color: "#e8e8ee", wireframe: true })); net.position.set(RIM.x, RIM.y - 0.36, RIM.z); scene.add(net);
  // chain-link fence: behind the baseline and down both sides
  const fcv = document.createElement("canvas"); fcv.width = fcv.height = 64; const fg = fcv.getContext("2d");
  fg.strokeStyle = "#a9b2c4"; fg.lineWidth = 3; fg.beginPath(); fg.moveTo(0, 32); fg.lineTo(32, 0); fg.lineTo(64, 32); fg.lineTo(32, 64); fg.closePath(); fg.stroke();
  const ftexBase = new THREE.CanvasTexture(fcv); ftexBase.wrapS = ftexBase.wrapT = THREE.RepeatWrapping;
  const fence = (len, x, z, ry) => {
    const t = ftexBase.clone(); t.needsUpdate = true; t.repeat.set(len / 0.6, 4 / 0.6);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 4), new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide }));
    m.position.set(x, 2, z); m.rotation.y = ry; scene.add(m);
    const n = Math.round(len / 3);
    for (let i = 0; i <= n; i++) {
      const k = -len / 2 + (i / n) * len, px = x + Math.cos(ry) * k, pz = z - Math.sin(ry) * k;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.1, 8), mat("#6a7386")); post.position.set(px, 2.05, pz); scene.add(post);
    }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 8), mat("#6a7386")); rail.rotation.z = Math.PI / 2; rail.rotation.y = ry; rail.position.set(x, 4, z); scene.add(rail);
  };
  fence(19, 0, -9, 0); fence(17, -9.5, -0.5, Math.PI / 2); fence(17, 9.5, -0.5, Math.PI / 2);
  // a graffiti wall behind the fence
  const wcv = document.createElement("canvas"); wcv.width = 1600; wcv.height = 320; const wg = wcv.getContext("2d");
  wg.fillStyle = "#4b3f4f"; wg.fillRect(0, 0, 1600, 320);
  for (let y = 0; y < 320; y += 20) for (let x = (y / 20) % 2 ? 0 : 30; x < 1600; x += 60) { wg.fillStyle = `rgba(0,0,0,${0.12 + r01() * 0.12})`; wg.fillRect(x, y, 58, 18); }
  const tag = (text, x, y, size, fill, out, rot) => {
    wg.save(); wg.translate(x, y); wg.rotate(rot); wg.font = `${size}px Impact, 'Arial Black', sans-serif`; wg.textAlign = "center"; wg.textBaseline = "middle";
    wg.lineJoin = "round"; wg.lineWidth = size * 0.22; wg.strokeStyle = "#14111c"; wg.strokeText(text, 0, 0); wg.lineWidth = size * 0.1; wg.strokeStyle = out; wg.strokeText(text, 0, 0);
    wg.fillStyle = fill; wg.fillText(text, 0, 0);
    for (let i = 0; i < 6; i++) { wg.fillStyle = fill; wg.fillRect(-size * 1.2 + r01() * size * 2.4, size * 0.35, 4, 10 + r01() * 40); }   // drips
    wg.restore();
  };
  for (let i = 0; i < 40; i++) { wg.fillStyle = pick(["#ff4f1f55", "#3fd0ff55", "#ffd21f55", "#9a7cff55", "#3ee07f55"]); wg.beginPath(); wg.arc(r01() * 1600, r01() * 320, 10 + r01() * 50, 0, 7); wg.fill(); }
  tag("HOOPS", 800, 150, 190, "#ffd21f", "#ff4f1f", -0.04); tag("1 ON 1", 300, 160, 110, "#3fd0ff", "#ffffff", 0.06); tag("NO REFS", 1300, 150, 100, "#ff4f1f", "#ffd21f", -0.05);
  const wtex = new THREE.CanvasTexture(wcv); wtex.colorSpace = THREE.SRGBColorSpace;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(36, 7, 0.6), [mat("#3a3040"), mat("#3a3040"), mat("#3a3040"), mat("#3a3040"), new THREE.MeshLambertMaterial({ map: wtex }), mat("#3a3040")]);
  wall.position.set(0, 3.5, -13); wall.receiveShadow = true; scene.add(wall);
  // the city behind it: blocks with lit windows
  const win = document.createElement("canvas"); win.width = 64; win.height = 128; const wn = win.getContext("2d");
  wn.fillStyle = "#1d1f33"; wn.fillRect(0, 0, 64, 128);
  for (let y = 6; y < 128; y += 12) for (let x = 6; x < 64; x += 12) { wn.fillStyle = r01() < 0.35 ? (r01() < 0.7 ? "#ffd78a" : "#9fd8ff") : "#2a2c44"; wn.fillRect(x, y, 6, 7); }
  const wtx = new THREE.CanvasTexture(win); wtx.colorSpace = THREE.SRGBColorSpace; wtx.wrapS = wtx.wrapT = THREE.RepeatWrapping;
  for (let i = 0; i < 14; i++) {
    const w = rnd(5, 10), h = rnd(10, 28), d = rnd(5, 9), t = wtx.clone(); t.needsUpdate = true; t.repeat.set(w / 6, h / 12);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ map: t, fog: true }));
    b.position.set(-38 + i * 6 + rnd(-1, 1), h / 2, -24 - rnd(0, 12)); scene.add(b);
  }
  // street lamps
  for (const x of [-9.5, 9.5]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 6.5, 10), mat("#2a2f3f")); p.position.set(x, 3.25, -8.4); scene.add(p);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.4), mat("#2a2f3f")); head.position.set(x - Math.sign(x) * 0.4, 6.5, -8.4); scene.add(head);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.3), new THREE.MeshBasicMaterial({ color: "#ffe2a8" })); bulb.position.set(x - Math.sign(x) * 0.4, 6.38, -8.4); scene.add(bulb);
    const L = new THREE.PointLight("#ffcf8a", 22, 18, 1.6); L.position.set(x - Math.sign(x) * 0.6, 6.2, -8); scene.add(L); lampLights.push(L);
  }
  // a bench and a boombox by the side
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), mat("#8a5a32")); bench.position.set(-8.6, 0.5, 2); scene.add(bench);
  for (const dx of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.45), mat("#2a2f3f")); l.position.set(-8.6 + dx * 1.05, 0.25, 2); scene.add(l); }
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.25), mat("#14111c")); box.position.set(-8.2, 0.72, 2); scene.add(box);
  for (const dx of [-0.17, 0.17]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 14), mat("#ffd21f")); s.rotation.x = Math.PI / 2; s.position.set(-8.2 + dx, 0.72, 2.13); scene.add(s); }
  // people watching through the fence
  const shirts = ["#ff4f1f", "#3fd0ff", "#ffd21f", "#9a7cff", "#3ee07f", "#f4efe4", "#e84a8a", "#2a2f3f"], skins = ["#f0c8a8", "#d79a6a", "#8d5a3b", "#6b4a3a"];
  const spots = [];
  for (let i = 0; i < 9; i++) spots.push([-8 + i * 2 + rnd(-0.4, 0.4), -10.2 - rnd(0, 0.6)]);
  for (let i = 0; i < 5; i++) { spots.push([-10.8 - rnd(0, 0.5), -6 + i * 2.8]); spots.push([10.8 + rnd(0, 0.5), -6 + i * 2.8]); }
  for (const [x, z] of spots) {
    const gp = new THREE.Group(), body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 4, 10), mat(pick(shirts))), headM = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), mat(pick(skins)));
    body.position.y = 0.95; headM.position.y = 1.65; gp.add(body, headM); gp.position.set(x, 0, z); gp.lookAt(0, 0, 0); scene.add(gp);
    crowd.push({ g: gp, ph: Math.random() * 6.28 });
  }
})();

// ---------- the ballers and the ball ----------
const NONE = { mx: 0, mz: 0, shoot: false, shootHeld: false, turbo: false, turboHeld: false, trick: false, special: false };
let players = [];
function makePlayer(i, ci) {
  const ch = CHARS[ci], body = makeBaller(ch); scene.add(body.root);
  return { i, name: ch.name, ch, body, x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0, onGround: true, face: [0, -1], score: 0, streak: 0, fire: false, fireT: 0, aura: null,
    shooting: false, shootT: 0, gather: 0, fakeT: 0, bitDone: false, dashT: 0, dashCd: 0, dashV: [0, -1], dashRolled: false, dunkWin: 0, ghostT: 0, sprint: false,
    hand: 1, crossT: 0, followT: 0, landA: 0, turbo: 1, sp: 0.25, charge: null, quakeT: 0, frozen: 0, frozenKind: "", granny: false,
    moveT: 0, moveV: [0, 0], moveCd: 0, spinT: 0, safeT: 0, openT: 0, boostT: 0, slowT: 0, phantomT: 0, hesiT: 0, decoy: null,
    fallen: 0, whiff: 0, cd: 0, stun: 0, landT: 0, dunk: null, hang: 0, walk: 0, celebrate: 0, winner: false, loser: false, ai: { t: 0 } };
}
const other = (p) => players[1 - p.i];
const toward = (p) => norm(RIM.x - p.x, RIM.z - p.z);
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 18, 14), mat("#f07a1a")); ballMesh.castShadow = true; scene.add(ballMesh);
{ // the ball's seams and an ink outline
  const seam = new THREE.MeshBasicMaterial({ color: "#3a1a08" });
  for (const r of [0, Math.PI / 2]) { const t = new THREE.Mesh(new THREE.TorusGeometry(BR * 1.005, 0.012, 4, 24), seam); t.rotation.y = r; ballMesh.add(t); }
  const t2 = new THREE.Mesh(new THREE.TorusGeometry(BR * 1.005, 0.012, 4, 24), seam); t2.rotation.x = Math.PI / 2; ballMesh.add(t2);
  ballMesh.add(new THREE.Mesh(new THREE.SphereGeometry(BR * 1.09, 14, 10), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })));
}
const ballShadow = new THREE.Mesh(new THREE.CircleGeometry(BR, 16), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.4, depthWrite: false }));
ballShadow.rotation.x = -Math.PI / 2; scene.add(ballShadow);
const ball = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, owner: null, live: false, shooter: null, made: false, t: 0, T: 1, pts: 2, resolved: true, quality: "", homing: null, noCatchT: 0, lastShooter: null };
const stealRing = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.52, 24), new THREE.MeshBasicMaterial({ color: "#ffd21f", transparent: true, depthTest: false }));
stealRing.renderOrder = 5; scene.add(stealRing);
// the arc lights up while the ball has to be cleared
const clearArc = new THREE.Mesh(new THREE.RingGeometry(THREE_R - 0.07, THREE_R + 0.07, 64, 1, Math.PI * 1.07, Math.PI * 0.86), new THREE.MeshBasicMaterial({ color: "#ffd21f", transparent: true, opacity: 0.8, depthWrite: false }));
clearArc.rotation.x = -Math.PI / 2; clearArc.position.set(RIM.x, 0.03, RIM.z); scene.add(clearArc);

// ---------- sound ----------
let ac = null, muted = localStorage.getItem("hoops3d.mute") === "1";
const audio = () => { try { if (!ac) ac = new AudioContext(); if (ac.state === "suspended") ac.resume(); } catch {} };
function beep(f, d = 0.08, type = "square", vol = 0.05, slide = 0, delay = 0) {
  if (!ac || muted) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.linearRampToValueAtTime(f + slide, t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(d = 0.2, vol = 0.08, freq = 1200) {
  if (!ac || muted) return; const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = "bandpass"; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f).connect(g).connect(ac.destination); s.start();
}
const sfx = {
  bounce: () => { beep(95, 0.08, "sine", 0.2, -35); noise(0.04, 0.06, 500); }, swish: () => noise(0.3, 0.22, 5200), rim: () => { beep(523, 0.3, "triangle", 0.06, -8); noise(0.05, 0.08, 4000); },
  whoosh: () => noise(0.12, 0.08, 1600), steal: () => { noise(0.08, 0.12, 2500); beep(200, 0.1, "sawtooth", 0.05, -120); }, crack: () => { noise(0.1, 0.2, 900); beep(80, 0.2, "square", 0.08, -40); },
  perfect: () => { beep(1046, 0.08, "square", 0.05); beep(1568, 0.14, "square", 0.05, 0, 0.06); }, block: () => { beep(120, 0.15, "square", 0.1, -60); noise(0.1, 0.15, 800); },
  cheer: (k = 1) => noise(0.8 + k * 0.5, 0.12 + k * 0.06, 1100), whistle: () => { beep(2400, 0.3, "sine", 0.06); beep(2500, 0.3, "sine", 0.04); },
  cue: () => { beep(1568, 0.05, "triangle", 0.06); beep(2093, 0.07, "triangle", 0.05, 0, 0.05); }, warn: () => { beep(330, 0.09, "square", 0.05); beep(247, 0.14, "square", 0.05, 0, 0.1); },
  dunk: () => { beep(70, 0.3, "sine", 0.25, -30); noise(0.2, 0.2, 400); }, click: () => beep(880, 0.04, "square", 0.04), lock: () => { beep(660, 0.08, "square", 0.05); beep(990, 0.12, "square", 0.05, 0, 0.08); },
  firework: () => { noise(0.3, 0.1, 3000); beep(rnd(300, 600), 0.2, "triangle", 0.03, 400); }, fire: () => { noise(0.6, 0.16, 700); beep(110, 0.6, "sawtooth", 0.06, 200); },
};
// the announcer: a few big calls, spoken in the browser's own voice, never two at once
let lastCall = 0;
function call(lines, force = false) {
  if (muted || !("speechSynthesis" in window)) return;
  const now = performance.now(); if (!force && now - lastCall < 1500) return; lastCall = now;
  try { const u = new SpeechSynthesisUtterance(Array.isArray(lines) ? pick(lines) : lines); u.lang = "en-US"; u.rate = 1.12; u.pitch = 0.75; u.volume = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {}
}
const CALLS = {
  dunk: ["Slam!", "Oh, he threw it down!", "With authority!"], three: ["From downtown!", "Bang!", "Splash!"], two: ["Bucket.", "Nothing but net.", "Money."],
  block: ["Rejected!", "Get that outta here!", "Not in here!"], steal: ["Picked his pocket!", "Stolen!"], fire: ["He's heating up!", "He's red hot!"],
  gamePoint: ["Game point!"], win: ["Ballgame!", "That's the game!"], check: ["Check ball."], noClear: ["Gotta clear it!"], fake: ["Up fake... he bit!"],
};

// ---------- words on screen: only the big moments ----------
const fxEl = document.getElementById("fx"), cueEl = document.getElementById("cue"), meterEl = document.getElementById("meter"), centerEl = document.getElementById("center"), bannerEl = document.getElementById("banner");
const pops = [];
function pop(text, x, y, z, color = "#fff", big = false) {
  if (pops.some((f) => f.text === text && f.t < 0.35)) return;
  if (pops.length > 5) { pops[0].el.remove(); pops.shift(); }
  const el = document.createElement("div"); el.className = "pop" + (big ? " big" : ""); el.textContent = T(text); el.style.color = color; fxEl.appendChild(el);
  pops.push({ el, text, x, y, z, t: 0, life: big ? 1.1 : 0.8 });
}
const say = (p, text, color = "#fff", big = false) => pop(text, p.x, p.y + 2.9, p.z, color, big);
let bannerT = 0;
function banner(text, color = "#ffd21f", sub = "") { bannerEl.innerHTML = `<b style="color:${color}">${T(text)}</b>${sub ? `<small>${sub}</small>` : ""}`; bannerEl.classList.remove("on"); void bannerEl.offsetWidth; bannerEl.classList.add("on"); bannerT = 1.6; }
const v3 = new THREE.Vector3();
function toScreen(x, y, z) { v3.set(x, y, z).project(camera); return [(v3.x * 0.5 + 0.5) * innerWidth, (-v3.y * 0.5 + 0.5) * innerHeight]; }

// ---------- the match state ----------
let screen = "menu", phase = "menu", stateT = 0, worldT = 0, hype = 0, poss = 0, cleared = true, lastScorer = null, mode = "quick", target = 11, nextCheck = 0;
let pickI = 0, cpuI = 1, locked = false;
const tourBest = () => +(localStorage.getItem("hoops3d.tour") ?? 0);
let tour = null;                                                // { order: [char ids], round, me }
const cpuLevel = () => (mode === "tour" && tour ? 0.75 + tour.round * 0.12 : 1) * TUNE.cpuSkill;
let rimWob = 0, netT = 0, meterFlash = "";
const timers = [];
const later = (t, fn) => timers.push({ t, fn });

// ---------- rules of contact ----------
const committed = (d) => d.whiff > 0 || d.landT > 0 || d.dashT > 0 || (!d.onGround && !d.dunk);
const busy = (p) => p.fallen > 0 || p.frozen > 0 || p.stun > 0 || p.dunk || p.hang > 0;
const busyShot = (p) => p.shooting || p.gather > 0 || p.charge || p.moveT > 0;
const gainSp = (p, v) => { p.sp = Math.min(1, p.sp + v * (p.ch.name === "GRAMPS" ? 1.5 : 1)); };
const perfectZone = (p) => 0.9 * (p.ch.name === "FROST" ? 1.6 : 1);
const fireAt = (p) => (p.ch.name === "BLAZE" ? 2 : 3);
function stealPhase(p, opp) {
  const cyc = opp.dashT > 0 ? 0.65 : 0.95, t = (worldT + opp.i * 0.37) % cyc;
  const win = (isTouch && p.i === 0 ? 0.36 : 0.3) + (p.ch.def - 1) * 0.25 + (p.ch.name === "SHADE" ? 0.12 : 0);
  const open = t >= cyc - win || t < 0.07, warn = !open && t >= cyc - win - 0.4 ? (t - (cyc - win - 0.4)) / 0.4 : 0;
  return { open, warn };
}
const inReach = (p, o) => flat(p, o) < 1.35 && Math.abs(p.y - o.y) < 1;
const stealOpen = (p, opp) => ball.owner === opp && !opp.shooting && !opp.dunk && opp.gather <= 0 && opp.fakeT <= 0 && opp.safeT <= 0 && opp.onGround && inReach(p, opp) && stealPhase(p, opp).open;
const goOpen = (a) => { const d = other(a); return ball.owner === a && a.onGround && !busyShot(a) && (a.turbo >= 0.25 || a.fire) && flat(a, d) < 2.6 && committed(d) && d.fallen <= 0 && d.ch.name !== "TANK"; };
function contest(p, d) {
  const dist = flat(p, d); if (d.fallen > 0 || d.frozen > 0 || dist > 1.8) return 0;
  if (!d.onGround) return d.vy > -1 && dist < 1.3 ? 1 : 0.15;
  if (d.landT > 0 || d.whiff > 0) return 0.1;
  return dist < 1.3 ? 0.55 * d.ch.def : 0.15;
}
function canDunk(p) {
  const d = toRim(p), [tx, tz] = toward(p), sp = Math.hypot(p.vx, p.vz), dir = sp > 0.1 ? (p.vx * tx + p.vz * tz) / sp : 0;
  return p.onGround && (p.dunkWin > 0 || (p.sprint && sp > 5)) && d < 4.2 && d > 0.9 && dir > 0.55;
}
// check ball at the top of the key: offense with the ball, defense in front of him
function checkBall(i) {
  poss = i; cleared = true; phase = "check"; stateT = 0;
  const off = players[i], def = other(off);
  for (const p of players) Object.assign(p, { y: 0, vx: 0, vz: 0, vy: 0, onGround: true, shooting: false, gather: 0, fakeT: 0, dashT: 0, fallen: 0, whiff: 0, stun: 0, dunk: null, hang: 0,
    landT: 0, celebrate: 0, frozen: 0, moveT: 0, spinT: 0, granny: false, openT: 0, charge: null });
  off.x = 0; off.z = 5.4; def.x = 0; def.z = 3.7; off.face = [0, -1]; def.face = [0, 1];
  Object.assign(ball, { owner: off, live: false, shooter: null, made: false, resolved: true, homing: null });
  board.visible = true;
  banner("CHECK BALL", "#ffffff", `${off.name}${LANG === "ko" ? " 공격" : "'S BALL"}`); call(CALLS.check);
}
// a change of possession during play: the new man must take it out past the arc
function newOwner(p) {
  if (p.i === poss) return;
  poss = p.i; cleared = isThree(p);
}
function startDash(p, dv) {
  const cost = p.fire ? 0 : p.ch.name === "VOLT" ? 0.15 : 0.3;
  if (p.turbo < cost) return;
  p.turbo -= cost; p.dashT = 0.2; p.dunkWin = isTouch && p.i === 0 ? 0.55 : 0.35; p.dashV = dv; p.face = dv; p.dashRolled = ball.owner !== p; p.dashCd = 0.25;
  sfx.whoosh(); fx.dust(p.x, p.z, 8);
}
function dashContact(p) {
  const d = other(p);
  if (p.dashRolled || ball.owner !== p || d.fallen > 0 || flat(p, d) > 0.85) return;
  p.dashRolled = true;
  if (committed(d) && d.ch.name !== "TANK") {
    d.stun = Math.max(d.stun, 0.3); say(p, "BLOW BY!", "#ffd21f"); fx.ring(d.x, d.z, p.ch.col, 1.6, 0.35); fx.dust(d.x, d.z, 10); fx.impact({ slow: 0.25, punch: 0.3 }); hype = Math.max(hype, 0.6);
  } else {
    p.dashT = 0; p.vx = -p.dashV[0] * 3; p.vz = -p.dashV[1] * 3; p.stun = d.ch.name === "TANK" ? 0.45 : 0.2;
    pix(PFX.bluntHit, [(p.x + d.x) / 2, 1.2, (p.z + d.z) / 2], { ground: false, w: 96, h: 96, scale: 0.7 }); fx.impact({ stop: 0.05, shake: 0.2 });
    if (Math.random() < (d.ch.name === "TANK" ? 0.75 : 0.5)) { looseBall(p, -p.dashV[0] * 2, 3, -p.dashV[1] * 2); say(p, "STRIPPED!", "#ff3b4e"); }
    else say(d, "WALL", "#c8c0dc");
  }
}
function looseBall(p, vx, vy, vz) { const [x, y, z] = heldPos(p); Object.assign(ball, { owner: null, live: false, shooter: null, x, y, z, vx, vy, vz }); }
function trySteal(p, opp) {
  p.cd = 0.7; p.face = norm(opp.x - p.x, opp.z - p.z);
  if (!stealOpen(p, opp)) { p.whiff = p.ch.name === "SHADE" ? 0.2 : 0.45; sfx.whoosh(); return; }
  const dx = p.x - opp.x, dz = p.z - opp.z, d = Math.hypot(dx, dz) || 1, [bx, by, bz] = heldPos(opp);
  looseBall(opp, (dx / d) * 2.5, 3, (dz / d) * 2.5); opp.stun = 0.45;
  say(p, "STEAL!", "#ffd21f", true); sfx.steal(); hype = Math.max(hype, 0.7); gainSp(p, 0.2); call(CALLS.steal);
  pix(PFX.hitSpark, [bx, by, bz], { ground: false, w: 96, h: 96, flip: dx < 0 });
  if (p.ch.name === "SHADE") pix(PFX.shadowTendrils, [bx, 0, bz], { w: 112, h: 96, life: 0.6 });
  fx.impact({ stop: 0.07, shake: 0.2, punch: 0.3 });
}
function startShot(p) {
  p.shooting = true; p.shootT = 0; p.face = toward(p);
  if (p.onGround) { p.vy = 6.2 * p.ch.jmp; p.onGround = false; p.vx *= 0.3; p.vz *= 0.3; }
}
function release(p, forced = false) {
  const d = toRim(p), def = other(p);
  const q = forced || Math.abs(p.vy) <= perfectZone(p) ? "perfect" : Math.abs(p.vy) <= 2.4 ? "good" : p.vy > 0 ? "early" : "late";
  const cont = forced ? 0 : contest(p, def) * (p.openT > 0 ? 0.35 : 1);
  let k = d < 2 ? 0.75 : !isThree(p) ? (0.62 - (d - 2) * 0.03) * p.ch.shot : (0.44 - (d - THREE_R) * 0.05) * p.ch.three;
  k *= 1 - cont * 0.6; k *= { perfect: 1.45, good: 1, early: 0.35, late: 0.35 }[d < 2 && q !== "perfect" ? "good" : q];
  if (p.fire) k *= 1.3;
  const made = Math.random() < (forced ? 0.92 : clamp(k, 0.03, 0.97));
  const [sx, sy, sz] = heldPos(p), [ox, oz] = norm(sx - RIM.x, sz - RIM.z), miss = Math.random() < 0.6 ? RIM_R : -RIM_R;
  const tx = made ? RIM.x : RIM.x + ox * miss + rnd(-0.08, 0.08), tz = made ? RIM.z : RIM.z + oz * miss + rnd(-0.12, 0.12), ty = RIM.y + 0.05;
  const Tt = (0.7 + d * 0.06) * (forced ? 1.45 : 1);
  Object.assign(ball, { owner: null, live: true, shooter: p, made, t: 0, T: Tt, pts: isThree(p) ? 3 : 2, resolved: false, x: sx, y: sy, z: sz, quality: q,
    vx: (tx - sx) / Tt, vy: (ty - sy + 0.5 * BALL_G * Tt * Tt) / Tt, vz: (tz - sz) / Tt });
  sfx.whoosh(); p.followT = 0.4; p.openT = 0;
  if (forced) return;
  if (p.i === 0) meterFlash = q;
  if (q === "perfect") { sfx.perfect(); pix(PFX.collect, [sx, sy, sz], { ground: false, w: 80, h: 80, scale: 0.7 }); }
}
function startDunk(p) {
  const [tx, tz] = norm(p.x - RIM.x, p.z - RIM.z);
  p.dunk = { t: 0, dur: 0.5, fx: p.x, fz: p.z, tx: RIM.x + tx * 0.5, tz: RIM.z + tz * 0.5, contested: false };
  p.onGround = false; p.dashT = 0; p.face = [-tx, -tz]; sfx.whoosh(); fx.dust(p.x, p.z, 12);
}
function updateDunk(p, dt) {
  const d = p.dunk, def = other(p); d.t += dt;
  const k = Math.min(1, d.t / d.dur);
  p.x = d.fx + (d.tx - d.fx) * k; p.z = d.fz + (d.tz - d.fz) * k; p.y = Math.sin((k * Math.PI) / 2) * 1.45;
  if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.05; fx.ghost(p.body.root, p.ch.col); }
  if (!def.onGround && flat(def, p) < 1.1 && def.y > 0.5) d.contested = true;
  if (k < 1) return;
  p.dunk = null;
  if (Math.random() < (d.contested ? 0.45 : 0.96)) {
    p.hang = 0.45; Object.assign(ball, { owner: null, live: false, shooter: null, x: RIM.x, y: RIM.y - 0.1, z: RIM.z, vx: 0, vy: -3, vz: 0 });
    rimWob = 1.5;
    const glass = Math.random() < 0.1;
    pix(PFX.groundSlam, [d.tx, 0, d.tz], { w: 192, h: 128 }); pix(PFX.critHit, [RIM.x, RIM.y, RIM.z], { ground: false, w: 128, h: 128 });
    if (glass) { board.visible = false; fx.burst(RIM.x, 3.6, RIM.z - 0.6, 70, ["#c8e8ff", "#ffffff", "#8cc8f0"], 6, 1.5, { size: 0.1 }); fx.impact({ stop: 0.3, slow: 0.8, shake: 0.8, punch: 1 }); }
    else fx.impact({ stop: 0.18, slow: d.contested ? 0.5 : 0.25, shake: 0.55, punch: 0.9 });
    sfx.dunk(); score(p, 2, "SLAM!", true);
  } else {
    looseBall(p, -def.face[0] * 3, 1, -def.face[1] * 3); p.fallen = 0.6; say(def, "BLOCK!", "#ffd21f", true); sfx.block(); hype = 1; call(CALLS.block);
    pix(PFX.critHit, [p.x, p.y + 2.2, p.z], { ground: false, w: 128, h: 128 }); fx.impact({ stop: 0.16, shake: 0.5, punch: 0.6 });
  }
}
// a basket: points, the streak, maybe fire, the crowd, the announcer, then check ball the other way
function score(p, pts, word, dunk = false) {
  const o = other(p);
  if (!cleared && p.i === poss) {
    // made it without clearing: it doesn't count, and the ball goes over
    banner("NO CLEAR", "#ff3b4e"); call(CALLS.noClear, true); phase = "scored"; stateT = 0; nextCheck = o.i; return;
  }
  p.score += pts; p.streak = lastScorer === p ? p.streak + 1 : 1; o.streak = 0; lastScorer = p; phase = "scored"; stateT = 0; hype = 1; p.celebrate = 1.5; nextCheck = o.i;
  gainSp(p, 0.25); gainSp(o, 0.15); netT = 1;
  if (o.fire && o.fireT <= 0) { o.fire = false; banner("FIRE OUT", "#9aa0b4"); }
  pop(`+${pts}`, RIM.x, RIM.y + 1.1, RIM.z, pts === 3 ? "#ffd21f" : "#ffffff", true);
  if (dunk) pop(word, RIM.x, RIM.y + 1.9, RIM.z, p.ch.col, true);
  sfx.swish(); sfx.cheer(dunk || pts === 3 ? 2 : 1);
  pix(PFX.collect, [RIM.x, RIM.y - 0.2, RIM.z], { ground: false, w: 96, h: 96 });
  const n = dunk || pts === 3 ? 2 : 0;
  for (let i = 0; i < n; i++) later(0.15 + i * 0.3, () => { pix(PFX.firework, [rnd(-5, 5), rnd(6, 8), rnd(-9, -7)], { ground: false, w: 160, h: 160, scale: 1.4 }); sfx.firework(); });
  if (!p.fire && p.streak >= fireAt(p)) light(p);
  else call(dunk ? CALLS.dunk : pts === 3 ? CALLS.three : CALLS.two);
  if (p.score < target && p.score >= target - 2) later(1.0, () => call(CALLS.gamePoint, true));
}
function light(p, t = 0) {
  if (!p.fire) { banner("ON FIRE", "#ff6a1a", p.name); call(CALLS.fire, true); sfx.fire(); pix(PFX.fireRing, [p.x, 0, p.z], { w: 192, h: 96 }); fx.impact({ slow: 0.35, punch: 0.4 }); }
  p.fire = true; p.fireT = Math.max(p.fireT, t);
}

// ---------- signature dribbles (TRICK) ----------
const SIG = {
  BLAZE: { name: "HEAT CHECK", desc: "FIRE CROSSOVER, THEN A BURST OF SPEED", cost: 0.25, cd: 0.9 },
  FROST: { name: "ICE STEPBACK", desc: "STEP BACK OFF AN ICE PATCH: AN OPEN SHOT", cost: 0.3, cd: 1 },
  VOLT: { name: "BLINK", desc: "ZAP SIDEWAYS IN A FLASH", cost: 0.2, cd: 0.6 },
  TANK: { name: "BULLDOZE", desc: "SHOULDER HIM OUT OF THE WAY", cost: 0.3, cd: 1 },
  SHADE: { name: "PHANTOM", desc: "FADE OUT, LEAVE A DECOY", cost: 0.35, cd: 1.6 },
  GRAMPS: { name: "OLD MAN HESI", desc: "A PAUSE THAT FREEZES HIM", cost: 0.25, cd: 1.3 },
};
const patches = [];
function trick(p) {
  const d = other(p), sig = SIG[p.ch.name];
  if (ball.owner !== p || !p.onGround || busyShot(p) || p.moveCd > 0 || p.dashT > 0 || busy(p)) return;
  if (p.turbo < sig.cost && !p.fire) return;
  if (!p.fire) p.turbo -= sig.cost; p.moveCd = sig.cd;
  const [fx_, fz] = p.face, sx = -fz, sz = fx_, th = toward(p), close = flat(p, d) < 2;
  if (close) gainSp(p, 0.06);
  switch (p.ch.name) {
    case "BLAZE": {
      p.hand = -p.hand; p.crossT = 0.18; p.safeT = 0.35; p.moveT = 0.18; p.boostT = 1.2;
      p.moveV = [sx * p.hand * 7 + th[0] * 2, sz * p.hand * 7 + th[1] * 2];
      pix(PFX.fireRing, [p.x, 0, p.z], { w: 160, h: 80, scale: 0.7 }); sfx.whoosh(); sfx.bounce();
      if (close && d.fallen <= 0) d.stun = 0.3;
      break;
    }
    case "FROST": {
      const away = close ? norm(p.x - d.x, p.z - d.z) : [-th[0], -th[1]];
      const m = new THREE.Mesh(new THREE.CircleGeometry(1.1, 20), new THREE.MeshLambertMaterial({ color: "#bfefff", transparent: true, opacity: 0.75 }));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.025, p.z); scene.add(m); patches.push({ x: p.x, z: p.z, t: 3, mesh: m, from: p });
      p.moveT = 0.22; p.moveV = [away[0] * 6.5, away[1] * 6.5]; p.openT = 1.2; p.face = th;
      pix(PFX.frostNova, [p.x, 0, p.z], { w: 160, h: 96, scale: 0.8 }); sfx.whoosh(); break;
    }
    case "VOLT": {
      const lat = (p.wantX ?? 0) * sx + (p.wantZ ?? 0) * sz, side = Math.abs(lat) > 0.3 ? Math.sign(lat) : ((d.x - p.x) * sx + (d.z - p.z) * sz > 0 ? -1 : 1);
      const ox = p.x, oz = p.z; fx.ghost(p.body.root, p.ch.col);
      p.x = clamp(p.x + sx * side * 2.6 + th[0] * 0.8, -HW + 0.3, HW - 0.3); p.z = clamp(p.z + sz * side * 2.6 + th[1] * 0.8, -HL + 0.3, HL - 0.3);
      p.hand = side; p.safeT = 0.4;
      pix(PFX.blinkOut, [ox, 0, oz], { w: 96, h: 112 }); pix(PFX.blinkIn, [p.x, 0, p.z], { w: 96, h: 112 }); noise(0.08, 0.12, 5000); beep(1400, 0.06, "square", 0.04, -600); break;
    }
    case "TANK": {
      p.moveT = 0.3; p.moveV = [th[0] * 4.2, th[1] * 4.2]; p.safeT = 0.45; p.face = th;
      const ahead = (d.x - p.x) * th[0] + (d.z - p.z) * th[1];
      if (flat(p, d) < 1.5 && ahead > 0 && d.fallen <= 0) {
        d.vx = th[0] * 6; d.vz = th[1] * 6; d.stun = 0.4;
        pix(PFX.bluntHit, [d.x, 1.2, d.z], { ground: false, w: 96, h: 96 }); fx.impact({ stop: 0.08, shake: 0.4, punch: 0.3 }); beep(60, 0.25, "sine", 0.25, -20);
      }
      fx.dust(p.x, p.z, 10); break;
    }
    case "SHADE": {
      fx.ghost(p.body.root, "#9a7cff");
      p.phantomT = 1.0; p.safeT = 1.0; p.decoy = { x: p.x, z: p.z, t: 0.9 };
      pix(PFX.smokeBomb, [p.x, 0, p.z], { w: 160, h: 112 }); beep(600, 0.4, "sine", 0.05, -400); break;
    }
    case "GRAMPS": {
      p.hesiT = 0.35; p.boostT = 1.1;
      if (flat(p, d) < 2.4 && d.fallen <= 0) { d.stun = 0.6; pix(PFX.exclamation, [d.x, 0, d.z], { follow: d, w: 64, h: 128, life: 0.7 }); }
      beep(1568, 0.3, "sine", 0.05); break;
    }
  }
}
function updatePatches(dt) {
  for (let i = patches.length - 1; i >= 0; i--) {
    const pt = patches[i]; pt.t -= dt; pt.mesh.material.opacity = Math.min(0.75, pt.t);
    const o = other(pt.from);
    if (Math.hypot(o.x - pt.x, o.z - pt.z) < 1.1 && o.onGround && !(o.slowT > 0)) { o.slowT = 1.0; fx.burst(o.x, 0.2, o.z, 8, "#ffffff", 2, 0.4); }
    if (pt.t <= 0) { scene.remove(pt.mesh); patches.splice(i, 1); }
  }
}

// ---------- specials: a wind-up you can see, then the move; the target can get out of it ----------
const WIND_UP = 0.6;
const cutinEl = document.getElementById("cutin");
function trySpecial(p) {
  if (p.sp < 1 || busy(p) || p.shooting || p.charge || phase !== "play") return;
  if (p.ch.name === "SHADE" && ball.owner === p) return;
  p.sp = 0; p.charge = { t: WIND_UP, dur: WIND_UP };
  other(p).ai.dodge = Math.random() < 0.3 + 0.2 * cpuLevel();
  beep(180, WIND_UP, "sawtooth", 0.045, 520); noise(WIND_UP, 0.06, 900);
  fx.impact({ slow: 0.25, punch: 0.4 }); call(p.ch.special.toLowerCase(), true);
  pix(p.ch.name === "VOLT" ? PFX.chargeUp : PFX.spellCharge, [p.x, 0, p.z], { follow: p, w: 112, h: 128, life: WIND_UP, palette: p.ch.name === "BLAZE" ? FIRE_PAL : undefined });
  cutinEl.style.setProperty("--c", p.ch.col);
  cutinEl.innerHTML = `<div><small>${p.name}</small><b>${T(p.ch.special)}</b></div>`;
  cutinEl.className = p.i ? "ui r on" : "ui on"; clearTimeout(cutinEl.t); cutinEl.t = setTimeout(() => (cutinEl.className = p.i ? "ui r" : "ui"), 900);
}
function dodgeHow(p) {
  const o = other(p), n = p.ch.name, d = flat(p, o);
  if (n === "SHADE") return ball.owner === o ? "DASH!" : null;
  if (n === "BLAZE") return d < 4.5 ? "GET AWAY!" : null;
  if (n === "VOLT") return ball.owner === p && d > 2.5 ? null : "JUMP!";
  if (n === "GRAMPS") return ball.owner === p ? "JUMP!" : null;
  return d < 13 ? "JUMP!" : null;
}
function dangerFor(me) {
  const o = other(me);
  if (o.charge) { const how = dodgeHow(o); return how && { how }; }
  if (o.quakeT > 0 && o.quakeT < 0.4 && me.onGround) return { how: "JUMP!" };
  return teeth.some((t) => t.from === o && flat(t, me) < 4 && ((me.x - t.x) * t.vx + (me.z - t.z) * t.vz) > 0) ? { how: "JUMP!" } : null;
}
function freeze(o, t, kind) {
  if (kind === "ice") pix(PFX.freeze, [o.x, 0, o.z], { w: 96, h: 128, life: t });
  o.frozen = t; o.frozenKind = kind; o.vx = o.vz = 0; o.dunk = null; o.shooting = false; o.gather = 0; if (ball.owner === o) looseBall(o, 0, 1, 0);
}
const SPECIALS = {
  BLAZE(p) {
    const o = other(p), d = flat(p, o);
    pix(PFX.flamePillar, [p.x, 0, p.z], { w: 128, h: 192, life: 1.3 }); light(p, 10);
    if (d < 3.2) { const [nx, nz] = norm(o.x - p.x, o.z - p.z); o.fallen = 1; o.vx = nx * 7; o.vz = nz * 7; o.vy = 5; o.onGround = false; if (ball.owner === o) looseBall(o, nx * 3, 4, nz * 3); }
    else if (d < 5) say(o, "DODGED", "#ffd21f");
    fx.impact({ stop: 0.1, shake: 0.7, punch: 0.8 }); noise(0.6, 0.25, 400);
  },
  FROST(p) {
    const o = other(p), [dx, dz] = norm(o.x - p.x, o.z - p.z);
    for (let k = 0; k < 5; k++) later(k * 0.05, () => pix(PFX.iceSpikes, [p.x + dx * (1.6 + k * 2.4), 0, p.z + dz * (1.6 + k * 2.4)], { w: 128, h: 96, flip: dx < 0 }));
    for (let i = 0; i < 6; i++) beep(rnd(1800, 3200), 0.12, "triangle", 0.03, 0, i * 0.05);
    later(0.12, () => {
      const along = (o.x - p.x) * dx + (o.z - p.z) * dz, side = Math.abs((o.x - p.x) * -dz + (o.z - p.z) * dx);
      if (along > 0 && along < 13 && side < 1.3 && o.y < 0.3) { freeze(o, 2.0, "ice"); fx.impact({ stop: 0.12, shake: 0.4 }); }
      else say(o, "DODGED", "#a6ecff");
    });
  },
  VOLT(p) {
    const o = other(p);
    if (ball.owner === p) {
      pix(PFX.blinkOut, [p.x, 0, p.z], { w: 96, h: 112 });
      const [tx, tz] = norm(p.x - RIM.x, p.z - RIM.z); p.x = RIM.x + tx * 2.6; p.z = RIM.z + tz * 2.6; p.face = [-tx, -tz]; p.dashV = [-tx, -tz];
      pix(PFX.lightning, [p.x, 0, p.z], { w: 112, h: 224 });
      if (flat(p, o) < 1.8) { if (o.onGround) { o.stun = 0.8; pix(PFX.zapHit, [o.x, 1.2, o.z], { ground: false, w: 96, h: 96 }); } else say(o, "DODGED", "#fff6a0"); }
      startDunk(p);
    } else {
      const tx = ball.owner === o ? o.x + o.face[0] * 0.8 : ball.x, tz = ball.owner === o ? o.z + o.face[1] * 0.8 : ball.z;
      pix(PFX.blinkOut, [p.x, 0, p.z], { w: 96, h: 112 }); p.x = clamp(tx, -HW + 0.3, HW - 0.3); p.z = clamp(tz, -HL + 0.3, HL - 0.3); pix(PFX.lightning, [o.x, 0, o.z], { w: 112, h: 224 });
      if (ball.owner === o) { if (o.onGround) { o.stun = 0.9; looseBall(o, (p.x - o.x) * 2, 3, (p.z - o.z) * 2); pix(PFX.zapHit, [o.x, 1.2, o.z], { ground: false, w: 96, h: 96 }); } else say(o, "DODGED", "#fff6a0"); }
    }
    fx.impact({ stop: 0.1, shake: 0.5, punch: 0.6 }); noise(0.4, 0.2, 5000);
  },
  TANK(p) {
    const o = other(p);
    const shock = (big) => {
      pix(PFX.quake, [p.x, 0, p.z], { w: 288, h: 112, scale: big ? 1.1 : 0.85 }); pix(PFX.groundSlam, [p.x, 0, p.z], { w: 192, h: 128, scale: big ? 1 : 0.8 });
      fx.dust(p.x, p.z, big ? 30 : 18); rimWob = big ? 1.2 : 0.8;
      if (o.onGround && o.fallen <= 0 && o.hang <= 0 && flat(p, o) < 10) { o.fallen = 1.4; o.vy = 3; o.onGround = false; if (ball.owner === o) looseBall(o, (p.x - o.x) * 0.4, 4, (p.z - o.z) * 0.4); }
      else if (o.fallen <= 0) say(o, "DODGED", "#ffd21f");
      if (!ball.owner) ball.vy += big ? 4 : 3;
      fx.impact({ stop: big ? 0.14 : 0.06, shake: big ? 0.9 : 0.6, punch: big ? 0.5 : 0.3 }); beep(45, 0.5, "sine", 0.3, -15); noise(0.5, 0.25, 300);
    };
    shock(true); p.quakeT = 0.55;
    later(0.55, () => { if (phase === "play") shock(false); });
  },
  SHADE(p) {
    const o = other(p);
    pix(PFX.blackHole, [ball.x, ball.y + 0.2, ball.z], { ground: false, w: 128, h: 128, life: 1.3 }); beep(600, 0.6, "sine", 0.06, -480);
    if (ball.owner === o && (o.dashT > 0 || o.dashCd > 0)) { say(o, "DODGED", "#9a7cff"); return; }
    if (ball.owner === o) { o.stun = 0.5; looseBall(o, 0, 1, 0); }
    if (!ball.owner && !ball.live) { ball.homing = p; ball.homeT = 1.5; }
    fx.impact({ stop: 0.08, shake: 0.4, punch: 0.5 });
  },
  GRAMPS(p) {
    const o = other(p);
    if (ball.owner === p) {
      pix(PFX.timeStop, [o.x, 1.3, o.z], { ground: false, w: 128, h: 128 });
      if (o.onGround) freeze(o, 2.4, "time"); else say(o, "DODGED", "#ffffff");
      p.granny = true; p.vx = p.vz = 0; p.face = toward(p);
      later(0.5, () => { if (ball.owner === p) release(p, true); p.granny = false; });
      beep(1568, 0.5, "sine", 0.05); beep(2093, 0.4, "sine", 0.03, 0, 0.12);
    } else {
      const [dx, dz] = norm(o.x - p.x, o.z - p.z), g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), mat("#ffffff")));
      const gum = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.22), mat("#ff86a0")); gum.position.y = 0.08; g.add(gum); scene.add(g);
      teeth.push({ x: p.x + dx * 0.6, z: p.z + dz * 0.6, vx: dx * 7, vz: dz * 7, from: p, mesh: g, t: 0 }); sfx.whoosh();
    }
  },
};
const teeth = [];
function updateTeeth(dt) {
  for (let i = teeth.length - 1; i >= 0; i--) {
    const t = teeth[i]; t.t += dt; t.x += t.vx * dt; t.z += t.vz * dt;
    t.mesh.position.set(t.x, 0.12 + Math.abs(Math.sin(t.t * 20)) * 0.18, t.z); t.mesh.rotation.y = Math.atan2(-t.vz, t.vx);
    const o = other(t.from);
    if (flat(t, o) < 0.5 && o.y < 0.3 && o.fallen <= 0) {
      o.stun = 1.2; if (ball.owner === o) looseBall(o, t.vx * 0.2, 3, t.vz * 0.2);
      fx.burst(o.x, 0.4, o.z, 12, ["#ffffff", "#ff86a0"], 3, 0.5); fx.impact({ stop: 0.1, shake: 0.4 }); sfx.crack(); t.t = 99;
    }
    if (t.t > 2.5 || Math.abs(t.x) > HW + 1 || Math.abs(t.z) > HL + 1) { scene.remove(t.mesh); teeth.splice(i, 1); }
  }
}

// ---------- the ball ----------
const dribbleLow = (p) => Math.abs(Math.sin(worldT * (p.dashT > 0 || p.moveT > 0 || p.sprint ? 16 : 9) + p.i));
function heldPos(p) {
  const [fx_, fz] = p.face, sx = -fz, sz = fx_;
  if (p.dunk || p.hang > 0) return [p.x + fx_ * 0.25, p.y + 2.3, p.z + fz * 0.25];
  if (p.shooting || p.gather > 0) return [p.x + fx_ * 0.15, p.y + 2.25, p.z + fz * 0.15];
  if (p.fakeT > 0.25) return [p.x + fx_ * 0.12, p.y + 2.45, p.z + fz * 0.12];
  if (!p.onGround) return [p.x + fx_ * 0.35 + sx * 0.25 * p.hand, p.y + 1.25, p.z + fz * 0.35 + sz * 0.25 * p.hand];
  if (p.granny) return [p.x + fx_ * 0.3, 0.7, p.z + fz * 0.3];
  if (p.crossT > 0) { const k = 1 - p.crossT / 0.18, side = (-p.hand + 2 * p.hand * k) * 0.34; return [p.x + fx_ * 0.45 + sx * side, BR + 0.05 + Math.abs(Math.sin(k * Math.PI)) * 0.15, p.z + fz * 0.45 + sz * side]; }
  const ph = dribbleLow(p);
  return [p.x + fx_ * 0.4 + sx * 0.36 * p.hand, 1.0 - ph * (1.0 - BR), p.z + fz * 0.4 + sz * 0.36 * p.hand];
}
// keep the ball on the side away from the defender
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
    const low = ball.y < 0.35; if (low && !wasLow) sfx.bounce(); wasLow = low;
    // the arc goes quiet once he's past it
    if (ball.owner.i === poss && !cleared && isThree(ball.owner)) { cleared = true; if (ball.owner.i === 0) say(ball.owner, "GO!", "#3ee07f"); }
    return;
  }
  if (ball.homing) {
    const p = ball.homing, tx = p.x + p.face[0] * 0.4, ty = p.y + 1.2, tz = p.z + p.face[1] * 0.4, dx = tx - ball.x, dy = ty - ball.y, dz = tz - ball.z, d = Math.hypot(dx, dy, dz);
    const sp = Math.min(14, d * 6); ball.x += (dx / (d || 1)) * sp * dt; ball.y += (dy / (d || 1)) * sp * dt; ball.z += (dz / (d || 1)) * sp * dt; ball.vx = ball.vy = ball.vz = 0;
    if (d < 0.35 || (ball.homeT -= dt) <= 0) { if (d < 1 && !busy(p)) { ball.owner = p; newOwner(p); } ball.homing = null; }
    return;
  }
  ball.vy -= BALL_G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
  if (ball.live) {
    ball.t += dt;
    fx.shard({ x: ball.x, y: ball.y, z: ball.z, g: 0, floor: false, life: 0.22, size: 0.12, c: ball.shooter?.fire ? "#ff6a1a" : ball.quality === "perfect" ? "#3ee07f" : "#f07a1a" });
    const s = ball.shooter, d = s && other(s);
    if (d && ball.t < 0.35 && ball.vy > 0 && !d.onGround && d.frozen <= 0 && flat(ball, d) < (isTouch && d.i === 0 ? 1.05 : 0.85) && ball.y > d.y + 1.2 && ball.y < d.y + 2.8) {
      ball.live = false; ball.lastShooter = s; ball.noCatchT = 0.45; s.shooting = false;
      const [ox, oz] = norm(ball.x - d.x, ball.z - d.z); ball.vx = ox * 2 + d.face[0] * 3; ball.vz = oz * 2 + d.face[1] * 3; ball.vy = -1;
      say(d, "BLOCK!", "#ffd21f", true); sfx.block(); hype = 1; gainSp(d, 0.2); call(CALLS.block);
      pix(PFX.critHit, [ball.x, ball.y, ball.z], { ground: false, w: 128, h: 128 }); fx.impact({ stop: 0.12, slow: 0.3, shake: 0.45, punch: 0.6 }); return;
    }
    if (ball.t >= ball.T && !ball.resolved) {
      ball.resolved = true; ball.live = false;
      if (ball.made) { Object.assign(ball, { x: RIM.x, z: RIM.z, vx: 0, vz: 0, vy: -2 }); score(ball.shooter, ball.pts, ball.pts === 3 ? "3!" : "2!"); }
      else {
        const [ox, oz] = norm(ball.x - RIM.x + rnd(-0.1, 0.1), ball.z - RIM.z + rnd(-0.1, 0.1)); ball.vx = ox * 2.6; ball.vz = oz * 2.6 + 0.6; ball.vy = rnd(2.5, 4);
        sfx.rim(); rimWob = 0.6; ball.lastShooter = null;
      }
    }
  }
  if (ball.y < BR) { ball.y = BR; if (ball.vy < -1.5) { sfx.bounce(); fx.dust(ball.x, ball.z, 3); } ball.vy = Math.abs(ball.vy) < 0.8 ? 0 : -ball.vy * 0.62; ball.vx *= 0.85; ball.vz *= 0.85; }
  if (Math.abs(ball.x) > HW - 0.3) { ball.x = Math.sign(ball.x) * (HW - 0.3); ball.vx *= -0.5; }
  if (ball.z < -HL + 0.3) { ball.z = -HL + 0.3; ball.vz *= -0.5; } if (ball.z > HL - 0.3) { ball.z = HL - 0.3; ball.vz *= -0.5; }
  if (ball.live || phase !== "play") return;
  ball.noCatchT = Math.max(0, ball.noCatchT - dt);
  for (const p of players) {
    if (p.fallen > 0 || p.stun > 0 || p.dunk || p.hang > 0 || p.frozen > 0 || (ball.noCatchT > 0 && p === ball.lastShooter)) continue;
    if (flat(ball, p) < 0.75 && ball.y < p.y + 2.6 && ball.y > p.y - 0.1) {
      ball.owner = p; p.ai.plan = null; p.shooting = false; p.gather = 0; p.fakeT = 0; newOwner(p);
      if (!p.onGround && ball.y > 1.6) fx.flash(ball.x, ball.y, ball.z, "#ffffff", 1, 0.12);
      break;
    }
  }
}

// ---------- a baller's frame ----------
function updatePlayer(p, c, dt) {
  const opp = other(p);
  for (const k of ["cd", "whiff", "dashCd", "landT", "dunkWin", "celebrate", "followT", "quakeT", "moveCd", "safeT", "openT", "boostT", "slowT", "phantomT", "hesiT"]) p[k] -= dt;
  if (p.decoy && (p.decoy.t -= dt) <= 0) p.decoy = null;
  p.landA = Math.max(0, p.landA - dt * 5);
  protectBall(p, dt);
  if (phase === "play") gainSp(p, dt * 0.02);
  if (p.fireT > 0 && (p.fireT -= dt) <= 0 && p.streak < fireAt(p)) p.fire = false;
  if (p.hang > 0) { p.hang -= dt; if (p.hang <= 0) { p.vy = -1; fx.dust(p.x, p.z, 6); } return; }
  if (p.dunk) { updateDunk(p, dt); return; }
  p.wantX = c.mx; p.wantZ = c.mz;
  if (c.special) trySpecial(p);
  if (c.trick) trick(p);
  if (p.hesiT > 0) c = { ...NONE, shootHeld: c.shootHeld };
  if (p.charge) {
    if (p.fallen > 0 || p.frozen > 0 || p.stun > 0.3) { p.charge = null; say(p, "FIZZLED", "#9aa0b4"); }
    else if ((p.charge.t -= dt) <= 0) { p.charge = null; SPECIALS[p.ch.name](p); }
    else { c = NONE; if (p.onGround) p.vx = p.vz = 0; }
  }
  if (p.frozen > 0) { p.frozen -= dt; c = NONE; p.vx = p.vz = 0; if (p.frozenKind === "time") { p.vy = 0; return; } if (p.frozen <= 0) pix(PFX.iceShatter, [p.x, 1, p.z], { ground: false, w: 128, h: 96 }); }
  if (p.granny) { c = NONE; p.vx = p.vz = 0; }
  if (p.fallen > 0) { p.fallen -= dt; c = NONE; }
  else if (p.stun > 0) { p.stun -= dt; c = NONE; }
  const has = ball.owner === p;
  let mx = c.mx, mz = c.mz; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  // turbo: hold to sprint (it drains), tap for a burst; on fire it never runs out
  p.sprint = !!c.turboHeld && ml > 0.2 && p.onGround && (p.turbo > 0.02 || p.fire) && !busyShot(p);
  if (p.sprint && !p.fire) p.turbo = Math.max(0, p.turbo - dt * (p.ch.name === "VOLT" ? 0.17 : 0.34));
  else if (!c.turboHeld) p.turbo = Math.min(1, p.turbo + dt * 0.22);
  if (c.turbo && p.dashCd <= 0 && p.onGround && !busyShot(p) && p.fallen <= 0) startDash(p, c.dashDir ?? (ml > 0.2 ? norm(mx, mz) : p.face));
  const sp = TUNE.speed * 5.2 * p.ch.spd * (has ? 0.94 : 1) * (p.whiff > 0 ? 0.35 : 1) * (p.sprint ? 1.38 : 1) * (p.fire ? 1.08 : 1) * (p.boostT > 0 ? 1.25 : 1) * (p.slowT > 0 ? 0.5 : 1)
    * (p.phantomT > 0 ? 1.2 : 1) * (p.i === 1 && !dbg.auto ? 0.9 + cpuLevel() * 0.06 : 1);
  if (p.moveT > 0) { p.moveT -= dt; p.vx = p.moveV[0]; p.vz = p.moveV[1]; if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.05; fx.ghost(p.body.root, p.ch.col); } }
  else if (p.dashT > 0) {
    p.dashT -= dt; p.vx = p.dashV[0] * 14 * p.ch.spd; p.vz = p.dashV[1] * 14 * p.ch.spd; dashContact(p);
    if ((p.ghostT -= dt) <= 0) { p.ghostT = 0.04; fx.ghost(p.body.root, p.ch.col); }
  } else if (!p.shooting && p.gather <= 0 && p.fallen <= 0) {
    if (p.onGround) { p.vx = mx * sp; p.vz = mz * sp; } else { p.vx += (mx * sp - p.vx) * Math.min(1, dt * 3); p.vz += (mz * sp - p.vz) * Math.min(1, dt * 3); }
    if (ml > 0.2) p.face = norm(mx, mz);
    if (p.sprint && Math.random() < dt * 14) fx.dust(p.x, p.z, 1);
  } else if (p.fallen > 0 && p.onGround) { p.vx *= 0.85; p.vz *= 0.85; }
  if (ball.owner === opp && p.fallen <= 0 && p.dashT <= 0) p.face = norm(opp.x - p.x, opp.z - p.z);
  // SHOOT: with the ball, a dunk or a gather (hold = shot, tap = fake); on defense, jump at a shot or a loose ball, else steal
  if (c.shoot && p.fallen <= 0 && p.moveT <= 0) {
    if (has && !p.shooting && p.gather <= 0) { if (canDunk(p)) startDunk(p); else if (p.onGround) p.gather = 0.13; else startShot(p); }
    else if (!has) {
      const shotUp = opp.shooting || opp.gather > 0 || opp.fakeT > 0 || opp.dunk || (ball.live && flat(ball, p) < 3) || (!ball.owner && ball.y > 1.6 && flat(ball, p) < 2);
      if (shotUp || dangerFor(p)) { if (p.onGround && p.whiff <= 0) { p.vy = 6.6 * p.ch.jmp * (p.fire ? 1.1 : 1); p.onGround = false; fx.dust(p.x, p.z, 4); } }
      else if (p.cd <= 0 && ball.owner === opp) trySteal(p, opp);
    }
  }
  if (p.gather > 0) {
    p.vx = p.vz = 0;
    if (!c.shootHeld || ball.owner !== p) { p.gather = 0; if (ball.owner === p) { p.fakeT = 0.4; p.bitDone = false; sfx.whoosh(); } }
    else if ((p.gather -= dt) <= 0) { p.gather = 0; startShot(p); }
  }
  if (p.fakeT > 0) {
    p.fakeT -= dt;
    if (!p.bitDone && !opp.onGround && flat(p, opp) < 2.2) {
      p.bitDone = true; hype = 0.6; pix(PFX.exclamation, [opp.x, 0, opp.z], { follow: opp, w: 64, h: 128, life: 0.6 }); fx.impact({ slow: 0.3, punch: 0.3 }); call(CALLS.fake);
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
  p.x = clamp(p.x, -HW + 0.3, HW - 0.3); p.z = clamp(p.z, -HL + 0.3, HL - 0.3);
}

// ---------- the CPU ----------
function wantsSpecial(me, o) {
  const has = ball.owner === me, oppHas = ball.owner === o, d = flat(me, o), dh = toRim(me);
  switch (me.ch.name) {
    case "BLAZE": return has ? dh < 7 : d < 2.6;
    case "FROST": return oppHas && d < 10;
    case "VOLT": return has ? dh > 5 && cleared : oppHas;
    case "TANK": return oppHas && o.onGround && d < 8;
    case "SHADE": return oppHas;
    case "GRAMPS": return has ? dh > 4 && cleared : oppHas && d < 9;
  }
  return false;
}
function cpuControl(me, dt) {
  const c = { ...NONE }, o = other(me), ai = me.ai, L = cpuLevel(); ai.t -= dt;
  const go = (tx, tz, dead = 0.25) => { const dx = tx - me.x, dz = tz - me.z, d = Math.hypot(dx, dz); if (d > dead) { c.mx = dx / d; c.mz = dz / d; } };
  if (me.shooting && ball.owner === me) { c.shootHeld = me.shootT < ai.releaseAt; return c; }
  if (me.gather > 0 && ball.owner === me) { c.shootHeld = !ai.faking; return c; }
  if (ai.jumpIn > 0 && (ai.jumpIn -= dt) <= 0) c.shoot = true;
  // a special coming: get out of the way, most of the time
  const how = o.charge && dodgeHow(o);
  if (how && ai.dodge) {
    const left = o.charge.t;
    if (how === "GET AWAY!") { [c.mx, c.mz] = norm(me.x - o.x, me.z - o.z); c.turboHeld = true; return c; }
    if (how === "DASH!" && left < 0.14) { c.turbo = true; [c.mx, c.mz] = toward(me); return c; }
    if (how === "JUMP!" && left < 0.12 && me.onGround) { me.vy = 6.6 * me.ch.jmp; me.onGround = false; return c; }
  }
  if (ai.dodge !== false && me.onGround && teeth.some((t) => t.from === o && flat(t, me) < 1.4)) { me.vy = 6.6 * me.ch.jmp; me.onGround = false; }
  ai.spT = (ai.spT ?? rnd(1, 3)) - dt;
  if (me.sp >= 1 && ai.spT <= 0 && wantsSpecial(me, o)) { c.special = true; ai.spT = rnd(1, 3); return c; }
  if (ball.owner === me) {
    const d = toRim(me), near = flat(me, o) < 1.6 && o.fallen <= 0 && o.frozen <= 0, th = toward(me);
    if (!cleared) {
      // take it out past the arc first
      const [ax, az] = norm(me.x - RIM.x, me.z - RIM.z), r = THREE_R + 0.9;
      go(RIM.x + ax * r, RIM.z + Math.max(1.6, az * r)); c.turboHeld = near; return c;
    }
    if (!ai.plan) { const r = Math.random(), t3 = 0.22 + (me.ch.three - 1) * 0.8; ai.plan = r < t3 ? { kind: "three" } : r < 0.6 ? { kind: "drive" } : { kind: "mid", at: rnd(3.2, 5.2) }; ai.lane = rnd(-1, 1); }
    const shoot = () => {
      if (near && me.fakeT <= 0 && Math.random() < 0.25 + L * 0.1) { ai.faking = true; c.shoot = c.shootHeld = true; return; }
      ai.faking = false; c.shoot = c.shootHeld = true; ai.releaseAt = (6.2 * me.ch.jmp) / G + gauss() * (0.11 - L * 0.035); ai.plan = null;
    };
    if (committed(o) && o.ch.name !== "TANK" && flat(me, o) < 2.5 && me.dashCd <= 0 && (me.turbo >= 0.3 || me.fire) && o.fallen <= 0) { c.turbo = true; [c.mx, c.mz] = th; return c; }
    if (me.fakeT > 0 && o.onGround && me.fakeT < 0.15) { shoot(); return c; }
    if (near && me.onGround && me.moveCd <= 0 && !busyShot(me) && me.turbo > SIG[me.ch.name].cost + 0.1 && Math.random() < dt * (0.5 + L * 0.4)) { c.trick = true; ai.afterStep = me.ch.name === "FROST"; return c; }
    if (ai.afterStep && me.moveT <= 0 && me.openT > 0 && me.onGround) { ai.afterStep = false; shoot(); return c; }
    if (ai.plan.kind === "drive") {
      go(RIM.x + ai.lane * 1.2, RIM.z + 1.0); c.turboHeld = d < 6.5;
      if (canDunk(me)) c.shoot = true;
      else if (d < 4.6 && d > 1.8 && me.dashCd <= 0 && me.turbo >= 0.3) { c.turbo = true; [c.mx, c.mz] = th; }
      else if (d < 1.7 && me.onGround) shoot();
    } else if (ai.plan.kind === "three") {
      if (!isThree(me) || d > THREE_R + 1.2) { const [ax, az] = norm(me.x - RIM.x + ai.lane, me.z - RIM.z); go(RIM.x + ax * (THREE_R + 0.6), RIM.z + az * (THREE_R + 0.6)); }
      else if (me.onGround && me.dashT <= 0) shoot();
    } else if (d > ai.plan.at) go(RIM.x + ai.lane, RIM.z + 1.2);
    else if (me.onGround && me.dashT <= 0) shoot();
  } else if (ball.owner === o) {
    if (ai.t <= 0) { ai.t = rnd(0.06, 0.22) / L; const tgt = o.decoy ?? o, [dx, dz] = norm(RIM.x - tgt.x, RIM.z - tgt.z); ai.tx = tgt.x + dx * 1.15; ai.tz = tgt.z + dz * 1.15; }
    go(ai.tx, ai.tz, 0.15); c.turboHeld = flat(me, o) > 3;
    const close = flat(me, o) < 1.8;
    if (o.gather > 0 && !ai.saw) { ai.saw = true; if (close && me.onGround && Math.random() < 0.5 - L * 0.15) ai.jumpIn = rnd(0.01, 0.06); }
    if (o.shooting && !ai.decided) { ai.decided = true; if (close && me.onGround && ai.jumpIn <= 0 && Math.random() < 0.35 + L * 0.2) ai.jumpIn = rnd(0.02, 0.12); }
    if (!o.shooting) ai.decided = false; if (o.gather <= 0 && o.fakeT <= 0) ai.saw = false;
    if (me.cd <= 0 && stealOpen(me, o) && Math.random() < 0.06 + L * 0.05) c.shoot = true;
    else if (me.cd <= 0 && inReach(me, o) && !stealOpen(me, o) && Math.random() < dt * 0.3 / L) c.shoot = true;
  } else {
    go(ball.x, ball.z, 0.1); c.turboHeld = flat(me, ball) > 2;
    if (flat(me, ball) < 1 && ball.y > 2.2 && ball.vy < 1 && me.onGround && Math.random() < 0.25) c.shoot = true;
  }
  return c;
}

// ---------- input: keys, the mouse, touch ----------
const keys = new Set(), pressed = new Set();
addEventListener("keydown", (e) => { audio(); if (!e.repeat) pressed.add(e.code); keys.add(e.code); if (["Space", "ArrowUp", "ArrowDown", "Tab"].includes(e.code)) e.preventDefault(); });
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
  addEventListener("pointermove", (e) => { const s = touch.stick; if (s && e.pointerId === s.id) { s.x = e.clientX; s.y = e.clientY; const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 55) { s.ox = s.x - (dx / d) * 55; s.oy = s.y - (dy / d) * 55; } } });
  const up = (e) => { if (touch.stick && e.pointerId === touch.stick.id) touch.stick = null; };
  addEventListener("pointerup", up); addEventListener("pointercancel", up);
  for (const [id, name] of [["bShoot", "shoot"], ["bTurbo", "turbo"], ["bTrick", "trick"], ["bSpecial", "special"]]) {
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
const raycaster = new THREE.Raycaster(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2();
const mouse = { ground: null, target: null, right: false };
const marker = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.32, 20), new THREE.MeshBasicMaterial({ color: "#3ee07f", transparent: true, depthWrite: false }));
marker.rotation.x = -Math.PI / 2; marker.visible = false; scene.add(marker);
function groundAt(e) {
  const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera); const p = new THREE.Vector3(); return raycaster.ray.intersectPlane(floorPlane, p) ? p : null;
}
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; audio(); if (e.button === 2 && screen === "game") { mouse.right = true; const g = groundAt(e); if (g) mouse.target = { x: clamp(g.x, -HW + 0.3, HW - 0.3), z: clamp(g.z, -HL + 0.3, HL - 0.3) }; } });
addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; mouse.ground = groundAt(e); if (mouse.right && mouse.ground) mouse.target = { x: clamp(mouse.ground.x, -HW + 0.3, HW - 0.3), z: clamp(mouse.ground.z, -HL + 0.3, HL - 0.3) }; });
addEventListener("pointerup", (e) => { if (e.button === 2) mouse.right = false; });
let camFwd = [0, -1];
const camRel = (kx, kz) => { const [fx_, fz] = camFwd; return [kx * -fz - kz * fx_, kx * fx_ - kz * fz]; };
function humanControl() {
  const c = { ...NONE }, me = players[0];
  const kx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
  const kz = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
  if (kx || kz) { [c.mx, c.mz] = camRel(kx, kz); mouse.target = null; }
  else if (mouse.target) { const dx = mouse.target.x - me.x, dz = mouse.target.z - me.z, d = Math.hypot(dx, dz); if (d < 0.18) mouse.target = null; else { c.mx = dx / d; c.mz = dz / d; } }
  const s = touch.stick;
  if (s) { const dx = s.x - s.ox, dy = s.y - s.oy, d = Math.hypot(dx, dy); if (d > 8) [c.mx, c.mz] = camRel(dx / 55, dy / 55); }
  c.shoot = pressed.has("Space") || pressed.has("KeyJ") || touch.tap.has("shoot"); c.shootHeld = keys.has("Space") || keys.has("KeyJ") || touch.held.has("shoot");
  c.turbo = pressed.has("ShiftLeft") || pressed.has("ShiftRight") || pressed.has("KeyK") || touch.tap.has("turbo");
  c.turboHeld = keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("KeyK") || touch.held.has("turbo");
  c.trick = pressed.has("KeyQ") || pressed.has("KeyL") || touch.tap.has("trick");
  c.special = pressed.has("KeyE") || pressed.has("KeyX") || touch.tap.has("special");
  if (c.turbo && !isTouch && mouse.ground && !(kx || kz) && Math.hypot(mouse.ground.x - me.x, mouse.ground.z - me.z) > 0.5) { c.dashDir = norm(mouse.ground.x - me.x, mouse.ground.z - me.z); mouse.target = null; }
  // on a phone, holding SHOOT on a drive at the rim is the dunk (pressed for you when it's on)
  if (isTouch && touch.held.has("shoot") && ball.owner === me && canDunk(me)) c.shoot = true;
  touch.tap.clear();
  return c;
}

// ---------- screens: the menu, the select, the match, the result ----------
const menuEl = document.getElementById("menu"), selEl = document.getElementById("sel"), hudEl = document.getElementById("hud"), pauseEl = document.getElementById("pause");
const STATS = [["SPD", "spd"], ["JMP", "jmp"], ["SHOT", "shot"], ["3PT", "three"], ["DEF", "def"]];
const pips = (v) => clamp(Math.round((v - 0.7) / 0.15) + 1, 1, 5);
const lineup = CHARS.map((ch) => { const b = makeBaller(ch); b.root.visible = false; scene.add(b.root); return b; });
const menuBallers = [makeBaller(CHARS[0]), makeBaller(CHARS[1])]; for (const b of menuBallers) { b.root.visible = false; scene.add(b.root); }
function show(el, on) { el.style.display = on ? "" : "none"; }
function showMenu() {
  screen = "menu"; phase = "menu"; fx.clear(); clearPix(); for (const p of players) scene.remove(p.body.root); players = []; ball.owner = null;
  show(menuEl, true); show(selEl, false); show(hudEl, false); show(pauseEl, false); centerEl.innerHTML = "";
  const best = tourBest();
  menuEl.innerHTML = `<div class="title"><h1>HOOPS</h1><p>${T("1 ON 1 STREETBALL")}</p></div>
    <nav><button data-a="quick">${T("QUICK MATCH")}<small>${T("FIRST TO 11")}</small></button>
    <button data-a="tour">${T("STREET TOUR")}<small>${best >= 5 ? "★ " + T("TOUR CHAMP!") : `${T("BEST")}: ${best}/5 ${T("ROUNDS")}`}</small></button>
    <button data-a="howto">${T("HOW TO PLAY")}</button><a href="../">${T("BACK TO 2D")}</a></nav>`;
  menuEl.querySelectorAll("button").forEach((b) => (b.onclick = () => { audio(); sfx.click(); const a = b.dataset.a; if (a === "howto") showHowTo(); else { mode = a; showSelect(); } }));
  for (const b of lineup) b.root.visible = false;
  menuBallers.forEach((b, k) => { b.root.visible = true; b.root.position.set(k ? 2.2 : -2.4, 0, k ? -1 : 0.5); });
}
function showHowTo() {
  const ko = LANG === "ko";
  menuEl.innerHTML = `<div class="howto"><h2>${T("HOW TO PLAY")}</h2><ul>
    <li><b>${T("SHOOT")}</b><span>SPACE</span><em>${ko ? "꾹 누르고 점프 꼭대기에서 떼기. 짧게 톡 = 페이크. 수비 땐 스틸, 슛하는 상대에겐 점프(블락)" : "Hold, let go at the top of the jump. Tap to pump fake. On defense: steal, or jump at a shot to block."}</em></li>
    <li><b>${T("TURBO")}</b><span>SHIFT</span><em>${ko ? "꾹 = 질주, 톡 = 돌파. 림으로 질주하다 슛 = 덩크" : "Hold to sprint, tap to burst. Sprint at the rim and shoot to dunk."}</em></li>
    <li><b>${T("TRICK")}</b><span>Q</span><em>${ko ? "선수마다 다른 고유 드리블" : "Your baller's own dribble move."}</em></li>
    <li><b>${T("SPECIAL")}</b><span>E</span><em>${ko ? "게이지가 차면. 상대가 피할 수도 있다" : "When the meter is full. He can get out of the way."}</em></li>
    <li><b>${ko ? "규칙" : "RULES"}</b><span>11</span><em>${ko ? "11점 먼저. 체크볼로 시작, 공격권이 바뀌면 3점 라인 밖으로 빼야(클리어) 득점 인정. 3골 연속이면 불붙는다." : "First to 11. Check ball at the top. After a change of possession, take it past the arc before you score. Three straight and you're on fire."}</em></li>
    </ul><button class="back">${T("BACK")}</button></div>`;
  menuEl.querySelector(".back").onclick = () => { sfx.click(); showMenu(); };
}
function showSelect() {
  screen = "select"; locked = false; show(menuEl, false); show(selEl, true); show(hudEl, false); centerEl.innerHTML = "";
  for (const p of players) scene.remove(p.body.root); players = [];
  for (const b of menuBallers) b.root.visible = false;
  lineup.forEach((b, i) => { b.root.visible = true; b.root.position.set((i - 2.5) * 1.55, 0, 2.5); });
  selEl.innerHTML = `<header><span class="mode">${T(mode === "tour" ? "STREET TOUR" : "QUICK MATCH")}</span><h1>${T("CHOOSE YOUR BALLER")}</h1></header>
    <div id="tabs">${CHARS.map((c, i) => `<button class="tab" data-i="${i}" style="--c:${c.col}">${c.name}</button>`).join("")}</div>
    <div id="card"></div><div id="selBtns"><button id="backB">${T("BACK")}</button><button id="playB">${T("PLAY")}</button></div>`;
  selEl.querySelectorAll(".tab").forEach((b) => (b.onclick = () => { audio(); if (locked) return; if (pickI === +b.dataset.i) lockIn(); else { pickI = +b.dataset.i; sfx.click(); drawCard(); } }));
  document.getElementById("playB").onclick = () => { audio(); lockIn(); };
  document.getElementById("backB").onclick = () => { audio(); sfx.click(); for (const b of lineup) b.root.visible = false; showMenu(); };
  drawCard();
}
function drawCard() {
  const ch = CHARS[pickI];
  selEl.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", +b.dataset.i === pickI));
  selEl.style.setProperty("--c", ch.col);
  document.getElementById("card").innerHTML = `<div class="who"><b>${ch.name}</b><i>${T(ch.title)}</i>
      <div class="stats">${STATS.map(([l, k]) => `<span>${T(l)}</span><span class="sbar"><u style="width:${pips(ch[k]) * 20}%"></u></span>`).join("")}</div></div>
    <div class="abil"><div class="ab"><span class="tag">${T("PASSIVE")}</span><b>${T(ch.passive)}</b><em>${T(ch.pdesc)}</em></div>
      <div class="ab"><span class="tag">${T("TRICK")} · Q</span><b>${T(SIG[ch.name].name)}</b><em>${T(SIG[ch.name].desc)}</em></div>
      <div class="ab sk"><span class="tag">${T("SPECIAL")} · E</span><b>${T(ch.special)}</b><em>${T(ch.sdesc)}</em></div></div>`;
}
function lockIn() {
  if (locked) return;
  locked = true; sfx.lock();
  if (mode === "tour") { const rest = CHARS.map((_, i) => i).filter((i) => i !== pickI).sort(() => Math.random() - 0.5); tour = { order: rest, round: 0, me: pickI }; cpuI = rest[0]; }
  else { do cpuI = Math.floor(Math.random() * CHARS.length); while (cpuI === pickI); }
  later(0.6, startMatch);
}
function startMatch() {
  screen = "game"; fx.clear(); clearPix(); mouse.target = null; document.activeElement?.blur?.();
  for (const b of lineup) b.root.visible = false; for (const b of menuBallers) b.root.visible = false;
  show(selEl, false); show(menuEl, false); show(hudEl, true); show(pauseEl, false); centerEl.innerHTML = "";
  for (const p of players) scene.remove(p.body.root);
  players = [makePlayer(0, mode === "tour" ? tour.me : pickI), makePlayer(1, cpuI)];
  for (const t of teeth) scene.remove(t.mesh); teeth.length = 0; for (const pt of patches) scene.remove(pt.mesh); patches.length = 0;
  lastScorer = null; hype = 0;
  const hint = document.getElementById("hint"); hint.textContent = isTouch ? "" : LANG === "ko" ? KO.HELP_K : HELP_EN; hint.classList.add("show");
  setTimeout(() => hint.classList.remove("show"), 9000);
  if (mode === "tour") banner(`${T("ROUND")} ${tour.round + 1}/5`, "#ffd21f", `VS ${players[1].name}`);
  phase = "intro"; stateT = 0;
  later(mode === "tour" ? 1.4 : 0.3, () => checkBall(mode === "tour" || Math.random() < 0.5 ? 0 : 1));
}
function endMatch() {
  phase = "over"; screen = "over"; sfx.whistle(); call(CALLS.win, true);
  const [a, b] = players, win = a.score > b.score ? a : b, meWon = win === a;
  win.winner = true; other(win).loser = true;
  pix(PFX.confetti, [win.x, 0, win.z], { w: 256, h: 192, scale: 1.2 });
  for (let i = 0; i < 3; i++) later(0.3 + i * 0.35, () => pix(PFX.firework, [rnd(-6, 6), rnd(6, 9), rnd(-9, -6)], { ground: false, w: 160, h: 160, scale: 1.4 }));
  let title = meWon ? T("YOU WIN") : T("YOU LOSE"), buttons;
  if (mode === "tour") {
    if (meWon) { tour.round++; localStorage.setItem("hoops3d.tour", Math.max(tourBest(), tour.round)); }
    if (meWon && tour.round >= 5) { title = T("TOUR CHAMP!"); buttons = `<button class="primary" data-a="menu">${T("MENU")}</button>`; }
    else buttons = meWon ? `<button class="primary" data-a="next">${T("NEXT MATCH")}</button><button data-a="menu">${T("MENU")}</button>`
      : `<button class="primary" data-a="retry">${T("RETRY")}</button><button data-a="menu">${T("MENU")}</button>`;
  } else buttons = `<button class="primary" data-a="again">${T("REMATCH")}</button><button data-a="select">${T("CHOOSE YOUR BALLER")}</button><button data-a="menu">${T("MENU")}</button>`;
  centerEl.innerHTML = `<div class="result ${meWon ? "won" : "lost"}" style="--c:${win.ch.col}"><h2>${title}</h2>
    <div class="final"><span style="--c:${a.ch.col}">${a.name}</span><b>${a.score}</b><i>–</i><b>${b.score}</b><span style="--c:${b.ch.col}">${b.name}</span></div>
    ${mode === "tour" ? `<p>${T("STREET TOUR")} · ${T("ROUND")} ${Math.min(tour.round + (meWon ? 0 : 1), 5)}/5</p>` : ""}<div class="row">${buttons}</div></div>`;
  centerEl.querySelectorAll("button").forEach((btn) => (btn.onclick = () => {
    audio(); sfx.click(); const a2 = btn.dataset.a;
    if (a2 === "menu") showMenu(); else if (a2 === "select") showSelect();
    else if (a2 === "next") { cpuI = tour.order[tour.round]; startMatch(); }
    else startMatch();
  }));
}
function togglePause() {
  if (screen === "game" && phase !== "over") {
    screen = "paused"; show(pauseEl, true);
    pauseEl.innerHTML = `<div class="result"><h2>${T("PAUSED")}</h2><div class="row"><button class="primary" data-a="resume">${T("RESUME")}</button><button data-a="menu">${T("MENU")}</button></div></div>`;
    pauseEl.querySelectorAll("button").forEach((b) => (b.onclick = () => { sfx.click(); if (b.dataset.a === "menu") { show(pauseEl, false); showMenu(); } else togglePause(); }));
  } else if (screen === "paused") { screen = "game"; show(pauseEl, false); }
}
document.getElementById("pauseB").onclick = () => { audio(); togglePause(); };
document.getElementById("muteB").onclick = () => { muted = !muted; localStorage.setItem("hoops3d.mute", muted ? "1" : "0"); document.getElementById("muteB").classList.toggle("off", muted); if (muted && "speechSynthesis" in window) speechSynthesis.cancel(); };
document.getElementById("muteB").classList.toggle("off", muted);

// ---------- the step ----------
function step(dt) {
  worldT += dt; stateT += dt; hype = Math.max(0, hype - dt * 0.5);
  for (const t of timers) t.t -= dt;
  for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= 0) { const t = timers.splice(i, 1)[0]; t.fn(); }
  rimWob = Math.max(0, rimWob - dt * 2.5); netT = Math.max(0, netT - dt * 2); bannerT -= dt;
  if (pressed.has("Escape") || pressed.has("KeyP")) togglePause();
  if (screen === "select" && !locked) {
    if (pressed.has("ArrowLeft") || pressed.has("KeyA")) { pickI = (pickI + 5) % 6; sfx.click(); drawCard(); }
    if (pressed.has("ArrowRight") || pressed.has("KeyD")) { pickI = (pickI + 1) % 6; sfx.click(); drawCard(); }
    if (pressed.has("Enter") || pressed.has("Space")) lockIn();
  }
  if ((screen !== "game" && screen !== "over") || !players.length) return;
  if (screen === "over") { for (const p of players) updatePlayer(p, NONE, dt); updateBall(dt); return; }
  if (phase === "intro") return;
  if (phase === "check") { for (const p of players) updatePlayer(p, NONE, dt); updateBall(dt); if (stateT > 1.1) { phase = "play"; sfx.whistle(); } return; }
  const ctrls = [phase === "play" ? (dbg.auto ? cpuControl(players[0], dt) : humanControl()) : NONE, phase === "play" ? cpuControl(players[1], dt) : NONE];
  players.forEach((p, i) => updatePlayer(p, ctrls[i], dt));
  const [a, b] = players, d = flat(a, b), room = 0.7 + (a.ch.wide || b.ch.wide ? 0.12 : 0);
  if (d < room && d > 0 && a.dashT <= 0 && b.dashT <= 0 && a.moveT <= 0 && b.moveT <= 0 && a.onGround && b.onGround && a.fallen <= 0 && b.fallen <= 0) {
    const [nx, nz] = norm(b.x - a.x, b.z - a.z), push = (room - d) / 2; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
  }
  updateBall(dt); updateTeeth(dt); updatePatches(dt);
  if (phase === "scored" && stateT > 1.6) { if (players.some((p) => p.score >= target)) endMatch(); else checkBall(nextCheck); }
}

// ---------- drawing ----------
const camPos = new THREE.Vector3(0, 7, 13), camLook = new THREE.Vector3(0, 1.4, -1), camGoal = new THREE.Vector3(), lookGoal = new THREE.Vector3();
let cueWas = "";
function draw(dt) {
  // the camera: behind the arc and high, leaning toward the ball; a slow orbit on the menu; close up on the select
  if (screen === "menu") {
    const a = worldT * 0.15; camGoal.set(Math.sin(a) * 6, 4.2, 6 + Math.cos(a) * 3); lookGoal.set(0, 2, -3);
    menuBallers.forEach((b, k) => { b.root.rotation.y = Math.atan2(-(RIM.z - b.root.position.z), RIM.x - b.root.position.x); animate(b, { speed: 0, walk: 0, dribble: k ? null : { hand: 1, low: Math.abs(Math.sin(worldT * 7)) }, shoot: k ? Math.sin(worldT * 1.3) > 0.6 : false, t: worldT + k, mood: "calm" }); });
  } else if (screen === "select") {
    camGoal.set(0, 2.2, 9.6); lookGoal.set(0, 1.35, 2.5);
    lineup.forEach((b, i) => {
      const on = i === pickI;
      b.root.position.z += ((on ? 3.3 : 2.5) - b.root.position.z) * Math.min(1, dt * 8);
      b.root.rotation.y = -Math.PI / 2 + (on ? Math.sin(worldT * 1.5) * 0.35 : 0);
      animate(b, { speed: 0, walk: 0, dance: on && locked, dribble: on && !locked ? { hand: 1, low: Math.abs(Math.sin(worldT * 7)) } : null, mood: on ? "happy" : "calm", t: worldT + i });
    });
  } else if (players.length) {
    const focusX = clamp(ball.x * 0.6, -4, 4), z = clamp(ball.z, -6, 6);
    camGoal.set(focusX * 0.7, 6.6 - fx.punch * 0.6, 12.6 + z * 0.12 - fx.punch * 1.2); lookGoal.set(focusX, 1.5, -1.6 + z * 0.25);
  }
  camPos.lerp(camGoal, Math.min(1, dt * 3)); camLook.lerp(lookGoal, Math.min(1, dt * 4));
  const sh = fx.shake * 0.2;
  camera.position.set(camPos.x + (Math.random() - 0.5) * sh, camPos.y + (Math.random() - 0.5) * sh, camPos.z); camera.lookAt(camLook);
  camFwd = norm(camLook.x - camPos.x, camLook.z - camPos.z);
  for (const p of players) {
    const b = p.body, spd = Math.hypot(p.vx, p.vz);
    b.root.position.set(p.x, p.y, p.z); b.root.rotation.y = Math.atan2(-p.face[1], p.face[0]) + (p.spinT > 0 ? (1 - p.spinT / 0.38) * Math.PI * 2 : 0);
    b.root.scale.setScalar(p.fire ? 1.08 : 1);
    b.root.visible = !(p.phantomT > 0) || Math.floor(worldT * 24) % 3 === 0;
    if (p.fire && !p.aura) p.aura = pix(PFX.spiritFlame, [p.x, 0, p.z], { follow: p, off: [0, 1.3, 0], ground: false, w: 80, h: 112, scale: 1.5, palette: FIRE_PAL });
    if (!p.fire && p.aura) { p.aura.stop(); p.aura = null; }
    if (!p.iceBox) { p.iceBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.5, 1.1), new THREE.MeshLambertMaterial({ color: "#a6ecff", transparent: true, opacity: 0.5 })); b.root.add(p.iceBox); p.iceBox.position.y = 1.2; }
    p.iceBox.visible = p.frozen > 0; if (p.frozen > 0) p.iceBox.material.color.set(p.frozenKind === "time" ? "#c8c0dc" : "#a6ecff");
    p.walk += spd * dt;
    const up = p.shooting || p.gather > 0 || p.fakeT > 0.2 || !!p.dunk || p.hang > 0, has = ball.owner === p;
    animate(b, {
      speed: p.frozen > 0 ? 0 : spd, walk: p.walk, air: !p.onGround && !p.dunk && p.hang <= 0, guard: ball.owner === other(p) && p.onGround && p.fallen <= 0 && p.dashT <= 0 && p.whiff <= 0,
      dribble: has && p.onGround && !up && p.dashT <= 0.05 && !p.granny ? { hand: p.hand, low: p.crossT > 0 ? 1 : dribbleLow(p) } : null,
      shoot: p.shooting || p.gather > 0 || p.fakeT > 0.2, follow: p.followT > 0 && !has ? p.followT : 0, dunk: !!p.dunk, hang: p.hang > 0,
      block: !p.onGround && !up && !has && !p.dunk && p.followT <= 0, reach: p.whiff > 0 || p.cd > 0.5, fall: p.fallen > 0, dash: p.dashT > 0 || p.moveT > 0 || p.sprint,
      toes: p.fakeT > 0.25, dance: p.celebrate > 0 || p.winner, land: p.landA, mood: p.fallen > 0 || p.stun > 0 || p.loser ? "hurt" : p.celebrate > 0 || p.winner ? "happy" : "calm", t: worldT,
    });
  }
  ballMesh.visible = screen !== "select";
  if (screen === "menu") { const ph = Math.abs(Math.sin(worldT * 7)), b0 = menuBallers[0].root.position; ballMesh.position.set(b0.x + 0.36, 1.0 - ph * 0.74, b0.z - 0.4); }
  else ballMesh.position.set(ball.x, ball.y, ball.z);
  ballMesh.rotation.x += dt * 6;
  ballShadow.visible = ballMesh.visible;
  ballShadow.position.set(ballMesh.position.x, 0.02, ballMesh.position.z); ballShadow.scale.setScalar(1 + Math.min(1.5, ballMesh.position.y * 0.25)); ballShadow.material.opacity = Math.max(0.12, 0.45 - ballMesh.position.y * 0.06);
  rim.position.y = RIM.y - Math.abs(Math.sin(worldT * 40)) * rimWob * 0.06; net.scale.y = 1 + netT * 0.6; net.position.y = RIM.y - 0.36 - netT * 0.16;
  for (const cw of crowd) cw.g.position.y = hype > 0.3 ? Math.abs(Math.sin(worldT * 8 + cw.ph)) * 0.25 * hype : 0;
  clearArc.visible = screen === "game" && phase === "play" && !cleared; clearArc.material.opacity = 0.5 + Math.sin(worldT * 8) * 0.3;
  marker.visible = !!mouse.target && screen === "game"; if (marker.visible) marker.position.set(mouse.target.x, 0.03, mouse.target.z);
  // cues over your own head: what you can do now, or what to do to get out of the way
  stealRing.visible = false; let cue = "", cueCol = "#ffd21f";
  const me = players[0], o = players[1];
  if (me && screen === "game" && phase === "play") {
    if (ball.owner === o && me.fallen <= 0) {
      const ph = stealPhase(me, o);
      if (stealOpen(me, o)) { cue = "STEAL!"; stealRing.visible = true; stealRing.scale.setScalar(1); stealRing.material.color.set("#ffd21f"); }
      else if (inReach(me, o) && ph.warn > 0) { stealRing.visible = true; stealRing.scale.setScalar(1 + (1 - ph.warn) * 2.2); stealRing.material.color.set(ph.warn > 0.6 ? "#ffd21f" : "#ffffff"); }
    }
    if (goOpen(me)) cue = "GO!";
    if (ball.owner === me && !cleared) cue = "CLEAR IT";
    const dg = dangerFor(me);
    if (dg) { cue = dg.how; cueCol = Math.floor(worldT * 10) % 2 ? "#ff3b4e" : "#ffffff"; stealRing.visible = false; }
    if (stealRing.visible) { stealRing.position.set(ball.x, ball.y, ball.z); stealRing.lookAt(camera.position); }
  }
  if (cue && cue !== cueWas && cue !== "CLEAR IT") (dangerFor(me) ? sfx.warn : sfx.cue)();
  cueWas = cue;
  if (cue) { const [sx, sy] = toScreen(me.x, me.y + 3.3, me.z); cueEl.style.display = "block"; cueEl.style.left = sx + "px"; cueEl.style.top = sy + "px"; cueEl.textContent = T(cue); cueEl.style.color = cueCol; }
  else cueEl.style.display = "none";
  // the shot meter beside you while you shoot; it flashes the result
  if (me && me.shooting && ball.owner === me) {
    const [sx, sy] = toScreen(me.x, me.y + 1.4, me.z); meterEl.style.display = "block"; meterEl.style.left = sx + 70 + "px"; meterEl.style.top = sy + "px";
    meterEl.querySelector("u").style.bottom = clamp(50 + (me.vy / (6.2 * me.ch.jmp)) * 50, 0, 100) + "%"; meterEl.className = "";
  } else if (meterFlash) { meterEl.className = "flash " + meterFlash; meterFlash = ""; clearTimeout(meterEl.t); meterEl.t = setTimeout(() => { meterEl.style.display = "none"; meterEl.className = ""; }, 320); }
  else if (!meterEl.className) meterEl.style.display = "none";
  for (const f of pops) { f.t += dt; const [sx, sy] = toScreen(f.x, f.y + f.t * 0.8, f.z); f.el.style.left = sx + "px"; f.el.style.top = sy + "px"; f.el.style.opacity = Math.min(1, (f.life - f.t) * 3); }
  for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t >= pops[i].life) { pops[i].el.remove(); pops.splice(i, 1); }
  if (bannerT <= 0) bannerEl.classList.remove("on");
  document.body.classList.toggle("ingame", screen === "game");
  if (players.length && (screen === "game" || screen === "over" || screen === "paused")) drawHud(me, o);
  renderer.render(scene, camera);
}
function drawHud(me, o) {
  for (const [p, id] of [[me, "pA"], [o, "pB"]]) {
    const el = document.getElementById(id);
    el.style.setProperty("--c", p.ch.col); el.querySelector(".n").textContent = p.name; el.querySelector(".s").textContent = p.score;
    el.classList.toggle("fire", p.fire); el.classList.toggle("ball", ball.owner === p || ((phase === "check" || phase === "scored") && poss === p.i));
  }
  document.getElementById("goal").textContent = mode === "tour" && tour ? `${T("ROUND")} ${tour.round + 1}/5 · ${T("FIRST TO 11")}` : T("FIRST TO 11");
  const t = document.getElementById("turboBar"), s = document.getElementById("spBar");
  t.style.width = (me.fire ? 100 : me.turbo * 100) + "%"; t.parentElement.classList.toggle("fire", me.fire); t.parentElement.classList.toggle("low", !me.fire && me.turbo < 0.3);
  s.style.width = me.sp * 100 + "%"; s.parentElement.classList.toggle("full", me.sp >= 1);
  document.getElementById("spLabel").textContent = me.sp >= 1 ? T("SPECIAL READY") + (isTouch ? "" : " · E") : T("SPECIAL");
  document.getElementById("cpuSp").style.width = o.sp * 100 + "%";
  if (isTouch) {
    document.getElementById("bShoot").textContent = T(ball.owner === me ? (canDunk(me) ? "DUNK" : "SHOOT") : (o.shooting || o.gather > 0 || ball.live ? "JUMP" : "STEAL"));
    document.getElementById("bSpecial").classList.toggle("ready", me.sp >= 1);
    document.getElementById("bTrick").classList.toggle("dim", ball.owner !== me);
  }
}

const dbg = { auto: false, hold: false };
let last = performance.now();
function frame(real) {
  let dt = real;
  if (fx.stop > 0) dt = 0; else if (fx.slow > 0) dt *= 0.35;
  if (screen !== "paused") step(dt); else if (pressed.has("Escape") || pressed.has("KeyP")) togglePause();
  pressed.clear();
  fx.update(dt, camera, real); updatePix(dt);
  draw(real);
}
function loop(now) {
  if (dbg.hold) { last = now; requestAnimationFrame(loop); return; }
  if (now - last < 1000 / 60 - 3) { requestAnimationFrame(loop); return; }
  const real = Math.min(1 / 30, (now - last) / 1000); last = now;
  frame(real);
  requestAnimationFrame(loop);
}
if (isTouch) document.body.classList.add("touch");
showMenu();
requestAnimationFrame(loop);
window.hoops3d = { get players() { return players; }, ball, get phase() { return phase; }, get screen() { return screen; }, get cleared() { return cleared; }, get poss() { return poss; },
  frame, dbg, TUNE, startQuick(a, b) { mode = "quick"; pickI = a; cpuI = b; startMatch(); }, startTour(a) { mode = "tour"; pickI = a; locked = false; lockIn(); }, trySpecial, scene, camera,
  set target(v) { target = v; } };
