// pixelfx in 3D: each effect from the 2D game's library plays on its own little pixel frame, and that frame is a
// billboard in the world (crisp pixels, facing the camera), anchored at a point and optionally following a baller.
// The 3D figures stay smooth; the magic is hand-made pixel art on top of them.
import * as THREE from "three";
import { createFrame, clearFrame, createFx, composite } from "../pixelfx/core/index.js";

import * as hitSpark from "../pixelfx/fx/impacts/hit-spark.js";
import * as critHit from "../pixelfx/fx/impacts/crit-hit.js";
import * as groundSlam from "../pixelfx/fx/impacts/ground-slam.js";
import * as heavyLanding from "../pixelfx/fx/impacts/heavy-landing.js";
import * as bluntHit from "../pixelfx/fx/impacts/blunt-hit.js";
import * as shieldBlock from "../pixelfx/fx/impacts/shield-block.js";
import * as flamePillar from "../pixelfx/fx/fire/flame-pillar.js";
import * as fireRing from "../pixelfx/fx/fire/fire-ring.js";
import * as spiritFlame from "../pixelfx/fx/fire/spirit-flame.js";
import * as iceSpikes from "../pixelfx/fx/ice/ice-spikes.js";
import * as freeze from "../pixelfx/fx/ice/freeze.js";
import * as iceShatter from "../pixelfx/fx/ice/ice-shatter.js";
import * as frostNova from "../pixelfx/fx/ice/frost-nova.js";
import * as lightning from "../pixelfx/fx/lightning/lightning-strike.js";
import * as zapHit from "../pixelfx/fx/lightning/zap-hit.js";
import * as chargeUp from "../pixelfx/fx/lightning/charge-up.js";
import * as quake from "../pixelfx/fx/nature/quake.js";
import * as blackHole from "../pixelfx/fx/shadow/black-hole.js";
import * as smokeBomb from "../pixelfx/fx/explosions/smoke-bomb.js";
import * as shadowTendrils from "../pixelfx/fx/shadow/shadow-tendrils.js";
import * as timeStop from "../pixelfx/fx/arcane/time-stop.js";
import * as spellCharge from "../pixelfx/fx/arcane/spell-charge.js";
import * as blinkOut from "../pixelfx/fx/arcane/blink-out.js";
import * as blinkIn from "../pixelfx/fx/arcane/blink-in.js";
import * as exclamation from "../pixelfx/fx/ui/exclamation.js";
import * as firework from "../pixelfx/fx/explosions/firework-burst.js";
import * as collect from "../pixelfx/fx/pickups/collect-burst.js";
import * as powerStar from "../pixelfx/fx/pickups/power-star.js";
import * as poof from "../pixelfx/fx/spawn/poof.js";
import * as confetti from "../pixelfx/fx/ui/confetti.js";

export const PFX = { hitSpark, critHit, groundSlam, heavyLanding, bluntHit, shieldBlock, flamePillar, fireRing, spiritFlame, iceSpikes, freeze, iceShatter, frostNova,
  lightning, zapHit, chargeUp, quake, blackHole, smokeBomb, shadowTendrils, timeStop, spellCharge, blinkOut, blinkIn, exclamation, firework, collect, powerStar, poof, confetti };

// one effect pixel is this many meters: a baller (2 m) is about 44 pixels tall, as in the 2D game
const PX = 0.047;
const live = [];
let scene = null;
export const initPix = (sc) => { scene = sc; };

/**
 * Play a pixelfx effect at a point in the world.
 * at: [x, y, z]; o: { w, h (frame size), ground (anchor at the frame's bottom, default true; false = its middle),
 * size (meters per pixel), follow (anything with x, y, z), off ([dx, dy, dz] from follow), life (seconds, then it
 * winds down), scale, ...the effect's own options (flip, palette, ...) }
 */
export function pix(mod, at, o = {}) {
  if (!scene || live.length > 24) return null;
  o = Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));   // an unset option keeps the effect's own default
  const w = o.w ?? 128, h = o.h ?? 128, ground = o.ground ?? true, ax = w / 2, ay = ground ? h - 10 : h / 2, size = (o.size ?? PX) * (o.scale ?? 1);
  const frame = createFrame(w, h);
  const fx = createFx(mod, { ...o, x: ax, y: ay, seed: (Math.random() * 1e9) | 0 });
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(w, h);
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  sp.center.set(ax / w, 1 - ay / h); sp.scale.set(w * size, h * size, 1); sp.renderOrder = 4;
  sp.position.set(at[0], at[1], at[2]); scene.add(sp);
  const e = { fx, frame, ctx, img, tex, sp, follow: o.follow, off: o.off ?? [0, 0, 0], life: o.life ?? Infinity };
  live.push(e);
  return { stop: () => fx.stop(), get done() { return !live.includes(e); }, sprite: sp };
}

export function updatePix(dt) {
  for (let i = live.length - 1; i >= 0; i--) {
    const e = live[i];
    e.fx.update(dt);
    if ((e.life -= dt) <= 0) e.fx.stop();
    if (e.fx.done()) { scene.remove(e.sp); e.tex.dispose(); e.sp.material.dispose(); live.splice(i, 1); continue; }
    if (e.follow) e.sp.position.set(e.follow.x + e.off[0], (e.follow.y ?? 0) + e.off[1], e.follow.z + e.off[2]);
    clearFrame(e.frame); e.fx.draw(e.frame); composite(e.frame, e.img.data, null, 1.15);
    e.ctx.putImageData(e.img, 0, 0); e.tex.needsUpdate = true;
  }
}
export function clearPix() { for (const e of live) { scene.remove(e.sp); e.tex.dispose(); } live.length = 0; }
