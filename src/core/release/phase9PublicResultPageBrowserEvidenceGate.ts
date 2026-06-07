import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildPublicResultLookupPageBrowserEvidenceReport,
  PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION,
  summarizePublicResultLookupPageBrowserEvidenceRules
} from '../public-link/publicResultLookupPageBrowserEvidence';

export const PHASE_9_PUBLIC_RESULT_PAGE_BROWSER_EVIDENCE_GATE_SCHEMA_VERSION =
  'phase-9.4-public-result-page-browser-evidence-gate-v1' as const;
export const PHASE_9_PUBLIC_RESULT_PAGE_BROWSER_EVIDENCE_GATE_ID =
  'phase-9.4-public-result-page-browser-evidence-gate' as const;

const PACKAGE_JSON_PATH = 'package.json';
const PAGE_PATH = 'src/app/r/(public)/[publicId]/page.tsx';
const BROWSER_EVIDENCE_MODULE_PATH = 'src/core/public-link/publicResultLookupPageBrowserEvidence.ts';
const GATE_SCRIPT_PATH = 'scripts/phase9-public-result-page-browser-evidence-gate.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9PublicResultPageBrowserEvidenceGate.ts';
const BROWSER_EVIDENCE_TEST_PATH = 'tests/core/publicResultLookupPageBrowserEvidence.test.ts';
const GATE_TEST_PATH = 'tests/core/phase9PublicResultPageBrowserEvidenceGate.test.ts';
const PHASE8_CLOSURE_EVIDENCE_PATH = 'docs/evidence/phase8-public-lookup-release-closure-latest.json';
const PHASE9_COPY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-ux-copy-polish-latest.json';
const PHASE9_SHARE_COPY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-share-copy-ux-polish-latest.json';
const PHASE9_ACCESSIBILITY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-accessibility-semantics-polish-latest.json';
const PHASE9_VISUAL_LAYOUT_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-visual-layout-polish-latest.json';
const PHASE9_STATUS_DOC_PATH = 'docs/ui/phase-9-4-public-result-page-browser-evidence-gate-status.md';
const PHASE9_RELEASE_DOC_PATH = 'docs/release/phase-9-public-result-page-browser-evidence-gate.md';
const PHASE9_TRANSITION_DOC_PATH = 'docs/ui/phase-9-transition-plan.md';

const REQUIRED_PAGE_TOKENS = [
  'data-browser-evidence="phase-9.4"',
  'data-public-result-browser-state={copy.tone}',
  'data-public-result-page="true"',
  'data-share-copy-panel="available"',
  'data-accessibility-semantics="phase-9.2"',
  'data-visual-layout={visualLayout.dataVisualLayout}',
  'aria-label={accessibility.mainLandmarkLabel}',
  'aria-live={accessibility.statusAriaLive}',
  'role={accessibility.statusRole}'
] as const;

const FORBIDDEN_PAGE_TOKENS = [
  'questionAnswers',
  'rawAnswers:',
  'deleteToken:',
  'rawDeleteToken:',
  'raw_delete_token_value'
] as const;

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

export interface Phase9PublicResultPageBrowserEvidenceGateReport {
  readonly schemaVersion: typeof PHASE_9_PUBLIC_RESULT_PAGE_BROWSER_EVIDENCE_GATE_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_PUBLIC_RESULT_PAGE_BROWSER_EVIDENCE_GATE_ID;
  readonly browserEvidenceSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION;
  readonly browserEvidencePhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly browserEvidenceModuleExists: boolean;
    readonly pageRouteExists: boolean;
    readonly browserEvidenceTestsExist: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsBrowserEvidenceGate: boolean;
    readonly phase8ClosureEvidenceCurrent: boolean;
    readonly phase9CopyGateEvidenceCurrent: boolean;
    readonly phase9ShareCopyGateEvidenceCurrent: boolean;
    readonly phase9AccessibilityGateEvidenceCurrent: boolean;
    readonly phase9VisualLayoutGateEvidenceCurrent: boolean;
    readonly phase9StatusDocExists: boolean;
    readonly phase9ReleaseDocExists: boolean;
    readonly phase9TransitionPlanUpdated: boolean;
    readonly pageExposesBrowserEvidenceTokens: boolean;
    readonly renderableStateVisibleTextVerified: boolean;
    readonly notFoundStateVisibleTextVerified: boolean;
    readonly deletedStateVisibleTextVerified: boolean;
    readonly expiredStateVisibleTextVerified: boolean;
    readonly disabledRollbackStateVisibleTextVerified: boolean;
    readonly shareCopyBlockOnlyRenderable: boolean;
    readonly accessibilityLandmarksVisible: boolean;
    readonly staticBrowserEvidenceOnly: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly evidenceStateCount: number;
    readonly requiredPageTokenCount: number;
    readonly presentPageTokenCount: number;
    readonly browserEvidenceRuleCount: number;
    readonly forbiddenPageSignalCount: number;
    readonly persistenceChangeSignalCount: number;
    readonly databaseBindingChangeSignalCount: number;
    readonly networkSmokeChangeSignalCount: number;
  };
  readonly stateEvidence: ReturnType<typeof buildPublicResultLookupPageBrowserEvidenceReport>['stateEvidence'];
  readonly docs: {
    readonly status: string;
    readonly release: string;
    readonly phase9Transition: string;
    readonly phase8ClosureEvidence: string;
    readonly phase9CopyEvidence: string;
    readonly phase9ShareCopyEvidence: string;
    readonly phase9AccessibilityEvidence: string;
    readonly phase9VisualLayoutEvidence: string;
  };
  readonly issues: readonly string[];
}

export function runPhase9PublicResultPageBrowserEvidenceGate(
  repoRoot = process.cwd()
): Phase9PublicResultPageBrowserEvidenceGateReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const page = readOptionalFile(root, PAGE_PATH);
  const browserEvidenceModule = readOptionalFile(root, BROWSER_EVIDENCE_MODULE_PATH);
  const transitionPlan = readOptionalFile(root, PHASE9_TRANSITION_DOC_PATH);
  const phase8ClosureEvidence = readJson<Record<string, unknown>>(root, PHASE8_CLOSURE_EVIDENCE_PATH);
  const phase9CopyEvidence = readJson<Record<string, unknown>>(root, PHASE9_COPY_EVIDENCE_PATH);
  const phase9ShareCopyEvidence = readJson<Record<string, unknown>>(root, PHASE9_SHARE_COPY_EVIDENCE_PATH);
  const phase9AccessibilityEvidence = readJson<Record<string, unknown>>(root, PHASE9_ACCESSIBILITY_EVIDENCE_PATH);
  const phase9VisualLayoutEvidence = readJson<Record<string, unknown>>(root, PHASE9_VISUAL_LAYOUT_EVIDENCE_PATH);
  const browserEvidence = buildPublicResultLookupPageBrowserEvidenceReport();

  const presentPageTokenCount = REQUIRED_PAGE_TOKENS.filter((token) => page.includes(token)).length;
  const forbiddenPageSignals = FORBIDDEN_PAGE_TOKENS.filter((token) => page.includes(token));
  const persistenceChangeSignals = [
    browserEvidenceModule.includes('createPublicResultApiRouteDatabaseBindingStorageAdapter'),
    browserEvidenceModule.includes('@neondatabase/serverless'),
    browserEvidenceModule.includes('executeQuery('),
    browserEvidenceModule.includes('adapter.read(')
  ].filter(Boolean).length;
  const databaseBindingChangeSignals = [
    browserEvidenceModule.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    browserEvidenceModule.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'),
    page.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    page.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION')
  ].filter(Boolean).length;
  const networkSmokeChangeSignals = [
    browserEvidenceModule.includes('networkLookupSmokeExecuted: true'),
    browserEvidenceModule.includes('fetch('),
    page.includes('networkLookupSmokeExecuted')
  ].filter(Boolean).length;

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    browserEvidenceModuleExists: existsSync(path.join(root, BROWSER_EVIDENCE_MODULE_PATH)),
    pageRouteExists: existsSync(path.join(root, PAGE_PATH)),
    browserEvidenceTestsExist: existsSync(path.join(root, BROWSER_EVIDENCE_TEST_PATH)),
    gateTestsExist: existsSync(path.join(root, GATE_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.['gate:phase9-public-result-browser-evidence'] ===
      'tsx scripts/phase9-public-result-page-browser-evidence-gate.ts',
    validateRunsBrowserEvidenceGate: (packageJson.scripts?.validate ?? '').includes(
      'npm run gate:phase9-public-result-browser-evidence'
    ),
    phase8ClosureEvidenceCurrent: phase8ClosureEvidence !== null && readOverallPassed(phase8ClosureEvidence),
    phase9CopyGateEvidenceCurrent: phase9CopyEvidence !== null && readOverallPassed(phase9CopyEvidence),
    phase9ShareCopyGateEvidenceCurrent: phase9ShareCopyEvidence !== null && readOverallPassed(phase9ShareCopyEvidence),
    phase9AccessibilityGateEvidenceCurrent:
      phase9AccessibilityEvidence !== null && readOverallPassed(phase9AccessibilityEvidence),
    phase9VisualLayoutGateEvidenceCurrent:
      phase9VisualLayoutEvidence !== null && readOverallPassed(phase9VisualLayoutEvidence),
    phase9StatusDocExists: existsSync(path.join(root, PHASE9_STATUS_DOC_PATH)),
    phase9ReleaseDocExists: existsSync(path.join(root, PHASE9_RELEASE_DOC_PATH)),
    phase9TransitionPlanUpdated:
      transitionPlan.includes('Phase 9.4') &&
      transitionPlan.includes('Browser Evidence Gate') &&
      transitionPlan.includes('No persistence behavior changes'),
    pageExposesBrowserEvidenceTokens: presentPageTokenCount === REQUIRED_PAGE_TOKENS.length,
    renderableStateVisibleTextVerified: browserEvidence.renderableVisibleTextVerified,
    notFoundStateVisibleTextVerified: browserEvidence.notFoundVisibleTextVerified,
    deletedStateVisibleTextVerified: browserEvidence.deletedVisibleTextVerified,
    expiredStateVisibleTextVerified: browserEvidence.expiredVisibleTextVerified,
    disabledRollbackStateVisibleTextVerified: browserEvidence.disabledRollbackVisibleTextVerified,
    shareCopyBlockOnlyRenderable: browserEvidence.shareCopyBlockOnlyRenderable,
    accessibilityLandmarksVisible: browserEvidence.accessibilityLandmarksVisible,
    staticBrowserEvidenceOnly: browserEvidence.staticBrowserEvidenceOnly,
    rawAnswersRemainBlocked: !browserEvidence.rawAnswersExposed && forbiddenPageSignals.length === 0,
    rawDeleteTokensRemainBlocked: !browserEvidence.rawDeleteTokenExposed && forbiddenPageSignals.length === 0,
    noPersistenceChangeSignals: browserEvidence.noPersistenceChangeSignals && persistenceChangeSignals === 0,
    noDatabaseBindingChangeSignals: browserEvidence.noDatabaseBindingChangeSignals && databaseBindingChangeSignals === 0,
    noNetworkSmokeChangeSignals: browserEvidence.noNetworkSmokeChangeSignals && networkSmokeChangeSignals === 0,
    overallPassed: false
  };

  const finalizedGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  const issues = Object.entries(finalizedGates)
    .filter(([key, value]) => key !== 'overallPassed' && value !== true)
    .map(([key]) => key);

  return {
    schemaVersion: PHASE_9_PUBLIC_RESULT_PAGE_BROWSER_EVIDENCE_GATE_SCHEMA_VERSION,
    gateId: PHASE_9_PUBLIC_RESULT_PAGE_BROWSER_EVIDENCE_GATE_ID,
    browserEvidenceSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION,
    browserEvidencePhase: PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE,
    gates: finalizedGates,
    coverage: {
      evidenceStateCount: browserEvidence.stateEvidence.length,
      requiredPageTokenCount: REQUIRED_PAGE_TOKENS.length,
      presentPageTokenCount,
      browserEvidenceRuleCount: summarizePublicResultLookupPageBrowserEvidenceRules().length,
      forbiddenPageSignalCount: forbiddenPageSignals.length,
      persistenceChangeSignalCount: persistenceChangeSignals,
      databaseBindingChangeSignalCount: databaseBindingChangeSignals,
      networkSmokeChangeSignalCount: networkSmokeChangeSignals
    },
    stateEvidence: browserEvidence.stateEvidence,
    docs: {
      status: PHASE9_STATUS_DOC_PATH,
      release: PHASE9_RELEASE_DOC_PATH,
      phase9Transition: PHASE9_TRANSITION_DOC_PATH,
      phase8ClosureEvidence: PHASE8_CLOSURE_EVIDENCE_PATH,
      phase9CopyEvidence: PHASE9_COPY_EVIDENCE_PATH,
      phase9ShareCopyEvidence: PHASE9_SHARE_COPY_EVIDENCE_PATH,
      phase9AccessibilityEvidence: PHASE9_ACCESSIBILITY_EVIDENCE_PATH,
      phase9VisualLayoutEvidence: PHASE9_VISUAL_LAYOUT_EVIDENCE_PATH
    },
    issues
  };
}

export function writePhase9PublicResultPageBrowserEvidenceGateEvidence(
  report: Phase9PublicResultPageBrowserEvidenceGateReport,
  evidencePath: string,
  repoRoot = process.cwd()
): void {
  const resolvedPath = path.resolve(repoRoot, evidencePath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });
  writeFileSync(resolvedPath, `${JSON.stringify(report, null, 2)}\n`);
}

function readOptionalFile(root: string, relativePath: string): string {
  const resolvedPath = path.join(root, relativePath);
  return existsSync(resolvedPath) ? readFileSync(resolvedPath, 'utf8') : '';
}

function readJson<T>(root: string, relativePath: string): T | null {
  const content = readOptionalFile(root, relativePath);
  if (content.length === 0) {
    return null;
  }
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function readOverallPassed(evidence: Record<string, unknown>): boolean {
  if (evidence.overallPassed === true) {
    return true;
  }
  const gates = evidence.gates;
  return typeof gates === 'object' && gates !== null && (gates as { overallPassed?: unknown }).overallPassed === true;
}
