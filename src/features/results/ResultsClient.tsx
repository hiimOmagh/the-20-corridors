'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { CorridorsPublicResultDto } from '@/core';
import {
  clearCorridorsResultFromSessionStorage,
  readCorridorsResultFromSessionStorage,
  type StoredCorridorsResultState
} from '@/features/quiz/quizFlow';
import {
  buildResultReportViewModel,
  formatEvidenceSummary,
  type BulletDisplayItem,
  type EvidenceDisplayItem,
  type ResultReportViewModel
} from '@/features/results/resultReportViewModel';
import {
  REPORT_SECTION_ANCHORS,
  buildMobileResultSummary,
  getResultStateCopy
} from '@/features/results/resultReportPresentation';
import {
  LOCAL_FEEDBACK_FOCUS_OPTIONS,
  LOCAL_FEEDBACK_RATINGS,
  createInitialLocalFeedbackState,
  getLocalFeedbackStatusCopy,
  resetLocalFeedback,
  selectLocalFeedbackFocus,
  selectLocalFeedbackRating,
  submitLocalFeedback,
  type LocalFeedbackFocusOption,
  type LocalFeedbackOption,
  type LocalFeedbackState
} from '@/features/results/resultFeedback';
import { buildLocalShareCardPreview } from '@/features/results/resultShareCard';
import {
  exportLocalShareCardPng,
  getLocalShareImageExportStatusCopy,
  type LocalShareImageExportStatus
} from '@/features/results/resultShareImageExport';
import {
  buildResultSectionIndex,
  getAxisVisualTone,
  getContradictionVisualTone,
  getPracticalVisualTone
} from '@/features/results/resultVisualConsistency';

export function ResultsClient() {
  const [result, setResult] = useState<CorridorsPublicResultDto | null>(null);
  const [storageState, setStorageState] = useState<StoredCorridorsResultState>({ status: 'empty' });
  const [loaded, setLoaded] = useState(false);
  const [shareCopyState, setShareCopyState] = useState<'idle' | 'summary-copied' | 'card-copied' | 'failed'>('idle');
  const [shareImageExportState, setShareImageExportState] = useState<LocalShareImageExportStatus>('idle');
  const [feedbackState, setFeedbackState] = useState<LocalFeedbackState>(() => createInitialLocalFeedbackState());

  const loadStoredResult = useCallback(() => {
    const nextStorageState = readCorridorsResultFromSessionStorage(window.sessionStorage);
    setStorageState(nextStorageState);
    setResult(nextStorageState.status === 'ok' ? nextStorageState.result : null);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadStoredResult();
  }, [loadStoredResult]);

  function clearStoredResult() {
    clearCorridorsResultFromSessionStorage(window.sessionStorage);
    loadStoredResult();
  }

  async function copyShareText(text: string, copiedState: 'summary-copied' | 'card-copied') {
    if (!navigator.clipboard) {
      setShareCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareCopyState(copiedState);
    } catch {
      setShareCopyState('failed');
    }
  }

  async function exportShareCardImage(shareCard: ReturnType<typeof buildLocalShareCardPreview>) {
    setShareImageExportState('exporting');
    const exportResult = await exportLocalShareCardPng(shareCard);
    setShareImageExportState(exportResult.status);
  }

  function selectFeedbackRating(rating: LocalFeedbackOption['rating']) {
    setFeedbackState((current) => selectLocalFeedbackRating(current, rating));
  }

  function selectFeedbackFocus(focusArea: LocalFeedbackFocusOption['id']) {
    setFeedbackState((current) => selectLocalFeedbackFocus(current, focusArea));
  }

  function submitFeedbackStub() {
    setFeedbackState((current) => submitLocalFeedback(current));
  }

  function resetFeedbackStub() {
    setFeedbackState(resetLocalFeedback());
  }

  if (!loaded) {
    const loadingCopy = getResultStateCopy('loading');

    return (
      <main className="page-shell result-shell">
        <StateCard copy={loadingCopy} />
      </main>
    );
  }

  if (storageState.status === 'invalid') {
    const invalidCopy = getResultStateCopy('invalid', storageState.message);

    return (
      <main className="page-shell result-shell">
        <StateCard copy={invalidCopy} onClear={clearStoredResult} />
      </main>
    );
  }

  if (!result) {
    const emptyCopy = getResultStateCopy('empty');

    return (
      <main className="page-shell result-shell">
        <StateCard copy={emptyCopy} />
      </main>
    );
  }

  const viewModel = buildResultReportViewModel(result);
  const shareCard = buildLocalShareCardPreview(result);
  const mainContradiction = viewModel.contradictionCards[0];
  const mobileSummary = buildMobileResultSummary({
    archetypeTitle: result.archetype.title,
    confidence: result.report.overview.confidenceBand,
    deepMotive: result.deepMotive.label,
    ...(mainContradiction ? { contradictionTitle: mainContradiction.title } : {})
  });
  const sectionIndex = buildResultSectionIndex(REPORT_SECTION_ANCHORS);

  return (
    <main className="page-shell result-report-shell">
      <a className="skip-link" href="#dominant-traits">Skip to report sections</a>

      <section className="panel result-hero-card" aria-labelledby="result-title">
        <div className="result-hero-main">
          <p className="kicker">Deterministic corridor report</p>
          <h2 id="result-title">{result.archetype.title}</h2>
          <p className="lede">{result.report.overview.patternSummary}</p>
          <div className="mobile-summary-strip" aria-label="Condensed result summary">
            {mobileSummary.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="result-hero-aside" aria-label="Result summary">
          <p className="small">Main contradiction</p>
          <strong>{mainContradiction ? mainContradiction.title : 'No dominant contradiction'}</strong>
          <span>{mainContradiction ? mainContradiction.tension : 'The answer pattern did not trigger a strong tension rule.'}</span>
        </div>
      </section>

      <nav className="panel report-jump-nav visual-jump-nav" aria-label="Result report sections">
        {sectionIndex.map((anchor) => (
          <a className={`report-jump-link visual-tone-${anchor.tone}`} href={`#${anchor.id}`} key={anchor.id} title={anchor.description}>
            <span>{anchor.stepLabel}</span>
            <strong>{anchor.shortLabel}</strong>
          </a>
        ))}
      </nav>

      <section className="panel result-section-index" aria-label="Report rhythm overview">
        {sectionIndex.slice(0, 6).map((section) => (
          <a className={`section-index-card visual-tone-${section.tone}`} href={`#${section.id}`} key={section.id}>
            <span>{section.stepLabel}</span>
            <strong>{section.label}</strong>
            <small>{section.description}</small>
          </a>
        ))}
      </section>

      <section className="report-grid report-grid-four" aria-label="Headline metrics">
        {viewModel.headlineMetrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="panel report-section" id="dominant-traits" aria-labelledby="dominant-traits-heading">
        <SectionHeader
          eyebrow="Dominant evidence"
          title="Top traits"
          description="These are the strongest repeated signals surfaced by the public engine result. Each one keeps its evidence references visible."
        />
        <div className="report-grid report-grid-three">
          {viewModel.dominantTraits.map((trait) => (
            <article className="trait-card" key={trait.code}>
              <div className="trait-code">{trait.code}</div>
              <h3>{trait.label}</h3>
              <EvidencePills evidence={trait.evidence} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel report-section" id="axis-map" aria-labelledby="axis-heading">
        <SectionHeader
          eyebrow="Six-axis map"
          title="Full axis analysis"
          description="Every axis card is rendered from the deterministic report contract: band, dominant key, interpretation, and supporting evidence."
        />
        <div className="report-grid report-grid-two">
          {viewModel.axisCards.map((axisCard, index) => (
            <article className={`axis-report-card ${getAxisVisualTone(index).className}`} key={axisCard.id}>
              <div className="card-title-row">
                <h3>{axisCard.label}</h3>
                <span className="band-pill">{axisCard.band}</span>
              </div>
              <p className="small strong-muted">{axisCard.dominantLabel}</p>
              <p className="muted">{axisCard.interpretation}</p>
              <EvidencePills evidence={axisCard.evidence} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel report-section" id="contradiction-map" aria-labelledby="contradictions-heading">
        <SectionHeader
          eyebrow="Tension layer"
          title="Contradiction map"
          description="Contradictions are treated as premium signal, not noise. They explain where the same pattern pulls in two directions."
        />
        {viewModel.contradictionCards.length > 0 ? (
          <div className="report-grid report-grid-two">
            {viewModel.contradictionCards.map((contradiction, index) => (
              <article className={`contradiction-report-card ${getContradictionVisualTone(index).className}`} key={contradiction.id}>
                <div className="card-title-row">
                  <h3>{contradiction.title}</h3>
                  <span className="band-pill danger-pill">Tension</span>
                </div>
                <p className="muted">{contradiction.explanation}</p>
                <div className="callout-block">
                  <strong>Tension</strong>
                  <span>{contradiction.tension}</span>
                </div>
                <div className="callout-block">
                  <strong>Behavioral implication</strong>
                  <span>{contradiction.behavioralImplication}</span>
                </div>
                <div className="callout-block">
                  <strong>Disproven if</strong>
                  <span>{contradiction.disprovenIf}</span>
                </div>
                <EvidencePills evidence={contradiction.evidence} />
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No strong contradiction rule triggered in this run. The reading is comparatively linear.</p>
        )}
      </section>

      <section className="report-grid report-grid-three" id="practical-map" aria-label="Practical interpretation sections">
        <BulletPanel eyebrow="What works" title="Strengths" items={viewModel.strengths} toneClass={getPracticalVisualTone('strengths').className} />
        <BulletPanel eyebrow="Failure surface" title="Failure modes" items={viewModel.failureModes} toneClass={getPracticalVisualTone('failureModes').className} />
        <BulletPanel eyebrow="Operational next move" title="Growth directions" items={viewModel.growthDirections} toneClass={getPracticalVisualTone('growthDirections').className} />
      </section>

      <section className="panel report-section" id="evidence-digest" aria-labelledby="evidence-heading">
        <SectionHeader
          eyebrow="Traceability"
          title="Evidence digest"
          description="The report stays evidence-linked. These are the local answer references used by the result cards above."
        />
        <div className="evidence-grid">
          {viewModel.evidence.all.map((item) => (
            <article className="evidence-card" key={item.ref}>
              <strong>{item.ref}</strong>
              <span>{item.questionLabel} · option {item.option}</span>
              <p>{item.answerText}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel report-section" id="trust-guard" aria-labelledby="falsifier-heading">
        <SectionHeader
          eyebrow="Trust guard"
          title="Disproven-if checks"
          description="These conditions keep the report reflective and non-clinical. They explain when the reading should be treated as weaker."
        />
        <ul className="report-list">
          {viewModel.disprovenIf.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel report-section feedback-section" id="local-feedback" aria-labelledby="feedback-heading">
        <SectionHeader
          eyebrow="Local feedback stub"
          title="Did the report feel specific?"
          description="Phase 2.7 previews the future feedback experience using local component state only. Nothing is saved, sent, analyzed, or persisted."
        />
        <FeedbackPanel
          state={feedbackState}
          onReset={resetFeedbackStub}
          onSelectFocus={selectFeedbackFocus}
          onSelectRating={selectFeedbackRating}
          onSubmit={submitFeedbackStub}
        />
      </section>

      <section className="panel report-section share-section" id="share-summary" aria-labelledby="share-heading">
        <SectionHeader
          eyebrow="Local share preview"
          title="Share card"
          description="Phase 4.1 exports a local PNG from the share-card surface only. Public links, backend persistence, raw answers, and full-result serialization remain blocked."
        />
        <div className="share-preview-layout">
          <article className="local-share-card upgraded-share-card" aria-label={shareCard.ariaLabel}>
            <div className="share-card-threshold" aria-hidden="true" />
            <div className="share-card-orb primary-orb" aria-hidden="true" />
            <div className="share-card-orb secondary-orb" aria-hidden="true" />
            <div className="share-card-topline">
              <span>{shareCard.eyebrow}</span>
              <span>{shareCard.confidence}</span>
            </div>
            <div className="share-card-body">
              <p>{shareCard.subtitle}</p>
              <h3>{shareCard.title}</h3>
              <blockquote>{shareCard.pattern}</blockquote>
            </div>
            <div className="share-card-signature" aria-label="Share-card signature">
              <span>Corridor signature</span>
              <strong>{shareCard.signature}</strong>
            </div>
            <div className="share-card-traits" aria-label="Dominant share-card traits">
              {shareCard.traits.map((trait) => (
                <span key={trait.code}>{trait.label}</span>
              ))}
            </div>
            <div className="share-card-metrics" aria-label="Share-card metrics">
              {shareCard.metrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.label}</strong>
                  <span>{metric.value}</span>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>
            <div className="share-card-visual-cues" aria-label="Share-card local evidence cues">
              {shareCard.visualCues.map((cue) => (
                <span key={cue.label}><strong>{cue.label}</strong>{cue.value}</span>
              ))}
            </div>
            <p className="share-card-footer">{shareCard.footer}</p>
          </article>
          <div className="share-copy-panel">
            <h3>Copy-ready text</h3>
            <p className="muted">Use this local text for Discord or chat. It does not create a public URL or upload the result.</p>
            <pre className="share-preview">{shareCard.copyText}</pre>
            <details className="legacy-share-summary">
              <summary>Show compact legacy summary</summary>
              <pre className="share-preview">{viewModel.shareSummary}</pre>
            </details>
            <p className="share-export-boundary"><strong>Export boundary:</strong> PNG export is generated locally from this share-card summary only. It does not export the answer list, full result JSON, or a public URL.</p>
          </div>
        </div>
        <div className="actions">
          <button className="button" disabled={shareImageExportState === 'exporting'} onClick={() => void exportShareCardImage(shareCard)} type="button">Export PNG locally</button>
          <button className="button secondary" onClick={() => void copyShareText(shareCard.copyText, 'card-copied')} type="button">Copy card text</button>
          <button className="button secondary" onClick={() => void copyShareText(viewModel.shareSummary, 'summary-copied')} type="button">Copy compact summary</button>
          <Link className="button secondary" href="/quiz">Retake</Link>
          <button className="button secondary" onClick={clearStoredResult} type="button">Clear local result</button>
          <Link className="button secondary" href="/">Home</Link>
        </div>
        <p className="small live-status" aria-live="polite">
          {shareImageExportState !== 'idle'
            ? getLocalShareImageExportStatusCopy(shareImageExportState)
            : shareCopyState === 'card-copied'
              ? 'Share-card text copied to clipboard.'
              : shareCopyState === 'summary-copied'
                ? 'Compact summary copied to clipboard.'
                : shareCopyState === 'failed'
                  ? 'Clipboard copy failed. Select the text manually.'
                  : 'Local-only export surface. No backend, public result URL, external share target, or full-result export is used in this phase.'}
        </p>
      </section>
    </main>
  );
}


function StateCard({
  copy,
  onClear
}: Readonly<{
  copy: ReturnType<typeof getResultStateCopy>;
  onClear?: () => void;
}>) {
  return (
    <section className="panel result-card result-state-card polished-state-card">
      <p className="kicker">{copy.eyebrow}</p>
      <h2>{copy.title}</h2>
      <p className="lede">{copy.description}</p>
      {copy.detail ? <p className="small error-text">{copy.detail}</p> : null}
      {copy.primaryActionLabel === 'Loading' ? null : (
        <div className="actions">
          <Link className="button" href="/quiz">{copy.primaryActionLabel}</Link>
          {copy.secondaryActionLabel && onClear ? (
            <button className="button secondary" onClick={onClear} type="button">{copy.secondaryActionLabel}</button>
          ) : null}
          <Link className="button secondary" href="/">Home</Link>
        </div>
      )}
    </section>
  );
}

function SectionHeader({ eyebrow, title, description }: Readonly<{ eyebrow: string; title: string; description: string }>) {
  return (
    <div className="section-heading">
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
    </div>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <article className="metric-card report-metric-card">
      <h3>{label}</h3>
      <p>{value}</p>
      <span>{detail}</span>
    </article>
  );
}

function EvidencePills({ evidence }: Readonly<{ evidence: readonly EvidenceDisplayItem[] }>) {
  return (
    <div className="evidence-pills" title={formatEvidenceSummary(evidence)}>
      {evidence.length > 0 ? evidence.map((item) => (
        <span className="evidence-pill" key={item.ref}>{item.ref}</span>
      )) : <span className="evidence-pill muted-pill">No evidence refs</span>}
    </div>
  );
}

function BulletPanel({
  eyebrow,
  title,
  items,
  toneClass
}: Readonly<{ eyebrow: string; title: string; items: readonly BulletDisplayItem[]; toneClass: string }>) {
  return (
    <section className={`panel report-section compact-report-section ${toneClass}`}>
      <p className="kicker">{eyebrow}</p>
      <h2>{title}</h2>
      <div className="bullet-card-list">
        {items.map((item) => (
          <article className="bullet-card" key={item.title}>
            <h3>{item.title}</h3>
            <EvidencePills evidence={item.evidence} />
          </article>
        ))}
      </div>
    </section>
  );
}

function FeedbackPanel({
  state,
  onReset,
  onSelectFocus,
  onSelectRating,
  onSubmit
}: Readonly<{
  state: LocalFeedbackState;
  onReset: () => void;
  onSelectFocus: (focusArea: LocalFeedbackFocusOption['id']) => void;
  onSelectRating: (rating: LocalFeedbackOption['rating']) => void;
  onSubmit: () => void;
}>) {
  const statusCopy = getLocalFeedbackStatusCopy(state);

  return (
    <div className="feedback-panel">
      <div className="feedback-status-card" aria-live="polite">
        <p className="kicker">{statusCopy.eyebrow}</p>
        <h3>{statusCopy.title}</h3>
        <p>{statusCopy.description}</p>
      </div>

      <div className="feedback-rating-grid" aria-label="Local report-specificity rating">
        {LOCAL_FEEDBACK_RATINGS.map((option) => (
          <button
            aria-pressed={state.rating === option.rating}
            className={state.rating === option.rating ? 'feedback-rating active' : 'feedback-rating'}
            key={option.rating}
            onClick={() => onSelectRating(option.rating)}
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>

      <div className="feedback-focus-area" aria-label="Local feedback focus area">
        <p className="small strong-muted">Optional focus area</p>
        <div className="feedback-focus-grid">
          {LOCAL_FEEDBACK_FOCUS_OPTIONS.map((option) => (
            <button
              aria-pressed={state.focusArea === option.id}
              className={state.focusArea === option.id ? 'feedback-focus-chip active' : 'feedback-focus-chip'}
              key={option.id}
              onClick={() => onSelectFocus(option.id)}
              title={option.description}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="feedback-boundary-note">
        <strong>Boundary:</strong>
        <span>Local state only. No sessionStorage, localStorage, cookies, analytics event, API request, account, or database write.</span>
      </div>

      <div className="actions feedback-actions">
        <button className="button" onClick={onSubmit} type="button">Mark feedback locally</button>
        <button className="button secondary" onClick={onReset} type="button">Reset local feedback</button>
      </div>
    </div>
  );
}
