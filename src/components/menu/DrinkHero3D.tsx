"use client";

import { useEffect, useRef, useState } from "react";
import type { Drink } from "@/types";

const MODEL_URL = "/models/summer_drink2.glb";

function disposeObject(root: import("three").Object3D) {
  root.traverse((obj) => {
    const mesh = obj as import("three").Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

function fitModel(object: import("three").Object3D, THREE: typeof import("three")) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);

  object.position.sub(center);
  object.scale.setScalar(2.8 / maxDim);

  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  return { radius: sphere.radius || 1, centerY: sphere.center.y };
}

interface Props {
  drink: Drink;
}

type OrbitControlsInstance = InstanceType<
  (typeof import("three/examples/jsm/controls/OrbitControls.js"))["OrbitControls"]
>;

export default function DrinkHero3D({ drink: _drink }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted = true;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let controls: OrbitControlsInstance | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;
    let model: import("three").Object3D | null = null;
    const resizeObservers: ResizeObserver[] = [];

    const tick = () => {
      raf = requestAnimationFrame(tick);
      controls?.update();
      if (renderer && scene && camera) renderer.render(scene, camera);
    };

    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );
        const { GLTFLoader } = await import(
          "three/examples/jsm/loaders/GLTFLoader.js"
        );

        if (!mounted || !containerRef.current) return;

        scene = new THREE.Scene();

        const width = Math.max(el.clientWidth, 1);
        const height = Math.max(el.clientHeight, 208);

        camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 500);
        camera.position.set(0, 0.5, 3);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        el.appendChild(renderer.domElement);
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.touchAction = "none";

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = true;
        controls.enablePan = false;
        controls.rotateSpeed = 0.75;
        controls.zoomSpeed = 0.8;
        controls.update();

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.set(4, 8, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffeedd, 0.5);
        fill.position.set(-4, 2, -3);
        scene.add(fill);

        tick();

        const { scene: gltfScene } = await new GLTFLoader().loadAsync(MODEL_URL);
        if (!mounted) {
          disposeObject(gltfScene);
          return;
        }

        const { radius, centerY } = fitModel(gltfScene, THREE);
        model = gltfScene;
        scene.add(gltfScene);

        const dist = Math.max(radius * 1.55, 0.8);
        camera.position.set(0, centerY + radius * 0.15, dist);
        controls.target.set(0, centerY, 0);
        controls.minDistance = dist * 0.55;
        controls.maxDistance = dist * 2.2;
        controls.minPolarAngle = Math.PI / 8;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.update();

        setStatus("ready");

        const ro = new ResizeObserver(() => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!renderer || !camera || !w || !h) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h, false);
        });
        ro.observe(el);
        resizeObservers.push(ro);
      } catch (err) {
        console.error("[DrinkHero3D] GLB load failed:", err);
        if (mounted) setStatus("error");
      }
    })();

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      resizeObservers.forEach((o) => o.disconnect());
      controls?.dispose();
      if (model) disposeObject(model);
      scene?.clear();
      if (renderer) {
        renderer.dispose();
        const canv = renderer.domElement;
        if (canv.parentNode === el) el.removeChild(canv);
      }
      renderer = null;
      scene = null;
      camera = null;
      controls = null;
      model = null;
    };
  }, []);

  return (
    <div className="relative h-52 min-h-[13rem] w-full">
      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-surface to-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange/30 border-t-orange" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-4 text-center text-xs text-muted">
          Не удалось загрузить 3D-модель
        </div>
      )}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
      />
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 z-20 text-center text-[10px] text-muted/90">
        Крутите · pinch для масштаба
      </p>
    </div>
  );
}
