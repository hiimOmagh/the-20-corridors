'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  clearCorridorsResultFromSessionStorage,
  readCorridorsResultFromSessionStorage,
  type StoredCorridorsResultState
} from '@/features/quiz/quizFlow';
import {
  LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE,
  buildLocalPublicResultPreview,
  getPublicLinkPreviewStateCopy,
  isPublicLinkPreviewPayloadSafe,
  type LocalPublicLinkPreviewModel
} from './publicLinkPreview';

export function PublicLinkPreviewClient() {
  const [loaded, setLoaded] = useState(false);
  const [storageState, setStorageState] = useState<StoredCorridorsResultState>({ status: 'empty' });

  const loadStoredResult = useCallback(() => {
    const nextStorageState = readCorridorsResultFromSessionStorage(window.sessionStorage);
    setStorageState(nextStorageState);
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
    return <PreviewStateCard status="loading" />;
  }

  if (storageState.status === 'invalid') {
    return <PreviewStateCard status="invalid" detail={storageState.message} onClear={clearStoredResult} />;
  }

  if (storageState.status !== 'ok') {
    return <PreviewStateCard status="empty" />;
  }

  const preview = buildLocalPublicResultPreview(storageState.result);

  return <PublicLinkPreviewReport preview={preview} />;
}

function PreviewStateCard({
  status,
  detail,
  onClear
}: Readonly<{
  status: 'loading' | 'empty' | 'invalid';
  detail?: string;
  onClear?: () => void;
}>) {
  const copy = getPublicLinkPreviewStateCopy(status, detail);

  return (
    <main className="page-shell public-preview-shell">
      <section className="panel polished-state-card public-preview-state" aria-labelledby="public-preview-state-title">
        <p className="kicker">Local public-link preview</p>
        <h2 id="public-preview-state-title">{copy.title}</h2>
        <p className="lede">{copy.description}</p>
        <div className="button-row">
          <Link className="button" href="/quiz">{copy.actionLabel}</Link>
          <Link className="button secondary" href="/results">Open local result</Link>
          {onClear ? (
            <button className="button danger" onClick={onClear} type="button">Clear local result</button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function PublicLinkPreviewReport({ preview }: Readonly<{ preview: LocalPublicLinkPreviewModel }>) {
  const payloadSafe = isPublicLinkPreviewPayloadSafe(preview.dto);

  return (
    <main className="page-shell public-preview-shell">
      <section className="panel public-preview-hero" aria-labelledby="public-preview-title">
        <div>
          <p className="kicker">{preview.headline.eyebrow}</p>
          <h2 id="public-preview-title">{preview.headline.title}</h2>
          <p className="lede">{preview.headline.summary}</p>
          <div className="public-preview-strip" aria-label="Preview state">
            <span>{preview.headline.confidence} consistency</span>
            <span>{preview.axisCountLabel}</span>
            <span>{preview.contradictionCountLabel}</span>
          </div>
        </div>
        <aside className="public-preview-aside" aria-label="Public DTO boundary">
          <strong>Minimized DTO only</strong>
          <span>{preview.boundaryNote}</span>
          <span>{preview.headline.expiryLabel}</span>
          <span>{payloadSafe ? 'Forbidden private keys: 0' : 'Forbidden private keys detected'}</span>
        </aside>
      </section>

      <section className="panel public-preview-card" aria-labelledby="public-preview-share-heading">
        <p className="kicker">Public share surface</p>
        <h3 id="public-preview-share-heading">{preview.dto.shareCard.title}</h3>
        <p>{preview.dto.shareCard.summary}</p>
        <div className="public-preview-signature">{preview.dto.shareCard.signature}</div>
        <div className="public-preview-metrics" aria-label="Public preview metrics">
          {preview.dto.shareCard.metrics.map((metric) => (
            <span key={metric}>{metric}</span>
          ))}
        </div>
      </section>

      <section className="panel report-section" aria-labelledby="public-preview-traits-heading">
        <p className="kicker">Minimized evidence shape</p>
        <h3 id="public-preview-traits-heading">Dominant traits</h3>
        <p className="muted">{preview.traitLine}</p>
        <div className="report-grid report-grid-three">
          {preview.dto.dominantTags.map((trait) => (
            <article className="trait-card" key={trait.code}>
              <div className="trait-code">{trait.code}</div>
              <h4>{trait.label}</h4>
            </article>
          ))}
        </div>
      </section>

      <section className="panel report-section" aria-labelledby="public-preview-axis-heading">
        <p className="kicker">Public axis summary</p>
        <h3 id="public-preview-axis-heading">Axis cards</h3>
        <div className="report-grid report-grid-two">
          {preview.dto.axisSummaries.map((axis) => (
            <article className="axis-report-card" key={axis.id}>
              <div className="card-title-row">
                <h4>{axis.label}</h4>
                <span className="band-pill">{axis.band}</span>
              </div>
              <p className="small strong-muted">{axis.dominantLabel}</p>
              <p className="muted">{axis.interpretation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel report-section" aria-labelledby="public-preview-privacy-heading">
        <p className="kicker">Privacy boundary</p>
        <h3 id="public-preview-privacy-heading">Local-only public-link simulation</h3>
        <ul className="boundary-list">
          {preview.privacyBullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="small">{LOCAL_PUBLIC_LINK_PREVIEW_BOUNDARY_NOTE}</p>
        <div className="button-row">
          <Link className="button" href="/results">Back to full local result</Link>
          <Link className="button secondary" href="/quiz">Retake the corridors</Link>
        </div>
      </section>
    </main>
  );
}
