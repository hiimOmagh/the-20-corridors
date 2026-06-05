import { describe, expect, it } from 'vitest';
import {
  CORRIDORS_ENGINE_API_VERSION,
  CORRIDORS_RESULT_SERIALIZATION_VERSION,
  buildSerializableCorridorsResult,
  deserializeCorridorsResult,
  runCorridorsEngine,
  serializeCorridorsResult,
  serializeCorridorsResultEnvelope,
  stableStringify
} from '../../src/core';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';

const observerProfile = GOLDEN_PROFILES.find((profile) => profile.id === 'GP1');

if (!observerProfile) {
  throw new Error('Missing GP1 fixture for serialization tests.');
}

describe('corridors result serialization', () => {
  it('wraps public results in a versioned serialization envelope', () => {
    const envelope = buildSerializableCorridorsResult(observerProfile.sequence);

    expect(envelope.serializationVersion).toBe(CORRIDORS_RESULT_SERIALIZATION_VERSION);
    expect(envelope.engineApiVersion).toBe(CORRIDORS_ENGINE_API_VERSION);
    expect(envelope.result.schemaVersion).toBe(CORRIDORS_ENGINE_API_VERSION);
    expect(envelope.result.archetype.id).toBe('observer_strategist');
  });

  it('serializes deterministically with stable key order', () => {
    const result = runCorridorsEngine(observerProfile.sequence);
    const first = serializeCorridorsResult(result);
    const second = serializeCorridorsResult(runCorridorsEngine(observerProfile.sequence));

    expect(first).toBe(second);
    expect(first.endsWith('\n')).toBe(true);
    expect(first.indexOf('"engineApiVersion"')).toBeLessThan(first.indexOf('"result"'));
    expect(first.indexOf('"result"')).toBeLessThan(first.indexOf('"serializationVersion"'));
  });

  it('round-trips serialized public results', () => {
    const envelope = buildSerializableCorridorsResult(observerProfile.sequence);
    const serialized = serializeCorridorsResultEnvelope(envelope);
    const restored = deserializeCorridorsResult(serialized);

    expect(restored).toEqual(envelope);
  });

  it('does not serialize internal scoring internals', () => {
    const serialized = serializeCorridorsResult(runCorridorsEngine(observerProfile.sequence));
    const parsed = JSON.parse(serialized) as unknown;
    const keys = collectObjectKeys(parsed);
    const forbiddenKeys = [
      'tagScores',
      'tagEvidence',
      'reportSeed',
      'allScores',
      'rawScores',
      'leadingScores',
      'signatureBoost',
      'baseScore',
      'points',
      'tags'
    ];

    for (const key of forbiddenKeys) {
      expect(keys).not.toContain(key);
    }
  });

  it('rejects malformed or unsupported serialized payloads', () => {
    expect(() => deserializeCorridorsResult('{not-json')).toThrow(/Invalid serialized corridors result JSON/);

    expect(() =>
      deserializeCorridorsResult(
        stableStringify({
          serializationVersion: 'old-version',
          engineApiVersion: CORRIDORS_ENGINE_API_VERSION,
          result: runCorridorsEngine(observerProfile.sequence)
        })
      )
    ).toThrow(/Unsupported corridors result serialization version/);

    expect(() =>
      deserializeCorridorsResult(
        stableStringify({
          serializationVersion: CORRIDORS_RESULT_SERIALIZATION_VERSION,
          engineApiVersion: 'old-engine',
          result: runCorridorsEngine(observerProfile.sequence)
        })
      )
    ).toThrow(/Unsupported corridors engine API version/);
  });
});

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectObjectKeys(item));
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [key, ...collectObjectKeys(child)]);
}
