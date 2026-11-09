import * as THREE from 'three';
import { MapDefinition } from '../../types/game';

export interface TrainObject {
  group: THREE.Group;
  type: 'stationary' | 'moving';
  lane: number;
  speed: number;
  length: number;
  width: number;
  height: number;
  update: (delta: number) => void;
  dispose: () => void;
}

export function createTrainModel(
  map: MapDefinition,
  type: 'stationary' | 'moving',
  laneX: number,
  isMaglev = false
): TrainObject {
  const group = new THREE.Group();
  group.position.x = laneX;

  const length = 22; // Train car length
  const width = 2.4;
  const height = 3.4;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: map.trainColor1,
    roughness: 0.35,
    metalness: 0.65,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: map.trainColor2,
    roughness: 0.3,
    metalness: 0.5,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.7,
    metalness: 0.8,
  });

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.9,
    emissive: map.sceneryType === 'futuristic' ? 0x00f0ff : (map.sceneryType === 'tokyo' ? 0xd946ef : 0xfef08a),
    emissiveIntensity: 0.45,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfffed0,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff1e00,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });

  // 1. Train Body (Main chassis)
  const bodyGeo = new THREE.BoxGeometry(width, height - 0.6, length);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = height / 2 + 0.3;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Decorative side stripe
  const stripeGeo = new THREE.BoxGeometry(width + 0.04, 0.45, length + 0.02);
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.y = height / 2 + 0.1;
  group.add(stripeMesh);

  // 3. Curved/sloped roof
  const roofGeo = new THREE.CylinderGeometry(width / 2, width / 2, length, 12, 1, false, 0, Math.PI);
  roofGeo.rotateZ(Math.PI / 2);
  roofGeo.rotateY(Math.PI / 2);
  const roofMesh = new THREE.Mesh(roofGeo, darkMetalMat);
  roofMesh.position.y = height;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // AC Units on roof
  for (let zOffset = -6; zOffset <= 6; zOffset += 6) {
    const acGeo = new THREE.BoxGeometry(width * 0.7, 0.35, 2.2);
    const acMesh = new THREE.Mesh(acGeo, darkMetalMat);
    acMesh.position.set(0, height + 0.18, zOffset);
    group.add(acMesh);
  }

  // 4. Windows (Side rows)
  for (let zOffset = -8; zOffset <= 8; zOffset += 2.8) {
    // Left window
    const winGeo = new THREE.BoxGeometry(0.08, 0.8, 1.8);
    const leftWin = new THREE.Mesh(winGeo, windowMat);
    leftWin.position.set(-width / 2 - 0.02, height / 2 + 0.45, zOffset);
    group.add(leftWin);

    // Right window
    const rightWin = leftWin.clone();
    rightWin.position.x = width / 2 + 0.02;
    group.add(rightWin);
  }

  // 5. Front Windshield & Headlights (Front facing Z-)
  const frontWindshieldGeo = new THREE.BoxGeometry(width * 0.82, 0.9, 0.1);
  const frontWindshield = new THREE.Mesh(frontWindshieldGeo, windowMat);
  frontWindshield.position.set(0, height / 2 + 0.65, -length / 2 - 0.02);
  group.add(frontWindshield);

  // Dual Headlights
  const lightGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12);
  lightGeo.rotateX(Math.PI / 2);
  const leftHeadlight = new THREE.Mesh(lightGeo, headlightMat);
  leftHeadlight.position.set(-width * 0.32, height / 2 - 0.4, -length / 2 - 0.05);

  const rightHeadlight = leftHeadlight.clone();
  rightHeadlight.position.x = width * 0.32;
  group.add(leftHeadlight, rightHeadlight);

  // Rear Taillights (Facing Z+)
  const leftTaillight = new THREE.Mesh(lightGeo, taillightMat);
  leftTaillight.position.set(-width * 0.32, height / 2 - 0.4, length / 2 + 0.05);
  const rightTaillight = leftTaillight.clone();
  rightTaillight.position.x = width * 0.32;
  group.add(leftTaillight, rightTaillight);

  // 6. Underbody: Wheels / Bogies or Futuristic Maglev Glow
  if (isMaglev || map.sceneryType === 'futuristic') {
    // Levitating neon repulsion strip
    const glowGeo = new THREE.BoxGeometry(width * 0.9, 0.1, length * 0.95);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.y = 0.25;
    group.add(glowMesh);
  } else {
    // Steel bogie wheels & bumper
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.25, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    const bogieZPositions = [-length / 2 + 3, length / 2 - 3];
    bogieZPositions.forEach((bz) => {
      // Bogie frame
      const frameGeo = new THREE.BoxGeometry(width * 0.95, 0.3, 3.2);
      const frameMesh = new THREE.Mesh(frameGeo, darkMetalMat);
      frameMesh.position.set(0, 0.38, bz);
      group.add(frameMesh);

      // 4 wheels per bogie
      [-1, 1].forEach((side) => {
        [-1, 1].forEach((wheelOff) => {
          const wheel = new THREE.Mesh(wheelGeo, darkMetalMat);
          wheel.position.set(side * (width / 2 - 0.2), 0.38, bz + wheelOff * 0.9);
          wheel.castShadow = true;
          group.add(wheel);
        });
      });
    });

    // Front cowcatcher / plow
    const cowcatcherGeo = new THREE.ConeGeometry(0.9, 0.45, 4);
    cowcatcherGeo.rotateX(Math.PI / 2);
    cowcatcherGeo.rotateZ(Math.PI / 4);
    const cowcatcher = new THREE.Mesh(cowcatcherGeo, darkMetalMat);
    cowcatcher.position.set(0, 0.28, -length / 2 - 0.3);
    group.add(cowcatcher);
  }

  // Update speed: moving trains move toward player (+Z)
  const trainSpeed = type === 'moving' ? 14 : 0;

  const update = (delta: number) => {
    if (type === 'moving') {
      group.position.z += trainSpeed * delta;
    }
  };

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
    lane: laneX,
    speed: trainSpeed,
    length,
    width,
    height,
    update,
    dispose,
  };
}
