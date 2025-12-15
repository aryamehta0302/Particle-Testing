
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ParticleConfig, ShapeType, ParticleStyle, PARTICLE_COUNT, HandTrackingResult, TRAIL_LENGTH } from '../types';
import { generateGeometry, generateAttributes } from '../utils/geometryFactory';

interface ParticleSystemProps {
  config: ParticleConfig;
  handData: HandTrackingResult;
  onFpsUpdate?: (fps: number) => void;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ config, handData, onFpsUpdate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  
  // State refs for smoothing and logic
  const smoothedTensionRef = useRef(0);
  const prevTensionRef = useRef(0);
  const explosionRef = useRef(0);
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const handDataRef = useRef<HandTrackingResult>({ isDetected: false, tension: 0, gesture: 'none' });

  // Shader Code - OPTIMIZED FOR RTX 3050 + GESTURE SUPPORT
  const vertexShader = `
    uniform float uTime;
    uniform float uTension;
    uniform float uExplosion;
    uniform int uGesture;
    uniform vec3 uGesturePos;
    uniform vec3 uPeacePos1;
    uniform vec3 uPeacePos2;
    
    attribute vec3 targetPos;
    attribute float trailIdx;
    attribute float pScale;
    
    varying float vTrailIdx;
    varying float vDepth;

    float hash(float n) {
      return fract(sin(n) * 43758.5453);
    }

    void main() {
      vTrailIdx = trailIdx;
      
      float lag = trailIdx * 0.08;
      float effectiveTime = uTime - lag;
      
      // Minimal noise
      float noiseVal = hash(targetPos.x + targetPos.y * 2.0 + effectiveTime * 0.1) * 0.04;
      
      // Very gentle breathing
      float breath = sin(effectiveTime * 0.6) * 0.02;
      float expansion = uTension * 1.8 + 0.3;
      
      // Explosion with distance amplification
      float distFromCenter = length(targetPos);
      float explode = uExplosion * 3.0 * (0.5 + distFromCenter * 2.0);
      vec3 explodeDir = normalize(targetPos + vec3(0.001)) * explode;

      vec3 pos = targetPos * (expansion + breath) + vec3(noiseVal) * 0.05 + explodeDir;

      // GESTURE-BASED PHYSICS
      if (uGesture == 1) {
        // POINTING: swarm toward fingertip (more aggressive)
        vec3 toFinger = uGesturePos - pos;
        float dist = length(toFinger);
        if (dist > 0.001) {
          pos += normalize(toFinger) * 0.035;
        }
      }
      else if (uGesture == 2) {
        // PINCH: cluster tight at pinch position
        vec3 toPinch = uGesturePos - pos;
        pos = mix(pos, uGesturePos, 0.15);
      }
      else if (uGesture == 3) {
        // PALM UP: strong upward force
        pos.y += 0.05;
      }
      else if (uGesture == 4) {
        // PALM DOWN: strong downward force
        pos.y -= 0.05;
      }
      else if (uGesture == 5) {
        // PEACE: attract to nearest peace center
        float d1 = length(uPeacePos1 - pos);
        float d2 = length(uPeacePos2 - pos);
        if (d1 < d2) {
          pos += normalize(uPeacePos1 - pos) * 0.025;
        } else {
          pos += normalize(uPeacePos2 - pos) * 0.025;
        }
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vDepth = -mvPosition.z;
      float size = (100.0 / max(vDepth, 0.1)) * pScale * (1.0 - trailIdx * 0.2);
      gl_PointSize = max(size, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform int uStyle;
    varying float vTrailIdx;
    
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float alpha = 1.0;
      
      if (uStyle == 0) {
        if (d > 0.5) discard;
        alpha = (1.0 - d * 2.0) * (1.0 - d * 2.0);
      } 
      else if (uStyle == 1) {
        if (abs(uv.x) > 0.45 || abs(uv.y) > 0.45) discard;
        alpha = 0.8;
      }
      else if (uStyle == 2) {
        if (d > 0.5 || d < 0.25) discard;
        alpha = 0.9;
      }
      else {
        d = abs(uv.x) + abs(uv.y);
        if (d > 0.5) discard;
        alpha = 1.0 - d * 2.0;
      }

      alpha *= (1.0 - vTrailIdx * 0.2);
      gl_FragColor = vec4(uColor, alpha);
    }
  `;

  // Helper to convert Enum string to int for shader
  const getStyleInt = (style: ParticleStyle): number => {
    switch(style) {
      case ParticleStyle.GLOW: return 0;
      case ParticleStyle.DIGITAL: return 1;
      case ParticleStyle.CYBER: return 2;
      case ParticleStyle.MAGIC: return 3;
      default: return 0;
    }
  };

  // Initialization
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.05);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Optimized renderer settings for RTX 3050
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: true,
      precision: 'mediump',
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Capped at 1.5 for better performance
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Material must be created BEFORE geometry
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(config.color) },
        uTension: { value: 0.5 },
        uExplosion: { value: 0.0 },
        uStyle: { value: 0 },
        uGesture: { value: 0 }, // 0=none, 1=point, 2=pinch, 3=palm_up, 4=palm_down, 5=peace
        uGesturePos: { value: new THREE.Vector3(0, 0, 0) },
        uPeacePos1: { value: new THREE.Vector3(0, 0, 0) },
        uPeacePos2: { value: new THREE.Vector3(0, 0, 0) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    materialRef.current = material;

    // Geometry & Material
    const { trailIndices, scales } = generateAttributes(PARTICLE_COUNT);
    const geometry = new THREE.BufferGeometry();
    
    // Initial dummy positions
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * TRAIL_LENGTH * 3), 3));
    geometry.setAttribute('trailIdx', new THREE.BufferAttribute(trailIndices, 1));
    geometry.setAttribute('pScale', new THREE.BufferAttribute(scales, 1));
    
    // Target Positions (The shape)
    const initialPos = generateGeometry(config.shape, PARTICLE_COUNT);
    geometry.setAttribute('targetPos', new THREE.BufferAttribute(initialPos, 3));
    
    geometryRef.current = geometry;

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);

    // Animation Loop
    const clock = new THREE.Clock();
    let lastFpsTime = 0;
    let framesSinceLastFps = 0;
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = clock.getElapsedTime();
      
      // FPS calculation (less frequent for better performance)
      framesSinceLastFps++;
      if (time - lastFpsTime >= 1.0) {
        fpsRef.current = framesSinceLastFps;
        framesSinceLastFps = 0;
        lastFpsTime = time;
        if (onFpsUpdate) {
          onFpsUpdate(fpsRef.current);
        }
      }
      
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = time;
        
        // Faster decay for smoother explosion recovery
        if (explosionRef.current > 0.01) {
          explosionRef.current *= 0.85;
          materialRef.current.uniforms.uExplosion.value = explosionRef.current;
        } else if (explosionRef.current > 0) {
          explosionRef.current = 0;
          materialRef.current.uniforms.uExplosion.value = 0;
        }

        // Apply smoothed tension
        materialRef.current.uniforms.uTension.value = smoothedTensionRef.current;

        // Update gesture uniforms
        const gestureMap: { [key: string]: number } = {
          'none': 0,
          'point': 1,
          'pinch': 2,
          'palm_up': 3,
          'palm_down': 4,
          'peace': 5,
        };

        materialRef.current.uniforms.uGesture.value = gestureMap[handDataRef.current.gesture] || 0;

        // Convert normalized coordinates to 3D world space (-2 to 2 range)
        if (handDataRef.current.fingerTip) {
          const screenPos = handDataRef.current.fingerTip;
          materialRef.current.uniforms.uGesturePos.value.set(
            (screenPos.x - 0.5) * 4,
            (0.5 - screenPos.y) * 4,
            screenPos.z || 0
          );
        }

        if (handDataRef.current.pinchPosition) {
          const screenPos = handDataRef.current.pinchPosition;
          materialRef.current.uniforms.uGesturePos.value.set(
            (screenPos.x - 0.5) * 4,
            (0.5 - screenPos.y) * 4,
            screenPos.z || 0
          );
        }

        if (handDataRef.current.peaceOrbit1) {
          const screenPos = handDataRef.current.peaceOrbit1;
          materialRef.current.uniforms.uPeacePos1.value.set(
            (screenPos.x - 0.5) * 4,
            (0.5 - screenPos.y) * 4,
            screenPos.z || 0
          );
        }

        if (handDataRef.current.peaceOrbit2) {
          const screenPos = handDataRef.current.peaceOrbit2;
          materialRef.current.uniforms.uPeacePos2.value.set(
            (screenPos.x - 0.5) * 4,
            (0.5 - screenPos.y) * 4,
            screenPos.z || 0
          );
        }
      }

      // Ultra-smooth, minimal rotation for maximum stability
      points.rotation.y += 0.0005;
      points.rotation.z = Math.sin(time * 0.12) * 0.015;
      points.position.set(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handle
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle Updates
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(config.color);
      materialRef.current.uniforms.uStyle.value = getStyleInt(config.style);
    }
    
    // Update Geometry when shape changes
    if (geometryRef.current) {
      const newPos = generateGeometry(config.shape, PARTICLE_COUNT);
      geometryRef.current.setAttribute('targetPos', new THREE.BufferAttribute(newPos, 3));
      geometryRef.current.attributes.targetPos.needsUpdate = true;
    }
  }, [config]);

  // Handle Hand Logic Frame-by-Frame (via Ref interaction)
  useEffect(() => {
    if (!handData.isDetected) return;
    
    // Update handData ref for use in animation loop
    handDataRef.current = handData;
    
    const tension = handData.tension; // 0.0 (Open) to 1.0 (Closed)
    const tensionChange = tension - prevTensionRef.current;
    
    // Compute target visual tension (inverse of hand tension)
    const targetVisualTension = 1.0 - tension; 

    // Much smoother, slower lerping for stability (was 0.25/0.18, now 0.12/0.08)
    const lerpFactor = Math.abs(tensionChange) > 0.1 ? 0.12 : 0.08;
    smoothedTensionRef.current += (targetVisualTension - smoothedTensionRef.current) * lerpFactor;

    // EXPLOSION TRIGGER: Only on very rapid hand movement
    if (Math.abs(tensionChange) > 0.3) {
      explosionRef.current = 2.0;
    }
    
    prevTensionRef.current = tension;

  }, [handData]);

  return <div ref={mountRef} className="fixed inset-0 z-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} />;
};

export default ParticleSystem;
