import * as THREE from 'three';
import { Mansion, LAYOUT } from '../world/mansion.js';
import { GhostCat } from '../character/cat.js';
import { Player } from '../core/player.js';
import { Input } from '../core/input.js';
import { ThirdPersonCamera } from '../core/camera.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';
import { MEMORIES, MEMORY_BY_ID, ITEMS, LORE } from './story.js';
import { wispSprite, glowSprite } from '../world/textures.js';
import {
  loadSettings, storeSettings, hasSave, readSave, writeSave, clearSave, formatTime,
} from './save.js';

const SPAWN = { x: -2.5, y: 0, z: 10.5, yaw: Math.PI };
const PIANO_KEYS = [
  { value: 'moon', symbol: '☾', label: 'Moonlight' },
  { value: 'star', symbol: '✦', label: 'A star' },
  { value: 'feather', symbol: '❧', label: 'A feather' },
  { value: 'heart', symbol: '♥', label: 'A heart' },
];
const PIANO_SEQUENCE = ['moon', 'star', 'feather', 'heart'];
const LIBRARY_SEQUENCE = ['moon', 'star', 'feather'];

export class Game {
  constructor({ scene, camera, renderer, composer, bloomPass, canvas }) {
    this.scene = scene;
    this.viewCamera = camera;
    this.renderer = renderer;
    this.composer = composer;
    this.bloomPass = bloomPass;
    this.canvas = canvas;

    this.settings = loadSettings();
    this.audio = new AudioEngine(this.settings);
    this.mansion = new Mansion(scene);
    for (const [, d] of this.mansion.doors) d.initialLocked = d.locked;

    this.cat = new GhostCat();
    this.cat.position.set(SPAWN.x, SPAWN.y, SPAWN.z);
    this.cat.rotation.y = SPAWN.yaw;
    scene.add(this.cat);

    this.player = new Player(this.cat, this.mansion.colliders, this.mansion.walkables, SPAWN);
    this.player.setSpawn(SPAWN);
    this.controls = new ThirdPersonCamera(camera, this.mansion.cameraBlockers, this.mansion.colliders);
    this.camera = this.controls;
    this.controls.yaw = 0;
    this.controls.pitch = 0.29;
    this.controls.targetDistance = this.settings.cameraDistance;
    this.controls.distance = this.settings.cameraDistance;
    this.controls.freeze = true;

    this.input = new Input(canvas);
    this.input.sensitivity = this.settings.sensitivity;

    this.mode = 'title';
    this.overlay = null;
    this.elapsed = 0;
    this.attractTime = 0;
    this.wisps = new Map();
    this.dynamicInteractives = new Set();
    this.disabledInteractives = new Set();
    this.pianoProgress = [];
    this.libraryProgress = [];
    this.currentInteraction = null;
    this.ending = null;
    this.settingsOrigin = 'pause';
    this.lastRoom = null;
    this.wasMoving = false;
    this.lookTarget = null;
    this._clockShown = false;
    this.focusVec = new THREE.Vector3();
    this.tmpVec = new THREE.Vector3();

    this.ui = new UI(this);

    this.state = this._freshState();
    this._resetRun(false);
    this.mode = 'title';

    this.player.stepCallback = (p) => {
      const y = p.position.y;
      const surface = y < -0.5 ? 'stone' : y > 4.5 ? 'wood' : (this.state.room === 'kitchen' || this.state.room === 'basement' ? 'stone' : 'wood');
      this.audio.step(surface, p.speed > 2.8);
    };
    this.player.landCallback = () => {
      this.audio.land();
      this.controls.applyShake(0.18);
    };

    this._setupTitleCamera();
    this.ui.showTitle(hasSave());
    this.ui.fadeIn(1.4);
    this.ui.setMemoryCount(0);
    this._updateShrine();
  }

  // ---------------------------------------------------------------- state
  _freshState() {
    return {
      memories: new Set(),
      items: new Set(),
      visited: new Set(),
      flags: {
        pianoSolved: false,
        secretOpen: false,
        cabinetOpen: false,
        drawerOpen: false,
        toyChestOpen: false,
        cellarUnlocked: false,
        atticUnlocked: false,
        completed: false,
      },
      time: 0,
      room: 'foyer',
    };
  }

  _resetRun(clear = true) {
    if (clear) clearSave();
    this._clearWisps();
    this._removeDynamicInteractives();
    this.disabledInteractives.clear();
    this.state = this._freshState();
    this.pianoProgress = [];
    this.libraryProgress = [];
    this.currentInteraction = null;
    this.overlay = null;
    this.mode = 'intro';
    this._resetWorldObjects();
    for (const [id, d] of this.mansion.doors) {
      d.locked = d.initialLocked;
      this.mansion.setDoorOpen(id, false, true);
    }
    this.player.teleport(SPAWN.x, SPAWN.y, SPAWN.z, SPAWN.yaw);
    this.player.setSpawn(SPAWN);
    this.ui.setMemoryCount(0);
    this._updateShrine();
    this._updateObjective();
    this._refreshInteractives();
    this.lastRoom = 'foyer';
  }

  _resetWorldObjects() {
    const sp = this.mansion.special;
    if (sp.cabinetDoor) sp.cabinetDoor.rotation.y = 0;
    if (sp.drawerUnit) sp.drawerUnit.userData.drawer.position.z = 0.3;
    if (sp.toyChest) {
      if (sp.toyChest.userData.lid) sp.toyChest.userData.lid.rotation.x = 0;
      if (sp.toyChest.userData.musicBox) sp.toyChest.userData.musicBox.visible = false;
    }
    if (sp.secretShelf) sp.secretShelf.position.x = -12.0;
    if (sp.secretCollider) {
      sp.secretCollider.minY = 0;
      sp.secretCollider.maxY = 2.9;
    }
    if (sp.alcoveLight) sp.alcoveLight.intensity = 2.2;
    if (sp.atticKeyObject) {
      sp.atticKeyObject.visible = true;
      if (sp.atticKeyObject.userData.glow) sp.atticKeyObject.userData.glow.visible = true;
    }
    if (sp.cellarKeyObject) {
      sp.cellarKeyObject.visible = true;
      if (sp.cellarKeyObject.userData.glow) sp.cellarKeyObject.userData.glow.visible = true;
    }
    if (sp.brassKeyObject) {
      sp.brassKeyObject.visible = false;
      if (sp.brassKeyObject.userData.glow) sp.brassKeyObject.userData.glow.visible = false;
    }
    this._setShrineLitCount(0);
  }

  _clearWisps() {
    for (const [id, w] of this.wisps) {
      w.group.removeFromParent();
      this.mansion.removeInteractive(`wisp_${id}`);
      this.dynamicInteractives.delete(`wisp_${id}`);
    }
    this.wisps.clear();
  }

  _removeDynamicInteractives() {
    for (const id of this.dynamicInteractives) this.mansion.removeInteractive(id);
    this.dynamicInteractives.clear();
  }

  // ---------------------------------------------------------------- flow
  newGame() {
    this.audio.init();
    this.audio.start();
    this.ui.hideTitle();
    this.ui.hideHud();
    this.ui.hideEnding();
    this.ui.hidePause();
    this.ui.hideSettings();
    this.ui.hideJournal();
    this.ui.hidePuzzle();
    this.ui.el.memoryCard.classList.add('hidden');
    this.ui.el.loading.classList.add('hidden');
    this.ui.showCinematicBars(false);
    this._resetRun(true);
    this._maybeSpawnAllWisps();
    this._resetCamera();
    this.ui.showIntro();
    this.ui.fadeIn(1.0);
    this.audio.duck(0.55);
    this._updateObjective();
  }

  beginPlay() {
    this.ui.hideIntro();
    this.ui.showHud();
    this.mode = 'playing';
    this.overlay = null;
    this.input.enabled = true;
    this.controls.freeze = false;
    this.state.visited.add('foyer');
    this._maybeSpawnAllWisps();
    this._updateObjective();
    this._updateShrine();
    this._resetCamera();
    this.ui.roomBanner('The Grand Foyer');
    this.ui.fadeIn(1.2);
    this.audio.unduck();
    this.audio.start();
    this.ui.toast('A glimmer waits near the portrait. Follow the cold light.', 'good', 4.2);
    this.saveGame(true);
  }

  continueGame() {
    const data = readSave();
    if (!data) {
      this.newGame();
      return;
    }
    this.audio.init();
    this.audio.start();
    this.ui.hideTitle();
    this.ui.hideEnding();
    this.ui.hidePause();
    this.ui.hideSettings();
    this.ui.hideJournal();
    this.ui.hidePuzzle();
    this.ui.el.memoryCard.classList.add('hidden');
    this.ui.el.loading.classList.add('hidden');
    this._resetRun(false);
    this._applySave(data);
    this.mode = 'playing';
    this.overlay = null;
    this.input.enabled = true;
    this.controls.freeze = false;
    this.ui.showHud();
    this.ui.fadeIn(1.0);
    this.audio.unduck();
    this._resetCamera();
    const roomName = this.mansion.roomDefs.find(r => r.id === this.state.room)?.name || 'The Grand Foyer';
    this.ui.roomBanner(roomName);
    this.ui.toast('The house remembers you. Welcome back.', 'good', 3.6);
    this._updateObjective();
    this._updateShrine();
  }

  restart() {
    this.ui.hideEnding();
    this.ui.hidePause();
    this.ui.hideJournal();
    this.ui.hideSettings();
    this.ui.el.memoryCard.classList.add('hidden');
    this.ui.showCinematicBars(false);
    this.newGame();
  }

  stayAfterEnding() {
    this.ui.hideEnding();
    this.ui.showCinematicBars(false);
    this.ui.showHud();
    this.mode = 'playing';
    this.overlay = null;
    this.input.enabled = true;
    this.state.flags.completed = true;
    this._resetCamera();
    this.ui.fadeIn(1.2);
    this._updateObjective();
    this._updateShrine();
    this.audio.unduck();
    this.ui.toast('You stay a while. The house is warm.', 'good', 4);
    this.saveGame(true);
  }

  // ---------------------------------------------------------------- camera
  _setupTitleCamera() {
    this.attractTime = 0;
    this.viewCamera.position.set(-5.9, 3.15, 12.6);
    this.viewCamera.lookAt(new THREE.Vector3(1.4, 2.3, 7.2));
  }

  _resetCamera() {
    const c = this.controls;
    c.yaw = 0;
    c.pitch = 0.29;
    c.targetDistance = this.settings.cameraDistance;
    c.distance = this.settings.cameraDistance;
    c.initialized = false;
    c.initializedPos = false;
    c.freeze = false;
    c.orbit = null;
    c.currentTarget.copy(this.player.getFocus(this.tmpVec));
    const f = this.player.getFocus(this.focusVec);
    c.update(0.016, f, { lookX: 0, lookY: 0 });
  }

  setBloom(enabled) {
    if (this.bloomPass) this.bloomPass.enabled = !!enabled;
  }

  saveSettings() {
    storeSettings(this.settings);
  }

  // ---------------------------------------------------------------- save
  saveGame(silent = false) {
    const doors = {};
    for (const [id, d] of this.mansion.doors) doors[id] = { open: !!d.open, locked: !!d.locked };
    const data = {
      version: 1,
      savedAt: Date.now(),
      time: this.state.time,
      room: this.state.room,
      memories: [...this.state.memories],
      items: [...this.state.items],
      visited: [...this.state.visited],
      flags: { ...this.state.flags },
      pianoProgress: [...this.pianoProgress],
      libraryProgress: [...this.libraryProgress],
      player: {
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
        yaw: this.player.yaw,
      },
      camera: { yaw: this.controls.yaw, pitch: this.controls.pitch },
      doors,
    };
    const ok = writeSave(data);
    if (!silent) {
      this.ui.setSaveNote(ok ? 'Saved. The house will remember.' : 'The house could not hold on to this moment.');
      if (ok) this.ui.toast('Saved at this spot.', 'good', 2.4);
    }
    return ok;
  }

  _applySave(data) {
    this.state.memories = new Set(Array.isArray(data.memories) ? data.memories : []);
    this.state.items = new Set(Array.isArray(data.items) ? data.items : []);
    this.state.visited = new Set(Array.isArray(data.visited) ? data.visited : []);
    this.state.flags = { ...this.state.flags, ...(data.flags || {}) };
    this.state.time = Number(data.time) || 0;
    this.state.room = data.room || 'foyer';
    this.pianoProgress = Array.isArray(data.pianoProgress) ? data.pianoProgress.slice() : [];
    this.libraryProgress = Array.isArray(data.libraryProgress) ? data.libraryProgress.slice() : [];

    if (data.doors) {
      for (const [id, d] of this.mansion.doors) {
        const rec = data.doors[id];
        if (!rec) continue;
        d.locked = !!rec.locked;
        this.mansion.setDoorOpen(id, !!rec.open, true);
      }
    }
    // derive story flags from unlocked doors in older saves
    if (!this.mansion.doors.get('cellar')?.locked) this.state.flags.cellarUnlocked = true;
    if (!this.mansion.doors.get('attic')?.locked) this.state.flags.atticUnlocked = true;

    // restore object states
    const sp = this.mansion.special;
    if (this.state.flags.secretOpen) {
      if (sp.secretShelf) sp.secretShelf.position.x = -14.85;
      if (sp.secretCollider) { sp.secretCollider.minY = 999; sp.secretCollider.maxY = 999.1; }
      if (sp.alcoveLight) sp.alcoveLight.intensity = 4.2;
    }
    if (this.state.flags.cabinetOpen && sp.cabinetDoor) sp.cabinetDoor.rotation.y = -1.15;
    if (this.state.flags.toyChestOpen && sp.toyChest) {
      if (sp.toyChest.userData.lid) sp.toyChest.userData.lid.rotation.x = -1.35;
      if (sp.toyChest.userData.musicBox) sp.toyChest.userData.musicBox.visible = true;
    }
    if (this.state.flags.drawerOpen && sp.drawerUnit) sp.drawerUnit.userData.drawer.position.z = 0.58;

    this._syncKeyObjects();
    this._refreshInteractives();
    this._updateShrine();
    this._updateObjective();
    this.ui.setMemoryCount(this.state.memories.size);
    this._maybeSpawnAllWisps();

    const p = data.player || {};
    const spawn = {
      x: typeof p.x === 'number' ? p.x : SPAWN.x,
      y: typeof p.y === 'number' ? p.y : SPAWN.y,
      z: typeof p.z === 'number' ? p.z : SPAWN.z,
      yaw: typeof p.yaw === 'number' ? p.yaw : SPAWN.yaw,
    };
    this.player.teleport(spawn.x, spawn.y, spawn.z, spawn.yaw);
    this.player.setSpawn(spawn);
    if (data.camera) {
      this.controls.yaw = data.camera.yaw ?? 0;
      this.controls.pitch = data.camera.pitch ?? 0.29;
    }
    this.lastRoom = this.state.room;
  }

  // ---------------------------------------------------------------- objective / shrine
  _updateObjective() {
    const n = this.state.memories.size;
    if (this.state.flags.completed) {
      this.ui.setObjective('The house is quiet now', 'Wander if you like. Every room remembers you.');
      return;
    }
    if (n >= MEMORIES.length) {
      this.ui.setObjective('Return to the candle shrine', 'Seven flames. One door. The foyer is waiting.');
      return;
    }
    const next = MEMORIES.find(m => !this.state.memories.has(m.id));
    if (!next) return;
    if (n === 0) {
      this.ui.setObjective('Find the first memory', next.hint);
    } else {
      this.ui.setObjective(`Recover the scattered memories · ${n} of 7`, next.hint);
    }
  }

  _setShrineLitCount(count) {
    const candles = this.mansion.special.shrineCandles;
    if (!candles) return;
    candles.forEach((c, i) => {
      const lit = i < count;
      if (c.userData.flame) c.userData.flame.visible = lit;
      if (c.userData.glow) c.userData.glow.visible = lit;
    });
    const chalk = this.mansion.special.shrineChalk;
    if (chalk) chalk.material.opacity = 0.12 + count * 0.055;
  }

  _updateShrine() {
    this._setShrineLitCount(this.state.memories.size >= MEMORIES.length ? 8 : this.state.memories.size);
    this.ui.setMemoryCount(this.state.memories.size);
  }

  // ---------------------------------------------------------------- wisps
  _maybeSpawnAllWisps() {
    for (const mem of MEMORIES) {
      if (this.state.memories.has(mem.id)) continue;
      if (this._wispUnlocked(mem.id)) this.spawnWisp(mem.id);
    }
  }

  _wispUnlocked(id) {
    const f = this.state.flags;
    switch (id) {
      case 'foyer': return true;
      case 'piano': return f.pianoSolved;
      case 'library': return f.secretOpen;
      case 'dining': return f.cabinetOpen;
      case 'basement': return f.cellarUnlocked;
      case 'childroom': return f.toyChestOpen;
      case 'attic': return f.atticUnlocked;
      default: return false;
    }
  }

  spawnWisp(id) {
    if (this.state.memories.has(id) || this.wisps.has(id)) return;
    const mem = MEMORY_BY_ID[id];
    if (!mem?.wisp) return;
    const group = new THREE.Group();
    group.position.set(mem.wisp.x, mem.wisp.y, mem.wisp.z);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: wispSprite(), color: 0xbfe9ff, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sprite.scale.setScalar(0.72);
    group.add(sprite);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite(), color: 0x8ad8ff, transparent: true, opacity: 0.42,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(2.1);
    group.add(halo);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite(), color: 0xffffff, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    core.scale.setScalar(0.52);
    group.add(core);
    const light = new THREE.PointLight(0x9fdcff, 2.4, 4.2, 2);
    group.add(light);
    this.mansion.group.add(group);
    this.wisps.set(id, { group, sprite, halo, core, light, baseY: mem.wisp.y, phase: Math.random() * Math.PI * 2 });

    this.mansion.addInteractive(`wisp_${id}`, 'A glimmer of memory', sprite, mem.wisp.x, mem.wisp.z, mem.wisp.y, 2.15, {
      type: 'wisp', memoryId: id,
    });
    this.dynamicInteractives.add(`wisp_${id}`);
  }

  _updateWisps(dt, t) {
    for (const [id, w] of this.wisps) {
      w.group.position.y = w.baseY + Math.sin(t * 1.6 + w.phase) * 0.09;
      w.sprite.material.rotation += dt * 0.22;
      w.halo.material.rotation -= dt * 0.1;
      const s = 0.68 + Math.sin(t * 2.2 + w.phase) * 0.08;
      w.sprite.scale.setScalar(s);
      w.light.intensity = 2.1 + Math.sin(t * 2.5 + w.phase) * 0.55;
    }
  }

  // ---------------------------------------------------------------- interactions
  _findInteraction() {
    const p = this.player.position;
    let best = null;
    let bestScore = Infinity;
    for (const rec of this.mansion.interactives) {
      if (rec.disabled || this.disabledInteractives.has(rec.id)) continue;
      if (rec.memoryId && this.state.memories.has(rec.memoryId)) continue;
      if (rec.id === 'attic_key_pickup' && !this.state.flags.secretOpen) continue;
      if (rec.object && rec.object.visible === false) continue;
      const dx = p.x - rec.x;
      const dz = p.z - rec.z;
      const dy = p.y + 0.35 - rec.y;
      if (Math.abs(dy) > 2.7) continue;
      const dist = Math.hypot(dx, dz);
      if (dist > rec.radius) continue;
      const priority = rec.type === 'wisp' ? -0.3 : rec.type === 'key_pickup' ? -0.15 : rec.type === 'memory' ? -0.1 : 0;
      const score = dist + priority;
      if (score < bestScore) {
        bestScore = score;
        best = rec;
      }
    }
    return best;
  }

  _updateInteraction() {
    const rec = this._findInteraction();
    if (rec !== this.currentInteraction) {
      this.currentInteraction = rec;
      this.cat.setLookTarget(rec?.object || null);
      if (rec) this.ui.showPrompt(rec.label);
      else { this.ui.hidePrompt(); this.cat.setLookTarget(null); }
    } else if (rec) {
      this.ui.showPrompt(rec.label);
    }
  }

  _interact() {
    const rec = this.currentInteraction;
    if (!rec) return;
    this.ui.hidePrompt();
    this.audio.ui();
    switch (rec.type) {
      case 'door': this._handleDoor(rec.doorId); break;
      case 'lore': this._showLore(rec.id, rec.text); break;
      case 'memory': this.collectMemory(rec.memoryId); break;
      case 'wisp': this.collectMemory(rec.memoryId); break;
      case 'piano': this._openPiano(); break;
      case 'piano_sheet': this._showLore('piano_sheet'); break;
      case 'secret_shelf': this._handleSecretShelf(); break;
      case 'rune_book': this._handleRune(rec.rune); break;
      case 'cabinet': this._handleCabinet(); break;
      case 'drawer': this._handleDrawer(); break;
      case 'key_pickup': this._handleKeyPickup(rec); break;
      case 'toy_chest': this._handleToyChest(); break;
      case 'attic_trunk': this._handleAtticTrunk(); break;
      case 'shrine': this._handleShrine(); break;
      case 'gramophone': this.audio.gramophone(); this._showLore('gramophone'); break;
      case 'gate': this._showLore('garden_gate'); break;
      default:
        if (rec.text) this._showLore(rec.id, rec.text);
        else this.ui.toast(rec.label);
    }
  }

  _handleDoor(id) {
    const door = this.mansion.doors.get(id);
    if (!door) return;
    if (door.locked) {
      const hasKey = door.key && this.state.items.has(door.key);
      if (!hasKey) {
        this.ui.toast(door.lockedText || 'It is locked.', '', 3.2);
        this.audio.wrong();
        return;
      }
      door.locked = false;
      if (id === 'cellar') {
        this.state.flags.cellarUnlocked = true;
        this.spawnWisp('basement');
      }
      if (id === 'attic') {
        this.state.flags.atticUnlocked = true;
        this.spawnWisp('attic');
      }
      this.mansion.setDoorOpen(id, true);
      this.audio.unlock();
      this.audio.door(true);
      this.ui.toast('The key turns. The door opens.', 'key', 3.4);
      this._updateObjective();
      this.saveGame(true);
      return;
    }
    const open = !door.open;
    this.mansion.setDoorOpen(id, open);
    this.audio.door(open);
    if (id === 'garden_door' && open) {
      this.ui.toast('Cold rain breathes through the doorway.', '', 2.6);
    }
  }

  _showLore(id, text) {
    const lore = LORE[id];
    const title = lore?.title || 'A trace of the house';
    const body = lore?.text || text || 'The house keeps its small histories close.';
    const art = Math.abs(this._hash(id)) % 7;
    this.overlay = 'lore';
    this.input.enabled = false;
    this.controls.freeze = true;
    this.audio.page();
    this.ui.showLore(title, body, art);
  }

  _hash(str = '') {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h;
  }

  closeLore() {
    this.overlay = null;
    this.input.enabled = true;
    this.controls.freeze = false;
  }

  collectMemory(id) {
    if (!id || this.state.memories.has(id)) {
      if (id === 'basement') this.ui.toast('The little chest is empty now. Only dust and soft rain.', '', 3);
      return;
    }
    const mem = MEMORY_BY_ID[id];
    if (!mem) return;
    this.state.memories.add(id);
    this.state.visited.add(mem.room === 'The Cellar' ? 'basement' : this.state.room);
    const w = this.wisps.get(id);
    if (w) {
      this.mansion.group.remove(w.group);
      this.wisps.delete(id);
      this.mansion.removeInteractive(`wisp_${id}`);
      this.dynamicInteractives.delete(`wisp_${id}`);
    }
    this.currentInteraction = null;
    this.ui.hidePrompt();
    this.overlay = 'memory';
    this.input.enabled = false;
    this.controls.freeze = true;
    this.audio.memory(mem.index - 1);
    this.controls.applyShake(0.25);
    this._updateShrine();
    this._updateObjective();
    this.ui.setMemoryCount(this.state.memories.size);
    this.ui.showMemory(mem, () => {
      this.overlay = null;
      this.input.enabled = true;
      this.controls.freeze = false;
      this._updateObjective();
      this._updateShrine();
      if (this.state.memories.size >= MEMORIES.length) {
        this.ui.toast('All seven memories are yours. Return to the candle shrine.', 'good', 5.2);
      } else {
        this.ui.toast(`Memory ${mem.index} of 7 found. The house exhales.`, 'good', 3.6);
      }
      this.saveGame(true);
    });
    this.saveGame(true);
  }

  _openPiano() {
    if (this.state.flags.pianoSolved) {
      this.ui.toast('The piano is quiet now. The last note still hangs in the air.', '', 3.2);
      return;
    }
    this.pianoProgress = [];
    this.overlay = 'puzzle';
    this.input.enabled = false;
    this.controls.freeze = true;
    this.audio.pianoNote(0);
    this.ui.showPuzzle({
      kicker: 'The grand piano',
      title: 'A song for rainy days',
      clue: 'Four notes, written in a child’s careful hand. The music sheet on the stand remembers the order.',
      keys: PIANO_KEYS,
      feedback: 'Press the keys in the order of the old song.',
    });
  }

  puzzleKeyPress(i) {
    if (this.overlay !== 'puzzle' || this.state.flags.pianoSolved) return;
    const key = PIANO_KEYS[i];
    if (!key) return;
    this.ui.markPuzzleKey(i);
    this.audio.pianoNote(i);
    this.pianoProgress.push(key.value);
    const idx = this.pianoProgress.length - 1;
    if (this.pianoProgress[idx] !== PIANO_SEQUENCE[idx]) {
      this.pianoProgress = [];
      this.audio.wrong();
      this.ui.puzzleFeedback('The notes scatter like startled birds. Begin again.', 'wrong');
      setTimeout(() => {
        if (this.overlay === 'puzzle') this.ui.puzzleFeedback('Press the keys in the order of the old song.');
      }, 1400);
      return;
    }
    if (this.pianoProgress.length === PIANO_SEQUENCE.length) {
      this.state.flags.pianoSolved = true;
      this.audio.success();
      this.audio.chime(1);
      this.ui.puzzleFeedback('Four notes settle into place. Something in the room remembers.', 'right');
      this.spawnWisp('piano');
      this._updateObjective();
      this.saveGame(true);
      setTimeout(() => {
        if (this.overlay === 'puzzle') this.closePuzzle();
        this.ui.toast('A memory gathers above the piano.', 'good', 4);
      }, 1100);
    } else {
      const words = ['A low note, like moonlight.', 'A bright note, like a star.', 'A soft note, like a feather.'];
      this.ui.puzzleFeedback(words[this.pianoProgress.length - 1] || 'The song goes on.');
    }
  }

  closePuzzle() {
    this.ui.hidePuzzle();
    this.overlay = null;
    this.input.enabled = true;
    this.controls.freeze = false;
  }

  _handleSecretShelf() {
    if (this.state.flags.secretOpen) {
      this.ui.toast('The bookcase stands aside. The alcove breathes cold, clean air.', '', 3);
      return;
    }
    this._showLore('rune_plaque');
  }

  _handleRune(rune) {
    if (this.state.flags.secretOpen) {
      this.ui.toast('The book hums softly. The passage is already open.', '', 2.6);
      return;
    }
    const expected = LIBRARY_SEQUENCE[this.libraryProgress.length];
    const book = this.mansion.special.runeBooks?.[rune];
    if (rune !== expected) {
      this.libraryProgress = [];
      this.audio.wrong();
      this.ui.toast('The books fall silent. The shelf resets with a soft click.', '', 3);
      if (book) this._pulseObject(book, 0xff8f8f);
      return;
    }
    this.libraryProgress.push(rune);
    if (book) this._pulseObject(book, 0x9fe8ff);
    this.audio.chime(this.libraryProgress.length + 1);
    if (this.libraryProgress.length >= LIBRARY_SEQUENCE.length) {
      this._openSecret();
    } else {
      this.ui.toast(`The ${rune} book hums. ${this.libraryProgress.length} of 3.`, 'good', 2.6);
    }
  }

  _pulseObject(obj, color) {
    const original = [];
    obj.traverse(o => {
      if (o.isMesh && o.material?.emissive) {
        original.push([o, o.material.emissive.getHex(), o.material.emissiveIntensity]);
        o.material.emissive.setHex(color);
        o.material.emissiveIntensity = 0.9;
      }
    });
    setTimeout(() => {
      original.forEach(([o, hex, intensity]) => {
        if (!o.material) return;
        o.material.emissive.setHex(hex);
        o.material.emissiveIntensity = intensity;
      });
    }, 420);
  }

  _openSecret() {
    this.state.flags.secretOpen = true;
    const sp = this.mansion.special;
    sp.secretOpen = true;
    this.disabledInteractives.delete('attic_key_pickup');
    if (sp.secretCollider) { sp.secretCollider.minY = 999; sp.secretCollider.maxY = 999.1; }
    if (sp.alcoveLight) sp.alcoveLight.intensity = 4.2;
    this.audio.success();
    this.audio.door(true);
    this.controls.applyShake(0.3);
    this.spawnWisp('library');
    this._updateObjective();
    this.saveGame(true);
    this.ui.toast('The bookcase slides aside. Cold light spills from a hidden alcove.', 'good', 5);
    this._setInteractiveLabel('secret_shelf', 'The open passage');
  }

  _handleCabinet() {
    if (!this.state.flags.cabinetOpen) {
      if (!this.state.items.has('brassKey')) {
        this.ui.toast('The china cabinet is locked. A small brass key would fit the plate.', '', 3.4);
        this.audio.wrong();
        return;
      }
      this.state.flags.cabinetOpen = true;
      const sp = this.mansion.special;
      if (sp.cabinetDoor) sp.cabinetDoor.rotation.y = -1.15;
      this.audio.unlock();
      this.audio.chime(3);
      this.spawnWisp('dining');
      this._updateObjective();
      this.saveGame(true);
      this.ui.toast('The brass key turns. China glimmers inside, and something brighter still.', 'key', 4.2);
      this._setInteractiveLabel('dining_cabinet', 'The open china cabinet');
      return;
    }
    if (!this.state.memories.has('dining')) {
      this.ui.toast('A glimmer waits among the china.', 'good', 2.8);
    } else {
      this.ui.toast('The cabinet is open. All its small histories have been found.', '', 3);
    }
  }

  _handleDrawer() {
    const sp = this.mansion.special;
    if (!this.state.flags.drawerOpen) {
      this.state.flags.drawerOpen = true;
      this.audio.door(true);
      this.controls.applyShake(0.08);
      this.ui.toast('The drawer gives way with a soft complaint.', '', 3);
      if (!this.state.items.has('brassKey') && !this.state.flags.cabinetOpen) {
        this._revealBrassKey();
        this.ui.toast('Something small and brass glints inside.', 'key', 3.4);
      }
      this.saveGame(true);
      this._setInteractiveLabel('kitchen_drawer', 'The open kitchen drawer');
      return;
    }
    if (!this.state.items.has('brassKey') && !this.state.flags.cabinetOpen) {
      this._revealBrassKey();
      this.ui.toast('The little brass key is still here.', 'key', 2.8);
    } else {
      this.ui.toast('The drawer is empty now. It smells of old polish.', '', 3);
    }
  }

  _revealBrassKey() {
    const sp = this.mansion.special;
    const key = sp.brassKeyObject;
    if (!key) return;
    key.visible = true;
    if (key.userData.glow) key.userData.glow.visible = true;
    const id = 'brass_key_pickup';
    if (!this.mansion.interactives.some(r => r.id === id)) {
      this.mansion.addInteractive(id, 'A small brass key', key, 12.0, 1.02, 0.7, 1.8, {
        type: 'key_pickup', item: 'brassKey',
      });
      this.dynamicInteractives.add(id);
    }
  }

  _handleKeyPickup(rec) {
    const item = rec.item;
    if (!item || this.state.items.has(item)) return;
    this.state.items.add(item);
    this.disabledInteractives.add(rec.id);
    this.mansion.removeInteractive(rec.id);
    if (this.dynamicInteractives.has(rec.id)) this.dynamicInteractives.delete(rec.id);
    if (rec.object) {
      rec.object.visible = false;
      if (rec.object.userData?.glow) rec.object.userData.glow.visible = false;
    }
    this.audio.key();
    const info = ITEMS[item];
    this.ui.toast(`Found: ${info?.name || item}. ${info?.note || ''}`, 'key', 4.2);
    if (item === 'atticKey') {
      this.ui.toast('This old iron key must open the attic door upstairs.', '', 4.5);
      this.state.flags.atticUnlocked = true;
      this.spawnWisp('attic');
    }
    if (item === 'cellarKey') {
      this.ui.toast('A heavy iron key. The cellar door is in the kitchen.', '', 4.5);
      this.state.flags.cellarUnlocked = true;
      this.spawnWisp('basement');
    }
    this._updateObjective();
    this.saveGame(true);
  }

  _handleToyChest() {
    const sp = this.mansion.special;
    if (!this.state.flags.toyChestOpen) {
      this.state.flags.toyChestOpen = true;
      if (sp.toyChest?.userData.lid) sp.toyChest.userData.lid.rotation.x = -1.35;
      if (sp.toyChest?.userData.musicBox) sp.toyChest.userData.musicBox.visible = true;
      this.audio.musicBox();
      this.spawnWisp('childroom');
      this._updateObjective();
      this.saveGame(true);
      this.ui.toast('The lid opens. A tiny music box begins to turn, all by itself.', 'good', 5);
      this._setInteractiveLabel('toy_chest', 'The open toy chest');
      return;
    }
    if (!this.state.memories.has('childroom')) {
      this.ui.toast('The music box is still turning. A glimmer rises from the chest.', 'good', 3);
    } else {
      this.ui.toast('The little music box has gone quiet. Its song is yours now.', '', 3.4);
    }
  }

  _handleAtticTrunk() {
    if (!this.state.memories.has('attic')) {
      this.collectMemory('attic');
      return;
    }
    this._showLore('attic_trunk', 'The trunk is full of old toys, a child’s drawings, and the shape of a small cat pressed into the dust. The house keeps everything. Even the things you thought it lost.');
  }

  _handleShrine() {
    const n = this.state.memories.size;
    if (n < MEMORIES.length) {
      this.ui.toast(`${n} of seven candles are lit. The house is still waiting.`, '', 3.4);
      this.audio.chime(n);
      return;
    }
    if (this.state.flags.completed) {
      this.ui.toast('Seven flames burn steadily. The house is at peace.', 'good', 3.4);
      return;
    }
    this._startEnding();
  }

  _setInteractiveLabel(id, label) {
    const rec = this.mansion.interactives.find(r => r.id === id);
    if (rec) rec.label = label;
  }

  _refreshInteractives() {
    this.disabledInteractives.clear();
    if (this.state.items.has('atticKey')) this.disabledInteractives.add('attic_key_pickup');
    if (this.state.items.has('cellarKey')) this.disabledInteractives.add('cellar_key_pickup');
    this._syncKeyObjects();
    if (!this.state.flags.secretOpen) this.disabledInteractives.add('attic_key_pickup');
    const labels = {
      secret_shelf: this.state.flags.secretOpen ? 'The open passage' : 'A bookcase with a seam in the wall',
      dining_cabinet: this.state.flags.cabinetOpen ? 'The open china cabinet' : 'A locked china cabinet',
      kitchen_drawer: this.state.flags.drawerOpen ? 'The open kitchen drawer' : 'A stubborn kitchen drawer',
      toy_chest: this.state.flags.toyChestOpen ? 'The open toy chest' : 'A toy chest with a star on the lid',
    };
    for (const [id, label] of Object.entries(labels)) this._setInteractiveLabel(id, label);
  }

  _syncKeyObjects() {
    const sp = this.mansion.special;
    const attic = this.state.items.has('atticKey');
    const cellar = this.state.items.has('cellarKey');
    const brass = this.state.items.has('brassKey');
    if (sp.atticKeyObject) {
      sp.atticKeyObject.visible = !attic;
      if (sp.atticKeyObject.userData.glow) sp.atticKeyObject.userData.glow.visible = !attic;
    }
    if (sp.cellarKeyObject) {
      sp.cellarKeyObject.visible = !cellar;
      if (sp.cellarKeyObject.userData.glow) sp.cellarKeyObject.userData.glow.visible = !cellar;
    }
    if (sp.brassKeyObject) {
      const show = this.state.flags.drawerOpen && !brass && !this.state.flags.cabinetOpen;
      sp.brassKeyObject.visible = show;
      if (sp.brassKeyObject.userData.glow) sp.brassKeyObject.userData.glow.visible = show;
      if (show) this._revealBrassKey();
      else {
        const id = 'brass_key_pickup';
        if (this.mansion.interactives.some(r => r.id === id)) {
          this.mansion.removeInteractive(id);
          this.dynamicInteractives.delete(id);
        }
      }
    }
  }

  // ---------------------------------------------------------------- menus
  togglePause(force) {
    if (this.mode === 'ending' || this.mode === 'ended') return;
    if (this.mode === 'title') return;
    const show = typeof force === 'boolean' ? force : this.overlay !== 'pause';
    if (show) {
      if (this.mode === 'intro') return;
      if (this.overlay && this.overlay !== 'pause') this._closeAuxOverlay();
      this.overlay = 'pause';
      this.input.enabled = false;
      this.controls.freeze = true;
      this.ui.hidePrompt();
      this.ui.showPause();
    } else {
      this.overlay = null;
      this.input.enabled = true;
      this.controls.freeze = false;
      this.ui.hidePause();
    }
  }

  toggleJournal(force) {
    if (this.mode !== 'playing' && this.mode !== 'intro') return;
    if (this.overlay === 'memory' || this.overlay === 'lore') return;
    const show = typeof force === 'boolean' ? force : this.overlay !== 'journal';
    if (show) {
      if (this.overlay && this.overlay !== 'journal') this._closeAuxOverlay();
      this.overlay = 'journal';
      this.input.enabled = false;
      this.controls.freeze = true;
      this.ui.hidePrompt();
      this.ui.showJournal(this.state);
    } else {
      this.overlay = null;
      this.input.enabled = true;
      this.controls.freeze = false;
      this.ui.hideJournal();
    }
  }

  openSettings(origin = 'pause') {
    this.settingsOrigin = origin;
    if (origin !== 'title') {
      if (this.overlay && this.overlay !== 'settings') this._closeAuxOverlay();
      this.overlay = 'settings';
      this.input.enabled = false;
      this.controls.freeze = true;
      this.ui.hidePause();
      this.ui.hideJournal();
    }
    this.ui.showSettings();
  }

  closeSettings() {
    this.ui.hideSettings();
    if (this.settingsOrigin === 'title') return;
    this.overlay = null;
    this.input.enabled = true;
    this.controls.freeze = false;
  }

  _closeAuxOverlay() {
    if (this.overlay === 'pause') this.ui.hidePause();
    if (this.overlay === 'journal') this.ui.hideJournal();
    if (this.overlay === 'settings') this.ui.hideSettings();
    if (this.overlay === 'puzzle') this.closePuzzle();
    if (this.overlay === 'lore' || this.overlay === 'memory') {
      this.ui._closeMemory();
    }
    this.overlay = null;
  }

  manualSave() {
    if (this.mode === 'title') return;
    this.saveGame(false);
  }

  _handleEscape() {
    if (this.overlay === 'pause') { this.togglePause(false); return; }
    if (this.overlay === 'settings') { this.closeSettings(); return; }
    if (this.overlay === 'journal') { this.toggleJournal(false); return; }
    if (this.overlay === 'puzzle') { this.closePuzzle(); return; }
    if (this.overlay === 'lore' || this.overlay === 'memory') { this.ui._closeMemory(); return; }
    if (this.mode === 'playing') this.togglePause(true);
  }

  // ---------------------------------------------------------------- rooms
  _detectRoom() {
    const p = this.player.position;
    let candidates;
    if (p.y > 2.4) candidates = LAYOUT.rooms.filter(r => r.y === 5.0);
    else if (p.y < -0.6) candidates = LAYOUT.rooms.filter(r => r.y === -3.6);
    else candidates = LAYOUT.rooms.filter(r => r.y === 0);
    for (const r of candidates) {
      if (p.x >= r.x1 && p.x <= r.x2 && p.z >= r.z1 && p.z <= r.z2) return r.id;
    }
    // the hidden library alcove protrudes past z=-10
    if (p.x >= -13.8 && p.x <= -10.2 && p.z >= -12.0 && p.z < -10) return 'library';
    return null;
  }

  _updateRoom(force = false) {
    const id = this._detectRoom();
    if (!id) return;
    if (!force && id === this.lastRoom) return;
    const changed = id !== this.lastRoom;
    this.lastRoom = id;
    this.state.room = id;
    const firstVisit = !this.state.visited.has(id);
    this.state.visited.add(id);
    if (!changed) return;
    const def = this.mansion.roomDefs.find(r => r.id === id);
    if (def) this.ui.roomBanner(def.name);
    if (firstVisit && this.mode === 'playing') {
      this.audio.chime(Math.min(6, this.state.visited.size));
    }
    if (this.mode === 'playing' && !this.overlay) this.saveGame(true);
  }

  // ---------------------------------------------------------------- ending
  _startEnding() {
    this.mode = 'ending';
    this.overlay = 'ending';
    this.input.enabled = false;
    this.controls.freeze = true;
    this.ui.hidePrompt();
    this.ui.setTouchVisible(false);
    this.ui.showCinematicBars(true);
    this.audio.success();
    this.audio.duck(0.5);
    this.ending = {
      t: 0,
      shown: false,
      startCam: this.viewCamera.position.clone(),
      startLook: this.controls.currentTarget.clone(),
      targetCam: new THREE.Vector3(0.15, 2.35, 0.9),
      targetLook: new THREE.Vector3(0, 1.15, 4.2),
    };
  }

  _updateEnding(dt) {
    const e = this.ending;
    if (!e) return;
    e.t += dt;
    const p = Math.min(1, e.t / 4.6);
    const ease = p * p * (3 - 2 * p);
    this.viewCamera.position.lerpVectors(e.startCam, e.targetCam, ease);
    const look = new THREE.Vector3().lerpVectors(e.startLook, e.targetLook, ease);
    this.viewCamera.lookAt(look);
    this.cat.update(dt, { moving: false, running: false, grounded: true, floating: false, speed: 0, yaw: this.player.yaw });
    this.cat.setLookTarget(this.mansion.special.shrine);
    const lit = Math.min(7, Math.floor(e.t * 2.1));
    this._setShrineLitCount(lit);
    if (e.t > 3.7) this._setShrineLitCount(8);
    if (e.t > 4.4) this.ui.fadeOut(2.0);
    if (e.t > 6.1 && !e.shown) {
      e.shown = true;
      this.mode = 'ended';
      this.ui.showEnding({
        memories: this.state.memories.size,
        places: this.state.visited.size,
        time: formatTime(this.state.time),
      });
      this.ui.showCinematicBars(false);
    }
  }

  // ---------------------------------------------------------------- loop
  _animateSpecials(dt) {
    const sp = this.mansion.special;
    const k = Math.min(1, dt * 2.4);
    if (sp.secretShelf) {
      const target = this.state.flags.secretOpen ? -14.85 : -12.0;
      sp.secretShelf.position.x += (target - sp.secretShelf.position.x) * k;
    }
    if (sp.drawerUnit) {
      const dr = sp.drawerUnit.userData.drawer;
      if (dr) {
        const target = this.state.flags.drawerOpen ? 0.58 : 0.3;
        dr.position.z += (target - dr.position.z) * Math.min(1, dt * 7);
      }
    }
    if (sp.toyChest?.userData.lid) {
      const lid = sp.toyChest.userData.lid;
      const target = this.state.flags.toyChestOpen ? -1.35 : 0;
      lid.rotation.x += (target - lid.rotation.x) * Math.min(1, dt * 4);
    }
    if (sp.cabinetDoor) {
      const target = this.state.flags.cabinetOpen ? -1.15 : 0;
      sp.cabinetDoor.rotation.y += (target - sp.cabinetDoor.rotation.y) * Math.min(1, dt * 4);
    }
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    this.elapsed += dt;
    this._animateSpecials(dt);
    const look = this.input.update();

    if (this.mode === 'title') {
      this.attractTime += dt;
      const t = this.attractTime;
      this.viewCamera.position.set(-5.9 + Math.sin(t * 0.11) * 0.75, 3.15 + Math.sin(t * 0.19) * 0.12, 12.55 + Math.cos(t * 0.11) * 0.45);
      this.viewCamera.lookAt(new THREE.Vector3(1.4 + Math.sin(t * 0.07) * 0.2, 2.3, 7.2));
      this.cat.update(dt, { moving: false, running: false, grounded: true, floating: false, speed: 0, yaw: SPAWN.yaw });
      this.mansion.update(dt, this.elapsed);
      this._updateWisps(dt, this.elapsed);
      this.audio.update(dt, { indoor: 1, mood: 'foyer' });
      return;
    }

    if (this.mode === 'intro') {
      this.controls.update(dt, this.player.getFocus(this.focusVec), { lookX: 0, lookY: 0 });
      this.cat.update(dt, { moving: false, running: false, grounded: true, floating: false, speed: 0, yaw: SPAWN.yaw });
      this.mansion.update(dt, this.elapsed);
      this._updateWisps(dt, this.elapsed);
      this.audio.update(dt, { indoor: 1, mood: 'foyer' });
      return;
    }

    if (this.mode === 'ending') {
      this.mansion.update(dt, this.elapsed);
      this._updateWisps(dt, this.elapsed);
      this._updateEnding(dt);
      if (this.mode === 'ending') this.audio.update(dt, { indoor: 1, mood: 'foyer' });
      return;
    }

    if (this.mode === 'ended') {
      this.mansion.update(dt, this.elapsed);
      this.audio.update(dt, { indoor: 1, mood: 'foyer' });
      return;
    }

    // paused / overlay handling still consumes input
    if (this.input.pausePressed) this._handleEscape();
    if (this.input.journalPressed && !this.overlay) this.toggleJournal(true);

    if (!this.overlay) {
      this.controls.update(dt, this.player.getFocus(this.focusVec), look);
      const ps = this.player.update(dt, this.input, this.controls);
      this.cat.update(dt, ps);
      this.state.time += dt;
      if (this.input.interactPressed) this._interact();
      this._updateInteraction();
      this._updateRoom();
      if (this.player.jumpedThisFrame) this.audio.jump();
      if (this.player.landedThisFrame && this.player.speed > 0.4) this.audio.step('stone');
    } else {
      this.controls.update(dt, this.player.getFocus(this.focusVec), { lookX: 0, lookY: 0 });
      this.cat.update(dt, { moving: false, running: false, grounded: true, floating: false, speed: 0, yaw: this.player.yaw });
      this.ui.hidePrompt();
    }

    const room = this.state.room;
    const indoor = room === 'garden' ? 0.05 : room === 'basement' ? 1 : 1;
    this.mansion.update(dt, this.elapsed);
    this._updateWisps(dt, this.elapsed);
    this.audio.update(dt, { indoor, mood: room });
  }
}
