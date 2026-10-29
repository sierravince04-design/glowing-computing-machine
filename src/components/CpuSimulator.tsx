import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CpuState, GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';
import { Play, Pause, StepForward, RotateCcw, Cpu, BookOpen } from 'lucide-react';

interface CpuSimulatorProps {
  themeKey: GlowTheme;
}

// Preset Programs
const PRESETS = [
  {
    name: 'Fibonacci Sequence',
    desc: 'Computes Fibonacci numbers into OUT register: 1, 1, 2, 3, 5, 8, 13, 21...',
    ram: [
      // 0: LDA 14 (curr)
      { op: 'LDA', arg: 14, comment: 'Load current' },
      // 1: ADD 15 (prev)
      { op: 'ADD', arg: 15, comment: 'Add prev -> next' },
      // 2: OUT
      { op: 'OUT', arg: 0, comment: 'Output to LEDs' },
      // 3: STA 13 (temp)
      { op: 'STA', arg: 13, comment: 'Save next in temp' },
      // 4: LDA 14 (curr)
      { op: 'LDA', arg: 14, comment: 'Load curr' },
      // 5: STA 15 (prev = curr)
      { op: 'STA', arg: 15, comment: 'prev = curr' },
      // 6: LDA 13 (temp)
      { op: 'LDA', arg: 13, comment: 'curr = temp' },
      // 7: STA 14
      { op: 'STA', arg: 14, comment: 'Store new curr' },
      // 8: SUB 12 (check limit 55)
      { op: 'SUB', arg: 12, comment: 'Check if reached 55' },
      // 9: JZ 11 (halt if reached limit)
      { op: 'JZ', arg: 11, comment: 'If done, jump halt' },
      // 10: JMP 0 (loop)
      { op: 'JMP', arg: 0, comment: 'Loop' },
      // 11: HLT
      { op: 'HLT', arg: 0, comment: 'Halt program' },
      // 12: Data: Limit (55)
      { op: 'DAT', arg: 55, comment: 'Limit value' },
      // 13: Data: Temp (0)
      { op: 'DAT', arg: 0, comment: 'Temp storage' },
      // 14: Data: Curr (1)
      { op: 'DAT', arg: 1, comment: 'Current = 1' },
      // 15: Data: Prev (0)
      { op: 'DAT', arg: 0, comment: 'Previous = 0' },
    ],
  },
  {
    name: 'Powers of Two Doubler',
    desc: 'Continually multiplies accumulator by 2 until overflow/limit',
    ram: [
      { op: 'LDA', arg: 15, comment: 'Load seed (1)' },
      { op: 'OUT', arg: 0, comment: 'Output to LEDs' },
      { op: 'ADD', arg: 15, comment: 'Add to self (x2)' },
      { op: 'STA', arg: 15, comment: 'Store updated value' },
      { op: 'SUB', arg: 14, comment: 'Compare with max' },
      { op: 'JZ', arg: 8, comment: 'Jump halt if zero' },
      { op: 'LDA', arg: 15, comment: 'Reload value' },
      { op: 'JMP', arg: 1, comment: 'Loop next power' },
      { op: 'HLT', arg: 0, comment: 'Halt on max' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 128, comment: 'Max = 128' },
      { op: 'DAT', arg: 1, comment: 'Seed = 1' },
    ],
  },
  {
    name: 'Countdown Timer',
    desc: 'Counts down from 10 down to 0 and sets Zero Flag to halt',
    ram: [
      { op: 'LDA', arg: 15, comment: 'Load count' },
      { op: 'OUT', arg: 0, comment: 'Display count' },
      { op: 'SUB', arg: 14, comment: 'Subtract 1' },
      { op: 'STA', arg: 15, comment: 'Save new count' },
      { op: 'JZ', arg: 6, comment: 'Halt if zero' },
      { op: 'JMP', arg: 0, comment: 'Continue loop' },
      { op: 'OUT', arg: 0, comment: 'Display final 0' },
      { op: 'HLT', arg: 0, comment: 'Stop' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 0, comment: 'Empty' },
      { op: 'DAT', arg: 1, comment: 'Decrement step: 1' },
      { op: 'DAT', arg: 10, comment: 'Initial count: 10' },
    ],
  },
];

export const CpuSimulator: React.FC<CpuSimulatorProps> = ({ themeKey }) => {
  const theme = THEMES[themeKey];

  // 16 words of RAM
  const [ram, setRam] = useState(PRESETS[0].ram);
  const [cpu, setCpu] = useState<CpuState>({
    pc: 0,
    acc: 0,
    zeroFlag: false,
    carryFlag: false,
    out: 0,
    halted: false,
    cycles: 0,
    phase: 'FETCH',
  });

  const [isRunning, setIsRunning] = useState(false);
  const [clockSpeed, setClockSpeed] = useState<number>(3); // steps per second
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Single CPU execution step
  const stepCpu = useCallback(() => {
    setCpu((prevCpu) => {
      if (prevCpu.halted) return prevCpu;

      const currentCell = ram[prevCpu.pc];
      if (!currentCell) {
        return { ...prevCpu, halted: true, phase: 'HALT' };
      }

      const { op, arg } = currentCell;
      let nextPc = (prevCpu.pc + 1) % 16;
      let nextAcc = prevCpu.acc;
      let nextOut = prevCpu.out;
      let nextHalted = false;
      let nextZ = prevCpu.zeroFlag;
      let nextC = prevCpu.carryFlag;

      switch (op) {
        case 'LDA':
          nextAcc = ram[arg]?.arg ?? 0;
          nextZ = nextAcc === 0;
          break;
        case 'STA':
          // Update RAM at address arg
          setRam((prevRam) => {
            const updated = [...prevRam];
            updated[arg] = { ...updated[arg], arg: nextAcc };
            return updated;
          });
          break;
        case 'ADD': {
          const val = ram[arg]?.arg ?? 0;
          const sum = nextAcc + val;
          nextAcc = sum & 0xff;
          nextC = sum > 0xff;
          nextZ = nextAcc === 0;
          break;
        }
        case 'SUB': {
          const val = ram[arg]?.arg ?? 0;
          const diff = nextAcc - val;
          nextAcc = diff < 0 ? (diff + 256) & 0xff : diff;
          nextC = diff < 0;
          nextZ = nextAcc === 0;
          break;
        }
        case 'AND': {
          const val = ram[arg]?.arg ?? 0;
          nextAcc = (nextAcc & val) & 0xff;
          nextZ = nextAcc === 0;
          break;
        }
        case 'XOR': {
          const val = ram[arg]?.arg ?? 0;
          nextAcc = (nextAcc ^ val) & 0xff;
          nextZ = nextAcc === 0;
          break;
        }
        case 'JMP':
          nextPc = arg % 16;
          break;
        case 'JZ':
          if (nextZ) nextPc = arg % 16;
          break;
        case 'JNZ':
          if (!nextZ) nextPc = arg % 16;
          break;
        case 'OUT':
          nextOut = nextAcc;
          retroAudio.playTone(300 + nextOut * 4, 0.05);
          break;
        case 'HLT':
          nextHalted = true;
          retroAudio.playTone(150, 0.2, 'square');
          break;
        default:
          break;
      }

      return {
        pc: nextPc,
        acc: nextAcc,
        zeroFlag: nextZ,
        carryFlag: nextC,
        out: nextOut,
        halted: nextHalted,
        cycles: prevCpu.cycles + 1,
        phase: nextHalted ? 'HALT' : 'EXECUTE',
      };
    });
  }, [ram]);

  // Clock runner loop
  useEffect(() => {
    if (isRunning && !cpu.halted) {
      const intervalMs = Math.max(50, 1000 / clockSpeed);
      timerRef.current = setInterval(() => {
        stepCpu();
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, cpu.halted, clockSpeed, stepCpu]);

  const handleReset = () => {
    retroAudio.playRelayClick();
    setIsRunning(false);
    setCpu({
      pc: 0,
      acc: 0,
      zeroFlag: false,
      carryFlag: false,
      out: 0,
      halted: false,
      cycles: 0,
      phase: 'FETCH',
    });
  };

  const loadPreset = (presetIdx: number) => {
    retroAudio.playRelayClick();
    setIsRunning(false);
    setRam(PRESETS[presetIdx].ram);
    setCpu({
      pc: 0,
      acc: 0,
      zeroFlag: false,
      carryFlag: false,
      out: 0,
      halted: false,
      cycles: 0,
      phase: 'FETCH',
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Top Controller Panel */}
      <div className={`p-4 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${theme.borderColor} bg-stone-900`}>
            <Cpu className={`w-5 h-5 ${theme.textColor}`} />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-200">
              16-Word Micro-CPU Computer Simulator
            </h2>
            <p className="text-xs text-stone-400 font-mono">
              Von Neumann machine with synchronous fetch-decode-execute cycle and glowing 8-bit bus LEDs.
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-mono text-stone-400 hidden sm:inline">PRESET:</span>
          <select
            onChange={(e) => loadPreset(Number(e.target.value))}
            className="bg-stone-900 border border-stone-800 text-stone-200 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            {PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Machine Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: CPU Registers & Status (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Registers Card */}
          <div className={`p-5 rounded-2xl border-2 ${theme.borderColor} bg-black/95 shadow-2xl relative crt-screen`}>
            <div className="flex justify-between items-center text-xs font-mono text-stone-500 mb-4 border-b border-stone-800 pb-2">
              <span>INTERNAL REGISTERS</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cpu.halted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                {cpu.halted ? 'HALTED' : cpu.phase}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Program Counter PC */}
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-900/60">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-0.5">
                  PC (PROGRAM COUNTER)
                </span>
                <div className={`text-2xl font-mono font-bold ${theme.textColor} ${theme.glowClass}`}>
                  0x{cpu.pc.toString(16).toUpperCase()}
                  <span className="text-xs text-stone-500 font-normal ml-2">
                    (Word {cpu.pc})
                  </span>
                </div>
              </div>

              {/* Accumulator ACC */}
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-900/60">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block mb-0.5">
                  ACC (ACCUMULATOR)
                </span>
                <div className={`text-2xl font-mono font-bold ${theme.textColor} ${theme.glowClass}`}>
                  {cpu.acc}
                  <span className="text-xs text-stone-500 font-normal ml-2">
                    (0x{cpu.acc.toString(16).toUpperCase().padStart(2, '0')})
                  </span>
                </div>
              </div>
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-2.5 rounded-lg border text-center font-mono ${cpu.zeroFlag ? 'border-amber-500/60 bg-amber-950/30 text-amber-300' : 'border-stone-800 bg-stone-900/30 text-stone-600'}`}>
                <span className="text-xs font-bold block">ZERO FLAG (Z)</span>
                <span className="text-[10px]">{cpu.zeroFlag ? 'TRUE (1)' : 'FALSE (0)'}</span>
              </div>
              <div className={`p-2.5 rounded-lg border text-center font-mono ${cpu.carryFlag ? 'border-amber-500/60 bg-amber-950/30 text-amber-300' : 'border-stone-800 bg-stone-900/30 text-stone-600'}`}>
                <span className="text-xs font-bold block">CARRY FLAG (C)</span>
                <span className="text-[10px]">{cpu.carryFlag ? 'TRUE (1)' : 'FALSE (0)'}</span>
              </div>
            </div>

            {/* Output Register with Glowing LEDs */}
            <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/90`}>
              <div className="flex justify-between items-center text-xs font-mono text-stone-400 mb-2">
                <span>OUT REGISTER:</span>
                <span className={`text-lg font-bold font-mono ${theme.textColor} ${theme.glowClass}`}>
                  {cpu.out} (0x{cpu.out.toString(16).toUpperCase().padStart(2, '0')})
                </span>
              </div>
              {/* 8-bit LED display */}
              <div className="flex justify-between items-center gap-1.5 pt-1">
                {Array.from({ length: 8 })
                  .map((_, i) => 7 - i)
                  .map((b) => {
                    const on = ((cpu.out >> b) & 1) === 1;
                    return (
                      <div key={b} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-4 h-4 rounded-full border transition-all ${
                            on
                              ? `${theme.textColor} shadow-[0_0_10px_currentColor]`
                              : 'bg-stone-900 border-stone-800'
                          }`}
                          style={on ? { backgroundColor: theme.accentHex } : {}}
                        />
                        <span className="text-[9px] font-mono text-stone-600">{b}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Stepper & Execution Controls */}
            <div className="mt-5 pt-4 border-t border-stone-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    retroAudio.playRelayClick();
                    setIsRunning(!isRunning);
                  }}
                  disabled={cpu.halted}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-mono text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                    isRunning
                      ? 'border-amber-600 bg-amber-950/40 text-amber-300'
                      : `${theme.borderColor} ${theme.bgSubtle} ${theme.textColor} hover:brightness-125`
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'HALT CLOCK' : 'START RUN'}</span>
                </button>

                <button
                  onClick={() => {
                    retroAudio.playKeyClick();
                    stepCpu();
                  }}
                  disabled={isRunning || cpu.halted}
                  className="py-2.5 px-4 rounded-xl font-mono text-xs font-bold border border-stone-700 bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <StepForward className="w-4 h-4" />
                  <span>STEP</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl font-mono text-xs border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
                  title="Reset CPU State"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Clock Speed Slider */}
              <div className="flex items-center justify-between gap-3 text-xs font-mono text-stone-400 pt-1">
                <span>SPEED: {clockSpeed} Hz</span>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={clockSpeed}
                  onChange={(e) => setClockSpeed(Number(e.target.value))}
                  className="w-36 accent-amber-500 cursor-pointer"
                />
                <span className="text-stone-600">{cpu.cycles} CYCLES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 16-Word RAM View (7 cols) */}
        <div className={`lg:col-span-7 p-5 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl flex flex-col`}>
          <div className="flex justify-between items-center text-xs font-mono text-stone-400 mb-3 pb-2 border-b border-stone-800">
            <span>CORE RAM MATRIX (16 × 8-BIT WORDS)</span>
            <span className="text-[11px] text-stone-500">CLICK OP/VALUE TO EDIT</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-[500px] pr-1">
            {ram.map((cell, idx) => {
              const isCurrentInstruction = cpu.pc === idx;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border font-mono text-xs transition-all flex items-center justify-between ${
                    isCurrentInstruction
                      ? `${theme.borderColor} ${theme.bgSubtle} ring-1 ring-inset ${theme.borderColor} shadow-md`
                      : 'border-stone-800/80 bg-stone-900/40 hover:bg-stone-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 text-right font-bold ${isCurrentInstruction ? theme.textColor : 'text-stone-500'}`}>
                      {idx.toString(16).toUpperCase()}:
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${isCurrentInstruction ? `${theme.textColor} ${theme.glowClass}` : 'text-stone-300'}`}>
                      {cell.op}
                    </span>
                    <span className="text-stone-400 font-bold">
                      {cell.arg}
                    </span>
                  </div>

                  <span className="text-[10px] text-stone-600 truncate max-w-[120px]">
                    {cell.comment || ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Instruction Set Summary */}
          <div className="mt-4 pt-3 border-t border-stone-800 text-[10px] font-mono text-stone-500 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <span>LDA: Load Acc</span>
            <span>STA: Store Acc</span>
            <span>ADD/SUB: Math</span>
            <span>AND/XOR: Logic</span>
            <span>JMP: Jump</span>
            <span>JZ: Jump Zero</span>
            <span>OUT: Display</span>
            <span>HLT: Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
};
