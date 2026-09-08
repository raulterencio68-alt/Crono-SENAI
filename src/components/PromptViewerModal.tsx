import React, { useState } from 'react';
import { X, Copy, Check, Code2, Sparkles, Terminal } from 'lucide-react';

interface PromptViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromptViewerModal: React.FC<PromptViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const masterPromptText = `Você é um engenheiro de software fullstack sênior especializado em aplicações industriais, cronoanálise e manufatura enxuta (Lean Manufacturing).
Seu objetivo é desenvolver uma aplicação web de cronometragem e análise de produção em React (frontend), Node.js/Express (backend), com integração Google Drive para armazenamento e deploy via Vercel.

### ARQUITETURA E STACK TÉCNICO
- Frontend: React 18+ com TypeScript, Tailwind CSS, Lucide React e Motion.
- Backend: Node.js com Express e rotas de API para análise de processos e proxy de sincronização com Google Drive.
- Armazenamento: Google Drive API (com Google OAuth e exportação/importação de arquivos estruturados JSON/CSV) + LocalStorage com autosave.
- Deploy: Vercel / Cloud Run.

### MÓDULOS OBRIGATÓRIOS IMPLEMENTADOS
1. Cadastro e Gestão de Modelos e Operações:
   - Modelos/produtos com código, descrição, meta de demanda diária e horas de turno (8,8h padrão).
   - Operações com nome, descrição, tipo (manual ou máquina), posto de trabalho e status de gargalo.
   - Botão para imprimir relatório simplificado individual por operação com todos os cálculos.

2. Cronometragem e Conversão de Tempos:
   - Cronômetro digital interativo em tempo real com sexagesimal (MM:SS.cc) e centesimal (Cmin / DM).
   - Conversor bidirecional exato: 1 minuto sexagesimal = 1,0000 min centesimal (100 centésimos).
   - Armazenamento de voltas (Laps) e histórico de versões com timestamp.

3. Cálculos de Engenharia Industrial:
   - Tempo Normal (TN): TN = TC * (Ritmo / 100)
   - Tempo Padrão (TP): TP = TN * (1 + Tolerância / 100)
   - Produção por Hora (PPH): PPH = 3600 / TP_segundos (ou 60 / TP_minutos)
   - Produção Diária Estimada (PPD): PPD = PPH * 8,8 horas (528 minutos úteis)
   - Postos de Trabalho Necessários: N = Demanda Total Diária / Produção por Dia
   - Alerta visual de gargalo de produção quando N > 2,0 postos.

4. Tolerâncias Westinghouse e Ritmo de Trabalho:
   - Slider de Ritmo de Trabalho (50% a 150%) com presets (85% Lento, 100% Normal, 115% Ágil, 125% Acelerado).
   - Slider de Tolerância de Fadiga (0% a 40%) com classificação automática: Leve (<=12%), Moderado (13-18%), Pesado (>18%).
   - Templates Westinghouse pré-configurados (Montagem Eletrônica, Costura Industrial, Usinagem CNC, Estamparia, Embalagem/Paletização, Solda Pesada).

5. Sugestões de Otimização e Inteligência Lean:
   - Detecção automática de gargalos (postos > 2), operações desproporcionalmente longas (>1.6x da média), fadiga crítica (>18%) e oportunidades de automação.
   - Integração com IA generativa (Gemini) para planos de ação Kaizen, 5S, ergonomia (NR-17) e estimativa de ganhos percentuais.

6. Relatórios Técnicos e Impressão:
   - Folha de cronoanálise formatada em A4 para impressão direta ou exportação em PDF.
   - Relatório Simplificado por Operação e Relatório Geral da Linha de Produção com assinaturas técnicas.

7. Persistência e Google Drive:
   - Sincronização em nuvem com status de conexão Google OAuth.
   - Exportação e importação de backups completos em JSON e planilhas CSV para Google Sheets.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(masterPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Prompt de Engenharia & Especificação Técnica
              </h2>
              <p className="text-xs text-slate-400">
                Diretrizes de desenvolvimento, arquitetura e fórmulas industriais
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950 leading-relaxed whitespace-pre-wrap select-all">
          {masterPromptText}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Prompt Completo'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
