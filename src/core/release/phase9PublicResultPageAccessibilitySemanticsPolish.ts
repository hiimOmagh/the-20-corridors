import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION,
  summarizePublicResultLookupPageAccessibilityRules
} from '../public-link/publicResultLookupPageAccessibility';

export const PHASE_9_PUBLIC_RESULT_PAGE_ACCESSIBILITY_SEMANTICS_POLISH_SCHEMA_VERSION =
  'phase-9.2-public-result-page-accessibility-semantics-polish-gate-v1' as const;
export const PHASE_9_PUBLIC_RESULT_PAGE_ACCESSIBILITY_SEMANTICS_POLISH_ID =
  'phase-9.2-public-result-page-accessibility-semantics-polish' as const;

const PACKAGE_JSON_PATH = 'package.json';
const PAGE_PATH = 'src/app/r/(public)/[publicId]/page.tsx';
const ACCESSIBILITY_MODULE_PATH = 'src/core/public-link/publicResultLookupPageAccessibility.ts';
const GATE_SCRIPT_PATH = 'scripts/phase9-public-result-page-accessibility-semantics-polish.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9PublicResultPageAccessibilitySemanticsPolish.ts';
const ACCESSIBILITY_TEST_PATH = 'tests/core/publicResultLookupPageAccessibility.test.ts';
const GATE_TEST_PATH = 'tests/core/phase9PublicResultPageAccessibilitySemanticsPolish.test.ts';
const PHASE8_CLOSURE_EVIDENCE_PATH = 'docs/evidence/phase8-public-lookup-release-closure-latest.json';
const PHASE9_COPY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-ux-copy-polish-latest.json';
const PHASE9_SHARE_COPY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-share-copy-ux-polish-latest.json';
const PHASE9_STATUS_DOC_PATH = 'docs/ui/phase-9-2-public-result-page-accessibility-semantics-polish-status.md';
const PHASE9_RELEASE_DOC_PATH = 'docs/release/phase-9-public-result-page-accessibility-semantics-polish.md';
const PHASE9_TRANSITION_DOC_PATH = 'docs/ui/phase-9-transition-plan.md';

const REQUIRED_ACCESSIBILITY_PHRASES = [
  'Public result lookup page',
  'Public result lookup status',
  'Public result lookup error status',
  'Public result facts',
  'Public result overview',
  'Public result axis summaries',
  'Share public result',
  'Copy public result link. This shares only the DTO-only public summary',
  'Unavailable, deleted, expired, disabled, or failed states do not expose a copy action'
] as const;

const REQUIRED_PAGE_TOKENS = [
  'buildPublicResultLookupPageAccessibility',
  'aria-label={accessibility.mainLandmarkLabel}',
  'aria-labelledby={accessibility.pageTitleId}',
  'aria-describedby={`${accessibility.pageSummaryId} ${accessibility.pageExplanationId}`}',
  'data-accessibility-semantics="phase-9.2"',
  'role={accessibility.statusRole}',
  'aria-live={accessibility.statusAriaLive}',
  'id={accessibility.factsRegionId}',
  'id={accessibility.overviewRegionId}',
  'id={accessibility.axisRegionId}',
  'aria-describedby={accessibility.shareHelpId}',
  'aria-label={accessibility.shareActionAriaLabel}',
  'data-unavailable-state-non-actionable={accessibility.unavailableStateNonActionable ? \'true\' : \'false\'}'
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

export interface Phase9PublicResultPageAccessibilitySemanticsPolishReport {
  readonly schemaVersion: typeof PHASE_9_PUBLIC_RESULT_PAGE_ACCESSIBILITY_SEMANTICS_POLISH_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_PUBLIC_RESULT_PAGE_ACCESSIBILITY_SEMANTICS_POLISH_ID;
  readonly accessibilitySchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION;
  readonly accessibilityPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly accessibilityModuleExists: boolean;
    readonly pageRouteExists: boolean;
    readonly accessibilityTestsExist: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsAccessibilityGate: boolean;
    readonly phase8ClosureEvidenceCurrent: boolean;
    readonly phase9CopyGateEvidenceCurrent: boolean;
    readonly phase9ShareCopyGateEvidenceCurrent: boolean;
    readonly phase9StatusDocExists: boolean;
    readonly phase9ReleaseDocExists: boolean;
    readonly phase9TransitionPlanUpdated: boolean;
    readonly pageUsesAccessibilityBuilder: boolean;
    readonly explicitMainLandmarkExists: boolean;
    readonly accessibleHeadingHierarchyExists: boolean;
    readonly statusAndErrorSemanticsExist: boolean;
    readonly renderableRegionsLabelled: boolean;
    readonly shareCopyActionHasAccessibleHelp: boolean;
    readonly unavailableStatesRemainNonActionable: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly requiredAccessibilityPhraseCount: number;
    readonly presentAccessibilityPhraseCount: number;
    readonly requiredPageTokenCount: number;
    readonly presentPageTokenCount: number;
    readonly accessibilityRuleCount: number;
    readonly forbiddenPageSignalCount: number;
    readonly persistenceChangeSignalCount: number;
    readonly databaseBindingChangeSignalCount: number;
    readonly networkSmokeChangeSignalCount: number;
  };
  readonly docs: {
    readonly status: string;
    readonly release: string;
    readonly phase9Transition: string;
    readonly phase8ClosureEvidence: string;
    readonly phase9CopyEvidence: string;
    readonly phase9ShareCopyEvidence: string;
  };
  readonly issues: readonly string[];
}

export function runPhase9PublicResultPageAccessibilitySemanticsPolishGate(
  repoRoot = process.cwd()
): Phase9PublicResultPageAccessibilitySemanticsPolishReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const page = readOptionalFile(root, PAGE_PATH);
  const accessibilityModule = readOptionalFile(root, ACCESSIBILITY_MODULE_PATH);
  const transitionPlan = readOptionalFile(root, PHASE9_TRANSITION_DOC_PATH);
  const phase8ClosureEvidence = readJson<Record<string, unknown>>(root, PHASE8_CLOSURE_EVIDENCE_PATH);
  const phase9CopyEvidence = readJson<Record<string, unknown>>(root, PHASE9_COPY_EVIDENCE_PATH);
  const phase9ShareCopyEvidence = readJson<Record<string, unknown>>(root, PHASE9_SHARE_COPY_EVIDENCE_PATH);

  const presentAccessibilityPhraseCount = REQUIRED_ACCESSIBILITY_PHRASES.filter((phrase) =>
    accessibilityModule.includes(phrase)
  ).length;
  const presentPageTokenCount = REQUIRED_PAGE_TOKENS.filter((token) => page.includes(token)).length;
  const forbiddenPageSignals = FORBIDDEN_PAGE_TOKENS.filter((token) => page.includes(token));
  const persistenceChangeSignals = [
    accessibilityModule.includes('createPublicResultApiRouteDatabaseBindingStorageAdapter'),
    accessibilityModule.includes('@neondatabase/serverless'),
    accessibilityModule.includes('executeQuery('),
    accessibilityModule.includes('adapter.read(')
  ].filter(Boolean).length;
  const databaseBindingChangeSignals = [
    accessibilityModule.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    accessibilityModule.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'),
    page.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    page.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION')
  ].filter(Boolean).length;
  const networkSmokeChangeSignals = [
    accessibilityModule.includes('networkLookupSmokeExecuted: true'),
    accessibilityModule.includes('fetch('),
    page.includes('networkLookupSmokeExecuted')
  ].filter(Boolean).length;

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    accessibilityModuleExists: existsSync(path.join(root, ACCESSIBILITY_MODULE_PATH)),
    pageRouteExists: existsSync(path.join(root, PAGE_PATH)),
    accessibilityTestsExist: existsSync(path.join(root, ACCESSIBILITY_TEST_PATH)),
    gateTestsExist: existsSync(path.join(root, GATE_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.['gate:phase9-public-result-accessibility'] ===
      'tsx scripts/phase9-public-result-page-accessibility-semantics-polish.ts',
    validateRunsAccessibilityGate: (packageJson.scripts?.validate ?? '').includes('npm run gate:phase9-public-result-accessibility'),
    phase8ClosureEvidenceCurrent: phase8ClosureEvidence !== null && readOverallPassed(phase8ClosureEvidence),
    phase9CopyGateEvidenceCurrent: phase9CopyEvidence !== null && readOverallPassed(phase9CopyEvidence),
    phase9ShareCopyGateEvidenceCurrent: phase9ShareCopyEvidence !== null && readOverallPassed(phase9ShareCopyEvidence),
    phase9StatusDocExists: existsSync(path.join(root, PHASE9_STATUS_DOC_PATH)),
    phase9ReleaseDocExists: existsSync(path.join(root, PHASE9_RELEASE_DOC_PATH)),
    phase9TransitionPlanUpdated:
      transitionPlan.includes('Phase 9.2') &&
      transitionPlan.includes('Accessibility Semantics Polish') &&
      transitionPlan.includes('No persistence behavior changes'),
    pageUsesAccessibilityBuilder:
      page.includes('buildPublicResultLookupPageAccessibility') &&
      page.includes('data-accessibility-semantics="phase-9.2"'),
    explicitMainLandmarkExists:
      page.includes('aria-label={accessibility.mainLandmarkLabel}') &&
      page.includes('aria-labelledby={accessibility.pageTitleId}') &&
      page.includes('aria-describedby={`${accessibility.pageSummaryId} ${accessibility.pageExplanationId}`}'),
    accessibleHeadingHierarchyExists:
      page.includes('<h1 id={accessibility.pageTitleId}') &&
      page.includes('<h2 id={accessibility.factsHeadingId}') &&
      page.includes('<h2 id={accessibility.overviewHeadingId}') &&
      page.includes('<h2 id={accessibility.axisHeadingId}'),
    statusAndErrorSemanticsExist:
      page.includes('role={accessibility.statusRole}') &&
      page.includes('aria-live={accessibility.statusAriaLive}') &&
      accessibilityModule.includes("statusRole: failureIsOperational ? 'alert' : 'status'"),
    renderableRegionsLabelled:
      REQUIRED_PAGE_TOKENS.filter((token) => page.includes(token)).length >= REQUIRED_PAGE_TOKENS.length - 1 &&
      page.includes('aria-label={accessibility.factsRegionLabel}') &&
      page.includes('aria-label={accessibility.overviewRegionLabel}') &&
      page.includes('aria-label={accessibility.axisRegionLabel}'),
    shareCopyActionHasAccessibleHelp:
      page.includes('aria-describedby={accessibility.shareHelpId}') &&
      page.includes('aria-label={accessibility.shareActionAriaLabel}') &&
      page.includes('{accessibility.shareHelpText}'),
    unavailableStatesRemainNonActionable:
      page.includes('shareCopy.canOfferCopyAction ?') &&
      page.includes('data-unavailable-state-non-actionable={accessibility.unavailableStateNonActionable ? \'true\' : \'false\'}') &&
      accessibilityModule.includes('unavailableStateNonActionable: !canOfferCopyAction'),
    rawAnswersRemainBlocked:
      !page.includes('rawAnswers') && !page.includes('questionAnswers') && accessibilityModule.includes('rawAnswersExposed: false'),
    rawDeleteTokensRemainBlocked:
      !page.includes('deleteToken') && !page.includes('rawDeleteToken') && accessibilityModule.includes('rawDeleteTokenExposed: false'),
    noPersistenceChangeSignals: persistenceChangeSignals === 0,
    noDatabaseBindingChangeSignals: databaseBindingChangeSignals === 0,
    noNetworkSmokeChangeSignals: networkSmokeChangeSignals === 0,
    overallPassed: false
  };

  const { overallPassed: _unused, ...beforeOverall } = gates;
  const issues = [
    ...Object.entries(beforeOverall).filter(([, passed]) => !passed).map(([key]) => `failed_gate:${key}`),
    ...REQUIRED_ACCESSIBILITY_PHRASES.filter((phrase) => !accessibilityModule.includes(phrase)).map(
      (phrase) => `missing_accessibility_phrase:${phrase}`
    ),
    ...REQUIRED_PAGE_TOKENS.filter((token) => !page.includes(token)).map((token) => `missing_page_token:${token}`),
    ...forbiddenPageSignals.map((signal) => `forbidden_page_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PHASE_9_PUBLIC_RESULT_PAGE_ACCESSIBILITY_SEMANTICS_POLISH_SCHEMA_VERSION,
    gateId: PHASE_9_PUBLIC_RESULT_PAGE_ACCESSIBILITY_SEMANTICS_POLISH_ID,
    accessibilitySchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_SCHEMA_VERSION,
    accessibilityPhase: PUBLIC_RESULT_LOOKUP_PAGE_ACCESSIBILITY_PHASE,
    gates: finalGates,
    coverage: {
      requiredAccessibilityPhraseCount: REQUIRED_ACCESSIBILITY_PHRASES.length,
      presentAccessibilityPhraseCount,
      requiredPageTokenCount: REQUIRED_PAGE_TOKENS.length,
      presentPageTokenCount,
      accessibilityRuleCount: summarizePublicResultLookupPageAccessibilityRules().length,
      forbiddenPageSignalCount: forbiddenPageSignals.length,
      persistenceChangeSignalCount: persistenceChangeSignals,
      databaseBindingChangeSignalCount: databaseBindingChangeSignals,
      networkSmokeChangeSignalCount: networkSmokeChangeSignals
    },
    docs: {
      status: PHASE9_STATUS_DOC_PATH,
      release: PHASE9_RELEASE_DOC_PATH,
      phase9Transition: PHASE9_TRANSITION_DOC_PATH,
      phase8ClosureEvidence: PHASE8_CLOSURE_EVIDENCE_PATH,
      phase9CopyEvidence: PHASE9_COPY_EVIDENCE_PATH,
      phase9ShareCopyEvidence: PHASE9_SHARE_COPY_EVIDENCE_PATH
    },
    issues
  };
}

export function writePhase9PublicResultPageAccessibilitySemanticsPolishEvidence(
  report: Phase9PublicResultPageAccessibilitySemanticsPolishReport,
  evidencePath: string
): void {
  const resolved = path.resolve(evidencePath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`);
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function readJson<T>(repoRoot: string, relativePath: string): T | null {
  const raw = readOptionalFile(repoRoot, relativePath);
  if (raw.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readOverallPassed(evidence: Record<string, unknown>): boolean {
  if (evidence.overallPassed === true) {
    return true;
  }
  if (typeof evidence.gates === 'object' && evidence.gates !== null && 'overallPassed' in evidence.gates) {
    return (evidence.gates as { readonly overallPassed?: unknown }).overallPassed === true;
  }
  return false;
}
