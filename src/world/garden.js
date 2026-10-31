import * as THREE from 'three';
import * as F from './furniture.js';
import { wispSprite, glowSprite, moonWindow, noteTexture } from './textures.js';

const PI = Math.PI;

function grassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#213a2c';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const g = 40 + Math.random() * 55;
    ctx.fillStyle = `rgba(${Math.floor(g * 0.55)},${Math.floor(g)},${Math.floor(g * 0.7)},${0.12 + Math.random() * 0.2})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 4);
  }
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(10,20,14,${0.02 + Math.random() * 0.05})`;
    ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 70, 0, PI * 2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function addGlowSprite(parent, x, y, z, color, scale, opacity) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.position.set(x, y, z); s.scale.setScalar(scale);
  parent.add(s);
  return s;
}

function tree(m, x, z, scale = 1) {
  const g = new THREE.Group();
  const trunk = F.cyl(0.18 * scale, 0.3 * scale, 3.4 * scale, m.M.trunk, 0, 1.7 * scale, 0, 9);
  g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * PI * 2 + Math.random();
    const leaf = new THREE.Mesh(new THREE.SphereGeometry((0.9 + Math.random() * 0.5) * scale, 10, 8), i % 2 ? m.M.leaf : m.M.leafLight);
    leaf.position.set(Math.cos(a) * (0.5 + Math.random() * 0.5) * scale, (3.2 + Math.random() * 1.2) * scale, Math.sin(a) * 0.55 * scale);
    leaf.scale.set(1, 0.8, 1);
    g.add(leaf);
  }
  for (let i = 0; i < 4; i++) {
    const branch = F.cyl(0.04 * scale, 0.09 * scale, 1.5 * scale, m.M.trunk, 0, 0, 0, 6);
    const a = i * 1.6;
    branch.position.set(Math.cos(a) * 0.35 * scale, 2.4 * scale, Math.sin(a) * 0.35 * scale);
    branch.rotation.z = Math.cos(a) * 0.7; branch.rotation.x = -Math.sin(a) * 0.7;
    g.add(branch);
  }
  g.position.set(x, 0, z);
  m.group.add(g);
  m.colliders.push({ minX: x - 0.35 * scale, maxX: x + 0.35 * scale, minZ: z - 0.35 * scale, maxZ: z + 0.35 * scale, minY: 0, maxY: 3.4 * scale });
  return g;
}

function hedgeRow(m, x1, z1, x2, z2, h = 1.3) {
  const w = Math.abs(x2 - x1) || 0.9;
  const d = Math.abs(z2 - z1) || 0.9;
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const mat = m.M.hedge;
  const seg = Math.max(2, Math.floor(Math.max(w, d) / 1.2));
  for (let i = 0; i < seg; i++) {
    const t = (i + 0.5) / seg;
    const bx = x1 + (x2 - x1) * t;
    const bz = z1 + (z2 - z1) * t;
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.75, 9, 7), mat);
    bush.scale.set(d > w ? 0.75 : 1.0, h / 1.2, w > d ? 0.75 : 1.0);
    bush.position.set(bx, h / 2, bz);
    m.group.add(bush);
  }
  m.colliders.push({ minX: Math.min(x1, x2) - 0.6, maxX: Math.max(x1, x2) + 0.6, minZ: Math.min(z1, z2) - 0.6, maxZ: Math.max(z1, z2) + 0.6, minY: 0, maxY: h });
}

export function makeGarden(m) {
  const M = m.M;
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 0.95, color: 0x9bb08c });
  m.addFloor(-20, -34, 20, -10.05, 0, grassMat, 0.3, true, 'garden');
  // make the garden walkable to its edges except structures
  m.walkables.push({ type: 'rect', minX: -19, maxX: 19, minZ: -32.5, maxZ: -10.2, y: 0, tag: 'garden' });

  // winding stepping-stone path
  const pathMat = new THREE.MeshStandardMaterial({ map: M.stone.map, color: 0x8a8f88, roughness: 0.9 });
  for (let i = 0; i < 19; i++) {
    const t = i / 18;
    const z = -10.8 - t * 21.5;
    const x = Math.sin(t * 5.5) * 1.6 + t * 4.5;
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55 + Math.random() * 0.25, 0.6 + Math.random() * 0.25, 0.07, 9), pathMat);
    stone.position.set(x, 0.035, z);
    stone.rotation.y = Math.random() * PI;
    m.group.add(stone);
  }

  // boundary hedges
  hedgeRow(m, -19.2, -10.4, -19.2, -33, 1.5);
  hedgeRow(m, 19.2, -10.4, 19.2, -33, 1.5);
  hedgeRow(m, -19.2, -33, -2.8, -33, 1.4);
  hedgeRow(m, 2.8, -33, 19.2, -33, 1.4);
  hedgeRow(m, -9, -12.5, -19, -12.5, 1.0);
  hedgeRow(m, 9, -12.5, 19, -12.5, 1.0);

  // trees
  tree(m, -16.2, -14.8, 1.25);
  tree(m, 17.0, -27.0, 1.4);
  tree(m, -17.0, -28.0, 1.15);
  tree(m, 10.8, -11.9, 0.8);
  tree(m, 16.4, -19.8, 0.9);
  tree(m, -8.0, -30.5, 1.2);

  // fountain
  const fountain = new THREE.Group();
  const stoneMat = M.stone;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.35, 0.55, 36), stoneMat);
  basin.position.y = 0.27; fountain.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.95, 36), new THREE.MeshPhysicalMaterial({ color: 0x2d5f72, roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.96 }));
  water.rotation.x = -PI / 2; water.position.y = 0.56; fountain.add(water);
  const pedestal = F.cyl(0.32, 0.5, 1.0, stoneMat, 0, 1.05, 0, 20); fountain.add(pedestal);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.28, 24), stoneMat);
  bowl.position.y = 1.52; fountain.add(bowl);
  const water2 = new THREE.Mesh(new THREE.CircleGeometry(0.8, 24), new THREE.MeshPhysicalMaterial({ color: 0x336a80, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 }));
  water2.rotation.x = -PI / 2; water2.position.y = 1.67; fountain.add(water2);
  const figure = new THREE.Group();
  const cat = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0x93a09d, roughness: 0.8 }));
  cat.scale.set(0.8, 1.2, 0.8); cat.position.y = 0.25; figure.add(cat);
  const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0x93a09d, roughness: 0.8 }));
  catHead.position.y = 0.55; figure.add(catHead);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x93a09d, roughness: 0.8 }));
    ear.position.set(s * 0.08, 0.72, 0); figure.add(ear);
  }
  figure.position.y = 1.65; fountain.add(figure);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2;
    const jet = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0x9fdcef, transparent: true, opacity: 0.6 }));
    jet.position.set(Math.cos(a) * 0.5, 2.0 + Math.sin(i) * 0.3, Math.sin(a) * 0.5); fountain.add(jet);
  }
  const fountainGlow = addGlowSprite(fountain, 0, 1.2, 0, 0x8bd6f0, 4.0, 0.16);
  fountain.position.set(4.5, 0, -21.5);
  m.group.add(fountain);
  m.colliders.push({ minX: 2.15, maxX: 6.85, minZ: -23.85, maxZ: -19.15, minY: 0, maxY: 2.3 });
  m.special.fountain = fountain;
  m.special.fountainWater = water;
  m.addInteractive('fountain', 'The old fountain', fountain, 4.5, -19.3, 1.0, 2.6, { type: 'lore', text: 'The water is impossibly still. A stone cat sits at its centre, ears tall, one eye chipped away. Coins glimmer beneath the surface, wishes no one came back for.' });

  // gazebo
  const gazebo = new THREE.Group();
  const floorG = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 0.3, 32), M.stone); floorG.position.y = 0.15; gazebo.add(floorG);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    gazebo.add(F.cyl(0.14, 0.18, 3.0, M.woodPale, Math.cos(a) * 2.5, 1.65, Math.sin(a) * 2.5, 10));
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.4, 6), new THREE.MeshStandardMaterial({ color: 0x2d4039, roughness: 0.8 }));
  roof.position.y = 3.5; gazebo.add(roof);
  const bench = new THREE.Group();
  bench.add(F.box(2.6, 0.12, 0.6, M.woodPale, 0, 0.05, 0));
  bench.add(F.box(2.6, 0.6, 0.12, M.woodPale, 0, 0.3, -0.28));
  bench.position.set(0, 0.55, -1.2); bench.rotation.y = 0.2; gazebo.add(bench);
  const lantern = F.makeCandle(0.3, 1.4); lantern.position.set(0, 1.4, 0); gazebo.add(lantern);
  const gazeboGlow = addGlowSprite(gazebo, 0, 1.8, 0, 0xffc47a, 2.2, 0.3);
  gazebo.position.set(-12.0, 0, -23.5);
  m.group.add(gazebo);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    const cx = -12 + Math.cos(a) * 2.5, cz = -23.5 + Math.sin(a) * 2.5;
    m.colliders.push({ minX: cx - 0.25, maxX: cx + 0.25, minZ: cz - 0.25, maxZ: cz + 0.25, minY: 0, maxY: 3.5 });
  }
  m.special.gazebo = gazebo;
  m.addInteractive('gazebo', 'A quiet gazebo', gazebo, -12.5, -22.15, 1.4, 2.6, { type: 'lore', text: 'Someone used to sit here on summer evenings. The bench still holds the shape of two small figures — one human, one with a tail.' });

  // shed
  buildShed(m);

  // garden gate at the far end
  const gate = new THREE.Group();
  gate.add(F.box(5.6, 0.35, 0.3, M.stone, 0, 3.1, 0));
  for (const s of [-1, 1]) gate.add(F.box(0.45, 3.2, 0.45, M.stone, s * 2.55, 1.6, 0));
  for (let i = 0; i < 14; i++) gate.add(F.box(0.05, 2.5, 0.05, M.iron, -2.1 + i * 0.32, 1.35, 0));
  gate.add(F.box(4.5, 0.06, 0.08, M.iron, 0, 2.5, 0));
  gate.add(F.box(4.5, 0.06, 0.08, M.iron, 0, 0.4, 0));
  gate.position.set(0, 0, -32.6);
  m.group.add(gate);
  m.colliders.push({ minX: -3, maxX: 3, minZ: -32.8, maxZ: -32.4, minY: 0, maxY: 3.2 });
  m.addInteractive('garden_gate', 'The garden gate', gate, 0, -31.8, 1.6, 2.5, { type: 'gate' });

  // lantern posts along the path
  const lanternPositions = [[-2.0, -14.0], [2.0, -18.5], [-1.0, -26.5], [7.6, -28.0]];
  for (const [x, z] of lanternPositions) {
    const post = new THREE.Group();
    post.add(F.cyl(0.06, 0.09, 2.4, M.iron, 0, 1.2, 0, 8));
    post.add(F.box(0.34, 0.42, 0.34, M.iron, 0, 2.3, 0));
    const glass = F.box(0.24, 0.3, 0.24, new THREE.MeshBasicMaterial({ color: 0xffcf8e, transparent: true, opacity: 0.75 }), 0, 2.3, 0);
    post.add(glass);
    post.add(F.box(0.42, 0.08, 0.42, M.iron, 0, 2.55, 0));
    addGlowSprite(post, 0, 2.3, 0, 0xffbb6a, 1.2, 0.35);
    post.position.set(x, 0, z);
    m.group.add(post);
    m.colliders.push({ minX: x - 0.18, maxX: x + 0.18, minZ: z - 0.18, maxZ: z + 0.18, minY: 0, maxY: 2.6 });
  }

  // moon and stars
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color: 0xdff5ff, transparent: true, opacity: 0.98, blending: THREE.AdditiveBlending, depthWrite: false }));
  moon.position.set(12, 22, -44); moon.scale.set(11, 11, 1);
  m.scene.add(moon);
  const moonCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  moonCore.position.set(12, 22, -44); moonCore.scale.set(5.5, 5.5, 1);
  m.scene.add(moonCore);
  m.special.moonSprite = moon;

  const starGeo = new THREE.BufferGeometry();
  const starCount = 500;
  const sp = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    sp[i * 3] = -70 + Math.random() * 140;
    sp[i * 3 + 1] = 14 + Math.random() * 50;
    sp[i * 3 + 2] = -90 + Math.random() * 50;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfe8ff, size: 0.22, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.scene.add(stars);

  // fireflies in the garden
  const ffCount = 90;
  const ffGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(ffCount * 3);
  const ffSeed = new Float32Array(ffCount);
  for (let i = 0; i < ffCount; i++) {
    ffPos[i * 3] = -18 + Math.random() * 36;
    ffPos[i * 3 + 1] = 0.4 + Math.random() * 3.2;
    ffPos[i * 3 + 2] = -31 + Math.random() * 20;
    ffSeed[i] = Math.random() * PI * 2;
  }
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const fireflies = new THREE.Points(ffGeo, new THREE.PointsMaterial({ map: glowSprite(), color: 0xffd890, size: 0.25, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.group.add(fireflies);
  m.special.fireflies = fireflies;

  // rain
  const rainCount = 1200;
  const rainGeo = new THREE.BufferGeometry();
  const rPos = new Float32Array(rainCount * 6);
  const rData = [];
  for (let i = 0; i < rainCount; i++) {
    const x = -22 + Math.random() * 44;
    const y = Math.random() * 20;
    const z = -34 + Math.random() * 26;
    const len = 0.35 + Math.random() * 0.7;
    rPos[i * 6] = x; rPos[i * 6 + 1] = y; rPos[i * 6 + 2] = z;
    rPos[i * 6 + 3] = x + 0.04; rPos[i * 6 + 4] = y - len; rPos[i * 6 + 5] = z + 0.02;
    rData.push({ speed: 9 + Math.random() * 8, x, z, y, len });
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xa9d4e8, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.group.add(rain);
  m.special.rain = rain;
  m.special.rainData = { pos: rPos, data: rData, count: rainCount };

  // puddles / wet spots
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.2 + Math.random() * 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x24333a, roughness: 0.08, metalness: 0.45 }));
    p.rotation.x = -PI / 2;
    p.position.set(-18 + Math.random() * 36, 0.02, -30 + Math.random() * 18);
    m.group.add(p);
  }

  // flowers
  for (let i = 0; i < 26; i++) {
    const x = -18 + Math.random() * 36;
    const z = -31 + Math.random() * 19;
    if (Math.abs(x) < 3.5) continue;
    const stem = F.cyl(0.008, 0.008, 0.25, new THREE.MeshStandardMaterial({ color: 0x2c4a31, roughness: 0.9 }), x, 0.12, z, 4);
    m.group.add(stem);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshStandardMaterial({ color: [0xc8a2b8, 0xd5c48d, 0x9fb4c9][i % 3], roughness: 0.8 }));
    fl.position.set(x, 0.27, z); m.group.add(fl);
  }

  // gravel border by the house
  const terrace = new THREE.Mesh(new THREE.PlaneGeometry(18, 2.1), new THREE.MeshStandardMaterial({ map: M.stone.map, color: 0x82847a, roughness: 0.95 }));
  terrace.rotation.x = -PI / 2; terrace.position.set(0, 0.02, -11.1);
  m.group.add(terrace);

  // update loop for rain/fireflies/fountain
  m.updateFns.push((dt, elapsed) => {
    if (m.special.rain) {
      const { pos, data, count } = m.special.rainData;
      for (let i = 0; i < count; i++) {
        const d = data[i];
        d.y -= d.speed * dt;
        if (d.y < 0) { d.y = 18 + Math.random() * 4; d.x = -22 + Math.random() * 44; d.z = -34 + Math.random() * 26; }
        pos[i * 6] = d.x; pos[i * 6 + 1] = d.y; pos[i * 6 + 2] = d.z;
        pos[i * 6 + 3] = d.x + 0.04; pos[i * 6 + 4] = d.y - d.len; pos[i * 6 + 5] = d.z + 0.02;
      }
      m.special.rain.geometry.attributes.position.needsUpdate = true;
    }
    if (m.special.fireflies) {
      const pos = m.special.fireflies.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const s = ffSeed[i];
        pos.setX(i, pos.getX(i) + Math.sin(elapsed * 0.5 + s) * 0.0025);
        pos.setY(i, 0.4 + Math.abs(Math.sin(elapsed * 0.8 + s)) * 2.8);
        pos.setZ(i, pos.getZ(i) + Math.cos(elapsed * 0.4 + s) * 0.002);
      }
      pos.needsUpdate = true;
      m.special.fireflies.material.opacity = 0.65 + Math.sin(elapsed * 2.2) * 0.15;
    }
    if (m.special.fountainWater) {
      m.special.fountainWater.material.opacity = 0.9 + Math.sin(elapsed * 1.5) * 0.04;
    }
    if (m.special.moonSprite) {
      m.special.moonSprite.material.opacity = 0.9 + Math.sin(elapsed * 0.6) * 0.03;
    }
  });
}

function buildShed(m) {
  const M = m.M;
  const g = new THREE.Group();
  const x1 = 11.8, x2 = 14.8, z1 = -16.8, z2 = -14.8;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4c3a29, roughness: 0.9 });
  // floor
  m.addFloor(x1, z1, x2, z2, 0.02, M.woodFloorDark, 0.16, true, 'garden');
  // walls
  m.addBox(x2 - x1, 2.4, 0.16, wallMat, (x1 + x2) / 2, 1.2, z1 + 0.08);
  m.addBox(0.16, 2.4, z2 - z1, wallMat, x1 + 0.08, 1.2, (z1 + z2) / 2);
  m.addBox(0.16, 2.4, z2 - z1, wallMat, x2 - 0.08, 1.2, (z1 + z2) / 2);
  m.addBox(1.1, 2.4, 0.16, wallMat, x1 + 0.55, 1.2, z2 - 0.08);
  m.addBox(1.0, 2.4, 0.16, wallMat, x2 - 0.5, 1.2, z2 - 0.08);
  m.addBox(2.0, 0.95, 0.16, wallMat, (x1 + x2) / 2, 1.92, z2 - 0.08);
  m.colliders.push({ minX: x1, maxX: x2, minZ: z1, maxZ: z1 + 0.2, minY: 0, maxY: 2.4 });
  m.colliders.push({ minX: x1, maxX: x1 + 0.2, minZ: z1, maxZ: z2, minY: 0, maxY: 2.4 });
  m.colliders.push({ minX: x2 - 0.2, maxX: x2, minZ: z1, maxZ: z2, minY: 0, maxY: 2.4 });
  m.colliders.push({ minX: x1, maxX: 12.3, minZ: z2 - 0.2, maxZ: z2, minY: 0, maxY: 2.4 });
  m.colliders.push({ minX: 13.9, maxX: x2, minZ: z2 - 0.2, maxZ: z2, minY: 0, maxY: 2.4 });
  // roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.35, 1.0, 4), new THREE.MeshStandardMaterial({ color: 0x3b443f, roughness: 0.85 }));
  roof.position.set((x1 + x2) / 2, 2.9, (z1 + z2) / 2);
  roof.rotation.y = PI / 4; roof.scale.z = 1.35;
  m.group.add(roof);
  // door
  const door = m.addDoor({ id: 'shed', x: 12.5, z: z2 - 0.1, width: 1.3, height: 2.15, rotY: 0, hinge: 1, label: 'The garden shed', locked: false, open: false, swing: -1 });

  // shelf + key
  const shelf = m.addBox(2.0, 0.08, 0.4, M.woodPale, 13.2, 1.2, z1 + 0.3);
  const legs = 4;
  // key
  const key = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a25a, metalness: 0.9, roughness: 0.25 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.011, 6, 14), brass); ring.rotation.x = PI / 2; key.add(ring);
  key.add(F.box(0.016, 0.01, 0.15, brass, 0, 0, 0.11));
  key.add(F.box(0.055, 0.01, 0.022, brass, 0.03, 0, 0.15));
  key.position.set(13.2, 1.3, z1 + 0.3); key.rotation.y = 0.5;
  m.group.add(key);
  const keyGlow = addGlowSprite(m.group, 13.2, 1.38, z1 + 0.3, 0xffcf80, 0.65, 0.5);
  key.userData.glow = keyGlow;
  m.special.cellarKeyObject = key;
  m.addInteractive('cellar_key_pickup', 'A heavy iron key', key, 13.2, z1 + 0.4, 1.3, 2.0, { type: 'key_pickup', item: 'cellarKey', hidden: true });
  // note and tools inside
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.36), new THREE.MeshStandardMaterial({ map: noteTexture(['Cellar key.', 'Lock it behind you.']), roughness: 0.9, side: THREE.DoubleSide }));
  note.position.set(12.4, 1.22, z1 + 0.26); note.rotation.x = -PI / 2; m.group.add(note);
  m.addInteractive('shed_note', 'A note in the shed', note, 12.4, z1 + 0.4, 1.2, 1.8, { type: 'lore', text: '“Cellar key. Lock it behind you. The damp gets into everything.” A rusted trowel lies beneath the note, and a tin of seeds.' });
  // tools
  for (let i = 0; i < 4; i++) {
    const tool = F.cyl(0.02, 0.02, 1.0, M.woodDark, 12.2 + i * 0.5, 1.6, z1 + 0.2, 5);
    tool.rotation.z = 0.2; m.group.add(tool);
  }
  const bucket = F.cyl(0.18, 0.16, 0.3, M.iron, 14.4, 0.15, z1 + 0.4, 12);
  m.group.add(bucket);
  // lantern by the door
  const l = F.makeCandle(0.22, 1.2); l.position.set(14.4, 1.5, z2 + 0.15); m.group.add(l);
  const glow = addGlowSprite(m.group, 14.4, 1.75, z2 + 0.15, 0xffb66a, 1.6, 0.4);
  g.position.set(0, 0, 0);
  m.group.add(g);
  m.special.shed = g;
  m.special.shedDoor = door;
}
