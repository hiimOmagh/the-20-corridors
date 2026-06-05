export type MotionPolishTone = 'signal' | 'threshold' | 'calm' | 'danger' | 'neutral';

export type MotionPolishSurface = {
  id: string;
  label: string;
  selector: string;
  tone: MotionPolishTone;
  intent: string;
};

export type MotionPolishRule = {
  id: string;
  label: string;
  rule: string;
};

export const motionPolishSurfaces: MotionPolishSurface[] = [
  {
    id: 'primary-buttons',
    label: 'Primary actions',
    selector: '.button',
    tone: 'signal',
    intent: 'Keep CTA feedback crisp without adding route or state behavior.'
  },
  {
    id: 'option-buttons',
    label: 'Corridor options',
    selector: '.option-button',
    tone: 'threshold',
    intent: 'Give A/B/C/D choices a clear hover, focus, active, and selected response.'
  },
  {
    id: 'report-cards',
    label: 'Report cards',
    selector: '.trait-card, .axis-report-card, .contradiction-report-card',
    tone: 'calm',
    intent: 'Unify the result-page lift behavior without changing report content.'
  },
  {
    id: 'share-card',
    label: 'Local share card',
    selector: '.local-share-card',
    tone: 'threshold',
    intent: 'Keep the upgraded local card visually alive without creating image export.'
  },
  {
    id: 'feedback-controls',
    label: 'Feedback controls',
    selector: '.feedback-rating, .feedback-focus-chip',
    tone: 'neutral',
    intent: 'Improve local-only tap states while preserving the no-persistence boundary.'
  }
];

export const reducedMotionRules: MotionPolishRule[] = [
  {
    id: 'no-large-translation',
    label: 'No large transform motion',
    rule: 'Reduced-motion mode removes decorative lift and sweep transforms.'
  },
  {
    id: 'no-looping-decoration',
    label: 'No looping decorative sweeps',
    rule: 'Decorative corridor sweeps and shimmer effects are disabled or flattened.'
  },
  {
    id: 'state-still-visible',
    label: 'State remains visible',
    rule: 'Focus, selected, active, and disabled states remain visible without animation.'
  },
  {
    id: 'no-scope-expansion',
    label: 'No product-scope expansion',
    rule: 'Motion polish does not add backend, AI, auth, payment, analytics, database, or export behavior.'
  }
];

export function getMotionSurfaceClassName(tone: MotionPolishTone): string {
  return `motion-tone-${tone}`;
}

export function getMotionPolishSummary(): string {
  return `${motionPolishSurfaces.length} interactive surfaces, ${reducedMotionRules.length} reduced-motion rules`;
}

export function getReducedMotionChecklist(): string[] {
  return reducedMotionRules.map((rule) => `${rule.label}: ${rule.rule}`);
}
