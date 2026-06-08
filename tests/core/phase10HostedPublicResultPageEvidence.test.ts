import { describe, expect, it } from "vitest";
import {
  runPhase10HostedPublicResultPageEvidenceGate,
  type Phase10HostedPublicResultPageEvidenceReport,
} from "@/core/release/phase10HostedPublicResultPageEvidence";
import type { HostedFetchLike, HostedFetchResponseLike } from "@/features/results/hostedPublicResultPageEvidence";

const renderableHtml = `
  <main aria-label="Public result">
    <h1>Your corridor result</h1>
    <section>Result report</section>
    <section>Archetype: The Observer Strategist</section>
    <section>Axis analysis, motive, contradiction, and falsifier checks</section>
    <button>Share result</button>
    <button>Copy link</button>
  </main>
`;

const notFoundHtml = `
  <main role="main">
    <h1>Public result unavailable</h1>
    <p>Public result not found. This corridor result is unavailable.</p>
  </main>
`;

function createMockFetch(): HostedFetchLike {
  return async (url: string): Promise<HostedFetchResponseLike> => {
    if (url.endsWith("/r/demo-public-result")) {
      return { status: 200, url, text: async () => renderableHtml };
    }

    if (url.endsWith("/r/missing-public-result")) {
      return { status: 404, url, text: async () => notFoundHtml };
    }

    throw new Error(`Unexpected test URL: ${url}`);
  };
}

describe("phase 10.2 hosted public result page evidence gate", () => {
  it("passes with configured hosted renderable and not-found evidence", async () => {
    const report: Phase10HostedPublicResultPageEvidenceReport = await runPhase10HostedPublicResultPageEvidenceGate({
      env: {
        PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL: "https://example.test/r/demo-public-result",
        PHASE10_2_HOSTED_NOT_FOUND_PUBLIC_RESULT_URL: "https://example.test/r/missing-public-result",
      },
      fetcher: createMockFetch(),
    });

    expect(report.gates.overallPassed).toBe(true);
    expect(report.gates.packageScriptExists).toBe(true);
    expect(report.gates.validateDoesNotRunHostedGate).toBe(true);
    expect(report.gates.phase10PublicResultPageEvidenceCurrent).toBe(true);
    expect(report.gates.hostedRequiredUrlsConfigured).toBe(true);
    expect(report.gates.hostedRenderableStatePasses).toBe(true);
    expect(report.gates.hostedNotFoundStatePasses).toBe(true);
    expect(report.gates.hostedUnavailableStatesNonActionable).toBe(true);
    expect(report.gates.hostedPublicUrlsDoNotExposeRawAnswers).toBe(true);
    expect(report.gates.hostedVisibleTextDoesNotExposeRawAnswers).toBe(true);
    expect(report.gates.hostedHtmlDoesNotExposeRawAnswers).toBe(true);
    expect(report.gates.hostedDeleteTokensRemainBlocked).toBe(true);
    expect(report.gates.hostedNetworkIsGetOnly).toBe(true);
    expect(report.gates.noPersistenceChangeSignals).toBe(true);
    expect(report.gates.noDatabaseBindingChangeSignals).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("fails safely when hosted URLs are not configured", async () => {
    const report = await runPhase10HostedPublicResultPageEvidenceGate({
      env: {},
      fetcher: createMockFetch(),
    });

    expect(report.gates.overallPassed).toBe(false);
    expect(report.issues).toContain("hostedRequiredUrlsConfigured");
    expect(report.hostedEvidence.configured).toBe(false);
  });
});
