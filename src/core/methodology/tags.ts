export const TAGS = [
  'EXP',
  'RISK',
  'SAF',
  'CTRL',
  'ANA',
  'INT',
  'MEAN',
  'SOC',
  'IND',
  'LEAD',
  'COOP',
  'OBS',
  'ACT',
  'AVD',
  'RESP',
  'REC',
  'PRAC',
  'ADAPT',
  'CALM',
  'ANX',
  'WAIT'
] as const;

export type Tag = (typeof TAGS)[number];
export type TagScoreMap = Record<Tag, number>;

export const TAG_DESCRIPTIONS: Record<Tag, string> = {
  EXP: 'exploration, novelty, discovery',
  RISK: 'tolerance for danger or exposure',
  SAF: 'safety, stability, risk reduction',
  CTRL: 'control, structure, predictability',
  ANA: 'analysis, reasoning, interpretation',
  INT: 'intuition, atmosphere, symbolic depth',
  MEAN: 'truth, knowledge, meaning, existential motive',
  SOC: 'social orientation, people-focus',
  IND: 'independence, autonomy, distance',
  LEAD: 'leadership, initiative, command',
  COOP: 'cooperation, coordination, group orientation',
  OBS: 'observation, watching before acting',
  ACT: 'direct action, immediate response',
  AVD: 'avoidance, withdrawal, disengagement',
  RESP: 'responsibility, duty, protection',
  REC: 'recognition, status, being seen',
  PRAC: 'practicality, utility, comfort',
  ADAPT: 'adaptation, conformity, following flow',
  CALM: 'calmness, emotional regulation',
  ANX: 'anxiety, threat sensitivity',
  WAIT: 'waiting, pausing, delayed response'
};

export function createEmptyTagScores(): TagScoreMap {
  return Object.fromEntries(TAGS.map((tag) => [tag, 0])) as TagScoreMap;
}

export function isTag(value: string): value is Tag {
  return (TAGS as readonly string[]).includes(value);
}
