import * as THREE from 'three';
import { SkinDefinition } from '../../types/game';

export interface AnimatedCharacter {
  group: THREE.Group;
  skin: SkinDefinition;
  updateAnimation: (state: 'running' | 'jumping' | 'sliding' | 'crashing' | 'menu', time: number, param?: number) => void;
  dispose: () => void;
}

export function createCharacterModel(skin: SkinDefinition): AnimatedCharacter {
  const root = new THREE.Group();

  // Color materials
  const outfitMat = new THREE.MeshStandardMaterial({
    color: skin.outfitColor,
    roughness: 0.55,
    metalness: 0.15,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: skin.accentColor,
    roughness: 0.35,
    metalness: skin.id === 'rex-mecha' || skin.id === 'golden-runner' ? 0.8 : 0.25,
    emissive: skin.id === 'rex-mecha' || skin.id === 'maya-cyber' || skin.id === 'futuristic' ? skin.accentColor : '#000000',
    emissiveIntensity: 0.3,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: skin.skinTone,
    roughness: 0.7,
    metalness: 0.05,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: skin.hairColor,
    roughness: 0.6,
    metalness: 0.1,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    metalness: 0.2,
  });

  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    metalness: 0.1,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Main pivot & sub-components
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.95; // Center of torso
  root.add(bodyGroup);

  // 1. Torso (composite 2-part: upper jacket + lower waist)
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.32);
  const torso = new THREE.Mesh(torsoGeo, outfitMat);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Torso stripe / logo accent
  const stripeGeo = new THREE.BoxGeometry(0.56, 0.12, 0.33);
  const stripe = new THREE.Mesh(stripeGeo, accentMat);
  torso.add(stripe);

  // 2. Head & Neck
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.52, 0);
  bodyGroup.add(headGroup);

  const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Stylized Sunglasses / Visor
  const visorGeo = new THREE.BoxGeometry(0.38, 0.12, 0.18);
  const visor = new THREE.Mesh(visorGeo, skin.id === 'rex-mecha' || skin.id === 'maya-cyber' ? accentMat : darkMat);
  visor.position.set(0, 0.04, 0.13);
  headGroup.add(visor);

  // Headwear according to character
  if (skin.hatType === 'cap') {
    const capGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4);
    const cap = new THREE.Mesh(capGeo, accentMat);
    cap.position.y = 0.18;
    headGroup.add(cap);

    // Bill turned backward (classic street runner)
    const billGeo = new THREE.BoxGeometry(0.34, 0.04, 0.22);
    const bill = new THREE.Mesh(billGeo, accentMat);
    bill.position.set(0, 0.12, -0.28);
    headGroup.add(bill);
  } else if (skin.hatType === 'headphones') {
    const bandGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 16, Math.PI);
    const band = new THREE.Mesh(bandGeo, darkMat);
    band.rotation.x = Math.PI;
    band.position.y = 0.14;
    headGroup.add(band);

    const cupGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12);
    cupGeo.rotateZ(Math.PI / 2);
    const leftCup = new THREE.Mesh(cupGeo, accentMat);
    leftCup.position.set(-0.21, 0.02, 0);
    const rightCup = leftCup.clone();
    rightCup.position.x = 0.21;
    headGroup.add(leftCup, rightCup);
  } else if (skin.hatType === 'helmet') {
    const helmetGeo = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const helmet = new THREE.Mesh(helmetGeo, accentMat);
    helmet.position.y = 0.05;
    headGroup.add(helmet);
  } else if (skin.hatType === 'beanie') {
    const beanieGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.22, 12);
    const beanie = new THREE.Mesh(beanieGeo, accentMat);
    beanie.position.y = 0.22;
    headGroup.add(beanie);
  } else if (skin.hatType === 'ninja') {
    const cowlGeo = new THREE.BoxGeometry(0.4, 0.22, 0.38);
    const cowl = new THREE.Mesh(cowlGeo, darkMat);
    cowl.position.set(0, -0.08, 0.02);
    headGroup.add(cowl);

    const plateGeo = new THREE.BoxGeometry(0.26, 0.08, 0.04);
    const plate = new THREE.Mesh(plateGeo, whiteMat);
    plate.position.set(0, 0.14, 0.19);
    headGroup.add(plate);
  } else if (skin.hatType === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.14, 8);
    const crown = new THREE.Mesh(crownGeo, goldMat);
    crown.position.y = 0.26;
    headGroup.add(crown);
  } else {
    // Hair mesh
    const hairGeo = new THREE.BoxGeometry(0.4, 0.18, 0.4);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.18;
    headGroup.add(hair);
  }

  // Back accessories
  if (skin.accessory === 'backpack') {
    const bagGeo = new THREE.BoxGeometry(0.38, 0.45, 0.2);
    const bag = new THREE.Mesh(bagGeo, accentMat);
    bag.position.set(0, 0.02, -0.22);
    bag.castShadow = true;
    bodyGroup.add(bag);
  } else if (skin.accessory === 'skateboard') {
    const boardGeo = new THREE.BoxGeometry(0.22, 0.85, 0.06);
    const board = new THREE.Mesh(boardGeo, accentMat);
    board.position.set(0, 0, -0.2);
    board.rotation.z = 0.3;
    bodyGroup.add(board);
  } else if (skin.accessory === 'katana') {
    const sheathGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
    const sheath = new THREE.Mesh(sheathGeo, darkMat);
    sheath.position.set(-0.12, 0.05, -0.2);
    sheath.rotation.z = -0.55;
    bodyGroup.add(sheath);
  } else if (skin.accessory === 'jetpack') {
    const thrusterGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.45, 12);
    const leftThruster = new THREE.Mesh(thrusterGeo, darkMat);
    leftThruster.position.set(-0.18, 0, -0.22);
    const rightThruster = leftThruster.clone();
    rightThruster.position.x = 0.18;
    bodyGroup.add(leftThruster, rightThruster);
  } else if (skin.accessory === 'spraycan') {
    const canGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8);
    const can = new THREE.Mesh(canGeo, accentMat);
    can.position.set(-0.25, -0.15, -0.15);
    can.rotation.z = 0.4;
    bodyGroup.add(can);
  } else if (skin.accessory === 'cape') {
    const capeGeo = new THREE.BoxGeometry(0.48, 0.8, 0.04);
    const cape = new THREE.Mesh(capeGeo, accentMat);
    cape.position.set(0, -0.18, -0.2);
    cape.rotation.x = 0.2;
    bodyGroup.add(cape);
  }

  // 3. Arms (Pivot at shoulders)
  const armGeo = new THREE.BoxGeometry(0.14, 0.55, 0.14);
  const handGeo = new THREE.BoxGeometry(0.12, 0.14, 0.12);

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.35, 0.24, 0);
  const leftArm = new THREE.Mesh(armGeo, outfitMat);
  leftArm.position.y = -0.22;
  leftArm.castShadow = true;
  leftArmGroup.add(leftArm);
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.y = -0.48;
  leftArmGroup.add(leftHand);
  bodyGroup.add(leftArmGroup);

  // Right Arm
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.35, 0.24, 0);
  const rightArm = new THREE.Mesh(armGeo, outfitMat);
  rightArm.position.y = -0.22;
  rightArm.castShadow = true;
  rightArmGroup.add(rightArm);
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.y = -0.48;
  rightArmGroup.add(rightHand);
  bodyGroup.add(rightArmGroup);

  // 4. Legs (Pivot at hips)
  const legGeo = new THREE.BoxGeometry(0.18, 0.58, 0.18);
  const shoeGeo = new THREE.BoxGeometry(0.2, 0.16, 0.32);

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.16, -0.32, 0);
  const leftLeg = new THREE.Mesh(legGeo, outfitMat);
  leftLeg.position.y = -0.26;
  leftLeg.castShadow = true;
  leftLegGroup.add(leftLeg);
  const leftShoe = new THREE.Mesh(shoeGeo, accentMat);
  leftShoe.position.set(0, -0.52, 0.06);
  leftShoe.castShadow = true;
  leftLegGroup.add(leftShoe);
  bodyGroup.add(leftLegGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.16, -0.32, 0);
  const rightLeg = new THREE.Mesh(legGeo, outfitMat);
  rightLeg.position.y = -0.26;
  rightLeg.castShadow = true;
  rightLegGroup.add(rightLeg);
  const rightShoe = new THREE.Mesh(shoeGeo, accentMat);
  rightShoe.position.set(0, -0.52, 0.06);
  rightShoe.castShadow = true;
  rightLegGroup.add(rightShoe);
  bodyGroup.add(rightLegGroup);

  // 5. Contact Shadow Disc on ground
  const shadowGeo = new THREE.CircleGeometry(0.48, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // Kinematic animation update function
  const updateAnimation = (
    state: 'running' | 'jumping' | 'sliding' | 'crashing' | 'menu',
    time: number,
    param = 0
  ) => {
    switch (state) {
      case 'running': {
        const runFreq = 16.0;
        const swing = Math.sin(time * runFreq);
        const bob = Math.abs(Math.sin(time * runFreq * 0.5)) * 0.12;

        bodyGroup.position.y = 0.95 + bob;
        bodyGroup.rotation.x = 0.16; // Lean forward into run
        bodyGroup.rotation.z = Math.sin(time * runFreq * 0.5) * 0.05;
        bodyGroup.scale.set(1, 1, 1);

        // Legs alternate swing
        leftLegGroup.rotation.x = swing * 0.85;
        rightLegGroup.rotation.x = -swing * 0.85;

        // Arms counter-swing
        leftArmGroup.rotation.x = -swing * 0.75;
        rightArmGroup.rotation.x = swing * 0.75;
        leftArmGroup.rotation.z = 0.12;
        rightArmGroup.rotation.z = -0.12;

        shadowMesh.scale.set(1 - bob * 1.5, 1 - bob * 1.5, 1);
        break;
      }

      case 'jumping': {
        // param is normalized jump progress (0 -> 1)
        bodyGroup.rotation.x = -0.15;
        bodyGroup.rotation.z = 0;
        bodyGroup.scale.set(1, 1, 1);

        // Tuck legs slightly during jump
        leftLegGroup.rotation.x = -0.45;
        rightLegGroup.rotation.x = 0.3;
        leftArmGroup.rotation.x = -1.2;
        rightArmGroup.rotation.x = -1.2;
        leftArmGroup.rotation.z = 0.4;
        rightArmGroup.rotation.z = -0.4;

        // Shadow shrinks as height increases
        const jumpH = Math.max(0.2, 1 - param * 0.6);
        shadowMesh.scale.set(jumpH, jumpH, jumpH);
        break;
      }

      case 'sliding': {
        // Flattened crouch pose
        bodyGroup.position.y = 0.42;
        bodyGroup.rotation.x = 0.95; // Prone/slide pitch forward
        bodyGroup.rotation.z = 0;
        bodyGroup.scale.set(1.1, 0.65, 1.2);

        leftLegGroup.rotation.x = -1.3;
        rightLegGroup.rotation.x = -1.1;
        leftArmGroup.rotation.x = 1.1;
        rightArmGroup.rotation.x = 1.1;

        shadowMesh.scale.set(1.4, 1.4, 1.4);
        break;
      }

      case 'crashing': {
        // Spin and tumble backwards
        bodyGroup.rotation.x += 0.2;
        bodyGroup.rotation.y += 0.15;
        bodyGroup.position.y = Math.max(0.3, bodyGroup.position.y - 0.05);
        leftArmGroup.rotation.x = 2.0;
        rightArmGroup.rotation.x = -2.0;
        break;
      }

      case 'menu': {
        // Idle breathing and stylish ready stance
        const breathe = Math.sin(time * 2.5) * 0.04;
        bodyGroup.position.y = 0.95 + breathe;
        bodyGroup.rotation.x = 0;
        bodyGroup.rotation.y = Math.sin(time * 1.5) * 0.1;
        bodyGroup.rotation.z = 0;
        bodyGroup.scale.set(1, 1, 1);

        leftLegGroup.rotation.x = 0.1;
        rightLegGroup.rotation.x = -0.1;
        leftArmGroup.rotation.x = 0.2 + breathe * 2;
        rightArmGroup.rotation.x = -0.2 - breathe * 2;
        leftArmGroup.rotation.z = 0.15;
        rightArmGroup.rotation.z = -0.15;

        shadowMesh.scale.set(1, 1, 1);
        break;
      }
    }
  };

  const dispose = () => {
    root.traverse((obj) => {
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

  return { group: root, skin, updateAnimation, dispose };
}
