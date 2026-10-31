import * as THREE from 'three';
import * as T from './textures.js';

function std(map, opts = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    roughness: 0.72,
    metalness: 0.02,
    ...opts,
  });
}

function cloneMap(map, rx = 1, ry = 1) {
  const t = map.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createMaterials() {
  T.resetRand(4242);
  const floorTex = T.woodFloor(true);
  const floorTexDark = T.woodFloor(false);
  const panelTex = T.woodPanel(false);
  const panelDark = T.woodPanel(true);
  const stoneTex = T.stone();
  const tileTex = T.tile();
  const marbleTex = T.marble();
  const carpetTex = T.rug('#5f2430', '#c7a36a', '#253a4c');
  const blueRugTex = T.rug('#27465c', '#c9b280', '#1d2b3a');
  const greenRugTex = T.rug('#2d493d', '#b89a5f', '#1f2d2b');
  const redRugTex = T.rug('#6e2c2c', '#c9a76b', '#2b1e1e');
  const childRugTex = T.rug('#3c5069', '#b7c1b4', '#2a3242', false);
  const fabricBlue = T.fabric('#3d5870', '#5b7b96');
  const fabricGreen = T.fabric('#3b4d3c', '#60755c');
  const fabricRed = T.fabric('#5a2c30', '#7b4448');
  const fabricCream = T.fabric('#b9a98b', '#d3c6a8');

  const w = T.wallpaper;
  const wallTex = {
    foyer: w(T.PALETTES.foyerWall.bg, T.PALETTES.foyerWall.accent, 0),
    living: w(T.PALETTES.livingWall.bg, T.PALETTES.livingWall.accent, 1),
    dining: w(T.PALETTES.diningWall.bg, T.PALETTES.diningWall.accent, 0),
    library: w(T.PALETTES.libraryWall.bg, T.PALETTES.libraryWall.accent, 2),
    kitchen: w(T.PALETTES.kitchenWall.bg, T.PALETTES.kitchenWall.accent, 2),
    bedroom: w(T.PALETTES.bedroomWall.bg, T.PALETTES.bedroomWall.accent, 1),
    child: w(T.PALETTES.childWall.bg, T.PALETTES.childWall.accent, 1),
    attic: w(T.PALETTES.atticWall.bg, T.PALETTES.atticWall.accent, 2),
    basement: w(T.PALETTES.basementWall.bg, T.PALETTES.basementWall.accent, 2),
  };

  const wallMats = {};
  for (const k of Object.keys(wallTex)) wallMats[k] = std(cloneMap(wallTex[k], 2.2, 1.6), { roughness: 0.92 });

  const M = {
    textures: { floorTex, floorTexDark, carpetTex, blueRugTex, greenRugTex, redRugTex, childRugTex },
    wall: wallMats,
    woodFloor: std(cloneMap(floorTex, 4, 4), { roughness: 0.55, metalness: 0.03 }),
    woodFloorDark: std(cloneMap(floorTexDark, 4, 4), { roughness: 0.6 }),
    woodFloorHall: std(cloneMap(floorTex, 5, 3), { roughness: 0.62 }),
    panel: std(cloneMap(panelTex, 3, 1), { roughness: 0.62 }),
    panelDark: std(cloneMap(panelDark, 3, 1), { roughness: 0.68 }),
    wood: std(cloneMap(panelTex, 1, 1), { roughness: 0.5 }),
    woodDark: std(cloneMap(panelDark, 1, 1), { roughness: 0.55 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0x8a5c37, roughness: 0.5, metalness: 0.02 }),
    woodPale: new THREE.MeshStandardMaterial({ color: 0xb08a5e, roughness: 0.58 }),
    walnut: new THREE.MeshStandardMaterial({ color: 0x4b3020, roughness: 0.48 }),
    mahogany: new THREE.MeshStandardMaterial({ color: 0x5c2b22, roughness: 0.45 }),
    stone: std(cloneMap(stoneTex, 2, 2), { roughness: 0.95 }),
    stoneFloor: std(cloneMap(stoneTex, 3, 3), { roughness: 0.9 }),
    tile: std(cloneMap(tileTex, 3, 3), { roughness: 0.6 }),
    marble: std(cloneMap(marbleTex, 1, 1), { roughness: 0.35, metalness: 0.04 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc8a25a, roughness: 0.28, metalness: 0.85 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd9b873, roughness: 0.25, metalness: 0.9 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1c2126, roughness: 0.55, metalness: 0.7 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: 0x101418, roughness: 0.45, metalness: 0.6 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x9bc7d8, transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0.1, transmission: 0, side: THREE.DoubleSide }),
    mirror: new THREE.MeshStandardMaterial({ color: 0xb8cfda, roughness: 0.15, metalness: 0.9 }),
    fabricBlue: std(fabricBlue, { roughness: 0.95 }),
    fabricGreen: std(fabricGreen, { roughness: 0.95 }),
    fabricRed: std(fabricRed, { roughness: 0.95 }),
    fabricCream: std(fabricCream, { roughness: 0.95 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xe3d9c6, roughness: 0.92 }),
    linenBlue: new THREE.MeshStandardMaterial({ color: 0x91aec1, roughness: 0.92 }),
    linenRose: new THREE.MeshStandardMaterial({ color: 0xc3a3a1, roughness: 0.92 }),
    velvetGreen: new THREE.MeshStandardMaterial({ color: 0x2d4538, roughness: 0.85 }),
    velvetRed: new THREE.MeshStandardMaterial({ color: 0x5b262c, roughness: 0.88 }),
    wax: new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.65 }),
    candleFlame: new THREE.MeshBasicMaterial({ color: 0xffd08a }),
    candleGlow: new THREE.MeshBasicMaterial({ color: 0xffb75f, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
    paper: new THREE.MeshStandardMaterial({ color: 0xdfd0ae, roughness: 0.9 }),
    bookRed: new THREE.MeshStandardMaterial({ color: 0x6c2c2c, roughness: 0.78 }),
    bookBlue: new THREE.MeshStandardMaterial({ color: 0x2c4666, roughness: 0.78 }),
    bookGreen: new THREE.MeshStandardMaterial({ color: 0x36523c, roughness: 0.78 }),
    bookGold: new THREE.MeshStandardMaterial({ color: 0x8d6b32, roughness: 0.68 }),
    bookCream: new THREE.MeshStandardMaterial({ color: 0x9a8c6c, roughness: 0.8 }),
    bookPurple: new THREE.MeshStandardMaterial({ color: 0x4c3555, roughness: 0.8 }),
    ceramic: new THREE.MeshStandardMaterial({ color: 0xd8d0bc, roughness: 0.32 }),
    ceramicBlue: new THREE.MeshStandardMaterial({ color: 0x517a8a, roughness: 0.3 }),
    copper: new THREE.MeshStandardMaterial({ color: 0x9d5b34, roughness: 0.32, metalness: 0.8 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x2f5238, roughness: 0.9, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: 0x47684a, roughness: 0.9, side: THREE.DoubleSide }),
    hedge: new THREE.MeshStandardMaterial({ color: 0x1f3a2c, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x3b2c20, roughness: 1 }),
    painted: new THREE.MeshStandardMaterial({ color: 0xb9c6c6, roughness: 0.8 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe6e1d5, roughness: 0.75 }),
    shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18, depthWrite: false }),
  };
  // glowing carpet/side table variants use same texture clones
  M.rugRed = std(cloneMap(carpetTex, 1, 1), { roughness: 1 });
  M.rugBlue = std(cloneMap(blueRugTex, 1, 1), { roughness: 1 });
  M.rugGreen = std(cloneMap(greenRugTex, 1, 1), { roughness: 1 });
  M.rugChild = std(cloneMap(childRugTex, 1, 1), { roughness: 1 });
  M.rugDeepRed = std(cloneMap(redRugTex, 1, 1), { roughness: 1 });

  return M;
}

export { cloneMap, std };
