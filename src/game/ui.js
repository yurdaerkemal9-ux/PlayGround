import { MEMORIES, MEMORY_BY_ID, ITEMS, ROOM_ORDER, LORE, ART_SVGS, ENDING } from './story.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(game) {
    this.game = game;
    this.el = {
      loading: $('loading'), title: $('title-screen'), hud: $('hud'),
      objective: $('objective-text'), objectiveSub: $('objective-sub'),
      memoryCount: $('memory-count'), memoryCounter: $('memory-counter'),
      prompt: $('interact-prompt'), promptLabel: $('interact-label'),
      toastStack: $('toast-stack'), roomBanner: $('room-banner'),
      controlsHint: $('controls-hint'), touchUI: $('touch-ui'),
      memoryCard: $('memory-card'), memoryKicker: $('memory-kicker'), memoryTitle: $('memory-title'),
      memoryText: $('memory-text'), memorySub: $('memory-sub'), memoryArt: $('memory-art'),
      memoryArtScene: document.querySelector('#memory-art .memory-art-scene'),
      btnMemoryClose: $('btn-memory-close'),
      puzzle: $('puzzle'), puzzleKicker: $('puzzle-kicker'), puzzleTitle: $('puzzle-title'),
      puzzleClue: $('puzzle-clue'), puzzleKeys: $('puzzle-keys'), puzzleFeedback: $('puzzle-feedback'),
      journal: $('journal'), journalMemories: $('journal-memories'), journalItems: $('journal-items'),
      journalPlaces: $('journal-places'), journalHint: $('journal-hint'),
      pause: $('pause'), saveNote: $('save-note'),
      settings: $('settings'), ending: $('ending'), endingText: $('ending-text'), endingStats: $('ending-stats'),
      intro: $('intro'), introTitle: $('intro-title'), introText: $('intro-text'),
      fade: $('fade'), bars: $('cinematic-bars'),
    };
    this.memoryCloseCallback = null;
    this.toastTimer = 0;
    this.bannerTimer = 0;
    this.lastPrompt = '';
    this.touchRun = false;
    this._bind();
    this._bindSettings();
    this._bindTouch();
  }

  _bind() {
    $('btn-new').addEventListener('click', () => this.game.newGame());
    $('btn-continue').addEventListener('click', () => this.game.continueGame());
    $('btn-title-settings').addEventListener('click', () => this.game.openSettings('title'));
    $('btn-intro').addEventListener('click', () => this.game.beginPlay());
    $('btn-memory-close').addEventListener('click', () => this._closeMemory());
    $('btn-pause').addEventListener('click', () => this.game.togglePause());
    $('btn-resume').addEventListener('click', () => this.game.togglePause(false));
    $('btn-journal').addEventListener('click', () => this.game.toggleJournal());
    $('btn-pause-journal').addEventListener('click', () => { this.hidePause(); this.game.toggleJournal(true); });
    $('btn-journal-close').addEventListener('click', () => this.game.toggleJournal(false));
    $('btn-save').addEventListener('click', () => this.game.manualSave());
    $('btn-pause-settings').addEventListener('click', () => { this.hidePause(); this.game.openSettings('pause'); });
    $('btn-pause-restart').addEventListener('click', () => this.game.restart());
    $('btn-puzzle-close').addEventListener('click', () => this.game.closePuzzle());
    $('btn-settings-close').addEventListener('click', () => this.game.closeSettings());
    $('btn-settings-done').addEventListener('click', () => this.game.closeSettings());
    $('btn-ending-continue').addEventListener('click', () => this.game.stayAfterEnding());
    $('btn-ending-new').addEventListener('click', () => this.game.restart());
  }

  _bindSettings() {
    const g = this.game;
    const music = $('set-music'), sfx = $('set-sfx'), sens = $('set-sensitivity'), dist = $('set-distance'), bloom = $('set-bloom'), hints = $('set-hints');
    const sync = () => {
      const s = g.settings;
      music.value = s.music; sfx.value = s.sfx; sens.value = s.sensitivity; dist.value = s.cameraDistance;
      bloom.checked = s.bloom; hints.checked = s.hints;
      $('val-music').textContent = Math.round(s.music * 100) + '%';
      $('val-sfx').textContent = Math.round(s.sfx * 100) + '%';
      $('val-sensitivity').textContent = Number(s.sensitivity).toFixed(1) + '×';
      $('val-distance').textContent = Number(s.cameraDistance).toFixed(1) + 'm';
    };
    this.syncSettings = sync;
    music.addEventListener('input', () => { g.settings.music = +music.value; g.audio.setMusicVolume(g.settings.music); sync(); g.saveSettings(); });
    sfx.addEventListener('input', () => { g.settings.sfx = +sfx.value; g.audio.setSfxVolume(g.settings.sfx); sync(); g.saveSettings(); });
    sens.addEventListener('input', () => { g.settings.sensitivity = +sens.value; g.camera.sensitivity = +sens.value; sync(); g.saveSettings(); });
    dist.addEventListener('input', () => { g.settings.cameraDistance = +dist.value; g.camera.targetDistance = +dist.value; sync(); g.saveSettings(); });
    bloom.addEventListener('change', () => { g.settings.bloom = bloom.checked; g.setBloom(bloom.checked); sync(); g.saveSettings(); });
    hints.addEventListener('change', () => { g.settings.hints = hints.checked; this.el.controlsHint.style.display = hints.checked ? '' : 'none'; sync(); g.saveSettings(); });
    sync();
  }

  _bindTouch() {
    const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.touchMode = isTouch;
    if (!isTouch) return;
    this.el.touchUI.classList.add('active');
    const joy = $('joystick'), knob = joy.querySelector('.joystick-knob');
    let joyId = null, cx = 0, cy = 0;
    const resetJoy = () => { joyId = null; this.game.input.setJoystick(0, 0); knob.style.transform = ''; this.el.touchUI.querySelector('#btn-touch-run').classList.remove('active'); this.touchRun = false; this.game.input.touchRun = false; };
    joy.addEventListener('pointerdown', (e) => {
      joyId = e.pointerId; joy.setPointerCapture(e.pointerId);
      const r = joy.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      this._joyMove(e, cx, cy, knob);
    });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) this._joyMove(e, cx, cy, knob); });
    joy.addEventListener('pointerup', (e) => { if (e.pointerId === joyId) resetJoy(); });
    joy.addEventListener('pointercancel', (e) => { if (e.pointerId === joyId) resetJoy(); });
    const runBtn = $('btn-touch-run');
    runBtn.addEventListener('click', () => {
      this.touchRun = !this.touchRun;
      this.game.input.touchRun = this.touchRun;
      runBtn.classList.toggle('active', this.touchRun);
    });
    $('btn-touch-jump').addEventListener('click', () => this.game.input.queueJump());
    $('btn-touch-interact').addEventListener('click', () => this.game.input.queueInteract());
    $('btn-touch-interact').addEventListener('pointerdown', (e) => { e.preventDefault(); this.game.input.queueInteract(); });
    const look = $('mobile-look-zone');
    let lookId = null, lx = 0, ly = 0;
    look.addEventListener('pointerdown', (e) => { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; look.setPointerCapture(e.pointerId); });
    look.addEventListener('pointermove', (e) => {
      if (e.pointerId !== lookId) return;
      this.game.input.addLook(e.clientX - lx, e.clientY - ly);
      lx = e.clientX; ly = e.clientY;
    });
    const endLook = (e) => { if (e.pointerId === lookId) lookId = null; };
    look.addEventListener('pointerup', endLook);
    look.addEventListener('pointercancel', endLook);
  }

  _joyMove(e, cx, cy, knob) {
    const r = 58;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > r) { dx = dx / len * r; dy = dy / len * r; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.game.input.setJoystick(dx / r, dy / r);
  }

  setTouchVisible(visible) {
    if (this.touchMode) this.el.touchUI.classList.toggle('active', visible);
  }

  showLoading(show) {
    this.el.loading.classList.toggle('hidden', !show);
  }

  showTitle(hasSave) {
    this.el.loading.classList.add('hidden');
    this.el.title.classList.remove('hidden');
    $('btn-continue').classList.toggle('hidden', !hasSave);
    this.el.fade.classList.add('clear');
  }

  hideTitle() { this.el.title.classList.add('hidden'); }

  showIntro() {
    this.el.intro.classList.remove('hidden');
    this.el.hud.classList.add('hidden');
    this.el.bars.classList.add('hidden');
    $('btn-intro').focus();
  }

  hideIntro() { this.el.intro.classList.add('hidden'); }

  showHud() {
    this.el.hud.classList.remove('hidden');
    this.setTouchVisible(true);
  }

  hideHud() { this.el.hud.classList.add('hidden'); this.setTouchVisible(false); }

  setObjective(text, sub = '') {
    this.el.objective.textContent = text;
    this.el.objectiveSub.textContent = sub;
  }

  setMemoryCount(n, total = 7) {
    this.el.memoryCount.textContent = n;
    this.el.memoryCount.parentElement.querySelector('.mem-total').textContent = `/ ${total} memories`;
    this.el.memoryCounter.classList.add('pulse');
    setTimeout(() => this.el.memoryCounter.classList.remove('pulse'), 700);
  }

  showPrompt(text) {
    if (text === this.lastPrompt) return;
    this.lastPrompt = text;
    if (!text) { this.el.prompt.classList.add('hidden'); return; }
    this.el.promptLabel.textContent = text;
    this.el.prompt.classList.remove('hidden');
    // touch: change keycap to a sparkle
    const cap = this.el.prompt.querySelector('.keycap');
    if (cap) cap.textContent = this.touchMode ? '✦' : 'E';
  }

  hidePrompt() { this.lastPrompt = ''; this.el.prompt.classList.add('hidden'); }

  toast(text, kind = '', duration = 3.2) {
    const d = document.createElement('div');
    d.className = 'toast ' + kind;
    d.innerHTML = text;
    this.el.toastStack.appendChild(d);
    while (this.el.toastStack.children.length > 3) this.el.toastStack.firstChild.remove();
    setTimeout(() => {
      d.classList.add('out');
      setTimeout(() => d.remove(), 700);
    }, duration * 1000);
  }

  roomBanner(name) {
    const banner = this.el.roomBanner;
    banner.querySelector('p').textContent = name;
    banner.classList.add('visible');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => banner.classList.remove('visible'), 3200);
  }

  showMemory(memory, onClose) {
    this.memoryCloseCallback = onClose;
    this.el.memoryKicker.textContent = 'Memory recovered';
    this.el.memoryTitle.textContent = memory.title;
    this.el.memoryText.textContent = memory.text;
    this.el.memorySub.textContent = `${memory.sub} · ${memory.index} of ${MEMORIES.length}`;
    this.el.memoryArtScene.innerHTML = ART_SVGS[memory.art] || ART_SVGS[0];
    this.el.btnMemoryClose.textContent = 'Keep it close';
    this.el.memoryCard.classList.remove('hidden');
    setTimeout(() => this.el.btnMemoryClose.focus(), 100);
  }

  showLore(title, text, art = 0) {
    this.memoryCloseCallback = null;
    this.el.memoryKicker.textContent = 'A trace of the house';
    this.el.memoryTitle.textContent = title;
    this.el.memoryText.textContent = text;
    this.el.memorySub.textContent = 'The house keeps its small histories close.';
    this.el.memoryArtScene.innerHTML = ART_SVGS[art % ART_SVGS.length] || ART_SVGS[0];
    this.el.btnMemoryClose.textContent = 'Let it be';
    this.el.memoryCard.classList.remove('hidden');
  }

  _closeMemory() {
    this.el.memoryCard.classList.add('hidden');
    const cb = this.memoryCloseCallback;
    this.memoryCloseCallback = null;
    if (cb) cb();
    else this.game.closeLore();
  }

  showPuzzle(data) {
    this.el.puzzleKicker.textContent = data.kicker || 'A puzzle';
    this.el.puzzleTitle.textContent = data.title || '';
    this.el.puzzleClue.textContent = data.clue || '';
    this.el.puzzleFeedback.textContent = data.feedback || '';
    this.el.puzzleKeys.innerHTML = '';
    data.keys.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = 'puzzle-key';
      b.dataset.index = i;
      b.innerHTML = `<span>${k.symbol}</span>${k.label}`;
      b.addEventListener('click', () => this.game.puzzleKeyPress(i));
      this.el.puzzleKeys.appendChild(b);
    });
    this.el.puzzle.classList.remove('hidden');
  }

  puzzleFeedback(text, kind = '') {
    this.el.puzzleFeedback.textContent = text;
    this.el.puzzleFeedback.style.color = kind === 'wrong' ? '#e6a5a5' : kind === 'right' ? '#b9e8c8' : '';
    this.el.puzzleKeys.querySelectorAll('.puzzle-key').forEach(b => { b.classList.remove('pressed', 'wrong'); });
    const keys = [...this.el.puzzleKeys.querySelectorAll('.puzzle-key')];
    if (kind === 'wrong') keys.forEach(k => k.classList.add('wrong'));
  }

  markPuzzleKey(index) {
    const b = this.el.puzzleKeys.querySelector(`[data-index="${index}"]`);
    if (b) {
      b.classList.add('pressed');
      setTimeout(() => b.classList.remove('pressed'), 250);
    }
  }

  hidePuzzle() { this.el.puzzle.classList.add('hidden'); }

  showJournal(state) {
    const memories = MEMORIES.map(m => {
      const got = state.memories.has(m.id);
      return `<div class="journal-memory ${got ? '' : 'locked'}">
        <div class="num">${String(m.index).padStart(2, '0')}</div>
        <div><h4>${got ? m.title : 'A memory, not yet found'}</h4>
        <p>${got ? m.sub : m.hint}</p></div></div>`;
    }).join('');
    this.el.journalMemories.innerHTML = memories;
    const keys = [...state.items].map(k => `<span class="journal-item">${ITEMS[k]?.icon || '✦'} ${ITEMS[k]?.name || k}</span>`).join('');
    this.el.journalItems.innerHTML = keys || '<p class="journal-empty">Your pockets are full of dust and nothing else.</p>';
    const places = ROOM_ORDER.map(r => {
      const rec = this.game.mansion.roomDefs?.find?.(x => x.id === r);
      const name = rec ? rec.name : r;
      return `<span class="${state.visited.has(r) ? 'visited' : ''}">${state.visited.has(r) ? '✦' : '·'} ${name}</span>`;
    }).join('');
    this.el.journalPlaces.innerHTML = places;
    this.el.journalHint.textContent = state.memories.size === MEMORIES.length
      ? 'All seven memories are yours. Return to the candle shrine in the foyer.'
      : state.memories.size === 0
        ? 'A glimmer in the foyer is waiting to be noticed.'
        : 'The house is full of small histories. Listen closely.';
    this.el.journal.classList.remove('hidden');
  }

  hideJournal() { this.el.journal.classList.add('hidden'); }

  showPause() { this.el.pause.classList.remove('hidden'); this.el.saveNote.textContent = ''; }
  hidePause() { this.el.pause.classList.add('hidden'); }

  showSettings() {
    this.syncSettings?.();
    this.el.settings.classList.remove('hidden');
  }
  hideSettings() { this.el.settings.classList.add('hidden'); }

  setSaveNote(text) {
    this.el.saveNote.textContent = text;
  }

  showEnding(stats) {
    this.el.hud.classList.add('hidden');
    this.setTouchVisible(false);
    this.el.endingText.textContent = ENDING.text;
    this.el.endingStats.innerHTML = `
      <div class="ending-stat"><b>${stats.memories}</b><span>memories</span></div>
      <div class="ending-stat"><b>${stats.places}</b><span>rooms wandered</span></div>
      <div class="ending-stat"><b>${stats.time}</b><span>in the house</span></div>`;
    this.el.ending.classList.remove('hidden');
  }

  hideEnding() { this.el.ending.classList.add('hidden'); }

  showCinematicBars(show) {
    this.el.bars.classList.remove('hidden');
    this.el.bars.classList.toggle('active', show);
    if (!show) setTimeout(() => this.el.bars.classList.add('hidden'), 1000);
  }

  fadeOut(duration = 1) {
    this.el.fade.style.transition = `opacity ${duration}s ease`;
    this.el.fade.classList.remove('clear');
  }

  fadeIn(duration = 1) {
    requestAnimationFrame(() => {
      this.el.fade.style.transition = `opacity ${duration}s ease`;
      this.el.fade.classList.add('clear');
    });
  }
}
