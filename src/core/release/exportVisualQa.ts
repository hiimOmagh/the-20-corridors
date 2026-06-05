import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { runCorridorsEngine } from '@/core';
import { buildLocalShareCardPreview, type LocalShareCardPreview } from '@/features/results/resultShareCard';
import {
  LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE,
  LOCAL_SHARE_IMAGE_EXPORT_HEIGHT,
  LOCAL_SHARE_IMAGE_EXPORT_WIDTH,
  buildLocalShareCardExportSvg,
  buildLocalShareImageFileName
} from '@/features/results/resultShareImageExport';
import { runLocalExportReadiness } from './localExportReadiness';

export const EXPORT_VISUAL_QA_SCHEMA_VERSION = 'phase-4.3-export-visual-qa-v1' as const;
export const EXPORT_VISUAL_QA_ID = 'phase-4-export-visual-qa-download-contract' as const;

export interface ExportVisualQaOptions {
  readonly repoRoot?: string;
}

export interface ExportVisualQaReport {
  readonly schemaVersion: typeof EXPORT_VISUAL_QA_SCHEMA_VERSION;
  readonly qaId: typeof EXPORT_VISUAL_QA_ID;
  readonly metadata: {
    readonly checkedAt: 'static';
    readonly repoRootName: string;
    readonly phaseScope: 'phase-4-local-export-visual-qa';
    readonly localExportReadinessSchemaVersion: string;
    readonly exportMode: 'local-share-card-image-export-visual-qa';
  };
  readonly gates: {
    readonly localExportReadinessPassed: boolean;
    readonly qaScriptExists: boolean;
    readonly validateScriptRunsExportVisualQa: boolean;
    readonly qaContractDocExists: boolean;
    readonly phase43StatusDocExists: boolean;
    readonly phase4ClosureCriteriaPrepared: boolean;
    readonly shareImageExportFileExists: boolean;
    readonly svgDimensionsCorrect: boolean;
    readonly svgViewBoxCorrect: boolean;
    readonly svgContainsRequiredLabels: boolean;
    readonly svgContainsBoundaryNote: boolean;
    readonly svgEscapesUnsafeText: boolean;
    readonly svgDoesNotExposeRawAnswers: boolean;
    readonly downloadFilenameContractStable: boolean;
    readonly localOnlyBehaviorPreserved: boolean;
    readonly noBackendAiAuthPaymentPersistenceScope: boolean;
    readonly overallPassed: boolean;
  };
  readonly docs: {
    readonly exportVisualQaContract: string;
    readonly phase43Status: string;
    readonly phase4ClosureCriteria: string;
  };
  readonly scripts: {
    readonly validate?: string;
    readonly exportVisualQa?: string;
  };
  readonly visual: {
    readonly width: number;
    readonly height: number;
    readonly viewBox: string;
    readonly requiredLabels: readonly string[];
    readonly missingLabels: readonly string[];
    readonly boundaryNote: string;
    readonly escapedUnsafeSamples: readonly string[];
  };
  readonly download: {
    readonly sampleTitle: string;
    readonly expectedFileName: string;
    readonly actualFileName: string;
    readonly stable: boolean;
  };
  readonly privacy: {
    readonly rawAnswerLeakageSignals: readonly string[];
    readonly blockedScopeSignals: readonly string[];
    readonly localOnlySignals: readonly string[];
  };
  readonly coverage: {
    readonly localExportReadinessIssueCount: number;
    readonly requiredLabelCount: number;
    readonly missingLabelCount: number;
    readonly rawLeakageIssueCount: number;
    readonly blockedScopeIssueCount: number;
    readonly localOnlySignalCount: number;
  };
  readonly issues: readonly string[];
}

interface PackageJsonSubset {
  readonly scripts?: Record<string, string>;
}

const EXPORT_VISUAL_QA_CONTRACT_DOC = 'docs/release/phase-4-export-visual-qa-download-contract.md';
const PHASE_4_3_STATUS_DOC = 'docs/ui/phase-4-3-export-visual-qa-download-contract-status.md';
const PHASE_4_CLOSURE_CRITERIA_DOC = 'docs/release/phase-4-closure-criteria.md';
const SHARE_IMAGE_EXPORT_FILE = 'src/features/results/resultShareImageExport.ts';

const REQUIRED_SVG_LABELS = [
  'The 20 Corridors',
  'Corridor signature',
  'Dominant traits',
  'Main tension',
  'Consistency',
  'Motive',
  LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE
] as const;

const RAW_ANSWER_SIGNALS = [
  'result.answers',
  '.answers.map',
  'answerText',
  'questionId',
  'selectedAnswer',
  'raw answer',
  'raw-answer'
] as const;

const BLOCKED_SCOPE_SIGNALS = [
  'fetch(',
  'XMLHttpRequest',
  'navigator.sendBeacon',
  'posthog.capture',
  'analytics.track',
  '@supabase',
  'new PrismaClient',
  'OpenAI(',
  'generateText(',
  'streamText(',
  '@stripe',
  'stripe.checkout',
  'localStorage.setItem',
  'indexedDB.open'
] as const;

const LOCAL_ONLY_SIGNALS = [
  'document.createElement(\'canvas\')',
  'canvas.toBlob',
  'new Blob([svg]',
  'window.URL.createObjectURL',
  'anchor.download',
  'window.URL.revokeObjectURL',
  'Local PNG export only'
] as const;

export function runExportVisualQa(options: ExportVisualQaOptions = {}): ExportVisualQaReport {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packageJson = readPackageJson(repoRoot);
  const localExportReadiness = runLocalExportReadiness({ repoRoot });
  const exportSource = readOptionalFile(repoRoot, SHARE_IMAGE_EXPORT_FILE);
  const qaContractDocExists = existsSync(path.join(repoRoot, EXPORT_VISUAL_QA_CONTRACT_DOC));
  const phase43StatusDocExists = existsSync(path.join(repoRoot, PHASE_4_3_STATUS_DOC));
  const phase4ClosureCriteriaPrepared = existsSync(path.join(repoRoot, PHASE_4_CLOSURE_CRITERIA_DOC));
  const shareImageExportFileExists = existsSync(path.join(repoRoot, SHARE_IMAGE_EXPORT_FILE));
  const qaScriptExists = packageJson.scripts?.['qa:export-visual'] === 'tsx scripts/export-visual-qa.ts';
  const validateScriptRunsExportVisualQa = Boolean(packageJson.scripts?.validate?.includes('npm run qa:export-visual'));

  const card = buildLocalShareCardPreview(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'));
  const svg = buildLocalShareCardExportSvg(card);
  const unsafeSvg = buildLocalShareCardExportSvg(buildUnsafeCard(card));
  const missingLabels = REQUIRED_SVG_LABELS.filter((label) => !svg.includes(label));
  const rawAnswerLeakageSignals = findSignals(exportSource, RAW_ANSWER_SIGNALS);
  const blockedScopeSignals = findSignals(exportSource, BLOCKED_SCOPE_SIGNALS);
  const localOnlySignals = findSignals(exportSource, LOCAL_ONLY_SIGNALS);
  const actualFileName = buildLocalShareImageFileName(card);
  const expectedFileName = 'the-20-corridors-the-observer-strategist.png';

  const gates = {
    localExportReadinessPassed: localExportReadiness.gates.overallPassed,
    qaScriptExists,
    validateScriptRunsExportVisualQa,
    qaContractDocExists,
    phase43StatusDocExists,
    phase4ClosureCriteriaPrepared,
    shareImageExportFileExists,
    svgDimensionsCorrect: svg.includes(`width="${LOCAL_SHARE_IMAGE_EXPORT_WIDTH}"`) && svg.includes(`height="${LOCAL_SHARE_IMAGE_EXPORT_HEIGHT}"`),
    svgViewBoxCorrect: svg.includes(`viewBox="0 0 ${LOCAL_SHARE_IMAGE_EXPORT_WIDTH} ${LOCAL_SHARE_IMAGE_EXPORT_HEIGHT}"`),
    svgContainsRequiredLabels: missingLabels.length === 0,
    svgContainsBoundaryNote: svg.includes(LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE),
    svgEscapesUnsafeText: unsafeSvg.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;') && unsafeSvg.includes('A &amp; B &lt; C &gt; D') && !unsafeSvg.includes('<script>'),
    svgDoesNotExposeRawAnswers: rawAnswerLeakageSignals.length === 0 && !svg.match(/result\.answers|answerText|questionId|selectedAnswer/i),
    downloadFilenameContractStable: actualFileName === expectedFileName,
    localOnlyBehaviorPreserved: localOnlySignals.length >= 6,
    noBackendAiAuthPaymentPersistenceScope: blockedScopeSignals.length === 0,
    overallPassed: false
  };

  const overallPassed = Object.entries(gates)
    .filter(([key]) => key !== 'overallPassed')
    .every(([, value]) => value === true);
  const completeGates = { ...gates, overallPassed };

  return {
    schemaVersion: EXPORT_VISUAL_QA_SCHEMA_VERSION,
    qaId: EXPORT_VISUAL_QA_ID,
    metadata: {
      checkedAt: 'static',
      repoRootName: 'repository',
      phaseScope: 'phase-4-local-export-visual-qa',
      localExportReadinessSchemaVersion: localExportReadiness.schemaVersion,
      exportMode: 'local-share-card-image-export-visual-qa'
    },
    gates: completeGates,
    docs: {
      exportVisualQaContract: EXPORT_VISUAL_QA_CONTRACT_DOC,
      phase43Status: PHASE_4_3_STATUS_DOC,
      phase4ClosureCriteria: PHASE_4_CLOSURE_CRITERIA_DOC
    },
    scripts: buildScriptSummary(packageJson),
    visual: {
      width: LOCAL_SHARE_IMAGE_EXPORT_WIDTH,
      height: LOCAL_SHARE_IMAGE_EXPORT_HEIGHT,
      viewBox: `0 0 ${LOCAL_SHARE_IMAGE_EXPORT_WIDTH} ${LOCAL_SHARE_IMAGE_EXPORT_HEIGHT}`,
      requiredLabels: REQUIRED_SVG_LABELS,
      missingLabels,
      boundaryNote: LOCAL_SHARE_IMAGE_EXPORT_BOUNDARY_NOTE,
      escapedUnsafeSamples: ['&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;', 'A &amp; B &lt; C &gt; D']
    },
    download: {
      sampleTitle: card.title,
      expectedFileName,
      actualFileName,
      stable: actualFileName === expectedFileName
    },
    privacy: {
      rawAnswerLeakageSignals,
      blockedScopeSignals,
      localOnlySignals
    },
    coverage: {
      localExportReadinessIssueCount: localExportReadiness.issues.length,
      requiredLabelCount: REQUIRED_SVG_LABELS.length,
      missingLabelCount: missingLabels.length,
      rawLeakageIssueCount: rawAnswerLeakageSignals.length,
      blockedScopeIssueCount: blockedScopeSignals.length,
      localOnlySignalCount: localOnlySignals.length
    },
    issues: buildIssues(completeGates, localExportReadiness.issues, {
      missingLabels,
      rawAnswerLeakageSignals,
      blockedScopeSignals
    })
  };
}

function buildUnsafeCard(card: LocalShareCardPreview): LocalShareCardPreview {
  return {
    ...card,
    title: '<script>alert("x")</script>',
    pattern: 'A & B < C > D',
    signature: 'Unsafe <signature> & cue',
    traitLine: 'Trait <one> & trait two',
    mainTension: 'Tension <x> & y'
  };
}

function buildIssues(
  gates: ExportVisualQaReport['gates'],
  localExportReadinessIssues: readonly string[],
  signals: Readonly<{
    missingLabels: readonly string[];
    rawAnswerLeakageSignals: readonly string[];
    blockedScopeSignals: readonly string[];
  }>
): string[] {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(gates)) {
    if (key !== 'overallPassed' && value !== true) {
      issues.push(`export_visual_qa_gate_failed:${key}`);
    }
  }

  for (const issue of localExportReadinessIssues) {
    issues.push(`export_visual_qa_local_export_readiness_issue:${issue}`);
  }

  for (const label of signals.missingLabels) {
    issues.push(`export_visual_qa_missing_label:${label}`);
  }

  for (const signal of signals.rawAnswerLeakageSignals) {
    issues.push(`export_visual_qa_raw_answer_leakage:${signal}`);
  }

  for (const signal of signals.blockedScopeSignals) {
    issues.push(`export_visual_qa_blocked_scope:${signal}`);
  }

  return issues;
}

function buildScriptSummary(packageJson: PackageJsonSubset): ExportVisualQaReport['scripts'] {
  const scripts: { validate?: string; exportVisualQa?: string } = {};
  const validate = packageJson.scripts?.validate;
  const exportVisualQa = packageJson.scripts?.['qa:export-visual'];

  if (validate !== undefined) scripts.validate = validate;
  if (exportVisualQa !== undefined) scripts.exportVisualQa = exportVisualQa;

  return scripts;
}

function findSignals(source: string, signals: readonly string[]): string[] {
  const lowerSource = source.toLowerCase();
  return signals.filter((signal) => lowerSource.includes(signal.toLowerCase())).sort();
}

function readOptionalFile(repoRoot: string, relativeFile: string): string {
  const absolutePath = path.join(repoRoot, relativeFile);
  if (!existsSync(absolutePath)) return '';
  return readFileSync(absolutePath, 'utf8');
}

function readPackageJson(repoRoot: string): PackageJsonSubset {
  const packageJsonPath = path.join(repoRoot, 'package.json');

  if (!existsSync(packageJsonPath)) return {};
  const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;

  if (!isRecord(parsed) || !isRecordOfStrings(parsed.scripts)) return {};
  return { scripts: parsed.scripts };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === 'string');
}
