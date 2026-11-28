// The six ballers as rounded, cel-shaded toy figures: a big head, chunky sneakers, a strong silhouette each.
// Every part has an ink outline (a slightly bigger back-faced copy). Each figure faces +x and has a rig:
// hips, knees, a spine, shoulders, elbows, a neck, so the game can pose it.
import * as THREE from "three";

export const CHARS = [
  { name: "BLAZE", title: "THE HOTHEAD", col: "#ff4a3a", dark: "#a8201e", trim: "#ffd21f", skin: "#d79a6a", hair: "#ff6a1a", tip: "#ffd21f", shoe: "#ffd21f", sole: "#a8201e", band: "#ff4a3a", num: 3, style: "flame",
    spd: 1, jmp: 1, shot: 1, three: 1, def: 1, passive: "HOT HAND", pdesc: "ON FIRE AFTER 2 MAKES, NOT 3", special: "INFERNO", sdesc: "FIRE PILLAR KNOCKS HIM BACK, 10S ON FIRE" },
  { name: "FROST", title: "COLD BLOODED", col: "#4fb8ff", dark: "#1f5aa8", trim: "#eaf8ff", skin: "#f0c8a8", hair: "#f4fbff", tip: "#bfefff", shoe: "#eaf8ff", sole: "#4fb8ff", band: "#ffffff", num: 7, style: "fluffy",
    spd: 0.95, jmp: 1, shot: 1.05, three: 1.15, def: 0.95, passive: "ICE VEINS", pdesc: "BIGGER PERFECT ZONE", special: "DEEP FREEZE", sdesc: "ICE SPIKES FREEZE HIM" },
  { name: "VOLT", title: "SPEED DEMON", col: "#ffcc1a", dark: "#a87a12", trim: "#26213a", skin: "#8d5a3b", hair: "#fff2a0", tip: "#ffffff", shoe: "#26213a", sole: "#ffcc1a", band: "#26213a", num: 9, style: "spiky",
    spd: 1.15, jmp: 1.05, shot: 0.95, three: 0.9, def: 1, passive: "QUICK FEET", pdesc: "TURBO LASTS TWICE AS LONG", special: "THUNDER STEP", sdesc: "WARP TO THE RIM AND DUNK" },
  { name: "TANK", title: "THE BRICK WALL", col: "#4fd04a", dark: "#1f7a2a", trim: "#f2ead8", skin: "#6b4a3a", hair: "#1c1a24", tip: "#1c1a24", shoe: "#ff6a2a", sole: "#f2ead8", band: "#1f7a2a", num: 0, style: "bald", wide: 1,
    spd: 0.85, jmp: 0.85, shot: 0.95, three: 0.7, def: 1.3, passive: "ROCK SOLID", pdesc: "DRIVES BOUNCE OFF HIM", special: "EARTHQUAKE", sdesc: "TWO QUAKES. JUMP BOTH" },
  { name: "SHADE", title: "THE PICKPOCKET", col: "#9a7cff", dark: "#3a2a8a", trim: "#14101f", skin: "#2a2440", hair: "#1a1430", tip: "#6a5ac0", shoe: "#6a5ac0", sole: "#14101f", band: "#3a2a8a", num: 4, style: "hood",
    spd: 1.05, jmp: 1.1, shot: 0.95, three: 0.95, def: 1.2, passive: "STICKY HANDS", pdesc: "LONGER STEAL WINDOW", special: "BLACK HOLE", sdesc: "SUCKS THE BALL INTO HIS HANDS" },
  { name: "GRAMPS", title: "OLD BUT GOLD", col: "#ece8f2", dark: "#6b6280", trim: "#ff3a4a", skin: "#e0b090", hair: "#d0cad8", tip: "#ffffff", shoe: "#8a5a32", sole: "#f2ead8", band: "#ff3a4a", num: 1, style: "old",
    spd: 0.75, jmp: 0.7, shot: 1.25, three: 1.3, def: 0.8, passive: "EXPERIENCE", pdesc: "SPECIAL METER FILLS 50% FASTER", special: "TIME OUT", sdesc: "STOPS TIME, THEN A GRANNY SHOT" },
];
export const INK = "#14111c";

// cel shading: three hard bands of light
const TOON = (() => {
  const t = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
})();
const mats = new Map();
export const mat = (c, o = {}) => {
  const k = c + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshToonMaterial({ color: c, gradientMap: TOON, ...o }));
  return mats.get(k);
};
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

// ---- painted decals: the face, the jersey number ----
function decal(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
}
// the face, drawn on a transparent square that sits on the front of the head: mood is calm, happy or hurt
function faceMat(ch, mood) {
  return decal(128, 128, (g) => {
    const ink = INK, hood = ch.style === "hood";
    g.lineCap = "round"; g.lineJoin = "round";
    const eye = (x) => {
      if (hood) { g.fillStyle = mood === "hurt" ? "#ff3a4a" : "#ffffff"; g.shadowColor = g.fillStyle; g.shadowBlur = 10; g.beginPath(); g.ellipse(x, 58, 12, mood === "happy" ? 4 : 8, 0, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; return; }
      if (mood === "happy") { g.strokeStyle = ink; g.lineWidth = 7; g.beginPath(); g.arc(x, 62, 11, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; }
      if (mood === "hurt") { g.strokeStyle = ink; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 9, 50); g.lineTo(x + 9, 66); g.moveTo(x + 9, 50); g.lineTo(x - 9, 66); g.stroke(); return; }
      g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(x, 58, 11, 14, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = ink; g.beginPath(); g.ellipse(x + 3, 60, 6.5, 9, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x + 5, 56, 2.2, 0, Math.PI * 2); g.fill();
    };
    if (ch.style === "fluffy" && mood !== "hurt") {
      // shades
      g.fillStyle = ink; g.beginPath(); g.roundRect(28, 46, 72, 24, 8); g.fill();
      g.fillStyle = "#4fb8ff"; g.fillRect(36, 52, 18, 4); g.fillRect(74, 52, 18, 4);
    } else { eye(46); eye(82); }
    // brows
    if (!hood) {
      g.strokeStyle = ch.style === "old" ? "#ffffff" : ch.style === "bald" ? ink : shade(ch.hair, 0.6); g.lineWidth = ch.style === "bald" ? 8 : 6;
      const fierce = ch.style === "flame" || ch.style === "bald";
      g.beginPath(); g.moveTo(34, fierce ? 36 : 40); g.lineTo(56, fierce ? 44 : 38); g.moveTo(94, fierce ? 36 : 40); g.lineTo(72, fierce ? 44 : 38); g.stroke();
    }
    // mouth
    g.strokeStyle = hood ? "#ffffff" : ink; g.lineWidth = 5;
    if (mood === "happy") { g.fillStyle = hood ? "#ffffff" : "#5a1a1a"; g.beginPath(); g.arc(64, 84, 14, 0, Math.PI); g.fill(); }
    else if (mood === "hurt") { g.beginPath(); g.arc(64, 98, 10, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else if (ch.style === "spiky" || hood) { g.beginPath(); g.moveTo(52, 88); g.quadraticCurveTo(66, 96, 78, 84); g.stroke(); }    // a smirk
    else { g.beginPath(); g.moveTo(54, 90); g.lineTo(74, 90); g.stroke(); }
    if (ch.style === "bald") { g.fillStyle = ink; g.beginPath(); g.ellipse(64, 104, 13, 10, 0, 0, Math.PI * 2); g.fill(); }             // goatee
    if (ch.style === "old") { g.fillStyle = "#ffffff"; g.beginPath(); g.ellipse(52, 80, 14, 6, -0.2, 0, Math.PI * 2); g.ellipse(76, 80, 14, 6, 0.2, 0, Math.PI * 2); g.fill(); }   // mustache
    if (!hood && mood !== "hurt") { g.fillStyle = "rgba(255,110,110,.25)"; g.beginPath(); g.arc(30, 76, 9, 0, 7); g.arc(98, 76, 9, 0, 7); g.fill(); }   // cheeks
  });
}
function numberMat(ch) {
  return decal(128, 128, (g) => {
    g.font = "bold 96px Impact, 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 12; g.strokeStyle = INK; g.strokeText(String(ch.num), 64, 70);
    g.fillStyle = ch.name === "GRAMPS" || ch.name === "VOLT" ? ch.dark : ch.trim; g.fillText(String(ch.num), 64, 70);
  });
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString(); };

// ---- the figure ----
export function makeBaller(ch) {
  const root = new THREE.Group(), pose = new THREE.Group(); root.add(pose);
  const W = ch.wide ? 1.25 : 1, S = ch.wide ? 1.08 : ch.name === "GRAMPS" ? 0.96 : 1;
  pose.scale.setScalar(S);
  // a part: geometry, material, position, parent; with an ink hull
  const part = (geo, m, x, y, z, parent, ink = true) => {
    const mesh = new THREE.Mesh(geo, typeof m === "string" ? mat(m) : m); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    if (ink) {
      geo.computeBoundingSphere(); const r = geo.boundingSphere.radius, k = 1 + 0.028 / Math.max(0.05, r);
      const o = new THREE.Mesh(geo, inkMat); o.scale.setScalar(k); mesh.add(o);
    }
    return mesh;
  };
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 10), ball = (r) => new THREE.SphereGeometry(r, 16, 12);
  const joint = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const limb = ch.style === "hood" ? "#3a3550" : ch.skin;
  // legs: hip -> thigh (shorts) -> knee -> shin -> a chunky sneaker
  const legs = [-1, 1].map((s) => {
    const hip = joint(pose, 0, 0.8, s * 0.15 * W);
    part(cap(0.135 * W, 0.18), ch.dark, 0, -0.16, 0, hip);
    const knee = joint(hip, 0, -0.36, 0);
    part(cap(0.085, 0.2), ch.style === "hood" ? "#2a2440" : ch.skin, 0, -0.15, 0, knee);
    part(new THREE.CylinderGeometry(0.095, 0.095, ch.style === "old" ? 0.16 : 0.07, 12), "#f2ead8", 0, -0.27, 0, knee, false);
    const shoe = part(cap(0.12, 0.16), ch.shoe, 0.06, -0.38, 0, knee); shoe.rotation.z = Math.PI / 2; shoe.scale.set(0.85, 1, 1);
    part(new THREE.BoxGeometry(0.42, 0.05, 0.22), ch.sole, 0.06, -0.47, 0, knee, false);
    return { hip, knee };
  });
  // the body over the hips: shorts, a jersey, the number front and back
  const spine = joint(pose, 0, 0.84, 0);
  part(cap(0.27 * W, 0.06), ch.dark, 0, 0.0, 0, spine).scale.set(0.85, 1, 1);
  const torso = part(cap(0.27 * W, 0.26), ch.col, 0, 0.34, 0, spine); torso.scale.set(0.78, 1, 1);
  part(new THREE.TorusGeometry(0.15, 0.03, 6, 16), ch.trim, 0.02, 0.6, 0, spine, false).rotation.x = Math.PI / 2;      // the collar
  const num = numberMat(ch);
  for (const s of [1, -1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), num); d.position.set(s * 0.215, 0.36, 0); d.rotation.y = s * Math.PI / 2; spine.add(d); }
  for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.02), mat(ch.trim)); st.position.set(0, 0.32, s * 0.27 * W); spine.add(st); }   // side stripes
  // arms: shoulder -> upper arm -> elbow -> forearm, a wristband, the hand
  const arms = [-1, 1].map((s) => {
    const shoulder = joint(spine, 0, 0.55, s * (0.3 * W + 0.07));
    part(ball(0.1 * W), ch.col, 0, 0.0, 0, shoulder);                                      // a sleeve cap
    part(cap(0.075 * W, 0.16), limb, 0, -0.14, 0, shoulder);
    const elbow = joint(shoulder, 0, -0.27, 0);
    part(cap(0.07 * W, 0.14), limb, 0, -0.11, 0, elbow);
    part(new THREE.CylinderGeometry(0.085 * W, 0.085 * W, 0.07, 12), ch.band, 0, -0.2, 0, elbow, false);
    const hand = part(ball(0.095 * W), limb, 0.01, -0.29, 0, elbow);
    return { shoulder, elbow, hand };
  });
  // the head: big, round, on the neck
  const neck = joint(spine, 0, 0.66, 0);
  part(cap(0.08, 0.06), limb, 0, 0.02, 0, neck, false);
  const head = joint(neck, 0, 0.38, 0);
  const skull = part(ball(0.36), ch.style === "hood" ? "#14101f" : ch.skin, 0, 0, 0, head);
  const faces = { calm: faceMat(ch, "calm"), happy: faceMat(ch, "happy"), hurt: faceMat(ch, "hurt") };
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), faces.calm); face.position.set(0.355, -0.02, 0); face.rotation.y = Math.PI / 2; head.add(face);
  if (ch.style !== "hood") for (const s of [-1, 1]) part(ball(0.07), ch.skin, -0.02, -0.03, s * 0.35, head);   // ears
  part(ball(0.05), shade(ch.skin === "#2a2440" ? "#3a3550" : ch.skin, 0.92), 0.37, -0.05, 0, head, false);  // the nose
  const hairM = mat(ch.hair, { emissive: ch.hair, emissiveIntensity: ["FROST", "VOLT", "GRAMPS"].includes(ch.name) ? 0.25 : 0.05 });
  const tipM = mat(ch.tip, { emissive: ch.tip, emissiveIntensity: 0.3 });
  const spike = (r, h, x, y, z, rz, rx = 0, m = hairM) => { const c = part(new THREE.ConeGeometry(r, h, 7), m, x, y, z, head); c.rotation.set(rx, 0, rz); return c; };
  switch (ch.style) {
    case "flame": {
      const cap0 = part(ball(0.37), hairM, -0.04, 0.06, 0, head); cap0.scale.set(1, 0.7, 1.02);            // the hair's base
      [[0.12, 0.3, -0.15, 0.4, 0.2], [0.05, 0.34, 0.02, 0.5, 0.0], [0.12, 0.3, 0.16, 0.4, -0.2], [-0.12, 0.28, -0.12, 0.9, 0.3], [-0.12, 0.28, 0.12, 0.9, -0.3], [-0.25, 0.15, 0, 1.3, 0]]
        .forEach(([x, y, z, rz, rx], i) => spike(0.12, 0.42, x, y, z, rz, rx, i % 2 ? tipM : hairM));
      break;
    }
    case "fluffy": {
      for (const [x, y, z, r] of [[0, 0.24, 0, 0.26], [-0.14, 0.2, 0.18, 0.2], [-0.14, 0.2, -0.18, 0.2], [0.14, 0.24, 0.12, 0.17], [0.14, 0.24, -0.12, 0.17], [-0.24, 0.06, 0, 0.24], [0.02, 0.36, 0, 0.18]])
        part(ball(r), hairM, x, y, z, head);
      break;
    }
    case "spiky": {
      const cap0 = part(ball(0.37), hairM, -0.04, 0.05, 0, head); cap0.scale.set(1, 0.6, 1.02);
      [[0.1, 0.28, -0.12, 0.9, 0.3], [0.08, 0.3, 0.12, 0.9, -0.3], [-0.04, 0.34, 0, 1.1, 0], [-0.2, 0.22, -0.12, 1.4, 0.3], [-0.2, 0.22, 0.12, 1.4, -0.3]]
        .forEach(([x, y, z, rz, rx], i) => spike(0.1, 0.5, x, y, z, rz, rx, i === 2 ? tipM : hairM));
      break;
    }
    case "bald": {
      part(ball(0.06), mat("#ffffff", { transparent: true, opacity: 0.35 }), 0.12, 0.3, -0.1, head, false);   // the shine
      break;
    }
    case "hood": {
      const hood = part(ball(0.44), ch.col, -0.1, 0.04, 0, head); hood.scale.set(1, 1.05, 1.05);
      spike(0.14, 0.3, -0.42, 0.18, 0, 2.0, 0, mat(ch.dark));                                    // the point of the hood
      for (const s of [-1, 1]) part(cap(0.02, 0.22), ch.trim, 0.22, -0.4, s * 0.1, head, false);  // drawstrings
      break;
    }
    case "old": {
      for (const s of [-1, 1]) part(ball(0.14), hairM, -0.1, 0.02, s * 0.3, head);
      part(ball(0.2), hairM, -0.26, 0.02, 0, head);
      part(new THREE.TorusGeometry(0.36, 0.04, 6, 24), ch.band, 0, 0.14, 0, head, false).rotation.x = Math.PI / 2;   // the headband
      break;
    }
  }
  // ---- signature gear ----
  const tails = [];
  const tail = (parent, c, x, y, z, len, w) => { const j = joint(parent, x, y, z); const m = part(new THREE.BoxGeometry(len, w, w * 0.6), c, -len / 2, 0, 0, j); tails.push(j); return m; };
  switch (ch.name) {
    case "BLAZE":
      part(new THREE.TorusGeometry(0.36, 0.045, 6, 24), "#ffffff", 0, 0.13, 0, head, false).rotation.x = Math.PI / 2;   // a white headband
      for (const p of [arms[0].shoulder, arms[0].elbow]) part(cap(0.082, 0.14), "#2a0a0a", 0, -0.12, 0, p, false);     // a black shooting sleeve
      break;
    case "FROST":
      part(new THREE.TorusGeometry(0.17, 0.07, 8, 16), "#eaf8ff", 0.02, 0.62, 0, spine).rotation.x = Math.PI / 2;      // a scarf...
      tail(spine, "#eaf8ff", -0.15, 0.62, 0.1, 0.45, 0.12);                                                              // ...blowing back
      break;
    case "VOLT":
      part(new THREE.TorusGeometry(0.36, 0.035, 6, 24), INK, 0, 0.17, 0, head, false).rotation.x = Math.PI / 2;
      for (const z of [-0.13, 0.13]) part(new THREE.CylinderGeometry(0.075, 0.075, 0.06, 14), mat("#4fb8ff", { emissive: "#4fb8ff", emissiveIntensity: 0.5 }), 0.33, 0.17, z, head).rotation.z = Math.PI / 2;   // goggles up top
      break;
    case "TANK":
      part(new THREE.TorusGeometry(0.2, 0.025, 6, 20), "#ffd21f", 0.03, 0.58, 0, spine, false).rotation.set(Math.PI / 2, 0.35, 0);
      part(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 14), mat("#ffd21f", { emissive: "#ffb000", emissiveIntensity: 0.35 }), 0.23, 0.44, 0, spine).rotation.z = Math.PI / 2;   // the medallion
      for (const L of legs) part(ball(0.11), "#1c1a24", 0.04, 0.0, 0, L.knee);                                         // knee pads
      break;
    case "SHADE":
      tail(neck, ch.dark, -0.22, 0.3, -0.08, 0.6, 0.13); tail(neck, ch.col, -0.22, 0.26, 0.08, 0.5, 0.11);             // ribbons off the hood
      for (const A of arms) part(cap(0.078, 0.1), "#e6e1ee", 0, -0.1, 0, A.elbow, false);                              // taped forearms
      break;
    case "GRAMPS":
      for (const z of [-0.13, 0.13]) { const r = part(new THREE.TorusGeometry(0.08, 0.015, 6, 16), INK, 0.37, 0.0, z, head, false); r.rotation.y = Math.PI / 2; }   // round glasses
      for (const L of legs) part(ball(0.11), "#9aa0b4", 0.02, -0.02, 0, L.knee);                                       // knee braces
      break;
  }
  root.userData.ch = ch;
  return { root, pose, spine, legs, arms, neck, head, skull, face, faces, tails, mood: "calm", scale: S };
}

// Pose a baller for this frame. s: { speed, walk, air, guard, dribble ({ hand, low }), shoot, follow, dunk, hang, block,
// reach, fall, dash, toes, dance, land, mood, t }
const lerp = (a, b, k) => a + (b - a) * k;
export function animate(b, s) {
  const run = Math.min(1, s.speed / 5), cyc = s.walk * 2.4, swing = Math.sin(cyc);
  const L = b.legs, A = b.arms, P = { hip: [0, 0], knee: [0, 0], sh: [0, 0], shX: [0, 0], el: [0, 0], spine: 0, twist: 0, drop: 0 };
  for (let k = 0; k < 2; k++) { const sw = k ? -swing : swing; P.hip[k] = sw * 0.8 * run; P.knee[k] = -Math.max(0, -sw) * 1.1 * run - 0.15 * run; }
  // breathing when standing
  P.drop = s.speed < 0.3 ? Math.sin(s.t * 3) * 0.012 : 0;
  if (s.guard && !s.air) { P.hip = [0.55, 0.55]; P.knee = [-1.0, -1.0]; P.drop = 0.12; P.spine = -0.25; P.shX = [0.9, 0.9]; P.sh = [0.5, 0.5]; P.el = [0.6, 0.6]; }
  if (s.air) { P.hip = [0.7, 0.2]; P.knee = [-1.1, -0.5]; }
  if (s.land > 0) { P.drop = 0.1 * s.land; P.knee = [-0.7, -0.7]; P.hip = [0.4, 0.4]; }
  if (!s.guard) for (let k = 0; k < 2; k++) { P.sh[k] = (k ? swing : -swing) * 0.7 * run; P.el[k] = 0.4 + 0.6 * run; }
  if (s.dribble) {
    const h = s.dribble.hand > 0 ? 1 : 0, o = 1 - h, low = s.dribble.low;
    P.sh[h] = lerp(0.9, 0.35, low); P.el[h] = lerp(1.2, 0.1, low); P.shX[h] = 0.25;
    P.sh[o] = 0.9; P.el[o] = 1.2; P.shX[o] = 0.35; P.spine = -0.18 - run * 0.1; P.drop = Math.max(P.drop, 0.05); P.twist = s.dribble.hand * 0.12;
  }
  if (s.dash) { P.spine = -0.45; P.hip = [1.1, -0.6]; P.knee = [-0.3, -1.3]; }
  if (s.shoot) { P.sh = [2.7, 2.7]; P.el = [1.5, 1.5]; P.shX = [0.15, 0.15]; P.spine = 0.05; }
  if (s.follow > 0) { P.sh = [2.4, 2.4]; P.el = [0.05, 0.05]; P.shX = [0.1, 0.1]; }
  if (s.dunk) { P.sh = [3.1, 2.4]; P.el = [0.2, 0.6]; P.hip = [1.1, 0.2]; P.knee = [-1.4, -0.4]; P.spine = 0.15; }
  if (s.hang) { P.sh = [3.0, 3.0]; P.el = [0, 0]; P.hip = [0.15, -0.1]; P.knee = [-0.4, -0.2]; P.spine = 0.1; }
  if (s.block) { P.sh = [3.0, 3.0]; P.el = [0.1, 0.1]; P.shX = [0.25, 0.25]; }
  if (s.reach) { P.sh = [1.6, -0.3]; P.el = [0.1, 0.5]; P.spine = -0.5; P.hip = [0.7, -0.2]; P.knee = [-0.8, -0.3]; }
  if (s.dance) { const d = Math.sin(s.t * 10); P.sh = [2.6 + d * 0.4, 2.6 - d * 0.4]; P.el = [0.8, 0.8]; P.drop = -Math.abs(d) * 0.1; }
  for (let k = 0; k < 2; k++) {
    const side = k ? 1 : -1;
    L[k].hip.rotation.z = P.hip[k]; L[k].knee.rotation.z = P.knee[k];
    A[k].shoulder.rotation.z = P.sh[k]; A[k].shoulder.rotation.x = -side * P.shX[k]; A[k].elbow.rotation.z = P.el[k];
  }
  b.spine.rotation.z = P.spine; b.spine.rotation.y = P.twist;
  b.pose.rotation.z = s.fall ? 1.4 : 0;
  b.pose.position.y = (s.fall ? 0.3 : -P.drop) * b.scale + (s.toes ? 0.06 : 0);
  if (s.fall) { L[0].hip.rotation.z = 0.9; L[1].hip.rotation.z = 0.3; A[0].shoulder.rotation.z = 2.2; A[1].shoulder.rotation.z = 0.6; }
  b.neck.rotation.z = s.fall ? 0.3 : -P.spine * 0.6;
  for (const [k, t] of (b.tails ?? []).entries()) t.rotation.z = 1.15 - run * 0.85 - (s.air ? 0.35 : 0) + Math.sin(s.t * 14 + k * 1.7) * (0.1 + run * 0.15);
  const mood = s.mood ?? "calm";
  if (mood !== b.mood) { b.mood = mood; b.face.material = b.faces[mood]; }
}
