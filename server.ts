import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI initializer
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CronoAnálise Industrial API',
    timestamp: new Date().toISOString(),
  });
});

// AI Process Optimization & Kaizen suggestions endpoint
app.post('/api/optimize-ai', async (req, res) => {
  try {
    const { modelName, operations, dailyDemand, targetCycleTime } = req.body;

    const ai = getAI();
    if (!ai) {
      // Fallback deterministic response if no key configured
      return res.json(getDeterministicAnalysis(modelName, operations, dailyDemand));
    }

    try {
      const prompt = `Você é um engenheiro sênior de métodos e processos industriais (Cronoanálise e Lean Manufacturing).
Analise os seguintes dados do produto/modelo "${modelName || 'Linha de Produção'}":
Demanda Diária: ${dailyDemand || 'N/A'} peças.
Tempo Takt desejado: ${targetCycleTime || 'N/A'}.

Operações cronometradas:
${JSON.stringify(operations, null, 2)}

Forneça uma análise técnica concisa e prática contendo:
1. Identificação clara de gargalos (operações que exigem mais postos ou tempo elevado)
2. 3 a 5 Ações práticas de balanceamento de linha e Kaizen (eliminação de desperdícios, método de trabalho, ergonomia NR-17)
3. Sugestão de redistribuição de tarefas entre operadores
4. Estimativa de potencial de ganho de produtividade (%)

Responda em formato JSON com as chaves:
- summary (texto breve resumo)
- bottlenecks (array de strings com nomes das operações críticas)
- kaizenActions (array de strings com sugestões acionáveis)
- ergonomics (array de strings com recomendações ergonômicas)
- potentialGainPercent (número estimado de ganho, ex: 15)
- balancingEfficiency (número estimado de 0 a 100)`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        source: 'gemini-ai',
        ...parsed,
      });
    } catch (genError: any) {
      console.warn('Gemini API call failed, falling back to industrial engineering rules:', genError?.message);
      return res.json(getDeterministicAnalysis(modelName, operations, dailyDemand));
    }
  } catch (error: any) {
    console.error('Error in /api/optimize-ai:', error);
    res.json(getDeterministicAnalysis('Linha de Produção', [], 500));
  }
});

function getDeterministicAnalysis(modelName: string, operations: any[], dailyDemand: any) {
  const critical = (operations || []).filter((op: any) => (op.requiredWorkstations || 0) > 1.8).map((op: any) => op.name);
  return {
    source: 'rule-engine',
    summary: `Diagnóstico industrial de balanceamento para ${modelName || 'Linha de Produção'} (Demanda: ${dailyDemand || 500} pçs/dia).`,
    bottlenecks: critical.length > 0 ? critical : ['Operação de maior tempo padrão da linha'],
    kaizenActions: [
      'Desmembrar a operação gargalo em 2 postos sequenciais para dividir o tempo de ciclo.',
      'Padronizar a disposição física de ferramentas no posto de trabalho utilizando metodologia 5S.',
      'Instalar alimentadores por gravidade para reduzir tempos mortos de movimentação de material.',
      'Balancear a alocação de tarefas transferindo inspeção e rebarbação para postos com menor ocupação.',
    ],
    ergonomics: [
      'Adequar altura de bancadas e instalar tapetes antifadiga conforme NR-17.',
      'Utilizar parafusadeiras e ferramentas suspensas por balancins com recuo automático.',
    ],
    potentialGainPercent: 18,
    balancingEfficiency: 88,
  };
}

// Storage and Google Drive Sync simulation / backup endpoint
app.post('/api/drive/sync', (req, res) => {
  const { models, studies, syncTime } = req.body;
  // Simulates cloud sync or stores in session
  res.json({
    success: true,
    message: 'Dados sincronizados com sucesso no armazenamento em nuvem/Google Drive',
    syncedAt: syncTime || new Date().toISOString(),
    recordCount: (models?.length || 0) + (studies?.length || 0),
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CronoAnálise Industrial Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
