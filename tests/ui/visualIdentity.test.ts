import { describe, expect, it } from 'vitest';
import {
  getVisualIdentityPrincipleTitles,
  getVisualIdentityTokenNames,
  visualIdentityPrinciples,
  visualIdentityTokens
} from '../../src/features/visual/visualIdentity';

describe('visual identity system', () => {
  it('defines stable design tokens for the Phase 3 visual layer', () => {
    expect(visualIdentityTokens.length).toBeGreaterThanOrEqual(8);
    expect(getVisualIdentityTokenNames()).toContain('Signal cyan');
    expect(getVisualIdentityTokenNames()).toContain('Gold threshold');
    expect(visualIdentityTokens.every((token) => token.cssVariable.startsWith('--'))).toBe(true);
  });

  it('keeps visual principles focused on trust, hierarchy, and reduced motion', () => {
    expect(visualIdentityPrinciples).toHaveLength(4);
    expect(getVisualIdentityPrincipleTitles()).toEqual([
      'Mystery through depth, not clutter',
      'Trust through stable structure',
      'Signal hierarchy before ornament',
      'Motion must be optional'
    ]);
    expect(visualIdentityPrinciples.at(-1)?.rule).toContain('reduced-motion');
  });
});
