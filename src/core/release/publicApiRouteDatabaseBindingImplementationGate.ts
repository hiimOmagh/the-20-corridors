import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import { buildPublicResultCreateRequestDto, buildPublicResultDeleteRequestDto } from '../public-link/publicResultApi';
import {
  buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment,
  buildPublicResultApiRouteDatabaseBindingRollbackEnvironment,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION,
  resolvePublicResultApiRouteDatabaseBindingImplementationDecision,
  summarizePublicResultApiRouteDatabaseBindingImplementationRules
} from '../public-link/publicResultApiRouteDatabaseBindingImplementation';
import type {
  PublicResultDatabaseQueryExecutionResult,
  PublicResultDatabaseQueryExecutor,
  PublicResultDatabaseStorageAdapterRow
} from '../public-link/publicResultDatabaseStorageAdapter';
import type { PublicResultDatabaseParameterizedQueryDescriptor, PublicResultDatabaseQueryIntentName } from '../public-link/publicResultDatabaseClientQueryReadiness';

import { buildPublicResultDto } from '../public-link/publicResultDto';
import {
  handlePublicResultCreateRouteBody,
  handlePublicResultDeleteRouteBody,
  handlePublicResultReadRoute,
  PUBLIC_RESULT_ROUTE_HANDLERS_MODE
} from '../public-link/publicResultRouteHandlers';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from '../public-link/publicResultStorage';

export const PUBLIC_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_GATE_SCHEMA_VERSION =
  'phase-8.14-public-api-route-database-binding-implementation-gate-v1' as const;
export const PUBLIC_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_GATE_ID =
  'phase-8-public-api-route-database-binding-implementation-gate' as const;

export interface PublicApiRouteDatabaseBindingImplementationGateOptions {
  readonly repoRoot?: string;
}

export interface PublicApiRouteDatabaseBindingImplementationGateReport {
  readonly schemaVersion: typeof PUBLIC_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_GATE_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-8-14-public-api-route-database-binding-implementation-gate';
    readonly implementationSchemaVersion: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION;
    readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  };
  readonly gates: {
    readonly routeBindingActivationContractPassed: boolean;
    readonly routeBindingDryRunContractPassed: boolean;
    readonly implementationScriptExists: boolean;
    readonly validateScriptRunsImplementation: boolean;
    readonly implementationModuleExists: boolean;
    readonly implementationGuardModuleExists: boolean;
    readonly implementationDocExists: boolean;
    readonly phase814StatusDocExists: boolean;
    readonly defaultMemoryModePreserved: boolean;
    readonly rollbackMemoryModePreserved: boolean;
    readonly databaseBindingCanBeSelected: boolean;
    readonly databaseModeAloneBlocked: boolean;
    readonly missingImplementationFlagBlocked: boolean;
    readonly publicLookupActivationStillBlocked: boolean;
    readonly routeHandlersUseImplementationResolver: boolean;
    readonly routeFlowDatabaseBindingSimulationPassed: boolean;
    readonly routeHeadersRemainStable: boolean;
    readonly rawDeleteTokenNotPersisted: boolean;
    readonly rawAnswersNotExposed: boolean;
    readonly noPersistentPublicLookupRoute: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly noNetworkQueryDuringSelection: boolean;
    readonly buildScopeRemainsApiOnly: boolean;
    readonly overallPassed: boolean;
  };
  readonly implementation: {
    readonly phase: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE;
    readonly defaultStatus: string;
    readonly rollbackStatus: string;
    readonly databaseStatus: string;
    readonly databaseModeAloneStatus: string;
    readonly missingImplementationFlagStatus: string;
    readonly publicLookupFlagStatus: string;
    readonly implementationFlagEnv: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV;
    readonly implementationFlagRequiredValue: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED;
    readonly routeBindingAppliedInDecision: boolean;
    readonly rollbackAvailable: boolean;
    readonly rules: readonly string[];
  };
  readonly routeSimulation: {
    readonly createStatus: number;
    readonly readStatus: number;
    readonly deleteStatus: number;
    readonly readAfterDeleteStatus: number;
    readonly createHeaderMode: string | undefined;
    readonly executedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
    readonly uniqueExecutedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
    readonly networkQueryExecuted: false;
    readonly productionMutationSmoke: false;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly routeBindingResolverSignals: readonly string[];
    readonly persistentPublicLookupRouteFiles: readonly string[];
    readonly blockedIntegrationSignals: readonly string[];
  };
  readonly coverage: {
    readonly checkedFileCount: number;
    readonly executedQueryIntentCount: number;
    readonly uniqueExecutedQueryIntentCount: number;
    readonly persistentRouteCount: number;
    readonly blockedIntegrationSignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }

const IMPLEMENTATION_MODULE = 'src/core/public-link/publicResultApiRouteDatabaseBindingImplementation.ts';
const IMPLEMENTATION_GUARD_MODULE = 'src/core/release/publicApiRouteDatabaseBindingImplementationGate.ts';
const IMPLEMENTATION_SCRIPT = 'scripts/public-api-route-database-binding-implementation-gate.ts';
const IMPLEMENTATION_DOC = 'docs/release/phase-8-public-api-route-database-binding-implementation-gate.md';
const PHASE_8_14_STATUS_DOC = 'docs/ui/phase-8-14-public-api-route-database-binding-implementation-gate-status.md';
const ROUTE_HANDLERS_MODULE = 'src/core/public-link/publicResultRouteHandlers.ts';
const PHASE_8_TRANSITION_DOC = 'docs/ui/phase-8-transition-plan.md';
const CHECKED_FILES = [IMPLEMENTATION_MODULE, IMPLEMENTATION_SCRIPT, IMPLEMENTATION_DOC, PHASE_8_14_STATUS_DOC, ROUTE_HANDLERS_MODULE, PHASE_8_TRANSITION_DOC] as const;
const PERSISTENT_PUBLIC_LOOKUP_ROUTES = ['src/app/r/[publicId]', 'src/app/r/[resultId]', 'src/app/r/[slug]', 'src/app/results/[publicId]', 'src/app/results/[resultId]'] as const;
const BLOCKED_INTEGRATION_SIGNALS = ['OpenAI(', 'generateText(', 'streamText(', '@stripe', 'stripe.checkout', 'auth(', 'signIn(', 'signOut(', 'posthog.capture', 'analytics.track', 'telemetry.capture'] as const;
const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';
const CREATED_AT = '2026-06-06T12:00:00.000Z';
const PUBLIC_ID = 'pub_8A14DatabaseBinding12345678';
const DELETE_TOKEN = 'delete_8A14DatabaseBinding_123456789';

export async function runPublicApiRouteDatabaseBindingImplementationGate(
  options: PublicApiRouteDatabaseBindingImplementationGateOptions = {}
): Promise<PublicApiRouteDatabaseBindingImplementationGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const activationEvidence = readEvidence(repoRoot, 'docs/evidence/public-route-database-binding-activation-contract-latest.json');
  const dryRunEvidence = readEvidence(repoRoot, 'docs/evidence/public-route-database-binding-dry-run-contract-latest.json');
  const defaultDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: {}, context: 'public-api-route-handler' });
  const rollbackDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: buildPublicResultApiRouteDatabaseBindingRollbackEnvironment(), context: 'public-api-route-handler' });
  const databaseEnv = buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment();
  const databaseDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: databaseEnv, context: 'public-api-route-handler' });
  const databaseModeAlone = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: { PUBLIC_RESULT_STORAGE_MODE: 'database' }, context: 'public-api-route-handler' });
  const missingImplementationFlag = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: withoutKey(databaseEnv, PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV), context: 'public-api-route-handler' });
  const publicLookupFlag = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: { ...databaseEnv, PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION: 'enabled' }, context: 'public-api-route-handler' });
  const simulation = await runRouteBindingSimulation(databaseEnv);
  const scan = scanImplementation(repoRoot);

  const gates = {
    routeBindingActivationContractPassed: evidencePassed(activationEvidence),
    routeBindingDryRunContractPassed: evidencePassed(dryRunEvidence),
    implementationScriptExists: existsSync(path.join(repoRoot, IMPLEMENTATION_SCRIPT)),
    validateScriptRunsImplementation: validateScript.includes('npm run gate:api-route-database-binding'),
    implementationModuleExists: existsSync(path.join(repoRoot, IMPLEMENTATION_MODULE)),
    implementationGuardModuleExists: existsSync(path.join(repoRoot, IMPLEMENTATION_GUARD_MODULE)),
    implementationDocExists: existsSync(path.join(repoRoot, IMPLEMENTATION_DOC)),
    phase814StatusDocExists: existsSync(path.join(repoRoot, PHASE_8_14_STATUS_DOC)),
    defaultMemoryModePreserved: defaultDecision.status === 'memory-adapter-selected-default',
    rollbackMemoryModePreserved: rollbackDecision.status === 'memory-adapter-selected-rollback',
    databaseBindingCanBeSelected: databaseDecision.status === 'database-adapter-selected-for-public-api-route' && databaseDecision.routeBindingApplied,
    databaseModeAloneBlocked: databaseModeAlone.status === 'api-route-database-binding-implementation-blocked',
    missingImplementationFlagBlocked: missingImplementationFlag.status === 'api-route-database-binding-implementation-blocked',
    publicLookupActivationStillBlocked: publicLookupFlag.status === 'api-route-database-binding-implementation-blocked' && !publicLookupFlag.publicResultPageLookupActivationAllowed,
    routeHandlersUseImplementationResolver: scan.routeBindingResolverSignals.length >= 2,
    routeFlowDatabaseBindingSimulationPassed: simulation.passed,
    routeHeadersRemainStable: simulation.create.headers['X-20C-Route-Mode'] === PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
    rawDeleteTokenNotPersisted: !JSON.stringify(simulation.rows).includes(DELETE_TOKEN),
    rawAnswersNotExposed: !JSON.stringify(simulation.createBody).includes('answers'),
    noPersistentPublicLookupRoute: scan.persistentPublicLookupRouteFiles.length === 0,
    noProductionMutationSmoke: !simulation.productionMutationSmoke,
    noNetworkQueryDuringSelection: !simulation.networkQueryExecuted,
    buildScopeRemainsApiOnly: !existsSync(path.join(repoRoot, 'src/app/r/[publicId]')),
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...databaseDecision.issues.map((issue) => `database_decision:${issue}`),
    ...scan.blockedIntegrationSignals.map((signal) => `blocked_integration_signal:${signal}`),
    ...scan.persistentPublicLookupRouteFiles.map((file) => `persistent_public_lookup_route_present:${file}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_GATE_SCHEMA_VERSION,
    contractId: PUBLIC_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: 'phase-8-14-public-api-route-database-binding-implementation-gate',
      implementationSchemaVersion: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION,
      routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE
    },
    gates: finalGates,
    implementation: {
      phase: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE,
      defaultStatus: defaultDecision.status,
      rollbackStatus: rollbackDecision.status,
      databaseStatus: databaseDecision.status,
      databaseModeAloneStatus: databaseModeAlone.status,
      missingImplementationFlagStatus: missingImplementationFlag.status,
      publicLookupFlagStatus: publicLookupFlag.status,
      implementationFlagEnv: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV,
      implementationFlagRequiredValue: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED,
      routeBindingAppliedInDecision: databaseDecision.routeBindingApplied,
      rollbackAvailable: databaseDecision.rollbackAvailable,
      rules: summarizePublicResultApiRouteDatabaseBindingImplementationRules()
    },
    routeSimulation: {
      createStatus: simulation.create.status,
      readStatus: simulation.read.status,
      deleteStatus: simulation.deleted.status,
      readAfterDeleteStatus: simulation.readAfterDelete.status,
      createHeaderMode: simulation.create.headers['X-20C-Route-Mode'],
      executedQueryIntents: simulation.executedQueryIntents,
      uniqueExecutedQueryIntents: unique(simulation.executedQueryIntents),
      networkQueryExecuted: false,
      productionMutationSmoke: false
    },
    implementationScan: scan,
    coverage: {
      checkedFileCount: CHECKED_FILES.length,
      executedQueryIntentCount: simulation.executedQueryIntents.length,
      uniqueExecutedQueryIntentCount: unique(simulation.executedQueryIntents).length,
      persistentRouteCount: scan.persistentPublicLookupRouteFiles.length,
      blockedIntegrationSignalCount: scan.blockedIntegrationSignals.length
    },
    issues
  };
}

export function writePublicApiRouteDatabaseBindingImplementationGateEvidence(report: PublicApiRouteDatabaseBindingImplementationGateReport, evidencePath: string): void {
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function runRouteBindingSimulation(env: ReturnType<typeof buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment>) {
  const fake = createFakeExecutor();
  const createBody = buildCreateRouteBody();
  const options = { env, databaseExecuteQuery: fake.executeQuery, nowIso: CREATED_AT };
  const create = await handlePublicResultCreateRouteBody(createBody, options);
  const read = await handlePublicResultReadRoute(PUBLIC_ID, options);
  const deleted = await handlePublicResultDeleteRouteBody(PUBLIC_ID, buildPublicResultDeleteRequestDto(PUBLIC_ID, DELETE_TOKEN), options);
  const readAfterDelete = await handlePublicResultReadRoute(PUBLIC_ID, options);
  return {
    create,
    read,
    deleted,
    readAfterDelete,
    createBody,
    rows: fake.rows(),
    executedQueryIntents: fake.executedQueryIntents(),
    networkQueryExecuted: false as const,
    productionMutationSmoke: false as const,
    passed: create.status === 201 && read.status === 200 && deleted.status === 200 && readAfterDelete.status === 410
  };
}

function buildCreateRouteBody() {
  const expiresAt = buildDefaultPublicResultExpiry(CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), { resultId: PUBLIC_ID, createdAt: CREATED_AT, expiresAt, deleteTokenHash });
  return { ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_8_14_route_binding_implementation'), deleteToken: DELETE_TOKEN };
}

function createFakeExecutor(): { readonly executeQuery: PublicResultDatabaseQueryExecutor; readonly executedQueryIntents: () => readonly PublicResultDatabaseQueryIntentName[]; readonly rows: () => readonly PublicResultDatabaseStorageAdapterRow[] } {
  let row: PublicResultDatabaseStorageAdapterRow | null = null;
  const executed: PublicResultDatabaseQueryIntentName[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);
    if (descriptor.intentName === 'insert-public-result-record') {
      row = rowFromInsertDescriptor(descriptor);
      return { rows: [row], rowCount: 1 };
    }
    if (descriptor.intentName === 'read-active-public-result-by-public-id') {
      if (row === null || row.public_id !== descriptor.values[0]) return emptyResult();
      return { rows: [withReadDisposition(row)], rowCount: 1 };
    }
    if (descriptor.intentName === 'verify-delete-token-hash-for-public-id') {
      const [publicId, deleteTokenHash] = descriptor.values;
      return row !== null && row.public_id === publicId && row.delete_token_hash === deleteTokenHash && row.deleted_at === null ? { rows: [row], rowCount: 1 } : emptyResult();
    }
    if (descriptor.intentName === 'soft-delete-public-result-by-public-id') {
      const [publicId, deleteTokenHash, deletedAtIso, updatedAtIso] = descriptor.values;
      if (row === null || row.public_id !== publicId || row.delete_token_hash !== deleteTokenHash || row.deleted_at !== null) return emptyResult();
      row = { ...row, deleted_at: String(deletedAtIso), updated_at: String(updatedAtIso), status: 'deleted' };
      return { rows: [row], rowCount: 1 };
    }
    return emptyResult();
  };
  return { executeQuery, executedQueryIntents: () => [...executed], rows: () => (row === null ? [] : [row]) };
}

function rowFromInsertDescriptor(descriptor: PublicResultDatabaseParameterizedQueryDescriptor): PublicResultDatabaseStorageAdapterRow {
  return {
    schema_version: String(valueByName(descriptor, 'schema_version')),
    public_id: String(valueByName(descriptor, 'public_id')),
    dto: valueByName(descriptor, 'dto'),
    delete_token_hash: String(valueByName(descriptor, 'delete_token_hash')),
    created_at: String(valueByName(descriptor, 'created_at')),
    expires_at: String(valueByName(descriptor, 'expires_at')),
    deleted_at: null,
    status: 'active',
    updated_at: String(valueByName(descriptor, 'updated_at'))
  };
}

function valueByName(descriptor: PublicResultDatabaseParameterizedQueryDescriptor, name: string): unknown {
  const index = descriptor.parameterOrder.indexOf(name);
  if (index < 0) throw new Error(`Missing descriptor parameter: ${name}`);
  return descriptor.values[index];
}

function withReadDisposition(row: PublicResultDatabaseStorageAdapterRow): PublicResultDatabaseStorageAdapterRow {
  if (row.deleted_at !== null || row.status === 'deleted') return { ...row, read_disposition: 'deleted' };
  return { ...row, read_disposition: row.status };
}

function emptyResult(): PublicResultDatabaseQueryExecutionResult { return { rows: [], rowCount: 0 }; }
function unique(values: readonly PublicResultDatabaseQueryIntentName[]): readonly PublicResultDatabaseQueryIntentName[] { return [...new Set(values)]; }
function readPackageJson(repoRoot: string): PackageJsonSubset { return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset; }
function readEvidence(repoRoot: string, relativePath: string): unknown { const p = path.join(repoRoot, relativePath); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) as unknown : null; }
function evidencePassed(evidence: unknown): boolean { return isRecord(evidence) && isRecord(evidence.gates) && evidence.gates.overallPassed === true; }
function withoutKey<T extends Record<string, string | undefined>>(input: T, key: string): T { const copy = { ...input }; delete copy[key]; return copy; }
function gateIssues(gates: Record<string, boolean>): readonly string[] { return Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => `gate_failed:${name}`); }
function scanImplementation(repoRoot: string): PublicApiRouteDatabaseBindingImplementationGateReport['implementationScan'] {
  const routeBindingResolverSignals: string[] = [];
  const blockedIntegrationSignals: string[] = [];
  for (const relativeFile of CHECKED_FILES) {
    const filePath = path.join(repoRoot, relativeFile);
    if (!existsSync(filePath)) continue;
    const source = readFileSync(filePath, 'utf8');
    if (source.includes('createPublicResultApiRouteDatabaseBindingStorageAdapter')) routeBindingResolverSignals.push(`${relativeFile}:adapter-resolver`);
    if (source.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION')) routeBindingResolverSignals.push(`${relativeFile}:implementation-flag`);
    for (const signal of BLOCKED_INTEGRATION_SIGNALS) if (source.includes(signal)) blockedIntegrationSignals.push(`${relativeFile}:${signal}`);
  }
  return {
    checkedFiles: CHECKED_FILES,
    routeBindingResolverSignals,
    persistentPublicLookupRouteFiles: PERSISTENT_PUBLIC_LOOKUP_ROUTES.filter((route) => existsSync(path.join(repoRoot, route))),
    blockedIntegrationSignals
  };
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
