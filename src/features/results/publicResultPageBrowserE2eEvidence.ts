export const PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID =
  'phase-10.1-public-result-page-browser-e2e-evidence' as const;

export type PublicResultPageState = 'renderable' | 'not-found' | 'deleted' | 'expired' | 'disabled';

export interface PublicResultPageStateFixture {
  readonly state: PublicResultPageState;
  readonly url: string;
  readonly visibleText: string;
  readonly landmarks: readonly string[];
  readonly headings: readonly string[];
}

export interface PublicResultPageRenderableEvidence {
  readonly state: 'renderable';
  readonly resultContentVisible: boolean;
  readonly archetypeVisible: boolean;
  readonly reportStructureVisible: boolean;
  readonly shareCopyVisible: boolean;
  readonly accessibilityLandmarksVisible: boolean;
  readonly noRawAnswersInUrl: boolean;
  readonly noRawAnswersInVisibleText: boolean;
  readonly passed: boolean;
}

export interface PublicResultPageNonRenderableEvidence {
  readonly state: Exclude<PublicResultPageState, 'renderable'>;
  readonly statusCopyVisible: boolean;
  readonly shareCopySuppressed: boolean;
  readonly accessibilityLandmarksVisible: boolean;
  readonly noRawAnswersInUrl: boolean;
  readonly noRawAnswersInVisibleText: boolean;
  readonly passed: boolean;
}

export interface PublicResultPageBrowserE2eEvidenceReport {
  readonly evidenceId: typeof PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID;
  readonly renderable: PublicResultPageRenderableEvidence;
  readonly notFound: PublicResultPageNonRenderableEvidence;
  readonly deleted: PublicResultPageNonRenderableEvidence;
  readonly expired: PublicResultPageNonRenderableEvidence;
  readonly disabled: PublicResultPageNonRenderableEvidence;
  readonly allStatesPassed: boolean;
}

const RAW_ANSWER_URL_PATTERNS: readonly RegExp[] = [
  /[?&](answers?|rawAnswers?|answerMap|selectedOptions?)=/i,
  /[?&](q(?:uestion)?0?\d{1,2}|a(?:nswer)?0?\d{1,2})=/i,
  /[?&](tagScores|axisScores|tagsByOption|axisEffects)=/i
];

const RAW_ANSWER_VISIBLE_TEXT_PATTERNS: readonly RegExp[] = [
  /"answers"\s*:/i,
  /"rawAnswers"\s*:/i,
  /"selectedOption"\s*:/i,
  /\bq(?:uestion)?0?\d{1,2}\s*[:=]\s*[ABCD]\b/i,
  /\banswer0?\d{1,2}\s*[:=]\s*[ABCD]\b/i,
  /\braw answer(?:s)?\b/i
];

const RENDERABLE_RESULT_PATTERNS: readonly RegExp[] = [
  /\b(result|analysis|report|reading)\b/i,
  /\b(archetype|profile)\b/i,
  /\b(pattern|axis|motive|contradiction)\b/i
];

const NON_RENDERABLE_STATUS_PATTERNS: Record<Exclude<PublicResultPageState, 'renderable'>, readonly RegExp[]> = {
  'not-found': [/\bnot found\b/i, /\bunavailable\b/i, /\bmissing\b/i],
  deleted: [/\bdeleted\b/i, /\bremoved\b/i],
  expired: [/\bexpired\b/i, /\bno longer available\b/i],
  disabled: [/\bdisabled\b/i, /\bsharing is off\b/i, /\bnot public\b/i]
};

const SHARE_COPY_PATTERNS: readonly RegExp[] = [/\bshare\b/i, /\bcopy link\b/i, /\bcopy result\b/i];

export function runPublicResultPageBrowserE2eEvidence(): PublicResultPageBrowserE2eEvidenceReport {
  const renderable = evaluateRenderablePublicResultState(buildRenderablePublicResultFixture());
  const notFound = evaluateNonRenderablePublicResultState(buildNotFoundPublicResultFixture());
  const deleted = evaluateNonRenderablePublicResultState(buildDeletedPublicResultFixture());
  const expired = evaluateNonRenderablePublicResultState(buildExpiredPublicResultFixture());
  const disabled = evaluateNonRenderablePublicResultState(buildDisabledPublicResultFixture());

  return {
    evidenceId: PUBLIC_RESULT_PAGE_BROWSER_E2E_EVIDENCE_ID,
    renderable,
    notFound,
    deleted,
    expired,
    disabled,
    allStatesPassed: renderable.passed && notFound.passed && deleted.passed && expired.passed && disabled.passed
  };
}

export function evaluateRenderablePublicResultState(
  fixture: PublicResultPageStateFixture
): PublicResultPageRenderableEvidence {
  const normalizedText = normalizeVisibleText(fixture.visibleText);
  const matchedResultSignals = RENDERABLE_RESULT_PATTERNS.filter((pattern) => pattern.test(normalizedText));
  const shareCopyVisible = SHARE_COPY_PATTERNS.some((pattern) => pattern.test(normalizedText));
  const accessibilityLandmarksVisible = hasAccessiblePublicResultFrame(fixture);
  const noRawAnswersInUrl = hasNoPublicRawAnswerUrlLeak(fixture.url);
  const noRawAnswersInVisibleText = hasNoPublicRawAnswerVisibleTextLeak(normalizedText);

  const evidence = {
    state: 'renderable' as const,
    resultContentVisible: matchedResultSignals.length >= 3,
    archetypeVisible: /\b(archetype|profile)\b/i.test(normalizedText),
    reportStructureVisible: /\b(axis|motive|contradiction|evidence|falsifier)\b/i.test(normalizedText),
    shareCopyVisible,
    accessibilityLandmarksVisible,
    noRawAnswersInUrl,
    noRawAnswersInVisibleText,
    passed: false
  };

  return {
    ...evidence,
    passed:
      evidence.resultContentVisible &&
      evidence.archetypeVisible &&
      evidence.reportStructureVisible &&
      evidence.shareCopyVisible &&
      evidence.accessibilityLandmarksVisible &&
      evidence.noRawAnswersInUrl &&
      evidence.noRawAnswersInVisibleText
  };
}

export function evaluateNonRenderablePublicResultState(
  fixture: PublicResultPageStateFixture
): PublicResultPageNonRenderableEvidence {
  if (fixture.state === 'renderable') {
    throw new Error('Renderable public result fixture cannot be evaluated as a non-renderable state.');
  }

  const normalizedText = normalizeVisibleText(fixture.visibleText);
  const statusPatterns = NON_RENDERABLE_STATUS_PATTERNS[fixture.state];
  const statusCopyVisible = statusPatterns.some((pattern) => pattern.test(normalizedText));
  const shareCopySuppressed = SHARE_COPY_PATTERNS.every((pattern) => !pattern.test(normalizedText));
  const accessibilityLandmarksVisible = hasAccessiblePublicResultFrame(fixture);
  const noRawAnswersInUrl = hasNoPublicRawAnswerUrlLeak(fixture.url);
  const noRawAnswersInVisibleText = hasNoPublicRawAnswerVisibleTextLeak(normalizedText);

  const evidence = {
    state: fixture.state,
    statusCopyVisible,
    shareCopySuppressed,
    accessibilityLandmarksVisible,
    noRawAnswersInUrl,
    noRawAnswersInVisibleText,
    passed: false
  };

  return {
    ...evidence,
    passed:
      evidence.statusCopyVisible &&
      evidence.shareCopySuppressed &&
      evidence.accessibilityLandmarksVisible &&
      evidence.noRawAnswersInUrl &&
      evidence.noRawAnswersInVisibleText
  };
}

export function hasNoPublicRawAnswerUrlLeak(url: string): boolean {
  return RAW_ANSWER_URL_PATTERNS.every((pattern) => !pattern.test(url));
}

export function hasNoPublicRawAnswerVisibleTextLeak(visibleText: string): boolean {
  return RAW_ANSWER_VISIBLE_TEXT_PATTERNS.every((pattern) => !pattern.test(visibleText));
}

export function buildRenderablePublicResultFixture(): PublicResultPageStateFixture {
  return {
    state: 'renderable',
    url: '/r/public-demo-id',
    landmarks: ['main', 'region:result-overview', 'region:full-report', 'region:share-card'],
    headings: ['Your corridor result', 'Archetype', 'Axis analysis', 'Contradiction map'],
    visibleText: [
      'The 20 Corridors result report',
      'Your corridor result',
      'Archetype: The Observer Strategist',
      'Pattern: controlled exploration, analysis, and motive structure',
      'Axis analysis: exploration, safety, agency, ambiguity, social distance, and deep motive',
      'Contradiction map: curiosity with controlled exposure',
      'Evidence and falsifier checks are visible in the full report',
      'Share result',
      'Copy link',
      'Retake the corridors'
    ].join(' ')
  };
}

export function buildNotFoundPublicResultFixture(): PublicResultPageStateFixture {
  return buildNonRenderableFixture(
    'not-found',
    '/r/missing-demo-id',
    'Public result not found. This corridor result may be unavailable or the link may be incorrect. Start again.'
  );
}

export function buildDeletedPublicResultFixture(): PublicResultPageStateFixture {
  return buildNonRenderableFixture(
    'deleted',
    '/r/deleted-demo-id',
    'This public result was deleted or removed. Start a new corridor run to create another result.'
  );
}

export function buildExpiredPublicResultFixture(): PublicResultPageStateFixture {
  return buildNonRenderableFixture(
    'expired',
    '/r/expired-demo-id',
    'This public result link has expired and is no longer available. Start again to create a fresh result.'
  );
}

export function buildDisabledPublicResultFixture(): PublicResultPageStateFixture {
  return buildNonRenderableFixture(
    'disabled',
    '/r/disabled-demo-id',
    'Public sharing is disabled for this result. The result is not public. Start again from the quiz.'
  );
}

function buildNonRenderableFixture(
  state: Exclude<PublicResultPageState, 'renderable'>,
  url: string,
  visibleText: string
): PublicResultPageStateFixture {
  return {
    state,
    url,
    landmarks: ['main', 'status'],
    headings: ['Public result unavailable'],
    visibleText
  };
}

function hasAccessiblePublicResultFrame(fixture: PublicResultPageStateFixture): boolean {
  return fixture.landmarks.includes('main') && fixture.headings.length > 0;
}

function normalizeVisibleText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
