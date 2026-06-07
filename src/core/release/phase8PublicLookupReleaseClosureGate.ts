import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_SCHEMA_VERSION =
  'phase-8.22-public-lookup-release-closure-gate-v1' as const;
export const PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_ID =
  'phase-8-public-lookup-release-closure-gate' as const;

export interface Phase8PublicLookupReleaseClosureGateOptions {
  readonly repoRoot?: string;
}

export interface Phase8PublicLookupReleaseClosureGateReport {
  readonly schemaVersion: typeof PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-database-api-public-lookup-release-closure';
  };
  readonly gates: {
    readonly closureScriptExists: boolean;
    readonly validateScriptRunsPhase8ClosureGate: boolean;
    readonly phase8ClosureDocExists: boolean;
    readonly phase822StatusDocExists: boolean;
    readonly phase9TransitionPlanExists: boolean;
    readonly databaseAdapterEvidenceCurrent: boolean;
    readonly apiRouteDatabaseBindingEvidenceCurrent: boolean;
    readonly publicLookupEvidenceCurrent: boolean;
    readonly operationalSmokeEvidenceCurrent: boolean;
    readonly rollbackDrillEvidenceCurrent: boolean;
    readonly allPhase8EvidenceCurrentAndPassed: boolean;
    readonly publicLookupRouteImplementationExists: boolean;
    readonly buildRouteListExpectedToIncludePublicLookup: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly productionNetworkLookupSmokeDisabledByDefault: boolean;
    readonly productionMutationSmokeDisabledByDefault: boolean;
    readonly noBlockedIntegrationSignals: boolean;
    readonly phase9TransitionScopeSeparated: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly phase8Closure: string;
    readonly phase822Status: string;
    readonly phase9Transition: string;
    readonly phase8Transition: string;
  };
  readonly scripts: {
    readonly validate?: string | undefined;
    readonly closurePhase8?: string | undefined;
    readonly publicLookupImplementation?: string | undefined;
    readonly operationalSmoke?: string | undefined;
    readonly rollbackDrill?: string | undefined;
  };
  readonly coverage: {
    readonly evidenceFileCount: number;
    readonly passedEvidenceFileCount: number;
    readonly databaseEvidenceCount: number;
    readonly apiRouteBindingEvidenceCount: number;
    readonly publicLookupEvidenceCount: number;
    readonly operationalEvidenceCount: number;
    readonly checkedSourceFileCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly rawAnswerSignalCount: number;
    readonly rawDeleteTokenSignalCount: number;
  };
  readonly evidence: readonly Phase8EvidenceSummary[];
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly rawAnswerSignals: readonly string[];
    readonly rawDeleteTokenSignals: readonly string[];
  };
  readonly issues: readonly string[];
}

export interface Phase8EvidenceSummary {
  readonly key: string;
  readonly path: string;
  readonly category: 'database-adapter' | 'api-route-database-binding' | 'public-lookup' | 'operational';
  readonly exists: boolean;
  readonly passed: boolean;
  readonly schemaVersion?: string | undefined;
  readonly id?: string | undefined;
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }
type JsonRecord = Record<string, unknown>;

const PHASE_8_CLOSURE_DOC = 'docs/release/phase-8-public-lookup-release-closure-gate.md';
const PHASE_8_22_STATUS_DOC = 'docs/ui/phase-8-22-public-lookup-release-closure-gate-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const PHASE_9_TRANSITION_DOC = 'docs/ui/phase-9-transition-plan.md';
const PUBLIC_LOOKUP_ROUTE = 'src/app/r/(public)/[publicId]/page.tsx';

const EVIDENCE_FILES = [
  { key: 'database-adapter-contract', path: 'docs/evidence/database-adapter-contract-latest.json', category: 'database-adapter' },
  { key: 'database-runtime-selection', path: 'docs/evidence/database-adapter-runtime-selection-guard-latest.json', category: 'database-adapter' },
  { key: 'database-adapter-factory', path: 'docs/evidence/database-adapter-factory-contract-latest.json', category: 'database-adapter' },
  { key: 'database-client-config', path: 'docs/evidence/database-client-configuration-contract-latest.json', category: 'database-adapter' },
  { key: 'database-sdk-decision', path: 'docs/evidence/database-sdk-selection-decision-record-latest.json', category: 'database-adapter' },
  { key: 'database-query-contract', path: 'docs/evidence/database-query-contract-latest.json', category: 'database-adapter' },
  { key: 'database-client-smoke-boundary', path: 'docs/evidence/database-client-smoke-boundary-latest.json', category: 'database-adapter' },
  { key: 'database-query-readiness', path: 'docs/evidence/database-client-query-readiness-guard-latest.json', category: 'database-adapter' },
  { key: 'database-adapter-implementation', path: 'docs/evidence/database-adapter-implementation-disabled-factory-gate-latest.json', category: 'database-adapter' },
  { key: 'database-adapter-activation-dry-run', path: 'docs/evidence/database-adapter-activation-dry-run-gate-latest.json', category: 'database-adapter' },
  { key: 'database-factory-activation', path: 'docs/evidence/database-adapter-factory-activation-contract-latest.json', category: 'database-adapter' },
  { key: 'route-database-binding-preflight', path: 'docs/evidence/public-route-database-binding-preflight-contract-latest.json', category: 'api-route-database-binding' },
  { key: 'route-database-binding-dry-run', path: 'docs/evidence/public-route-database-binding-dry-run-contract-latest.json', category: 'api-route-database-binding' },
  { key: 'route-database-binding-activation', path: 'docs/evidence/public-route-database-binding-activation-contract-latest.json', category: 'api-route-database-binding' },
  { key: 'public-api-route-database-binding-implementation', path: 'docs/evidence/public-api-route-database-binding-implementation-gate-latest.json', category: 'api-route-database-binding' },
  { key: 'database-route-rollback-failures', path: 'docs/evidence/database-route-rollback-failure-evidence-pack-latest.json', category: 'api-route-database-binding' },
  { key: 'public-lookup-page-preflight', path: 'docs/evidence/public-result-lookup-page-preflight-contract-latest.json', category: 'public-lookup' },
  { key: 'public-lookup-page-dry-run', path: 'docs/evidence/public-result-lookup-page-dry-run-contract-latest.json', category: 'public-lookup' },
  { key: 'public-lookup-page-activation', path: 'docs/evidence/public-result-lookup-page-activation-contract-latest.json', category: 'public-lookup' },
  { key: 'public-lookup-page-implementation', path: 'docs/evidence/public-result-lookup-page-implementation-gate-latest.json', category: 'public-lookup' },
  { key: 'public-lookup-operational-smoke', path: 'docs/evidence/public-result-lookup-operational-smoke-boundary-latest.json', category: 'operational' },
  { key: 'public-lookup-rollback-drill', path: 'docs/evidence/public-lookup-operational-rollback-drill-latest.json', category: 'operational' }
] as const satisfies readonly {
  readonly key: string;
  readonly path: string;
  readonly category: Phase8EvidenceSummary['category'];
}[];

const SOURCE_SCAN_FILES = [
  'src/core/public-link/publicResultApi.ts',
  'src/core/public-link/publicResultRouteHandlers.ts',
  'src/core/public-link/publicResultLookupPageImplementation.ts',
  'src/core/public-link/publicResultLookupOperationalSmokeBoundary.ts',
  'src/core/public-link/publicResultLookupOperationalRollbackDrill.ts',
  PUBLIC_LOOKUP_ROUTE
] as const;

const BLOCKED_INTEGRATION_SIGNALS = [
  '@supabase',
  'createClient(',
  'new PrismaClient',
  'drizzle(',
  'mongoose.connect',
  '@stripe',
  'stripe.checkout',
  'OpenAI(',
  'generateText(',
  'streamText(',
  'posthog.capture',
  'analytics.track',
  'telemetry.capture'
] as const;

const RAW_ANSWER_SIGNALS = [
  'raw' + 'Answers:',
  '"raw' + 'Answers"',
  'question' + 'Answers:',
  'selected' + 'Answer:',
  'answer' + 'Text:'
] as const;

const RAW_DELETE_TOKEN_SIGNALS = [
  'rawDeleteTokenExposed: true',
  '"deleteToken":',
  '"delete_token":',
  'raw_delete_token_value'
] as const;

export function runPhase8PublicLookupReleaseClosureGate(
  options: Phase8PublicLookupReleaseClosureGateOptions = {}
): Phase8PublicLookupReleaseClosureGateReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const evidence = summarizeEvidence(repoRoot);
  const scan = scanSources(repoRoot);
  const phase9Transition = readOptionalFile(repoRoot, PHASE_9_TRANSITION_DOC);

  const databaseEvidence = evidence.filter((item) => item.category === 'database-adapter');
  const apiRouteEvidence = evidence.filter((item) => item.category === 'api-route-database-binding');
  const publicLookupEvidence = evidence.filter((item) => item.category === 'public-lookup');
  const operationalEvidence = evidence.filter((item) => item.category === 'operational');
  const passedEvidenceFileCount = evidence.filter((item) => item.passed).length;

  const publicLookupImplementation = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-page-implementation-gate-latest.json');
  const operationalSmoke = readEvidence(repoRoot, 'docs/evidence/public-result-lookup-operational-smoke-boundary-latest.json');
  const rollbackDrill = readEvidence(repoRoot, 'docs/evidence/public-lookup-operational-rollback-drill-latest.json');

  const gates = {
    closureScriptExists: packageJson.scripts?.['closure:phase8'] === 'tsx scripts/phase8-public-lookup-release-closure-gate.ts',
    validateScriptRunsPhase8ClosureGate: validateScript.includes('npm run closure:phase8'),
    phase8ClosureDocExists: existsSync(path.join(repoRoot, PHASE_8_CLOSURE_DOC)),
    phase822StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_22_STATUS_DOC)),
    phase9TransitionPlanExists: existsSync(path.join(repoRoot, PHASE_9_TRANSITION_DOC)),
    databaseAdapterEvidenceCurrent: databaseEvidence.length === 11 && databaseEvidence.every((item) => item.passed),
    apiRouteDatabaseBindingEvidenceCurrent: apiRouteEvidence.length === 5 && apiRouteEvidence.every((item) => item.passed),
    publicLookupEvidenceCurrent: publicLookupEvidence.length === 4 && publicLookupEvidence.every((item) => item.passed),
    operationalSmokeEvidenceCurrent: evidenceByKey(evidence, 'public-lookup-operational-smoke')?.passed === true,
    rollbackDrillEvidenceCurrent: evidenceByKey(evidence, 'public-lookup-rollback-drill')?.passed === true,
    allPhase8EvidenceCurrentAndPassed: evidence.length === EVIDENCE_FILES.length && evidence.every((item) => item.exists && item.passed),
    publicLookupRouteImplementationExists: existsSync(path.join(repoRoot, PUBLIC_LOOKUP_ROUTE)),
    buildRouteListExpectedToIncludePublicLookup: existsSync(path.join(repoRoot, PUBLIC_LOOKUP_ROUTE)),
    rawAnswersRemainBlocked: noRawAnswersEvidence(publicLookupImplementation, operationalSmoke, rollbackDrill) && scan.rawAnswerSignals.length === 0,
    rawDeleteTokensRemainBlocked: noRawDeleteTokenEvidence(publicLookupImplementation, operationalSmoke, rollbackDrill) && scan.rawDeleteTokenSignals.length === 0,
    productionNetworkLookupSmokeDisabledByDefault: productionNetworkDisabled(publicLookupImplementation, operationalSmoke, rollbackDrill),
    productionMutationSmokeDisabledByDefault: productionMutationDisabled(publicLookupImplementation, operationalSmoke, rollbackDrill),
    noBlockedIntegrationSignals: scan.blockedIntegrationSignals.length === 0,
    phase9TransitionScopeSeparated: phase9Transition.includes('Phase 9') && phase9Transition.includes('separate') && phase9Transition.includes('production network') && phase9Transition.includes('rollback'),
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...evidence.filter((item) => !item.exists).map((item) => `missing_evidence:${item.path}`),
    ...evidence.filter((item) => item.exists && !item.passed).map((item) => `failed_evidence:${item.path}`),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...scan.rawAnswerSignals.map((signal) => `raw_answer_signal:${signal}`),
    ...scan.rawDeleteTokenSignals.map((signal) => `raw_delete_token_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_8_PUBLIC_LOOKUP_RELEASE_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-database-api-public-lookup-release-closure'
    },
    gates: finalGates,
    docs: {
      phase8Closure: PHASE_8_CLOSURE_DOC,
      phase822Status: PHASE_8_22_STATUS_DOC,
      phase9Transition: PHASE_9_TRANSITION_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    scripts: {
      validate: packageJson.scripts?.validate,
      closurePhase8: packageJson.scripts?.['closure:phase8'],
      publicLookupImplementation: packageJson.scripts?.['gate:public-lookup-page-implementation'],
      operationalSmoke: packageJson.scripts?.['smoke:public-lookup-operational'],
      rollbackDrill: packageJson.scripts?.['drill:public-lookup-rollback']
    },
    coverage: {
      evidenceFileCount: evidence.length,
      passedEvidenceFileCount,
      databaseEvidenceCount: databaseEvidence.length,
      apiRouteBindingEvidenceCount: apiRouteEvidence.length,
      publicLookupEvidenceCount: publicLookupEvidence.length,
      operationalEvidenceCount: operationalEvidence.length,
      checkedSourceFileCount: SOURCE_SCAN_FILES.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length,
      rawAnswerSignalCount: scan.rawAnswerSignals.length,
      rawDeleteTokenSignalCount: scan.rawDeleteTokenSignals.length
    },
    evidence,
    implementationScan: scan,
    issues
  };
}

export function writePhase8PublicLookupReleaseClosureEvidence(
  report: Phase8PublicLookupReleaseClosureGateReport,
  evidencePath: string
): void {
  const target = path.resolve(process.cwd(), evidencePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
}

function summarizeEvidence(repoRoot: string): readonly Phase8EvidenceSummary[] {
  return EVIDENCE_FILES.map((definition) => {
    const evidence = readEvidence(repoRoot, definition.path);
    return {
      key: definition.key,
      path: definition.path,
      category: definition.category,
      exists: evidence !== null,
      passed: evidencePassed(evidence),
      schemaVersion: typeof evidence?.schemaVersion === 'string' ? evidence.schemaVersion : undefined,
      id: typeof evidence?.gateId === 'string'
        ? evidence.gateId
        : typeof evidence?.contractId === 'string'
          ? evidence.contractId
          : undefined
    };
  });
}

function evidenceByKey(evidence: readonly Phase8EvidenceSummary[], key: string): Phase8EvidenceSummary | undefined {
  return evidence.find((item) => item.key === key);
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
  } catch {
    return {};
  }
}

function readEvidence(repoRoot: string, relativePath: string): JsonRecord | null {
  try {
    return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8')) as JsonRecord;
  } catch {
    return null;
  }
}

function evidencePassed(evidence: JsonRecord | null): boolean {
  if (evidence === null) return false;
  const gates = evidence.gates;
  if (isRecord(gates) && gates.overallPassed === true) return true;
  if (evidence.overallPassed === true) return true;
  return false;
}

function noRawAnswersEvidence(...items: readonly (JsonRecord | null)[]): boolean {
  return items.every((item) => {
    const gates = item?.gates;
    return isRecord(gates) && gates.noRawAnswersExposed === true;
  });
}

function noRawDeleteTokenEvidence(...items: readonly (JsonRecord | null)[]): boolean {
  return items.every((item) => {
    const gates = item?.gates;
    return isRecord(gates) && gates.noRawDeleteTokenExposed === true;
  });
}

function productionNetworkDisabled(...items: readonly (JsonRecord | null)[]): boolean {
  return items.every((item) => {
    const gates = item?.gates;
    if (!isRecord(gates)) return false;
    if (gates.noProductionNetworkLookupSmoke === true) return true;
    if (gates.networkSmokeDisabledByDefault === true) return true;
    return false;
  });
}

function productionMutationDisabled(...items: readonly (JsonRecord | null)[]): boolean {
  return items.every((item) => {
    const gates = item?.gates;
    return isRecord(gates) && gates.noProductionMutationSmoke === true;
  });
}

function scanSources(repoRoot: string): Phase8PublicLookupReleaseClosureGateReport['implementationScan'] {
  const source = SOURCE_SCAN_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  return {
    checkedFiles: SOURCE_SCAN_FILES,
    blockedIntegrationSignals: findSignals(source, BLOCKED_INTEGRATION_SIGNALS),
    rawAnswerSignals: findSignals(source, RAW_ANSWER_SIGNALS),
    rawDeleteTokenSignals: findSignals(source, RAW_DELETE_TOKEN_SIGNALS)
  };
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  try {
    return readFileSync(path.join(repoRoot, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal));
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function gateIssues(gates: Record<string, boolean>): readonly string[] {
  return Object.entries(gates)
    .filter(([, passed]) => !passed)
    .map(([gate]) => `gate_failed:${gate}`);
}
