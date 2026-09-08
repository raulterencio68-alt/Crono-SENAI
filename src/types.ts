export type OperationType = 'manual' | 'machine' | 'combined';

export type FatigueClassification = 'leve' | 'moderado' | 'pesado';

export interface WestinghouseRating {
  skill: number; // Habilidade (-0.22 a +0.15)
  effort: number; // Esforço (-0.17 a +0.13)
  conditions: number; // Condições (-0.07 a +0.06)
  consistency: number; // Consistência (-0.04 a +0.04)
}

export interface TimingHistoryRecord {
  id: string;
  timestamp: string;
  sexagesimalSeconds: number; // segundos totais
  sexagesimalFormatted: string; // MM:SS ou MM:SS.cc
  centesimalMinutes: number; // Minutos centesimais (DM / Cmin)
  performanceRating: number; // Ritmo % (ex: 100)
  fatigueAllowance: number; // Tolerância % (ex: 12)
  standardTimeMinutes: number; // Tempo Padrão
  piecesPerHour: number;
  recordedBy?: string;
  note?: string;
}

export interface Operation {
  id: string;
  modelId: string;
  name: string;
  description: string;
  type: OperationType;
  workstationName?: string;
  
  // Timing data (sexagesimal e centesimal)
  observedTimeSeconds: number; // Segundos totais cronometrados
  observedTimeFormatted: string; // MM:SS
  centesimalMinutes: number; // Minutos centesimais (DM / Cmin)
  centesimalHundredths: number; // Centésimos de minuto inteiros/decimais

  // Factors
  performanceRating: number; // Ritmo (50% a 150%)
  fatigueAllowance: number; // Tolerância de fadiga Westinghouse (0% a 40%)
  fatigueClassification: FatigueClassification;
  westinghousePreset?: string;

  // Calculated metrics
  normalTimeSeconds: number;
  normalTimeMinutes: number;
  standardTimeSeconds: number;
  standardTimeMinutes: number; // Base para PPH
  piecesPerHour: number;
  piecesPerDay: number; // Considerando 8,8 horas
  requiredWorkstations: number; // Demanda diária / PPD

  // Metadata
  lastTimedAt: string;
  isBottleneck: boolean;
  history: TimingHistoryRecord[];
}

export interface ProductModel {
  id: string;
  code: string;
  name: string;
  description: string;
  dailyDemand: number; // Demanda planejada (ex: 500 peças/dia)
  workdayHours: number; // Padrão 8.8 horas
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface OptimizationSuggestion {
  id: string;
  operationId?: string;
  operationName?: string;
  type: 'gargalo' | 'fadiga_alta' | 'ritmo_discrepante' | 'tempo_excessivo' | 'oportunidade_automacao' | 'balanceamento';
  severity: 'alta' | 'media' | 'baixa';
  title: string;
  description: string;
  actionableStep: string;
  estimatedImpact: string;
}

export interface LineBalanceMetrics {
  totalStandardTimeMinutes: number;
  totalStandardTimeSeconds: number;
  taktTimeSeconds: number;
  piecesPerHourLine: number;
  piecesPerDayLine: number;
  bottleneckOperation: Operation | null;
  totalWorkstationsTheoretical: number;
  totalWorkstationsRounded: number;
  lineBalanceEfficiency: number; // % de balanceamento (0 a 100)
  balanceDelay: number; // Perda por balanceamento %
}
