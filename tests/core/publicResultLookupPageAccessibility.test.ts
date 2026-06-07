import { describe, expect, it } from 'vitest';
import { buildPublicResultLookupPageAccessibility, summarizePublicResultLookupPageAccessibilityRules } from '../../src/core/public-link/publicResultLookupPageAccessibility';
import type { PublicResultDto } from '../../src/core/public-link/publicResultDto';
import { buildPublicResultShareCopyUx } from '../../src/core/public-link/publicResultShareCopyUx';

const sampleDto = {
  schemaVersion: 'public-result-dto-v1',
  resultId: 'result-accessibility-test',
  archetype: {
    id: 'observer-strategist',
    title: 'The Observer Strategist',
    summary: 'A careful public summary.'
  },
  confidenceBand: 'high',
  deepMotive: {
    id: 'clarity-control',
    label: 'Clarity and control'
  },
  reportOverview: {
    patternSummary: 'A DTO-only overview.',
    primaryAxis: 'Agency'
  },
  axisSummaries: [],
  createdAt: '2026-06-07T00:00:00.000Z',
  expiresAt: '2026-07-07T00:00:00.000Z'
} as unknown as PublicResultDto;

describe('public result lookup page accessibility semantics', () => {
  it('labels renderable public result regions and share/copy help text', () => {
    const shareCopy = buildPublicResultShareCopyUx({
      status: 'public-result-page-renderable',
      httpStatus: 200,
      dto: sampleDto,
      publicPath: '/r/accessibility-test'
    });

    const accessibility = buildPublicResultLookupPageAccessibility({
      status: 'public-result-page-renderable',
      httpStatus: 200,
      dto: sampleDto,
      shareCopy
    });

    expect(accessibility.hasExplicitMainLandmark).toBe(true);
    expect(accessibility.hasAccessibleHeadingHierarchy).toBe(true);
    expect(accessibility.mainLandmarkLabel).toBe('Public result lookup page');
    expect(accessibility.statusRole).toBe('status');
    expect(accessibility.statusAriaLive).toBe('polite');
    expect(accessibility.factsRegionLabel).toBe('Public result facts');
    expect(accessibility.overviewRegionLabel).toBe('Public result overview');
    expect(accessibility.axisRegionLabel).toBe('Public result axis summaries');
    expect(accessibility.shareRegionLabel).toBe('Share public result');
    expect(accessibility.shareActionAriaLabel).toContain('DTO-only public summary');
    expect(accessibility.shareHelpText).toContain('do not expose a copy action');
    expect(accessibility.unavailableStateNonActionable).toBe(false);
    expect(accessibility.rawAnswersExposed).toBe(false);
    expect(accessibility.rawDeleteTokenExposed).toBe(false);
  });

  it('keeps unavailable states non-actionable', () => {
    const shareCopy = buildPublicResultShareCopyUx({
      status: 'public-result-page-not-found',
      httpStatus: 404,
      dto: null,
      publicPath: '/r/missing'
    });

    const accessibility = buildPublicResultLookupPageAccessibility({
      status: 'public-result-page-not-found',
      httpStatus: 404,
      dto: null,
      shareCopy
    });

    expect(accessibility.tone).toBe('not-found');
    expect(accessibility.statusRole).toBe('status');
    expect(accessibility.statusAriaLive).toBe('polite');
    expect(accessibility.shareRegionLabel).toBe('Share action unavailable');
    expect(accessibility.unavailableStateNonActionable).toBe(true);
  });

  it('uses assertive alert semantics for operational failures', () => {
    const shareCopy = buildPublicResultShareCopyUx({
      status: 'public-result-page-storage-unavailable',
      httpStatus: 503,
      dto: null,
      publicPath: '/r/storage-down'
    });

    const accessibility = buildPublicResultLookupPageAccessibility({
      status: 'public-result-page-storage-unavailable',
      httpStatus: 503,
      dto: null,
      shareCopy
    });

    expect(accessibility.tone).toBe('storage-unavailable');
    expect(accessibility.statusRole).toBe('alert');
    expect(accessibility.statusAriaLive).toBe('assertive');
    expect(accessibility.statusRegionLabel).toBe('Public result lookup error status');
    expect(accessibility.unavailableStateNonActionable).toBe(true);
  });

  it('summarizes accessibility rules without persistence or smoke changes', () => {
    const rules = summarizePublicResultLookupPageAccessibilityRules();

    expect(rules).toContain('phase:phase-9.2-public-result-page-accessibility-semantics-polish');
    expect(rules).toContain('accessibility-semantics-only-no-persistence-change');
    expect(rules).toContain('database-binding-unchanged');
    expect(rules).toContain('operational-smoke-unchanged');
  });
});
