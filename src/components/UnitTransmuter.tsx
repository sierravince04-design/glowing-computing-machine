import React, { useState, useEffect } from 'react';
import { GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';
import { Clock, HardDrive, ArrowRightLeft } from 'lucide-react';

interface UnitTransmuterProps {
  themeKey: GlowTheme;
}

export const UnitTransmuter: React.FC<UnitTransmuterProps> = ({ themeKey }) => {
  const theme = THEMES[themeKey];

  // Base Transmuter state
  const [baseVal, setBaseVal] = useState<string>('2048');
  const [fromBase, setFromBase] = useState<number>(10);

  // Time machine state
  const [currentEpoch, setCurrentEpoch] = useState<number>(Math.floor(Date.now() / 1000));
  const [customEpoch, setCustomEpoch] = useState<string>(Math.floor(Date.now() / 1000).toString());

  // Storage units state
  const [bytesInput, setBytesInput] = useState<number>(1073741824); // 1 GiB

  // Live epoch clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute base conversions
  const getConvertedBases = () => {
    try {
      const parsed = parseInt(baseVal.trim(), fromBase);
      if (isNaN(parsed)) {
        return { error: 'Invalid input for selected base' };
      }
      return {
        bin: parsed.toString(2),
        oct: parsed.toString(8),
        dec: parsed.toString(10),
        hex: parsed.toString(16).toUpperCase(),
        base32: parsed.toString(32).toUpperCase(),
        base36: parsed.toString(36).toUpperCase(),
      };
    } catch {
      return { error: 'Computation error' };
    }
  };

  const converted = getConvertedBases();

  // Epoch date parsing
  const getEpochDates = () => {
    try {
      const ms = parseInt(customEpoch, 10) * 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) return { error: 'Invalid Timestamp' };
      return {
        utc: d.toUTCString(),
        iso: d.toISOString(),
        local: d.toLocaleString(),
      };
    } catch {
      return { error: 'Invalid Timestamp' };
    }
  };

  const dates = getEpochDates();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Top Banner */}
      <div className={`p-4 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${theme.borderColor} bg-stone-900`}>
            <ArrowRightLeft className={`w-5 h-5 ${theme.textColor}`} />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-200">
              Radix Transmuter & Unix Chronometer
            </h2>
            <p className="text-xs text-stone-400 font-mono">
              Universal base conversion from Radix 2 to 36, Unix epoch chronometer, and byte storage units.
            </p>
          </div>
        </div>

        {/* Live Epoch Counter */}
        <div className="flex items-center gap-2 bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800 font-mono text-xs">
          <Clock className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="text-stone-400">EPOCH TICK:</span>
          <span className={`font-bold ${theme.textColor} ${theme.glowClass}`}>
            {currentEpoch}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Radix (Base) Transmuter */}
        <div className={`p-5 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl space-y-4`}>
          <div className="flex justify-between items-center pb-2 border-b border-stone-800">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
              Arbitrary Radix (Base 2 .. 36) Converter
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono text-stone-400 block mb-1">INPUT VALUE</label>
              <input
                type="text"
                value={baseVal}
                onChange={(e) => setBaseVal(e.target.value)}
                className={`w-full bg-stone-900 border ${theme.borderColor} rounded-xl px-3 py-2 font-mono text-sm ${theme.textColor} focus:outline-none`}
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-stone-400 block mb-1">INPUT BASE</label>
              <select
                value={fromBase}
                onChange={(e) => {
                  setFromBase(parseInt(e.target.value));
                  retroAudio.playRelayClick();
                }}
                className="w-full bg-stone-900 border border-stone-800 text-stone-300 rounded-xl px-3 py-2 font-mono text-sm focus:outline-none"
              >
                <option value={2}>Base 2 (Binary)</option>
                <option value={8}>Base 8 (Octal)</option>
                <option value={10}>Base 10 (Decimal)</option>
                <option value={16}>Base 16 (Hexadecimal)</option>
                <option value={32}>Base 32</option>
                <option value={36}>Base 36 (Alphanumeric)</option>
              </select>
            </div>
          </div>

          {'error' in converted ? (
            <div className="p-3 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 font-mono text-xs">
              {converted.error}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {[
                { label: 'BINARY (BASE 2)', val: converted.bin },
                { label: 'OCTAL (BASE 8)', val: converted.oct },
                { label: 'DECIMAL (BASE 10)', val: converted.dec },
                { label: 'HEXADECIMAL (BASE 16)', val: converted.hex },
                { label: 'BASE 32', val: converted.base32 },
                { label: 'BASE 36', val: converted.base36 },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-stone-800/80 bg-stone-900/40 flex justify-between items-center font-mono text-xs"
                >
                  <span className="text-stone-500 text-[10px]">{row.label}</span>
                  <span className={`font-bold break-all ml-4 ${theme.textColor}`}>{row.val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 2: Unix Epoch Chronometer */}
        <div className={`p-5 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl space-y-4`}>
          <div className="flex justify-between items-center pb-2 border-b border-stone-800">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
              Unix Epoch Chronometer
            </span>
            <button
              onClick={() => {
                setCustomEpoch(Math.floor(Date.now() / 1000).toString());
                retroAudio.playKeyClick();
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
            >
              SET TO NOW
            </button>
          </div>

          <div>
            <label className="text-[11px] font-mono text-stone-400 block mb-1">
              EPOCH SECONDS (SINCE JAN 01, 1970 UTC)
            </label>
            <input
              type="text"
              value={customEpoch}
              onChange={(e) => setCustomEpoch(e.target.value)}
              className={`w-full bg-stone-900 border ${theme.borderColor} rounded-xl px-3 py-2 font-mono text-sm ${theme.textColor} focus:outline-none`}
            />
          </div>

          {'error' in dates ? (
            <div className="p-3 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-300 font-mono text-xs">
              {dates.error}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-xl border border-stone-800/80 bg-stone-900/40 font-mono text-xs">
                <span className="text-stone-500 text-[10px] block mb-0.5">UTC TIME</span>
                <span className={`font-bold ${theme.textColor}`}>{dates.utc}</span>
              </div>
              <div className="p-3 rounded-xl border border-stone-800/80 bg-stone-900/40 font-mono text-xs">
                <span className="text-stone-500 text-[10px] block mb-0.5">ISO-8601 EXTENDED</span>
                <span className={`font-bold ${theme.textColor}`}>{dates.iso}</span>
              </div>
              <div className="p-3 rounded-xl border border-stone-800/80 bg-stone-900/40 font-mono text-xs">
                <span className="text-stone-500 text-[10px] block mb-0.5">LOCAL OBSERVER TIME</span>
                <span className={`font-bold ${theme.textColor}`}>{dates.local}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module 3: Digital Storage & Computing Unit Multipliers */}
      <div className={`p-5 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl space-y-4`}>
        <div className="flex justify-between items-center pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <HardDrive className={`w-4 h-4 ${theme.textColor}`} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
              Binary & Decimal Storage Multipliers (IEC 60027-2 vs SI)
            </span>
          </div>
          <div className="flex gap-2">
            {[1024, 1048576, 1073741824].map((presetBytes) => (
              <button
                key={presetBytes}
                onClick={() => {
                  setBytesInput(presetBytes);
                  retroAudio.playKeyClick();
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200"
              >
                {presetBytes === 1024 ? '1 KiB' : presetBytes === 1048576 ? '1 MiB' : '1 GiB'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <label className="text-[11px] font-mono text-stone-400 block mb-1">RAW BYTES (B)</label>
            <input
              type="number"
              value={bytesInput}
              onChange={(e) => setBytesInput(Math.max(0, parseInt(e.target.value) || 0))}
              className={`w-full bg-stone-900 border ${theme.borderColor} rounded-xl px-3 py-2 font-mono text-sm ${theme.textColor} focus:outline-none`}
            />
          </div>

          <div className="sm:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl border border-stone-800 bg-stone-900/50">
              <span className="text-[10px] text-stone-500 block">BITS (b)</span>
              <span className="font-bold text-stone-200">{(bytesInput * 8).toLocaleString()}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-stone-800 bg-stone-900/50">
              <span className="text-[10px] text-stone-500 block">KIBIBYTES (KiB)</span>
              <span className={`font-bold ${theme.textColor}`}>{(bytesInput / 1024).toFixed(4)}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-stone-800 bg-stone-900/50">
              <span className="text-[10px] text-stone-500 block">MEBIBYTES (MiB)</span>
              <span className={`font-bold ${theme.textColor}`}>{(bytesInput / (1024 * 1024)).toFixed(4)}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-stone-800 bg-stone-900/50">
              <span className="text-[10px] text-stone-500 block">GIBIBYTES (GiB)</span>
              <span className={`font-bold ${theme.textColor}`}>{(bytesInput / (1024 * 1024 * 1024)).toFixed(6)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
