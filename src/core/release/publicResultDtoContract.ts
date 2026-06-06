import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import {
  buildPublicResultDto,
  containsForbiddenPublicResultDtoKeys,
  listPublicResultDtoKeys,
  PUBLIC_RESULT_DTO_ALLOWED_KEYS,
  PUBLIC_RESULT_DTO_FORBIDDEN_KEYS,
  PUBLIC_RESULT_DTO_SCHEMA_VERSION
} from '../public-link/publicResultDto';
import { runPublicLinkPrivacy } from './publicLinkPrivacy';

export const PUBLIC_RESULT_DTO_CONTRACT_SCHEMA_VERSION = 'phase-5.1-public-result-dto-contract-v1' as const;
export const PUBLIC_RESULT_DTO_CONTRACT_ID = 'phase-5-public-result-dto-builder-contract' as const;

export interface PublicResultDtoContractOptions {
  readonly repoRoot?: string;
}

export interface PublicResultDtoContractReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_DTO_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_RESULT_DTO_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly publicLinkPrivacySchemaVersion: string;
    readonly dtoSchemaVersion: typeof PUBLIC_RESULT_DTO_SCHEMA_VERSION;
    readonly phaseScope: 'phase-5-public-result-dto-contract';
    readonly implementationMode: 'dto-builder-only-no-route-no-backend';
  };
  readonly gates: {
    readonly publicLinkPrivacyPassed: boolean;
    readonly dtoBuilderExists: boolean;
    readonly dtoContractScriptExists: boolean;
    readonly validateScriptRunsDtoContract: boolean;
    readonly dtoStatusDocExists: boolean;
    readonly dtoContractDocExists: boolean;
    readonly dtoShapeIsMinimized: boolean;
    readonly dtoExcludesForbiddenFields: boolean;
    readonly dtoUsesPublicEngineResultOnly: boolean;
    readonly noPublicRouteYet: boolean;
    readonly noBackendDatabaseAuthPaymentAi: boolean;
    readonly noRawAnswerLeakage: boolean;
    readonly noFullResultSerializationExport: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly dtoContract: string;
    readonly phase51Status: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly publicResultDtoContract?: string;
  };
  readonly dtoContract: {
    readonly allowedKeys: readonly string[];
    readonly forbiddenKeys: readonly string[];
    readonly sampleKeys: readonly string[];
    readonly sampleSerializedBytes: number;
  };
  readonly implementationScan: {
    readonly blockedPaths: readonly string[];
    readonly blockedSignals: readonly string[];
    readonly rawLeakSignals: readonly string[];
    readonly fullSerializationSignals: readonly string[];
  };
  readonly coverage: {
    readonly publicLinkPrivacyIssueCount: number;
    readonly allowedKeyCount: number;
    readonly forbiddenKeyCount: number;
    readonly sampleAxisSummaryCount: number;
    readonly sampleContradictionSummaryCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const DTO_BUILDER_PATH = 'src/core/public-link/publicResultDto.ts';
const DTO_CONTRACT_DOC = 'docs/release/phase-5-public-result-dto-builder-contract.md';
const PHASE_5_1_STATUS_DOC = 'docs/ui/phase-5-1-public-result-dto-builder-contract-status.md';

const PUBLIC_ROUTE_PATHS = [
  'src/app/r/[resultId]',
  'src/app/results/[resultId]',
  'src/app/public',
  'src/features/publicResultRoute',
  'src/features/publicLinkRoute'
] as const;

const BLOCKED_SCOPE_PATHS = [
  'src/app/api',
  'src/server',
  'src/backend',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations',
  'src/auth',
  'src/payments',
  'src/ai',
  'src/llm'
] as const;

const BLOCKED_SCOPE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  '@supabase',
  'new PrismaClient',
  'drizzle(',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'signIn(',
  'auth('
] as const;

const RAW_LEAK_SIGNALS = [
  '.answers',
  'rawAnswers',
  'questionAnswers',
  'selectedAnswer',
  'answerText',
  'questionId',
  'evidenceDigest',
  'evidenceRefs'
] as const;

const FULL_SERIALIZATION_SIGNALS = [
  'serializeCorridorsResultEnvelope',
  'buildSerializableCorridorsResult',
  'deserializeCorridorsResult',
  'sessionStorageEnvelope',
  'privateReportSeed',
  'tagScores',
  'axisScoresRaw'
] as const;

export function runPublicResultDtoContract(options: PublicResultDtoContractOptions = {}): PublicResultDtoContractReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const privacyReport = runPublicLinkPrivacy({ repoRoot });
  const builderSource = readOptionalFile(repoRoot, DTO_BUILDER_PATH);
  const sampleDto = buildSamplePublicResultDto();
  const sampleKeys = listPublicResultDtoKeys(sampleDto);
  const blockedPaths = existingPaths(repoRoot, [...PUBLIC_ROUTE_PATHS, ...BLOCKED_SCOPE_PATHS]);
  const blockedSignals = findSignals(builderSource, BLOCKED_SCOPE_SIGNALS);
  const rawLeakSignals = findSignals(builderSource, RAW_LEAK_SIGNALS);
  const fullSerializationSignals = findSignals(builderSource, FULL_SERIALIZATION_SIGNALS);
  const dtoShapeIsMinimized = sampleKeys.every((key) => (PUBLIC_RESULT_DTO_ALLOWED_KEYS as readonly string[]).includes(key))
    && sampleKeys.length === PUBLIC_RESULT_DTO_ALLOWED_KEYS.length;

  const gates = {
    publicLinkPrivacyPassed: privacyReport.gates.overallPassed,
    dtoBuilderExists: existsSync(path.join(repoRoot, DTO_BUILDER_PATH)),
    dtoContractScriptExists: packageJson.scripts?.['contract:public-dto'] === 'tsx scripts/public-result-dto-contract.ts',
    validateScriptRunsDtoContract: validateScript.includes('npm run contract:public-dto'),
    dtoStatusDocExists: existsSync(path.join(repoRoot, PHASE_5_1_STATUS_DOC)),
    dtoContractDocExists: existsSync(path.join(repoRoot, DTO_CONTRACT_DOC)),
    dtoShapeIsMinimized,
    dtoExcludesForbiddenFields: !containsForbiddenPublicResultDtoKeys(sampleDto),
    dtoUsesPublicEngineResultOnly: builderSource.includes('CorridorsPublicResultDto') && !builderSource.includes('../scoring/') && !builderSource.includes('../methodology/'),
    noPublicRouteYet: !PUBLIC_ROUTE_PATHS.some((relativePath) => existsSync(path.join(repoRoot, relativePath))),
    noBackendDatabaseAuthPaymentAi: !BLOCKED_SCOPE_PATHS.some((relativePath) => existsSync(path.join(repoRoot, relativePath))) && blockedSignals.length === 0,
    noRawAnswerLeakage: rawLeakSignals.length === 0,
    noFullResultSerializationExport: fullSerializationSignals.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PUBLIC_RESULT_DTO_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_RESULT_DTO_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      publicLinkPrivacySchemaVersion: privacyReport.schemaVersion,
      dtoSchemaVersion: PUBLIC_RESULT_DTO_SCHEMA_VERSION,
      phaseScope: 'phase-5-public-result-dto-contract',
      implementationMode: 'dto-builder-only-no-route-no-backend'
    },
    gates: completeGates,
    docs: {
      dtoContract: DTO_CONTRACT_DOC,
      phase51Status: PHASE_5_1_STATUS_DOC
    },
    scripts: buildScriptSummary(packageJson),
    dtoContract: {
      allowedKeys: PUBLIC_RESULT_DTO_ALLOWED_KEYS,
      forbiddenKeys: PUBLIC_RESULT_DTO_FORBIDDEN_KEYS,
      sampleKeys,
      sampleSerializedBytes: JSON.stringify(sampleDto).length
    },
    implementationScan: {
      blockedPaths,
      blockedSignals,
      rawLeakSignals,
      fullSerializationSignals
    },
    coverage: {
      publicLinkPrivacyIssueCount: privacyReport.issues.length,
      allowedKeyCount: PUBLIC_RESULT_DTO_ALLOWED_KEYS.length,
      forbiddenKeyCount: PUBLIC_RESULT_DTO_FORBIDDEN_KEYS.length,
      sampleAxisSummaryCount: sampleDto.axisSummaries.length,
      sampleContradictionSummaryCount: sampleDto.contradictionSummaries.length
    },
    issues: buildIssues(completeGates, { privacyIssues: privacyReport.issues, blockedPaths, blockedSignals, rawLeakSignals, fullSerializationSignals })
  };
}

function buildSamplePublicResultDto() {
  return buildPublicResultDto(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'), {
    resultId: 'pub_20corridors_sample_0001',
    createdAt: '2026-06-05T00:00:00.000Z',
    expiresAt: '2026-07-05T00:00:00.000Z',
    deleteTokenHash: 'delete_token_hash_sample_0001'
  });
}

function buildScriptSummary(packageJson: PackageJsonSubset): PublicResultDtoContractReport['scripts'] {
  const scripts: { validate?: string; publicResultDtoContract?: string } = {};
  const validate = packageJson.scripts?.validate;
  const publicResultDtoContract = packageJson.scripts?.['contract:public-dto'];

  if (validate !== undefined) scripts.validate = validate;
  if (publicResultDtoContract !== undefined) scripts.publicResultDtoContract = publicResultDtoContract;

  return scripts;
}

function buildIssues(
  gates: PublicResultDtoContractReport['gates'],
  inputs: Readonly<{
    privacyIssues: readonly string[];
    blockedPaths: readonly string[];
    blockedSignals: readonly string[];
    rawLeakSignals: readonly string[];
    fullSerializationSignals: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`public_result_dto_contract_gate_failed:${key}`);
  }

  for (const issue of inputs.privacyIssues) issues.push(`public_result_dto_contract_privacy_issue:${issue}`);
  for (const item of inputs.blockedPaths) issues.push(`public_result_dto_contract_blocked_path:${item}`);
  for (const item of inputs.blockedSignals) issues.push(`public_result_dto_contract_blocked_signal:${item}`);
  for (const item of inputs.rawLeakSignals) issues.push(`public_result_dto_contract_raw_leak_signal:${item}`);
  for (const item of inputs.fullSerializationSignals) issues.push(`public_result_dto_contract_full_serialization_signal:${item}`);

  return issues;
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath))).sort();
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
