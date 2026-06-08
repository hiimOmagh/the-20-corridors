import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const PHASE_9_PUBLIC_RESULT_PAGE_UX_RELEASE_CLOSURE_SCHEMA_VERSION =
  'phase-9.5-public-result-page-ux-release-closure-gate-v1' as const;
export const PHASE_9_PUBLIC_RESULT_PAGE_UX_RELEASE_CLOSURE_ID =
  'phase-9-public-result-page-ux-release-closure-gate' as const;

const PACKAGE_JSON_PATH = 'package.json';
const CLOSURE_SCRIPT_PATH = 'scripts/phase9-public-result-page-ux-release-closure-gate.ts';
const CLOSURE_MODULE_PATH = 'src/core/release/phase9PublicResultPageUxReleaseClosureGate.ts';
const CLOSURE_TEST_PATH = 'tests/core/phase9PublicResultPageUxReleaseClosureGate.test.ts';
const CLOSURE_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-ux-release-closure-latest.json';
const CLOSURE_RELEASE_DOC_PATH = 'docs/release/phase-9-public-result-page-ux-release-closure-gate.md';
const CLOSURE_STATUS_DOC_PATH = 'docs/ui/phase-9-5-public-result-page-ux-release-closure-gate-status.md';
const PHASE_9_TRANSITION_DOC_PATH = 'docs/ui/phase-9-transition-plan.md';
const PHASE_10_TRANSITION_DOC_PATH = 'docs/ui/phase-10-transition-plan.md';
const PUBLIC_LOOKUP_ROUTE_PATH = 'src/app/r/(public)/[publicId]/page.tsx';
const QUIZ_CLIENT_PATH = 'src/features/quiz/QuizClient.tsx';
const QUIZ_FLOW_PATH = 'src/features/quiz/quizFlow.ts';

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

type JsonRecord = Record<string, unknown>;

export interface Phase9ClosureEvidenceSummary {
  readonly key: string;
  readonly path: string;
  readonly category:
    | 'phase8-baseline'
    | 'public-page-ux'
    | 'public-page-evidence'
    | 'quiz-interaction'
    | 'operational-safety';
  readonly exists: boolean;
  readonly passed: boolean;
  readonly schemaVersion?: string | undefined;
  readonly id?: string | undefined;
}

export interface Phase9PublicResultPageUxReleaseClosureGateReport {
  readonly schemaVersion: typeof PHASE_9_PUBLIC_RESULT_PAGE_UX_RELEASE_CLOSURE_SCHEMA_VERSION;
  readonly closureId: typeof PHASE_9_PUBLIC_RESULT_PAGE_UX_RELEASE_CLOSURE_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly phaseScope: 'phase-9-public-result-page-ux-and-quiz-interaction-closure';
    readonly closureMode: 'evidence-consolidation-no-runtime-change';
  };
  readonly gates: {
    readonly closureScriptExists: boolean;
    readonly closureModuleExists: boolean;
    readonly closureTestExists: boolean;
    readonly closureReleaseDocExists: boolean;
    readonly closureStatusDocExists: boolean;
    readonly phase9TransitionPlanExists: boolean;
    readonly phase10TransitionPlanExists: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsPhase9ClosureGate: boolean;
    readonly phase8ClosureEvidenceCurrent: boolean;
    readonly phase90CopyEvidenceCurrent: boolean;
    readonly phase91ShareCopyEvidenceCurrent: boolean;
    readonly phase92AccessibilityEvidenceCurrent: boolean;
    readonly phase93VisualLayoutEvidenceCurrent: boolean;
    readonly phase94BrowserEvidenceCurrent: boolean;
    readonly phase941QuizTimerNoHintsEvidenceCurrent: boolean;
    readonly phase942QuizBrowserInteractionEvidenceCurrent: boolean;
    readonly allPhase9EvidenceCurrentAndPassed: boolean;
    readonly manualBrowserCheckRecorded: boolean;
    readonly deeperUxInvestigationDeferredToNextTrack: boolean;
    readonly publicLookupRouteStillExists: boolean;
    readonly quizRouteStillExists: boolean;
    readonly quizTimerVisibleContractPresent: boolean;
    readonly mouseTouchAnswerSelectionHardened: boolean;
    readonly keyboardAnswerSelectionHardened: boolean;
    readonly noQuizResultHintsBeforeCompletion: boolean;
    readonly unavailableStatesRemainNonActionable: boolean;
    readonly shareCopyRenderableOnly: boolean;
    readonly accessibilitySemanticsRemainIntact: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly phase8ClosureRemainsGreen: boolean;
    readonly buildRouteListExpectedToIncludeQuizAndPublicLookup: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly evidenceFileCount: number;
    readonly passedEvidenceFileCount: number;
    readonly publicPageUxEvidenceCount: number;
    readonly quizEvidenceCount: number;
    readonly checkedSourceFileCount: number;
    readonly forbiddenRawAnswerSignalCount: number;
    readonly forbiddenRawDeleteTokenSignalCount: number;
    readonly persistenceChangeSignalCount: number;
    readonly databaseBindingChangeSignalCount: number;
    readonly networkSmokeChangeSignalCount: number;
  };
  readonly evidence: readonly Phase9ClosureEvidenceSummary[];
  readonly docs: {
    readonly phase9Transition: string;
    readonly phase10Transition: string;
    readonly release: string;
    readonly status: string;
  };
  readonly implementationScan: {
    readonly checkedFiles: readonly string[];
    readonly rawAnswerSignals: readonly string[];
    readonly rawDeleteTokenSignals: readonly string[];
    readonly persistenceChangeSignals: readonly string[];
    readonly databaseBindingChangeSignals: readonly string[];
    readonly networkSmokeChangeSignals: readonly string[];
  };
  readonly issues: readonly string[];
}

const EVIDENCE_FILES = [
  {
    key: 'phase8-public-lookup-release-closure',
    path: 'docs/evidence/phase8-public-lookup-release-closure-latest.json',
    category: 'phase8-baseline'
  },
  {
    key: 'phase9.0-public-result-page-copy',
    path: 'docs/evidence/phase9-public-result-page-ux-copy-polish-latest.json',
    category: 'public-page-ux'
  },
  {
    key: 'phase9.1-public-result-share-copy',
    path: 'docs/evidence/phase9-public-result-share-copy-ux-polish-latest.json',
    category: 'public-page-ux'
  },
  {
    key: 'phase9.2-public-result-accessibility',
    path: 'docs/evidence/phase9-public-result-page-accessibility-semantics-polish-latest.json',
    category: 'public-page-ux'
  },
  {
    key: 'phase9.3-public-result-visual-layout',
    path: 'docs/evidence/phase9-public-result-page-visual-layout-polish-latest.json',
    category: 'public-page-ux'
  },
  {
    key: 'phase9.4-public-result-browser-evidence',
    path: 'docs/evidence/phase9-public-result-page-browser-evidence-gate-latest.json',
    category: 'public-page-evidence'
  },
  {
    key: 'phase9.4.1-quiz-interaction-timer-no-hints',
    path: 'docs/evidence/phase9-quiz-interaction-timer-no-hints-hotfix-latest.json',
    category: 'quiz-interaction'
  },
  {
    key: 'phase9.4.2-quiz-browser-interaction-ux',
    path: 'docs/evidence/phase9-quiz-browser-interaction-ux-hotfix-latest.json',
    category: 'quiz-interaction'
  },
  {
    key: 'public-lookup-operational-smoke',
    path: 'docs/evidence/public-result-lookup-operational-smoke-boundary-latest.json',
    category: 'operational-safety'
  },
  {
    key: 'public-lookup-operational-rollback-drill',
    path: 'docs/evidence/public-lookup-operational-rollback-drill-latest.json',
    category: 'operational-safety'
  }
] as const satisfies readonly {
  readonly key: string;
  readonly path: string;
  readonly category: Phase9ClosureEvidenceSummary['category'];
}[];

const SOURCE_SCAN_FILES = [
  PUBLIC_LOOKUP_ROUTE_PATH,
  QUIZ_CLIENT_PATH,
  QUIZ_FLOW_PATH,
  'src/core/public-link/publicResultLookupPageCopy.ts',
  'src/core/public-link/publicResultShareCopyUx.ts',
  'src/core/public-link/publicResultLookupPageAccessibility.ts',
  'src/core/public-link/publicResultLookupPageVisualLayout.ts',
  'src/core/public-link/publicResultLookupPageBrowserEvidence.ts'
] as const;

const RAW_ANSWER_SIGNALS = [
  'rawAnswers:',
  '"rawAnswers"',
  'questionAnswers:',
  'selectedAnswer:',
  'answerText:',
  'Pattern density rising',
  'Direct signal',
  'Control signal',
  'Depth signal',
  'Distance signal',
  'Final threshold'
] as const;

const RAW_DELETE_TOKEN_SIGNALS = [
  'rawDeleteTokenExposed: true',
  '"deleteToken":',
  '"delete_token":',
  'raw_delete_token_value',
  'deleteToken:'
] as const;

const PERSISTENCE_CHANGE_SIGNALS = [
  'localStorage.setItem(',
  'indexedDB.',
  'createPublicResultDatabaseStorageAdapter',
  'createPublicResultApiRouteDatabaseBindingStorageAdapter',
  'new PrismaClient',
  'drizzle(',
  'mongoose.connect'
] as const;

const DATABASE_BINDING_CHANGE_SIGNALS = [
  '@neondatabase/serverless',
  'executeQuery(',
  'PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION',
  'PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'
] as const;

const NETWORK_SMOKE_CHANGE_SIGNALS = ['networkLookupSmokeExecuted: true', 'productionNetworkLookupSmokeExecuted: true'] as const;

export function runPhase9PublicResultPageUxReleaseClosureGate(
  repoRoot = process.cwd()
): Phase9PublicResultPageUxReleaseClosureGateReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const validateScript = packageJson.scripts?.validate ?? '';
  const phase9Transition = readOptionalFile(root, PHASE_9_TRANSITION_DOC_PATH);
  const phase10Transition = readOptionalFile(root, PHASE_10_TRANSITION_DOC_PATH);
  const releaseDoc = readOptionalFile(root, CLOSURE_RELEASE_DOC_PATH);
  const statusDoc = readOptionalFile(root, CLOSURE_STATUS_DOC_PATH);
  const quizClient = readOptionalFile(root, QUIZ_CLIENT_PATH);
  const quizFlow = readOptionalFile(root, QUIZ_FLOW_PATH);
  const publicLookupRoute = readOptionalFile(root, PUBLIC_LOOKUP_ROUTE_PATH);
  const evidence = summarizeEvidence(root);
  const scan = scanSources(root);

  const phase8Evidence = evidence.find((item) => item.key === 'phase8-public-lookup-release-closure');
  const phase90Evidence = evidence.find((item) => item.key === 'phase9.0-public-result-page-copy');
  const phase91Evidence = evidence.find((item) => item.key === 'phase9.1-public-result-share-copy');
  const phase92Evidence = evidence.find((item) => item.key === 'phase9.2-public-result-accessibility');
  const phase93Evidence = evidence.find((item) => item.key === 'phase9.3-public-result-visual-layout');
  const phase94Evidence = evidence.find((item) => item.key === 'phase9.4-public-result-browser-evidence');
  const phase941Evidence = evidence.find((item) => item.key === 'phase9.4.1-quiz-interaction-timer-no-hints');
  const phase942Evidence = evidence.find((item) => item.key === 'phase9.4.2-quiz-browser-interaction-ux');
  const passedEvidenceFileCount = evidence.filter((item) => item.passed).length;
  const publicPageUxEvidenceCount = evidence.filter((item) => item.category === 'public-page-ux').length;
  const quizEvidenceCount = evidence.filter((item) => item.category === 'quiz-interaction').length;

  const gates = {
    closureScriptExists: existsSync(path.join(root, CLOSURE_SCRIPT_PATH)),
    closureModuleExists: existsSync(path.join(root, CLOSURE_MODULE_PATH)),
    closureTestExists: existsSync(path.join(root, CLOSURE_TEST_PATH)),
    closureReleaseDocExists: existsSync(path.join(root, CLOSURE_RELEASE_DOC_PATH)),
    closureStatusDocExists: existsSync(path.join(root, CLOSURE_STATUS_DOC_PATH)),
    phase9TransitionPlanExists: existsSync(path.join(root, PHASE_9_TRANSITION_DOC_PATH)),
    phase10TransitionPlanExists: existsSync(path.join(root, PHASE_10_TRANSITION_DOC_PATH)),
    packageScriptExists:
      packageJson.scripts?.['closure:phase9'] === 'tsx scripts/phase9-public-result-page-ux-release-closure-gate.ts',
    validateRunsPhase9ClosureGate: validateScript.includes('npm run closure:phase9'),
    phase8ClosureEvidenceCurrent: phase8Evidence?.passed === true,
    phase90CopyEvidenceCurrent: phase90Evidence?.passed === true,
    phase91ShareCopyEvidenceCurrent: phase91Evidence?.passed === true,
    phase92AccessibilityEvidenceCurrent: phase92Evidence?.passed === true,
    phase93VisualLayoutEvidenceCurrent: phase93Evidence?.passed === true,
    phase94BrowserEvidenceCurrent: phase94Evidence?.passed === true,
    phase941QuizTimerNoHintsEvidenceCurrent: phase941Evidence?.passed === true,
    phase942QuizBrowserInteractionEvidenceCurrent: phase942Evidence?.passed === true,
    allPhase9EvidenceCurrentAndPassed: evidence.every((item) => item.passed),
    manualBrowserCheckRecorded:
      statusDoc.includes('Manual browser check: passed') &&
      releaseDoc.includes('manual checks passed') &&
      releaseDoc.includes('deeper UX investigation remains scheduled'),
    deeperUxInvestigationDeferredToNextTrack:
      phase10Transition.includes('deeper quiz UX investigation') &&
      phase10Transition.includes('browser E2E') &&
      phase10Transition.includes('not a Phase 9 blocker'),
    publicLookupRouteStillExists: existsSync(path.join(root, PUBLIC_LOOKUP_ROUTE_PATH)),
    quizRouteStillExists: existsSync(path.join(root, 'src/app/quiz/page.tsx')),
    quizTimerVisibleContractPresent:
      quizClient.includes('data-quiz-countdown="visible"') &&
      quizClient.includes('role="timer"') &&
      quizClient.includes('10 seconds per question'),
    mouseTouchAnswerSelectionHardened:
      quizClient.includes('onPointerUp={(event) =>') &&
      quizClient.includes("selectAnswer(option.key, 'pointer')") &&
      quizClient.includes("selectAnswer(option.key, 'click')") &&
      quizClient.includes('suppressNextClickRef'),
    keyboardAnswerSelectionHardened:
      quizClient.includes('parseKeyboardOptionKey(event.key, event.code)') &&
      quizFlow.includes("normalizedCode === 'KEYA'") &&
      quizFlow.includes("normalizedCode === 'KEYD'"),
    noQuizResultHintsBeforeCompletion:
      quizClient.includes('No result hints before completion') &&
      !RAW_ANSWER_SIGNALS.some((token) => quizClient.includes(token)),
    unavailableStatesRemainNonActionable: publicLookupRoute.includes('data-unavailable-state-non-actionable'),
    shareCopyRenderableOnly:
      publicLookupRoute.includes('data-share-copy-panel="available"') &&
      publicLookupRoute.includes('shareCopy.canOfferCopyAction ?'),
    accessibilitySemanticsRemainIntact:
      publicLookupRoute.includes('data-accessibility-semantics="phase-9.2"') &&
      publicLookupRoute.includes('aria-label={accessibility.mainLandmarkLabel}') &&
      publicLookupRoute.includes('role={accessibility.statusRole}'),
    rawAnswersRemainBlocked: scan.rawAnswerSignals.length === 0,
    rawDeleteTokensRemainBlocked: scan.rawDeleteTokenSignals.length === 0,
    noPersistenceChangeSignals: scan.persistenceChangeSignals.length === 0,
    noDatabaseBindingChangeSignals: scan.databaseBindingChangeSignals.length === 0,
    noNetworkSmokeChangeSignals: scan.networkSmokeChangeSignals.length === 0,
    phase8ClosureRemainsGreen: phase8Evidence?.passed === true,
    buildRouteListExpectedToIncludeQuizAndPublicLookup:
      existsSync(path.join(root, 'src/app/quiz/page.tsx')) && existsSync(path.join(root, PUBLIC_LOOKUP_ROUTE_PATH)),
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
    schemaVersion: PHASE_9_PUBLIC_RESULT_PAGE_UX_RELEASE_CLOSURE_SCHEMA_VERSION,
    closureId: PHASE_9_PUBLIC_RESULT_PAGE_UX_RELEASE_CLOSURE_ID,
    metadata: {
      checkedAt: 'static',
      phaseScope: 'phase-9-public-result-page-ux-and-quiz-interaction-closure',
      closureMode: 'evidence-consolidation-no-runtime-change'
    },
    gates: finalizedGates,
    coverage: {
      evidenceFileCount: evidence.length,
      passedEvidenceFileCount,
      publicPageUxEvidenceCount,
      quizEvidenceCount,
      checkedSourceFileCount: SOURCE_SCAN_FILES.length,
      forbiddenRawAnswerSignalCount: scan.rawAnswerSignals.length,
      forbiddenRawDeleteTokenSignalCount: scan.rawDeleteTokenSignals.length,
      persistenceChangeSignalCount: scan.persistenceChangeSignals.length,
      databaseBindingChangeSignalCount: scan.databaseBindingChangeSignals.length,
      networkSmokeChangeSignalCount: scan.networkSmokeChangeSignals.length
    },
    evidence,
    docs: {
      phase9Transition: PHASE_9_TRANSITION_DOC_PATH,
      phase10Transition: PHASE_10_TRANSITION_DOC_PATH,
      release: CLOSURE_RELEASE_DOC_PATH,
      status: CLOSURE_STATUS_DOC_PATH
    },
    implementationScan: scan,
    issues
  };
}

export function writePhase9PublicResultPageUxReleaseClosureGateEvidence(
  report: Phase9PublicResultPageUxReleaseClosureGateReport,
  outputPath = CLOSURE_EVIDENCE_PATH
): void {
  const targetPath = path.resolve(outputPath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function summarizeEvidence(root: string): readonly Phase9ClosureEvidenceSummary[] {
  return EVIDENCE_FILES.map((item) => {
    const evidence = readJson<JsonRecord>(root, item.path);
    return {
      ...item,
      exists: evidence !== null,
      passed: evidence !== null && readOverallPassed(evidence),
      schemaVersion: readString(evidence, 'schemaVersion'),
      id: readString(evidence, 'gateId') ?? readString(evidence, 'closureId') ?? readString(evidence, 'contractId')
    };
  });
}

function scanSources(root: string): Phase9PublicResultPageUxReleaseClosureGateReport['implementationScan'] {
  const joined = SOURCE_SCAN_FILES.map((relativePath) => `\n/* ${relativePath} */\n${readOptionalFile(root, relativePath)}`).join('\n');

  return {
    checkedFiles: SOURCE_SCAN_FILES,
    rawAnswerSignals: RAW_ANSWER_SIGNALS.filter((token) => joined.includes(token)),
    rawDeleteTokenSignals: RAW_DELETE_TOKEN_SIGNALS.filter((token) => joined.includes(token)),
    persistenceChangeSignals: PERSISTENCE_CHANGE_SIGNALS.filter((token) => joined.includes(token)),
    databaseBindingChangeSignals: DATABASE_BINDING_CHANGE_SIGNALS.filter((token) => joined.includes(token)),
    networkSmokeChangeSignals: NETWORK_SMOKE_CHANGE_SIGNALS.filter((token) => joined.includes(token))
  };
}

function readOptionalFile(root: string, relativePath: string): string {
  const filePath = path.join(root, relativePath);
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function readJson<T>(root: string, relativePath: string): T | null {
  try {
    return JSON.parse(readOptionalFile(root, relativePath)) as T;
  } catch {
    return null;
  }
}

function readOverallPassed(evidence: JsonRecord): boolean {
  if (evidence.overallPassed === true) {
    return true;
  }

  const gates = evidence.gates;
  return typeof gates === 'object' && gates !== null && 'overallPassed' in gates && gates.overallPassed === true;
}

function readString(record: JsonRecord | null, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' ? value : undefined;
}
