import React, { useState } from 'react';
import { GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';
import { RotateCw, RotateCcw, FlipHorizontal, Binary } from 'lucide-react';

interface BitInspectorProps {
  themeKey: GlowTheme;
}

export const BitInspector: React.FC<BitInspectorProps> = ({ themeKey }) => {
  const theme = THEMES[themeKey];

  // 32-bit unsigned integer state
  const [value, setValue] = useState<number>(1048576 + 42); // sample initial value
  const [bitWidth, setBitWidth] = useState<8 | 16 | 32>(32);

  // Helper bit reading
  const isBitSet = (index: number): boolean => {
    return (value & (1 << index)) !== 0;
  };

  const toggleBit = (index: number) => {
    retroAudio.playRelayClick();
    const mask = 1 << index;
    setValue((prev) => (prev ^ mask) >>> 0);
  };

  const setAllBits = (newVal: number) => {
    retroAudio.playRelayClick();
    const mask = bitWidth === 8 ? 0xff : bitWidth === 16 ? 0xffff : 0xffffffff;
    setValue((newVal & mask) >>> 0);
  };

  const shiftLeft = () => {
    retroAudio.playKeyClick();
    const mask = bitWidth === 8 ? 0xff : bitWidth === 16 ? 0xffff : 0xffffffff;
    setValue(((value << 1) & mask) >>> 0);
  };

  const shiftRight = () => {
    retroAudio.playKeyClick();
    setValue((value >>> 1) >>> 0);
  };

  const rotateLeft = () => {
    retroAudio.playKeyClick();
    const topBit = (value >>> (bitWidth - 1)) & 1;
    const mask = bitWidth === 8 ? 0xff : bitWidth === 16 ? 0xffff : 0xffffffff;
    setValue((((value << 1) | topBit) & mask) >>> 0);
  };

  const rotateRight = () => {
    retroAudio.playKeyClick();
    const lowBit = value & 1;
    const mask = bitWidth === 8 ? 0xff : bitWidth === 16 ? 0xffff : 0xffffffff;
    setValue(((value >>> 1) | (lowBit << (bitWidth - 1))) & mask);
  };

  const invertBits = () => {
    retroAudio.playRelayClick();
    const mask = bitWidth === 8 ? 0xff : bitWidth === 16 ? 0xffff : 0xffffffff;
    setValue((~value & mask) >>> 0);
  };

  // Conversions
  const hexString = '0x' + value.toString(16).toUpperCase().padStart(bitWidth / 4, '0');
  const octalString = '0o' + value.toString(8);
  const unsignedDec = value >>> 0;
  
  // Signed integer calculation based on bit width
  let signedDec = value;
  if (bitWidth === 8 && (value & 0x80)) {
    signedDec = value - 0x100;
  } else if (bitWidth === 16 && (value & 0x8000)) {
    signedDec = value - 0x10000;
  } else if (bitWidth === 32) {
    signedDec = value | 0;
  }

  // Popcount (Hamming weight)
  const popcount = () => {
    let count = 0;
    for (let i = 0; i < bitWidth; i++) {
      if ((value >>> i) & 1) count++;
    }
    return count;
  };

  // IEEE 754 Float interpretation (for 32-bit)
  const getFloatBreakdown = () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, value);
    const floatVal = view.getFloat32(0);

    const sign = (value >>> 31) & 1;
    const exp = (value >>> 23) & 0xff;
    const mantissa = value & 0x7fffff;
    const biasedExp = exp - 127;

    return {
      floatVal,
      sign,
      expBin: exp.toString(2).padStart(8, '0'),
      mantissaBin: mantissa.toString(2).padStart(23, '0'),
      biasedExp,
    };
  };

  const floatInfo = getFloatBreakdown();

  // ASCII extraction
  const getAscii = () => {
    const chars: string[] = [];
    const bytes = bitWidth / 8;
    for (let i = bytes - 1; i >= 0; i--) {
      const byte = (value >>> (i * 8)) & 0xff;
      if (byte >= 32 && byte <= 126) {
        chars.push(String.fromCharCode(byte));
      } else {
        chars.push('·');
      }
    }
    return chars.join('');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Header bar for Bit Width and Register Selector */}
      <div className={`p-4 rounded-2xl border ${theme.borderColor} bg-stone-950/80 shadow-xl flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${theme.borderColor} bg-stone-900`}>
            <Binary className={`w-5 h-5 ${theme.textColor}`} />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-200">
              Interactive Bit Register & IEEE-754 Inspector
            </h2>
            <p className="text-xs text-stone-400 font-mono">
              Click individual LEDs to toggle bits. Observe immediate hexadecimal, integer, and floating-point recalculations.
            </p>
          </div>
        </div>

        {/* Bit width selector */}
        <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 rounded-lg p-1 font-mono text-xs">
          <span className="text-stone-500 px-2">BUS WIDTH:</span>
          {([8, 16, 32] as (8 | 16 | 32)[]).map((w) => (
            <button
              key={w}
              onClick={() => {
                setBitWidth(w);
                retroAudio.playRelayClick();
              }}
              className={`px-3 py-1 rounded transition-colors ${
                bitWidth === w
                  ? `${theme.bgSubtle} ${theme.borderColor} ${theme.textColor} font-bold border`
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              {w}-BIT
            </button>
          ))}
        </div>
      </div>

      {/* Glowing Bit Matrix (LED Banks) */}
      <div className={`p-6 rounded-2xl border-2 ${theme.borderColor} bg-black/95 shadow-2xl relative crt-screen`}>
        <div className="flex justify-between items-center text-xs font-mono text-stone-400 mb-4 border-b border-stone-800 pb-2">
          <span>HIGH BIT (MSB [{bitWidth - 1}])</span>
          <span className="text-stone-500">INDIVIDUAL GLOWING VACUUM / LED GATES</span>
          <span>LOW BIT (LSB [0])</span>
        </div>

        {/* LED Grid grouped in 4-bit nibbles */}
        <div className="grid grid-cols-8 sm:grid-cols-16 lg:grid-cols-32 gap-1.5 sm:gap-2 justify-items-center">
          {Array.from({ length: bitWidth })
            .map((_, i) => bitWidth - 1 - i)
            .map((bitIndex) => {
              const active = isBitSet(bitIndex);
              const isNibbleBoundary = bitIndex % 4 === 3;
              return (
                <div key={bitIndex} className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => toggleBit(bitIndex)}
                    title={`Bit ${bitIndex} (Weight: ${Math.pow(2, bitIndex)})`}
                    className={`w-7 h-10 sm:w-8 sm:h-12 rounded-md border flex flex-col items-center justify-between py-1 transition-all group ${
                      active
                        ? `${theme.borderColor} ${theme.bgSubtle} shadow-lg ring-1 ${theme.borderColor}`
                        : 'border-stone-800/80 bg-stone-950 hover:border-stone-700'
                    }`}
                  >
                    {/* Glowing LED pip */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        active
                          ? `${theme.textColor} shadow-[0_0_8px_currentColor] animate-pulse`
                          : 'bg-stone-800 group-hover:bg-stone-700'
                      }`}
                      style={active ? { backgroundColor: theme.accentHex } : {}}
                    />
                    <span
                      className={`text-xs font-mono font-bold ${
                        active ? `${theme.textColor} ${theme.glowClass}` : 'text-stone-600'
                      }`}
                    >
                      {active ? '1' : '0'}
                    </span>
                  </button>
                  <span className={`text-[10px] font-mono ${isNibbleBoundary ? 'text-stone-400 font-bold' : 'text-stone-600'}`}>
                    {bitIndex}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Quick Operations Strip */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={shiftLeft}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> SHL ( &lt;&lt; 1 )
            </button>
            <button
              onClick={shiftRight}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" /> SHR ( &gt;&gt; 1 )
            </button>
            <button
              onClick={rotateLeft}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800"
            >
              ROL
            </button>
            <button
              onClick={rotateRight}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800"
            >
              ROR
            </button>
            <button
              onClick={invertBits}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-1"
            >
              <FlipHorizontal className="w-3 h-3" /> NOT (~x)
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAllBits(0)}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:bg-stone-800"
            >
              CLEAR (0)
            </button>
            <button
              onClick={() => setAllBits(0xffffffff)}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            >
              ALL 1s
            </button>
            <button
              onClick={() => setAllBits(0xaaaaaaaa)}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            >
              0xAA
            </button>
            <button
              onClick={() => setAllBits(0x55555555)}
              className="px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-800"
            >
              0x55
            </button>
          </div>
        </div>
      </div>

      {/* Representation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hex */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/70`}>
          <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
            HEXADECIMAL
          </div>
          <div className={`text-xl font-mono font-bold truncate ${theme.textColor} ${theme.glowClass}`}>
            {hexString}
          </div>
        </div>

        {/* Signed Decimal */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/70`}>
          <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
            SIGNED DECIMAL ({bitWidth}-BIT 2&apos;s COMP)
          </div>
          <div className={`text-xl font-mono font-bold truncate ${theme.textColor} ${theme.glowClass}`}>
            {signedDec.toLocaleString()}
          </div>
        </div>

        {/* Unsigned Decimal */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/70`}>
          <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
            UNSIGNED DECIMAL
          </div>
          <div className={`text-xl font-mono font-bold truncate ${theme.textColor} ${theme.glowClass}`}>
            {unsignedDec.toLocaleString()}
          </div>
        </div>

        {/* Octal & ASCII */}
        <div className={`p-4 rounded-xl border ${theme.borderColor} bg-stone-950/70`}>
          <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider mb-1">
            OCTAL / ASCII
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-mono font-bold ${theme.textColor}`}>
              {octalString}
            </span>
            <span className="text-sm font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
              &quot;{getAscii()}&quot;
            </span>
          </div>
        </div>
      </div>

      {/* IEEE-754 Single Precision Floating-Point Visualizer (when 32-bit) */}
      {bitWidth === 32 && (
        <div className={`p-5 rounded-2xl border ${theme.borderColor} bg-stone-950/90 shadow-xl crt-screen`}>
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-200">
                IEEE-754 Single-Precision 32-Bit Float Breakdown
              </h3>
              <p className="text-[11px] font-mono text-stone-500">
                Formula: (-1)ˢ × 2ᵉ⁻¹²⁷ × (1 + fraction)
              </p>
            </div>
            <div className={`text-xl font-mono font-bold ${theme.textColor} ${theme.glowClass}`}>
              = {isNaN(floatInfo.floatVal) ? 'NaN' : floatInfo.floatVal.toPrecision(7)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 font-mono text-xs">
            {/* Sign bit (1 bit) */}
            <div className="md:col-span-2 p-3 rounded-xl border border-rose-900/50 bg-rose-950/20">
              <span className="text-rose-400 text-[10px] font-bold block mb-1">SIGN (1 BIT) [31]</span>
              <div className="text-lg font-bold text-rose-300">{floatInfo.sign}</div>
              <div className="text-[10px] text-stone-500 mt-1">
                {floatInfo.sign === 0 ? '+ (Positive)' : '- (Negative)'}
              </div>
            </div>

            {/* Exponent (8 bits) */}
            <div className="md:col-span-4 p-3 rounded-xl border border-amber-900/50 bg-amber-950/20">
              <span className="text-amber-400 text-[10px] font-bold block mb-1">
                EXPONENT (8 BITS) [30..23]
              </span>
              <div className="text-sm font-bold text-amber-300 tracking-wider">
                {floatInfo.expBin}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                Biased: 2^({floatInfo.biasedExp})
              </div>
            </div>

            {/* Mantissa (23 bits) */}
            <div className="md:col-span-6 p-3 rounded-xl border border-cyan-900/50 bg-cyan-950/20">
              <span className="text-cyan-400 text-[10px] font-bold block mb-1">
                MANTISSA / FRACTION (23 BITS) [22..0]
              </span>
              <div className="text-xs font-bold text-cyan-300 break-all tracking-wider">
                {floatInfo.mantissaBin}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                Hamming Weight: {popcount()} set bits
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
