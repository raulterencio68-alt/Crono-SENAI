import React, { useState, useEffect } from 'react';
import { X, Save, Factory, Trash2 } from 'lucide-react';
import { ProductModel } from '../types';

interface ModelEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modelData: Partial<ProductModel>) => void;
  onDelete?: (modelId: string) => void;
  modelToEdit?: ProductModel | null;
  totalModelsCount: number;
}

export const ModelEditModal: React.FC<ModelEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  modelToEdit,
  totalModelsCount,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dailyDemand, setDailyDemand] = useState(500);
  const [workdayHours, setWorkdayHours] = useState(8.8);

  useEffect(() => {
    if (modelToEdit) {
      setCode(modelToEdit.code);
      setName(modelToEdit.name);
      setDescription(modelToEdit.description);
      setDailyDemand(modelToEdit.dailyDemand);
      setWorkdayHours(modelToEdit.workdayHours);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setDailyDemand(500);
      setWorkdayHours(8.8);
    }
  }, [modelToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onSave({
      id: modelToEdit?.id,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      dailyDemand: Number(dailyDemand) || 500,
      workdayHours: Number(workdayHours) || 8.8,
      version: modelToEdit ? (modelToEdit.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: modelToEdit?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {modelToEdit ? 'Editar Modelo de Produção' : 'Cadastrar Novo Modelo / Produto'}
              </h2>
              <p className="text-xs text-slate-500">
                Linha de montagem ou família de produtos fabricados
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Código / Part # *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: VCI-450"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-sm uppercase font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Produto / Modelo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Válvula de Controle Industrial VCI-450"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição da Linha de Produção
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Linha de montagem seriada, célula de fabricação nº 4..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Demanda Diária Planejada (Peças) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={dailyDemand}
                onChange={(e) => setDailyDemand(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Utilizado para o cálculo de Takt Time e dimensionamento de postos.
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jornada Diária de Trabalho (Horas)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="24"
                value={workdayHours}
                onChange={(e) => setWorkdayHours(parseFloat(e.target.value) || 8.8)}
                className="w-full px-3 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Padrão brasileiro CLT: 8,8h (528 minutos úteis por turno).
              </span>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {modelToEdit && onDelete && totalModelsCount > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir o modelo "${modelToEdit.name}" e todas as suas operações?`)) {
                    onDelete(modelToEdit.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Modelo</span>
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
              <span>Salvar Modelo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
