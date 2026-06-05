import { GOLDEN_PROFILES } from '../methodology/goldenProfiles';
import type { ArchetypeId } from '../methodology/archetypes';
import type { ContradictionId } from '../methodology/contradictions';
import { runCorridorsEngine } from '../engine';
import {
  CORRIDORS_RESULT_SERIALIZATION_VERSION,
  createSerializedCorridorsResultEnvelope,
  stableStringify,
  type CorridorsResultSerializationVersion,
  type SerializedCorridorsResultEnvelope
} from './resultSerialization';
import { CORRIDORS_ENGINE_API_VERSION } from '../publicTypes';

export const CORRIDORS_GOLDEN_SNAPSHOT_VERSION = 'phase-1.6-golden-public-results-v1' as const;

export type CorridorsGoldenSnapshotVersion = typeof CORRIDORS_GOLDEN_SNAPSHOT_VERSION;

export interface CorridorsGoldenProfileSnapshot {
  readonly id: string;
  readonly name: string;
  readonly sequence: string;
  readonly expectedArchetype: ArchetypeId;
  readonly expectedContradictions: readonly ContradictionId[];
  readonly expectedDominantTags: readonly string[];
  readonly resultEnvelope: SerializedCorridorsResultEnvelope;
}

export interface CorridorsGoldenSnapshotDocument {
  readonly schemaVersion: CorridorsGoldenSnapshotVersion;
  readonly serializationVersion: CorridorsResultSerializationVersion;
  readonly engineApiVersion: typeof CORRIDORS_ENGINE_API_VERSION;
  readonly snapshotId: 'golden-public-results-phase-1.6';
  readonly profileCount: number;
  readonly profiles: readonly CorridorsGoldenProfileSnapshot[];
}

export function buildGoldenProfileSnapshotDocument(): CorridorsGoldenSnapshotDocument {
  const profiles = GOLDEN_PROFILES.map((profile): CorridorsGoldenProfileSnapshot => {
    const result = runCorridorsEngine(profile.sequence);

    return {
      id: profile.id,
      name: profile.name,
      sequence: profile.sequence,
      expectedArchetype: profile.expectedArchetype,
      expectedContradictions: profile.expectedContradictions,
      expectedDominantTags: profile.expectedDominantTags,
      resultEnvelope: createSerializedCorridorsResultEnvelope(result)
    };
  });

  return {
    schemaVersion: CORRIDORS_GOLDEN_SNAPSHOT_VERSION,
    serializationVersion: CORRIDORS_RESULT_SERIALIZATION_VERSION,
    engineApiVersion: CORRIDORS_ENGINE_API_VERSION,
    snapshotId: 'golden-public-results-phase-1.6',
    profileCount: profiles.length,
    profiles
  };
}

export function serializeGoldenProfileSnapshotDocument(document = buildGoldenProfileSnapshotDocument()): string {
  return stableStringify(document);
}
