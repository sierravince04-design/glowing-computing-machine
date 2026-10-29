import React, { useState } from 'react';
import { GlowTheme, MachineMode } from './types';
import { THEMES } from './theme';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { CalculatorALU } from './components/CalculatorALU';
import { BitInspector } from './components/BitInspector';
import { CpuSimulator } from './components/CpuSimulator';
import { Oscilloscope } from './components/Oscilloscope';
import { UnitTransmuter } from './components/UnitTransmuter';
import { SystemInfoModal } from './components/SystemInfoModal';

export const App: React.FC = () => {
  const [currentTheme, setTheme] = useState<GlowTheme>('amber');
  const [currentMode, setMode] = useState<MachineMode>('alu');
  const [scanlines, setScanlines] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const theme = THEMES[currentTheme];

  return (
    <div className={`min-h-screen bg-stone-950 flex flex-col relative select-none ${scanlines ? 'crt-scanlines' : ''}`}>
      {/* Top Header & Machine Status */}
      <Header
        currentTheme={currentTheme}
        setTheme={setTheme}
        scanlines={scanlines}
        setScanlines={setScanlines}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        openInfo={() => setInfoOpen(true)}
      />

      {/* Computational Subsystem Switcher */}
      <ModeSelector
        currentMode={currentMode}
        setMode={setMode}
        themeKey={currentTheme}
      />

      {/* Active Subsystem Viewport */}
      <main className="flex-1 pb-12">
        {currentMode === 'alu' && <CalculatorALU themeKey={currentTheme} />}
        {currentMode === 'registers' && <BitInspector themeKey={currentTheme} />}
        {currentMode === 'cpu' && <CpuSimulator themeKey={currentTheme} />}
        {currentMode === 'oscilloscope' && <Oscilloscope themeKey={currentTheme} />}
        {currentMode === 'transmuter' && <UnitTransmuter themeKey={currentTheme} />}
      </main>

      {/* Bottom Chassis Status Bar */}
      <footer className="w-full border-t border-stone-800/80 bg-stone-950/90 py-2.5 px-4 font-mono text-[11px] text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>GLOWING-COMPUTING-MACHINE</span>
            <span className="text-stone-700">|</span>
            <span className="text-stone-400">MPL-2.0 OPEN SOURCE</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <span>THEME: {theme.name}</span>
            <span className="text-stone-700">|</span>
            <span>PORT: 3000 (0.0.0.0)</span>
          </div>
        </div>
      </footer>

      {/* System Diagnostic Modal */}
      <SystemInfoModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        themeKey={currentTheme}
      />
    </div>
  );
};

export default App;
