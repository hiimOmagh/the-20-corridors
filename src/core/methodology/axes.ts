import type { Tag } from './tags';

export const AXIS_IDS = [
  'explorationSafety',
  'thinkingStyle',
  'relationshipPattern',
  'agencyControl',
  'ambiguityFear',
  'deepMotive'
] as const;

export type AxisId = (typeof AXIS_IDS)[number];

export type AxisBand = 'low' | 'moderate' | 'high' | 'dominant';

export interface AxisScore {
  readonly id: AxisId;
  readonly label: string;
  readonly band: AxisBand;
  readonly dominant: string;
  readonly evidenceTags: readonly Tag[];
  readonly rawScores: Record<string, number>;
}

export const AXIS_LABELS: Record<AxisId, string> = {
  explorationSafety: 'Exploration vs Safety-Control',
  thinkingStyle: 'Thinking Style',
  relationshipPattern: 'Relationship and Distance Pattern',
  agencyControl: 'Agency, Leadership, and Control',
  ambiguityFear: 'Ambiguity and Fear Response',
  deepMotive: 'Deep Motive Structure'
};
