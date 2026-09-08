import React, { useState, useRef } from 'react';
import { 
  Cloud, 
  X, 
  Upload, 
  Download, 
  CheckCircle2, 
  RefreshCw, 
  FileSpreadsheet, 
  FolderSync, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { Operation, ProductModel } from '../types';
import { DriveConfig, exportOperationsToCSV, exportToDriveBackupJSON, saveDriveConfig } from '../utils/storage';

interface DriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ProductModel[];
  operations: Operation[];
  activeModel: ProductModel | null;
  driveConfig: DriveConfig;
  onUpdateDriveConfig: (cfg: DriveConfig) => void;
  onImportBackup: (importedModels: ProductModel[], importedOperations: Operation[]) => void;
}

export const DriveSyncModal: React.FC<DriveSyncModalProps> = ({
  isOpen,
  onClose,
  models,
  operations,
  activeModel,
  driveConfig,
  onUpdateDriveConfig,
  onImportBackup,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleTriggerSync = async () => {
    setSyncing(true);
    setSyncStatusMsg(null);
    try {
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models,
          studies: operations,
          syncTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Falha na sincronização com o Google Drive');
      const data = await response.json();

      const updated = {
        ...driveConfig,
        lastSyncedAt: new Date().toISOString(),
      };
      onUpdateDriveConfig(updated);
      saveDriveConfig(updated);
      setSyncStatusMsg('Sincronização concluída com sucesso no Google Drive!');
    } catch (err: any) {
      console.error('Error syncing:', err);
      setSyncStatusMsg('Erro ao conectar com a API do Google Drive.');
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.models && parsed.operations) {
          onImportBackup(parsed.models, parsed.operations);
          setSyncStatusMsg(`Backup importado com sucesso: ${parsed.models.length} modelos e ${parsed.operations.length} operações.`);
        } else {
          alert('Arquivo JSON inválido. Estrutura não reconhecida.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sincronização & Backup Google Drive
              </h2>
              <p className="text-xs text-slate-500">
                Armazenamento em nuvem, controle de versões e exportação de estudos
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
        <div className="p-6 space-y-5">
          {/* OAuth & Drive Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Autenticação Google OAuth Ativa
                </span>
                <span className="text-xs text-slate-600 block">
                  Conta: <strong>{driveConfig.userEmail}</strong>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Pasta Remota: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">{driveConfig.folderName}</code>
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Conectado
            </span>
          </div>

          {/* Sync Trigger and Last Sync */}
          <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Sincronizar Dados em Nuvem
              </span>
              <span className="text-xs text-slate-500">
                Último sync: {driveConfig.lastSyncedAt ? new Date(driveConfig.lastSyncedAt).toLocaleString('pt-BR') : 'Nunca'}
              </span>
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
            </button>
          </div>

          {syncStatusMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{syncStatusMsg}</span>
            </div>
          )}

          {/* Backup & Export Options */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Exportação e Importação de Arquivos:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export JSON for Drive */}
              <button
                onClick={() => exportToDriveBackupJSON(models, operations)}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-left transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Exportar JSON para Drive</div>
                  <div className="text-[11px] text-slate-500">Backup completo dos modelos e operações</div>
                </div>
              </button>

              {/* Export CSV for Excel/Sheets */}
              <button
                onClick={() => {
                  if (activeModel) {
                    const ops = operations.filter((op) => op.modelId === activeModel.id);
                    exportOperationsToCSV(activeModel, ops);
                  }
                }}
                disabled={!activeModel}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-left disabled:opacity-40 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">Exportar Planilha (CSV)</div>
                  <div className="text-[11px] text-slate-500">Compatível com Excel e Google Sheets</div>
                </div>
              </button>
            </div>

            {/* Import Backup JSON */}
            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Restaurar / Importar Backup do Google Drive (.json)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Persistência local segura + backup sincronizado</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
