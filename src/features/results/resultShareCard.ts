import type { CorridorsPublicResultDto } from '@/core';

export const SHARE_CARD_COPY_BOUNDARY_NOTE = 'Reflective game, deterministic local result, not a diagnosis.' as const;

export interface LocalShareCardPreview {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly pattern: string;
  readonly signature: string;
  readonly traits: readonly LocalShareCardTrait[];
  readonly traitLine: string;
  readonly mainTension: string;
  readonly confidence: string;
  readonly deepMotive: string;
  readonly metrics: readonly LocalShareCardMetric[];
  readonly visualCues: readonly LocalShareCardVisualCue[];
  readonly ariaLabel: string;
  readonly footer: string;
  readonly copyText: string;
}

export interface LocalShareCardTrait {
  readonly code: string;
  readonly label: string;
}

export interface LocalShareCardMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

export interface LocalShareCardVisualCue {
  readonly label: string;
  readonly value: string;
}

export function buildLocalShareCardPreview(result: CorridorsPublicResultDto): LocalShareCardPreview {
  const traits = result.dominantTraits.slice(0, 3).map((trait) => ({
    code: trait.code,
    label: trait.label
  }));
  const mainTension = result.report.overview.mainContradiction ?? 'No dominant contradiction';
  const confidence = formatDisplayText(result.report.overview.confidenceBand);
  const deepMotive = result.deepMotive.label;
  const traitLine = buildShareCardTraitLine(traits);
  const signature = buildShareCardSignature({
    title: result.archetype.title,
    confidence,
    deepMotive
  });
  const metrics = buildShareCardMetrics({ confidence, deepMotive, mainTension });
  const visualCues = buildShareCardVisualCues(result);
  const title = result.archetype.title;

  return {
    eyebrow: 'The 20 Corridors',
    title,
    subtitle: 'Symbolic decision-pattern result',
    pattern: result.report.overview.patternSummary,
    signature,
    traits,
    traitLine,
    mainTension,
    confidence,
    deepMotive,
    metrics,
    visualCues,
    ariaLabel: `Local share card preview for ${title}`,
    footer: SHARE_CARD_COPY_BOUNDARY_NOTE,
    copyText: buildLocalShareCardCopyText({
      title,
      pattern: result.report.overview.patternSummary,
      traits,
      mainTension,
      confidence,
      deepMotive,
      signature
    })
  };
}

export function buildLocalShareCardCopyText(input: Readonly<{
  title: string;
  pattern: string;
  traits: readonly LocalShareCardTrait[];
  mainTension: string;
  confidence: string;
  deepMotive: string;
  signature?: string;
}>): string {
  const traitLine = buildShareCardTraitLine(input.traits);
  const signature = input.signature ?? buildShareCardSignature({
    title: input.title,
    confidence: input.confidence,
    deepMotive: input.deepMotive
  });

  return [
    'The 20 Corridors',
    `Result: ${input.title}`,
    `Signature: ${signature}`,
    `Pattern: ${input.pattern}`,
    `Traits: ${traitLine}`,
    `Main tension: ${input.mainTension}`,
    `Deep motive: ${input.deepMotive}`,
    `Confidence: ${input.confidence}`,
    `Note: ${SHARE_CARD_COPY_BOUNDARY_NOTE}`
  ].join('\n');
}

export function buildShareCardTraitLine(traits: readonly LocalShareCardTrait[]): string {
  return traits.length > 0
    ? traits.map((trait) => `${trait.label} (${trait.code})`).join(' · ')
    : 'No dominant trait signal';
}

export function buildShareCardSignature(input: Readonly<{
  title: string;
  confidence: string;
  deepMotive: string;
}>): string {
  return [input.title, input.deepMotive, input.confidence].filter(Boolean).join(' · ');
}

export function buildShareCardMetrics(input: Readonly<{
  confidence: string;
  deepMotive: string;
  mainTension: string;
}>): readonly LocalShareCardMetric[] {
  return [
    {
      label: 'Consistency',
      value: input.confidence,
      detail: 'answer-pattern confidence'
    },
    {
      label: 'Motive',
      value: input.deepMotive,
      detail: 'weighted deep signal'
    },
    {
      label: 'Tension',
      value: input.mainTension,
      detail: 'contradiction layer'
    }
  ] as const;
}

export function buildShareCardVisualCues(result: CorridorsPublicResultDto): readonly LocalShareCardVisualCue[] {
  return [
    {
      label: 'Archetype',
      value: result.archetype.title
    },
    {
      label: 'Traits',
      value: result.dominantTraits.slice(0, 3).map((trait) => trait.code).join(' / ')
    },
    {
      label: 'Evidence refs',
      value: `${result.report.evidenceDigest.length} local refs`
    }
  ] as const;
}

export function formatDisplayText(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}
