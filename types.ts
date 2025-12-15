export enum ShapeType {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  FIREWORKS = 'Fireworks',
}

export enum ParticleStyle {
  GLOW = 'Glow',
  DIGITAL = 'Digital',
  CYBER = 'Cyber',
  MAGIC = 'Magic',
}

export type GestureType = 'none' | 'point' | 'pinch' | 'palm_up' | 'palm_down' | 'peace';

export interface HandTrackingResult {
  tension: number; // 0.0 (Open) to 1.0 (Fist)
  isDetected: boolean;
  gesture: GestureType;
  // For gesture-specific targeting
  fingerTip?: { x: number; y: number; z: number }; // For pointing gesture
  pinchPosition?: { x: number; y: number; z: number }; // For pinch gesture
  palmOrientation?: { x: number; y: number; z: number }; // For palm up/down detection
  peaceOrbit1?: { x: number; y: number; z: number }; // For peace sign - first orbit center
  peaceOrbit2?: { x: number; y: number; z: number }; // For peace sign - second orbit center
}

export interface ParticleConfig {
  color: string;
  shape: ShapeType;
  style: ParticleStyle;
}

// Optimized particle count based on device performance
export const PARTICLE_COUNT = (() => {
  // Check for GPU performance capabilities
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      return 2000; // Fallback for limited devices
    }
    
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxVaryings = gl.getParameter(gl.MAX_VARYING_VECTORS);
    
    // RTX 3050 and modern GPUs: ~5000 particles
    // Mobile/older: ~2000-3000 particles
    if (maxTextureSize >= 2048 && maxVaryings >= 8) {
      return 5000;
    } else if (maxTextureSize >= 1024) {
      return 3000;
    } else {
      return 2000;
    }
  } catch (e) {
    return 3500; // Safe default for mid-range GPUs
  }
})();

export const TRAIL_LENGTH = 5;