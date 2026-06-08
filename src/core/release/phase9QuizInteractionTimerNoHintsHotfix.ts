import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const PHASE_9_QUIZ_INTERACTION_TIMER_NO_HINTS_SCHEMA_VERSION =
  'phase-9.4.1-quiz-interaction-timer-no-hints-hotfix-v1' as const;
export const PHASE_9_QUIZ_INTERACTION_TIMER_NO_HINTS_GATE_ID =
  'phase-9.4.1-quiz-interaction-timer-no-hints-hotfix' as const;

const PACKAGE_JSON_PATH = 'package.json';
const QUIZ_CLIENT_PATH = 'src/features/quiz/QuizClient.tsx';
const QUIZ_FLOW_PATH = 'src/features/quiz/quizFlow.ts';
const QUIZ_PRESENTATION_PATH = 'src/features/quiz/quizPresentation.ts';
const QUIZ_VISUAL_IDENTITY_PATH = 'src/features/quiz/quizVisualIdentity.ts';
const GLOBAL_CSS_PATH = 'src/app/globals.css';
const GATE_SCRIPT_PATH = 'scripts/quiz-interaction-timer-no-hints-hotfix.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9QuizInteractionTimerNoHintsHotfix.ts';
const FLOW_TEST_PATH = 'tests/ui/quizFlow.test.ts';
const PRESENTATION_TEST_PATH = 'tests/ui/quizPresentation.test.ts';
const VISUAL_IDENTITY_TEST_PATH = 'tests/ui/quizVisualIdentity.test.ts';
const GATE_TEST_PATH = 'tests/core/phase9QuizInteractionTimerNoHintsHotfix.test.ts';
const PHASE9_BROWSER_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-browser-evidence-gate-latest.json';
const STATUS_DOC_PATH = 'docs/ui/phase-9-4-1-quiz-interaction-timer-no-hints-hotfix-status.md';
const RELEASE_DOC_PATH = 'docs/release/phase-9-quiz-interaction-timer-no-hints-hotfix.md';

const REQUIRED_QUIZ_CLIENT_TOKENS = [
  'data-interaction-target="quiz-answer-option"',
  'selectAnswer(option.key',
  'aria-keyshortcuts={option.key}',
  'parseKeyboardOptionKey(event.key',
  'role="timer"',
  'QUIZ_SECONDS_PER_QUESTION',
  'Restart quiz',
  'No result hints before completion',
  'disabled={isInteractionBlocked}'
] as const;

const FORBIDDEN_IN_PROGRESS_HINT_TOKENS = [
  'Pattern density rising',
  'Direct signal',
  'Control signal',
  'Depth signal',
  'Distance signal',
  'Final threshold',
  'Q${currentQuestion.id}${option}'
] as const;

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

export interface Phase9QuizInteractionTimerNoHintsHotfixReport {
  readonly schemaVersion: typeof PHASE_9_QUIZ_INTERACTION_TIMER_NO_HINTS_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_QUIZ_INTERACTION_TIMER_NO_HINTS_GATE_ID;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly quizClientExists: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsGate: boolean;
    readonly mouseClickSelectionHardened: boolean;
    readonly keyboardSelectionHardened: boolean;
    readonly perQuestionTimerIsTenSeconds: boolean;
    readonly timeoutForcesRestart: boolean;
    readonly answerButtonsDisableAfterTimeout: boolean;
    readonly reviewDotsHideAnswerKeysBeforeCompletion: boolean;
    readonly inProgressResultHintsRemoved: boolean;
    readonly optionSignalsAreGeneric: boolean;
    readonly pointerTargetCssHardened: boolean;
    readonly phase9BrowserEvidenceCurrent: boolean;
    readonly testsExist: boolean;
    readonly docsExist: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly requiredQuizClientTokenCount: number;
    readonly presentQuizClientTokenCount: number;
    readonly forbiddenHintTokenCount: number;
  };
  readonly issues: readonly string[];
}

export function runPhase9QuizInteractionTimerNoHintsHotfixGate(
  repoRoot = process.cwd()
): Phase9QuizInteractionTimerNoHintsHotfixReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const quizClient = readOptionalFile(root, QUIZ_CLIENT_PATH);
  const quizFlow = readOptionalFile(root, QUIZ_FLOW_PATH);
  const quizPresentation = readOptionalFile(root, QUIZ_PRESENTATION_PATH);
  const quizVisualIdentity = readOptionalFile(root, QUIZ_VISUAL_IDENTITY_PATH);
  const css = readOptionalFile(root, GLOBAL_CSS_PATH);
  const phase9BrowserEvidence = readJson<Record<string, unknown>>(root, PHASE9_BROWSER_EVIDENCE_PATH);

  const presentQuizClientTokenCount = REQUIRED_QUIZ_CLIENT_TOKENS.filter((token) => quizClient.includes(token)).length;
  const forbiddenHintTokens = FORBIDDEN_IN_PROGRESS_HINT_TOKENS.filter((token) =>
    `${quizClient}\n${quizVisualIdentity}\n${quizPresentation}`.includes(token)
  );

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    quizClientExists: existsSync(path.join(root, QUIZ_CLIENT_PATH)),
    packageScriptExists:
      packageJson.scripts?.['gate:quiz-interaction-timer-no-hints'] ===
      'tsx scripts/quiz-interaction-timer-no-hints-hotfix.ts',
    validateRunsGate: (packageJson.scripts?.validate ?? '').includes('npm run gate:quiz-interaction-timer-no-hints'),
    mouseClickSelectionHardened:
      quizClient.includes('data-interaction-target="quiz-answer-option"') &&
      (quizClient.includes('onClick={() => selectAnswer(option.key)}') ||
        quizClient.includes("selectAnswer(option.key, 'click')")) &&
      (quizClient.includes('onPointerUp=') || quizClient.includes('onPointerUp={(event) =>')) &&
      css.includes('touch-action: manipulation') &&
      css.includes('pointer-events: auto'),
    keyboardSelectionHardened:
      (quizClient.includes('parseKeyboardOptionKey(event.key)') ||
        quizClient.includes('parseKeyboardOptionKey(event.key, event.code)')) &&
      quizClient.includes('aria-keyshortcuts={option.key}') &&
      quizClient.includes("event.key === 'Enter' || event.key === ' '") &&
      quizClient.includes('event.repeat'),
    perQuestionTimerIsTenSeconds:
      quizFlow.includes('QUIZ_SECONDS_PER_QUESTION = 10') &&
      quizClient.includes('role="timer"') &&
      quizClient.includes('10 seconds per question'),
    timeoutForcesRestart:
      quizClient.includes('Time expired. Restart the quiz to continue.') &&
      quizClient.includes('Restart quiz') &&
      quizClient.includes('restartQuiz'),
    answerButtonsDisableAfterTimeout:
      quizClient.includes('disabled={isInteractionBlocked}') &&
      quizClient.includes('const isInteractionBlocked = isTimedOut'),
    reviewDotsHideAnswerKeysBeforeCompletion:
      quizPresentation.includes('revealAnswerKeys = false') &&
      quizClient.includes('progress.isComplete') &&
      quizPresentation.includes('isAnswered && revealAnswerKeys'),
    inProgressResultHintsRemoved: forbiddenHintTokens.length === 0,
    optionSignalsAreGeneric:
      quizVisualIdentity.includes("A: { signal: 'Answer A'") &&
      quizVisualIdentity.includes("B: { signal: 'Answer B'") &&
      quizVisualIdentity.includes("C: { signal: 'Answer C'") &&
      quizVisualIdentity.includes("D: { signal: 'Answer D'"),
    pointerTargetCssHardened:
      css.includes('.quiz-option-grid .option-button > span') &&
      css.includes('pointer-events: none') &&
      css.includes('cursor: pointer'),
    phase9BrowserEvidenceCurrent: phase9BrowserEvidence !== null && readOverallPassed(phase9BrowserEvidence),
    testsExist:
      existsSync(path.join(root, FLOW_TEST_PATH)) &&
      existsSync(path.join(root, PRESENTATION_TEST_PATH)) &&
      existsSync(path.join(root, VISUAL_IDENTITY_TEST_PATH)) &&
      existsSync(path.join(root, GATE_TEST_PATH)),
    docsExist: existsSync(path.join(root, STATUS_DOC_PATH)) && existsSync(path.join(root, RELEASE_DOC_PATH)),
    noPersistenceChangeSignals: !quizClient.includes('createPublicResult') && !quizClient.includes('@neondatabase/serverless'),
    noDatabaseBindingChangeSignals:
      !quizClient.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION') &&
      !quizClient.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'),
    noNetworkSmokeChangeSignals: !quizClient.includes('fetch(') && !quizClient.includes('networkLookupSmokeExecuted'),
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
    schemaVersion: PHASE_9_QUIZ_INTERACTION_TIMER_NO_HINTS_SCHEMA_VERSION,
    gateId: PHASE_9_QUIZ_INTERACTION_TIMER_NO_HINTS_GATE_ID,
    gates: finalizedGates,
    coverage: {
      requiredQuizClientTokenCount: REQUIRED_QUIZ_CLIENT_TOKENS.length,
      presentQuizClientTokenCount,
      forbiddenHintTokenCount: forbiddenHintTokens.length
    },
    issues
  };
}

export function writePhase9QuizInteractionTimerNoHintsHotfixEvidence(
  report: Phase9QuizInteractionTimerNoHintsHotfixReport,
  outputPath: string
): void {
  const targetPath = path.resolve(outputPath);
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
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

function readOverallPassed(evidence: Record<string, unknown>): boolean {
  if (evidence.overallPassed === true) {
    return true;
  }

  const gates = evidence.gates;
  return typeof gates === 'object' && gates !== null && 'overallPassed' in gates && gates.overallPassed === true;
}
