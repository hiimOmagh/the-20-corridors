import { describe, expect, it } from 'vitest';
import {
  REPORT_SECTION_ANCHORS,
  buildMobileResultSummary,
  getResultStateCopy
} from '@/features/results/resultReportPresentation';

describe('result report presentation helpers', () => {
  it('defines stable unique report section anchors for mobile jump navigation', () => {
    const ids = REPORT_SECTION_ANCHORS.map((anchor) => anchor.id);

    expect(REPORT_SECTION_ANCHORS.length).toBe(8);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'dominant-traits',
      'axis-map',
      'contradiction-map',
      'practical-map',
      'evidence-digest',
      'trust-guard',
      'local-feedback',
      'share-summary'
    ]);
    expect(REPORT_SECTION_ANCHORS.every((anchor) => anchor.shortLabel.length > 0)).toBe(true);
  });

  it('builds a compact mobile result summary without requiring backend state', () => {
    const summary = buildMobileResultSummary({
      archetypeTitle: 'The Observer Strategist',
      confidence: 'high',
      deepMotive: 'Knowledge motive',
      contradictionTitle: 'Knowledge Without Action'
    });

    expect(summary).toHaveLength(4);
    expect(summary.join(' ')).toContain('The Observer Strategist');
    expect(summary.join(' ')).toContain('Knowledge Without Action');
  });

  it('falls back cleanly when no contradiction title is available', () => {
    const summary = buildMobileResultSummary({
      archetypeTitle: 'The Direct Initiator',
      confidence: 'moderate',
      deepMotive: 'Power motive'
    });

    expect(summary.at(-1)).toBe('Main tension: No dominant contradiction');
  });

  it('returns polished local-result copy for loading, empty, and invalid states', () => {
    expect(getResultStateCopy('loading').title).toContain('Loading');
    expect(getResultStateCopy('empty').primaryActionLabel).toBe('Start the corridors');

    const invalid = getResultStateCopy('invalid', 'Unsupported schema');
    expect(invalid.secondaryActionLabel).toBe('Clear local result');
    expect(invalid.detail).toBe('Unsupported schema');
  });
});
