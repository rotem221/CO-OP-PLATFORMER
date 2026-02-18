// ============================================================
// CO-OP PLATFORMER — Phaser 3 Game Logic
// ============================================================

// --- Web Audio API Sound System ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let audioResumed = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  // Try to resume immediately (may fail without user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => { audioResumed = true; }).catch(() => {});
  } else {
    audioResumed = true;
  }
}

// Resume audio on first user interaction (click/touch anywhere on the page)
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
    // Try to resume, but don't block
    if (audioCtx) audioCtx.resume().catch(() => {});
    return;
  }
  const now = audioCtx.currentTime;

  switch (type) {
    case 'jump': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }
    case 'success': {
      [523, 659, 784].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        const t = now + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(now);
        osc.stop(t + 0.25);
      });
      break;
    }
    case 'failure': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
    case 'plate': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
    case 'gameover': {
      // Descending ominous tone
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.8);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      osc.start(now);
      osc.stop(now + 1.0);
      break;
    }
  }
}

// ============================================================
// LEVEL DATA  —  All platforms are reachable with max jump ~115px
// Ground surface is at y ≈ 684 (platform center y=700, h=32)
// Max jump from ground: can reach y ≈ 684 - 115 = 569
// Each step between platforms ≤ 90px vertical
// ============================================================
const LEVELS = {
  1: {
    name: 'TUTORIAL',
    width: 1280,
    height: 720,
    spawn1: { x: 100, y: 650 },
    spawn2: { x: 170, y: 650 },
    exit: { x: 1140, y: 268 },
    platforms: [
      // Ground
      { x: 640, y: 700, w: 1280, h: 32 },
      // Staircase up-right (zigzag, wide horizontal spacing, ~80px vertical per step)
      { x: 250, y: 610, w: 180, h: 20 },   // step 1: 684->610 = 74px up
      { x: 480, y: 530, w: 180, h: 20 },   // step 2: 610->530 = 80px up
      { x: 710, y: 450, w: 180, h: 20 },   // step 3: 530->450 = 80px up
      { x: 940, y: 370, w: 180, h: 20 },   // step 4: 450->370 = 80px up
      { x: 1140, y: 300, w: 200, h: 20 },  // exit platform: 370->300 = 70px up
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
    spawn1: { x: 100, y: 650 },
    spawn2: { x: 170, y: 650 },
    exit: { x: 2680, y: 268 },
    platforms: [
      // === Ground sections (continuous with small jumpable gaps) ===
      { x: 700, y: 700, w: 1400, h: 32 },    // main ground: x=0..1400
      { x: 1500, y: 700, w: 120, h: 32 },     // bridge over spike gap: x=1440..1560
      { x: 1900, y: 700, w: 700, h: 32 },     // mid ground: x=1550..2250
      { x: 2550, y: 700, w: 500, h: 32 },     // end ground: x=2300..2800

      // === Section 1: approach to PlateA + GateA ===
      // PlateA is on the ground at x=500 (easy to reach, just walk right)
      // GateA blocks passage at x=1050
      // PlateA2 is on the ground at x=1200 (after GateA — Player B reaches this)

      // === Section 2: approach to PlateB + GateB ===
      // PlateB is on the ground at x=1800
      // GateB blocks passage at x=2250
      // PlateB2 is on the ground at x=2400 (after GateB)

      // === Staircase to exit (zigzag pattern, wide horizontal spacing) ===
      { x: 2400, y: 610, w: 180, h: 20 },    // step 1: 684->610 = 74px up
      { x: 2560, y: 530, w: 180, h: 20 },    // step 2: 610->530 = 80px up (right)
      { x: 2400, y: 450, w: 180, h: 20 },    // step 3: 530->450 = 80px up (left zigzag)
      { x: 2560, y: 370, w: 180, h: 20 },    // step 4: 450->370 = 80px up (right)
      { x: 2680, y: 300, w: 200, h: 20 },    // exit platform: 370->300 = 70px up
    ],
    spikes: [
      // Danger zones on solid ground
      { x: 800, y: 688, w: 60, h: 16 },          // on main ground (x=0..1400)
      { x: 2100, y: 688, w: 60, h: 16 },          // on mid ground (x=1550..2250)
    ],
    pressurePlates: [
      // Two plates control GateA (either one opens it)
      // y=672: plate visual sits ON ground (ground surface ~684), overlap body extends up to catch players
      { x: 500,  y: 672, w: 64, h: 24, id: 'plateA',  opensGate: 'gateA' },
      { x: 1200, y: 672, w: 64, h: 24, id: 'plateA2', opensGate: 'gateA' },
      // Two plates control GateB
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
    spawn1: { x: 100, y: 650 },
    spawn2: { x: 170, y: 650 },
    exit: { x: 3180, y: 268 },
    platforms: [
      // Ground sections — continuous with small jumpable gaps (max 180px)
      { x: 500, y: 700, w: 1000, h: 32 },     // ground 1: x=0..1000
      { x: 1150, y: 700, w: 120, h: 32 },      // bridge: x=1090..1210 (small gap from g1)
      { x: 1500, y: 700, w: 500, h: 32 },      // ground 2: x=1250..1750
      // (moving platforms bridge gap from g2 to g3)
      { x: 2200, y: 700, w: 800, h: 32 },      // ground 3: x=1800..2600
      { x: 2750, y: 700, w: 160, h: 32 },      // bridge: x=2670..2830
      { x: 3100, y: 700, w: 600, h: 32 },      // ground 4: x=2800..3400

      // Section 1: staircase up with laser hazard
      { x: 300, y: 620, w: 160, h: 20 },       // 684->620 = 64px up
      { x: 520, y: 545, w: 160, h: 20 },       // 620->545 = 75px up
      { x: 740, y: 475, w: 160, h: 20 },       // 545->475 = 70px up

      // Section 2: after bridge, more climbing
      { x: 1350, y: 620, w: 160, h: 20 },      // from ground 684->620 = 64px up
      { x: 1550, y: 545, w: 160, h: 20 },      // 620->545 = 75px up

      // Section 3: after moving platform area, landing platforms
      { x: 2050, y: 600, w: 160, h: 20 },      // from ground or moving plat
      { x: 2250, y: 530, w: 160, h: 20 },      // 600->530 = 70px up

      // Section 4: pressure plate / gate section (all on ground 3 & 4)
      // PlateC on ground 3 at x=2400, GateC at x=2580 (on ground 3)
      // PlateC2 on bridge at x=2750 (after GateC)
      // PlateD on ground 4 at x=2900, GateD at x=3050
      // PlateD2 on ground 4 at x=3200 (after GateD)

      // Staircase to exit (zigzag, wide horizontal spacing)
      { x: 3100, y: 610, w: 180, h: 20 },      // 684->610 = 74px up
      { x: 3260, y: 530, w: 180, h: 20 },      // 610->530 = 80px up (right)
      { x: 3100, y: 450, w: 180, h: 20 },      // 530->450 = 80px up (left zigzag)
      { x: 3260, y: 370, w: 180, h: 20 },      // 450->370 = 80px up (right)
      { x: 3180, y: 300, w: 200, h: 20 },      // exit platform: 370->300 = 70px up
    ],
    spikes: [
      { x: 700, y: 688, w: 60, h: 16 },         // on ground 1 (challenge hazard)
      { x: 2500, y: 688, w: 60, h: 16 },         // on ground 3, before gateC
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
      // Bridges gap between ground 2 (ends x=1750) and ground 3 (starts x=1800)
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
  constructor() {
    super('BootScene');
  }

  create() {
    initAudio();

    // --- Player 1 (Cyan) ---
    const g1 = this.make.graphics({ add: false });
    g1.fillStyle(0x00ffff, 0.2);
    g1.fillRoundedRect(0, 0, 36, 52, 6);
    g1.fillStyle(0x00ffff, 1);
    g1.fillRoundedRect(4, 4, 28, 44, 4);
    g1.fillStyle(0xffffff, 1);
    g1.fillRect(10, 14, 6, 6);
    g1.fillRect(20, 14, 6, 6);
    g1.fillStyle(0x000000, 1);
    g1.fillRect(12, 16, 3, 3);
    g1.fillRect(22, 16, 3, 3);
    g1.generateTexture('player1', 36, 52);
    g1.destroy();

    // --- Player 2 (Magenta) ---
    const g2 = this.make.graphics({ add: false });
    g2.fillStyle(0xff00ff, 0.2);
    g2.fillRoundedRect(0, 0, 36, 52, 6);
    g2.fillStyle(0xff00ff, 1);
    g2.fillRoundedRect(4, 4, 28, 44, 4);
    g2.fillStyle(0xffffff, 1);
    g2.fillRect(10, 14, 6, 6);
    g2.fillRect(20, 14, 6, 6);
    g2.fillStyle(0x000000, 1);
    g2.fillRect(12, 16, 3, 3);
    g2.fillRect(22, 16, 3, 3);
    g2.generateTexture('player2', 36, 52);
    g2.destroy();

    // --- Platform ---
    const gp = this.make.graphics({ add: false });
    gp.fillStyle(0x00ffff, 0.15);
    gp.fillRect(0, 0, 32, 32);
    gp.fillStyle(0x00cccc, 1);
    gp.fillRect(2, 2, 28, 28);
    gp.lineStyle(1, 0x00ffff, 0.6);
    gp.strokeRect(2, 2, 28, 28);
    gp.generateTexture('platform', 32, 32);
    gp.destroy();

    // --- Spike ---
    const gs = this.make.graphics({ add: false });
    gs.fillStyle(0xff0044, 0.3);
    gs.fillTriangle(0, 16, 8, 0, 16, 16);
    gs.fillStyle(0xff0044, 1);
    gs.fillTriangle(2, 16, 8, 2, 14, 16);
    gs.generateTexture('spike', 16, 16);
    gs.destroy();

    // --- Pressure Plate ---
    const gpp = this.make.graphics({ add: false });
    gpp.fillStyle(0xffff00, 1);
    gpp.fillRect(0, 2, 56, 10);
    gpp.lineStyle(1, 0xffff00, 0.5);
    gpp.strokeRect(0, 2, 56, 10);
    gpp.generateTexture('pressurePlate', 56, 12);
    gpp.destroy();

    // --- Pressure Plate Pressed ---
    const gppp = this.make.graphics({ add: false });
    gppp.fillStyle(0x88aa00, 1);
    gppp.fillRect(0, 6, 56, 6);
    gppp.generateTexture('pressurePlateDown', 56, 12);
    gppp.destroy();

    // --- Gate ---
    const gg = this.make.graphics({ add: false });
    gg.fillStyle(0xff00ff, 0.8);
    for (let i = 0; i < 6; i++) {
      gg.fillRect(4, i * 20, 12, 14);
    }
    gg.lineStyle(1, 0xff00ff, 0.4);
    gg.strokeRect(0, 0, 20, 120);
    gg.generateTexture('gate', 20, 120);
    gg.destroy();

    // --- Exit Door ---
    const ge = this.make.graphics({ add: false });
    ge.fillStyle(0x00ff00, 0.15);
    ge.fillRect(0, 0, 48, 64);
    ge.fillStyle(0x00ff00, 0.6);
    ge.fillRect(4, 4, 40, 56);
    ge.lineStyle(2, 0x00ff00, 1);
    ge.strokeRect(4, 4, 40, 56);
    ge.fillStyle(0xffffff, 0.8);
    ge.fillCircle(34, 34, 3);
    ge.generateTexture('exit', 48, 64);
    ge.destroy();

    // --- Moving Platform ---
    const gm = this.make.graphics({ add: false });
    gm.fillStyle(0xffaa00, 0.2);
    gm.fillRect(0, 0, 120, 20);
    gm.fillStyle(0xffaa00, 1);
    gm.fillRect(2, 2, 116, 16);
    gm.lineStyle(1, 0xffaa00, 0.6);
    gm.strokeRect(0, 0, 120, 20);
    gm.generateTexture('movingPlatform', 120, 20);
    gm.destroy();

    // --- Laser ---
    const gl = this.make.graphics({ add: false });
    gl.fillStyle(0xff0000, 0.3);
    gl.fillRect(0, 0, 6, 8);
    gl.fillStyle(0xff0000, 1);
    gl.fillRect(1, 0, 4, 8);
    gl.generateTexture('laser', 6, 8);
    gl.destroy();

    this.scene.start('GameScene', { level: 1 });
  }
}

// ============================================================
// GAME SCENE — Main Gameplay
// ============================================================
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentLevel = data.level || 1;
    this.isResetting = false;
    this.player1AtExit = false;
    this.player2AtExit = false;
    this.levelCompleted = false;
    // Lives & Score
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.score = data.score || 0;
    this.levelStartTime = Date.now();
  }

  create() {
    const levelData = LEVELS[this.currentLevel];
    if (!levelData) return;

    // --- World bounds ---
    this.physics.world.setBounds(0, 0, levelData.width, levelData.height);

    // --- Background ---
    this.cameras.main.setBackgroundColor('#000000');

    // --- Background grid (neon aesthetic) ---
    const bg = this.add.graphics();
    bg.lineStyle(1, 0x0a1a2a, 0.3);
    for (let x = 0; x < levelData.width; x += 64) {
      bg.moveTo(x, 0);
      bg.lineTo(x, levelData.height);
    }
    for (let y = 0; y < levelData.height; y += 64) {
      bg.moveTo(0, y);
      bg.lineTo(levelData.width, y);
    }
    bg.strokePath();

    // --- Level name display (fixed at viewport center, not world center) ---
    this.levelText = this.add.text(640, 30, `LEVEL ${this.currentLevel} — ${levelData.name}`, {
      fontFamily: 'Courier New',
      fontSize: '20px',
      color: '#888',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Fade out level text after 2 seconds
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.levelText,
        alpha: 0,
        duration: 1000,
      });
    });

    // --- Platforms ---
    this.platforms = this.physics.add.staticGroup();
    levelData.platforms.forEach(p => {
      this.add.rectangle(p.x, p.y, p.w + 6, p.h + 6, 0x00ffff, 0.08);
      const plat = this.platforms.create(p.x, p.y, 'platform');
      plat.setDisplaySize(p.w, p.h);
      plat.refreshBody();
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
    // Plates are visual-only sprites; overlap is checked manually via distance in update()
    // This avoids all static body sizing issues with physics overlap.
    this.pressurePlateObjects = [];
    this.pressurePlatesGroup = this.physics.add.staticGroup();
    levelData.pressurePlates.forEach(pp => {
      const plate = this.pressurePlatesGroup.create(pp.x, pp.y, 'pressurePlate');
      plate.setDisplaySize(pp.w, 12); // visual: thin yellow plate
      plate.refreshBody();
      plate.setData('id', pp.id);
      plate.setData('opensGate', pp.opensGate);
      plate.setData('pressed', false);
      plate.setData('origY', pp.y);
      plate.setData('zoneW', pp.w);   // store trigger zone width
      this.pressurePlateObjects.push(plate);
    });

    // --- Gates ---
    this.gateObjects = new Map();
    this.gatesGroup = this.physics.add.staticGroup();
    levelData.gates.forEach(g => {
      const glow = this.add.rectangle(g.x, g.y, g.w + 10, g.h + 10, 0xff00ff, 0.1);
      const gate = this.gatesGroup.create(g.x, g.y, 'gate');
      gate.setDisplaySize(g.w, g.h);
      // Set physics body to match desired gate size
      gate.body.setSize(g.w, g.h);
      gate.body.setOffset((gate.width - g.w) / 2, (gate.height - g.h) / 2);
      gate.body.updateFromGameObject();
      gate.setData('id', g.id);
      gate.setData('glow', glow);
      gate.setData('wasOpen', false);
      this.gateObjects.set(g.id, gate);
    });

    // --- Visual indicators for pressure plates (connection lines + labels) ---
    if (levelData.pressurePlates.length > 0) {
      this.buildPlateIndicators(levelData);
    }

    // --- Tutorial text for Level 2 ---
    if (this.currentLevel === 2) {
      const tutText = this.add.text(
        levelData.spawn1.x + 35, levelData.spawn1.y - 80,
        'Stand on yellow plates\nto open gates for\nyour partner!',
        {
          fontFamily: 'Courier New', fontSize: '13px',
          color: '#ffff00', align: 'center',
          stroke: '#000', strokeThickness: 3,
        }
      ).setOrigin(0.5).setDepth(100);

      this.tweens.add({
        targets: tutText,
        alpha: { from: 0.6, to: 1 },
        duration: 800,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.tweens.add({
            targets: tutText, alpha: 0, duration: 1000,
            onComplete: () => tutText.destroy(),
          });
        },
      });
    }

    // --- Moving Platforms ---
    this.movingPlatformObjects = [];
    this.movingPlatformsGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    levelData.movingPlatforms.forEach(mp => {
      const plat = this.movingPlatformsGroup.create(mp.x, mp.y, 'movingPlatform');
      plat.setDisplaySize(mp.w, mp.h);
      plat.body.setSize(mp.w, mp.h);
      plat.setData('config', {
        originX: mp.x,
        originY: mp.y,
        moveX: mp.moveX || 0,
        moveY: mp.moveY || 0,
        speed: mp.speed || 60,
      });
      this.movingPlatformObjects.push(plat);
    });

    // --- Lasers ---
    this.laserObjects = [];
    this.lasersGroup = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    levelData.lasers.forEach(l => {
      const laser = this.lasersGroup.create(l.x, l.y, 'laser');
      laser.setDisplaySize(l.w, l.h);
      laser.body.setSize(l.w, l.h);
      laser.setData('config', {
        onTime: l.onTime,
        offTime: l.offTime,
        offset: Math.random() * (l.onTime + l.offTime),
      });
      const glow = this.add.rectangle(l.x, l.y, l.w + 12, l.h + 4, 0xff0000, 0.15);
      laser.setData('glow', glow);
      this.laserObjects.push(laser);
    });

    // --- Exit Door ---
    this.exitDoor = this.physics.add.staticSprite(levelData.exit.x, levelData.exit.y, 'exit');
    this.exitDoor.setDisplaySize(48, 64);
    this.exitDoor.refreshBody();
    this.exitGlow = this.add.rectangle(levelData.exit.x, levelData.exit.y, 60, 76, 0x00ff00, 0.1);
    this.tweens.add({
      targets: this.exitGlow,
      alpha: { from: 0.05, to: 0.2 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // --- Players ---
    this.player1 = this.physics.add.sprite(levelData.spawn1.x, levelData.spawn1.y, 'player1');
    this.player2 = this.physics.add.sprite(levelData.spawn2.x, levelData.spawn2.y, 'player2');

    [this.player1, this.player2].forEach(p => {
      p.setBounce(0.05);
      p.setCollideWorldBounds(true);
      p.body.setMaxVelocity(200, 500);
      p.setDepth(10);
    });

    // --- Player name labels ---
    if (this._playerNames) {
      this.p1Label = this.add.text(0, 0, this._playerNames[0] || 'P1', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#00ffff',
      }).setOrigin(0.5).setDepth(11);
      this.p2Label = this.add.text(0, 0, this._playerNames[1] || 'P2', {
        fontFamily: 'Courier New', fontSize: '11px', color: '#ff00ff',
      }).setOrigin(0.5).setDepth(11);
    }

    // --- Colliders ---
    this.physics.add.collider(this.player1, this.platforms);
    this.physics.add.collider(this.player2, this.platforms);
    this.physics.add.collider(this.player1, this.gatesGroup);
    this.physics.add.collider(this.player2, this.gatesGroup);
    this.physics.add.collider(this.player1, this.movingPlatformsGroup);
    this.physics.add.collider(this.player2, this.movingPlatformsGroup);

    // --- Hazard overlaps ---
    this.physics.add.overlap(this.player1, this.spikes, this.onHazardHit, null, this);
    this.physics.add.overlap(this.player2, this.spikes, this.onHazardHit, null, this);
    this.physics.add.overlap(this.player1, this.lasersGroup, this.onLaserHit, null, this);
    this.physics.add.overlap(this.player2, this.lasersGroup, this.onLaserHit, null, this);

    // --- Pressure plate detection is done manually in update() via distance check ---
    // (Physics overlap with static bodies is unreliable when plates are on ground surface)

    // --- Input state ---
    this.inputState = {
      0: { left: false, right: false, jump: false },
      1: { left: false, right: false, jump: false },
    };

    // --- Socket listeners ---
    if (this._socket) {
      this._socket.off('player-input');
      this._socket.on('player-input', (data) => {
        if (this.inputState[data.playerIndex]) {
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

    // --- Death flash graphic (fixed to viewport, not world) ---
    this.deathFlash = this.add.rectangle(
      640, 360, 1280, 720,
      0xff0000, 0
    ).setScrollFactor(0).setDepth(200);

    // --- HUD (lives + score) ---
    this.buildHUD();
  }

  // === HUD ===
  buildHUD() {
    this.heartIcons = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.text(24 + i * 32, 56, '\u2764', {
        fontSize: '24px',
        color: '#ff0044',
      }).setScrollFactor(0).setDepth(250).setAlpha(i < this.lives ? 1 : 0.15);
      this.heartIcons.push(heart);
    }

    this.scoreText = this.add.text(1256, 56, `SCORE: ${this.score}`, {
      fontFamily: 'Courier New',
      fontSize: '16px',
      color: '#ffff00',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(250);
  }

  updateHeartsDisplay() {
    this.heartIcons.forEach((h, i) => {
      h.setAlpha(i < this.lives ? 1 : 0.15);
    });
  }

  updateScoreDisplay() {
    if (this.scoreText) {
      this.scoreText.setText(`SCORE: ${this.score}`);
    }
  }

  // === Visual indicators for pressure plates ===
  buildPlateIndicators(levelData) {
    levelData.pressurePlates.forEach(pp => {
      const matchingGate = levelData.gates.find(g => g.id === pp.opensGate);
      if (!matchingGate) return;

      // Dashed connection line
      const lineGfx = this.add.graphics();
      lineGfx.lineStyle(2, 0xffff00, 0.2);
      const dx = matchingGate.x - pp.x;
      const dy = matchingGate.y - pp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dashLen = 10;
      const gapLen = 8;
      const steps = Math.floor(dist / (dashLen + gapLen));
      for (let i = 0; i < steps; i++) {
        const t1 = (i * (dashLen + gapLen)) / dist;
        const t2 = Math.min((i * (dashLen + gapLen) + dashLen) / dist, 1);
        lineGfx.moveTo(pp.x + dx * t1, pp.y + dy * t1);
        lineGfx.lineTo(pp.x + dx * t2, pp.y + dy * t2);
      }
      lineGfx.strokePath();
      lineGfx.setDepth(0);

      // "STAND" label above plate
      const label = this.add.text(pp.x, pp.y - 24, '\u25BC STAND \u25BC', {
        fontFamily: 'Courier New',
        fontSize: '9px',
        color: '#ffff00',
        align: 'center',
        stroke: '#000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(5);

      this.tweens.add({
        targets: label,
        alpha: { from: 0.4, to: 1 },
        y: pp.y - 28,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    });
  }

  update(time, delta) {
    if (this.levelCompleted) return;

    // --- Player movement ---
    this.handleMovement(this.player1, this.inputState[0], 'p1');
    this.handleMovement(this.player2, this.inputState[1], 'p2');

    // --- Name labels follow players ---
    if (this.p1Label) {
      this.p1Label.setPosition(this.player1.x, this.player1.y - 36);
    }
    if (this.p2Label) {
      this.p2Label.setPosition(this.player2.x, this.player2.y - 36);
    }

    // --- Pressure plates ---
    this.updatePressurePlates();

    // --- Moving platforms ---
    this.updateMovingPlatforms(time);

    // --- Lasers ---
    this.updateLasers(time);

    // --- Exit check ---
    this.checkExit();

    // --- Camera follow midpoint ---
    this.updateCamera();

    // --- Fall death ---
    if (this.player1.y > 750 || this.player2.y > 750) {
      this.onHazardHit();
    }
  }

  handleMovement(player, input, tag) {
    if (!input) return;

    if (input.left) {
      player.setVelocityX(-200);
    } else if (input.right) {
      player.setVelocityX(200);
    } else {
      player.setVelocityX(0);
    }

    if (input.jump && player.body.blocked.down) {
      player.setVelocityY(-430);
      playSound('jump');
      this.spawnJumpParticles(player.x, player.y + 24, tag === 'p1' ? 0x00ffff : 0xff00ff);
    }
  }

  spawnJumpParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const p = this.add.circle(
        x + Phaser.Math.Between(-12, 12), y,
        Phaser.Math.Between(2, 4), color, 0.7
      );
      this.tweens.add({
        targets: p,
        y: y + Phaser.Math.Between(10, 25),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 300,
        onComplete: () => p.destroy(),
      });
    }
  }

  // --- Pressure Plates (manual distance-based detection + multi-plate-per-gate) ---
  isPlayerOnPlate(player, plate) {
    // Check if player is within horizontal range of the plate and near ground level
    const zoneW = plate.getData('zoneW') || 64;
    const halfW = zoneW / 2 + 10; // +10px tolerance
    const dx = Math.abs(player.x - plate.x);
    const dy = player.y + player.displayHeight / 2 - plate.y; // player feet y vs plate y
    // Player feet should be within 30px above plate (standing on ground near it)
    return dx < halfW && dy > -40 && dy < 20;
  }

  updatePressurePlates() {
    // Pass 1: check which plates are pressed and which gates should open
    const gateOpen = new Map();
    this.pressurePlateObjects.forEach(plate => {
      const gateId = plate.getData('opensGate');
      const isOnPlate = this.isPlayerOnPlate(this.player1, plate) ||
                         this.isPlayerOnPlate(this.player2, plate);
      plate.setData('pressed', isOnPlate);

      if (isOnPlate) {
        gateOpen.set(gateId, true);
      } else if (!gateOpen.has(gateId)) {
        gateOpen.set(gateId, false);
      }
    });

    // Pass 2: update gates
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
          // Flash effect when gate opens
          this.tweens.add({
            targets: gate,
            alpha: { from: 0.6, to: 0.12 },
            duration: 300,
          });
        }
      } else {
        gate.body.enable = true;
        gate.setAlpha(1);
        const glow = gate.getData('glow');
        if (glow) glow.setAlpha(0.1);
      }
      gate.setData('wasOpen', isOpen);
    }

    // Pass 3: update plate visuals
    this.pressurePlateObjects.forEach(plate => {
      const isPressed = plate.getData('pressed');
      plate.setTexture(isPressed ? 'pressurePlateDown' : 'pressurePlate');
    });
  }

  // --- Moving Platforms ---
  updateMovingPlatforms(time) {
    this.movingPlatformObjects.forEach(plat => {
      const cfg = plat.getData('config');
      const t = time * 0.001;
      if (cfg.moveX) {
        plat.x = cfg.originX + Math.sin(t * (cfg.speed / 60)) * cfg.moveX;
      }
      if (cfg.moveY) {
        plat.y = cfg.originY + Math.sin(t * (cfg.speed / 60)) * cfg.moveY;
      }
      plat.body.updateFromGameObject();
    });
  }

  // --- Lasers ---
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
        const pulseAlpha = 0.7 + Math.sin(time * 0.015) * 0.3;
        laser.setAlpha(pulseAlpha);
        if (glow) {
          glow.setVisible(true);
          glow.setAlpha(0.1 + Math.sin(time * 0.01) * 0.08);
        }
      } else {
        laser.setActive(false).setVisible(false);
        laser.body.enable = false;
        if (glow) glow.setVisible(false);
      }
    });
  }

  onLaserHit(player, laser) {
    if (laser.active) {
      this.onHazardHit();
    }
  }

  // --- Hazard Hit (Shared Fate + Lives) ---
  onHazardHit() {
    if (this.isResetting || this.levelCompleted) return;
    this.isResetting = true;

    playSound('failure');

    // Decrement lives
    this.lives -= 1;

    // Animate lost heart
    if (this.heartIcons[this.lives]) {
      this.tweens.add({
        targets: this.heartIcons[this.lives],
        alpha: 0.15,
        scaleX: 1.8,
        scaleY: 1.8,
        duration: 400,
        yoyo: false,
        onComplete: () => {
          this.heartIcons[this.lives].setScale(1);
        },
      });
    }

    // Flash screen red
    this.tweens.add({
      targets: this.deathFlash,
      alpha: { from: 0.4, to: 0 },
      duration: 500,
    });

    // Notify server
    if (this._socket && this._roomCode) {
      this._socket.emit('player-died', { roomCode: this._roomCode });
    }

    // Check game over
    if (this.lives <= 0) {
      // Game Over — delay then switch scene
      this.tweens.add({
        targets: [this.player1, this.player2],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          this.time.delayedCall(400, () => {
            this.scene.start('GameOverScene', {
              level: this.currentLevel,
              score: this.score,
            });
          });
        },
      });
      return;
    }

    // Normal reset: flash and reposition both players
    this.tweens.add({
      targets: [this.player1, this.player2],
      alpha: 0,
      duration: 80,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        const levelData = LEVELS[this.currentLevel];
        this.player1.setPosition(levelData.spawn1.x, levelData.spawn1.y);
        this.player1.setVelocity(0, 0);
        this.player1.setAlpha(1);
        this.player2.setPosition(levelData.spawn2.x, levelData.spawn2.y);
        this.player2.setVelocity(0, 0);
        this.player2.setAlpha(1);
        this.isResetting = false;
      },
    });
  }

  // --- Exit Check ---
  checkExit() {
    const doorBounds = this.exitDoor.getBounds();
    const p1Bounds = this.player1.getBounds();
    const p2Bounds = this.player2.getBounds();

    this.player1AtExit = Phaser.Geom.Rectangle.Overlaps(doorBounds, p1Bounds);
    this.player2AtExit = Phaser.Geom.Rectangle.Overlaps(doorBounds, p2Bounds);

    if (this.player1AtExit || this.player2AtExit) {
      this.exitGlow.setFillStyle(0x00ff00, 0.3);
    } else {
      this.exitGlow.setFillStyle(0x00ff00, 0.1);
    }

    if (this.player1AtExit && this.player2AtExit) {
      this.levelComplete();
    }
  }

  levelComplete() {
    if (this.levelCompleted) return;
    this.levelCompleted = true;

    playSound('success');

    // Calculate time for this level
    const levelTime = Date.now() - this.levelStartTime;

    // Celebration effect
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 50, () => {
        const x = this.exitDoor.x + Phaser.Math.Between(-60, 60);
        const y = this.exitDoor.y + Phaser.Math.Between(-40, 40);
        const colors = [0x00ff00, 0x00ffff, 0xff00ff, 0xffff00];
        const c = this.add.circle(x, y, Phaser.Math.Between(3, 7),
          Phaser.Utils.Array.GetRandom(colors), 0.8);
        this.tweens.add({
          targets: c,
          y: y - Phaser.Math.Between(30, 80),
          alpha: 0,
          duration: 600,
          onComplete: () => c.destroy(),
        });
      });
    }

    if (this.currentLevel < 3) {
      const nextLevel = this.currentLevel + 1;

      // Notify server with timing
      if (this._socket && this._roomCode) {
        this._socket.emit('level-complete', {
          roomCode: this._roomCode,
          nextLevel,
          levelTime,
        });
      }

      // Transition text
      const transText = this.add.text(640, 360,
        `LEVEL ${nextLevel}`,
        {
          fontFamily: 'Courier New',
          fontSize: '48px',
          color: '#00ff00',
          stroke: '#000',
          strokeThickness: 4,
        }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(300).setAlpha(0);

      this.tweens.add({
        targets: transText,
        alpha: 1,
        duration: 500,
        yoyo: true,
        hold: 800,
        onComplete: () => {
          transText.destroy();
          this.scene.restart({
            level: nextLevel,
            lives: this.lives,
            score: this.score,
          });
        },
      });
    } else {
      // Game complete!
      if (this._socket && this._roomCode) {
        this._socket.emit('game-over', {
          roomCode: this._roomCode,
          levelTime,
        });
      }

      this.time.delayedCall(1500, () => {
        this.scene.start('VictoryScene');
      });
    }
  }

  // --- Camera ---
  updateCamera() {
    const midX = (this.player1.x + this.player2.x) / 2;
    const midY = (this.player1.y + this.player2.y) / 2;
    this.cameras.main.centerOn(midX, midY);
  }
}

// ============================================================
// VICTORY SCENE (with Scoreboard)
// ============================================================
class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Get score/lives from game instance
    const score = this.game._finalScore || 0;
    const lives = this.game._finalLives || 0;

    // Title
    const title = this.add.text(640, 140, 'VICTORY!', {
      fontFamily: 'Courier New',
      fontSize: '64px',
      color: '#00ff00',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: { from: 0.6, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add.text(640, 220, 'All levels complete!', {
      fontFamily: 'Courier New',
      fontSize: '24px',
      color: '#0ff',
    }).setOrigin(0.5);

    this.add.text(640, 260, 'Great teamwork!', {
      fontFamily: 'Courier New',
      fontSize: '20px',
      color: '#f0f',
    }).setOrigin(0.5);

    // --- Scoreboard ---
    const boardY = 320;

    this.add.text(640, boardY, '--- SCOREBOARD ---', {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#fff',
    }).setOrigin(0.5);

    // Score
    this.add.text(640, boardY + 40, `Total Score: ${score}`, {
      fontFamily: 'Courier New',
      fontSize: '28px',
      color: '#ffff00',
    }).setOrigin(0.5);

    // Lives remaining
    const heartsStr = lives > 0 ? Array(lives).fill('\u2764').join('  ') : 'None';
    this.add.text(640, boardY + 80, `Lives Remaining: ${heartsStr}`, {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#ff0044',
    }).setOrigin(0.5);

    // Player names
    const p1Name = this.game._playerNames ? this.game._playerNames[0] || 'P1' : 'P1';
    const p2Name = this.game._playerNames ? this.game._playerNames[1] || 'P2' : 'P2';

    this.add.text(640, boardY + 120, `Players: `, {
      fontFamily: 'Courier New',
      fontSize: '16px',
      color: '#888',
    }).setOrigin(0.5);

    this.add.text(560, boardY + 145, p1Name, {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#00ffff',
    }).setOrigin(0.5);

    this.add.text(640, boardY + 145, ' & ', {
      fontFamily: 'Courier New',
      fontSize: '16px',
      color: '#888',
    }).setOrigin(0.5);

    this.add.text(720, boardY + 145, p2Name, {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#ff00ff',
    }).setOrigin(0.5);

    // Neon particle celebration
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(100, 1180);
        const y = Phaser.Math.Between(50, 670);
        const colors = [0x00ff00, 0x00ffff, 0xff00ff, 0xffff00, 0xff8800];
        const c = this.add.circle(x, y, Phaser.Math.Between(2, 6),
          Phaser.Utils.Array.GetRandom(colors), 0.6);
        this.tweens.add({
          targets: c,
          y: y - Phaser.Math.Between(20, 60),
          alpha: 0,
          duration: Phaser.Math.Between(500, 1200),
          onComplete: () => c.destroy(),
        });
      },
    });

    // Play Again button
    const btnY = boardY + 200;
    const playAgainBg = this.add.rectangle(640, btnY, 240, 56, 0x00ff00, 0.15)
      .setInteractive({ useHandCursor: true });
    this.add.rectangle(640, btnY, 240, 56).setStrokeStyle(2, 0x00ff00);
    this.add.text(640, btnY, 'PLAY AGAIN', {
      fontFamily: 'Courier New',
      fontSize: '22px',
      color: '#00ff00',
    }).setOrigin(0.5);

    playAgainBg.on('pointerover', () => playAgainBg.setFillStyle(0x00ff00, 0.3));
    playAgainBg.on('pointerout', () => playAgainBg.setFillStyle(0x00ff00, 0.15));
    playAgainBg.on('pointerdown', () => {
      if (this._socket && this._roomCode) {
        this._socket.emit('play-again', { roomCode: this._roomCode });
      }
    });

    // Store references
    this._socket = this.game._socket;
    this._roomCode = this.game._roomCode;

    playSound('success');
  }
}

// ============================================================
// GAME OVER SCENE
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.failedLevel = data.level || 1;
    this.finalScore = data.score || 0;
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Store references
    this._socket = this.game._socket;
    this._roomCode = this.game._roomCode;

    // Title
    const title = this.add.text(640, 180, 'GAME OVER', {
      fontFamily: 'Courier New',
      fontSize: '56px',
      color: '#ff0044',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Score
    this.add.text(640, 280, `Score: ${this.finalScore}`, {
      fontFamily: 'Courier New',
      fontSize: '28px',
      color: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(640, 330, `Failed at Level ${this.failedLevel}`, {
      fontFamily: 'Courier New',
      fontSize: '18px',
      color: '#888',
    }).setOrigin(0.5);

    // Player names
    const p1Name = this.game._playerNames ? this.game._playerNames[0] || 'P1' : 'P1';
    const p2Name = this.game._playerNames ? this.game._playerNames[1] || 'P2' : 'P2';

    this.add.text(560, 380, p1Name, {
      fontFamily: 'Courier New', fontSize: '16px', color: '#00ffff',
    }).setOrigin(0.5);
    this.add.text(640, 380, ' & ', {
      fontFamily: 'Courier New', fontSize: '14px', color: '#888',
    }).setOrigin(0.5);
    this.add.text(720, 380, p2Name, {
      fontFamily: 'Courier New', fontSize: '16px', color: '#ff00ff',
    }).setOrigin(0.5);

    // TRY AGAIN button
    const retryBg = this.add.rectangle(640, 460, 260, 56, 0xff0044, 0.15)
      .setInteractive({ useHandCursor: true });
    this.add.rectangle(640, 460, 260, 56).setStrokeStyle(2, 0xff0044);
    this.add.text(640, 460, 'TRY AGAIN', {
      fontFamily: 'Courier New',
      fontSize: '22px',
      color: '#ff0044',
    }).setOrigin(0.5);

    retryBg.on('pointerover', () => retryBg.setFillStyle(0xff0044, 0.3));
    retryBg.on('pointerout', () => retryBg.setFillStyle(0xff0044, 0.15));
    retryBg.on('pointerdown', () => {
      if (this._socket && this._roomCode) {
        this._socket.emit('try-again', { roomCode: this._roomCode });
      }
    });

    // Listen for server retry
    if (this._socket) {
      this._socket.off('retry-level');
      this._socket.on('retry-level', ({ level, lives, score }) => {
        this.scene.start('GameScene', { level, lives, score });
      });
    }

    // Falling particles (red, ominous)
    this.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        const x = Phaser.Math.Between(50, 1230);
        const c = this.add.circle(x, 0, Phaser.Math.Between(1, 4), 0xff0044, 0.4);
        this.tweens.add({
          targets: c,
          y: 720,
          alpha: 0,
          duration: Phaser.Math.Between(1500, 3000),
          onComplete: () => c.destroy(),
        });
      },
    });

    playSound('gameover');
  }
}

// ============================================================
// CREATE GAME — Called from index.html when game starts
// ============================================================
function createGame(socket, roomCode, playerNames) {
  const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene, VictoryScene, GameOverScene],
  };

  const game = new Phaser.Game(config);

  // Attach shared data
  game._socket = socket;
  game._roomCode = roomCode;
  game._playerNames = playerNames || {};
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

  // Continuously inject on step (handles scene restarts)
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
