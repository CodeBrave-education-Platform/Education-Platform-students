'use client'

import React, { Suspense, useRef } from 'react'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float } from '@react-three/drei'

// Procedural 3D Nano Banana Fallback
function NanoBananaModel(props) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    // Smooth floating and rotating animation
    meshRef.current.rotation.y += delta * 0.5
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2
  })

  return (
    <group {...props}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef} castShadow receiveShadow rotation={[0, 0, Math.PI / 2.5]}>
          {/* A curved torus segment looks like a banana! */}
          <torusGeometry args={[1.2, 0.3, 16, 32, Math.PI / 1.5]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            roughness={0.2} 
            metalness={0.1} 
            emissive="#fbbf24"
            emissiveIntensity={0.2}
          />
        </mesh>
      </Float>
    </group>
  )
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -z-10"></div>

      {/* 3D Nano Banana Canvas */}
      <div className="w-full h-[300px] sm:h-[400px] relative z-10 mb-4 cursor-grab active:cursor-grabbing">
        <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <Environment preset="city" />
            <NanoBananaModel position={[-0.5, 0, 0]} />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
          </Suspense>
        </Canvas>
      </div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight"
      >
        404
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-slate-200 mb-4">
          Oops! The Nano Banana slipped.
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-10 text-sm md:text-base font-medium">
          The page you are looking for has been moved, deleted, or possibly eaten by our highly advanced AI. Let's get you back on track.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 relative z-20"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-900/50"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 border border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </motion.div>
    </div>
  )
}
