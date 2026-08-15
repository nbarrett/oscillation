"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Float, Html, RoundedBox, Text, useTexture } from "@react-three/drei"
import * as THREE from "three"

const MAP_IMAGE = "/splash-screen.jpg"

const zoneData: Array<{
  position: [number, number, number]
  size: [number, number, number]
  color: string
  rotation: number
}> = [
  { position: [-2.8, 0.08, -0.3], size: [1.2, 0.06, 1.2], color: "#7CFF7A", rotation: 0.02 },
  { position: [-0.7, 0.08, 1.4], size: [1.0, 0.06, 1.0], color: "#69FF9B", rotation: -0.04 },
  { position: [0.7, 0.08, 0.7], size: [1.25, 0.08, 1.4], color: "#8B7CFF", rotation: 0.03 },
  { position: [2.55, 0.08, -0.8], size: [1.1, 0.06, 1.1], color: "#74FF7A", rotation: 0.05 },
  { position: [2.0, 0.08, 1.7], size: [1.0, 0.06, 1.0], color: "#7FFFAA", rotation: -0.05 },
  { position: [0.0, 0.08, 2.0], size: [0.9, 0.06, 0.9], color: "#72FFA7", rotation: 0.01 },
]

const markerData: Array<{
  label: string
  position: [number, number, number]
  color: string
}> = [
  { label: "Bot Bob", position: [1.9, 0.36, -1.9], color: "#5B5BD6" },
  { label: "Bot Alice", position: [-1.4, 0.36, 1.3], color: "#C23A7A" },
  { label: "Nick", position: [0.3, 0.36, -0.2], color: "#222222" },
]

function BoardScene() {
  const group = useRef<THREE.Group>(null)
  const mapRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(MAP_IMAGE)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    texture.anisotropy = 8
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  useEffect(() => {
    const id = window.setTimeout(() => setSettled(true), 2600)
    return () => window.clearTimeout(id)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0.24, 0.04)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -0.68, 0.04)
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.1, 0.04)
      group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, 0.2, 0.04)
    }

    if (mapRef.current) {
      mapRef.current.position.y = THREE.MathUtils.lerp(mapRef.current.position.y, 0, 0.06)
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, Math.sin(t * 0.18) * 0.2 + 0.1, 0.03)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, settled ? 4.8 : 6.8, 0.03)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, settled ? 7.9 : 10.5, 0.03)
    state.camera.lookAt(0, 0.4, 0)
  })

  return (
    <group ref={group} position={[0, 0.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow>
        <planeGeometry args={[9.5, 9.5]} />
        <shadowMaterial opacity={0.18} />
      </mesh>

      <RoundedBox args={[8.4, 0.18, 4.8]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#efe9e3" metalness={0.08} roughness={0.92} />
      </RoundedBox>

      <mesh ref={mapRef} position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.03, 4.4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <mesh position={[0, 0.145, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.96, 0.01, 4.36]} />
        <meshStandardMaterial map={texture} roughness={0.88} metalness={0.03} />
      </mesh>

      {zoneData.map((zone, index) => (
        <Float
          key={index}
          speed={1.2 + index * 0.18}
          rotationIntensity={0.08}
          floatIntensity={0.08}
          position={zone.position}
        >
          <mesh rotation={[-Math.PI / 2, 0, zone.rotation]} castShadow>
            <boxGeometry args={zone.size} />
            <meshPhysicalMaterial
              color={zone.color}
              transparent
              opacity={0.52}
              roughness={0.18}
              metalness={0.05}
              transmission={0.15}
              clearcoat={0.9}
              clearcoatRoughness={0.15}
            />
          </mesh>
        </Float>
      ))}

      <Float speed={1.8} rotationIntensity={0.12} floatIntensity={0.18} position={[2.15, 0.42, -1.75]}>
        <group>
          <mesh castShadow rotation={[0, -0.4, 0]}>
            <boxGeometry args={[0.34, 0.12, 0.18]} />
            <meshStandardMaterial color="#A31212" metalness={0.5} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.04, 0]} castShadow rotation={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.08, 0.16]} />
            <meshStandardMaterial color="#4a0d0d" metalness={0.4} roughness={0.25} />
          </mesh>
        </group>
      </Float>

      {markerData.map((marker, index) => (
        <group key={marker.label} position={marker.position}>
          <mesh castShadow>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshStandardMaterial color={marker.color} roughness={0.28} metalness={0.35} />
          </mesh>
          <Html center position={[0, 0.22, 0]} distanceFactor={10} transform>
            <div
              style={{
                background: "rgba(70, 64, 160, 0.92)",
                color: "white",
                padding: "6px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
                border: "1px solid rgba(255,255,255,0.22)",
                transform: `translateY(${index % 2 === 0 ? 0 : -2}px)`,
              }}
            >
              {marker.label}
            </div>
          </Html>
        </group>
      ))}

      <Float speed={2} rotationIntensity={0.35} floatIntensity={0.25} position={[-2.9, 1.1, -1.5]}>
        <group rotation={[0.2, 0.8, -0.25]}>
          <RoundedBox args={[0.38, 0.38, 0.38]} radius={0.06} smoothness={4} castShadow>
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.06} />
          </RoundedBox>
        </group>
      </Float>

      <Text
        position={[-2.7, 0.28, -2.25]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.22}
        color="#5244D7"
        anchorX="left"
        anchorY="middle"
      >
        Oscillation
      </Text>

      <Environment preset="city" />
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-5, 6, 4]} intensity={1.8} angle={0.42} penumbra={0.6} />
    </group>
  )
}

export default function SplashBoard() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 6.8, 10.5], fov: 34 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <fog attach="fog" args={["#d9defb", 8, 18]} />
      <BoardScene />
    </Canvas>
  )
}
