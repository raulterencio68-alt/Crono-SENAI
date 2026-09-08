import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Clock, 
  Printer, 
  Cloud, 
  BarChart3, 
  Lightbulb, 
  ListTree, 
  FileSpreadsheet, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { LineBalanceMetrics, Operation, OptimizationSuggestion, ProductModel, TimingHistoryRecord } from './types';
import { 
  calculateLineBalance, 
  calculateOperationMetrics, 
  generateIndustrialSuggestions 
} from './utils/industrialMath';
import { 
  DriveConfig, 
  exportOperationsToCSV, 
  exportToDriveBackupJSON, 
  loadActiveModelId, 
  loadDriveConfig, 
  loadModels, 
  loadOperations, 
  saveActiveModelId, 
  saveDriveConfig, 
  saveModels, 
  saveOperations 
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { KPIDashboard } from './components/KPIDashboard';
import { OperationsTable } from './components/OperationsTable';
import { LineBalancingChart } from './components/LineBalancingChart';
import { OptimizationPanel } from './components/OptimizationPanel';
import { ChronometerModal } from './components/ChronometerModal';
import { OperationFormModal } from './components/OperationFormModal';
import { ModelEditModal } from './components/ModelEditModal';
import { PrintReportView } from './components/PrintReportView';
import { TimingHistoryModal } from './components/TimingHistoryModal';
import { DriveSyncModal } from './components/DriveSyncModal';
import { PromptViewerModal } from './components/PromptViewerModal';

export default function App() {
  // State: Models & Operations
  const [models, setModels] = useState<ProductModel[]>(() => loadModels());
  const [operations, setOperations] = useState<Operation[]>(() => loadOperations());
  const [activeModelId, setActiveModelId] = useState<string>(() => loadActiveModelId(models));
  const [driveConfig, setDriveConfig] = useState<DriveConfig>(() => loadDriveConfig());

  // Navigation / Tab state within main page
  const [activeTab, setActiveTab] = useState<'table' | 'balancing' | 'optimization'>('table');

  // Modals state
  const [isChronometerOpen, setIsChronometerOpen] = useState(false);
  const [chronometerPreselectedOpId, setChronometerPreselectedOpId] = useState<string | undefined>();
  const [isOpFormOpen, setIsOpFormOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [initialSecondsForNewOp, setInitialSecondsForNewOp] = useState<number | undefined>();
  const [isModelFormOpen, setIsModelFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [simplifiedPrintOp, setSimplifiedPrintOp] = useState<Operation | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetOp, setHistoryTargetOp] = useState<Operation | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // User notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync active model selection
  const activeModel = useMemo(() => {
    return models.find((m) => m.id === activeModelId) || models[0] || null;
  }, [models, activeModelId]);

  // Filter operations for active model
  const modelOperations = useMemo(() => {
    if (!activeModel) return [];
    return operations.filter((op) => op.modelId === activeModel.id);
  }, [operations, activeModel]);

  // Recalculate metrics reactively
  const balanceMetrics = useMemo<LineBalanceMetrics>(() => {
    if (!activeModel) {
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
    return calculateLineBalance(modelOperations, activeModel.dailyDemand, activeModel.workdayHours);
  }, [modelOperations, activeModel]);

  // Suggestions reactively
  const suggestions = useMemo<OptimizationSuggestion[]>(() => {
    if (!activeModel) return [];
    return generateIndustrialSuggestions(modelOperations, activeModel);
  }, [modelOperations, activeModel]);

  // Persistence side-effects
  const handleSelectModel = (modelId: string) => {
    setActiveModelId(modelId);
    saveActiveModelId(modelId);
  };

  const handleUpdateDailyDemand = (newDemand: number) => {
    if (!activeModel) return;
    const updatedModels = models.map((m) =>
      m.id === activeModel.id ? { ...m, dailyDemand: newDemand, updatedAt: new Date().toISOString() } : m
    );
    setModels(updatedModels);
    saveModels(updatedModels);

    // Recalculate required workstations for operations
    const updatedOps = operations.map((op) => {
      if (op.modelId === activeModel.id) {
        const recalc = calculateOperationMetrics(
          op.observedTimeSeconds,
          op.performanceRating,
          op.fatigueAllowance,
          newDemand,
          activeModel.workdayHours
        );
        return {
          ...op,
          ...recalc,
        };
      }
      return op;
    });
    setOperations(updatedOps);
    saveOperations(updatedOps);
    showToast(`Demanda alterada para ${newDemand} peças/dia.`);
  };

  // Model CRUD
  const handleSaveModel = (modelData: Partial<ProductModel>) => {
    if (modelData.id) {
      // Edit
      const updated = models.map((m) => (m.id === modelData.id ? ({ ...m, ...modelData } as ProductModel) : m));
      setModels(updated);
      saveModels(updated);
      showToast(`Modelo "${modelData.name}" atualizado.`);
    } else {
      // Create
      const newModel: ProductModel = {
        id: `mod-${Date.now()}`,
        code: modelData.code || 'PROD-01',
        name: modelData.name || 'Novo Modelo',
        description: modelData.description || '',
        dailyDemand: modelData.dailyDemand || 500,
        workdayHours: modelData.workdayHours || 8.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      };
      const updated = [...models, newModel];
      setModels(updated);
      saveModels(updated);
      setActiveModelId(newModel.id);
      saveActiveModelId(newModel.id);
      showToast(`Novo modelo "${newModel.name}" cadastrado!`);
    }
  };

  const handleDeleteModel = (modelId: string) => {
    const filteredModels = models.filter((m) => m.id !== modelId);
    const filteredOps = operations.filter((op) => op.modelId !== modelId);
    setModels(filteredModels);
    saveModels(filteredModels);
    setOperations(filteredOps);
    saveOperations(filteredOps);

    if (filteredModels.length > 0) {
      setActiveModelId(filteredModels[0].id);
      saveActiveModelId(filteredModels[0].id);
    }
    showToast('Modelo e operações vinculadas excluídos.');
  };

  // Operation CRUD
  const handleSaveOperation = (opData: Partial<Operation>) => {
    if (opData.id) {
      // Update
      const updated = operations.map((op) => {
        if (op.id === opData.id) {
          const newHistoryRecord: TimingHistoryRecord = {
            id: `hist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            sexagesimalSeconds: opData.observedTimeSeconds || op.observedTimeSeconds,
            sexagesimalFormatted: opData.observedTimeFormatted || op.observedTimeFormatted,
            centesimalMinutes: opData.centesimalMinutes || op.centesimalMinutes,
            performanceRating: opData.performanceRating || op.performanceRating,
            fatigueAllowance: opData.fatigueAllowance || op.fatigueAllowance,
            standardTimeMinutes: opData.standardTimeMinutes || op.standardTimeMinutes,
            piecesPerHour: opData.piecesPerHour || op.piecesPerHour,
            recordedBy: 'Analista de Tempos',
          };

          return {
            ...op,
            ...opData,
            history: [newHistoryRecord, ...(op.history || [])],
          } as Operation;
        }
        return op;
      });
      setOperations(updated);
      saveOperations(updated);
      showToast(`Operação "${opData.name}" atualizada com sucesso.`);
    } else {
      // Create new
      const newOp: Operation = {
        id: `op-${Date.now()}`,
        modelId: activeModel?.id || '',
        name: opData.name || 'Nova Operação',
        description: opData.description || '',
        type: opData.type || 'manual',
        workstationName: opData.workstationName,
        observedTimeSeconds: opData.observedTimeSeconds || 60,
        observedTimeFormatted: opData.observedTimeFormatted || '01:00',
        centesimalMinutes: opData.centesimalMinutes || 1.0,
        centesimalHundredths: opData.centesimalHundredths || 100,
        performanceRating: opData.performanceRating || 100,
        fatigueAllowance: opData.fatigueAllowance || 12,
        fatigueClassification: opData.fatigueClassification || 'leve',
        westinghousePreset: opData.westinghousePreset,
        normalTimeSeconds: opData.normalTimeSeconds || 60,
        normalTimeMinutes: opData.normalTimeMinutes || 1.0,
        standardTimeSeconds: opData.standardTimeSeconds || 67.2,
        standardTimeMinutes: opData.standardTimeMinutes || 1.12,
        piecesPerHour: opData.piecesPerHour || 53.5,
        piecesPerDay: opData.piecesPerDay || 471,
        requiredWorkstations: opData.requiredWorkstations || 1.06,
        isBottleneck: !!opData.isBottleneck,
        lastTimedAt: new Date().toISOString(),
        history: [
          {
            id: `hist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            sexagesimalSeconds: opData.observedTimeSeconds || 60,
            sexagesimalFormatted: opData.observedTimeFormatted || '01:00',
            centesimalMinutes: opData.centesimalMinutes || 1.0,
            performanceRating: opData.performanceRating || 100,
            fatigueAllowance: opData.fatigueAllowance || 12,
            standardTimeMinutes: opData.standardTimeMinutes || 1.12,
            piecesPerHour: opData.piecesPerHour || 53.5,
            recordedBy: 'Analista de Tempos',
          },
        ],
      };
      const updated = [...operations, newOp];
      setOperations(updated);
      saveOperations(updated);
      showToast(`Operação "${newOp.name}" cadastrada!`);
    }
  };

  const handleDeleteOperation = (opId: string) => {
    if (confirm('Tem certeza que deseja excluir esta operação?')) {
      const updated = operations.filter((op) => op.id !== opId);
      setOperations(updated);
      saveOperations(updated);
      showToast('Operação removida da linha.');
    }
  };

  // Stopwatch direct application
  const handleApplyTimeToOperation = (operationId: string, seconds: number, note?: string) => {
    const target = operations.find((op) => op.id === operationId);
    if (!target || !activeModel) return;

    const metrics = calculateOperationMetrics(
      seconds,
      target.performanceRating,
      target.fatigueAllowance,
      activeModel.dailyDemand,
      activeModel.workdayHours
    );

    const historyRecord: TimingHistoryRecord = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sexagesimalSeconds: seconds,
      sexagesimalFormatted: metrics.observedTimeFormatted,
      centesimalMinutes: metrics.centesimalMinutes,
      performanceRating: target.performanceRating,
      fatigueAllowance: target.fatigueAllowance,
      standardTimeMinutes: metrics.standardTimeMinutes,
      piecesPerHour: metrics.piecesPerHour,
      note: note || 'Cronometragem realizada no app',
      recordedBy: 'Analista de Métodos',
    };

    const updated = operations.map((op) =>
      op.id === operationId
        ? {
            ...op,
            ...metrics,
            lastTimedAt: new Date().toISOString(),
            history: [historyRecord, ...(op.history || [])],
          }
        : op
    );

    setOperations(updated);
    saveOperations(updated);
    showToast(`Tempo de ${metrics.observedTimeFormatted} aplicado em "${target.name}".`);
  };

  const handleApplyTimeToNewOperation = (seconds: number) => {
    setInitialSecondsForNewOp(seconds);
    setEditingOperation(null);
    setIsOpFormOpen(true);
  };

  // Open printing
  const handleOpenPrintReport = (simplifiedOpId?: string) => {
    if (simplifiedOpId) {
      const found = operations.find((op) => op.id === simplifiedOpId);
      setSimplifiedPrintOp(found || null);
    } else {
      setSimplifiedPrintOp(null);
    }
    setIsPrintModalOpen(true);
  };

  // Import complete backup
  const handleImportBackup = (importedModels: ProductModel[], importedOperations: Operation[]) => {
    setModels(importedModels);
    saveModels(importedModels);
    setOperations(importedOperations);
    saveOperations(importedOperations);
    if (importedModels.length > 0) {
      setActiveModelId(importedModels[0].id);
      saveActiveModelId(importedModels[0].id);
    }
    showToast('Base de dados restaurada com sucesso!');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        models={models}
        activeModel={activeModel}
        onSelectModel={handleSelectModel}
        onOpenNewModel={() => {
          setEditingModel(null);
          setIsModelFormOpen(true);
        }}
        onOpenEditModel={() => {
          setEditingModel(activeModel);
          setIsModelFormOpen(true);
        }}
        onDeleteModel={() => {
          if (activeModel) handleDeleteModel(activeModel.id);
        }}
        onOpenNewOperation={() => {
          setEditingOperation(null);
          setInitialSecondsForNewOp(undefined);
          setIsOpFormOpen(true);
        }}
        onOpenChronometer={() => {
          setChronometerPreselectedOpId(undefined);
          setIsChronometerOpen(true);
        }}
        onOpenPrintReport={handleOpenPrintReport}
        onOpenDriveSync={() => setIsDriveModalOpen(true)}
        onOpenPromptViewer={() => setIsPromptModalOpen(true)}
        driveConfig={driveConfig}
        onUpdateDailyDemand={handleUpdateDailyDemand}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Model Title & Description Header */}
        {activeModel && (
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {activeModel.code}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeModel.name}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
                {activeModel.description || 'Linha de montagem industrial configurada.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => {
                  setEditingOperation(null);
                  setIsOpFormOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Operação</span>
              </button>

              <button
                onClick={() => handleOpenPrintReport()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span>Imprimir Folha A4</span>
              </button>
            </div>
          </div>
        )}

        {/* Industrial KPI Cards */}
        <KPIDashboard
          metrics={balanceMetrics}
          activeModel={activeModel}
          operationsCount={modelOperations.length}
        />

        {/* View Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 mb-0 shadow-xs">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'table'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListTree className="w-4 h-4" />
            <span>Tabela de Operações & Cronometragem ({modelOperations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('balancing')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'balancing'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficos de Balanceamento & Takt Time</span>
          </button>

          <button
            onClick={() => setActiveTab('optimization')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === 'optimization'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Sugestões de Otimização ({suggestions.length})</span>
            {suggestions.some((s) => s.severity === 'alta') && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Tab View Content */}
        <div className="mt-0">
          {activeTab === 'table' && (
            <OperationsTable
              operations={modelOperations}
              onEditOperation={(op) => {
                setEditingOperation(op);
                setIsOpFormOpen(true);
              }}
              onDeleteOperation={handleDeleteOperation}
              onOpenChronometerForOp={(opId) => {
                setChronometerPreselectedOpId(opId);
                setIsChronometerOpen(true);
              }}
              onPrintSimplified={(op) => handleOpenPrintReport(op.id)}
              onOpenNewOperation={() => {
                setEditingOperation(null);
                setInitialSecondsForNewOp(undefined);
                setIsOpFormOpen(true);
              }}
              onViewHistory={(op) => {
                setHistoryTargetOp(op);
                setIsHistoryModalOpen(true);
              }}
            />
          )}

          {activeTab === 'balancing' && (
            <LineBalancingChart
              operations={modelOperations}
              activeModel={activeModel}
              metrics={balanceMetrics}
            />
          )}

          {activeTab === 'optimization' && (
            <OptimizationPanel
              suggestions={suggestions}
              operations={modelOperations}
              activeModel={activeModel}
              metrics={balanceMetrics}
            />
          )}
        </div>

        {/* Secondary section: Summary and Quick Conversion Helper */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Cronoanálise Industrial
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              O sistema calcula o <strong>Tempo Normal</strong> aplicando o Ritmo de Trabalho e adiciona a <strong>Tolerância Westinghouse</strong> para obter o <strong>Tempo Padrão</strong> oficial da peça.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              Jornada Padrão e Postos
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Considerando jornada padrão de <strong>8,8 horas</strong> (528 minutos úteis de trabalho), o app calcula <strong>Peças/Dia</strong> e o número exato de operadores para atingir a meta da fábrica.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-violet-600" />
              Google Drive & Vercel
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Todos os estudos, modelos e históricos de tomada de tempo são mantidos em armazenamento durável com suporte a backup em JSON e exportação CSV para planilhas.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ChronometerModal
        isOpen={isChronometerOpen}
        onClose={() => setIsChronometerOpen(false)}
        operations={modelOperations}
        activeModel={activeModel}
        onApplyTimeToOperation={handleApplyTimeToOperation}
        onApplyTimeToNewOperation={handleApplyTimeToNewOperation}
        preSelectedOperationId={chronometerPreselectedOpId}
      />

      <OperationFormModal
        isOpen={isOpFormOpen}
        onClose={() => setIsOpFormOpen(false)}
        onSave={handleSaveOperation}
        operationToEdit={editingOperation}
        activeModel={activeModel}
        initialObservedSeconds={initialSecondsForNewOp}
        onPrintSimplified={(op) => handleOpenPrintReport(op.id)}
      />

      <ModelEditModal
        isOpen={isModelFormOpen}
        onClose={() => setIsModelFormOpen(false)}
        onSave={handleSaveModel}
        onDelete={handleDeleteModel}
        modelToEdit={editingModel}
        totalModelsCount={models.length}
      />

      <PrintReportView
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeModel={activeModel}
        operations={modelOperations}
        metrics={balanceMetrics}
        simplifiedOperation={simplifiedPrintOp}
      />

      <TimingHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        operation={historyTargetOp}
      />

      <DriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        models={models}
        operations={operations}
        activeModel={activeModel}
        driveConfig={driveConfig}
        onUpdateDriveConfig={(cfg) => setDriveConfig(cfg)}
        onImportBackup={handleImportBackup}
      />

      <PromptViewerModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />
    </div>
  );
}
