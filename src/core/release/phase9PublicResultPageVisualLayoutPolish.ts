import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION,
  summarizePublicResultLookupPageVisualLayoutRules
} from '../public-link/publicResultLookupPageVisualLayout';

export const PHASE_9_PUBLIC_RESULT_PAGE_VISUAL_LAYOUT_POLISH_SCHEMA_VERSION =
  'phase-9.3-public-result-page-visual-layout-polish-gate-v1' as const;
export const PHASE_9_PUBLIC_RESULT_PAGE_VISUAL_LAYOUT_POLISH_ID =
  'phase-9.3-public-result-page-visual-layout-polish' as const;

const PACKAGE_JSON_PATH = 'package.json';
const PAGE_PATH = 'src/app/r/(public)/[publicId]/page.tsx';
const VISUAL_LAYOUT_MODULE_PATH = 'src/core/public-link/publicResultLookupPageVisualLayout.ts';
const GATE_SCRIPT_PATH = 'scripts/phase9-public-result-page-visual-layout-polish.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9PublicResultPageVisualLayoutPolish.ts';
const VISUAL_LAYOUT_TEST_PATH = 'tests/core/publicResultLookupPageVisualLayout.test.ts';
const GATE_TEST_PATH = 'tests/core/phase9PublicResultPageVisualLayoutPolish.test.ts';
const PHASE8_CLOSURE_EVIDENCE_PATH = 'docs/evidence/phase8-public-lookup-release-closure-latest.json';
const PHASE9_COPY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-ux-copy-polish-latest.json';
const PHASE9_SHARE_COPY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-share-copy-ux-polish-latest.json';
const PHASE9_ACCESSIBILITY_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-accessibility-semantics-polish-latest.json';
const PHASE9_STATUS_DOC_PATH = 'docs/ui/phase-9-3-public-result-page-visual-layout-polish-status.md';
const PHASE9_RELEASE_DOC_PATH = 'docs/release/phase-9-public-result-page-visual-layout-polish.md';
const PHASE9_TRANSITION_DOC_PATH = 'docs/ui/phase-9-transition-plan.md';

const REQUIRED_VISUAL_LAYOUT_PHRASES = [
  'responsive-shell-spacing-is-explicit',
  'renderable-result-uses-clear-card-hierarchy',
  'unavailable-states-use-readable-centered-panel',
  'mobile-layout-remains-usable-with-stacked-content',
  'share-copy-block-is-visually-distinct',
  'accessibility-semantics-from-phase-9.2-remain-intact',
  'bg-[radial-gradient(circle_at_top',
  'max-w-5xl',
  'sm:px-6',
  'lg:px-8',
  'md:grid-cols-3',
  'md:grid-cols-2',
  'border-emerald-300/20'
] as const;

const REQUIRED_PAGE_TOKENS = [
  'buildPublicResultLookupPageVisualLayout',
  'data-visual-layout={visualLayout.dataVisualLayout}',
  'data-responsive-layout={visualLayout.responsiveLayout ? \'true\' : \'false\'}',
  'data-public-result-visual-state={visualLayout.tone}',
  'className={visualLayout.shellClassName}',
  'className={visualLayout.renderableArticleClassName}',
  'className={visualLayout.unavailablePanelClassName}',
  'className={visualLayout.factsGridClassName}',
  'className={visualLayout.sectionCardClassName}',
  'className={visualLayout.axisGridClassName}',
  'className={visualLayout.sharePanelClassName}',
  'className={visualLayout.statusPillClassName}',
  'data-accessibility-semantics="phase-9.2"'
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

export interface Phase9PublicResultPageVisualLayoutPolishReport {
  readonly schemaVersion: typeof PHASE_9_PUBLIC_RESULT_PAGE_VISUAL_LAYOUT_POLISH_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_PUBLIC_RESULT_PAGE_VISUAL_LAYOUT_POLISH_ID;
  readonly visualLayoutSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION;
  readonly visualLayoutPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly visualLayoutModuleExists: boolean;
    readonly pageRouteExists: boolean;
    readonly visualLayoutTestsExist: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsVisualLayoutGate: boolean;
    readonly phase8ClosureEvidenceCurrent: boolean;
    readonly phase9CopyGateEvidenceCurrent: boolean;
    readonly phase9ShareCopyGateEvidenceCurrent: boolean;
    readonly phase9AccessibilityGateEvidenceCurrent: boolean;
    readonly phase9StatusDocExists: boolean;
    readonly phase9ReleaseDocExists: boolean;
    readonly phase9TransitionPlanUpdated: boolean;
    readonly pageUsesVisualLayoutBuilder: boolean;
    readonly responsiveShellSpacingExists: boolean;
    readonly renderableVisualHierarchyExists: boolean;
    readonly unavailableVisualStructureExists: boolean;
    readonly mobileLayoutRemainsUsable: boolean;
    readonly shareCopyBlockVisuallyDistinct: boolean;
    readonly accessibilitySemanticsRemainIntact: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly requiredVisualLayoutPhraseCount: number;
    readonly presentVisualLayoutPhraseCount: number;
    readonly requiredPageTokenCount: number;
    readonly presentPageTokenCount: number;
    readonly visualLayoutRuleCount: number;
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
    readonly phase9AccessibilityEvidence: string;
  };
  readonly issues: readonly string[];
}

export function runPhase9PublicResultPageVisualLayoutPolishGate(
  repoRoot = process.cwd()
): Phase9PublicResultPageVisualLayoutPolishReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const page = readOptionalFile(root, PAGE_PATH);
  const visualLayoutModule = readOptionalFile(root, VISUAL_LAYOUT_MODULE_PATH);
  const transitionPlan = readOptionalFile(root, PHASE9_TRANSITION_DOC_PATH);
  const phase8ClosureEvidence = readJson<Record<string, unknown>>(root, PHASE8_CLOSURE_EVIDENCE_PATH);
  const phase9CopyEvidence = readJson<Record<string, unknown>>(root, PHASE9_COPY_EVIDENCE_PATH);
  const phase9ShareCopyEvidence = readJson<Record<string, unknown>>(root, PHASE9_SHARE_COPY_EVIDENCE_PATH);
  const phase9AccessibilityEvidence = readJson<Record<string, unknown>>(root, PHASE9_ACCESSIBILITY_EVIDENCE_PATH);

  const presentVisualLayoutPhraseCount = REQUIRED_VISUAL_LAYOUT_PHRASES.filter((phrase) =>
    visualLayoutModule.includes(phrase)
  ).length;
  const presentPageTokenCount = REQUIRED_PAGE_TOKENS.filter((token) => page.includes(token)).length;
  const forbiddenPageSignals = FORBIDDEN_PAGE_TOKENS.filter((token) => page.includes(token));
  const persistenceChangeSignals = [
    visualLayoutModule.includes('createPublicResultApiRouteDatabaseBindingStorageAdapter'),
    visualLayoutModule.includes('@neondatabase/serverless'),
    visualLayoutModule.includes('executeQuery('),
    visualLayoutModule.includes('adapter.read(')
  ].filter(Boolean).length;
  const databaseBindingChangeSignals = [
    visualLayoutModule.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    visualLayoutModule.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'),
    page.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    page.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION')
  ].filter(Boolean).length;
  const networkSmokeChangeSignals = [
    visualLayoutModule.includes('networkLookupSmokeExecuted: true'),
    visualLayoutModule.includes('fetch('),
    page.includes('networkLookupSmokeExecuted')
  ].filter(Boolean).length;

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    visualLayoutModuleExists: existsSync(path.join(root, VISUAL_LAYOUT_MODULE_PATH)),
    pageRouteExists: existsSync(path.join(root, PAGE_PATH)),
    visualLayoutTestsExist: existsSync(path.join(root, VISUAL_LAYOUT_TEST_PATH)),
    gateTestsExist: existsSync(path.join(root, GATE_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.['gate:phase9-public-result-visual-layout'] ===
      'tsx scripts/phase9-public-result-page-visual-layout-polish.ts',
    validateRunsVisualLayoutGate: (packageJson.scripts?.validate ?? '').includes('npm run gate:phase9-public-result-visual-layout'),
    phase8ClosureEvidenceCurrent: phase8ClosureEvidence !== null && readOverallPassed(phase8ClosureEvidence),
    phase9CopyGateEvidenceCurrent: phase9CopyEvidence !== null && readOverallPassed(phase9CopyEvidence),
    phase9ShareCopyGateEvidenceCurrent: phase9ShareCopyEvidence !== null && readOverallPassed(phase9ShareCopyEvidence),
    phase9AccessibilityGateEvidenceCurrent: phase9AccessibilityEvidence !== null && readOverallPassed(phase9AccessibilityEvidence),
    phase9StatusDocExists: existsSync(path.join(root, PHASE9_STATUS_DOC_PATH)),
    phase9ReleaseDocExists: existsSync(path.join(root, PHASE9_RELEASE_DOC_PATH)),
    phase9TransitionPlanUpdated:
      transitionPlan.includes('Phase 9.3') &&
      transitionPlan.includes('Visual Layout Polish') &&
      transitionPlan.includes('No persistence behavior changes'),
    pageUsesVisualLayoutBuilder:
      page.includes('buildPublicResultLookupPageVisualLayout') && page.includes('data-visual-layout={visualLayout.dataVisualLayout}'),
    responsiveShellSpacingExists:
      visualLayoutModule.includes('sm:px-6') &&
      visualLayoutModule.includes('lg:px-8') &&
      page.includes('data-responsive-layout={visualLayout.responsiveLayout'),
    renderableVisualHierarchyExists:
      visualLayoutModule.includes('max-w-5xl') &&
      visualLayoutModule.includes('renderableArticleClassName') &&
      page.includes('className={visualLayout.renderableArticleClassName}'),
    unavailableVisualStructureExists:
      visualLayoutModule.includes('unavailablePanelClassName') &&
      visualLayoutModule.includes('max-w-3xl') &&
      page.includes('className={visualLayout.unavailablePanelClassName}'),
    mobileLayoutRemainsUsable:
      visualLayoutModule.includes('sm:p-8') &&
      visualLayoutModule.includes('lg:p-10') &&
      visualLayoutModule.includes('md:grid-cols-2') &&
      visualLayoutModule.includes('md:grid-cols-3'),
    shareCopyBlockVisuallyDistinct:
      visualLayoutModule.includes('sharePanelClassName') &&
      visualLayoutModule.includes('border-emerald-300/20') &&
      page.includes('className={visualLayout.sharePanelClassName}'),
    accessibilitySemanticsRemainIntact:
      page.includes('buildPublicResultLookupPageAccessibility') &&
      page.includes('data-accessibility-semantics="phase-9.2"') &&
      page.includes('aria-label={accessibility.mainLandmarkLabel}') &&
      page.includes('aria-labelledby={accessibility.pageTitleId}'),
    rawAnswersRemainBlocked: forbiddenPageSignals.length === 0 && !visualLayoutModule.includes('questionAnswers'),
    rawDeleteTokensRemainBlocked:
      forbiddenPageSignals.length === 0 &&
      visualLayoutModule.includes('rawDeleteTokenExposed: false') &&
      !visualLayoutModule.includes('deleteToken:'),
    noPersistenceChangeSignals: persistenceChangeSignals === 0,
    noDatabaseBindingChangeSignals: databaseBindingChangeSignals === 0,
    noNetworkSmokeChangeSignals: networkSmokeChangeSignals === 0,
    overallPassed: false
  };

  const issues = Object.entries(gates)
    .filter(([key, value]) => key !== 'overallPassed' && value === false)
    .map(([key]) => key);

  const finalGates = {
    ...gates,
    overallPassed: issues.length === 0
  };

  return {
    schemaVersion: PHASE_9_PUBLIC_RESULT_PAGE_VISUAL_LAYOUT_POLISH_SCHEMA_VERSION,
    gateId: PHASE_9_PUBLIC_RESULT_PAGE_VISUAL_LAYOUT_POLISH_ID,
    visualLayoutSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION,
    visualLayoutPhase: PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE,
    gates: finalGates,
    coverage: {
      requiredVisualLayoutPhraseCount: REQUIRED_VISUAL_LAYOUT_PHRASES.length,
      presentVisualLayoutPhraseCount,
      requiredPageTokenCount: REQUIRED_PAGE_TOKENS.length,
      presentPageTokenCount,
      visualLayoutRuleCount: summarizePublicResultLookupPageVisualLayoutRules().length,
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
      phase9ShareCopyEvidence: PHASE9_SHARE_COPY_EVIDENCE_PATH,
      phase9AccessibilityEvidence: PHASE9_ACCESSIBILITY_EVIDENCE_PATH
    },
    issues
  };
}

export function writePhase9PublicResultPageVisualLayoutPolishEvidence(
  report: Phase9PublicResultPageVisualLayoutPolishReport,
  outputPath: string,
  repoRoot = process.cwd()
): void {
  const target = path.resolve(repoRoot, outputPath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function readOptionalFile(root: string, relativePath: string): string {
  const target = path.join(root, relativePath);
  return existsSync(target) ? readFileSync(target, 'utf8') : '';
}

function readJson<T>(root: string, relativePath: string): T | null {
  try {
    const raw = readOptionalFile(root, relativePath);
    return raw.length > 0 ? (JSON.parse(raw) as T) : null;
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
