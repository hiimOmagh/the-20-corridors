import type { AnswerInput } from '../scoring/scoreAnswers';

export type EdgeCaseProfileExpectation =
  | 'complete_result'
  | 'low_or_moderate_confidence'
  | 'tie_breaker_stability'
  | 'genericness_guard';

export interface EdgeCaseProfile {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly sequence: AnswerInput;
  readonly expectations: readonly EdgeCaseProfileExpectation[];
}

export const EDGE_CASE_PROFILES: readonly EdgeCaseProfile[] = [
  {
    id: 'EC1',
    name: 'Alternating Letter Stress Profile',
    purpose: 'Guards against global A/B/C/D meaning by alternating option letters across all questions.',
    sequence: '1A 2B 3C 4D 5A 6B 7C 8D 9A 10B 11C 12D 13A 14B 15C 16D 17A 18B 19C 20D',
    expectations: ['complete_result', 'tie_breaker_stability', 'genericness_guard']
  },
  {
    id: 'EC2',
    name: 'All-A Synthetic Input',
    purpose: 'Ensures a pathological repeated-letter input still resolves deterministically without assuming A has one global meaning.',
    sequence: '1A 2A 3A 4A 5A 6A 7A 8A 9A 10A 11A 12A 13A 14A 15A 16A 17A 18A 19A 20A',
    expectations: ['complete_result', 'genericness_guard']
  },
  {
    id: 'EC3',
    name: 'All-B Synthetic Input',
    purpose: 'Ensures a repeated-B input produces a structured result without collapsing into one fixed B interpretation.',
    sequence: '1B 2B 3B 4B 5B 6B 7B 8B 9B 10B 11B 12B 13B 14B 15B 16B 17B 18B 19B 20B',
    expectations: ['complete_result', 'genericness_guard']
  },
  {
    id: 'EC4',
    name: 'All-C Synthetic Input',
    purpose: 'Ensures a repeated-C input remains answer-specific and does not automatically mean exploration or intuition.',
    sequence: '1C 2C 3C 4C 5C 6C 7C 8C 9C 10C 11C 12C 13C 14C 15C 16C 17C 18C 19C 20C',
    expectations: ['complete_result', 'genericness_guard']
  },
  {
    id: 'EC5',
    name: 'All-D Synthetic Input',
    purpose: 'Ensures a repeated-D input remains answer-specific and does not automatically mean withdrawal or safety.',
    sequence: '1D 2D 3D 4D 5D 6D 7D 8D 9D 10D 11D 12D 13D 14D 15D 16D 17D 18D 19D 20D',
    expectations: ['complete_result', 'genericness_guard']
  },
  {
    id: 'EC6',
    name: 'Motive-Behavior Split Profile',
    purpose: 'Checks that Q20 power does not override behavior when the rest of the pattern is cautious or low-exposure.',
    sequence: '1D 2C 3B 4B 5B 6D 7C 8D 9B 10B 11B 12D 13A 14A 15D 16B 17B 18D 19B 20B',
    expectations: ['complete_result', 'tie_breaker_stability', 'genericness_guard']
  },
  {
    id: 'EC7',
    name: 'Broad Mixed Low-Signal Profile',
    purpose: 'Checks that a broad mixed profile remains complete and avoids overconfident generic prose.',
    sequence: '1B 2D 3A 4C 5D 6C 7A 8B 9C 10A 11D 12C 13B 14D 15A 16C 17A 18B 19D 20C',
    expectations: ['complete_result', 'low_or_moderate_confidence', 'genericness_guard']
  },
  {
    id: 'EC8',
    name: 'Close Archetype Collision Profile',
    purpose: 'Exercises collision between observer, symbolic, and power/control evidence so tie-breaking stays deterministic.',
    sequence: '1C 2B 3B 4A 5D 6B 7B 8B 9C 10C 11A 12D 13A 14A 15A 16D 17A 18C 19D 20B',
    expectations: ['complete_result', 'tie_breaker_stability', 'genericness_guard']
  }
];
