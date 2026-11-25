// The six ballers as blocky 3D figures, built from boxes with an ink outline around every part (the 2D game's
// outlined pixel look, in 3D). Each figure faces +x; the legs and arms hang from pivots so they can be animated.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export const CHARS = [
  { name: "BLAZE", title: "THE HOTHEAD", col: "#ff4a3a", dark: "#a8201e", skin: "#d79a6a", hair: "#ff9a2a", tip: "#ffe03c", shoe: "#ffe03c", band: "#ff4a3a", num: 3, style: "flame",
    spd: 1, jmp: 1, shot: 1, three: 1, def: 1, passive: "HOT HAND", pdesc: "AWAKENS AFTER 2 MAKES", special: "INFERNO", sdesc: "AWAKEN 10S + KNOCKBACK" },
  { name: "FROST", title: "COLD BLOODED", col: "#5cc4ff", dark: "#1f62ae", skin: "#f0c8a8", hair: "#e6fbff", tip: "#bfefff", shoe: "#e6fbff", band: "#ffffff", num: 7, style: "fluffy",
    spd: 0.95, jmp: 1, shot: 1.05, three: 1.15, def: 0.95, passive: "ICE VEINS", pdesc: "BIGGER PERFECT ZONE", special: "DEEP FREEZE", sdesc: "ICE SPIKES FREEZE HIM" },
  { name: "VOLT", title: "SPEED DEMON", col: "#ffe03c", dark: "#a87a12", skin: "#8d5a3b", hair: "#fff6a0", tip: "#ffffff", shoe: "#3a3550", band: "#3a3550", num: 9, style: "spiky",
    spd: 1.15, jmp: 1.05, shot: 0.95, three: 0.9, def: 1, passive: "QUICK FEET", pdesc: "DASHES COST HALF STAMINA", special: "THUNDER STEP", sdesc: "WARP TO RIM AND DUNK" },
  { name: "TANK", title: "THE BRICK WALL", col: "#5ad84a", dark: "#22882a", skin: "#6b4a3a", hair: "#1c1a24", tip: "#1c1a24", shoe: "#ff6a2a", band: "#22882a", num: 0, style: "bald", wide: 1,
    spd: 0.85, jmp: 0.85, shot: 0.95, three: 0.7, def: 1.3, passive: "ROCK SOLID", pdesc: "DRIVES BOUNCE OFF HIM", special: "EARTHQUAKE", sdesc: "TWO QUAKES. JUMP BOTH!" },
  { name: "SHADE", title: "THE PICKPOCKET", col: "#9a7cff", dark: "#3a2a8a", skin: "#2a2440", hair: "#1a1430", tip: "#6a5ac0", shoe: "#6a5ac0", band: "#3a2a8a", num: 4, style: "hood",
    spd: 1.05, jmp: 1.1, shot: 0.95, three: 0.95, def: 1.2, passive: "STICKY HANDS", pdesc: "STEALS WORK MORE OFTEN", special: "BLACK HOLE", sdesc: "SUCKS THE BALL IN" },
  { name: "GRAMPS", title: "OLD BUT GOLD", col: "#e6e1ee", dark: "#6b6280", skin: "#e0b090", hair: "#bdb6cc", tip: "#ffffff", shoe: "#8a5a32", band: "#ff3a4a", num: 1, style: "old",
    spd: 0.75, jmp: 0.7, shot: 1.25, three: 1.3, def: 0.8, passive: "EXPERIENCE", pdesc: "SP FILLS 50% FASTER", special: "TIME OUT", sdesc: "TIMESTOP GRANNY SHOT" },
];
export const INK = "#0d0a14";

const mats = new Map();
export const mat = (c, o = {}) => {
  const k = c + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o }));
  return mats.get(k);
};
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
const glowMat = (c) => mat(c, { emissive: c, emissiveIntensity: 1 });

// a jersey number, as a tiny pixel texture for the front and back of the shirt
const numTex = new Map();
function jerseyFace(ch) {
  if (!numTex.has(ch.name)) {
    const cv = document.createElement("canvas"); cv.width = 12; cv.height = 12;
    const g = cv.getContext("2d");
    g.fillStyle = ch.col; g.fillRect(0, 0, 12, 12);
    g.fillStyle = ch.dark; g.fillRect(0, 0, 12, 1); g.fillRect(3, 1, 6, 1);                 // the collar
    // 3x5 pixel digits
    const D = { 0: "111101101101111", 1: "010110010010111", 3: "111001111001111", 4: "101101111001001", 7: "111001010010010", 9: "111101111001111" }[ch.num];
    g.fillStyle = ch.name === "GRAMPS" || ch.name === "VOLT" ? ch.dark : "#ffffff";
    for (let i = 0; i < 15; i++) if (D[i] === "1") g.fillRect(4 + (i % 3) * 1.4, 4 + Math.floor(i / 3) * 1.4, 1.4, 1.4);
    const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
    numTex.set(ch.name, new THREE.MeshLambertMaterial({ map: t, flatShading: true }));
  }
  return numTex.get(ch.name);
}

// A baller. Returns { root, pose, legs, arms, head, body } where root carries position and facing, pose carries leans
// and falls, and the pivots swing for walking, shooting, blocking.
export function makeBaller(ch) {
  const root = new THREE.Group(), pose = new THREE.Group(); root.add(pose);
  const wide = ch.wide ? 1.22 : 1, S = ch.wide ? 1.06 : ch.name === "GRAMPS" ? 0.97 : 1;
  pose.scale.setScalar(S);
  const box = (w, h, d, m, x, y, z, parent = pose, ink = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === "string" ? mat(m) : m);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    if (ink) { const o = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.05, d + 0.05), inkMat); o.position.copy(mesh.position); o.rotation.copy(mesh.rotation); parent.add(o); mesh.userData.ink = o; }
    return mesh;
  };
  const turn = (m, rx = 0, ry = 0, rz = 0) => { m.rotation.set(rx, ry, rz); if (m.userData.ink) m.userData.ink.rotation.set(rx, ry, rz); return m; };
  // legs: shorts, shin, sock, shoe
  const legs = [-1, 1].map((s) => {
    const pv = new THREE.Group(); pv.position.set(0, 0.78, s * 0.14 * wide); pose.add(pv);
    box(0.28, 0.34, 0.25 * wide, ch.dark, 0, -0.15, 0, pv);
    box(0.18, 0.3, 0.18, ch.name === "SHADE" ? "#2a2440" : ch.skin, 0, -0.45, 0, pv);
    box(0.19, ch.name === "GRAMPS" ? 0.2 : 0.08, 0.19, "#f2ead8", 0, ch.name === "GRAMPS" ? -0.55 : -0.6, 0, pv, false);
    if (ch.name === "GRAMPS") box(0.195, 0.04, 0.195, "#ff3a4a", 0, -0.5, 0, pv, false);
    box(0.34, 0.13, 0.24, ch.shoe, 0.05, -0.71, 0, pv);
    box(0.35, 0.03, 0.25, "#f2ead8", 0.05, -0.77, 0, pv, false);
    return pv;
  });
  // shorts band with a side stripe, the jersey with its number front and back
  box(0.38, 0.16, 0.56 * wide, ch.dark, 0, 0.84, 0);
  for (const s of [-1, 1]) box(0.06, 0.32, 0.01, ch.col, 0, 0.7, s * 0.28 * wide + s * 0.0, pose, false);
  const jf = jerseyFace(ch), jc = mat(ch.col);
  const torso = box(0.38, 0.56, 0.56 * wide, [jf, jf, jc, jc, jc, jc], 0, 1.12, 0);
  box(0.39, 0.05, 0.57 * wide, ch.dark, 0, 0.88, 0, pose, false);                             // the hem
  if (ch.name === "VOLT") for (const s of [-1, 1]) { const b = box(0.1, 0.32, 0.01, ch.dark, 0, 1.12, s * 0.285 * wide, pose, false); turn(b, 0, 0, 0.5); }   // a bolt down each side
  // arms: skin, a wristband, the hand
  const arms = [-1, 1].map((s) => {
    const pv = new THREE.Group(); pv.position.set(0, 1.33, s * (0.34 * wide + 0.02)); pose.add(pv);
    box(0.15 * (ch.wide ? 1.25 : 1), 0.46, 0.15 * (ch.wide ? 1.25 : 1), ch.skin === "#2a2440" ? "#3a3550" : ch.skin, 0, -0.21, 0, pv);
    box(0.17, 0.07, 0.17, ch.band, 0, -0.42, 0, pv);
    box(0.15, 0.11, 0.15, ch.skin === "#2a2440" ? "#3a3550" : ch.skin, 0, -0.51, 0, pv);
    return pv;
  });
  // the head
  const head = new THREE.Group(); head.position.set(0, 1.66, 0); pose.add(head);
  const face = ch.style === "hood" ? "#14101f" : ch.skin;
  // light hair glows a little, so white and blond read as white and blond under the arena lights
  const hairMat = mat(ch.hair, { emissive: ch.hair, emissiveIntensity: ["FROST", "VOLT", "GRAMPS"].includes(ch.name) ? 0.35 : 0.1 });
  box(0.52, 0.5, 0.5, face, 0, 0, 0, head);
  const eye = (z, c = INK, m = null) => box(0.03, 0.1, 0.07, m ?? c, 0.26, 0.03, z, head, false);
  if (ch.style !== "hood") { eye(-0.11); eye(0.11); box(0.03, 0.03, 0.12, INK, 0.26, -0.13, 0.02, head, false); }          // eyes and a mouth
  box(0.08, 0.08, 0.08, ch.skin, 0.28, -0.04, 0, head, false);                                                                     // the nose
  switch (ch.style) {
    case "flame": {
      box(0.56, 0.12, 0.54, hairMat, -0.02, 0.27, 0, head);
      box(0.2, 0.22, 0.54, hairMat, -0.2, 0.1, 0, head);                                                        // the back of it
      [[0.12, -0.16, 0.3], [0.02, 0, 0.4], [0.14, 0.16, 0.32], [-0.14, -0.08, 0.34], [-0.14, 0.12, 0.3]].forEach(([x, z, h], i) => {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.1, h, 4), mat(i % 2 ? ch.tip : ch.hair)); sp.position.set(x, 0.33 + h / 2, z); sp.rotation.set(0, Math.PI / 4, -0.35); sp.castShadow = true; head.add(sp);
      });
      box(0.03, 0.04, 0.1, INK, 0.265, 0.12, -0.11, head, false); box(0.03, 0.04, 0.1, INK, 0.265, 0.12, 0.11, head, false);     // angry brows
      break;
    }
    case "fluffy": {
      box(0.62, 0.22, 0.6, hairMat, -0.03, 0.3, 0, head); box(0.4, 0.16, 0.5, hairMat, -0.02, 0.45, 0, head);
      box(0.3, 0.36, 0.62, hairMat, -0.2, 0.1, 0, head);
      box(0.03, 0.11, 0.44, INK, 0.27, 0.04, 0, head, false);                                                    // the shades
      box(0.031, 0.03, 0.12, "#5cc4ff", 0.272, 0.07, -0.11, head, false); box(0.031, 0.03, 0.12, "#5cc4ff", 0.272, 0.07, 0.11, head, false);
      break;
    }
    case "spiky": {
      box(0.54, 0.1, 0.52, hairMat, -0.02, 0.27, 0, head);
      // swept back like a bolt
      [[0.12, -0.14, 0.34, 0.55, 0.25], [0.1, 0.13, 0.36, 0.6, -0.25], [-0.04, 0, 0.46, 0.8, 0], [-0.18, -0.12, 0.3, 1.1, 0.2], [-0.18, 0.12, 0.3, 1.1, -0.2]].forEach(([x, z, h, r, rx]) => {
        const b = box(0.12, h, 0.12, hairMat, x, 0.3 + h / 3, z, head); turn(b, rx, 0, r);
      });
      break;
    }
    case "bald": {
      box(0.1, 0.04, 0.12, "#a07a66", 0.05, 0.255, -0.08, head, false);                                          // the shine on top
      box(0.06, 0.12, 0.2, INK, 0.27, -0.18, 0, head, false);                                                    // the goatee
      box(0.03, 0.04, 0.12, INK, 0.265, 0.12, -0.11, head, false); box(0.03, 0.04, 0.12, INK, 0.265, 0.12, 0.11, head, false);
      break;
    }
    case "hood": {
      box(0.6, 0.6, 0.58, ch.col, -0.04, 0.04, 0, head);
      box(0.5, 0.2, 0.5, ch.dark, -0.25, 0.25, 0, head);                                                         // the hood's point at the back
      box(0.04, 0.38, 0.4, "#14101f", 0.27, -0.02, 0, head, false);                                              // the dark inside
      eye(-0.1, null, glowMat("#ffffff")); eye(0.1, null, glowMat("#ffffff"));
      box(0.03, 0.03, 0.22, "#ffffff", 0.29, -0.14, 0, head, false);                                             // the grin
      break;
    }
    case "old": {
      box(0.24, 0.2, 0.54, hairMat, -0.17, 0.02, 0, head);                                                       // gray hair round the back
      box(0.54, 0.07, 0.54, ch.band, 0, 0.17, 0, head);                                                          // the headband
      box(0.04, 0.05, 0.26, "#ffffff", 0.27, -0.09, 0, head, false);                                             // the mustache
      box(0.03, 0.03, 0.1, "#ffffff", 0.265, 0.11, -0.11, head, false); box(0.03, 0.03, 0.1, "#ffffff", 0.265, 0.11, 0.11, head, false);
      break;
    }
  }
  root.userData.ch = ch;
  return { root, pose, legs, arms, head, torso, scale: S };
}

// Pose a baller for this frame. state: { speed, walk, air, up (arms up: shooting, dunking), block, reach, fall, lean, dance, t }
export function animate(b, s) {
  const sw = s.air ? 0.45 : Math.sin(s.walk * 2.4) * Math.min(1, s.speed / 4) * 0.9;
  b.legs[0].rotation.z = s.air ? 0.5 : sw; b.legs[1].rotation.z = s.air ? -0.25 : -sw;
  b.arms.forEach((a, k) => {
    let r = (k ? -sw : sw) * 0.8, x = 0;
    if (s.up || s.block) r = 2.85;
    else if (s.reach) { r = 1.55; x = k ? -0.2 : 0.2; }
    else if (s.dance) r = 2.6 + Math.sin(s.t * 10 + k * 3) * 0.4;
    a.rotation.z = r; a.rotation.x = x;
  });
  b.pose.rotation.z = s.fall ? 1.35 : s.lean ?? 0;
  b.pose.position.y = s.fall ? 0.25 * b.scale : s.toes ? 0.08 : s.dance ? Math.abs(Math.sin(s.t * 10)) * 0.12 : 0;
  b.head.rotation.z = s.fall ? 0.2 : 0;
}
