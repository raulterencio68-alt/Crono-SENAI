import React, { useState } from 'react';
import { BarChart3, AlertTriangle, TrendingDown, Users, Info } from 'lucide-react';
import { Operation, ProductModel, LineBalanceMetrics } from '../types';
import { formatSecondsToSexagesimal } from '../utils/industrialMath';

interface LineBalancingChartProps {
  operations: Operation[];
  activeModel: ProductModel | null;
  metrics: LineBalanceMetrics;
}

export const LineBalancingChart: React.FC<LineBalancingChartProps> = ({
  operations,
  activeModel,
  metrics,
}) => {
  const [chartMode, setChartMode] = useState<'time' | 'workstations' | 'production'>('time');

  if (!operations || operations.length === 0) return null;

  // Max values for scale
  const maxStandardTime = Math.max(...operations.map((op) => op.standardTimeSeconds), metrics.taktTimeSeconds, 1);
  const maxWorkstations = Math.max(...operations.map((op) => op.requiredWorkstations), 2.5);
  const maxProduction = Math.max(...operations.map((op) => op.piecesPerDay), activeModel?.dailyDemand || 500, 1);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Gráfico de Balanceamento e Comparativo da Linha
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Comparativo visual de tempos de ciclo, postos necessários e Takt Time ({metrics.taktTimeSeconds.toFixed(1)}s / peça)
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setChartMode('time')}
            className={`px-3 py-1 rounded-md transition-colors ${chartMode === 'time' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tempo de Ciclo vs Takt
          </button>
          <button
            onClick={() => setChartMode('workstations')}
            className={`px-3 py-1 rounded-md transition-colors ${chartMode === 'workstations' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Postos de Trabalho
          </button>
          <button
            onClick={() => setChartMode('production')}
            className={`px-3 py-1 rounded-md transition-colors ${chartMode === 'production' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Produção / Dia
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="space-y-4 pt-2">
        {operations.map((op, index) => {
          let barPercent = 0;
          let isCritical = false;
          let labelText = '';

          if (chartMode === 'time') {
            barPercent = Math.min(100, (op.standardTimeSeconds / maxStandardTime) * 100);
            isCritical = metrics.taktTimeSeconds > 0 && op.standardTimeSeconds > metrics.taktTimeSeconds;
            labelText = `${op.standardTimeSeconds.toFixed(1)}s (${op.standardTimeMinutes.toFixed(3)} Cmin)`;
          } else if (chartMode === 'workstations') {
            barPercent = Math.min(100, (op.requiredWorkstations / maxWorkstations) * 100);
            isCritical = op.requiredWorkstations > 2.0;
            labelText = `${op.requiredWorkstations.toFixed(2)} postos (${Math.ceil(op.requiredWorkstations)} oper.)`;
          } else {
            barPercent = Math.min(100, (op.piecesPerDay / maxProduction) * 100);
            isCritical = activeModel ? op.piecesPerDay < activeModel.dailyDemand : false;
            labelText = `${op.piecesPerDay.toFixed(0)} peças/dia (${op.piecesPerHour.toFixed(1)}/h)`;
          }

          return (
            <div key={op.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 max-w-[65%] truncate">
                  <span className="font-mono text-slate-400 text-[11px] w-5 shrink-0">
                    {index + 1}.
                  </span>
                  <span className="font-semibold text-slate-800 truncate">
                    {op.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal hidden md:inline truncate">
                    {op.workstationName ? `[${op.workstationName}]` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isCritical && (
                    <span className="text-rose-600 text-[10px] font-bold uppercase flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      Gargalo
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {labelText}
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden flex items-center">
                {/* Takt Time Reference Line for 'time' mode */}
                {chartMode === 'time' && metrics.taktTimeSeconds > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 dashed"
                    style={{ left: `${(metrics.taktTimeSeconds / maxStandardTime) * 100}%` }}
                    title={`Takt Time: ${metrics.taktTimeSeconds.toFixed(1)}s`}
                  >
                    <span className="absolute -top-3.5 -translate-x-1/2 text-[9px] font-mono text-rose-600 font-bold bg-white px-1 rounded shadow-2xs">
                      Takt
                    </span>
                  </div>
                )}

                {/* 2 Postos Reference Line for 'workstations' mode */}
                {chartMode === 'workstations' && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                    style={{ left: `${(2.0 / maxWorkstations) * 100}%` }}
                    title="Limite de 2 postos recomendados"
                  >
                    <span className="absolute -top-3.5 -translate-x-1/2 text-[9px] font-mono text-amber-600 font-bold bg-white px-1 rounded shadow-2xs">
                      2 Postos
                    </span>
                  </div>
                )}

                {/* Bar Fill */}
                <div
                  className={`h-full rounded-md transition-all duration-500 ${
                    isCritical
                      ? 'bg-rose-500/90 hover:bg-rose-500'
                      : op.type === 'machine'
                      ? 'bg-sky-500/80 hover:bg-sky-500'
                      : 'bg-emerald-500/80 hover:bg-emerald-500'
                  }`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Summary */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span>Operação Manual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500"></span>
            <span>Operação em Máquina</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span>Gargalo / Excede Takt Time</span>
          </div>
        </div>

        <div className="font-mono">
          Eficiência Lean: <strong className="text-slate-800">{metrics.lineBalanceEfficiency}%</strong> | Perda: <strong className="text-rose-600">{metrics.balanceDelay}%</strong>
        </div>
      </div>
    </div>
  );
};
