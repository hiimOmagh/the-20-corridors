import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase3ClosureGate } from './phase3ClosureGate';

export const LOCAL_EXPORT_READINESS_SCHEMA_VERSION = 'phase-4.1-local-export-readiness-v1' as const;
export const LOCAL_EXPORT_READINESS_ID = 'phase-4-local-result-export-readiness' as const;

export interface LocalExportReadinessOptions {
  readonly repoRoot?: string;
}

export interface LocalExportReadinessReport {
  readonly schemaVersion: typeof LOCAL_EXPORT_READINESS_SCHEMA_VERSION;
  readonly readinessId: typeof LOCAL_EXPORT_READINESS_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-4-local-export-readiness';
    readonly phase3ClosureSchemaVersion: string;
    readonly exportMode: 'local-share-card-image-export-prototype';
  };
  readonly gates: {
    readonly phase3ClosurePassed: boolean;
    readonly readinessScriptExists: boolean;
    readonly validateScriptRunsExportReadiness: boolean;
    readonly exportReadinessContractDocExists: boolean;
    readonly phase4StatusDocExists: boolean;
    readonly localOnlyExportSurfacesDefined: boolean;
    readonly noRawAnswerLeakageInExportSurface: boolean;
    readonly noFullResultSerializationExport: boolean;
    readonly localImageExportPrototypeExists: boolean;
    readonly approvedLocalImageExportImplementation: boolean;
    readonly noDisallowedImageExportImplementation: boolean;
    readonly noBackendAiAuthPaymentPersistenceScope: boolean;
    readonly allowedExportSurfaceUsesShareCardModel: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly exportReadinessContract: string;
    readonly phase4Status: string;
    readonly phase4Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly readinessExport?: string;
  };
  readonly surfaces: {
    readonly allowedLocalExportSurfaces: readonly string[];
    readonly checkedFiles: readonly string[];
    readonly shareCardFile: string;
    readonly resultClientFile: string;
  };
  readonly privacy: {
    readonly rawAnswerLeakageSignals: readonly string[];
    readonly serializationExportSignals: readonly string[];
    readonly approvedImageExportSignals: readonly string[];
    readonly disallowedImageExportSignals: readonly string[];
    readonly backendAiAuthPaymentPersistenceSignals: readonly string[];
  };
  readonly coverage: {
    readonly checkedFileCount: number;
    readonly phase3ClosureIssueCount: number;
    readonly rawLeakageIssueCount: number;
    readonly implementationIssueCount: number;
    readonly approvedImageExportSignalCount: number;
    readonly blockedScopeIssueCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const EXPORT_READINESS_CONTRACT_DOC = 'docs/release/phase-4-local-result-export-readiness-contract.md';
const PHASE_4_STATUS_DOC = 'docs/ui/phase-4-0-local-result-export-readiness-contract-status.md';
const PHASE_4_TRANSITION_DOC = 'docs/ui/phase-4-transition-plan.md';

const SHARE_CARD_FILE = 'src/features/results/resultShareCard.ts';
const RESULT_CLIENT_FILE = 'src/features/results/ResultsClient.tsx';
const SHARE_IMAGE_EXPORT_FILE = 'src/features/results/resultShareImageExport.ts';

const ALLOWED_LOCAL_EXPORT_SURFACES = [
  'local-share-card-preview',
  'copy-ready-share-card-text',
  'local-image-export-from-share-card-only'
] as const;

const CHECKED_EXPORT_FILES = [
  SHARE_CARD_FILE,
  RESULT_CLIENT_FILE,
  SHARE_IMAGE_EXPORT_FILE,
  'src/app/results/page.tsx'
] as const;

const RAW_ANSWER_CHECK_FILES = [
  SHARE_CARD_FILE,
  SHARE_IMAGE_EXPORT_FILE
] as const;

const SHARE_CARD_RAW_ANSWER_LEAKAGE_SIGNALS = [
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

const APPROVED_IMAGE_EXPORT_IMPLEMENTATION_SIGNALS = [
  'buildLocalShareCardExportSvg',
  'exportLocalShareCardPng',
  'LocalShareCardPreview',
  'canvas.toBlob',
  'URL.createObjectURL',
  'new Blob(',
  'anchor.download'
] as const;

const DISALLOWED_IMAGE_EXPORT_IMPLEMENTATION_SIGNALS = [
  'html2canvas',
  'toDataURL',
  'FileSaver',
  'saveAs(',
  'serializeCorridorsResultEnvelope',
  'buildSerializableCorridorsResult'
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

export function runLocalExportReadiness(options: LocalExportReadinessOptions = {}): LocalExportReadinessReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const phase3Closure = runPhase3ClosureGate({ repoRoot });

  const exportReadinessContractDocExists = existsSync(path.join(repoRoot, EXPORT_READINESS_CONTRACT_DOC));
  const phase4StatusDocExists = existsSync(path.join(repoRoot, PHASE_4_STATUS_DOC));
  const readinessScriptExists = packageJson.scripts?.['readiness:export'] === 'tsx scripts/local-export-readiness.ts';
  const validateScriptRunsExportReadiness = Boolean(packageJson.scripts?.validate?.includes('npm run readiness:export'));
  const existingCheckedFiles = CHECKED_EXPORT_FILES.filter((relativeFile) => existsSync(path.join(repoRoot, relativeFile)));
  const localOnlyExportSurfacesDefined =
    ALLOWED_LOCAL_EXPORT_SURFACES.length === 3 &&
    existingCheckedFiles.includes(SHARE_CARD_FILE) &&
    existingCheckedFiles.includes(SHARE_IMAGE_EXPORT_FILE);
  const rawAnswerLeakageSignals = findSignals(repoRoot, RAW_ANSWER_CHECK_FILES, SHARE_CARD_RAW_ANSWER_LEAKAGE_SIGNALS);
  const serializationExportSignals = findSignals(repoRoot, CHECKED_EXPORT_FILES, SERIALIZATION_EXPORT_SIGNALS);
  const approvedImageExportSignals = findSignals(repoRoot, [SHARE_IMAGE_EXPORT_FILE], APPROVED_IMAGE_EXPORT_IMPLEMENTATION_SIGNALS);
  const disallowedImageExportSignals = findSignals(repoRoot, CHECKED_EXPORT_FILES, DISALLOWED_IMAGE_EXPORT_IMPLEMENTATION_SIGNALS);
  const backendAiAuthPaymentPersistenceSignals = findSignals(repoRoot, CHECKED_EXPORT_FILES, BLOCKED_SCOPE_SIGNALS);
  const resultClientSource = readOptionalFile(repoRoot, RESULT_CLIENT_FILE);
  const shareCardSource = readOptionalFile(repoRoot, SHARE_CARD_FILE);
  const shareImageExportSource = readOptionalFile(repoRoot, SHARE_IMAGE_EXPORT_FILE);
  const localImageExportPrototypeExists =
    shareImageExportSource.includes('LOCAL_SHARE_IMAGE_EXPORT_SCHEMA_VERSION') &&
    shareImageExportSource.includes('buildLocalShareCardExportSvg') &&
    shareImageExportSource.includes('exportLocalShareCardPng');
  const approvedLocalImageExportImplementation =
    APPROVED_IMAGE_EXPORT_IMPLEMENTATION_SIGNALS.every((signal) => shareImageExportSource.includes(signal));
  const allowedExportSurfaceUsesShareCardModel =
    resultClientSource.includes('buildLocalShareCardPreview') &&
    resultClientSource.includes('exportLocalShareCardPng') &&
    shareCardSource.includes('buildLocalShareCardPreview') &&
    shareCardSource.includes('SHARE_CARD_COPY_BOUNDARY_NOTE') &&
    shareImageExportSource.includes('LocalShareCardPreview');

  const gates = {
    phase3ClosurePassed: phase3Closure.gates.overallPassed,
    readinessScriptExists,
    validateScriptRunsExportReadiness,
    exportReadinessContractDocExists,
    phase4StatusDocExists,
    localOnlyExportSurfacesDefined,
    noRawAnswerLeakageInExportSurface: rawAnswerLeakageSignals.length === 0,
    noFullResultSerializationExport: serializationExportSignals.length === 0,
    localImageExportPrototypeExists,
    approvedLocalImageExportImplementation,
    noDisallowedImageExportImplementation: disallowedImageExportSignals.length === 0,
    noBackendAiAuthPaymentPersistenceScope: backendAiAuthPaymentPersistenceSignals.length === 0,
    allowedExportSurfaceUsesShareCardModel,
    overallPassed: false
  };

  const overallPassed = Object.entries(gates)
    .filter(([key]) => key !== 'overallPassed')
    .every(([, value]) => value === true);
  const completeGates = { ...gates, overallPassed };

  return {
    schemaVersion: LOCAL_EXPORT_READINESS_SCHEMA_VERSION,
    readinessId: LOCAL_EXPORT_READINESS_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-4-local-export-readiness',
      phase3ClosureSchemaVersion: phase3Closure.schemaVersion,
      exportMode: 'local-share-card-image-export-prototype'
    },
    gates: completeGates,
    docs: {
      exportReadinessContract: EXPORT_READINESS_CONTRACT_DOC,
      phase4Status: PHASE_4_STATUS_DOC,
      phase4Transition: PHASE_4_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    surfaces: {
      allowedLocalExportSurfaces: ALLOWED_LOCAL_EXPORT_SURFACES,
      checkedFiles: CHECKED_EXPORT_FILES,
      shareCardFile: SHARE_CARD_FILE,
      resultClientFile: RESULT_CLIENT_FILE
    },
    privacy: {
      rawAnswerLeakageSignals,
      serializationExportSignals,
      approvedImageExportSignals,
      disallowedImageExportSignals,
      backendAiAuthPaymentPersistenceSignals
    },
    coverage: {
      checkedFileCount: existingCheckedFiles.length,
      phase3ClosureIssueCount: phase3Closure.issues.length,
      rawLeakageIssueCount: rawAnswerLeakageSignals.length,
      implementationIssueCount: serializationExportSignals.length + disallowedImageExportSignals.length,
      approvedImageExportSignalCount: approvedImageExportSignals.length,
      blockedScopeIssueCount: backendAiAuthPaymentPersistenceSignals.length
    },
    issues: buildIssues(completeGates, phase3Closure.issues, {
      rawAnswerLeakageSignals,
      serializationExportSignals,
      approvedImageExportSignals,
      disallowedImageExportSignals,
      backendAiAuthPaymentPersistenceSignals
    })
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): LocalExportReadinessReport['scripts'] {
  const scripts: { validate?: string; readinessExport?: string } = {};
  const validate = packageJson.scripts?.validate;
  const readinessExport = packageJson.scripts?.['readiness:export'];

  if (validate !== undefined) scripts.validate = validate;
  if (readinessExport !== undefined) scripts.readinessExport = readinessExport;

  return scripts;
}

function buildIssues(
  gates: LocalExportReadinessReport['gates'],
  phase3ClosureIssues: readonly string[],
  signalGroups: Pick<
    LocalExportReadinessReport['privacy'],
    | 'rawAnswerLeakageSignals'
    | 'serializationExportSignals'
    | 'approvedImageExportSignals'
    | 'disallowedImageExportSignals'
    | 'backendAiAuthPaymentPersistenceSignals'
  >
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`local_export_readiness_gate_failed:${key}`);
    }
  }

  for (const issue of phase3ClosureIssues) {
    issues.push(`local_export_phase3_closure_issue:${issue}`);
  }

  for (const signal of signalGroups.rawAnswerLeakageSignals) {
    issues.push(`local_export_raw_answer_leakage:${signal}`);
  }

  for (const signal of signalGroups.serializationExportSignals) {
    issues.push(`local_export_full_serialization_signal:${signal}`);
  }

  for (const signal of signalGroups.disallowedImageExportSignals) {
    issues.push(`local_export_disallowed_image_export_signal:${signal}`);
  }

  for (const signal of signalGroups.backendAiAuthPaymentPersistenceSignals) {
    issues.push(`local_export_blocked_scope_signal:${signal}`);
  }

  return issues;
}

function findSignals(repoRoot: string, files: readonly string[], signals: readonly string[]): string[] {
  const found: string[] = [];

  for (const relativeFile of files) {
    const source = readOptionalFile(repoRoot, relativeFile);
    if (source.length === 0) continue;
    const lowerSource = source.toLowerCase();

    for (const signal of signals) {
      if (lowerSource.includes(signal.toLowerCase())) {
        found.push(`${relativeFile}:${signal}`);
      }
    }
  }

  return found.sort();
}

function readOptionalFile(repoRoot: string, relativeFile: string): string {
  const absolutePath = path.join(repoRoot, relativeFile);
  if (!existsSync(absolutePath)) return '';
  return readFileSync(absolutePath, 'utf8');
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
