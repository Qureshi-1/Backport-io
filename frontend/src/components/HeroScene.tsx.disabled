"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  Float,
  MeshTransmissionMaterial,
  Environment,
  Stars,
  Sparkles as DreiSparkles,
} from "@react-three/drei";
import * as THREE from "three";

/* ─── GLSL: Cyber Grid Shader ────────────────────────────────────────────── */
const cyberGridVert = `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const cyberGridFrag = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;
  varying vec3 vPos;

  float grid(vec2 uv, float size, float thickness) {
    vec2 lines = abs(fract(uv * size - 0.5) - 0.5) / fwidth(uv * size);
    float line = min(lines.x, lines.y);
    return 1.0 - min(line, thickness);
  }

  void main() {
    vec2 uv = vUv;
    
    // Primary grid
    float g1 = grid(uv, 20.0, 0.8);
    // Secondary grid (larger)
    float g2 = grid(uv, 4.0, 0.5);
    
    // Pulse wave
    float dist = length(uv - 0.5);
    float pulse = sin(dist * 12.0 - uTime * 1.5) * 0.5 + 0.5;
    pulse = smoothstep(0.6, 0.0, dist) * pulse * 0.4;
    
    // Scanline
    float scanline = sin(uv.y * 300.0 + uTime * 2.0) * 0.5 + 0.5;
    scanline = pow(scanline, 8.0) * 0.08;
    
    // Glitch strip
    float glitchT = floor(uTime * 10.0) / 10.0;
    float noise = fract(sin(uv.y * 100.0 + glitchT * 12.3) * 43758.5);
    float glitch = step(0.97, noise) * step(0.0, sin(uTime * 6.28 * 0.5)) * 0.08;
    
    vec3 cyan = vec3(0.0, 0.941, 1.0);
    vec3 green = vec3(0.204, 1.0, 0.549);
    
    vec3 col = mix(cyan, green, uv.x * 0.4 + pulse * 0.3);
    float intensity = g1 * 0.06 + g2 * 0.04 + pulse + scanline + glitch;
    
    gl_FragColor = vec4(col * intensity, intensity * 0.9);
  }
`;

/* ─── GLSL: Shield Core Shader ───────────────────────────────────────────── */
const shieldFrag = `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv - 0.5;
    float r = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Hexagonal shield pattern
    float hex = abs(cos(angle * 3.0)) * 0.5 + 0.5;
    float ring = smoothstep(0.48, 0.45, r) * smoothstep(0.3, 0.38, r);
    float inner = smoothstep(0.2, 0.1, r);
    
    // Energy pulse
    float pulse = sin(r * 20.0 - uTime * 3.0) * 0.5 + 0.5;
    pulse *= smoothstep(0.48, 0.0, r);
    
    // Data streams (rotating lines)
    float stream = sin(angle * 8.0 + uTime * 2.0) * 0.5 + 0.5;
    stream = pow(stream, 12.0) * smoothstep(0.48, 0.35, r) * smoothstep(0.1, 0.3, r);
    
    vec3 col = uColor;
    float alpha = ring * (hex * 0.5 + 0.5) + pulse * 0.3 + stream * 0.6 + inner * 0.1;
    
    gl_FragColor = vec4(col, alpha * 0.85);
  }
`;

/* ─── Cyber Grid Plane ───────────────────────────────────────────────────── */
function CyberGridPlane() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.5, 0]}>
      <planeGeometry args={[20, 20, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={cyberGridVert}
        fragmentShader={cyberGridFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Floating Shield Core ───────────────────────────────────────────────── */
function ShieldCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const outRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x00f0ff) },
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (matRef.current) matRef.current.uniforms.uTime.value = t;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
    if (outRef.current) {
      outRef.current.rotation.y = -t * 0.2;
      outRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
    }
  });

  return (
    <group position={[2.8, 0.2, 0]}>
      {/* Inner glowing core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color="#00f0ff"
          emissive="#00f0ff"
          emissiveIntensity={0.8}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Outer shell - shield disk */}
      <mesh ref={outRef} rotation={[Math.PI / 6, 0, 0]}>
        <circleGeometry args={[1.2, 64]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={cyberGridVert}
          fragmentShader={shieldFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting data nodes */}
      {[0, 1, 2].map((i) => (
        <DataNode key={i} index={i} radius={1.6} />
      ))}

      {/* Point light for glow */}
      <pointLight color="#00f0ff" intensity={3} distance={5} />
    </group>
  );
}

/* ─── Orbiting Data Nodes ────────────────────────────────────────────────── */
function DataNode({ index, radius }: { index: number; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const offset = (index / 3) * Math.PI * 2;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.8 + offset;
    if (ref.current) {
      ref.current.position.x = Math.cos(t) * radius;
      ref.current.position.z = Math.sin(t) * radius;
      ref.current.position.y = Math.sin(t * 1.3) * 0.3;
      ref.current.rotation.y = t;
    }
  });

  const colors = ["#00f0ff", "#34ff8c", "#ffffff"];

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial
        color={colors[index]}
        emissive={colors[index]}
        emissiveIntensity={1.2}
      />
    </mesh>
  );
}

/* ─── Floating Metrics Planes ────────────────────────────────────────────── */
function MetricCard({
  position,
  label,
  value,
  color,
  delay = 0,
}: {
  position: [number, number, number];
  label: string;
  value: string;
  color: string;
  delay?: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + delay;
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.08;
      ref.current.rotation.y = Math.sin(t * 0.3) * 0.05;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <planeGeometry args={[1.4, 0.6]} />
        <meshStandardMaterial
          color="#111111"
          transparent
          opacity={0.85}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      {/* Border glow plane */}
      <mesh position={[0, 0, -0.001]}>
        <planeGeometry args={[1.42, 0.62]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/* ─── Particle Field ─────────────────────────────────────────────────────── */
function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00f0ff"
        size={0.025}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

/* ─── Main Scene ─────────────────────────────────────────────────────────── */
function Scene() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 1.5, 6);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(({ mouse, camera }) => {
    camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.y * 0.2 + 1.5 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-3, 2, 2]} color="#34ff8c" intensity={2} distance={8} />
      <pointLight position={[3, -1, 3]} color="#00f0ff" intensity={1.5} distance={6} />

      {/* Background stars */}
      <Stars radius={50} depth={30} count={2000} factor={2} fade speed={0.5} />

      {/* Particle field */}
      <ParticleField />

      {/* Cyber grid floor */}
      <CyberGridPlane />

      {/* Shield core — right side */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <ShieldCore />
      </Float>

      {/* Metric cards floating */}
      <MetricCard position={[2.5, 1.5, 0.5]} label="LATENCY" value="12ms" color="#00f0ff" delay={0} />
      <MetricCard position={[-1.5, 2, -0.5]} label="UPTIME" value="99.99%" color="#34ff8c" delay={1} />
      <MetricCard position={[1.0, -0.8, 1]} label="BLOCKED" value="412" color="#ff4444" delay={2} />

      {/* Ambient sparkles */}
      <DreiSparkles
        count={50}
        scale={8}
        size={1.5}
        speed={0.3}
        opacity={0.4}
        color="#00f0ff"
      />
    </>
  );
}

/* ─── Public Export ──────────────────────────────────────────────────────── */
export default function HeroScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
