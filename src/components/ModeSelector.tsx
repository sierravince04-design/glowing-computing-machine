import React from 'react';
import { Calculator, Binary, Cpu, Activity, ArrowRightLeft } from 'lucide-react';
import { MachineMode, GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';

interface ModeSelectorProps {
  currentMode: MachineMode;
  setMode: (mode: MachineMode) => void;
  themeKey: GlowTheme;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  setMode,
  themeKey,
}) => {
  const theme = THEMES[themeKey];

  const modes: { id: MachineMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'alu',
      label: 'ALU CALCULATOR',
      desc: 'Scientific & Logic Engine',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'registers',
      label: 'BIT & FLOAT LAB',
      desc: 'Word, IEEE-754 & Bitwise',
      icon: <Binary className="w-4 h-4" />,
    },
    {
      id: 'cpu',
      label: 'MICRO-CPU SIMULATOR',
      desc: '16-Word Von Neumann Architecture',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'oscilloscope',
      label: 'CRT OSCILLOSCOPE',
      desc: 'Vector Curves & Wave Synthesis',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'transmuter',
      label: 'BASE & TIME TRANSMUTER',
      desc: 'Radix 2-36 & Epoch Time',
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="w-full max-w-7xl mx-auto px-4 pt-4 pb-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                retroAudio.playRelayClick();
              }}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${
                isActive
                  ? `${theme.borderColor} ${theme.bgSubtle} shadow-lg ring-1 ring-inset ${theme.borderColor}`
                  : 'border-stone-800 bg-stone-900/60 hover:bg-stone-900 hover:border-stone-700 text-stone-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`p-1.5 rounded-lg border ${
                    isActive
                      ? `${theme.borderColor} bg-black/50 ${theme.textColor}`
                      : 'border-stone-800 bg-stone-950 text-stone-500 group-hover:text-stone-300'
                  }`}
                >
                  {m.icon}
                </span>
                {isActive && (
                  <span className={`w-2 h-2 rounded-full animate-ping ${theme.bgSubtle} inline-block`} style={{ backgroundColor: theme.accentHex }} />
                )}
              </div>
              <span className={`text-xs font-bold font-mono tracking-wider ${isActive ? theme.textColor : 'text-stone-200'}`}>
                {m.label}
              </span>
              <span className="text-[11px] text-stone-500 font-mono mt-0.5 line-clamp-1">
                {m.desc}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
