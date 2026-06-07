import { describe, expect, it } from 'vitest';
import type { PublicResultDto } from '../../src/core/public-link/publicResultDto';
import {
  buildPublicResultLookupPageVisualLayout,
  PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION,
  summarizePublicResultLookupPageVisualLayoutRules
} from '../../src/core/public-link/publicResultLookupPageVisualLayout';
import { buildPublicResultShareCopyUx } from '../../src/core/public-link/publicResultShareCopyUx';

const sampleDto = {
  schemaVersion: 'public-result-dto-v1',
  resultId: 'result-visual-layout-test',
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

describe('public result lookup page visual layout polish', () => {
  it('builds responsive visual hierarchy for renderable public results', () => {
    const shareCopy = buildPublicResultShareCopyUx({
      status: 'public-result-page-renderable',
      httpStatus: 200,
      dto: sampleDto,
      publicPath: '/r/visual-layout-test'
    });

    const layout = buildPublicResultLookupPageVisualLayout({
      status: 'public-result-page-renderable',
      httpStatus: 200,
      dto: sampleDto,
      shareCopy
    });

    expect(layout.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION);
    expect(layout.phase).toBe(PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE);
    expect(layout.dataVisualLayout).toBe('phase-9.3');
    expect(layout.responsiveLayout).toBe(true);
    expect(layout.readableHierarchy).toBe(true);
    expect(layout.mobileLayoutUsable).toBe(true);
    expect(layout.shareBlockVisuallyDistinct).toBe(true);
    expect(layout.shellClassName).toContain('sm:px-6');
    expect(layout.shellClassName).toContain('lg:px-8');
    expect(layout.renderableArticleClassName).toContain('max-w-5xl');
    expect(layout.factsGridClassName).toContain('md:grid-cols-3');
    expect(layout.axisGridClassName).toContain('md:grid-cols-2');
    expect(layout.sharePanelClassName).toContain('border-emerald-300/20');
    expect(layout.rawAnswersExposed).toBe(false);
    expect(layout.rawDeleteTokenExposed).toBe(false);
  });

  it('keeps unavailable states visually readable and non-share-oriented', () => {
    const shareCopy = buildPublicResultShareCopyUx({
      status: 'public-result-page-not-found',
      httpStatus: 404,
      dto: null,
      publicPath: '/r/missing'
    });

    const layout = buildPublicResultLookupPageVisualLayout({
      status: 'public-result-page-not-found',
      httpStatus: 404,
      dto: null,
      shareCopy
    });

    expect(layout.tone).toBe('not-found');
    expect(layout.unavailableStateReadable).toBe(true);
    expect(layout.shareBlockVisuallyDistinct).toBe(false);
    expect(layout.unavailablePanelClassName).toContain('max-w-3xl');
    expect(layout.unavailableTitleClassName).toContain('sm:text-4xl');
    expect(layout.statusPillClassName).toContain('rounded-2xl');
  });

  it('summarizes visual layout rules without changing persistence, binding, or smoke behavior', () => {
    expect(summarizePublicResultLookupPageVisualLayoutRules()).toEqual(
      expect.arrayContaining([
        `phase:${PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_PHASE}`,
        `schema:${PUBLIC_RESULT_LOOKUP_PAGE_VISUAL_LAYOUT_SCHEMA_VERSION}`,
        'visual-layout-only-no-persistence-change',
        'mobile-layout-remains-usable-with-stacked-content',
        'share-copy-block-is-visually-distinct',
        'database-binding-unchanged',
        'operational-smoke-unchanged'
      ])
    );
  });
});
