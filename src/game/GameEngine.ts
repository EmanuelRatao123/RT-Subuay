import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GameMode, GameState, MapDefinition, SkinDefinition } from '../types/game';
import { LANES, TRACK_METRICS, MAPS, SKINS } from './constants';
import { AnimatedCharacter, createCharacterModel } from './models/characterGenerator';
import { TrainObject, createTrainModel } from './models/trainGenerator';
import { ObstacleObject, createObstacle, ObstacleType } from './models/obstacleGenerator';
import { CoinObject, createCoin } from './models/coinGenerator';
import { TrackSegment, createTrackSegment } from './models/environmentGenerator';
import { soundManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, distance: number, coins: number, timeMs: number) => void;
  onGameOver: (summary: {
    mode: GameMode;
    score: number;
    distance: number;
    coins: number;
    survivedMs: number;
    reason: 'crash' | 'coin';
  }) => void;
  onStateChange: (state: GameState) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private isSoftwareGl = false;

  // Game state
  private state: GameState = 'menu';
  private mode: GameMode = 'normal';
  private currentSkin: SkinDefinition;
  private currentMap: MapDefinition;

  // Physics & Player
  private characterModel: AnimatedCharacter | null = null;
  private currentLaneIndex = 1; // 0: left, 1: center, 2: right
  private playerX = 0;
  private targetPlayerX = 0;
  private playerY = 0;
  private playerZ = 0;
  private velocityY = 0;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;
  private runSpeed = TRACK_METRICS.BASE_SPEED;
  private isDead = false;

  // Timers & scores
  private gameStartTime = 0;
  private pausedTime = 0;
  private pauseStart = 0;
  private score = 0;
  private distanceRun = 0;
  private sessionCoins = 0;
  private cameraShake = 0;

  // World objects
  private trackSegments: TrackSegment[] = [];
  private obstacles: ObstacleObject[] = [];
  private trains: TrainObject[] = [];
  private coins: CoinObject[] = [];
  private nextSpawnZ = -30;
  private nextTrackZ = 0;

  // Particle systems
  private coinParticles: THREE.Points | null = null;
  private coinParticlePositions: Float32Array | null = null;
  private coinParticleVelocities: Float32Array | null = null;
  private activeCoinParticles = 0;

  // Animation frame
  private animFrameId: number | null = null;
  private lastFrameTime = 0;

  // Pre-allocated collision math helpers
  private readonly playerBox = new THREE.Box3();
  private readonly objBox = new THREE.Box3();
  private readonly coinPos = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    skinId: string,
    mapId: string,
    mode: GameMode,
    callbacks: GameEngineCallbacks
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.mode = mode;
    this.currentSkin = SKINS.find((s) => s.id === skinId) || SKINS[0];
    this.currentMap = MAPS.find((m) => m.id === mapId) || MAPS[0];

    this.initThree();
    this.setupParticles();
    this.loadSceneForMap(this.currentMap);
    this.setPlayerSkin(this.currentSkin);
    this.bindControls();
    this.startLoop();
  }

  private initThree() {
    // Software WebGL guard
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 250);
    this.camera.position.set(0, 4.2, 7.5);

    // Studio Environment map reflection (mandatory per threejs skill)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Lighting rig (Key light + cool/warm Hemisphere fill)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.85);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(15, 30, 20);
    this.dirLight.castShadow = !this.isSoftwareGl;
    if (this.dirLight.castShadow) {
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 80;
      this.dirLight.shadow.camera.left = -15;
      this.dirLight.shadow.camera.right = 15;
      this.dirLight.shadow.camera.top = 25;
      this.dirLight.shadow.camera.bottom = -15;
      this.dirLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.dirLight);

    window.addEventListener('resize', this.onWindowResize);
  }

  private setupParticles() {
    const pCount = 80;
    const geo = new THREE.BufferGeometry();
    this.coinParticlePositions = new Float32Array(pCount * 3);
    this.coinParticleVelocities = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      this.coinParticlePositions[i * 3 + 1] = -100; // hide initially
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.coinParticlePositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.35,
      transparent: true,
      opacity: 0.9,
    });

    this.coinParticles = new THREE.Points(geo, pMat);
    this.scene.add(this.coinParticles);
  }

  private triggerCoinBurst(x: number, y: number, z: number) {
    if (!this.coinParticlePositions || !this.coinParticleVelocities) return;
    const burstCount = 18;
    for (let i = 0; i < burstCount; i++) {
      const idx = (this.activeCoinParticles + i) % 80;
      this.coinParticlePositions[idx * 3] = x;
      this.coinParticlePositions[idx * 3 + 1] = y;
      this.coinParticlePositions[idx * 3 + 2] = z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      this.coinParticleVelocities[idx * 3] = Math.cos(angle) * speed;
      this.coinParticleVelocities[idx * 3 + 1] = 2 + Math.random() * 5;
      this.coinParticleVelocities[idx * 3 + 2] = Math.sin(angle) * speed;
    }
    this.activeCoinParticles = (this.activeCoinParticles + burstCount) % 80;
  }

  public loadSceneForMap(map: MapDefinition) {
    this.currentMap = map;
    this.scene.background = new THREE.Color(map.skyColor);
    this.scene.fog = new THREE.FogExp2(map.fogColor, map.fogDensity);

    this.hemiLight.color.set(map.ambientColor);
    this.hemiLight.groundColor.set(map.groundColor);
    this.dirLight.color.set(map.sunColor);

    // Clear old tracks
    this.trackSegments.forEach((s) => {
      this.scene.remove(s.group);
      s.dispose();
    });
    this.trackSegments = [];

    // Rebuild initial track segments
    this.nextTrackZ = 15;
    for (let i = 0; i < TRACK_METRICS.VISIBLE_SEGMENTS; i++) {
      const seg = createTrackSegment(map, this.nextTrackZ);
      this.trackSegments.push(seg);
      this.scene.add(seg.group);
      this.nextTrackZ -= TRACK_METRICS.SEGMENT_LENGTH;
    }
  }

  public setPlayerSkin(skin: SkinDefinition) {
    this.currentSkin = skin;
    if (this.characterModel) {
      this.scene.remove(this.characterModel.group);
      this.characterModel.dispose();
    }
    this.characterModel = createCharacterModel(skin);
    this.scene.add(this.characterModel.group);
    this.characterModel.group.position.set(this.playerX, this.playerY, this.playerZ);
  }

  public setGameMode(mode: GameMode) {
    this.mode = mode;
  }

  // --- GAMEPLAY FLOW ---

  public startPlaying() {
    this.state = 'playing';
    this.isDead = false;
    this.score = 0;
    this.distanceRun = 0;
    this.sessionCoins = 0;
    this.gameStartTime = performance.now();
    this.pausedTime = 0;
    this.playerX = 0;
    this.targetPlayerX = 0;
    this.currentLaneIndex = 1;
    this.playerY = 0;
    this.playerZ = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.runSpeed = TRACK_METRICS.BASE_SPEED;
    this.cameraShake = 0;

    // Reset obstacle queue
    this.clearWorldProps();
    this.nextSpawnZ = -35;

    // Spawn initial sets
    for (let i = 0; i < 6; i++) {
      this.spawnNextObstacleSet();
    }

    soundManager.resetCoinPitch();
    soundManager.startMusic();
    this.callbacks.onStateChange('playing');
  }

  public pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.pauseStart = performance.now();
    soundManager.stopMusic();
    this.callbacks.onStateChange('paused');
  }

  public resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.pausedTime += performance.now() - this.pauseStart;
    soundManager.startMusic();
    this.callbacks.onStateChange('playing');
  }

  public returnToMenu() {
    this.state = 'menu';
    this.isDead = false;
    this.playerX = 0;
    this.targetPlayerX = 0;
    this.currentLaneIndex = 1;
    this.playerY = 0;
    this.playerZ = 0;
    this.clearWorldProps();
    soundManager.stopMusic();
    this.callbacks.onStateChange('menu');
  }

  private clearWorldProps() {
    this.obstacles.forEach((o) => {
      this.scene.remove(o.group);
      o.dispose();
    });
    this.obstacles = [];

    this.trains.forEach((t) => {
      this.scene.remove(t.group);
      t.dispose();
    });
    this.trains = [];

    this.coins.forEach((c) => {
      this.scene.remove(c.group);
      c.dispose();
    });
    this.coins = [];
  }

  // --- CONTROLS ---

  public moveLeft() {
    if (this.state !== 'playing' || this.isDead) return;
    if (this.currentLaneIndex > 0) {
      this.currentLaneIndex--;
      this.targetPlayerX = LANES[this.currentLaneIndex];
      soundManager.playLaneSwitch();
    }
  }

  public moveRight() {
    if (this.state !== 'playing' || this.isDead) return;
    if (this.currentLaneIndex < 2) {
      this.currentLaneIndex++;
      this.targetPlayerX = LANES[this.currentLaneIndex];
      soundManager.playLaneSwitch();
    }
  }

  public jump() {
    if (this.state !== 'playing' || this.isDead) return;
    // Jump if on ground, or cancel slide early into jump
    if (!this.isJumping || this.isSliding) {
      this.isJumping = true;
      this.isSliding = false;
      this.slideTimer = 0;
      this.velocityY = TRACK_METRICS.JUMP_VELOCITY;
      soundManager.playJump();
    }
  }

  public slide() {
    if (this.state !== 'playing' || this.isDead) return;
    // If airborne, slam down immediately!
    if (this.isJumping) {
      this.velocityY = -TRACK_METRICS.JUMP_VELOCITY * 1.6;
    }
    this.isSliding = true;
    this.slideTimer = TRACK_METRICS.SLIDE_DURATION;
    soundManager.playSlide();
  }

  private bindControls() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (this.state === 'playing') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.moveLeft();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.moveRight();
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
          e.preventDefault();
          this.jump();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          this.slide();
        } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          this.pauseGame();
        }
      } else if (this.state === 'paused' && (e.key === 'Escape' || e.key === 'p' || e.key === 'P')) {
        this.resumeGame();
      }
    });

    // Mobile Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.container.addEventListener(
      'touchstart',
      (e) => {
        soundManager.userGestureInit();
        const t = e.changedTouches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = performance.now();
      },
      { passive: true }
    );

    this.container.addEventListener(
      'touchend',
      (e) => {
        if (this.state !== 'playing') return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const dt = performance.now() - touchStartTime;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Min swipe distance of 25px within 400ms
        if (dt < 500 && (absDx > 25 || absDy > 25)) {
          if (absDx > absDy) {
            // Horizontal swipe
            if (dx > 0) this.moveRight();
            else this.moveLeft();
          } else {
            // Vertical swipe
            if (dy < 0) this.jump();
            else this.slide();
          }
        }
      },
      { passive: true }
    );
  }

  // --- PROCEDURAL GENERATION ---

  private spawnNextObstacleSet() {
    const z = this.nextSpawnZ;
    const rand = Math.random();

    // Pick 1 or 2 occupied lanes to always leave at least 1 escape route
    const availableLanes = [0, 1, 2];
    const openLane = Math.floor(Math.random() * 3);
    const lanesToBlock = availableLanes.filter((l) => l !== openLane);

    if (rand < 0.32) {
      // 1. Train obstacle on one lane
      const trainLane = lanesToBlock[Math.floor(Math.random() * lanesToBlock.length)];
      const isMoving = Math.random() < 0.4 && this.distanceRun > 120;
      const train = createTrainModel(
        this.currentMap,
        isMoving ? 'moving' : 'stationary',
        LANES[trainLane]
      );
      train.group.position.z = z - train.length / 2;
      this.scene.add(train.group);
      this.trains.push(train);

      if (isMoving) {
        soundManager.playTrainHorn();
      }

      // Add coins along the open lane
      this.spawnCoinRow(LANES[openLane], z - 5, 4);
    } else if (rand < 0.65) {
      // 2. Barriers (Low jump hurdle or High slide barrier)
      const barrierType: ObstacleType = Math.random() < 0.5 ? 'barrier_low' : 'barrier_high';
      const obsLane = lanesToBlock[0];
      const obs = createObstacle(barrierType, LANES[obsLane], z);
      this.scene.add(obs.group);
      this.obstacles.push(obs);

      if (barrierType === 'barrier_low') {
        // Coin arc jumping over the low barrier
        this.spawnCoinArc(LANES[obsLane], z);
      } else {
        // Row of ground coins sliding under high barrier
        this.spawnCoinRow(LANES[obsLane], z - 4, 3, 0.4);
      }
    } else {
      // 3. Crates or Roadblocks
      lanesToBlock.forEach((laneIdx) => {
        const obsType: ObstacleType = Math.random() < 0.5 ? 'crates' : 'barrier_sign';
        const obs = createObstacle(obsType, LANES[laneIdx], z);
        this.scene.add(obs.group);
        this.obstacles.push(obs);
      });

      // Coins on open lane
      this.spawnCoinRow(LANES[openLane], z - 3, 3);
    }

    // Space between sets (24m - 34m depending on speed)
    const gap = Math.max(22, 34 - this.distanceRun * 0.005);
    this.nextSpawnZ -= gap;
  }

  private spawnCoinRow(laneX: number, startZ: number, count = 3, y = 0.9) {
    const spacing = 2.4;
    for (let i = 0; i < count; i++) {
      const coin = createCoin(laneX, y, startZ - i * spacing);
      this.scene.add(coin.group);
      this.coins.push(coin);
    }
  }

  private spawnCoinArc(laneX: number, centerZ: number) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1; // -1 to +1
      const y = 0.9 + (1 - t * t) * 1.8; // parabolic jump arc
      const coin = createCoin(laneX, y, centerZ - t * 3.5);
      this.scene.add(coin.group);
      this.coins.push(coin);
    }
  }

  // --- COLLISION DETECTION ---

  private checkCollisions() {
    if (this.isDead) return;

    // Player bounding box
    const pWidth = TRACK_METRICS.PLAYER_BOUNDS.width * 0.65;
    const pHeight = this.isSliding
      ? TRACK_METRICS.PLAYER_BOUNDS.heightSlide
      : TRACK_METRICS.PLAYER_BOUNDS.heightNormal;
    const pDepth = TRACK_METRICS.PLAYER_BOUNDS.depth * 0.7;

    this.playerBox.min.set(
      this.playerX - pWidth / 2,
      this.playerY,
      this.playerZ - pDepth / 2
    );
    this.playerBox.max.set(
      this.playerX + pWidth / 2,
      this.playerY + pHeight,
      this.playerZ + pDepth / 2
    );

    // 1. Train Collisions
    for (const train of this.trains) {
      const trainZ = train.group.position.z;
      const trainHalfL = train.length / 2;
      const trainHalfW = train.width / 2;

      this.objBox.min.set(
        train.lane - trainHalfW * 0.85,
        0,
        trainZ - trainHalfL
      );
      this.objBox.max.set(
        train.lane + trainHalfW * 0.85,
        train.height,
        trainZ + trainHalfL
      );

      if (this.playerBox.intersectsBox(this.objBox)) {
        this.triggerCrash('crash');
        return;
      }
    }

    // 2. Obstacle Collisions
    for (const obs of this.obstacles) {
      const halfW = obs.width / 2;
      const halfD = obs.depth / 2;

      this.objBox.min.set(
        obs.laneX - halfW * 0.85,
        obs.minY,
        obs.z - halfD
      );
      this.objBox.max.set(
        obs.laneX + halfW * 0.85,
        obs.maxY,
        obs.z + halfD
      );

      if (this.playerBox.intersectsBox(this.objBox)) {
        // If sliding under high barrier clearance
        if (obs.canSlideUnder && this.isSliding && this.playerY + pHeight < obs.minY + 0.15) {
          continue; // Successfully slipped under!
        }
        // If jumping over low hurdle
        if (obs.canJumpOver && this.isJumping && this.playerY > obs.maxY - 0.2) {
          continue; // Successfully jumped over!
        }

        this.triggerCrash('crash');
        return;
      }
    }

    // 3. Coin Interactions
    for (const coin of this.coins) {
      if (coin.collected) continue;

      this.coinPos.set(coin.laneX, coin.y, coin.z);
      const dist = this.coinPos.distanceTo(
        new THREE.Vector3(this.playerX, this.playerY + 0.8, this.playerZ)
      );

      if (dist < TRACK_METRICS.COIN_RADIUS + 0.55) {
        if (this.mode === 'no-coin') {
          // Touching coin in NO COIN mode is instant defeat!
          this.triggerCrash('coin');
          return;
        } else {
          // Normal mode collection
          coin.collected = true;
          this.scene.remove(coin.group);
          this.sessionCoins++;
          this.score += 60;
          this.triggerCoinBurst(coin.laneX, coin.y, coin.z);
          soundManager.playCoin();
        }
      }
    }
  }

  private triggerCrash(reason: 'crash' | 'coin') {
    this.isDead = true;
    this.state = 'game-over';
    this.cameraShake = 0.5;

    soundManager.playCrash();
    soundManager.stopMusic();

    const elapsedMs = Math.max(0, performance.now() - this.gameStartTime - this.pausedTime);

    this.callbacks.onGameOver({
      mode: this.mode,
      score: Math.floor(this.score),
      distance: Math.floor(this.distanceRun),
      coins: this.sessionCoins,
      survivedMs: Math.floor(elapsedMs),
      reason,
    });
    this.callbacks.onStateChange('game-over');
  }

  // --- RENDER LOOP ---

  private startLoop() {
    this.lastFrameTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const rawDt = (now - this.lastFrameTime) / 1000;
      this.lastFrameTime = now;
      const dt = Math.min(rawDt, 0.05); // clamped delta time

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private update(dt: number) {
    const now = performance.now();
    const elapsedSec = (now - this.gameStartTime - this.pausedTime) / 1000;
    const elapsedMs = Math.max(0, Math.floor(elapsedSec * 1000));

    if (this.state === 'playing' && !this.isDead) {
      // Accelerate speed progressively
      this.runSpeed = Math.min(
        TRACK_METRICS.MAX_SPEED,
        TRACK_METRICS.BASE_SPEED + elapsedSec * TRACK_METRICS.ACCELERATION
      );

      // Advance player forward (-Z)
      const stepZ = this.runSpeed * dt;
      this.playerZ -= stepZ;
      this.distanceRun += stepZ;
      this.score += stepZ * 1.8;

      // Smooth lane switching damping
      this.playerX += (this.targetPlayerX - this.playerX) * Math.min(1, 16 * dt);

      // Jump physics
      if (this.isJumping) {
        this.velocityY -= TRACK_METRICS.GRAVITY * dt;
        this.playerY += this.velocityY * dt;

        if (this.playerY <= 0) {
          this.playerY = 0;
          this.velocityY = 0;
          this.isJumping = false;
        }
      }

      // Slide timer
      if (this.isSliding) {
        this.slideTimer -= dt;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
        }
      }

      // Update character model position & rotation
      if (this.characterModel) {
        this.characterModel.group.position.set(this.playerX, this.playerY, this.playerZ);

        // Dynamic banking tilt into turns
        const laneDiff = this.targetPlayerX - this.playerX;
        this.characterModel.group.rotation.z = -laneDiff * 0.12;

        if (this.isJumping) {
          const jumpProg = Math.max(0, this.playerY / 3.0);
          this.characterModel.updateAnimation('jumping', now * 0.001, jumpProg);
        } else if (this.isSliding) {
          this.characterModel.updateAnimation('sliding', now * 0.001);
        } else {
          this.characterModel.updateAnimation('running', now * 0.001, this.runSpeed / 25);
        }
      }

      // Update moving trains
      this.trains.forEach((t) => t.update(dt));

      // Update spinning coins
      this.coins.forEach((c) => c.update(dt));

      // Collisions check
      this.checkCollisions();

      // Recycle track segments ahead of player
      if (this.playerZ - this.nextTrackZ < TRACK_METRICS.VISIBLE_SEGMENTS * TRACK_METRICS.SEGMENT_LENGTH) {
        const seg = createTrackSegment(this.currentMap, this.nextTrackZ);
        this.trackSegments.push(seg);
        this.scene.add(seg.group);
        this.nextTrackZ -= TRACK_METRICS.SEGMENT_LENGTH;
      }

      // Remove far behind track segments (save memory)
      while (this.trackSegments.length > 0 && this.trackSegments[0].zEnd > this.playerZ + 40) {
        const oldSeg = this.trackSegments.shift()!;
        this.scene.remove(oldSeg.group);
        oldSeg.dispose();
      }

      // Spawn next obstacles
      if (this.playerZ - this.nextSpawnZ < 140) {
        this.spawnNextObstacleSet();
      }

      // Clean up past obstacles, trains, coins
      this.obstacles = this.obstacles.filter((o) => {
        if (o.z > this.playerZ + 20) {
          this.scene.remove(o.group);
          o.dispose();
          return false;
        }
        return true;
      });

      this.trains = this.trains.filter((t) => {
        if (t.group.position.z - t.length / 2 > this.playerZ + 25) {
          this.scene.remove(t.group);
          t.dispose();
          return false;
        }
        return true;
      });

      this.coins = this.coins.filter((c) => {
        if (c.z > this.playerZ + 15 || c.collected) {
          this.scene.remove(c.group);
          c.dispose();
          return false;
        }
        return true;
      });

      // Notify UI
      this.callbacks.onScoreUpdate(
        Math.floor(this.score),
        Math.floor(this.distanceRun),
        this.sessionCoins,
        elapsedMs
      );
    } else if (this.state === 'menu') {
      // Idle stage preview
      if (this.characterModel) {
        this.characterModel.group.position.set(0, 0, 0);
        this.characterModel.updateAnimation('menu', now * 0.001);
      }
    } else if (this.state === 'game-over') {
      if (this.characterModel) {
        this.characterModel.updateAnimation('crashing', now * 0.001);
      }
    }

    // Update coin particles
    this.updateParticles(dt);

    // Update Camera
    this.updateCamera(dt);
  }

  private updateParticles(dt: number) {
    if (!this.coinParticlePositions || !this.coinParticleVelocities || !this.coinParticles) return;
    for (let i = 0; i < 80; i++) {
      if (this.coinParticlePositions[i * 3 + 1] > -50) {
        this.coinParticleVelocities[i * 3 + 1] -= 20 * dt; // gravity
        this.coinParticlePositions[i * 3] += this.coinParticleVelocities[i * 3] * dt;
        this.coinParticlePositions[i * 3 + 1] += this.coinParticleVelocities[i * 3 + 1] * dt;
        this.coinParticlePositions[i * 3 + 2] += this.coinParticleVelocities[i * 3 + 2] * dt;
      }
    }
    this.coinParticles.geometry.attributes.position.needsUpdate = true;
  }

  private updateCamera(dt: number) {
    if (this.state === 'playing') {
      // Third person follow camera
      const targetCamX = this.playerX * 0.75;
      const targetCamY = this.playerY * 0.45 + 3.9;
      const targetCamZ = this.playerZ + 6.8;

      // Exponential damping
      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, 14 * dt);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, 10 * dt);
      this.camera.position.z = targetCamZ;

      // Camera lookahead
      const lookAtX = this.playerX * 0.4;
      const lookAtY = this.playerY * 0.4 + 1.8;
      const lookAtZ = this.playerZ - 12;
      this.camera.lookAt(lookAtX, lookAtY, lookAtZ);

      // Speed FOV expansion (thrill effect!)
      const speedRatio = (this.runSpeed - TRACK_METRICS.BASE_SPEED) / (TRACK_METRICS.MAX_SPEED - TRACK_METRICS.BASE_SPEED);
      const targetFov = 65 + speedRatio * 11;
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 5 * dt);
      this.camera.updateProjectionMatrix();

      // Camera shake on impacts
      if (this.cameraShake > 0) {
        this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
        this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
        this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
      }
    } else if (this.state === 'menu') {
      // Cinematic rotating camera around hero character on title screen
      const time = performance.now() * 0.0004;
      this.camera.position.x = Math.sin(time) * 4.5;
      this.camera.position.z = Math.cos(time) * 4.5;
      this.camera.position.y = 2.2;
      this.camera.fov = 50;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(0, 1.2, 0);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.clearWorldProps();
    this.trackSegments.forEach((s) => s.dispose());
    if (this.characterModel) this.characterModel.dispose();
    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
