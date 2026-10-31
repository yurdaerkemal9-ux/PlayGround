import * as THREE from 'three';
import { wispSprite, glowSprite, floorShadow } from '../world/textures.js';

const BODY_COLOR = 0x9adcf5;
const BODY_LIGHT = 0xd8f4ff;
const SPOT_COLOR = 0xc9f0ff;
const BLUE_EYE = 0x1b66bd;
const AMBER_EYE = 0xffb52e;
const INNER_EAR = 0x6faecb;

function mat(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.45,
    emissive: 0x0b3a55,
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: 0.93,
    ...opts,
  });
}

function sphere(r, color, opts = {}, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), typeof color === 'number' ? mat(color, opts) : color);
  m.scale.set(scale[0], scale[1], scale[2]);
  return m;
}

function capsule(r, len, color, opts = {}) {
  const g = new THREE.CapsuleGeometry(r, len, 6, 12);
  return new THREE.Mesh(g, typeof color === 'number' ? mat(color, opts) : color);
}

export class GhostCat extends THREE.Group {
  constructor() {
    super();
    this.name = 'GhostCat';
    this.time = 0;
    this.walkPhase = 0;
    this.blink = 0;
    this.blinkTimer = 2 + Math.random() * 3;
    this.earTimer = 3;
    this.earTwitch = 0;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.headTarget = null;
    this.isMoving = false;
    this.isRunning = false;
    this.grounded = true;
    this.airTime = 0;
    this.floating = false;
    this.speed = 0;
    this.turnLean = 0;
    this.prevYaw = 0;
    this.wispTime = 0;
    this.idleBreath = 0;

    this.bodyMat = mat(BODY_COLOR, { opacity: 0.9, emissive: 0x1a6488, emissiveIntensity: 0.2 });
    this.bodyLightMat = mat(BODY_LIGHT, { opacity: 0.94, emissive: 0x3d9cc4, emissiveIntensity: 0.22 });
    this.skirtMat = mat(0x8ed3f0, { opacity: 0.45, depthWrite: false, emissive: 0x2a86b6, emissiveIntensity: 0.24 });
    this.tailMat = mat(0xa8e4fb, { opacity: 0.82, emissive: 0x2b90c4, emissiveIntensity: 0.3, depthWrite: false });
    this.innerEarMat = mat(INNER_EAR, { opacity: 0.8, roughness: 0.5 });
    this.eyeBlueMat = new THREE.MeshBasicMaterial({ color: BLUE_EYE });
    this.eyeAmberMat = new THREE.MeshBasicMaterial({ color: AMBER_EYE });
    this.pupilMat = new THREE.MeshBasicMaterial({ color: 0x0a1622 });
    this.highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.darkMat = new THREE.MeshBasicMaterial({ color: 0x2c4c60, transparent: true, opacity: 0.8 });

    this.root = new THREE.Group();
    this.add(this.root);
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.y = 0.02;
    this.root.add(this.bodyGroup);

    this._buildBody();
    this._buildHead();
    this._buildLegs();
    this._buildTail();
    this._buildAura();
  }

  _buildBody() {
    const body = sphere(0.155, this.bodyMat, {}, [1.04, 0.9, 1.28]);
    body.position.set(0, 0.31, -0.01);
    body.castShadow = false;
    this.bodyGroup.add(body);
    this.body = body;

    // chest / belly lighter patch
    const chest = sphere(0.105, this.bodyLightMat, { opacity: 0.55, depthWrite: false }, [1.0, 1.1, 0.5]);
    chest.position.set(0, 0.29, 0.13);
    this.bodyGroup.add(chest);

    // pale spots like the reference
    const spotPositions = [
      [-0.075, 0.42, -0.02, 0.04], [0.06, 0.39, 0.04, 0.033],
      [0.1, 0.29, -0.06, 0.028], [-0.11, 0.24, 0.02, 0.025],
      [0.02, 0.44, 0.09, 0.026],
    ];
    for (const [x, y, z, r] of spotPositions) {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: SPOT_COLOR, transparent: true, opacity: 0.5, depthWrite: false }));
      spot.position.set(x, y, z);
      spot.scale.set(1, 0.5, 1);
      this.bodyGroup.add(spot);
    }

    // ghostly skirt
    const skirtGeo = new THREE.ConeGeometry(0.155, 0.26, 18, 1, true);
    const skirt = new THREE.Mesh(skirtGeo, this.skirtMat);
    skirt.position.y = 0.15;
    skirt.rotation.x = Math.PI;
    skirt.scale.set(1, 1, 0.9);
    this.bodyGroup.add(skirt);
    this.skirt = skirt;

    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.014, 6, 24), new THREE.MeshBasicMaterial({ color: 0xc9f3ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    hem.rotation.x = Math.PI / 2;
    hem.position.y = 0.03;
    this.bodyGroup.add(hem);
    this.hem = hem;

    // neck fluff
    const fluff = sphere(0.11, this.bodyLightMat, { opacity: 0.5, depthWrite: false }, [1.15, 0.7, 0.9]);
    fluff.position.set(0, 0.46, 0.07);
    this.bodyGroup.add(fluff);
  }

  _buildHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.53, 0.055);
    this.bodyGroup.add(this.headGroup);

    const head = sphere(0.165, this.bodyMat, {}, [1.04, 0.98, 0.95]);
    head.position.y = 0.06;
    this.headGroup.add(head);
    this.head = head;

    // muzzle
    const muzzle = sphere(0.073, this.bodyLightMat, { opacity: 0.55, depthWrite: false }, [1.15, 0.7, 0.6]);
    muzzle.position.set(0, -0.005, 0.15);
    this.headGroup.add(muzzle);

    // nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.022, 5), new THREE.MeshBasicMaterial({ color: 0x356d8b }));
    nose.rotation.x = Math.PI;
    nose.position.set(0, 0.024, 0.208);
    this.headGroup.add(nose);

    // mouth
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x285b76, transparent: true, opacity: 0.8 });
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.013, 0.206),
        new THREE.Vector3(s * 0.018, -0.005, 0.206),
        new THREE.Vector3(s * 0.033, -0.002, 0.2),
      ]);
      const mouth = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.0035, 4, false), mouthMat);
      this.headGroup.add(mouth);
    }

    // eyes
    this.eyes = [];
    for (const side of [-1, 1]) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(side * 0.076, 0.062, 0.135);
      // outer almond shape
      const socket = sphere(0.052, new THREE.MeshBasicMaterial({ color: 0x173246, transparent: true, opacity: 0.5 }), {}, [1.05, 1.25, 0.35]);
      socket.position.z = -0.006;
      eyeGroup.add(socket);
      const isBlue = side === -1;
      const iris = sphere(0.044, isBlue ? this.eyeBlueMat : this.eyeAmberMat, {}, [1.0, 1.25, 0.34]);
      iris.position.z = 0.006;
      eyeGroup.add(iris);
      // pupil: round for blue eye, slit for amber
      if (isBlue) {
        const pupil = sphere(0.021, this.pupilMat, {}, [0.8, 1.05, 0.3]);
        pupil.position.set(0.002, 0, 0.02);
        eyeGroup.add(pupil);
      } else {
        const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.072, 0.012), this.pupilMat);
        pupil.position.set(0, 0, 0.02);
        pupil.scale.z = 0.4;
        eyeGroup.add(pupil);
      }
      const hi = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), this.highlightMat);
      hi.position.set(-0.014 * side, 0.022, 0.035);
      eyeGroup.add(hi);
      const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), this.highlightMat);
      hi2.position.set(0.012 * side, -0.012, 0.033);
      eyeGroup.add(hi2);
      eyeGroup.rotation.y = side * 0.08;
      this.headGroup.add(eyeGroup);
      this.eyes.push({ group: eyeGroup, socket, iris });
    }

    // eyelids for blinking
    this.lids = [];
    for (const side of [-1, 1]) {
      const lid = sphere(0.055, new THREE.MeshBasicMaterial({ color: BODY_LIGHT }), {}, [1.0, 0.55, 0.2]);
      lid.position.set(side * 0.076, 0.12, 0.148);
      lid.scale.y = 0.01;
      lid.visible = false;
      this.headGroup.add(lid);
      this.lids.push(lid);
    }

    // ears: long, soft triangles with a slight outward sweep
    this.earGroups = [];
    for (const side of [-1, 1]) {
      const earPivot = new THREE.Group();
      earPivot.position.set(side * 0.092, 0.198, -0.012);
      earPivot.rotation.z = side * -0.2;
      earPivot.rotation.x = -0.06;
      const earGeo = new THREE.ConeGeometry(0.079, 0.26, 18, 5, true);
      earGeo.translate(0, 0.112, 0);
      // taper the base into the head a little so it does not read as a cone glued on
      const pos = earGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const t = Math.max(0, pos.getY(i)) / 0.242;
        pos.setX(i, pos.getX(i) * (1 + (1 - t) * 0.18));
      }
      earGeo.computeVertexNormals();
      const ear = new THREE.Mesh(earGeo, this.bodyMat);
      ear.scale.z = 0.52;
      earPivot.add(ear);
      // softly rounded tip
      const tip = sphere(0.017, this.bodyMat, {}, [1, 1.25, 0.75]);
      tip.position.set(0, 0.242, 0);
      earPivot.add(tip);
      // inner ear
      const innerGeo = new THREE.ConeGeometry(0.052, 0.19, 14, 2, true);
      innerGeo.translate(0, 0.085, 0);
      const inner = new THREE.Mesh(innerGeo, this.innerEarMat);
      inner.position.set(0, 0.018, 0.032);
      inner.scale.z = 0.3;
      earPivot.add(inner);
      const earGlow = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.27, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x8fe1ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      earGlow.position.y = 0.12;
      earGlow.scale.z = 0.6;
      earPivot.add(earGlow);
      this.headGroup.add(earPivot);
      this.earGroups.push(earPivot);
    }

    // forehead marking
    const mark = sphere(0.035, new THREE.MeshBasicMaterial({ color: 0xd6f5ff, transparent: true, opacity: 0.5, depthWrite: false }), {}, [1, 0.45, 0.4]);
    mark.position.set(0, 0.145, 0.135);
    this.headGroup.add(mark);

    // cheek tufts
    this.cheeks = [];
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.11, 10), this.bodyMat);
      cheek.position.set(side * 0.15, 0.0, 0.045);
      cheek.rotation.z = side * -Math.PI / 2.2;
      cheek.rotation.y = side * 0.2;
      cheek.scale.z = 0.55;
      this.headGroup.add(cheek);
      this.cheeks.push(cheek);
    }
    this.headGroup.rotation.order = 'YXZ';
  }

  _buildLegs() {
    this.legs = [];
    const defs = [
      { x: -0.085, z: 0.09, front: true, side: -1 },
      { x: 0.085, z: 0.09, front: true, side: 1 },
      { x: -0.09, z: -0.1, front: false, side: -1 },
      { x: 0.09, z: -0.1, front: false, side: 1 },
    ];
    for (const d of defs) {
      const pivot = new THREE.Group();
      pivot.position.set(d.x, 0.22, d.z);
      const leg = capsule(0.041, 0.16, this.bodyMat, { opacity: 0.85 });
      leg.position.y = -0.105;
      pivot.add(leg);
      const paw = sphere(0.055, this.bodyLightMat, { opacity: 0.8 }, [1, 0.62, 1.3]);
      paw.position.set(0, -0.195, 0.018);
      pivot.add(paw);
      // toe lines
      for (const s of [-1, 0, 1]) {
        const toe = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 6, 5), new THREE.MeshBasicMaterial({ color: 0x6fb8d6, transparent: true, opacity: 0.55 }));
        toe.position.set(s * 0.023, -0.214, 0.057);
        pivot.add(toe);
      }
      this.root.add(pivot);
      this.legs.push({ pivot, front: d.front, side: d.side });
    }
  }

  _buildTail() {
    this.tailSegments = [];
    this.tailJoint = new THREE.Group();
    this.tailJoint.position.set(0, 0.3, -0.17);
    this.bodyGroup.add(this.tailJoint);
    const count = 15;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const r = 0.043 * (1 - t * 0.82);
      const seg = sphere(r, this.tailMat, { opacity: 0.82 - t * 0.3, depthWrite: false });
      this.tailJoint.add(seg);
      this.tailSegments.push({ mesh: seg, t });
    }
    const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color: 0xb9eeff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
    tip.scale.set(0.22, 0.22, 1);
    this.tailJoint.add(tip);
    this.tailTip = tip;
    this.tailBase = new THREE.Vector3(0, 0.02, 0);
  }

  _buildAura() {
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: wispSprite(), color: 0x7fcdf5, transparent: true, opacity: 0.23, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.aura.position.y = 0.36;
    this.aura.scale.set(1.15, 1.15, 1);
    this.add(this.aura);

    this.glowLight = new THREE.PointLight(0x7fd4ff, 0.7, 2.4, 2);
    this.glowLight.position.y = 0.4;
    this.add(this.glowLight);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: floorShadow(), transparent: true, opacity: 0.5, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    this.add(shadow);
    this.shadow = shadow;

    // rim shell
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x92ddff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
    const rim = new THREE.Mesh(new THREE.SphereGeometry(0.172, 18, 12), rimMat);
    rim.scale.set(1.05, 1.0, 1.3);
    rim.position.y = 0.32;
    this.bodyGroup.add(rim);
  }

  setLookTarget(object3D) {
    this.headTarget = object3D || null;
  }

  update(dt, state) {
    this.time += dt;
    this.wispTime += dt;
    const moving = state?.moving ?? false;
    const running = state?.running ?? false;
    const grounded = state?.grounded ?? true;
    const floating = state?.floating ?? false;
    const speed = state?.speed ?? 0;
    this.isMoving = moving;
    this.isRunning = running;
    this.grounded = grounded;
    this.floating = floating;
    this.speed = speed;

    // idle breathing
    this.idleBreath = Math.sin(this.time * 1.8) * 0.006;
    const bobSpeed = running ? 12 : 8;
    const bobAmount = moving ? (running ? 0.032 : 0.017) : 0.008;
    const bob = Math.sin(this.time * bobSpeed) * bobAmount;
    this.bodyGroup.position.y = 0.02 + bob + (floating && !grounded ? Math.sin(this.time * 2.2) * 0.02 : 0);
    this.bodyGroup.scale.setScalar(1 + this.idleBreath * 0.6);

    // walk phase
    const stride = running ? 11 : 7.5;
    if (moving && grounded) this.walkPhase += dt * stride * Math.max(0.6, Math.min(1.4, speed / 2));
    else if (moving && !grounded) this.walkPhase += dt * 3;

    // legs
    for (let i = 0; i < this.legs.length; i++) {
      const leg = this.legs[i];
      let target = 0;
      if (grounded) {
        if (moving) {
          const phase = this.walkPhase + (leg.front ? 0 : Math.PI) + (leg.side > 0 ? Math.PI : 0);
          target = Math.sin(phase) * (running ? 0.9 : 0.55);
        }
      } else {
        target = leg.front ? (floating ? 0.25 : -0.65) : (floating ? -0.15 : 0.55);
      }
      const resp = 1 - Math.pow(0.0001, dt);
      leg.pivot.rotation.x += (target - leg.pivot.rotation.x) * Math.min(1, resp * 2.2);
      leg.pivot.position.y = 0.22 + (grounded && moving ? Math.max(0, Math.sin(this.walkPhase + (leg.front ? 0 : Math.PI))) * 0.02 : 0);
    }

    // body lean while turning / running
    const yaw = state?.yaw ?? 0;
    let yawDelta = yaw - this.prevYaw;
    while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
    while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
    this.prevYaw = yaw;
    this.turnLean += ((-yawDelta / Math.max(dt, 0.001)) * 0.03 - this.turnLean) * Math.min(1, dt * 6);
    this.turnLean = THREE.MathUtils.clamp(this.turnLean, -0.25, 0.25);
    this.bodyGroup.rotation.z = this.turnLean;
    this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, moving ? (running ? -0.12 : -0.04) : 0, Math.min(1, dt * 5));
    if (floating && !grounded) this.bodyGroup.rotation.x = 0.1;

    // head look
    let targetYaw = 0, targetPitch = 0;
    if (this.headTarget) {
      const p = new THREE.Vector3();
      this.headTarget.getWorldPosition(p);
      const local = this.worldToLocal(p.clone());
      targetYaw = THREE.MathUtils.clamp(Math.atan2(local.x, local.z), -0.9, 0.9);
      targetPitch = THREE.MathUtils.clamp(-Math.atan2(local.y - 0.7, Math.hypot(local.x, local.z)), -0.45, 0.35);
    } else if (moving) {
      targetYaw = Math.sin(this.time * 0.6) * 0.05;
    } else {
      targetYaw = Math.sin(this.time * 0.35) * 0.16;
    }
    this.lookYaw += (targetYaw - this.lookYaw) * Math.min(1, dt * 4.5);
    this.lookPitch += (targetPitch - this.lookPitch) * Math.min(1, dt * 4.5);
    this.headGroup.rotation.y = this.lookYaw;
    this.headGroup.rotation.x = this.lookPitch + Math.sin(this.time * 1.2) * 0.015;

    // ear sway and twitch
    this.earTimer -= dt;
    if (this.earTimer < 0) {
      this.earTimer = 2.5 + Math.random() * 5;
      this.earTwitch = 1;
    }
    if (this.earTwitch > 0) this.earTwitch = Math.max(0, this.earTwitch - dt * 3.2);
    const earSway = Math.sin(this.time * 1.5) * 0.045 + Math.sin(this.walkPhase * 0.5) * (moving ? 0.05 : 0);
    const twitch = Math.sin(this.earTwitch * Math.PI * 4) * this.earTwitch * 0.22;
    this.earGroups[0].rotation.z = 0.2 + earSway - twitch;
    this.earGroups[1].rotation.z = -0.2 - earSway + twitch;
    this.earGroups[0].rotation.x = -0.06 + (running ? -0.14 : 0) + this.earTwitch * 0.1;
    this.earGroups[1].rotation.x = -0.06 + (running ? -0.14 : 0) + this.earTwitch * 0.1;

    // blink
    this.blinkTimer -= dt;
    if (this.blinkTimer < 0) {
      this.blinkTimer = 2.2 + Math.random() * 4;
      this.blink = 1;
    }
    if (this.blink > 0) this.blink = Math.max(0, this.blink - dt * 7);
    const lidAmount = this.blink > 0 ? Math.sin(Math.min(1, this.blink) * Math.PI) : 0;
    for (const lid of this.lids) {
      lid.visible = lidAmount > 0.03;
      lid.scale.y = Math.max(0.01, lidAmount * 0.075 / 0.055);
      lid.position.y = 0.062 + 0.064 * (1 - lidAmount * 0.6);
    }
    // eye glance
    const glance = Math.sin(this.time * 0.5) * 0.006;
    this.eyes.forEach((e, i) => { e.group.position.x = (i === 0 ? -0.076 : 0.076) + glance; });

    // tail: flowing spirit ribbon
    if (this.tailSegments) {
      const amp = this.isRunning ? 0.11 : this.isMoving ? 0.07 : 0.045;
      const up = this.floating && !this.grounded ? 0.2 : 0;
      for (let i = 0; i < this.tailSegments.length; i++) {
        const s = this.tailSegments[i];
        const t = s.t;
        const sway = Math.sin(this.time * 2.4 - t * 4.2) * amp * t;
        const curl = Math.sin(this.time * 1.6 - t * 2.8) * 0.06 * t;
        const x = t * t * 0.15 + sway;
        const y = 0.01 + t * (0.42 + up) + Math.sin(this.time * 1.9 - t * 3.4) * 0.05 * t;
        const z = -t * (0.26 + (this.isRunning ? 0.16 : 0)) + curl - t * t * 0.1;
        s.mesh.position.set(x, y, z);
        s.mesh.scale.setScalar(1 - t * 0.1);
      }
      const last = this.tailSegments[this.tailSegments.length - 1].mesh.position;
      this.tailTip.position.copy(last);
      this.tailTip.material.opacity = 0.55 + Math.sin(this.time * 3) * 0.12;
    }

    // skirt pulse
    if (this.skirt) {
      this.skirt.rotation.y += dt * 0.25;
      this.skirt.scale.set(1 + Math.sin(this.time * 2) * 0.02, 1, 0.9);
    }
    if (this.hem) { this.hem.rotation.z += dt * 0.15; this.hem.material.opacity = 0.4 + Math.sin(this.time * 2.4) * 0.12; }
    if (this.aura) { this.aura.material.opacity = 0.18 + Math.sin(this.time * 1.8) * 0.05; this.aura.scale.setScalar(1.1 + Math.sin(this.time * 1.3) * 0.04); }
    if (this.glowLight) this.glowLight.intensity = 0.65 + Math.sin(this.time * 2.1) * 0.12;

    // shadow shrinks in air
    if (this.shadow) {
      const airFade = this.grounded ? 1 : Math.max(0.15, 1 - this.airTime * 1.2);
      this.shadow.material.opacity = 0.42 * airFade;
      this.shadow.scale.setScalar(0.8 + (1 - airFade) * 1.3);
    }
    if (!this.grounded) this.airTime += dt; else this.airTime = 0;
  }
}
