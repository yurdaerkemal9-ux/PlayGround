export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.moveX = 0;
    this.moveY = 0;
    this.lookDX = 0;
    this.lookDY = 0;
    this.jumpHeld = false;
    this.jumpPressed = false;
    this.run = false;
    this.interactPressed = false;
    this.pausePressed = false;
    this.journalPressed = false;
    this.sensitivity = 1;
    this.enabled = true;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.touchMode = matchMedia('(pointer: coarse)').matches;
    this.joystick = { x: 0, y: 0 };
    this._bind();

    this._jumpQueued = false;
    this._interactQueued = false;
    this._pauseQueued = false;
    this._journalQueued = false;
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) {
        if (e.code === 'Space') e.preventDefault();
        return;
      }
      const k = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
      this.keys.add(k);
      if (k === 'Space') { this._jumpQueued = true; this.jumpHeld = true; }
      if (k === 'KeyE' || k === 'Enter') this._interactQueued = true;
      if (k === 'Escape') this._pauseQueued = true;
      if (k === 'KeyJ' || k === 'Tab') this._journalQueued = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') this.jumpHeld = false;
    });
    window.addEventListener('blur', () => { this.keys.clear(); this.jumpHeld = false; this.dragging = false; this.joystick.x = this.joystick.y = 0; });

    const el = this.canvas;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.dragging = true;
      this.lastX = e.clientX; this.lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX; this.lastY = e.clientY;
      this.lookDX += dx;
      this.lookDY += dy;
    });
    const end = (e) => { this.dragging = false; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoomDelta = (this.zoomDelta || 0) + Math.sign(e.deltaY);
    }, { passive: false });
  }

  setJoystick(x, y) {
    this.joystick.x = x;
    this.joystick.y = y;
  }

  addLook(dx, dy) {
    this.lookDX += dx;
    this.lookDY += dy;
  }

  queueInteract() { this._interactQueued = true; }
  queueJump() { this._jumpQueued = true; }
  queuePause() { this._pauseQueued = true; }

  update() {
    const k = this.keys;
    let mx = 0, my = 0;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) my += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) my -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1;
      mx += this.joystick.x;
      my += -this.joystick.y;
      const mag = Math.hypot(mx, my);
      if (mag > 1) { mx /= mag; my /= mag; }
      this.run = k.has('ShiftLeft') || k.has('ShiftRight') || this.touchRun;
    } else {
      this.run = false;
    }
    this.moveX = mx;
    this.moveY = my;

    this.jumpPressed = this._jumpQueued;
    this.interactPressed = this._interactQueued;
    this.pausePressed = this._pauseQueued;
    this.journalPressed = this._journalQueued;
    this._jumpQueued = false;
    this._interactQueued = false;
    this._pauseQueued = false;
    this._journalQueued = false;

    const lookX = this.lookDX;
    const lookY = this.lookDY;
    this.lookDX = 0;
    this.lookDY = 0;
    const zoom = this.zoomDelta || 0;
    this.zoomDelta = 0;
    return { lookX, lookY, zoom };
  }
}
