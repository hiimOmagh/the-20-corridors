import { describe, expect, it } from 'vitest';
import { REPORT_SECTION_ANCHORS } from '@/features/results/resultReportPresentation';
import {
  buildResultSectionIndex,
  getAxisVisualTone,
  getContradictionVisualTone,
  getPracticalVisualTone,
  getResultSectionTone
} from '@/features/results/resultVisualConsistency';

describe('result visual consistency helpers', () => {
  it('builds a stable section index from the existing result anchors', () => {
    const index = buildResultSectionIndex(REPORT_SECTION_ANCHORS);

    expect(index).toHaveLength(REPORT_SECTION_ANCHORS.length);
    expect(index[0]).toMatchObject({ id: 'dominant-traits', stepLabel: '01', tone: 'signal' });
    expect(index.at(-1)).toMatchObject({ id: 'share-summary', stepLabel: '08', tone: 'local' });
    expect(new Set(index.map((item) => item.stepLabel)).size).toBe(index.length);
  });

  it('assigns expected visual tones to report sections', () => {
    expect(getResultSectionTone('axis-map')).toBe('evidence');
    expect(getResultSectionTone('contradiction-map')).toBe('tension');
    expect(getResultSectionTone('trust-guard')).toBe('trust');
    expect(getResultSectionTone('unknown-section')).toBe('evidence');
  });

  it('rotates axis card visual tones without introducing random behavior', () => {
    expect(getAxisVisualTone(0)).toEqual({ className: 'visual-tone visual-tone-signal', label: 'signal' });
    expect(getAxisVisualTone(1)).toEqual({ className: 'visual-tone visual-tone-evidence', label: 'evidence' });
    expect(getAxisVisualTone(6)).toEqual({ className: 'visual-tone visual-tone-signal', label: 'signal' });
  });

  it('marks the first contradiction as the primary tension card', () => {
    expect(getContradictionVisualTone(0).className).toContain('primary-tension-card');
    expect(getContradictionVisualTone(1).className).not.toContain('primary-tension-card');
  });

  it('maps practical panels to consistent visual tones', () => {
    expect(getPracticalVisualTone('strengths').className).toContain('visual-tone-signal');
    expect(getPracticalVisualTone('failureModes').className).toContain('visual-tone-tension');
    expect(getPracticalVisualTone('growthDirections').className).toContain('visual-tone-practical');
  });
});
