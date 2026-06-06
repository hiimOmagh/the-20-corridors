import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runExportVisualQa } from './exportVisualQa';
import { runLocalExportReadiness } from './localExportReadiness';

export const EXPORT_SMOKE_CONTRACT_SCHEMA_VERSION = 'phase-4.4-export-smoke-contract-v1' as const;
export const EXPORT_SMOKE_CONTRACT_ID = 'phase-4-export-smoke-contract' as const;

export interface ExportSmokeContractOptions {
  readonly repoRoot?: string;
}

export interface ExportSmokeContractReport {
  readonly schemaVersion: typeof EXPORT_SMOKE_CONTRACT_SCHEMA_VERSION;
  readonly smokeId: typeof EXPORT_SMOKE_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-4-local-export-smoke';
    readonly localExportReadinessSchemaVersion: string;
    readonly exportVisualQaSchemaVersion: string;
  };
  readonly gates: {
    readonly localExportReadinessPassed: boolean;
    readonly exportVisualQaPassed: boolean;
    readonly smokeScriptExists: boolean;
    readonly validateScriptRunsExportSmoke: boolean;
    readonly exportSmokeStatusDocExists: boolean;
    readonly phase4ClosureCriteriaDocExists: boolean;
    readonly shareImageExportRuntimeExists: boolean;
    readonly shareCardActionSurfaceExists: boolean;
    readonly downloadContractVisibleInUi: boolean;
    readonly localOnlyRuntimeSignalsPreserved: boolean;
    readonly noRawAnswerLeakageInExportSmoke: boolean;
    readonly noFullResultSerializationExport: boolean;
    readonly noBackendAiAuthPaymentPersistenceScope: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly exportSmokeStatus: string;
    readonly phase4ClosureCriteria: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly smokeExport?: string;
  };
  readonly surfaces: {
    readonly checkedFiles: readonly string[];
    readonly runtimeSignals: readonly string[];
    readonly uiSignals: readonly string[];
    readonly missingRuntimeSignals: readonly string[];
    readonly missingUiSignals: readonly string[];
  };
  readonly privacy: {
    readonly rawAnswerLeakageSignals: readonly string[];
    readonly serializationExportSignals: readonly string[];
    readonly backendAiAuthPaymentPersistenceSignals: readonly string[];
  };
  readonly coverage: {
    readonly localExportReadinessIssueCount: number;
    readonly exportVisualQaIssueCount: number;
    readonly checkedFileCount: number;
    readonly runtimeSignalCount: number;
    readonly uiSignalCount: number;
    readonly rawLeakageIssueCount: number;
    readonly blockedScopeIssueCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const EXPORT_SMOKE_STATUS_DOC = 'docs/ui/phase-4-4-phase-4-closure-gate-export-smoke-contract-status.md';
const PHASE_4_CLOSURE_CRITERIA_DOC = 'docs/release/phase-4-closure-criteria.md';
const SHARE_IMAGE_EXPORT_FILE = 'src/features/results/resultShareImageExport.ts';
const RESULTS_CLIENT_FILE = 'src/features/results/ResultsClient.tsx';
const SHARE_CARD_FILE = 'src/features/results/resultShareCard.ts';

const CHECKED_EXPORT_FILES = [
  SHARE_IMAGE_EXPORT_FILE,
  RESULTS_CLIENT_FILE,
  SHARE_CARD_FILE
] as const;

const RUNTIME_SIGNALS = [
  'buildLocalShareCardExportSvg',
  'exportLocalShareCardPng',
  'buildLocalShareImageFileName',
  'buildLocalShareImageExportUxDetails',
  'getLocalShareImageExportCapability',
  'canvas.toBlob',
  'window.URL.createObjectURL',
  'anchor.download',
  'window.URL.revokeObjectURL',
  'LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE'
] as const;

const UI_SIGNALS = [
  'Export PNG locally',
  'Copy card text',
  'Filename',
  'Size',
  'Capability',
  'Local PNG export details',
  'Local export privacy boundary',
  'PNG export is generated locally from this share-card summary only',
  'It does not export the answer list, full result JSON, or a public URL'
] as const;

const RAW_ANSWER_SIGNALS = [
  'result.answers',
  '.answers.map',
  'answerText',
  'questionId',
  'selectedAnswer',
  'raw answer',
  'raw-answer'
] as const;

const SERIALIZATION_EXPORT_SIGNALS = [
  'serializeCorridorsResult',
  'serializeCorridorsResultEnvelope',
  'buildSerializableCorridorsResult',
  'deserializeCorridorsResult',
  'sessionStorage.setItem(\'corridors-result-export',
  'sessionStorage.setItem("corridors-result-export'
] as const;

const BLOCKED_SCOPE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'new PrismaClient',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'localStorage.setItem',
  'indexedDB.open'
] as const;

export function runExportSmokeContract(options: ExportSmokeContractOptions = {}): ExportSmokeContractReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const localExportReadiness = runLocalExportReadiness({ repoRoot });
  const exportVisualQa = runExportVisualQa({ repoRoot });
  const shareImageExportSource = readOptionalFile(repoRoot, SHARE_IMAGE_EXPORT_FILE);
  const resultsClientSource = readOptionalFile(repoRoot, RESULTS_CLIENT_FILE);
  const combinedSource = CHECKED_EXPORT_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const exportSummarySource = [shareImageExportSource, readOptionalFile(repoRoot, SHARE_CARD_FILE)].join('\n');
  const exportUiSource = [resultsClientSource, shareImageExportSource].join('\n');

  const missingRuntimeSignals = RUNTIME_SIGNALS.filter((signal) => !shareImageExportSource.includes(signal));
  const missingUiSignals = UI_SIGNALS.filter((signal) => !exportUiSource.includes(signal));
  const rawAnswerLeakageSignals = findSignals(exportSummarySource, RAW_ANSWER_SIGNALS);
  const serializationExportSignals = findSignals(combinedSource, SERIALIZATION_EXPORT_SIGNALS);
  const backendAiAuthPaymentPersistenceSignals = findSignals(combinedSource, BLOCKED_SCOPE_SIGNALS);
  const existingCheckedFiles = CHECKED_EXPORT_FILES.filter((file) => existsSync(path.join(repoRoot, file)));

  const gates = {
    localExportReadinessPassed: localExportReadiness.gates.overallPassed,
    exportVisualQaPassed: exportVisualQa.gates.overallPassed,
    smokeScriptExists: packageJson.scripts?.['smoke:export'] === 'tsx scripts/export-smoke-contract.ts',
    validateScriptRunsExportSmoke: Boolean(packageJson.scripts?.validate?.includes('npm run smoke:export')),
    exportSmokeStatusDocExists: existsSync(path.join(repoRoot, EXPORT_SMOKE_STATUS_DOC)),
    phase4ClosureCriteriaDocExists: existsSync(path.join(repoRoot, PHASE_4_CLOSURE_CRITERIA_DOC)),
    shareImageExportRuntimeExists: existsSync(path.join(repoRoot, SHARE_IMAGE_EXPORT_FILE)),
    shareCardActionSurfaceExists: resultsClientSource.includes('exportShareCardImage') && resultsClientSource.includes('exportLocalShareCardPng'),
    downloadContractVisibleInUi: missingUiSignals.length === 0,
    localOnlyRuntimeSignalsPreserved: missingRuntimeSignals.length === 0,
    noRawAnswerLeakageInExportSmoke: rawAnswerLeakageSignals.length === 0,
    noFullResultSerializationExport: serializationExportSignals.length === 0,
    noBackendAiAuthPaymentPersistenceScope: backendAiAuthPaymentPersistenceSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: EXPORT_SMOKE_CONTRACT_SCHEMA_VERSION,
    smokeId: EXPORT_SMOKE_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-4-local-export-smoke',
      localExportReadinessSchemaVersion: localExportReadiness.schemaVersion,
      exportVisualQaSchemaVersion: exportVisualQa.schemaVersion
    },
    gates: completeGates,
    docs: {
      exportSmokeStatus: EXPORT_SMOKE_STATUS_DOC,
      phase4ClosureCriteria: PHASE_4_CLOSURE_CRITERIA_DOC
    },
    scripts: buildScriptSummary(packageJson),
    surfaces: {
      checkedFiles: CHECKED_EXPORT_FILES,
      runtimeSignals: RUNTIME_SIGNALS,
      uiSignals: UI_SIGNALS,
      missingRuntimeSignals,
      missingUiSignals
    },
    privacy: {
      rawAnswerLeakageSignals,
      serializationExportSignals,
      backendAiAuthPaymentPersistenceSignals
    },
    coverage: {
      localExportReadinessIssueCount: localExportReadiness.issues.length,
      exportVisualQaIssueCount: exportVisualQa.issues.length,
      checkedFileCount: existingCheckedFiles.length,
      runtimeSignalCount: RUNTIME_SIGNALS.length - missingRuntimeSignals.length,
      uiSignalCount: UI_SIGNALS.length - missingUiSignals.length,
      rawLeakageIssueCount: rawAnswerLeakageSignals.length,
      blockedScopeIssueCount: backendAiAuthPaymentPersistenceSignals.length
    },
    issues: buildIssues(completeGates, localExportReadiness.issues, exportVisualQa.issues, {
      missingRuntimeSignals,
      missingUiSignals,
      rawAnswerLeakageSignals,
      serializationExportSignals,
      backendAiAuthPaymentPersistenceSignals
    })
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): ExportSmokeContractReport['scripts'] {
  const scripts: { validate?: string; smokeExport?: string } = {};
  const validate = packageJson.scripts?.validate;
  const smokeExport = packageJson.scripts?.['smoke:export'];

  if (validate !== undefined) scripts.validate = validate;
  if (smokeExport !== undefined) scripts.smokeExport = smokeExport;

  return scripts;
}

function buildIssues(
  gates: ExportSmokeContractReport['gates'],
  localExportReadinessIssues: readonly string[],
  exportVisualQaIssues: readonly string[],
  signals: Readonly<{
    missingRuntimeSignals: readonly string[];
    missingUiSignals: readonly string[];
    rawAnswerLeakageSignals: readonly string[];
    serializationExportSignals: readonly string[];
    backendAiAuthPaymentPersistenceSignals: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`export_smoke_gate_failed:${key}`);
    }
  }

  for (const issue of localExportReadinessIssues) issues.push(`export_smoke_readiness_issue:${issue}`);
  for (const issue of exportVisualQaIssues) issues.push(`export_smoke_visual_qa_issue:${issue}`);
  for (const signal of signals.missingRuntimeSignals) issues.push(`export_smoke_missing_runtime_signal:${signal}`);
  for (const signal of signals.missingUiSignals) issues.push(`export_smoke_missing_ui_signal:${signal}`);
  for (const signal of signals.rawAnswerLeakageSignals) issues.push(`export_smoke_raw_answer_leakage:${signal}`);
  for (const signal of signals.serializationExportSignals) issues.push(`export_smoke_serialization_export:${signal}`);
  for (const signal of signals.backendAiAuthPaymentPersistenceSignals) issues.push(`export_smoke_blocked_scope:${signal}`);

  return issues;
}

function findSignals(source: string, signals: readonly string[]): string[] {
  const lowerSource = source.toLowerCase();
  return signals.filter((signal) => lowerSource.includes(signal.toLowerCase()));
}

function readOptionalFile(repoRoot: string, relativeFile: string): string {
  const absolutePath = path.join(repoRoot, relativeFile);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');

  if (!existsSync(packageJsonPath)) return {};

  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;
  if (!isRecord(parsed) || !isRecordOfStrings(parsed.scripts)) return {};

  return { scripts: parsed.scripts };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === 'string');
}
