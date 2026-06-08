import { describe, expect, it } from 'vitest';
import {
  buildDeletedPublicResultFixture,
  buildDisabledPublicResultFixture,
  buildExpiredPublicResultFixture,
  buildNotFoundPublicResultFixture,
  buildRenderablePublicResultFixture,
  evaluateNonRenderablePublicResultState,
  evaluateRenderablePublicResultState,
  hasNoPublicRawAnswerUrlLeak,
  hasNoPublicRawAnswerVisibleTextLeak,
  runPublicResultPageBrowserE2eEvidence
} from '@/features/results/publicResultPageBrowserE2eEvidence';

describe('public result page browser E2E evidence scenario runner', () => {
  it('proves renderable and non-renderable public result states', () => {
    const report = runPublicResultPageBrowserE2eEvidence();

    expect(report.renderable).toMatchObject({
      state: 'renderable',
      resultContentVisible: true,
      archetypeVisible: true,
      reportStructureVisible: true,
      shareCopyVisible: true,
      noRawAnswersInUrl: true,
      noRawAnswersInVisibleText: true,
      passed: true
    });
    expect(report.notFound).toMatchObject({ state: 'not-found', statusCopyVisible: true, shareCopySuppressed: true, passed: true });
    expect(report.deleted).toMatchObject({ state: 'deleted', statusCopyVisible: true, shareCopySuppressed: true, passed: true });
    expect(report.expired).toMatchObject({ state: 'expired', statusCopyVisible: true, shareCopySuppressed: true, passed: true });
    expect(report.disabled).toMatchObject({ state: 'disabled', statusCopyVisible: true, shareCopySuppressed: true, passed: true });
    expect(report.allStatesPassed).toBe(true);
  });

  it('keeps share and copy affordances renderable-only', () => {
    expect(evaluateRenderablePublicResultState(buildRenderablePublicResultFixture()).shareCopyVisible).toBe(true);
    expect(evaluateNonRenderablePublicResultState(buildNotFoundPublicResultFixture()).shareCopySuppressed).toBe(true);
    expect(evaluateNonRenderablePublicResultState(buildDeletedPublicResultFixture()).shareCopySuppressed).toBe(true);
    expect(evaluateNonRenderablePublicResultState(buildExpiredPublicResultFixture()).shareCopySuppressed).toBe(true);
    expect(evaluateNonRenderablePublicResultState(buildDisabledPublicResultFixture()).shareCopySuppressed).toBe(true);
  });

  it('blocks raw answer leakage through URLs and visible text', () => {
    expect(hasNoPublicRawAnswerUrlLeak('/r/public-demo-id')).toBe(true);
    expect(hasNoPublicRawAnswerUrlLeak('/r/public-demo-id?answers=A,B,C,D')).toBe(false);
    expect(hasNoPublicRawAnswerUrlLeak('/r/public-demo-id?q01=A')).toBe(false);
    expect(hasNoPublicRawAnswerVisibleTextLeak('Archetype report and contradiction map')).toBe(true);
    expect(hasNoPublicRawAnswerVisibleTextLeak('raw answers: q01=A q02=B')).toBe(false);
    expect(hasNoPublicRawAnswerVisibleTextLeak('{"selectedOption":"A"}')).toBe(false);
  });

  it('rejects renderable fixtures that do not expose result/report content', () => {
    const evidence = evaluateRenderablePublicResultState({
      ...buildRenderablePublicResultFixture(),
      visibleText: 'Loading result...'
    });

    expect(evidence.passed).toBe(false);
    expect(evidence.resultContentVisible).toBe(false);
  });
});
