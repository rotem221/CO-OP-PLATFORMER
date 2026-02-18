// ============================================================
// CO-OP PLATFORMER — Phaser 3 Game Logic
// ============================================================

// --- Player Config ---
const PLAYER_COLORS = [0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];
const PLAYER_COLOR_STRS = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
const PLAYER_KEYS = ['player1', 'player2', 'player3', 'player4'];
const PLAYER_LABELS = ['P1', 'P2', 'P3', 'P4'];

// --- Web Audio API Sound System ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let audioResumed = false;

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
  if (!audioCtx) initAudio();
  if (!audioCtx || audioCtx.state === 'suspended') {
    if (audioCtx) audioCtx.resume().catch(() => {});
    return;
  }
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
  }
}

// ============================================================
// LEVEL DATA  —  All platforms are reachable with max jump ~115px
// Ground surface is at y ≈ 684 (platform center y=700, h=32)
// Each step between platforms ≤ 90px vertical
// ============================================================
const LEVELS = {
  1: {
    name: 'TUTORIAL',
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
  },

  2: {
    name: 'COOPERATION',
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
      { x: 2400, y: 610, w: 180, h: 20 },
      { x: 2560, y: 530, w: 180, h: 20 },
      { x: 2400, y: 450, w: 180, h: 20 },
      { x: 2560, y: 370, w: 180, h: 20 },
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
  },

  3: {
    name: 'CHALLENGE',
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
      { x: 3100, y: 610, w: 180, h: 20 },
      { x: 3260, y: 530, w: 180, h: 20 },
      { x: 3100, y: 450, w: 180, h: 20 },
      { x: 3260, y: 370, w: 180, h: 20 },
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
  },
};

// ============================================================
// BOOT SCENE — Procedural Texture Generation
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    initAudio();

    // Generate player textures for all 4 colors
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

    this.scene.start('GameScene', { level: 1 });
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

    // --- World bounds ---
    this.physics.world.setBounds(0, 0, levelData.width, levelData.height);
    this.cameras.main.setBackgroundColor('#000000');

    // --- Background grid ---
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x0a1a2a, 0.3);
    for (let x = 0; x < levelData.width; x += 64) { bg.moveTo(x, 0); bg.lineTo(x, levelData.height); }
    for (let y = 0; y < levelData.height; y += 64) { bg.moveTo(0, y); bg.lineTo(levelData.width, y); }
    bg.strokePath();

    // --- Level name ---
    this.levelText = this.add.text(640, 30, `LEVEL ${this.currentLevel} — ${levelData.name}`, {
      fontFamily: 'Courier New', fontSize: '20px', color: '#888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: this.levelText, alpha: 0, duration: 1000 });
    });

    // --- Platforms ---
    this.platforms = this.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
      this.add.rectangle(p.x, p.y, p.w + 6, p.h + 6, 0x00ffff, 0.08);
      const plat = this.platforms.create(p.x, p.y, 'platform');
      plat.setDisplaySize(p.w, p.h); plat.refreshBody();
    });

    // --- Spikes ---
    this.spikes = this.physics.add.staticGroup();
    levelData.spikes.forEach(s => {
      this.add.rectangle(s.x, s.y, s.w + 8, s.h + 8, 0xff0044, 0.15);
      const numSpikes = Math.floor(s.w / 16);
      for (let i = 0; i < numSpikes; i++) {
        const sx = s.x - s.w / 2 + i * 16 + 8;
        this.spikes.create(sx, s.y, 'spike');
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
      const glow = this.add.rectangle(g.x, g.y, g.w + 10, g.h + 10, 0xff00ff, 0.1);
      const gate = this.gatesGroup.create(g.x, g.y, 'gate');
      gate.setDisplaySize(g.w, g.h);
      gate.body.setSize(g.w, g.h);
      gate.body.setOffset((gate.width - g.w) / 2, (gate.height - g.h) / 2);
      gate.body.updateFromGameObject();
      gate.setData('id', g.id);
      gate.setData('glow', glow);
      gate.setData('wasOpen', false);
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
      const glow = this.add.rectangle(l.x, l.y, l.w + 12, l.h + 4, 0xff0000, 0.15);
      laser.setData('glow', glow);
      this.laserObjects.push(laser);
    });

    // --- Exit Door ---
    this.exitDoor = this.physics.add.staticSprite(levelData.exit.x, levelData.exit.y, 'exit');
    this.exitDoor.setDisplaySize(48, 64); this.exitDoor.refreshBody();
    this.exitGlow = this.add.rectangle(levelData.exit.x, levelData.exit.y, 60, 76, 0x00ff00, 0.1);
    this.tweens.add({ targets: this.exitGlow, alpha: { from: 0.05, to: 0.2 }, scaleX: { from: 1, to: 1.1 }, scaleY: { from: 1, to: 1.1 }, duration: 1000, yoyo: true, repeat: -1 });

    // --- Players (dynamic count) ---
    this.players = [];
    this.playerLabels = [];
    const names = this._playerNames || {};

    for (let i = 0; i < this.playerCount; i++) {
      const spawn = levelData.spawns[i] || levelData.spawns[0];
      const p = this.physics.add.sprite(spawn.x, spawn.y, PLAYER_KEYS[i]);
      p.setBounce(0.05);
      p.setCollideWorldBounds(true);
      p.body.setMaxVelocity(200, 500);
      p.setDepth(10);
      p.playerIndex = i;
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
    for (let i = 0; i < 3; i++) {
      const heart = this.add.text(24 + i * 32, 56, '\u2764', {
        fontSize: '24px', color: '#ff0044',
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
    if (this.levelCompleted) return;

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
  }

  handleMovement(player, input, playerIndex) {
    if (!input) return;
    if (input.left) player.setVelocityX(-200);
    else if (input.right) player.setVelocityX(200);
    else player.setVelocityX(0);

    if (input.jump && player.body.blocked.down) {
      player.setVelocityY(-430);
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
    if (dx < -20) aiPlayer.setVelocityX(-200);
    else if (dx > 20) aiPlayer.setVelocityX(200);
    else aiPlayer.setVelocityX(0);

    // Jump logic
    if (aiPlayer.body.blocked.down) {
      // Jump if target is significantly above
      if (dy < -40) {
        aiPlayer.setVelocityY(-430);
      }
      // Jump if moving toward target but blocked by a wall
      else if ((dx > 30 && aiPlayer.body.blocked.right) || (dx < -30 && aiPlayer.body.blocked.left)) {
        aiPlayer.setVelocityY(-430);
      }
      // Jump over small gaps — if target is ahead and far enough
      else if (Math.abs(dx) > 100 && Math.abs(dy) < 60) {
        // Simple gap detection: check if AI is near an edge
        // This triggers a jump when target is far ahead on roughly the same level
        const velX = aiPlayer.body.velocity.x;
        if (Math.abs(velX) > 150) {
          // Only jump occasionally to avoid constant jumping
          if (Math.random() < 0.03) {
            aiPlayer.setVelocityY(-430);
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
      if (isOn) {
        laser.setActive(true).setVisible(true);
        laser.body.enable = true;
        laser.setAlpha(0.7 + Math.sin(time * 0.015) * 0.3);
        if (glow) { glow.setVisible(true); glow.setAlpha(0.1 + Math.sin(time * 0.01) * 0.08); }
      } else {
        laser.setActive(false).setVisible(false);
        laser.body.enable = false;
        if (glow) glow.setVisible(false);
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
    this.lives -= 1;

    if (this.heartIcons[this.lives]) {
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
        const levelData = LEVELS[this.currentLevel];
        this.players.forEach((p, i) => {
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
    playSound('success');
    const levelTime = Date.now() - this.levelStartTime;

    // Celebration particles
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 50, () => {
        const x = this.exitDoor.x + Phaser.Math.Between(-60, 60);
        const y = this.exitDoor.y + Phaser.Math.Between(-40, 40);
        const colors = [0x00ff00, 0x00ffff, 0xff00ff, 0xffff00];
        const c = this.add.circle(x, y, Phaser.Math.Between(3, 7), Phaser.Utils.Array.GetRandom(colors), 0.8);
        this.tweens.add({ targets: c, y: y - Phaser.Math.Between(30, 80), alpha: 0, duration: 600, onComplete: () => c.destroy() });
      });
    }

    if (this.currentLevel < 3) {
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
  }

  // === Camera ===
  updateCamera() {
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

    // Play Again
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

    // TRY AGAIN
    const retryBg = this.add.rectangle(640, 460, 260, 56, 0xff0044, 0.15).setInteractive({ useHandCursor: true });
    this.add.rectangle(640, 460, 260, 56).setStrokeStyle(2, 0xff0044);
    this.add.text(640, 460, 'TRY AGAIN', { fontFamily: 'Courier New', fontSize: '22px', color: '#ff0044' }).setOrigin(0.5);
    retryBg.on('pointerover', () => retryBg.setFillStyle(0xff0044, 0.3));
    retryBg.on('pointerout', () => retryBg.setFillStyle(0xff0044, 0.15));
    retryBg.on('pointerdown', () => {
      if (this._socket && this._roomCode) this._socket.emit('try-again', { roomCode: this._roomCode });
    });

    if (this._socket) {
      this._socket.off('retry-level');
      this._socket.on('retry-level', ({ level, lives, score }) => {
        this.scene.start('GameScene', { level, lives, score, playerCount, humanPlayers });
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
function createGame(socket, roomCode, playerNames, playerCount, humanPlayers) {
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 800 }, debug: false } },
    scene: [BootScene, GameScene, VictoryScene, GameOverScene],
  };

  const game = new Phaser.Game(config);

  game._socket = socket;
  game._roomCode = roomCode;
  game._playerNames = playerNames || {};
  game._playerCount = playerCount || 2;
  game._humanPlayers = humanPlayers || [0, 1];
  game._finalScore = 0;
  game._finalLives = 0;

  // Inject references into scenes
  game.events.on('ready', () => {
    ['GameScene', 'VictoryScene', 'GameOverScene'].forEach(name => {
      const scene = game.scene.getScene(name);
      if (scene) {
        scene._socket = socket;
        scene._roomCode = roomCode;
        scene._playerNames = playerNames;
      }
    });
  });

  game.events.on('step', () => {
    ['GameScene', 'VictoryScene', 'GameOverScene'].forEach(name => {
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
