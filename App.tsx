
import React, { useState, useCallback, useRef } from 'react';
import ParticleSystem from './components/ParticleSystem';
import HandTracker from './components/HandTracker';
import Controls from './components/Controls';
import PerformanceMonitor from './components/PerformanceMonitor';
import { ParticleConfig, ShapeType, ParticleStyle, HandTrackingResult } from './types';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    color: '#ff00ff',
    shape: ShapeType.SPHERE,
    style: ParticleStyle.GLOW,
  });

  const [handData, setHandData] = useState<HandTrackingResult>({
    tension: 0,
    isDetected: false
  });

  const fpsRef = useRef(60);

  // Optimize updates to avoid excessive re-renders in heavy components
  const handleHandUpdate = useCallback((result: HandTrackingResult) => {
    setHandData(result);
  }, []);

  const handleFpsUpdate = useCallback((fps: number) => {
    fpsRef.current = fps;
  }, []);

  // Compute visual tension for UI (matches shader logic: Open=1.0, Fist=0.0)
  const uiTension = 1.0 - handData.tension;

  return (
    <div className="relative w-full h-screen text-white overflow-hidden selection:bg-purple-500/30">
      
      {/* ParticleSystem - centered background */}
      <ParticleSystem config={config} handData={handData} onFpsUpdate={handleFpsUpdate} />
      
      {/* Title - Top Left */}
      <div className="fixed top-6 left-6 z-40 select-none pointer-events-none">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-white">
          <Sparkles className="w-6 h-6" />
          PARTICLE TESTING
        </h1>
        <p className="mt-1 text-xs text-cyan-400 font-mono tracking-widest opacity-90">
          BY ARYA MEHTA
        </p>
        <p className="text-xs text-gray-500 font-mono tracking-widest opacity-70">
          HAND • FIST • CLAP
        </p>
      </div>

      {/* Performance Monitor - Top Right */}
      <div className="fixed top-6 right-6 z-40">
        <PerformanceMonitor fpsRef={fpsRef} />
      </div>

      {/* Hand Tracker - Always running */}
      <HandTracker onUpdate={handleHandUpdate} />
      
      {/* Controls Toolbox - Bottom Right, Compact */}
      <div className="fixed bottom-6 right-6 z-30">
        <Controls 
          config={config} 
          setConfig={setConfig} 
          visualTension={uiTension} 
        />
      </div>
      
      {/* Waiting for hand indicator - Center */}
      {!handData.isDetected && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-white/20 text-lg font-light tracking-[0.2em] animate-pulse">
            WAITING FOR HAND
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
