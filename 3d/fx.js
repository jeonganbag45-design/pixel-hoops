// Effects in 3D, in the 2D game's language: pixel shards that fly and bounce, shockwave rings on the floor, bright
// flashes, and the big pieces for specials (a pillar of fire, ice spikes, a bolt, a black hole, a clock face).
// Plus the feel: hitstop, slow motion, camera shake and a zoom punch, read by the game loop.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export function createFx(scene) {
  const fx = { stop: 0, slow: 0, shake: 0, punch: 0 };
  // ---- shards: one instanced mesh of little cubes ----
  const MAX = 900, geo = new THREE.BoxGeometry(1, 1, 1);
  const shardMesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: "#ffffff" }), MAX);
  shardMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shardMesh.frustumCulled = false;
  shardMesh.setColorAt(0, new THREE.Color("#ffffff")); shardMesh.count = 0;           // colors per shard from the first frame
  scene.add(shardMesh);
  const shards = [], col = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const pickC = (c) => (Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c);
  fx.shard = (o) => { if (shards.length < MAX) shards.push({ vx: 0, vy: 0, vz: 0, g: 9, size: 0.08, life: 0.6, floor: true, spin: Math.random() * 6, drag: 0, ...o, max: o.life ?? 0.6, c: new THREE.Color(pickC(o.c ?? "#ffffff")) }); };
  // a burst from a point: n shards, speed, colors, upward bias
  fx.burst = (x, y, z, n, c, sp = 4, life = 0.6, o = {}) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, r = Math.sqrt(1 - u * u), s = sp * (0.4 + Math.random() * 0.6);
      fx.shard({ x, y, z, vx: Math.cos(a) * r * s, vy: Math.abs(u) * s * (o.up ?? 1) + (o.lift ?? 0), vz: Math.sin(a) * r * s, c: pickC(c), life: life * (0.6 + Math.random() * 0.6), size: (o.size ?? 0.08) * (0.7 + Math.random() * 0.6), g: o.g ?? 9, floor: o.floor ?? true });
    }
  };
  fx.dust = (x, z, n = 6, c = "#d8b48a") => fx.burst(x, 0.05, z, n, c, 1.6, 0.4, { up: 0.6, size: 0.07, g: 3 });

  // ---- floor rings: shockwaves ----
  const rings = [];
  fx.ring = (x, z, c, r = 2, life = 0.45, y = 0.03, w = 0.12) => {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(1 - w, 1, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); scene.add(mesh); rings.push({ mesh, r, t: 0, life });
  };
  // a ring standing up, facing the camera (for hits in the air)
  fx.halo = (x, y, z, c, r = 1, life = 0.3) => {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 24), new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
    mesh.position.set(x, y, z); mesh.renderOrder = 6; mesh.userData.face = true; scene.add(mesh); rings.push({ mesh, r, t: 0, life });
  };

  // ---- flashes: a pixel star, additive ----
  const starTex = (() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 16; const g = cv.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(7, 0, 2, 16); g.fillRect(0, 7, 16, 2); g.fillRect(5, 5, 6, 6); g.globalAlpha = 0.5; g.fillRect(3, 3, 10, 10);
    const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; return t;
  })();
  const flashes = [];
  fx.flash = (x, y, z, c = "#ffffff", size = 1.2, life = 0.18) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: c, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
    s.position.set(x, y, z); s.renderOrder = 7; scene.add(s); flashes.push({ s, size, t: 0, life });
  };

  // ---- big pieces for specials and passives: meshes that grow, spin and fade ----
  const pieces = [];
  const add = (obj, life, upd) => { scene.add(obj); pieces.push({ obj, t: 0, life, upd }); return obj; };
  const glow = (c, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending });
  fx.pillar = (x, z, c = "#ff6a1a", h = 5, r = 1.1, life = 1.3) => {
    const g = new THREE.Group();
    for (const [k, cc] of [[1, c], [0.6, "#ffe03c"]]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * k * 0.7, r * k, h, 8, 1, true), glow(cc, 0.7)); m.position.y = h / 2; g.add(m); }
    g.position.set(x, 0, z);
    return add(g, life, (p, k) => { g.scale.set(1 + Math.sin(p.t * 30) * 0.06, Math.min(1, p.t * 6), 1 + Math.sin(p.t * 30) * 0.06); g.rotation.y += 0.2; g.children.forEach((m) => (m.material.opacity = 0.7 * (1 - k))); if (Math.random() < 0.8) fx.shard({ x: x + (Math.random() - 0.5) * r * 2, y: Math.random() * h * 0.6, z: z + (Math.random() - 0.5) * r * 2, vy: 4 + Math.random() * 3, g: -2, c: ["#ff4a2a", "#ff9a2a", "#ffe03c"], life: 0.5, floor: false }); });
  };
  fx.spikes = (x, z, dx, dz, len = 10, life = 1.6) => {
    const g = new THREE.Group(), n = Math.round(len / 0.6);
    for (let i = 0; i < n; i++) {
      const h = 0.6 + Math.random() * 0.9, m = new THREE.Mesh(new THREE.ConeGeometry(0.22 + Math.random() * 0.1, h, 5), new THREE.MeshLambertMaterial({ color: i % 3 ? "#a6ecff" : "#e6fbff", flatShading: true, transparent: true }));
      m.position.set(dx * (0.6 + i * 0.6) + (Math.random() - 0.5) * 0.3, h / 2, dz * (0.6 + i * 0.6) + (Math.random() - 0.5) * 0.5); m.rotation.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4); m.userData.at = i * 0.025; m.userData.h = h; g.add(m);
    }
    g.position.set(x, 0, z);
    return add(g, life, (p, k) => g.children.forEach((m) => { const t = Math.max(0, p.t - m.userData.at); m.scale.y = Math.min(1, t * 10); m.position.y = (m.userData.h / 2) * m.scale.y; m.material.opacity = k > 0.75 ? (1 - k) * 4 : 1; }));
  };
  fx.bolt = (x0, y0, z0, x1, y1, z1, c = "#fff6a0", life = 0.3) => {
    const pts = [], n = 9;
    for (let i = 0; i <= n; i++) { const k = i / n, j = i === 0 || i === n ? 0 : 0.35; pts.push(new THREE.Vector3(x0 + (x1 - x0) * k + (Math.random() - 0.5) * j, y0 + (y1 - y0) * k, z0 + (z1 - z0) * k + (Math.random() - 0.5) * j)); }
    const g = new THREE.Group();
    for (const [w, cc] of [[0.18, c], [0.07, "#ffffff"]]) {
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[i + 1], len = a.distanceTo(b), m = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), glow(cc));
        m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(m);
      }
    }
    fx.flash(x1, y1 + 0.2, z1, c, 2.2, 0.2); fx.ring(x1, z1, c, 1.6, 0.35);
    return add(g, life, (p, k) => g.children.forEach((m) => (m.material.opacity = Math.floor(p.t * 40) % 2 ? 0.3 : 1 - k)));
  };
  fx.vortex = (x, y, z, life = 1.3, r = 0.8) => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 10, 8), new THREE.MeshBasicMaterial({ color: "#05030c" })); g.add(core);
    for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * (0.6 + i * 0.25), 0.04, 4, 20), glow(i % 2 ? "#9a7cff" : "#6a3aff", 0.9)); t.rotation.x = Math.PI / 2 + i * 0.5; g.add(t); }
    g.position.set(x, y, z);
    return add(g, life, (p, k) => {
      const s = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1; g.scale.setScalar(Math.max(0.01, s));
      g.children.forEach((m, i) => { if (i) { m.rotation.z += 0.15 + i * 0.05; m.rotation.y += 0.05; } });
      if (Math.random() < 0.7) { const a = Math.random() * 6.28, d = r * 2.5; fx.shard({ x: x + Math.cos(a) * d, y: y + (Math.random() - 0.5) * d, z: z + Math.sin(a) * d, vx: -Math.cos(a) * d * 3, vy: 0, vz: -Math.sin(a) * d * 3, g: 0, c: ["#9a7cff", "#ffffff"], life: 0.3, floor: false, size: 0.06 }); }
    });
  };
  fx.clock = (x, y, z, r = 2.2, life = 1.4) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.RingGeometry(r * 0.92, r, 40), glow("#e6e1ee", 0.8)));
    for (let i = 0; i < 12; i++) { const t = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.3), glow("#ffe03c")); t.position.set(Math.cos((i / 12) * 6.28) * r * 0.8, Math.sin((i / 12) * 6.28) * r * 0.8, 0); t.rotation.z = (i / 12) * 6.28 + Math.PI / 2; g.add(t); }
    const hand = new THREE.Mesh(new THREE.PlaneGeometry(0.1, r * 0.7), glow("#ffffff")); hand.geometry.translate(0, r * 0.35, 0); g.add(hand);
    g.position.set(x, y, z); g.userData.face = true;
    return add(g, life, (p, k) => { hand.rotation.z = -p.t * 4; g.children.forEach((m) => (m.material.opacity = 0.85 * (1 - k))); g.scale.setScalar(Math.min(1, p.t * 5)); });
  };
  // a ghost of a baller (dash afterimages): a flat-colored copy that fades
  fx.ghost = (root, c) => {
    const g = root.clone(true), m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.45, depthWrite: false });
    g.traverse((o) => { if (o.isMesh) { o.material = o.material.side === THREE.BackSide ? new THREE.MeshBasicMaterial({ visible: false }) : m; o.castShadow = false; } });
    return add(g, 0.22, (p, k) => (m.opacity = 0.45 * (1 - k)));
  };

  // dt moves the effects (0 during hitstop, so they freeze with the game); real runs the feel timers
  fx.update = (dt, camera, real = dt) => {
    fx.stop = Math.max(0, fx.stop - real); fx.slow = Math.max(0, fx.slow - real); fx.shake = Math.max(0, fx.shake - real * 2.5); fx.punch = Math.max(0, fx.punch - real * 3);
    let n = 0;
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i]; s.life -= dt;
      if (s.life <= 0) { shards[i] = shards[shards.length - 1]; shards.pop(); continue; }
      s.vy -= s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.spin += dt * 8;
      if (s.floor && s.y < s.size / 2) { s.y = s.size / 2; s.vy *= -0.35; s.vx *= 0.6; s.vz *= 0.6; }
    }
    for (const s of shards) {
      const k = Math.min(1, (s.life / s.max) * 1.8);
      m4.compose(v.set(s.x, s.y, s.z), q.setFromEuler(e.set(s.spin, s.spin * 0.7, 0)), sc.setScalar(s.size * k));
      shardMesh.setMatrixAt(n, m4); shardMesh.setColorAt(n, s.c); n++;
    }
    shardMesh.count = n; shardMesh.instanceMatrix.needsUpdate = true; if (shardMesh.instanceColor) shardMesh.instanceColor.needsUpdate = true;
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.t += dt; const k = r.t / r.life;
      if (k >= 1) { scene.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); rings.splice(i, 1); continue; }
      r.mesh.scale.setScalar(0.2 + r.r * (1 - (1 - k) * (1 - k))); r.mesh.material.opacity = 1 - k;
      if (r.mesh.userData.face) r.mesh.quaternion.copy(camera.quaternion);
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.t += dt; const k = f.t / f.life;
      if (k >= 1) { scene.remove(f.s); f.s.material.dispose(); flashes.splice(i, 1); continue; }
      f.s.scale.setScalar(f.size * (k < 0.3 ? k / 0.3 : 1)); f.s.material.opacity = 1 - k * k;
    }
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i]; p.t += dt; const k = p.t / p.life;
      if (k >= 1) { scene.remove(p.obj); pieces.splice(i, 1); continue; }
      p.upd?.(p, k); if (p.obj.userData.face) p.obj.quaternion.copy(camera.quaternion);
    }
  };
  fx.clear = () => { shards.length = 0; for (const r of rings) scene.remove(r.mesh); rings.length = 0; for (const f of flashes) scene.remove(f.s); flashes.length = 0; for (const p of pieces) scene.remove(p.obj); pieces.length = 0; };
  // the game's feel in one call: { stop, slow, shake, punch }
  fx.impact = (o) => { fx.stop = Math.max(fx.stop, o.stop ?? 0); fx.slow = Math.max(fx.slow, o.slow ?? 0); fx.shake = Math.max(fx.shake, o.shake ?? 0); fx.punch = Math.max(fx.punch, o.punch ?? 0); };
  return fx;
}
