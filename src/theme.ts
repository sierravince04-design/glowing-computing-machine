import { ThemeConfig } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  amber: {
    id: 'amber',
    name: 'Amber Phosphor (P3)',
    glowClass: 'crt-glow-amber',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgSubtle: 'bg-amber-950/20',
    accentHex: '#f59e0b',
    glowRgba: 'rgba(245, 158, 11, 0.4)',
  },
  green: {
    id: 'green',
    name: 'Green CRT (P1)',
    glowClass: 'crt-glow-green',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgSubtle: 'bg-emerald-950/20',
    accentHex: '#10b981',
    glowRgba: 'rgba(16, 185, 129, 0.4)',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan (P4)',
    glowClass: 'crt-glow-cyan',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgSubtle: 'bg-cyan-950/20',
    accentHex: '#06b6d4',
    glowRgba: 'rgba(6, 182, 212, 0.4)',
  },
  ruby: {
    id: 'ruby',
    name: 'Nixie Ruby (Gas)',
    glowClass: 'crt-glow-ruby',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgSubtle: 'bg-rose-950/20',
    accentHex: '#f43f5e',
    glowRgba: 'rgba(244, 63, 94, 0.4)',
  },
};
