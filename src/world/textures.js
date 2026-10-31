import * as THREE from 'three';

let rngState = 1337;
export function rand() {
  rngState = (rngState * 1664525 + 1013904223) % 4294967296;
  return rngState / 4294967296;
}
export function resetRand(seed = 1337) { rngState = seed; }

function canvas(w = 512, h = 512) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, repeat = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  return t;
}

function noise(ctx, w, h, amount = 14, alpha = 0.05) {
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  if (alpha > 0) {
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

export function woodFloor(light = false) {
  const [c, ctx] = canvas(512, 512);
  const base = light ? ['#7d512f', '#8d5d37', '#6d4528', '#94653e'] : ['#4a2e1c', '#553522', '#3f2718', '#5e3c25'];
  ctx.fillStyle = base[0]; ctx.fillRect(0, 0, 512, 512);
  const plankH = 64;
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * 128;
    for (let col = -1; col < 3; col++) {
      const x = offset + col * 256, y = row * plankH;
      const colr = base[Math.floor(rand() * base.length)];
      ctx.fillStyle = colr;
      ctx.fillRect(x + 1, y + 1, 254, plankH - 2);
      const grad = ctx.createLinearGradient(x, y, x, y + plankH);
      grad.addColorStop(0, 'rgba(255,220,180,.07)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,.16)');
      ctx.fillStyle = grad; ctx.fillRect(x + 1, y + 1, 254, plankH - 2);
      for (let g = 0; g < 7; g++) {
        ctx.strokeStyle = `rgba(${Math.random() > .5 ? '25,12,5' : '220,170,110'},${0.04 + rand() * 0.05})`;
        ctx.lineWidth = 0.7 + rand();
        ctx.beginPath();
        const gy = y + 8 + rand() * (plankH - 16);
        ctx.moveTo(x + 8, gy);
        ctx.bezierCurveTo(x + 70, gy + rand() * 5 - 2, x + 180, gy - rand() * 4, x + 248, gy + rand() * 4 - 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(15,7,2,.28)'; ctx.fillRect(x, y, 2, plankH);
    }
  }
  noise(ctx, 512, 512, 10, 0.022);
  return tex(c, [1, 1]);
}

export function woodPanel(dark = false) {
  const [c, ctx] = canvas(256, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, dark ? '#2c1a10' : '#4a2c1b');
  g.addColorStop(0.5, dark ? '#3b2416' : '#5c3922');
  g.addColorStop(1, dark ? '#24140c' : '#3d2415');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) {
    ctx.strokeStyle = `rgba(${dark ? '10,5,2' : '25,12,5'},${0.06 + rand() * 0.08})`;
    ctx.lineWidth = .6 + rand() * 1.4;
    ctx.beginPath();
    const y = rand() * 256;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y + rand() * 8 - 4, 170, y - rand() * 7, 256, y + rand() * 6);
    ctx.stroke();
  }
  noise(ctx, 256, 256, 10, 0.02);
  return tex(c, [1, 1]);
}

export function wallpaper(bg = '#1c3a37', accent = '#8e6f3e', style = 0) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, 'rgba(255,255,255,.035)');
  g.addColorStop(1, 'rgba(0,0,0,.14)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = accent; ctx.fillStyle = accent;
  if (style === 0) {
    for (let y = 0; y < 512; y += 128) {
      for (let x = 0; x < 512; x += 128) {
        const ox = (Math.floor(y / 128) % 2) * 64;
        ctx.save(); ctx.translate(x + ox, y + 64);
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = i % 2 ? 12 : 34;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.4);
        }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.09;
        ctx.beginPath(); ctx.ellipse(0, 46, 3, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  } else if (style === 1) {
    for (let y = 0; y < 512; y += 64) {
      for (let x = 0; x < 512; x += 64) {
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(x + 32, y + 32, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 32, y + 32, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else {
    ctx.globalAlpha = 0.09;
    for (let x = 0; x < 512; x += 32) {
      ctx.fillRect(x, 0, 3, 512);
    }
    for (let y = 0; y < 512; y += 96) {
      ctx.fillRect(0, y, 512, 4);
    }
  }
  ctx.globalAlpha = 1;
  noise(ctx, 512, 512, 8, 0.02);
  return tex(c, [1, 1]);
}

export function rug(main = '#6b2630', accent = '#c9a463', border = '#263a4f', ornate = true) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = border; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = accent; ctx.fillRect(16, 16, 480, 480);
  ctx.fillStyle = main; ctx.fillRect(28, 28, 456, 456);
  ctx.strokeStyle = accent; ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, 428, 428);
  if (ornate) {
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 8; i++) {
      ctx.save(); ctx.translate(256, 256); ctx.rotate(i * Math.PI / 4);
      ctx.beginPath();
      for (let j = 0; j < 12; j++) {
        const a = (j / 12) * Math.PI * 2;
        const r = j % 2 ? 26 : 150;
        ctx.lineTo(Math.cos(a) * r * .55, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.stroke(); ctx.restore();
    }
    ctx.globalAlpha = 0.38;
    ctx.beginPath(); ctx.arc(256, 256, 58, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(256, 256, 70, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(256, 256, 12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand() * .08})`;
    ctx.fillRect(rand() * 512, rand() * 512, rand() * 30 + 4, 1.5);
  }
  noise(ctx, 512, 512, 16, 0.04);
  return tex(c, [1, 1]);
}

export function stone(bg = '#3c4146', block = '#5b5f63', moss = true) {
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#23272a'; ctx.fillRect(0, 0, 512, 512);
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const h = 512 / rows;
    const off = (r % 2) * 55;
    for (let x = -120; x < 512; x += 110) {
      const w = 100 + rand() * 20;
      const shade = 0.8 + rand() * .4;
      const col = new THREE.Color(block).multiplyScalar(shade);
      ctx.fillStyle = `#${col.getHexString()}`;
      ctx.fillRect(x + off + 3, r * h + 3, w - 6, h - 6);
      ctx.strokeStyle = 'rgba(255,255,255,.045)';
      ctx.strokeRect(x + off + 5, r * h + 5, w - 10, h - 10);
    }
  }
  if (moss) {
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${60 + rand() * 30},${80 + rand() * 30},${40},${.04 + rand() * .07})`;
      ctx.beginPath(); ctx.arc(rand() * 512, rand() * 512, rand() * 20 + 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  noise(ctx, 512, 512, 22, 0.05);
  return tex(c, [1, 1]);
}

export function tile(base = '#d8cbb2', line = '#a79779') {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = line; ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const shade = 0.88 + rand() * .18;
    const col = new THREE.Color(base).multiplyScalar(shade);
    ctx.fillStyle = `#${col.getHexString()}`;
    ctx.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
  }
  noise(ctx, 256, 256, 8, 0.02);
  return tex(c, [1, 1]);
}

export function fabric(base = '#42566b', line = '#5f7a92') {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = line; ctx.globalAlpha = .28;
  for (let i = 0; i < 256; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  noise(ctx, 256, 256, 12, 0.02);
  return tex(c, [1, 1]);
}

export function marble(base = '#bfc4c6', vein = '#6d7a80') {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 14; i++) {
    ctx.strokeStyle = `rgba(90,105,112,${.08 + rand() * .12})`;
    ctx.lineWidth = .7 + rand() * 1.6;
    ctx.beginPath();
    let x = rand() * 256, y = 0;
    ctx.moveTo(x, y);
    for (let j = 0; j < 8; j++) {
      x += (rand() - .5) * 40; y += 34;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  noise(ctx, 256, 256, 6, 0.01);
  return tex(c, [1, 1]);
}

export function moonWindow(arch = false) {
  const [c, ctx] = canvas(512, 768);
  const g = ctx.createLinearGradient(0, 0, 0, 768);
  g.addColorStop(0, '#081726'); g.addColorStop(.55, '#123551'); g.addColorStop(1, '#1b4c63');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 768);
  const mg = ctx.createRadialGradient(350, 160, 10, 350, 160, 240);
  mg.addColorStop(0, 'rgba(220,245,255,.85)');
  mg.addColorStop(.18, 'rgba(160,215,255,.4)');
  mg.addColorStop(1, 'rgba(80,150,210,0)');
  ctx.fillStyle = mg; ctx.fillRect(0, 0, 512, 768);
  ctx.fillStyle = '#eaf9ff';
  ctx.beginPath(); ctx.arc(350, 160, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(200,225,235,.28)';
  ctx.beginPath(); ctx.arc(362, 150, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(338, 172, 6, 0, Math.PI * 2); ctx.fill();
  // distant trees
  ctx.fillStyle = 'rgba(5,18,26,.75)';
  for (let i = 0; i < 18; i++) {
    const x = rand() * 512, w = 20 + rand() * 50, h = 100 + rand() * 200;
    ctx.beginPath(); ctx.moveTo(x - w, 768); ctx.lineTo(x, 768 - h); ctx.lineTo(x + w / 2, 768); ctx.fill();
  }
  // rain
  ctx.strokeStyle = 'rgba(190,225,248,.18)'; ctx.lineWidth = 1;
  for (let i = 0; i < 180; i++) {
    const x = rand() * 512, y = rand() * 768, l = 8 + rand() * 26;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + l); ctx.stroke();
  }
  // mullions
  ctx.fillStyle = 'rgba(14,10,8,.92)';
  ctx.fillRect(250, 0, 12, 768);
  ctx.fillRect(0, 300, 512, 12);
  ctx.fillRect(0, 560, 512, 10);
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 0, 14, 768);
  ctx.fillRect(498, 0, 14, 768);
  if (arch) {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.moveTo(0, 768); ctx.lineTo(0, 120);
    ctx.quadraticCurveTo(256, -120, 512, 120);
    ctx.lineTo(512, 768); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function painting(kind = 0) {
  const [c, ctx] = canvas(384, 480);
  const g = ctx.createLinearGradient(0, 0, 0, 480);
  if (kind === 0) { g.addColorStop(0, '#1f3348'); g.addColorStop(.6, '#4b6577'); g.addColorStop(1, '#232a2c'); }
  else if (kind === 1) { g.addColorStop(0, '#3b2239'); g.addColorStop(.7, '#7d4a3b'); g.addColorStop(1, '#241a18'); }
  else if (kind === 2) { g.addColorStop(0, '#20342a'); g.addColorStop(.7, '#58684a'); g.addColorStop(1, '#1b2218'); }
  else { g.addColorStop(0, '#44352a'); g.addColorStop(.6, '#8b6d4a'); g.addColorStop(1, '#2a2117'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, 384, 480);
  // painterly landscape / interiors
  if (kind === 0) {
    ctx.fillStyle = 'rgba(238,233,210,.6)';
    ctx.beginPath(); ctx.arc(290, 108, 28, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 9; i++) {
      const x = 20 + rand() * 340, h = 100 + rand() * 200;
      ctx.fillStyle = `rgba(12,25,30,${.4 + rand() * .3})`;
      ctx.beginPath(); ctx.moveTo(x - 40, 400); ctx.lineTo(x, 400 - h); ctx.lineTo(x + 40, 400); ctx.fill();
    }
    ctx.fillStyle = 'rgba(155,170,162,.28)'; ctx.fillRect(0, 380, 384, 100);
    ctx.strokeStyle = 'rgba(230,220,190,.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(110, 390); ctx.lineTo(130, 410); ctx.lineTo(126, 470); ctx.stroke();
  } else if (kind === 1) {
    // little cat silhouette
    ctx.fillStyle = 'rgba(25,17,12,.8)';
    ctx.beginPath(); ctx.ellipse(220, 390, 70, 46, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(258, 330, 38, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(232, 305); ctx.lineTo(240, 260); ctx.lineTo(258, 298); ctx.fill();
    ctx.beginPath(); ctx.moveTo(268, 298); ctx.lineTo(286, 258); ctx.lineTo(291, 306); ctx.fill();
    ctx.strokeStyle = 'rgba(25,17,12,.6)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(160, 400); ctx.bezierCurveTo(90, 330, 140, 280, 100, 240); ctx.stroke();
    ctx.fillStyle = 'rgba(248,214,150,.55)';
    ctx.beginPath(); ctx.arc(160, 180, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(25,17,12,.4)';
    ctx.fillRect(0, 430, 384, 50);
  } else if (kind === 2) {
    ctx.fillStyle = 'rgba(30,32,22,.5)';
    for (let i = 0; i < 70; i++) {
      const x = rand() * 384, y = 240 + rand() * 240;
      ctx.beginPath(); ctx.arc(x, y, 3 + rand() * 22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(245,216,160,.34)';
    ctx.beginPath(); ctx.arc(180, 200, 80, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(20,14,10,.7)';
    ctx.fillRect(40, 300, 304, 12);
    ctx.fillRect(60, 312, 8, 100);
    ctx.fillRect(316, 312, 8, 100);
    ctx.fillStyle = 'rgba(240,207,145,.55)';
    ctx.beginPath(); ctx.arc(100, 260, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(20,14,10,.55)';
    ctx.fillRect(200, 230, 80, 80);
  }
  // varnish/cracks
  ctx.globalAlpha = .12;
  for (let i = 0; i < 22; i++) {
    ctx.strokeStyle = '#000'; ctx.lineWidth = .6;
    ctx.beginPath(); ctx.moveTo(rand() * 384, rand() * 480); ctx.lineTo(rand() * 384, rand() * 480); ctx.stroke();
  }
  ctx.globalAlpha = .25;
  const vg = ctx.createRadialGradient(192, 240, 50, 192, 240, 320);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.7)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, 384, 480);
  ctx.globalAlpha = 1;
  noise(ctx, 384, 480, 8, 0.015);
  return tex(c, [1, 1]);
}

export function skyGradient() {
  const [c, ctx] = canvas(32, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#050b16');
  g.addColorStop(.45, '#0d2135');
  g.addColorStop(.77, '#1b4256');
  g.addColorStop(1, '#314f57');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 512);
  return tex(c, [1, 1]);
}

export function dustSprite() {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,244,215,1)');
  g.addColorStop(.35, 'rgba(255,228,175,.55)');
  g.addColorStop(1, 'rgba(255,210,150,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function wispSprite() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, 'rgba(235,252,255,1)');
  g.addColorStop(.15, 'rgba(160,229,255,.95)');
  g.addColorStop(.42, 'rgba(75,172,230,.42)');
  g.addColorStop(1, 'rgba(30,100,170,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function glowSprite() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,235,190,.9)');
  g.addColorStop(.3, 'rgba(255,190,105,.4)');
  g.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function floorShadow() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(.5, 'rgba(0,0,0,.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); return t;
}

export function bookSpines(count = 12) {
  const [c, ctx] = canvas(512, 256);
  const palette = ['#5d2a2a', '#2f4858', '#3f5132', '#6b4b2a', '#4a3050', '#7a5d32', '#2e3d52', '#63343d', '#435e53', '#844f31'];
  let x = 0;
  const width = 512 / count;
  for (let i = 0; i < count; i++) {
    const col = palette[Math.floor(rand() * palette.length)];
    ctx.fillStyle = col; ctx.fillRect(x, 0, width - 2, 256);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + width - 4, 0, 2, 256);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x + 2, 0, 1, 256);
    ctx.fillStyle = 'rgba(220,190,130,.55)';
    ctx.fillRect(x + 5, 30, width - 12, 3);
    ctx.fillRect(x + 5, 100, width - 12, 2);
    ctx.fillRect(x + 5, 170, width - 12, 2);
    if (rand() > .4) {
      ctx.fillStyle = 'rgba(225,210,170,.45)';
      ctx.fillRect(x + 7, 52, width - 16, 12);
    }
    x += width;
  }
  return tex(c, [1, 1]);
}

export function bookTitle(text = 'MEMORIES', bg = '#3e2f52', fg = '#d9c28d') {
  const [c, ctx] = canvas(256, 128);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = fg; ctx.globalAlpha = .45; ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, 232, 104);
  ctx.globalAlpha = 1;
  ctx.fillStyle = fg; ctx.font = 'italic 26px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(text, 128, 70);
  ctx.font = '10px Georgia'; ctx.fillText('— a keepsake —', 128, 92);
  return tex(c, [1, 1]);
}

export function noteTexture(lines = ['Forget-me-not', 'The house remembers.']) {
  const [c, ctx] = canvas(256, 320);
  ctx.fillStyle = '#e7d8b6'; ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = 'rgba(100,80,50,.2)';
  for (let y = 30; y < 320; y += 22) { ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(240, y); ctx.stroke(); }
  ctx.fillStyle = '#4b3a2b'; ctx.font = 'italic 19px Georgia'; ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, 128, 58 + i * 30));
  ctx.fillStyle = 'rgba(120,80,40,.18)';
  ctx.beginPath(); ctx.arc(210, 280, 16, 0, Math.PI * 2); ctx.fill();
  return tex(c, [1, 1]);
}

export function catPortrait() {
  const [c, ctx] = canvas(256, 320);
  const bg = ctx.createLinearGradient(0, 0, 0, 320);
  bg.addColorStop(0, '#22384a'); bg.addColorStop(1, '#0d1620');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = 'rgba(245,222,170,.14)';
  ctx.beginPath(); ctx.arc(128, 120, 76, 0, Math.PI * 2); ctx.fill();
  // child silhouette
  ctx.fillStyle = 'rgba(8,12,18,.55)';
  ctx.beginPath(); ctx.arc(160, 150, 26, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(160, 238, 46, 80, 0, 0, Math.PI * 2); ctx.fill();
  // cat
  ctx.fillStyle = 'rgba(126,210,244,.22)';
  ctx.beginPath(); ctx.ellipse(96, 242, 26, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(101, 212, 18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(89, 198); ctx.lineTo(91, 175); ctx.lineTo(102, 196); ctx.fill();
  ctx.beginPath(); ctx.moveTo(109, 196); ctx.lineTo(122, 175); ctx.lineTo(118, 200); ctx.fill();
  return tex(c, [1, 1]);
}

export function stainedGlass() {
  const [c, ctx] = canvas(256, 384);
  ctx.fillStyle = '#0b1420'; ctx.fillRect(0, 0, 256, 384);
  const cols = ['#2d6ea8', '#8b3b4a', '#c08a3e', '#3b7b60', '#5d4a86', '#2f8fb0'];
  ctx.globalAlpha = .75;
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.beginPath();
    const y = i * 44;
    ctx.moveTo(10, y + 6); ctx.lineTo(246, y + 6); ctx.lineTo(246, y + 42); ctx.lineTo(10, y + 42); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#0a1016'; ctx.lineWidth = 7;
  for (let y = 0; y < 384; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  for (let x = 0; x < 256; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 384); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(128, 120, 70, 0, Math.PI * 2); ctx.stroke();
  return tex(c, [1, 1]);
}

export const PALETTES = {
  foyerWall: { bg: '#1d3634', accent: '#9a7b45', style: 0 },
  livingWall: { bg: '#243b33', accent: '#a07b42', style: 1 },
  diningWall: { bg: '#3a2727', accent: '#a8824a', style: 0 },
  libraryWall: { bg: '#2a241d', accent: '#7d633d', style: 2 },
  kitchenWall: { bg: '#8d8066', accent: '#c7b68f', style: 2 },
  bedroomWall: { bg: '#3c3447', accent: '#9f8c6b', style: 1 },
  childWall: { bg: '#2d4252', accent: '#a7b0a0', style: 1 },
  atticWall: { bg: '#3a2c20', accent: '#68533a', style: 2 },
  basementWall: { bg: '#4a4a44', accent: '#66655b', style: 2 },
};
