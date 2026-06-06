import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runExportSmokeContract } from './exportSmokeContract';
import { runExportVisualQa } from './exportVisualQa';
import { runLocalExportReadiness } from './localExportReadiness';
import { runPhase3ClosureGate } from './phase3ClosureGate';

export const PHASE_4_CLOSURE_SCHEMA_VERSION = 'phase-4.4-closure-gate-v1' as const;
export const PHASE_4_CLOSURE_ID = 'phase-4-closure-gate' as const;

export interface Phase4ClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase4ClosureGateReport {
  readonly schemaVersion: typeof PHASE_4_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_4_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-4-closure';
    readonly phase3ClosureSchemaVersion: string;
    readonly localExportReadinessSchemaVersion: string;
    readonly exportVisualQaSchemaVersion: string;
    readonly exportSmokeSchemaVersion: string;
  };
  readonly gates: {
    readonly phase3ClosurePassed: boolean;
    readonly localExportReadinessPassed: boolean;
    readonly exportVisualQaPassed: boolean;
    readonly exportSmokeContractPassed: boolean;
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsPhase4ClosureGate: boolean;
    readonly validateScriptRunsExportSmoke: boolean;
    readonly phase4ClosureReviewDocExists: boolean;
    readonly phase5TransitionDocExists: boolean;
    readonly localOnlyExportScopePreserved: boolean;
    readonly noFullResultSerializationExportScope: boolean;
    readonly noBackendAiAuthPaymentPersistenceScope: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly phase4ClosureReview: string;
    readonly phase5Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly smokeExport?: string;
    readonly closurePhase4?: string;
  };
  readonly coverage: {
    readonly readinessIssueCount: number;
    readonly visualQaIssueCount: number;
    readonly exportSmokeIssueCount: number;
    readonly phase3ClosureIssueCount: number;
    readonly exportRuntimeSignalCount: number;
    readonly exportUiSignalCount: number;
    readonly checkedExportFileCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const PHASE_4_CLOSURE_REVIEW_DOC = 'docs/release/phase-4-closure-review.md';
const PHASE_5_TRANSITION_DOC = 'docs/ui/phase-5-transition-plan.md';

const EXPORT_SCOPE_FILES = [
  'src/features/results/resultShareImageExport.ts',
  'src/features/results/ResultsClient.tsx',
  'src/features/results/resultShareCard.ts'
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

export function runPhase4ClosureGate(options: Phase4ClosureGateOptions = {}): Phase4ClosureGateReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase3Closure = runPhase3ClosureGate({ repoRoot });
  const localExportReadiness = runLocalExportReadiness({ repoRoot });
  const exportVisualQa = runExportVisualQa({ repoRoot });
  const exportSmoke = runExportSmokeContract({ repoRoot });
  const exportSource = EXPORT_SCOPE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const serializationExportSignals = findSignals(exportSource, SERIALIZATION_EXPORT_SIGNALS);
  const blockedScopeSignals = findSignals(exportSource, BLOCKED_SCOPE_SIGNALS);

  const gates = {
    phase3ClosurePassed: phase3Closure.gates.overallPassed,
    localExportReadinessPassed: localExportReadiness.gates.overallPassed,
    exportVisualQaPassed: exportVisualQa.gates.overallPassed,
    exportSmokeContractPassed: exportSmoke.gates.overallPassed,
    closureScriptExists: packageJson.scripts?.['closure:phase4'] === 'tsx scripts/phase4-closure-gate.ts',
    validateScriptRunsPhase4ClosureGate: validateScript.includes('npm run closure:phase4'),
    validateScriptRunsExportSmoke: validateScript.includes('npm run smoke:export'),
    phase4ClosureReviewDocExists: existsSync(path.join(repoRoot, PHASE_4_CLOSURE_REVIEW_DOC)),
    phase5TransitionDocExists: existsSync(path.join(repoRoot, PHASE_5_TRANSITION_DOC)),
    localOnlyExportScopePreserved: exportSmoke.gates.localOnlyRuntimeSignalsPreserved && exportSmoke.gates.downloadContractVisibleInUi,
    noFullResultSerializationExportScope: serializationExportSignals.length === 0,
    noBackendAiAuthPaymentPersistenceScope: blockedScopeSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PHASE_4_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_4_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-4-closure',
      phase3ClosureSchemaVersion: phase3Closure.schemaVersion,
      localExportReadinessSchemaVersion: localExportReadiness.schemaVersion,
      exportVisualQaSchemaVersion: exportVisualQa.schemaVersion,
      exportSmokeSchemaVersion: exportSmoke.schemaVersion
    },
    gates: completeGates,
    docs: {
      phase4ClosureReview: PHASE_4_CLOSURE_REVIEW_DOC,
      phase5Transition: PHASE_5_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      readinessIssueCount: localExportReadiness.issues.length,
      visualQaIssueCount: exportVisualQa.issues.length,
      exportSmokeIssueCount: exportSmoke.issues.length,
      phase3ClosureIssueCount: phase3Closure.issues.length,
      exportRuntimeSignalCount: exportSmoke.coverage.runtimeSignalCount,
      exportUiSignalCount: exportSmoke.coverage.uiSignalCount,
      checkedExportFileCount: exportSmoke.coverage.checkedFileCount
    },
    issues: buildIssues(completeGates, {
      phase3ClosureIssues: phase3Closure.issues,
      localExportReadinessIssues: localExportReadiness.issues,
      exportVisualQaIssues: exportVisualQa.issues,
      exportSmokeIssues: exportSmoke.issues,
      serializationExportSignals,
      blockedScopeSignals
    })
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): Phase4ClosureGateReport['scripts'] {
  const scripts: { validate?: string; smokeExport?: string; closurePhase4?: string } = {};
  const validate = packageJson.scripts?.validate;
  const smokeExport = packageJson.scripts?.['smoke:export'];
  const closurePhase4 = packageJson.scripts?.['closure:phase4'];

  if (validate !== undefined) scripts.validate = validate;
  if (smokeExport !== undefined) scripts.smokeExport = smokeExport;
  if (closurePhase4 !== undefined) scripts.closurePhase4 = closurePhase4;

  return scripts;
}

function buildIssues(
  gates: Phase4ClosureGateReport['gates'],
  inputs: Readonly<{
    phase3ClosureIssues: readonly string[];
    localExportReadinessIssues: readonly string[];
    exportVisualQaIssues: readonly string[];
    exportSmokeIssues: readonly string[];
    serializationExportSignals: readonly string[];
    blockedScopeSignals: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`phase4_closure_gate_failed:${key}`);
  }

  for (const issue of inputs.phase3ClosureIssues) issues.push(`phase4_closure_phase3_issue:${issue}`);
  for (const issue of inputs.localExportReadinessIssues) issues.push(`phase4_closure_readiness_issue:${issue}`);
  for (const issue of inputs.exportVisualQaIssues) issues.push(`phase4_closure_visual_qa_issue:${issue}`);
  for (const issue of inputs.exportSmokeIssues) issues.push(`phase4_closure_export_smoke_issue:${issue}`);
  for (const signal of inputs.serializationExportSignals) issues.push(`phase4_closure_serialization_export:${signal}`);
  for (const signal of inputs.blockedScopeSignals) issues.push(`phase4_closure_blocked_scope:${signal}`);

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
