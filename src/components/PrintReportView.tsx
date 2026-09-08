import React from 'react';
import { 
  Printer, 
  X, 
  Factory, 
  FileText, 
  Clock, 
  Download, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { LineBalanceMetrics, Operation, ProductModel } from '../types';
import { formatSecondsToSexagesimal } from '../utils/industrialMath';

interface PrintReportViewProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ProductModel | null;
  operations: Operation[];
  metrics: LineBalanceMetrics;
  simplifiedOperation?: Operation | null; // Se informado, imprime apenas esta operação
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  isOpen,
  onClose,
  activeModel,
  operations,
  metrics,
  simplifiedOperation,
}) => {
  if (!isOpen || !activeModel) return null;

  const isSimplified = !!simplifiedOperation;
  const targetOperations = isSimplified ? [simplifiedOperation] : operations;
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Container - Screen preview and Print container */}
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        {/* Screen Toolbar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              {isSimplified
                ? `Relatório Simplificado: ${simplifiedOperation.name}`
                : `Folha Técnica de Cronoanálise: ${activeModel.name}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet (A4 layout styling) */}
        <div className="p-8 sm:p-10 space-y-6 bg-white print:p-6 print:space-y-4 text-slate-900 font-sans">
          {/* Industrial Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900">
                  <Factory className="w-6 h-6 text-emerald-700" />
                  <span className="text-xl font-black tracking-tight uppercase">
                    Engenharia de Processos & Cronoanálise
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Departamento de Engenharia Industrial & Manufatura Lean
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="block font-bold text-slate-900">
                  {isSimplified ? 'RELATÓRIO SIMPLIFICADO DE OPERAÇÃO' : 'FOLHA DE TEMPOS PADRÃO E BALANCEAMENTO'}
                </span>
                <span className="text-slate-500 font-mono">Emissão: {currentDate}</span>
                <span className="text-slate-500 font-mono block">Revisão: v{activeModel.version}.0</span>
              </div>
            </div>

            {/* Model Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-lg mt-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Produto / Modelo:</span>
                <span className="font-bold text-slate-900">{activeModel.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Código / Part Number:</span>
                <span className="font-bold text-slate-900 font-mono">{activeModel.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Demanda Planejada:</span>
                <span className="font-bold text-slate-900">{activeModel.dailyDemand} peças / dia</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Jornada de Trabalho:</span>
                <span className="font-bold text-slate-900">{activeModel.workdayHours}h (528 min úteis)</span>
              </div>
            </div>
          </div>

          {/* Operational Metrics Summary Box (for full report) */}
          {!isSimplified && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs border border-slate-300 rounded-lg p-3 bg-slate-50">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Tempo Total Ciclo</span>
                <span className="text-sm font-bold font-mono">
                  {formatSecondsToSexagesimal(metrics.totalStandardTimeSeconds)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({metrics.totalStandardTimeMinutes.toFixed(2)} Cmin)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Takt Time Requerido</span>
                <span className="text-sm font-bold font-mono text-sky-700">
                  {metrics.taktTimeSeconds.toFixed(1)}s / pç
                </span>
                <span className="text-[10px] text-slate-500 block">Ritmo de saída</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Capacidade da Linha</span>
                <span className="text-sm font-bold font-mono text-indigo-700">
                  {metrics.piecesPerDayLine} pçs/dia
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {metrics.piecesPerHourLine} pçs/hora
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Postos Necessários</span>
                <span className="text-sm font-bold font-mono text-violet-800">
                  {metrics.totalWorkstationsRounded} postos
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ({metrics.totalWorkstationsTheoretical} teór.)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Eficiência Balanceamento</span>
                <span className="text-sm font-bold font-mono text-emerald-700">
                  {metrics.lineBalanceEfficiency}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Perda: {metrics.balanceDelay}%
                </span>
              </div>
            </div>
          )}

          {/* Operations Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              {isSimplified ? 'Especificação Técnica da Operação' : 'Cronometragem Detalhada por Posto de Trabalho'}
            </div>

            <table className="w-full text-left text-xs border border-slate-300 divide-y divide-slate-200">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="py-2 px-2.5 border-r border-slate-200">Operação</th>
                  <th className="py-2 px-2 border-r border-slate-200">Tipo</th>
                  <th className="py-2 px-2 text-right border-r border-slate-200">Tempo Sexagesimal</th>
                  <th className="py-2 px-2 text-right border-r border-slate-200">Tempo Centesimal</th>
                  <th className="py-2 px-2 text-center border-r border-slate-200">Ritmo (FR)</th>
                  <th className="py-2 px-2 text-center border-r border-slate-200">Fadiga (FT)</th>
                  <th className="py-2 px-2 text-right border-r border-slate-200">Tempo Padrão (TP)</th>
                  <th className="py-2 px-2 text-right border-r border-slate-200">Peças / Hora</th>
                  <th className="py-2 px-2 text-right border-r border-slate-200">Peças / Dia (8,8h)</th>
                  <th className="py-2 px-2 text-center">Postos Req.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {targetOperations.map((op) => (
                  <tr key={op.id} className={op.isBottleneck ? 'bg-rose-50/50' : ''}>
                    <td className="py-2 px-2.5 border-r border-slate-200">
                      <span className="font-bold text-slate-900 block">{op.name}</span>
                      {op.workstationName && (
                        <span className="text-[10px] text-slate-500 block">
                          Posto: {op.workstationName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 border-r border-slate-200 capitalize font-medium">
                      {op.type}
                    </td>
                    <td className="py-2 px-2 text-right font-mono border-r border-slate-200">
                      {op.observedTimeFormatted}
                      <span className="text-[10px] text-slate-500 block">({op.observedTimeSeconds.toFixed(1)}s)</span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-800 border-r border-slate-200">
                      {op.centesimalMinutes.toFixed(4)} Cmin
                    </td>
                    <td className="py-2 px-2 text-center font-mono border-r border-slate-200">
                      {op.performanceRating}%
                    </td>
                    <td className="py-2 px-2 text-center font-mono border-r border-slate-200">
                      {op.fatigueAllowance}% ({op.fatigueClassification})
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold border-r border-slate-200">
                      {op.standardTimeSeconds.toFixed(1)}s
                      <span className="text-[10px] text-slate-500 block font-normal">
                        {op.standardTimeMinutes.toFixed(3)} Cmin
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono border-r border-slate-200 font-medium">
                      {op.piecesPerHour.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono border-r border-slate-200 font-medium">
                      {op.piecesPerDay.toFixed(0)}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold">
                      <span className={op.isBottleneck ? 'text-rose-700' : 'text-slate-900'}>
                        {op.requiredWorkstations.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simplified Report Extra Details */}
          {isSimplified && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 text-xs">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Metodologia e Fórmulas Aplicadas:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  • <strong>Tempo Normal (TN):</strong> TC × (Ritmo / 100) = {simplifiedOperation.observedTimeSeconds.toFixed(1)}s × {(simplifiedOperation.performanceRating / 100).toFixed(2)} = <strong>{simplifiedOperation.normalTimeSeconds.toFixed(1)}s</strong>.
                </div>
                <div>
                  • <strong>Tempo Padrão (TP):</strong> TN × (1 + FT / 100) = {simplifiedOperation.normalTimeSeconds.toFixed(1)}s × {(1 + simplifiedOperation.fatigueAllowance / 100).toFixed(2)} = <strong>{simplifiedOperation.standardTimeSeconds.toFixed(1)}s</strong>.
                </div>
                <div>
                  • <strong>Produção / Hora (PPH):</strong> 3.600s / {simplifiedOperation.standardTimeSeconds.toFixed(1)}s = <strong>{simplifiedOperation.piecesPerHour.toFixed(1)} pçs/h</strong>.
                </div>
                <div>
                  • <strong>Postos Necessários:</strong> Demanda ({activeModel.dailyDemand}) / PPD ({simplifiedOperation.piecesPerDay.toFixed(0)}) = <strong>{simplifiedOperation.requiredWorkstations.toFixed(2)} postos</strong>.
                </div>
              </div>
              {simplifiedOperation.description && (
                <div className="pt-2 border-t border-slate-200 text-slate-600">
                  <strong>Descrição do Método:</strong> {simplifiedOperation.description}
                </div>
              )}
            </div>
          )}

          {/* Signatures and Validation Field */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-mono text-[11px] text-slate-700">
                Eng. Raul Terêncio
              </div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Analista de Métodos e Processos
              </span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 h-5"></div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Supervisor de Manufatura
              </span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 h-5"></div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                Gerência Industrial / Qualidade
              </span>
            </div>
          </div>
        </div>

        {/* Footer info (screen only) */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Dica: Pressione <strong>Ctrl + P</strong> (ou Cmd + P) para salvar como PDF com diagramação perfeita.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
