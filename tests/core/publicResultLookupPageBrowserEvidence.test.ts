import { describe, expect, it } from 'vitest';
import {
  buildPublicResultLookupPageBrowserEvidenceReport,
  buildPublicResultLookupPageBrowserEvidenceState,
  PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION,
  summarizePublicResultLookupPageBrowserEvidenceRules
} from '../../src/core/public-link/publicResultLookupPageBrowserEvidence';
import type { PublicResultDto } from '../../src/core/public-link/publicResultDto';

const sampleDto = {
  schemaVersion: 'public-result-dto-v1',
  resultId: 'result-browser-evidence-unit-test',
  archetype: {
    id: 'observer-strategist',
    title: 'The Observer Strategist',
    summary: 'A DTO-only public summary.'
  },
  confidenceBand: 'high',
  deepMotive: {
    id: 'clarity-control',
    label: 'Clarity and control'
  },
  reportOverview: {
    patternSummary: 'A visible overview without raw answers.',
    primaryAxis: 'Agency'
  },
  axisSummaries: [],
  createdAt: '2026-06-07T00:00:00.000Z',
  expiresAt: '2026-07-07T00:00:00.000Z'
} as unknown as PublicResultDto;

describe('public result lookup page browser evidence', () => {
  it('builds renderable browser/static evidence with visible copy and share block', () => {
    const evidence = buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'renderable',
      status: 'public-result-page-renderable',
      httpStatus: 200,
      dto: sampleDto,
      publicPath: '/r/browser-evidence-unit-test'
    });

    expect(evidence.dataBrowserEvidence).toBe('phase-9.4');
    expect(evidence.visibleText).toEqual(expect.arrayContaining(['The Observer Strategist', 'Copy public result link']));
    expect(evidence.visibleMarkupTokens).toEqual(expect.arrayContaining(['data-browser-evidence="phase-9.4"']));
    expect(evidence.shareCopyBlockVisible).toBe(true);
    expect(evidence.copyActionOffered).toBe(true);
    expect(evidence.accessibilityLandmarkVisible).toBe(true);
    expect(evidence.statusSemanticsVisible).toBe(true);
    expect(evidence.visualLayoutEvidenceVisible).toBe(true);
    expect(evidence.rawAnswersExposed).toBe(false);
    expect(evidence.rawDeleteTokenExposed).toBe(false);
  });

  it('keeps unavailable browser/static evidence non-actionable', () => {
    const evidence = buildPublicResultLookupPageBrowserEvidenceState({
      stateId: 'deleted',
      status: 'public-result-page-deleted-unavailable',
      httpStatus: 410,
      dto: null,
      publicPath: '/r/deleted'
    });

    expect(evidence.visibleText).toEqual(expect.arrayContaining(['This public result was deleted']));
    expect(evidence.shareCopyBlockVisible).toBe(false);
    expect(evidence.copyActionOffered).toBe(false);
    expect(evidence.accessibilityLandmarkVisible).toBe(true);
    expect(evidence.rawAnswersExposed).toBe(false);
    expect(evidence.rawDeleteTokenExposed).toBe(false);
  });

  it('summarizes every required public page state without persistence, database, or smoke changes', () => {
    const report = buildPublicResultLookupPageBrowserEvidenceReport();

    expect(report.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION);
    expect(report.phase).toBe(PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE);
    expect(report.stateEvidence.map((state) => state.stateId)).toEqual([
      'renderable',
      'not-found',
      'deleted',
      'expired',
      'disabled-rollback'
    ]);
    expect(report.renderableVisibleTextVerified).toBe(true);
    expect(report.notFoundVisibleTextVerified).toBe(true);
    expect(report.deletedVisibleTextVerified).toBe(true);
    expect(report.expiredVisibleTextVerified).toBe(true);
    expect(report.disabledRollbackVisibleTextVerified).toBe(true);
    expect(report.shareCopyBlockOnlyRenderable).toBe(true);
    expect(report.accessibilityLandmarksVisible).toBe(true);
    expect(report.rawAnswersExposed).toBe(false);
    expect(report.rawDeleteTokenExposed).toBe(false);
    expect(report.noPersistenceChangeSignals).toBe(true);
    expect(report.noDatabaseBindingChangeSignals).toBe(true);
    expect(report.noNetworkSmokeChangeSignals).toBe(true);
  });

  it('documents the browser evidence boundary rules', () => {
    expect(summarizePublicResultLookupPageBrowserEvidenceRules()).toEqual(
      expect.arrayContaining([
        `phase:${PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_PHASE}`,
        `schema:${PUBLIC_RESULT_LOOKUP_PAGE_BROWSER_EVIDENCE_SCHEMA_VERSION}`,
        'browser-static-evidence-only-no-playwright-runtime-required',
        'share-copy-block-appears-only-for-renderable-state',
        'persistence-unchanged',
        'database-binding-unchanged',
        'operational-smoke-unchanged'
      ])
    );
  });
});
