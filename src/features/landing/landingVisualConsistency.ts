export type LandingSectionTone = 'threshold' | 'signal' | 'echo' | 'safety' | 'void';

export interface LandingSectionIndexItem {
  readonly index: string;
  readonly label: string;
  readonly href: string;
  readonly tone: LandingSectionTone;
}

export interface LandingContinuityMarker {
  readonly label: string;
  readonly value: string;
  readonly tone: LandingSectionTone;
}

export interface LandingTrustSignal {
  readonly label: string;
  readonly value: string;
}

export const landingSectionIndex: readonly LandingSectionIndexItem[] = [
  { index: '01', label: 'Promise', href: '#landing-title', tone: 'threshold' },
  { index: '02', label: 'Identity', href: '#visual-system-title', tone: 'signal' },
  { index: '03', label: 'Trust', href: '#trust-title', tone: 'echo' },
  { index: '04', label: 'Method', href: '#method-title', tone: 'safety' },
  { index: '05', label: 'Scope', href: '#scope-title', tone: 'void' }
] as const;

export const landingContinuityMarkers: readonly LandingContinuityMarker[] = [
  { label: 'Mode', value: 'Local prototype', tone: 'signal' },
  { label: 'Engine', value: 'Deterministic', tone: 'threshold' },
  { label: 'Trust', value: 'Non-clinical', tone: 'safety' }
] as const;

export const landingTrustSignals: readonly LandingTrustSignal[] = [
  { label: '20 corridors', value: 'fixed flow' },
  { label: '6 axes', value: 'report spine' },
  { label: '0 backend', value: 'local only' }
] as const;

export function getLandingSectionLabels(): readonly string[] {
  return landingSectionIndex.map((section) => section.label);
}

export function getLandingPrimaryContinuityValues(): readonly string[] {
  return landingContinuityMarkers.map((marker) => marker.value);
}

export function getLandingToneClass(tone: LandingSectionTone): string {
  return `landing-tone-${tone}`;
}

export function getLandingScopeSummary(includedCount: number, excludedCount: number): string {
  return `${includedCount} included / ${excludedCount} blocked`;
}
