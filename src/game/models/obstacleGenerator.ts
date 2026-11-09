import * as THREE from 'three';

export type ObstacleType =
  | 'barrier_low' // Must jump over or change lane
  | 'barrier_high' // Must slide under or change lane
  | 'barrier_sign' // Tall barrier with warning sign
  | 'crates' // Stack of railway cargo crates
  | 'signal_pole'; // Overhead signal equipment

export interface ObstacleObject {
  group: THREE.Group;
  type: ObstacleType;
  laneX: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  minY: number; // For slide check (e.g. high barrier clearance)
  maxY: number; // For jump check (e.g. low barrier top)
  canSlideUnder: boolean;
  canJumpOver: boolean;
  dispose: () => void;
}

// Procedural caution stripe canvas texture
function createCautionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#facc15'; // Yellow
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#18181b'; // Black
    for (let i = -128; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 16, 0);
      ctx.lineTo(i + 16 + 128, 128);
      ctx.lineTo(i + 128, 128);
      ctx.closePath();
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

const cautionTexture = createCautionTexture();

export function createObstacle(type: ObstacleType, laneX: number, zPos: number): ObstacleObject {
  const group = new THREE.Group();
  group.position.set(laneX, 0, zPos);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    roughness: 0.5,
    metalness: 0.7,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    map: cautionTexture,
    roughness: 0.4,
    metalness: 0.2,
  });

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.8,
    metalness: 0.1,
  });

  const redGlowMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 1.5,
  });

  const greenGlowMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 1.5,
  });

  let width = 2.4;
  let height = 1.0;
  let depth = 0.6;
  let minY = 0;
  let maxY = 1.0;
  let canSlideUnder = false;
  let canJumpOver = false;

  switch (type) {
    case 'barrier_low': {
      // Low hurdle: ~0.9m high. Can be jumped over or dodged!
      height = 0.9;
      depth = 0.5;
      minY = 0;
      maxY = 0.95;
      canJumpOver = true;
      canSlideUnder = false;

      // Two side support legs
      const legGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8);
      const leftLeg = new THREE.Mesh(legGeo, metalMat);
      leftLeg.position.set(-width / 2 + 0.15, 0.45, 0);
      leftLeg.castShadow = true;

      const rightLeg = leftLeg.clone();
      rightLeg.position.x = width / 2 - 0.15;
      group.add(leftLeg, rightLeg);

      // Feet stands
      const footGeo = new THREE.BoxGeometry(0.3, 0.08, 0.5);
      const leftFoot = new THREE.Mesh(footGeo, metalMat);
      leftFoot.position.set(-width / 2 + 0.15, 0.04, 0);
      const rightFoot = leftFoot.clone();
      rightFoot.position.x = width / 2 - 0.15;
      group.add(leftFoot, rightFoot);

      // Caution crossbar
      const barGeo = new THREE.BoxGeometry(width - 0.1, 0.35, 0.15);
      const bar = new THREE.Mesh(barGeo, stripeMat);
      bar.position.set(0, 0.72, 0);
      bar.castShadow = true;
      group.add(bar);

      // Warning lights on tips
      const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const leftTip = new THREE.Mesh(lightGeo, redGlowMat);
      leftTip.position.set(-width / 2 + 0.15, 0.95, 0);
      const rightTip = leftTip.clone();
      rightTip.position.x = width / 2 - 0.15;
      group.add(leftTip, rightTip);
      break;
    }

    case 'barrier_high': {
      // High barrier: clear opening under 1.2m! Player MUST slide under or switch lane.
      height = 3.2;
      depth = 0.6;
      minY = 1.15; // Clearance from ground to bottom of obstacle bar
      maxY = 3.2;
      canSlideUnder = true;
      canJumpOver = false;

      // Tall vertical steel scaffold poles
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
      const leftPole = new THREE.Mesh(poleGeo, metalMat);
      leftPole.position.set(-width / 2 + 0.15, 1.6, 0);
      leftPole.castShadow = true;

      const rightPole = leftPole.clone();
      rightPole.position.x = width / 2 - 0.15;
      group.add(leftPole, rightPole);

      // Overhead heavy caution beam (from y=1.2 to y=2.2)
      const topBeamGeo = new THREE.BoxGeometry(width, 1.0, 0.35);
      const topBeam = new THREE.Mesh(topBeamGeo, stripeMat);
      topBeam.position.set(0, 1.8, 0);
      topBeam.castShadow = true;
      group.add(topBeam);

      // Overhead warning signs
      const signGeo = new THREE.BoxGeometry(1.2, 0.45, 0.4);
      const signMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.3,
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 2.5, 0);
      group.add(sign);
      break;
    }

    case 'barrier_sign': {
      // Full solid barrier with railway stop/construction sign
      height = 1.8;
      depth = 0.6;
      minY = 0;
      maxY = 1.85;
      canSlideUnder = false;
      canJumpOver = false; // Too tall to jump over

      // Solid roadblock barricade
      const boardGeo = new THREE.BoxGeometry(width, 1.2, 0.2);
      const board = new THREE.Mesh(boardGeo, stripeMat);
      board.position.set(0, 0.9, 0);
      board.castShadow = true;
      group.add(board);

      // Support trusses
      [-width / 2 + 0.3, width / 2 - 0.3].forEach((posX) => {
        const postGeo = new THREE.BoxGeometry(0.15, 1.8, 0.15);
        const post = new THREE.Mesh(postGeo, metalMat);
        post.position.set(posX, 0.9, 0);
        group.add(post);

        const braceGeo = new THREE.BoxGeometry(0.1, 0.9, 0.8);
        const brace = new THREE.Mesh(braceGeo, metalMat);
        brace.position.set(posX, 0.45, -0.3);
        group.add(brace);
      });

      // Flashing strobe on top
      const strobeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8);
      const strobe = new THREE.Mesh(strobeGeo, redGlowMat);
      strobe.position.set(0, 1.65, 0);
      group.add(strobe);
      break;
    }

    case 'crates': {
      // Stack of heavy cargo crates
      height = 1.35;
      depth = 1.4;
      minY = 0;
      maxY = 1.4;
      canSlideUnder = false;
      canJumpOver = false;

      // Bottom crate left
      const bCrateGeo = new THREE.BoxGeometry(1.05, 0.9, 1.1);
      const crate1 = new THREE.Mesh(bCrateGeo, woodMat);
      crate1.position.set(-0.55, 0.45, 0);
      crate1.castShadow = true;

      // Bottom crate right
      const crate2 = new THREE.Mesh(bCrateGeo, woodMat);
      crate2.position.set(0.55, 0.45, 0);
      crate2.castShadow = true;

      // Top crate
      const topCrateGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
      const crate3 = new THREE.Mesh(topCrateGeo, metalMat);
      crate3.position.set(0, 1.15, 0);
      crate3.castShadow = true;

      group.add(crate1, crate2, crate3);
      break;
    }

    case 'signal_pole': {
      // Railway semaphore signal on side
      height = 3.6;
      depth = 0.5;
      minY = 0;
      maxY = 3.6;
      canSlideUnder = false;
      canJumpOver = false;

      const mastGeo = new THREE.CylinderGeometry(0.1, 0.14, 3.6, 8);
      const mast = new THREE.Mesh(mastGeo, metalMat);
      mast.position.set(0, 1.8, 0);
      mast.castShadow = true;
      group.add(mast);

      // Signal light head
      const boxGeo = new THREE.BoxGeometry(0.45, 1.1, 0.35);
      const box = new THREE.Mesh(boxGeo, metalMat);
      box.position.set(0, 2.7, 0);
      group.add(box);

      // Red and green lenses
      const lensGeo = new THREE.SphereGeometry(0.12, 10, 10);
      const redLens = new THREE.Mesh(lensGeo, redGlowMat);
      redLens.position.set(0, 2.95, 0.18);
      const greenLens = new THREE.Mesh(lensGeo, greenGlowMat);
      greenLens.position.set(0, 2.45, 0.18);
      group.add(redLens, greenLens);
      break;
    }
  }

  const dispose = () => {
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  };

  return {
    group,
    type,
    laneX,
    z: zPos,
    width,
    height,
    depth,
    minY,
    maxY,
    canSlideUnder,
    canJumpOver,
    dispose,
  };
}
