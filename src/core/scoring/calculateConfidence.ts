import type { ArchetypeResolution } from './resolveArchetype';
import type { DetectedContradiction } from './detectContradictions';
import type { TagScoreMap } from '../methodology/tags';

export type ConfidenceBand = 'low' | 'moderate' | 'high';

export function calculateConfidence(
  tagScores: TagScoreMap,
  archetype: ArchetypeResolution,
  contradictions: readonly DetectedContradiction[]
): ConfidenceBand {
  const topGap = archetype.score - archetype.runnerUp.score;
  const dominantTagCount = Object.values(tagScores).filter((score) => score >= 5).length;

  if (topGap >= 5 && dominantTagCount >= 3 && contradictions.length <= 3) {
    return 'high';
  }

  if (topGap < 2 || dominantTagCount < 2 || contradictions.length >= 4) {
    return 'low';
  }

  return 'moderate';
}
