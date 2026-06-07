import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildCompletePublicLookupOperationalRollbackDrillEnvironment,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION,
  runPublicLookupOperationalRollbackDrill,
  summarizePublicLookupOperationalRollbackDrillRules
} from '../public-link/publicResultLookupOperationalRollbackDrill';

export const PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_SCHEMA_VERSION =
  'phase-8.21-public-lookup-operational-rollback-drill-gate-v1' as const;
export const PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_ID =
  'phase-8-public-lookup-operational-rollback-drill' as const;

export interface PublicLookupOperationalRollbackDrillGateOptions {
  readonly repoRoot?: string;
}

export interface PublicLookupOperationalRollbackDrillGateReport {
  readonly schemaVersion: typeof PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_SCHEMA_VERSION;
  readonly gateId: typeof PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: typeof PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_ID;
    readonly drillSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION;
  };
  readonly gates: {
    readonly operationalSmokeEvidencePassed: boolean;
    readonly drillScriptExists: boolean;
    readonly validateScriptRunsRollbackDrill: boolean;
    readonly drillOptInPassed: boolean;
    readonly apiRouteBindingActiveBeforeRollback: boolean;
    readonly publicLookupRenderableBeforeRollback: boolean;
    readonly operationalSmokeGreenBeforeRollback: boolean;
    readonly rollbackForcesApiRouteStorageToMemory: boolean;
    readonly rollbackDisablesPublicLookupRendering: boolean;
    readonly rollbackDoesNotExposeStaleDatabaseDto: boolean;
    readonly unavailableStatesRemainDtoFreeAfterRollback: boolean;
    readonly noRawAnswersExposed: boolean;
    readonly noRawDeleteTokenExposed: boolean;
    readonly noProductionNetworkLookupSmoke: boolean;
    readonly noProductionMutationSmoke: boolean;
    readonly overallPassed: boolean;
  };
  readonly drill: {
    readonly phase: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE;
    readonly status: string;
    readonly apiRouteBeforeRollbackStatus: string;
    readonly publicLookupBeforeRollbackStatus: string;
    readonly publicLookupBeforeRollbackHttpStatus: number;
    readonly apiRouteAfterRollbackStatus: string;
    readonly publicLookupAfterRollbackStatus: string;
    readonly publicLookupAfterRollbackHttpStatus: number;
    readonly missingAfterRollbackStatus: string;
    readonly deletedAfterRollbackStatus: string;
    readonly expiredAfterRollbackStatus: string;
    readonly networkLookupSmokeExecuted: boolean;
    readonly productionNetworkLookupSmokeExecuted: boolean;
    readonly productionMutationSmokeExecuted: boolean;
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

const OPERATIONAL_SMOKE_EVIDENCE_PATH = 'docs/evidence/public-result-lookup-operational-smoke-boundary-latest.json';

export async function runPublicLookupOperationalRollbackDrillGate(
  options: PublicLookupOperationalRollbackDrillGateOptions = {}
): Promise<PublicLookupOperationalRollbackDrillGateReport> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const operationalSmokeEvidence = readEvidence(repoRoot, OPERATIONAL_SMOKE_EVIDENCE_PATH);
  const drill = await runPublicLookupOperationalRollbackDrill({
    env: buildCompletePublicLookupOperationalRollbackDrillEnvironment(),
    context: 'public-lookup-operational-rollback-drill-gate'
  });

  const gates = {
    operationalSmokeEvidencePassed: evidencePassed(operationalSmokeEvidence),
    drillScriptExists: packageJson.scripts?.['drill:public-lookup-rollback'] === 'tsx scripts/public-lookup-operational-rollback-drill.ts',
    validateScriptRunsRollbackDrill: validateScript.includes('npm run drill:public-lookup-rollback'),
    drillOptInPassed: drill.status === 'public-lookup-operational-rollback-drill-passed',
    apiRouteBindingActiveBeforeRollback: drill.apiRouteDatabaseBindingBeforeRollbackActive,
    publicLookupRenderableBeforeRollback: drill.publicLookupBeforeRollbackRenderable,
    operationalSmokeGreenBeforeRollback: drill.operationalSmokeBeforeRollbackStatus === 'public-result-lookup-operational-smoke-passed',
    rollbackForcesApiRouteStorageToMemory: drill.apiRouteStorageAfterRollbackMemorySelected,
    rollbackDisablesPublicLookupRendering: drill.rollbackDisablesPublicLookupRendering,
    rollbackDoesNotExposeStaleDatabaseDto: drill.rollbackDoesNotExposeStaleDatabaseDto,
    unavailableStatesRemainDtoFreeAfterRollback: drill.unavailableStatesRemainDtoFreeAfterRollback,
    noRawAnswersExposed: !drill.rawAnswersExposed,
    noRawDeleteTokenExposed: !drill.rawDeleteTokenExposed,
    noProductionNetworkLookupSmoke: !drill.networkLookupSmokeExecuted && !drill.productionNetworkLookupSmokeExecuted,
    noProductionMutationSmoke: !drill.productionMutationSmokeExecuted,
    overallPassed: false
  };
  const { overallPassed: _unused, ...gatesBeforeOverall } = gates;
  const issues = [
    ...gateIssues(gatesBeforeOverall),
    ...drill.issues.map((issue) => `drill:${issue}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_SCHEMA_VERSION,
    gateId: PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: path.basename(repoRoot),
      phaseScope: PUBLIC_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_GATE_ID,
      drillSchemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION
    },
    gates: finalGates,
    drill: {
      phase: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE,
      status: drill.status,
      apiRouteBeforeRollbackStatus: drill.apiRouteDatabaseBindingBeforeRollbackStatus,
      publicLookupBeforeRollbackStatus: drill.publicLookupBeforeRollbackStatus,
      publicLookupBeforeRollbackHttpStatus: drill.publicLookupBeforeRollbackHttpStatus,
      apiRouteAfterRollbackStatus: drill.apiRouteStorageAfterRollbackStatus,
      publicLookupAfterRollbackStatus: drill.publicLookupAfterRollback.status,
      publicLookupAfterRollbackHttpStatus: drill.publicLookupAfterRollback.httpStatus,
      missingAfterRollbackStatus: drill.missingAfterRollback.status,
      deletedAfterRollbackStatus: drill.deletedAfterRollback.status,
      expiredAfterRollbackStatus: drill.expiredAfterRollback.status,
      networkLookupSmokeExecuted: drill.networkLookupSmokeExecuted,
      productionNetworkLookupSmokeExecuted: drill.productionNetworkLookupSmokeExecuted,
      productionMutationSmokeExecuted: drill.productionMutationSmokeExecuted,
      rules: summarizePublicLookupOperationalRollbackDrillRules()
    },
    coverage: {
      checkedScenarioCount: 8,
      ruleCount: summarizePublicLookupOperationalRollbackDrillRules().length
    },
    issues
  };
}

export function writePublicLookupOperationalRollbackDrillEvidence(
  report: PublicLookupOperationalRollbackDrillGateReport,
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
