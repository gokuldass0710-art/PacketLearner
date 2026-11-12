import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Generates points distributed on a sphere using Fibonacci sphere algorithm
function createFibonacciSpherePoints(samples: number, radius: number) {
  const positions = new Float32Array(samples * 3)
  const phi = Math.PI * (Math.sqrt(5) - 1) // Golden angle

  for (let i = 0; i < samples; i++) {
    const y = 1 - (i / (samples - 1)) * 2
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    positions[i * 3] = x * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = z * radius
  }

  return positions
}

// Deterministic pseudo-random distribution for ambient dust particles
function createDeterministicDust(count: number): Float32Array {
  const coords = new Float32Array(count * 3)
  let seed = 42
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  for (let i = 0; i < count; i++) {
    coords[i * 3] = (pseudoRandom() - 0.5) * 22
    coords[i * 3 + 1] = (pseudoRandom() - 0.5) * 22
    coords[i * 3 + 2] = (pseudoRandom() - 0.5) * 14
  }
  return coords
}

const PRECOMPUTED_DUST = createDeterministicDust(350)
const PRECOMPUTED_SPHERE = createFibonacciSpherePoints(1600, 3.4)

// Digital Globe Particle Shell
function GlobeParticles({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const pointsRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.04
      groupRef.current.rotation.x += delta * 0.015

      if (mouse.current) {
        groupRef.current.rotation.y += (mouse.current.x * 0.25 - groupRef.current.rotation.y) * 0.02
        groupRef.current.rotation.x += (-mouse.current.y * 0.2 - groupRef.current.rotation.x) * 0.02
      }
    }
  })

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[PRECOMPUTED_SPHERE, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.038}
          color="#1558C9"
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

// Latitude & Longitude wireframe rings
function GlobeRings() {
  const ringsRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.y += delta * 0.025
    }
  })

  const rings = useMemo(() => {
    const arr: { radius: number; y: number }[] = []
    const latitudes = [-1.8, -0.9, 0, 0.9, 1.8]
    const sphereRadius = 3.4
    latitudes.forEach((y) => {
      const r = Math.sqrt(Math.max(0, sphereRadius * sphereRadius - y * y))
      arr.push({ radius: r, y })
    })
    return arr
  }, [])

  return (
    <group ref={ringsRef}>
      {rings.map((ring, idx) => (
        <mesh key={idx} position={[0, ring.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ring.radius - 0.005, ring.radius + 0.005, 64]} />
          <meshBasicMaterial
            color="#1558C9"
            transparent
            opacity={idx === 2 ? 0.22 : 0.09}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Orbiting Data Packets on elliptical arcs
function OrbitingArcs() {
  const groupRef = useRef<THREE.Group>(null)

  const orbits = useMemo(() => {
    return [
      { radiusX: 4.2, radiusZ: 4.8, rotX: 0.45, rotZ: 0.3, speed: 0.35, color: '#D4FF24' },
      { radiusX: 4.6, radiusZ: 4.0, rotX: -0.6, rotZ: 0.7, speed: -0.28, color: '#1558C9' },
      { radiusX: 4.0, radiusZ: 4.5, rotX: 0.8, rotZ: -0.4, speed: 0.42, color: '#D4FF24' },
      { radiusX: 5.0, radiusZ: 4.3, rotX: -0.3, rotZ: -0.8, speed: -0.32, color: '#38bdf8' },
    ]
  }, [])

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime()
      groupRef.current.children.forEach((child, i) => {
        const orbit = orbits[i]
        if (orbit) {
          const angle = t * orbit.speed
          const x = Math.cos(angle) * orbit.radiusX
          const z = Math.sin(angle) * orbit.radiusZ
          child.position.set(x, 0, z)
        }
      })
    }
  })

  return (
    <group>
      {orbits.map((orbit, idx) => (
        <group key={`track-${idx}`} rotation={[orbit.rotX, 0, orbit.rotZ]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[orbit.radiusX - 0.008, orbit.radiusX + 0.008, 96]} />
            <meshBasicMaterial color={orbit.color} transparent opacity={0.12} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      <group ref={groupRef}>
        {orbits.map((orbit, idx) => (
          <group key={`pulse-${idx}`} rotation={[orbit.rotX, 0, orbit.rotZ]}>
            <mesh>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={orbit.color} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

// Background Floating Ambient Network Dust
function AmbientNetworkDust() {
  const dustRef = useRef<THREE.Points>(null)

  useFrame((_, delta) => {
    if (dustRef.current) {
      dustRef.current.rotation.y += delta * 0.015
    }
  })

  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[PRECOMPUTED_DUST, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#D4FF24"
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Lightweight CSS/SVG fallback for reduced motion or WebGL disabled
const LowPowerFallback: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-[#030407] overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(21, 88, 201, 0.4) 0%, rgba(3, 4, 7, 0.95) 75%), linear-gradient(rgba(212, 255, 36, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(21, 88, 201, 0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-cyber-blue/20 blur-sm pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-cyber-neon/15 pointer-events-none" />
    </div>
  )
}

function checkWebGlSupport(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export const NetworkUniverse: React.FC = () => {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  const [hasWebGl] = useState<boolean>(() => checkWebGlSupport())
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      mediaQuery.removeEventListener('change', handler)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  if (reducedMotion || !hasWebGl) {
    return <LowPowerFallback />
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#030407]"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
        }}
      >
        <ambientLight intensity={0.4} />
        <GlobeParticles mouse={mouse} />
        <GlobeRings />
        <OrbitingArcs />
        <AmbientNetworkDust />
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, transparent 30%, rgba(3, 4, 7, 0.6) 70%, rgba(3, 4, 7, 0.95) 100%)',
        }}
      />
    </div>
  )
}
