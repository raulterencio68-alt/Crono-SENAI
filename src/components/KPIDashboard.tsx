import React from 'react';
import { 
  Timer, 
  TrendingUp, 
  Users, 
  Scale, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { LineBalanceMetrics, Operation, ProductModel } from '../types';
import { formatSecondsToSexagesimal } from '../utils/industrialMath';

interface KPIDashboardProps {
  metrics: LineBalanceMetrics;
  activeModel: ProductModel | null;
  operationsCount: number;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({
  metrics,
  activeModel,
  operationsCount,
}) => {
  if (!activeModel) return null;

  const isEfficiencyGood = metrics.lineBalanceEfficiency >= 85;
  const isEfficiencyMedium = metrics.lineBalanceEfficiency >= 70 && metrics.lineBalanceEfficiency < 85;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Tempo de Ciclo Total da Peça */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Tempo Total</span>
          <Timer className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-slate-900">
            {formatSecondsToSexagesimal(metrics.totalStandardTimeSeconds)}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ({metrics.totalStandardTimeMinutes.toFixed(2)} cmin)
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{operationsCount} operações</span>
          <span className="text-slate-400 font-mono">Σ TP</span>
        </div>
      </div>

      {/* 2. Takt Time Desejado */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Takt Time</span>
          <Clock className="w-4 h-4 text-sky-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-sky-700">
            {metrics.taktTimeSeconds.toFixed(1)}s
          </span>
          <span className="text-xs text-slate-500 font-mono">
            / peça
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>Meta: {activeModel.dailyDemand} pçs</span>
          <span className="text-slate-400">8,8h turno</span>
        </div>
      </div>

      {/* 3. Capacidade da Linha (Gargalo) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Produção Linha</span>
          <TrendingUp className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-indigo-700">
            {metrics.piecesPerDayLine}
          </span>
          <span className="text-xs text-slate-500">pçs/dia</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>{metrics.piecesPerHourLine} peças/h</span>
          <span className="text-slate-400 font-mono">Ritmo máx</span>
        </div>
      </div>

      {/* 4. Postos de Trabalho Totais */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Postos Totais</span>
          <Users className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono text-violet-800">
            {metrics.totalWorkstationsRounded}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ({metrics.totalWorkstationsTheoretical} teór.)
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span>Operadores req.</span>
          <span className="text-slate-400">Demanda / PPD</span>
        </div>
      </div>

      {/* 5. Eficiência de Balanceamento */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">Balanceamento</span>
          <Scale className={`w-4 h-4 ${isEfficiencyGood ? 'text-emerald-600' : isEfficiencyMedium ? 'text-amber-600' : 'text-rose-600'}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-xl font-bold font-mono ${
            isEfficiencyGood ? 'text-emerald-700' : isEfficiencyMedium ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {metrics.lineBalanceEfficiency}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            perda: {metrics.balanceDelay}%
          </span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
          <span className={isEfficiencyGood ? 'text-emerald-600 font-medium' : isEfficiencyMedium ? 'text-amber-600 font-medium' : 'text-rose-600 font-medium'}>
            {isEfficiencyGood ? 'Equilibrada' : isEfficiencyMedium ? 'Ajustes rec.' : 'Desbalanceada'}
          </span>
          <span className="text-slate-400">Lean Flow</span>
        </div>
      </div>

      {/* 6. Operação Gargalo */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Gargalo
          </span>
          <Zap className="w-4 h-4 text-rose-500" />
        </div>
        <div className="truncate font-semibold text-slate-900 text-sm" title={metrics.bottleneckOperation?.name || 'Nenhum'}>
          {metrics.bottleneckOperation ? metrics.bottleneckOperation.name.replace(/^\d+\s*-\s*/, '') : 'Nenhum'}
        </div>
        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-mono">
          <span>{metrics.bottleneckOperation?.standardTimeSeconds.toFixed(1)}s ({metrics.bottleneckOperation?.requiredWorkstations} postos)</span>
        </div>
      </div>
    </div>
  );
};
