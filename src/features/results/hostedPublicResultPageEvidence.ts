export const HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_ID =
  'phase-10.2-hosted-public-result-page-evidence' as const;

export type HostedPublicResultPageState =
  | 'renderable'
  | 'not-found'
  | 'deleted'
  | 'expired'
  | 'disabled';

export interface HostedPublicResultPageUrlConfig {
  readonly renderableUrl?: string;
  readonly notFoundUrl?: string;
  readonly deletedUrl?: string;
  readonly expiredUrl?: string;
  readonly disabledUrl?: string;
  readonly expectedOrigin?: string;
}

export interface HostedPublicResultPageStateConfig {
  readonly state: HostedPublicResultPageState;
  readonly url?: string;
  readonly required: boolean;
}

export interface HostedPublicResultPageFetchResult {
  readonly state: HostedPublicResultPageState;
  readonly url?: string;
  readonly configured: boolean;
  readonly required: boolean;
  readonly status?: number;
  readonly finalUrl?: string;
  readonly htmlLength: number;
  readonly visibleTextLength: number;
  readonly resultContentVisible: boolean;
  readonly statusCopyVisible: boolean;
  readonly shareCopyVisible: boolean;
  readonly shareCopySuppressed: boolean;
  readonly accessibilityFrameVisible: boolean;
  readonly noRawAnswersInUrl: boolean;
  readonly noRawAnswersInHtml: boolean;
  readonly noRawAnswersInVisibleText: boolean;
  readonly noRawDeleteTokenInHtml: boolean;
  readonly noRawDeleteTokenInVisibleText: boolean;
  readonly sameOriginAsExpected: boolean;
  readonly safeHttpStatus: boolean;
  readonly passed: boolean;
  readonly skippedReason?: 'optional-url-not-configured';
  readonly error?: string;
}

export interface HostedPublicResultPageEvidenceReport {
  readonly evidenceId: typeof HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_ID;
  readonly configured: boolean;
  readonly requiredUrlsConfigured: boolean;
  readonly expectedOrigin?: string;
  readonly states: {
    readonly renderable: HostedPublicResultPageFetchResult;
    readonly notFound: HostedPublicResultPageFetchResult;
    readonly deleted?: HostedPublicResultPageFetchResult;
    readonly expired?: HostedPublicResultPageFetchResult;
    readonly disabled?: HostedPublicResultPageFetchResult;
  };
  readonly optionalStatesConfigured: readonly HostedPublicResultPageState[];
  readonly optionalStatesDeferred: readonly HostedPublicResultPageState[];
  readonly allConfiguredStatesPassed: boolean;
}

export interface HostedFetchResponseLike {
  readonly status: number;
  readonly url?: string;
  text(): Promise<string>;
}

export type HostedFetchLike = (
  url: string,
  init: {
    readonly method: 'GET';
    readonly redirect: 'follow';
    readonly headers: Record<string, string>;
  }
) => Promise<HostedFetchResponseLike>;

const RAW_ANSWER_URL_PATTERNS: readonly RegExp[] = [
  /[?&](answers?|rawAnswers?|answerMap|selectedOptions?)=/i,
  /[?&](q(?:uestion)?0?\d{1,2}|a(?:nswer)?0?\d{1,2})=/i,
  /[?&](tagScores|axisScores|tagsByOption|axisEffects)=/i
];

const RAW_ANSWER_DOCUMENT_PATTERNS: readonly RegExp[] = [
  /"answers"\s*:/i,
  /"rawAnswers"\s*:/i,
  /"selectedOption"\s*:/i,
  /\bq(?:uestion)?0?\d{1,2}\s*[:=]\s*[ABCD]\b/i,
  /\banswer0?\d{1,2}\s*[:=]\s*[ABCD]\b/i,
  /\braw answer(?:s)?\b/i,
  /tagScores\s*[:=]/i,
  /axisScores\s*[:=]/i,
  /tagsByOption\s*[:=]/i,
  /axisEffects\s*[:=]/i
];

const RAW_DELETE_TOKEN_PATTERNS: readonly RegExp[] = [
  /"deleteToken"\s*:/i,
  /delete_token\s*[:=]/i,
  /raw delete token/i,
  /[?&]deleteToken=/i,
  /[?&]delete_token=/i
];

const RENDERABLE_RESULT_PATTERNS: readonly RegExp[] = [
  /\b(result|analysis|report|reading)\b/i,
  /\b(archetype|profile)\b/i,
  /\b(pattern|axis|motive|contradiction|falsifier)\b/i
];

const NON_RENDERABLE_STATUS_PATTERNS: Record<
  Exclude<HostedPublicResultPageState, 'renderable'>,
  readonly RegExp[]
> = {
  'not-found': [/\bnot found\b/i, /\bunavailable\b/i, /\bmissing\b/i],
  deleted: [/\bdeleted\b/i, /\bremoved\b/i],
  expired: [/\bexpired\b/i, /\bno longer available\b/i],
  disabled: [/\bdisabled\b/i, /\bsharing is off\b/i, /\bnot public\b/i]
};

const SHARE_COPY_PATTERNS: readonly RegExp[] = [
  /\bshare\b/i,
  /\bcopy link\b/i,
  /\bcopy result\b/i
];

const ACCESSIBILITY_FRAME_PATTERNS: readonly RegExp[] = [
  /<main\b/i,
  /role=["']main["']/i,
  /<h1\b/i,
  /role=["']heading["']/i,
  /aria-/i
];

export function buildHostedPublicResultPageUrlConfigFromEnv(
  env: Record<string, string | undefined>
): HostedPublicResultPageUrlConfig {
  const explicitRenderable = normalizeOptionalUrl(
    env.PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL
  );
  const explicitNotFound = normalizeOptionalUrl(
    env.PHASE10_2_HOSTED_NOT_FOUND_PUBLIC_RESULT_URL
  );
  const baseUrl = normalizeOptionalUrl(env.PHASE10_2_HOSTED_BASE_URL);
  const renderableUrl = explicitRenderable;
  const notFoundUrl =
    explicitNotFound ??
    (baseUrl === undefined
      ? undefined
      : joinHostedPath(baseUrl, '/r/phase10-2-missing-public-result-id'));

  const deletedUrl = normalizeOptionalUrl(env.PHASE10_2_HOSTED_DELETED_PUBLIC_RESULT_URL);
  const expiredUrl = normalizeOptionalUrl(env.PHASE10_2_HOSTED_EXPIRED_PUBLIC_RESULT_URL);
  const disabledUrl = normalizeOptionalUrl(env.PHASE10_2_HOSTED_DISABLED_PUBLIC_RESULT_URL);
  const expectedOrigin =
    normalizeOptionalUrl(env.PHASE10_2_HOSTED_EXPECTED_ORIGIN) ??
    deriveExpectedOrigin(renderableUrl ?? baseUrl);

  return {
    ...(renderableUrl === undefined ? {} : { renderableUrl }),
    ...(notFoundUrl === undefined ? {} : { notFoundUrl }),
    ...(deletedUrl === undefined ? {} : { deletedUrl }),
    ...(expiredUrl === undefined ? {} : { expiredUrl }),
    ...(disabledUrl === undefined ? {} : { disabledUrl }),
    ...(expectedOrigin === undefined ? {} : { expectedOrigin })
  };
}

export async function runHostedPublicResultPageEvidence(
  config: HostedPublicResultPageUrlConfig,
  fetcher: HostedFetchLike = defaultHostedFetch
): Promise<HostedPublicResultPageEvidenceReport> {
  const stateConfigs = buildStateConfigs(config);
  const results = await Promise.all(
    stateConfigs.map((stateConfig) => evaluateHostedPublicResultPageState(stateConfig, config, fetcher))
  );
  const resultByState = Object.fromEntries(results.map((result) => [result.state, result])) as Record<
    HostedPublicResultPageState,
    HostedPublicResultPageFetchResult
  >;
  const optionalStatesConfigured = results
    .filter((result) => !result.required && result.configured)
    .map((result) => result.state);
  const optionalStatesDeferred = results
    .filter((result) => !result.required && !result.configured)
    .map((result) => result.state);
  const requiredUrlsConfigured =
    resultByState.renderable.configured && resultByState['not-found'].configured;
  const configured = requiredUrlsConfigured;
  const configuredResults = results.filter((result) => result.configured);

  return {
    evidenceId: HOSTED_PUBLIC_RESULT_PAGE_EVIDENCE_ID,
    configured,
    requiredUrlsConfigured,
    ...(config.expectedOrigin === undefined ? {} : { expectedOrigin: config.expectedOrigin }),
    states: {
      renderable: resultByState.renderable,
      notFound: resultByState['not-found'],
      deleted: resultByState.deleted,
      expired: resultByState.expired,
      disabled: resultByState.disabled
    },
    optionalStatesConfigured,
    optionalStatesDeferred,
    allConfiguredStatesPassed:
      configured && configuredResults.length >= 2 && configuredResults.every((result) => result.passed)
  };
}

export async function evaluateHostedPublicResultPageState(
  stateConfig: HostedPublicResultPageStateConfig,
  config: HostedPublicResultPageUrlConfig,
  fetcher: HostedFetchLike = defaultHostedFetch
): Promise<HostedPublicResultPageFetchResult> {
  const requestedUrl = stateConfig.url;

  if (requestedUrl === undefined) {
    return {
      state: stateConfig.state,
      configured: false,
      required: stateConfig.required,
      htmlLength: 0,
      visibleTextLength: 0,
      resultContentVisible: false,
      statusCopyVisible: false,
      shareCopyVisible: false,
      shareCopySuppressed: true,
      accessibilityFrameVisible: false,
      noRawAnswersInUrl: true,
      noRawAnswersInHtml: true,
      noRawAnswersInVisibleText: true,
      noRawDeleteTokenInHtml: true,
      noRawDeleteTokenInVisibleText: true,
      sameOriginAsExpected: true,
      safeHttpStatus: !stateConfig.required,
      passed: !stateConfig.required,
      ...(stateConfig.required
        ? { error: 'required hosted URL is not configured' }
        : { skippedReason: 'optional-url-not-configured' as const })
    };
  }

  try {
    const response = await fetcher(requestedUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'the-20-corridors-phase10.2-hosted-evidence'
      }
    });
    const html = await response.text();
    return evaluateFetchedHostedPublicResultPageState(stateConfig, config, response, html);
  } catch (error) {
    return {
      state: stateConfig.state,
      url: requestedUrl,
      configured: true,
      required: stateConfig.required,
      htmlLength: 0,
      visibleTextLength: 0,
      resultContentVisible: false,
      statusCopyVisible: false,
      shareCopyVisible: false,
      shareCopySuppressed: false,
      accessibilityFrameVisible: false,
      noRawAnswersInUrl: hasNoRawAnswerUrlLeak(requestedUrl),
      noRawAnswersInHtml: false,
      noRawAnswersInVisibleText: false,
      noRawDeleteTokenInHtml: false,
      noRawDeleteTokenInVisibleText: false,
      sameOriginAsExpected: hasExpectedOrigin(requestedUrl, config.expectedOrigin),
      safeHttpStatus: false,
      passed: false,
      error: error instanceof Error ? error.message : 'hosted fetch failed'
    };
  }
}

export function evaluateFetchedHostedPublicResultPageState(
  stateConfig: HostedPublicResultPageStateConfig,
  config: HostedPublicResultPageUrlConfig,
  response: HostedFetchResponseLike,
  html: string
): HostedPublicResultPageFetchResult {
  const requestedUrl = stateConfig.url;
  const finalUrl = response.url ?? requestedUrl;
  const visibleText = extractVisibleText(html);
  const resultContentVisible = RENDERABLE_RESULT_PATTERNS.filter((pattern) => pattern.test(visibleText)).length >= 3;
  const statusCopyVisible =
    stateConfig.state !== 'renderable' &&
    NON_RENDERABLE_STATUS_PATTERNS[stateConfig.state].some((pattern) => pattern.test(visibleText));
  const shareCopyVisible = SHARE_COPY_PATTERNS.some((pattern) => pattern.test(visibleText));
  const accessibilityFrameVisible = ACCESSIBILITY_FRAME_PATTERNS.some((pattern) => pattern.test(html));
  const safeHttpStatus = hasExpectedStatus(stateConfig.state, response.status, statusCopyVisible);
  const noRawAnswersInUrl = hasNoRawAnswerUrlLeak(stateConfig.url) && hasNoRawAnswerUrlLeak(finalUrl);
  const noRawAnswersInHtml = hasNoRawAnswerDocumentLeak(html);
  const noRawAnswersInVisibleText = hasNoRawAnswerDocumentLeak(visibleText);
  const noRawDeleteTokenInHtml = hasNoRawDeleteTokenLeak(html);
  const noRawDeleteTokenInVisibleText = hasNoRawDeleteTokenLeak(visibleText);
  const sameOriginAsExpected = hasExpectedOrigin(stateConfig.url, config.expectedOrigin) && hasExpectedOrigin(finalUrl, config.expectedOrigin);
  const shareCopySuppressed = !shareCopyVisible;

  const stateSpecificPassed =
    stateConfig.state === 'renderable'
      ? resultContentVisible && shareCopyVisible
      : statusCopyVisible && shareCopySuppressed;

  return {
    state: stateConfig.state,
    ...(requestedUrl === undefined ? {} : { url: requestedUrl }),
    configured: true,
    required: stateConfig.required,
    status: response.status,
    ...(finalUrl === undefined ? {} : { finalUrl }),
    htmlLength: html.length,
    visibleTextLength: visibleText.length,
    resultContentVisible,
    statusCopyVisible,
    shareCopyVisible,
    shareCopySuppressed,
    accessibilityFrameVisible,
    noRawAnswersInUrl,
    noRawAnswersInHtml,
    noRawAnswersInVisibleText,
    noRawDeleteTokenInHtml,
    noRawDeleteTokenInVisibleText,
    sameOriginAsExpected,
    safeHttpStatus,
    passed:
      safeHttpStatus &&
      stateSpecificPassed &&
      accessibilityFrameVisible &&
      noRawAnswersInUrl &&
      noRawAnswersInHtml &&
      noRawAnswersInVisibleText &&
      noRawDeleteTokenInHtml &&
      noRawDeleteTokenInVisibleText &&
      sameOriginAsExpected
  };
}

function buildStateConfigs(config: HostedPublicResultPageUrlConfig): readonly HostedPublicResultPageStateConfig[] {
  return [
    buildStateConfig('renderable', config.renderableUrl, true),
    buildStateConfig('not-found', config.notFoundUrl, true),
    buildStateConfig('deleted', config.deletedUrl, false),
    buildStateConfig('expired', config.expiredUrl, false),
    buildStateConfig('disabled', config.disabledUrl, false)
  ];
}

function buildStateConfig(
  state: HostedPublicResultPageState,
  url: string | undefined,
  required: boolean
): HostedPublicResultPageStateConfig {
  return {
    state,
    required,
    ...(url === undefined ? {} : { url })
  };
}

function hasExpectedStatus(
  state: HostedPublicResultPageState,
  status: number,
  statusCopyVisible: boolean
): boolean {
  if (state === 'renderable') {
    return status >= 200 && status < 300;
  }

  return status === 404 || status === 410 || status === 503 || (status >= 200 && status < 300 && statusCopyVisible);
}

function hasNoRawAnswerUrlLeak(url: string | undefined): boolean {
  if (url === undefined) {
    return true;
  }

  return RAW_ANSWER_URL_PATTERNS.every((pattern) => !pattern.test(url));
}

function hasNoRawAnswerDocumentLeak(value: string): boolean {
  return RAW_ANSWER_DOCUMENT_PATTERNS.every((pattern) => !pattern.test(value));
}

function hasNoRawDeleteTokenLeak(value: string): boolean {
  return RAW_DELETE_TOKEN_PATTERNS.every((pattern) => !pattern.test(value));
}

function hasExpectedOrigin(url: string | undefined, expectedOrigin: string | undefined): boolean {
  if (url === undefined || expectedOrigin === undefined) {
    return true;
  }

  try {
    return new URL(url).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function deriveExpectedOrigin(url: string | undefined): string | undefined {
  if (url === undefined) {
    return undefined;
  }

  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function normalizeOptionalUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function joinHostedPath(baseUrl: string, pathname: string): string {
  const url = new URL(baseUrl);
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function extractVisibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function defaultHostedFetch(
  url: string,
  init: {
    readonly method: 'GET';
    readonly redirect: 'follow';
    readonly headers: Record<string, string>;
  }
): Promise<HostedFetchResponseLike> {
  return fetch(url, init);
}
