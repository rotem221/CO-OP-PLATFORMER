// ============================================================
// CO-OP PLATFORMER — Phaser 3 Game Logic
// ============================================================

// --- Player Config ---
const PLAYER_COLORS = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];
const PLAYER_COLOR_STRS = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
const PLAYER_KEYS = ['player1', 'player2', 'player3', 'player4'];
const PLAYER_LABELS = ['P1', 'P2', 'P3', 'P4'];
const FACE_TYPES = ['smiley', 'crazy', 'angry', 'cool', 'wink', 'skull'];

function getPlayerTexture(index, face) {
  if (face && FACE_TYPES.includes(face)) return `player${index}_${face}`;
  return PLAYER_KEYS[index];
}

// --- Web Audio API Sound System ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let audioResumed = false;
window._soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
window.toggleSound = function() {
  window._soundEnabled = !window._soundEnabled;
  localStorage.setItem('soundEnabled', window._soundEnabled);
  // Immediately suspend/resume AudioContext to stop/start all audio
  if (audioCtx) {
    if (!window._soundEnabled) {
      audioCtx.suspend().catch(() => {});
    } else {
      audioCtx.resume().catch(() => {});
    }
  }
  return window._soundEnabled;
};

function initAudio() {
  if (!audioCtx) { audioCtx = new AudioCtx(); }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => { audioResumed = true; }).catch(() => {});
  } else { audioResumed = true; }
}

function resumeAudioOnGesture() {
  if (!audioCtx) initAudio();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => { audioResumed = true; }).catch(() => {});
  }
}
document.addEventListener('click', resumeAudioOnGesture, { once: false });
document.addEventListener('touchstart', resumeAudioOnGesture, { once: false });
document.addEventListener('keydown', resumeAudioOnGesture, { once: false });

function playSound(type) {
  if (!window._soundEnabled) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  // If suspended, resume then play (don't drop the sound)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => { _doPlaySound(type); }).catch(() => {});
    return;
  }
  _doPlaySound(type);
}

function _doPlaySound(type) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;

  switch (type) {
    case 'jump': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;
    }
    case 'success': {
      [523, 659, 784].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sine';
        const t = now + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(now); osc.stop(t + 0.25);
      });
      break;
    }
    case 'failure': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
      break;
    }
    case 'plate': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;
    }
    case 'gameover': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc.start(now); osc.stop(now + 1.0);
      break;
    }
    case 'heartPickup': {
      [660, 880, 1100].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sine';
        const t = now + i * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(now); osc.stop(t + 0.2);
      });
      break;
    }
    case 'doorOpen': {
      // Rising shimmer — two sine oscillators sweeping up
      [{ from: 400, to: 1200 }, { from: 600, to: 1800 }].forEach((range) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(range.from, now);
        osc.frequency.exponentialRampToValueAtTime(range.to, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now); osc.stop(now + 0.55);
      });
      break;
    }
  }
}

// --- World Themes ---
const WORLD_THEMES = {
  cyan: {
    bg: '#000011', grid: 0x0a1a2a, platform: 0x00cccc, platformGlow: 0x00ffff,
    spike: 0xff0044, gate: 0xff00ff, laser: 0xff0000, bgStr: '#000011',
  },
  purple: {
    bg: '#0a0014', grid: 0x1a0a2a, platform: 0x9944cc, platformGlow: 0xbb66ff,
    spike: 0xff4400, gate: 0x00ffcc, laser: 0xff44aa, bgStr: '#0a0014',
  },
  fire: {
    bg: '#140800', grid: 0x2a1408, platform: 0xcc6600, platformGlow: 0xff8800,
    spike: 0xff0000, gate: 0x00ccff, laser: 0xffcc00, bgStr: '#140800',
  },
};

// ============================================================
// LEVEL DATA  —  All platforms are reachable with max jump ~115px
// Ground surface is at y ≈ 684 (platform center y=700, h=32)
// Each step between platforms ≤ 90px vertical
// ============================================================
const LEVELS = {
  1: {
    name: 'TUTORIAL',
    theme: 'cyan',
    width: 1280,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 1140, y: 268 },
    platforms: [
      { x: 640, y: 700, w: 1280, h: 32 },
      { x: 250, y: 610, w: 180, h: 20 },
      { x: 480, y: 530, w: 180, h: 20 },
      { x: 710, y: 450, w: 180, h: 20 },
      { x: 940, y: 370, w: 180, h: 20 },
      { x: 1140, y: 300, w: 200, h: 20 },
    ],
    spikes: [],
    pressurePlates: [],
    gates: [],
    movingPlatforms: [],
    lasers: [],
    hearts: [
      { x: 480, y: 500 },
    ],
  },

  2: {
    name: 'COOPERATION',
    theme: 'cyan',
    width: 2800,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 2680, y: 268 },
    platforms: [
      { x: 700, y: 700, w: 1400, h: 32 },
      { x: 1500, y: 700, w: 120, h: 32 },
      { x: 1900, y: 700, w: 700, h: 32 },
      { x: 2550, y: 700, w: 500, h: 32 },
      { x: 2680, y: 610, w: 180, h: 20 },
      { x: 2540, y: 535, w: 180, h: 20 },
      { x: 2680, y: 460, w: 180, h: 20 },
      { x: 2540, y: 385, w: 180, h: 20 },
      { x: 2680, y: 300, w: 200, h: 20 },
    ],
    spikes: [
      { x: 800, y: 688, w: 60, h: 16 },
      { x: 2100, y: 688, w: 60, h: 16 },
    ],
    pressurePlates: [
      { x: 500,  y: 672, w: 64, h: 24, id: 'plateA',  opensGate: 'gateA' },
      { x: 1200, y: 672, w: 64, h: 24, id: 'plateA2', opensGate: 'gateA' },
      { x: 1800, y: 672, w: 64, h: 24, id: 'plateB',  opensGate: 'gateB' },
      { x: 2400, y: 672, w: 64, h: 24, id: 'plateB2', opensGate: 'gateB' },
    ],
    gates: [
      { x: 1050, y: 634, w: 24, h: 132, id: 'gateA' },
      { x: 2150, y: 634, w: 24, h: 132, id: 'gateB' },
    ],
    movingPlatforms: [],
    lasers: [],
    hearts: [
      { x: 1500, y: 660 },
      { x: 2560, y: 500 },
    ],
  },

  3: {
    name: 'CHALLENGE',
    theme: 'cyan',
    width: 3400,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 3180, y: 268 },
    platforms: [
      { x: 500, y: 700, w: 1000, h: 32 },
      { x: 1150, y: 700, w: 120, h: 32 },
      { x: 1500, y: 700, w: 500, h: 32 },
      { x: 2200, y: 700, w: 800, h: 32 },
      { x: 2750, y: 700, w: 160, h: 32 },
      { x: 3100, y: 700, w: 600, h: 32 },
      { x: 300, y: 620, w: 160, h: 20 },
      { x: 520, y: 545, w: 160, h: 20 },
      { x: 740, y: 475, w: 160, h: 20 },
      { x: 1350, y: 620, w: 160, h: 20 },
      { x: 1550, y: 545, w: 160, h: 20 },
      { x: 2050, y: 600, w: 160, h: 20 },
      { x: 2250, y: 530, w: 160, h: 20 },
      { x: 3180, y: 610, w: 180, h: 20 },
      { x: 3040, y: 535, w: 180, h: 20 },
      { x: 3180, y: 460, w: 180, h: 20 },
      { x: 3040, y: 385, w: 180, h: 20 },
      { x: 3180, y: 300, w: 200, h: 20 },
    ],
    spikes: [
      { x: 700, y: 688, w: 60, h: 16 },
      { x: 2500, y: 688, w: 60, h: 16 },
    ],
    pressurePlates: [
      { x: 2350, y: 672, w: 64, h: 24, id: 'plateC',  opensGate: 'gateC' },
      { x: 2750, y: 672, w: 64, h: 24, id: 'plateC2', opensGate: 'gateC' },
      { x: 2900, y: 672, w: 64, h: 24, id: 'plateD',  opensGate: 'gateD' },
      { x: 3200, y: 672, w: 64, h: 24, id: 'plateD2', opensGate: 'gateD' },
    ],
    gates: [
      { x: 2560, y: 634, w: 24, h: 132, id: 'gateC' },
      { x: 3050, y: 634, w: 24, h: 132, id: 'gateD' },
    ],
    movingPlatforms: [
      { x: 1780, y: 620, w: 120, h: 20, moveX: 100, moveY: 0, speed: 60 },
      { x: 1920, y: 520, w: 120, h: 20, moveX: 0, moveY: 100, speed: 50 },
    ],
    lasers: [
      { x: 900,  y: 500, w: 6, h: 220, onTime: 2000, offTime: 1800 },
      { x: 1650, y: 400, w: 6, h: 320, onTime: 1500, offTime: 2000 },
      { x: 2550, y: 450, w: 6, h: 270, onTime: 1800, offTime: 1500 },
    ],
    hearts: [
      { x: 740, y: 445 },
      { x: 1920, y: 480 },
    ],
  },

  4: {
    name: 'MOMENTUM',
    theme: 'purple',
    width: 4000,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 3800, y: 268 },
    platforms: [
      { x: 500, y: 700, w: 1000, h: 32 },
      { x: 1200, y: 700, w: 200, h: 32 },
      { x: 1700, y: 700, w: 600, h: 32 },
      { x: 2300, y: 700, w: 400, h: 32 },
      { x: 2800, y: 700, w: 200, h: 32 },
      { x: 3300, y: 700, w: 600, h: 32 },
      { x: 3800, y: 700, w: 400, h: 32 },
      { x: 400, y: 610, w: 160, h: 20 },
      { x: 650, y: 530, w: 160, h: 20 },
      { x: 900, y: 460, w: 160, h: 20 },
      { x: 1700, y: 600, w: 160, h: 20 },
      { x: 2300, y: 580, w: 160, h: 20 },
      { x: 3800, y: 610, w: 180, h: 20 },
      { x: 3660, y: 535, w: 180, h: 20 },
      { x: 3800, y: 460, w: 180, h: 20 },
      { x: 3660, y: 385, w: 180, h: 20 },
      { x: 3800, y: 300, w: 200, h: 20 },
    ],
    spikes: [
      { x: 800, y: 688, w: 60, h: 16 },
      { x: 1700, y: 688, w: 80, h: 16 },
      { x: 3100, y: 688, w: 60, h: 16 },
    ],
    pressurePlates: [
      { x: 600,  y: 672, w: 64, h: 24, id: 'plateE',  opensGate: 'gateE' },
      { x: 1400, y: 672, w: 64, h: 24, id: 'plateE2', opensGate: 'gateE' },
      { x: 2100, y: 672, w: 64, h: 24, id: 'plateF',  opensGate: 'gateF' },
      { x: 2700, y: 672, w: 64, h: 24, id: 'plateF2', opensGate: 'gateF' },
    ],
    gates: [
      { x: 1050, y: 634, w: 24, h: 132, id: 'gateE' },
      { x: 2550, y: 634, w: 24, h: 132, id: 'gateF' },
    ],
    movingPlatforms: [
      { x: 1350, y: 580, w: 120, h: 20, moveX: 150, moveY: 0, speed: 70 },
      { x: 1950, y: 520, w: 120, h: 20, moveX: 0, moveY: 120, speed: 55 },
      { x: 2600, y: 600, w: 120, h: 20, moveX: 120, moveY: 0, speed: 65 },
      { x: 3100, y: 540, w: 120, h: 20, moveX: 0, moveY: 100, speed: 60 },
    ],
    lasers: [
      { x: 1100, y: 480, w: 6, h: 240, onTime: 1800, offTime: 1600 },
      { x: 2000, y: 400, w: 6, h: 320, onTime: 1500, offTime: 1800 },
      { x: 3000, y: 450, w: 6, h: 270, onTime: 1600, offTime: 1400 },
    ],
    hearts: [
      { x: 650, y: 500 },
      { x: 1950, y: 480 },
      { x: 3100, y: 500 },
    ],
  },

  5: {
    name: 'TEAMWORK',
    theme: 'purple',
    width: 4500,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 4300, y: 268 },
    platforms: [
      { x: 500, y: 700, w: 1000, h: 32 },
      { x: 1200, y: 700, w: 120, h: 32 },
      { x: 1600, y: 700, w: 500, h: 32 },
      { x: 2200, y: 700, w: 600, h: 32 },
      { x: 2900, y: 700, w: 200, h: 32 },
      { x: 3300, y: 700, w: 400, h: 32 },
      { x: 3900, y: 700, w: 600, h: 32 },
      { x: 4400, y: 700, w: 400, h: 32 },
      { x: 350, y: 610, w: 160, h: 20 },
      { x: 600, y: 530, w: 160, h: 20 },
      { x: 850, y: 460, w: 160, h: 20 },
      { x: 1600, y: 600, w: 160, h: 20 },
      { x: 2200, y: 580, w: 160, h: 20 },
      { x: 2600, y: 520, w: 160, h: 20 },
      { x: 3300, y: 600, w: 160, h: 20 },
      { x: 4300, y: 610, w: 180, h: 20 },
      { x: 4160, y: 535, w: 180, h: 20 },
      { x: 4300, y: 460, w: 180, h: 20 },
      { x: 4160, y: 385, w: 180, h: 20 },
      { x: 4300, y: 300, w: 200, h: 20 },
    ],
    spikes: [
      { x: 700, y: 688, w: 60, h: 16 },
      { x: 1600, y: 688, w: 80, h: 16 },
      { x: 2400, y: 688, w: 60, h: 16 },
      { x: 3600, y: 688, w: 80, h: 16 },
    ],
    pressurePlates: [
      { x: 500,  y: 672, w: 64, h: 24, id: 'plateG',  opensGate: 'gateG' },
      { x: 1100, y: 672, w: 64, h: 24, id: 'plateG2', opensGate: 'gateG' },
      { x: 1900, y: 672, w: 64, h: 24, id: 'plateH',  opensGate: 'gateH' },
      { x: 2500, y: 672, w: 64, h: 24, id: 'plateH2', opensGate: 'gateH' },
      { x: 3200, y: 672, w: 64, h: 24, id: 'plateI',  opensGate: 'gateI' },
      { x: 3700, y: 672, w: 64, h: 24, id: 'plateI2', opensGate: 'gateI' },
    ],
    gates: [
      { x: 1050, y: 634, w: 24, h: 132, id: 'gateG' },
      { x: 2100, y: 634, w: 24, h: 132, id: 'gateH' },
      { x: 3500, y: 634, w: 24, h: 132, id: 'gateI' },
    ],
    movingPlatforms: [
      { x: 1350, y: 580, w: 120, h: 20, moveX: 120, moveY: 0, speed: 65 },
      { x: 2050, y: 540, w: 120, h: 20, moveX: 0, moveY: 110, speed: 55 },
      { x: 2800, y: 580, w: 120, h: 20, moveX: 140, moveY: 0, speed: 70 },
      { x: 3600, y: 520, w: 120, h: 20, moveX: 0, moveY: 120, speed: 60 },
    ],
    lasers: [
      { x: 900,  y: 480, w: 6, h: 240, onTime: 1600, offTime: 1500 },
      { x: 1500, y: 400, w: 6, h: 320, onTime: 1400, offTime: 1600 },
      { x: 2300, y: 450, w: 6, h: 270, onTime: 1500, offTime: 1400 },
      { x: 3400, y: 420, w: 6, h: 300, onTime: 1300, offTime: 1500 },
    ],
    hearts: [
      { x: 600, y: 500 },
      { x: 2050, y: 500 },
      { x: 3600, y: 480 },
    ],
  },

  6: {
    name: 'FINAL',
    theme: 'fire',
    width: 5200,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 5000, y: 268 },
    platforms: [
      { x: 500, y: 700, w: 1000, h: 32 },
      { x: 1200, y: 700, w: 120, h: 32 },
      { x: 1600, y: 700, w: 500, h: 32 },
      { x: 2200, y: 700, w: 400, h: 32 },
      { x: 2700, y: 700, w: 200, h: 32 },
      { x: 3100, y: 700, w: 400, h: 32 },
      { x: 3600, y: 700, w: 200, h: 32 },
      { x: 4000, y: 700, w: 400, h: 32 },
      { x: 4500, y: 700, w: 200, h: 32 },
      { x: 4900, y: 700, w: 600, h: 32 },
      { x: 350, y: 610, w: 160, h: 20 },
      { x: 600, y: 530, w: 160, h: 20 },
      { x: 850, y: 460, w: 160, h: 20 },
      { x: 1600, y: 600, w: 160, h: 20 },
      { x: 2200, y: 580, w: 160, h: 20 },
      { x: 2700, y: 520, w: 140, h: 20 },
      { x: 3100, y: 580, w: 160, h: 20 },
      { x: 3600, y: 520, w: 140, h: 20 },
      { x: 4000, y: 580, w: 160, h: 20 },
      { x: 5000, y: 610, w: 180, h: 20 },
      { x: 4860, y: 535, w: 180, h: 20 },
      { x: 5000, y: 460, w: 180, h: 20 },
      { x: 4860, y: 385, w: 180, h: 20 },
      { x: 5000, y: 300, w: 200, h: 20 },
    ],
    spikes: [
      { x: 700, y: 688, w: 80, h: 16 },
      { x: 1600, y: 688, w: 80, h: 16 },
      { x: 2400, y: 688, w: 60, h: 16 },
      { x: 3300, y: 688, w: 80, h: 16 },
      { x: 4200, y: 688, w: 60, h: 16 },
    ],
    pressurePlates: [
      { x: 500,  y: 672, w: 64, h: 24, id: 'plateJ',  opensGate: 'gateJ' },
      { x: 1100, y: 672, w: 64, h: 24, id: 'plateJ2', opensGate: 'gateJ' },
      { x: 1900, y: 672, w: 64, h: 24, id: 'plateK',  opensGate: 'gateK' },
      { x: 2500, y: 672, w: 64, h: 24, id: 'plateK2', opensGate: 'gateK' },
      { x: 3000, y: 672, w: 64, h: 24, id: 'plateL',  opensGate: 'gateL' },
      { x: 3500, y: 672, w: 64, h: 24, id: 'plateL2', opensGate: 'gateL' },
      { x: 4100, y: 672, w: 64, h: 24, id: 'plateM',  opensGate: 'gateM' },
      { x: 4600, y: 672, w: 64, h: 24, id: 'plateM2', opensGate: 'gateM' },
    ],
    gates: [
      { x: 1050, y: 634, w: 24, h: 132, id: 'gateJ' },
      { x: 2100, y: 634, w: 24, h: 132, id: 'gateK' },
      { x: 3400, y: 634, w: 24, h: 132, id: 'gateL' },
      { x: 4650, y: 634, w: 24, h: 132, id: 'gateM' },
    ],
    movingPlatforms: [
      { x: 1350, y: 580, w: 120, h: 20, moveX: 130, moveY: 0, speed: 70 },
      { x: 2050, y: 540, w: 100, h: 20, moveX: 0, moveY: 120, speed: 60 },
      { x: 2600, y: 580, w: 100, h: 20, moveX: 120, moveY: 0, speed: 75 },
      { x: 3300, y: 540, w: 100, h: 20, moveX: 0, moveY: 110, speed: 65 },
      { x: 3900, y: 580, w: 100, h: 20, moveX: 130, moveY: 0, speed: 70 },
      { x: 4400, y: 540, w: 100, h: 20, moveX: 0, moveY: 120, speed: 60 },
    ],
    lasers: [
      { x: 900,  y: 460, w: 6, h: 260, onTime: 1500, offTime: 1400 },
      { x: 1500, y: 380, w: 6, h: 340, onTime: 1300, offTime: 1500 },
      { x: 2300, y: 430, w: 6, h: 290, onTime: 1400, offTime: 1300 },
      { x: 3200, y: 400, w: 6, h: 320, onTime: 1200, offTime: 1400 },
      { x: 4300, y: 440, w: 6, h: 280, onTime: 1300, offTime: 1200 },
    ],
    hearts: [
      { x: 850, y: 430 },
      { x: 2050, y: 500 },
      { x: 3300, y: 500 },
      { x: 4400, y: 500 },
    ],
  },

  7: {
    name: 'GAUNTLET',
    theme: 'cyan',
    width: 3800,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 3600, y: 268 },
    platforms: [
      { x: 400, y: 700, w: 800, h: 32 },
      { x: 1050, y: 700, w: 100, h: 32 },
      { x: 1300, y: 700, w: 300, h: 32 },
      { x: 1800, y: 700, w: 200, h: 32 },
      { x: 2200, y: 700, w: 400, h: 32 },
      { x: 2800, y: 700, w: 200, h: 32 },
      { x: 3200, y: 700, w: 400, h: 32 },
      { x: 3700, y: 700, w: 400, h: 32 },
      { x: 400, y: 610, w: 160, h: 20 },
      { x: 260, y: 535, w: 160, h: 20 },
      { x: 400, y: 460, w: 160, h: 20 },
      { x: 260, y: 385, w: 160, h: 20 },
      { x: 1300, y: 600, w: 120, h: 20 },
      { x: 1550, y: 520, w: 120, h: 20 },
      { x: 1800, y: 600, w: 120, h: 20 },
      { x: 2200, y: 560, w: 140, h: 20 },
      { x: 2600, y: 500, w: 120, h: 20 },
      { x: 2800, y: 580, w: 120, h: 20 },
      { x: 3600, y: 610, w: 180, h: 20 },
      { x: 3460, y: 535, w: 180, h: 20 },
      { x: 3600, y: 460, w: 180, h: 20 },
      { x: 3460, y: 385, w: 180, h: 20 },
      { x: 3600, y: 300, w: 180, h: 20 },
    ],
    spikes: [
      { x: 500, y: 688, w: 60, h: 16 },
      { x: 1050, y: 688, w: 50, h: 16 },
      { x: 1800, y: 688, w: 60, h: 16 },
      { x: 2500, y: 688, w: 50, h: 16 },
      { x: 3000, y: 688, w: 60, h: 16 },
    ],
    pressurePlates: [
      { x: 700,  y: 672, w: 64, h: 24, id: 'plateN',  opensGate: 'gateN' },
      { x: 1500, y: 672, w: 64, h: 24, id: 'plateO',  opensGate: 'gateO' },
      { x: 2400, y: 672, w: 64, h: 24, id: 'plateO2', opensGate: 'gateO' },
    ],
    gates: [
      { x: 1000, y: 634, w: 24, h: 132, id: 'gateN' },
      { x: 2700, y: 634, w: 24, h: 132, id: 'gateO' },
    ],
    movingPlatforms: [
      { x: 1100, y: 560, w: 110, h: 20, moveX: 110, moveY: 0, speed: 70 },
      { x: 2000, y: 540, w: 110, h: 20, moveX: 0, moveY: 100, speed: 60 },
      { x: 3050, y: 560, w: 110, h: 20, moveX: 120, moveY: 0, speed: 75 },
    ],
    lasers: [
      { x: 800,  y: 480, w: 6, h: 240, onTime: 1400, offTime: 1200 },
      { x: 1600, y: 420, w: 6, h: 300, onTime: 1200, offTime: 1400 },
      { x: 2300, y: 460, w: 6, h: 260, onTime: 1300, offTime: 1100 },
      { x: 3100, y: 440, w: 6, h: 280, onTime: 1100, offTime: 1300 },
    ],
    hearts: [
      { x: 550, y: 500 },
      { x: 2200, y: 520 },
      { x: 3050, y: 540 },
    ],
  },

  8: {
    name: 'LABYRINTH',
    theme: 'purple',
    width: 4800,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 4600, y: 268 },
    platforms: [
      { x: 400, y: 700, w: 800, h: 32 },
      { x: 1100, y: 700, w: 100, h: 32 },
      { x: 1400, y: 700, w: 400, h: 32 },
      { x: 2000, y: 700, w: 300, h: 32 },
      { x: 2500, y: 700, w: 400, h: 32 },
      { x: 3100, y: 700, w: 200, h: 32 },
      { x: 3500, y: 700, w: 400, h: 32 },
      { x: 4100, y: 700, w: 200, h: 32 },
      { x: 4500, y: 700, w: 600, h: 32 },
      { x: 300, y: 620, w: 140, h: 20 },
      { x: 550, y: 540, w: 140, h: 20 },
      { x: 300, y: 460, w: 140, h: 20 },
      { x: 550, y: 380, w: 140, h: 20 },
      { x: 1400, y: 600, w: 140, h: 20 },
      { x: 1700, y: 520, w: 120, h: 20 },
      { x: 2000, y: 600, w: 140, h: 20 },
      { x: 2300, y: 520, w: 120, h: 20 },
      { x: 2700, y: 580, w: 140, h: 20 },
      { x: 3000, y: 500, w: 120, h: 20 },
      { x: 3500, y: 580, w: 140, h: 20 },
      { x: 3800, y: 500, w: 120, h: 20 },
      { x: 4100, y: 580, w: 140, h: 20 },
      { x: 4600, y: 610, w: 180, h: 20 },
      { x: 4460, y: 535, w: 180, h: 20 },
      { x: 4600, y: 460, w: 180, h: 20 },
      { x: 4460, y: 385, w: 180, h: 20 },
      { x: 4600, y: 300, w: 180, h: 20 },
    ],
    spikes: [
      { x: 500, y: 688, w: 60, h: 16 },
      { x: 1400, y: 688, w: 80, h: 16 },
      { x: 2200, y: 688, w: 60, h: 16 },
      { x: 3000, y: 688, w: 60, h: 16 },
      { x: 3800, y: 688, w: 80, h: 16 },
      { x: 4300, y: 688, w: 60, h: 16 },
    ],
    pressurePlates: [
      { x: 600,  y: 672, w: 64, h: 24, id: 'plateP',  opensGate: 'gateP' },
      { x: 1200, y: 672, w: 64, h: 24, id: 'plateP2', opensGate: 'gateP' },
      { x: 1800, y: 672, w: 64, h: 24, id: 'plateQ',  opensGate: 'gateQ' },
      { x: 2600, y: 672, w: 64, h: 24, id: 'plateR',  opensGate: 'gateR' },
    ],
    gates: [
      { x: 1050, y: 634, w: 24, h: 132, id: 'gateP' },
      { x: 2400, y: 634, w: 24, h: 132, id: 'gateQ' },
      { x: 3400, y: 634, w: 24, h: 132, id: 'gateR' },
    ],
    movingPlatforms: [
      { x: 1200, y: 560, w: 110, h: 20, moveX: 120, moveY: 0, speed: 65 },
      { x: 1900, y: 520, w: 100, h: 20, moveX: 0, moveY: 110, speed: 55 },
      { x: 2800, y: 560, w: 110, h: 20, moveX: 130, moveY: 0, speed: 70 },
      { x: 3300, y: 520, w: 100, h: 20, moveX: 0, moveY: 120, speed: 60 },
      { x: 4000, y: 560, w: 110, h: 20, moveX: 120, moveY: 0, speed: 75 },
    ],
    lasers: [
      { x: 800,  y: 460, w: 6, h: 260, onTime: 1300, offTime: 1200 },
      { x: 1500, y: 400, w: 6, h: 320, onTime: 1100, offTime: 1300 },
      { x: 2100, y: 440, w: 6, h: 280, onTime: 1200, offTime: 1100 },
      { x: 3200, y: 420, w: 6, h: 300, onTime: 1000, offTime: 1200 },
      { x: 3900, y: 450, w: 6, h: 270, onTime: 1100, offTime: 1000 },
    ],
    hearts: [
      { x: 550, y: 500 },
      { x: 1700, y: 480 },
      { x: 3000, y: 460 },
      { x: 4100, y: 540 },
    ],
  },

  9: {
    name: 'INFERNO',
    theme: 'fire',
    width: 5500,
    height: 720,
    spawns: [
      { x: 100, y: 650 },
      { x: 170, y: 650 },
      { x: 240, y: 650 },
      { x: 310, y: 650 },
    ],
    exit: { x: 5300, y: 268 },
    platforms: [
      { x: 400, y: 700, w: 800, h: 32 },
      { x: 1100, y: 700, w: 100, h: 32 },
      { x: 1400, y: 700, w: 300, h: 32 },
      { x: 1900, y: 700, w: 200, h: 32 },
      { x: 2300, y: 700, w: 400, h: 32 },
      { x: 2900, y: 700, w: 200, h: 32 },
      { x: 3300, y: 700, w: 300, h: 32 },
      { x: 3800, y: 700, w: 200, h: 32 },
      { x: 4200, y: 700, w: 300, h: 32 },
      { x: 4700, y: 700, w: 200, h: 32 },
      { x: 5100, y: 700, w: 600, h: 32 },
      { x: 300, y: 620, w: 140, h: 20 },
      { x: 550, y: 540, w: 140, h: 20 },
      { x: 300, y: 460, w: 140, h: 20 },
      { x: 550, y: 380, w: 140, h: 20 },
      { x: 1400, y: 600, w: 120, h: 20 },
      { x: 1650, y: 520, w: 120, h: 20 },
      { x: 1900, y: 600, w: 120, h: 20 },
      { x: 2300, y: 560, w: 140, h: 20 },
      { x: 2700, y: 500, w: 120, h: 20 },
      { x: 2900, y: 580, w: 120, h: 20 },
      { x: 3300, y: 560, w: 120, h: 20 },
      { x: 3600, y: 480, w: 120, h: 20 },
      { x: 3800, y: 560, w: 120, h: 20 },
      { x: 4200, y: 560, w: 140, h: 20 },
      { x: 4500, y: 480, w: 120, h: 20 },
      { x: 4700, y: 560, w: 120, h: 20 },
      { x: 5300, y: 610, w: 180, h: 20 },
      { x: 5160, y: 535, w: 180, h: 20 },
      { x: 5300, y: 460, w: 180, h: 20 },
      { x: 5160, y: 385, w: 180, h: 20 },
      { x: 5300, y: 300, w: 180, h: 20 },
    ],
    spikes: [
      { x: 500, y: 688, w: 80, h: 16 },
      { x: 1400, y: 688, w: 60, h: 16 },
      { x: 2100, y: 688, w: 80, h: 16 },
      { x: 2900, y: 688, w: 60, h: 16 },
      { x: 3600, y: 688, w: 80, h: 16 },
      { x: 4400, y: 688, w: 60, h: 16 },
      { x: 4900, y: 688, w: 80, h: 16 },
    ],
    pressurePlates: [
      { x: 600,  y: 672, w: 64, h: 24, id: 'plateS',  opensGate: 'gateS' },
      { x: 1200, y: 672, w: 64, h: 24, id: 'plateS2', opensGate: 'gateS' },
      { x: 1800, y: 672, w: 64, h: 24, id: 'plateT',  opensGate: 'gateT' },
      { x: 2600, y: 672, w: 64, h: 24, id: 'plateT2', opensGate: 'gateT' },
      { x: 3400, y: 672, w: 64, h: 24, id: 'plateU',  opensGate: 'gateU' },
      { x: 4300, y: 672, w: 64, h: 24, id: 'plateV',  opensGate: 'gateV' },
    ],
    gates: [
      { x: 1050, y: 634, w: 24, h: 132, id: 'gateS' },
      { x: 2200, y: 634, w: 24, h: 132, id: 'gateT' },
      { x: 3700, y: 634, w: 24, h: 132, id: 'gateU' },
      { x: 4600, y: 634, w: 24, h: 132, id: 'gateV' },
    ],
    movingPlatforms: [
      { x: 1200, y: 560, w: 100, h: 20, moveX: 120, moveY: 0, speed: 75 },
      { x: 1700, y: 520, w: 100, h: 20, moveX: 0, moveY: 110, speed: 65 },
      { x: 2500, y: 560, w: 100, h: 20, moveX: 130, moveY: 0, speed: 70 },
      { x: 3100, y: 520, w: 100, h: 20, moveX: 0, moveY: 120, speed: 60 },
      { x: 3900, y: 560, w: 100, h: 20, moveX: 120, moveY: 0, speed: 80 },
      { x: 4500, y: 520, w: 100, h: 20, moveX: 0, moveY: 110, speed: 70 },
      { x: 5000, y: 560, w: 100, h: 20, moveX: 100, moveY: 0, speed: 75 },
    ],
    lasers: [
      { x: 800,  y: 440, w: 6, h: 280, onTime: 1200, offTime: 1100 },
      { x: 1500, y: 380, w: 6, h: 340, onTime: 1000, offTime: 1200 },
      { x: 2100, y: 420, w: 6, h: 300, onTime: 1100, offTime: 1000 },
      { x: 3000, y: 400, w: 6, h: 320, onTime: 900,  offTime: 1100 },
      { x: 3800, y: 430, w: 6, h: 290, onTime: 1000, offTime: 900 },
      { x: 4600, y: 410, w: 6, h: 310, onTime: 900,  offTime: 1000 },
    ],
    hearts: [
      { x: 550, y: 500 },
      { x: 1650, y: 480 },
      { x: 2700, y: 460 },
      { x: 3600, y: 440 },
      { x: 4500, y: 480 },
    ],
  },
};

// ============================================================
// BOOT SCENE — Procedural Texture Generation
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    initAudio();

    // Generate player textures for all 4 colors (default = smiley)
    PLAYER_COLORS.forEach((color, i) => {
      const g = this.make.graphics({ add: false });
      g.fillStyle(color, 0.2);
      g.fillRoundedRect(0, 0, 36, 52, 6);
      g.fillStyle(color, 1);
      g.fillRoundedRect(4, 4, 28, 44, 4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(10, 14, 6, 6);
      g.fillRect(20, 14, 6, 6);
      g.fillStyle(0x000000, 1);
      g.fillRect(12, 16, 3, 3);
      g.fillRect(22, 16, 3, 3);
      g.generateTexture(PLAYER_KEYS[i], 36, 52);
      g.destroy();
    });

    // Generate face textures: 4 colors x 3 face types
    PLAYER_COLORS.forEach((color, i) => {
      FACE_TYPES.forEach(face => {
        const g = this.make.graphics({ add: false });
        // Body
        g.fillStyle(color, 0.2);
        g.fillRoundedRect(0, 0, 36, 52, 6);
        g.fillStyle(color, 1);
        g.fillRoundedRect(4, 4, 28, 44, 4);

        if (face === 'smiley') {
          // Eyes
          g.fillStyle(0xffffff, 1);
          g.fillRect(10, 14, 6, 6);
          g.fillRect(20, 14, 6, 6);
          g.fillStyle(0x000000, 1);
          g.fillRect(12, 16, 3, 3);
          g.fillRect(22, 16, 3, 3);
          // Smile
          g.lineStyle(2, 0xffffff, 0.8);
          g.beginPath();
          g.arc(18, 28, 6, 0.2, Math.PI - 0.2, false);
          g.strokePath();
        } else if (face === 'crazy') {
          // Spiral eyes (different sizes)
          g.fillStyle(0xffffff, 1);
          g.fillCircle(13, 16, 5);
          g.fillCircle(23, 16, 4);
          g.fillStyle(0x000000, 1);
          g.fillCircle(14, 15, 2);
          g.fillCircle(22, 17, 2);
          // Zigzag mouth
          g.lineStyle(2, 0xffffff, 0.9);
          g.beginPath();
          g.moveTo(10, 30); g.lineTo(14, 26); g.lineTo(18, 32);
          g.lineTo(22, 26); g.lineTo(26, 30);
          g.strokePath();
        } else if (face === 'angry') {
          // Angry brow lines
          g.lineStyle(2, 0xffffff, 0.9);
          g.beginPath();
          g.moveTo(8, 12); g.lineTo(16, 14);
          g.moveTo(28, 12); g.lineTo(20, 14);
          g.strokePath();
          // Eyes
          g.fillStyle(0xffffff, 1);
          g.fillRect(10, 16, 6, 5);
          g.fillRect(20, 16, 6, 5);
          g.fillStyle(0xff0000, 1);
          g.fillRect(12, 17, 3, 3);
          g.fillRect(22, 17, 3, 3);
          // Frown
          g.lineStyle(2, 0xffffff, 0.8);
          g.beginPath();
          g.arc(18, 34, 6, Math.PI + 0.2, -0.2, false);
          g.strokePath();
        } else if (face === 'cool') {
          // Sunglasses bar
          g.fillStyle(0x000000, 0.9);
          g.fillRect(7, 14, 22, 7);
          // Sunglasses lenses
          g.fillStyle(0x222244, 1);
          g.fillRect(8, 15, 8, 5);
          g.fillRect(20, 15, 8, 5);
          // Sunglasses bridge
          g.fillStyle(0x000000, 1);
          g.fillRect(16, 16, 4, 3);
          // Smirk
          g.lineStyle(2, 0xffffff, 0.8);
          g.beginPath();
          g.moveTo(12, 30); g.lineTo(18, 28); g.lineTo(24, 30);
          g.strokePath();
        } else if (face === 'wink') {
          // Left eye (open)
          g.fillStyle(0xffffff, 1);
          g.fillRect(10, 14, 6, 6);
          g.fillStyle(0x000000, 1);
          g.fillRect(12, 16, 3, 3);
          // Right eye (wink line)
          g.lineStyle(2, 0xffffff, 0.9);
          g.beginPath();
          g.moveTo(19, 17); g.lineTo(27, 15);
          g.strokePath();
          // Tongue out smile
          g.lineStyle(2, 0xffffff, 0.8);
          g.beginPath();
          g.arc(18, 28, 6, 0.2, Math.PI - 0.2, false);
          g.strokePath();
          g.fillStyle(0xff4466, 1);
          g.fillCircle(21, 33, 3);
        } else if (face === 'skull') {
          // Eye sockets
          g.fillStyle(0x000000, 0.9);
          g.fillCircle(13, 16, 5);
          g.fillCircle(23, 16, 5);
          // Eye glow
          g.fillStyle(0xffffff, 0.7);
          g.fillCircle(13, 16, 2);
          g.fillCircle(23, 16, 2);
          // Nose
          g.fillStyle(0x000000, 0.8);
          g.fillTriangle(16, 23, 20, 23, 18, 26);
          // Teeth
          g.fillStyle(0xffffff, 0.9);
          for (let t = 0; t < 5; t++) {
            g.fillRect(10 + t * 4, 29, 3, 4);
          }
          g.lineStyle(1, 0x000000, 0.5);
          for (let t = 0; t < 4; t++) {
            g.beginPath();
            g.moveTo(13 + t * 4, 29); g.lineTo(13 + t * 4, 33);
            g.strokePath();
          }
        }

        g.generateTexture(`player${i}_${face}`, 36, 52);
        g.destroy();
      });
    });

    // Platform
    const gp = this.make.graphics({ add: false });
    gp.fillStyle(0x00ffff, 0.15); gp.fillRect(0, 0, 32, 32);
    gp.fillStyle(0x00cccc, 1); gp.fillRect(2, 2, 28, 28);
    gp.lineStyle(1, 0x00ffff, 0.6); gp.strokeRect(2, 2, 28, 28);
    gp.generateTexture('platform', 32, 32); gp.destroy();

    // Spike
    const gs = this.make.graphics({ add: false });
    gs.fillStyle(0xff0044, 0.3); gs.fillTriangle(0, 16, 8, 0, 16, 16);
    gs.fillStyle(0xff0044, 1); gs.fillTriangle(2, 16, 8, 2, 14, 16);
    gs.generateTexture('spike', 16, 16); gs.destroy();

    // Pressure Plate
    const gpp = this.make.graphics({ add: false });
    gpp.fillStyle(0xffff00, 1); gpp.fillRect(0, 2, 56, 10);
    gpp.lineStyle(1, 0xffff00, 0.5); gpp.strokeRect(0, 2, 56, 10);
    gpp.generateTexture('pressurePlate', 56, 12); gpp.destroy();

    // Pressure Plate Pressed
    const gppp = this.make.graphics({ add: false });
    gppp.fillStyle(0x88aa00, 1); gppp.fillRect(0, 6, 56, 6);
    gppp.generateTexture('pressurePlateDown', 56, 12); gppp.destroy();

    // Gate
    const gg = this.make.graphics({ add: false });
    gg.fillStyle(0xff00ff, 0.8);
    for (let i = 0; i < 6; i++) gg.fillRect(4, i * 20, 12, 14);
    gg.lineStyle(1, 0xff00ff, 0.4); gg.strokeRect(0, 0, 20, 120);
    gg.generateTexture('gate', 20, 120); gg.destroy();

    // Exit Door
    const ge = this.make.graphics({ add: false });
    ge.fillStyle(0x00ff00, 0.15); ge.fillRect(0, 0, 48, 64);
    ge.fillStyle(0x00ff00, 0.6); ge.fillRect(4, 4, 40, 56);
    ge.lineStyle(2, 0x00ff00, 1); ge.strokeRect(4, 4, 40, 56);
    ge.fillStyle(0xffffff, 0.8); ge.fillCircle(34, 34, 3);
    ge.generateTexture('exit', 48, 64); ge.destroy();

    // Moving Platform
    const gm = this.make.graphics({ add: false });
    gm.fillStyle(0xffaa00, 0.2); gm.fillRect(0, 0, 120, 20);
    gm.fillStyle(0xffaa00, 1); gm.fillRect(2, 2, 116, 16);
    gm.lineStyle(1, 0xffaa00, 0.6); gm.strokeRect(0, 0, 120, 20);
    gm.generateTexture('movingPlatform', 120, 20); gm.destroy();

    // Laser
    const gl = this.make.graphics({ add: false });
    gl.fillStyle(0xff0000, 0.3); gl.fillRect(0, 0, 6, 8);
    gl.fillStyle(0xff0000, 1); gl.fillRect(1, 0, 4, 8);
    gl.generateTexture('laser', 6, 8); gl.destroy();

    // Heart Pickup
    const gh = this.make.graphics({ add: false });
    gh.fillStyle(0xff0044, 1);
    gh.fillCircle(6, 6, 6); gh.fillCircle(18, 6, 6);
    gh.fillTriangle(0, 8, 12, 22, 24, 8);
    gh.fillStyle(0xff4466, 0.6);
    gh.fillCircle(7, 5, 3);
    gh.generateTexture('heartPickup', 24, 22); gh.destroy();

    // Ground texture (dirt + grass top)
    const gGround = this.make.graphics({ add: false });
    gGround.fillStyle(0x3a2a1a, 1); gGround.fillRect(0, 0, 32, 32);
    gGround.fillStyle(0x4a3a2a, 0.5); gGround.fillRect(0, 8, 32, 8);
    gGround.fillStyle(0x2a6a2a, 1); gGround.fillRect(0, 0, 32, 6);
    gGround.fillStyle(0x3a8a3a, 0.7); gGround.fillRect(0, 0, 32, 3);
    gGround.generateTexture('ground', 32, 32); gGround.destroy();

    const startScene = this.game._isViewer ? 'ViewerGameScene' : 'GameScene';
    this.scene.start(startScene, { level: 1 });
  }
}

// ============================================================
// GAME SCENE — Main Gameplay (supports 1-4 players + AI)
// ============================================================
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.currentLevel = data.level || 1;
    this.isResetting = false;
    this.levelCompleted = false;
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.score = data.score || 0;
    this.levelStartTime = Date.now();
    // Player config
    this.playerCount = data.playerCount || this.game._playerCount || 2;
    this.humanPlayers = data.humanPlayers || this.game._humanPlayers || [0, 1];
    this.playersAtExit = new Set();
  }

  create() {
    const levelData = LEVELS[this.currentLevel];
    if (!levelData) return;
    const theme = WORLD_THEMES[levelData.theme || 'cyan'];

    // --- World bounds ---
    this.physics.world.setBounds(0, 0, levelData.width, levelData.height);
    this.cameras.main.setBackgroundColor(theme.bgStr);

    // --- Gradient sky (viewport-locked, no black bars) ---
    const skyGfx = this.add.graphics();
    const skyColors = { cyan: [0x000011, 0x001133, 0x002255], purple: [0x0a0014, 0x1a0030, 0x2a0050], fire: [0x140800, 0x2a1000, 0x3a1800] };
    const sc = skyColors[levelData.theme] || skyColors.cyan;
    const bandH = Math.ceil(720 / 3);
    for (let b = 0; b < 3; b++) { skyGfx.fillStyle(sc[b], 1); skyGfx.fillRect(0, b * bandH, 1280, bandH); }
    skyGfx.setScrollFactor(0);
    skyGfx.setDepth(-10);

    // --- Parallax stars ---
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, levelData.width);
      const sy = Phaser.Math.Between(0, levelData.height - 100);
      const size = Phaser.Math.FloatBetween(0.5, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
      const star = this.add.circle(sx, sy, size, 0xffffff, alpha);
      star.setScrollFactor(Phaser.Math.FloatBetween(0.05, 0.3));
      star.setDepth(-5);
    }

    // --- Distant hills (parallax) ---
    const hillGfx = this.add.graphics();
    hillGfx.setScrollFactor(0.15); hillGfx.setDepth(-4);
    const hillColor = { cyan: 0x002244, purple: 0x1a0040, fire: 0x2a1200 }[levelData.theme] || 0x002244;
    hillGfx.fillStyle(hillColor, 0.5);
    for (let hx = 0; hx < levelData.width * 0.8; hx += 200) {
      const hh = Phaser.Math.Between(80, 180);
      hillGfx.fillTriangle(hx, levelData.height - 50, hx + 100, levelData.height - 50 - hh, hx + 200, levelData.height - 50);
    }

    // --- Background grid (subtle) ---
    const bg = this.add.graphics();
    bg.lineStyle(1, theme.grid, 0.15);
    for (let x = 0; x < levelData.width; x += 64) { bg.moveTo(x, 0); bg.lineTo(x, levelData.height); }
    for (let y = 0; y < levelData.height; y += 64) { bg.moveTo(0, y); bg.lineTo(levelData.width, y); }
    bg.strokePath(); bg.setDepth(-3);

    // --- Ground layer at bottom ---
    for (let gx = 0; gx < levelData.width; gx += 32) {
      this.add.image(gx + 16, levelData.height - 8, 'ground').setDepth(-1);
    }

    // --- Grass blades on large ground platforms ---
    const grassGfx = this.add.graphics(); grassGfx.setDepth(0);
    const grassColor = { cyan: 0x00aa88, purple: 0x6633aa, fire: 0xaa6600 }[levelData.theme] || 0x00aa88;
    levelData.platforms.forEach(pl => {
      if (pl.h >= 28 && pl.y >= 680) {
        for (let bx = pl.x - pl.w / 2; bx < pl.x + pl.w / 2; bx += 8) {
          const bladeH = Phaser.Math.Between(4, 10);
          grassGfx.fillStyle(grassColor, Phaser.Math.FloatBetween(0.3, 0.6));
          grassGfx.fillTriangle(bx, pl.y - pl.h / 2, bx + 2, pl.y - pl.h / 2 - bladeH, bx + 4, pl.y - pl.h / 2);
        }
      }
    });

    // --- Level name ---
    this.levelText = this.add.text(640, 30, `LEVEL ${this.currentLevel} — ${levelData.name}`, {
      fontFamily: 'Courier New', fontSize: '20px', color: '#888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: this.levelText, alpha: 0, duration: 1000 });
    });

    // --- Ambient floating particles ---
    const ambientColors = { cyan: [0x00ffff, 0x0088aa], purple: [0xbb66ff, 0x8844cc], fire: [0xff8800, 0xff4400] };
    const ac = ambientColors[levelData.theme] || ambientColors.cyan;
    for (let i = 0; i < 25; i++) {
      const px = Phaser.Math.Between(0, levelData.width);
      const py = Phaser.Math.Between(100, levelData.height - 100);
      const dot = this.add.circle(px, py, Phaser.Math.FloatBetween(1, 3), Phaser.Utils.Array.GetRandom(ac), Phaser.Math.FloatBetween(0.1, 0.3));
      dot.setDepth(-2); dot.setScrollFactor(Phaser.Math.FloatBetween(0.3, 0.7));
      this.tweens.add({
        targets: dot, y: py - Phaser.Math.Between(30, 80), alpha: 0, duration: Phaser.Math.Between(3000, 6000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000),
      });
    }

    // --- Platforms ---
    this.platforms = this.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
      this.add.rectangle(p.x, p.y, p.w + 6, p.h + 6, theme.platformGlow, 0.08);
      const plat = this.platforms.create(p.x, p.y, 'platform');
      plat.setDisplaySize(p.w, p.h); plat.refreshBody();
      plat.setTint(theme.platform);
    });

    // --- Spikes ---
    this.spikes = this.physics.add.staticGroup();
    levelData.spikes.forEach(s => {
      this.add.rectangle(s.x, s.y, s.w + 8, s.h + 8, theme.spike, 0.15);
      const numSpikes = Math.floor(s.w / 16);
      for (let i = 0; i < numSpikes; i++) {
        const sx = s.x - s.w / 2 + i * 16 + 8;
        const sp = this.spikes.create(sx, s.y, 'spike');
        sp.setTint(theme.spike);
      }
    });

    // --- Pressure Plates ---
    this.pressurePlateObjects = [];
    this.pressurePlatesGroup = this.physics.add.staticGroup();
    levelData.pressurePlates.forEach(pp => {
      const plate = this.pressurePlatesGroup.create(pp.x, pp.y, 'pressurePlate');
      plate.setDisplaySize(pp.w, 12); plate.refreshBody();
      plate.setData('id', pp.id);
      plate.setData('opensGate', pp.opensGate);
      plate.setData('pressed', false);
      plate.setData('origY', pp.y);
      plate.setData('zoneW', pp.w);
      this.pressurePlateObjects.push(plate);
    });

    // --- Gates ---
    this.gateObjects = new Map();
    this.gatesGroup = this.physics.add.staticGroup();
    levelData.gates.forEach(g => {
      const glow = this.add.rectangle(g.x, g.y, g.w + 10, g.h + 10, theme.gate, 0.1);
      const gate = this.gatesGroup.create(g.x, g.y, 'gate');
      gate.setDisplaySize(g.w, g.h);
      gate.body.setSize(g.w, g.h);
      gate.body.setOffset((gate.width - g.w) / 2, (gate.height - g.h) / 2);
      gate.body.updateFromGameObject();
      gate.setData('id', g.id);
      gate.setData('glow', glow);
      gate.setData('wasOpen', false);
      gate.setTint(theme.gate);
      this.gateObjects.set(g.id, gate);
    });

    // --- Plate indicators ---
    if (levelData.pressurePlates.length > 0) this.buildPlateIndicators(levelData);

    // --- Tutorial text for Level 2 ---
    if (this.currentLevel === 2) {
      const tutText = this.add.text(
        levelData.spawns[0].x + 35, levelData.spawns[0].y - 80,
        'Stand on yellow plates\nto open gates for\nyour partner!',
        { fontFamily: 'Courier New', fontSize: '13px', color: '#ffff00', align: 'center', stroke: '#000', strokeThickness: 3 }
      ).setOrigin(0.5).setDepth(100);
      this.tweens.add({
        targets: tutText, alpha: { from: 0.6, to: 1 }, duration: 800, yoyo: true, repeat: 3,
        onComplete: () => { this.tweens.add({ targets: tutText, alpha: 0, duration: 1000, onComplete: () => tutText.destroy() }); },
      });
    }

    // --- Moving Platforms ---
    this.movingPlatformObjects = [];
    this.movingPlatformsGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    levelData.movingPlatforms.forEach(mp => {
      const plat = this.movingPlatformsGroup.create(mp.x, mp.y, 'movingPlatform');
      plat.setDisplaySize(mp.w, mp.h); plat.body.setSize(mp.w, mp.h);
      plat.setData('config', { originX: mp.x, originY: mp.y, moveX: mp.moveX || 0, moveY: mp.moveY || 0, speed: mp.speed || 60 });
      this.movingPlatformObjects.push(plat);
    });

    // --- Lasers ---
    this.laserObjects = [];
    this.lasersGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    levelData.lasers.forEach(l => {
      const laser = this.lasersGroup.create(l.x, l.y, 'laser');
      laser.setDisplaySize(l.w, l.h); laser.body.setSize(l.w, l.h);
      laser.setData('config', { onTime: l.onTime, offTime: l.offTime, offset: Math.random() * (l.onTime + l.offTime) });
      laser.setTint(theme.laser);
      // Inner glow
      const glow = this.add.rectangle(l.x, l.y, l.w + 12, l.h + 4, theme.laser, 0.15);
      // Outer wide glow for dramatic effect
      const outerGlow = this.add.rectangle(l.x, l.y, l.w + 30, l.h + 10, theme.laser, 0.06);
      this.tweens.add({ targets: outerGlow, alpha: { from: 0.03, to: 0.1 }, duration: 600, yoyo: true, repeat: -1 });
      laser.setData('glow', glow);
      laser.setData('outerGlow', outerGlow);
      this.laserObjects.push(laser);
    });

    // --- Exit Door ---
    this.exitDoor = this.physics.add.staticSprite(levelData.exit.x, levelData.exit.y, 'exit');
    this.exitDoor.setDisplaySize(48, 64); this.exitDoor.refreshBody();
    this.exitGlow = this.add.rectangle(levelData.exit.x, levelData.exit.y, 60, 76, 0x00ff00, 0.1);
    this.tweens.add({ targets: this.exitGlow, alpha: { from: 0.05, to: 0.2 }, scaleX: { from: 1, to: 1.1 }, scaleY: { from: 1, to: 1.1 }, duration: 1000, yoyo: true, repeat: -1 });

    // --- Collectible Hearts ---
    this.heartPickups = this.physics.add.staticGroup();
    this.collectedHearts = new Set();
    if (levelData.hearts) {
      levelData.hearts.forEach((h, idx) => {
        const heart = this.heartPickups.create(h.x, h.y, 'heartPickup');
        heart.setData('heartIndex', idx);
        heart.refreshBody();
        // Glow
        const glow = this.add.circle(h.x, h.y, 16, 0xff0044, 0.12);
        heart.setData('glow', glow);
        // Bob animation
        this.tweens.add({
          targets: [heart, glow], y: h.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      });
    }

    // --- Players (dynamic count) ---
    this.players = [];
    this.playerLabels = [];
    const names = this._playerNames || {};
    const faces = this.game._playerFaces || {};

    for (let i = 0; i < this.playerCount; i++) {
      const spawn = levelData.spawns[i] || levelData.spawns[0];
      const tex = getPlayerTexture(i, faces[i]);
      const p = this.physics.add.sprite(spawn.x, spawn.y, tex);
      p.setBounce(0.05);
      p.setCollideWorldBounds(true);
      p.body.setMaxVelocity(260, 600);
      p.setDepth(10);
      p.playerIndex = i;
      p._coyoteTimer = 0;
      p._jumpBuffer = 0;
      this.players.push(p);

      // Name label
      const isAI = !this.humanPlayers.includes(i);
      const labelText = isAI ? '\uD83E\uDD16 AI' : (names[i] || PLAYER_LABELS[i]);
      const label = this.add.text(0, 0, labelText, {
        fontFamily: 'Courier New', fontSize: '11px', color: PLAYER_COLOR_STRS[i],
      }).setOrigin(0.5).setDepth(11);
      this.playerLabels.push(label);
    }

    // --- Colliders & Overlaps (all players) ---
    this.players.forEach(p => {
      this.physics.add.collider(p, this.platforms);
      this.physics.add.collider(p, this.gatesGroup);
      this.physics.add.collider(p, this.movingPlatformsGroup);
      this.physics.add.overlap(p, this.spikes, this.onHazardHit, null, this);
      this.physics.add.overlap(p, this.lasersGroup, this.onLaserHit, null, this);
      this.physics.add.overlap(p, this.heartPickups, this.onHeartPickup, null, this);
    });

    // --- Input state (all 4 slots) ---
    this.inputState = {};
    for (let i = 0; i < 4; i++) {
      this.inputState[i] = { left: false, right: false, jump: false };
    }

    // --- Socket listeners ---
    if (this._socket) {
      this._socket.off('player-input');
      this._socket.on('player-input', (data) => {
        if (this.inputState[data.playerIndex] !== undefined) {
          this.inputState[data.playerIndex] = data.input;
        }
      });
      this._socket.off('lives-update');
      this._socket.on('lives-update', ({ lives }) => {
        this.lives = lives;
        this.updateHeartsDisplay();
      });
    }

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, levelData.width, levelData.height);

    // --- Death flash ---
    this.deathFlash = this.add.rectangle(640, 360, 1280, 720, 0xff0000, 0).setScrollFactor(0).setDepth(200);

    // --- HUD ---
    this.buildHUD();
  }

  // === HUD ===
  buildHUD() {
    this.heartIcons = [];
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(24 + i * 28, 56, '\u2764', {
        fontSize: '20px', color: '#ff0044',
      }).setScrollFactor(0).setDepth(250).setAlpha(i < this.lives ? 1 : 0.15);
      this.heartIcons.push(heart);
    }
    this.scoreText = this.add.text(1256, 56, `SCORE: ${this.score}`, {
      fontFamily: 'Courier New', fontSize: '16px', color: '#ffff00',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(250);
  }

  updateHeartsDisplay() {
    this.heartIcons.forEach((h, i) => { h.setAlpha(i < this.lives ? 1 : 0.15); });
  }

  onHeartPickup(player, heart) {
    const idx = heart.getData('heartIndex');
    if (this.collectedHearts.has(idx)) return;
    this.collectedHearts.add(idx);

    if (this.lives < 5) {
      this.lives += 1;
      this.updateHeartsDisplay();
      if (this._socket && this._roomCode) {
        this._socket.emit('heart-collected', { roomCode: this._roomCode, heartIndex: idx });
      }
    }

    playSound('heartPickup');

    // Particle burst
    for (let i = 0; i < 8; i++) {
      const px = heart.x + Phaser.Math.Between(-10, 10);
      const py = heart.y + Phaser.Math.Between(-10, 10);
      const c = this.add.circle(px, py, Phaser.Math.Between(2, 5), 0xff0044, 0.8);
      this.tweens.add({
        targets: c, y: py - Phaser.Math.Between(20, 50), alpha: 0, scaleX: 0, scaleY: 0,
        duration: 400, onComplete: () => c.destroy(),
      });
    }

    // Remove heart + glow
    const glow = heart.getData('glow');
    if (glow) glow.destroy();
    heart.destroy();
  }

  updateScoreDisplay() {
    if (this.scoreText) this.scoreText.setText(`SCORE: ${this.score}`);
  }

  // === Plate indicators ===
  buildPlateIndicators(levelData) {
    levelData.pressurePlates.forEach(pp => {
      const matchingGate = levelData.gates.find(g => g.id === pp.opensGate);
      if (!matchingGate) return;
      const lineGfx = this.add.graphics();
      lineGfx.lineStyle(2, 0xffff00, 0.2);
      const dx = matchingGate.x - pp.x, dy = matchingGate.y - pp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dashLen = 10, gapLen = 8;
      const steps = Math.floor(dist / (dashLen + gapLen));
      for (let i = 0; i < steps; i++) {
        const t1 = (i * (dashLen + gapLen)) / dist;
        const t2 = Math.min((i * (dashLen + gapLen) + dashLen) / dist, 1);
        lineGfx.moveTo(pp.x + dx * t1, pp.y + dy * t1);
        lineGfx.lineTo(pp.x + dx * t2, pp.y + dy * t2);
      }
      lineGfx.strokePath(); lineGfx.setDepth(0);
      const label = this.add.text(pp.x, pp.y - 24, '\u25BC STAND \u25BC', {
        fontFamily: 'Courier New', fontSize: '9px', color: '#ffff00', align: 'center', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);
      this.tweens.add({ targets: label, alpha: { from: 0.4, to: 1 }, y: pp.y - 28, duration: 800, yoyo: true, repeat: -1 });
    });
  }

  // === UPDATE LOOP ===
  update(time, delta) {
    if (this.levelCompleted || !this.players || this.players.length === 0) return;

    // Human player movement
    this.humanPlayers.forEach(idx => {
      if (idx < this.players.length) {
        this.handleMovement(this.players[idx], this.inputState[idx], idx);
      }
    });

    // AI player movement
    for (let i = 0; i < this.playerCount; i++) {
      if (!this.humanPlayers.includes(i) && i < this.players.length) {
        this.updateAIPlayer(this.players[i], i);
      }
    }

    // Name labels follow players
    this.playerLabels.forEach((label, i) => {
      if (label && this.players[i]) label.setPosition(this.players[i].x, this.players[i].y - 36);
    });

    this.updatePressurePlates();
    this.updateMovingPlatforms(time);
    this.updateLasers(time);
    this.checkExit();
    this.updateCamera();

    // Fall death
    if (this.players.some(p => p.y > 750)) this.onHazardHit();

    // Broadcast state to viewers (~15 fps)
    if (this._socket && this._roomCode) {
      if (!this._lastBroadcast || time - this._lastBroadcast > 33) {
        this._lastBroadcast = time;
        const playerStates = this.players.map((p, i) => ({
          idx: i, x: Math.round(p.x), y: Math.round(p.y),
        }));
        const pressedPlates = this.pressurePlateObjects
          .filter(pl => pl.getData('pressed'))
          .map(pl => pl.getData('id'));
        const openGates = [...this.gateObjects.entries()]
          .filter(([, g]) => g.getData('wasOpen'))
          .map(([id]) => id);

        this._socket.volatile.emit('game-state-update', {
          roomCode: this._roomCode,
          players: playerStates,
          plates: pressedPlates,
          gates: openGates,
          collectedHearts: [...this.collectedHearts],
          lasers: this.laserObjects.map(l => l.active),
          movPlats: this.movingPlatformObjects.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
        });
      }
    }
  }

  handleMovement(player, input, playerIndex) {
    if (!input) return;
    if (input.left) player.setVelocityX(-260);
    else if (input.right) player.setVelocityX(260);
    else player.setVelocityX(0);

    // Coyote time: allow jump for 6 frames (~100ms) after leaving ground
    if (player.body.blocked.down) {
      player._coyoteTimer = 6;
    } else if (player._coyoteTimer > 0) {
      player._coyoteTimer--;
    }

    // Jump buffer: remember jump press for 6 frames (~100ms)
    if (input.jump) {
      player._jumpBuffer = 6;
    } else if (player._jumpBuffer > 0) {
      player._jumpBuffer--;
    }

    // Execute jump if both conditions met
    if (player._jumpBuffer > 0 && player._coyoteTimer > 0) {
      player.setVelocityY(-490);
      player._coyoteTimer = 0;
      player._jumpBuffer = 0;
      playSound('jump');
      this.spawnJumpParticles(player.x, player.y + 24, PLAYER_COLORS[playerIndex] || 0x00ffff);
    }
  }

  // === AI Follow Logic ===
  updateAIPlayer(aiPlayer, index) {
    // Find closest human player to follow
    let target = null, minDist = Infinity;
    this.humanPlayers.forEach(hi => {
      if (hi >= this.players.length) return;
      const hp = this.players[hi];
      const dist = Math.abs(hp.x - aiPlayer.x) + Math.abs(hp.y - aiPlayer.y);
      if (dist < minDist) { minDist = dist; target = hp; }
    });
    if (!target) return;

    const dx = target.x - aiPlayer.x;
    const dy = target.y - aiPlayer.y;

    // Move toward target horizontally
    if (dx < -20) aiPlayer.setVelocityX(-260);
    else if (dx > 20) aiPlayer.setVelocityX(260);
    else aiPlayer.setVelocityX(0);

    // Stuck detection — if AI hasn't moved for ~1 second, force jump
    if (!aiPlayer._stuckCounter) aiPlayer._stuckCounter = 0;
    if (aiPlayer._lastAIX === undefined) aiPlayer._lastAIX = aiPlayer.x;
    if (Math.abs(aiPlayer.x - aiPlayer._lastAIX) < 2 && aiPlayer.body.blocked.down) {
      aiPlayer._stuckCounter++;
    } else {
      aiPlayer._stuckCounter = 0;
    }
    aiPlayer._lastAIX = aiPlayer.x;

    // Jump logic
    if (aiPlayer.body.blocked.down) {
      // Force jump if stuck for too long (~1 sec at 60fps)
      if (aiPlayer._stuckCounter > 60) {
        aiPlayer.setVelocityY(-490);
        aiPlayer._stuckCounter = 0;
      }
      // Jump if target is above (lowered threshold for better staircase nav)
      else if (dy < -30) {
        aiPlayer.setVelocityY(-490);
      }
      // Jump if moving toward target but blocked by a wall
      else if ((dx > 30 && aiPlayer.body.blocked.right) || (dx < -30 && aiPlayer.body.blocked.left)) {
        aiPlayer.setVelocityY(-490);
      }
      // Jump over small gaps — if target is ahead and far enough
      else if (Math.abs(dx) > 100 && Math.abs(dy) < 60) {
        const velX = aiPlayer.body.velocity.x;
        if (Math.abs(velX) > 150) {
          if (Math.random() < 0.03) {
            aiPlayer.setVelocityY(-490);
          }
        }
      }
    }
  }

  spawnJumpParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const p = this.add.circle(x + Phaser.Math.Between(-12, 12), y, Phaser.Math.Between(2, 4), color, 0.7);
      this.tweens.add({ targets: p, y: y + Phaser.Math.Between(10, 25), alpha: 0, scaleX: 0, scaleY: 0, duration: 300, onComplete: () => p.destroy() });
    }
  }

  // === Pressure Plates ===
  isPlayerOnPlate(player, plate) {
    const zoneW = plate.getData('zoneW') || 64;
    const halfW = zoneW / 2 + 10;
    const dx = Math.abs(player.x - plate.x);
    const dy = player.y + player.displayHeight / 2 - plate.y;
    return dx < halfW && dy > -40 && dy < 20;
  }

  updatePressurePlates() {
    const gateOpen = new Map();
    this.pressurePlateObjects.forEach(plate => {
      const gateId = plate.getData('opensGate');
      // Check ALL players (human + AI)
      const isOnPlate = this.players.some(p => this.isPlayerOnPlate(p, plate));
      plate.setData('pressed', isOnPlate);
      if (isOnPlate) gateOpen.set(gateId, true);
      else if (!gateOpen.has(gateId)) gateOpen.set(gateId, false);
    });

    for (const [gateId, isOpen] of gateOpen) {
      const gate = this.gateObjects.get(gateId);
      if (!gate) continue;
      const wasOpen = gate.getData('wasOpen') || false;
      if (isOpen) {
        gate.body.enable = false;
        gate.setAlpha(0.12);
        const glow = gate.getData('glow');
        if (glow) glow.setAlpha(0.03);
        if (!wasOpen) {
          playSound('plate');
          this.tweens.add({ targets: gate, alpha: { from: 0.6, to: 0.12 }, duration: 300 });
        }
      } else {
        gate.body.enable = true;
        gate.setAlpha(1);
        const glow = gate.getData('glow');
        if (glow) glow.setAlpha(0.1);
      }
      gate.setData('wasOpen', isOpen);
    }

    this.pressurePlateObjects.forEach(plate => {
      plate.setTexture(plate.getData('pressed') ? 'pressurePlateDown' : 'pressurePlate');
    });
  }

  // === Moving Platforms ===
  updateMovingPlatforms(time) {
    this.movingPlatformObjects.forEach(plat => {
      const cfg = plat.getData('config');
      const t = time * 0.001;
      if (cfg.moveX) plat.x = cfg.originX + Math.sin(t * (cfg.speed / 60)) * cfg.moveX;
      if (cfg.moveY) plat.y = cfg.originY + Math.sin(t * (cfg.speed / 60)) * cfg.moveY;
      plat.body.updateFromGameObject();
    });
  }

  // === Lasers ===
  updateLasers(time) {
    this.laserObjects.forEach(laser => {
      const cfg = laser.getData('config');
      const cycle = cfg.onTime + cfg.offTime;
      const phase = (time + cfg.offset) % cycle;
      const isOn = phase < cfg.onTime;
      const glow = laser.getData('glow');
      const outerGlow = laser.getData('outerGlow');
      if (isOn) {
        laser.setActive(true).setVisible(true);
        laser.body.enable = true;
        laser.setAlpha(0.7 + Math.sin(time * 0.015) * 0.3);
        if (glow) { glow.setVisible(true); glow.setAlpha(0.1 + Math.sin(time * 0.01) * 0.08); }
        if (outerGlow) outerGlow.setVisible(true);
      } else {
        laser.setActive(false).setVisible(false);
        laser.body.enable = false;
        if (glow) glow.setVisible(false);
        if (outerGlow) outerGlow.setVisible(false);
      }
    });
  }

  onLaserHit(player, laser) {
    if (laser.active) this.onHazardHit();
  }

  // === Hazard Hit (Shared Fate + Lives) ===
  onHazardHit() {
    if (this.isResetting || this.levelCompleted) return;
    this.isResetting = true;
    playSound('failure');
    this.cameras.main.shake(300, 0.015);
    this.lives = Math.max(0, this.lives - 1);

    if (this.lives >= 0 && this.heartIcons[this.lives]) {
      this.tweens.add({
        targets: this.heartIcons[this.lives], alpha: 0.15, scaleX: 1.8, scaleY: 1.8,
        duration: 400, yoyo: false,
        onComplete: () => { if (this.heartIcons[this.lives]) this.heartIcons[this.lives].setScale(1); },
      });
    }

    this.tweens.add({ targets: this.deathFlash, alpha: { from: 0.4, to: 0 }, duration: 500 });

    if (this._socket && this._roomCode) {
      this._socket.emit('player-died', { roomCode: this._roomCode });
    }

    if (this.lives <= 0) {
      this.tweens.add({
        targets: this.players, alpha: 0, duration: 600,
        onComplete: () => {
          this.time.delayedCall(400, () => {
            this.scene.start('GameOverScene', { level: this.currentLevel, score: this.score });
          });
        },
      });
      return;
    }

    this.tweens.add({
      targets: this.players, alpha: 0, duration: 80, yoyo: true, repeat: 4,
      onComplete: () => {
        if (!this.scene || !this.scene.isActive()) return;
        const levelData = LEVELS[this.currentLevel];
        if (!levelData) return;
        this.players.forEach((p, i) => {
          if (!p || !p.body) return;
          const spawn = levelData.spawns[i] || levelData.spawns[0];
          p.setPosition(spawn.x, spawn.y);
          p.setVelocity(0, 0);
          p.setAlpha(1);
        });
        this.isResetting = false;
      },
    });
  }

  // === Exit Check ===
  checkExit() {
    const doorBounds = this.exitDoor.getBounds();
    this.playersAtExit.clear();
    this.players.forEach((p, i) => {
      if (Phaser.Geom.Rectangle.Overlaps(doorBounds, p.getBounds())) {
        this.playersAtExit.add(i);
      }
    });
    this.exitGlow.setFillStyle(0x00ff00, this.playersAtExit.size > 0 ? 0.3 : 0.1);
    if (this.playersAtExit.size === this.playerCount) this.levelComplete();
  }

  levelComplete() {
    if (this.levelCompleted) return;
    this.levelCompleted = true;
    const levelTime = Date.now() - this.levelStartTime;
    const doorX = this.exitDoor.x;
    const doorY = this.exitDoor.y;

    // --- Phase 1: Door Opening Animation (500ms) ---
    playSound('doorOpen');

    // Tween door tint green → white
    this.exitDoor.setTint(0x00ff00);
    this.tweens.addCounter({
      from: 0, to: 100, duration: 400,
      onUpdate: (t) => {
        const v = Math.floor((t.getValue() / 100) * 255);
        const tint = Phaser.Display.Color.GetColor(v, 255, v);
        this.exitDoor.setTint(tint);
      },
    });

    // Scale door up with bounce
    this.tweens.add({ targets: this.exitDoor, scaleX: 1.3, scaleY: 1.15, duration: 400, ease: 'Back.easeOut' });

    // Expand glow
    this.tweens.add({ targets: this.exitGlow, alpha: 0.6, scaleX: 1.5, scaleY: 1.5, duration: 300 });

    // White circle burst
    const burst = this.add.circle(doorX, doorY, 8, 0xffffff, 0.8).setDepth(250);
    this.tweens.add({ targets: burst, scaleX: 6, scaleY: 6, alpha: 0, duration: 500, onComplete: () => burst.destroy() });

    // 12 radial white particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const p = this.add.circle(doorX, doorY, 3, 0xffffff, 0.9).setDepth(250);
      this.tweens.add({
        targets: p,
        x: doorX + Math.cos(angle) * 80,
        y: doorY + Math.sin(angle) * 80,
        alpha: 0, duration: 500,
        onComplete: () => p.destroy(),
      });
    }

    // --- Phase 2: After 500ms — celebration + transition ---
    this.time.delayedCall(500, () => {
      playSound('success');

      // Celebration particles
      for (let i = 0; i < 20; i++) {
        this.time.delayedCall(i * 50, () => {
          const x = doorX + Phaser.Math.Between(-60, 60);
          const y = doorY + Phaser.Math.Between(-40, 40);
          const colors = [0x00ff00, 0x00ffff, 0xff00ff, 0xffff00];
          const c = this.add.circle(x, y, Phaser.Math.Between(3, 7), Phaser.Utils.Array.GetRandom(colors), 0.8);
          this.tweens.add({ targets: c, y: y - Phaser.Math.Between(30, 80), alpha: 0, duration: 600, onComplete: () => c.destroy() });
        });
      }

      if (this.currentLevel < 9) {
        const nextLevel = this.currentLevel + 1;
        if (this._socket && this._roomCode) {
          this._socket.emit('level-complete', { roomCode: this._roomCode, nextLevel, levelTime });
        }
        const transText = this.add.text(640, 360, `LEVEL ${nextLevel}`, {
          fontFamily: 'Courier New', fontSize: '48px', color: '#00ff00', stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
        this.tweens.add({
          targets: transText, alpha: 1, duration: 500, yoyo: true, hold: 800,
          onComplete: () => {
            transText.destroy();
            this.scene.restart({ level: nextLevel, lives: this.lives, score: this.score, playerCount: this.playerCount, humanPlayers: this.humanPlayers });
          },
        });
      } else {
        if (this._socket && this._roomCode) {
          this._socket.emit('game-over', { roomCode: this._roomCode, levelTime });
        }
        this.time.delayedCall(1500, () => { this.scene.start('VictoryScene'); });
      }
    });
  }

  // === Camera ===
  updateCamera() {
    if (!this.players || this.players.length === 0) return;
    const midX = this.players.reduce((s, p) => s + p.x, 0) / this.players.length;
    const midY = this.players.reduce((s, p) => s + p.y, 0) / this.players.length;
    this.cameras.main.centerOn(midX, midY);
  }

  // Clean up socket listeners when scene shuts down
  shutdown() {
    if (this._socket) {
      this._socket.off('player-input');
    }
  }
}

// ============================================================
// VIEWER GAME SCENE — Display-only for remote viewers
// Receives state from host, no physics input, no socket emits
// ============================================================
class ViewerGameScene extends Phaser.Scene {
  constructor() { super('ViewerGameScene'); }

  init(data) {
    this.currentLevel = data.level || 1;
    this.playerCount = data.playerCount || this.game._playerCount || 2;
    this.humanPlayers = data.humanPlayers || this.game._humanPlayers || [0, 1];
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.score = data.score || 0;
  }

  create() {
    const levelData = LEVELS[this.currentLevel];
    if (!levelData) return;
    const theme = WORLD_THEMES[levelData.theme || 'cyan'];

    // --- World bounds ---
    this.physics.world.setBounds(0, 0, levelData.width, levelData.height);
    this.physics.world.gravity.y = 0; // No gravity for viewer
    this.cameras.main.setBackgroundColor(theme.bgStr);

    // --- Gradient sky (viewport-locked, no black bars) ---
    const skyGfx = this.add.graphics();
    const skyColors = { cyan: [0x000011, 0x001133, 0x002255], purple: [0x0a0014, 0x1a0030, 0x2a0050], fire: [0x140800, 0x2a1000, 0x3a1800] };
    const sc = skyColors[levelData.theme] || skyColors.cyan;
    const bandH = Math.ceil(720 / 3);
    for (let b = 0; b < 3; b++) { skyGfx.fillStyle(sc[b], 1); skyGfx.fillRect(0, b * bandH, 1280, bandH); }
    skyGfx.setScrollFactor(0);
    skyGfx.setDepth(-10);

    // --- Parallax stars ---
    for (let i = 0; i < 80; i++) {
      const sx = Phaser.Math.Between(0, levelData.width);
      const sy = Phaser.Math.Between(0, levelData.height - 100);
      const size = Phaser.Math.FloatBetween(0.5, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.5);
      const star = this.add.circle(sx, sy, size, 0xffffff, alpha);
      star.setScrollFactor(Phaser.Math.FloatBetween(0.05, 0.3));
      star.setDepth(-5);
    }

    // --- Distant hills ---
    const hillGfx = this.add.graphics();
    hillGfx.setScrollFactor(0.15); hillGfx.setDepth(-4);
    const hillColor = { cyan: 0x002244, purple: 0x1a0040, fire: 0x2a1200 }[levelData.theme] || 0x002244;
    hillGfx.fillStyle(hillColor, 0.5);
    for (let hx = 0; hx < levelData.width * 0.8; hx += 200) {
      const hh = Phaser.Math.Between(80, 180);
      hillGfx.fillTriangle(hx, levelData.height - 50, hx + 100, levelData.height - 50 - hh, hx + 200, levelData.height - 50);
    }

    // --- Background grid (subtle) ---
    const bg = this.add.graphics();
    bg.lineStyle(1, theme.grid, 0.15);
    for (let x = 0; x < levelData.width; x += 64) { bg.moveTo(x, 0); bg.lineTo(x, levelData.height); }
    for (let y = 0; y < levelData.height; y += 64) { bg.moveTo(0, y); bg.lineTo(levelData.width, y); }
    bg.strokePath(); bg.setDepth(-3);

    // --- Ground layer ---
    for (let gx = 0; gx < levelData.width; gx += 32) {
      this.add.image(gx + 16, levelData.height - 8, 'ground').setDepth(-1);
    }

    // --- Grass blades ---
    const grassGfx = this.add.graphics(); grassGfx.setDepth(0);
    const grassColor = { cyan: 0x00aa88, purple: 0x6633aa, fire: 0xaa6600 }[levelData.theme] || 0x00aa88;
    levelData.platforms.forEach(pl => {
      if (pl.h >= 28 && pl.y >= 680) {
        for (let bx = pl.x - pl.w / 2; bx < pl.x + pl.w / 2; bx += 8) {
          const bladeH = Phaser.Math.Between(4, 10);
          grassGfx.fillStyle(grassColor, Phaser.Math.FloatBetween(0.3, 0.6));
          grassGfx.fillTriangle(bx, pl.y - pl.h / 2, bx + 2, pl.y - pl.h / 2 - bladeH, bx + 4, pl.y - pl.h / 2);
        }
      }
    });

    // --- Level name ---
    this.levelText = this.add.text(640, 30, `LEVEL ${this.currentLevel} — ${levelData.name}`, {
      fontFamily: 'Courier New', fontSize: '20px', color: '#888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: this.levelText, alpha: 0, duration: 1000 });
    });

    // --- Ambient floating particles ---
    const ambientColors = { cyan: [0x00ffff, 0x0088aa], purple: [0xbb66ff, 0x8844cc], fire: [0xff8800, 0xff4400] };
    const ac = ambientColors[levelData.theme] || ambientColors.cyan;
    for (let i = 0; i < 25; i++) {
      const px = Phaser.Math.Between(0, levelData.width);
      const py = Phaser.Math.Between(100, levelData.height - 100);
      const dot = this.add.circle(px, py, Phaser.Math.FloatBetween(1, 3), Phaser.Utils.Array.GetRandom(ac), Phaser.Math.FloatBetween(0.1, 0.3));
      dot.setDepth(-2); dot.setScrollFactor(Phaser.Math.FloatBetween(0.3, 0.7));
      this.tweens.add({
        targets: dot, y: py - Phaser.Math.Between(30, 80), alpha: 0, duration: Phaser.Math.Between(3000, 6000),
        yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 3000),
      });
    }

    // --- Platforms (visual only) ---
    levelData.platforms.forEach(p => {
      this.add.rectangle(p.x, p.y, p.w + 6, p.h + 6, theme.platformGlow, 0.08);
      const plat = this.add.image(p.x, p.y, 'platform');
      plat.setDisplaySize(p.w, p.h);
      plat.setTint(theme.platform);
    });

    // --- Spikes (visual only) ---
    levelData.spikes.forEach(s => {
      this.add.rectangle(s.x, s.y, s.w + 8, s.h + 8, theme.spike, 0.15);
      const numSpikes = Math.floor(s.w / 16);
      for (let i = 0; i < numSpikes; i++) {
        const sx = s.x - s.w / 2 + i * 16 + 8;
        const sp = this.add.image(sx, s.y, 'spike');
        sp.setTint(theme.spike);
      }
    });

    // --- Pressure Plates (visual) ---
    this.pressurePlateObjects = [];
    levelData.pressurePlates.forEach(pp => {
      const plate = this.add.image(pp.x, pp.y, 'pressurePlate');
      plate.setDisplaySize(pp.w, 12);
      plate.setData('id', pp.id);
      plate.setData('opensGate', pp.opensGate);
      this.pressurePlateObjects.push(plate);
    });

    // --- Gates (visual) ---
    this.gateObjects = new Map();
    levelData.gates.forEach(g => {
      const glow = this.add.rectangle(g.x, g.y, g.w + 10, g.h + 10, theme.gate, 0.1);
      const gate = this.add.image(g.x, g.y, 'gate');
      gate.setDisplaySize(g.w, g.h);
      gate.setData('id', g.id);
      gate.setData('glow', glow);
      gate.setTint(theme.gate);
      this.gateObjects.set(g.id, gate);
    });

    // --- Plate indicators ---
    if (levelData.pressurePlates.length > 0) {
      levelData.pressurePlates.forEach(pp => {
        const matchingGate = levelData.gates.find(g => g.id === pp.opensGate);
        if (!matchingGate) return;
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(2, 0xffff00, 0.2);
        const dx = matchingGate.x - pp.x, dy = matchingGate.y - pp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dashLen = 10, gapLen = 8;
        const steps = Math.floor(dist / (dashLen + gapLen));
        for (let i = 0; i < steps; i++) {
          const t1 = (i * (dashLen + gapLen)) / dist;
          const t2 = Math.min((i * (dashLen + gapLen) + dashLen) / dist, 1);
          lineGfx.moveTo(pp.x + dx * t1, pp.y + dy * t1);
          lineGfx.lineTo(pp.x + dx * t2, pp.y + dy * t2);
        }
        lineGfx.strokePath(); lineGfx.setDepth(0);
        const label = this.add.text(pp.x, pp.y - 24, '\u25BC STAND \u25BC', {
          fontFamily: 'Courier New', fontSize: '9px', color: '#ffff00', align: 'center', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(5);
        this.tweens.add({ targets: label, alpha: { from: 0.4, to: 1 }, y: pp.y - 28, duration: 800, yoyo: true, repeat: -1 });
      });
    }

    // --- Moving Platforms ---
    this.movingPlatformObjects = [];
    levelData.movingPlatforms.forEach(mp => {
      const plat = this.add.image(mp.x, mp.y, 'movingPlatform');
      plat.setDisplaySize(mp.w, mp.h);
      plat.setData('config', { originX: mp.x, originY: mp.y, moveX: mp.moveX || 0, moveY: mp.moveY || 0, speed: mp.speed || 60 });
      this.movingPlatformObjects.push(plat);
    });

    // --- Lasers ---
    this.laserObjects = [];
    levelData.lasers.forEach(l => {
      const laser = this.add.image(l.x, l.y, 'laser');
      laser.setDisplaySize(l.w, l.h);
      laser.setData('config', { onTime: l.onTime, offTime: l.offTime, offset: Math.random() * (l.onTime + l.offTime) });
      laser.setTint(theme.laser);
      const glow = this.add.rectangle(l.x, l.y, l.w + 12, l.h + 4, theme.laser, 0.15);
      laser.setData('glow', glow);
      this.laserObjects.push(laser);
    });

    // --- Exit Door ---
    this.exitDoor = this.add.image(levelData.exit.x, levelData.exit.y, 'exit');
    this.exitDoor.setDisplaySize(48, 64);
    this.exitGlow = this.add.rectangle(levelData.exit.x, levelData.exit.y, 60, 76, 0x00ff00, 0.1);
    this.tweens.add({ targets: this.exitGlow, alpha: { from: 0.05, to: 0.2 }, scaleX: { from: 1, to: 1.1 }, scaleY: { from: 1, to: 1.1 }, duration: 1000, yoyo: true, repeat: -1 });

    // --- Collectible Hearts (visual) ---
    this.heartPickupSprites = [];
    if (levelData.hearts) {
      levelData.hearts.forEach((h, idx) => {
        const heart = this.add.image(h.x, h.y, 'heartPickup');
        heart.setData('heartIndex', idx);
        const glow = this.add.circle(h.x, h.y, 16, 0xff0044, 0.12);
        heart.setData('glow', glow);
        this.tweens.add({
          targets: [heart, glow], y: h.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.heartPickupSprites.push(heart);
      });
    }

    // --- Players (sprites only, no physics) ---
    this.players = [];
    this.playerLabels = [];
    const names = this._playerNames || {};
    const faces = this.game._playerFaces || {};

    for (let i = 0; i < this.playerCount; i++) {
      const spawn = levelData.spawns[i] || levelData.spawns[0];
      const tex = getPlayerTexture(i, faces[i]);
      const p = this.add.sprite(spawn.x, spawn.y, tex);
      p.setDepth(10);
      p.playerIndex = i;
      p.targetX = spawn.x;
      p.targetY = spawn.y;
      this.players.push(p);

      // Name label
      const isAI = !this.humanPlayers.includes(i);
      const labelText = isAI ? '\uD83E\uDD16 AI' : (names[i] || PLAYER_LABELS[i]);
      const label = this.add.text(0, 0, labelText, {
        fontFamily: 'Courier New', fontSize: '11px', color: PLAYER_COLOR_STRS[i],
      }).setOrigin(0.5).setDepth(11);
      this.playerLabels.push(label);
    }

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, levelData.width, levelData.height);

    // --- Death flash ---
    this.deathFlash = this.add.rectangle(640, 360, 1280, 720, 0xff0000, 0).setScrollFactor(0).setDepth(200);

    // --- HUD ---
    this.heartIcons = [];
    for (let i = 0; i < 5; i++) {
      const heart = this.add.text(24 + i * 28, 56, '\u2764', {
        fontSize: '20px', color: '#ff0044',
      }).setScrollFactor(0).setDepth(250).setAlpha(i < this.lives ? 1 : 0.15);
      this.heartIcons.push(heart);
    }
    this.scoreText = this.add.text(1256, 56, `SCORE: ${this.score}`, {
      fontFamily: 'Courier New', fontSize: '16px', color: '#ffff00',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(250);

    // "VIEWER" badge
    this.add.text(640, 690, 'VIEWER MODE', {
      fontFamily: 'Courier New', fontSize: '12px', color: '#555',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(250);

    // Clean up listeners on scene shutdown
    this.events.once('shutdown', this.shutdown, this);

    // --- Socket listeners for state ---
    if (this._socket) {
      this._socket.off('game-state-update');
      this._socket.on('game-state-update', (data) => {
        // Update player positions
        if (data.players) {
          data.players.forEach(pd => {
            const p = this.players[pd.idx];
            if (p) {
              p.targetX = pd.x;
              p.targetY = pd.y;
            }
          });
        }
        // Update pressure plates
        if (data.plates) {
          this.pressurePlateObjects.forEach(plate => {
            const isPressed = data.plates.includes(plate.getData('id'));
            plate.setTexture(isPressed ? 'pressurePlateDown' : 'pressurePlate');
          });
        }
        // Update gates
        if (data.gates) {
          for (const [gateId, gate] of this.gateObjects) {
            const isOpen = data.gates.includes(gateId);
            gate.setAlpha(isOpen ? 0.12 : 1);
            const glow = gate.getData('glow');
            if (glow) glow.setAlpha(isOpen ? 0.03 : 0.1);
          }
        }
        // Remove collected hearts
        if (data.collectedHearts) {
          data.collectedHearts.forEach(idx => {
            const hs = this.heartPickupSprites[idx];
            if (hs && hs.active) {
              const glow = hs.getData('glow');
              if (glow) glow.destroy();
              hs.destroy();
            }
          });
        }
        // Sync lasers from host
        if (data.lasers && this.laserObjects) {
          data.lasers.forEach((isOn, i) => {
            const laser = this.laserObjects[i];
            if (!laser) return;
            const glow = laser.getData('glow');
            if (isOn) {
              laser.setVisible(true).setAlpha(0.85);
              if (glow) { glow.setVisible(true); glow.setAlpha(0.12); }
            } else {
              laser.setVisible(false);
              if (glow) glow.setVisible(false);
            }
          });
        }
        // Sync moving platforms from host
        if (data.movPlats && this.movingPlatformObjects) {
          data.movPlats.forEach((pos, i) => {
            const plat = this.movingPlatformObjects[i];
            if (plat) { plat.x = pos.x; plat.y = pos.y; }
          });
        }
      });

      this._socket.off('lives-update');
      this._socket.on('lives-update', ({ lives }) => {
        this.lives = lives;
        this.heartIcons.forEach((h, i) => { h.setAlpha(i < this.lives ? 1 : 0.15); });
        // Death flash + shake
        this.cameras.main.shake(300, 0.015);
        this.tweens.add({ targets: this.deathFlash, alpha: { from: 0.4, to: 0 }, duration: 500 });
      });

      this._socket.off('level-transition');
      this._socket.on('level-transition', ({ nextLevel, score, lives }) => {
        playSound('success');
        // Celebration particles
        for (let i = 0; i < 15; i++) {
          this.time.delayedCall(i * 50, () => {
            const x = this.exitDoor.x + Phaser.Math.Between(-60, 60);
            const y = this.exitDoor.y + Phaser.Math.Between(-40, 40);
            const colors = [0x00ff00, 0x00ffff, 0xff00ff, 0xffff00];
            const c = this.add.circle(x, y, Phaser.Math.Between(3, 7), Phaser.Utils.Array.GetRandom(colors), 0.8);
            this.tweens.add({ targets: c, y: y - Phaser.Math.Between(30, 80), alpha: 0, duration: 600, onComplete: () => c.destroy() });
          });
        }
        const transText = this.add.text(640, 360, `LEVEL ${nextLevel}`, {
          fontFamily: 'Courier New', fontSize: '48px', color: '#00ff00', stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);
        this.tweens.add({
          targets: transText, alpha: 1, duration: 500, yoyo: true, hold: 800,
          onComplete: () => {
            transText.destroy();
            this.scene.restart({ level: nextLevel, lives: lives, score: score, playerCount: this.playerCount, humanPlayers: this.humanPlayers });
          },
        });
      });

      this._socket.off('game-over-lives');
      this._socket.on('game-over-lives', ({ score, level }) => {
        this.scene.start('GameOverScene', { level: level || this.currentLevel, score: score || 0 });
      });

      this._socket.off('game-victory');
      this._socket.on('game-victory', ({ score, lives }) => {
        this.game._finalScore = score || 0;
        this.game._finalLives = lives || 0;
        this.scene.start('VictoryScene');
      });

    }
  }

  // Clean up socket listeners when scene shuts down
  shutdown() {
    if (this._socket) {
      this._socket.off('game-state-update');
      this._socket.off('lives-update');
      this._socket.off('level-transition');
      this._socket.off('game-over-lives');
      this._socket.off('game-victory');
    }
  }

  update(time, delta) {
    if (!this.players || this.players.length === 0) return;

    // Smooth interpolation toward target positions (lerp factor based on delta)
    const lerpFactor = Math.min(1, delta * 0.015);
    this.players.forEach((p, i) => {
      if (!p || p.targetX === undefined) return;
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      // Snap if very close or very far (teleport), otherwise lerp
      if (Math.abs(dx) > 300 || Math.abs(dy) > 300 || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) {
        p.x = p.targetX;
        p.y = p.targetY;
      } else {
        p.x += dx * lerpFactor;
        p.y += dy * lerpFactor;
      }
    });

    // Update labels
    this.playerLabels.forEach((label, i) => {
      if (label && this.players[i]) label.setPosition(this.players[i].x, this.players[i].y - 36);
    });

    // Moving platforms & lasers: synced from host via game-state-update (no local computation)

    // Camera centroid
    const midX = this.players.reduce((s, p) => s + p.x, 0) / this.players.length;
    const midY = this.players.reduce((s, p) => s + p.y, 0) / this.players.length;
    this.cameras.main.centerOn(midX, midY);
  }
}

// ============================================================
// VICTORY SCENE (with Scoreboard)
// ============================================================
class VictoryScene extends Phaser.Scene {
  constructor() { super('VictoryScene'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const score = this.game._finalScore || 0;
    const lives = this.game._finalLives || 0;
    const names = this.game._playerNames || {};
    const playerCount = this.game._playerCount || 2;
    const humanPlayers = this.game._humanPlayers || [0, 1];

    const title = this.add.text(640, 140, 'VICTORY!', {
      fontFamily: 'Courier New', fontSize: '64px', color: '#00ff00',
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: { from: 0.6, to: 1 }, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(640, 220, 'All levels complete!', { fontFamily: 'Courier New', fontSize: '24px', color: '#0ff' }).setOrigin(0.5);
    this.add.text(640, 260, 'Great teamwork!', { fontFamily: 'Courier New', fontSize: '20px', color: '#f0f' }).setOrigin(0.5);

    const boardY = 320;
    this.add.text(640, boardY, '--- SCOREBOARD ---', { fontFamily: 'Courier New', fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    this.add.text(640, boardY + 40, `Total Score: ${score}`, { fontFamily: 'Courier New', fontSize: '28px', color: '#ffff00' }).setOrigin(0.5);
    const heartsStr = lives > 0 ? Array(lives).fill('\u2764').join('  ') : 'None';
    this.add.text(640, boardY + 80, `Lives Remaining: ${heartsStr}`, { fontFamily: 'Courier New', fontSize: '18px', color: '#ff0044' }).setOrigin(0.5);

    // Dynamic player names
    this.add.text(640, boardY + 115, 'Players:', { fontFamily: 'Courier New', fontSize: '16px', color: '#888' }).setOrigin(0.5);
    const totalWidth = playerCount * 120;
    const startX = 640 - totalWidth / 2 + 60;
    for (let i = 0; i < playerCount; i++) {
      const isAI = !humanPlayers.includes(i);
      const name = isAI ? '\uD83E\uDD16 AI' : (names[i] || PLAYER_LABELS[i]);
      this.add.text(startX + i * 120, boardY + 140, name, {
        fontFamily: 'Courier New', fontSize: '16px', color: PLAYER_COLOR_STRS[i],
      }).setOrigin(0.5);
    }

    // Particles
    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        const x = Phaser.Math.Between(100, 1180), y = Phaser.Math.Between(50, 670);
        const colors = [0x00ff00, 0x00ffff, 0xff00ff, 0xffff00, 0xff8800];
        const c = this.add.circle(x, y, Phaser.Math.Between(2, 6), Phaser.Utils.Array.GetRandom(colors), 0.6);
        this.tweens.add({ targets: c, y: y - Phaser.Math.Between(20, 60), alpha: 0, duration: Phaser.Math.Between(500, 1200), onComplete: () => c.destroy() });
      },
    });

    // Play Again button (available for all — host and viewer)
    const btnY = boardY + 200;
    const playAgainBg = this.add.rectangle(640, btnY, 240, 56, 0x00ff00, 0.15).setInteractive({ useHandCursor: true });
    this.add.rectangle(640, btnY, 240, 56).setStrokeStyle(2, 0x00ff00);
    this.add.text(640, btnY, 'PLAY AGAIN', { fontFamily: 'Courier New', fontSize: '22px', color: '#00ff00' }).setOrigin(0.5);
    playAgainBg.on('pointerover', () => playAgainBg.setFillStyle(0x00ff00, 0.3));
    playAgainBg.on('pointerout', () => playAgainBg.setFillStyle(0x00ff00, 0.15));
    playAgainBg.on('pointerdown', () => {
      if (this._socket && this._roomCode) this._socket.emit('play-again', { roomCode: this._roomCode });
    });

    this._socket = this.game._socket;
    this._roomCode = this.game._roomCode;
    playSound('success');
  }
}

// ============================================================
// GAME OVER SCENE
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.failedLevel = data.level || 1;
    this.finalScore = data.score || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    this._socket = this.game._socket;
    this._roomCode = this.game._roomCode;
    const names = this.game._playerNames || {};
    const playerCount = this.game._playerCount || 2;
    const humanPlayers = this.game._humanPlayers || [0, 1];

    const title = this.add.text(640, 180, 'GAME OVER', { fontFamily: 'Courier New', fontSize: '56px', color: '#ff0044' }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: { from: 0.4, to: 1 }, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(640, 280, `Score: ${this.finalScore}`, { fontFamily: 'Courier New', fontSize: '28px', color: '#ffff00' }).setOrigin(0.5);
    this.add.text(640, 330, `Failed at Level ${this.failedLevel}`, { fontFamily: 'Courier New', fontSize: '18px', color: '#888' }).setOrigin(0.5);

    // Dynamic player names
    const totalWidth = playerCount * 120;
    const startX = 640 - totalWidth / 2 + 60;
    for (let i = 0; i < playerCount; i++) {
      const isAI = !humanPlayers.includes(i);
      const name = isAI ? '\uD83E\uDD16 AI' : (names[i] || PLAYER_LABELS[i]);
      this.add.text(startX + i * 120, 380, name, {
        fontFamily: 'Courier New', fontSize: '16px', color: PLAYER_COLOR_STRS[i],
      }).setOrigin(0.5);
    }

    // TRY AGAIN (same level)
    const retryBg = this.add.rectangle(640, 440, 260, 50, 0xff0044, 0.15).setInteractive({ useHandCursor: true });
    this.add.rectangle(640, 440, 260, 50).setStrokeStyle(2, 0xff0044);
    this.add.text(640, 440, 'TRY AGAIN', { fontFamily: 'Courier New', fontSize: '20px', color: '#ff0044' }).setOrigin(0.5);
    retryBg.on('pointerover', () => retryBg.setFillStyle(0xff0044, 0.3));
    retryBg.on('pointerout', () => retryBg.setFillStyle(0xff0044, 0.15));
    retryBg.on('pointerdown', () => {
      if (this._socket && this._roomCode) this._socket.emit('try-again', { roomCode: this._roomCode });
    });

    // RESTART FROM LEVEL 1
    const restartBg = this.add.rectangle(640, 510, 260, 50, 0xffaa00, 0.15).setInteractive({ useHandCursor: true });
    this.add.rectangle(640, 510, 260, 50).setStrokeStyle(2, 0xffaa00);
    this.add.text(640, 510, 'RESTART', { fontFamily: 'Courier New', fontSize: '20px', color: '#ffaa00' }).setOrigin(0.5);
    restartBg.on('pointerover', () => restartBg.setFillStyle(0xffaa00, 0.3));
    restartBg.on('pointerout', () => restartBg.setFillStyle(0xffaa00, 0.15));
    restartBg.on('pointerdown', () => {
      if (this._socket && this._roomCode) this._socket.emit('restart-game', { roomCode: this._roomCode });
    });

    if (this._socket) {
      this._socket.off('retry-level');
      this._socket.on('retry-level', ({ level, lives, score }) => {
        const targetScene = this.game._isViewer ? 'ViewerGameScene' : 'GameScene';
        this.scene.start(targetScene, { level, lives, score, playerCount, humanPlayers });
      });
    }

    // Falling particles
    this.time.addEvent({
      delay: 150, loop: true, callback: () => {
        const x = Phaser.Math.Between(50, 1230);
        const c = this.add.circle(x, 0, Phaser.Math.Between(1, 4), 0xff0044, 0.4);
        this.tweens.add({ targets: c, y: 720, alpha: 0, duration: Phaser.Math.Between(1500, 3000), onComplete: () => c.destroy() });
      },
    });
    playSound('gameover');
  }
}

// ============================================================
// CREATE GAME — Called from index.html when game starts
// ============================================================
function createGame(socket, roomCode, playerNames, playerCount, humanPlayers, isViewer, playerFaces) {
  const scenes = isViewer
    ? [BootScene, ViewerGameScene, VictoryScene, GameOverScene]
    : [BootScene, GameScene, VictoryScene, GameOverScene];

  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000011',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: isViewer ? 0 : 900 }, debug: false } },
    scene: scenes,
  };

  const game = new Phaser.Game(config);

  game._socket = socket;
  game._roomCode = roomCode;
  game._playerNames = playerNames || {};
  game._playerCount = playerCount || 2;
  game._humanPlayers = humanPlayers || [0, 1];
  game._isViewer = isViewer || false;
  game._playerFaces = playerFaces || {};
  game._finalScore = 0;
  game._finalLives = 0;

  const sceneNames = isViewer
    ? ['ViewerGameScene', 'VictoryScene', 'GameOverScene']
    : ['GameScene', 'VictoryScene', 'GameOverScene'];

  // Inject references into scenes
  game.events.on('ready', () => {
    sceneNames.forEach(name => {
      const scene = game.scene.getScene(name);
      if (scene) {
        scene._socket = socket;
        scene._roomCode = roomCode;
        scene._playerNames = playerNames;
      }
    });
  });

  game.events.on('step', () => {
    sceneNames.forEach(name => {
      const scene = game.scene.getScene(name);
      if (scene && !scene._socket) {
        scene._socket = socket;
        scene._roomCode = roomCode;
        scene._playerNames = playerNames;
      }
    });
  });

  return game;
}
