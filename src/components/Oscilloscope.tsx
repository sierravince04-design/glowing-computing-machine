import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';
import { Activity, Play, Pause, Radio } from 'lucide-react';

interface OscilloscopeProps {
  themeKey: GlowTheme;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ themeKey }) => {
  const theme = THEMES[themeKey];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [waveType, setWaveType] = useState<'sine' | 'square' | 'triangle' | 'sawtooth' | 'lissajous' | 'fourier'>('sine');
  const [frequency, setFrequency] = useState<number>(2);
  const [amplitude, setAmplitude] = useState<number>(0.8);
  const [phase, setPhase] = useState<number>(0);
  const [harmonics, setHarmonics] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundOutput, setSoundOutput] = useState<boolean>(false);

  const timeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Audio tone generator for the active wave
  const audioOscRef = useRef<OscillatorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopAudioTone = useCallback(() => {
    if (audioOscRef.current) {
      try {
        audioOscRef.current.stop();
        audioOscRef.current.disconnect();
      } catch {
        // Safe disconnect
      }
      audioOscRef.current = null;
    }
  }, []);

  const startAudioTone = useCallback(() => {
    stopAudioTone();
    if (!soundOutput) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const waveTypeMap: Record<string, OscillatorType> = {
        sine: 'sine',
        square: 'square',
        triangle: 'triangle',
        sawtooth: 'sawtooth',
        lissajous: 'sine',
        fourier: 'square',
      };

      osc.type = waveTypeMap[waveType] || 'sine';
      // Map visual frequency (1-10) to audible pitch (110 - 880 Hz)
      osc.frequency.setValueAtTime(110 * frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.04 * amplitude, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      audioOscRef.current = osc;
    } catch {
      // Audio permission or unsupported
    }
  }, [frequency, amplitude, soundOutput, stopAudioTone, waveType]);

  useEffect(() => {
    if (soundOutput) {
      startAudioTone();
    } else {
      stopAudioTone();
    }
    return () => {
      stopAudioTone();
    };
  }, [soundOutput, frequency, waveType, amplitude, startAudioTone, stopAudioTone]);

  // Main CRT Canvas Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!isPaused) {
        timeRef.current += 0.035;
      }
      const t = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const centerX = width / 2;

      // Subtle CRT Phosphor persistence: fade previous frame slightly instead of full clear
      ctx.fillStyle = 'rgba(8, 8, 8, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Draw oscilloscope reticle grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(60, 60, 60, 0.3)';
      ctx.beginPath();
      const gridStep = 40;
      for (let x = 0; x < width; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center crosshairs
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // Set phosphor vector glow styling
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = theme.accentHex;
      ctx.shadowBlur = 14;
      ctx.shadowColor = theme.accentHex;

      ctx.beginPath();

      if (waveType === 'lissajous') {
        // Parametric Lissajous figures (X-Y Mode)
        const radius = (height * 0.38) * amplitude;
        const steps = 600;
        const a = frequency;
        const b = 3;
        const delta = t + phase;

        for (let i = 0; i <= steps; i++) {
          const theta = (i / steps) * Math.PI * 2;
          const x = centerX + radius * Math.sin(a * theta + delta);
          const y = centerY + radius * Math.sin(b * theta);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        // Continuous time-domain trace
        for (let x = 0; x < width; x += 2) {
          const progress = (x / width) * Math.PI * 4 * frequency;
          let y = 0;

          switch (waveType) {
            case 'sine':
              y = Math.sin(progress - t + phase);
              break;
            case 'square': {
              const val = Math.sin(progress - t + phase);
              y = val >= 0 ? 0.95 : -0.95;
              break;
            }
            case 'triangle': {
              const p = (progress - t + phase) / Math.PI;
              y = 2 * Math.abs(2 * (p - Math.floor(p + 0.5))) - 1;
              break;
            }
            case 'sawtooth': {
              const p = (progress - t + phase) / (2 * Math.PI);
              y = 2 * (p - Math.floor(p + 0.5));
              break;
            }
            case 'fourier': {
              // Synthesize square wave using sum of odd harmonics
              let sum = 0;
              for (let k = 1; k <= harmonics; k++) {
                const n = 2 * k - 1;
                sum += (1 / n) * Math.sin(n * (progress - t + phase));
              }
              y = (4 / Math.PI) * sum;
              break;
            }
          }

          const screenY = centerY - y * (height * 0.38) * amplitude;
          if (x === 0) ctx.moveTo(x, screenY);
          else ctx.lineTo(x, screenY);
        }
      }

      ctx.stroke();

      // Reset shadow for performance
      ctx.shadowBlur = 0;

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [waveType, frequency, amplitude, phase, harmonics, isPaused, theme]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Header bar */}
      <div className={`p-4 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${theme.borderColor} bg-stone-900`}>
            <Activity className={`w-5 h-5 ${theme.textColor}`} />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-200">
              CRT Vector Trace Oscilloscope & Wave Synthesizer
            </h2>
            <p className="text-xs text-stone-400 font-mono">
              Real-time mathematical waveform rendering with phosphor persistence, Lissajous curves, and Fourier harmonics.
            </p>
          </div>
        </div>

        {/* Audio monitor switch */}
        <button
          onClick={() => {
            const next = !soundOutput;
            setSoundOutput(next);
            retroAudio.playRelayClick();
          }}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 transition-colors ${
            soundOutput
              ? `${theme.borderColor} ${theme.bgSubtle} ${theme.textColor}`
              : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{soundOutput ? 'SPEAKER MONITOR: ON' : 'SPEAKER MONITOR: OFF'}</span>
        </button>
      </div>

      {/* Main CRT Scope Canvas */}
      <div className={`rounded-2xl border-2 ${theme.borderColor} bg-black p-3 shadow-2xl relative crt-screen overflow-hidden`}>
        <div className="flex justify-between items-center text-xs font-mono text-stone-500 mb-2 px-2">
          <span>TIMEBASE: 10 ms/DIV</span>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
            <span>SWEEP: {isPaused ? 'HOLD' : 'ACTIVE'}</span>
          </span>
          <span>CHANNEL 1: {waveType.toUpperCase()}</span>
        </div>

        <canvas
          ref={canvasRef}
          width={900}
          height={380}
          className="w-full h-[280px] sm:h-[380px] bg-black rounded-xl block border border-stone-900"
        />

        <div className="flex justify-between items-center text-[11px] font-mono text-stone-500 mt-2 px-2">
          <span>VECTOR PERSISTENCE: 250ms</span>
          <span>TRIGGER: AUTO (EDGE)</span>
        </div>
      </div>

      {/* Waveform Controls & Tuners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waveform Selection */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/80`}>
          <span className="text-xs font-mono text-stone-400 font-bold block mb-2">
            WAVEFORM FUNCTION
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { id: 'sine', label: 'SINE' },
              { id: 'square', label: 'SQUARE' },
              { id: 'triangle', label: 'TRIANGLE' },
              { id: 'sawtooth', label: 'SAWTOOTH' },
              { id: 'lissajous', label: 'LISSAJOUS' },
              { id: 'fourier', label: 'FOURIER' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setWaveType(w.id as typeof waveType);
                  retroAudio.playKeyClick();
                }}
                className={`py-1.5 px-2 rounded-lg border text-center transition-colors ${
                  waveType === w.id
                    ? `${theme.borderColor} ${theme.bgSubtle} ${theme.textColor} font-bold`
                    : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Dial */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/80`}>
          <div className="flex justify-between text-xs font-mono text-stone-400 mb-2">
            <span className="font-bold">FREQUENCY (ω)</span>
            <span className={theme.textColor}>{frequency}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-stone-600 mt-1">
            <span>1 Hz</span>
            <span>8 Hz</span>
          </div>
        </div>

        {/* Amplitude Dial */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/80`}>
          <div className="flex justify-between text-xs font-mono text-stone-400 mb-2">
            <span className="font-bold">AMPLITUDE (VOLTS)</span>
            <span className={theme.textColor}>{Math.round(amplitude * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-stone-600 mt-1">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dynamic: Harmonics / Phase & Sweep Freeze */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/80 flex flex-col justify-between`}>
          <div>
            <div className="flex justify-between text-xs font-mono text-stone-400 mb-1">
              <span className="font-bold">
                {waveType === 'fourier' ? 'FOURIER HARMONICS' : 'PHASE SHIFT (φ)'}
              </span>
              <span className={theme.textColor}>
                {waveType === 'fourier' ? `${harmonics}` : `${Math.round((phase / Math.PI) * 180)}°`}
              </span>
            </div>

            {waveType === 'fourier' ? (
              <input
                type="range"
                min="1"
                max="10"
                value={harmonics}
                onChange={(e) => setHarmonics(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            ) : (
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step={0.1}
                value={phase}
                onChange={(e) => setPhase(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            )}
          </div>

          <button
            onClick={() => {
              setIsPaused(!isPaused);
              retroAudio.playRelayClick();
            }}
            className="mt-3 py-1.5 px-3 rounded-lg border border-stone-800 bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 text-xs font-mono flex items-center justify-center gap-2"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'RESUME TRACE' : 'HOLD / FREEZE FRAME'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
