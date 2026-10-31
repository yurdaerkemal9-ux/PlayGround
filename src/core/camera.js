import * as THREE from 'three';

function rayBoxHit(origin, dir, box, maxDist) {
  const axes = [
    ['x', 'minX', 'maxX'],
    ['y', 'minY', 'maxY'],
    ['z', 'minZ', 'maxZ'],
  ];
  let tmin = 0.001;
  let tmax = maxDist;
  for (const [axis, loKey, hiKey] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    const lo = box[loKey];
    const hi = box[hiKey];
    if (Math.abs(d) < 1e-7) {
      if (o < lo || o > hi) return null;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return null;
    }
  }
  return tmin;
}

function pointInBox(p, box) {
  return p.x > box.minX && p.x < box.maxX && p.y > box.minY && p.y < box.maxY && p.z > box.minZ && p.z < box.maxZ;
}

export class ThirdPersonCamera {
  constructor(camera, blockers, boxes = []) {
    this.camera = camera;
    this.blockers = blockers;
    this.boxes = boxes;
    this.yaw = 0;
    this.pitch = 0.28;
    this.distance = 3.4;
    this.targetDistance = 3.4;
    this.minDistance = 0.55;
    this.maxDistance = 6.0;
    this.sensitivity = 1;
    this.target = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();
    this.currentPos = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 8;
    this.freeze = false;
    this.orbit = null;
    this.shake = 0;
    this.initialized = false;
  }

  update(dt, focus, inputLook) {
    if (!this.freeze) {
      if (inputLook) {
        const lx = Number.isFinite(inputLook.x) ? inputLook.x : (Number.isFinite(inputLook.lookX) ? inputLook.lookX : 0);
        const ly = Number.isFinite(inputLook.y) ? inputLook.y : (Number.isFinite(inputLook.lookY) ? inputLook.lookY : 0);
        const zoom = Number.isFinite(inputLook.zoom) ? inputLook.zoom : 0;
        this.yaw -= lx * 0.0042 * this.sensitivity;
        this.pitch += ly * 0.0032 * this.sensitivity;
        this.pitch = THREE.MathUtils.clamp(this.pitch, -0.32, 1.08);
        if (zoom) {
          this.targetDistance = THREE.MathUtils.clamp(this.targetDistance + zoom * 0.35, this.minDistance, this.maxDistance);
        }
      }
    }
    this.distance += (this.targetDistance - this.distance) * Math.min(1, dt * 8);

    this.target.copy(focus);
    this.target.y += 0.55;
    if (!this.initialized) {
      this.currentTarget.copy(this.target);
      this.initialized = true;
    }
    this.currentTarget.lerp(this.target, Math.min(1, dt * 7));

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const dir = new THREE.Vector3(
      Math.sin(this.yaw) * cp,
      sp,
      Math.cos(this.yaw) * cp
    );
    let dist = this.distance;
    const desired = this.currentTarget.clone().addScaledVector(dir, dist);

    // collision: pull camera in front of any wall between focus and camera
    if (this.blockers?.length) {
      const from = this.currentTarget.clone();
      const to = desired.clone();
      const rayDir = to.clone().sub(from);
      const length = rayDir.length();
      if (length > 0.01) {
        this.raycaster.set(from, rayDir.normalize());
        this.raycaster.far = length;
        const hits = this.raycaster.intersectObjects(this.blockers, false);
        if (hits.length) {
          dist = Math.max(this.minDistance, hits[0].distance - 0.18);
        }
      }
    }

    // collision: pull in front of furniture / props between focus and camera
    if (this.boxes?.length) {
      const from = this.currentTarget.clone();
      for (const box of this.boxes) {
        if (pointInBox(from, box)) continue;
        const hit = rayBoxHit(from, dir, box, dist);
        if (hit !== null && hit < dist) {
          dist = Math.max(this.minDistance, hit - 0.2);
        }
      }
    }

    const pos = this.currentTarget.clone().addScaledVector(dir, dist);
    if (!this.initializedPos) { this.currentPos.copy(pos); this.initializedPos = true; }
    this.currentPos.lerp(pos, Math.min(1, dt * 9));

    // never sink beneath the floor
    const floor = this.currentTarget.y - 0.2;
    if (this.currentPos.y < floor) this.currentPos.y = floor;

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 2);
      const s = this.shake * 0.04;
      this.currentPos.x += (Math.random() - 0.5) * s;
      this.currentPos.y += (Math.random() - 0.5) * s;
      this.currentPos.z += (Math.random() - 0.5) * s;
    }

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
    this.camera.rotation.z = (this.currentPos.x - pos.x) * 0.0;
  }

  forward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  right() {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
  }

  getYaw() { return this.yaw; }

  setOrbit(orbit) { this.orbit = orbit; }

  applyShake(amount) { this.shake = Math.max(this.shake, amount); }
}
