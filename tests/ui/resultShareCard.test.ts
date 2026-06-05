import { describe, expect, it } from 'vitest';
import { runCorridorsEngine } from '@/core';
import {
  SHARE_CARD_COPY_BOUNDARY_NOTE,
  buildLocalShareCardCopyText,
  buildLocalShareCardPreview,
  buildShareCardMetrics,
  buildShareCardSignature,
  buildShareCardTraitLine,
  buildShareCardVisualCues,
  formatDisplayText
} from '@/features/results/resultShareCard';

describe('local share card preview', () => {
  it('builds an upgraded local share card from a public result', () => {
    const result = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
    const card = buildLocalShareCardPreview(result);

    expect(card.eyebrow).toBe('The 20 Corridors');
    expect(card.title).toBe(result.archetype.title);
    expect(card.pattern).toBe(result.report.overview.patternSummary);
    expect(card.traits).toHaveLength(3);
    expect(card.traitLine).toContain('(');
    expect(card.signature).toContain(result.archetype.title);
    expect(card.signature).toContain(card.deepMotive);
    expect(card.metrics).toHaveLength(3);
    expect(card.visualCues).toHaveLength(3);
    expect(card.ariaLabel).toContain(result.archetype.title);
    expect(card.mainTension.length).toBeGreaterThan(0);
    expect(card.deepMotive).toBe(result.deepMotive.label);
    expect(card.footer).toBe(SHARE_CARD_COPY_BOUNDARY_NOTE);
    expect(card.copyText).toContain(`Result: ${result.archetype.title}`);
    expect(card.copyText).toContain('Signature:');
    expect(card.copyText).toContain('Note: Reflective game');
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
      deepMotive: 'Knowledge motive',
      signature: 'The Observer Strategist · Knowledge motive · High'
    });

    expect(copy).toContain('The 20 Corridors');
    expect(copy).toContain('Signature: The Observer Strategist · Knowledge motive · High');
    expect(copy).toContain('Analytical (ANA)');
    expect(copy).toContain('not a diagnosis');
    expect(copy).not.toMatch(/clinical|disorder|scientifically proven/i);
  });

  it('formats machine-readable bands into display labels', () => {
    expect(formatDisplayText('high_internal_consistency')).toBe('High Internal Consistency');
    expect(formatDisplayText('moderate-signal')).toBe('Moderate Signal');
  });

  it('builds stable share-card visual helper fields', () => {
    const result = runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D');
    const signature = buildShareCardSignature({
      title: result.archetype.title,
      confidence: 'High',
      deepMotive: result.deepMotive.label
    });
    const traitLine = buildShareCardTraitLine([{ code: 'OBS', label: 'Observation' }]);
    const emptyTraitLine = buildShareCardTraitLine([]);
    const metrics = buildShareCardMetrics({ confidence: 'High', deepMotive: 'Knowledge motive', mainTension: 'Controlled Explorer' });
    const visualCues = buildShareCardVisualCues(result);

    expect(signature).toContain(result.archetype.title);
    expect(signature).toContain(result.deepMotive.label);
    expect(traitLine).toBe('Observation (OBS)');
    expect(emptyTraitLine).toBe('No dominant trait signal');
    expect(metrics.map((metric) => metric.label)).toEqual(['Consistency', 'Motive', 'Tension']);
    expect(visualCues.map((cue) => cue.label)).toEqual(['Archetype', 'Traits', 'Evidence refs']);
  });
});
