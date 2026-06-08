import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export const PHASE_9_QUIZ_BROWSER_INTERACTION_UX_SCHEMA_VERSION =
  'phase-9.4.2-quiz-browser-interaction-ux-hotfix-v1' as const;
export const PHASE_9_QUIZ_BROWSER_INTERACTION_UX_GATE_ID =
  'phase-9.4.2-quiz-browser-interaction-ux-hotfix' as const;

const PACKAGE_JSON_PATH = 'package.json';
const NEXT_CONFIG_PATH = 'next.config.ts';
const QUIZ_CLIENT_PATH = 'src/features/quiz/QuizClient.tsx';
const QUIZ_FLOW_PATH = 'src/features/quiz/quizFlow.ts';
const GATE_SCRIPT_PATH = 'scripts/quiz-browser-interaction-ux-hotfix.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9QuizBrowserInteractionUxHotfix.ts';
const GATE_TEST_PATH = 'tests/core/phase9QuizBrowserInteractionUxHotfix.test.ts';
const FLOW_TEST_PATH = 'tests/ui/quizFlow.test.ts';
const PHASE_9_4_1_EVIDENCE_PATH = 'docs/evidence/phase9-quiz-interaction-timer-no-hints-hotfix-latest.json';
const EVIDENCE_PATH = 'docs/evidence/phase9-quiz-browser-interaction-ux-hotfix-latest.json';
const STATUS_DOC_PATH = 'docs/ui/phase-9-4-2-quiz-browser-interaction-ux-hotfix-status.md';
const RELEASE_DOC_PATH = 'docs/release/phase-9-quiz-browser-interaction-ux-hotfix.md';

interface PackageJsonShape {
  readonly scripts?: Record<string, string>;
}

export interface Phase9QuizBrowserInteractionUxHotfixReport {
  readonly schemaVersion: typeof PHASE_9_QUIZ_BROWSER_INTERACTION_UX_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_QUIZ_BROWSER_INTERACTION_UX_GATE_ID;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsGate: boolean;
    readonly previousQuizHotfixEvidenceCurrent: boolean;
    readonly nextDevOriginAllowsUserNetworkHost: boolean;
    readonly clientHydrationMarkerExists: boolean;
    readonly countdownVisibleMarkerExists: boolean;
    readonly pointerActivationPathExists: boolean;
    readonly clickFallbackDoesNotDoubleSubmit: boolean;
    readonly keyboardShortcutUsesKeyAndCode: boolean;
    readonly staleClosureProtectionExists: boolean;
    readonly timeoutStillForcesRestart: boolean;
    readonly inProgressHintsRemainBlocked: boolean;
    readonly testsExist: boolean;
    readonly docsExist: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly issues: readonly string[];
}

export function runPhase9QuizBrowserInteractionUxHotfixGate(
  repoRoot = process.cwd()
): Phase9QuizBrowserInteractionUxHotfixReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const nextConfig = readOptionalFile(root, NEXT_CONFIG_PATH);
  const quizClient = readOptionalFile(root, QUIZ_CLIENT_PATH);
  const quizFlow = readOptionalFile(root, QUIZ_FLOW_PATH);
  const previousEvidence = readJson<Record<string, unknown>>(root, PHASE_9_4_1_EVIDENCE_PATH);

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    packageScriptExists:
      packageJson.scripts?.['gate:quiz-browser-interaction-ux'] ===
      'tsx scripts/quiz-browser-interaction-ux-hotfix.ts',
    validateRunsGate: (packageJson.scripts?.validate ?? '').includes('npm run gate:quiz-browser-interaction-ux'),
    previousQuizHotfixEvidenceCurrent: previousEvidence !== null && readOverallPassed(previousEvidence),
    nextDevOriginAllowsUserNetworkHost:
      nextConfig.includes('allowedDevOrigins') && nextConfig.includes("'172.21.48.1'"),
    clientHydrationMarkerExists: quizClient.includes('data-quiz-workflow="timed-interactive"'),
    countdownVisibleMarkerExists:
      quizClient.includes('data-quiz-countdown="visible"') &&
      quizClient.includes('role="timer"') &&
      quizClient.includes('10 seconds per question'),
    pointerActivationPathExists:
      quizClient.includes('onPointerUp={(event) =>') &&
      quizClient.includes("selectAnswer(option.key, 'pointer')") &&
      quizClient.includes('event.currentTarget.focus()'),
    clickFallbackDoesNotDoubleSubmit:
      quizClient.includes('suppressNextClickRef') &&
      quizClient.includes("selectAnswer(option.key, 'click')") &&
      quizClient.includes('suppressNextClickRef.current = false') &&
      quizClient.includes('suppressNextClickRef.current = true'),
    keyboardShortcutUsesKeyAndCode:
      quizClient.includes('parseKeyboardOptionKey(event.key, event.code)') &&
      quizFlow.includes('normalizedCode === \'KEYA\'') &&
      quizFlow.includes('normalizedCode === \'KEYD\''),
    staleClosureProtectionExists:
      quizClient.includes('answersRef') &&
      quizClient.includes('currentIndexRef') &&
      quizClient.includes('isTimedOutRef') &&
      quizClient.includes('lastAnswerActivationRef'),
    timeoutStillForcesRestart:
      quizClient.includes('Time expired. Restart the quiz to continue.') &&
      quizClient.includes('Restart quiz') &&
      quizClient.includes('isTimedOutRef.current = true'),
    inProgressHintsRemainBlocked:
      !/Pattern density rising|Direct signal|Control signal|Depth signal|Distance signal|Final threshold/.test(quizClient),
    testsExist: existsSync(path.join(root, GATE_TEST_PATH)) && existsSync(path.join(root, FLOW_TEST_PATH)),
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
    schemaVersion: PHASE_9_QUIZ_BROWSER_INTERACTION_UX_SCHEMA_VERSION,
    gateId: PHASE_9_QUIZ_BROWSER_INTERACTION_UX_GATE_ID,
    gates: finalizedGates,
    issues
  };
}

export function writePhase9QuizBrowserInteractionUxHotfixEvidence(
  report: Phase9QuizBrowserInteractionUxHotfixReport,
  outputPath = EVIDENCE_PATH
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
