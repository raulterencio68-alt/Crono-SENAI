import { Operation, ProductModel, TimingHistoryRecord } from '../types';
import { calculateOperationMetrics } from './industrialMath';

const STORAGE_KEY_MODELS = 'crono_industrial_models_v1';
const STORAGE_KEY_OPERATIONS = 'crono_industrial_operations_v1';
const STORAGE_KEY_ACTIVE_MODEL = 'crono_industrial_active_model_id';
const STORAGE_KEY_DRIVE_CONFIG = 'crono_industrial_drive_config';

export interface DriveConfig {
  isConnected: boolean;
  userEmail: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  folderName: string;
}

const DEFAULT_DRIVE_CONFIG: DriveConfig = {
  isConnected: true, // Default connected with the user's workspace email
  userEmail: 'raulterencio68@gmail.com',
  lastSyncedAt: new Date().toISOString(),
  autoSync: true,
  folderName: 'CronoAnálise Industrial / Backup',
};

// Seed inicial com dados industriais ricos
const SEED_MODELS: ProductModel[] = [
  {
    id: 'mod-valvula-450',
    code: 'VCI-450',
    name: 'Válvula de Controle Industrial VCI-450',
    description: 'Linha de fabricação e montagem de válvulas flangeadas para controle de fluidos industriais.',
    dailyDemand: 450,
    workdayHours: 8.8,
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-08T10:30:00Z',
    version: 3,
  },
  {
    id: 'mod-modulo-ecu',
    code: 'ECU-24V',
    name: 'Módulo de Controle Eletrônico ECU-24V',
    description: 'Montagem mecânica e testes de estanqueidade de módulo automotivo blindado.',
    dailyDemand: 600,
    workdayHours: 8.8,
    createdAt: '2026-09-03T09:00:00Z',
    updatedAt: '2026-09-08T11:00:00Z',
    version: 2,
  },
];

function createSeedOperations(): Operation[] {
  const opDefs = [
    {
      id: 'op-1',
      modelId: 'mod-valvula-450',
      name: '010 - Usinagem do Corpo e Alojamento',
      description: 'Torneamento CNC e faceamento dos flanges com fixação hidráulica.',
      type: 'machine' as const,
      workstationName: 'Torno CNC Mazak 01',
      observedSeconds: 85, // 01:25
      performanceRating: 100,
      fatigueAllowance: 14,
      preset: 'Usinagem em Torno / Centro CNC',
    },
    {
      id: 'op-2',
      modelId: 'mod-valvula-450',
      name: '020 - Rebarbação e Limpeza Técnica',
      description: 'Eliminação manual de rebarbas internas com lixa rotativa e jato de ar comprimido.',
      type: 'manual' as const,
      workstationName: 'Bancada de Acabamento 01',
      observedSeconds: 42, // 00:42
      performanceRating: 95,
      fatigueAllowance: 12,
      preset: 'Costura Industrial / Bancada',
    },
    {
      id: 'op-3',
      modelId: 'mod-valvula-450',
      name: '030 - Soldagem TIG do Flange de Entrada',
      description: 'Soldagem circunferencial em atmosfera inerte com gás argônio e arame inox.',
      type: 'manual' as const,
      workstationName: 'Célula de Solda TIG 02',
      observedSeconds: 155, // 02:35 - Gargalo crítico (> 2 postos)
      performanceRating: 105,
      fatigueAllowance: 22,
      preset: 'Fundição / Solda Pesada',
    },
    {
      id: 'op-4',
      modelId: 'mod-valvula-450',
      name: '040 - Montagem do Obturador e Molas',
      description: 'Inserção do eixo, gaxetas de teflon e assentamento de mola com torquímetro.',
      type: 'manual' as const,
      workstationName: 'Bancada de Montagem 03',
      observedSeconds: 65, // 01:05
      performanceRating: 100,
      fatigueAllowance: 12,
      preset: 'Montagem Eletrônica Leve',
    },
    {
      id: 'op-5',
      modelId: 'mod-valvula-450',
      name: '050 - Teste Hidrostático e Estanqueidade',
      description: 'Pressurização a 25 bar com água desmineralizada e verificação de fuga na sede.',
      type: 'machine' as const,
      workstationName: 'Dispositivo Hidrostático ATE',
      observedSeconds: 70, // 01:10
      performanceRating: 100,
      fatigueAllowance: 10,
      preset: 'Montagem Eletrônica Leve',
    },
    {
      id: 'op-6',
      modelId: 'mod-valvula-450',
      name: '060 - Embalagem e Paletização',
      description: 'Envelopamento anticorrosivo VCI, colocação em caixa de papelão e fixação no palete.',
      type: 'manual' as const,
      workstationName: 'Posto de Embalagem Final',
      observedSeconds: 50, // 00:50
      performanceRating: 110,
      fatigueAllowance: 18,
      preset: 'Embalagem e Paletização Manual',
    },
    // Modelo ECU
    {
      id: 'op-ecu-1',
      modelId: 'mod-modulo-ecu',
      name: '010 - Solda de Conectores Automotivos',
      description: 'Soldagem manual com ferro termocontrolado e aspiração de fumos.',
      type: 'manual' as const,
      workstationName: 'Bancada ESD 01',
      observedSeconds: 48,
      performanceRating: 100,
      fatigueAllowance: 12,
      preset: 'Costura Industrial / Bancada',
    },
    {
      id: 'op-ecu-2',
      modelId: 'mod-modulo-ecu',
      name: '020 - Parafusamento no Dissipador',
      description: 'Aplicação de pasta térmica e aperto cruzado de 4 parafusos com torque de 1.8 Nm.',
      type: 'manual' as const,
      workstationName: 'Bancada de Montagem ESD',
      observedSeconds: 38,
      performanceRating: 105,
      fatigueAllowance: 10,
      preset: 'Montagem Eletrônica Leve',
    },
    {
      id: 'op-ecu-3',
      modelId: 'mod-modulo-ecu',
      name: '030 - Teste em Fim de Linha (EOL)',
      description: 'Conexão na giga de testes automáticos com varredura de sinais CAN e I/O.',
      type: 'machine' as const,
      workstationName: 'Giga de Teste EOL Automática',
      observedSeconds: 55,
      performanceRating: 100,
      fatigueAllowance: 10,
      preset: 'Montagem Eletrônica Leve',
    },
  ];

  return opDefs.map((def) => {
    const metrics = calculateOperationMetrics(
      def.observedSeconds,
      def.performanceRating,
      def.fatigueAllowance,
      def.modelId === 'mod-valvula-450' ? 450 : 600,
      8.8
    );

    const historyRecord: TimingHistoryRecord = {
      id: `hist-${def.id}-1`,
      timestamp: '2026-09-05T14:30:00Z',
      sexagesimalSeconds: def.observedSeconds,
      sexagesimalFormatted: metrics.observedTimeFormatted,
      centesimalMinutes: metrics.centesimalMinutes,
      performanceRating: def.performanceRating,
      fatigueAllowance: def.fatigueAllowance,
      standardTimeMinutes: metrics.standardTimeMinutes,
      piecesPerHour: metrics.piecesPerHour,
      recordedBy: 'Eng. Raul Terêncio',
      note: 'Cronometragem inicial de homologação da linha.',
    };

    return {
      id: def.id,
      modelId: def.modelId,
      name: def.name,
      description: def.description,
      type: def.type,
      workstationName: def.workstationName,
      ...metrics,
      westinghousePreset: def.preset,
      lastTimedAt: '2026-09-05T14:30:00Z',
      history: [historyRecord],
    };
  });
}

export function loadModels(): ProductModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MODELS);
    if (!raw) {
      saveModels(SEED_MODELS);
      return SEED_MODELS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading models from storage:', err);
    return SEED_MODELS;
  }
}

export function saveModels(models: ProductModel[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODELS, JSON.stringify(models));
  } catch (err) {
    console.error('Error saving models to storage:', err);
  }
}

export function loadOperations(): Operation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPERATIONS);
    if (!raw) {
      const initial = createSeedOperations();
      saveOperations(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading operations from storage:', err);
    return createSeedOperations();
  }
}

export function saveOperations(operations: Operation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_OPERATIONS, JSON.stringify(operations));
  } catch (err) {
    console.error('Error saving operations to storage:', err);
  }
}

export function loadActiveModelId(models: ProductModel[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_MODEL);
    if (saved && models.some((m) => m.id === saved)) {
      return saved;
    }
    return models[0]?.id || '';
  } catch {
    return models[0]?.id || '';
  }
}

export function saveActiveModelId(modelId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_MODEL, modelId);
  } catch (err) {
    console.error('Error saving active model id:', err);
  }
}

export function loadDriveConfig(): DriveConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRIVE_CONFIG);
    if (!raw) return DEFAULT_DRIVE_CONFIG;
    return { ...DEFAULT_DRIVE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DRIVE_CONFIG;
  }
}

export function saveDriveConfig(config: DriveConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_DRIVE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving drive config:', err);
  }
}

/**
 * Exporta base completa no formato JSON para salvar no Google Drive ou download
 */
export function exportToDriveBackupJSON(models: ProductModel[], operations: Operation[]) {
  const payload = {
    appName: 'CronoAnálise Industrial',
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    models,
    operations,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cronoanalise-backup-google-drive-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exporta operações do modelo atual em CSV compatível com Excel / Google Sheets
 */
export function exportOperationsToCSV(model: ProductModel, operations: Operation[]) {
  const headers = [
    'Operacao',
    'Tipo',
    'Posto_Trabalho',
    'Tempo_Sexagesimal_MM_SS',
    'Segundos_Cronometrados',
    'Minutos_Centesimais_Cmin',
    'Ritmo_Desempenho_Pct',
    'Tolerancia_Westinghouse_Pct',
    'Classificacao_Fadiga',
    'Tempo_Normal_Seg',
    'Tempo_Padrao_Seg',
    'Tempo_Padrao_Min',
    'Producao_Por_Hora_PPH',
    'Producao_Por_Dia_PPD_8_8h',
    'Postos_Necessarios',
    'Gargalo_Critico',
    'Data_Ultima_Crono',
  ];

  const rows = operations.map((op) => [
    `"${op.name.replace(/"/g, '""')}"`,
    op.type,
    `"${(op.workstationName || '').replace(/"/g, '""')}"`,
    op.observedTimeFormatted,
    op.observedTimeSeconds,
    op.centesimalMinutes.toFixed(4),
    op.performanceRating,
    op.fatigueAllowance,
    op.fatigueClassification,
    op.normalTimeSeconds.toFixed(2),
    op.standardTimeSeconds.toFixed(2),
    op.standardTimeMinutes.toFixed(4),
    op.piecesPerHour.toFixed(2),
    op.piecesPerDay.toFixed(1),
    op.requiredWorkstations.toFixed(2),
    op.isBottleneck ? 'SIM' : 'NAO',
    op.lastTimedAt,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cronoanalise-${model.code.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
