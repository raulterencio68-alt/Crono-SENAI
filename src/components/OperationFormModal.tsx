import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Clock, 
  Zap, 
  ShieldAlert, 
  HelpCircle, 
  Cpu, 
  UserCheck, 
  Sliders, 
  Info,
  CheckCircle2,
  Sparkles,
  Printer
} from 'lucide-react';
import { FatigueClassification, Operation, OperationType, ProductModel } from '../types';
import { 
  calculateOperationMetrics, 
  formatSecondsToSexagesimal, 
  parseSexagesimalToSeconds, 
  secondsToCentesimalMinutes,
  WESTINGHOUSE_PRESETS
} from '../utils/industrialMath';

interface OperationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operationData: Partial<Operation>) => void;
  operationToEdit?: Operation | null;
  activeModel: ProductModel | null;
  initialObservedSeconds?: number;
  onPrintSimplified?: (operation: Operation) => void;
}

export const OperationFormModal: React.FC<OperationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  operationToEdit,
  activeModel,
  initialObservedSeconds,
  onPrintSimplified,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OperationType>('manual');
  const [workstationName, setWorkstationName] = useState('');
  
  // Timing input
  const [sexagesimalInput, setSexagesimalInput] = useState('01:00');
  const [observedSeconds, setObservedSeconds] = useState(60);

  // Sliders
  const [performanceRating, setPerformanceRating] = useState(100); // Ritmo 50% - 150%
  const [fatigueAllowance, setFatigueAllowance] = useState(14); // Tolerância 0% - 40%
  const [selectedPreset, setSelectedPreset] = useState<string>('Usinagem em Torno / Centro CNC');

  // Detailed Westinghouse Table expander
  const [showWestinghouseDetail, setShowWestinghouseDetail] = useState(false);

  useEffect(() => {
    if (operationToEdit) {
      setName(operationToEdit.name);
      setDescription(operationToEdit.description);
      setType(operationToEdit.type);
      setWorkstationName(operationToEdit.workstationName || '');
      setObservedSeconds(operationToEdit.observedTimeSeconds);
      setSexagesimalInput(operationToEdit.observedTimeFormatted);
      setPerformanceRating(operationToEdit.performanceRating);
      setFatigueAllowance(operationToEdit.fatigueAllowance);
      setSelectedPreset(operationToEdit.westinghousePreset || '');
    } else {
      // Default reset
      setName('');
      setDescription('');
      setType('manual');
      setWorkstationName('');
      const initSecs = initialObservedSeconds && initialObservedSeconds > 0 ? initialObservedSeconds : 60;
      setObservedSeconds(initSecs);
      setSexagesimalInput(formatSecondsToSexagesimal(initSecs, true));
      setPerformanceRating(100);
      setFatigueAllowance(12);
      setSelectedPreset('Montagem Eletrônica Leve');
    }
  }, [operationToEdit, initialObservedSeconds, isOpen]);

  if (!isOpen) return null;

  // Real-time calculated preview
  const liveMetrics = calculateOperationMetrics(
    observedSeconds,
    performanceRating,
    fatigueAllowance,
    activeModel?.dailyDemand || 500,
    activeModel?.workdayHours || 8.8
  );

  const handleSexagesimalChange = (val: string) => {
    setSexagesimalInput(val);
    const secs = parseSexagesimalToSeconds(val);
    setObservedSeconds(secs);
  };

  const handleApplyPreset = (preset: typeof WESTINGHOUSE_PRESETS[0]) => {
    setFatigueAllowance(preset.allowance);
    setSelectedPreset(preset.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: operationToEdit?.id,
      modelId: activeModel?.id || '',
      name: name.trim(),
      description: description.trim(),
      type,
      workstationName: workstationName.trim() || undefined,
      observedTimeSeconds: liveMetrics.observedTimeSeconds,
      observedTimeFormatted: liveMetrics.observedTimeFormatted,
      centesimalMinutes: liveMetrics.centesimalMinutes,
      centesimalHundredths: liveMetrics.centesimalHundredths,
      performanceRating: liveMetrics.performanceRating,
      fatigueAllowance: liveMetrics.fatigueAllowance,
      fatigueClassification: liveMetrics.fatigueClassification,
      westinghousePreset: selectedPreset,
      normalTimeSeconds: liveMetrics.normalTimeSeconds,
      normalTimeMinutes: liveMetrics.normalTimeMinutes,
      standardTimeSeconds: liveMetrics.standardTimeSeconds,
      standardTimeMinutes: liveMetrics.standardTimeMinutes,
      piecesPerHour: liveMetrics.piecesPerHour,
      piecesPerDay: liveMetrics.piecesPerDay,
      requiredWorkstations: liveMetrics.requiredWorkstations,
      isBottleneck: liveMetrics.isBottleneck,
      lastTimedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              {type === 'machine' ? <Cpu className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {operationToEdit ? 'Editar Operação Industrial' : 'Cadastrar Nova Operação'}
              </h2>
              <p className="text-xs text-slate-500">
                Modelo: <strong className="text-slate-800">{activeModel?.name}</strong> ({activeModel?.code})
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Operação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 010 - Torneamento do Flange ou Solda TIG"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Operação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('manual')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                      type === 'manual'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Manual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('machine')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                      type === 'machine'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Máquina</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Posto de Trabalho / Máquina
                </label>
                <input
                  type="text"
                  placeholder="Ex: Torno CNC Mazak 01, Bancada ESD 03"
                  value={workstationName}
                  onChange={(e) => setWorkstationName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição do Método de Trabalho
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fixação em dispositivo, acionamento bimanual e inspeção com paquímetro"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Cronometragem & Conversão Sexagesimal / Centesimal */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Tempo Cronometrado Observado (TC)
              </span>
              <span className="text-xs text-slate-500">
                1 min = 100 centésimos (Cmin / DM)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Formato Sexagesimal (MM:SS)
                </label>
                <input
                  type="text"
                  value={sexagesimalInput}
                  onChange={(e) => handleSexagesimalChange(e.target.value)}
                  placeholder="01:15"
                  className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-900 text-center"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">
                  Segundos Totais
                </span>
                <span className="text-lg font-mono font-bold text-slate-800">
                  {liveMetrics.observedTimeSeconds.toFixed(1)}s
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                <span className="block text-[11px] font-semibold text-emerald-700 uppercase">
                  Minutos Centesimais
                </span>
                <span className="text-lg font-mono font-bold text-emerald-700">
                  {liveMetrics.centesimalMinutes.toFixed(4)} Cmin
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Sliders de Ritmo e Tolerâncias Westinghouse */}
          <div className="space-y-4">
            {/* Slider de Ritmo de Trabalho */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Ritmo de Trabalho / Fator de Desempenho
                  </span>
                  <span className="text-xs text-slate-500">
                    Velocidade do operador em relação ao ritmo padrão (100%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    {performanceRating}%
                  </span>
                </div>
              </div>

              {/* Slider control */}
              <input
                type="range"
                min="60"
                max="140"
                step="5"
                value={performanceRating}
                onChange={(e) => setPerformanceRating(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />

              {/* Preset buttons for rating */}
              <div className="flex justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setPerformanceRating(85)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${performanceRating === 85 ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  85% Lento
                </button>
                <button
                  type="button"
                  onClick={() => setPerformanceRating(100)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${performanceRating === 100 ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  100% Padrão Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPerformanceRating(115)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${performanceRating === 115 ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  115% Ágil
                </button>
                <button
                  type="button"
                  onClick={() => setPerformanceRating(125)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${performanceRating === 125 ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  125% Acelerado
                </button>
              </div>
            </div>

            {/* Slider de Tolerâncias de Fadiga (Tabela Westinghouse) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-violet-600" />
                    Tolerâncias de Fadiga (Tabela Westinghouse)
                  </span>
                  <span className="text-xs text-slate-500">
                    Concessões para necessidades pessoais, fadiga e imprevistos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                    liveMetrics.fatigueClassification === 'leve'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : liveMetrics.fatigueClassification === 'moderado'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                    {liveMetrics.fatigueClassification}
                  </span>
                  <span className="text-lg font-mono font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-200">
                    {fatigueAllowance}%
                  </span>
                </div>
              </div>

              {/* Slider control */}
              <input
                type="range"
                min="4"
                max="35"
                step="1"
                value={fatigueAllowance}
                onChange={(e) => setFatigueAllowance(parseInt(e.target.value, 10))}
                className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />

              {/* Westinghouse Presets Grid */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Templates Westinghouse Pré-Configurados:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WESTINGHOUSE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2 text-left rounded-lg border text-xs transition-all ${
                        fatigueAllowance === preset.allowance
                          ? 'border-violet-500 bg-violet-50/80 text-violet-900 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="font-semibold truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between mt-0.5">
                        <span>{preset.allowance}%</span>
                        <span className="capitalize">{preset.classification}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Painel de Resultados Imediatos (Cálculos de Engenharia) */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Cálculos de Produção em Tempo Real
              </span>
              <span className="text-slate-400">
                Demanda: {activeModel?.dailyDemand} peças / Turno: 8,8h
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Tempo Normal (TN)
                </span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {liveMetrics.normalTimeSeconds.toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {liveMetrics.normalTimeMinutes.toFixed(3)} Cmin
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase block">
                  Tempo Padrão (TP)
                </span>
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {liveMetrics.standardTimeSeconds.toFixed(1)}s
                </span>
                <span className="text-[10px] text-emerald-400/80 block font-mono">
                  {liveMetrics.standardTimeMinutes.toFixed(3)} Cmin
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-sky-400 uppercase block">
                  Peças / Hora (PPH)
                </span>
                <span className="text-sm font-bold font-mono text-sky-300">
                  {liveMetrics.piecesPerHour}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  pçs / hora
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] font-semibold text-indigo-400 uppercase block">
                  Produção / Dia (PPD)
                </span>
                <span className="text-sm font-bold font-mono text-indigo-300">
                  {liveMetrics.piecesPerDay}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  pçs / 8,8h
                </span>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                liveMetrics.isBottleneck
                  ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}>
                <span className="text-[10px] font-semibold uppercase block">
                  Postos Necessários
                </span>
                <span className="text-base font-bold font-mono">
                  {liveMetrics.requiredWorkstations}
                </span>
                <span className="text-[10px] block">
                  {liveMetrics.isBottleneck ? '⚠️ Gargalo (>2)' : 'Equilibrado'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {operationToEdit && onPrintSimplified && (
              <button
                type="button"
                onClick={() => onPrintSimplified(operationToEdit)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-sky-600" />
                <span>Imprimir Relatório Simplificado desta Operação</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Operação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
