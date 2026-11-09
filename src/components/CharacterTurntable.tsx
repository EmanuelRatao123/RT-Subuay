import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SkinDefinition } from '../types/game';
import { createCharacterModel, AnimatedCharacter } from '../game/models/characterGenerator';
import { RotateCcw } from 'lucide-react';

interface Props {
  skin: SkinDefinition;
}

export const CharacterTurntable: React.FC<Props> = ({ skin }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animStateRef = useRef<'menu' | 'running' | 'jumping' | 'sliding'>('menu');
  const [currentAnim, setCurrentAnim] = useState<'menu' | 'running' | 'jumping' | 'sliding'>('menu');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 380;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 1.3, 3.4);
    camera.lookAt(0, 0.9, 0);

    // Studio lighting & reflection
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Rotating Pedestal Base
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.2, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.1;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Glowing neon ring around pedestal
    const ringGeo = new THREE.TorusGeometry(1.15, 0.03, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(skin.accentColor) });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    scene.add(ring);

    // 3D Character
    let charModel: AnimatedCharacter | null = createCharacterModel(skin);
    scene.add(charModel.group);

    // Mouse / touch drag rotation controls
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0;
    let currentRotationY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      targetRotationY += deltaX * 0.015;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Render loop
    let frameId = 0;
    const tick = () => {
      const time = performance.now() * 0.001;

      // Auto slow spin if not dragging
      if (!isDragging) {
        targetRotationY += 0.006;
      }

      currentRotationY += (targetRotationY - currentRotationY) * 0.1;
      if (charModel) {
        charModel.group.rotation.y = currentRotationY;
        charModel.updateAnimation(animStateRef.current, time);
      }
      pedestal.rotation.y = currentRotationY;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      if (charModel) charModel.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [skin]);

  const handleAnimChange = (anim: 'menu' | 'running' | 'jumping' | 'sliding') => {
    animStateRef.current = anim;
    setCurrentAnim(anim);
  };

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-gradient-to-b from-slate-900/80 to-black/90 border border-slate-700/60 overflow-hidden shadow-2xl flex flex-col items-center justify-between p-3">
      {/* Drag instruction badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/70 text-xs text-slate-300">
        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
        <span>Gire com o mouse/touch</span>
      </div>

      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Animation test buttons */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-950/80 border border-slate-700/80">
        {(['menu', 'running', 'jumping', 'sliding'] as const).map((a) => (
          <button
            key={a}
            onClick={() => handleAnimChange(a)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
              currentAnim === a
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {a === 'menu' ? 'Parado' : a === 'running' ? 'Correndo' : a === 'jumping' ? 'Pulo' : 'Deslize'}
          </button>
        ))}
      </div>
    </div>
  );
};
