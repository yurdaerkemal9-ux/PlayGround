import * as THREE from 'three';

const EPS = 0.0001;

export class Player {
  constructor(cat, colliders, walkables, spawn) {
    this.cat = cat;
    this.colliders = colliders;
    this.walkables = walkables;
    this.radius = 0.2;
    this.height = 0.72;
    this.position = new THREE.Vector3(spawn.x, spawn.y ?? 0, spawn.z);
    this.velocity = new THREE.Vector3();
    this.vy = 0;
    this.yaw = spawn.yaw ?? Math.PI;
    this.onGround = true;
    this.coyote = 0;
    this.floating = false;
    this.walkSpeed = 2.15;
    this.runSpeed = 4.05;
    this.speed = 0;
    this.moveDir = new THREE.Vector3();
    this.spawn = { ...spawn };
    this.lastSafe = new THREE.Vector3(spawn.x, spawn.y ?? 0, spawn.z);
    this.stepTimer = 0;
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    this.stepCallback = null;
    this.landCallback = null;
    this.fallReset = -25;
  }

  teleport(x, y, z, yaw = this.yaw) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.vy = 0;
    this.onGround = true;
    this.yaw = yaw;
    this.cat.position.set(x, y, z);
    this.cat.rotation.y = yaw;
    this.lastSafe.set(x, y, z);
  }

  setSpawn(spawn) {
    this.spawn = { ...spawn };
  }

  _surfaceAt(x, z) {
    let best = null;
    for (const s of this.walkables) {
      if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue;
      let y;
      if (s.type === 'rampZ') {
        const t = s.z2 === s.z1 ? 0 : (z - s.z1) / (s.z2 - s.z1);
        y = s.y1 + (s.y2 - s.y1) * t;
      } else {
        y = s.y;
      }
      if (best === null || y > best) best = y;
    }
    return best;
  }

  _groundCandidate(x, z, maxY) {
    let best = null;
    for (const s of this.walkables) {
      if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue;
      let y;
      if (s.type === 'rampZ') {
        const t = s.z2 === s.z1 ? 0 : (z - s.z1) / (s.z2 - s.z1);
        y = s.y1 + (s.y2 - s.y1) * t;
      } else {
        y = s.y;
      }
      if (y <= maxY + EPS && (best === null || y > best)) best = y;
    }
    return best;
  }

  _resolveCollisions() {
    const p = this.position;
    const minY = p.y + 0.06;
    const maxY = p.y + this.height;
    for (let pass = 0; pass < 2; pass++) {
      for (const c of this.colliders) {
        if (c.maxY <= minY || c.minY >= maxY) continue;
        if (p.x + this.radius < c.minX || p.x - this.radius > c.maxX || p.z + this.radius < c.minZ || p.z - this.radius > c.maxZ) continue;
        const cx = Math.max(c.minX, Math.min(p.x, c.maxX));
        const cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
        let dx = p.x - cx, dz = p.z - cz;
        let d = Math.hypot(dx, dz);
        if (d > this.radius) continue;
        if (d < 0.0001) {
          // inside the box: push out along the smallest axis
          const left = Math.abs(p.x - c.minX), right = Math.abs(c.maxX - p.x);
          const top = Math.abs(p.z - c.minZ), bottom = Math.abs(c.maxZ - p.z);
          const m = Math.min(left, right, top, bottom);
          if (m === left) p.x = c.minX - this.radius - EPS;
          else if (m === right) p.x = c.maxX + this.radius + EPS;
          else if (m === top) p.z = c.minZ - this.radius - EPS;
          else p.z = c.maxZ + this.radius + EPS;
        } else {
          const push = this.radius - d;
          p.x += (dx / d) * push;
          p.z += (dz / d) * push;
        }
      }
    }
  }

  update(dt, input, camera) {
    dt = Math.min(dt, 0.05);
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    const forward = camera.forward();
    const right = camera.right();
    this.moveDir.set(0, 0, 0);
    if (input.enabled) {
      this.moveDir.addScaledVector(forward, input.moveY);
      this.moveDir.addScaledVector(right, input.moveX);
    }
    if (this.moveDir.lengthSq() > 1) this.moveDir.normalize();
    const moving = this.moveDir.lengthSq() > 0.01;
    const wantsRun = input.run && moving;
    const maxSpeed = wantsRun ? this.runSpeed : this.walkSpeed;

    const accel = this.onGround ? 14 : 6.5;
    const targetVx = moving ? this.moveDir.x * maxSpeed : 0;
    const targetVz = moving ? this.moveDir.z * maxSpeed : 0;
    this.velocity.x += (targetVx - this.velocity.x) * Math.min(1, dt * accel);
    this.velocity.z += (targetVz - this.velocity.z) * Math.min(1, dt * accel);
    if (!moving && Math.hypot(this.velocity.x, this.velocity.z) < 0.05) { this.velocity.x = 0; this.velocity.z = 0; }

    // jump / float
    if (this.onGround) this.coyote = 0.12;
    else this.coyote = Math.max(0, this.coyote - dt);
    if (input.jumpPressed && (this.onGround || this.coyote > 0)) {
      this.vy = 4.35;
      this.onGround = false;
      this.coyote = 0;
      this.jumpedThisFrame = true;
    }
    this.floating = !this.onGround && input.jumpHeld && this.vy < 0.6;
    let gravity = 16;
    if (this.floating) {
      gravity = 3.2;
      if (this.vy < -1.6) this.vy = -1.6;
    }
    if (!this.onGround) this.vy -= gravity * dt;

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this._resolveCollisions();

    if (this.onGround) {
      const g = this._groundCandidate(this.position.x, this.position.z, this.position.y + 0.5);
      if (g !== null && this.position.y - g <= 0.6) {
        this.position.y = g;
      } else {
        this.onGround = false;
        if (g !== null) this.vy = Math.min(this.vy, 0);
      }
    }

    if (!this.onGround) {
      this.position.y += this.vy * dt;
      const g = this._groundCandidate(this.position.x, this.position.z, this.position.y + 0.08);
      if (g !== null && this.position.y <= g + 0.02 && this.vy <= 0) {
        this.position.y = g;
        this.vy = 0;
        this.onGround = true;
        this.landedThisFrame = true;
        this.landCallback?.(this);
      }
    } else {
      const g = this._groundCandidate(this.position.x, this.position.z, this.position.y + 0.5);
      if (g !== null) this.position.y = g;
      this.vy = 0;
    }

    // safety net
    if (this.position.y < this.fallReset) {
      this.teleport(this.lastSafe.x, this.lastSafe.y, this.lastSafe.z, this.yaw);
      return this._state(moving, wantsRun);
    }
    if (this.onGround && Math.abs(this.velocity.x) + Math.abs(this.velocity.z) > 0.4) {
      this.lastSafe.copy(this.position);
    }

    // movement rotation
    if (moving) {
      const targetYaw = Math.atan2(this.moveDir.x, this.moveDir.z);
      let diff = targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 14);
    }

    // footstep cadence
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.speed = horizSpeed;
    if (this.onGround && horizSpeed > 0.4) {
      this.stepTimer -= dt * (wantsRun ? 1.5 : 1);
      if (this.stepTimer <= 0) {
        this.stepTimer = wantsRun ? 0.27 : 0.38;
        this.stepCallback?.(this);
      }
    } else {
      this.stepTimer = Math.min(this.stepTimer, 0.12);
    }

    this.cat.position.copy(this.position);
    this.cat.rotation.y = this.yaw;
    return this._state(moving, wantsRun);
  }

  _state(moving, running) {
    return {
      moving,
      running,
      grounded: this.onGround,
      floating: this.floating,
      speed: this.speed,
      yaw: this.yaw,
    };
  }

  getFocus(out = new THREE.Vector3()) {
    return out.set(this.position.x, this.position.y + 0.28, this.position.z);
  }
}
