export interface LandingTrustCard {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}

export interface LandingMethodStep {
  readonly index: string;
  readonly title: string;
  readonly body: string;
}

export interface LandingScopeGuard {
  readonly label: string;
  readonly status: 'included' | 'excluded';
}

export interface LandingCta {
  readonly label: string;
  readonly href: string;
  readonly variant: 'primary' | 'secondary';
}

export const landingCtas: readonly LandingCta[] = [
  {
    label: 'Start the corridors',
    href: '/quiz',
    variant: 'primary'
  },
  {
    label: 'View saved result',
    href: '/results',
    variant: 'secondary'
  }
] as const;

export const landingTrustCards: readonly LandingTrustCard[] = [
  {
    eyebrow: 'Engine first',
    title: 'Deterministic scoring',
    body: 'The same 20 answers always produce the same structured result. The UI does not invent the profile.'
  },
  {
    eyebrow: 'Evidence linked',
    title: 'Every claim has a trail',
    body: 'Reports are built from answer-specific tags, axis signals, contradiction rules, and question evidence.'
  },
  {
    eyebrow: 'Trust boundary',
    title: 'Reflective, not clinical',
    body: 'The game describes symbolic decision patterns. It does not diagnose, treat, or certify psychological truth.'
  }
] as const;

export const landingMethodSteps: readonly LandingMethodStep[] = [
  {
    index: '01',
    title: 'Answer 20 symbolic corridors',
    body: 'Choose one A/B/C/D option per scenario. Fast instinctive answers work better than over-optimized answers.'
  },
  {
    index: '02',
    title: 'Map option-specific evidence',
    body: 'Each selected option contributes tags such as exploration, safety, control, observation, sociality, or meaning.'
  },
  {
    index: '03',
    title: 'Resolve axes and contradictions',
    body: 'The engine calculates dominant axes, detects contradictions, and produces an archetype with falsifiers.'
  }
] as const;

export const landingScopeGuards: readonly LandingScopeGuard[] = [
  { label: '20-question quiz', status: 'included' },
  { label: 'Deterministic report', status: 'included' },
  { label: 'Local share-card preview', status: 'included' },
  { label: 'Clinical diagnosis', status: 'excluded' },
  { label: 'AI-generated claims', status: 'excluded' },
  { label: 'Backend tracking', status: 'excluded' }
] as const;

export function getIncludedScopeLabels(): string[] {
  return landingScopeGuards.filter((guard) => guard.status === 'included').map((guard) => guard.label);
}

export function getExcludedScopeLabels(): string[] {
  return landingScopeGuards.filter((guard) => guard.status === 'excluded').map((guard) => guard.label);
}
