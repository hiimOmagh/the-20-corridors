import { describe, expect, it } from 'vitest';
import {
  getLandingPrimaryContinuityValues,
  getLandingScopeSummary,
  getLandingSectionLabels,
  getLandingToneClass,
  landingContinuityMarkers,
  landingSectionIndex,
  landingTrustSignals
} from '@/features/landing/landingVisualConsistency';

describe('landing visual consistency helpers', () => {
  it('keeps the landing sections in a stable narrative order', () => {
    expect(landingSectionIndex).toHaveLength(5);
    expect(getLandingSectionLabels()).toEqual(['Promise', 'Identity', 'Trust', 'Method', 'Scope']);
    expect(landingSectionIndex.map((section) => section.index)).toEqual(['01', '02', '03', '04', '05']);
  });

  it('exposes continuity markers for the hero strip', () => {
    expect(landingContinuityMarkers).toHaveLength(3);
    expect(getLandingPrimaryContinuityValues()).toEqual(['Local prototype', 'Deterministic', 'Non-clinical']);
  });

  it('uses tone classes that match the Phase 3 visual system', () => {
    expect(getLandingToneClass('threshold')).toBe('landing-tone-threshold');
    expect(getLandingToneClass('signal')).toBe('landing-tone-signal');
    expect(getLandingToneClass('echo')).toBe('landing-tone-echo');
    expect(getLandingToneClass('safety')).toBe('landing-tone-safety');
    expect(getLandingToneClass('void')).toBe('landing-tone-void');
  });

  it('keeps local-only trust signals visible without adding backend scope', () => {
    expect(landingTrustSignals.map((signal) => signal.label)).toEqual(['20 corridors', '6 axes', '0 backend']);
    expect(getLandingScopeSummary(3, 3)).toBe('3 included / 3 blocked');
  });
});
