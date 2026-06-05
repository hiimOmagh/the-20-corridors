import { ARCHETYPES, type ArchetypeDefinition, type ArchetypeId } from '../methodology/archetypes';
import type { TagScoreMap } from '../methodology/tags';
import type { AnswerMap } from './scoreAnswers';
import { roundScore } from './calculateTagScores';

export interface ArchetypeScore {
  readonly id: ArchetypeId;
  readonly score: number;
  readonly baseScore: number;
  readonly signatureBoost: number;
}

export interface ArchetypeResolution {
  readonly id: ArchetypeId;
  readonly definition: ArchetypeDefinition;
  readonly score: number;
  readonly runnerUp: ArchetypeScore;
  readonly allScores: readonly ArchetypeScore[];
}

export function resolveArchetype(tagScores: TagScoreMap, answers: AnswerMap): ArchetypeResolution {
  const baseScores: Record<ArchetypeId, number> = {
    observer_strategist: roundScore(
      tagScores.OBS * 1.2 + tagScores.ANA * 1.2 + tagScores.CTRL * 1.0 + tagScores.SAF * 0.4 - tagScores.ACT * 0.25 - tagScores.RISK * 0.2
    ),
    controlled_explorer: roundScore(
      tagScores.EXP * 1.1 + tagScores.ANA * 0.8 + tagScores.OBS * 0.8 + tagScores.CTRL * 0.6 + tagScores.SAF * 0.4 - tagScores.AVD * 0.2
    ),
    direct_initiator: roundScore(
      tagScores.ACT * 1.3 + tagScores.RISK * 1.2 + tagScores.LEAD * 0.9 + tagScores.EXP * 0.8 - tagScores.WAIT * 0.6 - tagScores.AVD * 0.8 - tagScores.OBS * 0.3
    ),
    solitary_architect: roundScore(
      tagScores.IND * 1.1 + tagScores.CTRL * 1.1 + tagScores.ANA * 0.8 + tagScores.PRAC * 0.7 + tagScores.SAF * 0.4 - tagScores.SOC * 0.5
    ),
    symbolic_seeker: roundScore(
      tagScores.INT * 1.25 + tagScores.MEAN * 1.15 + tagScores.ANA * 0.7 + tagScores.OBS * 0.6 + tagScores.EXP * 0.3 - tagScores.PRAC * 0.2
    ),
    social_navigator: roundScore(
      tagScores.SOC * 1.25 + tagScores.COOP * 1.0 + tagScores.REC * 0.8 + tagScores.OBS * 0.4 + tagScores.ANA * 0.2 - tagScores.IND * 0.4 - tagScores.AVD * 0.4
    ),
    stability_guardian: roundScore(
      tagScores.SAF * 1.25 + tagScores.RESP * 1.0 + tagScores.CTRL * 0.8 + tagScores.CALM * 0.7 + tagScores.PRAC * 0.5 - tagScores.RISK * 0.8 - tagScores.EXP * 0.4
    ),
    power_analyst: roundScore(
      tagScores.CTRL * 1.25 + tagScores.ANA * 1.0 + tagScores.OBS * 0.7 + tagScores.LEAD * 0.7 + tagScores.REC * 0.6 - tagScores.COOP * 0.3
    )
  };

  const boosts = calculateSignatureBoosts(tagScores, answers);
  const allScores = (Object.keys(baseScores) as ArchetypeId[])
    .map((id) => ({
      id,
      baseScore: baseScores[id],
      signatureBoost: boosts[id],
      score: roundScore(baseScores[id] + boosts[id])
    }))
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));

  const winner = allScores[0];
  const runnerUp = allScores[1];

  if (!winner || !runnerUp) {
    throw new Error('Unable to resolve archetype scores.');
  }

  return {
    id: winner.id,
    definition: ARCHETYPES[winner.id],
    score: winner.score,
    runnerUp,
    allScores
  };
}

function calculateSignatureBoosts(tagScores: TagScoreMap, answers: AnswerMap): Record<ArchetypeId, number> {
  const boosts: Record<ArchetypeId, number> = {
    observer_strategist: 0,
    controlled_explorer: 0,
    direct_initiator: 0,
    solitary_architect: 0,
    symbolic_seeker: 0,
    social_navigator: 0,
    stability_guardian: 0,
    power_analyst: 0
  };

  if (tagScores.EXP >= 5 && tagScores.ANA >= 6 && tagScores.OBS >= 5) {
    boosts.controlled_explorer += 4;
  }

  if (tagScores.EXP >= 3 && tagScores.SAF + tagScores.CTRL + tagScores.OBS >= 10) {
    boosts.controlled_explorer += 1.5;
  }

  if (tagScores.ACT >= 8 && tagScores.RISK >= 5 && tagScores.EXP >= 7) {
    boosts.direct_initiator += 4;
  }

  if (tagScores.IND >= 2 && tagScores.CTRL >= 9 && tagScores.PRAC >= 2 && tagScores.SOC < 3) {
    boosts.solitary_architect += 5;
  }

  if (answers[15] === 'A' && tagScores.IND >= 2) {
    boosts.solitary_architect += 2;
  }

  if (tagScores.INT >= 4 && tagScores.MEAN >= 6) {
    boosts.symbolic_seeker += 4;
  }

  if (tagScores.SOC >= 8 && tagScores.COOP >= 3) {
    boosts.social_navigator += 4;
  }

  if (tagScores.SAF >= 8 && tagScores.RESP >= 3 && tagScores.RISK < 2) {
    boosts.stability_guardian += 4;
  }

  if (answers[20] === 'B' && tagScores.CTRL >= 5) {
    boosts.power_analyst += 6;
  }

  if ((answers[19] === 'C' || answers[19] === 'D') && answers[20] === 'B') {
    boosts.power_analyst += 2;
  }

  if (tagScores.CTRL >= 8 && tagScores.ANA >= 7 && tagScores.OBS >= 5 && tagScores.LEAD >= 2) {
    boosts.power_analyst += 2;
  }

  return boosts;
}
