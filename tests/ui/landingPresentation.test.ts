import { describe, expect, it } from 'vitest';
import {
  getExcludedScopeLabels,
  getIncludedScopeLabels,
  landingCtas,
  landingMethodSteps,
  landingScopeGuards,
  landingTrustCards
} from '@/features/landing/landingPresentation';

describe('landing presentation content', () => {
  it('exposes the primary quiz CTA first and a secondary saved-result CTA', () => {
    expect(landingCtas).toHaveLength(2);
    expect(landingCtas[0]).toEqual({ label: 'Start the corridors', href: '/quiz', variant: 'primary' });
    expect(landingCtas[1]).toEqual({ label: 'View saved result', href: '/results', variant: 'secondary' });
  });

  it('keeps trust cards focused on deterministic, evidence-linked, non-clinical claims', () => {
    expect(landingTrustCards).toHaveLength(3);

    const trustCopy = landingTrustCards.map((card) => `${card.eyebrow} ${card.title} ${card.body}`).join(' ');

    expect(trustCopy).toContain('Deterministic scoring');
    expect(trustCopy).toContain('Every claim has a trail');
    expect(trustCopy).toContain('Reflective, not clinical');
    expect(trustCopy).not.toMatch(/diagnose[s]? the user|clinical truth|scientifically proven/i);
  });

  it('describes the methodology as a three-step path from answers to contradictions', () => {
    expect(landingMethodSteps.map((step) => step.index)).toEqual(['01', '02', '03']);
    const [answersStep, tagsStep, contradictionsStep] = landingMethodSteps;

    expect(answersStep?.title).toContain('20 symbolic corridors');
    expect(tagsStep?.body).toContain('option contributes tags');
    expect(contradictionsStep?.body).toContain('contradictions');
  });

  it('separates included product scope from blocked future scope', () => {
    expect(landingScopeGuards).toHaveLength(6);
    expect(getIncludedScopeLabels()).toEqual([
      '20-question quiz',
      'Deterministic report',
      'Local share-card preview'
    ]);
    expect(getExcludedScopeLabels()).toEqual(['Clinical diagnosis', 'AI-generated claims', 'Backend tracking']);
  });
});
