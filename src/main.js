import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Game } from './game/game.js';

const canvas = document.getElementById('scene');
const params = new URLSearchParams(location.search);
const lowQuality = params.get('quality') === 'low';

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !lowQuality,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.38;
renderer.shadowMap.enabled = !lowQuality;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07101a);
scene.fog = new THREE.Fog(0x0a1622, 26, 82);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.06, 160);
camera.position.set(-5.9, 3.15, 12.6);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  lowQuality ? 0 : 0.46,
  0.62,
  0.83,
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

const game = new Game({ scene, camera, renderer, composer, bloomPass, canvas });
game.setBloom(game.settings.bloom && !lowQuality);

const clock = new THREE.Clock();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  game.update(dt);
  if (game.settings.bloom && !lowQuality) composer.render();
  else renderer.render(scene, camera);
}

renderer.setAnimationLoop(frame);

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1 : 2));
  renderer.setSize(w, h);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
}
window.addEventListener('resize', onResize);

// Handy for automated play-testing and for the curious player.
window.__GAME__ = game;
window.__THREE__ = THREE;
window.__GAME_SCENE__ = scene;
