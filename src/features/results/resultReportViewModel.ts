import type {
  CorridorsAxisCardDto,
  CorridorsContradictionCardDto,
  CorridorsEvidenceReferenceDto,
  CorridorsPublicResultDto,
  CorridorsReportBulletDto
} from '@/core';

export interface EvidenceDisplayItem {
  readonly ref: string;
  readonly questionLabel: string;
  readonly option: string;
  readonly answerText: string;
}

export interface ReportEvidenceLookup {
  readonly byRef: ReadonlyMap<string, EvidenceDisplayItem>;
  readonly all: readonly EvidenceDisplayItem[];
}

export interface ResultReportViewModel {
  readonly headlineMetrics: readonly ReportMetric[];
  readonly dominantTraits: readonly TraitDisplayItem[];
  readonly axisCards: readonly AxisDisplayItem[];
  readonly contradictionCards: readonly ContradictionDisplayItem[];
  readonly strengths: readonly BulletDisplayItem[];
  readonly failureModes: readonly BulletDisplayItem[];
  readonly growthDirections: readonly BulletDisplayItem[];
  readonly disprovenIf: readonly string[];
  readonly evidence: ReportEvidenceLookup;
  readonly shareSummary: string;
}

export interface ReportMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export interface TraitDisplayItem {
  readonly code: string;
  readonly label: string;
  readonly evidence: readonly EvidenceDisplayItem[];
}

export interface AxisDisplayItem extends CorridorsAxisCardDto {
  readonly evidence: readonly EvidenceDisplayItem[];
}

export interface ContradictionDisplayItem extends CorridorsContradictionCardDto {
  readonly evidence: readonly EvidenceDisplayItem[];
}

export interface BulletDisplayItem extends CorridorsReportBulletDto {
  readonly evidence: readonly EvidenceDisplayItem[];
}

export function buildResultReportViewModel(result: CorridorsPublicResultDto): ResultReportViewModel {
  const evidence = buildEvidenceLookup(result.report.evidenceDigest);

  return {
    headlineMetrics: buildHeadlineMetrics(result),
    dominantTraits: result.report.overview.dominantTraits.map((trait) => ({
      ...trait,
      evidence: resolveEvidenceRefs(evidence, trait.evidenceRefs)
    })),
    axisCards: result.report.axisCards.map((axisCard) => ({
      ...axisCard,
      evidence: resolveEvidenceRefs(evidence, axisCard.evidenceRefs)
    })),
    contradictionCards: result.report.contradictionMap.map((contradictionCard) => ({
      ...contradictionCard,
      evidence: resolveEvidenceRefs(evidence, contradictionCard.evidenceRefs)
    })),
    strengths: result.report.strengths.map((bullet) => buildBulletDisplayItem(evidence, bullet)),
    failureModes: result.report.failureModes.map((bullet) => buildBulletDisplayItem(evidence, bullet)),
    growthDirections: result.report.growthDirections.map((bullet) => buildBulletDisplayItem(evidence, bullet)),
    disprovenIf: result.report.disprovenIf,
    evidence,
    shareSummary: buildShareSummary(result)
  };
}

export function buildEvidenceLookup(
  evidenceDigest: readonly CorridorsEvidenceReferenceDto[]
): ReportEvidenceLookup {
  const items = evidenceDigest.map((item) => ({
    ref: item.ref,
    questionLabel: `Q${item.questionId}`,
    option: item.option,
    answerText: item.answerText
  }));

  return {
    byRef: new Map(items.map((item) => [item.ref, item] as const)),
    all: items
  };
}

export function resolveEvidenceRefs(
  evidence: ReportEvidenceLookup,
  refs: readonly string[]
): readonly EvidenceDisplayItem[] {
  return refs.map((ref) => evidence.byRef.get(ref)).filter((item): item is EvidenceDisplayItem => item !== undefined);
}

export function formatEvidenceSummary(items: readonly EvidenceDisplayItem[]): string {
  if (items.length === 0) {
    return 'No direct evidence reference was attached.';
  }

  return items.map((item) => `${item.ref}: ${item.answerText}`).join(' · ');
}

function buildBulletDisplayItem(
  evidence: ReportEvidenceLookup,
  bullet: CorridorsReportBulletDto
): BulletDisplayItem {
  return {
    ...bullet,
    evidence: resolveEvidenceRefs(evidence, bullet.evidenceRefs)
  };
}

function buildHeadlineMetrics(result: CorridorsPublicResultDto): readonly ReportMetric[] {
  return [
    {
      label: 'Confidence',
      value: formatBand(result.report.overview.confidenceBand),
      detail: result.report.overview.confidenceExplanation
    },
    {
      label: 'Deep motive',
      value: result.deepMotive.label,
      detail: `${formatBand(result.deepMotive.band)} signal · ${result.deepMotive.key}`
    },
    {
      label: 'Primary axis',
      value: result.report.overview.primaryAxis,
      detail: 'Strongest axis reading from the deterministic engine.'
    },
    {
      label: 'Runner-up',
      value: result.runnerUp.title,
      detail: `${result.runnerUp.gapBand} archetype gap`
    }
  ];
}

function buildShareSummary(result: CorridorsPublicResultDto): string {
  const contradiction = result.report.overview.mainContradiction ?? 'No dominant contradiction';
  const traits = result.dominantTraits.slice(0, 3).map((trait) => trait.label).join(', ');

  return [
    'The 20 Corridors',
    `Result: ${result.archetype.title}`,
    `Pattern: ${result.report.overview.patternSummary}`,
    `Dominant traits: ${traits}`,
    `Main contradiction: ${contradiction}`
  ].join('\n');
}

function formatBand(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}
