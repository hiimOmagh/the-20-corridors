import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_SHARE_COPY_UX_PHASE,
  PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION,
  summarizePublicResultShareCopyUxRules
} from '../public-link/publicResultShareCopyUx';

export const PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_SCHEMA_VERSION =
  'phase-9.1-public-result-share-copy-ux-polish-gate-v1' as const;
export const PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_ID =
  'phase-9.1-public-result-share-copy-ux-polish' as const;

const PACKAGE_JSON_PATH = 'package.json';
const PAGE_PATH = 'src/app/r/(public)/[publicId]/page.tsx';
const SHARE_COPY_MODULE_PATH = 'src/core/public-link/publicResultShareCopyUx.ts';
const PHASE9_COPY_GATE_EVIDENCE_PATH = 'docs/evidence/phase9-public-result-page-ux-copy-polish-latest.json';
const GATE_SCRIPT_PATH = 'scripts/phase9-public-result-share-copy-ux-polish.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9PublicResultShareCopyUxPolish.ts';
const SHARE_COPY_TEST_PATH = 'tests/core/publicResultShareCopyUx.test.ts';
const GATE_TEST_PATH = 'tests/core/phase9PublicResultShareCopyUxPolish.test.ts';
const PHASE9_STATUS_DOC_PATH = 'docs/ui/phase-9-1-public-result-share-copy-ux-polish-status.md';
const PHASE9_RELEASE_DOC_PATH = 'docs/release/phase-9-public-result-share-copy-ux-polish.md';
const PHASE9_TRANSITION_DOC_PATH = 'docs/ui/phase-9-transition-plan.md';

const REQUIRED_SHARE_COPY_PHRASES = [
  'Share this public result',
  'Copy public result link',
  'Manual copy path',
  'manually copy this page path',
  'Sharing unavailable for this state',
  'Copy action unavailable',
  'no renderable public result to share'
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

export interface Phase9PublicResultShareCopyUxPolishReport {
  readonly schemaVersion: typeof PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_ID;
  readonly shareCopySchemaVersion: typeof PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION;
  readonly shareCopyPhase: typeof PUBLIC_RESULT_SHARE_COPY_UX_PHASE;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly shareCopyModuleExists: boolean;
    readonly pageRouteExists: boolean;
    readonly shareCopyTestsExist: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsShareCopyGate: boolean;
    readonly phase9CopyGateEvidenceCurrent: boolean;
    readonly phase9StatusDocExists: boolean;
    readonly phase9ReleaseDocExists: boolean;
    readonly phase9TransitionPlanUpdated: boolean;
    readonly pageUsesShareCopyBuilder: boolean;
    readonly pageExposesShareCopyAvailability: boolean;
    readonly pageRendersShareCopyPanelOnlyWhenAvailable: boolean;
    readonly copyLinkAffordanceTextClear: boolean;
    readonly manualCopyGuidanceExists: boolean;
    readonly unavailableStatesBlockCopyAction: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noDatabaseBindingChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly requiredShareCopyPhraseCount: number;
    readonly presentShareCopyPhraseCount: number;
    readonly shareCopyRuleCount: number;
    readonly forbiddenPageSignalCount: number;
    readonly persistenceChangeSignalCount: number;
    readonly databaseBindingChangeSignalCount: number;
    readonly networkSmokeChangeSignalCount: number;
  };
  readonly docs: {
    readonly status: string;
    readonly release: string;
    readonly phase9Transition: string;
    readonly phase9CopyGateEvidence: string;
  };
  readonly issues: readonly string[];
}

export function runPhase9PublicResultShareCopyUxPolishGate(
  repoRoot = process.cwd()
): Phase9PublicResultShareCopyUxPolishReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const page = readOptionalFile(root, PAGE_PATH);
  const shareCopyModule = readOptionalFile(root, SHARE_COPY_MODULE_PATH);
  const phase9CopyGateEvidence = readJson<Record<string, unknown>>(root, PHASE9_COPY_GATE_EVIDENCE_PATH);
  const transitionPlan = readOptionalFile(root, PHASE9_TRANSITION_DOC_PATH);

  const presentShareCopyPhraseCount = REQUIRED_SHARE_COPY_PHRASES.filter((phrase) => shareCopyModule.includes(phrase)).length;
  const forbiddenPageSignals = FORBIDDEN_PAGE_TOKENS.filter((token) => page.includes(token));
  const persistenceChangeSignals = [
    shareCopyModule.includes('createPublicResultApiRouteDatabaseBindingStorageAdapter'),
    shareCopyModule.includes('@neondatabase/serverless'),
    shareCopyModule.includes('executeQuery('),
    shareCopyModule.includes('adapter.read(')
  ].filter(Boolean).length;
  const databaseBindingChangeSignals = [
    shareCopyModule.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    shareCopyModule.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION'),
    page.includes('PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION'),
    page.includes('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION')
  ].filter(Boolean).length;
  const networkSmokeChangeSignals = [
    shareCopyModule.includes('networkLookupSmokeExecuted: true'),
    shareCopyModule.includes('fetch('),
    page.includes('networkLookupSmokeExecuted')
  ].filter(Boolean).length;

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    shareCopyModuleExists: existsSync(path.join(root, SHARE_COPY_MODULE_PATH)),
    pageRouteExists: existsSync(path.join(root, PAGE_PATH)),
    shareCopyTestsExist: existsSync(path.join(root, SHARE_COPY_TEST_PATH)),
    gateTestsExist: existsSync(path.join(root, GATE_TEST_PATH)),
    packageScriptExists:
      packageJson.scripts?.['gate:phase9-public-result-share-copy'] ===
      'tsx scripts/phase9-public-result-share-copy-ux-polish.ts',
    validateRunsShareCopyGate: (packageJson.scripts?.validate ?? '').includes('npm run gate:phase9-public-result-share-copy'),
    phase9CopyGateEvidenceCurrent: phase9CopyGateEvidence !== null && readOverallPassed(phase9CopyGateEvidence),
    phase9StatusDocExists: existsSync(path.join(root, PHASE9_STATUS_DOC_PATH)),
    phase9ReleaseDocExists: existsSync(path.join(root, PHASE9_RELEASE_DOC_PATH)),
    phase9TransitionPlanUpdated:
      transitionPlan.includes('Phase 9.1') &&
      transitionPlan.includes('share/copy') &&
      transitionPlan.includes('No persistence behavior changes'),
    pageUsesShareCopyBuilder:
      page.includes('buildPublicResultShareCopyUx') &&
      page.includes('shareCopy.primaryActionLabel') &&
      page.includes('shareCopy.fallbackInstruction'),
    pageExposesShareCopyAvailability: page.includes('data-share-copy-ux={shareCopy.availability}'),
    pageRendersShareCopyPanelOnlyWhenAvailable:
      page.includes('shareCopy.canOfferCopyAction ?') && page.includes('data-share-copy-panel="available"'),
    copyLinkAffordanceTextClear:
      shareCopyModule.includes('Copy public result link') && shareCopyModule.includes('Share this public result'),
    manualCopyGuidanceExists:
      shareCopyModule.includes('Manual copy path') && shareCopyModule.includes('manually copy this page path'),
    unavailableStatesBlockCopyAction:
      shareCopyModule.includes('Copy action unavailable') && shareCopyModule.includes('canOfferCopyAction: false'),
    rawAnswersRemainBlocked:
      !page.includes('rawAnswers') && !page.includes('questionAnswers') && shareCopyModule.includes('rawAnswersExposed: false'),
    rawDeleteTokensRemainBlocked:
      !page.includes('deleteToken') && !page.includes('rawDeleteToken') && shareCopyModule.includes('rawDeleteTokenExposed: false'),
    noPersistenceChangeSignals: persistenceChangeSignals === 0,
    noDatabaseBindingChangeSignals: databaseBindingChangeSignals === 0,
    noNetworkSmokeChangeSignals: networkSmokeChangeSignals === 0,
    overallPassed: false
  };

  const { overallPassed: _unused, ...beforeOverall } = gates;
  const issues = [
    ...Object.entries(beforeOverall).filter(([, passed]) => !passed).map(([key]) => `failed_gate:${key}`),
    ...REQUIRED_SHARE_COPY_PHRASES.filter((phrase) => !shareCopyModule.includes(phrase)).map((phrase) => `missing_share_copy_phrase:${phrase}`),
    ...forbiddenPageSignals.map((signal) => `forbidden_page_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_SCHEMA_VERSION,
    gateId: PHASE_9_PUBLIC_RESULT_SHARE_COPY_UX_POLISH_ID,
    shareCopySchemaVersion: PUBLIC_RESULT_SHARE_COPY_UX_SCHEMA_VERSION,
    shareCopyPhase: PUBLIC_RESULT_SHARE_COPY_UX_PHASE,
    gates: finalGates,
    coverage: {
      requiredShareCopyPhraseCount: REQUIRED_SHARE_COPY_PHRASES.length,
      presentShareCopyPhraseCount,
      shareCopyRuleCount: summarizePublicResultShareCopyUxRules().length,
      forbiddenPageSignalCount: forbiddenPageSignals.length,
      persistenceChangeSignalCount: persistenceChangeSignals,
      databaseBindingChangeSignalCount: databaseBindingChangeSignals,
      networkSmokeChangeSignalCount: networkSmokeChangeSignals
    },
    docs: {
      status: PHASE9_STATUS_DOC_PATH,
      release: PHASE9_RELEASE_DOC_PATH,
      phase9Transition: PHASE9_TRANSITION_DOC_PATH,
      phase9CopyGateEvidence: PHASE9_COPY_GATE_EVIDENCE_PATH
    },
    issues
  };
}

export function writePhase9PublicResultShareCopyUxPolishEvidence(
  report: Phase9PublicResultShareCopyUxPolishReport,
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
