import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useTexture } from "@react-three/drei";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import bone from "@/assets/garment-bone.png";
import burgundy from "@/assets/garment-burgundy.png";
import butter from "@/assets/garment-butter.png";
import charcoal from "@/assets/garment-charcoal.png";
import cobalt from "@/assets/garment-cobalt.png";
import forest from "@/assets/garment-forest.png";
import grey from "@/assets/garment-grey.png";
import rust from "@/assets/garment-rust.png";

type Product = {
  name: string;
  edition: string;
  material: string;
  image: string;
};

const products: Product[] = [
  { name: "After Hours Tee", edition: "01 / 08", material: "Washed cotton", image: charcoal },
  { name: "Field Note Crew", edition: "02 / 08", material: "Loopback jersey", image: forest },
  { name: "Sunday Study Tee", edition: "03 / 08", material: "Heavyweight cotton", image: bone },
  { name: "Ramble Rugby", edition: "04 / 08", material: "Brushed cotton", image: rust },
  { name: "Workshop Jacket", edition: "05 / 08", material: "Cotton twill", image: cobalt },
  { name: "Seventh Year Vest", edition: "06 / 08", material: "Marled jersey", image: grey },
  { name: "Windowpane Shirt", edition: "07 / 08", material: "Washed poplin", image: butter },
  { name: "Pine Service Jacket", edition: "08 / 08", material: "Garment-dyed canvas", image: burgundy },
];

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float anchored = smoothstep(0.94, 0.58, uv.y);
    float fold = sin(uv.x * 18.0 + uTime * 2.2) * 0.045;
    float breeze = sin(uv.y * 9.0 - uTime * 1.7 + uv.x * 4.0) * 0.035;
    p.z += (fold + breeze) * anchored * uHover;
    p.x += sin(uv.y * 5.0 + uTime * 1.4) * 0.035 * anchored * uHover;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    if (tex.a < 0.04) discard;
    gl_FragColor = vec4(tex.rgb, tex.a * uAlpha);
  }
`;

function Garment({ product, index, selected, onFocus, onSelect }: {
  product: Product;
  index: number;
  selected: number | null;
  onFocus: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const texture = useTexture(product.image);
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const hovering = useRef(false);
  const rotation = useRef(0);
  const velocity = useRef(0);
  const hoverAmount = useRef(0);
  const x = (index - (products.length - 1) / 2) * 1.42;
  const selectedX = selected === index ? 0 : x;

  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uTime: { value: 0 },
    uHover: { value: 0 },
    uAlpha: { value: 1 },
  }), [texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const node = group.current;
    const mat = material.current;
    if (!node || !mat) return;

    const targetRotation = hovering.current ? (index % 2 === 0 ? -0.42 : 0.42) : 0;
    velocity.current += (targetRotation - rotation.current) * 34 * delta;
    velocity.current *= Math.exp(-7.5 * delta);
    rotation.current += velocity.current * delta;
    hoverAmount.current += ((hovering.current ? 1 : 0) - hoverAmount.current) * (1 - Math.exp(-8 * delta));

    const isSelected = selected === index;
    const targetY = isSelected ? -0.05 : -0.38;
    const targetScale = isSelected ? 1.72 : 1;
    node.position.x = THREE.MathUtils.damp(node.position.x, selectedX, 7, delta);
    node.position.y = THREE.MathUtils.damp(node.position.y, targetY, 7, delta);
    node.position.z = THREE.MathUtils.damp(node.position.z, isSelected ? 1.8 : 0, 7, delta);
    node.scale.setScalar(THREE.MathUtils.damp(node.scale.x, targetScale, 7, delta));
    node.rotation.y = rotation.current;
    node.rotation.z = Math.sin(clock.elapsedTime * 1.7 + index) * 0.008 * hoverAmount.current;
    const timeUniform = mat.uniforms["uTime"];
    const hoverUniform = mat.uniforms["uHover"];
    const alphaUniform = mat.uniforms["uAlpha"];
    if (!timeUniform || !hoverUniform || !alphaUniform) return;
    timeUniform.value = clock.elapsedTime;
    hoverUniform.value = hoverAmount.current;
    alphaUniform.value = THREE.MathUtils.damp(
      alphaUniform.value,
      selected === null || isSelected ? 1 : 0.08,
      8,
      delta,
    );
  });

  return (
    <group ref={group} position={[x, -0.38, 0]}>
      <mesh
        onPointerEnter={(event) => {
          event.stopPropagation();
          hovering.current = true;
          onFocus(index);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          hovering.current = false;
          onFocus(null);
          document.body.style.cursor = "default";
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(index);
        }}
      >
        <planeGeometry args={[1.74, 2.61, 24, 32]} />
        <shaderMaterial
          ref={material}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>
    </group>
  );
}

function RailScene({ selected, railOffset, dragDelta, onFocus, onSelect }: {
  selected: number | null;
  railOffset: number;
  dragDelta: number;
  onFocus: (index: number | null) => void;
  onSelect: (index: number) => void;
}) {
  const { viewport, size } = useThree();
  const garments = useRef<THREE.Group>(null);
  const isMobile = size.width < 700;
  const collectionWidth = 11.7;
  const fit = isMobile ? 0.94 : Math.min(1, (viewport.width - 0.5) / collectionWidth);
  const dragWorld = dragDelta * (viewport.width / size.width) / fit;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!garments.current) return;
    garments.current.position.x = THREE.MathUtils.damp(
      garments.current.position.x,
      selected === null ? railOffset + dragWorld : 0,
      dragDelta === 0 ? 10 : 24,
      delta,
    );
  });

  return (
    <group scale={selected === null ? fit : Math.min(1, viewport.width / 7.4)}>
      <mesh position={[0, 0.84, -0.32]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 12.1, 24]} />
        <meshStandardMaterial color="#969a96" metalness={0.85} roughness={0.22} />
      </mesh>
      <mesh position={[-6.02, 0.84, -0.3]}>
        <boxGeometry args={[0.16, 0.5, 0.18]} />
        <meshStandardMaterial color="#b5b7b2" metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[6.02, 0.84, -0.3]}>
        <boxGeometry args={[0.16, 0.5, 0.18]} />
        <meshStandardMaterial color="#b5b7b2" metalness={0.7} roughness={0.28} />
      </mesh>
      <group ref={garments}>
        {products.map((product, index) => (
          <Garment
            key={product.name}
            product={product}
            index={index}
            selected={selected}
            onFocus={onFocus}
            onSelect={onSelect}
          />
        ))}
      </group>
      <Environment>
        <Lightformer intensity={2.4} position={[0, 5, 4]} scale={[10, 4, 1]} />
        <Lightformer intensity={1.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
    </group>
  );
}

function ProductInfo({ index, onClose, onStep }: {
  index: number;
  onClose: () => void;
  onStep: (direction: number) => void;
}) {
  const product = products[index] ?? products[0];
  if (!product) return null;
  return (
    <div className="detail-layer" aria-label={`${product.name} product detail`}>
      <button className="icon-button detail-close" onClick={onClose} aria-label="Close product detail">
        <X size={18} strokeWidth={1.5} />
      </button>
      <button className="icon-button detail-prev" onClick={() => onStep(-1)} aria-label="Previous garment">
        <ArrowLeft size={18} strokeWidth={1.5} />
      </button>
      <button className="icon-button detail-next" onClick={() => onStep(1)} aria-label="Next garment">
        <ArrowRight size={18} strokeWidth={1.5} />
      </button>
      <section className="detail-copy">
        <p className="edition">{product.edition}</p>
        <h1>{product.name}</h1>
        <p>{product.material} · Limited studio edition</p>
        <button className="outline-button" onClick={() => window.alert("This concept viewer is not connected to inventory.")}>See availability</button>
      </section>
    </div>
  );
}

export function GarmentRail() {
  const [focused, setFocused] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [railOffset, setRailOffset] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const dragged = useRef(false);
  const active = selected ?? focused ?? mobileIndex;
  const activeProduct = products[active] ?? products[0];
  if (!activeProduct) return null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (selected !== null && event.key === "ArrowRight") setSelected((selected + 1) % products.length);
      if (selected !== null && event.key === "ArrowLeft") setSelected((selected - 1 + products.length) % products.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const step = (direction: number) => {
    if (selected === null) return;
    setSelected((selected + direction + products.length) % products.length);
  };

  const finishDrag = () => {
    if (pointerStart.current === null) return;
    const mobile = window.innerWidth < 700;
    if (mobile && Math.abs(dragDelta) > 32) {
      const next = Math.max(0, Math.min(products.length - 1, mobileIndex + (dragDelta < 0 ? 1 : -1)));
      setMobileIndex(next);
      setRailOffset(-((next - (products.length - 1) / 2) * 1.42));
    } else if (!mobile) {
      const nextOffset = Math.max(-3.4, Math.min(3.4, railOffset + dragDelta * 0.011));
      setRailOffset(nextOffset);
      setMobileIndex(Math.max(0, Math.min(products.length - 1, Math.round((products.length - 1) / 2 - nextOffset / 1.42))));
    }
    setDragDelta(0);
    pointerStart.current = null;
    window.setTimeout(() => { dragged.current = false; }, 0);
  };

  useEffect(() => {
    if (window.innerWidth < 700) {
      setRailOffset((products.length - 1) / 2 * 1.42);
    }
  }, []);

  return (
    <main
      className="rail-shell"
      onPointerDown={(event) => {
        if (selected !== null) return;
        pointerStart.current = event.clientX;
        dragged.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (pointerStart.current === null || selected !== null) return;
        const distance = event.clientX - pointerStart.current;
        if (Math.abs(distance) > 5) dragged.current = true;
        setDragDelta(distance);
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <div className="dot-field" aria-hidden="true" />
      <Canvas
        className="rail-canvas"
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [0, 0.15, 8.6], fov: 39 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => setSelected(null)}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 7, 7]} intensity={1.8} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <RailScene
          selected={selected}
          railOffset={railOffset}
          dragDelta={dragDelta}
          onFocus={setFocused}
          onSelect={(index) => {
            if (!dragged.current) setSelected(index);
          }}
        />
      </Canvas>

      <header className="site-header">
        <button className="text-button">About</button>
        <div className="wordmark" aria-label="Kachi Editions"><span>Kachi</span><span>Editions</span></div>
        <button className="text-button">Contact</button>
      </header>

      {selected === null ? (
        <section className="rail-caption" aria-live="polite">
          <p className="edition">{activeProduct.edition}</p>
          <h1>{activeProduct.name}</h1>
          <button className="outline-button" onClick={() => setSelected(active)}>View piece</button>
        </section>
      ) : (
        <ProductInfo index={selected} onClose={() => setSelected(null)} onStep={step} />
      )}

      <div className="ticker" aria-hidden="true">
        <div>NEW OBJECTS, SLOWLY MADE · STUDIO EDITION 01 · CLOTH IN MOTION · NEW OBJECTS, SLOWLY MADE · STUDIO EDITION 01 · CLOTH IN MOTION ·</div>
      </div>
    </main>
  );
}