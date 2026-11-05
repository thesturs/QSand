import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

interface Reactor3DChamberProps {
  visible: boolean;
  exothermicIndex: number;
  activeParticles: number;
  containmentIntegrity: number;
  simulationCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

// Reusable scratch objects at module scope (Zero GC in render loop)
const _targetCamPos = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3(0, 1.35, 0);
const _coreColor = new THREE.Color();

export const Reactor3DChamber: React.FC<Reactor3DChamberProps> = ({
  visible,
  exothermicIndex,
  activeParticles,
  containmentIntegrity,
  simulationCanvasRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef({
    visible,
    exothermicIndex,
    activeParticles,
    containmentIntegrity,
  });

  useEffect(() => {
    propsRef.current = {
      visible,
      exothermicIndex,
      activeParticles,
      containmentIntegrity,
    };
  }, [visible, exothermicIndex, activeParticles, containmentIntegrity]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || 320, container.clientHeight || 220);

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0x0a0d14;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.065);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || 320) / (container.clientHeight || 220),
      0.1,
      50
    );
    camera.position.set(0, 2.5, 5.2);
    camera.lookAt(_lookAtTarget);

    // Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffb478, 2.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x00d4ff, 2.5, 12);
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    // Procedural brushed metal bump texture
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 64;
    bumpCanvas.height = 64;
    const bCtx = bumpCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 64, 64);
      for (let y = 0; y < 64; y += 2) {
        bCtx.fillStyle = y % 4 === 0 ? '#969696' : '#6a6a6a';
        bCtx.fillRect(0, y, 64, 1);
      }
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;

    // Ground platform & soft radial contact shadow
    const floorGeo = new THREE.CircleGeometry(6, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111520,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const shadowGeo = new THREE.CircleGeometry(1.85, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.015;
    scene.add(contactShadow);

    // Composite 8-Part Procedural Quantum Reactor Vessel (Bottom-Center Pivot at Y=0)
    const reactorGroup = new THREE.Group();
    reactorGroup.position.set(0, 0, 0);
    scene.add(reactorGroup);

    // Part 1: Primary Heavy Base Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.35, 1.55, 0.35, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.75,
      metalness: 0.45,
      bumpMap: bumpTex,
      bumpScale: 0.015,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.175;
    pedestal.castShadow = true;
    reactorGroup.add(pedestal);

    // Part 2: Lower Anisotropic Copper Induction Ring
    const lowerRingGeo = new THREE.TorusGeometry(1.15, 0.09, 16, 32);
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.25,
      metalness: 0.9,
    });
    const lowerRing = new THREE.Mesh(lowerRingGeo, copperMat);
    lowerRing.rotation.x = Math.PI / 2;
    lowerRing.position.y = 0.42;
    reactorGroup.add(lowerRing);

    // Part 3: Procedural Plasma Core Screen Texture (avoids glCopySubTextureCHROMIUM warnings)
    const coreCanvas = document.createElement('canvas');
    coreCanvas.width = 64;
    coreCanvas.height = 64;
    const cCtx = coreCanvas.getContext('2d');
    if (cCtx) {
      const grad = cCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, '#ffae00');
      grad.addColorStop(0.5, '#f97316');
      grad.addColorStop(1, '#0f172a');
      cCtx.fillStyle = grad;
      cCtx.fillRect(0, 0, 64, 64);
    }
    const simTex = new THREE.CanvasTexture(coreCanvas);
    simTex.colorSpace = THREE.SRGBColorSpace;
    simTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const corePlaneGeo = new THREE.BoxGeometry(1.45, 0.95, 0.14);
    const corePlaneMat = new THREE.MeshStandardMaterial({
      map: simTex,
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.15,
      emissive: new THREE.Color(0xff7b00),
      emissiveMap: simTex,
      emissiveIntensity: 0.65,
    });
    const coreScreen = new THREE.Mesh(corePlaneGeo, corePlaneMat);
    coreScreen.position.y = 1.35;
    reactorGroup.add(coreScreen);

    // Part 4: Emissive Plasma Core Sphere
    const plasmaGeo = new THREE.OctahedronGeometry(0.32, 2);
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: 0xff7b00,
      emissive: 0xff5500,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.1,
    });
    const plasmaCore = new THREE.Mesh(plasmaGeo, plasmaMat);
    plasmaCore.position.set(0, 1.35, -0.35);
    reactorGroup.add(plasmaCore);

    // Part 5: Outer Containment Glass Cylinder (Transmission / Opacity Fallback)
    const glassGeo = new THREE.CylinderGeometry(1.18, 1.18, 1.85, 24, 1, true);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: isSoftwareGl ? 0 : 0.92,
      transparent: true,
      opacity: isSoftwareGl ? 0.28 : 1.0,
      roughness: 0.1,
      metalness: 0.05,
      ior: 1.52,
      thickness: 0.5,
      depthWrite: false,
    });
    const glassCylinder = new THREE.Mesh(glassGeo, glassMat);
    glassCylinder.position.y = 1.35;
    glassCylinder.renderOrder = 2;
    reactorGroup.add(glassCylinder);

    // Part 6: Upper Magnetic Torus Crown
    const upperRing = new THREE.Mesh(lowerRingGeo, copperMat);
    upperRing.rotation.x = Math.PI / 2;
    upperRing.position.y = 2.28;
    reactorGroup.add(upperRing);

    // Part 7: Top Telemetry Dome Cap (Lathe/Cylinder composite)
    const capGeo = new THREE.CylinderGeometry(0.75, 1.25, 0.28, 24);
    const capMesh = new THREE.Mesh(capGeo, pedestalMat);
    capMesh.position.y = 2.45;
    reactorGroup.add(capMesh);

    // Part 8: 4 Vertical Structural Struts + Instanced Cooling Fins (>20 instances)
    const strutGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.05, 12);
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.85,
    });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.set(Math.cos(angle) * 1.24, 1.35, Math.sin(angle) * 1.24);
      reactorGroup.add(strut);
    }

    const finCount = 24;
    const finGeo = new THREE.BoxGeometry(0.18, 0.06, 0.08);
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.8,
    });
    const finInstanced = new THREE.InstancedMesh(finGeo, finMat, finCount);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    for (let i = 0; i < finCount; i++) {
      const ringIdx = i % 12;
      const tier = Math.floor(i / 12);
      const ang = (ringIdx / 12) * Math.PI * 2;
      dummy.position.set(
        Math.cos(ang) * 1.38,
        0.55 + tier * 1.6,
        Math.sin(ang) * 1.38
      );
      dummy.rotation.y = -ang;
      const s = 0.9 + (i % 3) * 0.1;
      dummy.scale.set(s, 1, 1);
      dummy.updateMatrix();
      finInstanced.setMatrixAt(i, dummy.matrix);
      tint.setHSL(0.55 + (i % 4) * 0.02, 0.8, 0.55);
      finInstanced.setColorAt(i, tint);
    }
    finInstanced.instanceMatrix.needsUpdate = true;
    if (finInstanced.instanceColor) finInstanced.instanceColor.needsUpdate = true;
    finInstanced.computeBoundingSphere();
    reactorGroup.add(finInstanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let isDisposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();

      const { visible: isVis, exothermicIndex: exo } = propsRef.current;

      if (isVis) {
        const spinSpeed = 0.35 + (exo / 100) * 1.4;
        reactorGroup.rotation.y += dt * spinSpeed * 0.45;
        plasmaCore.rotation.x += dt * 1.2;
        plasmaCore.rotation.z += dt * 0.9;

        // Exponentially damped camera breathing orbit
        _targetCamPos.set(
          Math.sin(elapsed * 0.35) * 0.85,
          2.35 + Math.sin(elapsed * 0.5) * 0.15,
          4.85
        );
        const alpha = 1 - Math.exp(-4 * dt);
        camera.position.lerp(_targetCamPos, alpha);
        camera.lookAt(_lookAtTarget);

        // Adjust core color by exothermic index
        _coreColor.setHSL(
          Math.max(0.02, 0.55 - (exo / 100) * 0.52),
          0.9,
          0.55
        );
        plasmaMat.emissive.copy(_coreColor);

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 220;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      floorGeo.dispose();
      floorMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      lowerRingGeo.dispose();
      copperMat.dispose();
      corePlaneGeo.dispose();
      corePlaneMat.dispose();
      plasmaGeo.dispose();
      plasmaMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      capGeo.dispose();
      strutGeo.dispose();
      strutMat.dispose();
      finGeo.dispose();
      finMat.dispose();
      bumpTex.dispose();
      simTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [simulationCanvasRef]);

  return (
    <div
      ref={mountRef}
      data-testid="reactor-3d-chamber"
      className="w-full h-full relative overflow-hidden rounded-lg border border-slate-800 bg-[#0a0d14]"
    />
  );
};
