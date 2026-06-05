import type { ScoringResult } from '../scoring/buildResult';
import { AXIS_IDS } from '../methodology/axes';

export type ReportQualitySeverity = 'error' | 'warning';

export interface ReportQualityIssue {
  readonly severity: ReportQualitySeverity;
  readonly code: string;
  readonly message: string;
}

export interface ReportQualityResult {
  readonly passed: boolean;
  readonly issues: readonly ReportQualityIssue[];
  readonly errorCount: number;
  readonly warningCount: number;
}

const FORBIDDEN_AUTHORITY_WORDS = [
  'clinical',
  'diagnostic',
  'diagnosis',
  'disorder',
  'therapy',
  'pathology',
  'scientifically validated'
] as const;

const FORBIDDEN_GENERIC_PHRASES = [
  'you are special',
  'you are unique',
  'you are deep',
  'mysterious and complex',
  'different from everyone',
  'born to lead',
  'natural genius',
  'true self',
  'destined for greatness',
  'unlike most people'
] as const;

const FALLBACK_PHRASES = [
  'needs more evidence',
  'interpretation needs more evidence',
  'this axis is present, but its interpretation needs more evidence'
] as const;

export function evaluateReportQuality(result: ScoringResult): ReportQualityResult {
  const issues: ReportQualityIssue[] = [];
  const serialized = JSON.stringify({ report: result.report, reportSeed: result.reportSeed }).toLowerCase();
  const validEvidenceRefs = new Set(result.report.evidenceDigest.map((item) => item.ref));

  addIf(issues, result.report.evidenceDigest.length !== 20, 'error', 'evidence_digest_incomplete', 'Report evidence digest must contain one evidence reference per question.');
  addIf(issues, result.report.overview.dominantTraits.length !== 3, 'error', 'dominant_traits_count', 'Report overview must expose exactly three dominant traits.');
  addIf(issues, result.report.axisCards.length !== AXIS_IDS.length, 'error', 'axis_card_count', 'Report must contain one axis card for every locked axis.');
  addIf(issues, result.report.contradictionMap.length > 4, 'error', 'contradiction_cap_exceeded', 'Contradiction map must remain capped at four cards.');
  addIf(issues, result.report.strengths.length < 3, 'error', 'strengths_too_short', 'Report must include at least three concrete strengths.');
  addIf(issues, result.report.failureModes.length < 3, 'error', 'failure_modes_too_short', 'Report must include at least three failure modes.');
  addIf(issues, result.report.disprovenIf.length < 2, 'error', 'disproven_if_too_short', 'Report must include falsifier/disproven-if checks.');

  for (const forbidden of FORBIDDEN_AUTHORITY_WORDS) {
    addIf(issues, serialized.includes(forbidden), 'error', 'forbidden_authority_wording', `Report contains forbidden authority wording: ${forbidden}.`);
  }

  for (const phrase of FORBIDDEN_GENERIC_PHRASES) {
    addIf(issues, serialized.includes(phrase), 'error', 'generic_flattery_phrase', `Report contains generic/flattering phrase: ${phrase}.`);
  }

  for (const phrase of FALLBACK_PHRASES) {
    addIf(issues, serialized.includes(phrase), 'error', 'fallback_interpretation_leaked', `Report contains fallback interpretation text: ${phrase}.`);
  }

  for (const trait of result.report.overview.dominantTraits) {
    addIf(issues, trait.evidenceRefs.length === 0, 'error', 'trait_missing_evidence', `Dominant trait ${trait.tag} has no evidence references.`);
    assertEvidenceRefs(issues, trait.evidenceRefs, validEvidenceRefs, `dominant trait ${trait.tag}`);
  }

  for (const card of result.report.axisCards) {
    addIf(issues, card.interpretation.trim().length < 24, 'error', 'axis_interpretation_too_short', `Axis ${card.id} interpretation is too short.`);
    addIf(issues, card.evidenceRefs.length === 0, 'error', 'axis_missing_evidence', `Axis ${card.id} has no evidence references.`);
    assertEvidenceRefs(issues, card.evidenceRefs, validEvidenceRefs, `axis ${card.id}`);
  }

  for (const contradiction of result.report.contradictionMap) {
    addIf(issues, contradiction.evidenceRefs.length === 0, 'error', 'contradiction_missing_evidence', `Contradiction ${contradiction.id} has no evidence references.`);
    assertEvidenceRefs(issues, contradiction.evidenceRefs, validEvidenceRefs, `contradiction ${contradiction.id}`);
  }

  for (const [sectionName, bullets] of [
    ['strengths', result.report.strengths],
    ['failureModes', result.report.failureModes],
    ['growthDirections', result.report.growthDirections]
  ] as const) {
    for (const bullet of bullets) {
      addIf(issues, bullet.title.trim().length < 8, 'error', 'bullet_too_short', `${sectionName} bullet is too short.`);
      addIf(issues, bullet.evidenceRefs.length === 0, 'error', 'bullet_missing_evidence', `${sectionName} bullet has no evidence references.`);
      assertEvidenceRefs(issues, bullet.evidenceRefs, validEvidenceRefs, `${sectionName} bullet ${bullet.title}`);
    }
  }

  const axisIds = new Set(result.report.axisCards.map((card) => card.id));
  for (const axisId of AXIS_IDS) {
    addIf(issues, !axisIds.has(axisId), 'error', 'missing_axis_card', `Missing axis card: ${axisId}.`);
  }

  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

  return {
    passed: errorCount === 0,
    issues,
    errorCount,
    warningCount
  };
}

function assertEvidenceRefs(
  issues: ReportQualityIssue[],
  refs: readonly string[],
  validEvidenceRefs: ReadonlySet<string>,
  context: string
): void {
  for (const ref of refs) {
    addIf(issues, !/^Q\d{1,2}[ABCD]$/.test(ref), 'error', 'invalid_evidence_ref_format', `Invalid evidence reference format in ${context}: ${ref}.`);
    addIf(issues, !validEvidenceRefs.has(ref), 'error', 'unknown_evidence_ref', `Unknown evidence reference in ${context}: ${ref}.`);
  }
}

function addIf(
  target: ReportQualityIssue[],
  condition: boolean,
  severity: ReportQualitySeverity,
  code: string,
  message: string
): void {
  if (!condition) return;

  target.push({ severity, code, message });
}
