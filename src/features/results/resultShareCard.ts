import type { CorridorsPublicResultDto } from '@/core';

export interface LocalShareCardPreview {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly pattern: string;
  readonly traits: readonly LocalShareCardTrait[];
  readonly mainTension: string;
  readonly confidence: string;
  readonly deepMotive: string;
  readonly footer: string;
  readonly copyText: string;
}

export interface LocalShareCardTrait {
  readonly code: string;
  readonly label: string;
}

export function buildLocalShareCardPreview(result: CorridorsPublicResultDto): LocalShareCardPreview {
  const traits = result.dominantTraits.slice(0, 3).map((trait) => ({
    code: trait.code,
    label: trait.label
  }));
  const mainTension = result.report.overview.mainContradiction ?? 'No dominant contradiction';
  const confidence = formatDisplayText(result.report.overview.confidenceBand);
  const deepMotive = result.deepMotive.label;

  return {
    eyebrow: 'The 20 Corridors',
    title: result.archetype.title,
    subtitle: 'Symbolic decision-pattern result',
    pattern: result.report.overview.patternSummary,
    traits,
    mainTension,
    confidence,
    deepMotive,
    footer: 'Reflective game · deterministic local result · not a diagnosis',
    copyText: buildLocalShareCardCopyText({
      title: result.archetype.title,
      pattern: result.report.overview.patternSummary,
      traits,
      mainTension,
      confidence,
      deepMotive
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
}>): string {
  const traitLine = input.traits.length > 0
    ? input.traits.map((trait) => `${trait.label} (${trait.code})`).join(', ')
    : 'No dominant trait signal';

  return [
    'The 20 Corridors',
    `Result: ${input.title}`,
    `Pattern: ${input.pattern}`,
    `Traits: ${traitLine}`,
    `Main tension: ${input.mainTension}`,
    `Deep motive: ${input.deepMotive}`,
    `Confidence: ${input.confidence}`,
    'Note: reflective game, not a diagnosis.'
  ].join('\n');
}

export function formatDisplayText(value: string): string {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}
