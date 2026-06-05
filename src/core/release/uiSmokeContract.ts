import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getCorridorQuestions, runCorridorsEngine } from '../index';

export const UI_SMOKE_CONTRACT_SCHEMA_VERSION = 'phase-2.8-ui-smoke-contract-v1' as const;
export const UI_SMOKE_CONTRACT_ID = 'phase-2-ui-smoke-contract' as const;

export interface UiSmokeContractOptions {
  readonly repoRoot?: string;
}

export interface UiSmokeRouteStatus {
  readonly route: '/' | '/quiz' | '/results';
  readonly file: string;
  readonly exists: boolean;
  readonly requiredSignals: readonly string[];
  readonly missingSignals: readonly string[];
  readonly passed: boolean;
}

export interface UiSmokeContractReport {
  readonly schemaVersion: typeof UI_SMOKE_CONTRACT_SCHEMA_VERSION;
  readonly smokeId: typeof UI_SMOKE_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-2-local-ui';
  };
  readonly routes: readonly UiSmokeRouteStatus[];
  readonly localOnly: {
    readonly checkedFiles: readonly string[];
    readonly forbiddenSignals: readonly string[];
    readonly violations: readonly string[];
    readonly sessionStorageAllowed: boolean;
    readonly passed: boolean;
  };
  readonly contentContract: {
    readonly questionCount: number;
    readonly sampleResultArchetype: string;
    readonly sampleResultHasReport: boolean;
    readonly sampleResultHasShareSummary: boolean;
    readonly passed: boolean;
  };
  readonly gates: {
    readonly landingRouteSmokePassed: boolean;
    readonly quizRouteSmokePassed: boolean;
    readonly resultsRouteSmokePassed: boolean;
    readonly localOnlyBoundaryPassed: boolean;
    readonly publicEngineSmokePassed: boolean;
    readonly overallPassed: boolean;
  };
  readonly issues: readonly string[];
}

const ROUTE_REQUIREMENTS: readonly Omit<UiSmokeRouteStatus, 'exists' | 'missingSignals' | 'passed'>[] = [
  {
    route: '/',
    file: 'src/app/page.tsx',
    requiredSignals: [
      'landing-title',
      'Non-clinical disclaimer',
      'Reflective game, not a diagnosis',
      'landingTrustCards',
      'landingMethodSteps',
      'landingScopeGuards',
      'href={cta.href}'
    ]
  },
  {
    route: '/quiz',
    file: 'src/features/quiz/QuizClient.tsx',
    requiredSignals: [
      'getCorridorQuestions',
      'runCorridorsEngine',
      'saveCorridorsResultToSessionStorage',
      'buildCompletionPanel',
      'buildReviewDots',
      'parseKeyboardOptionKey',
      'Enter',
      'Backspace'
    ]
  },
  {
    route: '/results',
    file: 'src/features/results/ResultsClient.tsx',
    requiredSignals: [
      'readCorridorsResultFromSessionStorage',
      'buildResultReportViewModel',
      'buildLocalShareCardPreview',
      'FeedbackPanel',
      'dominant-traits',
      'axis-map',
      'contradiction-map',
      'evidence-digest',
      'trust-guard',
      'local-feedback',
      'share-summary'
    ]
  }
] as const;

const LOCAL_ONLY_FILES = [
  'src/app/page.tsx',
  'src/features/landing/landingPresentation.ts',
  'src/features/quiz/QuizClient.tsx',
  'src/features/quiz/quizFlow.ts',
  'src/features/results/ResultsClient.tsx',
  'src/features/results/resultFeedback.ts',
  'src/features/results/resultShareCard.ts'
] as const;

const FORBIDDEN_LOCAL_ONLY_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'window.localStorage',
  '.localStorage',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'createClient(',
  'new PrismaClient',
  'OpenAI(',
  'generateText(',
  'streamText('
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'

export function runUiSmokeContract(options: UiSmokeContractOptions = {}): UiSmokeContractReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const routes = ROUTE_REQUIREMENTS.map((route) => checkRoute(repoRoot, route));
  const localOnly = checkLocalOnlyBoundary(repoRoot);
  const contentContract = checkPublicEngineContentContract();

  const landingRouteSmokePassed = Boolean(routes.find((route) => route.route === '/')?.passed);
  const quizRouteSmokePassed = Boolean(routes.find((route) => route.route === '/quiz')?.passed);
  const resultsRouteSmokePassed = Boolean(routes.find((route) => route.route === '/results')?.passed);

  const gates = {
    landingRouteSmokePassed,
    quizRouteSmokePassed,
    resultsRouteSmokePassed,
    localOnlyBoundaryPassed: localOnly.passed,
    publicEngineSmokePassed: contentContract.passed,
    overallPassed: false
  };
  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: UI_SMOKE_CONTRACT_SCHEMA_VERSION,
    smokeId: UI_SMOKE_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-2-local-ui'
    },
    routes,
    localOnly,
    contentContract,
    gates: completeGates,
    issues: buildIssues(routes, localOnly, contentContract, completeGates)
  };
}

function checkRoute(
  repoRoot: string,
  route: Omit<UiSmokeRouteStatus, 'exists' | 'missingSignals' | 'passed'>
): UiSmokeRouteStatus {
  const absolutePath = path.join(repoRoot, route.file);
  const exists = existsSync(absolutePath);
  const source = exists ? readFileSync(absolutePath, 'utf8') : '';
  const missingSignals = route.requiredSignals.filter((signal) => !source.includes(signal));

  return {
    ...route,
    exists,
    missingSignals,
    passed: exists && missingSignals.length === 0
  };
}

function checkLocalOnlyBoundary(repoRoot: string): UiSmokeContractReport['localOnly'] {
  const checkedFiles = LOCAL_ONLY_FILES.filter((file) => existsSync(path.join(repoRoot, file)));
  const violations: string[] = [];

  for (const file of checkedFiles) {
    const source = readFileSync(path.join(repoRoot, file), 'utf8').toLowerCase();

    for (const signal of FORBIDDEN_LOCAL_ONLY_SIGNALS) {
      if (source.includes(signal.toLowerCase())) {
        violations.push(`${file}:${signal}`);
      }
    }
  }

  return {
    checkedFiles,
    forbiddenSignals: FORBIDDEN_LOCAL_ONLY_SIGNALS,
    violations,
    sessionStorageAllowed: true,
    passed: checkedFiles.length === LOCAL_ONLY_FILES.length && violations.length === 0
  };
}

function checkPublicEngineContentContract(): UiSmokeContractReport['contentContract'] {
  const questions = getCorridorQuestions();
  const sampleResult = runCorridorsEngine(SAMPLE_ANSWERS);

  return {
    questionCount: questions.length,
    sampleResultArchetype: sampleResult.archetype.title,
    sampleResultHasReport: sampleResult.report.axisCards.length === 6 && sampleResult.report.evidenceDigest.length > 0,
    sampleResultHasShareSummary: sampleResult.report.overview.patternSummary.length > 0,
    passed: questions.length === 20 && sampleResult.report.axisCards.length === 6 && sampleResult.report.overview.patternSummary.length > 0
  };
}

function buildIssues(
  routes: readonly UiSmokeRouteStatus[],
  localOnly: UiSmokeContractReport['localOnly'],
  contentContract: UiSmokeContractReport['contentContract'],
  gates: UiSmokeContractReport['gates']
): string[] {
  const issues: string[] = [];

  for (const route of routes) {
    if (!route.exists) {
      issues.push(`ui_smoke_missing_route_file:${route.route}:${route.file}`);
    }

    for (const missingSignal of route.missingSignals) {
      issues.push(`ui_smoke_missing_signal:${route.route}:${missingSignal}`);
    }
  }

  for (const violation of localOnly.violations) {
    issues.push(`ui_smoke_local_only_violation:${violation}`);
  }

  if (localOnly.checkedFiles.length !== LOCAL_ONLY_FILES.length) {
    issues.push('ui_smoke_local_only_file_set_incomplete');
  }

  if (!contentContract.passed) {
    issues.push('ui_smoke_public_engine_content_contract_failed');
  }

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`ui_smoke_gate_failed:${key}`);
    }
  }

  return issues;
}
