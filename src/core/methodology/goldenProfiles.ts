import type { ArchetypeId } from './archetypes';
import type { ContradictionId } from './contradictions';

export interface GoldenProfile {
  readonly id: string;
  readonly name: string;
  readonly sequence: string;
  readonly expectedArchetype: ArchetypeId;
  readonly expectedContradictions: readonly ContradictionId[];
  readonly expectedDominantTags: readonly string[];
}

export const GOLDEN_PROFILES: readonly GoldenProfile[] = [
  {
    id: 'GP1',
    name: 'Observer Strategist',
    sequence:
      '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D',
    expectedArchetype: 'observer_strategist',
    expectedContradictions: ['knowledge_without_action'],
    expectedDominantTags: ['ANA', 'OBS', 'CTRL', 'SAF', 'MEAN']
  },
  {
    id: 'GP2',
    name: 'Controlled Explorer',
    sequence:
      '1C 2B 3C 4D 5B 6B 7B 8A 9C 10C 11A 12C 13C 14C 15B 16D 17B 18D 19C 20D',
    expectedArchetype: 'controlled_explorer',
    expectedContradictions: ['controlled_explorer', 'knowledge_without_action'],
    expectedDominantTags: ['EXP', 'ANA', 'OBS', 'CTRL', 'INT', 'MEAN']
  },
  {
    id: 'GP3',
    name: 'Direct Initiator',
    sequence:
      '1A 2A 3A 4D 5A 6A 7D 8B 9A 10A 11A 12A 13B 14C 15B 16A 17C 18A 19C 20B',
    expectedArchetype: 'direct_initiator',
    expectedContradictions: [],
    expectedDominantTags: ['ACT', 'RISK', 'EXP', 'LEAD', 'CTRL']
  },
  {
    id: 'GP4',
    name: 'Solitary Architect',
    sequence:
      '1D 2B 3B 4A 5B 6B 7A 8D 9B 10B 11A 12D 13A 14A 15A 16D 17A 18B 19C 20D',
    expectedArchetype: 'solitary_architect',
    expectedContradictions: ['solitary_leader', 'knowledge_without_action'],
    expectedDominantTags: ['CTRL', 'ANA', 'SAF', 'IND', 'MEAN']
  },
  {
    id: 'GP5',
    name: 'Symbolic Seeker',
    sequence:
      '1C 2B 3C 4A 5D 6D 7B 8B 9C 10C 11D 12B 13A 14C 15B 16D 17A 18D 19C 20A',
    expectedArchetype: 'symbolic_seeker',
    expectedContradictions: ['knowledge_without_action', 'controlled_explorer'],
    expectedDominantTags: ['INT', 'MEAN', 'ANA', 'OBS', 'EXP']
  },
  {
    id: 'GP6',
    name: 'Social Navigator',
    sequence:
      '1A 2D 3D 4C 5C 6A 7B 8A 9D 10D 11A 12B 13D 14D 15C 16C 17D 18C 19A 20C',
    expectedArchetype: 'social_navigator',
    expectedContradictions: ['social_watcher'],
    expectedDominantTags: ['SOC', 'COOP', 'RESP', 'REC', 'OBS']
  },
  {
    id: 'GP7',
    name: 'Stability Guardian',
    sequence:
      '1D 2D 3B 4B 5C 6C 7C 8C 9B 10A 11B 12D 13D 14A 15A 16C 17D 18B 19D 20A',
    expectedArchetype: 'stability_guardian',
    expectedContradictions: ['responsible_avoider'],
    expectedDominantTags: ['SAF', 'RESP', 'CTRL', 'PRAC', 'CALM']
  },
  {
    id: 'GP8',
    name: 'Power Analyst',
    sequence:
      '1D 2B 3B 4A 5A 6B 7B 8B 9C 10B 11A 12D 13A 14A 15A 16D 17C 18C 19D 20B',
    expectedArchetype: 'power_analyst',
    expectedContradictions: ['power_without_exposure', 'knowledge_without_action'],
    expectedDominantTags: ['CTRL', 'ANA', 'OBS', 'LEAD', 'REC']
  }
];
