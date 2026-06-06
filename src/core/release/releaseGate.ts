import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { runMethodologyAudit } from '../audit/methodologyAudit';
import { serializeGoldenProfileSnapshotDocument } from '../serialization/goldenSnapshots';

export const ENGINE_RELEASE_GATE_SCHEMA_VERSION = 'phase-2.0-engine-release-gate-v1' as const;
export const ENGINE_RELEASE_GATE_ID = 'engine-release-gate-phase-2.0' as const;

export interface EngineReleaseGateOptions {
  readonly repoRoot?: string;
}

export interface EngineReleaseGateReport {
  readonly schemaVersion: typeof ENGINE_RELEASE_GATE_SCHEMA_VERSION;
  readonly gateId: typeof ENGINE_RELEASE_GATE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly methodologyAuditSchemaVersion: string;
    readonly goldenSnapshotSchemaVersion: string;
    readonly phaseScope: 'phase-2-ui-scaffold';
  };
  readonly gates: {
    readonly methodologyAuditPassed: boolean;
    readonly methodologyEvidenceCurrent: boolean;
    readonly goldenSnapshotsCurrent: boolean;
    readonly noForbiddenGeneratedArtifacts: boolean;
    readonly approvedUiScopeAllowed: boolean;
    readonly noBlockedBackendDatabaseAiScope: boolean;
    readonly validateScriptRunsReleaseGate: boolean;
    readonly releaseScriptExists: boolean;
    readonly overallPassed: boolean;
  };
  readonly hygiene: {
    readonly forbiddenGeneratedArtifacts: readonly string[];
    readonly approvedUiScopeArtifacts: readonly string[];
    readonly blockedScopeArtifacts: readonly string[];
  };
  readonly scripts: {
    readonly validate?: string;
    readonly releaseEngine?: string;
  };
  readonly coverage: {
    readonly triggeredContradictionCount: number;
    readonly contradictionRuleCount: number;
    readonly goldenProfileCount: number;
    readonly edgeCaseProfileCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const METHODOLOGY_EVIDENCE_PATH = 'docs/evidence/methodology-audit-latest.json';
const GOLDEN_SNAPSHOT_PATH = 'docs/evidence/golden-public-results-latest.json';

const FORBIDDEN_GENERATED_ARTIFACTS = [
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'out',
  'playwright-report',
  'test-results'
] as const;

const APPROVED_UI_SCOPE_ARTIFACTS = [
  'next.config.ts',
  'next-env.d.ts',
  'public',
  'src/app',
  'src/components',
  'src/features',
  'src/styles'
] as const;

const BLOCKED_SCOPE_ARTIFACTS = [
  'app/api',
  'pages',
  'pages/api',
  'src/pages',
  'src/pages/api',
  'src/server',
  'src/api',
  'server',
  'api',
  'db',
  'database',
  'src/db',
  'src/database',
  'prisma',
  'supabase',
  'migrations',
  'ai',
  'llm',
  'prompts',
  'src/ai',
  'src/llm',
  'src/prompts',
  'src/core/ai',
  'src/core/llm',
  'src/core/prompts',
  'auth',
  'src/auth',
  'payments',
  'src/payments'
] as const;

export function runEngineReleaseGate(options: EngineReleaseGateOptions = {}): EngineReleaseGateReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const methodologyAudit = runMethodologyAudit();
  const expectedMethodologyEvidence = `${JSON.stringify(methodologyAudit, null, 2)}\n`;
  const expectedGoldenSnapshot = serializeGoldenProfileSnapshotDocument();
  const packageJson = readPackageJson(repoRoot);

  const forbiddenGeneratedArtifacts = existingPaths(repoRoot, FORBIDDEN_GENERATED_ARTIFACTS);
  const approvedUiScopeArtifacts = existingPaths(repoRoot, APPROVED_UI_SCOPE_ARTIFACTS);
  const blockedScopeArtifacts = existingPaths(repoRoot, BLOCKED_SCOPE_ARTIFACTS);
  const methodologyEvidenceCurrent = fileContentEquals(repoRoot, METHODOLOGY_EVIDENCE_PATH, expectedMethodologyEvidence);
  const goldenSnapshotsCurrent = fileContentEquals(repoRoot, GOLDEN_SNAPSHOT_PATH, expectedGoldenSnapshot);
  const releaseScriptExists = packageJson.scripts?.['release:engine'] === 'tsx scripts/engine-release-gate.ts';
  const validateScriptRunsReleaseGate = Boolean(packageJson.scripts?.validate?.includes('npm run release:engine'));

  const gates = {
    methodologyAuditPassed: methodologyAudit.gates.overallPassed,
    methodologyEvidenceCurrent,
    goldenSnapshotsCurrent,
    noForbiddenGeneratedArtifacts: forbiddenGeneratedArtifacts.length === 0,
    approvedUiScopeAllowed: true,
    noBlockedBackendDatabaseAiScope: blockedScopeArtifacts.length === 0,
    validateScriptRunsReleaseGate,
    releaseScriptExists,
    overallPassed: false
  };

  const overallPassed = Object.entries(gates)
    .filter(([key]) => key !== 'overallPassed')
    .every(([, value]) => value === true);

  const completeGates = {
    ...gates,
    overallPassed
  };

  return {
    schemaVersion: ENGINE_RELEASE_GATE_SCHEMA_VERSION,
    gateId: ENGINE_RELEASE_GATE_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      methodologyAuditSchemaVersion: methodologyAudit.schemaVersion,
      goldenSnapshotSchemaVersion: 'phase-1.6-golden-public-results-v1',
      phaseScope: 'phase-2-ui-scaffold'
    },
    gates: completeGates,
    hygiene: {
      forbiddenGeneratedArtifacts,
      approvedUiScopeArtifacts,
      blockedScopeArtifacts
    },
    scripts: buildScriptSummary(packageJson),
    coverage: {
      triggeredContradictionCount: methodologyAudit.coverage.triggeredContradictions.length,
      contradictionRuleCount: methodologyAudit.metadata.contradictionRuleCount,
      goldenProfileCount: methodologyAudit.metadata.goldenProfileCount,
      edgeCaseProfileCount: methodologyAudit.metadata.edgeCaseProfileCount
    },
    issues: buildIssues(completeGates, forbiddenGeneratedArtifacts, blockedScopeArtifacts)
  };
}

function buildScriptSummary(packageJson: PackageJsonSubset): EngineReleaseGateReport['scripts'] {
  const scripts: { validate?: string; releaseEngine?: string } = {};

  const validate = packageJson.scripts?.validate;
  const releaseEngine = packageJson.scripts?.['release:engine'];

  if (validate !== undefined) {
    scripts.validate = validate;
  }

  if (releaseEngine !== undefined) {
    scripts.releaseEngine = releaseEngine;
  }

  return scripts;
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {};
  }

  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;

  if (!isRecord(parsed)) {
    return {};
  }

  const scripts = parsed.scripts;

  if (!isRecordOfStrings(scripts)) {
    return {};
  }

  return { scripts };
}

function existingPaths(repoRoot: string, relativePaths: readonly string[]): string[] {
  return relativePaths.filter((relativePath) => existsSync(path.join(repoRoot, relativePath))).sort();
}

function fileContentEquals(repoRoot: string, relativePath: string, expected: string): boolean {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!existsSync(absolutePath)) {
    return false;
  }

  return readFileSync(absolutePath, 'utf8') === expected;
}

function buildIssues(
  gates: EngineReleaseGateReport['gates'],
  forbiddenGeneratedArtifacts: readonly string[],
  blockedScopeArtifacts: readonly string[]
): string[] {
  const issues: string[] = [];

  if (!gates.methodologyAuditPassed) {
    issues.push('methodology_audit_failed');
  }

  if (!gates.methodologyEvidenceCurrent) {
    issues.push(`stale_or_missing_methodology_evidence:${METHODOLOGY_EVIDENCE_PATH}`);
  }

  if (!gates.goldenSnapshotsCurrent) {
    issues.push(`stale_or_missing_golden_snapshots:${GOLDEN_SNAPSHOT_PATH}`);
  }

  for (const artifact of forbiddenGeneratedArtifacts) {
    issues.push(`forbidden_generated_artifact:${artifact}`);
  }

  for (const artifact of blockedScopeArtifacts) {
    issues.push(`blocked_scope_artifact:${artifact}`);
  }

  if (!gates.releaseScriptExists) {
    issues.push('missing_or_invalid_release_engine_script');
  }

  if (!gates.validateScriptRunsReleaseGate) {
    issues.push('validate_script_does_not_run_release_engine_gate');
  }

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === 'string');
}

export function listRepositoryFiles(repoRoot: string): readonly string[] {
  return walkDirectory(path.resolve(repoRoot), path.resolve(repoRoot));
}

function walkDirectory(root: string, current: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(current).sort()) {
    if (['.git', 'node_modules'].includes(entry)) {
      continue;
    }

    const absolute = path.join(current, entry);
    const stat = statSync(absolute);

    if (stat.isDirectory()) {
      files.push(...walkDirectory(root, absolute));
      continue;
    }

    files.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
  }

  return files;
}
