import { describe, expect, it } from 'vitest';
import {
  ALLOWED_PUBLIC_RESULT_FIELDS,
  FORBIDDEN_PUBLIC_RESULT_FIELDS,
  PUBLIC_LINK_PERSISTENCE_POLICY,
  PUBLIC_LINK_SMOKE_EXPECTATIONS,
  runPublicLinkPrivacy
} from '../../src/core/release/publicLinkPrivacy';

const report = runPublicLinkPrivacy();

describe('public result link privacy contract', () => {
  it('passes all Phase 5.0 contract-only privacy gates', () => {
    expect(report.gates).toMatchObject({
      phase4ClosurePassed: true,
      privacyScriptExists: true,
      validateScriptRunsPublicLinkPrivacy: true,
      privacyContractDocExists: true,
      phase50StatusDocExists: true,
      phase5TransitionDocExists: true,
      publicResultDtoMinimizationDefined: true,
      anonymousResultIdPolicyDefined: true,
      rawAnswerExclusionDefined: true,
      deleteAndExpiryExpectationsDefined: true,
      publicLinkSmokeGateExpectationsDefined: true,
      noBackendImplementationYet: true,
      noDatabaseAuthPaymentAiImplementationYet: true,
      noRawAnswerPublicLinkImplementation: true,
      noFullResultSerializationPublicLinkImplementation: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('defines a minimized public DTO and explicit forbidden private fields', () => {
    expect(ALLOWED_PUBLIC_RESULT_FIELDS).toContain('resultId');
    expect(ALLOWED_PUBLIC_RESULT_FIELDS).toContain('shareCard');
    expect(ALLOWED_PUBLIC_RESULT_FIELDS).not.toContain('answers');
    expect(FORBIDDEN_PUBLIC_RESULT_FIELDS).toContain('answers');
    expect(FORBIDDEN_PUBLIC_RESULT_FIELDS).toContain('tagScores');
    expect(FORBIDDEN_PUBLIC_RESULT_FIELDS).toContain('ipAddress');
    expect(report.coverage.allowedFieldCount).toBeGreaterThanOrEqual(10);
    expect(report.coverage.forbiddenFieldCount).toBeGreaterThanOrEqual(10);
  });

  it('locks anonymous persistence, deletion, expiry, and no-account expectations', () => {
    expect(PUBLIC_LINK_PERSISTENCE_POLICY).toContain('anonymous-id-only');
    expect(PUBLIC_LINK_PERSISTENCE_POLICY).toContain('raw-answers-never-persisted');
    expect(PUBLIC_LINK_PERSISTENCE_POLICY).toContain('delete-token-required');
    expect(PUBLIC_LINK_PERSISTENCE_POLICY).toContain('default-expiry-required');
    expect(PUBLIC_LINK_PERSISTENCE_POLICY).toContain('no-account-required');
  });

  it('defines future public-link smoke gates before backend implementation', () => {
    expect(PUBLIC_LINK_SMOKE_EXPECTATIONS).toContain('public-link-route-loads-by-anonymous-id');
    expect(PUBLIC_LINK_SMOKE_EXPECTATIONS).toContain('raw-answer-strings-absent-from-public-payload');
    expect(PUBLIC_LINK_SMOKE_EXPECTATIONS).toContain('expired-result-renders-expired-state');
    expect(PUBLIC_LINK_SMOKE_EXPECTATIONS).toContain('deleted-result-renders-deleted-state');
    expect(report.implementationScan.blockedImplementationPaths).toEqual([]);
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
  });
});
