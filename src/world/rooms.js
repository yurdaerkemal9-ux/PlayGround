import * as THREE from 'three';
import * as F from './furniture.js';
import { noteTexture, catPortrait, painting as paintingTex, stainedGlass, wispSprite, glowSprite, moonWindow } from './textures.js';

const PI = Math.PI;

function addSconce(m, x, y, z, rotY = 0) {
  const s = F.makeSconce();
  s.position.set(x, y, z);
  s.rotation.y = rotY;
  m.group.add(s);
  return s;
}

function addPainting(m, kind, x, y, z, rotY, w = 1.1, h = 1.4) {
  const p = F.makePainting(kind, w, h);
  p.position.set(x, y, z);
  p.rotation.y = rotY;
  m.group.add(p);
  return p;
}

function addWindow(m, x, y, z, rotY, w = 1.9, h = 2.8, arch = false) {
  const win = F.makeWindow(w, h, arch);
  win.position.set(x, y, z);
  win.rotation.y = rotY;
  m.group.add(win);
  return win;
}

function addGlow(m, x, y, z, color = 0x8fd8ff, scale = 0.5, opacity = 0.4) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.position.set(x, y, z);
  s.scale.setScalar(scale);
  m.group.add(s);
  return s;
}

export function buildFoyer(m) {
  const M = m.M;
  // grand staircase to the upper gallery
  m.addStairs(4.5, 7.7, 12.2, 5.0, 0, 5.0, M.woodDark, 24);
  // rugs
  m.addProp(F.makeRug(5.6, 4.6, M.rugRed), -1.4, 0, 9.4, 0);
  const stairRunner = m.addProp(F.makeRug(2.0, 7.2, M.rugDeepRed), 6.1, 0.02, 8.6, 0);
  // circular inlay beneath chandelier
  const inlay = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.85, 48), new THREE.MeshStandardMaterial({ color: 0xc7a86b, metalness: 0.7, roughness: 0.35 }));
  inlay.rotation.x = -PI / 2; inlay.position.set(-1.2, 0.015, 8.2); m.group.add(inlay);

  // chandelier + chain
  const chain = F.cyl(0.018, 0.018, 2.2, M.iron, -1.2, 8.75, 8.2, 6);
  m.group.add(chain);
  const chand = F.makeChandelier(1.35);
  chand.position.set(-1.2, 6.6, 8.2);
  m.group.add(chand);
  m.special.chandelier = chand;

  // sealed front doors
  const front = new THREE.Group();
  front.position.set(0, 0, 13.84);
  front.rotation.y = PI;
  front.add(F.box(3.45, 3.35, 0.12, M.mahogany, 0, 1.68, 0, 0.02));
  for (const s of [-1, 1]) {
    front.add(F.box(1.52, 3.1, 0.14, M.panelDark, s * 0.8, 1.56, 0.02));
    for (let i = 0; i < 3; i++) {
      front.add(F.box(1.18, 0.62, 0.04, M.woodDark, s * 0.8, 0.55 + i * 0.8, 0.1));
    }
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.15), new THREE.MeshBasicMaterial({ map: stainedGlass(), color: 0x9ecbe0, transparent: true, opacity: 0.75 }));
    glass.position.set(s * 0.8, 2.35, 0.13);
    front.add(glass);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M.brass);
    knob.position.set(s * 0.22, 1.45, 0.18); front.add(knob);
  }
  front.add(F.box(4.0, 0.28, 0.5, M.stone, 0, 0.12, 0.18));
  m.group.add(front);
  m.colliders.push({ minX: -1.85, maxX: 1.85, minZ: 13.65, maxZ: 14.2, minY: 0, maxY: 3.5 });
  m.addInteractive('front_door', 'The sealed front door', front, 0, 13.6, 1.5, 2.8, { type: 'lore', text: 'The brass is cold, and the door will not stir. Something in the house is holding it shut — or holding you here.' });

  // front windows
  addWindow(m, -5.2, 2.15, 13.92, PI, 2.4, 2.9, true);
  addWindow(m, 5.2, 2.15, 13.92, PI, 2.4, 2.9, true);
  addWindow(m, -1.8, 7.55, 13.92, PI, 2.2, 2.7, true);
  addWindow(m, 1.8, 7.55, 13.92, PI, 2.2, 2.7, true);

  // portrait memory on the west wall
  m.addBox(0.12, 1.6, 1.3, M.woodDark, -7.8, 2.3, 10.9);
  const portrait = F.makePainting(0, 0.9, 1.15);
  portrait.position.set(-7.7, 2.55, 10.9); portrait.rotation.y = PI / 2;
  m.group.add(portrait);
  const portraitCanvas = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), new THREE.MeshStandardMaterial({ map: catPortrait(), roughness: 0.7 }));
  portraitCanvas.position.set(-7.62, 2.55, 10.9); portraitCanvas.rotation.y = PI / 2;
  m.group.add(portraitCanvas);
  m.special.portrait = portraitCanvas;
  m.addInteractive('memory_portrait', 'A dust-veiled portrait', portraitCanvas, -7.5, 10.9, 2.1, 2.4, { type: 'memory', memoryId: 'foyer' });
  const bench = m.addProp(F.makeRoundTable(0.55, M.woodDark, 0.45), -7.0, 0, 10.9);
  m.special.portraitBench = bench;

  // grandfather clock
  const clock = F.makeGrandfatherClock(M.woodDark);
  clock.position.set(-7.4, 0, 5.9); clock.rotation.y = PI / 2;
  m.group.add(clock);
  m.colliders.push({ minX: -7.7, maxX: -7.0, minZ: 5.5, maxZ: 6.3, minY: 0, maxY: 2.05 });
  m.special.clock = clock;
  m.addInteractive('foyer_clock', 'The stopped grandfather clock', clock, -7.0, 5.9, 1.7, 2.0, { type: 'lore', text: 'Its hands rest at ten past three. The pendulum sways, but the hands never move. A fine layer of dust holds them still.' });

  // console table + mirror on west wall
  const consoleTable = m.addProp(F.makeTable(1.4, 0.5, M.woodDark, 0.9), -7.55, 0, 8.4, PI / 2);
  const vase = F.makeVaseFlowers(0.9); vase.position.set(-7.3, 0.95, 8.4); m.group.add(vase);
  const mirror = F.makeMirror(0.9, 1.4); mirror.position.set(-7.78, 2.4, 8.4); mirror.rotation.y = PI / 2; m.group.add(mirror);
  m.special.foyerMirror = mirror;
  m.addInteractive('foyer_mirror', 'A tarnished mirror', mirror, -7.4, 8.4, 2.0, 2.0, { type: 'lore', text: 'A small blue shape wavers in the silver. When you look closer, it is only you — ears, tail, and two mismatched eyes.' });

  // coat rack and shoes
  m.addProp(F.makeCoatRack(), 3.0, 0, 12.9, 0);
  const coat = F.makeClothesHanging(0x384352); coat.position.set(3.0, 0, 12.9); m.group.add(coat);
  const coat2 = F.makeClothesHanging(0x5b3d34); coat2.position.set(3.2, 0, 12.75); coat2.scale.setScalar(0.8); m.group.add(coat2);

  // under-stair bench and cushion
  m.addProp(F.makeChair(M.fabricRed, M.woodDark), 3.2, 0, 11.2, PI / 2);
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.35, 12), M.woodPale);
  basket.position.set(2.3, 0.18, 12.6); m.group.add(basket);

  // side table and lamp near stair bottom
  const side = m.addProp(F.makeRoundTable(0.42, M.woodDark, 0.75), 3.1, 0, 10.2);
  const lamp = F.makeTableLamp(); lamp.position.set(3.1, 0.78, 10.2); m.group.add(lamp);

  // shrine: seven candles around a small table
  const shrine = F.makeRoundTable(0.62, M.woodPale, 0.62);
  shrine.position.set(0, 0, 4.2);
  m.group.add(shrine);
  const shrineCandles = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * PI * 2;
    const c = F.makeCandle(0.16 + (i % 3) * 0.04, 1.0);
    c.position.set(Math.cos(a) * 0.4, 0.66, Math.sin(a) * 0.4);
    c.userData.flame.visible = false;
    c.userData.glow.visible = false;
    shrine.add(c);
    shrineCandles.push(c);
  }
  const centerCandle = F.makeCandle(0.26, 1.25);
  centerCandle.position.y = 0.66;
  centerCandle.userData.flame.visible = false;
  centerCandle.userData.glow.visible = false;
  shrine.add(centerCandle);
  shrineCandles.push(centerCandle);
  m.special.shrine = shrine;
  m.special.shrineCandles = shrineCandles;
  const chalk = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.05, 64), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false }));
  chalk.rotation.x = -PI / 2; chalk.position.set(0, 0.02, 4.2); m.group.add(chalk);
  m.special.shrineChalk = chalk;
  m.colliders.push({ minX: -0.7, maxX: 0.7, minZ: 3.5, maxZ: 4.9, minY: 0, maxY: 0.75 });
  m.addInteractive('shrine', 'Seven unlit candles', shrine, 0, 4.2, 0.8, 2.3, { type: 'shrine' });
  addGlow(m, 0, 1.15, 4.2, 0xffcf8a, 1.0, 0.18);

  // wall decor
  addPainting(m, 2, 6.9, 2.9, 13.88, PI, 1.2, 1.5);
  addPainting(m, 1, -7.82, 3.0, 12.7, PI / 2, 1.0, 1.3);
  addSconce(m, -7.8, 2.9, 3.8, PI / 2);
  addSconce(m, 7.8, 2.9, 3.8, -PI / 2);
  addSconce(m, -7.8, 2.9, 12.3, PI / 2);
  addSconce(m, 7.8, 2.9, 12.3, -PI / 2);

  // curtains at front windows
  for (const x of [-5.2, 5.2]) {
    const c = F.makeCurtain(1.8, 3.1, M.velvetRed, false);
    c.position.set(x, 0, 13.7); c.rotation.y = PI;
    m.group.add(c);
  }
}

export function buildLiving(m) {
  const M = m.M;
  const rug = m.addProp(F.makeRug(6.4, 5.0, M.rugBlue), -14.5, 0, 8.1, 0);
  // fireplace
  const fireplace = F.makeFireplace(2.2, 1.65);
  fireplace.position.set(-19.7, 0, 8.1); fireplace.rotation.y = PI / 2;
  m.group.add(fireplace);
  m.colliders.push({ minX: -19.9, maxX: -19.2, minZ: 6.9, maxZ: 9.3, minY: 0, maxY: 1.8 });
  m.special.fireplace = fireplace;

  // sofa faces the fire
  m.addProp(F.makeSofa(M.fabricGreen, M.woodDark), -14.2, 0, 8.1, -PI / 2);
  // armchairs
  m.addProp(F.makeArmchair(M.fabricRed, M.woodDark), -16.3, 0, 11.0, -PI * 0.75);
  m.addProp(F.makeArmchair(M.fabricBlue, M.woodDark), -16.3, 0, 5.2, -PI * 0.25);
  // coffee table
  m.addProp(F.makeTable(2.2, 1.05, M.woodDark, 0.52), -16.6, 0, 8.1);
  const tea = F.makeTeaSet(); tea.position.set(-16.8, 0.56, 8.0); m.group.add(tea);

  // grand piano
  const piano = F.makePiano(false);
  piano.position.set(-12.4, 0, 3.4); piano.rotation.y = 0.1;
  m.group.add(piano);
  m.colliders.push({ minX: -13.4, maxX: -11.4, minZ: 2.7, maxZ: 4.2, minY: 0, maxY: 1.2 });
  m.special.piano = piano;
  m.addInteractive('piano', 'The grand piano', piano, -12.4, 3.8, 1.0, 2.4, { type: 'piano' });

  // music stand with clue sheet
  const stand = new THREE.Group();
  stand.add(F.cyl(0.03, 0.04, 1.05, M.woodDark, 0, 0.52, 0, 8));
  stand.add(F.box(0.55, 0.02, 0.4, M.woodDark, 0, 1.05, 0));
  stand.add(F.box(0.5, 0.02, 0.36, M.woodDark, 0, 1.2, -0.14));
  const sheetMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), new THREE.MeshStandardMaterial({ map: noteTexture(['Moonlight,', 'a star,', 'a feather,', 'a heart.']), roughness: 0.9, side: THREE.DoubleSide }));
  sheetMesh.position.set(0, 1.28, -0.13); sheetMesh.rotation.x = -0.2; stand.add(sheetMesh);
  stand.position.set(-11.1, 0, 4.7);
  m.group.add(stand);
  m.special.pianoSheet = stand;
  m.addInteractive('piano_sheet', 'A page of handwritten music', stand, -11.1, 4.7, 1.1, 2.0, { type: 'piano_sheet' });

  // bookshelves and sideboard
  m.addProp(F.makeBookshelf(2.0, 2.7, 0.42, M.woodDark, 16), -9.1, 0, 11.4, -PI / 2);
  m.addProp(F.makeBookshelf(1.5, 2.2, 0.4, M.woodDark, 10), -9.1, 0, 7.8, -PI / 2);
  const sideboard = m.addProp(F.makeSideboard(2.1, 0.92, 0.55, M.woodDark), -18.2, 0, 12.8, PI);
  const gram = F.makeGramophone(); gram.position.set(-18.5, 0.94, 12.8); m.group.add(gram);
  m.addInteractive('gramophone', 'An old gramophone', gram, -18.5, 12.4, 1.3, 2.2, { type: 'gramophone' });

  // floor lamp
  const lamp = F.makeTableLamp(); lamp.scale.setScalar(2.1); lamp.position.set(-17.7, 0, 11.5); m.group.add(lamp);
  m.addProp(F.makeRoundTable(0.3, M.woodDark, 0.75), -17.7, 0, 11.5);

  // books stacks
  const stack = F.makeStackOfBooks(5); stack.position.set(-16.0, 0.56, 8.5); m.group.add(stack);
  const stack2 = F.makeStackOfBooks(3); stack2.position.set(-19.2, 0.02, 13.3); m.group.add(stack2);

  // windows on south and west walls
  addWindow(m, -11.4, 2.15, 13.92, PI, 2.2, 2.9, true);
  addWindow(m, -19.92, 2.15, 4.6, PI / 2, 2.3, 2.9, true);
  addWindow(m, -19.92, 2.15, 11.5, PI / 2, 2.3, 2.9, true);
  for (const x of [-11.4]) {
    const c = F.makeCurtain(2.2, 3.2, M.velvetGreen); c.position.set(x, 0, 13.68); c.rotation.y = PI; m.group.add(c);
  }

  // paintings
  addPainting(m, 0, -19.62, 3.15, 5.4, PI / 2, 1.0, 1.3);
  addPainting(m, 2, -19.62, 3.15, 10.8, PI / 2, 1.0, 1.3);
  addPainting(m, 1, -12.2, 3.05, 13.85, PI, 1.2, 1.5);
  addSconce(m, -8.2, 2.9, 9.5, -PI / 2);
  addSconce(m, -8.2, 2.9, 6.1, -PI / 2);

  // small writing nook
  const desk = m.addProp(F.makeTable(1.4, 0.7, M.woodDark, 0.78), -10.2, 0, 6.3, 0);
  const book = F.makeBooks(0.4, 2); book.position.set(-10.2, 0.82, 6.3); m.group.add(book);
  const chair = m.addProp(F.makeChair(M.fabricBlue, M.woodDark), -10.2, 0, 5.6, PI);
}

export function buildLibrary(m) {
  const M = m.M;
  m.addProp(F.makeRug(6.0, 5.4, M.rugGreen), -14.2, 0, -4.0, 0);
  // bookshelves west wall
  for (let i = 0; i < 4; i++) {
    m.addProp(F.makeBookshelf(1.7, 2.75, 0.42, M.woodDark, 15), -19.55, 0, -8.0 + i * 2.4, PI / 2);
  }
  // north wall shelves, leave secret gap x[-13.8,-10.4]
  m.addProp(F.makeBookshelf(2.4, 2.8, 0.42, M.woodDark, 18), -17.4, 0, -9.55, 0);
  m.addProp(F.makeBookshelf(2.2, 2.8, 0.42, M.woodDark, 16), -9.1, 0, -9.55, 0);

  // secret bookcase
  const secretShelf = F.makeBookshelf(2.9, 2.85, 0.45, M.woodDark, 22);
  secretShelf.position.set(-12.0, 0, -9.5);
  m.group.add(secretShelf);
  m.special.secretShelf = secretShelf;
  const secretCollider = { minX: -13.5, maxX: -10.5, minZ: -9.8, maxZ: -9.2, minY: 0, maxY: 2.9 };
  m.colliders.push(secretCollider);
  m.special.secretCollider = secretCollider;
  m.special.secretOpen = false;
  m.addInteractive('secret_shelf', 'A bookcase with a seam in the wall', secretShelf, -12.0, -8.9, 1.4, 2.4, { type: 'secret_shelf' });

  // secret alcove behind it (protrudes into garden)
  const sx1 = -13.8, sx2 = -10.2, sz1 = -12.0, sz2 = -10.0;
  m.addFloor(sx1, sz1, sx2, sz2, 0, M.woodFloorDark, 0.2, true, 'library_secret');
  m.addBox(sx2 - sx1, 2.9, 0.16, M.wall.library, (sx1 + sx2) / 2, 1.45, sz1 - 0.08);
  m.addBox(0.16, 2.9, sz2 - sz1, M.wall.library, sx1 - 0.08, 1.45, (sz1 + sz2) / 2);
  m.addBox(0.16, 2.9, sz2 - sz1, M.wall.library, sx2 + 0.08, 1.45, (sz1 + sz2) / 2);
  m.addCeiling(sx1, sz1, sx2, sz2, 2.45, M.woodDark, 0.16);
  m.colliders.push({ minX: sx1 - 0.2, maxX: sx1, minZ: sz1, maxZ: sz2, minY: 0, maxY: 2.8 });
  m.colliders.push({ minX: sx2, maxX: sx2 + 0.2, minZ: sz1, maxZ: sz2, minY: 0, maxY: 2.8 });
  m.colliders.push({ minX: sx1, maxX: sx2, minZ: sz1 - 0.2, maxZ: sz1, minY: 0, maxY: 2.8 });
  addPainting(m, 1, -12.0, 1.65, -11.8, 0, 0.8, 1.0);
  const pedestal = m.addProp(F.makeRoundTable(0.32, M.woodPale, 0.85), -12.0, 0, -11.0);
  const key = makeKeyObject(m, -12.0, 0.9, -11.0);
  m.special.atticKeyObject = key;
  m.addInteractive('attic_key_pickup', 'A small iron key', key, -12.0, -11.0, 1.1, 2.0, { type: 'key_pickup', item: 'atticKey', hidden: true });
  const alcoveCandle = F.makeCandle(0.2, 1.1); alcoveCandle.position.set(-12.9, 0.9, -11.4); m.group.add(alcoveCandle);
  m.special.alcoveLight = new THREE.PointLight(0x9fd4ff, 2.2, 5, 2);
  m.special.alcoveLight.position.set(-12, 1.7, -11); m.group.add(m.special.alcoveLight);

  // reading desk with lamp
  const desk = m.addProp(F.makeTable(2.0, 1.0, M.woodDark, 0.8), -14.3, 0, -3.4, PI / 2);
  const deskLamp = F.makeTableLamp(); deskLamp.position.set(-14.0, 0.84, -3.0); m.group.add(deskLamp);
  const openBook = new THREE.Group();
  for (const s of [-1, 1]) {
    const page = F.box(0.24, 0.02, 0.34, M.paper, s * 0.13, 0.01, 0);
    page.rotation.z = s * 0.12; openBook.add(page);
  }
  openBook.position.set(-14.4, 0.84, -3.7); openBook.rotation.y = PI / 2; m.group.add(openBook);
  m.addProp(F.makeChair(M.fabricGreen, M.woodDark), -15.7, 0, -3.4, -PI / 2);

  // armchair nook
  m.addProp(F.makeArmchair(M.fabricGreen, M.woodDark), -10.2, 0, -1.4, PI * 0.85);
  const floorLamp = F.makeTableLamp(); floorLamp.scale.setScalar(2.0); floorLamp.position.set(-9.2, 0, -2.3); m.group.add(floorLamp);
  m.addProp(F.makeRoundTable(0.3, M.woodDark, 0.75), -9.2, 0, -2.3);
  const globe = F.makeGlobe(); globe.position.set(-18.9, 0, 1.2); m.group.add(globe);
  m.colliders.push({ minX: -19.2, maxX: -18.6, minZ: 0.9, maxZ: 1.5, minY: 0, maxY: 0.8 });
  // leaning ladder
  const ladder = new THREE.Group();
  for (const s of [-1, 1]) {
    const rail = F.box(0.06, 3.2, 0.06, M.woodDark, s * 0.3, 1.6, 0);
    rail.rotation.x = -0.13; ladder.add(rail);
  }
  for (let i = 0; i < 7; i++) ladder.add(F.box(0.66, 0.05, 0.08, M.woodDark, 0, 0.35 + i * 0.42, -0.12 - i * 0.016));
  ladder.position.set(-18.4, 0, -8.2); ladder.rotation.y = 0.1; m.group.add(ladder);

  // rune books
  const moonBook = makeRuneBook(m, 0x6fb8ff, '☾', -19.25, 1.35, -6.0, PI / 2);
  const starBook = makeRuneBook(m, 0x9de0c4, '✦', -19.25, 1.85, -1.2, PI / 2);
  const featherBook = makeRuneBook(m, 0xf2c882, '❧', -16.4, 1.45, -9.2, 0);
  m.special.runeBooks = { moon: moonBook, star: starBook, feather: featherBook };
  m.addInteractive('rune_moon', 'A moon-marked book', moonBook, -18.9, -6.0, 1.35, 2.0, { type: 'rune_book', rune: 'moon' });
  m.addInteractive('rune_star', 'A star-marked book', starBook, -18.9, -1.2, 1.85, 2.0, { type: 'rune_book', rune: 'star' });
  m.addInteractive('rune_feather', 'A feather-marked book', featherBook, -16.4, -8.9, 1.45, 2.0, { type: 'rune_book', rune: 'feather' });

  // plaque clue
  const plaque = new THREE.Group();
  plaque.add(F.box(0.6, 0.34, 0.03, M.brass, 0, 0, 0));
  const plaqueText = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.3), new THREE.MeshStandardMaterial({ map: noteTexture(['“Moon greets star;', 'the feather follows.”']), roughness: 0.5 }));
  plaqueText.position.z = 0.02; plaque.add(plaqueText);
  plaque.position.set(-15.7, 2.4, -9.8); m.group.add(plaque);
  m.special.runePlaque = plaque;
  m.addInteractive('rune_plaque', 'An engraved plaque', plaque, -15.7, -9.4, 2.3, 2.0, { type: 'lore', text: '“Moon greets star; the feather follows.” Beneath the words, three small symbols are worn smooth by fingertips.' });

  // windows
  addWindow(m, -19.9, 2.15, -5.1, PI / 2, 2.1, 2.9, true);
  addWindow(m, -19.9, 2.15, 0.2, PI / 2, 2.1, 2.9, true);
  const curtain = F.makeCurtain(2.2, 3.2, M.velvetGreen); curtain.position.set(-19.65, 0, -5.1); curtain.rotation.y = PI / 2; m.group.add(curtain);

  // deco
  addPainting(m, 0, -8.25, 2.9, -7.8, -PI / 2, 1.0, 1.3);
  addSconce(m, -8.2, 2.8, -1.2, -PI / 2);
  const stack = F.makeStackOfBooks(6); stack.position.set(-17.8, 0.02, -1.4); m.group.add(stack);
}

export function buildDining(m) {
  const M = m.M;
  m.addProp(F.makeRug(7.6, 5.4, M.rugDeepRed), 14.0, 0, 8.2, 0);
  const table = F.makeDiningTable(4.4, 1.5, M.mahogany);
  table.position.set(14.0, 0, 8.2);
  m.group.add(table);
  m.colliders.push({ minX: 11.7, maxX: 16.3, minZ: 7.35, maxZ: 9.05, minY: 0, maxY: 0.9 });

  // chairs
  const chairPositions = [
    [12.0, 7.0, 0], [13.4, 7.0, 0], [14.8, 7.0, 0], [16.2, 7.0, 0],
    [12.0, 9.4, PI], [13.4, 9.4, PI], [14.8, 9.4, PI], [16.2, 9.4, PI],
    [11.3, 8.2, PI / 2], [16.7, 8.2, -PI / 2],
  ];
  for (const [x, z, r] of chairPositions) {
    m.addProp(F.makeChair(M.fabricRed, M.woodDark, true), x, 0, z, r);
  }

  // table dressing
  const runner = F.box(3.6, 0.02, 0.42, M.fabricCream, 14.0, 0.9, 8.2); m.group.add(runner);
  const centerpiece = F.makeVaseFlowers(1.2); centerpiece.position.set(14.0, 0.92, 8.2); m.group.add(centerpiece);
  for (const x of [12.3, 15.7]) {
    const food = F.makeFood(); food.position.set(x, 0.92, 8.2); m.group.add(food);
    const plate = F.cyl(0.17, 0.18, 0.015, M.ceramic, x, 0.906, 8.2, 20); m.group.add(plate);
    const glass = F.cyl(0.04, 0.03, 0.16, M.glass, x + 0.25, 0.98, 8.45, 10); m.group.add(glass);
  }
  for (let i = 0; i < 4; i++) {
    const glass = F.cyl(0.035, 0.025, 0.16, M.glass, 12.5 + i * 1.0, 0.98, 7.7, 10); m.group.add(glass);
  }
  const candelabra = F.makeCandelabra(0.65); candelabra.position.set(14.0, 0.9, 8.2); m.group.add(candelabra);

  // chandelier above
  const chand = F.makeChandelier(0.95); chand.position.set(14.0, 2.0, 8.2); m.group.add(chand);

  // sideboard with locked cabinet
  const cab = makeDiningCabinet(m);
  cab.position.set(19.3, 0, 8.2); cab.rotation.y = -PI / 2;
  m.group.add(cab);
  m.colliders.push({ minX: 18.8, maxX: 19.85, minZ: 5.8, maxZ: 10.6, minY: 0, maxY: 1.25 });
  m.special.cabinet = cab;
  m.special.cabinetDoor = cab.userData.door;
  m.special.cabinetOpen = false;
  m.addInteractive('dining_cabinet', 'A locked china cabinet', cab, 18.7, 8.2, 0.9, 2.4, { type: 'cabinet' });

  // plates on top
  for (let i = 0; i < 5; i++) {
    const plate = F.cyl(0.13, 0.13, 0.015, M.ceramic, 19.25, 1.3, 6.4 + i * 0.85, 16);
    plate.rotation.z = PI / 2; m.group.add(plate);
  }

  // serving cart
  const cart = new THREE.Group();
  const wood = M.woodDark;
  cart.add(F.box(0.9, 0.05, 0.52, wood, 0, 0.72, 0));
  cart.add(F.box(0.9, 0.05, 0.52, wood, 0, 0.42, 0));
  for (const s of [-1, 1]) {
    for (const t of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 6, 20), M.iron);
      wheel.rotation.y = PI / 2; wheel.position.set(s * 0.42, 0.14, t * 0.28); cart.add(wheel);
    }
  }
  const bottle = F.cyl(0.05, 0.07, 0.24, new THREE.MeshStandardMaterial({ color: 0x3d5d3f, roughness: 0.2, metalness: 0.1 }), 0.2, 0.86, 0); cart.add(bottle);
  cart.position.set(17.0, 0, 5.5); cart.rotation.y = 0.4;
  m.group.add(cart);
  m.colliders.push({ minX: 16.4, maxX: 17.6, minZ: 5.1, maxZ: 6.0, minY: 0, maxY: 0.85 });

  // fireplace on east wall
  const fp = F.makeFireplace(1.7, 1.5); fp.position.set(19.68, 0, 12.4); fp.rotation.y = -PI / 2;
  m.group.add(fp);
  m.colliders.push({ minX: 19.2, maxX: 19.95, minZ: 11.5, maxZ: 13.3, minY: 0, maxY: 1.6 });

  // windows and curtains
  addWindow(m, 8.08, 2.15, 11.0, PI / 2, 2.2, 2.9, true);
  addWindow(m, 19.9, 2.15, 4.2, -PI / 2, 2.2, 2.9, true);
  const cur = F.makeCurtain(2.2, 3.2, M.velvetRed); cur.position.set(8.3, 0, 11.0); cur.rotation.y = -PI / 2; m.group.add(cur);

  addPainting(m, 0, 19.7, 3.0, 4.0, -PI / 2, 1.3, 1.6);
  addPainting(m, 2, 8.25, 3.0, 5.0, PI / 2, 1.0, 1.3);
  addPainting(m, 1, 17.0, 3.2, 13.85, PI, 1.3, 1.6);
  addSconce(m, 8.25, 2.9, 7.0, PI / 2);
  addSconce(m, 8.25, 2.9, 12.3, PI / 2);
}

export function buildKitchen(m) {
  const M = m.M;
  // counters
  const counter1 = F.makeKitchenCounter(5.2, 0.92, 0.7, M.panelDark); counter1.position.set(13.0, 0, -9.55); m.group.add(counter1);
  m.colliders.push({ minX: 10.3, maxX: 15.7, minZ: -9.95, maxZ: -9.1, minY: 0, maxY: 1.0 });
  const sink = F.makeSink(1.4, 0.92, 0.7, M.panelDark); sink.position.set(17.4, 0, -9.55); m.group.add(sink);
  m.colliders.push({ minX: 16.6, maxX: 18.2, minZ: -9.95, maxZ: -9.1, minY: 0, maxY: 1.0 });
  const stove = F.makeStove(1.2, 0.95, 0.72); stove.position.set(19.3, 0, -7.9); stove.rotation.y = -PI / 2; m.group.add(stove);
  m.colliders.push({ minX: 18.8, maxX: 19.9, minZ: -8.6, maxZ: -7.2, minY: 0, maxY: 1.0 });
  const counter2 = F.makeKitchenCounter(4.0, 0.92, 0.7, M.panelDark); counter2.position.set(9.9, 0, 1.0); counter2.rotation.y = PI; m.group.add(counter2);
  m.colliders.push({ minX: 7.9, maxX: 11.9, minZ: 0.5, maxZ: 1.4, minY: 0, maxY: 1.0 });
  const fridge = F.makeFridge(0.85, 1.85, 0.68); fridge.position.set(19.4, 0, -5.7); fridge.rotation.y = -PI / 2; m.group.add(fridge);
  m.colliders.push({ minX: 18.9, maxX: 19.95, minZ: -6.5, maxZ: -4.9, minY: 0, maxY: 1.9 });

  // hanging pots
  for (let i = 0; i < 4; i++) {
    const pot = F.cyl(0.13, 0.1, 0.16, M.copper, 11.2 + i * 0.55, 2.55 - (i % 2) * 0.2, -9.3, 12);
    pot.rotation.x = PI / 2; m.group.add(pot);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 5, 12, PI), M.iron);
    handle.position.set(11.2 + i * 0.55, 2.68 - (i % 2) * 0.2, -9.3); m.group.add(handle);
  }
  // herbs
  for (let i = 0; i < 5; i++) {
    const herb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0x486b40, roughness: 0.9 }));
    herb.scale.set(1, 1.6, 1);
    herb.position.set(15.8 + i * 0.25, 2.5, -9.2); m.group.add(herb);
  }

  // central table and chairs
  const table = F.makeTable(2.2, 1.2, M.woodPale, 0.82); table.position.set(13.0, 0, -3.0); m.group.add(table);
  m.colliders.push({ minX: 11.8, maxX: 14.2, minZ: -3.7, maxZ: -2.3, minY: 0, maxY: 0.9 });
  for (const [x, z, r] of [[12.0, -4.0, 0], [14.0, -4.0, 0], [12.0, -2.0, PI], [14.0, -2.0, PI]]) {
    m.addProp(F.makeChair(M.fabricCream, M.woodPale), x, 0, z, r);
  }
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10, 0, PI * 2, 0, PI / 2), M.ceramic); bowl.position.set(13.0, 0.84, -3.0); m.group.add(bowl);
  const bread = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xb6804d, roughness: 0.9 })); bread.scale.set(1.5, 0.7, 0.8); bread.position.set(13.0, 0.92, -3.0); m.group.add(bread);

  // dresser with interactive drawer (brass key)
  const drawerUnit = makeDrawerUnit(m);
  drawerUnit.position.set(12.0, 0, 1.35); drawerUnit.rotation.y = PI;
  m.group.add(drawerUnit);
  m.colliders.push({ minX: 11.2, maxX: 12.8, minZ: 1.0, maxZ: 1.7, minY: 0, maxY: 1.0 });
  m.special.drawerUnit = drawerUnit;
  m.special.drawerOpen = false;
  m.addInteractive('kitchen_drawer', 'A stubborn kitchen drawer', drawerUnit, 12.0, 0.9, 0.7, 2.2, { type: 'drawer' });
  // the brass key, hidden inside until the drawer is opened
  const brassKeyObject = makeKeyObject(m, 12.0, 0.7, 1.02);
  brassKeyObject.visible = false;
  if (brassKeyObject.userData.glow) brassKeyObject.userData.glow.visible = false;
  m.special.brassKeyObject = brassKeyObject;

  // pantry shelf on west wall
  const pantry = F.makeBookshelf(1.8, 2.2, 0.35, M.woodDark, 6); pantry.position.set(9.2, 0, -2.6); pantry.rotation.y = PI / 2; m.group.add(pantry);
  for (let i = 0; i < 8; i++) {
    const jar = F.cyl(0.06, 0.06, 0.16, new THREE.MeshStandardMaterial({ color: [0x6a8460, 0x8c6a47, 0x6b7d8b][i % 3], roughness: 0.35 }), 9.4, 0.25 + (i % 3) * 0.46, -3.4 + Math.floor(i / 3) * 0.4, 10);
    m.group.add(jar);
  }

  // cellar stairwell railing and door
  m.addProp(F.makeStairRailing(5.9, 0.9, M.woodDark), 16.3, 0, -1.4, PI / 2);
  m.addProp(F.makeStairRailing(5.9, 0.9, M.woodDark), 19.4, 0, -1.4, PI / 2);
  m.colliders.push({ minX: 16.2, maxX: 16.5, minZ: -4.5, maxZ: 1.55, minY: 0, maxY: 2.0 });
  m.colliders.push({ minX: 19.25, maxX: 19.5, minZ: -4.5, maxZ: 1.55, minY: 0, maxY: 2.0 });
  m.colliders.push({ minX: 16.2, maxX: 19.5, minZ: -4.65, maxZ: -4.35, minY: 0, maxY: 2.0 });
  const cellarDoor = m.addDoor({ id: 'cellar', x: 16.55, z: 1.62, width: 2.7, height: 2.5, rotY: 0, hinge: 1, label: 'The cellar door', locked: true, key: 'cellarKey', lockedText: 'The cellar door is locked. A heavy iron key would fit the lock.', swing: 1 });
  m.addStairs(16.5, 19.25, 1.55, -4.4, 0, -3.6, M.woodDark, 18);
  // stone arch around stairwell
  m.addBox(0.22, 4.6, 6.2, M.stone, 16.35, 0.1, -1.4);

  // window above sink
  addWindow(m, 17.4, 2.4, -9.9, 0, 1.8, 1.9, false);
  addSconce(m, 8.25, 2.8, -1.5, PI / 2);
  // note on table
  const note = makeNoteObject(m, 13.8, 0.85, -3.2, ['The cellar key is', 'in the garden shed.']);
  m.addInteractive('kitchen_note', 'A hurried note', note, 13.8, -3.2, 0.95, 1.8, { type: 'lore', text: '“Cellar key is in the garden shed. Don\'t let the candles go out.” The handwriting wobbles, as if written in a hurry.' });
}

export function buildCorridor(m) {
  const M = m.M;
  m.addProp(F.makeRug(2.8, 10.0, M.rugDeepRed), 0, 0, -4.0, 0);
  addWindow(m, 1.2, 2.2, -9.92, 0, 2.0, 2.7, true);
  addWindow(m, -1.2, 7.6, 1.98, PI, 2.0, 2.7, true);
  // back door to garden
  const backDoor = m.addDoor({ id: 'garden_door', x: -1.4, z: -9.7, width: 2.8, height: 2.9, rotY: 0, hinge: 1, label: 'The garden door', locked: false, open: false, swing: 1 });
  m.addInteractive('garden_door_note', 'Rain beyond the glass', backDoor.panel, -1.4, -9.5, 1.6, 2.2, { type: 'lore', text: 'Rain threads the dark outside. The garden smells of wet stone and night jasmine. The door is not locked.' });

  // doors to library and kitchen
  const libDoor = m.addDoor({ id: 'library_door', x: -8, z: -4, width: 2.0, height: 2.7, rotY: PI / 2, hinge: 1, label: 'Library door', locked: false, open: true, swing: -1 });
  const kitDoor = m.addDoor({ id: 'kitchen_door', x: 8, z: -4, width: 2.0, height: 2.7, rotY: PI / 2, hinge: 1, label: 'Kitchen door', locked: false, open: true, swing: 1 });

  // console tables, paintings, sconces
  const console = m.addProp(F.makeTable(1.5, 0.45, M.woodDark, 0.9), 7.5, 0, -8.1, -PI / 2);
  const lamp = F.makeTableLamp(); lamp.position.set(7.3, 0.94, -8.1); m.group.add(lamp);
  const mirror = F.makeMirror(0.9, 1.3); mirror.position.set(7.82, 2.6, -8.1); mirror.rotation.y = -PI / 2; m.group.add(mirror);
  addPainting(m, 1, -7.82, 2.9, -8.2, PI / 2, 0.9, 1.2);
  addPainting(m, 2, -7.82, 2.9, 0.5, PI / 2, 0.8, 1.1);
  addPainting(m, 0, 7.82, 2.9, -1.4, -PI / 2, 0.9, 1.2);
  addSconce(m, -7.82, 2.8, -2.9, PI / 2);
  addSconce(m, 7.82, 2.8, -2.9, -PI / 2);
  addSconce(m, -7.82, 2.8, -7.3, PI / 2);
  addSconce(m, 7.82, 2.8, -6.0, -PI / 2);
  // umbrella stand + shoes
  const umbrella = new THREE.Group();
  umbrella.add(F.cyl(0.14, 0.18, 0.5, M.ceramic, 0, 0.25, 0, 14));
  for (let i = 0; i < 3; i++) {
    const stick = F.cyl(0.012, 0.012, 0.95, M.woodDark, Math.cos(i * 2) * 0.04, 0.6, Math.sin(i * 2) * 0.04, 5);
    stick.rotation.z = 0.15 + i * 0.06; umbrella.add(stick);
  }
  umbrella.position.set(2.4, 0, -9.2); m.group.add(umbrella);
  m.colliders.push({ minX: 2.1, maxX: 2.7, minZ: -9.5, maxZ: -8.9, minY: 0, maxY: 1.0 });
  const stack = F.makeStackOfBooks(4); stack.position.set(-2.6, 0.02, -8.6); m.group.add(stack);
}

export function buildUpperHall(m) {
  const M = m.M;
  m.addProp(F.makeRug(2.6, 12.6, M.rugDeepRed), 0, LAYOUT_FLOOR, -1.8, 0);
  // doors
  m.addDoor({ id: 'master', x: -8, z: -2, width: 2.0, height: 2.6, rotY: PI / 2, hinge: 1, label: 'The master bedroom', locked: false, open: true, swing: -1, y: 5.0 });
  m.addDoor({ id: 'nursery', x: 8, z: -2, width: 2.0, height: 2.6, rotY: PI / 2, hinge: 1, label: 'The old nursery', locked: false, open: true, swing: 1, y: 5.0 });
  m.addDoor({ id: 'childroom', x: 8, z: 6.2, width: 1.8, height: 2.6, rotY: PI / 2, hinge: 1, label: "The child's bedroom", locked: false, open: true, swing: 1, y: 5.0 });
  m.addDoor({ id: 'attic', x: -8, z: 6.2, width: 1.8, height: 2.6, rotY: PI / 2, hinge: 1, label: 'The attic door', locked: true, key: 'atticKey', lockedText: 'The attic door is locked. An old iron key might open it.', swing: -1, y: 5.0 });

  // console and decor
  const console = m.addProp(F.makeTable(1.6, 0.45, M.woodDark, 0.9), 0, 5.0, -9.2, 0);
  const lamp = F.makeTableLamp(); lamp.position.set(0, 5.94, -9.2); m.group.add(lamp);
  const mirror = F.makeMirror(1.0, 1.5); mirror.position.set(0, 7.4, -9.85); m.group.add(mirror);
  addPainting(m, 0, -7.82, 7.2, -6.8, PI / 2, 1.0, 1.3);
  addPainting(m, 1, 7.82, 7.2, -6.8, -PI / 2, 1.0, 1.3);
  addPainting(m, 2, -7.82, 7.2, 2.2, PI / 2, 1.1, 1.4);
  addPainting(m, 0, 7.82, 7.2, 2.2, -PI / 2, 1.1, 1.4);
  addSconce(m, -7.82, 7.0, -8.0, PI / 2);
  addSconce(m, 7.82, 7.0, -8.0, -PI / 2);
  addSconce(m, -7.82, 7.0, 0.0, PI / 2);
  addSconce(m, 7.82, 7.0, 0.0, -PI / 2);

  // plant and bench at gallery
  const plant = F.makePlant(1.4); plant.position.set(-6.9, 5.0, 6.1); m.group.add(plant);
  m.colliders.push({ minX: -7.4, maxX: -6.4, minZ: 5.6, maxZ: 6.6, minY: 5.0, maxY: 6.2 });
  const bench = m.addProp(F.makeChair(M.fabricBlue, M.woodDark), 6.8, 5.0, 6.1, -PI / 2);
  // high windows over foyer
  addWindow(m, -3.3, 7.6, 13.9, PI, 2.0, 2.6, true);
  addWindow(m, 3.3, 7.6, 13.9, PI, 2.0, 2.6, true);
  // runner lights
  addGlow(m, 0, 5.15, -7.5, 0xffd9a0, 1.2, 0.16);
}
const LAYOUT_FLOOR = 5.0;

export function buildMasterBedroom(m) {
  const M = m.M;
  m.addProp(F.makeRug(6.2, 4.6, M.rugRed), -14.0, 5.0, -4.0, 0);
  const bed = F.makeBed(2.0, 2.3, M.woodDark, M.linen, true);
  bed.position.set(-14.0, 5.0, -7.9); m.group.add(bed);
  m.colliders.push({ minX: -15.2, maxX: -12.8, minZ: -9.2, maxZ: -6.7, minY: 5.0, maxY: 6.0 });
  m.addProp(F.makeWardrobe(1.6, 2.35, 0.68, M.woodDark), -19.4, 5.0, -5.0, PI / 2);
  const dresser = F.makeDresser(1.7, 1.0, 0.55, M.woodDark); dresser.position.set(-11.2, 5.0, -9.3); m.group.add(dresser);
  m.colliders.push({ minX: -12.1, maxX: -10.3, minZ: -9.65, maxZ: -8.95, minY: 5.0, maxY: 6.0 });
  const mirror = F.makeMirror(1.0, 1.6); mirror.position.set(-11.2, 6.7, -9.82); m.group.add(mirror);
  // writing desk
  const desk = m.addProp(F.makeTable(1.8, 0.75, M.woodDark, 0.8), -9.8, 5.0, -5.4, PI / 2);
  const deskLamp = F.makeTableLamp(); deskLamp.position.set(-9.7, 5.84, -5.0); m.group.add(deskLamp);
  m.addProp(F.makeChair(M.fabricRed, M.woodDark), -8.8, 5.0, -5.4, -PI / 2);
  const letter = makeNoteObject(m, -10.3, 5.84, -5.9, ['My dearest Elara,', 'the house is quieter', 'without you.']);
  m.addInteractive('master_letter', 'A letter, never sent', letter, -10.3, -5.9, 5.95, 2.0, { type: 'lore', text: '“My dearest Elara, the house is quieter without you. The little cat waits by the window every evening. I think she believes you will come back before dark.” The ink has faded to brown.' });
  // armchair
  m.addProp(F.makeArmchair(M.fabricBlue, M.woodDark), -17.7, 5.0, -2.2, PI * 0.82);
  addWindow(m, -19.9, 7.35, -3.0, PI / 2, 2.1, 2.8, true);
  addWindow(m, -14.0, 7.35, -9.9, 0, 2.0, 2.6, true);
  const curtain = F.makeCurtain(2.4, 3.2, M.velvetRed); curtain.position.set(-19.65, 5.0, -3.0); curtain.rotation.y = PI / 2; m.group.add(curtain);
  const curtain2 = F.makeCurtain(2.2, 3.0, M.velvetRed); curtain2.position.set(-14.0, 5.0, -9.7); m.group.add(curtain2);
  addPainting(m, 1, -8.25, 7.2, -7.5, -PI / 2, 1.1, 1.4);
  addSconce(m, -8.2, 6.9, -8.2, -PI / 2);
  // slippers and rug details
  const slippers = new THREE.Group();
  for (const s of [-1, 1]) {
    const slip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), M.fabricCream);
    slip.scale.set(0.7, 0.45, 1.5); slip.position.set(s * 0.12, 0.06, 0); slippers.add(slip);
  }
  slippers.position.set(-16.0, 5.0, -5.8); m.group.add(slippers);
}

export function buildNursery(m) {
  const M = m.M;
  m.addProp(F.makeRug(5.6, 4.4, M.rugChild), 14.0, 5.0, -4.0, 0);
  // crib
  const crib = new THREE.Group();
  const wood = M.woodPale;
  crib.add(F.box(1.5, 0.14, 0.8, M.linenBlue, 0, 0.62, 0, 0.05));
  crib.add(F.box(1.6, 0.1, 0.9, M.woodPale, 0, 0.42, 0, 0.03));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      crib.add(F.box(0.08, 1.0, 0.08, wood, sx * 0.76, 0.5, sz * 0.42));
    }
    crib.add(F.box(0.06, 0.6, 0.86, wood, sx * 0.76, 0.85, 0));
  }
  for (let i = 0; i < 8; i++) {
    crib.add(F.box(0.035, 0.5, 0.035, wood, -0.66 + i * 0.19, 0.85, 0.42));
    crib.add(F.box(0.035, 0.5, 0.035, wood, -0.66 + i * 0.19, 0.85, -0.42));
  }
  const mobile = new THREE.Group();
  mobile.add(F.cyl(0.015, 0.015, 0.7, M.woodDark, 0, 0.35, 0, 6));
  for (let i = 0; i < 4; i++) {
    const toy = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), new THREE.MeshStandardMaterial({ color: [0xa7c0cc, 0xd6b487, 0xa98d8d, 0x89a58d][i], roughness: 0.7 }));
    toy.position.set(Math.cos(i * PI / 2) * 0.2, 0.6 - (i % 2) * 0.08, Math.sin(i * PI / 2) * 0.2); mobile.add(toy);
  }
  mobile.position.set(0, 1.05, 0); crib.add(mobile);
  crib.position.set(14.0, 5.0, -8.6); m.group.add(crib);
  m.colliders.push({ minX: 13.1, maxX: 14.9, minZ: -9.2, maxZ: -8.0, minY: 5.0, maxY: 6.1 });
  // rocking horse
  const horse = F.makeRockingHorse(); horse.position.set(17.8, 5.0, -6.6); horse.rotation.y = -0.5; m.group.add(horse);
  m.colliders.push({ minX: 17.3, maxX: 18.3, minZ: -7.2, maxZ: -6.0, minY: 5.0, maxY: 5.9 });
  // dollhouse on table
  const table = m.addProp(F.makeTable(1.7, 0.9, M.woodPale, 0.62), 17.2, 5.0, -2.6, 0);
  const dh = F.makeDollhouse(); dh.position.set(17.2, 5.66, -2.6); dh.scale.setScalar(1.15); m.group.add(dh);
  // toy shelf
  const shelf = F.makeBookshelf(2.2, 2.1, 0.36, M.woodPale, 3); shelf.position.set(19.5, 5.0, -4.0); shelf.rotation.y = -PI / 2; m.group.add(shelf);
  for (let i = 0; i < 5; i++) {
    const block = F.box(0.11, 0.11, 0.11, new THREE.MeshStandardMaterial({ color: [0x7a9baf, 0xb28b6b, 0x8ba078, 0xa1849a][i % 4], roughness: 0.7 }), 19.2, 6.0 + Math.floor(i / 3) * 0.2, -4.8 + (i % 3) * 0.3);
    m.group.add(block);
  }
  addWindow(m, 19.9, 7.35, -3.0, -PI / 2, 2.0, 2.7, true);
  const curtain = F.makeCurtain(2.2, 3.0, M.linenBlue); curtain.position.set(19.65, 5.0, -3.0); curtain.rotation.y = -PI / 2; m.group.add(curtain);
  addPainting(m, 2, 8.25, 7.2, -6.8, PI / 2, 0.9, 1.2);
  addSconce(m, 8.2, 6.9, -8.0, PI / 2);
  // little chalk stars on wall
  for (let i = 0; i < 7; i++) {
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.035, 5), new THREE.MeshBasicMaterial({ color: 0xd9c485, transparent: true, opacity: 0.5 }));
    star.position.set(8.15, 6.3 + (i % 3) * 0.35, -1.0 - Math.floor(i / 3) * 0.6); star.rotation.y = PI / 2; m.group.add(star);
  }
}

export function buildChildBedroom(m) {
  const M = m.M;
  m.addProp(F.makeRug(5.2, 4.6, M.rugChild), 14.0, 5.0, 8.0, 0);
  const bed = F.makeBed(1.4, 2.0, M.woodPale, M.linenRose, false);
  bed.position.set(17.9, 5.0, 8.6); bed.rotation.y = -PI / 2; m.group.add(bed);
  m.colliders.push({ minX: 17.0, maxX: 19.0, minZ: 7.8, maxZ: 9.4, minY: 5.0, maxY: 5.9 });
  // toy chest with music box (memory)
  const chest = makeToyChestSpecial(m);
  chest.position.set(15.6, 5.0, 11.3); chest.rotation.y = -0.2; m.group.add(chest);
  m.colliders.push({ minX: 15.0, maxX: 16.2, minZ: 10.9, maxZ: 11.7, minY: 5.0, maxY: 5.8 });
  m.special.toyChest = chest;
  m.special.toyChestOpen = false;
  m.addInteractive('toy_chest', 'A toy chest with a star on the lid', chest, 15.6, 11.1, 5.5, 2.2, { type: 'toy_chest' });
  // dollhouse
  const dh = F.makeDollhouse(); dh.position.set(10.8, 5.0, 12.7); dh.rotation.y = 0.4; m.group.add(dh);
  m.colliders.push({ minX: 10.1, maxX: 11.5, minZ: 12.0, maxZ: 13.4, minY: 5.0, maxY: 6.2 });
  // desk with drawings
  const desk = m.addProp(F.makeTable(1.6, 0.7, M.woodPale, 0.72), 10.4, 5.0, 5.4, PI / 2);
  const sketch = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.4), new THREE.MeshStandardMaterial({ map: noteTexture(['me +', 'the little cat'], 0), roughness: 0.9, side: THREE.DoubleSide }));
  sketch.rotation.x = -PI / 2; sketch.position.set(10.4, 5.73, 5.4); m.group.add(sketch);
  const chair = m.addProp(F.makeChair(M.fabricBlue, M.woodPale), 10.4, 5.0, 4.7, PI);
  // window seat + window
  const seat = m.addProp(F.makeWindowSeat(1.8), 19.3, 5.0, 11.8, -PI / 2);
  addWindow(m, 19.9, 7.35, 11.8, -PI / 2, 2.2, 2.8, true);
  const curtain = F.makeCurtain(2.4, 3.1, M.linenRose); curtain.position.set(19.65, 5.0, 11.8); curtain.rotation.y = -PI / 2; m.group.add(curtain);
  // nightstand
  const night = m.addProp(F.makeSideboard(0.7, 0.65, 0.5, M.woodPale), 16.7, 5.0, 6.8);
  const nightLamp = F.makeTableLamp(); nightLamp.scale.setScalar(0.7); nightLamp.position.set(16.7, 5.66, 6.8); m.group.add(nightLamp);
  // star decals and drawings
  for (let i = 0; i < 12; i++) {
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.025 + (i % 3) * 0.012, 5), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xd9c485 : 0x9fc1d4, transparent: true, opacity: 0.55 }));
    star.position.set(8.15, 6.4 + (i % 4) * 0.4, 6.4 + Math.floor(i / 4) * 0.8); star.rotation.y = PI / 2; m.group.add(star);
  }
  addPainting(m, 1, 8.25, 7.2, 8.7, PI / 2, 1.0, 1.2);
  addSconce(m, 8.2, 6.9, 10.0, PI / 2);
  // little cat plush
  const plush = new THREE.Group();
  const plushBody = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0x9ab6c4, roughness: 0.95 }));
  plushBody.scale.y = 0.8; plushBody.position.y = 0.12; plush.add(plushBody);
  const plushHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshStandardMaterial({ color: 0x9ab6c4, roughness: 0.95 }));
  plushHead.position.y = 0.27; plush.add(plushHead);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0x9ab6c4, roughness: 0.95 }));
    ear.position.set(s * 0.05, 0.37, 0); plush.add(ear);
  }
  plush.position.set(18.0, 5.0, 5.6); m.group.add(plush);
}

export function buildAttic(m) {
  const M = m.M;
  const floor = 5.0;
  // rough floor boards and rafters
  for (let i = 0; i < 9; i++) {
    const beam = m.addBox(0.25, 0.2, 11.6, M.woodDark, -19.0 + i * 1.35, 9.0, 7.9);
    beam.rotation.z = (i - 4) * 0.01;
  }
  for (let i = 0; i < 4; i++) {
    const rafter = m.addBox(11.6, 0.28, 0.3, M.woodDark, -14, 8.0 - i * 0.15, 3.0 + i * 3.0);
  }
  // sloped roof beams
  for (let i = 0; i < 6; i++) {
    const z = 3.2 + i * 2.1;
    const left = m.addBox(0.22, 5.0, 0.22, M.woodDark, -16.8, 7.6, z);
    left.rotation.z = 0.6;
    const right = m.addBox(0.22, 5.0, 0.22, M.woodDark, -11.2, 7.6, z);
    right.rotation.z = -0.6;
  }
  m.addProp(F.makeRug(4.2, 3.6, M.rugDeepRed), -14.0, floor, 9.0, 0);
  // skylight
  const skylight = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: moonWindow(), color: 0xb8dcff }));
  skylight.rotation.x = PI / 2; skylight.position.set(-14.0, 9.28, 8.2); m.group.add(skylight);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6.0), new THREE.MeshBasicMaterial({ color: 0x9bcdf0, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(-14.0, 7.1, 8.2); beam.rotation.x = PI / 2; beam.scale.set(1.6, 1.4, 1); m.group.add(beam);
  // old trunk memory
  const trunk = F.makeTrunk(); trunk.position.set(-14.0, floor, 9.0); trunk.rotation.y = 0.25; m.group.add(trunk);
  m.colliders.push({ minX: -14.7, maxX: -13.3, minZ: 8.4, maxZ: 9.6, minY: floor, maxY: floor + 0.85 });
  m.special.atticTrunk = trunk;
  m.addInteractive('attic_trunk', 'A trunk full of old things', trunk, -14.0, 9.2, floor + 0.6, 2.3, { type: 'attic_trunk' });
  // covered furniture
  for (const [x, z, w, d] of [[-17.6, 5.2, 1.4, 1.0], [-9.6, 12.4, 1.3, 1.2], [-18.4, 12.2, 1.8, 1.4]]) {
    const sheet = F.box(w, 1.1, d, new THREE.MeshStandardMaterial({ color: 0xc9c1ae, roughness: 1 }), x, floor + 0.55, z, 0.05);
    m.group.add(sheet);
    m.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, minY: floor, maxY: floor + 1.1 });
  }
  // boxes and old toys
  const crate = F.makeCrate(0.8); crate.position.set(-10.2, floor, 4.0); m.group.add(crate);
  m.colliders.push({ minX: -10.7, maxX: -9.7, minZ: 3.5, maxZ: 4.5, minY: floor, maxY: floor + 0.8 });
  const crate2 = F.makeCrate(0.6); crate2.position.set(-10.2, floor + 0.8, 4.0); crate2.rotation.y = 0.3; m.group.add(crate2);
  const horse = F.makeRockingHorse(); horse.position.set(-17.5, floor, 11.0); horse.rotation.y = 0.8; horse.scale.setScalar(0.9); m.group.add(horse);
  m.colliders.push({ minX: -18.2, maxX: -16.8, minZ: 10.4, maxZ: 11.6, minY: floor, maxY: floor + 0.8 });
  const dh = F.makeDollhouse(); dh.position.set(-10.8, floor, 11.8); dh.rotation.y = -0.4; dh.scale.setScalar(0.8); m.group.add(dh);
  // old mirror
  const mirror = F.makeMirror(0.9, 1.4); mirror.position.set(-19.6, floor + 2.0, 7.3); mirror.rotation.y = PI / 2; m.group.add(mirror);
  const sheet2 = F.box(1.0, 1.6, 0.1, new THREE.MeshStandardMaterial({ color: 0xbdb5a2, roughness: 1 }), -19.55, floor + 2.0, 7.3, 0.02);
  sheet2.rotation.y = PI / 2; sheet2.rotation.z = 0.1; m.group.add(sheet2);
  // window at south end
  addWindow(m, -14.0, floor + 2.4, 13.92, PI, 2.0, 2.3, true);
  // candle clusters
  for (let i = 0; i < 4; i++) {
    const c = F.makeCandle(0.2, 1.1); c.position.set(-12.2 + i * 0.4, floor + (i % 2) * 0.35, 12.6); m.group.add(c);
  }
  addGlow(m, -14.0, floor + 2.3, 8.2, 0x9cd6ff, 2.2, 0.2);
  // cobwebs
  for (let i = 0; i < 5; i++) {
    const web = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.4, 10), new THREE.MeshBasicMaterial({ color: 0xc9d8dd, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    web.position.set(-19.2, floor + 2.6, 3.8 + i * 2.0); web.rotation.y = PI / 2; m.group.add(web);
  }
}

export function buildBasement(m) {
  const M = m.M;
  const Y = -3.6;
  // floor and walls (under kitchen)
  m.addFloor(8, -10, 20, 2, Y, M.stoneFloor, 0.25, true, 'basement');
  m.addBox(12, 3.4, 0.3, M.stone, 14, Y + 1.7, -10.0);
  m.addBox(0.3, 3.4, 12, M.stone, 8.0, Y + 1.7, -4);
  m.addBox(0.3, 3.4, 12, M.stone, 20, Y + 1.7, -4);
  m.addBox(12, 3.4, 0.3, M.stone, 14, Y + 1.7, 2.0);
  m.colliders.push({ minX: 8, maxX: 20, minZ: -10.2, maxZ: -9.8, minY: Y, maxY: Y + 3.4 });
  m.colliders.push({ minX: 7.8, maxX: 8.2, minZ: -10, maxZ: 2, minY: Y, maxY: Y + 3.4 });
  m.colliders.push({ minX: 19.8, maxX: 20.2, minZ: -10, maxZ: 2, minY: Y, maxY: Y + 3.4 });
  m.colliders.push({ minX: 8, maxX: 20, minZ: 1.8, maxZ: 2.2, minY: Y, maxY: Y + 3.4 });
  // ceiling underside, leaving stairwell open
  m.addCeiling(8, -10, 16.3, 2, -0.42, M.stone, 0.18);
  m.addCeiling(16.3, -10, 19.5, -4.5, -0.42, M.stone, 0.18);
  m.addCeiling(16.3, 1.6, 19.5, 2, -0.42, M.stone, 0.18);
  // kitchen floor / basement ceiling, split around the open stairwell
  m.colliders.push({ minX: 8, maxX: 16.3, minZ: -10, maxZ: 2, minY: -0.4, maxY: 0.0 });
  m.colliders.push({ minX: 19.5, maxX: 20, minZ: -10, maxZ: 2, minY: -0.4, maxY: 0.0 });
  m.colliders.push({ minX: 16.3, maxX: 19.5, minZ: -10, maxZ: -4.5, minY: -0.4, maxY: 0.0 });
  // support columns
  for (const [x, z] of [[10.5, -6.0], [14.0, -6.0], [10.5, -1.0], [14.0, -1.0]]) {
    m.addBox(0.5, 3.1, 0.5, M.stone, x, Y + 1.55, z);
    m.colliders.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, minY: Y, maxY: Y + 3.1 });
  }
  // workbench
  const bench = m.addProp(F.makeTable(3.0, 1.0, M.woodDark, 0.9), 12.5, Y, -8.8);
  const tools = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const tool = F.cyl(0.02, 0.02, 0.4, M.woodDark, 11.4 + i * 0.5, 0.05, 0, 5);
    tool.rotation.z = PI / 2.4; tools.add(tool);
  }
  tools.position.set(12.5, Y + 0.92, -8.8); m.group.add(tools);
  // shelves, crates, wine rack
  for (let i = 0; i < 4; i++) {
    const crate = F.makeCrate(0.8 - (i % 2) * 0.15);
    crate.position.set(9.3, Y + (i > 1 ? 0.7 : 0), -8.5 + i * 1.8); crate.rotation.y = i * 0.6;
    m.group.add(crate);
    m.colliders.push({ minX: 8.8, maxX: 9.8, minZ: -9.0 + i * 1.8, maxZ: -8.0 + i * 1.8, minY: Y, maxY: Y + 1.3 });
  }
  const race = F.makeBookshelf(2.2, 2.2, 0.4, M.woodDark, 8); race.position.set(19.5, Y, -6.5); race.rotation.y = -PI / 2; m.group.add(race);
  for (let i = 0; i < 9; i++) {
    const bottle = F.cyl(0.06, 0.06, 0.26, new THREE.MeshStandardMaterial({ color: 0x2e4030, roughness: 0.25, metalness: 0.1 }), 19.2, Y + 0.3 + Math.floor(i / 4) * 0.5, -7.4 + (i % 4) * 0.45, 10);
    m.group.add(bottle);
  }
  // old boiler
  const boiler = F.cyl(0.6, 0.6, 1.9, M.iron, 17.6, Y + 0.95, 0.4, 20); m.group.add(boiler);
  m.colliders.push({ minX: 16.9, maxX: 18.3, minZ: -0.3, maxZ: 1.1, minY: Y, maxY: Y + 1.9 });
  for (let i = 0; i < 4; i++) {
    const pipe = F.cyl(0.07, 0.07, 1.0, M.copper, 17.6 + (i - 1.5) * 0.25, Y + 2.0, 0.4, 8);
    m.group.add(pipe);
  }
  // lantern
  const lantern = new THREE.Group();
  lantern.add(F.cyl(0.13, 0.16, 0.2, M.iron, 0, 0.1, 0, 8));
  const glass = F.cyl(0.12, 0.12, 0.3, new THREE.MeshBasicMaterial({ color: 0xffbd72, transparent: true, opacity: 0.5 }), 0, 0.35, 0, 10); lantern.add(glass);
  lantern.add(F.cyl(0.05, 0.08, 0.1, M.iron, 0, 0.55, 0, 8));
  lantern.position.set(10.2, Y, -3.0); m.group.add(lantern);
  m.special.lantern = lantern;
  addGlow(m, 10.2, Y + 0.4, -3.0, 0xffb46a, 1.4, 0.35);
  // old toy chest / memory spot
  const chest = F.makeTrunk(); chest.position.set(15.6, Y, -5.6); chest.rotation.y = 0.5; m.group.add(chest);
  m.colliders.push({ minX: 15.0, maxX: 16.2, minZ: -6.2, maxZ: -5.0, minY: Y, maxY: Y + 0.8 });
  m.special.basementChest = chest;
  m.addInteractive('basement_trunk', 'A small chest, hidden in the dark', chest, 15.6, -5.4, Y + 0.6, 2.3, { type: 'memory', memoryId: 'basement' });
  // hanging bulbs
  for (let i = 0; i < 2; i++) {
    const wire = F.cyl(0.008, 0.008, 0.6, M.iron, 12 + i * 4, Y + 2.8, -2, 4);
    m.group.add(wire);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc47f }));
    bulb.position.set(12 + i * 4, Y + 2.5, -2); m.group.add(bulb);
  }
  // puddles
  for (let i = 0; i < 3; i++) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(0.25 + i * 0.12, 16), new THREE.MeshStandardMaterial({ color: 0x29343c, roughness: 0.1, metalness: 0.4 }));
    puddle.rotation.x = -PI / 2; puddle.position.set(11 + i * 2.0, Y + 0.012, -1.6 - i * 1.0); m.group.add(puddle);
  }
}

// ---------- special interactive props ----------
function makeKeyObject(m, x, y, z) {
  const g = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8a25a, metalness: 0.9, roughness: 0.25 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 14), brass); ring.rotation.x = PI / 2; g.add(ring);
  const shaft = F.box(0.018, 0.012, 0.16, brass, 0, 0, 0.12); g.add(shaft);
  for (let i = 0; i < 2; i++) g.add(F.box(0.06, 0.012, 0.025, brass, 0.035, 0, 0.17 + i * 0.04));
  g.position.set(x, y, z); g.rotation.y = 0.5;
  m.group.add(g);
  const glow = addGlow(m, x, y + 0.1, z, 0xffcf80, 0.6, 0.5);
  g.userData.glow = glow;
  return g;
}

function makeRuneBook(m, color, rune, x, y, z, rotY) {
  const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x2c2438, roughness: 0.55 });
  const book = F.box(0.1, 0.38, 0.28, cover, 0, 0, 0, 0.01);
  g.add(book);
  g.add(F.box(0.105, 0.03, 0.29, new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.4 }), 0, 0.1, 0));
  const runeTex = noteTexture([rune], 0);
  const runePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.2), new THREE.MeshBasicMaterial({ color }));
  runePlane.position.set(0.055, 0, 0); runePlane.rotation.y = PI / 2;
  g.add(runePlane);
  g.position.set(x, y, z); g.rotation.y = rotY;
  m.group.add(g);
  const glow = addGlow(m, x, y, z, color, 0.55, 0.4);
  g.userData.glow = glow;
  return g;
}

function makeDiningCabinet(m) {
  const g = new THREE.Group();
  const M = m.M;
  g.add(F.box(2.9, 1.28, 0.78, M.woodDark, 0, 0.64, 0, 0.02));
  g.add(F.box(3.0, 0.08, 0.86, M.woodDark, 0, 1.3, 0));
  // glazed upper part
  g.add(F.box(2.7, 1.0, 0.6, M.woodDark, 0, 1.75, 0, 0.02));
  for (const s of [-1, 1]) {
    g.add(F.box(1.2, 0.85, 0.02, new THREE.MeshStandardMaterial({ color: 0x4b5b60, metalness: 0.4, roughness: 0.15, transparent: true, opacity: 0.55 }), s * 0.64, 1.78, 0.31));
    g.add(F.box(1.24, 0.06, 0.04, M.brass, s * 0.64, 1.35, 0.33));
    g.add(F.box(1.24, 0.06, 0.04, M.brass, s * 0.64, 2.22, 0.33));
    g.add(F.box(0.06, 0.9, 0.04, M.brass, s * 1.25, 1.78, 0.33));
  }
  // locked lower door (pivot from left)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.64, 0, 0.4);
  const door = F.box(1.25, 0.9, 0.06, M.woodDark, 0.625, 0.48, 0, 0.02);
  doorPivot.add(door);
  const escutcheon = F.box(0.08, 0.14, 0.03, M.brass, 1.15, 0.48, 0.06); doorPivot.add(escutcheon);
  g.add(doorPivot);
  g.userData.door = doorPivot;
  // shelves and china inside top
  for (let i = 0; i < 3; i++) {
    g.add(F.box(2.6, 0.03, 0.5, M.woodDark, 0, 1.4 + i * 0.3, 0.01));
    for (let j = 0; j < 5; j++) {
      const plate = F.cyl(0.1, 0.1, 0.01, M.ceramic, -1.0 + j * 0.5, 1.43 + i * 0.3, 0.12, 12);
      plate.rotation.x = PI / 2; g.add(plate);
    }
  }
  return g;
}

function makeDrawerUnit(m) {
  const g = new THREE.Group();
  const M = m.M;
  g.add(F.box(1.3, 1.0, 0.55, M.woodDark, 0, 0.5, 0, 0.02));
  g.add(F.box(1.35, 0.06, 0.6, M.woodPale, 0, 1.02, 0));
  const drawer = new THREE.Group();
  drawer.add(F.box(1.1, 0.26, 0.04, M.woodPale, 0, 0, 0.02));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), M.brass); knob.position.set(0, 0, 0.06); drawer.add(knob);
  drawer.position.set(0, 0.72, 0.3);
  g.add(drawer);
  g.userData.drawer = drawer;
  g.userData.knob = knob;
  return g;
}

function makeToyChestSpecial(m) {
  const g = F.makeToyChest();
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 0.67, -0.3);
  const lid = F.box(1.05, 0.16, 0.64, new THREE.MeshStandardMaterial({ color: 0x6a4028, roughness: 0.6 }), 0, 0.03, 0.3, 0.02);
  lidPivot.add(lid);
  // the original flat lid is replaced by the hinged one
  const originalLid = g.children.find(c => c.isMesh && Math.abs(c.position.y - 0.62) < 0.01);
  if (originalLid) originalLid.visible = false;
  g.add(lidPivot);
  g.userData.lid = lidPivot;
  const musicBox = F.makeMusicBox(); musicBox.position.set(0, 0.6, 0.05); musicBox.visible = false; g.add(musicBox);
  g.userData.musicBox = musicBox;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color: 0x9fdcff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(0, 0.9, 0); glow.scale.setScalar(0.5); glow.visible = false; g.add(glow);
  g.userData.glow = glow;
  return g;
}

function makeNoteObject(m, x, y, z, lines) {
  const g = new THREE.Group();
  const note = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshStandardMaterial({ map: noteTexture(lines), roughness: 0.9, side: THREE.DoubleSide }));
  note.rotation.x = -PI / 2.05; note.position.y = 0.01; g.add(note);
  g.position.set(x, y, z);
  m.group.add(g);
  return g;
}
