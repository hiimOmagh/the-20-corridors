import { describe, expect, it } from "vitest";
import {
  buildHostedPublicResultPageUrlConfigFromEnv,
  evaluateFetchedHostedPublicResultPageState,
  runHostedPublicResultPageEvidence,
  type HostedFetchLike,
  type HostedFetchResponseLike,
} from "@/features/results/hostedPublicResultPageEvidence";

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

const deletedHtml = `
  <main role="main">
    <h1>Public result unavailable</h1>
    <p>This public result was deleted or removed.</p>
  </main>
`;

const expiredHtml = `
  <main role="main">
    <h1>Public result unavailable</h1>
    <p>This public result link has expired and is no longer available.</p>
  </main>
`;

const disabledHtml = `
  <main role="main">
    <h1>Public result unavailable</h1>
    <p>Public sharing is disabled. This result is not public.</p>
  </main>
`;

function createMockFetch(htmlByUrl: Record<string, { readonly status: number; readonly html: string }>): HostedFetchLike {
  return async (url: string): Promise<HostedFetchResponseLike> => {
    const response = htmlByUrl[url];

    if (response === undefined) {
      throw new Error(`Unexpected test URL: ${url}`);
    }

    return {
      status: response.status,
      url,
      text: async () => response.html,
    };
  };
}

describe("hosted public result page evidence helper", () => {
  it("passes renderable, not-found, and configured unavailable hosted states", async () => {
    const config = buildHostedPublicResultPageUrlConfigFromEnv({
      PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL: "https://example.test/r/demo-public-result",
      PHASE10_2_HOSTED_NOT_FOUND_PUBLIC_RESULT_URL: "https://example.test/r/missing-public-result",
      PHASE10_2_HOSTED_DELETED_PUBLIC_RESULT_URL: "https://example.test/r/deleted-public-result",
      PHASE10_2_HOSTED_EXPIRED_PUBLIC_RESULT_URL: "https://example.test/r/expired-public-result",
      PHASE10_2_HOSTED_DISABLED_PUBLIC_RESULT_URL: "https://example.test/r/disabled-public-result",
    });
    const report = await runHostedPublicResultPageEvidence(
      config,
      createMockFetch({
        "https://example.test/r/demo-public-result": { status: 200, html: renderableHtml },
        "https://example.test/r/missing-public-result": { status: 404, html: notFoundHtml },
        "https://example.test/r/deleted-public-result": { status: 410, html: deletedHtml },
        "https://example.test/r/expired-public-result": { status: 410, html: expiredHtml },
        "https://example.test/r/disabled-public-result": { status: 503, html: disabledHtml },
      }),
    );

    expect(report.requiredUrlsConfigured).toBe(true);
    expect(report.states.renderable.passed).toBe(true);
    expect(report.states.notFound.passed).toBe(true);
    expect(report.states.deleted?.passed).toBe(true);
    expect(report.states.expired?.passed).toBe(true);
    expect(report.states.disabled?.passed).toBe(true);
    expect(report.optionalStatesConfigured).toEqual(["deleted", "expired", "disabled"]);
    expect(report.optionalStatesDeferred).toEqual([]);
    expect(report.allConfiguredStatesPassed).toBe(true);
  });

  it("derives a safe not-found URL from the hosted base URL", () => {
    const config = buildHostedPublicResultPageUrlConfigFromEnv({
      PHASE10_2_HOSTED_BASE_URL: "https://example.test",
      PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL: "https://example.test/r/demo-public-result",
    });

    expect(config.notFoundUrl).toBe("https://example.test/r/phase10-2-missing-public-result-id");
    expect(config.expectedOrigin).toBe("https://example.test");
  });

  it("fails when a hosted public result URL exposes raw answer query data", () => {
    const result = evaluateFetchedHostedPublicResultPageState(
      {
        state: "renderable",
        url: "https://example.test/r/demo-public-result?answers=A,B,C",
        required: true,
      },
      { expectedOrigin: "https://example.test" },
      { status: 200, url: "https://example.test/r/demo-public-result?answers=A,B,C", text: async () => renderableHtml },
      renderableHtml,
    );

    expect(result.noRawAnswersInUrl).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("fails when unavailable hosted states expose share or copy actions", () => {
    const result = evaluateFetchedHostedPublicResultPageState(
      {
        state: "not-found",
        url: "https://example.test/r/missing-public-result",
        required: true,
      },
      { expectedOrigin: "https://example.test" },
      {
        status: 404,
        url: "https://example.test/r/missing-public-result",
        text: async () => `${notFoundHtml}<button>Copy link</button>`,
      },
      `${notFoundHtml}<button>Copy link</button>`,
    );

    expect(result.shareCopySuppressed).toBe(false);
    expect(result.passed).toBe(false);
  });
});
