import type { AxisBand, AxisId } from '../methodology/axes';
import type { Tag } from '../methodology/tags';
import type { ContradictionId } from '../methodology/contradictions';
import type { ArchetypeId } from '../methodology/archetypes';
import type { ConfidenceBand } from '../scoring/calculateConfidence';

export const TAG_LABELS: Record<Tag, string> = {
  EXP: 'controlled curiosity',
  RISK: 'risk exposure',
  SAF: 'safety orientation',
  CTRL: 'control and structure',
  ANA: 'analytical processing',
  INT: 'symbolic intuition',
  MEAN: 'meaning orientation',
  SOC: 'people orientation',
  IND: 'independence',
  LEAD: 'leadership drive',
  COOP: 'cooperative orientation',
  OBS: 'observation before action',
  ACT: 'direct action',
  AVD: 'avoidance or disengagement',
  RESP: 'protective responsibility',
  REC: 'recognition sensitivity',
  PRAC: 'practical utility',
  ADAPT: 'adaptation to the group path',
  CALM: 'calm regulation',
  ANX: 'threat sensitivity',
  WAIT: 'delayed response'
};

export const AXIS_DOMINANT_LABELS: Record<AxisId, Record<string, string>> = {
  explorationSafety: {
    high_exploration: 'high exploration',
    safety_control_dominant: 'safety-control dominant',
    controlled_exploration: 'controlled exploration'
  },
  thinkingStyle: {
    analytical: 'analytical thinking',
    intuitive_symbolic: 'symbolic-intuitive thinking',
    practical: 'practical thinking',
    social_relational: 'social-relational thinking',
    action_based: 'action-based thinking'
  },
  relationshipPattern: {
    social_closeness: 'social closeness',
    recognition_seeking: 'recognition seeking',
    independence: 'independence and distance',
    social_observation: 'social observation',
    responsibility_to_others: 'responsibility toward others'
  },
  agencyControl: {
    direct_leadership: 'direct leadership',
    structured_control: 'structured control',
    indirect_control: 'indirect control',
    cooperative_agency: 'cooperative agency',
    withdrawal_non_engagement: 'withdrawal or non-engagement'
  },
  ambiguityFear: {
    investigate_directly: 'direct investigation',
    analyze_first: 'analysis before action',
    freeze_wait: 'freeze or wait',
    avoid: 'avoidance under uncertainty',
    protect_others: 'protective response'
  },
  deepMotive: {
    truth: 'truth motive',
    power: 'power motive',
    belonging: 'belonging motive',
    knowledge: 'knowledge motive',
    security: 'security motive',
    social_control: 'social-control motive'
  }
};

export const AXIS_INTERPRETATIONS: Record<AxisId, Record<string, string>> = {
  explorationSafety: {
    high_exploration: 'Your choices repeatedly move toward novelty, unknown paths, and direct contact with uncertainty.',
    safety_control_dominant: 'Your choices repeatedly reduce exposure through safety, control, observation, or delayed movement.',
    controlled_exploration: 'Your pattern does not reject the unknown; it filters discovery through control, timing, or information first.'
  },
  thinkingStyle: {
    analytical: 'You process situations by organizing signals, comparing options, and looking for structure before committing.',
    intuitive_symbolic: 'You process situations through atmosphere, hidden meaning, symbolic cues, and layered interpretation.',
    practical: 'You process situations through usefulness, stability, comfort, and concrete outcomes.',
    social_relational: 'You process situations through people, reactions, recognition, and group dynamics.',
    action_based: 'You process situations by moving, testing, and learning through direct contact.'
  },
  relationshipPattern: {
    social_closeness: 'Your social pattern moves toward connection, shared presence, and relational energy.',
    recognition_seeking: 'Your social pattern shows sensitivity to being seen, credited, or acknowledged.',
    independence: 'Your social pattern protects distance, autonomy, and self-directed space.',
    social_observation: 'Your social pattern reads people and group atmosphere before fully entering.',
    responsibility_to_others: 'Your social pattern is shaped by duty, protection, or care for others.'
  },
  agencyControl: {
    direct_leadership: 'You exert agency by initiating, moving first, or taking visible responsibility.',
    structured_control: 'You exert agency by creating structure, rules, order, and practical control.',
    indirect_control: 'You exert agency by watching, timing, and using information before direct movement.',
    cooperative_agency: 'You exert agency through coordination, support, and shared responsibility.',
    withdrawal_non_engagement: 'You preserve agency by limiting exposure, stepping back, or refusing unnecessary involvement.'
  },
  ambiguityFear: {
    investigate_directly: 'When information is incomplete, your first tendency is to move toward the source and test reality directly.',
    analyze_first: 'When information is incomplete, your first tendency is to observe, map the situation, and reduce uncertainty.',
    freeze_wait: 'When information is incomplete, your first tendency is to pause until more certainty appears.',
    avoid: 'When information is incomplete, your first tendency is to reduce contact with the unknown.',
    protect_others: 'When information is incomplete, your first tendency is to make the situation safer for others.'
  },
  deepMotive: {
    truth: 'The strongest motive signal points toward clarity, uncovering what is real, and refusing illusion.',
    power: 'The strongest motive signal points toward influence, leverage, control, and visible effect.',
    belonging: 'The strongest motive signal points toward connection, closeness, and relational meaning.',
    knowledge: 'The strongest motive signal points toward understanding, explanation, and conceptual depth.',
    security: 'The strongest motive signal points toward predictability, protection, and reducing future surprise.',
    social_control: 'The strongest motive signal points toward understanding people as a way to reduce social uncertainty.'
  }
};

export const BAND_LABELS: Record<AxisBand, string> = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  dominant: 'dominant'
};

export const CONFIDENCE_COPY: Record<ConfidenceBand, string> = {
  low: 'Low consistency: the answer pattern is scattered or several readings compete closely.',
  moderate: 'Moderate consistency: one pattern is visible, but competing evidence or contradictions remain important.',
  high: 'High consistency: repeated evidence supports the main reading across several sections.'
};

export const ARCHETYPE_REPORT_COPY: Record<
  ArchetypeId,
  {
    readonly strengths: readonly string[];
    readonly failureModes: readonly string[];
    readonly growthDirections: readonly string[];
  }
> = {
  observer_strategist: {
    strengths: ['Pattern recognition', 'Strategic patience', 'Information advantage before movement'],
    failureModes: ['Delayed execution', 'Over-reading the environment', 'Waiting too long for cleaner information'],
    growthDirections: ['Use a time limit before deciding', 'Separate useful observation from defensive delay']
  },
  controlled_explorer: {
    strengths: ['Curiosity with safeguards', 'Measured discovery', 'Learning without reckless exposure'],
    failureModes: ['Over-preparation', 'Turning exploration into planning only', 'Avoiding useful uncertainty'],
    growthDirections: ['Define the minimum safe test', 'Move once enough information exists, not once all information exists']
  },
  direct_initiator: {
    strengths: ['Momentum', 'Fast response', 'Learning by contact with reality'],
    failureModes: ['Under-analysis', 'Avoidable exposure', 'Confusing speed with correctness'],
    growthDirections: ['Add one cheap check before action', 'Treat risk as a variable, not as proof of courage']
  },
  solitary_architect: {
    strengths: ['Autonomy', 'System-building', 'Low dependency on group approval'],
    failureModes: ['Over-isolation', 'Emotional distance', 'Trying to solve relational problems structurally'],
    growthDirections: ['Choose one trusted feedback loop', 'Keep autonomy without cutting off useful signal']
  },
  symbolic_seeker: {
    strengths: ['Depth interpretation', 'Meaning detection', 'Imaginative pattern recognition'],
    failureModes: ['Over-reading weak signals', 'Preferring meaning over execution', 'Staying in interpretation too long'],
    growthDirections: ['Test interpretations against behavior', 'Translate one insight into one concrete action']
  },
  social_navigator: {
    strengths: ['Reading people', 'Relational timing', 'Influence through group awareness'],
    failureModes: ['External validation dependency', 'Over-adjusting to social atmosphere', 'Confusing recognition with direction'],
    growthDirections: ['Separate what the group rewards from what is true', 'Keep one private standard outside social feedback']
  },
  stability_guardian: {
    strengths: ['Reliability', 'Protective responsibility', 'Risk management'],
    failureModes: ['Over-caution', 'Missed opportunity', 'Treating novelty as threat by default'],
    growthDirections: ['Classify risk by reversibility', 'Allow low-cost experiments while protecting essentials']
  },
  power_analyst: {
    strengths: ['Strategic leverage', 'Planning depth', 'Timing and influence'],
    failureModes: ['Over-control', 'Status sensitivity', 'Treating ambiguity as something to dominate'],
    growthDirections: ['Define what control is actually for', 'Convert influence into responsibility, not only advantage']
  }
};

export const CONTRADICTION_REPORT_COPY: Record<ContradictionId, string> = {
  controlled_explorer: 'The tension is not between curiosity and fear; it is between discovery and the need to stay oriented.',
  solitary_leader: 'The tension is between being able to direct a system and not wanting to be socially absorbed by it.',
  social_watcher: 'The tension is between social attention and social caution: people matter, but they are read before they are trusted.',
  knowledge_without_action: 'The tension is between insight and movement: understanding can become a substitute for testing.',
  power_without_exposure: 'The tension is between wanting influence and preferring lower-exposure routes to it.',
  calm_avoider: 'The tension is between real calm and strategic disengagement; both can look quiet from the outside.',
  recognition_vs_independence: 'The tension is between wanting to be seen and not wanting to be owned by the group.',
  responsible_avoider: 'The tension is between care and self-protection: the person may protect indirectly instead of entering danger directly.'
};

export function labelTag(tag: Tag): string {
  return TAG_LABELS[tag];
}

export function labelDominantAxis(axisId: AxisId, dominant: string): string {
  return AXIS_DOMINANT_LABELS[axisId][dominant] ?? dominant.replaceAll('_', ' ');
}
