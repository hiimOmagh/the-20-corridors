export const ARCHETYPE_IDS = [
  'observer_strategist',
  'controlled_explorer',
  'direct_initiator',
  'solitary_architect',
  'symbolic_seeker',
  'social_navigator',
  'stability_guardian',
  'power_analyst'
] as const;

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

export interface ArchetypeDefinition {
  readonly id: ArchetypeId;
  readonly title: string;
  readonly summary: string;
  readonly strength: string;
  readonly failureMode: string;
  readonly disprovenIf: string;
}

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  observer_strategist: {
    id: 'observer_strategist',
    title: 'The Observer Strategist',
    summary: 'Reduces uncertainty by reading the environment before acting.',
    strength: 'Pattern recognition, timing, and strategic patience.',
    failureMode: 'Over-observation and delayed execution.',
    disprovenIf: 'Direct action and risk signals are stronger than observation and control signals.'
  },
  controlled_explorer: {
    id: 'controlled_explorer',
    title: 'The Controlled Explorer',
    summary: 'Wants discovery, but prefers to enter the unknown with an information advantage.',
    strength: 'Curious but not reckless.',
    failureMode: 'Can over-prepare before acting.',
    disprovenIf: 'Exploration is high while safety and control are weak.'
  },
  direct_initiator: {
    id: 'direct_initiator',
    title: 'The Direct Initiator',
    summary: 'Moves toward uncertainty directly and learns through action.',
    strength: 'Momentum, courage, and fast response.',
    failureMode: 'Under-analysis and avoidable exposure.',
    disprovenIf: 'Observation and safety dominate direct action.'
  },
  solitary_architect: {
    id: 'solitary_architect',
    title: 'The Solitary Architect',
    summary: 'Builds structure around autonomy and prefers self-directed environments.',
    strength: 'Independence, system-building, and low dependency.',
    failureMode: 'Emotional distance and over-isolation.',
    disprovenIf: 'Social and cooperative signals are stronger than independence.'
  },
  symbolic_seeker: {
    id: 'symbolic_seeker',
    title: 'The Symbolic Seeker',
    summary: 'Searches for hidden layers, meaning, mystery, and symbolic depth.',
    strength: 'Interpretation, depth, and imaginative pattern detection.',
    failureMode: 'Can over-read signals or prefer meaning over action.',
    disprovenIf: 'Practicality and action dominate meaning and intuition.'
  },
  social_navigator: {
    id: 'social_navigator',
    title: 'The Social Navigator',
    summary: 'Understands the world through people, reactions, recognition, and group dynamics.',
    strength: 'Social reading, relational intelligence, and influence.',
    failureMode: 'May depend too much on external response or group atmosphere.',
    disprovenIf: 'Independence and avoidance dominate social engagement.'
  },
  stability_guardian: {
    id: 'stability_guardian',
    title: 'The Stability Guardian',
    summary: 'Prioritizes stability, protection, predictability, and reduced exposure.',
    strength: 'Reliability, duty, and risk management.',
    failureMode: 'Over-caution and missed opportunity.',
    disprovenIf: 'Risk and exploration repeatedly override safety.'
  },
  power_analyst: {
    id: 'power_analyst',
    title: 'The Power Analyst',
    summary: 'Seeks leverage through knowledge, timing, prediction, and control.',
    strength: 'Strategy, influence, and planning depth.',
    failureMode: 'Can become too controlling or status-sensitive.',
    disprovenIf: 'Belonging, calm, or avoidance motives dominate power and control.'
  }
};
