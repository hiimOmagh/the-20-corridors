import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION,
  summarizePublicResultLookupPageCopyRules
} from '../public-link/publicResultLookupPageCopy';

export const PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_SCHEMA_VERSION =
  'phase-9.0-public-result-page-ux-copy-polish-gate-v1' as const;
export const PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_ID =
  'phase-9.0-public-result-page-ux-copy-polish' as const;

const PACKAGE_JSON_PATH = 'package.json';
const PAGE_PATH = 'src/app/r/(public)/[publicId]/page.tsx';
const COPY_MODULE_PATH = 'src/core/public-link/publicResultLookupPageCopy.ts';
const GATE_SCRIPT_PATH = 'scripts/phase9-public-result-page-ux-copy-polish.ts';
const GATE_MODULE_PATH = 'src/core/release/phase9PublicResultPageUxCopyPolish.ts';
const GATE_TEST_PATH = 'tests/core/phase9PublicResultPageUxCopyPolish.test.ts';
const COPY_TEST_PATH = 'tests/core/publicResultLookupPageCopy.test.ts';
const PHASE8_CLOSURE_EVIDENCE_PATH = 'docs/evidence/phase8-public-lookup-release-closure-latest.json';
const PHASE9_STATUS_DOC_PATH = 'docs/ui/phase-9-0-public-result-page-ux-copy-polish-status.md';
const PHASE9_RELEASE_DOC_PATH = 'docs/release/phase-9-public-result-page-ux-copy-polish.md';
const PHASE9_TRANSITION_DOC_PATH = 'docs/ui/phase-9-transition-plan.md';

const REQUIRED_COPY_PHRASES = [
  'limited public summary',
  'Public result not found',
  'This public result was deleted',
  'This public result expired',
  'Public result lookup is paused',
  'Public result lookup is not configured',
  'Public result temporarily unavailable',
  'No private answer data is exposed',
  'Rollback mode prevents public lookup rendering'
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

export interface Phase9PublicResultPageUxCopyPolishReport {
  readonly schemaVersion: typeof PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_SCHEMA_VERSION;
  readonly gateId: typeof PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_ID;
  readonly copySchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION;
  readonly copyPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE;
  readonly gates: {
    readonly gateScriptExists: boolean;
    readonly gateModuleExists: boolean;
    readonly copyModuleExists: boolean;
    readonly pageRouteExists: boolean;
    readonly copyTestsExist: boolean;
    readonly gateTestsExist: boolean;
    readonly packageScriptExists: boolean;
    readonly validateRunsPhase9CopyGate: boolean;
    readonly phase8ClosureEvidenceCurrent: boolean;
    readonly phase9StatusDocExists: boolean;
    readonly phase9ReleaseDocExists: boolean;
    readonly phase9TransitionPlanUpdated: boolean;
    readonly pageUsesCopyBuilder: boolean;
    readonly pageExposesCopyToneAttribute: boolean;
    readonly renderableCopyPolished: boolean;
    readonly notFoundCopyPolished: boolean;
    readonly deletedCopyPolished: boolean;
    readonly expiredCopyPolished: boolean;
    readonly disabledRollbackCopyPolished: boolean;
    readonly configurationCopyPolished: boolean;
    readonly storageUnavailableCopyPolished: boolean;
    readonly rawAnswersRemainBlocked: boolean;
    readonly rawDeleteTokensRemainBlocked: boolean;
    readonly noPersistenceChangeSignals: boolean;
    readonly noNetworkSmokeChangeSignals: boolean;
    readonly overallPassed: boolean;
  };
  readonly coverage: {
    readonly requiredCopyPhraseCount: number;
    readonly presentCopyPhraseCount: number;
    readonly copyRuleCount: number;
    readonly forbiddenPageSignalCount: number;
    readonly persistenceChangeSignalCount: number;
    readonly networkSmokeChangeSignalCount: number;
  };
  readonly docs: {
    readonly status: string;
    readonly release: string;
    readonly phase9Transition: string;
    readonly phase8ClosureEvidence: string;
  };
  readonly issues: readonly string[];
}

export function runPhase9PublicResultPageUxCopyPolishGate(repoRoot = process.cwd()): Phase9PublicResultPageUxCopyPolishReport {
  const root = path.resolve(repoRoot);
  const packageJson = readJson<PackageJsonShape>(root, PACKAGE_JSON_PATH) ?? { scripts: {} };
  const page = readOptionalFile(root, PAGE_PATH);
  const copyModule = readOptionalFile(root, COPY_MODULE_PATH);
  const phase8ClosureEvidence = readJson<Record<string, unknown>>(root, PHASE8_CLOSURE_EVIDENCE_PATH);
  const transitionPlan = readOptionalFile(root, PHASE9_TRANSITION_DOC_PATH);

  const presentCopyPhraseCount = REQUIRED_COPY_PHRASES.filter((phrase) => copyModule.includes(phrase)).length;
  const forbiddenPageSignals = FORBIDDEN_PAGE_TOKENS.filter((token) => page.includes(token));
  const persistenceChangeSignals = [
    copyModule.includes('createPublicResultApiRouteDatabaseBindingStorageAdapter'),
    copyModule.includes('@neondatabase/serverless'),
    copyModule.includes('executeQuery('),
    copyModule.includes('adapter.read(')
  ].filter(Boolean).length;
  const networkSmokeChangeSignals = [
    copyModule.includes('networkLookupSmokeExecuted: true'),
    page.includes('networkLookupSmokeExecuted'),
    copyModule.includes('fetch(')
  ].filter(Boolean).length;

  const gates = {
    gateScriptExists: existsSync(path.join(root, GATE_SCRIPT_PATH)),
    gateModuleExists: existsSync(path.join(root, GATE_MODULE_PATH)),
    copyModuleExists: existsSync(path.join(root, COPY_MODULE_PATH)),
    pageRouteExists: existsSync(path.join(root, PAGE_PATH)),
    copyTestsExist: existsSync(path.join(root, COPY_TEST_PATH)),
    gateTestsExist: existsSync(path.join(root, GATE_TEST_PATH)),
    packageScriptExists: packageJson.scripts?.['gate:phase9-public-result-page-copy'] === 'tsx scripts/phase9-public-result-page-ux-copy-polish.ts',
    validateRunsPhase9CopyGate: (packageJson.scripts?.validate ?? '').includes('npm run gate:phase9-public-result-page-copy'),
    phase8ClosureEvidenceCurrent: phase8ClosureEvidence !== null && readOverallPassed(phase8ClosureEvidence),
    phase9StatusDocExists: existsSync(path.join(root, PHASE9_STATUS_DOC_PATH)),
    phase9ReleaseDocExists: existsSync(path.join(root, PHASE9_RELEASE_DOC_PATH)),
    phase9TransitionPlanUpdated: transitionPlan.includes('Phase 9.0') && transitionPlan.includes('copy') && transitionPlan.includes('Phase 8 closure remains green'),
    pageUsesCopyBuilder: page.includes('buildPublicResultLookupPageCopy') && page.includes('copy.title') && page.includes('copy.recovery'),
    pageExposesCopyToneAttribute: page.includes('data-copy-tone={copy.tone}'),
    renderableCopyPolished: copyModule.includes('limited public summary') && copyModule.includes('conversation artifact'),
    notFoundCopyPolished: copyModule.includes('Public result not found') && copyModule.includes('No public result matches this link'),
    deletedCopyPolished: copyModule.includes('This public result was deleted') && copyModule.includes('intentionally unavailable'),
    expiredCopyPolished: copyModule.includes('This public result expired') && copyModule.includes('Expiry limits'),
    disabledRollbackCopyPolished: copyModule.includes('Public result lookup is paused') && copyModule.includes('Rollback mode prevents public lookup rendering'),
    configurationCopyPolished: copyModule.includes('Public result lookup is not configured') && copyModule.includes('failed closed'),
    storageUnavailableCopyPolished: copyModule.includes('Public result temporarily unavailable') && copyModule.includes('does not confirm data loss'),
    rawAnswersRemainBlocked: !page.includes('rawAnswers') && !page.includes('questionAnswers') && copyModule.includes('rawAnswersExposed: false'),
    rawDeleteTokensRemainBlocked: !page.includes('deleteToken') && !page.includes('rawDeleteToken') && copyModule.includes('rawDeleteTokenExposed: false'),
    noPersistenceChangeSignals: persistenceChangeSignals === 0,
    noNetworkSmokeChangeSignals: networkSmokeChangeSignals === 0,
    overallPassed: false
  };

  const { overallPassed: _unused, ...beforeOverall } = gates;
  const issues = [
    ...Object.entries(beforeOverall).filter(([, passed]) => !passed).map(([key]) => `failed_gate:${key}`),
    ...REQUIRED_COPY_PHRASES.filter((phrase) => !copyModule.includes(phrase)).map((phrase) => `missing_copy_phrase:${phrase}`),
    ...forbiddenPageSignals.map((signal) => `forbidden_page_signal:${signal}`)
  ];
  const finalGates = { ...gates, overallPassed: issues.length === 0 };

  return {
    schemaVersion: PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_SCHEMA_VERSION,
    gateId: PHASE_9_PUBLIC_RESULT_PAGE_UX_COPY_POLISH_ID,
    copySchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_COPY_SCHEMA_VERSION,
    copyPhase: PUBLIC_RESULT_LOOKUP_PAGE_COPY_PHASE,
    gates: finalGates,
    coverage: {
      requiredCopyPhraseCount: REQUIRED_COPY_PHRASES.length,
      presentCopyPhraseCount,
      copyRuleCount: summarizePublicResultLookupPageCopyRules().length,
      forbiddenPageSignalCount: forbiddenPageSignals.length,
      persistenceChangeSignalCount: persistenceChangeSignals,
      networkSmokeChangeSignalCount: networkSmokeChangeSignals
    },
    docs: {
      status: PHASE9_STATUS_DOC_PATH,
      release: PHASE9_RELEASE_DOC_PATH,
      phase9Transition: PHASE9_TRANSITION_DOC_PATH,
      phase8ClosureEvidence: PHASE8_CLOSURE_EVIDENCE_PATH
    },
    issues
  };
}

export function writePhase9PublicResultPageUxCopyPolishEvidence(
  report: Phase9PublicResultPageUxCopyPolishReport,
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
