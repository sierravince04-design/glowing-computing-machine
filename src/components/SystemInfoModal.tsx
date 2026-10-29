import React from 'react';
import { X, GitBranch, Shield, Cpu, ExternalLink } from 'lucide-react';
import { GlowTheme } from '../types';
import { THEMES } from '../theme';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeKey: GlowTheme;
}

export const SystemInfoModal: React.FC<SystemInfoModalProps> = ({
  isOpen,
  onClose,
  themeKey,
}) => {
  if (!isOpen) return null;
  const theme = THEMES[themeKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-xl rounded-2xl border-2 ${theme.borderColor} bg-stone-950 p-6 shadow-2xl relative crt-screen overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Cpu className={`w-5 h-5 ${theme.textColor}`} />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-200">
              System Diagnostics & Provenance
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 font-mono text-xs text-stone-300">
          {/* GitHub Repo Provenance */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <GitBranch className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-stone-200">GITHUB REPOSITORY ORIGIN</span>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Imported from GitHub repository:{' '}
              <span className={`font-bold ${theme.textColor}`}>
                sierravince04-design/glowing-computing-machine
              </span>
            </p>
            <div className="mt-2 text-[10px] text-stone-500 flex items-center gap-2">
              <span>BRANCH: main</span>
              <span>•</span>
              <span>COMMIT: Initial commit</span>
            </div>
          </div>

          {/* Software License */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60">
            <div className="flex items-center gap-2 text-stone-400 mb-1">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-stone-200">SOFTWARE LICENSE</span>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Covered under Mozilla Public License Version 2.0 (MPL-2.0). All rights, terms, and conditions of the original repository are retained.
            </p>
          </div>

          {/* Architecture & Hardware specs */}
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60">
            <span className="font-bold text-stone-200 block mb-2">COMPUTATIONAL SUBSYSTEMS</span>
            <ul className="space-y-1.5 text-[11px] text-stone-400">
              <li>• <strong className="text-stone-200">ALU Calculator:</strong> Floating point & trigonometric arithmetic with live paper tape memory.</li>
              <li>• <strong className="text-stone-200">Bit & Float Lab:</strong> 8/16/32-bit register inspector with interactive LEDs and IEEE-754 breakdown.</li>
              <li>• <strong className="text-stone-200">Micro-CPU Simulator:</strong> 16-word Von Neumann architecture with synchronous clock cycle execution.</li>
              <li>• <strong className="text-stone-200">CRT Oscilloscope:</strong> Vector CRT trace with phosphor decay persistence, Lissajous curves, and Fourier synthesis.</li>
              <li>• <strong className="text-stone-200">Transmuter:</strong> Radix conversions (Base 2..36), Unix epoch timestamp chronometer, and IEC storage units.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border ${theme.borderColor} ${theme.bgSubtle} ${theme.textColor} hover:brightness-125 transition-all`}
          >
            ACKNOWLEDGE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
