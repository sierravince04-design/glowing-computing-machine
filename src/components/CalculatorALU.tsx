import React, { useState } from 'react';
import { TapeEntry, GlowTheme } from '../types';
import { THEMES } from '../theme';
import { retroAudio } from '../utils/audio';
import { History, Trash2, Copy, Check, CornerDownLeft } from 'lucide-react';

interface CalculatorALUProps {
  themeKey: GlowTheme;
}

export const CalculatorALU: React.FC<CalculatorALUProps> = ({ themeKey }) => {
  const theme = THEMES[themeKey];

  const [display, setDisplay] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [tape, setTape] = useState<TapeEntry[]>([
    {
      id: '1',
      expression: '256 * 16 + 1024',
      result: '5120',
      timestamp: '00:01:14',
    },
    {
      id: '2',
      expression: 'sin(pi / 4)',
      result: '0.70710678',
      timestamp: '00:02:45',
    },
  ]);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  // Safe arithmetic evaluator
  const evaluateMath = (expr: string): number => {
    // Replace friendly tokens
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/\^/g, '**');

    // Only allow safe math tokens
    if (!/^[0-9+\-*/().\s|&^~%Math.PIEsincoztaqrlg]+$/.test(sanitized)) {
      throw new Error('Invalid tokens');
    }

    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Math error');
    }
    return result;
  };

  const handleInput = (char: string) => {
    retroAudio.playKeyClick();
    setEvalError(null);
    if (display === '0' && !['.', '+', '-', '*', '/', '%'].includes(char)) {
      setDisplay(char);
    } else {
      setDisplay((prev) => prev + char);
    }
  };

  const handleClear = () => {
    retroAudio.playRelayClick();
    setDisplay('0');
    setExpression('');
    setEvalError(null);
  };

  const handleBackspace = () => {
    retroAudio.playKeyClick();
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleCalculate = () => {
    retroAudio.playTone(880, 0.05);
    try {
      const fullExpr = expression ? `${expression} ${display}` : display;
      const res = evaluateMath(fullExpr);
      const rounded = Number(res.toFixed(8)).toString();

      const newEntry: TapeEntry = {
        id: Date.now().toString(),
        expression: fullExpr,
        result: rounded,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      };

      setTape((prev) => [newEntry, ...prev.slice(0, 49)]);
      setDisplay(rounded);
      setExpression('');
      setEvalError(null);
    } catch {
      setEvalError('ERR: SYNTAX / OVERFLOW');
      retroAudio.playTone(220, 0.15, 'sawtooth');
    }
  };

  const handleFunction = (fn: string) => {
    retroAudio.playKeyClick();
    try {
      const currentVal = parseFloat(display) || 0;
      let res = 0;
      switch (fn) {
        case 'sqr':
          res = currentVal * currentVal;
          break;
        case 'sqrt':
          if (currentVal < 0) throw new Error('Negative sqrt');
          res = Math.sqrt(currentVal);
          break;
        case 'inv':
          if (currentVal === 0) throw new Error('Divide by zero');
          res = 1 / currentVal;
          break;
        case 'fact':
          if (currentVal < 0 || currentVal > 170) throw new Error('Range error');
          let f = 1;
          for (let i = 2; i <= Math.floor(currentVal); i++) f *= i;
          res = f;
          break;
        case 'sin':
          res = Math.sin((currentVal * Math.PI) / 180);
          break;
        case 'cos':
          res = Math.cos((currentVal * Math.PI) / 180);
          break;
        case 'tan':
          res = Math.tan((currentVal * Math.PI) / 180);
          break;
        case 'log':
          if (currentVal <= 0) throw new Error('Log error');
          res = Math.log10(currentVal);
          break;
        case 'ln':
          if (currentVal <= 0) throw new Error('Ln error');
          res = Math.log(currentVal);
          break;
        case 'neg':
          res = -currentVal;
          break;
        default:
          return;
      }
      const strRes = Number(res.toFixed(8)).toString();
      setDisplay(strRes);
      setEvalError(null);
    } catch {
      setEvalError('MATH DOMAIN ERR');
      retroAudio.playTone(220, 0.12, 'sawtooth');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4 py-4">
      {/* ALU Core Chassis */}
      <div className={`lg:col-span-8 rounded-2xl border ${theme.borderColor} bg-stone-950/80 p-5 shadow-2xl relative`}>
        {/* Glowing Vacuum Tube / CRT Display */}
        <div className={`w-full rounded-xl border-2 ${theme.borderColor} bg-black/95 p-4 mb-5 relative crt-screen overflow-hidden`}>
          <div className="flex justify-between items-center text-xs font-mono text-stone-500 mb-1">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${memory !== 0 ? 'bg-amber-400 animate-ping' : 'bg-stone-700'}`} />
              <span>MEM: {memory !== 0 ? memory : 'OFF'}</span>
            </span>
            <span>ALU ACCUMULATOR</span>
          </div>

          {/* Sub expression */}
          <div className="h-5 text-right font-mono text-xs text-stone-400 overflow-hidden truncate">
            {expression || ' '}
          </div>

          {/* Main Glowing Result Screen */}
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xs font-mono uppercase tracking-widest ${evalError ? 'text-rose-500 animate-bounce' : 'text-stone-600'}`}>
              {evalError || 'READY'}
            </span>
            <div className={`text-3xl sm:text-4xl font-mono font-bold tracking-wider text-right overflow-x-auto whitespace-nowrap pl-4 ${theme.textColor} ${theme.glowClass}`}>
              {display}
            </div>
          </div>

          {/* Copy action button */}
          <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-stone-800/80">
            <button
              onClick={handleCopy}
              className="text-[11px] font-mono text-stone-400 hover:text-stone-200 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-stone-900 border border-stone-800"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>

        {/* Tactile Keypad */}
        <div className="space-y-3">
          {/* Memory & Function Header Bar */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'MC', action: () => setMemory(0) },
              { label: 'MR', action: () => setDisplay(memory.toString()) },
              { label: 'M+', action: () => setMemory((m) => m + (parseFloat(display) || 0)) },
              { label: 'M-', action: () => setMemory((m) => m - (parseFloat(display) || 0)) },
              { label: 'CLR', action: handleClear, highlight: true },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => {
                  retroAudio.playRelayClick();
                  btn.action();
                }}
                className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                  btn.highlight
                    ? 'border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50'
                    : 'border-stone-800 bg-stone-900/90 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Scientific Functions */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { label: 'sin', action: () => handleFunction('sin') },
              { label: 'cos', action: () => handleFunction('cos') },
              { label: 'tan', action: () => handleFunction('tan') },
              { label: '√x', action: () => handleFunction('sqrt') },
              { label: 'x²', action: () => handleFunction('sqr') },
              { label: '1/x', action: () => handleFunction('inv') },
              { label: 'ln', action: () => handleFunction('ln') },
              { label: 'log', action: () => handleFunction('log') },
              { label: 'n!', action: () => handleFunction('fact') },
              { label: 'π', action: () => handleInput('3.14159265') },
              { label: 'e', action: () => handleInput('2.71828182') },
              { label: '±', action: () => handleFunction('neg') },
            ].map((fn, idx) => (
              <button
                key={idx}
                onClick={fn.action}
                className="py-1.5 text-xs font-mono rounded-lg border border-stone-800/80 bg-stone-900/40 text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              >
                {fn.label}
              </button>
            ))}
          </div>

          {/* Core Numerical & Operator Pad */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {[
              { label: '(', action: () => handleInput('(') },
              { label: ')', action: () => handleInput(')') },
              { label: '%', action: () => handleInput(' % ') },
              { label: '÷', action: () => handleInput(' ÷ '), op: true },

              { label: '7', action: () => handleInput('7') },
              { label: '8', action: () => handleInput('8') },
              { label: '9', action: () => handleInput('9') },
              { label: '×', action: () => handleInput(' × '), op: true },

              { label: '4', action: () => handleInput('4') },
              { label: '5', action: () => handleInput('5') },
              { label: '6', action: () => handleInput('6') },
              { label: '-', action: () => handleInput(' - '), op: true },

              { label: '1', action: () => handleInput('1') },
              { label: '2', action: () => handleInput('2') },
              { label: '3', action: () => handleInput('3') },
              { label: '+', action: () => handleInput(' + '), op: true },

              { label: 'DEL', action: handleBackspace },
              { label: '0', action: () => handleInput('0') },
              { label: '.', action: () => handleInput('.') },
              { label: '=', action: handleCalculate, isEnter: true },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className={`py-3 sm:py-4 rounded-xl font-mono text-sm sm:text-base font-semibold border transition-all active:scale-[0.98] ${
                  btn.isEnter
                    ? `${theme.borderColor} ${theme.bgSubtle} ${theme.textColor} ${theme.glowClass} font-bold shadow-lg border-2 hover:brightness-125`
                    : btn.op
                    ? 'border-stone-700 bg-stone-800/90 text-stone-200 hover:bg-stone-700'
                    : 'border-stone-800/80 bg-stone-900/80 text-stone-300 hover:bg-stone-800 hover:border-stone-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Arithmetic Tape Log / Memory Reel */}
      <div className={`lg:col-span-4 rounded-2xl border ${theme.borderColor} bg-stone-950/80 p-4 shadow-xl flex flex-col h-full min-h-[460px]`}>
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
          <div className="flex items-center gap-2">
            <History className={`w-4 h-4 ${theme.textColor}`} />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
              Tape Memory Reel
            </h3>
          </div>
          {tape.length > 0 && (
            <button
              onClick={() => {
                retroAudio.playRelayClick();
                setTape([]);
              }}
              title="Purge Paper Tape"
              className="text-stone-500 hover:text-rose-400 transition-colors p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Paper tape scroll container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 crt-screen">
          {tape.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-600 font-mono text-xs">
              <CornerDownLeft className="w-8 h-8 mb-2 stroke-1 opacity-40" />
              <span>TAPE BUFFER CLEAR</span>
              <span className="text-[10px] mt-1 text-stone-700">Compute operations to print entries to paper tape.</span>
            </div>
          ) : (
            tape.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  setDisplay(entry.result);
                  retroAudio.playKeyClick();
                }}
                className="p-2.5 rounded-lg border border-stone-800/80 bg-stone-900/50 hover:bg-stone-900 hover:border-stone-700 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 mb-1">
                  <span>{entry.timestamp}</span>
                  <span className="group-hover:text-stone-300 transition-colors">LOAD ↵</span>
                </div>
                <div className="text-xs font-mono text-stone-400 break-all">{entry.expression}</div>
                <div className={`text-sm font-mono font-bold text-right mt-1 ${theme.textColor}`}>
                  = {entry.result}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Tape Summary */}
        <div className="mt-3 pt-3 border-t border-stone-800/80 text-[11px] font-mono text-stone-500 flex justify-between">
          <span>ENTRIES: {tape.length}</span>
          <span>BUFFER: OK</span>
        </div>
      </div>
    </div>
  );
};
