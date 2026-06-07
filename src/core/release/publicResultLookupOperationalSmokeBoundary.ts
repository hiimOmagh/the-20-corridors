import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicResultLookupOperationalSmokeEnvironment,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR,
  runPublicResultLookupOperationalSmokeBoundary,
  summarizePublicResultLookupOperationalSmokeRules
} from '../public-link/publicResultLookupOperationalSmokeBoundary';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
} from '../public-link/publicResultApiRouteDatabaseBindingImplementation';

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_SCHEMA_VERSION =
  'phase-8.20-public-result-lookup-operational-smoke-boundary-gate-v1' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_ID =
  'phase-8-public-result-lookup-operational-smoke-boundary' as const;

export interface PublicResultLookupOperationalSmokeBoundaryGateOptions {
  readonly repoRoot?: string;
}

export interface PublicResultLookupOperationalSmokeBoundaryGateReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_SCHEMA_VERSION;
  readonly gateId: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_ID;
    readonly boundarySchemaVersion: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly implementationGateEvidencePassed: boolean;
    readonly smokeScriptExists: boolean;
    readonly validateScriptRunsSmokeBoundary: boolean;
    readonly defaultSmokeBlocked: boolean;
    readonly productionSmokeRejected: boolean;
    readonly rollbackBlocksSmoke: boolean;
    readonly missingInvalidEnvFailsClosed: boolean;
    readonly optInSmokePassed: boolean;
    readonly dtoOnlyRenderingVerified: boolean;
    readonly unavailableStatesVerified: boolean;
    readonly noRawAnswersExposed: boolean;
    readonly noRawDeleteTokenExposed: boolean;
    readonly networkSmokeDisabledByDefault: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly overallPassed: boolean;
  };
  readonly smoke: {
    readonly phase: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE;
    readonly defaultStatus: string;
    readonly productionStatus: string;
    readonly rollbackStatus: string;
    readonly invalidEnvStatus: string;
    readonly optInStatus: string;
    readonly activeLookupStatus: string;
    readonly activeLookupHttpStatus: number | null;
    readonly readMissStatus: string;
    readonly readMissHttpStatus: number | null;
    readonly deletedStatus: string;
    readonly deletedHttpStatus: number | null;
    readonly expiredStatus: string;
    readonly expiredHttpStatus: number | null;
    readonly networkLookupSmokeExecuted: boolean;
    readonly productionNetworkLookupSmokeExecuted: boolean;
    readonly rules: readonly string[];
  };
  readonly coverage: {
    readonly checkedScenarioCount: number;
    readonly ruleCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset { readonly scripts?: Record<string, string>; }
type JsonRecord = Record<string, unknown>;

const IMPLEMENTATION_EVIDENCE_PATH = 'docs/evidence/public-result-lookup-page-implementation-gate-latest.json';

export async function runPublicResultLookupOperationalSmokeBoundaryGate(
  options: PublicResultLookupOperationalSmokeBoundaryGateOptions = {}
): Promise<PublicResultLookupOperationalSmokeBoundaryGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const implementationEvidence = readEvidence(repoRoot, IMPLEMENTATION_EVIDENCE_PATH);
  const completeEnv = buildCompletePublicResultLookupOperationalSmokeEnvironment();

  const defaultSmoke = await runPublicResultLookupOperationalSmokeBoundary({
    env: {},
    context: 'public-result-lookup-operational-smoke-gate'
  });
  const productionSmoke = await runPublicResultLookupOperationalSmokeBoundary({
    env: { ...completeEnv, [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV]: 'production' },
    context: 'public-result-lookup-operational-smoke-gate'
  });
  const rollbackSmoke = await runPublicResultLookupOperationalSmokeBoundary({
    env: { ...completeEnv, [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY },
    context: 'public-result-lookup-operational-smoke-gate'
  });
  const invalidEnvSmoke = await runPublicResultLookupOperationalSmokeBoundary({
    env: {
      [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED,
      [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV]: 'non-production',
      [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR
    },
    context: 'public-result-lookup-operational-smoke-gate'
  });
  const optInSmoke = await runPublicResultLookupOperationalSmokeBoundary({
    env: completeEnv,
    context: 'public-result-lookup-operational-smoke-gate'
  });

  const gates = {
    implementationGateEvidencePassed: evidencePassed(implementationEvidence),
    smokeScriptExists: packageJson.scripts?.['smoke:public-lookup-operational'] === 'tsx scripts/public-result-lookup-operational-smoke-boundary.ts',
    validateScriptRunsSmokeBoundary: validateScript.includes('npm run smoke:public-lookup-operational'),
    defaultSmokeBlocked: defaultSmoke.status === 'public-result-lookup-operational-smoke-blocked' && !defaultSmoke.networkLookupSmokeExecuted,
    productionSmokeRejected: productionSmoke.status === 'public-result-lookup-operational-smoke-blocked' && productionSmoke.productionEnvironmentRejected && !productionSmoke.networkLookupSmokeExecuted,
    rollbackBlocksSmoke: rollbackSmoke.status === 'public-result-lookup-operational-smoke-blocked' && rollbackSmoke.rollbackToMemoryRequested && !rollbackSmoke.networkLookupSmokeExecuted,
    missingInvalidEnvFailsClosed: invalidEnvSmoke.status === 'public-result-lookup-operational-smoke-configuration-error' && !invalidEnvSmoke.networkLookupSmokeExecuted,
    optInSmokePassed: optInSmoke.status === 'public-result-lookup-operational-smoke-passed',
    dtoOnlyRenderingVerified: optInSmoke.dtoOnlyRenderingVerified,
    unavailableStatesVerified: optInSmoke.readMissLookup.status === 'public-result-page-not-found' && optInSmoke.deletedLookup.status === 'public-result-page-deleted-unavailable' && optInSmoke.expiredLookup.status === 'public-result-page-expired-unavailable' && optInSmoke.deletedExpiredMissingExposeNoDto,
    noRawAnswersExposed: !optInSmoke.rawAnswersExposed,
    noRawDeleteTokenExposed: !optInSmoke.rawDeleteTokenExposed,
    networkSmokeDisabledByDefault: !defaultSmoke.networkLookupSmokeExecuted && !optInSmoke.productionNetworkLookupSmokeExecuted,
    noProductionMutationSmoke: !optInSmoke.productionMutationSmokeExecuted,
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...optInSmoke.issues.map((issue) => `opt_in_smoke:${issue}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_SCHEMA_VERSION,
    gateId: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_GATE_ID,
      boundarySchemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION
    },
    gates: finalGates,
    smoke: {
      phase: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE,
      defaultStatus: defaultSmoke.status,
      productionStatus: productionSmoke.status,
      rollbackStatus: rollbackSmoke.status,
      invalidEnvStatus: invalidEnvSmoke.status,
      optInStatus: optInSmoke.status,
      activeLookupStatus: optInSmoke.activeLookup.status,
      activeLookupHttpStatus: optInSmoke.activeLookup.httpStatus,
      readMissStatus: optInSmoke.readMissLookup.status,
      readMissHttpStatus: optInSmoke.readMissLookup.httpStatus,
      deletedStatus: optInSmoke.deletedLookup.status,
      deletedHttpStatus: optInSmoke.deletedLookup.httpStatus,
      expiredStatus: optInSmoke.expiredLookup.status,
      expiredHttpStatus: optInSmoke.expiredLookup.httpStatus,
      networkLookupSmokeExecuted: optInSmoke.networkLookupSmokeExecuted,
      productionNetworkLookupSmokeExecuted: optInSmoke.productionNetworkLookupSmokeExecuted,
      rules: summarizePublicResultLookupOperationalSmokeRules()
    },
    coverage: {
      checkedScenarioCount: 5,
      ruleCount: summarizePublicResultLookupOperationalSmokeRules().length
    },
    issues
  };
}

export function writePublicResultLookupOperationalSmokeBoundaryEvidence(
  report: PublicResultLookupOperationalSmokeBoundaryGateReport,
  evidencePath: string
): void {
  const target = path.resolve(process.cwd(), evidencePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  return JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as PackageJsonSubset;
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
  if (typeof gates === 'object' && gates !== null && 'overallPassed' in gates) {
    return (gates as { readonly overallPassed?: unknown }).overallPassed === true;
  }
  return evidence.overallPassed === true;
}

function gateIssues(gates: Record<string, boolean>): readonly string[] {
  return Object.entries(gates).filter(([, passed]) => !passed).map(([gate]) => `gate_failed:${gate}`);
}
