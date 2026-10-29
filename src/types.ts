export type GlowTheme = 'amber' | 'green' | 'cyan' | 'ruby';

export interface ThemeConfig {
  id: GlowTheme;
  name: string;
  glowClass: string;
  textColor: string;
  borderColor: string;
  bgSubtle: string;
  accentHex: string;
  glowRgba: string;
}

export type MachineMode = 'alu' | 'registers' | 'cpu' | 'oscilloscope' | 'transmuter';

export interface TapeEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export interface CpuInstruction {
  opcode: string;
  operand: number;
  comment?: string;
}

export interface CpuState {
  pc: number;
  acc: number;
  zeroFlag: boolean;
  carryFlag: boolean;
  out: number;
  halted: boolean;
  cycles: number;
  phase: 'FETCH' | 'DECODE' | 'EXECUTE' | 'HALT';
}
