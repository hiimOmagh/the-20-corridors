import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CORRIDORS_ENGINE_API_VERSION,
  CORRIDORS_GOLDEN_SNAPSHOT_VERSION,
  CORRIDORS_RESULT_SERIALIZATION_VERSION,
  buildGoldenProfileSnapshotDocument,
  serializeGoldenProfileSnapshotDocument
} from '../../src/core';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';

describe('golden public result snapshots', () => {
  it('builds a versioned snapshot document for all golden profiles', () => {
    const document = buildGoldenProfileSnapshotDocument();

    expect(document.schemaVersion).toBe(CORRIDORS_GOLDEN_SNAPSHOT_VERSION);
    expect(document.serializationVersion).toBe(CORRIDORS_RESULT_SERIALIZATION_VERSION);
    expect(document.engineApiVersion).toBe(CORRIDORS_ENGINE_API_VERSION);
    expect(document.snapshotId).toBe('golden-public-results-phase-1.6');
    expect(document.profileCount).toBe(GOLDEN_PROFILES.length);
    expect(document.profiles.map((profile) => profile.id)).toEqual(GOLDEN_PROFILES.map((profile) => profile.id));
  });

  it('keeps every golden result aligned with its expected archetype and public contract', () => {
    const document = buildGoldenProfileSnapshotDocument();

    for (const [index, snapshot] of document.profiles.entries()) {
      const fixture = GOLDEN_PROFILES[index];
      if (!fixture) throw new Error(`Missing golden fixture at index ${index}`);

      expect(snapshot.expectedArchetype).toBe(fixture.expectedArchetype);
      expect(snapshot.resultEnvelope.result.archetype.id).toBe(fixture.expectedArchetype);
      expect(snapshot.resultEnvelope.result.answers).toHaveLength(20);
      expect(snapshot.resultEnvelope.result.axes).toHaveLength(6);
      expect(snapshot.resultEnvelope.result.report.evidenceDigest).toHaveLength(20);
    }
  });

  it('serializes golden snapshots deterministically without volatile metadata', () => {
    const first = serializeGoldenProfileSnapshotDocument();
    const second = serializeGoldenProfileSnapshotDocument(buildGoldenProfileSnapshotDocument());

    expect(first).toBe(second);
    expect(first).not.toMatch(/generatedAt|timestamp|createdAt|updatedAt/i);
  });

  it('keeps committed snapshot evidence current', () => {
    const snapshotPath = path.join(process.cwd(), 'docs/evidence/golden-public-results-latest.json');
    const committed = readFileSync(snapshotPath, 'utf8');

    expect(committed).toBe(serializeGoldenProfileSnapshotDocument());
  });
});
