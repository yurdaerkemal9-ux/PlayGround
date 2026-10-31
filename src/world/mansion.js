import * as THREE from 'three';
import { createMaterials } from './materials.js';
import * as F from './furniture.js';
import { glowSprite, wispSprite, painting as paintingTex, noteTexture, catPortrait, stainedGlass, dustSprite, moonWindow } from './textures.js';
import { makeGarden } from './garden.js';
import {
  buildFoyer, buildLiving, buildLibrary, buildDining, buildKitchen, buildCorridor,
  buildUpperHall, buildMasterBedroom, buildNursery, buildChildBedroom, buildAttic, buildBasement,
} from './rooms.js';

export const LAYOUT = {
  ground: { minX: -20, maxX: 20, minZ: -10, maxZ: 14, height: 4.75 },
  upperY: 5.0,
  upperHeight: 4.4,
  basementY: -3.6,
  basementHeight: 3.1,
  rooms: [
    { id: 'foyer', name: 'The Grand Foyer', x1: -8, x2: 8, z1: 2, z2: 14, y: 0 },
    { id: 'living', name: 'The Living Room', x1: -20, x2: -8, z1: 2, z2: 14, y: 0 },
    { id: 'dining', name: 'The Dining Room', x1: 8, x2: 20, z1: 2, z2: 14, y: 0 },
    { id: 'library', name: 'The Library', x1: -20, x2: -8, z1: -10, z2: 2, y: 0 },
    { id: 'kitchen', name: 'The Old Kitchen', x1: 8, x2: 20, z1: -10, z2: 2, y: 0 },
    { id: 'corridor', name: 'The Long Corridor', x1: -8, x2: 8, z1: -10, z2: 2, y: 0 },
    { id: 'hall', name: 'The Upper Gallery', x1: -8, x2: 8, z1: -10, z2: 7, y: 5.0 },
    { id: 'master', name: "The Master's Bedroom", x1: -20, x2: -8, z1: -10, z2: 2, y: 5.0 },
    { id: 'nursery', name: 'The Old Nursery', x1: 8, x2: 20, z1: -10, z2: 2, y: 5.0 },
    { id: 'attic', name: 'The Attic', x1: -20, x2: -8, z1: 2, z2: 14, y: 5.0 },
    { id: 'childroom', name: "The Child's Bedroom", x1: 8, x2: 20, z1: 2, z2: 14, y: 5.0 },
    { id: 'basement', name: 'The Cellar', x1: 8, x2: 20, z1: -10, z2: 2, y: -3.6 },
    { id: 'garden', name: 'The Moonlit Garden', x1: -20, x2: 20, z1: -34, z2: -10, y: 0 },
  ],
};

export class Mansion {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'Mansion';
    scene.add(this.group);
    this.M = createMaterials();
    this.colliders = [];
    this.walkables = [];
    this.cameraBlockers = [];
    this.interactives = [];
    this.doors = new Map();
    this.lights = [];
    this.updateFns = [];
    this.special = {};
    this.roomDefs = LAYOUT.rooms;
    this.time = 0;
    this.meshes = [];

    this._buildShell();
    buildFoyer(this);
    buildLiving(this);
    buildLibrary(this);
    buildDining(this);
    buildKitchen(this);
    buildCorridor(this);
    buildUpperHall(this);
    buildMasterBedroom(this);
    buildNursery(this);
    buildChildBedroom(this);
    buildAttic(this);
    buildBasement(this);
    makeGarden(this);

    this._addDust();
    this._addAmbientLights();
  }

  // ---------- core helpers ----------
  add(mesh, parent = this.group) { parent.add(mesh); return mesh; }

  addBox(w, h, d, mat, x, y, z, parent = this.group, rounded = 0) {
    const m = F.box(w, h, d, mat, x, y, z, rounded);
    parent.add(m);
    this.meshes.push(m);
    return m;
  }

  addWall(x1, z1, x2, z2, y = 0, h = LAYOUT.ground.height, t = 0.3, mat = this.M.wall.foyer, collide = true) {
    const w = Math.abs(x2 - x1) < 0.01 ? t : Math.abs(x2 - x1);
    const d = Math.abs(z2 - z1) < 0.01 ? t : Math.abs(z2 - z1);
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const m = this.addBox(w, h, d, mat, cx, y + h / 2, cz);
    m.receiveShadow = true;
    m.castShadow = true;
    if (collide) {
      this.colliders.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, minY: y, maxY: y + h });
    }
    this.cameraBlockers.push(m);
    return m;
  }

  addFloor(x1, z1, x2, z2, y, mat, thick = 0.2, walkable = true, walkTag = '') {
    const w = x2 - x1, d = z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    const m = this.addBox(w, thick, d, mat, cx, y - thick / 2, cz);
    m.receiveShadow = true;
    this.cameraBlockers.push(m);
    if (walkable) this.walkables.push({ type: 'rect', minX: x1 + 0.02, maxX: x2 - 0.02, minZ: z1 + 0.02, maxZ: z2 - 0.02, y, tag: walkTag });
    return m;
  }

  addCeiling(x1, z1, x2, z2, y, mat, thick = 0.18) {
    const w = x2 - x1, d = z2 - z1;
    const m = this.addBox(w, thick, d, mat, (x1 + x2) / 2, y + thick / 2, (z1 + z2) / 2);
    this.cameraBlockers.push(m);
    return m;
  }

  addRamp(x1, z1, x2, z2, yAtZ1, yAtZ2) {
    this.walkables.push({ type: 'rampZ', minX: x1, maxX: x2, minZ: Math.min(z1, z2), maxZ: Math.max(z1, z2), y1: yAtZ1, y2: yAtZ2, z1, z2 });
  }

  addStairs(x1, x2, zBottom, zTop, yBottom, yTop, mat, stepCount = 22) {
    const width = x2 - x1;
    const run = zBottom - zTop;
    const rise = yTop - yBottom;
    const steps = stepCount;
    const stepRise = rise / steps;
    const stepRun = Math.abs(run) / steps;
    // stringers
    const diag = Math.hypot(run, rise);
    const angle = Math.atan2(rise, Math.abs(run));
    for (const s of [-1, 1]) {
      const stringer = this.addBox(0.14, 0.34, diag, mat, (x1 + x2) / 2 + s * (width / 2 - 0.07), yBottom + rise / 2 - 0.12, (zBottom + zTop) / 2);
      stringer.rotation.x = Math.sign(run) * angle;
    }
    for (let i = 0; i < steps; i++) {
      const t = (i + 1) / steps;
      const z = zBottom - Math.sign(run) * (i + 0.5) * stepRun;
      const y = yBottom + i * stepRise;
      const step = this.addBox(width - 0.18, stepRise + 0.02, stepRun + 0.03, i % 2 ? this.M.woodDark : mat, (x1 + x2) / 2, y + stepRise / 2, z);
      step.receiveShadow = true;
      // subtle runner
      if (i % 2 === 0) {
        const runner = this.addBox(width * 0.62, 0.012, stepRun * 0.9, this.M.velvetRed, (x1 + x2) / 2, y + stepRise + 0.008, z);
        runner.receiveShadow = true;
      }
    }
    // optional landing edge
    const edge = this.addBox(width + 0.1, 0.08, 0.18, mat, (x1 + x2) / 2, yTop - 0.02, zTop);
    this.addRamp(x1 + 0.08, zBottom, x2 - 0.08, zTop, yBottom, yTop);
    return edge;
  }

  addProp(builder, x, y, z, rotY = 0, opts = {}) {
    const g = builder;
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    this.group.add(g);
    if (opts.collide !== false && g.userData.collider) {
      const c = g.userData.collider;
      // axis-aligned bound after rotation (works for 90-degree rotations)
      const rot = Math.round(rotY / (Math.PI / 2)) % 2;
      const w = rot ? c.d : c.w;
      const d = rot ? c.w : c.d;
      this.colliders.push({ minX: x - w / 2 - (c.ox || 0), maxX: x + w / 2 + (c.ox || 0), minZ: z - d / 2 - (c.oz || 0), maxZ: z + d / 2 + (c.oz || 0), minY: y, maxY: y + c.h });
    }
    g.traverse(o => { if (o.isMesh) this.meshes.push(o); });
    return g;
  }

  addRoomFloor(x1, z1, x2, z2, y, mat, tag) {
    this.addFloor(x1, z1, x2, z2, y, mat, 0.22, true, tag);
    return this;
  }

  addInteractive(id, label, object, x, z, y = 0, radius = 2.2, data = {}) {
    const rec = { id, label, object, x, z, y, radius, ...data };
    this.interactives.push(rec);
    if (object) object.userData.interactionId = id;
    return rec;
  }

  removeInteractive(id) {
    const idx = this.interactives.findIndex(i => i.id === id);
    if (idx >= 0) this.interactives.splice(idx, 1);
  }

  // ---------- doors ----------
  addDoorFrame(x, z, width, height, rotY, mat, y = 0) {
    const frame = new THREE.Group();
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    frame.add(F.box(width + 0.24, 0.18, 0.22, mat, 0, height + 0.09, 0));
    for (const s of [-1, 1]) frame.add(F.box(0.16, height + 0.18, 0.22, mat, s * (width / 2 + 0.04), (height + 0.18) / 2, 0));
    this.group.add(frame);
    return frame;
  }

  addDoor({ id, x, z, width = 2.0, height = 2.7, rotY = 0, label = 'Door', locked = false, key = null, lockedText = 'It is locked.', open = false, swing = 1, mat, hinge = -1, y = 0, wallThick = 0.3 }) {
    if (!mat) mat = this.M.panelDark;
    const fx = x + Math.cos(rotY) * hinge * width / 2;
    const fz = z - Math.sin(rotY) * hinge * width / 2;
    this.addDoorFrame(fx, fz, width, height, rotY, this.M.woodDark, y);
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    pivot.rotation.y = rotY;
    const panel = new THREE.Group();
    // panel extends from hinge to +width on local X; hinge = -1 means pivot at left edge
    const dir = hinge;
    // decorative paneled door
    const doorMesh = F.box(width, height, 0.11, mat, dir * width / 2, height / 2, 0, 0.01);
    panel.add(doorMesh);
    for (let i = 0; i < 3; i++) {
      panel.add(F.box(width * 0.36, height * 0.2, 0.03, this.M.woodDark, dir * (width * 0.27 + (i % 2) * width * 0.2), height * (0.22 + i * 0.27), 0.065));
      panel.add(F.box(width * 0.36, height * 0.2, 0.03, this.M.woodDark, dir * (width * 0.73 - (i % 2) * width * 0.2), height * (0.22 + i * 0.27), 0.065));
    }
    // knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), this.M.brass);
    knob.position.set(dir * (width - 0.18), height * 0.46, 0.12);
    panel.add(knob);
    const escutcheon = F.box(0.06, 0.12, 0.02, this.M.brass, dir * (width - 0.18), height * 0.42, 0.115);
    panel.add(escutcheon);
    pivot.add(panel);
    pivot.userData.isDoor = true;
    pivot.userData.doorId = id;
    this.group.add(pivot);
    pivot.traverse(o => { if (o.isMesh) this.meshes.push(o); });

    const ex = x + Math.cos(rotY) * width * hinge;
    const ez = z - Math.sin(rotY) * width * hinge;
    const c = {
      minX: Math.min(x, ex) - 0.14, maxX: Math.max(x, ex) + 0.14,
      minZ: Math.min(z, ez) - 0.14, maxZ: Math.max(z, ez) + 0.14,
      minY: y, maxY: y + height + 0.2,
    };
    this.colliders.push(c);

    const door = {
      id, pivot, panel, width, height, rotY, label, locked, key, lockedText,
      open: false, target: 0, current: 0, swing, hinge, collider: c, x, z, y,
      doorMesh,
    };
    pivot.rotation.y = rotY;
    this.doors.set(id, door);
    const openRot = rotY + swing * hinge * -1 * Math.PI * 0.52;
    door.openRot = rotY + swing * Math.PI * 0.54 * hinge;
    if (open) this.setDoorOpen(id, true, true);
    this.addInteractive(`door_${id}`, label, pivot, x, z, y + 1, Math.max(2.2, width * 1.1), { type: 'door', doorId: id });
    return door;
  }

  setDoorOpen(id, state, instant = false) {
    const d = this.doors.get(id);
    if (!d) return;
    d.open = state;
    d.target = state ? d.openRot : d.rotY;
    if (instant) {
      d.current = d.target;
      d.pivot.rotation.y = d.target;
      d.collider.minY = state ? 999 : d.y;
      d.collider.maxY = state ? 999.1 : d.y + d.height + 0.2;
    } else {
      d.collider.minY = state ? 999 : d.y;
      d.collider.maxY = state ? 999.1 : d.y + d.height + 0.2;
    }
    const int = this.interactives.find(i => i.id === `door_${id}`);
    if (int) int.label = state ? 'Close door' : (d.locked ? 'Try the door' : 'Open door');
  }

  // ---------- shell ----------
  _buildShell() {
    const M = this.M;
    const G = LAYOUT.ground;
    // ground floors
    this.addRoomFloor(-8, 2, 8, 14, 0, M.woodFloor, 'foyer');
    this.addRoomFloor(-20, 2, -8, 14, 0, M.woodFloor, 'living');
    this.addRoomFloor(8, 2, 20, 14, 0, M.woodFloor, 'dining');
    this.addRoomFloor(-20, -10, -8, 2, 0, M.woodFloorDark, 'library');
    // kitchen floor is split around the cellar stairwell opening x[16.4,19.3], z[-4.4,1.65]
    this.addRoomFloor(8, -10, 16.4, 2, 0, M.tile, 'kitchen');
    this.addRoomFloor(9.8, -4.4, 16.4, 1.65, 0, M.tile, 'kitchen');
    this.addRoomFloor(19.3, -4.4, 20, 1.65, 0, M.tile, 'kitchen');
    this.addRoomFloor(8, -4.4, 9.8, 1.65, 0, M.tile, 'kitchen');
    this.addRoomFloor(16.4, 1.5, 19.3, 2, 0, M.tile, 'kitchen');
    this.addRoomFloor(16.4, -10, 19.3, -4.4, 0, M.tile, 'kitchen');
    this.addRoomFloor(-8, -10, 8, 2, 0, M.woodFloorHall, 'corridor');

    // outer walls ground
    this.addWall(-20, 14.15, -1.7, 14.15, 0, 4.75, 0.3, M.stone);
    this.addWall(1.7, 14.15, 20, 14.15, 0, 4.75, 0.3, M.stone);
    this.addWall(-20, 14, -1.7, 14, 0, 3.7, 0.3, M.stone, false); // inner facade above door handled below
    // front door header
    this.addBox(3.4, 1.1, 0.32, M.stone, 0, 4.2, 14.15);
    this.addWall(-20, -10.15, -1.7, -10.15, 0, 4.75, 0.3, M.stone);
    this.addWall(1.7, -10.15, 20, -10.15, 0, 4.75, 0.3, M.stone);
    this.addBox(3.4, 1.1, 0.32, M.stone, 0, 4.2, -10.15);
    this.addWall(-20.15, -10, -20.15, 14, 0, 4.75, 0.3, M.stone);
    this.addWall(20.15, -10, 20.15, 14, 0, 4.75, 0.3, M.stone);

    // interior wall foyer/living with arch
    this.addWall(-8, 2, -8, 3.1, 0, 4.75, 0.3, M.wall.foyer);
    this.addWall(-8, 5.1, -8, 14, 0, 4.75, 0.3, M.wall.foyer);
    this.addBox(0.3, 1.65, 2.0, M.wall.foyer, -8, 3.925, 4.1);
    this._addArchTrim(-8, 4.1, 2.4, 3.1, 'z', 0);
    // foyer/dining with arch
    this.addWall(8, 2, 8, 3.1, 0, 4.75, 0.3, M.wall.foyer);
    this.addWall(8, 5.1, 8, 14, 0, 4.75, 0.3, M.wall.foyer);
    this.addBox(0.3, 1.65, 2.0, M.wall.foyer, 8, 3.925, 4.1);
    this._addArchTrim(8, 4.1, 2.4, 3.1, 'z', 0);
    // foyer/corridor wide opening
    this.addWall(-8, 2, -2.6, 2, 0, 4.75, 0.3, M.wall.foyer);
    this.addWall(2.6, 2, 8, 2, 0, 4.75, 0.3, M.wall.foyer);
    this.addBox(5.2, 1.7, 0.3, M.wall.foyer, 0, 3.9, 2);
    this._addArchTrim(0, 2, 5.2, 3.05, 'x', 0);
    // corridor/library wall with door gap z[-6,-4]
    this.addWall(-8, -10, -8, -6, 0, 4.75, 0.3, M.wall.library);
    this.addWall(-8, -4, -8, 2, 0, 4.75, 0.3, M.wall.library);
    this.addBox(0.3, 1.75, 2.0, M.wall.library, -8, 3.875, -5);
    // corridor/kitchen wall with door gap z[-6,-4]
    this.addWall(8, -10, 8, -6, 0, 4.75, 0.3, M.wall.kitchen);
    this.addWall(8, -4, 8, 2, 0, 4.75, 0.3, M.wall.kitchen);
    this.addBox(0.3, 1.75, 2.0, M.wall.kitchen, 8, 3.875, -5);
    // living/library divider
    this.addWall(-20, 2, -8, 2, 0, 4.75, 0.3, M.wall.library);
    // dining/kitchen divider, with the cellar stair opening at x[16.5,19.3]
    this.addWall(8, 2, 16.5, 2, 0, 4.75, 0.3, M.wall.kitchen);
    this.addWall(19.3, 2, 20, 2, 0, 4.75, 0.3, M.wall.kitchen);
    this.addWall(16.5, 2, 19.3, 2, 2.5, 2.25, 0.3, M.wall.kitchen, false);

    // skirting boards
    for (const [x1, z1, x2, z2, mat] of [
      [-7.85, 2, -7.85, 14, M.woodDark], [7.85, 2, 7.85, 14, M.woodDark],
      [-20, 2.15, -8, 2.15, M.woodDark], [8, 2.15, 20, 2.15, M.woodDark],
      [-19.85, 2, -19.85, 14, M.woodDark], [19.85, 2, 19.85, 14, M.woodDark],
      [-20, 13.85, 20, 13.85, M.woodDark],
      [-7.85, -10, -7.85, 2, M.woodDark], [7.85, -10, 7.85, 2, M.woodDark],
      [-20, -9.85, 20, -9.85, M.woodDark],
    ]) { /* walls already have trim; skip dense meshes */ }

    // cornices foyer
    this.addBox(16, 0.18, 0.16, this.M.panel, 0, 4.62, 2.1);
    this.addBox(16, 0.18, 0.16, this.M.panel, 0, 4.62, 13.9);

    // upper floors (slabs)
    const U = LAYOUT.upperY;
    // library / kitchen / master / nursery floor slabs above ground rooms
    this.addFloor(-20, 2, -8, 14, U, M.woodFloorHall, 0.25, true, 'attic');
    this.addFloor(8, 2, 20, 14, U, M.woodFloorHall, 0.25, true, 'childroom');
    this.addFloor(-20, -10, -8, 2, U, M.woodFloorHall, 0.25, true, 'master');
    this.addFloor(8, -10, 20, 2, U, M.woodFloorHall, 0.25, true, 'nursery');
    // upper hall floor with stair opening x[4.4,7.8], z[5.0,7.0]
    this.addFloor(-8, -10, 4.4, 7, U, M.woodFloorHall, 0.25, true, 'hall');
    this.addFloor(4.4, -10, 7.8, 5.0, U, M.woodFloorHall, 0.25, true, 'hall');
    this.addFloor(7.8, -10, 8, 7, U, M.woodFloorHall, 0.25, true, 'hall');

    // upper outer walls
    this.addWall(-20, 14.15, 20, 14.15, U, LAYOUT.upperHeight, 0.3, M.stone);
    this.addWall(-20, -10.15, 20, -10.15, U, LAYOUT.upperHeight, 0.3, M.stone);
    this.addWall(-20.15, -10, -20.15, 14, U, LAYOUT.upperHeight, 0.3, M.stone);
    this.addWall(20.15, -10, 20.15, 14, U, LAYOUT.upperHeight, 0.3, M.stone);

    // upper hall walls and doors. x=-8: master door z[-4,-2], attic door z[4.4,6.2]
    this.addWall(-8, -10, -8, -4, U, 4.4, 0.3, M.wall.bedroom);
    this.addWall(-8, -2, -8, 4.4, U, 4.4, 0.3, M.wall.bedroom);
    this.addWall(-8, 6.2, -8, 7, U, 4.4, 0.3, M.wall.bedroom);
    this.addBox(0.3, 1.9, 2.0, M.wall.bedroom, -8, 8.05, -3);
    this.addBox(0.3, 1.9, 1.8, M.wall.bedroom, -8, 8.45, 5.3);
    this.addWall(8, -10, 8, -4, U, 4.4, 0.3, M.wall.child);
    this.addWall(8, -2, 8, 4.4, U, 4.4, 0.3, M.wall.child);
    this.addWall(8, 6.2, 8, 7, U, 4.4, 0.3, M.wall.child);
    this.addBox(0.3, 1.9, 2.0, M.wall.child, 8, 8.05, -3);
    this.addBox(0.3, 1.9, 1.8, M.wall.child, 8, 8.45, 5.3);
    // partitions bedroom/attic etc.
    this.addWall(-20, 2, -8, 2, U, 4.4, 0.3, M.wall.attic);
    this.addWall(8, 2, 20, 2, U, 4.4, 0.3, M.wall.child);

    // upper ceiling
    this.addCeiling(-20, -10, 20, 14, U + LAYOUT.upperHeight, M.panelDark, 0.2);
    // foyer high ceiling
    this.addCeiling(-8, 7, 8, 14, U + LAYOUT.upperHeight, M.panelDark, 0.2);

    // upper gallery railing at z=7 (except stair opening)
    const rail = F.makeStairRailing(12.4, 0.95, M.woodDark);
    rail.position.set(-1.8, U, 7);
    this.group.add(rail);
    const rail2 = F.makeStairRailing(0.2, 0.95, M.woodDark);
    rail2.position.set(4.4, U, 6.0); rail2.rotation.y = Math.PI / 2;
    this.group.add(rail2);
    // short guard along the east edge of the stairwell, beside the child's door
    const rail3 = F.makeStairRailing(1.8, 0.95, M.woodDark);
    rail3.position.set(7.79, U, 6.1); rail3.rotation.y = Math.PI / 2;
    this.group.add(rail3);
    // railing down stairs west side
    this._stairRail();

    // balustrade colliders (rough)
    this.colliders.push({ minX: -8, maxX: 4.4, minZ: 6.85, maxZ: 7.15, minY: U, maxY: U + 1.2 });
    this.colliders.push({ minX: 4.25, maxX: 4.55, minZ: 5.0, maxZ: 7.0, minY: U, maxY: U + 1.2 });
    this.colliders.push({ minX: 7.68, maxX: 7.9, minZ: 5.2, maxZ: 7.0, minY: U, maxY: U + 1.2 });

    // external porch steps and columns at front
    this.addBox(11, 0.2, 3, M.stone, 0, -0.06, 15.6);
    this.addBox(9, 0.2, 2, M.stone, 0, -0.26, 17);
    for (const s of [-1, 1]) {
      this.addBox(0.55, 4.4, 0.55, M.stone, s * 3.2, 2.2, 15.4);
      this.addBox(0.8, 0.25, 0.8, M.stone, s * 3.2, 4.5, 15.4);
    }
    this.addBox(8.2, 0.5, 3.0, M.stone, 0, 4.9, 15.6);
    this.addBox(8.6, 0.25, 0.5, M.stone, 0, 4.6, 16.9);

    // roof silhouette
    this.addBox(41.5, 0.6, 25, M.panelDark, 0, U + LAYOUT.upperHeight + 0.3, 2);
    for (let i = 0; i < 6; i++) {
      const beam = this.addBox(0.3, 0.4, 26, M.woodDark, -18 + i * 7.2, U + LAYOUT.upperHeight + 0.7, 2);
    }
  }

  _addArchTrim(x, z, width, height, axis, y) {
    const t = this.M.woodDark;
    if (axis === 'x') {
      this.addBox(width, 0.16, 0.34, t, x, height, z);
      for (const s of [-1, 1]) this.addBox(0.16, height, 0.34, t, x + s * width / 2, height / 2, z);
    } else {
      this.addBox(0.34, 0.16, width, t, x, height, z);
      for (const s of [-1, 1]) this.addBox(0.34, height, 0.16, t, x, height / 2, z + s * width / 2);
    }
  }

  _stairRail() {
    const M = this.M;
    const x = 4.4;
    const z0 = 12.2, z1 = 5.1, y0 = 0, y1 = 5.0;
    const len = Math.hypot(z0 - z1, y1 - y0);
    const group = new THREE.Group();
    const rail = F.box(0.12, 0.12, len, M.woodDark, 0, 0, 0);
    const balusters = F.makeStairRailing(0.01, 0.9);
    // simple diagonal handrail
    const angle = Math.atan2(y1 - y0, z0 - z1);
    rail.rotation.x = -angle;
    rail.position.set(x, (y0 + y1) / 2 + 0.5, (z0 + z1) / 2);
    this.group.add(rail);
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const z = z0 + (z1 - z0) * t;
      const y = y0 + (y1 - y0) * t;
      this.addBox(0.09, 0.9, 0.09, M.woodDark, x, y + 0.45, z);
    }
    const newel = F.box(0.25, 1.3, 0.25, M.woodDark, 0, 0, 0);
    newel.position.set(x, 0.65, z0 + 0.05); this.group.add(newel);
  }

  // ---------- rooms ----------
  _addDust() {
    const count = 420;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -19 + Math.random() * 38;
      pos[i * 3 + 1] = Math.random() * 8.8;
      pos[i * 3 + 2] = -9 + Math.random() * 22.5;
      seed[i] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.PointsMaterial({ size: 0.045, map: dustSprite(), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe6b8 });
    const pts = new THREE.Points(geo, mat);
    pts.name = 'DustMotes';
    this.group.add(pts);
    this.dust = pts;
    this.dustData = { pos, seed, count };
  }

  _addAmbientLights() {
    const hemi = new THREE.HemisphereLight(0x6f9cc0, 0x3a2a1c, 0.92);
    this.scene.add(hemi);
    const moon = new THREE.DirectionalLight(0xa8cff0, 1.6);
    moon.position.set(-18, 26, -30);
    moon.target.position.set(0, 0, 0);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -32; moon.shadow.camera.right = 32;
    moon.shadow.camera.top = 32; moon.shadow.camera.bottom = -32;
    moon.shadow.camera.near = 1; moon.shadow.camera.far = 70;
    moon.shadow.bias = -0.001;
    this.scene.add(moon);
    this.scene.add(moon.target);
    this.moon = moon;

    const ambient = new THREE.AmbientLight(0x33475c, 0.72);
    this.scene.add(ambient);

    // point lights by room
    const addLight = (x, y, z, color, intensity, distance, name) => {
      const strength = intensity * 2.35;
      const l = new THREE.PointLight(color, strength, distance, 2);
      l.position.set(x, y, z);
      this.scene.add(l);
      this.lights.push({ light: l, base: strength, phase: Math.random() * 6, name });
      return l;
    };
    this.foyerLight = addLight(0, 8.1, 8, 0xffc37a, 42, 19, 'foyer');
    this.livingLight = addLight(-14, 3.9, 8.2, 0xffb169, 26, 14, 'living');
    this.fireLight = addLight(-19.2, 1.3, 8, 0xff8a3d, 18, 8, 'fire');
    this.diningLight = addLight(14, 3.9, 8.4, 0xffc07a, 26, 14, 'dining');
    this.libraryLight = addLight(-14, 3.1, -3.4, 0xffb875, 18, 11, 'library');
    this.kitchenLight = addLight(13.5, 3.5, -3.2, 0xffd09a, 20, 12, 'kitchen');
    this.corridorLight = addLight(0, 3.2, -3.5, 0xffb76f, 15, 11, 'corridor');
    this.hallLight = addLight(0, 8.0, -2, 0xffc585, 22, 13, 'hall');
    this.masterLight = addLight(-14, 7.3, -4, 0xffb877, 16, 11, 'master');
    this.childLight = addLight(14, 7.3, 7.5, 0xffc98c, 16, 11, 'child');
    this.atticLight = addLight(-14, 7.2, 9, 0xb9d8ff, 18, 13, 'attic');
    this.basementLight = addLight(14, -1.2, -3.5, 0xffa858, 14, 10, 'basement');
    this.gardenLight = addLight(0, 3.0, -20, 0xa8d6ff, 18, 22, 'garden');
    this.shedLight = addLight(14, 1.9, -15, 0xffb46a, 9, 7, 'shed');
  }

  // flicker / animations
  update(dt, elapsed) {
    this.time += dt;
    for (const d of this.doors.values()) {
      if (Math.abs(d.current - d.target) > 0.001) {
        const speed = 2.8;
        d.current += (d.target - d.current) * Math.min(1, dt * speed);
        if (Math.abs(d.current - d.target) < 0.002) d.current = d.target;
        d.pivot.rotation.y = d.current;
      }
    }
    if (this.dust) {
      const { pos, seed, count } = this.dustData;
      for (let i = 0; i < count; i++) {
        pos[i * 3] += Math.sin(elapsed * 0.16 + seed[i]) * 0.0016;
        pos[i * 3 + 1] += Math.sin(elapsed * 0.23 + seed[i] * 2) * 0.0014;
        pos[i * 3 + 2] += Math.cos(elapsed * 0.12 + seed[i]) * 0.0012;
        if (pos[i * 3 + 1] < 0.1) pos[i * 3 + 1] = 8.7;
        if (pos[i * 3 + 1] > 8.9) pos[i * 3 + 1] = 0.2;
      }
      this.dust.geometry.attributes.position.needsUpdate = true;
    }
    for (const l of this.lights) {
      l.light.intensity = l.base * (0.94 + Math.sin(elapsed * 2.1 + l.phase) * 0.035 + Math.sin(elapsed * 7.3 + l.phase) * 0.018);
    }
    if (this.special.fireplace?.userData.fire) {
      const f = this.special.fireplace.userData.fire;
      f.scale.setScalar(0.9 + Math.sin(elapsed * 9) * 0.08);
      if (this.special.fireplace.userData.fireGlow) this.special.fireplace.userData.fireGlow.material.opacity = 0.55 + Math.sin(elapsed * 11) * 0.12;
    }
    if (this.special.clock?.userData.pendulum) {
      this.special.clock.userData.pendulum.rotation.z = Math.sin(elapsed * 1.6) * 0.18;
    }
    this.updateFns.forEach(fn => fn(dt, elapsed));
  }
}
