import * as THREE from 'three';

export interface CoinObject {
  group: THREE.Group;
  laneX: number;
  z: number;
  y: number;
  collected: boolean;
  update: (delta: number) => void;
  dispose: () => void;
}

// Shared coin geometry and material for high performance
const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 16);
coinGeo.rotateZ(Math.PI / 2);

const starGeo = new THREE.BoxGeometry(0.12, 0.45, 0.14);

const goldMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd700,
  metalness: 0.95,
  roughness: 0.18,
  emissive: 0xd97706,
  emissiveIntensity: 0.25,
});

const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0xfff066,
  metalness: 0.9,
  roughness: 0.15,
});

export function createCoin(laneX: number, yPos: number, zPos: number): CoinObject {
  const group = new THREE.Group();
  group.position.set(laneX, yPos, zPos);

  // Main cylinder coin body
  const coinMesh = new THREE.Mesh(coinGeo, goldMaterial);
  coinMesh.castShadow = true;
  group.add(coinMesh);

  // Raised edge rim
  const rimGeo = new THREE.TorusGeometry(0.42, 0.04, 8, 16);
  rimGeo.rotateY(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
  group.add(rimMesh);

  // Center star / symbol accent
  const starMesh = new THREE.Mesh(starGeo, rimMaterial);
  group.add(starMesh);

  const starMesh2 = starMesh.clone();
  starMesh2.rotation.x = Math.PI / 2;
  group.add(starMesh2);

  let rotationSpeed = 3.5;
  let floatPhase = Math.random() * Math.PI * 2;

  const update = (delta: number) => {
    group.rotation.y += rotationSpeed * delta;
    floatPhase += delta * 4;
    group.position.y = yPos + Math.sin(floatPhase) * 0.08;
  };

  const dispose = () => {
    // Shared geometry and materials don't need disposal per coin
  };

  return {
    group,
    laneX,
    z: zPos,
    y: yPos,
    collected: false,
    update,
    dispose,
  };
}
