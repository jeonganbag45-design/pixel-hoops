// The six ballers as outlined voxel figures with a real rig: hips, knees, a spine, shoulders, elbows, a neck.
// Faces, jerseys and shorts are tiny hand-placed pixel textures (the 2D game's look on 3D blocks), and faces change
// with the moment: focused, happy, hurt. Each figure faces +x.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export const CHARS = [
  { name: "BLAZE", title: "THE HOTHEAD", col: "#ff4a3a", dark: "#a8201e", trim: "#ffe03c", skin: "#d79a6a", hair: "#ff7a1a", tip: "#ffe03c", shoe: "#ffe03c", sole: "#a8201e", band: "#ff4a3a", num: 3, style: "flame",
    spd: 1, jmp: 1, shot: 1, three: 1, def: 1, passive: "HOT HAND", pdesc: "AWAKENS AFTER 2 MAKES", special: "INFERNO", sdesc: "AWAKEN 10S + KNOCKBACK" },
  { name: "FROST", title: "COLD BLOODED", col: "#5cc4ff", dark: "#1f62ae", trim: "#e6fbff", skin: "#f0c8a8", hair: "#f2fbff", tip: "#bfefff", shoe: "#e6fbff", sole: "#5cc4ff", band: "#ffffff", num: 7, style: "fluffy",
    spd: 0.95, jmp: 1, shot: 1.05, three: 1.15, def: 0.95, passive: "ICE VEINS", pdesc: "BIGGER PERFECT ZONE", special: "DEEP FREEZE", sdesc: "ICE SPIKES FREEZE HIM" },
  { name: "VOLT", title: "SPEED DEMON", col: "#ffd21a", dark: "#a87a12", trim: "#3a3550", skin: "#8d5a3b", hair: "#fff6a0", tip: "#ffffff", shoe: "#3a3550", sole: "#ffd21a", band: "#3a3550", num: 9, style: "spiky",
    spd: 1.15, jmp: 1.05, shot: 0.95, three: 0.9, def: 1, passive: "QUICK FEET", pdesc: "DASHES COST HALF STAMINA", special: "THUNDER STEP", sdesc: "WARP TO RIM AND DUNK" },
  { name: "TANK", title: "THE BRICK WALL", col: "#5ad84a", dark: "#22882a", trim: "#f2ead8", skin: "#6b4a3a", hair: "#1c1a24", tip: "#1c1a24", shoe: "#ff6a2a", sole: "#f2ead8", band: "#22882a", num: 0, style: "bald", wide: 1,
    spd: 0.85, jmp: 0.85, shot: 0.95, three: 0.7, def: 1.3, passive: "ROCK SOLID", pdesc: "DRIVES BOUNCE OFF HIM", special: "EARTHQUAKE", sdesc: "TWO QUAKES. JUMP BOTH!" },
  { name: "SHADE", title: "THE PICKPOCKET", col: "#9a7cff", dark: "#3a2a8a", trim: "#14101f", skin: "#2a2440", hair: "#1a1430", tip: "#6a5ac0", shoe: "#6a5ac0", sole: "#14101f", band: "#3a2a8a", num: 4, style: "hood",
    spd: 1.05, jmp: 1.1, shot: 0.95, three: 0.95, def: 1.2, passive: "STICKY HANDS", pdesc: "STEALS WORK MORE OFTEN", special: "BLACK HOLE", sdesc: "SUCKS THE BALL IN" },
  { name: "GRAMPS", title: "OLD BUT GOLD", col: "#ece8f2", dark: "#6b6280", trim: "#ff3a4a", skin: "#e0b090", hair: "#c9c3d6", tip: "#ffffff", shoe: "#8a5a32", sole: "#f2ead8", band: "#ff3a4a", num: 1, style: "old",
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

// ---- pixel textures: drawn one pixel at a time on tiny canvases ----
function pixTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d"), px = (x, y, c, ww = 1, hh = 1) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
  draw(px, g);
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({ map: t, flatShading: true });
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString(); };
const DIGITS = { 0: "111101101101111", 1: "010110010010111", 3: "111001111001111", 4: "101101111001001", 7: "111001010010010", 9: "111101111001111" };
// the face on the front of the head, 12x12: mood is "calm", "happy" or "hurt"
function faceTex(ch, mood) {
  return pixTex(12, 12, (px) => {
    const skin = ch.style === "hood" ? "#14101f" : ch.skin, dk = shade(skin, 0.72), ink = INK;
    px(0, 0, skin, 12, 12);
    px(5, 6, dk, 2, 2);                                                                            // the nose's shadow
    if (ch.style === "hood") {
      // only the eyes and a grin glow in the dark of the hood
      const e = mood === "hurt" ? "#ff3a4a" : "#ffffff";
      if (mood === "happy") { px(2, 4, e, 3, 1); px(7, 4, e, 3, 1); } else { px(2, 4, e, 3, 2); px(7, 4, e, 3, 2); }
      px(3, 8, "#ffffff", 6, 1); px(2, 7, "#ffffff"); px(9, 7, "#ffffff");
      return;
    }
    // eyes: white with a pupil, squeezed shut when happy, X when hurt
    const eye = (x) => {
      if (mood === "happy") { px(x, 5, ink, 3, 1); px(x + 1, 4, ink); }
      else if (mood === "hurt") { px(x, 4, ink); px(x + 2, 4, ink); px(x + 1, 5, ink); px(x, 6, ink); px(x + 2, 6, ink); }
      else { px(x, 4, "#ffffff", 3, 2); px(x + 1, 4, ink, 2, 2); }
    };
    eye(1); eye(8);
    // brows, by character
    const brow = ch.style === "old" ? "#ffffff" : ch.style === "bald" ? ink : shade(ch.hair, 0.8);
    if (ch.style === "flame" || ch.style === "bald") { px(1, 2, brow, 3, 1); px(8, 2, brow, 3, 1); px(3, 3, brow); px(8, 3, brow); }   // fierce
    else if (ch.style === "old") { px(1, 3, brow, 3, 1); px(8, 3, brow, 3, 1); px(0, 1, dk, 2, 1); px(10, 1, dk, 2, 1); }            // bushy, and the wrinkles
    else { px(1, 3, brow, 3, 1); px(8, 3, brow, 3, 1); }
    // the mouth
    if (mood === "happy") { px(3, 9, ink, 6, 1); px(4, 10, "#ff86a0", 4, 1); px(2, 8, ink); px(9, 8, ink); }
    else if (mood === "hurt") { px(4, 9, ink, 4, 1); px(3, 10, ink); px(8, 10, ink); }
    else if (ch.style === "spiky") { px(4, 9, ink, 4, 1); px(8, 8, ink); }                                                              // a smirk
    else px(4, 9, ink, 4, 1);
    // extras
    if (ch.style === "fluffy" && mood !== "hurt") { px(0, 4, ink, 12, 2); px(1, 4, "#5cc4ff", 2, 1); px(8, 4, "#5cc4ff", 2, 1); px(5, 4, ink, 2, 1); }   // the shades
    if (ch.style === "bald") { px(3, 10, ink, 6, 2); px(4, 9, ink, 4, 1); }                                                                             // the goatee
    if (ch.style === "old") { px(2, 8, "#ffffff", 8, 1); px(1, 9, "#ffffff", 2, 1); px(9, 9, "#ffffff", 2, 1); }                                        // the mustache
  });
}
function jerseyTex(ch, back) {
  return pixTex(12, 12, (px) => {
    px(0, 0, ch.col, 12, 12);
    px(0, 0, ch.trim, 12, 1); px(3, 1, ch.trim, 6, 1); px(4, 2, ch.trim, 4, 1);                 // the collar
    if (!back) px(5, 1, shade(ch.col, 0.75), 2, 2);
    px(0, 11, ch.dark, 12, 1);                                                                    // the hem
    const D = DIGITS[ch.num], c = ch.style === "old" || ch.style === "spiky" ? ch.dark : "#ffffff";
    for (let i = 0; i < 15; i++) if (D[i] === "1") px(back ? 4 + (i % 3) : 7 + (i % 3) * 1, (back ? 4 : 4) + Math.floor(i / 3), c);
    if (!back) { px(2, 4, ch.trim, 3, 1); }                                                       // a little chest mark
  });
}
const sideTex = (ch, stripe) => pixTex(4, 12, (px) => { px(0, 0, ch.col, 4, 12); px(stripe ? 1 : 0, 0, stripe ? ch.trim : ch.col, stripe ? 2 : 0, 12); px(0, 0, ch.trim, 4, 1); px(0, 11, ch.dark, 4, 1); });
const shortsTex = (ch) => pixTex(8, 8, (px) => { px(0, 0, ch.dark, 8, 8); px(0, 0, shade(ch.dark, 0.7), 8, 1); px(0, 7, ch.trim, 8, 1); px(6, 0, ch.col, 1, 8); });
const shoeTex = (ch) => pixTex(8, 4, (px) => { px(0, 0, ch.shoe, 8, 4); px(0, 3, ch.sole, 8, 1); px(5, 0, "#f2ead8", 3, 1); px(1, 1, shade(ch.shoe, 0.7), 3, 1); });

// ---- the figure ----
export function makeBaller(ch) {
  const root = new THREE.Group(), pose = new THREE.Group(); root.add(pose);
  const W = ch.wide ? 1.2 : 1, S = ch.wide ? 1.07 : ch.name === "GRAMPS" ? 0.96 : 1;
  pose.scale.setScalar(S);
  const box = (w, h, d, m, x, y, z, parent, ink = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof m === "string" ? mat(m) : m);
    mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
    if (ink) { const o = new THREE.Mesh(new THREE.BoxGeometry(w + 0.045, h + 0.045, d + 0.045), inkMat); o.position.copy(mesh.position); parent.add(o); mesh.userData.ink = o; }
    return mesh;
  };
  const turn = (m, rx = 0, ry = 0, rz = 0) => { m.rotation.set(rx, ry, rz); m.userData.ink?.rotation.set(rx, ry, rz); return m; };
  const joint = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const limbSkin = ch.style === "hood" ? "#3a3550" : ch.skin;
  const sh = shortsTex(ch), sMat = [sh, sh, mat(ch.dark), mat(ch.dark), sh, sh], shoe = shoeTex(ch), shoeMat = [shoe, shoe, mat(ch.shoe), mat(ch.sole), shoe, shoe];
  // legs: hip -> thigh (shorts) -> knee -> shin, sock -> shoe
  const legs = [-1, 1].map((s) => {
    const hip = joint(pose, 0, 0.82, s * 0.14 * W);
    box(0.27, 0.36, 0.24 * W, sMat, 0, -0.16, 0, hip);
    const knee = joint(hip, 0, -0.36, 0);
    box(0.17, 0.3, 0.17, ch.style === "hood" ? "#2a2440" : ch.skin, 0, -0.14, 0, knee);
    const sockH = ch.style === "old" ? 0.2 : 0.09;
    box(0.18, sockH, 0.18, "#f2ead8", 0, -0.3 + sockH / 2 + 0.01, 0, knee, false);
    if (ch.style === "old") { box(0.185, 0.03, 0.185, ch.band, 0, -0.14, 0, knee, false); box(0.185, 0.03, 0.185, "#3a6aff", 0, -0.18, 0, knee, false); }
    box(0.34, 0.13, 0.23, shoeMat, 0.05, -0.39, 0, knee);
    return { hip, knee };
  });
  // the spine carries the torso, the arms and the head, so the body can lean and twist over the hips
  const spine = joint(pose, 0, 0.84, 0);
  box(0.4, 0.16, 0.56 * W, sMat, 0, 0.0, 0, spine);                                                  // the waistband
  const jf = jerseyTex(ch, false), jb = jerseyTex(ch, true), js = sideTex(ch, true);
  box(0.4, 0.58, 0.56 * W, [jf, jb, mat(ch.trim), mat(ch.dark), js, js], 0, 0.36, 0, spine);
  if (ch.style === "spiky") for (const s of [-1, 1]) turn(box(0.1, 0.34, 0.012, ch.dark, 0, 0.36, s * 0.285 * W, spine, false), 0, 0, 0.5);   // VOLT's bolts
  const arms = [-1, 1].map((s) => {
    const shoulder = joint(spine, 0, 0.58, s * (0.28 * W + 0.1));
    box(0.15 * (ch.wide ? 1.3 : 1), 0.27, 0.15 * (ch.wide ? 1.3 : 1), limbSkin, 0, -0.11, 0, shoulder);
    const elbow = joint(shoulder, 0, -0.25, 0);
    box(0.14 * (ch.wide ? 1.25 : 1), 0.22, 0.14 * (ch.wide ? 1.25 : 1), limbSkin, 0, -0.1, 0, elbow);
    box(0.165, 0.07, 0.165, ch.band, 0, -0.19, 0, elbow);
    const hand = box(0.15, 0.12, 0.13, limbSkin, 0.01, -0.28, 0, elbow);
    return { shoulder, elbow, hand };
  });
  // the head, on the neck
  const neck = joint(spine, 0, 0.66, 0);
  box(0.16, 0.08, 0.18, limbSkin, 0, 0.0, 0, neck, false);
  const head = joint(neck, 0, 0.3, 0);
  const faces = { calm: faceTex(ch, "calm"), happy: faceTex(ch, "happy"), hurt: faceTex(ch, "hurt") };
  const skinM = mat(ch.style === "hood" ? "#14101f" : ch.skin);
  const skull = box(0.52, 0.5, 0.5, [faces.calm, skinM, skinM, skinM, skinM, skinM], 0, 0, 0, head);
  if (ch.style !== "hood") for (const s of [-1, 1]) box(0.1, 0.14, 0.05, ch.skin, -0.02, -0.02, s * 0.27, head, false);   // ears
  box(0.08, 0.08, 0.07, shade(ch.skin, 0.9), 0.28, -0.04, 0, head, false);                                                  // the nose
  const hairM = mat(ch.hair, { emissive: ch.hair, emissiveIntensity: ["FROST", "VOLT", "GRAMPS"].includes(ch.name) ? 0.3 : 0.08 });
  const tipM = mat(ch.tip, { emissive: ch.tip, emissiveIntensity: 0.25 });
  switch (ch.style) {
    case "flame": {
      box(0.56, 0.12, 0.54, hairM, -0.02, 0.27, 0, head); box(0.22, 0.3, 0.54, hairM, -0.18, 0.08, 0, head);
      box(0.08, 0.1, 0.54, hairM, 0.24, 0.2, 0, head, false);                                                      // a fringe over the brow
      // flames swept back, in two colors, the tips lit
      [[0.14, -0.16, 0.26, 0.3], [0.1, 0.0, 0.38, 0.45], [0.14, 0.16, 0.28, 0.3], [-0.06, -0.12, 0.34, 0.6], [-0.08, 0.13, 0.34, 0.6], [-0.22, 0, 0.3, 0.9]].forEach(([x, z, h, r], i) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.09, h, 4), i % 2 ? tipM : hairM); cone.position.set(x, 0.3 + h / 2.3, z); cone.rotation.set(0, Math.PI / 4, r); cone.castShadow = true; head.add(cone);
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.045, h * 0.4, 4), tipM); tip.position.set(x - Math.sin(r) * h * 0.4, 0.3 + h * 0.85, z); tip.rotation.copy(cone.rotation); head.add(tip);
      });
      break;
    }
    case "fluffy": {
      box(0.62, 0.2, 0.6, hairM, -0.03, 0.3, 0, head); box(0.44, 0.14, 0.5, hairM, -0.04, 0.44, 0.02, head);
      box(0.3, 0.38, 0.62, hairM, -0.18, 0.08, 0, head); box(0.1, 0.12, 0.6, hairM, 0.24, 0.22, 0, head, false);
      for (const s of [-1, 1]) box(0.2, 0.22, 0.1, hairM, -0.06, 0.16, s * 0.3, head, false);                        // the puffs over the ears
      break;
    }
    case "spiky": {
      box(0.54, 0.1, 0.52, hairM, -0.02, 0.27, 0, head); box(0.18, 0.22, 0.52, hairM, -0.2, 0.12, 0, head);
      [[0.12, -0.14, 0.34, 0.55, 0.25], [0.1, 0.13, 0.36, 0.6, -0.25], [-0.04, 0, 0.46, 0.8, 0], [-0.18, -0.12, 0.3, 1.1, 0.2], [-0.18, 0.12, 0.3, 1.1, -0.2]].forEach(([x, z, h, r, rx], i) => {
        turn(box(0.11, h, 0.11, i === 2 ? tipM : hairM, x, 0.3 + h / 3, z, head), rx, 0, r);
      });
      break;
    }
    case "bald": {
      box(0.12, 0.03, 0.14, "#9a7a68", 0.06, 0.255, -0.08, head, false);                                           // the shine
      box(0.05, 0.08, 0.5, shade(ch.skin, 0.8), -0.24, -0.1, 0, head, false);                                       // the back of the neck
      break;
    }
    case "hood": {
      // the hood frames the face from behind and above: its front edge sits just behind the face
      box(0.5, 0.62, 0.62, ch.col, -0.06, 0.04, 0, head); box(0.08, 0.12, 0.62, ch.col, 0.24, 0.29, 0, head, false);
      for (const s of [-1, 1]) box(0.08, 0.5, 0.06, ch.col, 0.24, -0.02, s * 0.29, head, false);
      box(0.5, 0.22, 0.52, ch.dark, -0.27, 0.24, 0, head);
      turn(box(0.2, 0.2, 0.2, ch.dark, -0.42, 0.3, 0, head), 0, 0, 0.7);                                          // the point of the hood
      for (const s of [-1, 1]) box(0.3, 0.06, 0.04, ch.trim, 0.1, -0.33, s * 0.1, head, false);                     // the drawstrings
      break;
    }
    case "old": {
      box(0.24, 0.22, 0.54, hairM, -0.17, 0.0, 0, head); for (const s of [-1, 1]) box(0.16, 0.14, 0.08, hairM, -0.06, 0.05, s * 0.27, head, false);
      box(0.54, 0.07, 0.54, ch.band, 0, 0.16, 0, head);
      break;
    }
  }
  if (ch.style === "old") skull.material[0] = faces.calm;
  root.userData.ch = ch;
  return { root, pose, spine, legs, arms, neck, head, skull, faces, mood: "calm", scale: S };
}

// Pose a baller for this frame. s: { speed, walk, air, rise (vy), guard, dribble ({ hand, low }), shoot, follow, dunk, hang,
// block, reach, fall, dash, toes, dance, land, mood, t }
const lerp = (a, b, k) => a + (b - a) * k;
export function animate(b, s) {
  const run = Math.min(1, s.speed / 5), cyc = s.walk * 2.4, swing = Math.sin(cyc);
  const L = b.legs, A = b.arms, P = { hip: [0, 0], knee: [0, 0], sh: [0, 0], shX: [0, 0], el: [0, 0], spine: 0, twist: 0, drop: 0, neck: 0 };
  // legs: a stride with the knee folding on the back swing; a crouch on defense; tucked in the air
  for (let k = 0; k < 2; k++) {
    const sw = k ? -swing : swing;
    P.hip[k] = sw * 0.8 * run; P.knee[k] = -Math.max(0, -sw) * 1.1 * run - 0.15 * run;
  }
  if (s.guard && !s.air) { P.hip = [0.55, 0.55]; P.knee = [-1.0, -1.0]; P.drop = 0.12; P.spine = -0.25; P.shX = [0.9, 0.9]; P.sh = [0.5, 0.5]; P.el = [0.6, 0.6]; }
  if (s.air) { P.hip = [0.7, 0.2]; P.knee = [-1.1, -0.5]; }
  if (s.land > 0) { P.drop = 0.1 * s.land; P.knee = [-0.7, -0.7]; P.hip = [0.4, 0.4]; }
  // arms: a swing with the stride by default
  if (!s.guard) for (let k = 0; k < 2; k++) { P.sh[k] = (k ? swing : -swing) * 0.7 * run; P.el[k] = 0.4 + 0.6 * run; }
  // the dribble: the ball hand pumps the ball down and catches it at the top, the other arm shields
  if (s.dribble) {
    const h = s.dribble.hand > 0 ? 1 : 0, o = 1 - h, low = s.dribble.low;
    P.sh[h] = lerp(0.9, 0.35, low); P.el[h] = lerp(1.2, 0.1, low); P.shX[h] = 0.25;
    P.sh[o] = 0.9; P.el[o] = 1.2; P.shX[o] = 0.35; P.spine = -0.18 - run * 0.1; P.drop = Math.max(P.drop, 0.05);
    P.twist = s.dribble.hand * 0.12;
  }
  if (s.dash) { P.spine = -0.45; P.hip = [1.1, -0.6]; P.knee = [-0.3, -1.3]; }
  // the shot: the ball set over the head, then a follow-through with the wrist snapped down
  if (s.shoot) { P.sh = [2.7, 2.7]; P.el = [1.5, 1.5]; P.shX = [0.15, 0.15]; P.spine = 0.05; }
  if (s.follow > 0) { P.sh = [2.4, 2.4]; P.el = [0.05, 0.05]; P.shX = [0.1, 0.1]; }
  if (s.dunk) { P.sh = [3.1, 2.4]; P.el = [0.2, 0.6]; P.hip = [1.1, 0.2]; P.knee = [-1.4, -0.4]; P.spine = 0.15; }
  if (s.hang) { P.sh = [3.0, 3.0]; P.el = [0, 0]; P.hip = [0.15, -0.1]; P.knee = [-0.4, -0.2]; P.spine = 0.1; }
  if (s.block) { P.sh = [3.0, 3.0]; P.el = [0.1, 0.1]; P.shX = [0.25, 0.25]; }
  if (s.reach) { P.sh = [1.6, -0.3]; P.el = [0.1, 0.5]; P.spine = -0.5; P.hip = [0.7, -0.2]; P.knee = [-0.8, -0.3]; }
  if (s.dance) { const d = Math.sin(s.t * 10); P.sh = [2.6 + d * 0.4, 2.6 - d * 0.4]; P.el = [0.8, 0.8]; P.drop = -Math.abs(d) * 0.1; }
  // apply, with the arms spreading outward on their own side
  for (let k = 0; k < 2; k++) {
    const side = k ? 1 : -1;
    L[k].hip.rotation.z = P.hip[k]; L[k].knee.rotation.z = P.knee[k];
    A[k].shoulder.rotation.z = P.sh[k]; A[k].shoulder.rotation.x = -side * P.shX[k]; A[k].elbow.rotation.z = P.el[k];
  }
  b.spine.rotation.z = P.spine; b.spine.rotation.y = P.twist;
  b.pose.rotation.z = s.fall ? 1.4 : 0;
  b.pose.position.y = (s.fall ? 0.25 : -P.drop) * b.scale + (s.toes ? 0.06 : 0);
  if (s.fall) { L[0].hip.rotation.z = 0.9; L[1].hip.rotation.z = 0.3; A[0].shoulder.rotation.z = 2.2; A[1].shoulder.rotation.z = 0.6; }
  b.neck.rotation.z = s.fall ? 0.3 : -P.spine * 0.6;                                             // the head stays level, eyes up
  // the face
  const mood = s.mood ?? "calm";
  if (mood !== b.mood) { b.mood = mood; b.skull.material[0] = b.faces[mood]; }
}
