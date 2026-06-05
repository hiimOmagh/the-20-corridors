import { describe, expect, it } from 'vitest';
import {
  CORRIDORS_ENGINE_API_VERSION,
  getCorridorQuestions,
  normalizeCorridorAnswers,
  parseCorridorAnswerSequence,
  runCorridorsEngine,
  type CorridorsPublicResultDto
} from '../../src/core';
import { GOLDEN_PROFILES } from '../../src/core/methodology/goldenProfiles';

const observerProfile = GOLDEN_PROFILES.find((profile) => profile.id === 'GP1');

if (!observerProfile) {
  throw new Error('Missing GP1 fixture for public API tests.');
}

describe('public engine API', () => {
  it('exposes a stable API version', () => {
    expect(CORRIDORS_ENGINE_API_VERSION).toBe('phase-1.5-engine-public-v1');
  });

  it('returns UI-safe questions without scoring tags', () => {
    const questions = getCorridorQuestions();

    expect(questions).toHaveLength(20);
    expect(questions[0]).toEqual({
      id: 1,
      text: 'دخلت مدينة غريبة وحدك. أول شيء تلفتله؟',
      weight: 1,
      options: [
        { key: 'A', text: 'الناس' },
        { key: 'B', text: 'المباني' },
        { key: 'C', text: 'الأصوات' },
        { key: 'D', text: 'المخارج والاتجاهات' }
      ]
    });

    expect(JSON.stringify(questions)).not.toContain('tags');
  });

  it('parses and normalizes answer sequences through the public API', () => {
    const parsed = parseCorridorAnswerSequence(observerProfile.sequence);
    const normalized = normalizeCorridorAnswers(observerProfile.sequence);

    expect(parsed[1]).toBe('D');
    expect(parsed[20]).toBe('D');
    expect(normalized).toEqual(parsed);
  });

  it('builds a deterministic public result', () => {
    const first = runCorridorsEngine(observerProfile.sequence);
    const second = runCorridorsEngine(observerProfile.sequence);

    expect(first).toEqual(second);
    expect(first.schemaVersion).toBe(CORRIDORS_ENGINE_API_VERSION);
    expect(first.apiVersion).toBe(CORRIDORS_ENGINE_API_VERSION);
    expect(first.answers).toHaveLength(20);
    expect(first.archetype.id).toBe('observer_strategist');
    expect(first.runnerUp.id).toBeTruthy();
    expect(['clear', 'close', 'tied']).toContain(first.runnerUp.gapBand);
    expect(first.dominantTraits).toHaveLength(3);
    expect(first.axes).toHaveLength(6);
    expect(first.contradictions.length).toBeGreaterThan(0);
    expect(first.report.evidenceDigest).toHaveLength(20);
  });

  it('does not expose internal numeric scoring objects through the public result', () => {
    const result = runCorridorsEngine(observerProfile.sequence) as unknown as Record<string, unknown>;
    const serialized = JSON.stringify(result);

    expect(result).not.toHaveProperty('tagScores');
    expect(result).not.toHaveProperty('tagEvidence');
    expect(result).not.toHaveProperty('reportSeed');
    expect(result).not.toHaveProperty('allScores');
    const keys = collectObjectKeys(result);

    expect(serialized).not.toContain('rawScores');
    expect(keys).not.toContain('rawScores');
    expect(keys).not.toContain('leadingScores');
    expect(keys).not.toContain('signatureBoost');
    expect(keys).not.toContain('baseScore');
    expect(keys).not.toContain('points');
    expect(keys).not.toContain('tags');
  });

  it('returns all required public report sections', () => {
    const result: CorridorsPublicResultDto = runCorridorsEngine(observerProfile.sequence);

    expect(result.report.overview.archetypeTitle).toBeTruthy();
    expect(result.report.axisCards.map((axis) => axis.id)).toEqual([
      'explorationSafety',
      'thinkingStyle',
      'relationshipPattern',
      'agencyControl',
      'ambiguityFear',
      'deepMotive'
    ]);
    expect(result.report.contradictionMap.length).toBeGreaterThan(0);
    expect(result.report.strengths.length).toBeGreaterThan(0);
    expect(result.report.failureModes.length).toBeGreaterThan(0);
    expect(result.report.growthDirections.length).toBeGreaterThan(0);
    expect(result.report.disprovenIf.length).toBeGreaterThan(0);
  });

  it('throws public validation errors for incomplete or malformed inputs', () => {
    expect(() => runCorridorsEngine('1A 2B')).toThrow(/Missing answer/);
    expect(() => parseCorridorAnswerSequence('1E')).toThrow(/Invalid answer token/);
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
