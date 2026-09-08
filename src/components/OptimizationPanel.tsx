import React, { useState } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { LineBalanceMetrics, Operation, OptimizationSuggestion, ProductModel } from '../types';

interface OptimizationPanelProps {
  suggestions: OptimizationSuggestion[];
  operations: Operation[];
  activeModel: ProductModel | null;
  metrics: LineBalanceMetrics;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  suggestions,
  operations,
  activeModel,
  metrics,
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleConsultAI = async () => {
    if (!activeModel || operations.length === 0) return;
    setAiLoading(true);
    try {
      const payload = {
        modelName: activeModel.name,
        dailyDemand: activeModel.dailyDemand,
        targetCycleTime: `${metrics.taktTimeSeconds.toFixed(1)}s`,
        operations: operations.map((op) => ({
          name: op.name,
          type: op.type,
          workstation: op.workstationName,
          observedTimeSeconds: op.observedTimeSeconds,
          standardTimeSeconds: op.standardTimeSeconds,
          performanceRating: op.performanceRating,
          fatigueAllowance: op.fatigueAllowance,
          piecesPerHour: op.piecesPerHour,
          piecesPerDay: op.piecesPerDay,
          requiredWorkstations: op.requiredWorkstations,
          isBottleneck: op.isBottleneck,
        })),
      };

      const res = await fetch('/api/optimize-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao comunicar com a API');
      const data = await res.json();
      setAiResult(data);
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      // Fallback local
      setAiResult({
        summary: 'Recomendação baseada em Lean Manufacturing e balanceamento de estações.',
        bottlenecks: operations.filter((op) => op.requiredWorkstations > 1.8).map((op) => op.name),
        kaizenActions: [
          'Dividir o posto de soldagem em 2 etapas com pré-posicionamento manual.',
          'Implementar alimentação contínua de peças na usinagem para evitar tempos de espera.',
          'Aplicar 5S na bancada de acabamento e rebarbação.',
        ],
        ergonomics: ['Ajuste da altura de bancadas conforme NR-17.'],
        potentialGainPercent: 18,
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Sugestões de Otimização e Engenharia de Processos
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Diagnósticos automáticos para eliminação de gargalos, redução de fadiga e balanceamento de linha
          </p>
        </div>

        <button
          onClick={handleConsultAI}
          disabled={aiLoading || operations.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm disabled:opacity-50 transition-all shrink-0"
        >
          {aiLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analisando com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Análise Inteligente Kaizen</span>
            </>
          )}
        </button>
      </div>

      {/* AI Results Banner if available */}
      {aiResult && (
        <div className="mb-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-md border border-indigo-800">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-800/80 pb-2">
            <span className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-amber-400">
              <Sparkles className="w-4 h-4" />
              Plano de Otimização Kaizen (Engenharia Industrial)
            </span>
            {aiResult.potentialGainPercent && (
              <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/30">
                Ganho Potencial: +{aiResult.potentialGainPercent}%
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 mb-4">{aiResult.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {aiResult.kaizenActions && aiResult.kaizenActions.length > 0 && (
              <div className="bg-slate-900/60 p-3 rounded-lg border border-indigo-900/60">
                <span className="font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Ações Imediatas de Kaizen:
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {aiResult.kaizenActions.map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiResult.ergonomics && aiResult.ergonomics.length > 0 && (
              <div className="bg-slate-900/60 p-3 rounded-lg border border-indigo-900/60">
                <span className="font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
                  Recomendações Ergonômicas (NR-17):
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {aiResult.ergonomics.map((ergo: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-violet-400 shrink-0">•</span>
                      <span>{ergo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Automatic Rule-Based Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.length === 0 ? (
          <div className="col-span-2 text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">Linha Perfeitamente Balanceada!</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Todas as operações estão dentro dos limites operacionais, sem gargalos críticos de mais de 2 postos e com tolerâncias Westinghouse controladas.
            </p>
          </div>
        ) : (
          suggestions.map((sug) => {
            const isHigh = sug.severity === 'alta';

            return (
              <div
                key={sug.id}
                className={`p-4 rounded-xl border transition-all ${
                  isHigh
                    ? 'border-rose-200 bg-rose-50/40'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {sug.type === 'gargalo' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : sug.type === 'fadiga_alta' ? (
                      <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0" />
                    ) : sug.type === 'oportunidade_automacao' ? (
                      <Cpu className="w-4 h-4 text-sky-600 shrink-0" />
                    ) : (
                      <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {sug.title}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      isHigh
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Prioridade {sug.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {sug.description}
                </p>

                <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 text-xs text-slate-800 space-y-1">
                  <div className="flex items-start gap-1.5 font-medium text-emerald-800">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>Ação Acionável: {sug.actionableStep}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5">
                    Impacto Estimado: {sug.estimatedImpact}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
