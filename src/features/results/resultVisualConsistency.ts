import type { ReportSectionAnchor } from '@/features/results/resultReportPresentation';

export type ResultSectionTone = 'signal' | 'evidence' | 'tension' | 'practical' | 'trust' | 'local';

export interface ResultSectionIndexItem extends ReportSectionAnchor {
  readonly stepLabel: string;
  readonly tone: ResultSectionTone;
}

export interface ResultCardTone {
  readonly className: string;
  readonly label: string;
}

const SECTION_TONES: Readonly<Record<string, ResultSectionTone>> = {
  'dominant-traits': 'signal',
  'axis-map': 'evidence',
  'contradiction-map': 'tension',
  'practical-map': 'practical',
  'evidence-digest': 'evidence',
  'trust-guard': 'trust',
  'local-feedback': 'local',
  'share-summary': 'local'
};

const AXIS_TONE_ORDER = ['signal', 'evidence', 'practical', 'trust', 'tension', 'local'] as const;

export function buildResultSectionIndex(anchors: readonly ReportSectionAnchor[]): readonly ResultSectionIndexItem[] {
  return anchors.map((anchor, index) => ({
    ...anchor,
    stepLabel: `0${index + 1}`.slice(-2),
    tone: getResultSectionTone(anchor.id)
  }));
}

export function getResultSectionTone(sectionId: string): ResultSectionTone {
  return SECTION_TONES[sectionId] ?? 'evidence';
}

export function getAxisVisualTone(index: number): ResultCardTone {
  const tone = AXIS_TONE_ORDER[index % AXIS_TONE_ORDER.length] ?? 'evidence';

  return {
    className: `visual-tone visual-tone-${tone}`,
    label: tone
  };
}

export function getContradictionVisualTone(index: number): ResultCardTone {
  return {
    className: index === 0 ? 'visual-tone visual-tone-tension primary-tension-card' : 'visual-tone visual-tone-tension',
    label: index === 0 ? 'primary tension' : 'tension'
  };
}

export function getPracticalVisualTone(kind: 'strengths' | 'failureModes' | 'growthDirections'): ResultCardTone {
  const toneByKind: Record<typeof kind, ResultCardTone> = {
    strengths: { className: 'visual-tone visual-tone-signal', label: 'signal' },
    failureModes: { className: 'visual-tone visual-tone-tension', label: 'tension' },
    growthDirections: { className: 'visual-tone visual-tone-practical', label: 'practical' }
  };

  return toneByKind[kind];
}
