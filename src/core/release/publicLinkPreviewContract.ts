import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '../engine';
import {
  buildLocalPublicPreviewMetadata,
  buildLocalPublicResultPreview,
  isPublicLinkPreviewPayloadSafe,
  LOCAL_PUBLIC_LINK_PREVIEW_ROUTE
} from '../../features/public-link/publicLinkPreview';
import { runPublicResultDtoContract } from './publicResultDtoContract';

export const PUBLIC_LINK_PREVIEW_CONTRACT_SCHEMA_VERSION = 'phase-5.3-public-link-preview-v1' as const;
export const PUBLIC_LINK_PREVIEW_CONTRACT_ID = 'phase-5-public-link-preview-ux-polish-route-smoke' as const;

export interface PublicLinkPreviewContractOptions {
  readonly repoRoot?: string;
}

export interface PublicLinkPreviewContractReport {
  readonly schemaVersion: typeof PUBLIC_LINK_PREVIEW_CONTRACT_SCHEMA_VERSION;
  readonly contractId: typeof PUBLIC_LINK_PREVIEW_CONTRACT_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-5-public-link-preview-ux-polish';
    readonly route: typeof LOCAL_PUBLIC_LINK_PREVIEW_ROUTE;
    readonly publicResultDtoContractSchemaVersion: string;
  };
  readonly gates: {
    readonly publicDtoContractPassed: boolean;
    readonly previewScriptExists: boolean;
    readonly validateScriptRunsPreviewContract: boolean;
    readonly previewRouteExists: boolean;
    readonly previewClientExists: boolean;
    readonly previewHelperExists: boolean;
    readonly resultPageLinksToPreview: boolean;
    readonly routeRequiredSignalsPresent: boolean;
    readonly clientRequiredSignalsPresent: boolean;
    readonly helperRequiredSignalsPresent: boolean;
    readonly localDtoPreviewPassed: boolean;
    readonly rawAnswerPreviewLeakageAbsent: boolean;
    readonly noBackendDatabaseApiLookupSignals: boolean;
    readonly statusDocExists: boolean;
    readonly publicPreviewSectionModelPassed: boolean;
    readonly stateCopyPolishPassed: boolean;
    readonly routeSmokeUpgradePassed: boolean;
    readonly overallPassed: boolean;
  };
  readonly files: {
    readonly previewRoute: string;
    readonly previewClient: string;
    readonly previewHelper: string;
    readonly resultsClient: string;
    readonly statusDoc: string;
  };
  readonly signalScan: {
    readonly missingRouteSignals: readonly string[];
    readonly missingClientSignals: readonly string[];
    readonly missingHelperSignals: readonly string[];
    readonly forbiddenPreviewSignals: readonly string[];
    readonly forbiddenPrivateKeyCount: number;
  };
  readonly samplePreview: {
    readonly dtoKeyCount: number;
    readonly axisSummaryCount: number;
    readonly contradictionSummaryCount: number;
    readonly sectionCount: number;
    readonly metricCount: number;
    readonly boundaryNote: string;
    readonly resultId: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly previewPublicLink?: string;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const PREVIEW_ROUTE = 'src/app/r/preview/page.tsx';
const PREVIEW_CLIENT = 'src/features/public-link/PublicLinkPreviewClient.tsx';
const PREVIEW_HELPER = 'src/features/public-link/publicLinkPreview.ts';
const RESULTS_CLIENT = 'src/features/results/ResultsClient.tsx';
const STATUS_DOC = 'docs/ui/phase-5-3-public-link-preview-ux-polish-route-smoke-upgrade-status.md';

const ROUTE_REQUIRED_SIGNALS = ['PublicLinkPreviewClient', 'PublicLinkPreviewPage'] as const;
const CLIENT_REQUIRED_SIGNALS = [
  'readCorridorsResultFromSessionStorage',
  'buildLocalPublicResultPreview',
  'Minimized DTO only',
  'Public share surface',
  'Privacy boundary',
  'public-preview-route-smoke',
  'public-preview-nav',
  'public-preview-actions',
  '/results',
  '/quiz'
] as const;
const HELPER_REQUIRED_SIGNALS = [
  'buildPublicResultDto',
  'LOCAL_PUBLIC_LINK_PREVIEW_ROUTE',
  'LOCAL_PUBLIC_LINK_PREVIEW_MODE',
  'LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE',
  'isPublicLinkPreviewPayloadSafe',
  'buildPublicLinkPreviewSections',
  'buildPublicLinkPreviewMetrics',
  'individual choices'
] as const;

const FORBIDDEN_PREVIEW_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'createClient(',
  'new PrismaClient',
  'drizzle(',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'auth(',
  'signIn(',
  'signOut(',
  'localStorage',
  'indexedDB',
  'result.answers',
  'rawAnswers',
  'questionAnswers',
  'answerText',
  'questionId',
  'evidenceDigest',
  'serializeCorridorsResult',
  'deserializeCorridorsResult',
  'publicResultStorage'
] as const;

const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

export function runPublicLinkPreviewContract(options: PublicLinkPreviewContractOptions = {}): PublicLinkPreviewContractReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const validateScript = packageJson.scripts?.validate ?? '';
  const publicDtoContract = runPublicResultDtoContract({ repoRoot });

  const routeSource = readOptionalFile(repoRoot, PREVIEW_ROUTE);
  const clientSource = readOptionalFile(repoRoot, PREVIEW_CLIENT);
  const helperSource = readOptionalFile(repoRoot, PREVIEW_HELPER);
  const resultClientSource = readOptionalFile(repoRoot, RESULTS_CLIENT);
  const previewSource = [routeSource, clientSource, helperSource].join('\n');

  const missingRouteSignals = missingSignals(routeSource, ROUTE_REQUIRED_SIGNALS);
  const missingClientSignals = missingSignals(clientSource, CLIENT_REQUIRED_SIGNALS);
  const missingHelperSignals = missingSignals(helperSource, HELPER_REQUIRED_SIGNALS);
  const forbiddenPreviewSignals = findSignals(previewSource, FORBIDDEN_PREVIEW_SIGNALS);

  const sampleResult = runCorridorsEngine(SAMPLE_ANSWERS);
  const samplePreview = buildLocalPublicResultPreview(
    sampleResult,
    buildLocalPublicPreviewMetadata(new Date('2026-06-06T00:00:00.000Z'))
  );
  const dtoKeys = Object.keys(samplePreview.dto);
  const localDtoPreviewPassed = samplePreview.route === LOCAL_PUBLIC_LINK_PREVIEW_ROUTE
    && isPublicLinkPreviewPayloadSafe(samplePreview.dto)
    && samplePreview.dto.axisSummaries.length === 6
    && samplePreview.dto.shareCard.boundaryText.includes('Raw choices')
    && !('answers' in samplePreview.dto);
  const publicPreviewSectionModelPassed = samplePreview.sections.length === 4
    && samplePreview.sections.map((section) => section.id).join('|') === 'share-card|traits|axis-summary|privacy-boundary';
  const stateCopyPolishPassed = samplePreview.metrics.length === 4
    && samplePreview.renderingMode.includes('DTO-only')
    && samplePreview.privacyBullets.some((bullet) => bullet.includes('No backend request'));
  const routeSmokeUpgradePassed = clientSource.includes('public-preview-route-smoke')
    && clientSource.includes('public-preview-nav')
    && clientSource.includes('public-preview-actions');

  const gates = {
    publicDtoContractPassed: publicDtoContract.gates.overallPassed,
    previewScriptExists: packageJson.scripts?.['preview:public-link'] === 'tsx scripts/public-link-preview-contract.ts',
    validateScriptRunsPreviewContract: validateScript.includes('npm run preview:public-link'),
    previewRouteExists: existsSync(path.join(repoRoot, PREVIEW_ROUTE)),
    previewClientExists: existsSync(path.join(repoRoot, PREVIEW_CLIENT)),
    previewHelperExists: existsSync(path.join(repoRoot, PREVIEW_HELPER)),
    resultPageLinksToPreview: resultClientSource.includes('href="/r/preview"') || resultClientSource.includes("href='/r/preview'"),
    routeRequiredSignalsPresent: missingRouteSignals.length === 0,
    clientRequiredSignalsPresent: missingClientSignals.length === 0,
    helperRequiredSignalsPresent: missingHelperSignals.length === 0,
    localDtoPreviewPassed,
    rawAnswerPreviewLeakageAbsent: forbiddenPreviewSignals.length === 0,
    noBackendDatabaseApiLookupSignals: forbiddenPreviewSignals.length === 0,
    statusDocExists: existsSync(path.join(repoRoot, STATUS_DOC)),
    publicPreviewSectionModelPassed,
    stateCopyPolishPassed,
    routeSmokeUpgradePassed,
    overallPassed: false
  };
  const completeGates = {
    ...gates,
    overallPassed: Object.entries(gates)
      .filter(([key]) => key !== 'overallPassed')
      .every(([, value]) => value === true)
  };

  return {
    schemaVersion: PUBLIC_LINK_PREVIEW_CONTRACT_SCHEMA_VERSION,
    contractId: PUBLIC_LINK_PREVIEW_CONTRACT_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-5-public-link-preview-ux-polish',
      route: LOCAL_PUBLIC_LINK_PREVIEW_ROUTE,
      publicResultDtoContractSchemaVersion: publicDtoContract.schemaVersion
    },
    gates: completeGates,
    files: {
      previewRoute: PREVIEW_ROUTE,
      previewClient: PREVIEW_CLIENT,
      previewHelper: PREVIEW_HELPER,
      resultsClient: RESULTS_CLIENT,
      statusDoc: STATUS_DOC
    },
    signalScan: {
      missingRouteSignals,
      missingClientSignals,
      missingHelperSignals,
      forbiddenPreviewSignals,
      forbiddenPrivateKeyCount: forbiddenPreviewSignals.length
    },
    samplePreview: {
      dtoKeyCount: dtoKeys.length,
      axisSummaryCount: samplePreview.dto.axisSummaries.length,
      contradictionSummaryCount: samplePreview.dto.contradictionSummaries.length,
      sectionCount: samplePreview.sections.length,
      metricCount: samplePreview.metrics.length,
      boundaryNote: samplePreview.boundaryNote,
      resultId: samplePreview.dto.resultId
    },
    scripts: buildScripts(validateScript, packageJson.scripts?.['preview:public-link']),
    issues: buildIssues(completeGates, missingRouteSignals, missingClientSignals, missingHelperSignals, forbiddenPreviewSignals)
  };
}


function buildScripts(
  validate: string,
  previewPublicLink: string | undefined
): PublicLinkPreviewContractReport['scripts'] {
  return previewPublicLink === undefined
    ? { validate }
    : { validate, previewPublicLink };
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const source = readFileSync(path.join(repoRoot, 'package.json'), 'utf8');
  return JSON.parse(source) as PackageJsonSubset;
}

function readOptionalFile(repoRoot: string, relativePath: string): string {
  const absolutePath = path.join(repoRoot, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
}

function missingSignals(source: string, signals: readonly string[]): readonly string[] {
  return signals.filter((signal) => !source.includes(signal));
}

function findSignals(source: string, signals: readonly string[]): readonly string[] {
  const normalized = source.toLowerCase();
  return signals.filter((signal) => normalized.includes(signal.toLowerCase()));
}

function buildIssues(
  gates: PublicLinkPreviewContractReport['gates'],
  missingRouteSignals: readonly string[],
  missingClientSignals: readonly string[],
  missingHelperSignals: readonly string[],
  forbiddenPreviewSignals: readonly string[]
): string[] {
  const issues: string[] = [];

  for (const [gate, passed] of Object.entries(gates)) {
    if (gate !== 'overallPassed' && passed !== true) {
      issues.push(`public_link_preview_gate_failed:${gate}`);
    }
  }

  for (const signal of missingRouteSignals) issues.push(`public_link_preview_missing_route_signal:${signal}`);
  for (const signal of missingClientSignals) issues.push(`public_link_preview_missing_client_signal:${signal}`);
  for (const signal of missingHelperSignals) issues.push(`public_link_preview_missing_helper_signal:${signal}`);
  for (const signal of forbiddenPreviewSignals) issues.push(`public_link_preview_forbidden_signal:${signal}`);

  return issues;
}
