import { AXIS_LABELS, type AxisBand, type AxisScore } from '../methodology/axes';
import type { Tag, TagScoreMap } from '../methodology/tags';
import type { AnswerMap } from './scoreAnswers';
import { roundScore } from './calculateTagScores';

function sumScores(tagScores: TagScoreMap, tags: readonly Tag[]): number {
  return roundScore(tags.reduce((total, tag) => total + tagScores[tag], 0));
}

function maxEntry<T extends string>(scores: Record<T, number>): [T, number] {
  const entries = Object.entries(scores) as [T, number][];
  const first = entries[0];

  if (!first) {
    throw new Error('Cannot resolve max entry from empty score record.');
  }

  return entries.reduce<[T, number]>((best, current) => (current[1] > best[1] ? current : best), first);
}

function bandFromValue(value: number, dominantValue: number): AxisBand {
  if (value >= 12 || value >= dominantValue * 0.9) return 'dominant';
  if (value >= 8) return 'high';
  if (value >= 4) return 'moderate';
  return 'low';
}

export interface AxisScoreResult {
  readonly explorationSafety: AxisScore;
  readonly thinkingStyle: AxisScore;
  readonly relationshipPattern: AxisScore;
  readonly agencyControl: AxisScore;
  readonly ambiguityFear: AxisScore;
  readonly deepMotive: AxisScore;
}

export function calculateAxisScores(tagScores: TagScoreMap, answers: AnswerMap): AxisScoreResult {
  const exploration = roundScore(tagScores.EXP + tagScores.RISK + tagScores.ACT * 0.6 + tagScores.INT * 0.25);
  const safetyControl = roundScore(tagScores.SAF + tagScores.CTRL + tagScores.OBS * 0.7 + tagScores.AVD + tagScores.WAIT);

  const explorationDominant =
    exploration > safetyControl * 1.2
      ? 'high_exploration'
      : safetyControl > exploration * 1.2
        ? 'safety_control_dominant'
        : 'controlled_exploration';

  const thinkingScores = {
    analytical: sumScores(tagScores, ['ANA', 'OBS', 'CTRL']),
    intuitive_symbolic: sumScores(tagScores, ['INT', 'MEAN', 'OBS']),
    practical: sumScores(tagScores, ['PRAC', 'SAF', 'CTRL']),
    social_relational: sumScores(tagScores, ['SOC', 'COOP', 'REC']),
    action_based: sumScores(tagScores, ['ACT', 'RISK', 'LEAD'])
  };
  const [thinkingDominant, thinkingValue] = maxEntry(thinkingScores);

  const relationshipScores = {
    social_closeness: sumScores(tagScores, ['SOC', 'COOP']),
    recognition_seeking: sumScores(tagScores, ['REC', 'SOC']),
    independence: sumScores(tagScores, ['IND', 'CALM', 'AVD']),
    social_observation: sumScores(tagScores, ['OBS', 'ANA', 'SOC']),
    responsibility_to_others: sumScores(tagScores, ['RESP', 'COOP', 'SOC'])
  };
  const [relationshipDominant, relationshipValue] = maxEntry(relationshipScores);

  const agencyScores = {
    direct_leadership: sumScores(tagScores, ['LEAD', 'ACT', 'RISK']),
    structured_control: sumScores(tagScores, ['CTRL', 'ANA', 'PRAC']),
    indirect_control: sumScores(tagScores, ['OBS', 'ANA', 'WAIT']),
    cooperative_agency: sumScores(tagScores, ['COOP', 'RESP', 'SOC']),
    withdrawal_non_engagement: sumScores(tagScores, ['AVD', 'IND', 'CALM'])
  };
  const [agencyDominant, agencyValue] = maxEntry(agencyScores);

  const ambiguityScores = {
    investigate_directly: sumScores(tagScores, ['ACT', 'RISK', 'EXP']),
    analyze_first: sumScores(tagScores, ['OBS', 'ANA', 'SAF']),
    freeze_wait: sumScores(tagScores, ['WAIT', 'SAF', 'ANX']),
    avoid: sumScores(tagScores, ['AVD', 'IND', 'SAF']),
    protect_others: sumScores(tagScores, ['RESP', 'SOC', 'SAF'])
  };
  const [ambiguityDominant, ambiguityValue] = maxEntry(ambiguityScores);

  const q19 = answers[19];
  const q20 = answers[20];
  const motiveScores = {
    truth: roundScore((q20 === 'A' ? 4 : 0) + tagScores.MEAN + tagScores.ANA * 0.4 + tagScores.CTRL * 0.2),
    power: roundScore((q20 === 'B' ? 4 : 0) + tagScores.CTRL + tagScores.LEAD * 0.6 + tagScores.REC * 0.5),
    belonging: roundScore((q20 === 'C' ? 4 : 0) + tagScores.SOC + tagScores.COOP + tagScores.MEAN * 0.2),
    knowledge: roundScore((q20 === 'D' ? 4 : 0) + tagScores.MEAN + tagScores.ANA + tagScores.CTRL * 0.3),
    security: roundScore((['B', 'C', 'D'].includes(q19) ? 2 : 0) + tagScores.SAF + tagScores.CTRL * 0.4 + tagScores.OBS * 0.4),
    social_control: roundScore((q19 === 'A' ? 3 : 0) + tagScores.OBS + tagScores.SOC * 0.5 + tagScores.CTRL * 0.4)
  };
  const [motiveDominant, motiveValue] = maxEntry(motiveScores);

  return {
    explorationSafety: {
      id: 'explorationSafety',
      label: AXIS_LABELS.explorationSafety,
      band: bandFromValue(Math.max(exploration, safetyControl), Math.max(exploration, safetyControl)),
      dominant: explorationDominant,
      evidenceTags: exploration >= safetyControl ? ['EXP', 'RISK', 'ACT'] : ['SAF', 'CTRL', 'OBS'],
      rawScores: { exploration, safetyControl }
    },
    thinkingStyle: {
      id: 'thinkingStyle',
      label: AXIS_LABELS.thinkingStyle,
      band: bandFromValue(thinkingValue, Math.max(...Object.values(thinkingScores))),
      dominant: thinkingDominant,
      evidenceTags: mapThinkingTags(thinkingDominant),
      rawScores: thinkingScores
    },
    relationshipPattern: {
      id: 'relationshipPattern',
      label: AXIS_LABELS.relationshipPattern,
      band: bandFromValue(relationshipValue, Math.max(...Object.values(relationshipScores))),
      dominant: relationshipDominant,
      evidenceTags: mapRelationshipTags(relationshipDominant),
      rawScores: relationshipScores
    },
    agencyControl: {
      id: 'agencyControl',
      label: AXIS_LABELS.agencyControl,
      band: bandFromValue(agencyValue, Math.max(...Object.values(agencyScores))),
      dominant: agencyDominant,
      evidenceTags: mapAgencyTags(agencyDominant),
      rawScores: agencyScores
    },
    ambiguityFear: {
      id: 'ambiguityFear',
      label: AXIS_LABELS.ambiguityFear,
      band: bandFromValue(ambiguityValue, Math.max(...Object.values(ambiguityScores))),
      dominant: ambiguityDominant,
      evidenceTags: mapAmbiguityTags(ambiguityDominant),
      rawScores: ambiguityScores
    },
    deepMotive: {
      id: 'deepMotive',
      label: AXIS_LABELS.deepMotive,
      band: bandFromValue(motiveValue, Math.max(...Object.values(motiveScores))),
      dominant: motiveDominant,
      evidenceTags: mapMotiveTags(motiveDominant),
      rawScores: motiveScores
    }
  };
}

function mapThinkingTags(key: string): readonly Tag[] {
  const map: Record<string, readonly Tag[]> = {
    analytical: ['ANA', 'OBS', 'CTRL'],
    intuitive_symbolic: ['INT', 'MEAN', 'OBS'],
    practical: ['PRAC', 'SAF', 'CTRL'],
    social_relational: ['SOC', 'COOP', 'REC'],
    action_based: ['ACT', 'RISK', 'LEAD']
  };
  return map[key] ?? ['ANA'];
}

function mapRelationshipTags(key: string): readonly Tag[] {
  const map: Record<string, readonly Tag[]> = {
    social_closeness: ['SOC', 'COOP'],
    recognition_seeking: ['REC', 'SOC'],
    independence: ['IND', 'CALM', 'AVD'],
    social_observation: ['OBS', 'ANA', 'SOC'],
    responsibility_to_others: ['RESP', 'COOP', 'SOC']
  };
  return map[key] ?? ['SOC'];
}

function mapAgencyTags(key: string): readonly Tag[] {
  const map: Record<string, readonly Tag[]> = {
    direct_leadership: ['LEAD', 'ACT', 'RISK'],
    structured_control: ['CTRL', 'ANA', 'PRAC'],
    indirect_control: ['OBS', 'ANA', 'WAIT'],
    cooperative_agency: ['COOP', 'RESP', 'SOC'],
    withdrawal_non_engagement: ['AVD', 'IND', 'CALM']
  };
  return map[key] ?? ['CTRL'];
}

function mapAmbiguityTags(key: string): readonly Tag[] {
  const map: Record<string, readonly Tag[]> = {
    investigate_directly: ['ACT', 'RISK', 'EXP'],
    analyze_first: ['OBS', 'ANA', 'SAF'],
    freeze_wait: ['WAIT', 'SAF', 'ANX'],
    avoid: ['AVD', 'IND', 'SAF'],
    protect_others: ['RESP', 'SOC', 'SAF']
  };
  return map[key] ?? ['OBS'];
}

function mapMotiveTags(key: string): readonly Tag[] {
  const map: Record<string, readonly Tag[]> = {
    truth: ['MEAN', 'ANA', 'CTRL'],
    power: ['CTRL', 'LEAD', 'REC'],
    belonging: ['SOC', 'COOP', 'MEAN'],
    knowledge: ['MEAN', 'ANA', 'CTRL'],
    security: ['SAF', 'CTRL', 'OBS'],
    social_control: ['OBS', 'SOC', 'CTRL']
  };
  return map[key] ?? ['MEAN'];
}
