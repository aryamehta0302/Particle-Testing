import React, { useState, useEffect } from 'react';
import { ParticleConfig, ShapeType, ParticleStyle } from '../types';
import { Heart, Globe, Atom, Flower, Activity, Zap, Circle, Square, Disc, Star, Sparkles, RotateCw, Settings, Copy, Share2 } from 'lucide-react';

interface ControlsProps {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  visualTension: number; // 0-1 for UI bar
}

const COLORS = [
  '#00ffff', // Cyan
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#ff3333', // Red
  '#33ff33', // Green
  '#ffffff', // White
  '#00ff88', // Turquoise
  '#ff6600', // Orange
];

const RAINBOW_COLORS = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];

const SHAPES = [
  { type: ShapeType.SPHERE, icon: Globe, label: 'Sphere' },
  { type: ShapeType.HEART, icon: Heart, label: 'Heart' },
  { type: ShapeType.FLOWER, icon: Flower, label: 'Flower' },
  { type: ShapeType.SATURN, icon: Atom, label: 'Saturn' },
  { type: ShapeType.BUDDHA, icon: Activity, label: 'Zen' }, 
  { type: ShapeType.FIREWORKS, icon: Zap, label: 'Burst' },
];

const STYLES = [
  { type: ParticleStyle.GLOW, icon: Circle, label: 'Glow' },
  { type: ParticleStyle.DIGITAL, icon: Square, label: 'Pixel' },
  { type: ParticleStyle.CYBER, icon: Disc, label: 'Ring' },
  { type: ParticleStyle.MAGIC, icon: Star, label: 'Star' },
];

const Controls: React.FC<ControlsProps> = ({ config, setConfig, visualTension }) => {
  const [rainbowMode, setRainbowMode] = useState(false);
  const [rainbowIndex, setRainbowIndex] = useState(0);
  const [autoShapeMode, setAutoShapeMode] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<'shapes' | 'colors' | 'styles' | null>('shapes');
  const [copied, setCopied] = useState(false);

  // Rainbow mode animation
  useEffect(() => {
    if (!rainbowMode) return;

    const interval = setInterval(() => {
      setRainbowIndex(prev => {
        const nextIndex = (prev + 1) % RAINBOW_COLORS.length;
        setConfig(prev => ({ ...prev, color: RAINBOW_COLORS[nextIndex] }));
        return nextIndex;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [rainbowMode, setConfig]);

  // Auto shape cycle mode
  useEffect(() => {
    if (!autoShapeMode) return;

    const interval = setInterval(() => {
      setConfig(prev => {
        const currentIndex = SHAPES.findIndex(s => s.type === prev.shape);
        const nextIndex = (currentIndex + 1) % SHAPES.length;
        return { ...prev, shape: SHAPES[nextIndex].type };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [autoShapeMode, setConfig]);

  return (
    <div className="w-72">
      <div className="bg-black/75 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-lg 
        hover:border-white/30 transition-colors duration-300">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Toolbox</h2>
          <Sparkles className="w-3 h-3 text-purple-400" />
        </div>

        {/* Shapes - Compact 3x2 Grid */}
        <div className="space-y-1 mb-2">
          <div className="grid grid-cols-3 gap-1">
            {SHAPES.map((item) => {
              const Icon = item.icon;
              const isActive = config.shape === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => {
                    setAutoShapeMode(false);
                    setConfig(prev => ({ ...prev, shape: item.type }));
                  }}
                  className={`rounded p-2 transition-all duration-200 flex items-center justify-center
                    ${isActive 
                      ? 'bg-cyan-500/40 border border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'}
                  `}
                  title={item.label}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-gray-400'}`} />
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setAutoShapeMode(!autoShapeMode)}
            className={`w-full py-1 rounded text-[8px] font-semibold uppercase transition-all
              ${autoShapeMode 
                ? 'bg-cyan-500/40 border border-cyan-400/60 text-cyan-200' 
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-cyan-300'}
            `}
          >
            {autoShapeMode ? 'Auto ON' : 'Auto OFF'}
          </button>
        </div>

        {/* Styles - Compact 2x2 */}
        <div className="space-y-1 mb-2">
          <label className="text-[7px] font-bold text-gray-500 uppercase">Style</label>
          <div className="grid grid-cols-2 gap-1">
            {STYLES.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = config.style === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => setConfig(prev => ({ ...prev, style: item.type }))}
                  className={`rounded p-1.5 transition-all text-[7px] font-semibold uppercase flex items-center justify-center gap-1
                    ${isActive 
                      ? 'bg-purple-500/40 border border-purple-400/60 text-purple-200' 
                      : 'bg-white/5 border border-white/10 text-gray-400'}
                  `}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {STYLES.slice(2, 4).map((item) => {
              const Icon = item.icon;
              const isActive = config.style === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => setConfig(prev => ({ ...prev, style: item.type }))}
                  className={`rounded p-1.5 transition-all text-[7px] font-semibold uppercase flex items-center justify-center gap-1
                    ${isActive 
                      ? 'bg-purple-500/40 border border-purple-400/60 text-purple-200' 
                      : 'bg-white/5 border border-white/10 text-gray-400'}
                  `}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colors - Compact 4 only */}
        <div className="space-y-1 mb-2">
          <label className="text-[7px] font-bold text-gray-500 uppercase">Colors</label>
          <div className="grid grid-cols-4 gap-1">
            {COLORS.slice(0, 4).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setRainbowMode(false);
                  setConfig(prev => ({ ...prev, color: c }));
                }}
                className={`h-5 rounded border-2 transition-all
                  ${config.color === c && !rainbowMode 
                    ? 'scale-110 shadow-[0_0_8px_currentColor] border-white' 
                    : 'border-white/20 hover:border-white/40'}
                `}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={() => setRainbowMode(!rainbowMode)}
            className={`w-full py-1 rounded text-[8px] font-semibold uppercase transition-all
              ${rainbowMode 
                ? 'bg-gradient-to-r from-pink-500/40 to-purple-500/40 border border-purple-400/60 text-purple-200' 
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'}
            `}
          >
            {rainbowMode ? 'Rainbow ON' : 'Rainbow OFF'}
          </button>
        </div>

        {/* Tension Bar */}
        <div className="border-t border-white/10 pt-2">
          <div className="flex items-center gap-1.5 text-[7px]">
            <span className="font-bold text-gray-500 uppercase">Fist</span>
            <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-100"
                style={{ width: `${Math.max(visualTension * 100, 2)}%` }}
              />
            </div>
            <span className="font-mono text-gray-600 text-[6px]">{(visualTension * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;