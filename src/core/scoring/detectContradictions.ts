import { CONTRADICTIONS, type ContradictionDefinition, type ContradictionId } from '../methodology/contradictions';
import type { TagScoreMap } from '../methodology/tags';

export interface DetectedContradiction {
  readonly id: ContradictionId;
  readonly definition: ContradictionDefinition;
  readonly evidenceScore: number;
}

export function detectContradictions(tagScores: TagScoreMap): readonly DetectedContradiction[] {
  const detected: DetectedContradiction[] = [];

  addIf(detected, 'controlled_explorer', tagScores.EXP >= 3 && tagScores.SAF + tagScores.CTRL + tagScores.OBS >= 10, tagScores.EXP + tagScores.SAF + tagScores.CTRL + tagScores.OBS);
  addIf(detected, 'solitary_leader', tagScores.LEAD + tagScores.CTRL >= 7 && tagScores.IND >= 2 && tagScores.SOC < 4, tagScores.LEAD + tagScores.CTRL + tagScores.IND);
  addIf(detected, 'social_watcher', tagScores.SOC >= 5 && tagScores.OBS + tagScores.ANA >= 4, tagScores.SOC + tagScores.OBS + tagScores.ANA);
  addIf(detected, 'knowledge_without_action', tagScores.MEAN + tagScores.ANA >= 10 && tagScores.ACT + tagScores.RISK < 7, tagScores.MEAN + tagScores.ANA - (tagScores.ACT + tagScores.RISK) * 0.25);
  addIf(detected, 'power_without_exposure', tagScores.CTRL + tagScores.LEAD + tagScores.REC >= 10 && tagScores.AVD + tagScores.SAF >= 6 && tagScores.RISK < 4, tagScores.CTRL + tagScores.LEAD + tagScores.REC + tagScores.AVD + tagScores.SAF);
  addIf(detected, 'calm_avoider', tagScores.CALM >= 3 && tagScores.AVD >= 2 && tagScores.ACT < 4, tagScores.CALM + tagScores.AVD - tagScores.ACT * 0.2);
  addIf(detected, 'recognition_vs_independence', tagScores.REC >= 1.5 && tagScores.IND >= 2, tagScores.REC + tagScores.IND);
  addIf(detected, 'responsible_avoider', tagScores.RESP >= 3 && tagScores.AVD + tagScores.SAF >= 6 && tagScores.RISK < 4, tagScores.RESP + tagScores.AVD + tagScores.SAF);

  return detected.sort((left, right) => right.evidenceScore - left.evidenceScore).slice(0, 4);
}

function addIf(
  target: DetectedContradiction[],
  id: ContradictionId,
  condition: boolean,
  evidenceScore: number
): void {
  if (!condition) return;

  target.push({
    id,
    definition: CONTRADICTIONS[id],
    evidenceScore: Number(evidenceScore.toFixed(4))
  });
}
