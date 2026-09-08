import React, { useState } from 'react';
import { 
  Printer, 
  Clock, 
  Edit3, 
  Trash2, 
  History, 
  AlertTriangle, 
  Cpu, 
  UserCheck, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  ArrowUpDown 
} from 'lucide-react';
import { Operation, OperationType } from '../types';

interface OperationsTableProps {
  operations: Operation[];
  onEditOperation: (op: Operation) => void;
  onDeleteOperation: (opId: string) => void;
  onOpenChronometerForOp: (opId: string) => void;
  onPrintSimplified: (op: Operation) => void;
  onOpenNewOperation: () => void;
  onViewHistory: (op: Operation) => void;
}

export const OperationsTable: React.FC<OperationsTableProps> = ({
  operations,
  onEditOperation,
  onDeleteOperation,
  onOpenChronometerForOp,
  onPrintSimplified,
  onOpenNewOperation,
  onViewHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | OperationType>('all');
  const [onlyBottlenecks, setOnlyBottlenecks] = useState(false);

  // Filter logic
  const filteredOperations = operations.filter((op) => {
    const matchesSearch = op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.workstationName && op.workstationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      op.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || op.type === typeFilter;
    const matchesBottleneck = !onlyBottlenecks || op.isBottleneck;

    return matchesSearch && matchesType && matchesBottleneck;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por operação, posto ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${typeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Todos ({operations.length})
            </button>
            <button
              onClick={() => setTypeFilter('manual')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${typeFilter === 'manual' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Manual
            </button>
            <button
              onClick={() => setTypeFilter('machine')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${typeFilter === 'machine' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Máquina
            </button>
          </div>

          {/* Bottleneck filter */}
          <button
            onClick={() => setOnlyBottlenecks(!onlyBottlenecks)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
              onlyBottlenecks
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Gargalos (&gt; 2 postos)</span>
          </button>
        </div>

        <button
          onClick={onOpenNewOperation}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova Operação</span>
        </button>
      </div>

      {/* Operations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Operação / Posto</th>
              <th className="py-3 px-3">Tipo</th>
              <th className="py-3 px-3 text-right">Tempo Sexagesimal (TC)</th>
              <th className="py-3 px-3 text-right">Centesimal (Cmin)</th>
              <th className="py-3 px-3 text-center">Ritmo (FR)</th>
              <th className="py-3 px-3 text-center">Fadiga (FT)</th>
              <th className="py-3 px-3 text-right">Tempo Padrão (TP)</th>
              <th className="py-3 px-3 text-right">Peças / Hora</th>
              <th className="py-3 px-3 text-right">Peças / Dia (8,8h)</th>
              <th className="py-3 px-3 text-center">Postos Req.</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredOperations.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-slate-400">
                  Nenhuma operação encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredOperations.map((op, idx) => {
                const isBottleneck = op.isBottleneck || op.requiredWorkstations > 2.0;

                return (
                  <tr
                    key={op.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isBottleneck ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    {/* Operation details */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        {isBottleneck && (
                          <span
                            title="Gargalo Crítico: Requer mais de 2 postos de trabalho para a demanda"
                            className="mt-0.5 text-rose-600 shrink-0"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{op.name}</span>
                          </div>
                          {op.workstationName && (
                            <div className="text-[11px] text-slate-500">
                              Posto: <span className="font-medium text-slate-700">{op.workstationName}</span>
                            </div>
                          )}
                          {op.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {op.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                        op.type === 'machine'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {op.type === 'machine' ? <Cpu className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        <span className="capitalize">{op.type}</span>
                      </span>
                    </td>

                    {/* Sexagesimal Time */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {op.observedTimeFormatted}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({op.observedTimeSeconds.toFixed(1)}s)
                      </span>
                    </td>

                    {/* Centesimal Time */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                      {op.centesimalMinutes.toFixed(4)}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {op.centesimalHundredths} cmin
                      </span>
                    </td>

                    {/* Performance Rating */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {op.performanceRating}%
                      </span>
                    </td>

                    {/* Westinghouse Fatigue */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-medium text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
                          {op.fatigueAllowance}%
                        </span>
                        <span className={`text-[9px] uppercase font-bold mt-0.5 px-1 rounded ${
                          op.fatigueClassification === 'leve'
                            ? 'text-emerald-700 bg-emerald-50'
                            : op.fatigueClassification === 'moderado'
                            ? 'text-amber-700 bg-amber-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {op.fatigueClassification}
                        </span>
                      </div>
                    </td>

                    {/* Standard Time */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {op.standardTimeSeconds.toFixed(1)}s
                      <span className="text-[10px] text-emerald-600 block font-normal">
                        {op.standardTimeMinutes.toFixed(3)} Cmin
                      </span>
                    </td>

                    {/* Pieces / Hour (PPH) */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-sky-700">
                      {op.piecesPerHour.toFixed(1)}
                    </td>

                    {/* Pieces / Day (PPD 8.8h) */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-700">
                      {op.piecesPerDay.toFixed(0)}
                    </td>

                    {/* Required Workstations */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                        isBottleneck
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {op.requiredWorkstations.toFixed(2)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Imprimir Relatório Simplificado da Operação */}
                        <button
                          onClick={() => onPrintSimplified(op)}
                          title="Imprimir relatório simplificado desta operação com todos os cálculos"
                          className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Cronometrar novamente */}
                        <button
                          onClick={() => onOpenChronometerForOp(op.id)}
                          title="Cronometrar esta operação novamente"
                          className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        {/* Histórico */}
                        <button
                          onClick={() => onViewHistory(op)}
                          title="Ver histórico de tomadas de tempo"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => onEditOperation(op)}
                          title="Editar operação e parâmetros"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => onDeleteOperation(op.id)}
                          title="Excluir operação"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
