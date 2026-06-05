'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { CorridorsPublicResultDto } from '@/core';
import {
  clearCorridorsResultFromSessionStorage,
  readCorridorsResultFromSessionStorage,
  type StoredCorridorsResultState
} from '@/features/quiz/quizFlow';

export function ResultsClient() {
  const [result, setResult] = useState<CorridorsPublicResultDto | null>(null);
  const [storageState, setStorageState] = useState<StoredCorridorsResultState>({ status: 'empty' });
  const [loaded, setLoaded] = useState(false);

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

  if (!loaded) {
    return (
      <main className="page-shell result-shell">
        <section className="panel result-card">Loading result…</section>
      </main>
    );
  }

  if (storageState.status === 'invalid') {
    return (
      <main className="page-shell result-shell">
        <section className="panel result-card">
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
        <section className="panel result-card">
          <p className="kicker">No local result</p>
          <h2>No corridor map found.</h2>
          <p className="lede">Complete the 20 questions first. Phase 2.1 stores a versioned result only in this browser session.</p>
          <Link className="button" href="/quiz">Start the corridors</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell result-shell">
      <section className="panel result-card" aria-labelledby="result-title">
        <p className="kicker">Deterministic result</p>
        <h2 id="result-title">{result.archetype.title}</h2>
        <p className="lede">{result.report.overview.patternSummary}</p>
        <div className="result-grid">
          <div className="metric-grid">
            <Metric label="Confidence" value={result.confidenceBand} />
            <Metric label="Deep motive" value={result.deepMotive.label} />
            <Metric label="Runner-up" value={`${result.runnerUp.title} · ${result.runnerUp.gapBand}`} />
          </div>
          <div className="metric-grid">
            {result.dominantTraits.slice(0, 3).map((trait) => (
              <Metric key={trait.code} label={trait.code} value={trait.label} />
            ))}
          </div>
        </div>
        <h3 style={{ marginTop: 28 }}>Main contradiction</h3>
        <p className="muted">
          {result.contradictions[0]
            ? `${result.contradictions[0].title}: ${result.contradictions[0].tension}`
            : 'No strong contradiction was detected in this run.'}
        </p>
        <div className="actions">
          <Link className="button" href="/quiz">Retake</Link>
          <button className="button secondary" onClick={clearStoredResult} type="button">Clear local result</button>
          <Link className="button secondary" href="/">Home</Link>
        </div>
        <p className="small" style={{ marginTop: 24 }}>
          Phase 2.1 hardens the quiz and session handoff. The full report UI remains a later milestone.
        </p>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <article className="metric-card">
      <h3>{label}</h3>
      <p className="muted">{value}</p>
    </article>
  );
}
