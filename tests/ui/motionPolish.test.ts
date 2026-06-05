import { describe, expect, it } from 'vitest';
import {
  getMotionPolishSummary,
  getMotionSurfaceClassName,
  getReducedMotionChecklist,
  motionPolishSurfaces,
  reducedMotionRules
} from '@/features/visual/motionPolish';

describe('motion polish presentation contract', () => {
  it('defines the expected interactive surfaces without adding product scope', () => {
    expect(motionPolishSurfaces).toHaveLength(5);
    expect(motionPolishSurfaces.map((surface) => surface.id)).toEqual([
      'primary-buttons',
      'option-buttons',
      'report-cards',
      'share-card',
      'feedback-controls'
    ]);
    expect(motionPolishSurfaces.every((surface) => surface.selector.length > 0)).toBe(true);
  });

  it('keeps reduced-motion rules explicit and behavior-neutral', () => {
    expect(reducedMotionRules).toHaveLength(4);
    expect(getReducedMotionChecklist().join(' ')).toContain('No product-scope expansion');
    expect(getReducedMotionChecklist().join(' ')).toContain('does not add backend');
  });

  it('returns stable tone class names for CSS hooks', () => {
    expect(getMotionSurfaceClassName('signal')).toBe('motion-tone-signal');
    expect(getMotionSurfaceClassName('threshold')).toBe('motion-tone-threshold');
    expect(getMotionSurfaceClassName('calm')).toBe('motion-tone-calm');
    expect(getMotionSurfaceClassName('danger')).toBe('motion-tone-danger');
    expect(getMotionSurfaceClassName('neutral')).toBe('motion-tone-neutral');
  });

  it('summarizes the motion scope for docs and smoke review', () => {
    expect(getMotionPolishSummary()).toBe('5 interactive surfaces, 4 reduced-motion rules');
  });
});
