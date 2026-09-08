import { FatigueClassification, LineBalanceMetrics, Operation, OptimizationSuggestion, ProductModel } from '../types';

/**
 * Converte string sexagesimal (MM:SS ou MM:SS.cc) para segundos totais
 */
export function parseSexagesimalToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const cleanStr = timeStr.trim();
  
  // Se for apenas número
  if (!cleanStr.includes(':')) {
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }

  const parts = cleanStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return Math.max(0, minutes * 60 + seconds);
  }

  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return Math.max(0, hours * 3600 + minutes * 60 + seconds);
  }

  return 0;
}

/**
 * Formata segundos sexagesimais para MM:SS (com décimos/centésimos se houver fração)
 */
export function formatSecondsToSexagesimal(totalSeconds: number, includeDecimals = false): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  const padMin = String(minutes).padStart(2, '0');
  
  if (includeDecimals && remainingSeconds % 1 !== 0) {
    const secStr = remainingSeconds.toFixed(2).padStart(5, '0');
    return `${padMin}:${secStr}`;
  }
  
  const secInt = Math.floor(remainingSeconds);
  const padSec = String(secInt).padStart(2, '0');
  return `${padMin}:${padSec}`;
}

/**
 * Converte segundos sexagesimais para minutos centesimais (DM / Cmin)
 * 1 minuto sexagesimal (60s) = 1,00 minuto centesimal (100 centésimos)
 * Ex: 90s = 1,500 min centesimais
 */
export function secondsToCentesimalMinutes(seconds: number): number {
  if (isNaN(seconds) || seconds <= 0) return 0;
  return Number((seconds / 60).toFixed(4));
}

/**
 * Converte minutos centesimais de volta para segundos sexagesimais
 */
export function centesimalMinutesToSeconds(cmin: number): number {
  if (isNaN(cmin) || cmin <= 0) return 0;
  return Number((cmin * 60).toFixed(2));
}

/**
 * Classifica a tolerância de fadiga (Tabela Westinghouse)
 */
export function classifyFatigue(allowancePercent: number): FatigueClassification {
  if (allowancePercent <= 12) return 'leve';
  if (allowancePercent <= 18) return 'moderado';
  return 'pesado';
}

/**
 * Realiza todos os cálculos de cronoanálise para uma operação
 */
export function calculateOperationMetrics(
  observedSeconds: number,
  performanceRating: number, // Ritmo (ex: 100%)
  fatigueAllowance: number,  // Tolerância (ex: 14%)
  dailyDemand = 500,
  workdayHours = 8.8
) {
  // Tempo Cronometrado
  const observedTimeSeconds = Math.max(0, observedSeconds);
  const observedTimeFormatted = formatSecondsToSexagesimal(observedTimeSeconds, true);
  const centesimalMinutes = secondsToCentesimalMinutes(observedTimeSeconds);
  const centesimalHundredths = Number((centesimalMinutes * 100).toFixed(2));

  // Ritmo
  const ratingFactor = (performanceRating || 100) / 100;
  const normalTimeSeconds = observedTimeSeconds * ratingFactor;
  const normalTimeMinutes = normalTimeSeconds / 60;

  // Tolerância
  const allowanceFactor = 1 + (fatigueAllowance || 0) / 100;
  const standardTimeSeconds = normalTimeSeconds * allowanceFactor;
  const standardTimeMinutes = standardTimeSeconds / 60;

  // Produção por Hora (PPH)
  const piecesPerHour = standardTimeSeconds > 0 ? Number((3600 / standardTimeSeconds).toFixed(2)) : 0;

  // Produção por Dia (PPD) considerando jornada 8,8h (528 minutos úteis)
  const piecesPerDay = Number((piecesPerHour * workdayHours).toFixed(1));

  // Quantidade de Postos de Trabalho Necessários
  // Fórmula: Demanda Total / Produção por Dia
  const requiredWorkstations = piecesPerDay > 0 ? Number((dailyDemand / piecesPerDay).toFixed(2)) : 0;

  // Classificação de fadiga
  const fatigueClassification = classifyFatigue(fatigueAllowance);

  // Gargalo se postos necessários > 2.0 ou tempo considerável
  const isBottleneck = requiredWorkstations > 2.0;

  return {
    observedTimeSeconds,
    observedTimeFormatted,
    centesimalMinutes,
    centesimalHundredths,
    performanceRating,
    fatigueAllowance,
    fatigueClassification,
    normalTimeSeconds: Number(normalTimeSeconds.toFixed(2)),
    normalTimeMinutes: Number(normalTimeMinutes.toFixed(4)),
    standardTimeSeconds: Number(standardTimeSeconds.toFixed(2)),
    standardTimeMinutes: Number(standardTimeMinutes.toFixed(4)),
    piecesPerHour,
    piecesPerDay,
    requiredWorkstations,
    isBottleneck,
  };
}

/**
 * Modelos de tolerância Westinghouse pré-configurados
 */
export const WESTINGHOUSE_PRESETS = [
  {
    name: 'Montagem Eletrônica Leve',
    allowance: 10,
    classification: 'leve' as FatigueClassification,
    description: 'Trabalho sentado, peças leves (<1kg), temperatura e iluminação adequadas, ritmo manual padronizado.',
  },
  {
    name: 'Costura Industrial / Bancada',
    allowance: 12,
    classification: 'leve' as FatigueClassification,
    description: 'Sentado com pedal/máquina, atenção visual contínua, postura ereta, ambiente climatizado.',
  },
  {
    name: 'Usinagem em Torno / Centro CNC',
    allowance: 14,
    classification: 'moderado' as FatigueClassification,
    description: 'Trabalho em pé, fixação de peças, troca de ferramentas, controle de cavacos e fluido de corte.',
  },
  {
    name: 'Estamparia / Prensagem',
    allowance: 16,
    classification: 'moderado' as FatigueClassification,
    description: 'Movimentos repetitivos com acionamento bimanual, postura em pé, peças de até 5kg, ruído industrial.',
  },
  {
    name: 'Embalagem e Paletização Manual',
    allowance: 20,
    classification: 'pesado' as FatigueClassification,
    description: 'Em pé com deslocamento, elevação de caixas de 8kg a 15kg, torção de tronco, esforço físico contínuo.',
  },
  {
    name: 'Fundição / Solda Pesada',
    allowance: 25,
    classification: 'pesado' as FatigueClassification,
    description: 'Calor radiante, uso de EPIs pesados, postura estática forçada, manuseio de peças pesadas (>15kg).',
  },
];

/**
 * Calcula métricas globais de balanceamento da linha
 */
export function calculateLineBalance(
  operations: Operation[],
  dailyDemand: number,
  workdayHours = 8.8
): LineBalanceMetrics {
  if (!operations || operations.length === 0) {
    return {
      totalStandardTimeMinutes: 0,
      totalStandardTimeSeconds: 0,
      taktTimeSeconds: 0,
      piecesPerHourLine: 0,
      piecesPerDayLine: 0,
      bottleneckOperation: null,
      totalWorkstationsTheoretical: 0,
      totalWorkstationsRounded: 0,
      lineBalanceEfficiency: 100,
      balanceDelay: 0,
    };
  }

  // Takt Time = Tempo disponível / Demanda diária
  const availableWorkSeconds = workdayHours * 3600;
  const taktTimeSeconds = dailyDemand > 0 ? Number((availableWorkSeconds / dailyDemand).toFixed(2)) : 0;

  // Soma de Tempos Padrão
  const totalStandardTimeSeconds = operations.reduce((acc, op) => acc + (op.standardTimeSeconds || 0), 0);
  const totalStandardTimeMinutes = Number((totalStandardTimeSeconds / 60).toFixed(4));

  // Operação Gargalo (aquela com maior Tempo Padrão por peça)
  const bottleneckOperation = operations.reduce((prev, current) => {
    return (current.standardTimeSeconds > (prev?.standardTimeSeconds || 0)) ? current : prev;
  }, operations[0] || null);

  const maxStandardTimeSeconds = bottleneckOperation?.standardTimeSeconds || 1;

  // Capacidade da Linha (determinada pelo posto gargalo)
  const piecesPerHourLine = maxStandardTimeSeconds > 0 ? Number((3600 / maxStandardTimeSeconds).toFixed(1)) : 0;
  const piecesPerDayLine = Number((piecesPerHourLine * workdayHours).toFixed(0));

  // Postos teóricos totais
  const totalWorkstationsTheoretical = operations.reduce((acc, op) => acc + (op.requiredWorkstations || 0), 0);
  const totalWorkstationsRounded = Math.ceil(totalWorkstationsTheoretical);

  // Eficiência de Balanceamento (%) = (Soma dos TP) / (Num Postos * Maior TP) * 100
  const nWorkstations = Math.max(1, totalWorkstationsRounded);
  const lineBalanceEfficiency = nWorkstations > 0 && maxStandardTimeSeconds > 0
    ? Number(((totalStandardTimeSeconds / (nWorkstations * maxStandardTimeSeconds)) * 100).toFixed(1))
    : 100;

  const balanceDelay = Number((100 - lineBalanceEfficiency).toFixed(1));

  return {
    totalStandardTimeMinutes,
    totalStandardTimeSeconds: Number(totalStandardTimeSeconds.toFixed(2)),
    taktTimeSeconds,
    piecesPerHourLine,
    piecesPerDayLine,
    bottleneckOperation,
    totalWorkstationsTheoretical: Number(totalWorkstationsTheoretical.toFixed(2)),
    totalWorkstationsRounded,
    lineBalanceEfficiency: Math.min(100, Math.max(0, lineBalanceEfficiency)),
    balanceDelay: Math.max(0, balanceDelay),
  };
}

/**
 * Gera sugestões automáticas de otimização industrial baseadas em regras de engenharia
 */
export function generateIndustrialSuggestions(
  operations: Operation[],
  model: ProductModel
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  if (!operations || operations.length === 0) return suggestions;

  const balance = calculateLineBalance(operations, model.dailyDemand, model.workdayHours);
  const avgStandardTime = balance.totalStandardTimeSeconds / operations.length;

  operations.forEach((op) => {
    // 1. Gargalo Crítico: Postos necessários > 2
    if (op.requiredWorkstations > 2.0) {
      suggestions.push({
        id: `gargalo-${op.id}`,
        operationId: op.id,
        operationName: op.name,
        type: 'gargalo',
        severity: 'alta',
        title: `Gargalo Crítico: ${op.name} requer ${op.requiredWorkstations} postos`,
        description: `Esta operação está acima do limite de 2 postos de trabalho para a demanda de ${model.dailyDemand} peças/dia. É o principal limitador do fluxo produtivo.`,
        actionableStep: op.type === 'manual'
          ? 'Desmembrar a tarefa em duas etapas sequenciais ou automatizar o posicionamento com gabarito.'
          : 'Avaliar tempo de ciclo da máquina, reduzir tempo de setup/troca ou alocar uma segunda máquina em paralelo.',
        estimatedImpact: 'Redução potencial de 30% a 50% no lead time da linha.',
      });
    }

    // 2. Operação Muito Longa comparada com a média (> 1.6x da média)
    if (operations.length > 2 && op.standardTimeSeconds > avgStandardTime * 1.6) {
      suggestions.push({
        id: `tempo-${op.id}`,
        operationId: op.id,
        operationName: op.name,
        type: 'tempo_excessivo',
        severity: 'media',
        title: `Tempo de Ciclo Desproporcional em ${op.name}`,
        description: `O tempo padrão (${formatSecondsToSexagesimal(op.standardTimeSeconds)} / ${op.standardTimeSeconds.toFixed(1)}s) é 60% maior que o tempo médio das demais operações (${avgStandardTime.toFixed(1)}s), gerando acúmulo de WIP (estoque em processo).`,
        actionableStep: 'Aplicar Estudo de Movimentos (Princípios de Economia de Movimentos de Barnes): eliminar esperas, aproximar caixas de componentes e usar ferramentas pneumáticas suspensas.',
        estimatedImpact: 'Aumento de 15% na taxa de fluxo contínuo.',
      });
    }

    // 3. Fadiga Elevada Westinghouse (> 18%)
    if (op.fatigueAllowance > 18) {
      suggestions.push({
        id: `fadiga-${op.id}`,
        operationId: op.id,
        operationName: op.name,
        type: 'fadiga_alta',
        severity: 'alta',
        title: `Alerta Ergonômico (NR-17): Fadiga Elevada (${op.fatigueAllowance}%)`,
        description: `A tolerância Westinghouse de ${op.fatigueAllowance}% indica alta sobrecarga biomecânica, térmica ou postural, acarretando riscos de LER/DORT e queda de ritmo no fim do turno.`,
        actionableStep: 'Instalar bancada com regulagem de altura, tapetes antifadiga ou braços pantográficos balanceadores de carga.',
        estimatedImpact: 'Redução de 6% a 8% na tolerância necessária e aumento da consistência do operador.',
      });
    }

    // 4. Ritmo Discrepante (< 85% ou > 120%)
    if (op.performanceRating < 85) {
      suggestions.push({
        id: `ritmo-baixo-${op.id}`,
        operationId: op.id,
        operationName: op.name,
        type: 'ritmo_discrepante',
        severity: 'baixa',
        title: `Ritmo Avaliado Abaixo do Normal (${op.performanceRating}%)`,
        description: `O operador demonstrou hesitação ou falta de domínio no método padronizado durante a cronometragem.`,
        actionableStep: 'Criar Instrução de Trabalho Visual (ITV / POP) e realizar reciclagem de treinamento no posto.',
        estimatedImpact: 'Aproximação do ritmo aos 100% ideais.',
      });
    } else if (op.performanceRating > 125) {
      suggestions.push({
        id: `ritmo-alto-${op.id}`,
        operationId: op.id,
        operationName: op.name,
        type: 'ritmo_discrepante',
        severity: 'baixa',
        title: `Ritmo Super-Acelerado (${op.performanceRating}%)`,
        description: `Ritmo muito acima do normal. Pode não ser sustentável ao longo de 8,8 horas de jornada de trabalho.`,
        actionableStep: 'Realizar novas tomadas de tempo em horários distintos do turno para validar a consistência.',
        estimatedImpact: 'Maior precisão estatística da folha de tempos padrão.',
      });
    }

    // 5. Oportunidade de Automação para operações manuais repetitivas
    if (op.type === 'manual' && op.standardTimeSeconds > 60 && op.requiredWorkstations >= 1.5) {
      suggestions.push({
        id: `automacao-${op.id}`,
        operationId: op.id,
        operationName: op.name,
        type: 'oportunidade_automacao',
        severity: 'media',
        title: `Potencial de Semi-Automação em ${op.name}`,
        description: `Operação manual longa consumindo 1,5+ operadores fixos.`,
        actionableStep: 'Avaliar dispositivo semiautomático (ex: alimentador por gravidade, parafusadeira automática indexada).',
        estimatedImpact: 'Economia estimada de 1 operador e retorno do investimento em menos de 6 meses.',
      });
    }
  });

  // Sugestão de Balanceamento da Linha Global
  if (balance.lineBalanceEfficiency < 80 && operations.length > 1) {
    suggestions.push({
      id: 'balanceamento-geral',
      type: 'balanceamento',
      severity: 'alta',
      title: `Baixa Eficiência de Balanceamento (${balance.lineBalanceEfficiency}%)`,
      description: `A perda por balanceamento é de ${balance.balanceDelay}%, o que significa que operadores passam tempo ocioso esperando o posto gargalo (${balance.bottleneckOperation?.name}).`,
      actionableStep: `Transferir tarefas menores do posto gargalo (${balance.bottleneckOperation?.name}) para os postos com menor tempo de ciclo vizinhos.`,
      estimatedImpact: `Elevação da eficiência para > 90% e ganho imediato de peças/dia sem contratar novos operadores.`,
    });
  }

  return suggestions;
}
