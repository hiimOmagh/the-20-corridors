import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runPhase4ClosureGate } from './phase4ClosureGate';

export const PUBLIC_LINK_PRIVACY_SCHEMA_VERSION = 'phase-5.0-public-link-privacy-v1' as const;
export const PUBLIC_LINK_PRIVACY_ID = 'phase-5-public-result-link-privacy-contract' as const;

export interface PublicLinkPrivacyOptions {
  readonly repoRoot?: string;
}

export interface PublicLinkPrivacyReport {
  readonly schemaVersion: typeof PUBLIC_LINK_PRIVACY_SCHEMA_VERSION;
  readonly privacyId: typeof PUBLIC_LINK_PRIVACY_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-5-public-link-contract-only';
    readonly phase4ClosureSchemaVersion: string;
    readonly implementationMode: 'contract-only-no-backend';
  };
  readonly gates: {
    readonly phase4ClosurePassed: boolean;
    readonly privacyScriptExists: boolean;
    readonly validateScriptRunsPublicLinkPrivacy: boolean;
    readonly privacyContractDocExists: boolean;
    readonly phase50StatusDocExists: boolean;
    readonly phase5TransitionDocExists: boolean;
    readonly publicResultDtoMinimizationDefined: boolean;
    readonly anonymousResultIdPolicyDefined: boolean;
    readonly rawAnswerExclusionDefined: boolean;
    readonly deleteAndExpiryExpectationsDefined: boolean;
    readonly publicLinkSmokeGateExpectationsDefined: boolean;
    readonly noBackendImplementationYet: boolean;
    readonly noDatabaseAuthPaymentAiImplementationYet: boolean;
    readonly noRawAnswerPublicLinkImplementation: boolean;
    readonly noFullResultSerializationPublicLinkImplementation: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly publicLinkPrivacyContract: string;
    readonly phase50Status: string;
    readonly phase5Transition: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly publicLinkPrivacy?: string;
  };
  readonly privacyContract: {
    readonly allowedPublicResultFields: readonly string[];
    readonly forbiddenPublicResultFields: readonly string[];
    readonly persistencePolicy: readonly string[];
    readonly publicLinkSmokeGateExpectations: readonly string[];
  };
  readonly implementationScan: {
    readonly blockedImplementationPaths: readonly string[];
    readonly blockedImplementationSignals: readonly string[];
    readonly rawAnswerPublicLinkSignals: readonly string[];
    readonly fullResultSerializationPublicLinkSignals: readonly string[];
  };
  readonly coverage: {
    readonly phase4ClosureIssueCount: number;
    readonly allowedFieldCount: number;
    readonly forbiddenFieldCount: number;
    readonly persistencePolicyCount: number;
    readonly publicLinkSmokeExpectationCount: number;
    readonly blockedImplementationPathCount: number;
    readonly blockedSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const PUBLIC_LINK_PRIVACY_CONTRACT_DOC = 'docs/release/phase-5-public-result-link-privacy-contract.md';
const PHASE_5_0_STATUS_DOC = 'docs/ui/phase-5-0-public-result-link-privacy-contract-status.md';
const PHASE_5_TRANSITION_DOC = 'docs/ui/phase-5-transition-plan.md';

export const ALLOWED_PUBLIC_RESULT_FIELDS = [
  'resultId',
  'schemaVersion',
  'createdAt',
  'expiresAt',
  'archetype',
  'confidenceBand',
  'dominantTags',
  'deepMotive',
  'axisSummaries',
  'contradictionSummaries',
  'shareCard',
  'reportOverview',
  'deleteTokenHash'
] as const;

export const FORBIDDEN_PUBLIC_RESULT_FIELDS = [
  'answers',
  'rawAnswers',
  'questionAnswers',
  'selectedAnswer',
  'questionId',
  'tagScores',
  'axisScoresRaw',
  'privateReportSeed',
  'sessionStorageEnvelope',
  'ipAddress',
  'email',
  'name',
  'userId',
  'deviceFingerprint'
] as const;

export const PUBLIC_LINK_PERSISTENCE_POLICY = [
  'anonymous-id-only',
  'raw-answers-never-persisted',
  'public-dto-minimized',
  'delete-token-required',
  'default-expiry-required',
  'no-account-required',
  'no-analytics-required'
] as const;

export const PUBLIC_LINK_SMOKE_EXPECTATIONS = [
  'public-link-route-loads-by-anonymous-id',
  'public-link-renders-minimized-dto-only',
  'raw-answer-strings-absent-from-public-payload',
  'expired-result-renders-expired-state',
  'deleted-result-renders-deleted-state',
  'delete-token-flow-does-not-reveal-answers',
  'no-auth-required-for-viewing-public-link'
] as const;

const BLOCKED_IMPLEMENTATION_PATHS = [
  'src/server',
  'src/backend',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations'
] as const;

const PUBLIC_LINK_CANDIDATE_FILES = [
  'src/app/r/[resultId]/page.tsx',
  'src/app/results/[resultId]/page.tsx',
  'src/features/publicLink/PublicResultClient.tsx',
  'src/features/publicLink/publicResultDto.ts',
  'src/core/public-link/publicResultDto.ts',
  'src/core/public-link/publicResultStorage.ts'
] as const;

const BLOCKED_IMPLEMENTATION_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'createClient(',
  'new PrismaClient',
  'drizzle(',
  'mongoose.connect',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
  'signOut(',
  'localStorage.setItem',
  'indexedDB.open'
] as const;

const RAW_ANSWER_PUBLIC_LINK_SIGNALS = [
  'publicResult.answers',
  'publicLink.answers',
  'rawAnswers',
  'questionAnswers',
  'selectedAnswer',
  'answerText',
  'questionId',
  'raw-answer-public-link'
] as const;

const FULL_RESULT_SERIALIZATION_PUBLIC_LINK_SIGNALS = [
  'serializeCorridorsResultEnvelope',
  'buildSerializableCorridorsResult',
  'deserializeCorridorsResult',
  'sessionStorageEnvelope',
  'privateReportSeed',
  'tagScores',
  'axisScoresRaw'
] as const;

const REQUIRED_CONTRACT_PHRASES = [
  'PublicResultDto',
  'raw answers are never persisted',
  'anonymous result id',
  'delete token',
  'default expiry',
  'public-link smoke gate',
  'no backend implementation in Phase 5.0'
] as const;

export function runPublicLinkPrivacy(options: PublicLinkPrivacyOptions = {}): PublicLinkPrivacyReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase4Closure = runPhase4ClosureGate({ repoRoot });
  const contractDoc = readOptionalFile(repoRoot, PUBLIC_LINK_PRIVACY_CONTRACT_DOC);
  const blockedImplementationPaths = BLOCKED_IMPLEMENTATION_PATHS.filter((relativePath) => existsSync(path.join(repoRoot, relativePath)));
  const candidateSource = PUBLIC_LINK_CANDIDATE_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const blockedImplementationSignals = findSignals(candidateSource, BLOCKED_IMPLEMENTATION_SIGNALS);
  const rawAnswerPublicLinkSignals = findSignals(candidateSource, RAW_ANSWER_PUBLIC_LINK_SIGNALS);
  const fullResultSerializationPublicLinkSignals = findSignals(candidateSource, FULL_RESULT_SERIALIZATION_PUBLIC_LINK_SIGNALS);

  const gates = {
    phase4ClosurePassed: phase4Closure.gates.overallPassed,
    privacyScriptExists: packageJson.scripts?.['privacy:public-link'] === 'tsx scripts/public-link-privacy.ts',
    validateScriptRunsPublicLinkPrivacy: validateScript.includes('npm run privacy:public-link'),
    privacyContractDocExists: existsSync(path.join(repoRoot, PUBLIC_LINK_PRIVACY_CONTRACT_DOC)),
    phase50StatusDocExists: existsSync(path.join(repoRoot, PHASE_5_0_STATUS_DOC)),
    phase5TransitionDocExists: existsSync(path.join(repoRoot, PHASE_5_TRANSITION_DOC)),
    publicResultDtoMinimizationDefined: REQUIRED_CONTRACT_PHRASES.every((phrase) => contractDoc.includes(phrase)) && ALLOWED_PUBLIC_RESULT_FIELDS.length >= 10,
    anonymousResultIdPolicyDefined: contractDoc.includes('anonymous result id') && contractDoc.includes('unguessable') && contractDoc.includes('not derived from answers'),
    rawAnswerExclusionDefined: contractDoc.includes('raw answers are never persisted') && FORBIDDEN_PUBLIC_RESULT_FIELDS.includes('answers'),
    deleteAndExpiryExpectationsDefined: contractDoc.includes('delete token') && contractDoc.includes('default expiry') && contractDoc.includes('expired state'),
    publicLinkSmokeGateExpectationsDefined: PUBLIC_LINK_SMOKE_EXPECTATIONS.length >= 6 && contractDoc.includes('public-link smoke gate'),
    noBackendImplementationYet: blockedImplementationPaths.length === 0,
    noDatabaseAuthPaymentAiImplementationYet: blockedImplementationSignals.length === 0,
    noRawAnswerPublicLinkImplementation: rawAnswerPublicLinkSignals.length === 0,
    noFullResultSerializationPublicLinkImplementation: fullResultSerializationPublicLinkSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PUBLIC_LINK_PRIVACY_SCHEMA_VERSION,
    privacyId: PUBLIC_LINK_PRIVACY_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-5-public-link-contract-only',
      phase4ClosureSchemaVersion: phase4Closure.schemaVersion,
      implementationMode: 'contract-only-no-backend'
    },
    gates: completeGates,
    docs: {
      publicLinkPrivacyContract: PUBLIC_LINK_PRIVACY_CONTRACT_DOC,
      phase50Status: PHASE_5_0_STATUS_DOC,
      phase5Transition: PHASE_5_TRANSITION_DOC
    },
    scripts: buildScriptSummary(packageJson),
    privacyContract: {
      allowedPublicResultFields: ALLOWED_PUBLIC_RESULT_FIELDS,
      forbiddenPublicResultFields: FORBIDDEN_PUBLIC_RESULT_FIELDS,
      persistencePolicy: PUBLIC_LINK_PERSISTENCE_POLICY,
      publicLinkSmokeGateExpectations: PUBLIC_LINK_SMOKE_EXPECTATIONS
    },
    implementationScan: {
      blockedImplementationPaths,
      blockedImplementationSignals,
      rawAnswerPublicLinkSignals,
      fullResultSerializationPublicLinkSignals
    },
    coverage: {
      phase4ClosureIssueCount: phase4Closure.issues.length,
      allowedFieldCount: ALLOWED_PUBLIC_RESULT_FIELDS.length,
      forbiddenFieldCount: FORBIDDEN_PUBLIC_RESULT_FIELDS.length,
      persistencePolicyCount: PUBLIC_LINK_PERSISTENCE_POLICY.length,
      publicLinkSmokeExpectationCount: PUBLIC_LINK_SMOKE_EXPECTATIONS.length,
      blockedImplementationPathCount: blockedImplementationPaths.length,
      blockedSignalCount: blockedImplementationSignals.length + rawAnswerPublicLinkSignals.length + fullResultSerializationPublicLinkSignals.length
    },
    issues: buildIssues(completeGates, {
      phase4ClosureIssues: phase4Closure.issues,
      blockedImplementationPaths,
      blockedImplementationSignals,
      rawAnswerPublicLinkSignals,
      fullResultSerializationPublicLinkSignals
    })
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): PublicLinkPrivacyReport['scripts'] {
  const scripts: { validate?: string; publicLinkPrivacy?: string } = {};
  const validate = packageJson.scripts?.validate;
  const publicLinkPrivacy = packageJson.scripts?.['privacy:public-link'];

  if (validate !== undefined) scripts.validate = validate;
  if (publicLinkPrivacy !== undefined) scripts.publicLinkPrivacy = publicLinkPrivacy;

  return scripts;
}

function buildIssues(
  gates: PublicLinkPrivacyReport['gates'],
  inputs: Readonly<{
    phase4ClosureIssues: readonly string[];
    blockedImplementationPaths: readonly string[];
    blockedImplementationSignals: readonly string[];
    rawAnswerPublicLinkSignals: readonly string[];
    fullResultSerializationPublicLinkSignals: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`public_link_privacy_gate_failed:${key}`);
  }

  for (const issue of inputs.phase4ClosureIssues) issues.push(`public_link_privacy_phase4_issue:${issue}`);
  for (const blockedPath of inputs.blockedImplementationPaths) issues.push(`public_link_privacy_blocked_path:${blockedPath}`);
  for (const signal of inputs.blockedImplementationSignals) issues.push(`public_link_privacy_blocked_signal:${signal}`);
  for (const signal of inputs.rawAnswerPublicLinkSignals) issues.push(`public_link_privacy_raw_answer_signal:${signal}`);
  for (const signal of inputs.fullResultSerializationPublicLinkSignals) issues.push(`public_link_privacy_full_result_serialization_signal:${signal}`);

  return issues;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packagePath = path.join(repoRoot, 'package.json');
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) return '';
  return readFileSync(absolutePath, 'utf8');
}

function findSignals(source: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => source.includes(signal));
}
