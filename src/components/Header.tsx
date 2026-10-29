import React from 'react';
import { Terminal, Volume2, VolumeX, Sparkles, Tv, Info, Cpu } from 'lucide-react';
import { GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';

interface HeaderProps {
  currentTheme: GlowTheme;
  setTheme: (theme: GlowTheme) => void;
  scanlines: boolean;
  setScanlines: (v: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
  openInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  setTheme,
  scanlines,
  setScanlines,
  audioEnabled,
  setAudioEnabled,
  openInfo,
}) => {
  const theme = THEMES[currentTheme];

  const handleAudioToggle = () => {
    const next = !audioEnabled;
    retroAudio.enabled = next;
    setAudioEnabled(next);
    if (next) {
      retroAudio.playTone(600, 0.1);
    }
  };

  return (
    <header className={`w-full border-b ${theme.borderColor} ${theme.bgSubtle} backdrop-blur-md px-4 py-3 select-none`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Machine Identity */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded border ${theme.borderColor} bg-black/60 shadow-inner flex items-center justify-center`}>
            <Terminal className={`w-6 h-6 ${theme.textColor} animate-pulse`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold tracking-wider uppercase font-mono ${theme.textColor} ${theme.glowClass}`}>
                Glowing Computing Machine
              </h1>
              <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 rounded border border-stone-700 bg-stone-900 text-stone-400 font-mono">
                MK-IV
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>CORE CLOCK: 4.19 MHz</span>
              <span className="text-stone-600">|</span>
              <span>STATE: OPERATIONAL</span>
            </p>
          </div>
        </div>

        {/* Controls & Themes */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Theme Palette */}
          <div className="flex items-center bg-stone-900/90 border border-stone-800 rounded-lg p-1 gap-1">
            <span className="text-[11px] text-stone-400 font-mono px-2 hidden sm:inline flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-stone-400" /> PHOSPHOR:
            </span>
            {(['amber', 'green', 'cyan', 'ruby'] as GlowTheme[]).map((tKey) => {
              const t = THEMES[tKey];
              const isActive = currentTheme === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => {
                    setTheme(tKey);
                    retroAudio.playRelayClick();
                  }}
                  title={t.name}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? `${t.bgSubtle} ${t.borderColor} ${t.textColor} font-semibold shadow-sm`
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: t.accentHex }}
                  />
                  <span className="capitalize">{tKey}</span>
                </button>
              );
            })}
          </div>

          {/* CRT Scanlines Toggle */}
          <button
            onClick={() => {
              setScanlines(!scanlines);
              retroAudio.playRelayClick();
            }}
            title="Toggle CRT Cathode Ray Scanlines"
            className={`p-2 rounded-lg border font-mono text-xs transition-colors flex items-center gap-1.5 ${
              scanlines
                ? `${theme.borderColor} ${theme.bgSubtle} ${theme.textColor}`
                : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden md:inline">SCANLINES</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={handleAudioToggle}
            title={audioEnabled ? 'Mute Mechanical & Audio Feedback' : 'Enable Mechanical Key & Tone Audio'}
            className={`p-2 rounded-lg border font-mono text-xs transition-colors flex items-center gap-1.5 ${
              audioEnabled
                ? `${theme.borderColor} ${theme.bgSubtle} ${theme.textColor}`
                : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{audioEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          {/* Machine Info / Provenance */}
          <button
            onClick={() => {
              retroAudio.playKeyClick();
              openInfo();
            }}
            title="Machine Specs & GitHub Repository Origin"
            className="p-2 rounded-lg border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
