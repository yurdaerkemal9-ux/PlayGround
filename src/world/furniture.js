import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { painting as paintingTex, moonWindow as moonTex, glowSprite, wispSprite, bookTitle } from './textures.js';

export const BOOK_COLORS = [0x6c2c2c, 0x2c4666, 0x36523c, 0x8d6b32, 0x9a8c6c, 0x4c3555, 0x63343d, 0x435e53, 0x844f31, 0x2e3d52];
const bookGeo = new THREE.BoxGeometry(1, 1, 1);
const bookMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });

export function box(w, h, d, mat, x = 0, y = 0, z = 0, rounded = 0) {
  const geo = rounded > 0 ? new RoundedBoxGeometry(w, h, d, 2, rounded) : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}

export function makeRug(w, d, mat, x = 0, y = 0.01, z = 0, rot = 0) {
  const g = new THREE.Group();
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  rug.rotation.x = -Math.PI / 2;
  rug.rotation.z = rot;
  rug.position.y = y;
  rug.receiveShadow = true;
  g.add(rug);
  g.position.set(x, 0, z);
  return g;
}

export function makeTable(w, d, mat, height = 0.95, legMat = mat) {
  const g = new THREE.Group();
  const top = box(w, 0.08, d, mat, 0, height, 0, 0.02);
  g.add(top);
  if (height > 1.4) {
    // cabriole-ish legs with brackets
    const inset = 0.1;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const leg = cyl(0.045, 0.035, height - 0.08, legMat, sx * (w / 2 - inset), (height - 0.08) / 2, sz * (d / 2 - inset));
      leg.rotation.z = sx * 0.02;
      g.add(leg);
      const foot = box(0.1, 0.05, 0.1, legMat, sx * (w / 2 - inset), 0.03, sz * (d / 2 - inset));
      g.add(foot);
    }
    g.add(box(w - 0.2, 0.16, d - 0.2, legMat, 0, height - 0.12));
  } else {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(box(0.06, height, 0.06, legMat, sx * (w / 2 - 0.08), height / 2, sz * (d / 2 - 0.08)));
      g.add(box(0.1, 0.04, 0.1, legMat, sx * (w / 2 - 0.08), 0.02, sz * (d / 2 - 0.08)));
    }
    g.add(box(w - 0.18, 0.05, 0.05, legMat, 0, height - 0.1, 0));
    g.add(box(w - 0.18, 0.05, 0.05, legMat, 0, height - 0.1, 0));
  }
  g.userData.collider = { w: w, d: d, h: height + 0.05 };
  return g;
}

export function makeRoundTable(r, mat, height = 0.9) {
  const g = new THREE.Group();
  const top = cyl(r, r, 0.07, mat, 0, height, 0, 28);
  g.add(top);
  g.add(cyl(0.06, 0.08, height, mat, 0, height / 2, 0, 12));
  g.add(cyl(0.24, 0.28, 0.06, mat, 0, 0.03, 0, 20));
  g.userData.collider = { w: r * 1.8, d: r * 1.8, h: height };
  return g;
}

export function makeChair(fabricMat, woodMat, tall = false) {
  const g = new THREE.Group();
  const seatH = 0.48;
  const seat = box(0.5, 0.09, 0.48, fabricMat, 0, seatH, 0, 0.03);
  g.add(seat);
  const back = box(0.48, tall ? 0.75 : 0.52, 0.08, fabricMat, 0, seatH + (tall ? 0.42 : 0.3), -0.2, 0.03);
  g.add(back);
  g.add(box(0.54, 0.06, 0.08, woodMat, 0, seatH + (tall ? 0.79 : 0.58), -0.21));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(box(0.055, seatH, 0.055, woodMat, sx * 0.21, seatH / 2, sz * 0.18));
  }
  g.add(box(0.44, 0.04, 0.04, woodMat, 0, 0.14, 0.18));
  g.add(box(0.44, 0.04, 0.04, woodMat, 0, 0.14, -0.18));
  g.userData.collider = { w: 0.55, d: 0.55, h: seatH + 0.1 };
  return g;
}

export function makeArmchair(fabricMat, woodMat) {
  const g = new THREE.Group();
  const seatH = 0.46;
  g.add(box(0.82, 0.16, 0.72, fabricMat, 0, seatH, 0, 0.06));
  const back = box(0.82, 0.68, 0.18, fabricMat, 0, seatH + 0.36, -0.3, 0.08);
  back.rotation.x = -0.08;
  g.add(back);
  for (const s of [-1, 1]) {
    g.add(box(0.16, 0.36, 0.72, fabricMat, s * 0.36, seatH + 0.18, 0.01, 0.06));
    g.add(cyl(0.055, 0.075, 0.22, woodMat, s * 0.34, 0.11, 0.28, 10));
    g.add(cyl(0.055, 0.075, 0.22, woodMat, s * 0.34, 0.11, -0.26, 10));
  }
  g.add(box(0.8, 0.08, 0.7, woodMat, 0, 0.18, 0));
  // cushion
  g.add(box(0.6, 0.12, 0.55, fabricMat, 0, seatH + 0.12, 0.05, 0.05));
  g.userData.collider = { w: 0.9, d: 0.85, h: 0.85 };
  return g;
}

export function makeSofa(fabricMat, woodMat) {
  const g = new THREE.Group();
  const seatH = 0.42;
  g.add(box(2.15, 0.22, 0.92, fabricMat, 0, seatH, 0, 0.08));
  for (const s of [-1, 1]) {
    g.add(box(0.25, 0.44, 0.94, fabricMat, s * 0.95, seatH + 0.25, 0, 0.08));
    g.add(box(0.75, 0.15, 0.75, fabricMat, s * 0.53, seatH + 0.16, 0.04, 0.06));
    g.add(cyl(0.06, 0.08, 0.2, woodMat, s * 0.9, 0.1, 0.35, 10));
    g.add(cyl(0.06, 0.08, 0.2, woodMat, s * 0.9, 0.1, -0.35, 10));
  }
  const back = box(2.15, 0.7, 0.2, fabricMat, 0, seatH + 0.42, -0.38, 0.09);
  back.rotation.x = -0.06;
  g.add(back);
  for (let i = 0; i < 4; i++) {
    g.add(box(0.1, 0.3, 0.1, woodMat, -0.9 + i * 0.6, 0.14, 0.35));
    g.add(box(0.1, 0.3, 0.1, woodMat, -0.9 + i * 0.6, 0.14, -0.35));
  }
  // throw pillows
  const p1 = box(0.35, 0.35, 0.14, fabricMat === undefined ? woodMat : new THREE.MeshStandardMaterial({ color: 0x8f6a57, roughness: 0.9 }), -0.7, seatH + 0.42, -0.18, 0.06);
  p1.rotation.z = 0.2; p1.rotation.x = -0.25; g.add(p1);
  const p2 = box(0.32, 0.32, 0.13, new THREE.MeshStandardMaterial({ color: 0x5b6f6b, roughness: 0.9 }), 0.72, seatH + 0.42, -0.2, 0.06);
  p2.rotation.z = -0.15; p2.rotation.x = -0.2; g.add(p2);
  g.userData.collider = { w: 2.2, d: 1.0, h: 1.05 };
  return g;
}

export function makeBookshelf(w = 1.6, h = 2.4, d = 0.36, mat, bookCount = 14) {
  const g = new THREE.Group();
  g.add(box(w, h, 0.04, mat, 0, h / 2, -d / 2 + 0.02));
  for (const s of [-1, 1]) {
    g.add(box(0.07, h, d, mat, s * (w / 2 - 0.035), h / 2, 0));
    g.add(box(w - 0.08, 0.07, d + 0.04, mat, 0, h - 0.035, 0));
    g.add(box(w - 0.08, 0.08, d + 0.04, mat, 0, 0.04, 0));
  }
  const rows = Math.max(3, Math.floor((h - 0.2) / 0.46));
  const rowH = (h - 0.2) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 0.1 + r * rowH;
    g.add(box(w - 0.12, 0.045, d + 0.02, mat, 0, y, 0));
    const count = Math.max(5, Math.floor(bookCount * (0.7 + Math.random() * 0.6)));
    const inst = new THREE.InstancedMesh(bookGeo, bookMat.clone(), count);
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    let px = -w / 2 + 0.1;
    for (let i = 0; i < count; i++) {
      const bw = 0.035 + Math.random() * 0.045;
      const bh = rowH * (0.55 + Math.random() * 0.28);
      const bd = d * (0.6 + Math.random() * 0.25);
      const lean = Math.random() < 0.12 ? (Math.random() - 0.5) * 0.3 : 0;
      m4.compose(
        new THREE.Vector3(px + bw / 2, y + bh / 2 + 0.02, 0.01),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, lean)),
        new THREE.Vector3(bw, bh, bd)
      );
      inst.setMatrixAt(i, m4);
      col.setHex(BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)]);
      inst.setColorAt(i, col);
      px += bw + 0.006;
      if (px > w / 2 - 0.14) break;
    }
    inst.count = Math.min(count, inst.count);
    inst.castShadow = true;
    g.add(inst);
  }
  g.userData.collider = { w: w + 0.08, d: d + 0.1, h };
  return g;
}

export function makeLowShelf(w, h, d, mat, items = 0) {
  const g = makeBookshelf(w, h, d, mat, 8);
  return g;
}

export function makeSideboard(w, h, d, mat) {
  const g = new THREE.Group();
  g.add(box(w, h, d, mat, 0, h / 2, 0, 0.02));
  g.add(box(w + 0.05, 0.05, d + 0.05, mat, 0, h, 0));
  for (const s of [-1, 1]) {
    g.add(cyl(0.04, 0.05, 0.18, mat, s * (w / 2 - 0.1), 0.09, d / 2 - 0.08, 8));
    g.add(cyl(0.04, 0.05, 0.18, mat, s * (w / 2 - 0.1), 0.09, -d / 2 + 0.08, 8));
  }
  const cols = Math.max(2, Math.round(w / 0.5));
  for (let i = 0; i < cols; i++) {
    const cw = w / cols;
    const cx = -w / 2 + cw / 2 + i * cw;
    g.add(box(cw - 0.04, h * 0.36, 0.03, mat, cx, h * 0.72, d / 2 + 0.015));
    g.add(box(cw - 0.04, h * 0.5, 0.03, mat, cx, h * 0.3, d / 2 + 0.015));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshStandardMaterial({ color: 0xc7a45c, metalness: 0.8, roughness: 0.3 }));
    knob.position.set(cx, h * 0.3, d / 2 + 0.04);
    g.add(knob);
  }
  g.userData.collider = { w, d, h };
  return g;
}

export function makeDresser(w = 1.2, h = 0.95, d = 0.5, mat) {
  return makeSideboard(w, h, d, mat);
}

export function makeBed(w = 1.8, d = 2.2, matFrame, matLinen, canopy = false) {
  const g = new THREE.Group();
  g.add(box(w + 0.16, 0.32, d + 0.16, matFrame, 0, 0.28, 0, 0.03));
  g.add(box(w, 0.24, d, matLinen, 0, 0.48, 0, 0.08));
  g.add(box(w + 0.1, 0.95, 0.12, matFrame, 0, 0.62, -d / 2 - 0.03, 0.04));
  g.add(box(w + 0.1, 0.55, 0.1, matFrame, 0, 0.42, d / 2 + 0.03, 0.04));
  for (const s of [-1, 1]) {
    g.add(box(0.1, 0.55, 0.1, matFrame, s * (w / 2), 0.28, d / 2));
    g.add(box(0.1, 0.55, 0.1, matFrame, s * (w / 2), 0.28, -d / 2));
  }
  const pillow1 = box(w * 0.34, 0.13, 0.42, matLinen, -w * 0.2, 0.66, -d * 0.28, 0.06);
  pillow1.rotation.x = 0.06; g.add(pillow1);
  const pillow2 = box(w * 0.34, 0.13, 0.42, matLinen, w * 0.2, 0.66, -d * 0.28, 0.06);
  pillow2.rotation.x = 0.06; g.add(pillow2);
  // blanket
  g.add(box(w + 0.08, 0.12, d * 0.58, matFrame === matLinen ? matLinen : new THREE.MeshStandardMaterial({ color: 0x506d7a, roughness: 0.9 }), 0, 0.62, d * 0.18, 0.04));
  if (canopy) {
    for (const s of [-1, 1]) {
      g.add(cyl(0.05, 0.07, 2.5, matFrame, s * (w / 2 - 0.04), 1.45, -d / 2 + 0.05, 8));
      g.add(cyl(0.05, 0.07, 2.5, matFrame, s * (w / 2 - 0.04), 1.45, d / 2 - 0.05, 8));
    }
    g.add(box(w + 0.15, 0.1, 0.12, matFrame, 0, 2.7, -d / 2 + 0.05));
    g.add(box(w + 0.15, 0.1, 0.12, matFrame, 0, 2.7, d / 2 - 0.05));
    const drapeMat = new THREE.MeshStandardMaterial({ color: 0x8e9aa6, transparent: true, opacity: 0.5, side: THREE.DoubleSide, roughness: 0.95 });
    const drape = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.1, 2.2, 12, 12), drapeMat);
    drape.position.set(0, 1.6, d / 2 - 0.05);
    const pos = drape.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 8) * 0.04);
    g.add(drape);
  }
  g.userData.collider = { w: w + 0.2, d: d + 0.2, h: 0.95 };
  return g;
}

export function makeWardrobe(w = 1.4, h = 2.2, d = 0.65, mat) {
  const g = new THREE.Group();
  g.add(box(w, h, d, mat, 0, h / 2, 0, 0.02));
  for (const s of [-1, 1]) {
    g.add(box(w / 2 - 0.08, h - 0.2, 0.04, mat === undefined ? mat : mat, s * w / 4, h / 2, d / 2 + 0.02));
    g.add(cyl(0.02, 0.02, 0.12, new THREE.MeshStandardMaterial({ color: 0xc7a45c, metalness: 0.8, roughness: 0.3 }), s * 0.08, h / 2, d / 2 + 0.06, 8));
  }
  g.add(box(w + 0.08, 0.1, d + 0.08, mat, 0, h + 0.02, 0));
  g.userData.collider = { w: w + 0.1, d: d + 0.1, h };
  return g;
}

export function makePiano(upright = false) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x2a1c15, roughness: 0.32, metalness: 0.1 });
  const ivory = new THREE.MeshStandardMaterial({ color: 0xe4dcc4, roughness: 0.35 });
  const ebony = new THREE.MeshStandardMaterial({ color: 0x101215, roughness: 0.3 });
  if (upright) {
    g.add(box(1.5, 1.45, 0.42, wood, 0, 0.95, 0, 0.02));
    g.add(box(1.4, 0.5, 0.04, wood, 0, 1.28, 0.22));
    g.add(box(1.36, 0.12, 0.24, wood, 0, 0.7, 0.24));
    for (let i = 0; i < 24; i++) {
      g.add(box(0.045, 0.05, 0.14, ivory, -0.6 + i * 0.052, 0.72, 0.32));
      if (i % 7 !== 2 && i % 7 !== 6) g.add(box(0.026, 0.05, 0.08, ebony, -0.6 + i * 0.052 + 0.026, 0.75, 0.37));
    }
    for (const s of [-1, 1]) g.add(box(0.12, 0.62, 0.4, wood, s * 0.7, 0.31, 0.02));
    // sheet music
    const sheet = box(0.42, 0.32, 0.01, new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.9 }), -0.22, 1.22, 0.24);
    sheet.rotation.x = -0.25; g.add(sheet);
    g.userData.collider = { w: 1.6, d: 0.6, h: 1.5 };
  } else {
    // grand-ish upright body
    const body = box(1.65, 0.42, 1.1, wood, 0, 0.86, -0.1, 0.09);
    g.add(body);
    g.add(box(1.65, 0.12, 1.18, wood, 0, 1.09, -0.1, 0.04));
    g.add(box(1.25, 0.12, 0.25, wood, 0, 0.78, 0.5, 0.02));
    for (let i = 0; i < 24; i++) {
      g.add(box(0.045, 0.05, 0.15, ivory, -0.6 + i * 0.052, 0.8, 0.6));
      if (i % 7 !== 2 && i % 7 !== 6) g.add(box(0.026, 0.05, 0.09, ebony, -0.6 + i * 0.052 + 0.026, 0.83, 0.655));
    }
    for (const s of [-1, 1]) {
      g.add(cyl(0.05, 0.07, 0.78, wood, s * 0.65, 0.39, 0.25, 10));
      g.add(box(0.1, 0.08, 0.1, wood, s * 0.65, 0.04, 0.25));
    }
    g.add(box(1.0, 0.03, 0.5, new THREE.MeshStandardMaterial({ color: 0x18100c, roughness: 0.25 }), 0, 1.16, -0.2));
    // sheet stand + music
    const stand = box(0.66, 0.04, 0.24, wood, 0, 1.26, 0.18);
    stand.rotation.x = -0.3; g.add(stand);
    const sheet = box(0.4, 0.3, 0.01, new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.9 }), 0.12, 1.4, 0.27);
    sheet.rotation.x = -0.3; g.add(sheet);
    g.userData.collider = { w: 1.75, d: 1.4, h: 1.2 };
  }
  g.userData.piano = true;
  return g;
}

export function makeDiningTable(w = 3.2, d = 1.3, mat) {
  const g = new THREE.Group();
  g.add(box(w, 0.1, d, mat, 0, 0.82, 0, 0.03));
  g.add(box(w - 0.3, 0.16, d - 0.24, mat, 0, 0.68, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(cyl(0.07, 0.1, 0.76, mat, sx * (w / 2 - 0.25), 0.38, sz * (d / 2 - 0.2), 10));
    g.add(box(0.16, 0.06, 0.16, mat, sx * (w / 2 - 0.25), 0.03, sz * (d / 2 - 0.2)));
  }
  g.userData.collider = { w, d, h: 0.9 };
  return g;
}

export function makeChandelier(scale = 1) {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x2a2018, metalness: 0.75, roughness: 0.35 });
  g.add(cyl(0.02, 0.02, 1.0, iron, 0, 0.8, 0, 8));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48 * scale, 0.025, 6, 32), iron);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.25; g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.26 * scale, 0.02, 6, 24), iron);
  ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.5; g.add(ring2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 0.48 * scale, z = Math.sin(a) * 0.48 * scale;
    g.add(cyl(0.018, 0.018, 0.28, iron, x, 0.38, z, 6));
    const cup = cyl(0.055, 0.035, 0.08, iron, x, 0.52, z, 8); g.add(cup);
    g.add(cyl(0.028, 0.03, 0.16, new THREE.MeshStandardMaterial({ color: 0xead9b6, roughness: 0.7 }), x, 0.64, z, 8));
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd18a }));
    flame.scale.y = 1.8; flame.position.set(x, 0.75, z); g.add(flame);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: 0xffc070, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.set(x, 0.76, z); glow.scale.setScalar(0.28); g.add(glow);
  }
  // crystals
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.025), new THREE.MeshPhysicalMaterial({ color: 0xd6ecf5, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1 }));
    m.position.set(Math.cos(a) * 0.38 * scale, 0.34 - (i % 3) * 0.06, Math.sin(a) * 0.38 * scale);
    g.add(m);
  }
  g.userData.chandelier = true;
  return g;
}

export function makeCandle(h = 0.2, scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(0.026 * scale, 0.032 * scale, h * scale, new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7 }), 0, h * scale / 2, 0, 10));
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.02 * scale, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd18a }));
  flame.scale.set(1, 2.1, 1);
  flame.position.y = h * scale + 0.03 * scale;
  g.add(flame);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: 0xffc070, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.y = h * scale + 0.035 * scale;
  glow.scale.setScalar(0.3 * scale);
  g.add(glow);
  g.userData.flame = flame;
  g.userData.glow = glow;
  return g;
}

export function makeCandelabra(h = 1.1) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2723, metalness: 0.8, roughness: 0.3 });
  g.add(cyl(0.2, 0.26, 0.05, metal, 0, 0.025, 0, 16));
  g.add(cyl(0.035, 0.05, h, metal, 0, h / 2, 0, 12));
  g.add(cyl(0.1, 0.06, 0.08, metal, 0, h, 0, 12));
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.018, 6, 16, Math.PI), metal);
    arm.rotation.z = s > 0 ? 0 : Math.PI;
    arm.position.set(0, h - 0.05, 0);
    g.add(arm);
    const candle = makeCandle(0.18, 0.9);
    candle.position.set(s * 0.21, h + 0.03, 0);
    g.add(candle);
  }
  const center = makeCandle(0.22, 1);
  center.position.y = h + 0.04;
  g.add(center);
  g.userData.collider = { w: 0.5, d: 0.5, h: h + 0.2 };
  return g;
}

export function makeTableLamp(shadeColor = 0xffc978) {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0x8b6c3d, metalness: 0.8, roughness: 0.35 });
  g.add(cyl(0.12, 0.16, 0.05, brass, 0, 0.03, 0, 16));
  g.add(cyl(0.025, 0.03, 0.45, brass, 0, 0.26, 0, 10));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.22, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1ddb6, roughness: 0.85, emissive: 0xffb45f, emissiveIntensity: 0.45, side: THREE.DoubleSide }));
  shade.position.y = 0.56;
  g.add(shade);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: shadeColor, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.y = 0.56; glow.scale.setScalar(0.7); g.add(glow);
  g.userData.lamp = true;
  return g;
}

export function makeSconce() {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x6a542f, metalness: 0.8, roughness: 0.35 });
  g.add(box(0.12, 0.3, 0.04, metal, 0, 0, 0));
  g.add(cyl(0.02, 0.02, 0.18, metal, 0, 0.04, 0.1, 8));
  const c = makeCandle(0.13, 0.9); c.position.set(0, 0.13, 0.18); g.add(c);
  return g;
}

export function makeFireplace(w = 1.8, h = 1.5) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8c8578, roughness: 0.9 });
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xc6c0b2, roughness: 0.4 });
  g.add(box(w, h, 0.42, stoneMat, 0, h / 2, 0));
  g.add(box(w + 0.25, 0.12, 0.6, marbleMat, 0, h, 0));
  g.add(box(w + 0.15, 0.08, 0.55, marbleMat, 0, 0.04, 0));
  // opening
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0908, roughness: 1 });
  g.add(box(w * 0.56, h * 0.56, 0.05, dark, 0, h * 0.4, 0.21));
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8a3a }));
  // logs
  for (let i = 0; i < 3; i++) {
    const log = cyl(0.055, 0.055, 0.55, new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 1 }), 0, 0.13 + i * 0.02, 0.39, 8);
    log.rotation.z = Math.PI / 2; log.rotation.y = i * 0.3;
    g.add(log);
  }
  const fire = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff9a45 }));
  fire.scale.set(1.5, 0.8, 0.5); fire.position.set(0, 0.18, 0.41); g.add(fire);
  g.userData.fire = fire;
  g.userData.fireGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: 0xff9a45, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.userData.fireGlow.position.set(0, 0.24, 0.5); g.userData.fireGlow.scale.setScalar(1.5); g.add(g.userData.fireGlow);
  // mantel objects
  const clock = makeCandle(0.18, 1.2); clock.position.set(-0.45, h + 0.06, 0); g.add(clock);
  const vase = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshStandardMaterial({ color: 0x4f6974, roughness: 0.3 }));
  vase.scale.y = 1.8; vase.position.set(0.45, h + 0.17, 0); g.add(vase);
  g.userData.collider = { w: w + 0.2, d: 0.55, h: h + 0.1 };
  return g;
}

export function makePainting(kind = 0, w = 1.0, h = 1.3, frameMat) {
  const g = new THREE.Group();
  const frame = frameMat || new THREE.MeshStandardMaterial({ color: 0xa58446, metalness: 0.5, roughness: 0.4 });
  g.add(box(w + 0.14, h + 0.14, 0.05, frame, 0, 0, 0));
  g.add(box(w + 0.05, h + 0.05, 0.02, new THREE.MeshStandardMaterial({ color: 0x5c4525, metalness: 0.6, roughness: 0.4 }), 0, 0, 0.025));
  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: paintingTex(kind), roughness: 0.62 }));
  canvas.position.z = 0.038;
  g.add(canvas);
  // little nameplate
  const plate = box(0.22, 0.035, 0.008, new THREE.MeshStandardMaterial({ color: 0xd2b779, metalness: 0.7, roughness: 0.3 }), 0, -h / 2 - 0.06, 0.02);
  g.add(plate);
  return g;
}

export function makeMirror(w = 1.0, h = 1.7) {
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x9a793d, metalness: 0.7, roughness: 0.35 });
  g.add(box(w + 0.16, h + 0.16, 0.07, frame, 0, 0, 0));
  g.add(box(w, h, 0.02, new THREE.MeshStandardMaterial({ color: 0x76909b, metalness: 0.96, roughness: 0.12 }), 0, 0, 0.04));
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.3, h * 0.85), new THREE.MeshBasicMaterial({ color: 0xc8e8f5, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
  sheen.position.set(-w * 0.2, 0, 0.055); sheen.rotation.z = -0.2; g.add(sheen);
  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), frame);
  crest.position.y = h / 2 + 0.11; g.add(crest);
  return g;
}

export function makeGrandfatherClock(mat) {
  const g = new THREE.Group();
  const wood = mat || new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.4 });
  g.add(box(0.56, 1.4, 0.36, wood, 0, 0.95, 0, 0.02));
  g.add(box(0.66, 0.42, 0.4, wood, 0, 1.78, 0, 0.02));
  g.add(box(0.62, 0.1, 0.42, wood, 0, 1.99, 0));
  g.add(box(0.62, 0.2, 0.4, wood, 0, 0.18, 0));
  g.add(box(0.44, 0.38, 0.02, new THREE.MeshStandardMaterial({ color: 0x2c241c, roughness: 0.5 }), 0, 1.38, 0.19));
  // face
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.16, 28), new THREE.MeshStandardMaterial({ color: 0xe1d5b8, roughness: 0.5 }));
  face.position.set(0, 1.82, 0.215); g.add(face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = box(0.008, 0.03, 0.005, new THREE.MeshBasicMaterial({ color: 0x2b241b }), Math.sin(a) * 0.125, 1.82 + Math.cos(a) * 0.125, 0.218);
    tick.rotation.z = -a; g.add(tick);
  }
  const hourHand = box(0.012, 0.075, 0.006, new THREE.MeshBasicMaterial({ color: 0x1c1812 }), 0, 1.85, 0.222);
  hourHand.geometry.translate(0, 0.037, 0); hourHand.rotation.z = 1.2; g.add(hourHand);
  const minHand = box(0.009, 0.11, 0.006, new THREE.MeshBasicMaterial({ color: 0x1c1812 }), 0, 1.82, 0.224);
  minHand.geometry.translate(0, 0.055, 0); minHand.rotation.z = -0.6; g.add(minHand);
  const pendulum = box(0.02, 0.5, 0.01, new THREE.MeshStandardMaterial({ color: 0xbb9a58, metalness: 0.8, roughness: 0.3 }), 0, 1.05, 0.2);
  pendulum.geometry.translate(0, -0.25, 0); g.add(pendulum);
  g.userData.pendulum = pendulum;
  g.userData.collider = { w: 0.7, d: 0.5, h: 2.05 };
  return g;
}

export function makePlant(scale = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.14 * scale, 0.28 * scale, 16), new THREE.MeshStandardMaterial({ color: 0x8a5334, roughness: 0.75 }));
  pot.position.y = 0.14 * scale; g.add(pot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18 * scale, 0.018 * scale, 6, 20), new THREE.MeshStandardMaterial({ color: 0x9a6040, roughness: 0.7 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.28 * scale; g.add(rim);
  g.add(cyl(0.02 * scale, 0.03 * scale, 0.55 * scale, new THREE.MeshStandardMaterial({ color: 0x34452b, roughness: 0.9 }), 0, 0.55 * scale, 0, 6));
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 8, 6), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x385a3b : 0x2c4934, roughness: 0.85, side: THREE.DoubleSide }));
    const a = (i / 9) * Math.PI * 2;
    leaf.scale.set(1, 0.28, 0.5);
    leaf.position.set(Math.cos(a) * 0.18 * scale, (0.55 + (i % 3) * 0.18) * scale, Math.sin(a) * 0.18 * scale);
    leaf.rotation.z = Math.cos(a) * 0.7; leaf.rotation.x = Math.sin(a) * 0.5;
    g.add(leaf);
  }
  g.userData.collider = { w: 0.4 * scale, d: 0.4 * scale, h: 0.8 * scale };
  return g;
}

export function makeCurtain(w = 1.2, h = 2.8, mat, tie = true) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(w, h, 10, 14);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 9) * 0.045 + Math.cos(y * 3) * 0.01);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.position.y = h / 2;
  g.add(m);
  const rod = cyl(0.02, 0.02, w + 0.5, new THREE.MeshStandardMaterial({ color: 0x5d4a2f, metalness: 0.7, roughness: 0.35 }), 0, h, 0, 8);
  rod.rotation.z = Math.PI / 2; g.add(rod);
  for (const s of [-1, 1]) {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x9b7c42, metalness: 0.8, roughness: 0.3 }));
    finial.position.set(s * (w / 2 + 0.26), h, 0); g.add(finial);
  }
  return g;
}

export function makeWindow(w = 1.8, h = 2.6, arch = false) {
  const g = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2b1e15, roughness: 0.6 });
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: moonTex(arch), transparent: false }));
  pane.position.z = 0.02;
  g.add(pane);
  // frame
  for (const s of [-1, 1]) {
    g.add(box(0.12, h + 0.2, 0.14, frameMat, s * (w / 2 + 0.04), 0, 0.04));
    g.add(box(0.1, 0.06, 0.12, frameMat, 0, s * (h / 2), 0.045));
  }
  g.add(box(w + 0.28, 0.14, 0.16, frameMat, 0, h / 2 + 0.02, 0.04));
  g.add(box(w + 0.28, 0.18, 0.3, frameMat, 0, -h / 2 + 0.03, 0.1));
  g.add(box(w, 0.07, 0.08, frameMat, 0, 0, 0.05));
  g.add(box(0.06, h, 0.07, frameMat, 0, 0, 0.05));
  // a faint spill of moonlight
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, h * 0.9), new THREE.MeshBasicMaterial({ color: 0x9ed8ff, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  spill.position.set(0, 0, 0.4); spill.rotation.x = 0.06; g.add(spill);
  return g;
}

export function makeKitchenCounter(w = 2.0, h = 0.9, d = 0.65, mat) {
  const g = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: 0x7c7b70, roughness: 0.4 });
  g.add(box(w, h, d, mat, 0, h / 2, 0));
  g.add(box(w + 0.06, 0.06, d + 0.06, topMat, 0, h + 0.02, 0));
  const doors = Math.max(2, Math.round(w / 0.6));
  for (let i = 0; i < doors; i++) {
    const cw = w / doors;
    g.add(box(cw - 0.05, h * 0.6, 0.03, mat, -w / 2 + cw / 2 + i * cw, h * 0.42, d / 2 + 0.02));
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: 0x2c2c28, metalness: 0.7, roughness: 0.4 }));
    knob.position.set(-w / 2 + cw / 2 + i * cw + (i % 2 ? -1 : 1) * (cw / 2 - 0.1), h * 0.42, d / 2 + 0.05);
    g.add(knob);
  }
  g.userData.collider = { w, d, h: h + 0.05 };
  return g;
}

export function makeSink(w = 1.2, h = 0.9, d = 0.68, mat) {
  const g = makeKitchenCounter(w, h, d, mat);
  const basin = box(0.55, 0.16, 0.4, new THREE.MeshStandardMaterial({ color: 0x9a9b90, metalness: 0.5, roughness: 0.35 }), 0, h - 0.02, 0);
  g.add(basin);
  g.add(cyl(0.02, 0.02, 0.32, new THREE.MeshStandardMaterial({ color: 0xb09a65, metalness: 0.8, roughness: 0.3 }), 0, h + 0.17, -0.25, 8));
  const spout = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0xb09a65, metalness: 0.8, roughness: 0.3 }));
  spout.position.set(0, h + 0.33, -0.19); spout.rotation.x = Math.PI / 2; g.add(spout);
  return g;
}

export function makeStove(w = 1.1, h = 0.95, d = 0.7) {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x24282a, roughness: 0.5, metalness: 0.55 });
  g.add(box(w, h, d, iron, 0, h / 2, 0));
  g.add(box(w - 0.1, 0.06, d - 0.1, new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.7, metalness: 0.4 }), 0, h + 0.02, 0));
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshStandardMaterial({ color: 0x171a1c, roughness: 0.8, metalness: 0.3 }));
    plate.rotation.x = -Math.PI / 2; plate.position.set(s * 0.22, h + 0.055, 0); g.add(plate);
  }
  g.add(box(w * 0.7, 0.3, 0.03, new THREE.MeshStandardMaterial({ color: 0x0c0d0e, roughness: 0.9 }), 0, h * 0.4, d / 2 + 0.005));
  g.add(box(w * 0.8, 0.04, 0.04, iron, 0, h * 0.62, d / 2 + 0.03));
  // kettle
  const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0x7c4a2e, metalness: 0.7, roughness: 0.35 }));
  kettle.position.set(0.22, h + 0.17, 0); g.add(kettle);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2b2b2a, metalness: 0.6, roughness: 0.5 }));
  handle.position.set(0.22, h + 0.28, 0); g.add(handle);
  g.userData.collider = { w, d, h: h + 0.05 };
  return g;
}

export function makeFridge(w = 0.9, h = 1.9, d = 0.7) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0xd4cdb8, roughness: 0.4, metalness: 0.25 });
  g.add(box(w, h, d, m, 0, h / 2, 0, 0.03));
  g.add(box(w - 0.06, 0.7, 0.03, m, 0, h - 0.4, d / 2 + 0.01));
  g.add(box(w - 0.06, h - 0.9, 0.03, m, 0, (h - 0.9) / 2, d / 2 + 0.01));
  g.add(box(0.03, 0.25, 0.04, new THREE.MeshStandardMaterial({ color: 0x77705e, metalness: 0.7, roughness: 0.3 }), 0.28, h - 0.45, d / 2 + 0.04));
  g.userData.collider = { w, d, h };
  return g;
}

export function makeToyChest() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4028, roughness: 0.65 });
  g.add(box(1.0, 0.55, 0.6, wood, 0, 0.28, 0));
  const lid = box(1.04, 0.15, 0.64, new THREE.MeshStandardMaterial({ color: 0x5a3522, roughness: 0.6 }), 0, 0.62, 0);
  g.add(lid);
  for (const s of [-1, 1]) {
    g.add(box(0.06, 0.58, 0.64, new THREE.MeshStandardMaterial({ color: 0x8c6a3f, metalness: 0.5, roughness: 0.4 }), s * 0.42, 0.29, 0));
  }
  g.add(box(0.14, 0.16, 0.04, new THREE.MeshStandardMaterial({ color: 0xc19c56, metalness: 0.7, roughness: 0.3 }), 0, 0.34, 0.31));
  // little stars painted on
  for (let i = 0; i < 5; i++) {
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.025, 5), new THREE.MeshBasicMaterial({ color: 0xd8b063 }));
    star.position.set(-0.25 + i * 0.12, 0.18 + (i % 2) * 0.07, 0.305);
    g.add(star);
  }
  g.userData.collider = { w: 1.1, d: 0.7, h: 0.8 };
  return g;
}

export function makeDollhouse() {
  const g = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: 0xa98a6a, roughness: 0.8 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x6e3d33, roughness: 0.8 });
  g.add(box(1.0, 0.7, 0.7, wall, 0, 0.45, 0));
  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.4, 4), roof);
  roofMesh.rotation.y = Math.PI / 4; roofMesh.position.y = 0.98; roofMesh.scale.set(1, 1, 0.75); g.add(roofMesh);
  for (let i = 0; i < 3; i++) {
    g.add(box(0.13, 0.16, 0.02, new THREE.MeshBasicMaterial({ color: 0xe4bb72 }), -0.3 + i * 0.3, 0.52, 0.36));
  }
  g.add(box(0.16, 0.3, 0.02, new THREE.MeshStandardMaterial({ color: 0x4d2e22, roughness: 0.7 }), 0, 0.2, 0.36));
  for (const s of [-1, 1]) g.add(box(0.14, 0.14, 0.14, wall, s * 0.68, 0.14, 0));
  g.userData.collider = { w: 1.2, d: 0.9, h: 1.2 };
  return g;
}

export function makeRockingHorse() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5c37, roughness: 0.55 });
  const horse = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), new THREE.MeshStandardMaterial({ color: 0xc9b799, roughness: 0.8 }));
  horse.scale.set(0.65, 0.8, 1.2); horse.position.y = 0.5; g.add(horse);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({ color: 0xc9b799, roughness: 0.8 }));
  head.position.set(0, 0.75, 0.28); head.scale.set(0.75, 1, 0.9); g.add(head);
  const mane = box(0.05, 0.16, 0.22, new THREE.MeshStandardMaterial({ color: 0x5b3b27, roughness: 0.9 }), 0, 0.82, 0.2);
  g.add(mane);
  for (const s of [-1, 1]) {
    g.add(cyl(0.035, 0.04, 0.32, wood, s * 0.12, 0.26, 0.2, 8));
    g.add(cyl(0.035, 0.04, 0.32, wood, s * 0.12, 0.26, -0.2, 8));
  }
  for (const s of [-1, 1]) {
    const rocker = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 20, Math.PI), wood);
    rocker.rotation.x = Math.PI / 2; rocker.rotation.z = Math.PI / 2; rocker.position.set(0, 0.08, s * 0.2); g.add(rocker);
  }
  g.userData.collider = { w: 0.6, d: 0.9, h: 0.9 };
  return g;
}

export function makeCrate(s = 0.7) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5b422b, roughness: 0.85 });
  g.add(box(s, s, s, wood, 0, s / 2, 0));
  for (const y of [0.2, 0.8]) g.add(box(s + 0.02, 0.05, s + 0.02, new THREE.MeshStandardMaterial({ color: 0x40301f, roughness: 0.9 }), 0, s * y, 0));
  g.userData.collider = { w: s, d: s, h: s };
  return g;
}

export function makeTrunk() {
  const g = new THREE.Group();
  const leather = new THREE.MeshStandardMaterial({ color: 0x4a2f22, roughness: 0.8 });
  g.add(box(1.2, 0.5, 0.65, leather, 0, 0.35, 0, 0.06));
  g.add(box(1.22, 0.18, 0.67, leather, 0, 0.69, 0, 0.08));
  for (const s of [-1, 1]) {
    g.add(box(0.07, 0.55, 0.69, new THREE.MeshStandardMaterial({ color: 0x8c6b42, metalness: 0.5, roughness: 0.4 }), s * 0.4, 0.36, 0));
  }
  g.add(box(0.16, 0.12, 0.04, new THREE.MeshStandardMaterial({ color: 0xc4a15c, metalness: 0.8, roughness: 0.3 }), 0, 0.42, 0.35));
  g.userData.collider = { w: 1.25, d: 0.72, h: 0.8 };
  return g;
}

export function makeGramophone() {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08a45, metalness: 0.85, roughness: 0.3 });
  g.add(box(0.6, 0.28, 0.55, new THREE.MeshStandardMaterial({ color: 0x4a2e1e, roughness: 0.5 }), 0, 0.42, 0, 0.02));
  g.add(box(0.5, 0.18, 0.45, new THREE.MeshStandardMaterial({ color: 0x4a2e1e, roughness: 0.5 }), 0, 0.22, 0));
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 20, 1, true), brass);
  horn.rotation.z = -1.1; horn.position.set(0.2, 0.72, 0); g.add(horn);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.7 }));
  disc.position.y = 0.57; g.add(disc);
  g.userData.collider = { w: 0.65, d: 0.6, h: 0.8 };
  return g;
}

export function makeMusicBox() {
  const g = new THREE.Group();
  g.add(box(0.34, 0.14, 0.26, new THREE.MeshStandardMaterial({ color: 0x5e3a38, roughness: 0.4, metalness: 0.2 }), 0, 0.07, 0, 0.01));
  g.add(box(0.3, 0.03, 0.22, new THREE.MeshStandardMaterial({ color: 0xa58446, metalness: 0.7, roughness: 0.35 }), 0, 0.15, 0));
  const ballerina = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.13, 8), new THREE.MeshStandardMaterial({ color: 0xe4cfc4, roughness: 0.6 }));
  ballerina.position.set(0, 0.22, 0); g.add(ballerina);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 4, 10), new THREE.MeshStandardMaterial({ color: 0xc7a45c, metalness: 0.8, roughness: 0.3 }));
  handle.position.set(0.19, 0.09, 0); handle.rotation.y = Math.PI / 2; g.add(handle);
  g.userData.musicBox = true;
  return g;
}

export function makeBooks(w = 0.6, count = 5) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const b = box(w - Math.random() * 0.1, 0.05 + Math.random() * 0.03, 0.42 + Math.random() * 0.08, new THREE.MeshStandardMaterial({ color: BOOK_COLORS[(i * 3) % BOOK_COLORS.length], roughness: 0.75 }), (Math.random() - 0.5) * 0.04, 0.03 + i * 0.055, (Math.random() - 0.5) * 0.06);
    b.rotation.y = (Math.random() - 0.5) * 0.25;
    g.add(b);
  }
  return g;
}

export function makeStackOfBooks(count = 4) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const b = box(0.26 + Math.random() * 0.08, 0.045, 0.34 + Math.random() * 0.08, new THREE.MeshStandardMaterial({ color: BOOK_COLORS[(i * 4 + 1) % BOOK_COLORS.length], roughness: 0.78 }), (Math.random() - 0.5) * 0.03, 0.022 + i * 0.047, (Math.random() - 0.5) * 0.03);
    b.rotation.y = (Math.random() - 0.5) * 0.35;
    g.add(b);
  }
  return g;
}

export function makeTeaSet() {
  const g = new THREE.Group();
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xe8e0cd, roughness: 0.25, metalness: 0.05 });
  const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), porcelain);
  teapot.scale.y = 0.75; teapot.position.y = 0.1; g.add(teapot);
  g.add(cyl(0.03, 0.035, 0.08, porcelain, 0, 0.17, 0, 8));
  const spout = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.13, 8), porcelain);
  spout.rotation.z = -1.1; spout.position.set(0.12, 0.13, 0); g.add(spout);
  for (let i = 0; i < 3; i++) {
    const cup = cyl(0.045, 0.03, 0.06, porcelain, -0.2 + i * 0.12, 0.03, 0.18 + (i % 2) * 0.08, 10);
    g.add(cup);
    const saucer = cyl(0.07, 0.075, 0.01, porcelain, -0.2 + i * 0.12, 0.005, 0.18 + (i % 2) * 0.08, 12);
    g.add(saucer);
  }
  return g;
}

export function makeFood() {
  const g = new THREE.Group();
  const plate = cyl(0.16, 0.18, 0.02, new THREE.MeshStandardMaterial({ color: 0xe5ddc9, roughness: 0.3 }), 0, 0.01, 0, 20);
  g.add(plate);
  const cake = cyl(0.12, 0.13, 0.09, new THREE.MeshStandardMaterial({ color: 0xc28a63, roughness: 0.8 }), 0, 0.06, 0, 16);
  g.add(cake);
  const icing = cyl(0.122, 0.122, 0.02, new THREE.MeshStandardMaterial({ color: 0xe9d6b3, roughness: 0.7 }), 0, 0.11, 0, 16);
  g.add(icing);
  const berry = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8f2a33, roughness: 0.5 }));
  berry.position.set(0, 0.135, 0); g.add(berry);
  return g;
}

export function makeVaseFlowers(scale = 1) {
  const g = new THREE.Group();
  const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.09 * scale, 0.26 * scale, 14), new THREE.MeshStandardMaterial({ color: 0x617f86, roughness: 0.3, metalness: 0.1 }));
  vase.position.y = 0.13 * scale; g.add(vase);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3;
    const stem = cyl(0.007 * scale, 0.007 * scale, 0.35 * scale, new THREE.MeshStandardMaterial({ color: 0x3c5a35, roughness: 0.9 }), Math.cos(a) * 0.04, 0.35 * scale, Math.sin(a) * 0.04, 5);
    stem.rotation.z = Math.cos(a) * 0.18; g.add(stem);
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 8, 6), new THREE.MeshStandardMaterial({ color: [0xc46a76, 0xd7b2c4, 0xe0c7a2][i % 3], roughness: 0.75 }));
    flower.position.set(Math.cos(a) * 0.095, 0.52 * scale + (i % 3) * 0.03, Math.sin(a) * 0.095); g.add(flower);
  }
  return g;
}

export function makeGlobe() {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08a45, metalness: 0.8, roughness: 0.3 });
  g.add(cyl(0.12, 0.16, 0.04, brass, 0, 0.02, 0, 16));
  g.add(cyl(0.025, 0.03, 0.35, brass, 0, 0.2, 0, 8));
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), new THREE.MeshStandardMaterial({ color: 0x4d6b74, roughness: 0.6 }));
  globe.position.y = 0.52; g.add(globe);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.012, 6, 24), brass);
  ring.rotation.x = 1.0; ring.position.y = 0.52; g.add(ring);
  for (let i = 0; i < 5; i++) {
    const land = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a7f4f, roughness: 0.9 }));
    const a = i * 1.7; land.position.set(Math.cos(a) * 0.17, 0.52 + Math.sin(i) * 0.1, Math.sin(a) * 0.17); land.scale.set(1, 0.6, 1); g.add(land);
  }
  g.userData.collider = { w: 0.45, d: 0.45, h: 0.8 };
  return g;
}

export function makeCoatRack() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4d301d, roughness: 0.6 });
  g.add(cyl(0.035, 0.05, 1.8, wood, 0, 0.9, 0, 10));
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const arm = cyl(0.014, 0.014, 0.22, wood, Math.cos(a) * 0.1, 1.72, Math.sin(a) * 0.1, 6);
    arm.rotation.z = Math.cos(a) * 1.0; arm.rotation.x = Math.sin(a) * 1.0; g.add(arm);
  }
  g.userData.collider = { w: 0.4, d: 0.4, h: 1.8 };
  return g;
}

export function makeClothesHanging(color = 0x3f4a5a) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95, side: THREE.DoubleSide });
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.26, 0.8, 10, 1, true), mat);
  coat.position.y = 1.25; g.add(coat);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat);
  shoulders.scale.y = 0.55; shoulders.position.y = 1.6; g.add(shoulders);
  return g;
}

export function makeStairRailing(length, height = 1.0, mat) {
  const g = new THREE.Group();
  const m = mat || new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.5 });
  g.add(box(length, 0.1, 0.1, m, 0, height, 0));
  const count = Math.max(2, Math.floor(length / 0.3));
  for (let i = 0; i <= count; i++) {
    g.add(box(0.045, height, 0.045, m, -length / 2 + (i / count) * length, height / 2, 0));
  }
  g.add(box(length, 0.06, 0.08, m, 0, 0.02, 0));
  return g;
}

export function makeBalconyRail(length, height = 0.9) {
  return makeStairRailing(length, height);
}

export function makeFrame(x, y, z, rotY = 0) {
  return { x, y, z, rotY };
}

export function makeWindowSeat(w = 1.7) {
  const g = new THREE.Group();
  g.add(box(w, 0.5, 0.6, new THREE.MeshStandardMaterial({ color: 0x6b4a2d, roughness: 0.65 }), 0, 0.25, 0));
  g.add(box(w - 0.1, 0.1, 0.5, new THREE.MeshStandardMaterial({ color: 0x9c7951, roughness: 0.85 }), 0, 0.55, 0, 0.03));
  for (const s of [-1, 1]) g.add(box(0.16, 0.42, 0.42, new THREE.MeshStandardMaterial({ color: 0x8c7d70, roughness: 0.95 }), s * (w / 2 - 0.2), 0.68, -0.05, 0.05));
  g.userData.collider = { w, d: 0.7, h: 0.65 };
  return g;
}

export function makeShelfLedge(w, h, d, mat) {
  const g = new THREE.Group();
  g.add(box(w, h, d, mat, 0, h / 2, 0));
  return g;
}
