import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
  PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME,
  PUBLIC_RESULT_DATABASE_SDK_DECISION_PHASE,
  PUBLIC_RESULT_DATABASE_SDK_DECISION_RULES,
  PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION,
  PUBLIC_RESULT_DATABASE_SDK_DECISION_STATUS,
  resolvePublicResultDatabaseSdkDecisionRecord,
  summarizePublicResultDatabaseSdkDecisionRules
} from '../public-link/publicResultDatabaseSdkDecision';
import { resolvePublicResultStorageAdapterFactoryDecision } from '../public-link/publicResultStorageAdapterFactory';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from '../public-link/publicResultRouteHandlers';
import { PUBLIC_RESULT_STORAGE_DATABASE_MODE, PUBLIC_RESULT_STORAGE_MODE_ENV } from '../public-link/publicResultStorageRuntimeSelection';
import { PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV } from '../public-link/publicResultDatabaseClientConfig';

export const DATABASE_SDK_SELECTION_DECISION_RECORD_SCHEMA_VERSION =
  'phase-8.4-database-sdk-selection-decision-record-v1' as const;
export const DATABASE_SDK_SELECTION_DECISION_RECORD_ID = 'phase-8-database-sdk-selection-decision-record' as const;

export interface DatabaseSdkSelectionDecisionRecordOptions {
  readonly repoRoot?: string;
}

export interface DatabaseSdkSelectionDecisionRecordReport {
  readonly schemaVersion: typeof DATABASE_SDK_SELECTION_DECISION_RECORD_SCHEMA_VERSION;
  readonly contractId: typeof DATABASE_SDK_SELECTION_DECISION_RECORD_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-4-database-sdk-selection-decision-record-only';
    readonly decisionSchemaVersion: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly databaseClientConfigContractPassed: boolean;
    readonly decisionScriptExists: boolean;
    readonly validateScriptRunsDecisionRecord: boolean;
    readonly decisionModuleExists: boolean;
    readonly decisionGuardModuleExists: boolean;
    readonly decisionDocExists: boolean;
    readonly phase84StatusDocExists: boolean;
    readonly providerDecisionRecordExists: boolean;
    readonly selectedSdkDocumented: boolean;
    readonly selectedSdkNotInstalled: boolean;
    readonly selectedSdkNotImported: boolean;
    readonly rejectedAlternativesDocumented: boolean;
    readonly serverlessRuntimeAssumptionsDocumented: boolean;
    readonly secretHandlingModelDocumented: boolean;
    readonly failureModesDefined: boolean;
    readonly databaseClientCreationStillBlocked: boolean;
    readonly factoryStillCannotCreateDatabaseAdapter: boolean;
    readonly routesRemainMemoryDryRun: boolean;
    readonly noDatabaseSdkImportOrMigrationImplementation: boolean;
    readonly noAuthPaymentAiAnalyticsImplementation: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly overallPassed: boolean;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly databaseClientConfigContract?: string;
    readonly databaseSdkDecisionRecord?: string;
  };
  readonly docs: {
    readonly decisionRecord: string;
    readonly phase84Status: string;
    readonly phase8Transition: string;
  };
  readonly decision: {
    readonly status: typeof PUBLIC_RESULT_DATABASE_SDK_DECISION_STATUS;
    readonly selectedProvider: typeof PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER;
    readonly selectedSdkName: typeof PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME;
    readonly selectedRuntime: string;
    readonly selectedAdapterStrategy: string;
    readonly sdkInstallAllowed: false;
    readonly sdkImportAllowed: false;
    readonly databaseClientCreationAllowed: false;
    readonly routeBindingAllowed: false;
    readonly factoryBindingAllowed: false;
    readonly decisionRules: readonly string[];
    readonly reasons: readonly string[];
    readonly rejectedAlternatives: readonly { readonly name: string; readonly reason: string }[];
    readonly failureModes: readonly { readonly code: string; readonly routeBehavior: string; readonly publicResponse: string; readonly evidenceSource: string }[];
    readonly securityModel: readonly string[];
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly implementationFiles: readonly string[];
    readonly blockedPaths: readonly string[];
    readonly installedDatabasePackages: readonly string[];
    readonly importedDatabaseSdkSignals: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly missingDecisionPhrases: readonly string[];
  };
  readonly coverage: {
    readonly databaseClientConfigIssueCount: number;
    readonly checkedFileCount: number;
    readonly implementationFileCount: number;
    readonly decisionRuleCount: number;
    readonly rejectedAlternativeCount: number;
    readonly failureModeCount: number;
    readonly securityRuleCount: number;
    readonly blockedPathCount: number;
    readonly installedDatabasePackageCount: number;
    readonly importedDatabaseSdkSignalCount: number;
    readonly blockedIntegrationSignalCount: number;
    readonly persistentRouteCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const DECISION_MODULE = 'src/core/public-link/publicResultDatabaseSdkDecision.ts';
const FACTORY_MODULE = 'src/core/public-link/publicResultStorageAdapterFactory.ts';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const DATABASE_CLIENT_CONFIG_MODULE = 'src/core/public-link/publicResultDatabaseClientConfig.ts';
const DECISION_GUARD_MODULE = 'src/core/release/databaseSdkSelectionDecisionRecord.ts';
const DECISION_SCRIPT = 'scripts/database-sdk-selection-decision-record.ts';
const DECISION_DOC = 'docs/release/phase-8-database-sdk-selection-decision-record.md';
const PHASE_8_4_STATUS_DOC = 'docs/ui/phase-8-4-database-sdk-selection-decision-record-status.md';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';

const CHECKED_FILES = [
  DECISION_MODULE,
  DATABASE_CLIENT_CONFIG_MODULE,
  FACTORY_MODULE,
  ROUTE_HANDLERS_MODULE,
  DECISION_DOC,
  PHASE_8_4_STATUS_DOC,
  PHASE_8_TRANSITION_DOC
] as const;

const IMPLEMENTATION_FILES = [DATABASE_CLIENT_CONFIG_MODULE, FACTORY_MODULE, ROUTE_HANDLERS_MODULE] as const;

const BLOCKED_SCOPE_PATHS = [
  'src/server/database',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations',
  'drizzle',
  'src/auth',
  'src/payments',
  'src/ai',
  'src/analytics'
] as const;

const PERSISTENT_PUBLIC_LOOKUP_ROUTES = [
  'src/app/r/[publicId]',
  'src/app/r/[resultId]',
  'src/app/r/[slug]',
  'src/app/results/[publicId]',
  'src/app/results/[resultId]'
] as const;

const DATABASE_PACKAGES_TO_BLOCK_UNTIL_CLIENT_PHASE = [
  '@supabase/supabase-js',
  'prisma',
  '@prisma/client',
  'drizzle-orm',
  'pg',
  'postgres',
  'mongoose'
] as const;

const DATABASE_IMPORT_SIGNALS_TO_BLOCK_UNTIL_CLIENT_PHASE = [
  'from "@neondatabase/serverless"',
  "from '@neondatabase/serverless'",
  'require("@neondatabase/serverless")',
  "require('@neondatabase/serverless')",
  'from "@supabase/supabase-js"',
  "from '@supabase/supabase-js'",
  'new PrismaClient',
  'drizzle(',
  'from "pg"',
  "from 'pg'",
  'from "postgres"',
  "from 'postgres'",
  'mongoose.connect'
] as const;

const BLOCKED_INTEGRATION_SIGNALS = [
  'createClient(',
  'database.write',
  'db.insert',
  'db.select',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'auth(',
  'signIn(',
  'signOut(',
  'posthog.capture',
  'analytics.track'
] as const;

const REQUIRED_DECISION_PHRASES = [
  'selected SDK: @neondatabase/serverless',
  'SDK is documented but not installed',
  'SDK is documented but not imported',
  'rejected alternatives',
  'serverless runtime assumptions',
  'secret-handling model',
  'failure model',
  'factory still cannot create a database adapter',
  'routes still use memory/dry-run behavior',
  'Phase 8.4'
] as const;

const COMPLETE_DATABASE_ENV = {
  [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_DATABASE_URL: 'postgresql://example.invalid/the_20_corridors',
  PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
  PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1',
  [PUBLIC_RESULT_DATABASE_SERVICE_KEY_ENV]: 'contract-only-service-key-placeholder'
} as const;

export async function runDatabaseSdkSelectionDecisionRecord(
  options: DatabaseSdkSelectionDecisionRecordOptions = {}
): Promise<DatabaseSdkSelectionDecisionRecordReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const databaseClientConfigContract = readEvidence(
    repoRoot,
    'docs/evidence/database-client-configuration-contract-latest.json',
    'database_client_configuration_contract'
  );
  const decision = resolvePublicResultDatabaseSdkDecisionRecord();
  const decisionSource = readOptionalFile(repoRoot, DECISION_MODULE);
  const decisionDoc = readOptionalFile(repoRoot, DECISION_DOC);
  const statusDoc = readOptionalFile(repoRoot, PHASE_8_4_STATUS_DOC);
  const checkedSource = CHECKED_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const implementationSource = IMPLEMENTATION_FILES.map((file) => readOptionalFile(repoRoot, file)).join('\n');
  const factoryDatabaseDecision = resolvePublicResultStorageAdapterFactoryDecision({ env: COMPLETE_DATABASE_ENV });

  const blockedPaths = existingPaths(repoRoot, BLOCKED_SCOPE_PATHS);
  const installedDatabasePackages = findDependencySignals(packageJson, DATABASE_PACKAGES_TO_BLOCK_UNTIL_CLIENT_PHASE);
  const importedDatabaseSdkSignals = findSignals(implementationSource, DATABASE_IMPORT_SIGNALS_TO_BLOCK_UNTIL_CLIENT_PHASE);
  const blockedIntegrationSignals = findSignals(implementationSource, BLOCKED_INTEGRATION_SIGNALS);
  const persistentPublicLookupRouteFiles = existingPaths(repoRoot, PERSISTENT_PUBLIC_LOOKUP_ROUTES);
  const missingDecisionPhrases = missingSignals(`${decisionSource}\n${decisionDoc}\n${statusDoc}\n${checkedSource}`, REQUIRED_DECISION_PHRASES);

  const selectedSdkDocumented = decision.selectedSdkName === PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME && checkedSource.includes(PUBLIC_RESULT_DATABASE_SELECTED_SDK_NAME);

  const gates: DatabaseSdkSelectionDecisionRecordReport['gates'] = {
    databaseClientConfigContractPassed: databaseClientConfigContract.overallPassed,
    decisionScriptExists: existsSync(path.join(repoRoot, DECISION_SCRIPT)),
    validateScriptRunsDecisionRecord: validateScript.includes('npm run contract:database-sdk-decision'),
    decisionModuleExists: existsSync(path.join(repoRoot, DECISION_MODULE)),
    decisionGuardModuleExists: existsSync(path.join(repoRoot, DECISION_GUARD_MODULE)),
    decisionDocExists: existsSync(path.join(repoRoot, DECISION_DOC)),
    phase84StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_4_STATUS_DOC)),
    providerDecisionRecordExists:
      decision.phase === PUBLIC_RESULT_DATABASE_SDK_DECISION_PHASE &&
      decision.status === PUBLIC_RESULT_DATABASE_SDK_DECISION_STATUS &&
      decision.selectedProvider === PUBLIC_RESULT_DATABASE_SELECTED_PROVIDER,
    selectedSdkDocumented,
    selectedSdkNotInstalled: installedDatabasePackages.length === 0,
    selectedSdkNotImported: importedDatabaseSdkSignals.length === 0,
    rejectedAlternativesDocumented: decision.rejectedAlternatives.length >= 5 && decisionDoc.includes('rejected alternatives'),
    serverlessRuntimeAssumptionsDocumented:
      decision.selectedRuntime === 'next-route-handlers-node-runtime' && decisionDoc.includes('serverless runtime assumptions'),
    secretHandlingModelDocumented:
      decision.securityModel.length >= 8 && decision.securityModel.some((item) => item.includes('server-only')) && decisionDoc.includes('secret-handling model'),
    failureModesDefined: decision.failureModes.length >= 8 && decisionDoc.includes('failure model'),
    databaseClientCreationStillBlocked:
      decision.databaseClientCreationAllowed === false && decision.sdkInstallAllowed === false && decision.sdkImportAllowed === false,
    factoryStillCannotCreateDatabaseAdapter:
      decision.factoryBindingAllowed === false &&
      factoryDatabaseDecision.status === 'database-factory-contract-only' &&
      factoryDatabaseDecision.databaseAdapterCreated === false,
    routesRemainMemoryDryRun:
      decision.routeBindingAllowed === false &&
      checkedSource.includes('routes still use memory/dry-run behavior') &&
      readOptionalFile(repoRoot, ROUTE_HANDLERS_MODULE).includes('handlePublicResultCreateDryRun'),
    noDatabaseSdkImportOrMigrationImplementation:
      blockedPaths.filter((item) => ['migrations', 'prisma', 'supabase', 'drizzle'].includes(item)).length === 0 &&
      installedDatabasePackages.length === 0 &&
      importedDatabaseSdkSignals.length === 0,
    noAuthPaymentAiAnalyticsImplementation:
      blockedIntegrationSignals.filter((signal) => ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track'].includes(signal)).length === 0,
    noPersistentPublicLookupRoute: persistentPublicLookupRouteFiles.length === 0,
    overallPassed: false
  };

  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: DATABASE_SDK_SELECTION_DECISION_RECORD_SCHEMA_VERSION,
    contractId: DATABASE_SDK_SELECTION_DECISION_RECORD_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot) || 'repository',
      phaseScope: 'phase-8-4-database-sdk-selection-decision-record-only',
      decisionSchemaVersion: PUBLIC_RESULT_DATABASE_SDK_DECISION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: completeGates,
    scripts: buildScriptSummary(packageJson),
    docs: {
      decisionRecord: DECISION_DOC,
      phase84Status: PHASE_8_4_STATUS_DOC,
      phase8Transition: PHASE_8_TRANSITION_DOC
    },
    decision: {
      status: decision.status,
      selectedProvider: decision.selectedProvider,
      selectedSdkName: decision.selectedSdkName,
      selectedRuntime: decision.selectedRuntime,
      selectedAdapterStrategy: decision.selectedAdapterStrategy,
      sdkInstallAllowed: decision.sdkInstallAllowed,
      sdkImportAllowed: decision.sdkImportAllowed,
      databaseClientCreationAllowed: decision.databaseClientCreationAllowed,
      routeBindingAllowed: decision.routeBindingAllowed,
      factoryBindingAllowed: decision.factoryBindingAllowed,
      decisionRules: summarizePublicResultDatabaseSdkDecisionRules(),
      reasons: decision.reasons,
      rejectedAlternatives: decision.rejectedAlternatives,
      failureModes: decision.failureModes,
      securityModel: decision.securityModel
    },
    implementationScan: {
      checkedFiles: CHECKED_FILES,
      implementationFiles: IMPLEMENTATION_FILES,
      blockedPaths,
      installedDatabasePackages,
      importedDatabaseSdkSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingDecisionPhrases
    },
    coverage: {
      databaseClientConfigIssueCount: databaseClientConfigContract.issues.length,
      checkedFileCount: CHECKED_FILES.length,
      implementationFileCount: IMPLEMENTATION_FILES.length,
      decisionRuleCount: PUBLIC_RESULT_DATABASE_SDK_DECISION_RULES.length,
      rejectedAlternativeCount: decision.rejectedAlternatives.length,
      failureModeCount: decision.failureModes.length,
      securityRuleCount: decision.securityModel.length,
      blockedPathCount: blockedPaths.length,
      installedDatabasePackageCount: installedDatabasePackages.length,
      importedDatabaseSdkSignalCount: importedDatabaseSdkSignals.length,
      blockedIntegrationSignalCount: blockedIntegrationSignals.length,
      persistentRouteCount: persistentPublicLookupRouteFiles.length
    },
    issues: buildIssues(completeGates, {
      databaseClientConfigIssues: databaseClientConfigContract.issues,
      blockedPaths,
      installedDatabasePackages,
      importedDatabaseSdkSignals,
      blockedIntegrationSignals,
      persistentPublicLookupRouteFiles,
      missingDecisionPhrases
    })
  };
}

export function writeDatabaseSdkSelectionDecisionRecordEvidence(
  report: DatabaseSdkSelectionDecisionRecordReport,
  outputPath = 'docs/evidence/database-sdk-selection-decision-record-latest.json'
): void {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

function readEvidence(repoRoot: string, relativePath: string, label: string): {
  readonly overallPassed: boolean;
  readonly issues: readonly string[];
} {
  const evidencePath = path.join(repoRoot, relativePath);
  if (!existsSync(evidencePath)) return { overallPassed: false, issues: [`missing_${label}_evidence`] };
  const parsed = JSON.parse(readFileSync(evidencePath, 'utf8')) as unknown;
  if (!isRecord(parsed)) return { overallPassed: false, issues: [`invalid_${label}_evidence`] };
  const gates = isRecord(parsed.gates) ? parsed.gates : {};
  const rawIssues = Array.isArray(parsed.issues) ? parsed.issues.filter((item): item is string => typeof item === 'string') : [];
  return { overallPassed: gates.overallPassed === true, issues: rawIssues };
}

function buildScriptSummary(packageJson: PackageJsonSubset): DatabaseSdkSelectionDecisionRecordReport['scripts'] {
  const scripts: {
    validate?: string;
    databaseClientConfigContract?: string;
    databaseSdkDecisionRecord?: string;
  } = {};
  if (packageJson.scripts?.validate !== undefined) scripts.validate = packageJson.scripts.validate;
  if (packageJson.scripts?.['contract:database-client-config'] !== undefined) scripts.databaseClientConfigContract = packageJson.scripts['contract:database-client-config'];
  if (packageJson.scripts?.['contract:database-sdk-decision'] !== undefined) scripts.databaseSdkDecisionRecord = packageJson.scripts['contract:database-sdk-decision'];
  return scripts;
}

function buildIssues(
  gates: DatabaseSdkSelectionDecisionRecordReport['gates'],
  inputs: Readonly<{
    databaseClientConfigIssues: readonly string[];
    blockedPaths: readonly string[];
    installedDatabasePackages: readonly string[];
    importedDatabaseSdkSignals: readonly string[];
    blockedIntegrationSignals: readonly string[];
    persistentPublicLookupRouteFiles: readonly string[];
    missingDecisionPhrases: readonly string[];
  }>
): string[] {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) issues.push(`database_sdk_selection_decision_record_failed:${key}`);
  }
  for (const issue of inputs.databaseClientConfigIssues) issues.push(`database_client_configuration_contract:${issue}`);
  for (const item of inputs.blockedPaths) issues.push(`blocked_scope_path:${item}`);
  for (const item of inputs.installedDatabasePackages) issues.push(`installed_database_package:${item}`);
  for (const signal of inputs.importedDatabaseSdkSignals) issues.push(`imported_database_sdk_signal:${signal}`);
  for (const signal of inputs.blockedIntegrationSignals) issues.push(`blocked_integration_signal:${signal}`);
  for (const item of inputs.persistentPublicLookupRouteFiles) issues.push(`persistent_public_route_present:${item}`);
  for (const phrase of inputs.missingDecisionPhrases) issues.push(`missing_decision_phrase:${phrase}`);
  return [...new Set(issues)].sort();
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return {};
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) return '';
  return readFileSync(absolutePath, 'utf8');
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): readonly string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath))).sort();
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => source.includes(signal)).sort();
}

function findDependencySignals(packageJson: PackageJsonSubset, dependencyNames: readonly string[]): readonly string[] {
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  return dependencyNames.filter((name) => dependencies[name] !== undefined).sort();
}

function missingSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => !source.includes(signal)).sort();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
