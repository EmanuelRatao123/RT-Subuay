import * as THREE from 'three';
import { MapDefinition } from '../../types/game';
import { LANES, TRACK_METRICS } from '../constants';

export interface TrackSegment {
  group: THREE.Group;
  zStart: number;
  zEnd: number;
  dispose: () => void;
}

// Helper to create procedural graffiti texture for São Paulo
function createGraffitiTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 512, 128);
    // Colorful graffiti letters
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ec4899';
    ctx.fillText('RT SUBWAY', 30, 75);
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('SP 011', 320, 80);
    // Spray drips
    ctx.fillStyle = '#f59e0b';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(40 + i * 50, 85, 4, 25 + (i % 3) * 10);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// Helper to create Tokyo kanji billboard texture
function createTokyoNeonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 512);
    ctx.font = 'bold 50px sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('新 宿', 75, 100);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('電 鉄', 75, 200);
    ctx.fillStyle = '#eab308';
    ctx.fillText('東 京', 75, 300);
    ctx.fillStyle = '#a855f7';
    ctx.fillText('超 特 急', 50, 420);
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

// Procedural palm tree generator for Tropical map
function createPalmTree(): THREE.Group {
  const palm = new THREE.Group();

  // Curved trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 6, 8);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.9,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(0, 3, 0);
  trunk.rotation.z = -0.15;
  trunk.castShadow = true;
  palm.add(trunk);

  // Palm fronds (leaves)
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const leafGeo = new THREE.ConeGeometry(0.8, 3.2, 4);
    leafGeo.rotateX(Math.PI / 2.5);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.sin(angle) * 0.4, 5.8, Math.cos(angle) * 0.4);
    leaf.rotation.y = angle;
    leaf.castShadow = true;
    palm.add(leaf);
  }

  return palm;
}

export function createTrackSegment(map: MapDefinition, zStart: number): TrackSegment {
  const group = new THREE.Group();
  const segmentLength = TRACK_METRICS.SEGMENT_LENGTH;
  const zEnd = zStart - segmentLength;
  const centerZ = zStart - segmentLength / 2;

  group.position.z = centerZ;

  // Shared Materials
  const ballastMat = new THREE.MeshStandardMaterial({
    color: map.groundColor,
    roughness: 0.95,
    metalness: 0.1,
  });

  const railMat = new THREE.MeshStandardMaterial({
    color: map.railColor,
    roughness: 0.25,
    metalness: 0.85,
    emissive: map.sceneryType === 'futuristic' ? 0x00f0ff : 0x000000,
    emissiveIntensity: map.sceneryType === 'futuristic' ? 0.4 : 0,
  });

  const tieMat = new THREE.MeshStandardMaterial({
    color: map.tieColor,
    roughness: 0.8,
    metalness: 0.2,
  });

  // 1. Ground / Ballast bed
  const ballastGeo = new THREE.BoxGeometry(14, 0.4, segmentLength);
  const ballastMesh = new THREE.Mesh(ballastGeo, ballastMat);
  ballastMesh.position.y = -0.2;
  ballastMesh.receiveShadow = true;
  group.add(ballastMesh);

  // 2. Three sets of railway tracks (Left, Center, Right)
  const railGauge = 1.4; // standard gauge distance between rails

  LANES.forEach((laneX) => {
    // Two steel rails
    [-railGauge / 2, railGauge / 2].forEach((offset) => {
      const railGeo = new THREE.BoxGeometry(0.12, 0.15, segmentLength);
      const railMesh = new THREE.Mesh(railGeo, railMat);
      railMesh.position.set(laneX + offset, 0.08, 0);
      railMesh.receiveShadow = true;
      group.add(railMesh);
    });

    // Railway ties (sleepers) placed along the segment
    const tiesCount = 25;
    const tieSpacing = segmentLength / tiesCount;
    for (let i = 0; i < tiesCount; i++) {
      const tieZ = -segmentLength / 2 + i * tieSpacing;
      const sleeperGeo = new THREE.BoxGeometry(2.4, 0.08, 0.35);
      const sleeperMesh = new THREE.Mesh(sleeperGeo, tieMat);
      sleeperMesh.position.set(laneX, 0.02, tieZ);
      sleeperMesh.receiveShadow = true;
      group.add(sleeperMesh);
    }
  });

  // 3. Side Walls / Scenery Props by Map Type
  const wallHeight = 4.5;
  const wallGeo = new THREE.BoxGeometry(0.8, wallHeight, segmentLength);

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
  });

  if (map.sceneryType === 'sao-paulo') {
    // Graffiti retaining walls & concrete highway pillars
    const graffitiMat = new THREE.MeshStandardMaterial({
      map: createGraffitiTexture(),
      roughness: 0.8,
    });

    const leftWall = new THREE.Mesh(wallGeo, graffitiMat);
    leftWall.position.set(-7.5, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;

    const rightWall = new THREE.Mesh(wallGeo, graffitiMat);
    rightWall.position.set(7.5, wallHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;

    group.add(leftWall, rightWall);

    // Overhead highway overpass
    const overpassGeo = new THREE.BoxGeometry(20, 1.2, 5);
    const overpass = new THREE.Mesh(overpassGeo, concreteMat);
    overpass.position.set(0, 6.2, 0);
    overpass.castShadow = true;
    group.add(overpass);
  } else if (map.sceneryType === 'tokyo') {
    // Tokyo neon billboards and Shinjuku towers
    const neonTexture = createTokyoNeonTexture();
    const neonMat = new THREE.MeshStandardMaterial({
      map: neonTexture,
      emissive: 0xffffff,
      emissiveMap: neonTexture,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    // Billboard left
    const boardGeo = new THREE.BoxGeometry(0.3, 6, 3);
    const leftBoard = new THREE.Mesh(boardGeo, neonMat);
    leftBoard.position.set(-8.2, 5, 0);
    group.add(leftBoard);

    // Neon arch overhead
    const archGeo = new THREE.TorusGeometry(8, 0.2, 8, 24, Math.PI);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 1.2,
    });
    const arch = new THREE.Mesh(archGeo, archMat);
    arch.position.set(0, 0, 0);
    group.add(arch);
  } else if (map.sceneryType === 'tropical') {
    // Ocean plane on one side & golden sand dunes + palm trees
    const oceanGeo = new THREE.PlaneGeometry(35, segmentLength);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.3,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.position.set(24, -0.4, 0);
    group.add(ocean);

    // Palm trees on left and right
    const palm1 = createPalmTree();
    palm1.position.set(-9.5, 0, -12);
    const palm2 = createPalmTree();
    palm2.position.set(9.5, 0, 12);
    group.add(palm1, palm2);
  } else if (map.sceneryType === 'london') {
    // Victorian red/dark brick arches
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.9,
    });
    const leftWall = new THREE.Mesh(wallGeo, brickMat);
    leftWall.position.set(-7.5, wallHeight / 2, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 7.5;
    group.add(leftWall, rightWall);

    // Cast-iron vintage lantern
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.2, 8);
    const pole = new THREE.Mesh(poleGeo, metalMat);
    pole.position.set(-7.0, 2.1, 0);
    const lampGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const lampMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 2.0,
    });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(-7.0, 4.3, 0);
    group.add(pole, lamp);
  } else if (map.sceneryType === 'new-york') {
    // Brick high-rise facades and metal fire-escapes
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
    });
    const leftWall = new THREE.Mesh(wallGeo, brickMat);
    leftWall.position.set(-7.5, wallHeight / 2, 0);
    const rightWall = leftWall.clone();
    rightWall.position.x = 7.5;
    group.add(leftWall, rightWall);

    // Rooftop water tank cylinder
    const tankGeo = new THREE.CylinderGeometry(1.4, 1.4, 2.4, 12);
    const tank = new THREE.Mesh(tankGeo, concreteMat);
    tank.position.set(-10, 6.2, 0);
    group.add(tank);
  } else if (map.sceneryType === 'futuristic') {
    // Cyberpunk floating maglev track with neon energy conduits
    const energyBeamGeo = new THREE.CylinderGeometry(0.1, 0.1, segmentLength, 8);
    energyBeamGeo.rotateX(Math.PI / 2);
    const neonBeamMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const leftBeam = new THREE.Mesh(energyBeamGeo, neonBeamMat);
    leftBeam.position.set(-6.8, 0.5, 0);
    const rightBeam = leftBeam.clone();
    rightBeam.position.x = 6.8;
    group.add(leftBeam, rightBeam);

    // Hologram portal ring
    const ringGeo = new THREE.TorusGeometry(7.5, 0.2, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      emissive: 0x6366f1,
      emissiveIntensity: 1.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(0, 3.8, 0);
    group.add(ring);
  }

  // 4. Overhead railway catenary gantry (wires and mast) every segment
  const gantryMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.6,
  });
  const gantryBeamGeo = new THREE.BoxGeometry(16, 0.35, 0.35);
  const gantryBeam = new THREE.Mesh(gantryBeamGeo, gantryMat);
  gantryBeam.position.set(0, 5.2, 0);
  gantryBeam.castShadow = true;

  const leftPillarGeo = new THREE.CylinderGeometry(0.14, 0.18, 5.2, 8);
  const leftPillar = new THREE.Mesh(leftPillarGeo, gantryMat);
  leftPillar.position.set(-7.8, 2.6, 0);
  leftPillar.castShadow = true;

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 7.8;

  group.add(gantryBeam, leftPillar, rightPillar);

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
    zStart,
    zEnd,
    dispose,
  };
}

const metalMat = new THREE.MeshStandardMaterial({
  color: 0x334155,
  roughness: 0.6,
  metalness: 0.7,
});
