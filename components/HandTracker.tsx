import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { HandTrackingResult, GestureType } from '../types';
import { RefreshCw, CameraOff, Loader2 } from 'lucide-react';

interface HandTrackerProps {
  onUpdate: (result: HandTrackingResult) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastGestureRef = useRef<GestureType>('none');
  const gestureHysteresisRef = useRef<number>(0);

  // Initialize MediaPipe
  const initializeMediaPipe = async () => {
    try {
      setLoading(true);
      setError(null);
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      
      startCamera();
    } catch (err) {
      console.error(err);
      setError("Failed to load AI models.");
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      // Optimized video constraints for better performance
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 240 },
          height: { ideal: 180 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Camera access denied.");
      setLoading(false);
    }
  };

  const calculateTension = (landmarks: any[]): number => {
    // Simple method: measure distance between fingertips
    // When hand is open, fingers are far apart
    // When hand is closed (fist), fingers are close together
    
    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    // Calculate distances from wrist to each fingertip
    const distances = [thumbTip, indexTip, middleTip, ringTip, pinkyTip].map(tip => {
      return Math.sqrt(
        Math.pow(wrist.x - tip.x, 2) + 
        Math.pow(wrist.y - tip.y, 2) + 
        Math.pow(wrist.z - tip.z, 2)
      );
    });
    
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    
    // Reference: palm size (wrist to middle finger base)
    const middleBase = landmarks[9];
    const palmSize = Math.sqrt(
      Math.pow(wrist.x - middleBase.x, 2) + 
      Math.pow(wrist.y - middleBase.y, 2) + 
      Math.pow(wrist.z - middleBase.z, 2)
    );
    
    // Normalize by palm size
    const normalizedDist = avgDistance / palmSize;
    
    // CALIBRATED MAPPING based on observed values:
    // Fist (closed): 0.80-0.86
    // Open hand: 1.69-1.75
    const closedValue = 0.80;  // Tight fist
    const openValue = 1.75;    // Fully open hand
    
    // Map to 0 (open) to 1 (closed)
    let tension = (openValue - normalizedDist) / (openValue - closedValue);
    tension = Math.max(0, Math.min(1, tension));
    
    return tension;
  };

  // Helper: distance between two 3D points
  const distance3D = (p1: any, p2: any): number => {
    return Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + 
      Math.pow(p1.y - p2.y, 2) + 
      Math.pow(p1.z - p2.z, 2)
    );
  };

  // Helper: check if finger is extended
  const isFingerExtended = (landmarks: any[], fingerBase: number, fingerTip: number): boolean => {
    const base = landmarks[fingerBase];
    const tip = landmarks[fingerTip];
    const dist = distance3D(base, tip);
    return dist > 0.04; // Lower threshold for more sensitive detection
  };

  // Detect all gestures with simple, stable logic
  const detectGesture = (landmarks: any[], tension: number): GestureType => {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Check finger extensions
    const thumbExt = isFingerExtended(landmarks, 2, 4);
    const indexExt = isFingerExtended(landmarks, 5, 8);
    const middleExt = isFingerExtended(landmarks, 9, 12);
    const ringExt = isFingerExtended(landmarks, 13, 16);
    const pinkyExt = isFingerExtended(landmarks, 17, 20);

    // Count extended fingers
    const extendedCount = [thumbExt, indexExt, middleExt, ringExt, pinkyExt].filter(e => e).length;

    // 1. PEACE SIGN: exactly index + middle extended
    if (indexExt && middleExt && !ringExt && !pinkyExt && tension < 0.5) {
      return 'peace';
    }

    // 2. POINTING: only index extended (hand closed otherwise)
    if (indexExt && !middleExt && !ringExt && !pinkyExt && tension > 0.4) {
      return 'point';
    }

    // 3. PINCH: thumb and index close + hand mostly closed
    const thumbIndexDist = distance3D(thumbTip, indexTip);
    if (thumbIndexDist < 0.08 && tension > 0.6) {
      return 'pinch';
    }

    // 4. PALM UP/DOWN: most fingers extended + check orientation
    if (extendedCount >= 4 && tension < 0.3) {
      // Simple Y-axis orientation check based on hand position trend
      // If hand is opening upward -> palm up
      // If hand is opening downward -> palm down
      const avgY = (indexTip.y + middleTip.y + ringTip.y + pinkyTip.y) / 4;
      const thumbY = thumbTip.y;
      
      if (avgY > thumbY + 0.1) {
        return 'palm_down';
      } else if (avgY < thumbY - 0.1) {
        return 'palm_up';
      }
    }

    return 'none';
  };

  // Get position data for specific gestures
  const getGesturePositions = (landmarks: any[], gesture: GestureType) => {
    const result: Partial<HandTrackingResult> = {};

    if (gesture === 'point') {
      // Index fingertip
      result.fingerTip = landmarks[8];
    } else if (gesture === 'pinch') {
      // Average of thumb and index
      const thumb = landmarks[4];
      const index = landmarks[8];
      result.pinchPosition = {
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2,
        z: (thumb.z + index.z) / 2,
      };
    } else if (gesture === 'peace') {
      // Index and middle finger positions
      result.peaceOrbit1 = landmarks[8];
      result.peaceOrbit2 = landmarks[12];
    }

    return result;
  };

  const predictWebcam = () => {
    if (!videoRef.current || !handLandmarkerRef.current) return;
    
    const startTimeMs = performance.now();
    
    if (videoRef.current.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = videoRef.current.currentTime;
      const detections = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      
      processDetections(detections);
    }
    
    animationFrameRef.current = requestAnimationFrame(predictWebcam);
  };

  const processDetections = (result: HandLandmarkerResult) => {
    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      const tension = calculateTension(landmarks);
      const gesture = detectGesture(landmarks, tension);
      
      const handData: HandTrackingResult = {
        isDetected: true,
        tension,
        gesture,
        ...getGesturePositions(landmarks, gesture),
      };
      
      onUpdate(handData);
      drawHand(landmarks, tension, gesture);
    } else {
      onUpdate({ isDetected: false, tension: 0, gesture: 'none' });
      clearCanvas();
    }
  };

  const drawHand = (landmarks: any[], tension: number, gesture: GestureType) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current || !videoRef.current) return;
    
    // Match dimensions
    if (canvasRef.current.width !== videoRef.current.videoWidth) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
    }

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Color changes based on tension: cyan (open) to red (closed)
    const r = Math.floor(tension * 255);
    const g = Math.floor((1 - tension) * 200);
    const b = Math.floor((1 - tension) * 255);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.4)`;
    ctx.lineWidth = 2;

    // Draw landmarks
    landmarks.forEach(lm => {
      const x = lm.x * canvasRef.current!.width;
      const y = lm.y * canvasRef.current!.height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw tension indicator and gesture
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.9)`;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`${Math.round((1-tension) * 100)}% | ${gesture}`, 10, 25);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  useEffect(() => {
    initializeMediaPipe();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="relative rounded-lg overflow-hidden border border-white/20 shadow-2xl w-40 h-30 bg-black/50 backdrop-blur-md">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-2 text-center bg-black/80">
            <CameraOff className="w-6 h-6 mb-1" />
            <span className="text-xs">{error}</span>
          </div>
        )}

        <video 
          ref={videoRef} 
          className="w-full h-full object-cover transform -scale-x-100 opacity-60" 
          autoPlay 
          playsInline 
          muted 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full transform -scale-x-100" 
        />
      </div>
      
      {error && (
        <button 
          onClick={initializeMediaPipe}
          className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full transition"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
};

export default HandTracker;