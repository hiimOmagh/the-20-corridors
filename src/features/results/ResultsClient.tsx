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

export function ResultsClient() {
  const [result, setResult] = useState<CorridorsPublicResultDto | null>(null);
  const [storageState, setStorageState] = useState<StoredCorridorsResultState>({ status: 'empty' });
  const [loaded, setLoaded] = useState(false);
  const [shareCopyState, setShareCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

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

  async function copyShareSummary(viewModel: ResultReportViewModel) {
    if (!navigator.clipboard) {
      setShareCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(viewModel.shareSummary);
      setShareCopyState('copied');
    } catch {
      setShareCopyState('failed');
    }
  }

  if (!loaded) {
    return (
      <main className="page-shell result-shell">
        <section className="panel result-card result-state-card">Loading result…</section>
      </main>
    );
  }

  if (storageState.status === 'invalid') {
    return (
      <main className="page-shell result-shell">
        <section className="panel result-card result-state-card">
          <p className="kicker">Stored result invalid</p>
          <h2>The local corridor map could not be read.</h2>
          <p className="lede">
            The saved browser session is missing fields or uses an unsupported schema. Clear it and take the corridors again.
          </p>
          <p className="small error-text">{storageState.message}</p>
          <div className="actions">
            <button className="button secondary" onClick={clearStoredResult} type="button">Clear local result</button>
            <Link className="button" href="/quiz">Retake</Link>
          </div>
        </section>
      </main>
    );
  }

  if (!result) {
    return (
      <main className="page-shell result-shell">
        <section className="panel result-card result-state-card">
          <p className="kicker">No local result</p>
          <h2>No corridor map found.</h2>
          <p className="lede">Complete the 20 questions first. Phase 2.2 still stores a versioned result only in this browser session.</p>
          <Link className="button" href="/quiz">Start the corridors</Link>
        </section>
      </main>
    );
  }

  const viewModel = buildResultReportViewModel(result);
  const mainContradiction = viewModel.contradictionCards[0];

  return (
    <main className="page-shell result-report-shell">
      <section className="panel result-hero-card" aria-labelledby="result-title">
        <div>
          <p className="kicker">Deterministic corridor report</p>
          <h2 id="result-title">{result.archetype.title}</h2>
          <p className="lede">{result.report.overview.patternSummary}</p>
        </div>
        <div className="result-hero-aside" aria-label="Result summary">
          <p className="small">Main contradiction</p>
          <strong>{mainContradiction ? mainContradiction.title : 'No dominant contradiction'}</strong>
          <span>{mainContradiction ? mainContradiction.tension : 'The answer pattern did not trigger a strong tension rule.'}</span>
        </div>
      </section>

      <section className="report-grid report-grid-four" aria-label="Headline metrics">
        {viewModel.headlineMetrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
        ))}
      </section>

      <section className="panel report-section" aria-labelledby="dominant-traits-heading">
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

      <section className="panel report-section" aria-labelledby="axis-heading">
        <SectionHeader
          eyebrow="Six-axis map"
          title="Full axis analysis"
          description="Every axis card is rendered from the deterministic report contract: band, dominant key, interpretation, and supporting evidence."
        />
        <div className="report-grid report-grid-two">
          {viewModel.axisCards.map((axisCard) => (
            <article className="axis-report-card" key={axisCard.id}>
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

      <section className="panel report-section" aria-labelledby="contradictions-heading">
        <SectionHeader
          eyebrow="Tension layer"
          title="Contradiction map"
          description="Contradictions are treated as premium signal, not noise. They explain where the same pattern pulls in two directions."
        />
        {viewModel.contradictionCards.length > 0 ? (
          <div className="report-grid report-grid-two">
            {viewModel.contradictionCards.map((contradiction) => (
              <article className="contradiction-report-card" key={contradiction.id}>
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

      <section className="report-grid report-grid-three" aria-label="Practical interpretation sections">
        <BulletPanel eyebrow="What works" title="Strengths" items={viewModel.strengths} />
        <BulletPanel eyebrow="Failure surface" title="Failure modes" items={viewModel.failureModes} />
        <BulletPanel eyebrow="Operational next move" title="Growth directions" items={viewModel.growthDirections} />
      </section>

      <section className="panel report-section" aria-labelledby="evidence-heading">
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

      <section className="panel report-section" aria-labelledby="falsifier-heading">
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

      <section className="panel report-section share-section" aria-labelledby="share-heading">
        <SectionHeader
          eyebrow="Local share draft"
          title="Share summary"
          description="Phase 2.2 provides copy-ready text only. Public links, images, and backend persistence remain blocked for later phases."
        />
        <pre className="share-preview">{viewModel.shareSummary}</pre>
        <div className="actions">
          <button className="button" onClick={() => void copyShareSummary(viewModel)} type="button">Copy summary</button>
          <Link className="button secondary" href="/quiz">Retake</Link>
          <button className="button secondary" onClick={clearStoredResult} type="button">Clear local result</button>
          <Link className="button secondary" href="/">Home</Link>
        </div>
        <p className="small live-status" aria-live="polite">
          {shareCopyState === 'copied'
            ? 'Summary copied to clipboard.'
            : shareCopyState === 'failed'
              ? 'Clipboard copy failed. Select the text manually.'
              : 'No backend, public result URL, or external share target is used in this phase.'}
        </p>
      </section>
    </main>
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

function BulletPanel({ eyebrow, title, items }: Readonly<{ eyebrow: string; title: string; items: readonly BulletDisplayItem[] }>) {
  return (
    <section className="panel report-section compact-report-section">
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
