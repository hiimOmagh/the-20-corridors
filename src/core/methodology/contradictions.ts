export const CONTRADICTION_IDS = [
  'controlled_explorer',
  'solitary_leader',
  'social_watcher',
  'knowledge_without_action',
  'power_without_exposure',
  'calm_avoider',
  'recognition_vs_independence',
  'responsible_avoider'
] as const;

export type ContradictionId = (typeof CONTRADICTION_IDS)[number];

export interface ContradictionDefinition {
  readonly id: ContradictionId;
  readonly title: string;
  readonly explanation: string;
  readonly behavioralImplication: string;
  readonly disprovenIf: string;
}

export const CONTRADICTIONS: Record<ContradictionId, ContradictionDefinition> = {
  controlled_explorer: {
    id: 'controlled_explorer',
    title: 'Controlled Explorer',
    explanation: 'Curiosity is present, but it is filtered through safety, control, or observation.',
    behavioralImplication: 'New situations are more likely to be entered after an information buffer is created.',
    disprovenIf: 'Risk and direct action dominate safety and observation.'
  },
  solitary_leader: {
    id: 'solitary_leader',
    title: 'Solitary Leader',
    explanation: 'Leadership and control signals appear together with autonomy and distance signals.',
    behavioralImplication: 'Leadership is more functional than socially dependent.',
    disprovenIf: 'Social and cooperative signals clearly exceed independence.'
  },
  social_watcher: {
    id: 'social_watcher',
    title: 'Social Watcher',
    explanation: 'People-orientation appears with observation and analysis.',
    behavioralImplication: 'The person may enter social spaces by reading dynamics before fully participating.',
    disprovenIf: 'Social evidence is isolated and not repeated.'
  },
  knowledge_without_action: {
    id: 'knowledge_without_action',
    title: 'Knowledge Without Action',
    explanation: 'Meaning and analysis are stronger than immediate movement or risk.',
    behavioralImplication: 'Reflective depth may create execution drag if not converted into action.',
    disprovenIf: 'Direct action appears strongly across ambiguity and pressure questions.'
  },
  power_without_exposure: {
    id: 'power_without_exposure',
    title: 'Power Without Exposure',
    explanation: 'Control, leadership, or recognition signals appear with safety and low exposure.',
    behavioralImplication: 'Influence may be pursued through indirect, low-risk paths.',
    disprovenIf: 'Risk and direct confrontation signals are also high.'
  },
  calm_avoider: {
    id: 'calm_avoider',
    title: 'Calm Avoider',
    explanation: 'Calmness appears with avoidance rather than direct resolution.',
    behavioralImplication: 'Non-reactivity may sometimes function as disengagement.',
    disprovenIf: 'Calm choices are paired with responsibility and direct action.'
  },
  recognition_vs_independence: {
    id: 'recognition_vs_independence',
    title: 'Recognition vs Independence Split',
    explanation: 'Recognition signals appear together with autonomy and distance signals.',
    behavioralImplication: 'The person may want selective visibility without being absorbed by the group.',
    disprovenIf: 'Social closeness is consistently high and independence is weak.'
  },
  responsible_avoider: {
    id: 'responsible_avoider',
    title: 'Responsible Avoider',
    explanation: 'Protective or duty-oriented signals appear with avoidance or safety signals.',
    behavioralImplication: 'The person may warn, delegate, or organize instead of personally entering danger.',
    disprovenIf: 'Responsibility appears only once and avoidance is not repeated.'
  }
};
