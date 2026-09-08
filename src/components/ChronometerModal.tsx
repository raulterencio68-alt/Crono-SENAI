import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Check, 
  X, 
  ArrowRightLeft, 
  Clock, 
  Calculator, 
  Save, 
  History 
} from 'lucide-react';
import { Operation, ProductModel } from '../types';
import { 
  formatSecondsToSexagesimal, 
  secondsToCentesimalMinutes, 
  parseSexagesimalToSeconds,
  centesimalMinutesToSeconds
} from '../utils/industrialMath';

interface ChronometerModalProps {
  isOpen: boolean;
  onClose: () => void;
  operations: Operation[];
  activeModel: ProductModel | null;
  onApplyTimeToOperation: (operationId: string, seconds: number, note?: string) => void;
  onApplyTimeToNewOperation: (seconds: number) => void;
  preSelectedOperationId?: string;
}

interface LapRecord {
  id: number;
  lapSeconds: number;
  splitSeconds: number;
  sexagesimal: string;
  centesimal: number;
  timestamp: string;
}

export const ChronometerModal: React.FC<ChronometerModalProps> = ({
  isOpen,
  onClose,
  operations,
  activeModel,
  onApplyTimeToOperation,
  onApplyTimeToNewOperation,
  preSelectedOperationId,
}) => {
  const [activeTab, setActiveTab] = useState<'stopwatch' | 'converter'>('stopwatch');
  
  // Stopwatch states
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMilliseconds, setElapsedMilliseconds] = useState(0);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState<string>(preSelectedOperationId || '');
  const [measurementNote, setMeasurementNote] = useState('');

  // Converter states
  const [convSexagesimal, setConvSexagesimal] = useState('01:30');
  const [convCentesimal, setConvCentesimal] = useState('1.5000');
  const [convSeconds, setConvSeconds] = useState(90);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Sync preselected operation
  useEffect(() => {
    if (preSelectedOperationId) {
      setSelectedOperationId(preSelectedOperationId);
    } else if (operations.length > 0 && !selectedOperationId) {
      setSelectedOperationId(operations[0].id);
    }
  }, [preSelectedOperationId, operations]);

  // Stopwatch interval handling with high precision requestAnimationFrame or setInterval
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedMilliseconds;
      const interval = setInterval(() => {
        setElapsedMilliseconds(performance.now() - startTimeRef.current);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  if (!isOpen) return null;

  const totalElapsedSeconds = elapsedMilliseconds / 1000;
  const minutes = Math.floor(totalElapsedSeconds / 60);
  const seconds = Math.floor(totalElapsedSeconds % 60);
  const hundredths = Math.floor((totalElapsedSeconds % 1) * 100);

  // Centesimal: total seconds / 60
  const currentCentesimalMinutes = secondsToCentesimalMinutes(totalElapsedSeconds);
  const currentCentesimalHundredths = (currentCentesimalMinutes * 100).toFixed(1);

  const handleStartPause = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMilliseconds(0);
    setLaps([]);
  };

  const handleLap = () => {
    if (totalElapsedSeconds <= 0) return;
    const lastLapSplit = laps.length > 0 ? laps[0].splitSeconds : 0;
    const lapDuration = totalElapsedSeconds - lastLapSplit;

    const newLap: LapRecord = {
      id: laps.length + 1,
      splitSeconds: totalElapsedSeconds,
      lapSeconds: Math.max(0, lapDuration),
      sexagesimal: formatSecondsToSexagesimal(totalElapsedSeconds, true),
      centesimal: currentCentesimalMinutes,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
    };
    setLaps([newLap, ...laps]);
  };

  const handleSaveToOperation = () => {
    if (totalElapsedSeconds <= 0) return;
    if (selectedOperationId) {
      onApplyTimeToOperation(selectedOperationId, totalElapsedSeconds, measurementNote);
      onClose();
    } else {
      onApplyTimeToNewOperation(totalElapsedSeconds);
      onClose();
    }
  };

  // Conversão manual bidirecional
  const handleSexagesimalInputChange = (val: string) => {
    setConvSexagesimal(val);
    const secs = parseSexagesimalToSeconds(val);
    setConvSeconds(secs);
    const cmin = secondsToCentesimalMinutes(secs);
    setConvCentesimal(cmin.toFixed(4));
  };

  const handleCentesimalInputChange = (val: string) => {
    setConvCentesimal(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed)) {
      const secs = centesimalMinutesToSeconds(parsed);
      setConvSeconds(secs);
      setConvSexagesimal(formatSecondsToSexagesimal(secs, true));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Cronômetro Industrial & Conversor
              </h2>
              <p className="text-xs text-slate-400">
                Tomada de tempos sexagesimais com conversão centesimal em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6">
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-colors ${
              activeTab === 'stopwatch'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Cronômetro Digital Interativo</span>
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm font-semibold transition-colors ${
              activeTab === 'converter'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Conversor Manual (MM:SS ↔ Centesimal)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'stopwatch' ? (
            <>
              {/* Dual Digital Industrial Display */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-2 left-3 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                  CRONÔMETRO DE ENGENHARIA DE MÉTODOS
                </div>
                {isRunning && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>GRAVANDO</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {/* Sexagesimal Display */}
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Tempo Sexagesimal (MM:SS)
                    </div>
                    <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-wider">
                      {String(minutes).padStart(2, '0')}:
                      {String(seconds).padStart(2, '0')}.
                      <span className="text-amber-400 text-2xl sm:text-3xl">
                        {String(hundredths).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      {totalElapsedSeconds.toFixed(2)} segundos totais
                    </div>
                  </div>

                  {/* Centesimal Display */}
                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-4">
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                      <span>Tempo Centesimal (Cmin / DM)</span>
                    </div>
                    <div className="text-4xl sm:text-5xl font-mono font-bold text-emerald-400 tracking-wider">
                      {currentCentesimalMinutes.toFixed(4)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      {currentCentesimalHundredths} centésimos de minuto
                    </div>
                  </div>
                </div>

                {/* Industrial Reference Info */}
                <div className="mt-3 text-[11px] text-slate-400 bg-slate-900/40 py-1.5 px-3 rounded-md inline-block border border-slate-800/50">
                  <span className="text-slate-300 font-semibold">Regra de Conversão:</span> 1 min sexagesimal (60s) = 1,0000 min centesimal (100 centésimos) | 1s = 0,0167 min centesimais.
                </div>
              </div>

              {/* Stopwatch Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="btn-stopwatch-toggle"
                  onClick={handleStartPause}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>{elapsedMilliseconds > 0 ? 'Continuar' : 'Iniciar'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-stopwatch-lap"
                  onClick={handleLap}
                  disabled={!isRunning && elapsedMilliseconds === 0}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Flag className="w-4 h-4 text-sky-400" />
                  <span>Volta (Lap)</span>
                </button>

                <button
                  id="btn-stopwatch-reset"
                  onClick={handleReset}
                  disabled={elapsedMilliseconds === 0}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Zerar</span>
                </button>
              </div>

              {/* Operation Assignment Form */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Atribuir Tempo Cronometrado</span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {totalElapsedSeconds > 0 ? `${formatSecondsToSexagesimal(totalElapsedSeconds, true)} (${currentCentesimalMinutes.toFixed(4)} Cmin)` : 'Aguardando tomada'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Destino da Cronometragem:
                    </label>
                    <select
                      value={selectedOperationId}
                      onChange={(e) => setSelectedOperationId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Criar Nova Operação com este Tempo --</option>
                      {operations.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.name} ({op.observedTimeFormatted})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Anotação do Cronometrista / Condição:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Operador experiente, lote piloto, ritmo normal"
                      value={measurementNote}
                      onChange={(e) => setMeasurementNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    id="btn-save-timed-value"
                    onClick={handleSaveToOperation}
                    disabled={totalElapsedSeconds <= 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {selectedOperationId ? 'Salvar Tempo na Operação Selecionada' : 'Criar Nova Operação com este Tempo'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Laps Table */}
              {laps.length > 0 && (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <div className="px-4 py-2.5 bg-slate-900/90 text-xs font-semibold text-slate-300 flex items-center justify-between border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-sky-400" />
                      Tomadas Registradas ({laps.length})
                    </span>
                    <span className="text-slate-500 text-[11px]">Volta / Split acumulado</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
                    {laps.map((lap) => (
                      <div key={lap.id} className="px-4 py-2 flex items-center justify-between hover:bg-slate-900/60">
                        <span className="text-slate-400">Volta #{lap.id}</span>
                        <span className="text-slate-200">
                          {formatSecondsToSexagesimal(lap.lapSeconds, true)}
                        </span>
                        <span className="text-emerald-400">
                          {lap.centesimal.toFixed(4)} Cmin
                        </span>
                        <span className="text-slate-500 text-[11px]">{lap.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Conversor Manual Tab */
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  Conversor Bidirecional Exato Sexagesimal ↔ Centesimal
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Na cronometria industrial, cronômetros clássicos usam o sistema centesimal (1 minuto = 100 centésimos de minuto) para facilitar cálculos estatísticos, tempos normais e tempos padrão.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Sexagesimal input */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Tempo Sexagesimal (MM:SS ou Segundos)
                    </label>
                    <input
                      type="text"
                      value={convSexagesimal}
                      onChange={(e) => handleSexagesimalInputChange(e.target.value)}
                      placeholder="01:30"
                      className="w-full text-2xl font-mono font-bold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-center"
                    />
                    <div className="text-[11px] text-slate-500 mt-2 text-center">
                      Equivalente: {convSeconds.toFixed(2)} segundos totais
                    </div>
                  </div>

                  {/* Centesimal input */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <label className="block text-xs font-semibold text-emerald-400 mb-2">
                      Tempo Centesimal (Minutos Centesimais - Cmin / DM)
                    </label>
                    <input
                      type="text"
                      value={convCentesimal}
                      onChange={(e) => handleCentesimalInputChange(e.target.value)}
                      placeholder="1.5000"
                      className="w-full text-2xl font-mono font-bold bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 focus:outline-none focus:border-emerald-500 text-center"
                    />
                    <div className="text-[11px] text-slate-500 mt-2 text-center">
                      Equivalente: {(parseFloat(convCentesimal || '0') * 100).toFixed(1)} centésimos de minuto
                    </div>
                  </div>
                </div>

                {/* Formulas Explanatory Box */}
                <div className="mt-6 bg-slate-900/90 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-slate-200">Fórmulas Matemáticas de Engenharia:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-amber-400">Sexagesimal → Centesimal:</span>
                      <p className="text-slate-400 mt-0.5">Cmin = Segundos / 60</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">Ex: 90s / 60 = 1,500 Cmin</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-emerald-400">Centesimal → Sexagesimal:</span>
                      <p className="text-slate-400 mt-0.5">Segundos = Cmin × 60</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">Ex: 1,500 × 60 = 90s (01:30)</p>
                    </div>
                  </div>
                </div>

                {/* Quick Convert Button */}
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => {
                      if (selectedOperationId && convSeconds > 0) {
                        onApplyTimeToOperation(selectedOperationId, convSeconds, 'Conversor manual');
                        onClose();
                      } else if (convSeconds > 0) {
                        onApplyTimeToNewOperation(convSeconds);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Usar este Tempo ({convSexagesimal} / {convCentesimal} Cmin)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Modelo Ativo: <strong className="text-slate-200">{activeModel?.code || 'N/A'}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
