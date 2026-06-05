import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '@/core';
import {
  buildLocalShareCardCopyText,
  buildLocalShareCardPreview,
  formatDisplayText
} from '@/features/results/resultShareCard';

describe('local share card preview', () => {
  it('builds a compact local share card from a public result', () => {
    const result = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
    const card = buildLocalShareCardPreview(result);

    expect(card.eyebrow).toBe('The 20 Corridors');
    expect(card.title).toBe(result.archetype.title);
    expect(card.pattern).toBe(result.report.overview.patternSummary);
    expect(card.traits).toHaveLength(3);
    expect(card.mainTension.length).toBeGreaterThan(0);
    expect(card.deepMotive).toBe(result.deepMotive.label);
    expect(card.copyText).toContain(`Result: ${result.archetype.title}`);
    expect(card.copyText).toContain('Note: reflective game, not a diagnosis.');
  });

  it('uses a safe fallback when no contradiction title exists', () => {
    const result = runCorridorsEngine('1A 2A 3A 4D 5A 6A 7D 8B 9A 10A 11A 12A 13B 14C 15B 16A 17C 18A 19C 20B');
    const withoutContradiction = {
      ...result,
      report: {
        ...result.report,
        overview: {
          ...result.report.overview,
          mainContradiction: null
        }
      }
    };

    expect(buildLocalShareCardPreview(withoutContradiction).mainTension).toBe('No dominant contradiction');
  });

  it('keeps copy text local and non-clinical', () => {
    const copy = buildLocalShareCardCopyText({
      title: 'The Observer Strategist',
      pattern: 'You reduce uncertainty through observation.',
      traits: [{ code: 'ANA', label: 'Analytical' }],
      mainTension: 'Curiosity filtered through caution',
      confidence: 'High',
      deepMotive: 'Knowledge motive'
    });

    expect(copy).toContain('The 20 Corridors');
    expect(copy).toContain('Analytical (ANA)');
    expect(copy).toContain('not a diagnosis');
    expect(copy).not.toMatch(/clinical|disorder|scientifically proven/i);
  });

  it('formats machine-readable bands into display labels', () => {
    expect(formatDisplayText('high_internal_consistency')).toBe('High Internal Consistency');
    expect(formatDisplayText('moderate-signal')).toBe('Moderate Signal');
  });
});
