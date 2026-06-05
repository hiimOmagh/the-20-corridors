export interface ReportSectionAnchor {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
}

export interface ResultStateCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly detail?: string;
  readonly primaryActionLabel: string;
  readonly secondaryActionLabel?: string;
}

export const REPORT_SECTION_ANCHORS: readonly ReportSectionAnchor[] = [
  {
    id: 'dominant-traits',
    label: 'Top traits',
    shortLabel: 'Traits',
    description: 'Strongest repeated evidence signals.'
  },
  {
    id: 'axis-map',
    label: 'Axis map',
    shortLabel: 'Axes',
    description: 'Six deterministic interpretation axes.'
  },
  {
    id: 'contradiction-map',
    label: 'Contradictions',
    shortLabel: 'Tensions',
    description: 'Internal pattern conflicts and pull directions.'
  },
  {
    id: 'practical-map',
    label: 'Practical map',
    shortLabel: 'Practical',
    description: 'Strengths, failure modes, and growth directions.'
  },
  {
    id: 'evidence-digest',
    label: 'Evidence digest',
    shortLabel: 'Evidence',
    description: 'Answer references used by the report.'
  },
  {
    id: 'trust-guard',
    label: 'Trust guard',
    shortLabel: 'Trust',
    description: 'Disproven-if conditions and non-clinical limits.'
  },
  {
    id: 'local-feedback',
    label: 'Local feedback',
    shortLabel: 'Feedback',
    description: 'Local-only feedback UX stub; no persistence or telemetry.'
  },
  {
    id: 'share-summary',
    label: 'Share summary',
    shortLabel: 'Share',
    description: 'Local copy-ready summary text.'
  }
];

export function buildMobileResultSummary(input: Readonly<{
  archetypeTitle: string;
  confidence: string;
  deepMotive: string;
  contradictionTitle?: string;
}>): readonly string[] {
  return [
    `Archetype: ${input.archetypeTitle}`,
    `Confidence: ${input.confidence}`,
    `Deep motive: ${input.deepMotive}`,
    `Main tension: ${input.contradictionTitle ?? 'No dominant contradiction'}`
  ];
}

export function getResultStateCopy(
  state: 'loading' | 'empty' | 'invalid',
  detail?: string
): ResultStateCopy {
  if (state === 'loading') {
    return {
      eyebrow: 'Reading local session',
      title: 'Loading corridor map…',
      description: 'The result is being read from this browser session. No backend or account is involved.',
      primaryActionLabel: 'Loading'
    };
  }

  if (state === 'invalid') {
    return {
      eyebrow: 'Stored result invalid',
      title: 'The local corridor map could not be read.',
      description:
        'The saved browser session is missing fields or uses an unsupported schema. Clear it and take the corridors again.',
      ...(detail ? { detail } : {}),
      primaryActionLabel: 'Retake',
      secondaryActionLabel: 'Clear local result'
    };
  }

  return {
    eyebrow: 'No local result',
    title: 'No corridor map found.',
    description:
      'Complete the 20 questions first. Phase 2.3 still stores a versioned result only in this browser session.',
    primaryActionLabel: 'Start the corridors'
  };
}
