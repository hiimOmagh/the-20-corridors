import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runQuizBrowserE2eInteractionEvidence } from '@/features/quiz/quizBrowserE2eEvidence';

export const PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_SCHEMA_VERSION =
  'phase-10.0-quiz-browser-e2e-interaction-evidence-v1' as const;
export const PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_ID =
  'phase-10-quiz-browser-e2e-interaction-evidence' as const;

const PACKAGE_JSON_PATH = 'package.json';
const QUIZ_CLIENT_PATH = 'src/features/quiz/QuizClient.tsx';
const QUIZ_FLOW_PATH = 'src/features/quiz/quizFlow.ts';
const E2E_HELPER_PATH = 'src/features/quiz/quizBrowserE2eEvidence.ts';
const GATE_SCRIPT_PATH = 'scripts/phase10-quiz-browser-e2e-interaction-evidence.ts';
const GATE_MODULE_PATH = 'src/core/release/phase10QuizBrowserE2eInteractionEvidence.ts';
const GATE_TEST_PATH = 'tests/core/phase10QuizBrowserE2eInteractionEvidence.test.ts';
const E2E_TEST_PATH = 'tests/ui/quizBrowserE2eEvidence.test.ts';
const EVIDENCE_PATH = 'docs/evidence/phase10-quiz-browser-e2e-interaction-evidence-latest.json';
const RELEASE_DOC_PATH = 'docs/release/phase-10-quiz-browser-e2e-interaction-evidence.md';
const STATUS_DOC_PATH = 'docs/ui/phase-10-0-quiz-browser-e2e-interaction-evidence-status.md';
const PHASE_10_TRANSITION_DOC_PATH = 'docs/ui/phase-10-transition-plan.md';
const PHASE_9_CLOSURE_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-ux-release-closure-latest.json';

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

type JsonRecord = Record<string, unknown>;

export interface Phase10QuizBrowserE2eInteractionEvidenceReport {
  readonly schemaVersion: typeof PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_ID;
  readonly metadata: {
    readonly evidenceMode: 'deterministic-browser-interaction-scenario-runner';
    readonly runtimeChange: 'none';
    readonly checkedAt: 'static-and-simulated-e2e';
  };
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly e2eHelperExists: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsGate: boolean;
    readonly phase9ClosureEvidenceCurrent: boolean;
    readonly mouseClickAdvancesExactlyOneQuestion: boolean;
    readonly keyboardShortcutAdvancesExactlyOneQuestion: boolean;
    readonly focusedEnterAdvancesExactlyOneQuestion: boolean;
    readonly focusedSpaceAdvancesExactlyOneQuestion: boolean;
    readonly timerStartsAtTenSeconds: boolean;
    readonly timerCountsDown: boolean;
    readonly timeoutForcesRestart: boolean;
    readonly noDoubleSkipFromPointerClickFallback: boolean;
    readonly noPreCompletionResultHints: boolean;
    readonly completionStillGeneratesReport: boolean;
    readonly sourceHasVisibleCountdownContract: boolean;
    readonly sourceHasPointerAndClickInteractionPaths: boolean;
    readonly sourceHasKeyboardInteractionPath: boolean;
    readonly sourceHasTimeoutRestartUi: boolean;
    readonly sourceBlocksPreCompletionHints: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly docsExist: boolean;
    readonly overallPassed: boolean;
  };
  readonly scenario: ReturnType<typeof runQuizBrowserE2eInteractionEvidence>;
  readonly sourceScan: {
    readonly checkedFiles: readonly string[];
    readonly persistenceChangeSignals: readonly string[];
    readonly databaseBindingChangeSignals: readonly string[];
    readonly networkSmokeChangeSignals: readonly string[];
  };
  readonly issues: readonly string[];
}

const SOURCE_SCAN_FILES = [QUIZ_CLIENT_PATH, QUIZ_FLOW_PATH, E2E_HELPER_PATH] as const;
const PERSISTENCE_CHANGE_SIGNALS = ['createPublicResult', 'localStorage.setItem(', 'indexedDB.', 'new PrismaClient'] as const;
const DATABASE_BINDING_CHANGE_SIGNALS = [
  '@neondatabase/serverless',
  'executeQuery(',
  'PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION',
  'PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'
] as const;
const NETWORK_SMOKE_CHANGE_SIGNALS = ['fetch(', 'networkLookupSmokeExecuted', 'productionNetworkLookupSmokeExecuted'] as const;

export function runPhase10QuizBrowserE2eInteractionEvidenceGate(
  repoRoot = process.cwd()
): Phase10QuizBrowserE2eInteractionEvidenceReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const validateScript = packageJson.scripts?.validate ?? '';
  const quizClient = readOptionalFile(root, QUIZ_CLIENT_PATH);
  const phase10Transition = readOptionalFile(root, PHASE_10_TRANSITION_DOC_PATH);
  const phase9ClosureEvidence = readJson<JsonRecord>(root, PHASE_9_CLOSURE_EVIDENCE_PATH);
  const scenario = runQuizBrowserE2eInteractionEvidence();
  const sourceScan = scanSources(root);

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    e2eHelperExists: existsSync(path.join(root, E2E_HELPER_PATH)),
    gateTestsExist: existsSync(path.join(root, GATE_TEST_PATH)) && existsSync(path.join(root, E2E_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.['evidence:quiz-browser-e2e'] ===
      'tsx scripts/phase10-quiz-browser-e2e-interaction-evidence.ts',
    validateRunsGate: validateScript.includes('npm run evidence:quiz-browser-e2e'),
    phase9ClosureEvidenceCurrent: phase9ClosureEvidence !== null && readOverallPassed(phase9ClosureEvidence),
    mouseClickAdvancesExactlyOneQuestion: scenario.mouse.advancedExactlyOneQuestion,
    keyboardShortcutAdvancesExactlyOneQuestion: scenario.keyboard.advancedExactlyOneQuestion,
    focusedEnterAdvancesExactlyOneQuestion: scenario.focusedEnter.advancedExactlyOneQuestion,
    focusedSpaceAdvancesExactlyOneQuestion: scenario.focusedSpace.advancedExactlyOneQuestion,
    timerStartsAtTenSeconds: scenario.timer.startsAtSeconds === 10 && scenario.timer.visibleLabelAtStart === '10s left',
    timerCountsDown: scenario.timer.afterFourSeconds === 6 && scenario.timer.visibleLabelNearExpiry === '3s left',
    timeoutForcesRestart: scenario.timer.timeoutForcesRestart && scenario.timer.answerAfterTimeoutAccepted === false,
    noDoubleSkipFromPointerClickFallback: scenario.doubleSubmit.noDoubleSkip,
    noPreCompletionResultHints: scenario.noPreCompletionHints,
    completionStillGeneratesReport:
      scenario.completion.completed &&
      scenario.completion.generatedReport &&
      scenario.completion.answeredCount === scenario.questionCount &&
      scenario.completion.answerSequenceLength === scenario.questionCount,
    sourceHasVisibleCountdownContract:
      quizClient.includes('data-quiz-countdown="visible"') &&
      quizClient.includes('role="timer"') &&
      quizClient.includes('10 seconds per question'),
    sourceHasPointerAndClickInteractionPaths:
      quizClient.includes('onPointerUp={(event) =>') &&
      quizClient.includes("selectAnswer(option.key, 'pointer')") &&
      quizClient.includes("selectAnswer(option.key, 'click')") &&
      quizClient.includes('suppressNextClickRef'),
    sourceHasKeyboardInteractionPath:
      quizClient.includes('parseKeyboardOptionKey(event.key, event.code)') &&
      quizClient.includes("selectAnswer(option, 'keyboard')") &&
      quizClient.includes("selectAnswer(option.key, 'button-key')"),
    sourceHasTimeoutRestartUi:
      quizClient.includes('Time expired. Restart the quiz to continue.') &&
      quizClient.includes('Restart quiz') &&
      quizClient.includes('role="alert"'),
    sourceBlocksPreCompletionHints:
      quizClient.includes('No result hints before completion') &&
      !/Pattern density rising|Direct signal|Control signal|Depth signal|Distance signal|Final threshold/.test(quizClient),
    noPersistenceChangeSignals: sourceScan.persistenceChangeSignals.length === 0,
    noDatabaseBindingChangeSignals: sourceScan.databaseBindingChangeSignals.length === 0,
    noNetworkSmokeChangeSignals: sourceScan.networkSmokeChangeSignals.length === 0,
    docsExist:
      existsSync(path.join(root, RELEASE_DOC_PATH)) &&
      existsSync(path.join(root, STATUS_DOC_PATH)) &&
      phase10Transition.includes('Phase 10.0 — Quiz Browser E2E Interaction Evidence'),
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
    schemaVersion: PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_SCHEMA_VERSION,
    gateId: PHASE_10_QUIZ_BROWSER_E2E_INTERACTION_EVIDENCE_ID,
    metadata: {
      evidenceMode: 'deterministic-browser-interaction-scenario-runner',
      runtimeChange: 'none',
      checkedAt: 'static-and-simulated-e2e'
    },
    gates: finalizedGates,
    scenario,
    sourceScan,
    issues
  };
}

export function writePhase10QuizBrowserE2eInteractionEvidence(
  report: Phase10QuizBrowserE2eInteractionEvidenceReport,
  outputPath = EVIDENCE_PATH
): void {
  const targetPath = path.resolve(outputPath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function scanSources(root: string): Phase10QuizBrowserE2eInteractionEvidenceReport['sourceScan'] {
  const checkedFiles = SOURCE_SCAN_FILES.filter((relativePath) => existsSync(path.join(root, relativePath)));
  const persistenceChangeSignals = findSignals(root, checkedFiles, PERSISTENCE_CHANGE_SIGNALS);
  const databaseBindingChangeSignals = findSignals(root, checkedFiles, DATABASE_BINDING_CHANGE_SIGNALS);
  const networkSmokeChangeSignals = findSignals(root, checkedFiles, NETWORK_SMOKE_CHANGE_SIGNALS);

  return {
    checkedFiles,
    persistenceChangeSignals,
    databaseBindingChangeSignals,
    networkSmokeChangeSignals
  };
}

function findSignals(root: string, relativePaths: readonly string[], signals: readonly string[]): readonly string[] {
  const findings: string[] = [];

  for (const relativePath of relativePaths) {
    const content = readOptionalFile(root, relativePath);

    for (const signal of signals) {
      if (content.includes(signal)) {
        findings.push(`${relativePath}: ${signal}`);
      }
    }
  }

  return findings;
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
