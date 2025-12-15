import React, { useEffect, useRef, useState } from 'react';
import { Activity, Zap, Gauge } from 'lucide-react';

interface PerformanceMonitorProps {
  fpsRef: React.MutableRefObject<number>;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ fpsRef }) => {
  const [fps, setFps] = useState(0);
  const [color, setColor] = useState('text-green-400');
  const [bgColor, setBgColor] = useState('bg-green-500/20');
  const [status, setStatus] = useState('OPTIMAL');
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    updateIntervalRef.current = setInterval(() => {
      setFps(Math.round(fpsRef.current));
      
      // Color based on FPS
      if (fpsRef.current >= 55) {
        setColor('text-green-400');
        setBgColor('bg-green-500/20');
        setStatus('OPTIMAL');
      } else if (fpsRef.current >= 40) {
        setColor('text-yellow-400');
        setBgColor('bg-yellow-500/20');
        setStatus('GOOD');
      } else {
        setColor('text-red-400');
        setBgColor('bg-red-500/20');
        setStatus('CAUTION');
      }
    }, 500);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [fpsRef]);

  return (
    <div>
      <div className={`${bgColor} backdrop-blur-xl border border-white/20 rounded-lg px-4 py-2 flex items-center gap-2 
        shadow-lg hover:border-white/30 transition-colors duration-300`}>
        
        <Gauge className={`w-4 h-4 ${color}`} />
        <div className="flex flex-col">
          <span className={`font-mono text-sm font-bold ${color}`}>
            {fps} FPS
          </span>
          <span className="text-[7px] text-gray-500 font-mono uppercase tracking-wider">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
