"use client";

import { useEffect, useRef } from "react";
import type { Drink, DrinkCategory } from "@/types";

function hueFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % 360) / 360;
}

function liquidColorFor(
  category: DrinkCategory,
  seed: string,
  THREE: typeof import("three"),
) {
  const t = hueFromString(seed);
  const c = new THREE.Color();
  if (category === "tea") c.setHSL(0.08 + t * 0.06, 0.55, 0.38);
  else if (category === "lemonade") c.setHSL(0.18 + t * 0.08, 0.75, 0.52);
  else c.setHSL(0.07 + t * 0.04, 0.45, 0.28);
  return c;
}

function disposeScene(scene: import("three").Scene) {
  scene.traverse((obj) => {
    const mesh = obj as import("three").Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const mat = mesh.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

interface Props {
  drink: Drink;
}

type OrbitControlsInstance = InstanceType<
  (typeof import("three/examples/jsm/controls/OrbitControls.js"))["OrbitControls"]
>;

/**
 * Интерактивная 3D-чашка на карточке напитка (вращение пальцем / мышью).
 * Процедурная геометрия по категории; список меню по-прежнему с 2D-фото.
 */
export default function DrinkHero3D({ drink }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted = true;
    let raf = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let controls: OrbitControlsInstance | null = null;
    let scene: import("three").Scene | null = null;
    const resizeObservers: ResizeObserver[] = [];

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      if (!mounted || !containerRef.current) return;

      scene = new THREE.Scene();

      const width = el.clientWidth || 320;
      const height = el.clientHeight || 208;

      const camera = new THREE.PerspectiveCamera(
        38,
        width / Math.max(height, 1),
        0.1,
        100,
      );
      camera.position.set(0, 0.85, 2.85);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (!mounted || !containerRef.current) {
        renderer.dispose();
        renderer = null;
        return;
      }
      el.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.touchAction = "none";

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI / 4;
      controls.maxPolarAngle = Math.PI / 2;
      controls.rotateSpeed = 0.65;
      controls.target.set(0, 0.25, 0);
      controls.update();

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(4, 8, 5);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      scene.add(key);
      const rim = new THREE.SpotLight(0xffb366, 0.35);
      rim.position.set(-3, 5, 2);
      scene.add(rim);

      const group = new THREE.Group();
      group.rotation.set(0.15, 0.6, 0);
      group.scale.setScalar(1.15);

      const cupGeo = new THREE.CylinderGeometry(0.52, 0.42, 1.05, 48);
      const cupMat = new THREE.MeshStandardMaterial({
        color: 0xece8e4,
        roughness: 0.35,
        metalness: 0.15,
      });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.y = -0.05;
      cup.castShadow = true;
      cup.receiveShadow = true;
      group.add(cup);

      const liqGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.72, 36);
      const liqMat = new THREE.MeshStandardMaterial({
        color: liquidColorFor(drink.category, drink.id + drink.name, THREE),
        roughness: 0.25,
        metalness: 0.05,
        transparent: true,
        opacity: 0.96,
      });
      const liquid = new THREE.Mesh(liqGeo, liqMat);
      liquid.position.y = 0.18;
      liquid.castShadow = true;
      group.add(liquid);

      if (drink.category === "coffee") {
        const foam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.46, 0.12, 36),
          new THREE.MeshStandardMaterial({
            color: 0xf5f0ea,
            roughness: 0.9,
            metalness: 0,
          }),
        );
        foam.position.y = 0.52;
        foam.castShadow = true;
        group.add(foam);
      }

      if (drink.category === "lemonade") {
        const straw = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.95, 12),
          new THREE.MeshStandardMaterial({ color: 0xf87171, roughness: 0.4 }),
        );
        straw.position.set(0.22, 0.65, 0.15);
        straw.rotation.set(0.35, 0, 0.4);
        straw.castShadow = true;
        group.add(straw);
      }

      const handle = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.055, 12, 24, Math.PI * 1.3),
        new THREE.MeshStandardMaterial({
          color: 0xe8e4df,
          roughness: 0.4,
          metalness: 0.1,
        }),
      );
      handle.position.set(0.58, 0.12, 0);
      handle.rotation.set(Math.PI / 2, 0, 0);
      handle.castShadow = true;
      group.add(handle);

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 24),
        new THREE.MeshStandardMaterial({
          color: 0x0a0a0c,
          transparent: true,
          opacity: 0.4,
        }),
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.62;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      scene.add(group);

      const tick = () => {
        raf = requestAnimationFrame(tick);
        controls?.update();
        if (renderer && scene) renderer.render(scene, camera);
      };
      tick();

      const ro = new ResizeObserver(() => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (!renderer || !w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
      ro.observe(el);
      resizeObservers.push(ro);
    })();

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      resizeObservers.forEach((o) => o.disconnect());
      controls?.dispose();
      if (scene) disposeScene(scene);
      if (renderer) {
        renderer.dispose();
        const canv = renderer.domElement;
        if (canv.parentNode === el) el.removeChild(canv);
      }
      renderer = null;
      scene = null;
      controls = null;
    };
  }, [drink.id, drink.name, drink.category]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative h-52 w-full min-h-[13rem] cursor-grab touch-none active:cursor-grabbing bg-gradient-to-b from-[#1c1815] to-surface-el"
      />
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-muted/90">
        Крутите пальцем
      </p>
    </div>
  );
}
