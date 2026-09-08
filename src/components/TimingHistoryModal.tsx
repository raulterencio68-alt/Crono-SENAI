import React from 'react';
import { X, History, Clock, TrendingUp, Calendar, User } from 'lucide-react';
import { Operation } from '../types';

interface TimingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: Operation | null;
}

export const TimingHistoryModal: React.FC<TimingHistoryModalProps> = ({
  isOpen,
  onClose,
  operation,
}) => {
  if (!isOpen || !operation) return null;

  const history = operation.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Histórico de Versões e Cronometragens
              </h2>
              <p className="text-xs text-slate-500">
                Operação: <strong className="text-slate-800">{operation.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span>Tempo Atual: <strong>{operation.observedTimeFormatted}</strong> ({operation.centesimalMinutes.toFixed(4)} Cmin)</span>
            <span>Ritmo: <strong>{operation.performanceRating}%</strong> | Fadiga: <strong>{operation.fatigueAllowance}%</strong></span>
          </div>

          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Nenhum histórico anterior registrado para esta operação.
              </div>
            ) : (
              history.map((record, index) => (
                <div
                  key={record.id || index}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(record.timestamp).toLocaleString('pt-BR')}
                    </span>
                    <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      Tomada #{history.length - index}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded-lg font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Sexagesimal</span>
                      <span className="font-bold text-slate-800">{record.sexagesimalFormatted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Centesimal</span>
                      <span className="font-bold text-emerald-700">{record.centesimalMinutes.toFixed(4)} Cmin</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Peças/Hora</span>
                      <span className="font-bold text-sky-700">{record.piecesPerHour.toFixed(1)}</span>
                    </div>
                  </div>

                  {record.note && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/60 p-2 rounded">
                      <strong>Observação:</strong> {record.note}
                    </div>
                  )}

                  {record.recordedBy && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>Cronometrista: {record.recordedBy}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
