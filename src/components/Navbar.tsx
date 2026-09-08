import React, { useState } from 'react';
import { 
  Factory, 
  Clock, 
  Plus, 
  Printer, 
  Cloud, 
  FileSpreadsheet, 
  Sparkles, 
  Code2, 
  Settings, 
  FolderSync,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ProductModel } from '../types';
import { DriveConfig } from '../utils/storage';

interface NavbarProps {
  models: ProductModel[];
  activeModel: ProductModel | null;
  onSelectModel: (modelId: string) => void;
  onOpenNewModel: () => void;
  onOpenEditModel: () => void;
  onDeleteModel: () => void;
  onOpenNewOperation: () => void;
  onOpenChronometer: () => void;
  onOpenPrintReport: (simplifiedOperationId?: string) => void;
  onOpenDriveSync: () => void;
  onOpenPromptViewer: () => void;
  driveConfig: DriveConfig;
  onUpdateDailyDemand: (demand: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  models,
  activeModel,
  onSelectModel,
  onOpenNewModel,
  onOpenEditModel,
  onDeleteModel,
  onOpenNewOperation,
  onOpenChronometer,
  onOpenPrintReport,
  onOpenDriveSync,
  onOpenPromptViewer,
  driveConfig,
  onUpdateDailyDemand,
}) => {
  const [editingDemand, setEditingDemand] = useState(false);
  const [demandInput, setDemandInput] = useState(activeModel?.dailyDemand.toString() || '500');

  const handleSaveDemand = () => {
    const val = parseInt(demandInput, 10);
    if (!isNaN(val) && val > 0) {
      onUpdateDailyDemand(val);
    }
    setEditingDemand(false);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-100">
                  CronoAnálise
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  INDÚSTRIA 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cronometragem e Engenharia de Métodos
              </p>
            </div>
          </div>

          {/* Model Selector & Quick Demand Config */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg p-1">
              <span className="text-xs text-slate-400 px-2 font-medium hidden md:inline">
                Modelo / Produto:
              </span>
              <select
                id="model-select-dropdown"
                value={activeModel?.id || ''}
                onChange={(e) => onSelectModel(e.target.value)}
                className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer pr-4 pl-1"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>

              <button
                id="btn-edit-active-model"
                onClick={onOpenEditModel}
                title="Editar parâmetros deste modelo"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                id="btn-add-new-model"
                onClick={onOpenNewModel}
                title="Cadastrar novo modelo de produto"
                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Demand Badge */}
            {activeModel && (
              <div className="hidden lg:flex items-center bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400 mr-1.5">Demanda:</span>
                {editingDemand ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={demandInput}
                      onChange={(e) => setDemandInput(e.target.value)}
                      className="w-16 px-1.5 py-0.5 text-xs bg-slate-900 border border-emerald-500 rounded text-white"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveDemand}
                      className="text-emerald-400 text-xs px-1 hover:underline"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setDemandInput(activeModel.dailyDemand.toString());
                      setEditingDemand(true);
                    }}
                    title="Clique para alterar a meta diária"
                    className="font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {activeModel.dailyDemand} pçs/dia
                    <span className="text-[10px] text-slate-500">(8,8h)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Google Drive status pill */}
            <button
              id="btn-google-drive-sync"
              onClick={onOpenDriveSync}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={`Sincronização Google Drive: ${driveConfig.isConnected ? 'Conectado (' + driveConfig.userEmail + ')' : 'Desconectado'}`}
            >
              <Cloud className={`w-3.5 h-3.5 ${driveConfig.isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Google Drive</span>
              {driveConfig.isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            {/* Cronômetro Rápido */}
            <button
              id="btn-open-chronometer-modal"
              onClick={onOpenChronometer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Cronômetro</span>
            </button>

            {/* Nova Operação */}
            <button
              id="btn-open-new-operation-modal"
              onClick={onOpenNewOperation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Operação</span>
            </button>

            {/* Imprimir Relatório */}
            <button
              id="btn-open-full-print-report"
              onClick={() => onOpenPrintReport()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Gerar e imprimir relatório completo do modelo"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden xl:inline">Relatório</span>
            </button>

            {/* Visualizar Prompt / Engenharia */}
            <button
              id="btn-open-prompt-spec"
              onClick={onOpenPromptViewer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Visualizar prompt e especificação técnica para Vercel / GitHub"
            >
              <Code2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
